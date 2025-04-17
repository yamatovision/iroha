import { Request, Response } from 'express';
import { ChatMode, ChatMessageRequest, ChatModeRequest } from '../types';

// 拡張されたRequestの型定義
interface AuthRequest extends Request {
  user?: {
    id: string;
    role: string;
    [key: string]: any;
  };
}
import { chatService } from '../services/chat/chat.service';

/**
 * チャットコントローラー
 * チャット関連のエンドポイントハンドラを提供する
 */
export class ChatController {
  /**
   * メッセージを送信し、AIレスポンスを取得する
   * POST /api/v1/chat/message
   */
  public async sendMessage(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { message, mode, contextInfo } = req.body as ChatMessageRequest;
      const userId = req.user?.id;
      // ストリーミングフラグを取得
      const useStreaming = req.query.stream === 'true' || req.body.stream === true;
      
      console.log(`🔊 チャットリクエスト受信 - ユーザーID: ${userId}, モード: ${mode}, ストリーミング: ${useStreaming}, メソッド: ${req.method}`);

      if (!userId) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: '認証が必要です'
          }
        });
        return;
      }

      if (!message) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_MESSAGE',
            message: 'メッセージは必須です'
          }
        });
        return;
      }

      if (!Object.values(ChatMode).includes(mode)) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_MODE',
            message: '無効なチャットモードです'
          }
        });
        return;
      }

      // ストリーミングモードの場合
      if (useStreaming) {
        // SSEヘッダーを設定（CORS対応含む）
        // クライアントサイドのオリジンを取得
        const clientOrigin = req.headers.origin || 'https://dailyfortune.web.app';
        
        res.writeHead(200, {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          'Access-Control-Allow-Origin': clientOrigin, // ワイルドカードの代わりに具体的なオリジンを指定
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
          'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-Trace-ID, X-Direct-Refresh',
          'Access-Control-Allow-Credentials': 'true',
          'Access-Control-Expose-Headers': 'X-Trace-ID'
        });

        try {
          // ストリーミングレスポンスを開始
          const streamGenerator = chatService.streamMessage(userId, message, mode, contextInfo);
          
          // 最初のイベントとしてセッション開始を通知
          const sessionId = Date.now().toString();
          res.write(`data: {"event":"start","sessionId":"${sessionId}"}\n\n`);
          
          // ストリーミングでチャンクを返す
          for await (const chunk of streamGenerator) {
            // テキストチャンクをJSONとしてラップして送信
            res.write(`data: {"event":"chunk","text":${JSON.stringify(chunk)}}\n\n`);
          }
          
          // ストリーミングの終了を通知
          res.write(`data: {"event":"end","sessionId":"${sessionId}"}\n\n`);
          res.end();
          
        } catch (error) {
          console.error('Streaming error:', error);
          // エラーが発生した場合もSSEフォーマットでクライアントに通知
          res.write(`data: {"event":"error","message":"ストリーミング処理中にエラーが発生しました"}\n\n`);
          res.end();
        }
        return;
      }

      // 非ストリーミングモード（従来の動作）
      const { aiResponse, chatHistory } = await chatService.processMessage(
        userId,
        message,
        mode,
        contextInfo
      );

      res.status(200).json({
        success: true,
        response: {
          message: aiResponse,
          timestamp: new Date().toISOString()
        },
        chatHistory: {
          id: chatHistory.id,
          messages: chatHistory.messages.map(msg => ({
            role: msg.sender === 'user' ? 'user' : 'assistant',
            content: msg.content,
            timestamp: msg.timestamp
          }))
        }
      });
    } catch (error) {
      console.error('Chat message error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: 'メッセージ処理中にエラーが発生しました'
        }
      });
    }
  }

  /**
   * チャット履歴を取得する
   * GET /api/v1/chat/history
   */
  public async getHistory(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: '認証が必要です'
          }
        });
        return;
      }

      const mode = req.query.mode as ChatMode | undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
      const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;

      // モードが指定されている場合の検証
      if (mode && !Object.values(ChatMode).includes(mode)) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_MODE',
            message: '無効なチャットモードです'
          }
        });
        return;
      }

      const { chatHistories, total, hasMore } = await chatService.getChatHistory(userId, {
        mode,
        limit,
        offset
      });

      res.status(200).json({
        success: true,
        chatHistories: chatHistories.map(chat => ({
          id: chat.id,
          chatType: chat.chatType,
          messages: chat.messages.map(msg => ({
            role: msg.sender === 'user' ? 'user' : 'assistant',
            content: msg.content,
            timestamp: msg.timestamp
          })),
          createdAt: chat.createdAt.toISOString(),
          lastMessageAt: chat.lastMessageAt.toISOString()
        })),
        pagination: {
          total,
          limit,
          offset,
          hasMore
        }
      });
    } catch (error) {
      console.error('Get chat history error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: 'チャット履歴の取得中にエラーが発生しました'
        }
      });
    }
  }

  /**
   * チャット履歴をクリアする
   * DELETE /api/v1/chat/clear
   */
  public async clearHistory(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: '認証が必要です'
          }
        });
        return;
      }

      const mode = req.query.mode as ChatMode | undefined;
      const chatId = req.query.chatId as string | undefined;

      // モードが指定されている場合の検証
      if (mode && !Object.values(ChatMode).includes(mode)) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_MODE',
            message: '無効なチャットモードです'
          }
        });
        return;
      }

      const { deletedCount } = await chatService.clearChatHistory(userId, {
        mode,
        chatId
      });

      res.status(200).json({
        success: true,
        message: 'チャット履歴がクリアされました',
        deletedCount
      });
    } catch (error) {
      console.error('Clear chat history error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: 'チャット履歴のクリア中にエラーが発生しました'
        }
      });
    }
  }

  /**
   * チャットモードを設定する
   * PUT /api/v1/chat/mode
   */
  public async setMode(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { mode, contextInfo } = req.body as ChatModeRequest;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: '認証が必要です'
          }
        });
        return;
      }

      if (!Object.values(ChatMode).includes(mode)) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_MODE',
            message: '無効なチャットモードです'
          }
        });
        return;
      }

      // チームメンバーモードでメンバーIDが指定されていない場合
      if (mode === ChatMode.TEAM_MEMBER && (!contextInfo || !contextInfo.memberId)) {
        res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_MEMBER_ID',
            message: 'チームメンバーモードにはメンバーIDが必要です'
          }
        });
        return;
      }

      // チーム目標モードで目標IDが指定されていない場合
      if (mode === ChatMode.TEAM_GOAL && (!contextInfo || !contextInfo.teamGoalId)) {
        res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_GOAL_ID',
            message: 'チーム目標モードには目標IDが必要です'
          }
        });
        return;
      }

      const { welcomeMessage, chatHistory } = await chatService.changeMode(
        userId,
        mode,
        contextInfo
      );

      res.status(200).json({
        success: true,
        mode,
        contextInfo,
        welcomeMessage,
        chatHistory: {
          id: chatHistory.id,
          messages: chatHistory.messages.map(msg => ({
            role: msg.sender === 'user' ? 'user' : 'assistant',
            content: msg.content,
            timestamp: msg.timestamp
          }))
        }
      });
    } catch (error) {
      console.error('Set chat mode error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: 'チャットモードの設定中にエラーが発生しました'
        }
      });
    }
  }
}

// シングルトンインスタンスをエクスポート
export const chatController = new ChatController();