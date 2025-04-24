import { Router } from 'express';
import { chatController } from '../controllers/chat.controller';
import { hybridAuthenticate } from '../middleware/hybrid-auth.middleware';

// チャットルーター
const router = Router();

/**
 * メッセージを送信するエンドポイント
 * POST /api/v1/chat/message
 */
router.post('/message', hybridAuthenticate, chatController.sendMessage);

/**
 * チャット履歴を取得するエンドポイント
 * GET /api/v1/chat/history
 */
router.get('/history', hybridAuthenticate, chatController.getHistory);

/**
 * チャット履歴をクリアするエンドポイント
 * DELETE /api/v1/chat/clear
 */
router.delete('/clear', hybridAuthenticate, chatController.clearHistory);

/**
 * チャットモードを設定するエンドポイント（レガシー）
 * PUT /api/v1/chat/mode
 */
router.put('/mode', hybridAuthenticate, chatController.setMode);

/**
 * 利用可能なコンテキスト情報を取得するエンドポイント（新規）
 * GET /api/v1/chat/contexts/available
 */
router.get('/contexts/available', hybridAuthenticate, chatController.getAvailableContexts);

/**
 * コンテキスト詳細情報を取得するエンドポイント（新規）
 * GET /api/v1/chat/contexts/detail
 */
router.get('/contexts/detail', hybridAuthenticate, chatController.getContextDetail);

export default router;