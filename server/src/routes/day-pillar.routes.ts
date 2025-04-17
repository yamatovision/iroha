import { Router } from 'express';
import { 
  getTodayDayPillar, 
  getDayPillarByDate, 
  getDayPillarRange,
  getTimezoneInfo,
  getAvailableCities
} from '../controllers/day-pillar.controller';
import { hybridAuthenticate } from '../middleware/hybrid-auth.middleware';

const router = Router();

/**
 * @swagger
 * /api/v1/day-pillars/today:
 *   get:
 *     summary: 今日の日柱情報を取得
 *     description: 現在の日付の日柱情報を取得します
 *     tags: [DayPillar]
 *     responses:
 *       200:
 *         description: 今日の日柱情報
 */
router.get('/today', getTodayDayPillar);

/**
 * @swagger
 * /api/v1/day-pillars/timezone-info:
 *   get:
 *     summary: タイムゾーン情報を取得
 *     description: 指定された位置情報のタイムゾーン情報を取得します
 *     tags: [DayPillar]
 *     parameters:
 *       - in: query
 *         name: location
 *         required: true
 *         schema:
 *           type: string
 *         description: 都市名、または座標情報のJSON文字列
 *     responses:
 *       200:
 *         description: タイムゾーン情報
 *       400:
 *         description: 無効な位置情報フォーマットです
 */
router.get('/timezone-info', getTimezoneInfo);

/**
 * @swagger
 * /api/v1/day-pillars/available-cities:
 *   get:
 *     summary: 利用可能な都市リストを取得
 *     description: サポートされている都市のリストを取得します
 *     tags: [DayPillar]
 *     responses:
 *       200:
 *         description: 利用可能な都市リスト
 */
router.get('/available-cities', getAvailableCities);

/**
 * @swagger
 * /api/v1/day-pillars/{date}:
 *   get:
 *     summary: 特定の日付の日柱情報を取得
 *     description: 指定された日付の日柱情報を取得します
 *     tags: [DayPillar]
 *     parameters:
 *       - in: path
 *         name: date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: YYYY-MM-DD形式の日付
 *     responses:
 *       200:
 *         description: 指定日の日柱情報
 *       400:
 *         description: 無効な日付フォーマットです
 */
router.get('/:date', getDayPillarByDate);

/**
 * @swagger
 * /api/v1/day-pillars:
 *   get:
 *     summary: 日付範囲の日柱情報を取得（管理者用）
 *     description: 指定された日付範囲の日柱情報を取得します（管理者権限が必要）
 *     tags: [DayPillar]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: 開始日（YYYY-MM-DD形式）
 *       - in: query
 *         name: endDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: 終了日（YYYY-MM-DD形式）
 *     responses:
 *       200:
 *         description: 日付範囲の日柱情報
 *       400:
 *         description: 入力データが不正です
 *       401:
 *         description: 認証されていません
 *       403:
 *         description: 管理者権限が必要です
 */
router.get('/', hybridAuthenticate, getDayPillarRange);

export default router;