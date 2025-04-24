import { Request, Response } from 'express';
import { ChatMessageRequest, ChatModeRequest, IContextItem, ChatMode } from '../types';
// コンテキストタイプを直接定義（バンドル問題を回避するため）
export const ContextType = {
  SELF: 'self',
  FRIEND: 'friend',
  FORTUNE: 'fortune',
  TEAM: 'team',
  TEAM_GOAL: 'team_goal'
};
import { chatService } from '../services/chat/chat.service';
import { AuthRequest } from '../types/auth';
import { buildChatContext, contextBuilderService } from '../services/chat/context-builder.service';

// 直接文字列配列として定義
const CHAT_MODES = ['personal', 'team_member', 'team_goal'];
console.log('ChatMode検証:', { 
  値: CHAT_MODES
});

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
      const { message, mode, contextInfo, contextItems } = req.body as ChatMessageRequest;
      const userId = req.user?.id;
      // ストリーミングフラグを取得
      const useStreaming = req.query.stream === 'true' || req.body.stream === true;
      
      console.log(`🔊 チャットリクエスト受信 - ユーザーID: ${userId}, ストリーミング: ${useStreaming}, メソッド: ${req.method}`);
      if (contextItems) {
        console.log(`コンテキストアイテム: ${contextItems.length}個`);
      } else if (mode) {
        console.log(`旧モードベース: モード: ${mode}`);
      }

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

      // 新しいコンテキストベースAPIと旧モードベースAPIの両方をサポート
      if (contextItems) {
        // 新しいコンテキストベースのリクエスト
        console.log('コンテキストベースのリクエストを処理します');
      } else if (mode) {
        // 旧モードベースのリクエスト - コンテキストに変換する（後方互換性）
        console.log('旧モードベースのリクエストをコンテキストに変換します:', mode);
        
        // モードの検証
        try {
          // 事前定義したCHAT_MODESを使用
          console.log('チャットモード受信値:', { 
            mode, 
            typeOfMode: typeof mode, 
            chatTypeList: CHAT_MODES 
          });
          
          // 安全なChatMode検証 - 定義された配列を使用
          const isValidMode = CHAT_MODES.includes(mode) || 
                             ['personal', 'team_member', 'team_goal'].includes(mode);
          
          if (!isValidMode) {
            console.error(`無効なモード値 [${mode}], 有効な値: ${CHAT_MODES.join(', ')}`);
            throw new Error(`無効なチャットモードです: ${mode}`);
          }
        } catch (error: any) {
          console.error('チャットモード検証エラー:', error);
          res.status(400).json({
            success: false,
            error: {
              code: 'INVALID_MODE',
              message: error.message || '無効なチャットモードです'
            }
          });
          return;
        }
      } else {
        // コンテキストアイテムもモードも指定されていない場合はエラー
        res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_CONTEXT',
            message: 'コンテキスト情報またはチャットモードが必要です'
          }
        });
        return;
      }

      // ストリーミングモードの場合
      if (useStreaming) {
        // SSEヘッダーを設定（CORS対応含む）
        // クライアントサイドのオリジンを取得
        const clientOrigin = req.headers.origin || 'https://dailyfortune.web.app';
        
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('Access-Control-Allow-Origin', clientOrigin);
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-Trace-ID, X-Direct-Refresh');
        res.setHeader('Access-Control-Allow-Credentials', 'true');
        res.setHeader('Access-Control-Expose-Headers', 'X-Trace-ID');
        res.status(200);

        try {
          // コンテキストベースまたはモードベースに応じてストリーミングメソッドを呼び分ける
          let streamGenerator;
          if (contextItems) {
            // コンテキストベースの新しいAPIを使用
            streamGenerator = chatService.streamMessageWithContexts(userId, message, contextItems);
          } else {
            // モードベースの従来APIを使用（後方互換性）
            streamGenerator = chatService.streamMessage(userId, message, mode!, contextInfo);
          }
          
          // 最初のイベントとしてセッション開始を通知
          const sessionId = Date.now().toString();
          res.write(`data: {"event":"start","sessionId":"${sessionId}"}\n\n`);
          
          // ストリーミングでチャンクを返す
          for await (const chunk of streamGenerator) {
            try {
              // テキストチャンクをJSONとしてラップして送信
              res.write(`data: {"event":"chunk","text":${JSON.stringify(chunk)}}\n\n`);
            } catch (writeError) {
              console.error('Streaming write error:', writeError);
              break;
            }
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

      // 非ストリーミングモード
      let aiResponse;
      let chatHistory;

      // コンテキストベースとモードベースの両方をサポート
      if (contextItems) {
        // 新しいコンテキストベースAPI
        const result = await chatService.processMessageWithContexts(
          userId,
          message,
          contextItems
        );
        aiResponse = result.aiResponse;
        chatHistory = result.chatHistory;
      } else {
        // 従来のモードベースAPI（後方互換性）
        const result = await chatService.processMessage(
          userId,
          message,
          mode!,
          contextInfo
        );
        aiResponse = result.aiResponse;
        chatHistory = result.chatHistory;
      }

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

      const mode = req.query.mode as string | undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
      const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;

      // モードが指定されている場合の検証
      if (mode && !CHAT_MODES.includes(mode)) {
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
        mode: mode as ChatMode,
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

      const mode = req.query.mode as string | undefined;
      const chatId = req.query.chatId as string | undefined;

      // モードが指定されている場合の検証
      if (mode && !CHAT_MODES.includes(mode)) {
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
        mode: mode as ChatMode,
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
      console.log('Chat setMode リクエスト受信:', {
        body: req.body,
        headers: req.headers,
        method: req.method
      });
      
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

      // ChatModeが正しく定義されているかを確認し、安全に検証
      try {
        // 事前定義したCHAT_MODESを使用
        console.log('チャットモード受信値:', { 
          mode, 
          typeOfMode: typeof mode, 
          chatTypeList: CHAT_MODES 
        });
        
        if (!mode) {
          throw new Error('モードが指定されていません');
        }
        
        // 安全なChatMode検証 - 定義された配列を使用
        const isValidMode = CHAT_MODES.includes(mode) || 
                           ['personal', 'team_member', 'team_goal'].includes(mode);
        
        if (!isValidMode) {
          console.error(`無効なモード値 [${mode}], 有効な値: ${CHAT_MODES.join(', ')}`);
          throw new Error(`無効なチャットモードです: ${mode}`);
        }
      } catch (error: any) {
        console.error('チャットモード検証エラー:', error);
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_MODE',
            message: error.message || '無効なチャットモードです'
          }
        });
        return;
      }

      // チームメンバーモードでメンバーIDが指定されていない場合
      // 直接列挙値と比較して、ChatModeの参照エラーを回避
      if (mode === 'team_member' && (!contextInfo || !contextInfo.memberId)) {
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
      // 直接列挙値と比較して、ChatModeの参照エラーを回避
      if (mode === 'team_goal' && (!contextInfo || !contextInfo.teamGoalId)) {
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

  /**
   * 利用可能なコンテキスト情報を取得する
   * GET /api/v1/chat/contexts/available
   */
  public async getAvailableContexts(req: AuthRequest, res: Response): Promise<void> {
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

      // 詳細なデバッグログを追加
      console.log(`getAvailableContexts - ユーザーID: ${userId} の利用可能コンテキスト情報を取得します`);

      try {
        // ユーザー自身のコンテキスト情報を取得
        const selfContext = await contextBuilderService.buildSelfContext(userId);
        console.log('Self context built successfully:', selfContext ? 'OK' : 'null');
        
        // 運勢コンテキスト情報を取得
        const fortuneContexts = [
          {
            id: 'today',
            type: ContextType.FORTUNE,
            name: '今日の運勢',
            iconType: 'today',
            color: '#ff9800',
            removable: true
          },
          {
            id: 'tomorrow',
            type: ContextType.FORTUNE,
            name: '明日の運勢',
            iconType: 'event',
            color: '#ff9800',
            removable: true
          }
        ];
        
        // 友達コンテキスト情報を取得
        let friendsContexts: IContextItem[] = [];
        try {
          friendsContexts = await contextBuilderService.buildAvailableFriendsContexts(userId);
          console.log(`Friends contexts built successfully: ${friendsContexts.length} items`);
        } catch (friendError) {
          console.error('Error building friends contexts:', friendError);
          friendsContexts = []; // エラー時は空配列を使用
        }
  
        // チームコンテキスト情報を取得（必要に応じて）
        let teamsContexts: IContextItem[] = [];
        try {
          teamsContexts = await contextBuilderService.buildAvailableTeamContexts(userId);
          console.log(`Team contexts built successfully: ${teamsContexts.length} items`);
        } catch (teamError) {
          console.error('Error building team contexts:', teamError);
          teamsContexts = []; // エラー時は空配列を使用
        }
        
        res.status(200).json({
          success: true,
          availableContexts: {
            self: selfContext,
            fortune: fortuneContexts,
            friends: friendsContexts,
            teams: teamsContexts
          }
        });
      } catch (contextBuildError) {
        // 特定のコンテキスト取得エラー
        console.error('Context build error:', contextBuildError);
        
        // エラーが発生しても最低限のレスポンスを返す
        res.status(200).json({
          success: true,
          availableContexts: {
            self: null,
            fortune: [
              {
                id: 'today',
                type: ContextType.FORTUNE,
                name: '今日の運勢',
                iconType: 'today',
                color: '#ff9800',
                removable: true
              }
            ],
            friends: [],
            teams: []
          },
          warning: "一部のコンテキスト情報の取得に失敗しました"
        });
      }
    } catch (error) {
      console.error('Get available contexts error:', error);
      // エラー詳細をレスポンスに含めて返す（開発デバッグ用）
      res.status(500).json({
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: 'コンテキスト情報の取得中にエラーが発生しました',
          details: error instanceof Error ? error.message : String(error)
        }
      });
    }
  }

  /**
   * コンテキスト情報の詳細を取得する
   * GET /api/v1/chat/contexts/detail
   */
  public async getContextDetail(req: AuthRequest, res: Response): Promise<void> {
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

      const type = req.query.type as string;
      const id = req.query.id as string;

      if (!type) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_PARAMS',
            message: 'type パラメータは必須です'
          }
        });
        return;
      }

      // SELFタイプの場合はidパラメータは省略可能（現在のユーザー情報を返す）
      if (type !== ContextType.SELF && !id) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_PARAMS',
            message: '自分以外のコンテキストタイプでは id パラメータは必須です'
          }
        });
        return;
      }

      // コンテキストタイプを検証
      const contextType = type as string;
      const validContextTypes = ['self', 'friend', 'fortune', 'team', 'team_goal'];
      if (!validContextTypes.includes(contextType)) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_CONTEXT_TYPE',
            message: '無効なコンテキストタイプです'
          }
        });
        return;
      }

      // コンテキスト詳細情報を取得
      // selfタイプの場合、idは無視される（サービス側で対応）
      const contextDetail = await contextBuilderService.getContextDetail(
        userId, 
        contextType, 
        contextType === ContextType.SELF ? 'current_user' : id
      );
      
      if (!contextDetail) {
        res.status(404).json({
          success: false,
          error: {
            code: 'CONTEXT_NOT_FOUND',
            message: '指定されたコンテキスト情報が見つかりませんでした'
          }
        });
        return;
      }

      res.status(200).json({
        success: true,
        context: contextDetail
      });
    } catch (error) {
      console.error('Get context detail error:', error);
      // エラー詳細をレスポンスに含めて返す（開発デバッグ用）
      res.status(500).json({
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: 'コンテキスト詳細の取得中にエラーが発生しました',
          details: error instanceof Error ? error.message : String(error)
        }
      });
    }
  }
}

// シングルトンインスタンスをエクスポート
export const chatController = new ChatController();