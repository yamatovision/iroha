import { Router } from 'express';
import { fortuneController } from '../controllers/fortune.controller';
import { hybridAuthenticate } from '../middleware/hybrid-auth.middleware';

const router = Router();

/**
 * @swagger
 * /api/v1/fortune/daily:
 *   get:
 *     summary: 今日の運勢を取得する
 *     description: ログインユーザーの今日の運勢情報を取得します。クエリパラメータで日付を指定することも可能です。
 *     tags:
 *       - Fortune
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: 取得したい日付 (YYYY-MM-DD形式)。指定がない場合は今日の日付
 *     responses:
 *       200:
 *         description: 運勢情報を取得しました
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Fortune'
 *       401:
 *         description: 認証エラー
 *       404:
 *         description: 運勢データが見つかりません
 *       500:
 *         description: サーバーエラー
 */
router.get('/daily', hybridAuthenticate, fortuneController.getDailyFortune);

/**
 * @swagger
 * /api/v1/fortune/team/{teamId}/ranking:
 *   get:
 *     summary: チームの運勢ランキングを取得する
 *     description: 特定チームのメンバー全員の今日の運勢ランキングを取得します。
 *     tags:
 *       - Fortune
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: teamId
 *         required: true
 *         schema:
 *           type: string
 *         description: チームID
 *     responses:
 *       200:
 *         description: チーム運勢ランキングを取得しました
 *       401:
 *         description: 認証エラー
 *       403:
 *         description: 権限エラー
 *       404:
 *         description: チームが見つかりません
 *       500:
 *         description: サーバーエラー
 */
router.get('/team/:teamId/ranking', hybridAuthenticate, fortuneController.getTeamFortuneRanking);



/**
 * @swagger
 * /api/v1/fortune/dashboard:
 *   get:
 *     summary: 運勢ダッシュボード情報を取得する
 *     description: 個人運勢とチームコンテキスト運勢を統合したダッシュボード情報を取得します。
 *     tags:
 *       - Fortune
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: teamId
 *         schema:
 *           type: string
 *         description: チームID（指定がない場合はユーザーのデフォルトチーム）
 *     responses:
 *       200:
 *         description: 運勢ダッシュボード情報を取得しました
 *       401:
 *         description: 認証エラー
 *       404:
 *         description: データが見つかりません
 *       500:
 *         description: サーバーエラー
 */
router.get('/dashboard', hybridAuthenticate, fortuneController.getFortuneDashboard);

// スーパー管理者のみがアクセスできる運勢更新（生成）エンドポイント
// 通常は管理者用ルート（/api/v1/admin/...）に移動させるべき
router.post('/update-fortune', hybridAuthenticate, fortuneController.generateFortune);

export default router;
