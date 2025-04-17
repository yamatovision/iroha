import { Router } from 'express';
import { chatController } from '../controllers/chat.controller';
import { authenticate } from '../middleware/auth.middleware';

// チャットルーター
const router = Router();

/**
 * メッセージを送信するエンドポイント
 * POST /api/v1/chat/message
 */
router.post('/message', authenticate, chatController.sendMessage);

/**
 * チャット履歴を取得するエンドポイント
 * GET /api/v1/chat/history
 */
router.get('/history', authenticate, chatController.getHistory);

/**
 * チャット履歴をクリアするエンドポイント
 * DELETE /api/v1/chat/clear
 */
router.delete('/clear', authenticate, chatController.clearHistory);

/**
 * チャットモードを設定するエンドポイント
 * PUT /api/v1/chat/mode
 */
router.put('/mode', authenticate, chatController.setMode);

export default router;