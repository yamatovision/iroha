// @ts-nocheck
import { Router } from 'express';
import { 
  createSajuProfile, 
  getMyProfile,
  getMyProfileDetails,
  getUserProfile, 
  updateSajuProfile, 
  getUsersByElement
} from '../controllers/saju-profile.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

/**
 * @swagger
 * /api/v1/saju-profiles:
 *   post:
 *     summary: 四柱推命プロフィールを作成
 *     description: ユーザーの出生データに基づいて四柱推命プロフィールを作成します
 *     tags: [SajuProfile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - birthDate
 *               - birthTime
 *               - birthPlace
 *               - gender
 *             properties:
 *               birthDate:
 *                 type: string
 *                 format: date
 *                 example: "1990-01-15"
 *               birthTime:
 *                 type: string
 *                 pattern: "^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$"
 *                 example: "13:30"
 *               birthPlace:
 *                 type: string
 *                 example: "Tokyo, Japan"
 *               gender:
 *                 type: string
 *                 enum: [M, F]
 *                 example: "M"
 *     responses:
 *       201:
 *         description: 四柱推命プロフィールが作成されました
 *       400:
 *         description: 入力データが不正です
 *       401:
 *         description: 認証されていません
 *       409:
 *         description: 既にプロフィールが存在します
 */
router.post('/', authenticate, createSajuProfile);

/**
 * @swagger
 * /api/v1/saju-profiles/me:
 *   get:
 *     summary: 自分の四柱推命プロフィールを取得
 *     description: 認証されたユーザー自身の四柱推命プロフィールを取得します
 *     tags: [SajuProfile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 四柱推命プロフィール
 *       401:
 *         description: 認証されていません
 *       404:
 *         description: プロフィールが見つかりません
 */
router.get('/me', authenticate, getMyProfile);

/**
 * @swagger
 * /api/v1/saju-profiles/me/details:
 *   get:
 *     summary: 自分の四柱推命プロフィール編集用の詳細データを取得
 *     description: 認証されたユーザー自身の四柱推命プロフィール編集に必要な詳細データを取得します
 *     tags: [SajuProfile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 四柱推命プロフィール詳細データ
 *       401:
 *         description: 認証されていません
 *       404:
 *         description: プロフィールが見つかりません
 */
router.get('/me/details', authenticate, getMyProfileDetails);

/**
 * @swagger
 * /api/v1/saju-profiles/{userId}:
 *   get:
 *     summary: 特定ユーザーの四柱推命プロフィールを取得
 *     description: 指定されたユーザーの四柱推命プロフィールを取得します（アクセス制御あり）
 *     tags: [SajuProfile]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ユーザーID
 *     responses:
 *       200:
 *         description: 四柱推命プロフィール
 *       401:
 *         description: 認証されていません
 *       403:
 *         description: アクセス権限がありません
 *       404:
 *         description: プロフィールが見つかりません
 */
router.get('/:userId', authenticate, getUserProfile);

/**
 * @swagger
 * /api/v1/saju-profiles:
 *   put:
 *     summary: 四柱推命プロフィールを更新
 *     description: ユーザーの四柱推命プロフィールを更新します
 *     tags: [SajuProfile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - birthDate
 *               - birthTime
 *               - birthPlace
 *               - gender
 *             properties:
 *               birthDate:
 *                 type: string
 *                 format: date
 *                 example: "1990-01-15"
 *               birthTime:
 *                 type: string
 *                 pattern: "^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$"
 *                 example: "13:30"
 *               birthPlace:
 *                 type: string
 *                 example: "Tokyo, Japan"
 *               gender:
 *                 type: string
 *                 enum: [M, F]
 *                 example: "M"
 *     responses:
 *       200:
 *         description: 四柱推命プロフィールが更新されました
 *       400:
 *         description: 入力データが不正です
 *       401:
 *         description: 認証されていません
 *       404:
 *         description: プロフィールが見つかりません
 */
router.put('/', authenticate, updateSajuProfile);

/**
 * @swagger
 * /api/v1/saju-profiles/element/{element}:
 *   get:
 *     summary: 特定の五行属性を持つユーザープロフィールを検索
 *     description: 指定された五行属性を持つユーザープロフィールを検索します
 *     tags: [SajuProfile]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: element
 *         required: true
 *         schema:
 *           type: string
 *           enum: [wood, fire, earth, metal, water]
 *         description: 五行属性
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: 取得件数上限
 *     responses:
 *       200:
 *         description: 五行属性に一致するプロフィール一覧
 *       400:
 *         description: 入力データが不正です
 *       401:
 *         description: 認証されていません
 */
router.get('/element/:element', authenticate, getUsersByElement);


export default router;