import { CHAT } from '../../../shared';
import { ChatMode } from '../../../shared';
import api from './api.service';

/**
 * チャットサービス
 * AIチャット機能に関連するAPIとのインタラクションを提供
 */
export class ChatService {
  /**
   * メッセージを送信してAIレスポンスを取得
   */
  async sendMessage(
    message: string,
    mode: ChatMode = ChatMode.PERSONAL,
    contextInfo?: {
      memberId?: string;
      teamGoalId?: string;
    },
    useStreaming: boolean = true
  ): Promise<{
    aiMessage: string;
    timestamp: string;
    chatHistory: {
      id: string;
      messages: Array<{
        role: 'user' | 'assistant';
        content: string;
        timestamp: string;
      }>;
    };
  }> {
    // ストリーミングなしの場合、従来の方法でリクエスト
    if (!useStreaming) {
      try {
        const response = await api.post(CHAT.SEND_MESSAGE, {
          message,
          mode,
          contextInfo
        });

        if (!response.data.success) {
          throw new Error(response.data.error?.message || 'メッセージの送信に失敗しました');
        }

        return {
          aiMessage: response.data.response.message,
          timestamp: response.data.response.timestamp,
          chatHistory: response.data.chatHistory
        };
      } catch (error: any) {
        console.error('Send message error:', error);
        throw new Error(error.response?.data?.error?.message || error.message || 'チャットサービスエラー');
      }
    } else {
      // api.serviceを使用して認証を処理し、ストリーミングモードでリクエスト
      return new Promise(async (resolve, reject) => {
        const timestamp = new Date().toISOString();
        let completeMessage = '';
        let sessionId = '';

        try {
          // URLの作成（クエリパラメータでストリーミングを指定）
          // 本番環境ではベースURLを先頭に付与
          const baseURL = import.meta.env.PROD 
            ? import.meta.env.VITE_API_URL 
            : '';
          
          // URL構築時にパスの重複を防止
          let url;
          if (baseURL) {
            // baseURLに '/api/v1' が含まれている場合は重複を防ぐ
            if (baseURL.includes('/api/v1')) {
              // '/api/v1'を除去してパスを連結
              const cleanBaseUrl = baseURL.replace('/api/v1', '');
              url = `${cleanBaseUrl}${CHAT.SEND_MESSAGE}?stream=true`;
            } else {
              // 通常通り連結
              url = `${baseURL}${CHAT.SEND_MESSAGE}?stream=true`;
            }
          } else {
            // 開発環境: 相対パスを使用
            url = `${CHAT.SEND_MESSAGE}?stream=true`;
          }
          
          // 最終的なURLにパスの重複がないかチェック
          if (url.includes('/api/v1/api/v1/')) {
            console.warn('⚠️ URLにパスの重複が検出されました: ', url);
            url = url.replace('/api/v1/api/v1/', '/api/v1/');
            console.log('🔧 修正後のURL: ', url);
          }
          
          console.log('ストリーミングリクエスト送信:', url);
          
          // JWT認証トークンを取得
          console.log('JWT認証情報を取得中...');
          
          // JWT認証トークンの取得
          const tokenService = await import('./auth/token.service').then(m => m.default);
          const token = await tokenService.getAccessToken();
          
          if (!token) {
            throw new Error('JWT認証トークンが取得できませんでした。再ログインしてください。');
          }
          
          console.log('JWT認証トークン取得成功 (先頭20文字):', token.substring(0, 20));

          // fetchリクエストを作成（手動で認証ヘッダーを設定）
          console.log('fetch APIでリクエスト送信');
          const response = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
              message,
              mode,
              contextInfo,
              stream: true
            }),
            // credentials: 'include' はクッキーを送信する時のみ必要
            // JWT認証を使用しているので不要 - CORSエラーの原因になるためコメントアウト
          });
          
          console.log('サーバーレスポンス:', response.status, response.statusText);
          
          if (!response.ok) {
            throw new Error(`サーバーエラー: ${response.status} ${response.statusText}`);
          }
          
          // レスポンスボディからリーダーを取得
          const reader = response.body?.getReader();
          if (!reader) {
            throw new Error('ストリーミングレスポンスの読み取りに失敗しました');
          }
          
          // テキストデコーダーの作成
          const decoder = new TextDecoder();
          let buffer = '';
          
          console.log('ストリーム読み込み開始');
          
          // ストリームを読み込む
          while (true) {
            const { done, value } = await reader.read();
            
            if (done) {
              console.log('ストリーム読み込み完了');
              break;
            }
            
            // バイナリデータをテキストに変換
            const chunk = decoder.decode(value, { stream: true });
            buffer += chunk;
            
            // バッファを行単位で処理
            const lines = buffer.split('\n');
            buffer = lines.pop() || ''; // 最後の不完全な行をバッファに戻す
            
            for (const line of lines) {
              if (line.trim() === '') continue;
              
              // 'data: ' で始まる行を処理
              if (line.startsWith('data: ')) {
                try {
                  const data = JSON.parse(line.substring(6));
                  
                  // イベントタイプによる処理分岐
                  if (data.event === 'start') {
                    // セッション開始
                    sessionId = data.sessionId;
                    console.log('ストリーミングセッション開始:', sessionId);
                  } 
                  else if (data.event === 'chunk') {
                    // チャンクデータ受信
                    completeMessage += data.text;
                    
                    // 受信したチャンクをコールバックに渡す
                    if (this.streamChunkCallback) {
                      this.streamChunkCallback(data.text);
                    }
                  }
                  else if (data.event === 'error') {
                    throw new Error(data.message || 'ストリーミング中にエラーが発生しました');
                  }
                } catch (e) {
                  console.warn('SSEデータ解析エラー:', e, line);
                }
              }
            }
          }
          
          // 成功時の処理
          console.log('ストリーミング処理完了:', completeMessage.length, 'バイト受信');
          resolve({
            aiMessage: completeMessage,
            timestamp,
            chatHistory: {
              id: sessionId,
              messages: []
            }
          });
          
        } catch (error: any) {
          console.error('ストリーミングエラー:', error);
          reject(new Error(error.message || 'ストリーミング処理中にエラーが発生しました'));
        }
      });
    }
  }
  
  // ストリーミングチャンク受信時のコールバック
  private streamChunkCallback: ((chunk: string) => void) | null = null;
  
  // ストリーミングチャンクのコールバック登録
  setStreamChunkCallback(callback: (chunk: string) => void) {
    this.streamChunkCallback = callback;
  }
  
  // ストリーミングチャンクのコールバック解除
  clearStreamChunkCallback() {
    this.streamChunkCallback = null;
  }

  /**
   * チャット履歴を取得
   */
  async getHistory(
    options: {
      mode?: ChatMode;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<{
    chatHistories: Array<{
      id: string;
      chatType: ChatMode;
      messages: Array<{
        role: 'user' | 'assistant';
        content: string;
        timestamp: string;
      }>;
      createdAt: string;
      lastMessageAt: string;
    }>;
    pagination: {
      total: number;
      limit: number;
      offset: number;
      hasMore: boolean;
    };
  }> {
    try {
      const { mode, limit, offset } = options;
      const queryParams = new URLSearchParams();

      if (mode) queryParams.append('mode', mode);
      if (limit) queryParams.append('limit', limit.toString());
      if (offset) queryParams.append('offset', offset.toString());

      const queryString = queryParams.toString();
      const url = queryString ? `${CHAT.GET_HISTORY}?${queryString}` : CHAT.GET_HISTORY;

      const response = await api.get(url);

      if (!response.data.success) {
        throw new Error(response.data.error?.message || 'チャット履歴の取得に失敗しました');
      }

      return {
        chatHistories: response.data.chatHistories,
        pagination: response.data.pagination
      };
    } catch (error: any) {
      console.error('Get chat history error:', error);
      throw new Error(error.response?.data?.error?.message || error.message || 'チャット履歴の取得に失敗しました');
    }
  }

  /**
   * チャット履歴をクリア
   */
  async clearHistory(
    options: {
      mode?: ChatMode;
      chatId?: string;
    } = {}
  ): Promise<{
    message: string;
    deletedCount: number;
  }> {
    try {
      const { mode, chatId } = options;
      const queryParams = new URLSearchParams();

      if (mode) queryParams.append('mode', mode);
      if (chatId) queryParams.append('chatId', chatId);

      const queryString = queryParams.toString();
      const url = queryString ? `${CHAT.CLEAR_HISTORY}?${queryString}` : CHAT.CLEAR_HISTORY;

      const response = await api.delete(url);

      if (!response.data.success) {
        throw new Error(response.data.error?.message || 'チャット履歴のクリアに失敗しました');
      }

      return {
        message: response.data.message,
        deletedCount: response.data.deletedCount
      };
    } catch (error: any) {
      console.error('Clear chat history error:', error);
      throw new Error(error.response?.data?.error?.message || error.message || 'チャット履歴のクリアに失敗しました');
    }
  }

  /**
   * チャットモードを変更
   */
  async setMode(
    mode: ChatMode,
    contextInfo?: {
      memberId?: string;
      teamGoalId?: string;
    }
  ): Promise<{
    mode: ChatMode;
    welcomeMessage: string;
    contextInfo?: {
      memberId?: string;
      teamGoalId?: string;
    };
    chatHistory: {
      id: string;
      messages: Array<{
        role: 'user' | 'assistant';
        content: string;
        timestamp: string;
      }>;
    };
  }> {
    try {
      // モードが未定義の場合はデフォルトを使用
      const safeMode = mode || ChatMode.PERSONAL;
      
      console.log('ChatMode設定リクエスト準備:', { 
        送信するモード: safeMode, 
        元のモード値: mode, 
        リクエストURL: CHAT.SET_CHAT_MODE 
      });
      
      // APIリクエスト送信（モードを文字列として明示的に送信）
      const response = await api.put(CHAT.SET_CHAT_MODE, {
        mode: String(safeMode),
        contextInfo
      });

      if (!response.data.success) {
        throw new Error(response.data.error?.message || 'モードの変更に失敗しました');
      }

      return {
        mode: response.data.mode,
        welcomeMessage: response.data.welcomeMessage,
        contextInfo: response.data.contextInfo,
        chatHistory: response.data.chatHistory
      };
    } catch (error: any) {
      console.error('Set chat mode error:', error);
      throw new Error(error.response?.data?.error?.message || error.message || 'チャットモードの設定に失敗しました');
    }
  }
}

// シングルトンインスタンスをエクスポート
export const chatService = new ChatService();