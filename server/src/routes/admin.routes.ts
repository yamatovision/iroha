import { Router } from 'express';
import * as adminController from '../controllers/admin';
import { hybridAuthenticate, requireSuperAdmin } from '../middleware/hybrid-auth.middleware';
import { ADMIN } from '../types/index';

const router = Router();

// ======== ユーザー管理API ========

// ユーザー一覧取得（SuperAdmin専用）
router.get(
  '/admins',
  hybridAuthenticate,
  requireSuperAdmin,
  adminController.getUsers
);

// 新規ユーザー作成
router.post(
  '/admins',
  hybridAuthenticate,
  requireSuperAdmin,
  adminController.createUser
);

// ユーザー権限変更（SuperAdmin専用）
router.put(
  '/admins/:userId/role',
  hybridAuthenticate,
  requireSuperAdmin,
  adminController.updateUserRole
);

// ユーザープラン変更（SuperAdmin専用）
router.put(
  '/admins/:userId/plan',
  hybridAuthenticate,
  requireSuperAdmin,
  adminController.updateUserPlan
);

// ユーザー削除（SuperAdmin専用）
router.delete(
  '/admins/:userId',
  hybridAuthenticate,
  requireSuperAdmin,
  adminController.deleteUser
);

// ======== 運勢更新設定API ========

// 運勢更新設定取得
router.get(
  '/settings/fortune-update',
  hybridAuthenticate,
  requireSuperAdmin,
  adminController.getFortuneUpdateSettings
);

// 運勢更新設定更新（SuperAdmin専用）
router.put(
  '/settings/fortune-update',
  hybridAuthenticate,
  requireSuperAdmin,
  adminController.updateFortuneUpdateSettings
);

// 運勢更新ログ一覧取得（SuperAdmin専用）
router.get(
  '/settings/fortune-updates/logs',
  hybridAuthenticate,
  requireSuperAdmin,
  adminController.getFortuneUpdateLogs
);

// 運勢更新ログ詳細取得（SuperAdmin専用）
router.get(
  '/settings/fortune-updates/logs/:logId',
  hybridAuthenticate,
  requireSuperAdmin,
  adminController.getFortuneUpdateLogDetail
);

// 手動運勢更新実行（SuperAdmin専用）
router.post(
  '/settings/fortune-updates/manual-run',
  hybridAuthenticate,
  requireSuperAdmin,
  adminController.runFortuneUpdate
);

// ======== 日柱管理API ========

// 日柱生成ログ一覧取得（SuperAdmin専用）
router.get(
  '/settings/day-pillars/logs',
  hybridAuthenticate,
  requireSuperAdmin,
  adminController.getDayPillarLogs
);

// 日柱生成ログ詳細取得（SuperAdmin専用）
router.get(
  '/settings/day-pillars/logs/:logId',
  hybridAuthenticate,
  requireSuperAdmin,
  adminController.getDayPillarLogDetail
);

// 既存の日柱情報一覧取得（SuperAdmin専用）
router.get(
  '/settings/day-pillars',
  hybridAuthenticate,
  requireSuperAdmin,
  adminController.getDayPillars
);

// 手動日柱生成実行（SuperAdmin専用）
router.post(
  '/settings/day-pillars/manual-run',
  hybridAuthenticate,
  requireSuperAdmin,
  adminController.runDayPillarGeneration
);

// ======== 認証管理API ========

// 認証システム統計取得（SuperAdmin専用）
router.get(
  '/settings/auth/stats',
  hybridAuthenticate,
  requireSuperAdmin,
  adminController.getAuthStats
);

// 特定ユーザーの認証状態取得（SuperAdmin専用）
router.get(
  '/settings/auth/users/:userId',
  hybridAuthenticate,
  requireSuperAdmin,
  adminController.getUserAuthState
);

// 特定ユーザーのトークン無効化（SuperAdmin専用）
router.post(
  '/settings/auth/users/:userId/invalidate',
  hybridAuthenticate,
  requireSuperAdmin,
  adminController.invalidateUserTokens
);

// 移行統計取得（SuperAdmin専用）
router.get(
  '/settings/auth/migration',
  hybridAuthenticate,
  requireSuperAdmin,
  adminController.getMigrationStats
);

// トークンクリーンアップ実行（SuperAdmin専用）
router.post(
  '/settings/auth/cleanup',
  hybridAuthenticate,
  requireSuperAdmin,
  adminController.runTokenCleanup
);

export default router;