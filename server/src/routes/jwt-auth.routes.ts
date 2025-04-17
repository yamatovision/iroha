import express from 'express';
import { JwtAuthController } from '../controllers/jwt-auth.controller';
import { hybridAuthenticate } from '../middleware/hybrid-auth.middleware';

const router = express.Router();

/**
 * JWT認証関連のルート定義
 */

// 新規ユーザー登録
router.post('/register', JwtAuthController.register);

// ログイン
router.post('/login', JwtAuthController.login);

// トークンのリフレッシュ
router.post('/refresh-token', JwtAuthController.refreshToken);

// ログアウト
router.post('/logout', JwtAuthController.logout);

// Firebase認証からJWT認証への移行（廃止予定 - 移行完了後）
router.post('/migrate-to-jwt', hybridAuthenticate, JwtAuthController.migrateToJwt);

export default router;