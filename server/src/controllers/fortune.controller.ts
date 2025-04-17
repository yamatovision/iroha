import { Request, Response } from 'express';
import { fortuneService } from '../services/fortune.service';
import { AuthRequest } from '../middleware/auth.middleware';
import { Team } from '../models/Team';
import { User } from '../models/User';
import { DailyFortune } from '../models/DailyFortune';

/**
 * 運勢コントローラー
 * 運勢情報を取得・管理するAPIエンドポイントを提供
 */
export class FortuneController {
  /**
   * 今日の運勢を取得する
   * @param req リクエスト - クエリパラメータとして日付(date)を受け付ける
   * @param res レスポンス
   */
  public async getDailyFortune(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: '認証されていません' });
        return;
      }

      // クエリパラメータから日付を取得（指定がなければ今日の日付）
      const dateParam = req.query.date as string;
      let targetDate: Date | undefined;

      if (dateParam) {
        // 日付形式のバリデーション
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(dateParam)) {
          res.status(400).json({ error: '無効な日付フォーマットです。YYYY-MM-DD形式で指定してください。' });
          return;
        }
        targetDate = new Date(dateParam);
      }

      // 日付または今日の運勢を取得
      const fortune = targetDate
        ? await fortuneService.getUserFortune(userId, targetDate)
        : await fortuneService.getTodayFortune(userId);

      res.status(200).json(fortune);
    } catch (error: any) {
      console.error('運勢取得エラー:', error);
      if (error.message.includes('見つかりません')) {
        res.status(404).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'サーバーエラーが発生しました' });
      }
    }
  }

  /**
   * 運勢データを手動で更新（生成）する
   * @param req リクエスト
   * @param res レスポンス
   */
  public async generateFortune(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: '認証されていません' });
        return;
      }

      // 管理者権限チェックは削除 - 一般ユーザーでも利用可能に
      // 頻繁に更新されるのを防ぐための制限（1日1回まで）
      // 1日1回制限は必要に応じて実装を検討

      // 日付パラメータの取得（指定がなければ今日の日付）
      const dateParam = req.body.date || req.query.date;
      let targetDate = new Date();

      if (dateParam) {
        targetDate = new Date(dateParam);
        if (isNaN(targetDate.getTime())) {
          res.status(400).json({ error: '無効な日付フォーマットです' });
          return;
        }
      }

      // 強制更新フラグの取得
      const forceUpdate = req.body.forceUpdate === true;

      // 既存の運勢データがあるか確認
      const existingFortune = await DailyFortune.findOne({
        userId,
        date: {
          $gte: new Date(targetDate.setHours(0, 0, 0, 0)),
          $lt: new Date(targetDate.setHours(23, 59, 59, 999))
        }
      });

      // 既に運勢データがあり、強制更新フラグがない場合
      if (existingFortune && !forceUpdate) {
        res.status(200).json({
          ...existingFortune.toObject(),
          message: '今日の運勢データは既に生成されています'
        });
        return;
      }

      // 運勢の生成
      const fortune = await fortuneService.generateFortune(userId, targetDate);
      res.status(201).json({
        ...fortune,
        message: existingFortune ? '運勢データを更新しました' : '新しい運勢データを生成しました'
      });
    } catch (error: any) {
      console.error('運勢生成エラー:', error);
      if (error.message.includes('見つかりません')) {
        res.status(404).json({ error: error.message });
      } else if (error.message.includes('四柱推命情報')) {
        res.status(400).json({ 
          error: error.message, 
          code: 'MISSING_SAJU_PROFILE'
        });
      } else {
        res.status(500).json({ error: 'サーバーエラーが発生しました' });
      }
    }
  }

  /**
   * チームの運勢ランキングを取得
   * @param req リクエスト
   * @param res レスポンス
   */
  public async getTeamFortuneRanking(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: '認証されていません' });
        return;
      }

      const { teamId } = req.params;
      
      // チームが存在するか確認
      const team = await Team.findById(teamId);
      if (!team) {
        res.status(404).json({ error: 'チームが見つかりません' });
        return;
      }
      
      // リクエストユーザーがチームメンバーかを確認（リファクタリング後の標準化された方法）
      const requestUser = await User.findById(userId);
      const isMember = requestUser?.teamId && requestUser.teamId.toString() === teamId;
      
      if (!isMember) {
        res.status(403).json({ error: 'このチームのデータにアクセスする権限がありません' });
        return;
      }
      
      // 今日の日付 (日本時間)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // User.teamIdを使用したチームメンバーのユーザーID一覧を取得（標準化された方法）
      const teamMembers = await User.find({ teamId: teamId });
      const memberIds = teamMembers.map(member => member._id);
      
      // チームメンバー全員の今日の運勢を取得
      const fortunes = await DailyFortune.find({
        userId: { $in: memberIds },
        date: {
          $gte: today,
          $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
        }
      }).lean();
      
      // 各メンバーの詳細情報を取得
      const memberDetails = await User.find({ _id: { $in: memberIds } }).lean();
      
      // 重複するユーザーIDを防ぐために、最新/最高スコアのみを使用
      const userIdToFortuneMap = new Map();
      
      // 各ユーザーの最新/最高スコアの運勢を選択
      fortunes.forEach(fortune => {
        const userId = fortune.userId.toString();
        // まだそのユーザーの運勢がマップになければ追加
        if (!userIdToFortuneMap.has(userId)) {
          userIdToFortuneMap.set(userId, fortune);
        } else {
          // すでに存在する場合、より新しい日付の運勢を優先
          const existingFortune = userIdToFortuneMap.get(userId);
          if (new Date(fortune.date) > new Date(existingFortune.date)) {
            userIdToFortuneMap.set(userId, fortune);
          }
        }
      });
      
      // マップから重複のない運勢データの配列を作成
      const uniqueFortunes = Array.from(userIdToFortuneMap.values());
      
      // 運勢ランキングデータを作成（重複排除後）
      const ranking = uniqueFortunes.map(fortune => {
        const member = memberDetails.find(m => m._id && m._id.toString() === fortune.userId.toString());
        return {
          userId: fortune.userId,
          displayName: member?.displayName || '不明なユーザー',
          score: fortune.fortuneScore, // スコア
          elementAttribute: member?.elementAttribute || 'unknown',
          jobTitle: member?.teamRole || member?.jobTitle || '',
          isCurrentUser: fortune.userId.toString() === userId
        };
      });
      
      // スコアの降順で並べ替え
      ranking.sort((a, b) => b.score - a.score);
      
      // 順位を追加
      const rankedList = ranking.map((item, index) => ({
        ...item,
        rank: index + 1
      }));
      
      // レスポンスを返す
      res.status(200).json({
        success: true,
        data: {
          teamId,
          teamName: team.name,
          date: today,
          nextUpdateTime: '03:00', // 次回更新時刻（固定）
          ranking: rankedList
        }
      });
    } catch (error: any) {
      console.error('チーム運勢ランキング取得エラー:', error);
      res.status(500).json({ error: 'サーバーエラーが発生しました' });
    }
  }


  /**
   * 運勢ダッシュボード情報を取得する
   * @param req リクエスト - クエリパラメータとしてteamId(オプション)を受け付ける
   * @param res レスポンス
   */
  public async getFortuneDashboard(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: '認証されていません' });
        return;
      }

      // ユーザー情報を取得して四柱推命プロファイルの存在を確認
      const user = await User.findById(userId);
      if (!user) {
        res.status(404).json({ error: 'ユーザーが見つかりません' });
        return;
      }

      // 四柱推命データの存在チェック
      if (!user.elementAttribute || !user.dayMaster || !user.fourPillars) {
        console.log(`🌟 警告: ユーザー ${userId} の四柱推命情報が不足しています`);
        res.status(400).json({ 
          error: 'ユーザーの四柱推命情報が見つかりません', 
          code: 'MISSING_SAJU_PROFILE' 
        });
        return;
      }

      // チームIDパラメータの取得（オプション）
      const teamId = req.query.teamId as string | undefined;

      // ダッシュボード情報を取得
      console.log(`🌟 運勢ダッシュボード取得開始 - userId: ${userId}, teamId: ${teamId || 'なし'}`);
      const dashboardData = await fortuneService.getFortuneDashboard(userId, teamId);
      console.log(`🌟 運勢ダッシュボード取得完了:`, {
        hasPersonalFortune: !!dashboardData.personalFortune,
        personalFortuneId: dashboardData.personalFortune?.id,
        personalFortuneDate: dashboardData.personalFortune?.date
      });

      // レスポンス送信前の最終チェック
      if (!dashboardData.personalFortune) {
        console.error(`🌟 警告: personalFortune がありません！`);
      } else if (typeof dashboardData.personalFortune.advice !== 'string' || dashboardData.personalFortune.advice.length < 10) {
        console.error(`🌟 警告: personalFortune.advice が不正です: ${dashboardData.personalFortune.advice}`);
      }

      res.status(200).json(dashboardData);
    } catch (error: any) {
      console.error('運勢ダッシュボード取得エラー:', error);
      if (error.message.includes('四柱推命情報が見つかりません')) {
        // 四柱推命情報がない場合は400エラー（クライアント側でプロフィール設定を促すため）
        res.status(400).json({ 
          error: error.message, 
          code: 'MISSING_SAJU_PROFILE' 
        });
      } else if (error.message.includes('見つかりません')) {
        res.status(404).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'サーバーエラーが発生しました' });
      }
    }
  }
}

// コントローラーのインスタンスをエクスポート
export const fortuneController = new FortuneController();
