import { Router } from 'express';
import { hybridAuthenticate } from '../middleware/hybrid-auth.middleware';
import { UserController } from '../controllers/users.controller';

const router = Router();
const userController = new UserController();

/**
 * @swagger
 * /api/v1/users/profile:
 *   get:
 *     summary: ユーザープロフィールを取得
 *     description: 認証されたユーザー自身のプロフィール情報を取得します
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: ユーザープロフィール
 *       401:
 *         description: 認証されていません
 */
// ハイブリッド認証に移行中の段階的対応：
// - 既存の認証(authenticate)を残す場合: router.get('/profile', authenticate, userController.getProfile);
// - ハイブリッド認証に切り替える場合: 
router.get('/profile', hybridAuthenticate, userController.getProfile);

/**
 * @swagger
 * /api/v1/users/profile:
 *   put:
 *     summary: ユーザープロフィールを更新（統合エンドポイント）
 *     description: 認証されたユーザー自身のプロフィール情報を更新します。基本情報、生年月日情報、四柱推命計算を1つのリクエストで処理可能です。
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               # 基本情報
 *               displayName:
 *                 type: string
 *                 example: "新しい表示名"
 *               jobTitle:
 *                 type: string
 *                 example: "エンジニア"
 *               goal:
 *                 type: string
 *                 example: "2025年までに副業で月収10万円を達成する"
 *               # 生年月日情報
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
 *               birthplaceCoordinates:
 *                 type: object
 *                 properties:
 *                   longitude:
 *                     type: number
 *                     example: 139.6917
 *                   latitude:
 *                     type: number
 *                     example: 35.6895
 *               localTimeOffset:
 *                 type: number
 *                 example: 18
 *               # 更新オプション
 *               calculateSaju:
 *                 type: boolean
 *                 description: 四柱推命情報を再計算するかどうか
 *                 example: true
 *     responses:
 *       200:
 *         description: プロフィールが更新されました
 *       400:
 *         description: 入力データが不正です
 *       401:
 *         description: 認証されていません
 */
router.put('/profile', hybridAuthenticate, userController.updateProfile);

/**
 * @swagger
 * /api/v1/users/profile/patch:
 *   patch:
 *     summary: ユーザープロフィールを部分更新
 *     description: 認証されたユーザー自身のプロフィール情報を部分的に更新します。送信されたフィールドのみが更新されます。
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               displayName:
 *                 type: string
 *               jobTitle:
 *                 type: string
 *               goal:
 *                 type: string
 *               birthDate:
 *                 type: string
 *                 format: date
 *               birthTime:
 *                 type: string
 *               birthPlace:
 *                 type: string
 *               gender:
 *                 type: string
 *                 enum: [M, F]
 *               calculateSaju:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: プロフィールが更新されました
 *       400:
 *         description: 入力データが不正です
 *       401:
 *         description: 認証されていません
 */
router.patch('/profile', hybridAuthenticate, userController.updateProfile);

/**
 * @swagger
 * /api/v1/users/email:
 *   put:
 *     summary: ユーザーのメールアドレスを更新
 *     description: 認証されたユーザー自身のメールアドレスを更新します
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "new-email@example.com"
 *     responses:
 *       200:
 *         description: メールアドレスが更新されました
 *       400:
 *         description: 入力データが不正です
 *       401:
 *         description: 認証されていません
 */
router.put('/email', hybridAuthenticate, userController.updateEmail);

/**
 * @swagger
 * /api/v1/users/birth-info:
 *   put:
 *     summary: 生年月日情報を更新
 *     description: 認証されたユーザーの生年月日情報を更新します
 *     tags: [User]
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
 *               birthplaceCoordinates:
 *                 type: object
 *                 properties:
 *                   longitude:
 *                     type: number
 *                     example: 139.6917
 *                   latitude:
 *                     type: number
 *                     example: 35.6895
 *               localTimeOffset:
 *                 type: number
 *                 example: 18
 *     responses:
 *       200:
 *         description: 生年月日情報が更新されました
 *       400:
 *         description: 入力データが不正です
 *       401:
 *         description: 認証されていません
 */
router.put('/birth-info', hybridAuthenticate, userController.updateBirthInfo);

/**
 * @swagger
 * /api/v1/users/calculate-saju:
 *   post:
 *     summary: 四柱推命情報を計算
 *     description: 保存されている生年月日情報をもとに四柱推命情報を計算して更新します
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 四柱推命情報が計算され、更新されました
 *       400:
 *         description: 生年月日情報が不足しています
 *       401:
 *         description: 認証されていません
 */
router.post('/calculate-saju', hybridAuthenticate, userController.calculateSaju);

export default router;