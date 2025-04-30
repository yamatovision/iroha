/**
 * OpenAI API クライアント
 * 
 * OpenAI GPT-4oへのアクセスを提供する基本クライアント層
 * 認証、リクエスト送信、エラーハンドリングなどの低レベル機能を提供
 */
import fetch from 'cross-fetch';

// 環境変数から設定を取得
// サーバー起動時にはAPIの状態を確認するだけで、エラーはスローしない
const getConfig = () => {
  console.log('===== OpenAI API 設定の読み込み =====');
  
  // .envからの変数読み込み確認
  const rawApiKey = process.env.OPENAI_API_KEY;
  const rawModel = process.env.OPENAI_MODEL;
  const rawUseApi = process.env.USE_OPENAI_API;
  
  console.log('API設定:', {
    hasApiKey: !!rawApiKey,
    apiKeyPrefix: rawApiKey ? rawApiKey.substring(0, 10) + '...' : 'not set',
    model: rawModel || 'gpt-4o (default)',
    useApiFlag: rawUseApi
  });
  
  // 値の正規化
  const apiKey = rawApiKey;
  const defaultModel = rawModel || 'gpt-4o';
  const useOpenAIApi = rawUseApi === 'true';
  
  // API使用が有効で、かつAPIキーが設定されていない場合のみ警告
  if (useOpenAIApi && !apiKey) {
    console.warn('⚠️ OpenAI APIキーが設定されていませんが、USE_OPENAI_API=trueとなっています。一部機能が無効になります。');
  }
  
  const result = { 
    apiKey: apiKey || 'dummy-key-for-disabled-api', 
    defaultModel,
    apiEnabled: useOpenAIApi && !!apiKey 
  };
  
  console.log('OpenAI API設定結果:', {
    apiEnabled: result.apiEnabled, 
    model: result.defaultModel
  });
  console.log('===== OpenAI API 設定の読み込み完了 =====');
  
  return result;
};

// クライアント設定インターフェース
export interface OpenAIClientOptions {
  apiKey?: string;
  defaultModel?: string;
  debug?: boolean;
}

// メッセージインターフェース
export interface OpenAIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

// API呼び出しオプション
export interface CallOptions {
  model?: string;
  maxTokens?: number;
  messages: OpenAIMessage[];
  stream?: boolean;
  temperature?: number;
}

/**
 * OpenAI API クライアント
 */
export class OpenAIApiClient {
  private apiKey: string;
  private defaultModel: string;
  private debug: boolean;
  private apiEnabled: boolean;
  
  /**
   * コンストラクタ
   */
  constructor(options: OpenAIClientOptions = {}) {
    const config = getConfig();
    this.apiKey = options.apiKey || config.apiKey;
    this.defaultModel = options.defaultModel || config.defaultModel;
    this.debug = options.debug || false;
    this.apiEnabled = config.apiEnabled;
  }
  
  /**
   * API呼び出し - 標準モード（完全なレスポンスを取得）
   */
  public async callAPI(options: CallOptions): Promise<string> {
    // APIが無効な場合はモック応答を返す
    if (!this.apiEnabled) {
      if (this.debug) {
        console.log('🤖 OpenAI API is disabled, returning mock response');
      }
      return "OpenAI APIは現在使用できません。USE_OPENAI_API=falseに設定されているか、APIキーが設定されていません。";
    }
    
    try {
      if (this.debug) {
        console.log('🤖 callAPI: OpenAI API呼び出し準備');
        console.log(`🤖 API設定値: MODEL=${options.model || this.defaultModel}`);
      }

      const url = 'https://api.openai.com/v1/chat/completions';
      
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      };
      
      const body = {
        model: options.model || this.defaultModel,
        max_tokens: options.maxTokens || 4000,
        messages: options.messages,
        temperature: options.temperature || 0.7
      };
      
      if (this.debug) {
        console.log('🤖 リクエスト準備完了:', { 
          url,
          method: 'POST',
          headerKeys: Object.keys(headers),
          bodyKeys: Object.keys(body),
          messagesCount: options.messages.length,
          maxTokens: options.maxTokens
        });
        
        console.log('🤖 APIリクエスト送信開始...');
      }
      
      const startTime = Date.now();
      
      // タイムアウト制御のための AbortController を追加
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30秒タイムアウト
      
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
        signal: controller.signal // AbortController のシグナルを追加
      });
      
      // タイムアウトタイマーをクリア
      clearTimeout(timeoutId);
      
      const endTime = Date.now();
      
      if (this.debug) {
        console.log(`🤖 APIレスポンス受信: ${endTime - startTime}ms, ステータス=${response.status}, OK=${response.ok}`);
      }
      
      if (!response.ok) {
        if (this.debug) {
          console.error('🤖 APIエラーレスポンス:', response.status, response.statusText);
        }
        
        try {
          // レスポンスボディを一度だけ消費
          const responseText = await response.text();
          let errorInfo = responseText;
          
          // JSONとしてパースを試みる
          try {
            const errorData = JSON.parse(responseText);
            errorInfo = JSON.stringify(errorData);
            if (this.debug) {
              console.error('🤖 APIエラー詳細:', errorInfo);
            }
          } catch (jsonError) {
            // JSONパースに失敗した場合はテキストをそのまま使用
            if (this.debug) {
              console.error('🤖 APIエラーテキスト:', errorInfo);
            }
          }
          
          throw new Error(`OpenAI API error: ${response.status} ${errorInfo}`);
        } catch (error) {
          // レスポンスボディの取得に失敗した場合
          throw new Error(`OpenAI API error: ${response.status} (Response body unavailable)`);
        }
      }
      
      if (this.debug) {
        console.log('🤖 APIレスポンスのJSONパース開始');
      }
      
      const responseData = await response.json() as {
        choices: Array<{ message: { content: string } }>
      };
      
      if (!responseData.choices || !Array.isArray(responseData.choices) || responseData.choices.length === 0) {
        if (this.debug) {
          console.error('🤖 無効なAPIレスポンス形式:', responseData);
        }
        throw new Error('Invalid API response format: choices array missing or empty');
      }
      
      if (this.debug) {
        console.log('🤖 JSONパース成功:', { 
          choicesCount: responseData.choices.length
        });
      }
      
      const textContent = responseData.choices[0].message.content;
      
      if (this.debug) {
        console.log('🤖 テキスト抽出完了: 長さ=' + textContent.length);
      }
      
      return textContent;
    } catch (error) {
      if (this.debug) {
        console.error('🤖 OpenAI API呼び出し総合エラー:', error);
        
        if (error instanceof Error) {
          // エラーの種類に応じたメッセージをログ
          if (error.message.includes('API Key')) {
            console.error('🤖 API認証エラー: キーが無効または期限切れの可能性');
          } else if (error.message.includes('network')) {
            console.error('🤖 ネットワークエラー: インターネット接続または API エンドポイントに問題がある可能性');
          } else if (error.message.includes('timeout')) {
            console.error('🤖 タイムアウトエラー: リクエストが時間内に完了しなかった');
          }
        }
      }
      
      throw error;
    }
  }

  /**
   * API呼び出し - ストリーミングモード
   */
  public async *streamAPI(options: CallOptions): AsyncGenerator<string, void, unknown> {
    if (!options.stream) {
      options.stream = true; // ストリームモードを強制
    }

    // APIが無効な場合はモック応答を返す
    if (!this.apiEnabled) {
      if (this.debug) {
        console.log('🤖 OpenAI API is disabled, returning mock response');
      }
      const mockResponse = "OpenAI APIは現在使用できません。USE_OPENAI_API=falseに設定されているか、APIキーが設定されていません。";
      yield mockResponse;
      return;
    }

    try {
      // node-fetchをインポートして使用
      const nodeFetch = await import('node-fetch').then(mod => mod.default);
      
      const url = 'https://api.openai.com/v1/chat/completions';
      
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
        'Accept': 'text/event-stream'
      };
      
      const body = {
        model: options.model || this.defaultModel,
        max_tokens: options.maxTokens || 4000,
        messages: options.messages,
        temperature: options.temperature || 0.7,
        stream: true
      };
      
      if (this.debug) {
        console.log(`🤖 Streaming call to OpenAI API with model: ${options.model || this.defaultModel}`);
      }
      
      const response = await nodeFetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body)
      });
      
      if (!response.ok) {
        try {
          const errorText = await response.text();
          throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
        } catch (error) {
          throw new Error(`OpenAI API error: ${response.status} (Response body unavailable)`);
        }
      }
      
      // レスポンスボディの確認
      if (!response.body) {
        throw new Error('Response body is null');
      }

      // Node.jsのストリーム処理
      const reader = response.body;
      let buffer = '';
      
      // データチャンクイベントの処理
      for await (const chunk of reader) {
        // バッファにチャンクを追加
        buffer += chunk.toString();
        
        // バッファを行単位で処理
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // 最後の不完全な行をバッファに戻す
        
        for (const line of lines) {
          // 空行をスキップ
          if (!line.trim()) continue;
          
          // "data: "で始まる行を処理
          if (line.startsWith('data: ')) {
            const data = line.substring(6);
            
            // "[DONE]"はストリームの終了を意味する
            if (data === '[DONE]') {
              continue;
            }
            
            try {
              // JSONデータをパース
              const parsedData = JSON.parse(data);
              
              // イベントタイプに基づいて処理
              if (parsedData.choices && 
                  parsedData.choices[0] && 
                  parsedData.choices[0].delta && 
                  parsedData.choices[0].delta.content) {
                
                const text = parsedData.choices[0].delta.content;
                yield text;
              }
            } catch (e) {
              if (this.debug) {
                console.error('Error parsing SSE message:', e, line);
              }
            }
          }
        }
      }
    } catch (error) {
      if (this.debug) {
        console.error('OpenAI API streaming error:', error);
      }
      // エラーの場合もフォールバックメッセージを返してアプリケーションの継続を確保
      const errorMessage = "OpenAI APIとの通信中にエラーが発生しました。しばらく経ってから再試行してください。";
      yield errorMessage;
      return;
    }
  }

  /**
   * 簡易プロンプト作成 - ユーザーメッセージのみの場合
   */
  public createUserMessage(content: string, systemPrompt?: string): OpenAIMessage[] {
    const messages: OpenAIMessage[] = [];
    
    if (systemPrompt) {
      messages.push({
        role: 'system',
        content: systemPrompt
      });
    }
    
    messages.push({
      role: 'user',
      content
    });
    
    return messages;
  }

  /**
   * 簡易呼び出し - プロンプトテキストとシステムプロンプトのみ
   */
  public async simpleCall(prompt: string, systemPrompt?: string, maxTokens?: number): Promise<string> {
    return this.callAPI({
      messages: this.createUserMessage(prompt, systemPrompt),
      maxTokens
    });
  }

  /**
   * 簡易ストリーミング - プロンプトテキストとシステムプロンプトのみ
   */
  public async *simpleStream(prompt: string, systemPrompt?: string, maxTokens?: number): AsyncGenerator<string, void, unknown> {
    yield* this.streamAPI({
      messages: this.createUserMessage(prompt, systemPrompt),
      maxTokens,
      stream: true
    });
  }
}

// シングルトンインスタンスをエクスポート
export const openaiApiClient = new OpenAIApiClient({ debug: process.env.NODE_ENV !== 'production' });

// 高レベルヘルパー関数
export async function callOpenAIAPI(prompt: string, systemPrompt: string, maxTokens: number): Promise<string> {
  return openaiApiClient.simpleCall(prompt, systemPrompt, maxTokens);
}

export async function* streamOpenAIAPI(prompt: string, systemPrompt: string, maxTokens: number): AsyncGenerator<string, void, unknown> {
  yield* openaiApiClient.simpleStream(prompt, systemPrompt, maxTokens);
}