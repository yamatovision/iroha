import mongoose from 'mongoose';
import { DailyFortune } from '../models/DailyFortune';
import { DayPillar } from '../models/DayPillar';
import { User } from '../models/User';
import { Team } from '../models/Team';
import { TeamGoal } from '../models/TeamGoal';
import { FortuneScoreResult } from '../types';

/**
 * 運勢サービス
 * ユーザーの四柱推命プロファイルと日柱に基づいた運勢情報を生成・取得する
 */
export class FortuneService {
  /**
   * 運勢ダッシュボード情報を取得する（個人運勢に統合）
   * @param userId ユーザーID
   * @param teamId チームID（指定がない場合はユーザーのデフォルトチーム）
   * @returns 運勢ダッシュボード情報
   */
  public async getFortuneDashboard(userId: string, teamId?: string): Promise<any> {
    try {
      console.log(`🔍 ダッシュボード取得開始 - userId: ${userId}, teamId: ${teamId || 'なし'}`);
      
      // 個人運勢を取得
      console.log(`🔍 getUserFortune 開始 - userId: ${userId}`);
      const personalFortune = await this.getUserFortune(userId);
      console.log(`🔍 getUserFortune 完了 - 結果:`, JSON.stringify({
        id: personalFortune?.id,
        userId: personalFortune?.userId,
        date: personalFortune?.date,
        fortuneScore: personalFortune?.fortuneScore,
        adviceLength: personalFortune?.advice ? personalFortune.advice.length : 0
      }, null, 2));
      
      // ユーザー情報を取得
      console.log(`🔍 User.findById 開始 - userId: ${userId}`);
      const user = await User.findById(userId);
      console.log(`🔍 User.findById 完了 - ユーザー見つかりました: ${!!user}`);
      
      if (!user) {
        throw new Error('ユーザーが見つかりません');
      }
      
      // ダッシュボードの基本レスポンス
      const response: any = {
        personalFortune
      };
      
      console.log(`🔍 ダッシュボードレスポンス作成 - personalFortune 含まれています: ${!!response.personalFortune}`);
      
      
      // チームIDが指定されていない場合は、ユーザーのデフォルトチームを使用
      let targetTeamId = teamId;
      if (!targetTeamId && user.teamId) {
        targetTeamId = user.teamId.toString();
      }
      
      // チームIDがあればチーム目標とランキングを取得
      if (targetTeamId) {
        try {
          // チーム目標を取得
          const teamGoal = await TeamGoal.findOne({ teamId: targetTeamId }).lean();
          if (teamGoal) {
            response.teamGoal = {
              id: teamGoal._id,
              content: teamGoal.content,
              deadline: teamGoal.deadline,
              progress: teamGoal.progress || 0
            };
          }
          
          // チーム運勢ランキングを取得
          const teamRanking = await this.getTeamFortuneRanking(targetTeamId);
          
          if (teamRanking && teamRanking.success) {
            response.teamRanking = teamRanking.data;
            
            // ユーザーの順位を計算
            if (response.teamRanking && response.teamRanking.ranking) {
              const userRank = response.teamRanking.ranking.findIndex((item: { userId: string | mongoose.Types.ObjectId }) => {
                const itemUserId = typeof item.userId === 'string' ? item.userId : item.userId.toString();
                return itemUserId === userId;
              });
              if (userRank >= 0) {
                response.teamRanking.userRank = userRank + 1;  // 0ベースインデックスを1ベースの順位に変換
              }
            }
          } else if (teamRanking) {
            console.error(`チーム運勢ランキングの取得に失敗しました: ${teamRanking.error}`);
            // ランキング取得エラーは全体のレスポンスに影響しないよう処理を続行
          }
        } catch (err) {
          console.error(`チーム情報の取得に失敗しました: ${err}`);
          // チーム情報の取得に失敗しても、全体の処理は続行
        }
      }
      
      // 管理者の場合は所属チームリストを取得
      if (user.role === 'Admin' || user.role === 'SuperAdmin') {
        const teams = await Team.find({ adminId: userId }).select('_id name').lean();
        if (teams && teams.length > 0) {
          response.teamsList = teams.map(team => ({
            id: team._id,
            name: team.name
          }));
        }
      }
      
      return response;
    } catch (error) {
      console.error(`運勢ダッシュボードの取得に失敗しました: ${error}`);
      throw error;
    }
  }
  
  
  /**
   * Claude APIを使用してチームコンテキスト運勢アドバイスを生成する
   * @param user ユーザー情報
   * @param team チーム情報
   * @param teamGoal チーム目標情報
   * @param dayPillar 日柱情報
   * @param fortuneScore 運勢スコア
   * @returns チームコンテキストアドバイスと協力のヒント
   */
  private async generateTeamContextAdvice(
    user: any,
    team: any,
    teamGoal: any,
    dayPillar: any,
    fortuneScore: number
  ): Promise<{ teamContextAdvice: string; collaborationTips: string[] }> {
    try {
      // 環境変数からAPIキーを取得
      const apiKey = process.env.ANTHROPIC_API_KEY;
      if (!apiKey) {
        throw new Error('Anthropic API Key is not configured');
      }
      
      // @anthropic-ai/sdk の動的インポート
      const { Anthropic } = await import('@anthropic-ai/sdk');
      
      const anthropic = new Anthropic({
        apiKey: apiKey
      });
      
      // 四柱推命情報からプロンプトを作成
      const userElement = user.elementAttribute || 'water';
      const dayElement = this.getStemElement(dayPillar.heavenlyStem);
      const stemElement = this.getStemElement(dayPillar.heavenlyStem);
      
      // 運勢の種類を決定
      let fortuneType = 'neutral';
      if (fortuneScore >= 80) {
        fortuneType = 'excellent';
      } else if (fortuneScore >= 60) {
        fortuneType = 'good';
      } else if (fortuneScore <= 20) {
        fortuneType = 'bad';
      } else if (fortuneScore <= 40) {
        fortuneType = 'poor';
      }
      
      // プロンプトの構築
      const prompt = `
あなたは四柱推命に基づいてチーム運勢アドバイスを作成する専門家です。
以下の情報に基づいて、チームコンテキストに特化した運勢アドバイスを作成してください。

## ユーザー情報
- ユーザー名: ${user.displayName}
- 役職/役割: ${user.teamRole || user.jobTitle || "一般社員"}
- 五行属性: ${user.elementAttribute || "不明"}

## チーム情報
- チーム名: ${team.name}
- チーム目標: ${teamGoal?.content || "目標未設定"}
- 目標期限: ${teamGoal?.deadline ? new Date(teamGoal.deadline).toLocaleDateString() : "期限未設定"}
- チーム進捗率: ${teamGoal?.progressRate || 0}%

## 日柱情報
- 天干: ${dayPillar.heavenlyStem}
- 地支: ${dayPillar.earthlyBranch}
- 運勢スコア: ${fortuneScore}/100

## 出力形式
- チームにおける今日の運勢: 150-200文字の具体的なアドバイス
- チーム協力のためのヒント: 3つの短いポイント（各30-50文字程度）

特に以下の点を必ず含めてください：
1. チーム目標を具体的に参照したアドバイス
2. ユーザーの役割に応じた視点からのアドバイス
3. 日柱の五行特性とチーム全体の相性を考慮したアドバイス

出力形式はJSON形式にしてください。
{
  "teamContextAdvice": "チームにおける今日の運勢の詳細文",
  "collaborationTips": ["ヒント1", "ヒント2", "ヒント3"]
}
      `;
      
      // Claude 3.7 Sonnetモデルを使用
      const message = await anthropic.messages.create({
        model: "claude-3-7-sonnet-20250219",
        max_tokens: 4000,
        messages: [
          {
            role: "user",
            content: prompt
          }
        ]
      });
      
      // レスポンスから必要なデータを抽出
      try {
        const contentBlock = message.content[0];
        if (contentBlock && typeof contentBlock === 'object' && 'text' in contentBlock) {
          const responseText = contentBlock.text;
          
          // JSONをパース
          const jsonMatch = responseText.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsedResponse = JSON.parse(jsonMatch[0]);
            
            // バリデーション
            if (typeof parsedResponse.teamContextAdvice === 'string' && 
                Array.isArray(parsedResponse.collaborationTips) && 
                parsedResponse.collaborationTips.length > 0) {
              return {
                teamContextAdvice: parsedResponse.teamContextAdvice,
                collaborationTips: parsedResponse.collaborationTips
              };
            }
          }
        }
      } catch (parseError) {
        console.error('Claude APIレスポンスの解析に失敗:', parseError);
      }
      
      // パース失敗時のフォールバック
      return this.generateTemplateBasedTeamContextAdvice(user, team, teamGoal, dayPillar, typeof fortuneScore === 'number' ? fortuneScore : (fortuneScore as { score: number }).score);
      
    } catch (error) {
      console.error('Claude API呼び出しエラー:', error);
      throw error;
    }
  }
  
  /**
   * テンプレートベースのチームコンテキスト運勢アドバイスを生成する
   * @param user ユーザー情報
   * @param team チーム情報
   * @param teamGoal チーム目標情報
   * @param dayPillar 日柱情報
   * @param fortuneScore 運勢スコア
   * @returns チームコンテキストアドバイスと協力のヒント
   */
  private generateTemplateBasedTeamContextAdvice(
    user: any,
    team: any,
    teamGoal: any,
    dayPillar: any,
    fortuneScore: number
  ): { teamContextAdvice: string; collaborationTips: string[] } {
    const userElement = user.elementAttribute || 'water';
    const stemElement = this.getStemElement(dayPillar.heavenlyStem);
    const dayBranch = dayPillar.earthlyBranch;
    const userRole = user.teamRole || user.jobTitle || '一般社員';
    const teamName = team.name;
    const teamGoalContent = teamGoal?.content || '目標未設定';
    
    // 運勢の種類を決定
    let fortuneType = 'neutral';
    if (fortuneScore >= 80) {
      fortuneType = 'excellent';
    } else if (fortuneScore >= 60) {
      fortuneType = 'good';
    } else if (fortuneScore <= 20) {
      fortuneType = 'bad';
    } else if (fortuneScore <= 40) {
      fortuneType = 'poor';
    }

    // 各属性と運勢タイプに応じたチームコンテキストアドバイスを生成
    let teamContextAdvice = '';
    
    // 役割に応じた前文
    const roleIntro = this.getRoleIntroduction(userRole);
    
    // 運勢タイプと属性に基づくアドバイス本文
    const adviceContent = this.getTeamContextAdviceContent(fortuneType, userElement, stemElement);
    
    // チーム目標に基づく具体的アドバイス
    const goalAdvice = this.analyzeTeamGoalContent(teamGoalContent, fortuneType);
    
    // チームコンテキストアドバイスの組み立て
    teamContextAdvice = `${roleIntro}${teamName}チームにおいて、${adviceContent}${goalAdvice}`;
    
    // 協力のヒントを生成
    const collaborationTips = this.generateCollaborationTips(
      userElement,
      teamGoalContent,
      dayPillar.heavenlyStem,
      dayPillar.earthlyBranch
    );
    
    return {
      teamContextAdvice,
      collaborationTips
    };
  }
  
  /**
   * ユーザーの役割に基づく導入文を取得
   */
  private getRoleIntroduction(role: string): string {
    const roleMap: { [key: string]: string } = {
      'リーダー': 'チームを導く立場として、',
      'マネージャー': 'チームを管理する役割として、',
      'プロジェクトマネージャー': 'プロジェクトを統括する立場として、',
      'エンジニア': '技術的な専門知識を活かして、',
      'デザイナー': 'クリエイティブな視点から、',
      'マーケター': 'マーケティングの観点から、',
      '営業': '対外的な折衝役として、',
      'アナリスト': 'データを分析する役割から、',
      '一般社員': 'チームの一員として、'
    };
    
    // 役割名に部分一致するキーがあれば対応する導入文を返す
    for (const key in roleMap) {
      if (role.includes(key)) {
        return roleMap[key];
      }
    }
    
    // デフォルトの導入文
    return 'チームメンバーとして、';
  }
  
  /**
   * 運勢タイプと属性に基づくチームコンテキストアドバイスの本文を取得
   */
  private getTeamContextAdviceContent(fortuneType: string, userElement: string, dayElement: string): string {
    const adviceMap: { [key: string]: { [key: string]: string } } = {
      'excellent': {
        'wood': '今日はチーム内でのアイデア創出と新たな取り組みに最適な日です。あなたの創造力は特に高まっており、チームに新しい視点をもたらすでしょう。',
        'fire': '今日はチーム内でのモチベーション向上と情熱的な推進力が際立つ日です。あなたのエネルギーがチーム全体を活性化させるでしょう。',
        'earth': '今日はチーム内での安定と基盤作りに最適な日です。あなたの堅実さと支援力がチームの成功を支えるでしょう。',
        'metal': '今日はチーム内での効率と精度が高まる日です。あなたの分析力と判断力がチームの意思決定を助けるでしょう。',
        'water': '今日はチーム内での柔軟な対応と深い洞察が得意な日です。あなたの適応力と直感がチームの課題解決に貢献するでしょう。'
      },
      'good': {
        'wood': 'チーム内での成長と発展に良い影響を与える日です。新しいアイデアを積極的に共有し、建設的な議論を促進しましょう。',
        'fire': 'チーム内での活力と前向きなエネルギーが高まる日です。あなたの熱意でチームメンバーを鼓舞し、目標に向かって進みましょう。',
        'earth': 'チーム内での安定と調和をもたらす良い日です。メンバー間の協力体制を強化し、確実に成果を積み上げていきましょう。',
        'metal': 'チーム内での効率と質の向上に適した日です。細部に注意を払い、プロセスの改善点を見つけることで貢献できるでしょう。',
        'water': 'チーム内での情報共有と柔軟な対応が得意な日です。多様な意見を取り入れ、最適な解決策を見出すことができるでしょう。'
      },
      'neutral': {
        'wood': 'チーム内での平均的な活動が期待できる日です。地道な成長と小さな改善に焦点を当て、着実に前進しましょう。',
        'fire': 'チーム内での通常のエネルギーレベルが保たれる日です。バランスのとれた関わり方で、持続可能な進捗を心がけましょう。',
        'earth': 'チーム内での安定した役割を果たせる日です。日常的なタスクを確実にこなし、チームの基盤を支えましょう。',
        'metal': 'チーム内での標準的な効率と質が維持される日です。既存のプロセスを見直し、微調整する良い機会です。',
        'water': 'チーム内での通常の流れに適応する日です。状況を注意深く観察し、必要に応じて柔軟に対応しましょう。'
      },
      'poor': {
        'wood': 'チーム内での成長に若干の停滞を感じる日かもしれません。小さな進展にも価値を見出し、無理をせず前進を続けましょう。',
        'fire': 'チーム内でのエネルギーがやや低下する日です。重要なタスクに集中し、余力を温存しながら取り組みましょう。',
        'earth': 'チーム内での安定感にやや欠ける日かもしれません。基本に立ち返り、チームの土台を固める作業に注力しましょう。',
        'metal': 'チーム内での効率がやや落ちる日です。精度を維持するため、より注意深くタスクに取り組む必要があるでしょう。',
        'water': 'チーム内での流れにやや乱れを感じる日かもしれません。状況を冷静に分析し、適応するための時間を取りましょう。'
      },
      'bad': {
        'wood': 'チーム内での成長に障害を感じる困難な日かもしれません。今は種まきの時期と考え、将来の成功のための準備に焦点を当てましょう。',
        'fire': 'チーム内でのエネルギー低下が顕著な日です。無理な推進は避け、充電と再評価の時間を確保しましょう。',
        'earth': 'チーム内での基盤が不安定に感じられる日かもしれません。一時的な混乱に動じず、本質的な価値を守ることに集中しましょう。',
        'metal': 'チーム内での判断力と集中力が低下する日です。重要な決定は延期し、情報収集と準備に時間を使いましょう。',
        'water': 'チーム内での流れが滞りやすい日です。柔軟性を保ちつつも、基本的な原則に立ち返ることで安定を取り戻せるでしょう。'
      }
    };
    
    // 属性の相性を考慮した追加アドバイス
    const compatibilityAdvice = this.getElementCompatibilityAdvice(userElement, dayElement);
    
    return `${adviceMap[fortuneType][userElement]} ${compatibilityAdvice}`;
  }
  
  /**
   * 属性の相性に基づくアドバイスを取得
   */
  private getElementCompatibilityAdvice(userElement: string, dayElement: string): string {
    if (userElement === dayElement) {
      return '今日はあなたの属性と日柱の属性が一致しており、自然な調和を感じられるでしょう。';
    }
    
    const producingRelations: [string, string][] = [
      ['water', 'wood'],  // 水は木を育てる
      ['wood', 'fire'],   // 木は火を燃やす
      ['fire', 'earth'],  // 火は土を作る
      ['earth', 'metal'], // 土は金を生み出す
      ['metal', 'water']  // 金は水を浄化する
    ];
    
    const restrictingRelations: [string, string][] = [
      ['wood', 'earth'],  // 木は土から養分を奪う
      ['earth', 'water'], // 土は水を堰き止める
      ['water', 'fire'],  // 水は火を消す
      ['fire', 'metal'],  // 火は金を溶かす
      ['metal', 'wood']   // 金は木を切る
    ];
    
    // 相生関係チェック
    for (const [gen, rec] of producingRelations) {
      if (userElement === gen && dayElement === rec) {
        return '今日はあなたの属性が日柱の属性を生み出す関係にあり、積極的な貢献とサポートが特に効果的です。';
      }
      if (dayElement === gen && userElement === rec) {
        return '今日は日柱の属性があなたの属性を支える関係にあり、外部からの助けやリソースを受け取りやすい時期です。';
      }
    }
    
    // 相克関係チェック
    for (const [res, sub] of restrictingRelations) {
      if (userElement === res && dayElement === sub) {
        return '今日はあなたの属性が日柱の属性を抑制する関係にあり、方向性の修正や調整においてリーダーシップを発揮できるでしょう。';
      }
      if (dayElement === res && userElement === sub) {
        return '今日は日柱の属性があなたの属性を抑制する関係にあり、障害や制約に対処する柔軟性が求められます。';
      }
    }
    
    return '今日はあなたの属性と日柱の属性が間接的な関係にあり、バランスの取れたアプローチが効果的でしょう。';
  }
  
  /**
   * チーム目標内容に基づくアドバイスを取得
   */
  private analyzeTeamGoalContent(teamGoalContent: string, fortuneType: string): string {
    if (teamGoalContent === '目標未設定') {
      return 'チーム目標を設定することで、より具体的な方向性を持って進むことができるでしょう。';
    }
    
    const goalTypeKeywords: { [key: string]: string[] } = {
      '開発': ['開発', 'プロジェクト', '実装', 'システム', 'アプリ', 'サービス', '構築'],
      'マーケティング': ['マーケティング', '広告', 'プロモーション', '集客', '認知度', '販売'],
      '品質': ['品質', '改善', 'バグ', '安定', 'テスト', '検証'],
      '効率': ['効率', '生産性', 'コスト', '時間', '最適化', '自動化'],
      '顧客': ['顧客', 'クライアント', 'ユーザー', '満足度', 'サポート', '対応'],
      '拡大': ['拡大', '成長', '拡張', 'スケール', '新規', '展開'],
      '学習': ['学習', '研修', 'スキル', '知識', '育成', '教育']
    };
    
    // 目標の種類を判断
    let goalType = '一般';
    for (const type in goalTypeKeywords) {
      if (goalTypeKeywords[type].some(keyword => teamGoalContent.includes(keyword))) {
        goalType = type;
        break;
      }
    }
    
    // 目標タイプと運勢タイプに基づくアドバイス
    const goalAdviceMap: { [key: string]: { [key: string]: string } } = {
      '開発': {
        'excellent': `「${teamGoalContent}」という目標に向けて、今日は特に創造的なアイデアやイノベーションを積極的に提案するチャンスです。チーム全体の開発プロセスを加速させることができるでしょう。`,
        'good': `「${teamGoalContent}」という目標に向けて、今日は堅実な進捗が期待できます。機能実装や技術的課題の解決に集中することで、着実に前進できるでしょう。`,
        'neutral': `「${teamGoalContent}」という目標に取り組む中で、今日は基本に立ち返り、計画と進捗の確認を行うとよいでしょう。小さな改善点を見つけることで貢献できます。`,
        'poor': `「${teamGoalContent}」という目標への道のりで、今日は予期せぬ技術的な課題に直面するかもしれません。焦らず冷静に対処し、必要に応じて計画を調整しましょう。`,
        'bad': `「${teamGoalContent}」という目標に対して、今日は大きな進展を期待するよりも、既存の成果を見直し、基盤を強化する日としましょう。無理な推進は避け、品質を守ることに集中してください。`
      },
      'マーケティング': {
        'excellent': `「${teamGoalContent}」という目標に向けて、今日は革新的なマーケティング戦略を考案するのに最適な日です。独創的なアプローチがブレークスルーをもたらすでしょう。`,
        'good': `「${teamGoalContent}」という目標に向けて、今日は効果的なコミュニケーション戦略の実施に適しています。メッセージングの最適化に取り組むと良い結果が得られるでしょう。`,
        'neutral': `「${teamGoalContent}」という目標を達成するために、今日は既存のマーケティング活動の効果を測定し、データに基づいた微調整を行うことを優先しましょう。`,
        'poor': `「${teamGoalContent}」という目標に関して、今日はマーケティング活動の反応がやや鈍い可能性があります。期待値を調整し、長期的な視点を持って取り組みましょう。`,
        'bad': `「${teamGoalContent}」という目標に対して、今日は新たなキャンペーン開始は避け、既存の施策の見直しと分析に時間を使うことをお勧めします。市場の変化に敏感に対応しましょう。`
      },
      '品質': {
        'excellent': `「${teamGoalContent}」という目標を達成するために、今日は品質向上のための徹底的なレビューと改善提案に最適な日です。細部への注意が大きな成果をもたらすでしょう。`,
        'good': `「${teamGoalContent}」という品質目標に向けて、今日は体系的なテストと検証活動が効果的です。一貫した品質基準の適用に焦点を当てましょう。`,
        'neutral': `「${teamGoalContent}」という目標に取り組む際、今日は通常の品質管理プロセスを着実に実行することが重要です。小さな改善の積み重ねが大きな差を生みます。`,
        'poor': `「${teamGoalContent}」という品質目標に関して、今日は予期せぬ問題が発生する可能性があります。防御的なアプローチで、基本的な品質を確保することに注力しましょう。`,
        'bad': `「${teamGoalContent}」という目標に対して、今日は新機能の追加よりも、既存機能の安定性確保を優先すべきです。リスク管理と問題の早期発見に努めましょう。`
      },
      '効率': {
        'excellent': `「${teamGoalContent}」という効率化目標に向けて、今日は革新的なプロセス改善を導入するのに最適な日です。大胆な最適化提案が受け入れられやすいでしょう。`,
        'good': `「${teamGoalContent}」という目標を達成するために、今日はワークフローの分析と改善に取り組むことで効果的な成果が得られるでしょう。`,
        'neutral': `「${teamGoalContent}」という効率化目標に対して、今日は既存のプロセスの小さな無駄を特定し、段階的な改善を行うことに集中しましょう。`,
        'poor': `「${teamGoalContent}」という目標に関して、今日は複雑な変更よりも、基本的な効率化作業に注力すべきです。シンプルさを保ちながら進めましょう。`,
        'bad': `「${teamGoalContent}」という効率化目標に対して、今日は大規模な変更は避け、最も重要なボトルネックの分析と理解に時間を使うことをお勧めします。`
      },
      '顧客': {
        'excellent': `「${teamGoalContent}」という顧客関連の目標に向けて、今日は顧客との深い関係構築や新たな価値提供のアイデア創出に最適な日です。顧客視点からの革新的提案を心がけましょう。`,
        'good': `「${teamGoalContent}」という目標を達成するために、今日は顧客フィードバックの収集と分析が特に効果的です。インサイトを活かした改善策を検討しましょう。`,
        'neutral': `「${teamGoalContent}」という顧客関連目標に対して、今日は通常の顧客対応プロセスを確実に実行し、一貫したサービス品質を維持することに集中しましょう。`,
        'poor': `「${teamGoalContent}」という目標に関して、今日は顧客からの予期せぬ反応や課題が生じる可能性があります。柔軟かつ丁寧な対応を心がけ、信頼関係を守りましょう。`,
        'bad': `「${teamGoalContent}」という顧客関連目標に対して、今日は新しい取り組みより、既存顧客との関係維持と基本的なサポート品質の確保に注力すべきです。`
      },
      '拡大': {
        'excellent': `「${teamGoalContent}」という拡大目標に向けて、今日は新たな機会の探索と戦略的なパートナーシップの構築に最適な日です。大胆かつ創造的な拡大戦略を検討しましょう。`,
        'good': `「${teamGoalContent}」という目標を達成するために、今日は計画的な拡大ステップの実行に適しています。堅実なアプローチで着実に領域を広げていきましょう。`,
        'neutral': `「${teamGoalContent}」という拡大目標に対して、今日は現状の拡大計画の評価と微調整に時間を使うことが有益です。持続可能な成長を意識しましょう。`,
        'poor': `「${teamGoalContent}」という目標に関して、今日は拡大のペースを落とし、既存の基盤強化に注力すべきかもしれません。質を犠牲にした拡大は避けましょう。`,
        'bad': `「${teamGoalContent}」という拡大目標に対して、今日は新規拡大よりも内部の安定化に集中することをお勧めします。一時的に守りの姿勢をとり、リスクを最小化しましょう。`
      },
      '学習': {
        'excellent': `「${teamGoalContent}」という学習目標に向けて、今日は新たな知識や技術の吸収に最適な日です。チーム全体での知識共有セッションを企画すると効果的でしょう。`,
        'good': `「${teamGoalContent}」という目標を達成するために、今日は体系的な学習活動と実践的な適用に取り組むことで良い成果が期待できます。`,
        'neutral': `「${teamGoalContent}」という学習目標に対して、今日は基本的なスキルの復習と強化に焦点を当てることが有益です。地道な学習の積み重ねを大切にしましょう。`,
        'poor': `「${teamGoalContent}」という目標に関して、今日は複雑な新技術の習得よりも、既に学んだ内容の定着と応用に時間を使うべきでしょう。`,
        'bad': `「${teamGoalContent}」という学習目標に対して、今日は新たな挑戦より、最も基本的で重要な知識の再確認と強化に集中することをお勧めします。`
      },
      '一般': {
        'excellent': `「${teamGoalContent}」という目標に向けて、今日は創造的なアプローチと積極的な行動が特に効果的です。チーム全体を鼓舞するリーダーシップを発揮できるでしょう。`,
        'good': `「${teamGoalContent}」という目標の達成に向けて、今日は堅実な進捗が期待できます。具体的なタスクの完了に集中することで、着実に前進できるでしょう。`,
        'neutral': `「${teamGoalContent}」という目標を意識しながら、今日は計画と進捗の確認を行い、必要な調整を加えることが有益です。基本に忠実に取り組みましょう。`,
        'poor': `「${teamGoalContent}」という目標への道のりで、今日は予期せぬ障害に遭遇するかもしれません。柔軟な対応と優先順位の見直しを心がけましょう。`,
        'bad': `「${teamGoalContent}」という目標に対して、今日は無理な進展を求めるよりも、これまでの成果を守り、基盤を固める日としましょう。状況が改善するまで忍耐強く取り組んでください。`
      }
    };
    
    return goalAdviceMap[goalType][fortuneType];
  }
  
  /**
   * チーム協力のヒントを生成する
   * @param userElement ユーザーの五行属性
   * @param teamGoalContent チーム目標内容
   * @param heavenlyStem 天干
   * @param earthlyBranch 地支
   * @returns チーム協力のヒント配列
   */
  private generateCollaborationTips(
    userElement: string,
    teamGoalContent: string,
    heavenlyStem: string,
    earthlyBranch: string
  ): string[] {
    const stemElement = this.getStemElement(heavenlyStem);
    const branchElement = this.getBranchElement(earthlyBranch);
    
    // 基本的なコラボレーションヒントのプール
    const basicTips: { [key: string]: string[] } = {
      'wood': [
        "チームの創造的なアイデアを積極的に取り入れ、新しい解決策を探りましょう。",
        "柔軟な思考で、異なる視点からの提案を尊重し統合しましょう。",
        "チーム内での成長機会を見つけ、お互いの強みを伸ばし合いましょう。",
        "障害を成長の機会と捉え、チームと共に乗り越える姿勢を持ちましょう。",
        "定期的な振り返りを通じて、プロセスの改善点を見つけて適用しましょう。"
      ],
      'fire': [
        "チームのモチベーションを高めるポジティブなコミュニケーションを心がけましょう。",
        "共通の目標に向けた情熱を共有し、チームの一体感を強化しましょう。",
        "困難な状況でも前向きなエネルギーを保ち、チームを鼓舞しましょう。",
        "定期的に成功を祝い、チームの達成感と満足度を高めましょう。",
        "活発な議論を促進し、多様な意見から最良の解決策を見出しましょう。"
      ],
      'earth': [
        "チーム内の安定した基盤を提供し、信頼関係を構築しましょう。",
        "明確な役割分担と期待値の設定で、確実な協力体制を整えましょう。",
        "計画的なアプローチで、チームの作業を予測可能で安心できるものにしましょう。",
        "メンバー全員が発言しやすい環境を作り、包括的な意思決定を促進しましょう。",
        "長期的な視点でチームの持続可能な成長を支援しましょう。"
      ],
      'metal': [
        "精度の高い情報共有と明確なコミュニケーションで効率を高めましょう。",
        "構造化されたアプローチで複雑な問題を分解し、チームで取り組みましょう。",
        "定期的な進捗確認と調整で、プロジェクトの質と一貫性を維持しましょう。",
        "客観的なフィードバックを提供し、チームの継続的改善を促進しましょう。",
        "責任の明確化と目標達成に向けた具体的なステップを設定しましょう。"
      ],
      'water': [
        "状況の変化に柔軟に対応し、チームの適応力を高めましょう。",
        "深い傾聴と理解で、メンバー間の効果的なコミュニケーションを促進しましょう。",
        "直感と洞察を共有し、問題の根本原因を特定する手助けをしましょう。",
        "チーム内の知識の流れを促進し、情報とスキルの共有を奨励しましょう。",
        "多様な視点を統合し、包括的な解決策を見出す環境を作りましょう。"
      ]
    };
    
    // 天干と地支の相性に基づく特化したヒント
    const specialTips: { [key: string]: { [key: string]: string } } = {
      'wood': {
        'fire': "火の属性を持つメンバーと協力して、アイデアを活力に変える取り組みを推進しましょう。",
        'water': "水の属性を持つメンバーからのサポートを受け入れ、持続的な成長を目指しましょう。"
      },
      'fire': {
        'wood': "木の属性を持つメンバーの創造的なエネルギーを活かし、チームの情熱を具体的な成果に結びつけましょう。",
        'earth': "土の属性を持つメンバーと協力して、熱意を安定した基盤の上に構築しましょう。"
      },
      'earth': {
        'fire': "火の属性を持つメンバーのエネルギーを受け止め、チームの安定した進歩を支えましょう。",
        'metal': "金の属性を持つメンバーと協力して、精度の高い実行計画を作成しましょう。"
      },
      'metal': {
        'earth': "土の属性を持つメンバーの安定感を活かし、精緻な分析と実行を組み合わせましょう。",
        'water': "水の属性を持つメンバーの柔軟性を取り入れ、効率と適応力のバランスを取りましょう。"
      },
      'water': {
        'metal': "金の属性を持つメンバーの明晰さと組み合わせて、洞察に基づく戦略的アプローチを取りましょう。",
        'wood': "木の属性を持つメンバーの成長を支援し、革新的なアイデアの実現をサポートしましょう。"
      }
    };
    
    // チーム目標に基づく特化したヒント
    let goalBasedTip = "";
    if (teamGoalContent && teamGoalContent !== '目標未設定') {
      if (teamGoalContent.includes('開発') || teamGoalContent.includes('プロジェクト') || teamGoalContent.includes('構築')) {
        goalBasedTip = `「${teamGoalContent}」の達成に向けて、各メンバーの技術的強みを活かした役割分担を検討してみましょう。`;
      } else if (teamGoalContent.includes('改善') || teamGoalContent.includes('品質') || teamGoalContent.includes('最適化')) {
        goalBasedTip = `「${teamGoalContent}」の達成に向けて、定期的な振り返りと改善点の共有セッションを設けましょう。`;
      } else if (teamGoalContent.includes('顧客') || teamGoalContent.includes('サービス') || teamGoalContent.includes('満足')) {
        goalBasedTip = `「${teamGoalContent}」の達成に向けて、顧客フィードバックの共有と分析をチーム全体で行いましょう。`;
      } else if (teamGoalContent.includes('売上') || teamGoalContent.includes('マーケティング') || teamGoalContent.includes('拡大')) {
        goalBasedTip = `「${teamGoalContent}」の達成に向けて、市場動向や競合情報を定期的に共有し、戦略の調整に活かしましょう。`;
      } else {
        goalBasedTip = `「${teamGoalContent}」の達成に向けて、進捗状況を可視化し、チーム全体で共有するプラクティスを取り入れましょう。`;
      }
    } else {
      goalBasedTip = "チームの目標を明確に定義し、全員で共有することで、協力の効果を高めましょう。";
    }
    
    // 特化したヒントがあれば追加
    const specificTip = specialTips[userElement]?.[stemElement] || specialTips[userElement]?.[branchElement];
    
    // 結果のヒント配列を作成
    const tips: string[] = [];
    
    // 目標ベースのヒントを追加
    tips.push(goalBasedTip);
    
    // 特化したヒントがあれば追加
    if (specificTip) {
      tips.push(specificTip);
    }
    
    // 残りを基本ヒントから選択して追加
    const userElementTips = [...basicTips[userElement]]; // 配列をコピー
    this.shuffleArray(userElementTips); // ランダムに並べ替え
    
    // 3つになるまで追加
    while (tips.length < 3 && userElementTips.length > 0) {
      tips.push(userElementTips.pop()!);
    }
    
    return tips;
  }
  
  /**
   * 配列をランダムに並べ替える（Fisher-Yates shuffle）
   */
  private shuffleArray(array: any[]): void {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }
  
  /**
   * 特定日の運勢情報を取得する
   * @param userId ユーザーID
   * @param date 日付（指定がない場合は今日）
   * @returns 運勢情報
   */
  public async getUserFortune(userId: string, date?: Date): Promise<any> {
    // 日付が指定されていない場合は今日の日付を使用
    const targetDate = date || new Date();
    targetDate.setHours(0, 0, 0, 0); // 時刻部分をリセット
    console.log(`🔎 getUserFortune - ユーザーID: ${userId}, 対象日: ${targetDate.toISOString()}`);

    // ユーザーIDがObjectIDかどうかを確認
    let userIdQuery: string | mongoose.Types.ObjectId = userId;
    if (mongoose.Types.ObjectId.isValid(userId)) {
      userIdQuery = new mongoose.Types.ObjectId(userId);
      console.log(`🔎 ユーザーIDは有効なObjectID: ${userIdQuery}`);
    } else {
      console.log(`🔎 ユーザーIDはObjectIDではありません: ${userIdQuery}`);
    }

    // 既存の運勢データを検索（日付に関係なく、ユーザーIDのみで最新のものを取得）
    console.log(`🔎 運勢データ検索クエリ:`, {
      userId: userIdQuery,
      queryType: 'findOne with sort by updatedAt desc'
    });
    
    const fortune = await DailyFortune.findOne({
      userId: userIdQuery
    }).sort({ updatedAt: -1 }).populate('dayPillarId');
    
    console.log(`🔎 検索結果: ${fortune ? '運勢データ見つかりました' : '運勢データ見つかりません'}`);
    if (fortune) {
      console.log(`🔎 運勢データ詳細: ID=${fortune._id}, 日付=${fortune.date}, 更新日=${fortune.updatedAt}`);
    }

    // 運勢データが見つかった場合はそれを返す
    if (fortune) {
      const dayPillar = fortune.dayPillarId as any;
      return {
        id: fortune._id,
        userId: fortune.userId,
        date: fortune.date,
        dayPillar: {
          heavenlyStem: dayPillar.heavenlyStem,
          earthlyBranch: dayPillar.earthlyBranch
        },
        score: fortune.fortuneScore,
        fortuneScore: fortune.fortuneScore, // テスト互換性のために追加
        advice: fortune.advice,
        luckyItems: fortune.luckyItems,
        teamId: fortune.teamId,
        teamGoalId: fortune.teamGoalId,
        createdAt: fortune.createdAt,
        updatedAt: fortune.updatedAt
      };
    }

    // 運勢データが見つからない場合は新しく生成する
    return this.generateFortune(userId, targetDate, true); // 常に強制上書きモードで生成
  }

  /**
   * 今日の運勢情報を取得する
   * @param userId ユーザーID
   * @returns 今日の運勢情報
   */
  public async getTodayFortune(userId: string): Promise<any> {
    return this.getUserFortune(userId);
  }

  /**
   * 運勢データを生成する
   * @param userId ユーザーID
   * @param date 日付
   * @param forceOverwrite 既存データを強制上書きするか（手動更新時はtrue）
   * @returns 生成された運勢情報
   */
  public async generateFortune(userId: string, date: Date, forceOverwrite: boolean = false): Promise<any> {
    console.log(`🔧 generateFortune 開始 - userId: ${userId}, date: ${date.toISOString()}, forceOverwrite: ${forceOverwrite}`);
    
    // ユーザー情報と四柱推命プロファイルを取得
    // ユーザーIDがObjectIDかどうかを確認して適切なクエリを実行
    let user;
    
    try {
      // 検索ID文字列の正規化（トリムして空白除去）
      const normalizedUserId = typeof userId === 'string' ? userId.trim() : userId;
      
      // まずMongoDBのObjectIDとして検索
      if (normalizedUserId && mongoose.Types.ObjectId.isValid(normalizedUserId)) {
        try {
          user = await User.findById(normalizedUserId);
          console.log(`ユーザーをObjectIDで検索: ${normalizedUserId}, 結果: ${user ? '見つかりました' : '見つかりません'}`);
        } catch (err) {
          console.warn(`ObjectIDによる検索で例外が発生: ${err}`);
        }
      }
      
      // 見つからなければメールアドレスまたは古いIDフィールドで検索
      if (!user) {
        const query = { 
          $or: [
            { email: normalizedUserId }
          ]
        };
        
        // 追加の検索として、文字列形式の_idとしても検索
        if (normalizedUserId && typeof normalizedUserId === 'string') {
          query.$or.push({ _id: normalizedUserId } as any);  // TypeScriptエラー回避のためanyにキャスト
        }
        
        user = await User.findOne(query);
        console.log(`ユーザーを複合条件で検索: ${normalizedUserId}, 結果: ${user ? '見つかりました' : '見つかりません'}`);
      }
      
      // それでも見つからなければエラー
      if (!user) {
        console.log(`ユーザーが見つかりません。検索ID: ${normalizedUserId}`);
        throw new Error(`ユーザーが見つかりません: ${normalizedUserId}`);
      }
    } catch (error) {
      console.error(`ユーザー検索中にエラーが発生: ${error instanceof Error ? error.message : String(error)}`);
      throw new Error(`ユーザー検索エラー: ${error instanceof Error ? error.message : String(error)}`);
    }

    // ユーザーの四柱推命データの存在をチェック
    // 注: 四柱推命データはUserモデルに直接保存されており、elementAttributeの存在で確認
    if (!user.elementAttribute) {
      throw new Error('ユーザーの四柱推命情報が見つかりません');
    }

    // 日付の日柱情報を取得
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0); // 時刻部分をリセット

    const dayPillar = await DayPillar.findOne({
      date: {
        $gte: targetDate,
        $lt: new Date(targetDate.getTime() + 24 * 60 * 60 * 1000) // 翌日
      }
    });

    if (!dayPillar) {
      throw new Error('日柱情報が見つかりません');
    }

    // 運勢スコアを計算（ユーザーの五行属性と日柱の相性から）- 拡張情報を含む
    const fortuneScoreResult = this.calculateFortuneScore(
      user.elementAttribute || 'water',
      dayPillar.heavenlyStem,
      dayPillar.earthlyBranch,
      user
    );

    // マークダウン形式のアドバイスを生成
    const advice = await this.generateFortuneAdvice(
      user,
      dayPillar,
      fortuneScoreResult
    );

    // ラッキーアイテムを生成 - 運勢計算の詳細情報を渡す
    const luckyItems = await this.generateLuckyItems(
      user.elementAttribute || 'water',
      dayPillar.heavenlyStem,
      dayPillar.earthlyBranch,
      userId.toString(),
      fortuneScoreResult
    );

    // 既存の運勢データがあるか確認（日付に関係なく、ユーザーIDのみで最新のものを取得）
    let existingFortune = null;
    
    // 常に上書き動作を行う
    if (forceOverwrite) {
      // 強制上書きの場合は既存データをすべて削除
      console.log(`🔧 強制上書きモード: ${userId} のすべての運勢データを削除します`);
      const deleteResult = await DailyFortune.deleteMany({
        userId: userId
      });
      console.log(`🔧 削除結果: ${deleteResult.deletedCount}件のデータを削除しました`);
    } else {
      // 通常の上書きでは最新のものを取得して更新
      console.log(`🔧 通常更新モード: ${userId} の最新運勢データを検索します`);
      existingFortune = await DailyFortune.findOne({
        userId: userId
      }).sort({ updatedAt: -1 });
      console.log(`🔧 既存データ検索結果: ${existingFortune ? '見つかりました' : '見つかりません'}`);
      if (existingFortune) {
        console.log(`🔧 既存データ詳細: ID=${existingFortune._id}, 日付=${existingFortune.date}`);
      }
    }
    
    let fortune;
    
    if (existingFortune) {
      // 既存データがある場合は更新
      console.log(`🔧 既存の運勢データを更新します: ID=${existingFortune._id}`);
      existingFortune.dayPillarId = dayPillar._id as mongoose.Types.ObjectId;
      existingFortune.fortuneScore = fortuneScoreResult.score;
      existingFortune.advice = advice;
      existingFortune.luckyItems = luckyItems;
      
      // チーム情報の更新
      if (user.teamId) {
        existingFortune.teamId = user.teamId;
        existingFortune.teamGoalId = await this.getLatestTeamGoalId(user.teamId);
      }
      
      await existingFortune.save();
      console.log(`🔧 運勢データ更新完了: ID=${existingFortune._id}, 日付=${existingFortune.date}`);
      
      fortune = existingFortune;
    } else {
      // 新規作成
      console.log(`🔧 新規運勢データを作成します: userId=${userId}, date=${targetDate.toISOString()}`);
      fortune = new DailyFortune({
        userId: userId,
        date: targetDate,
        dayPillarId: dayPillar._id,
        fortuneScore: fortuneScoreResult.score,
        advice: advice,
        luckyItems: luckyItems,
        teamId: user.teamId, // ユーザーのチームID
        teamGoalId: user.teamId ? await this.getLatestTeamGoalId(user.teamId) : undefined // 最新のチーム目標ID
      });

      await fortune.save();
      console.log(`🔧 新規運勢データ作成完了: ID=${fortune._id}, 日付=${fortune.date}`);
    }

    return {
      id: fortune._id,
      userId: fortune.userId,
      date: fortune.date,
      dayPillar: {
        heavenlyStem: dayPillar.heavenlyStem,
        earthlyBranch: dayPillar.earthlyBranch
      },
      score: fortune.fortuneScore,
      fortuneScore: fortune.fortuneScore, // テスト互換性のために追加
      advice: fortune.advice,
      luckyItems: fortune.luckyItems,
      teamId: fortune.teamId,
      teamGoalId: fortune.teamGoalId,
      createdAt: fortune.createdAt,
      updatedAt: fortune.updatedAt
    };
  }

  /**
   * 運勢スコアを計算する
   * @param userElement ユーザーの五行属性
   * @param heavenlyStem 天干
   * @param earthlyBranch 地支
   * @returns 運勢スコア（0-100）
   */
  // FortuneScoreResultはtypes/index.tsからインポート

  /**
   * 運勢スコアを計算
   * @returns 拡張されたスコア計算結果
   */
  private calculateFortuneScore(
    userElement: string,
    heavenlyStem: string,
    earthlyBranch: string,
    user?: any
  ): FortuneScoreResult {
    // 天干と地支の五行要素を取得
    const stemElement = this.getStemElement(heavenlyStem);
    const branchElement = this.getBranchElement(earthlyBranch);

    // ユーザーの五行属性と天干・地支の相性を計算
    const stemCompatibility = this.calculateElementCompatibility(userElement, stemElement);
    const branchCompatibility = this.calculateElementCompatibility(userElement, branchElement);

    // 天干と地支の相性を重み付けして最終スコアを計算（天干:地支 = 6:4）
    const weightedScore = stemCompatibility * 0.6 + branchCompatibility * 0.4;
    
    // 基本的な結果オブジェクト
    const result: FortuneScoreResult = {
      score: 0,
      advice: '', // 初期値を設定
      luckyItems: { // 初期値を設定
        color: '',
        item: '',
        drink: ''
      },
      stemElement,
      branchElement,
      useBalancedAlgorithm: true, // 常にバランスアルゴリズムを使用
      useEnhancedAlgorithm: false
    };
    
    // 五行バランス・用神ベースのアルゴリズムを常に使用（標準アルゴリズム）
    
    if (user) {
      try {
        // 五行バランス・用神ベースのアルゴリズムをインポート（遅延ロード）
        const balancedModule = require('./fortune.service.balanced');
        const { 
          calculateBalancedFortuneScore,
          analyzeElementBalance, 
          isGeneratingRelation, 
          isControllingRelation 
        } = balancedModule;
        
        // バランス状態を計算
        if (user.elementProfile) {
          result.balanceStatus = analyzeElementBalance(user.elementProfile);
        }
        
        // 用神との関係性を分析
        if (user.yojin && user.yojin.element) {
          // 用神との関係性を示す文字列
          if (user.yojin.element === stemElement) {
            result.yojinRelation = '用神';
          } else if (user.yojin.kijin && user.yojin.kijin.element === stemElement) {
            result.yojinRelation = '喜神';
          } else if (user.yojin.kijin2 && user.yojin.kijin2.element === stemElement) {
            result.yojinRelation = '忌神';
          } else if (user.yojin.kyujin && user.yojin.kyujin.element === stemElement) {
            result.yojinRelation = '仇神';
          } else {
            result.yojinRelation = '中性';
          }
          
          // 相生相剋関係
          result.dayIsGeneratingYojin = isGeneratingRelation(stemElement, user.yojin.element);
          result.dayIsControllingYojin = isControllingRelation(stemElement, user.yojin.element);
        }
        
        // 新アルゴリズムを使用して計算
        result.score = calculateBalancedFortuneScore(
          user, 
          heavenlyStem, 
          earthlyBranch,
          stemElement,
          branchElement,
          weightedScore
        );
        
        result.useBalancedAlgorithm = true;
        
        // 運勢タイプの設定
        result.fortuneType = this.getFortuneType(result.score);
        
        return result;
      } catch (error) {
        console.error('五行バランス・用神ベース運勢スコア計算エラー：', error);
        // エラー時は従来のアルゴリズムにフォールバック
      }
    }
    
    // バランスアルゴリズムでエラーが発生した場合のみ、シンプルな計算方法でフォールバック
    // 0-100の範囲にスケーリング
    const preliminaryScore = Math.round(weightedScore * 20 + 50);
    result.score = Math.min(Math.round(preliminaryScore * 2 / 3), 100);
    result.useBalancedAlgorithm = false; // フォールバック時はfalseに設定
    
    // 運勢タイプの設定
    result.fortuneType = this.getFortuneType(result.score);
    
    return result;
  }

  /**
   * 運勢スコアから運勢タイプを取得
   */
  private getFortuneType(score: number): string {
    if (score >= 80) {
      return 'excellent';
    } else if (score >= 60) {
      return 'good';
    } else if (score <= 20) {
      return 'bad';
    } else if (score <= 40) {
      return 'poor';
    } else {
      return 'neutral';
    }
  }
  
  /**
   * 最新のチーム目標IDを取得する
   * @param teamId チームID
   * @returns 最新のチーム目標ID、存在しない場合はundefined
   */
  private async getLatestTeamGoalId(teamId: mongoose.Types.ObjectId | string): Promise<mongoose.Types.ObjectId | undefined> {
    try {
      const teamGoal = await TeamGoal.findOne({ teamId: teamId })
        .sort({ createdAt: -1 })
        .select('_id')
        .lean();
      
      return teamGoal?._id as mongoose.Types.ObjectId | undefined;
    } catch (error) {
      console.error(`チーム目標の取得に失敗しました: ${error}`);
      return undefined;
    }
  }

  /**
   * マークダウン形式の運勢アドバイスを生成する
   * @param user ユーザー情報
   * @param dayPillar 日柱情報
   * @param fortuneScore 運勢スコア結果または数値
   * @param sajuProfile 四柱推命プロファイル（オプション）
   * @returns マークダウン形式のアドバイス
   */
  private async generateFortuneAdvice(
    user: any,
    dayPillar: any,
    fortuneScore: FortuneScoreResult | number
  ): Promise<string> {
    // スコア値を抽出（FortuneScoreResultオブジェクトの場合はscoreプロパティを使用）
    const fortuneScoreValue = typeof fortuneScore === 'number' ? fortuneScore : fortuneScore.score;
    // 環境変数から利用モードを取得
    const useClaudeAPI = process.env.USE_CLAUDE_API === 'true';
    
    if (useClaudeAPI) {
      try {
        return await this.generateAdviceWithClaude(user, dayPillar, fortuneScoreValue, fortuneScore);
      } catch (error) {
        console.error('Claude API呼び出しエラー:', error);
        // APIエラー時はフォールバックとしてテンプレートベースのアドバイスを使用
        return this.generateTemplateBasedAdvice(user, dayPillar, fortuneScoreValue);
      }
    } else {
      // Claude APIを使用しない場合はテンプレートベースのアドバイスを使用
      return this.generateTemplateBasedAdvice(user, dayPillar, fortuneScoreValue);
    }
  }
  
  /**
   * Claude APIを使用して運勢アドバイスを生成する
   */
  private async generateAdviceWithClaude(
    user: any,
    dayPillar: any,
    fortuneScore: number,
    fortuneDetails?: FortuneScoreResult | number
  ): Promise<string> {
    // Anthropic APIのSDKを使用
    try {
      // 環境変数からAPIキーを取得
      const apiKey = process.env.ANTHROPIC_API_KEY;
      if (!apiKey) {
        throw new Error('Anthropic API Key is not configured');
      }
      
      // @anthropic-ai/sdk の動的インポート
      const { Anthropic } = await import('@anthropic-ai/sdk');
      
      const anthropic = new Anthropic({
        apiKey: apiKey
      });
      
      // チーム目標情報の取得
      let teamGoal = null;
      if (user.teamId) {
        teamGoal = await TeamGoal.findOne({ teamId: user.teamId }).lean();
      }
      
      // 四柱推命情報からプロンプトを作成
      const userElement = user.elementAttribute || 'water';
      const dayElement = this.getStemElement(dayPillar.heavenlyStem);
      const stemElement = this.getStemElement(dayPillar.heavenlyStem);
      
      // 運勢の種類を決定
      let fortuneType = 'neutral';
      if (fortuneScore >= 80) {
        fortuneType = 'excellent';
      } else if (fortuneScore >= 60) {
        fortuneType = 'good';
      } else if (fortuneScore <= 20) {
        fortuneType = 'bad';
      } else if (fortuneScore <= 40) {
        fortuneType = 'poor';
      }
      
      // プロンプトの構築
      const prompt = `
あなたは四柱推命に基づいて運勢アドバイスを作成する専門家です。以下の情報に基づいて、マークダウン形式のアドバイスを作成してください。

# ユーザー基本情報
- 名前: ${user.displayName || 'ユーザー'}
- 日主: ${user.dayMaster || '不明'}
- 主要五行: ${userElement}

# 四柱情報
- 四柱: ${user.fourPillars?.year?.heavenlyStem || ''}${user.fourPillars?.year?.earthlyBranch || ''} ${user.fourPillars?.month?.heavenlyStem || ''}${user.fourPillars?.month?.earthlyBranch || ''} ${user.fourPillars?.day?.heavenlyStem || ''}${user.fourPillars?.day?.earthlyBranch || ''} ${user.fourPillars?.hour?.heavenlyStem || ''}${user.fourPillars?.hour?.earthlyBranch || ''}

# 五行バランス
- 木: ${user.elementProfile?.wood || 0}
- 火: ${user.elementProfile?.fire || 0}
- 土: ${user.elementProfile?.earth || 0}
- 金: ${user.elementProfile?.metal || 0}
- 水: ${user.elementProfile?.water || 0}

# 格局・用神情報
- 格局: ${user.kakukyoku?.type || '不明'}（${user.kakukyoku?.strength || '不明'}）
- 用神: ${user.yojin?.tenGod || '不明'}（${user.yojin?.element || '不明'}）
- 喜神: ${user.yojin?.kijin?.tenGod || '不明'}（${user.yojin?.kijin?.element || '不明'}）
- 忌神: ${user.yojin?.kijin2?.tenGod || '不明'}（${user.yojin?.kijin2?.element || '不明'}）
- 仇神: ${user.yojin?.kyujin?.tenGod || '不明'}（${user.yojin?.kyujin?.element || '不明'}）

# 本日の日柱情報
- 天干: ${dayPillar.heavenlyStem}
- 地支: ${dayPillar.earthlyBranch} 
- 五行属性: ${stemElement}
- 運勢スコア: ${fortuneScore}/100
- 運勢タイプ: ${fortuneType}

# ユーザー目標
- 個人目標: ${user.goal || '設定なし'}
- チーム役割: ${user.teamRole || '設定なし'}
- チーム目標: ${teamGoal?.content || '目標未設定'}
- 目標期限: ${teamGoal?.deadline ? new Date(teamGoal.deadline).toLocaleDateString() : '未設定'}
- 進捗状況: ${teamGoal?.progress || 0}%

以下の3セクションからなるマークダウン形式のアドバイスを作成してください：
1. 「今日のあなたの運気」- 本日の日柱と用神・喜神・忌神との相性や、五行バランスを考慮した運気の分析
2. 「個人目標へのアドバイス」- 格局と用神を考慮したうえで、目標達成のための具体的なアドバイス
3. 「チーム目標へのアドバイス」- チーム目標「${teamGoal?.content || '未設定'}」の達成に向けたアドバイス。五行特性を活かした対人関係や協力について具体的に言及してください。

それぞれのセクションは200-300文字程度にしてください。四柱推命の知識に基づいた具体的で実用的なアドバイスを提供してください。セクション内では、用神や喜神を活かす時間帯、注意すべき時間帯なども含めると良いでしょう。特にチーム目標に関しては、具体的な目標内容を参照した上で、達成のための具体的な行動や注意点を提案してください。
      `;
      
      // Claude 3.7 Sonnetモデルを使用
      const message = await anthropic.messages.create({
        model: "claude-3-7-sonnet-20250219",
        max_tokens: 4000,
        messages: [
          {
            role: "user",
            content: prompt
          }
        ]
      });
      
      // レスポンスからテキスト内容を取得
      const contentBlock = message.content[0];
      
      // 型チェックを行い安全に値を取り出す
      if (contentBlock && typeof contentBlock === 'object' && 'text' in contentBlock) {
        return contentBlock.text;
      } else if (contentBlock && typeof contentBlock === 'object' && 'type' in contentBlock) {
        // APIの応答形式が変わった場合の対応（どのような型であっても対応）
        return (contentBlock as any).value || '';
      }
      
      // どちらにも当てはまらない場合はデフォルトメッセージを返す
      return "今日は自分の直感を信じて行動してみましょう。新しい発見があるかもしれません。";
      
    } catch (error) {
      console.error('Claude API呼び出しエラー:', error);
      throw error;
    }
  }
  
  /**
   * テンプレートベースのアドバイスを生成する（Claude API非使用時のフォールバック）
   */
  private async generateTemplateBasedAdvice(
    user: any,
    dayPillar: any,
    fortuneScore: number
  ): Promise<string> {
    const userElement = user.elementAttribute || 'water';
    const stemElement = this.getStemElement(dayPillar.heavenlyStem);

    // チーム目標情報の取得
    let teamGoal = null;
    if (user.teamId) {
      teamGoal = await TeamGoal.findOne({ teamId: user.teamId }).lean();
    }

    // 運勢の種類を決定
    let fortuneType = 'neutral';
    if (fortuneScore >= 80) {
      fortuneType = 'excellent';
    } else if (fortuneScore >= 60) {
      fortuneType = 'good';
    } else if (fortuneScore <= 20) {
      fortuneType = 'bad';
    } else if (fortuneScore <= 40) {
      fortuneType = 'poor';
    }

    // 各属性と相性の組み合わせに応じたテンプレートを作成
    const dayDescription = this.getDayDescription(userElement, stemElement, fortuneType);
    const personalGoalAdvice = this.getPersonalGoalAdvice(userElement, stemElement, fortuneType, user.goal);
    // チーム目標情報を含めてチームアドバイスを生成
    const teamGoalAdvice = this.getTeamGoalAdvice(
      userElement, 
      stemElement, 
      fortuneType, 
      user.teamRole
    );

    // マークダウン形式で結合
    return `# 今日のあなたの運気

${dayDescription}

# 個人目標へのアドバイス

${personalGoalAdvice}

# チーム目標へのアドバイス

${teamGoalAdvice}`;
  }

  /**
   * 日の説明を生成
   */
  private getDayDescription(userElement: string, dayElement: string, fortuneType: string): string {
    const elementDescriptions: { [key: string]: string } = {
      'wood': '木の気',
      'fire': '火の気',
      'earth': '土の気',
      'metal': '金の気',
      'water': '水の気'
    };

    const fortuneDescriptions: { [key: string]: string } = {
      'excellent': '非常に高まる一日です。あなたの才能が輝き、周囲からの評価も高まるでしょう。',
      'good': '良好な一日です。安定感があり、計画通りに物事が進むでしょう。',
      'neutral': '平穏な一日です。特に大きな変化はなく、日常業務に適しています。',
      'poor': 'やや注意が必要な一日です。細部に気を配り、慎重に行動しましょう。',
      'bad': '困難が予想される一日です。重要な決断は先送りし、身を守ることを優先しましょう。'
    };

    const relationships: { [key: string]: { [key: string]: string } } = {
      'wood': {
        'wood': '同じ木の気同士で共鳴し、創造力が高まります。',
        'fire': '木は火を生み出し、情熱とエネルギーが増します。',
        'earth': '木は土を消耗させるため、やや慎重さが必要です。',
        'metal': '金は木を切るため、障害に直面する可能性があります。',
        'water': '水は木を育てるため、成長と発展が期待できます。'
      },
      'fire': {
        'wood': '木は火を強め、直観力と表現力が活性化します。',
        'fire': '同じ火の気同士で輝きが増し、情熱的な一日になります。',
        'earth': '火は土を生み出し、安定感と実現力が高まります。',
        'metal': '火は金を溶かすため、障害を克服できるでしょう。',
        'water': '水は火を消すため、エネルギーの保存が必要です。'
      },
      'earth': {
        'wood': '木は土からエネルギーを奪うため、体力管理が重要です。',
        'fire': '火は土を強化し、基盤が固まる日です。',
        'earth': '同じ土の気同士で安定感が増し、堅実な判断ができます。',
        'metal': '土は金を生み出し、価値を創造できる日です。',
        'water': '土は水を堰き止め、感情のコントロールが鍵となります。'
      },
      'metal': {
        'wood': '金は木を制御し、規律と秩序をもたらします。',
        'fire': '金は火に弱く、過度なストレスに注意が必要です。',
        'earth': '土は金を育み、物事が形になっていく日です。',
        'metal': '同じ金の気同士で精度が高まり、細部への配慮が効果的です。',
        'water': '金は水を生み出し、知恵と洞察力が増します。'
      },
      'water': {
        'wood': '水は木を育て、アイデアと成長を促進します。',
        'fire': '水は火を弱めるため、エネルギーの分散に気をつけましょう。',
        'earth': '水は土に吸収されるため、無理な拡大は控えめに。',
        'metal': '金は水を浄化し、クリアな思考と判断力をもたらします。',
        'water': '同じ水の気同士で流動性が高まり、柔軟な対応ができます。'
      }
    };

    return `今日は${elementDescriptions[dayElement]}が強く、${fortuneDescriptions[fortuneType]}${relationships[userElement][dayElement]}`;
  }

  /**
   * 個人目標へのアドバイスを生成
   */
  private getPersonalGoalAdvice(userElement: string, dayElement: string, fortuneType: string, goal?: string): string {
    if (!goal) {
      return '個人目標が設定されていません。目標を設定すると、より具体的なアドバイスが表示されます。';
    }

    const advices: { [key: string]: { [key: string]: string } } = {
      'excellent': {
        'wood': '今日は創造力が非常に高まる日です。新しいアイデアを形にするのに最適な時期です。',
        'fire': '情熱とエネルギーに満ちた一日です。思い切った行動で大きな進展が見込めます。',
        'earth': '安定感と実現力が高まる日です。具体的な計画立案と実行に最適です。',
        'metal': '明晰な思考と決断力が冴える日です。重要な判断や選択に適しています。',
        'water': '直感と柔軟性が高まる日です。複数の選択肢から最適な道を見つけられるでしょう。'
      },
      'good': {
        'wood': '成長と発展に適した日です。少しずつ前進することで着実な成果が期待できます。',
        'fire': '活力があり、前向きな一日です。モチベーションを維持しやすく、進捗が見込めます。',
        'earth': '安定した進歩が期待できる日です。基盤を固める作業に適しています。',
        'metal': '精度の高い作業に向いている日です。細部の調整や品質向上に努めましょう。',
        'water': '情報収集と分析に適した日です。様々な角度から目標を見直してみましょう。'
      },
      'neutral': {
        'wood': '地道な努力が実を結ぶ日です。無理せず着実に進めることが大切です。',
        'fire': 'バランスの取れた一日です。エネルギーを均等に配分して取り組みましょう。',
        'earth': '堅実さが求められる日です。基本に立ち返り、土台を固めましょう。',
        'metal': '整理整頓に適した日です。不要なものを取り除き、本質に集中しましょう。',
        'water': '内省と準備に適した日です。次のステップの計画を練り直してみましょう。'
      },
      'poor': {
        'wood': '成長の停滞を感じる日かもしれません。小さな一歩に価値を見出しましょう。',
        'fire': 'エネルギーがやや低下する日です。無理をせず、重要なタスクに集中しましょう。',
        'earth': '予期せぬ障害に直面するかもしれません。柔軟に計画を調整する姿勢が重要です。',
        'metal': '判断力がやや鈍る日です。重要な決断は延期し、情報収集に努めましょう。',
        'water': '感情の波を感じる日です。客観的な視点を保つよう心がけましょう。'
      },
      'bad': {
        'wood': '成長が妨げられると感じる日です。今は種を蒔く時期と考え、将来の準備をしましょう。',
        'fire': 'エネルギーが大きく低下する日です。休息を取り、体力の回復を優先しましょう。',
        'earth': '計画の遅延や変更が生じる可能性があります。柔軟性を持ち、適応することが重要です。',
        'metal': '判断力と集中力が低下する日です。重要な決断や精密な作業は避けましょう。',
        'water': '不安や混乱を感じる日かもしれません。基本に立ち返り、シンプルに考えましょう。'
      }
    };

    return `${goal}という目標に対して、${advices[fortuneType][userElement]}日々の小さな進歩を大切にし、焦らず着実に前進していきましょう。`;
  }

  /**
   * チーム目標へのアドバイスを生成
   */
  private getTeamGoalAdvice(userElement: string, dayElement: string, fortuneType: string, teamRole?: string): string {
    if (!teamRole) {
      return 'チームに所属していないか、役割が設定されていません。チームに参加し役割を設定すると、より具体的なアドバイスが表示されます。';
    }

    const roleAdvices: { [key: string]: string } = {
      'リーダー': 'チームをまとめる役割として、今日は',
      'マネージャー': 'チームを管理する立場として、今日は',
      'エンジニア': '技術的な専門家として、今日は',
      'デザイナー': 'クリエイティブな視点を持つあなたは、今日は',
      'コンサルタント': '専門的なアドバイスを提供する立場として、今日は',
      'アナリスト': 'データを分析する役割として、今日は',
      'マーケター': 'マーケティングの専門家として、今日は',
      'セールス': '営業担当として、今日は',
      'カスタマーサポート': '顧客対応の専門家として、今日は',
      'プロダクトマネージャー': '製品管理の立場から、今日は'
    };

    // ロールに応じたアドバイスの前文を選択（一致するキーがなければデフォルト）
    let rolePrefix = '任務遂行の一員として、今日は';
    for (const role in roleAdvices) {
      if (teamRole.includes(role)) {
        rolePrefix = roleAdvices[role];
        break;
      }
    }

    const teamAdvices: { [key: string]: { [key: string]: string } } = {
      'excellent': {
        'wood': 'チーム内でアイデアを積極的に共有し、創造的な解決策を提案するのに最適な日です。',
        'fire': 'チームのモチベーションを高め、情熱を共有することで大きな前進が期待できます。',
        'earth': 'チームの基盤を強化し、安定した進捗をもたらす調整役を担うと効果的です。',
        'metal': '精度の高い分析と明確な方向性を示すことで、チームに貢献できるでしょう。',
        'water': '柔軟な思考と適応力を活かし、チームの課題解決に大きく貢献できる日です。'
      },
      'good': {
        'wood': 'チームの成長を促す新しい視点を提供することで、良い影響を与えられるでしょう。',
        'fire': '前向きなエネルギーでチームを鼓舞し、活力をもたらす役割が期待されます。',
        'earth': 'チーム内の調和を保ち、安定した進行を支える役割が重要になります。',
        'metal': '効率と精度を重視した提案や調整がチームに価値をもたらすでしょう。',
        'water': '多様な意見をまとめ、チームの方向性を整理する役割が効果的です。'
      },
      'neutral': {
        'wood': 'チーム内での意見交換を通じて、新たな可能性を模索する日です。',
        'fire': 'バランスの取れた関わりで、チームの雰囲気を維持する役割が求められます。',
        'earth': '基本的なルーチンを確実にこなし、チームの安定を支えましょう。',
        'metal': 'プロセスの見直しや改善点の提案が、チームに貢献する方法です。',
        'water': '情報収集と共有に注力し、チームの知識ベースを強化しましょう。'
      },
      'poor': {
        'wood': 'チーム内での意見の相違に対して、柔軟な姿勢で対応することが重要です。',
        'fire': 'エネルギーを保存しながら、チームの核となる活動に焦点を当てましょう。',
        'earth': '予期せぬ変更があっても、チームの安定を保つための調整に努めましょう。',
        'metal': '細部に気を配りながらも、完璧主義に陥らないバランス感覚が重要です。',
        'water': 'チーム内の感情的な波に流されず、客観的な視点を提供しましょう。'
      },
      'bad': {
        'wood': '今日はチーム内の対立を避け、共通点を見つけることに注力しましょう。',
        'fire': 'チームのエネルギーが低下している時こそ、冷静さと忍耐が求められます。',
        'earth': '急な変更や混乱の中でも、チームの基盤を守る役割に徹しましょう。',
        'metal': '批判的な意見は控え、建設的なフィードバックを心がけましょう。',
        'water': 'チーム内の不安や混乱に対して、落ち着いた対応で安心感を提供しましょう。'
      }
    };

    // チームメンバーとの相性アドバイス
    const compatibilityMap: Record<string, Record<string, string>> = {
      'wood': {
        'fire': '火の気質を持つメンバーとの協力が特に効果的です。',
        'water': '水の気質を持つメンバーとのコラボレーションで創造性が高まります。'
      },
      'fire': {
        'wood': '木の気質を持つメンバーからエネルギーを得られるでしょう。',
        'earth': '土の気質を持つメンバーとの協力で安定した成果が期待できます。'
      },
      'earth': {
        'fire': '火の気質を持つメンバーのアイデアを形にする役割が適しています。',
        'metal': '金の気質を持つメンバーとの協力で細部まで完成度の高い成果が出せるでしょう。'
      },
      'metal': {
        'earth': '土の気質を持つメンバーの安定感と組み合わせると効果的です。',
        'water': '水の気質を持つメンバーの柔軟性と相互補完できます。'
      },
      'water': {
        'metal': '金の気質を持つメンバーの明晰さと組み合わさると良い結果が期待できます。',
        'wood': '木の気質を持つメンバーの成長を促進する関係性が築けるでしょう。'
      }
    };
    
    // ユーザーの属性と日柱の属性に基づいたアドバイスを取得
    const compatibilityAdvice = compatibilityMap[userElement]?.[dayElement] || '';

    return `${rolePrefix}${teamAdvices[fortuneType][userElement]} ${compatibilityAdvice}`;
  }

  /**
   * ラッキーアイテムを生成する
   * @param userElement ユーザーの五行属性
   * @param heavenlyStem 天干
   * @param earthlyBranch 地支
   * @returns ラッキーアイテム情報
   */
  private async generateLuckyItems(
    userElement: string,
    heavenlyStem: string,
    earthlyBranch: string,
    userId?: string,
    fortuneScoreResult?: FortuneScoreResult
  ): Promise<{ color: string; item: string; drink: string }> {
    try {
      // Claude AIを使用する場合、ユーザーの詳細情報を取得
      if (userId) {
        try {
          const User = mongoose.model('User');
          const user = await User.findById(userId);
          
          if (user && user.fourPillars && user.kakukyoku && user.yojin && user.elementProfile) {
            try {
              // 新しいラッキーアイテム生成サービスを使用
              const { luckyItemsService } = await import('./lucky-items.service');
              
              // fortuneScoreResultがある場合は、バランス情報と用神情報を渡す
              const enhancedUserData = { 
                user,
                fortuneDetails: fortuneScoreResult || undefined
              };
              
              const luckyItems = await luckyItemsService.generateLuckyItems(
                enhancedUserData,
                heavenlyStem,
                earthlyBranch
              );
              console.log('🎯 Claude AIでラッキーアイテム生成成功:', luckyItems);
              return luckyItems;
            } catch (claudeError) {
              console.warn('🎯 Claude AI生成エラー、従来方式にフォールバック:', claudeError);
            }
          }
        } catch (userError) {
          console.warn('🎯 ユーザー情報取得エラー、従来方式にフォールバック:', userError);
        }
      }
      
      // 以下は従来のテンプレート方式（フォールバック）
      console.log('🎯 従来のテンプレート方式でラッキーアイテム生成');
      const stemElement = this.getStemElement(heavenlyStem);
      let luckyElement = this.getLuckyElement(userElement, stemElement);

      // 属性に対応するラッキーアイテムを返す
      const luckyItems = this.getLuckyItemsByElement(luckyElement);
      return luckyItems;
    } catch (error) {
      console.error('🎯 ラッキーアイテム生成総合エラー:', error);
      return {
        color: '青色のアクセサリー',
        item: '旬の野菜料理',
        drink: '緑茶'
      };
    }
  }

  /**
   * 属性に応じたラッキーアイテムを取得
   * @param element 五行属性
   * @returns ラッキーアイテム情報
   */
  private getLuckyItemsByElement(element: string): { color: string; item: string; drink: string } {
    const luckyItemsByElement: { [key: string]: { color: string; item: string; drink: string }[] } = {
      'wood': [
        { color: '緑のシャツ', item: 'サラダ', drink: '緑茶' },
        { color: 'ナチュラルリネン', item: 'アボカド', drink: 'ハーブティー' },
        { color: '竹色のデニム', item: '木の実ナッツ', drink: '野菜ジュース' }
      ],
      'fire': [
        { color: '赤いセーター', item: '唐辛子料理', drink: 'ルイボスティー' },
        { color: 'オレンジのスカーフ', item: '焼き立て料理', drink: '温かいコーヒー' },
        { color: 'ピンクのワンピース', item: 'トマト料理', drink: 'トマトジュース' }
      ],
      'earth': [
        { color: '黄色のセーター', item: 'かぼちゃスープ', drink: 'ウーロン茶' },
        { color: '茶色のベスト', item: 'ポテト料理', drink: 'ミルクティー' },
        { color: 'ベージュのコート', item: '焼き菓子', drink: 'ココア' }
      ],
      'metal': [
        { color: '白いブラウス', item: '白身魚料理', drink: '白ワイン' },
        { color: 'シルバーのネックレス', item: 'クリームソース料理', drink: '牛乳' },
        { color: '銀色のジャケット', item: 'キノコ料理', drink: 'シャンパン' }
      ],
      'water': [
        { color: '紺色のアウター', item: '魚料理', drink: 'ミネラルウォーター' },
        { color: '深い青のドレス', item: '海藻サラダ', drink: '炭酸水' },
        { color: '黒いレザージャケット', item: '黒豆デザート', drink: 'コーヒー' }
      ]
    };

    // ランダムに選択
    const items = luckyItemsByElement[element];
    return items[Math.floor(Math.random() * items.length)];
  }

  /**
   * ユーザーと日柱の相性から、ラッキーな五行属性を決定
   * @param userElement ユーザーの五行属性
   * @param dayElement 日柱の五行属性
   * @returns ラッキーな五行属性
   */
  private getLuckyElement(userElement: string, dayElement: string): string {
    // 相生関係（userElementを生じさせる属性、またはuserElementが生じさせる属性）
    const generating: { [key: string]: string } = {
      'wood': 'water', // 木は水から生まれる
      'fire': 'wood',  // 火は木から生まれる
      'earth': 'fire', // 土は火から生まれる
      'metal': 'earth', // 金は土から生まれる
      'water': 'metal'  // 水は金から生まれる
    };

    const generated: { [key: string]: string } = {
      'water': 'wood', // 水は木を生む
      'wood': 'fire',  // 木は火を生む
      'fire': 'earth', // 火は土を生む
      'earth': 'metal', // 土は金を生む
      'metal': 'water'  // 金は水を生む
    };

    // 日柱属性とユーザー属性の関係に基づいてラッキー属性を決定
    if (dayElement === userElement) {
      // 同じ属性の場合、その属性を強化するもの（生じさせる属性）
      return generating[userElement];
    } else if (dayElement === generating[userElement]) {
      // 日柱がユーザーを生じさせる場合、ユーザーが生じさせる属性
      return generated[userElement];
    } else if (dayElement === generated[userElement]) {
      // 日柱がユーザーから生じる場合、ユーザーを生じさせる属性
      return generating[userElement];
    } else {
      // その他の場合、ユーザー属性と日柱属性の中間的な属性
      const elements = ['wood', 'fire', 'earth', 'metal', 'water'];
      const userIndex = elements.indexOf(userElement);
      const dayIndex = elements.indexOf(dayElement);
      // 中間または安定的な属性を返す
      return elements[(userIndex + dayIndex) % 5];
    }
  }

  /**
   * 天干の五行属性を取得
   * @param heavenlyStem 天干
   * @returns 五行属性
   */
  private getStemElement(heavenlyStem: string): string {
    const stemElements: { [key: string]: string } = {
      '甲': 'wood', '乙': 'wood',
      '丙': 'fire', '丁': 'fire',
      '戊': 'earth', '己': 'earth',
      '庚': 'metal', '辛': 'metal',
      '壬': 'water', '癸': 'water'
    };
    return stemElements[heavenlyStem] || 'earth'; // デフォルトは土
  }

  /**
   * 地支の五行属性を取得
   * @param earthlyBranch 地支
   * @returns 五行属性
   */
  private getBranchElement(earthlyBranch: string): string {
    const branchElements: { [key: string]: string } = {
      '子': 'water', '丑': 'earth',
      '寅': 'wood', '卯': 'wood',
      '辰': 'earth', '巳': 'fire',
      '午': 'fire', '未': 'earth',
      '申': 'metal', '酉': 'metal',
      '戌': 'earth', '亥': 'water'
    };
    return branchElements[earthlyBranch] || 'earth'; // デフォルトは土
  }

  /**
   * 五行属性間の相性を計算
   * @param element1 属性1
   * @param element2 属性2
   * @returns 相性スコア（0-5）
   */
  private calculateElementCompatibility(element1: string, element2: string): number {
    if (element1 === element2) {
      // 同じ属性同士は相性が良い
      return 5;
    }

    // 相生関係（生じさせる関係）
    const generatingRelations: [string, string][] = [
      ['water', 'wood'],  // 水は木を育てる
      ['wood', 'fire'],   // 木は火を燃やす
      ['fire', 'earth'],  // 火は土を作る
      ['earth', 'metal'], // 土は金を生み出す
      ['metal', 'water']  // 金は水を浄化する
    ];

    // 相克関係（抑制する関係）
    const restrictingRelations: [string, string][] = [
      ['wood', 'earth'],  // 木は土から養分を奪う
      ['earth', 'water'], // 土は水を堰き止める
      ['water', 'fire'],  // 水は火を消す
      ['fire', 'metal'],  // 火は金を溶かす
      ['metal', 'wood']   // 金は木を切る
    ];

    // 相生関係チェック
    for (const [gen, rec] of generatingRelations) {
      if ((element1 === gen && element2 === rec) || (element2 === gen && element1 === rec)) {
        return 4; // 相生関係は良い相性
      }
    }

    // 相克関係チェック
    for (const [res, sub] of restrictingRelations) {
      if (element1 === res && element2 === sub) {
        return 2; // element1がelement2を抑制する場合は中程度の相性
      }
      if (element2 === res && element1 === sub) {
        return 1; // element2がelement1を抑制する場合は低い相性
      }
    }

    // その他の関係（間接的な関係）
    return 3; // 中立的な相性
  }

  /**
   * 日付から時間情報を除去する
   * @param date 対象の日付
   * @returns 時間情報を除去した日付
   */
  private getDateWithoutTime(date: Date): Date {
    const newDate = new Date(date);
    newDate.setHours(0, 0, 0, 0);
    return newDate;
  }

  /**
   * チームの運勢ランキングを取得する
   * @param teamId チームID
   * @returns チーム運勢ランキングデータ
   */
  async getTeamFortuneRanking(teamId: string): Promise<any> {
    try {
      const team = await Team.findById(teamId);
      if (!team) {
        throw new Error(`チームが見つかりません: ${teamId}`);
      }
      
      const today = this.getDateWithoutTime(new Date());
      
      // チームに所属するユーザーを取得
      const teamMembers = await User.find({ 
        teamId: teamId 
      });
      
      if (!teamMembers || teamMembers.length === 0) {
        return {
          success: true,
          data: {
            teamId: team._id ? team._id.toString() : teamId,
            teamName: team.name,
            date: today,
            nextUpdateTime: '03:00',
            ranking: []
          }
        };
      }
      
      // メンバーの運勢情報を取得（個人運勢とチームコンテキスト運勢）
      const memberFortunePromises = teamMembers.map(async (member) => {
        // 各メンバーの最新の運勢データを取得（日付に関係なく最新のものを使用）
        const userFortune = await DailyFortune.findOne({ 
          userId: member._id
        }).sort({ updatedAt: -1 });
        
        // チームコンテキスト運勢は統合されたため、個人運勢のみを使用
        const fortuneScore = userFortune ? userFortune.fortuneScore : 0;
        
        return {
          userId: member._id ? member._id.toString() : '',
          displayName: member.displayName,
          score: fortuneScore,
          elementAttribute: member.elementAttribute || 'unknown',
          jobTitle: member.jobTitle || 'メンバー'
        };
      });
      
      const membersFortunes = await Promise.all(memberFortunePromises);
      
      // スコアの降順でソート
      const sortedRanking = membersFortunes
        .sort((a, b) => b.score - a.score)
        .map((member, index) => ({
          ...member,
          rank: index + 1
        }));
      
      return {
        success: true,
        data: {
          teamId: team._id ? team._id.toString() : teamId,
          teamName: team.name,
          date: today,
          nextUpdateTime: '03:00',
          ranking: sortedRanking
        }
      };
    } catch (error) {
      console.error('チーム運勢ランキング取得エラー:', error);
      return {
        success: false,
        error: `チーム運勢ランキングの取得に失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}`
      };
    }
  }
}

// サービスのインスタンスをエクスポート

export const fortuneService = new FortuneService();
