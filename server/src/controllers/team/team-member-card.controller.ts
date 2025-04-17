import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { 
  User, 
  TeamMemberCard, 
  Team, 
  TeamGoal,
  IUserDocument
} from '../../models';
import { AuthRequest } from '../../middleware/auth.middleware';
import { memberCardService } from '../../services/member-card.service';

/**
 * メンバーカルテ情報を取得するコントローラー
 * GET /api/v1/teams/:teamId/members/:userId/card
 */
export const getMemberCard = async (req: AuthRequest, res: Response) => {
  try {
    const { teamId, userId } = req.params;
    
    console.log(`チームメンバーカード取得リクエスト: teamId=${teamId}, userId=${userId}`);
    
    // チームとユーザーの存在確認
    const team = await Team.findById(teamId);
    console.log(`チーム検索結果(${teamId}):`, team ? '見つかりました' : '見つかりませんでした');
    if (!team) {
      return res.status(404).json({ message: 'チームが見つかりません' });
    }
    
    // ObjectIDでユーザーを検索
    console.log(`ユーザー検索開始: ID=${userId}`);
    let user = await User.findById(userId) as IUserDocument | null;
    
    if (user) {
      console.log(`ユーザー検索結果(${userId}):`, '見つかりました');
    } else {
      console.log(`ユーザー検索結果(${userId}):`, '見つかりませんでした');
    }
    
    if (!user) {
      return res.status(404).json({ message: 'ユーザーが見つかりません' });
    }
    
    // チームの目標を取得
    const teamGoal = await TeamGoal.findOne({ teamId });
    
    // 既存のカルテを検索
    let memberCard = await TeamMemberCard.findOne({ teamId, userId });
    
    // ユーザー情報（四柱推命データを含む）を準備
    // MongoDB ObjectIDをすべて文字列に変換
    const userInfo = {
      userId: user._id ? user._id.toString() : userId,
      displayName: user.displayName || '名前なし',
      role: user.jobTitle || '未設定',
      mainElement: user.elementAttribute || 'water',
      avatarInitial: user.displayName ? user.displayName.charAt(0) : 'U',
      elementProfile: user.elementProfile || { wood: 0, fire: 0, earth: 0, metal: 0, water: 1 },
      dayMaster: user.dayMaster || '甲',
      fourPillars: user.fourPillars ? {
        day: {
          heavenlyStem: user.fourPillars.day.heavenlyStem,
          earthlyBranch: user.fourPillars.day.earthlyBranch
        }
      } : { day: { heavenlyStem: '甲', earthlyBranch: '子' } }
    };
    
    // カルテが存在しない場合、または更新が必要な場合
    if (!memberCard) {
      // 生成中のステータスを返す
      console.log(`カルテが存在しないため生成開始: teamId=${teamId}, userId=${userId}`);
      
      // バックグラウンドでカルテ生成を開始
      generateMemberCard(teamId, userId, user, teamGoal).catch(err => 
        console.error('バックグラウンドでのカルテ生成エラー:', err)
      );
      
      // 生成中のステータスを返す
      return res.status(202).json({
        userInfo,
        isGenerating: true,
        message: 'カルテを生成中です。しばらくお待ちください。',
        teamGoal: teamGoal ? {
          content: teamGoal.content,
          deadline: teamGoal.deadline
        } : null,
        lastUpdated: new Date()
      });
    }
    
    // 既存のカルテがある場合は通常通り返す
    return res.status(200).json({
      userInfo,
      cardContent: memberCard.cardContent,
      isGenerating: false,
      teamGoal: teamGoal ? {
        content: teamGoal.content,
        deadline: teamGoal.deadline
      } : null,
      lastUpdated: memberCard.lastUpdated
    });
    
  } catch (error) {
    console.error('メンバーカルテ取得中にエラーが発生しました:', error);
    return res.status(500).json({ message: 'サーバーエラーが発生しました' });
  }
};

/**
 * メンバーカルテを生成する関数
 */
const generateMemberCard = async (teamId: string, userId: string, user: IUserDocument, teamGoal: any) => {
  try {
    // 既存のカードがある場合は再利用（重複エラー回避）
    const existingCard = await TeamMemberCard.findOne({ teamId, userId });
    if (existingCard) {
      console.log(`既存のカルテが見つかりました: teamId=${teamId}, userId=${userId}`);
      return existingCard;
    }
    
    // チーム情報を取得
    const team = await Team.findById(teamId);
    if (!team) {
      throw new Error(`チームが見つかりません: teamId=${teamId}`);
    }
    
    // チーム情報を構築
    const teamInfo = {
      name: team.name,
      size: await User.countDocuments({ teamId: team._id })
    };

    // メンバーカルテを生成
    let aiResponse;
    
    try {
      // 新しいメンバーカルテサービスを使用
      aiResponse = await memberCardService.generateMemberCard(user, teamInfo);
      console.log('メンバーカルテ生成成功');
    } catch (error) {
      console.error('メンバーカルト生成エラー:', error);
      // エラーが発生した場合はフォールバックとしてダミーレスポンスを使用
      aiResponse = generateDummyAIResponse(user.displayName, user.elementAttribute || 'water', teamGoal);
    }
    
    try {
      // カルテをデータベースに保存（findOneAndUpdateを使用して競合回避）
      const newMemberCard = await TeamMemberCard.findOneAndUpdate(
        { teamId, userId },
        {
          cardContent: aiResponse,
          version: 1,
          lastUpdated: new Date()
        },
        { upsert: true, new: true, runValidators: true }
      );
      
      return newMemberCard;
    } catch (dbError) {
      // データベースエラーが発生した場合、情報を記録し既存のカルテを再確認
      console.error('カルテ保存中にエラーが発生:', dbError);
      
      // 再度確認（競合発生時にも対応）
      const existingCardAfterError = await TeamMemberCard.findOne({ teamId, userId });
      if (existingCardAfterError) {
        console.log('エラー後に既存カルテを取得しました');
        return existingCardAfterError;
      }
      
      // それでも見つからない場合はエラーを投げる
      throw dbError;
    }
  } catch (error) {
    console.error('メンバーカルテ生成中にエラーが発生しました:', error);
    throw error;
  }
};

/**
 * テスト用のダミーAIレスポンスを生成
 * 注意: 実際の実装ではこれはClaudeAI APIに置き換えられます
 */
const generateDummyAIResponse = (name: string, element: string = 'water', teamGoal: any) => {
  const elements: {[key: string]: {desc: string, strengths: string[], roles: string[], areas: string[], effective: string[], avoid: string[]}} = {
    water: {
      desc: "水の気質は流動的で柔軟な思考を持ち、深い洞察力と直感を備えています。",
      strengths: [
        "創造的な問題解決能力",
        "直感的な洞察力",
        "柔軟な思考と適応力",
        "複雑な状況の理解と整理"
      ],
      roles: [
        "顧客体験の設計と最適化",
        "ユーザーフィードバックの収集と分析",
        "チーム内の創造的プロセスのファシリテーション",
        "ブレインストーミングや問題解決セッションのリード"
      ],
      areas: [
        "詳細な実装計画への注意（「土」の要素を強化）",
        "締切管理の徹底（「金」の要素を強化）",
        "アイデアの選別と優先順位付け",
        "定期的な進捗報告の習慣化"
      ],
      effective: [
        "視覚的な資料や例を用いた説明",
        "オープンエンドな質問と発想の余地",
        "大局的なビジョンの共有",
        "柔軟性のある進め方"
      ],
      avoid: [
        "過度に構造化された指示",
        "細かいマイクロマネジメント",
        "創造性を制限する厳格なルール",
        "短すぎる締切の連続"
      ]
    },
    fire: {
      desc: "火の気質は情熱的で活動的な特性を持ち、エネルギーと熱意に満ちています。",
      strengths: [
        "リーダーシップと影響力",
        "情熱とエネルギーの創出",
        "変化を推進する力",
        "説得力のある伝達能力"
      ],
      roles: [
        "プロジェクト全体の推進力",
        "チームのモチベーション向上",
        "ビジョンを実現するための行動計画の策定",
        "営業活動や外部とのコミュニケーション"
      ],
      areas: [
        "感情的な判断の抑制（「金」の要素を強化）",
        "持続性と安定性の維持（「土」の要素を強化）",
        "詳細な分析と検証",
        "リスク管理の強化"
      ],
      effective: [
        "大局的なビジョンの提示",
        "自律性と意思決定の裁量",
        "直接的かつ明確なフィードバック",
        "迅速な意思決定と行動"
      ],
      avoid: [
        "過度に詳細な制約や手順",
        "長すぎる会議や議論",
        "エネルギーを抑制する環境",
        "消極的な姿勢や過度の慎重さ"
      ]
    },
    earth: {
      desc: "土の気質は安定的で保守的な特性を持ち、信頼性と粘り強さが特徴です。",
      strengths: [
        "安定性と信頼性",
        "現実的な問題解決能力",
        "粘り強さと忍耐力",
        "チームをまとめる調和力"
      ],
      roles: [
        "プロジェクト管理と進行管理",
        "リスク分析と対策立案",
        "チーム内の調整役",
        "重要な業務プロセスの維持"
      ],
      areas: [
        "革新性と柔軟性の向上（「水」の要素を強化）",
        "新しいアイデアへの適応（「木」の要素を強化）",
        "変化への抵抗感の軽減",
        "意思決定のスピードアップ"
      ],
      effective: [
        "明確な構造と期待値の設定",
        "段階的なプロセスと手順",
        "具体的な例と実践的な応用",
        "安定した環境と予測可能性"
      ],
      avoid: [
        "急激な変更や予測不能な状況",
        "抽象的な概念や理論のみの説明",
        "明確な方向性のない指示",
        "過度の時間的プレッシャー"
      ]
    },
    metal: {
      desc: "金の気質は分析的で論理的な特性を持ち、精度と効率性を重視します。",
      strengths: [
        "論理的思考と分析力",
        "精密さと正確性への注力",
        "構造化された問題解決能力",
        "高い品質基準の維持"
      ],
      roles: [
        "データ分析と意思決定支援",
        "品質管理とプロセス最適化",
        "詳細な計画立案と実行",
        "規則やガイドラインの策定"
      ],
      areas: [
        "感情や人間関係の配慮（「水」の要素を強化）",
        "柔軟性と適応力の向上（「木」の要素を強化）",
        "完璧主義の緩和",
        "直感的判断の活用"
      ],
      effective: [
        "事実と論理に基づいた説明",
        "明確な構造と期待値",
        "詳細な分析と根拠の提示",
        "効率性と結果の重視"
      ],
      avoid: [
        "あいまいさや不確実性",
        "過度に感情的なアプローチ",
        "論理的一貫性のない議論",
        "非効率的なプロセスや手順"
      ]
    },
    wood: {
      desc: "木の気質は成長的で発展的な特性を持ち、先進性と拡大志向が特徴です。",
      strengths: [
        "成長と拡大への強い志向性",
        "新しいアイデアの創出能力",
        "計画立案と戦略的思考",
        "将来を見据えたビジョン"
      ],
      roles: [
        "新規プロジェクトの立ち上げ",
        "チームの成長戦略の策定",
        "イノベーションの推進",
        "新たな機会の探索と開発"
      ],
      areas: [
        "現実的な実行可能性の評価（「土」の要素を強化）",
        "細部への注意（「金」の要素を強化）",
        "過度な拡大志向の抑制",
        "既存リソースの効率的活用"
      ],
      effective: [
        "成長と発展の機会の提供",
        "自由度の高い環境",
        "新しいチャレンジとプロジェクト",
        "先進的なアイデアの尊重"
      ],
      avoid: [
        "過度の制約や制限",
        "短期的な視点のみの評価",
        "成長や変化の機会の欠如",
        "過去の方法への固執"
      ]
    }
  };
  
  const elementData = elements[element] || elements.water;
  const goalContent = teamGoal ? teamGoal.content : '未設定のチーム目標';
  
  return `# ${name}の特性分析

## 基本プロファイル

五行属性: ${element}（${element === 'water' ? '壬子' : element === 'fire' ? '丙午' : element === 'earth' ? '戊辰' : element === 'metal' ? '庚申' : '甲寅'}）

${elementData.desc}

## 特性と才能

${elementData.strengths.map(s => `- ${s}`).join('\n')}

## チーム貢献分析

${name}さんの${element}の気質は、「${goalContent}」の達成に重要な貢献ができます。特に${elementData.desc.split('。')[0]}という特性は、目標達成における重要な要素となります。

### 最適な役割

${elementData.roles.map(r => `- ${r}`).join('\n')}

### 強化すべき領域

${elementData.areas.map(a => `- ${a}`).join('\n')}

## コミュニケーションガイド

### 効果的なアプローチ

${elementData.effective.map(e => `- ${e}`).join('\n')}

### 避けるべきアプローチ

${elementData.avoid.map(a => `- ${a}`).join('\n')}`;
};