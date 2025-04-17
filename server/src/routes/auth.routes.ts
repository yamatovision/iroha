import express from 'express';
import { JwtAuthController } from '../controllers/jwt-auth.controller';
import { hybridAuthenticate } from '../middleware/hybrid-auth.middleware';

const router = express.Router();

/**
 * 認証関連のルート定義 (Firebase認証は廃止され、JWT認証を使用)
 */

// 新規ユーザー登録
router.post('/register', JwtAuthController.register);

// ログイン
router.post('/login', JwtAuthController.login);

// トークンのリフレッシュ
router.post('/refresh-token', JwtAuthController.refreshToken);

// ログアウト
router.post('/logout', JwtAuthController.logout);

// Firebase認証からJWT認証への移行（廃止予定 - 後方互換性のために残す）
router.post('/migrate-to-jwt', hybridAuthenticate, JwtAuthController.migrateToJwt);

// プロフィール取得
router.get('/profile', hybridAuthenticate, JwtAuthController.getProfile);

export default router;