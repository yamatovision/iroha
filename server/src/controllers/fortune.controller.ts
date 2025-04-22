import { Request, Response } from 'express';
import { fortuneService } from '../services/fortune.service';
import { teamContextFortuneService } from '../services/team-context-fortune.service';
import { AuthRequest } from '../middleware/auth.middleware';
import { Team } from '../models/Team';
import { User } from '../models/User';
import { DailyFortune } from '../models/DailyFortune';
import { TeamMembership } from '../models/TeamMembership';

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

      // クエリパラメータから日付とタイムゾーン情報を取得
      const dateParam = req.query.date as string;
      // タイムゾーン情報を取得（クライアントから送信された場合）
      const timezone = req.query.timezone as string || 'Asia/Tokyo';
      const tzOffset = parseInt(req.query.tzOffset as string || '-540', 10);
      
      let targetDate: Date | undefined;

      if (dateParam) {
        // 日付形式のバリデーション
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(dateParam)) {
          res.status(400).json({ error: '無効な日付フォーマットです。YYYY-MM-DD形式で指定してください。' });
          return;
        }
        targetDate = new Date(dateParam);
      } else {
        // 日付が指定されていない場合は、クライアントのタイムゾーンに合わせた「今日」を計算
        const now = new Date();
        // tzOffsetはマイナス値で渡されるため、反転して適用
        const offsetHours = Math.floor(Math.abs(tzOffset) / 60);
        const offsetMinutes = Math.abs(tzOffset) % 60;
        
        // タイムゾーンオフセットを適用（日本時間の場合、+9時間）
        if (tzOffset < 0) {
          now.setHours(now.getHours() + offsetHours);
          now.setMinutes(now.getMinutes() + offsetMinutes);
        } else {
          now.setHours(now.getHours() - offsetHours);
          now.setMinutes(now.getMinutes() - offsetMinutes);
        }
        
        targetDate = now;
        console.log(`🕒 クライアントタイムゾーン: ${timezone}, オフセット: ${tzOffset}分, 計算された日付: ${targetDate.toISOString()}`);
      }

      // 日付または今日の運勢を取得（今日の場合も明示的に日付を渡す）
      const fortune = await fortuneService.getUserFortune(userId, targetDate);

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
      console.log('=== チーム運勢ランキング取得開始 ===');
      const userId = req.user?.id;
      if (!userId) {
        console.log('認証エラー: ユーザーIDが見つかりません');
        res.status(401).json({ error: '認証されていません' });
        return;
      }
      console.log(`リクエストユーザーID: ${userId}`);

      const { teamId } = req.params;
      console.log(`チームID: ${teamId}`);
      
      // チームが存在するか確認
      const team = await Team.findById(teamId);
      if (!team) {
        console.log(`チームが見つかりません: ${teamId}`);
        res.status(404).json({ error: 'チームが見つかりません' });
        return;
      }
      console.log(`チーム名: ${team.name}`);
      
      // TeamMembershipモデルを使用してチームメンバーかどうかを確認
      const membership = await TeamMembership.findOne({ 
        teamId, 
        userId 
      });
      
      if (!membership) {
        console.log(`ユーザーはチームメンバーではありません: userId=${userId}, teamId=${teamId}`);
        res.status(403).json({ error: 'このチームのデータにアクセスする権限がありません' });
        return;
      }
      console.log(`ユーザーのチームメンバーシップ確認: role=${membership.role}, memberRole=${membership.memberRole}`);
      
      // 今日の日付 (日本時間)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      console.log(`今日の日付: ${today.toISOString()}`);
      
      // TeamMembershipを使用したチームメンバーのユーザーID一覧を取得（新しいデータモデルに基づいた方法）
      const teamMemberships = await TeamMembership.find({ teamId });
      console.log(`チームメンバーシップ数: ${teamMemberships.length}`);
      
      // デバッグ: メンバーシップ情報の表示
      teamMemberships.forEach((membership, index) => {
        console.log(`メンバー ${index+1}: userId=${membership.userId}, role=${membership.role}`);
      });
      
      const memberIds = teamMemberships.map(membership => membership.userId);
      console.log(`チームメンバーID一覧: ${memberIds.length}件`);
      
      // チームメンバー全員の今日の運勢を取得
      const fortunes = await DailyFortune.find({
        userId: { $in: memberIds },
        date: {
          $gte: today,
          $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
        }
      }).lean();
      
      console.log(`運勢データ取得結果: ${fortunes.length}件のデータが見つかりました`);
      
      // デバッグ: 運勢データの表示
      fortunes.forEach((fortune, index) => {
        console.log(`運勢データ ${index+1}: userId=${fortune.userId}, date=${new Date(fortune.date).toISOString()}, score=${fortune.fortuneScore}`);
      });
      
      // 各メンバーの詳細情報を取得
      const memberDetails = await User.find({ _id: { $in: memberIds } }).lean();
      console.log(`メンバー詳細情報: ${memberDetails.length}件のユーザー情報が見つかりました`);
      
      // 重複するユーザーIDを防ぐために、最新/最高スコアのみを使用
      const userIdToFortuneMap = new Map();
      
      // 各ユーザーの最新/最高スコアの運勢を選択
      fortunes.forEach(fortune => {
        const userId = fortune.userId.toString();
        // まだそのユーザーの運勢がマップになければ追加
        if (!userIdToFortuneMap.has(userId)) {
          userIdToFortuneMap.set(userId, fortune);
          console.log(`ユーザー ${userId} の運勢データを追加: score=${fortune.fortuneScore}`);
        } else {
          // すでに存在する場合、より新しい日付の運勢を優先
          const existingFortune = userIdToFortuneMap.get(userId);
          if (new Date(fortune.date) > new Date(existingFortune.date)) {
            console.log(`ユーザー ${userId} の運勢データを更新: 古いscore=${existingFortune.fortuneScore} -> 新しいscore=${fortune.fortuneScore}`);
            userIdToFortuneMap.set(userId, fortune);
          }
        }
      });
      
      // マップから重複のない運勢データの配列を作成
      const uniqueFortunes = Array.from(userIdToFortuneMap.values());
      console.log(`重複排除後の運勢データ: ${uniqueFortunes.length}件`);
      
      // 運勢ランキングデータを作成（重複排除後）
      const ranking = uniqueFortunes.map(fortune => {
        const member = memberDetails.find(m => m._id && m._id.toString() === fortune.userId.toString());
        const isCurrentUser = fortune.userId.toString() === userId;
        console.log(`ランキングデータ作成: userId=${fortune.userId}, displayName=${member?.displayName || '不明'}, score=${fortune.fortuneScore}, isCurrentUser=${isCurrentUser}`);
        return {
          userId: fortune.userId,
          displayName: member?.displayName || '不明なユーザー',
          score: fortune.fortuneScore, // スコア
          elementAttribute: member?.elementAttribute || 'unknown',
          jobTitle: member?.role || member?.jobTitle || '',
          isCurrentUser: isCurrentUser
        };
      });
      
      // スコアの降順で並べ替え
      ranking.sort((a, b) => b.score - a.score);
      console.log(`ソート後のランキング: ${ranking.length}件`);
      
      // 順位を追加
      const rankedList = ranking.map((item, index) => {
        console.log(`ランク ${index+1}: ${item.displayName} (${item.userId}), score=${item.score}, isCurrentUser=${item.isCurrentUser}`);
        return {
          ...item,
          rank: index + 1
        };
      });
      
      // レスポンスを返す
      console.log(`ランキングデータサイズ: ${rankedList.length}件`);
      
      // 最終チェック: もしランキングが空なら、なぜ空なのかの情報を追加
      let debugInfo = {};
      if (rankedList.length === 0) {
        debugInfo = {
          debug: {
            teamMembersCount: teamMemberships.length,
            fortunesCount: fortunes.length,
            memberDetailsCount: memberDetails.length,
            today: today.toISOString(),
            currentUserId: userId
          }
        };
        console.log('警告: ランキングデータが空です。デバッグ情報:', debugInfo);
      }
      
      res.status(200).json({
        success: true,
        data: {
          teamId,
          teamName: team.name,
          date: today,
          nextUpdateTime: '03:00', // 次回更新時刻（固定）
          ranking: rankedList,
          ...debugInfo  // デバッグ情報を追加（ランキングが空の場合のみ）
        }
      });
      console.log('=== チーム運勢ランキング取得完了 ===');
    } catch (error: any) {
      console.error('チーム運勢ランキング取得エラー:', error);
      res.status(500).json({ error: 'サーバーエラーが発生しました' });
    }
  }



  /**
   * チームコンテキスト運勢を取得する
   * @param req リクエスト - パラメータとしてteamIdを受け付ける
   * @param res レスポンス
   */
  public async getTeamContextFortune(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: '認証されていません' });
        return;
      }
      
      const { teamId } = req.params;
      if (!teamId) {
        res.status(400).json({ error: 'チームIDが指定されていません' });
        return;
      }
      
      // チームメンバーシップ確認
      const membership = await TeamMembership.findOne({
        userId,
        teamId
      });
      
      if (!membership) {
        res.status(403).json({ error: 'このチームにアクセスする権限がありません' });
        return;
      }
      
      // 日付パラメータ取得
      const dateParam = req.query.date as string;
      
      try {
        // チームコンテキスト運勢を取得（存在しない場合は生成）
        const result = await teamContextFortuneService.getTeamContextFortune(userId, teamId, dateParam);
        res.json(result);
      } catch (error: any) {
        // API未実装または開発中の場合
        if (error.message && (
          error.message.includes('未実装') || 
          error.message.includes('開発中')
        )) {
          res.status(404).json({
            success: false,
            code: 'FEATURE_NOT_IMPLEMENTED',
            message: 'チームコンテキスト運勢機能は現在実装中です'
          });
        } else {
          throw error; // 他のエラーは再スロー
        }
      }
    } catch (error: any) {
      console.error('チームコンテキスト運勢取得エラー:', error);
      if (error.message.includes('見つかりません')) {
        res.status(404).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'サーバーエラーが発生しました' });
      }
    }
  }
  
  /**
   * チームコンテキスト運勢を生成する
   * @param req リクエスト - パラメータとしてteamIdを受け付ける
   * @param res レスポンス
   */
  public async generateTeamContextFortune(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: '認証されていません' });
        return;
      }
      
      const { teamId } = req.params;
      if (!teamId) {
        res.status(400).json({ error: 'チームIDが指定されていません' });
        return;
      }
      
      // チームメンバーシップと管理者権限確認
      const membership = await TeamMembership.findOne({
        userId,
        teamId
      });
      
      if (!membership) {
        res.status(403).json({ error: 'このチームにアクセスする権限がありません' });
        return;
      }
      
      // 日付パラメータ取得
      const dateParam = req.query.date as string;
      const date = dateParam ? new Date(dateParam) : new Date();
      
      // チームコンテキスト運勢を生成
      const teamContextFortune = await teamContextFortuneService.generateTeamContextFortune(userId, teamId, date);
      
      res.status(201).json({ teamContextFortune });
    } catch (error: any) {
      console.error('チームコンテキスト運勢生成エラー:', error);
      if (error.message.includes('見つかりません')) {
        res.status(404).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'サーバーエラーが発生しました' });
      }
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
      
      // タイムゾーン情報を取得（クライアントから送信された場合）
      const timezone = req.query.timezone as string || 'Asia/Tokyo';
      const tzOffset = parseInt(req.query.tzOffset as string || '-540', 10);
      
      // 日付が指定されていない場合は、クライアントのタイムゾーンに合わせた「今日」を計算
      const now = new Date();
      // tzOffsetはマイナス値で渡されるため、反転して適用
      const offsetHours = Math.floor(Math.abs(tzOffset) / 60);
      const offsetMinutes = Math.abs(tzOffset) % 60;
      
      // タイムゾーンオフセットを適用（日本時間の場合、+9時間）
      if (tzOffset < 0) {
        now.setHours(now.getHours() + offsetHours);
        now.setMinutes(now.getMinutes() + offsetMinutes);
      } else {
        now.setHours(now.getHours() - offsetHours);
        now.setMinutes(now.getMinutes() - offsetMinutes);
      }
      
      // 計算された「今日」の日付
      const targetDate = now;
      console.log(`🕒 ダッシュボード取得: クライアントタイムゾーン: ${timezone}, オフセット: ${tzOffset}分, 計算された日付: ${targetDate.toISOString()}`);

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
