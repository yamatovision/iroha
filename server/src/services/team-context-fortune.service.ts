import mongoose from 'mongoose';
import { 
  TeamContextFortune, 
  User, 
  Team, 
  TeamGoal, 
  TeamMembership, 
  DayPillar,
  DailyFortune
} from '../models';
import { claudeApiClient } from './claude-api-client';

/**
 * チームコンテキスト運勢サービス
 * ユーザーと所属チームの関係性を考慮した運勢情報を生成・取得する
 */
export class TeamContextFortuneService {
  /**
   * チームコンテキスト運勢を取得する
   * 存在しない場合は生成する
   * 
   * @param userId ユーザーID
   * @param teamId チームID
   * @param dateStr 日付文字列（YYYY-MM-DD形式、省略可）
   * @returns チームコンテキスト運勢情報
   */
  public async getTeamContextFortune(
    userId: string, 
    teamId: string, 
    dateStr?: string
  ): Promise<any> {
    try {
      console.log(`チームコンテキスト運勢取得 - userId: ${userId}, teamId: ${teamId}`);
      
      // 日付の正規化
      const date = dateStr ? new Date(dateStr) : new Date();
      date.setHours(0, 0, 0, 0);
      
      // 既存のチームコンテキスト運勢をチェック
      let teamContextFortune = await TeamContextFortune.findOne({
        userId: new mongoose.Types.ObjectId(userId),
        teamId: new mongoose.Types.ObjectId(teamId),
        date: {
          $gte: date,
          $lt: new Date(date.getTime() + 24 * 60 * 60 * 1000)
        }
      }).populate('dayPillarId');

      console.log(`既存のチームコンテキスト運勢: ${teamContextFortune ? '存在します' : '存在しません'}`);
      
      if (teamContextFortune) {
        // 存在する場合は、クライアント側の型に合わせて変換
        // DayPillarドキュメントの型安全な取得
        let dayPillarInfo;
        
        try {
          // dayPillarIdから日柱情報を取得
          const dayPillarDoc = await DayPillar.findById(teamContextFortune.dayPillarId).lean();
          
          if (dayPillarDoc) {
            dayPillarInfo = {
              heavenlyStem: dayPillarDoc.heavenlyStem,
              earthlyBranch: dayPillarDoc.earthlyBranch
            };
          } else {
            dayPillarInfo = {
              heavenlyStem: '甲',  // デフォルト値
              earthlyBranch: '子'  // デフォルト値
            };
          }
        } catch (error) {
          console.error('日柱情報の取得に失敗:', error);
          dayPillarInfo = {
            heavenlyStem: '甲',  // デフォルト値
            earthlyBranch: '子'  // デフォルト値
          };
        }
        
        const teamContextFortuneResponse = {
          ...teamContextFortune.toObject(),
          dayPillar: dayPillarInfo
        };
        
        return { teamContextFortune: teamContextFortuneResponse };
      } else {
        // 存在しない場合は新規生成
        console.log('チームコンテキスト運勢を新規生成します');
        const generatedFortune = await this.generateTeamContextFortune(userId, teamId, date);
        return { teamContextFortune: generatedFortune };
      }
    } catch (error) {
      console.error('チームコンテキスト運勢取得エラー:', error);
      throw error;
    }
  }

  /**
   * チームコンテキスト運勢を強制的に生成する
   * 
   * @param userId ユーザーID
   * @param teamId チームID
   * @param dateStr 日付文字列（YYYY-MM-DD形式、省略可）
   * @returns 生成されたチームコンテキスト運勢情報
   */
  public async generateTeamContextFortune(
    userId: string, 
    teamId: string, 
    date: Date = new Date()
  ): Promise<any> {
    try {
      console.log(`======== チームコンテキスト運勢生成開始 - userId: ${userId}, teamId: ${teamId}, date: ${date.toISOString()} ========`);
      
      // 日付の正規化
      date.setHours(0, 0, 0, 0);
      
      // 既存のチームコンテキスト運勢があるか確認
      const existingFortune = await TeamContextFortune.findOne({
        userId: new mongoose.Types.ObjectId(userId),
        teamId: new mongoose.Types.ObjectId(teamId),
        date: {
          $gte: date,
          $lt: new Date(date.getTime() + 24 * 60 * 60 * 1000)
        }
      });
      
      // 既存データがあるかどうかをログ出力
      console.log(`既存のチームコンテキスト運勢: ${existingFortune ? '存在します (ID: ' + existingFortune._id + ')' : '存在しません - 新規作成します'}`);
      
      
      // 1. 必要なデータの収集
      // ユーザー情報取得
      const user = await User.findById(userId).lean();
      if (!user) {
        throw new Error('ユーザーが見つかりません');
      }
      
      // チーム情報取得
      const team = await Team.findById(teamId).lean();
      if (!team) {
        throw new Error('チームが見つかりません');
      }
      
      // チーム目標取得
      const teamGoal = await TeamGoal.findOne({ teamId: new mongoose.Types.ObjectId(teamId) }).lean();
      
      // チームメンバーシップ取得（ユーザーの役割）
      const membership = await TeamMembership.findOne({ 
        userId: new mongoose.Types.ObjectId(userId), 
        teamId: new mongoose.Types.ObjectId(teamId) 
      }).lean();
      
      if (!membership) {
        throw new Error('ユーザーはこのチームのメンバーではありません');
      }
      
      // 日柱情報取得
      const dayPillar = await DayPillar.findOne({
        date: {
          $gte: date,
          $lt: new Date(date.getTime() + 24 * 60 * 60 * 1000)
        }
      }).lean();
      
      if (!dayPillar) {
        throw new Error('日柱情報が見つかりません');
      }
      
      // クライアント側の型に合わせるため、dayPillarの情報を保存しておく
      const dayPillarInfo = {
        heavenlyStem: dayPillar.heavenlyStem,
        earthlyBranch: dayPillar.earthlyBranch
      };
      
      // 個人運勢情報を取得（スコア取得のため）
      const personalFortune = await DailyFortune.findOne({
        userId: new mongoose.Types.ObjectId(userId),
        date: {
          $gte: date,
          $lt: new Date(date.getTime() + 24 * 60 * 60 * 1000)
        }
      }).lean();
      
      // 2. プロンプトの構築
      const prompt = `
あなたは四柱推命の専門家として、チームコンテキストにおける運勢アドバイスを提供します。以下の情報を分析して、チームの目標達成に役立つ具体的なアドバイスを生成してください。

# 基本情報
- ユーザー: ${user.displayName}
- チーム: ${team.name}
- 日付: ${date.toISOString().split('T')[0]}
- 日柱: ${dayPillar.heavenlyStem}${dayPillar.earthlyBranch}（天干:${dayPillar.heavenlyStem}、地支:${dayPillar.earthlyBranch}）

# ユーザーの四柱推命プロフィール
- 日主: ${user.dayMaster || '不明'}
- 五行属性: ${user.elementAttribute || '不明'}
- 格局: ${user.kakukyoku?.type || '不明'}
- 用神: ${user.yojin?.tenGod || '不明'}

# チーム情報
- チーム目標: ${teamGoal?.content || 'なし'}
- 目標期限: ${teamGoal?.deadline ? new Date(teamGoal.deadline).toISOString().split('T')[0] : 'なし'}

# チーム内での役割
- ユーザーの役割: ${membership?.role || '一般メンバー'}

# 出力内容
以下の内容を自然な文章で提供してください。

1. チームコンテキストにおける運勢（200字程度）
   今日のあなたがチーム内でどのような状況にあるか、全体的な運勢の流れを説明してください。あなたの五行特性と今日の日柱エネルギーの関係から、チーム内でどのような強みを発揮できるかを述べてください。

2. チーム目標達成のための具体的アドバイス（300字程度）
   チームの目標を考慮し、ユーザーの四柱推命特性から、どのように行動すべきかの具体的なアドバイスを提供してください。特に今日の日柱との相互作用に基づいてアドバイスしてください。チームの目標達成に向けて、あなたの特性をどう活かすべきかを具体的に説明してください。

3. チーム内での役割発揮のポイント（150-200字程度）
   今日のあなたの五行エネルギーを考慮して、チーム内でどのような役割を最も効果的に果たせるかについてアドバイスしてください。リーダーシップ、サポート、創造性、分析など、今日特に発揮できる能力と、チーム内での最適な立ち位置について述べてください。
      `;
      
      // 3. Claude APIの呼び出し
      const systemPrompt = "あなたは四柱推命とチーム運勢の専門家です。与えられた情報に基づいて、ユーザーにとって具体的で実用的なアドバイスを提供してください。";
      
      console.log('===== Claude API呼び出し開始 =====');
      
      // フォールバックレスポンスを準備
      const defaultResponse = `# 本日のチーム運勢 - ${user.displayName || 'チームメンバー'} さんへ

## チームコンテキストにおける運勢
本日（${dayPillar.heavenlyStem}${dayPillar.earthlyBranch}日）は、チーム内での調和と協力が特に重要です。現在のチームエネルギーは安定しており、共同作業に適しています。

## チーム目標達成のための具体的アドバイス
${teamGoal?.content ? `チーム目標「${teamGoal.content}」の達成に向けて、今日は特に情報共有と進捗確認に時間を割くと良いでしょう。` : '目標達成に向けては、明確なコミュニケーションを意識し、各メンバーの強みを活かした役割分担を行うことが効果的です。'}定期的な進捗確認と、必要に応じた計画の調整を行うことで、チーム全体の方向性を保つことができます。

## チーム内での役割発揮のポイント
あなたの特性を活かして、チーム内での${membership?.role || '役割'}として、情報の整理と共有を担当するとより効果的です。特に重要な決断が必要な場面では、あなたの洞察力が大きく貢献するでしょう。チームメンバーの意見に耳を傾け、建設的なフィードバックを提供することで、チーム全体の成果を高めることができます。`;
      
      let claudeResponse;
      try {
        // API呼び出し（タイムアウトはclaude-api-client.ts内で処理）
        claudeResponse = await claudeApiClient.simpleCall(prompt, systemPrompt);
        console.log('===== Claude API呼び出し完了 =====');
        
        // 応答の検証
        if (!claudeResponse) {
          console.error('警告: Claude APIからの応答が空です');
          claudeResponse = defaultResponse;
          console.log('フォールバック応答を使用します (空のレスポンス)');
        } else if (typeof claudeResponse !== 'string') {
          console.error('警告: Claude APIからの応答が文字列ではありません', typeof claudeResponse);
          claudeResponse = defaultResponse;
          console.log('フォールバック応答を使用します (非文字列レスポンス)');
        } else if (claudeResponse.length < 100) {
          // 応答が短すぎる場合もフォールバック
          console.error('警告: Claude APIからの応答が短すぎます', claudeResponse);
          claudeResponse = defaultResponse;
          console.log('フォールバック応答を使用します (短すぎるレスポンス)');
        }
      } catch (apiError) {
        console.error('===== Claude API呼び出しエラー =====');
        console.error(apiError);
        
        // APIエラー時のフォールバック
        claudeResponse = defaultResponse;
        console.log('フォールバック応答を使用します (API呼び出しエラー)');
      }
      
      // 4. レスポンスの保存
      // 重要: teamContextAdviceフィールドにのみ全データを保存し、collaborationTipsは使用しない
      // AIレスポンスを解析せずにそのまま保存する（リファクタリング後）
      console.log('===== Claude APIレスポンス全文 =====');
      console.log(claudeResponse);
      console.log('========== 長さ:', claudeResponse.length, '文字 ==========');
      
      // AIレスポンス全文をそのまま保存
      const teamContextAdvice = claudeResponse;
      
      // 詳細なデバッグログ
      console.log('teamContextAdvice変数の型:', typeof teamContextAdvice);
      console.log('teamContextAdvice変数の長さ:', teamContextAdvice.length, '文字');
      
      // レスポンスが短すぎる場合はログを出力
      if (teamContextAdvice.length < 100) {
        console.error('❌ 警告: レスポンスが100文字未満で異常に短いため、問題がある可能性があります');
        console.error('teamContextAdvice:', teamContextAdvice);
      }
      
      // 個人運勢からスコアを取得（または固定値を使用）
      const score = personalFortune?.fortuneScore || 70; // 個人運勢スコアか、なければデフォルト値
      
      // 5. データの保存
      let savedFortune;
      
      // 既存データがある場合は更新、なければ新規作成
      if (existingFortune) {
        console.log('===== 既存データの更新開始 =====');
        
        // 既存データを更新
        existingFortune.dayPillarId = dayPillar._id as any;
        existingFortune.teamGoalId = teamGoal?._id as any;
        existingFortune.score = score;
        existingFortune.teamContextAdvice = teamContextAdvice;
        existingFortune.updatedAt = new Date();
        
        try {
          await existingFortune.save();
          console.log(`===== チームコンテキスト運勢を更新しました - ID: ${existingFortune._id} =====`);
          console.log('更新されたデータ構造:', {
            id: existingFortune._id,
            userId: existingFortune.userId,
            teamId: existingFortune.teamId,
            date: existingFortune.date,
            teamContextAdviceLength: existingFortune.teamContextAdvice?.length || 0,
            teamContextSample: existingFortune.teamContextAdvice?.substring(0, 100) + '...',
          });
          
          savedFortune = existingFortune;
        } catch (updateError) {
          console.error('データベース更新エラー:', updateError);
          throw updateError;
        }
      } else {
        // 新規作成
        const newTeamContextFortune = new TeamContextFortune({
          userId: new mongoose.Types.ObjectId(userId),
          teamId: new mongoose.Types.ObjectId(teamId),
          date,
          dayPillarId: dayPillar._id,
          teamGoalId: teamGoal?._id,
          score,
          teamContextAdvice,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        
        try {
          console.log('===== 新規データ保存開始 =====');
          await newTeamContextFortune.save();
          console.log(`===== 新規チームコンテキスト運勢を保存しました - ID: ${newTeamContextFortune._id} =====`);
          console.log('保存されたデータ構造:', {
            id: newTeamContextFortune._id,
            userId: newTeamContextFortune.userId,
            teamId: newTeamContextFortune.teamId,
            date: newTeamContextFortune.date,
            teamContextAdviceLength: newTeamContextFortune.teamContextAdvice?.length || 0,
            teamContextSample: newTeamContextFortune.teamContextAdvice?.substring(0, 100) + '...',
          });
          
          savedFortune = newTeamContextFortune;
        } catch (saveError) {
          console.error('データベース保存エラー:', saveError);
          throw saveError;
        }
      }
      
      // クライアント側に返すレスポンスはITeamContextFortuneに合わせて変換
      const teamContextFortuneResponse = {
        ...savedFortune.toObject(),
        dayPillar: dayPillarInfo // 型定義に合わせてdayPillarを追加
      };
      
      return teamContextFortuneResponse;
    } catch (error) {
      console.error('===== チームコンテキスト運勢生成エラー =====');
      console.error(error);
      
      // エラーの詳細情報を取得
      if (error instanceof Error) {
        console.error('エラー名:', error.name);
        console.error('エラーメッセージ:', error.message);
        console.error('スタックトレース:', error.stack);
        
        // モンゴース/MongoDBエラーの場合
        if ('code' in error) {
          console.error('MongoDBエラーコード:', (error as any).code);
        }
      }
      
      console.error('===== エラー詳細ここまで =====');
      throw error;
    }
  }
}

export const teamContextFortuneService = new TeamContextFortuneService();