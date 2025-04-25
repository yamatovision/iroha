import { CHAT, ContextType } from '../../../shared';
import api from './api.service';
import { Capacitor } from '@capacitor/core';

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
        // 詳細なエラー情報をログ出力
        console.error('Send message error 詳細:', {
          errorObject: error,
          errorMessage: error.message || 'メッセージなし',
          errorName: error.name || 'エラー名なし',
          errorStack: error.stack || 'スタックトレースなし',
          errorCode: error.code || 'コードなし',
          errorStatus: error.status || 'ステータスなし',
          responseData: error.response?.data || 'レスポンスデータなし',
          errorResponse: error.response || 'レスポンスなし',
          errorRequest: error.request || 'リクエストなし', 
          errorConfig: error.config || 'コンフィグなし',
          requestURL: error.config?.url || 'URLなし',
          requestMethod: error.config?.method || 'メソッドなし',
          requestHeaders: error.config?.headers || 'ヘッダーなし',
          networkState: navigator.onLine ? 'オンライン' : 'オフライン'
        });
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
          // モバイル環境での問題を回避するためのタイムアウト設定
          const controller = new AbortController();
          let timeoutId = setTimeout(() => controller.abort(), 30000); // 30秒タイムアウト
          
          // レスポンス変数を外側のスコープで宣言
          let response: Response | null = null;
          
          try {
            console.log('リクエスト開始:', {
              url,
              method: 'POST',
              bodyLength: JSON.stringify({message, contextItems, stream: true}).length,
              tokenLength: token.length,
              networkStatus: navigator.onLine ? 'オンライン' : 'オフライン'
            });
            
            // iOSデバイスでのストリーミング問題に対応するためのプラットフォームチェック
            const isIOS = Capacitor.getPlatform() === 'ios';
            console.log('デバイス情報:', { 
              isIOS: isIOS, 
              platform: Capacitor.getPlatform(),
              userAgent: navigator.userAgent
            });
            
            // iOSとその他のプラットフォームで処理を分ける
            if (isIOS) {
              console.log('iOS向け最適化設定を使用');
              
              // タイムアウト延長（60秒）
              clearTimeout(timeoutId);
              const iOSTimeoutId = setTimeout(() => controller.abort(), 60000);
              
              response = await fetch(url, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`,
                  'Accept': 'text/event-stream',
                  'Cache-Control': 'no-cache',
                  'Connection': 'keep-alive', // 接続維持のための追加
                  'X-Requested-With': 'XMLHttpRequest'
                },
                body: JSON.stringify({
                  message,
                  contextItems,
                  stream: true
                }),
                signal: controller.signal,
                mode: 'cors' as RequestMode, // CORSモードを明示的に指定
                // iOSでは必要に応じてkeepaliveをtrueに設定
                keepalive: true
              });
              
              // クリーンアップ関数を更新
              clearTimeout(timeoutId);
              timeoutId = iOSTimeoutId;
            } else {
              // 他のプラットフォーム（Web、Android）向け設定
              console.log('標準ストリーミング設定を使用');
              response = await fetch(url, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`,
                  'Accept': 'text/event-stream', // SSE用のヘッダーを追加
                  'Cache-Control': 'no-cache',
                  'X-Requested-With': 'XMLHttpRequest'
                },
                body: JSON.stringify({
                  message,
                  contextItems,
                  stream: true
                }),
                signal: controller.signal
              });
            }
            
            console.log('サーバーレスポンス詳細:', {
              status: response.status,
              statusText: response.statusText,
              headers: {
                contentType: response.headers.get('Content-Type'),
                contentLength: response.headers.get('Content-Length'),
                connection: response.headers.get('Connection')
              },
              type: response.type,
              ok: response.ok,
              redirected: response.redirected,
              bodyUsed: response.bodyUsed
            });
            
            if (!response.ok) {
              throw new Error(`サーバーエラー: ${response.status} ${response.statusText}`);
            }
          } finally {
            clearTimeout(timeoutId);
          }
          
          try {
            // レスポンスボディからリーダーを取得
            if (!response) {
              throw new Error('APIリクエストが失敗しました');
            }
            
            // iOSの場合はレスポンスステータスを詳細にチェック
            const isIOS = Capacitor.getPlatform() === 'ios';
            
            // ステータスコードが200でない場合のエラーハンドリングを強化
            if (!response.ok) {
              console.error('サーバーエラーレスポンス:', {
                status: response.status,
                statusText: response.statusText,
                headers: Object.fromEntries([...response.headers.entries()]),
                type: response.type,
                url: response.url
              });
              
              // レスポンスボディを確認して詳細なエラーメッセージを取得
              try {
                const errorText = await response.text();
                console.error('エラーレスポンスボディ:', errorText);
                throw new Error(`サーバーエラー: ${response.status} ${response.statusText} - ${errorText}`);
              } catch (textError) {
                throw new Error(`サーバーエラー: ${response.status} ${response.statusText}`);
              }
            }
            
            // Content-Typeヘッダーの確認
            const contentType = response.headers.get('Content-Type');
            console.log('レスポンスのContent-Type:', contentType);
            
            // SSEレスポンスであることを確認（特にiOSの場合）
            if (isIOS && contentType && !contentType.includes('text/event-stream')) {
              console.warn('SSEではないレスポースタイプを受信:', contentType);
            }
            
            const reader = response.body?.getReader();
            if (!reader) {
              throw new Error('ストリーミングレスポンスの読み取りに失敗しました');
            }
            
            // テキストデコーダーの作成
            const decoder = new TextDecoder();
            let buffer = '';
            
            console.log('ストリーム読み込み開始');
            
            // ストリームを読み込む
            let readCount = 0;
            const readStartTime = Date.now();
            
            try {
              // iOSの場合は安全のため読み込み回数に制限を設ける
              const maxReadAttempts = isIOS ? 2000 : Infinity; // iOSの場合は2000回に引き上げ
              
              // ストリーム読み込みのタイムアウト設定（iOSで特に重要）
              const streamTimeout = isIOS ? 120000 : 90000; // iOSでは120秒に延長
              const streamTimeoutId = setTimeout(() => {
                console.warn(`ストリーム読み込みタイムアウト(${streamTimeout}ms)。処理を打ち切ります。`);
                reader.cancel('ストリーム読み込みタイムアウト'); // 明示的にストリーム読み込みをキャンセル
              }, streamTimeout);
              
              try {
                while (readCount < maxReadAttempts) {
                try {
                  const { done, value } = await reader.read();
                  readCount++;
                  
                  // 定期的に読み込み状況を記録
                  if (readCount % 10 === 0 || readCount === 1) {
                    console.log(`ストリーム読み込み進行中: ${readCount}回目, 経過時間: ${Date.now() - readStartTime}ms`);
                  }
                  
                  if (done) {
                    console.log('ストリーム読み込み完了', {
                      readCount,
                      totalTimeMs: Date.now() - readStartTime,
                      bufferLength: buffer.length,
                      messageLength: completeMessage.length
                    });
                    
                    // ストリームタイムアウトをクリア
                    clearTimeout(streamTimeoutId);
                    break;
                  }
                  
                  if (!value || value.length === 0) {
                    console.warn('空のチャンクを受信');
                    continue;
                  }
                  
                  // バイナリデータをテキストに変換
                  const chunk = decoder.decode(value, { stream: true });
                  console.log(`チャンク受信: ${chunk.length}バイト`, { 
                    chunkPreview: chunk.length > 20 ? chunk.substring(0, 20) + '...' : chunk,
                    isBinary: /[\x00-\x08\x0E-\x1F\x80-\xFF]/.test(chunk)
                  });
                  
                  buffer += chunk;
                  
                  // バッファを行単位で処理
                  const lines = buffer.split('\n');
                  buffer = lines.pop() || ''; // 最後の不完全な行をバッファに戻す
                  
                  for (const line of lines) {
                    if (line.trim() === '') continue;
                    
                    // 'data: ' で始まる行を処理
                    if (line.startsWith('data: ')) {
                      try {
                        const jsonStr = line.substring(6);
                        // iOS SSEの空データ問題対応
                        if (jsonStr.trim() === '') {
                          console.log('空のJSONデータを受信スキップ');
                          continue;
                        }
                        
                        const data = JSON.parse(jsonStr);
                        console.log('SSEデータ受信:', {
                          eventType: data.event,
                          dataPreview: JSON.stringify(data).substring(0, 50) + '...'
                        });
                        
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
                      } catch (e: any) {
                        console.warn('SSEデータ解析エラー:', {
                          error: e,
                          errorMessage: e.message,
                          line,
                          lineLength: line.length,
                          lineStart: line.substring(0, 30),
                          isValidJSON: (() => {
                            try {
                              if (line.startsWith('data: ')) {
                                JSON.parse(line.substring(6));
                                return true;
                              }
                              return false;
                            } catch {
                              return false;
                            }
                          })()
                        });
                      }
                    } else {
                      console.log('不明な形式の行:', {
                        line,
                        lineLength: line.length,
                        lineStart: line.substring(0, 30)
                      });
                    }
                  }
                } catch (readError: any) {
                  console.error('読み込み操作エラー:', {
                    error: readError,
                    message: readError.message,
                    readCount,
                    elapsedTime: Date.now() - readStartTime
                  });
                  
                  // 特定のエラーは致命的なものとして即座に中断
                  if (readError.name === 'AbortError' || 
                      readError.message.includes('aborted') ||
                      readError.message.includes('network') ||
                      readCount > 3) { // 最初の数回のエラーは無視しない
                    throw readError;
                  }
                  
                  // 一時的なエラーは回復を試みる（特にiOSの場合）
                  console.log('エラーから回復を試みます...');
                  // 少し待機してから再試行
                  await new Promise(r => setTimeout(r, 100));
                }
              }
              
              // 最大読み込み回数に達した場合（iOSのみ）
              if (isIOS && readCount >= maxReadAttempts) {
                console.warn(`最大読み込み回数(${maxReadAttempts})に達しました。処理を終了します。`);
              }
              
              // タイムアウトをクリア
              clearTimeout(streamTimeoutId);
              
              } finally {
                // 万が一の場合でもタイムアウトをクリア
                clearTimeout(streamTimeoutId);
              }
            } catch (streamError: any) {
              // ストリームエラーの詳細なロギング
              console.error('ストリーム読み込みエラー詳細:', {
                error: streamError,
                errorName: streamError.name,
                errorMessage: streamError.message || '不明なエラー',
                errorStack: streamError.stack || 'スタックトレースなし',
                bufferState: buffer.substring(0, 100) + '...',
                readCount,
                timingInfo: {
                  totalTime: Date.now() - readStartTime,
                  averageReadTime: readCount > 0 ? (Date.now() - readStartTime) / readCount : 0
                },
                platform: Capacitor.getPlatform(),
                iOSVersion: Capacitor.getPlatform() === 'ios' ? navigator.userAgent.match(/OS (\d+)_(\d+)_?(\d+)?/)?.[0] : null,
                connectionType: '不明' // navigator.connectionは標準ではないため削除
              });
              
              // iOS特有のエラー詳細情報（デバッグ用）
              if (Capacitor.getPlatform() === 'ios') {
                console.warn('iOS特有のストリームエラー診断:', {
                  userAgentFull: navigator.userAgent,
                  // エラーメッセージに特定のiOSエラー文字列が含まれているか確認
                  hasTimeoutIndication: streamError.message && 
                    (streamError.message.includes('timeout') || 
                     streamError.message.includes('timed out') || 
                     streamError.message.includes('time')),
                  hasConnectionLostIndication: streamError.message && 
                    (streamError.message.includes('connection') || 
                     streamError.message.includes('network') ||
                     streamError.message.includes('lost'))
                });
              }
              
              // ストリーミングエラーの場合でも、部分的に受信したメッセージがあれば返却
              if (completeMessage.length > 0) {
                console.log('部分的なメッセージを返却します:', completeMessage.length, 'バイト');
                // 部分的なメッセージを返す（resolveで処理を完了）
                resolve({
                  aiMessage: completeMessage,
                  timestamp,
                  chatHistory: {
                    id: sessionId || '',
                    messages: []
                  }
                });
                return;
              }
              
              throw streamError;
            }
          } catch (responseError: any) {
            console.error('レスポンス処理エラー:', {
              error: responseError,
              errorMessage: responseError.message || '不明なエラー'
            });
            throw responseError;
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
          // エラー情報を詳細にログ出力
          console.error('ストリーミングエラー詳細:', {
            errorObject: error,
            errorMessage: error.message || 'メッセージなし',
            errorName: error.name || 'エラー名なし',
            errorStack: error.stack || 'スタックトレースなし',
            errorCode: error.code || 'コードなし',
            errorStatus: error.status || 'ステータスなし',
            errorResponse: error.response || 'レスポンスなし',
            errorRequest: error.request || 'リクエストなし',
            errorConfig: error.config || 'コンフィグなし',
            errorCause: error.cause || '原因なし',
            networkState: navigator.onLine ? 'オンライン' : 'オフライン',
            platform: Capacitor.getPlatform()
          });
          
          // iOSの場合、ストリーミングが失敗したら非ストリーミングモードを試行
          const isIOS = Capacitor.getPlatform() === 'ios';
          
          // エラー条件の拡張 - iOSでの一般的なネットワークエラーパターンに対応
          const isIOSNetworkError = isIOS && (
            (error.name === 'TypeError' && error.message === 'Load failed') ||
            error.message?.includes('network connection was lost') ||
            error.message?.includes('Network Error') ||
            error.message?.includes('timeout') ||
            error.name === 'AbortError' ||
            error.code === 'ECONNABORTED'
          );
          
          console.log('エラー診断:', {
            isIOS,
            errorName: error.name,
            errorMessage: error.message,
            errorCode: error.code,
            isIOSNetworkError,
            networkStatus: navigator.onLine ? 'オンライン' : 'オフライン'
          });
          
          if (isIOSNetworkError) {
            console.log('iOSストリーミングエラーを検出。非ストリーミングモードで再試行します...');
            
            try {
              // ネイティブHTTPクライアントを使用して再試行
              console.log('🔌 ネイティブHTTPクライアントを使用します');
              
              // JWTトークンを取得
              const tokenService = await import('./auth/token.service').then(m => m.default);
              const token = await tokenService.getAccessToken();
              
              if (!token) {
                throw new Error('認証トークンがありません');
              }
              
              // リクエストURLの構築
              const baseURL = import.meta.env.PROD 
                ? import.meta.env.VITE_API_URL 
                : '';
              
              let url;
              if (baseURL) {
                // baseURLに '/api/v1' が含まれている場合は重複を防ぐ
                if (baseURL.includes('/api/v1')) {
                  // '/api/v1'を除去してパスを連結
                  const cleanBaseUrl = baseURL.replace('/api/v1', '');
                  url = `${cleanBaseUrl}${CHAT.SEND_MESSAGE}`;
                } else {
                  // 通常通り連結
                  url = `${baseURL}${CHAT.SEND_MESSAGE}`;
                }
              } else {
                // 開発環境: 相対パスを使用
                url = `${CHAT.SEND_MESSAGE}`;
              }
              
              console.log('🌐 ネイティブHTTP POST: ' + url);
              console.log('Headers:', {
                "Content-Type": "application/json",
                "X-Trace-ID": Math.random().toString(36).substring(2),
                "Authorization": `Bearer ${token.substring(0, 15)}...`
              });
              console.log('Data:', {message, contextItems});
              
              // Capacitor HTTP APIを使用
              const { CapacitorHttp } = await import('@capacitor/core');
              
              const nonStreamingResponse = await CapacitorHttp.post({
                url,
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`,
                  'Cache-Control': 'no-cache'
                },
                data: {
                  message,
                  contextItems
                }
              });
              
              console.log('非ストリーミングレスポンス:', {
                status: nonStreamingResponse.status,
                dataType: typeof nonStreamingResponse.data,
                dataPreview: JSON.stringify(nonStreamingResponse.data).substring(0, 100) + '...'
              });
              
              if (nonStreamingResponse.status !== 200 || !nonStreamingResponse.data.success) {
                throw new Error(nonStreamingResponse.data.error?.message || `API エラー: ${nonStreamingResponse.status}`);
              }
              
              console.log('非ストリーミングモードでの送信成功');
              
              resolve({
                aiMessage: nonStreamingResponse.data.response.message,
                timestamp: nonStreamingResponse.data.response.timestamp || new Date().toISOString(),
                chatHistory: nonStreamingResponse.data.chatHistory || { id: '', messages: [] }
              });
              return; // 成功したので処理終了
            } catch (fallbackError: any) {
              console.error('非ストリーミングモードでの再試行も失敗:', {
                errorObject: fallbackError,
                errorMessage: fallbackError.message || 'エラーメッセージなし',
                errorResponse: fallbackError.response || '詳細なし',
                errorCode: fallbackError.code || 'コードなし'
              });
              // 元のエラーを使用して拒否
            }
          }
          
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