import { CHAT, ContextType } from '../../../shared';
import api from './api.service';

// ChatMode の列挙型（サーバー側と同じ定義）
export enum ChatMode {
  PERSONAL = 'personal',
  TEAM_MEMBER = 'team_member',
  TEAM_GOAL = 'team_goal',
}

/**
 * チャットサービス
 * AIチャット機能に関連するAPIとのインタラクションを提供
 */
export class ChatService {
  /**
   * メッセージを送信してAIレスポンスを取得（コンテキストベース版）
   */
  async sendMessage(
    message: string,
    contextItems: {
      type: ContextType;
      id?: string;
      additionalInfo?: any;
    }[],
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
        contextItems?: {
          type: string;
          refId?: string;
          data?: any;
        }[];
      }>;
    };
  }> {
    // ストリーミングなしの場合、従来の方法でリクエスト
    if (!useStreaming) {
      try {
        const response = await api.post(CHAT.SEND_MESSAGE, {
          message,
          contextItems
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
              contextItems,
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
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<{
    chatHistories: Array<{
      id: string;
      messages: Array<{
        role: 'user' | 'assistant';
        content: string;
        timestamp: string;
        contextItems?: Array<{
          type: string;
          refId?: string;
          data?: any;
        }>;
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
      const { limit, offset } = options;
      const queryParams = new URLSearchParams();

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
  async clearHistory(): Promise<{
    message: string;
    deletedCount: number;
  }> {
    try {
      const url = CHAT.CLEAR_HISTORY;

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
   * 利用可能なコンテキスト情報を取得
   */
  async getAvailableContexts() {
    try {
      const response = await api.get(CHAT.GET_AVAILABLE_CONTEXTS);

      if (!response.data.success) {
        throw new Error(response.data.error?.message || '利用可能なコンテキスト情報の取得に失敗しました');
      }

      return response.data.availableContexts;
    } catch (error: any) {
      console.error('Get available contexts error:', error);
      throw new Error(error.response?.data?.error?.message || error.message || 'コンテキスト情報の取得に失敗しました');
    }
  }

  /**
   * コンテキスト情報の詳細を取得
   */
  async getContextDetail(type: ContextType, id: string) {
    try {
      const url = `${CHAT.GET_CONTEXT_DETAIL}?type=${type}&id=${id}`;
      const response = await api.get(url);

      if (!response.data.success) {
        throw new Error(response.data.error?.message || 'コンテキスト詳細の取得に失敗しました');
      }

      return response.data.context;
    } catch (error: any) {
      console.error('Get context detail error:', error);
      throw new Error(error.response?.data?.error?.message || error.message || 'コンテキスト詳細の取得に失敗しました');
    }
  }
}

// シングルトンインスタンスをエクスポート
export const chatService = new ChatService();