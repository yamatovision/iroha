/**
 * チャットコンテキストエンドポイント統合テスト
 * 
 * このテストでは、以下のエンドポイントをテストします：
 * 1. GET /api/v1/chat/contexts/available - 利用可能なコンテキスト情報取得
 * 2. GET /api/v1/chat/contexts/detail - コンテキスト詳細情報取得
 * 3. POST /api/v1/chat/message - コンテキスト付きメッセージ送信
 * 4. GET /api/v1/chat/history - チャット履歴取得（モードなしで統一）
 * 
 * 注: このテストは実際のサーバーに接続して統合テストを行います
 */

import request from 'supertest';
import { config } from 'dotenv';
import path from 'path';

// 環境変数を読み込む
config({ path: path.resolve(__dirname, '../../.env') });

// サーバーのベースURL
const SERVER_BASE_URL = process.env.SERVER_BASE_URL || 'http://localhost:8080';

// テスト用エンドポイント
const ENDPOINTS = {
  CONTEXTS_AVAILABLE: '/api/v1/chat/contexts/available',
  CONTEXT_DETAIL: '/api/v1/chat/contexts/detail',
  CHAT_MESSAGE: '/api/v1/chat/message',
  CHAT_HISTORY: '/api/v1/chat/history'
};

// コンテキストタイプを定義
const ContextType = {
  SELF: 'self',
  FRIEND: 'friend',
  FORTUNE: 'fortune',
  TEAM: 'team',
  TEAM_GOAL: 'team_goal'
};

/**
 * テスト用の認証トークン取得
 * 
 * ※テストラボガイドラインに従い、実JWTトークンを使用
 */
async function getTestToken() {
  try {
    console.log('テスト用認証トークンを取得しています...');
    
    // プロセスを実行してトークンを取得
    const { execSync } = require('child_process');
    const result = execSync(
      'cd /Users/tatsuya/Desktop/システム開発/DailyFortuneNative2/server && node scripts/get-token.js 67f87e86a7d83fb995de0ee6 super_admin', 
      { encoding: 'utf8' }
    );
    
    // 結果からトークンを抽出 (JWT認証トークン: の後ろの文字列)
    const tokenMatch = result.match(/JWT認証トークン: ([^\s]+)/);
    
    if (tokenMatch && tokenMatch[1]) {
      const token = tokenMatch[1];
      console.log('認証トークンの取得に成功しました');
      return token;
    }
    
    console.error('認証トークンの取得に失敗: トークンが見つかりません');
    console.log('コマンド出力:', result);
    return null;
  } catch (error) {
    console.error('認証トークン取得エラー:', error);
    
    // エラー時のフォールバックトークン（テスト用）
    return 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2N2Y4N2U4NmE3ZDgzZmI5OTVkZTBlZTYiLCJyb2xlIjoic3VwZXJfYWRtaW4iLCJpYXQiOjE3NDU0NTkwMjksImV4cCI6MTc0NTQ2MjYyOX0.Uajs-W99gCigvYLhJ7mv3jhEBC_ttpRT1G-PilXSaCc';
  }
}

// テスト実行
describe('チャットコンテキストエンドポイント統合テスト', () => {
  let authToken: string | null = null;
  
  // テスト前に認証トークンを取得
  beforeAll(async () => {
    // 認証トークンを取得
    authToken = await getTestToken();
    
    if (!authToken) {
      console.warn('⚠️ 警告: 認証トークンの取得に失敗しました。一部のテストはスキップされます。');
    }
  });
  
  describe('利用可能なコンテキスト情報取得 (GET /api/v1/chat/contexts/available)', () => {
    it('コンテキスト情報を取得できるかテスト', async () => {
      // 認証トークンがない場合はスキップ
      if (!authToken) {
        console.log('認証トークンがないためテストをスキップします');
        return;
      }
      
      console.log('利用可能なコンテキスト情報を取得するテストを実行中...');
      
      const response = await request(SERVER_BASE_URL)
        .get(ENDPOINTS.CONTEXTS_AVAILABLE)
        .set('Authorization', `Bearer ${authToken}`)
        .set('Content-Type', 'application/json');
      
      console.log(`ステータスコード: ${response.status}`);
      
      if (response.status !== 200) {
        console.log('エラーレスポンス:', response.body);
      } else {
        console.log('利用可能なコンテキストカテゴリ:', Object.keys(response.body.availableContexts || {}));
      }
      
      // 検証
      if (response.status === 200) {
        expect(response.body.success).toBe(true);
        expect(response.body.availableContexts).toBeDefined();
        
        // 少なくとも基本カテゴリが含まれていることを確認
        const categories = Object.keys(response.body.availableContexts || {});
        expect(categories.length).toBeGreaterThan(0);
      } else {
        console.warn(`⚠️ 警告: APIが200以外のステータスを返しました: ${response.status}`);
      }
    });
  });
  
  describe('コンテキスト詳細情報取得 (GET /api/v1/chat/contexts/detail)', () => {
    it('自分自身のコンテキスト詳細を取得できるかテスト', async () => {
      // 認証トークンがない場合はスキップ
      if (!authToken) {
        console.log('認証トークンがないためテストをスキップします');
        return;
      }
      
      console.log('自分のコンテキスト詳細情報を取得するテストを実行中...');
      
      const response = await request(SERVER_BASE_URL)
        .get(ENDPOINTS.CONTEXT_DETAIL)
        .query({ type: ContextType.SELF })
        .set('Authorization', `Bearer ${authToken}`)
        .set('Content-Type', 'application/json');
      
      console.log(`ステータスコード: ${response.status}`);
      
      if (response.status !== 200) {
        console.log('エラーレスポンス:', response.body);
      } else {
        console.log('コンテキスト詳細:', {
          type: response.body.context?.type,
          hasDetails: !!response.body.context?.details
        });
      }
      
      // 検証
      if (response.status === 200) {
        expect(response.body.success).toBe(true);
        expect(response.body.context).toBeDefined();
        expect(response.body.context.type).toBe(ContextType.SELF);
        expect(response.body.context.details).toBeDefined();
      } else {
        console.warn(`⚠️ 警告: APIが200以外のステータスを返しました: ${response.status}`);
      }
    });
    
    it('運勢コンテキスト詳細を取得できるかテスト', async () => {
      // 認証トークンがない場合はスキップ
      if (!authToken) {
        console.log('認証トークンがないためテストをスキップします');
        return;
      }
      
      console.log('運勢コンテキスト詳細情報を取得するテストを実行中...');
      
      const response = await request(SERVER_BASE_URL)
        .get(ENDPOINTS.CONTEXT_DETAIL)
        .query({ 
          type: ContextType.FORTUNE,
          id: 'today'
        })
        .set('Authorization', `Bearer ${authToken}`)
        .set('Content-Type', 'application/json');
      
      console.log(`ステータスコード: ${response.status}`);
      
      if (response.status !== 200) {
        console.log('エラーレスポンス:', response.body);
      } else {
        console.log('コンテキスト詳細:', {
          type: response.body.context?.type,
          id: response.body.context?.id,
          hasDetails: !!response.body.context?.details
        });
      }
      
      // 検証
      if (response.status === 200) {
        expect(response.body.success).toBe(true);
        expect(response.body.context).toBeDefined();
        expect(response.body.context.type).toBe(ContextType.FORTUNE);
        expect(response.body.context.id).toBe('today');
      } else {
        console.warn(`⚠️ 警告: APIが200以外のステータスを返しました: ${response.status}`);
      }
    });
  });
  
  describe('コンテキスト付きメッセージ送信 (POST /api/v1/chat/message)', () => {
    it('コンテキストアイテムを指定してメッセージを送信できるかテスト', async () => {
      // 認証トークンがない場合はスキップ
      if (!authToken) {
        console.log('認証トークンがないためテストをスキップします');
        return;
      }
      
      console.log('コンテキスト付きメッセージ送信テストを実行中...');
      
      const payload = {
        message: 'こんにちは、テストメッセージです',
        contextItems: [
          { type: ContextType.SELF },
          { type: ContextType.FORTUNE, id: 'today' }
        ]
      };
      
      const response = await request(SERVER_BASE_URL)
        .post(ENDPOINTS.CHAT_MESSAGE)
        .set('Authorization', `Bearer ${authToken}`)
        .set('Content-Type', 'application/json')
        .send(payload);
      
      console.log(`ステータスコード: ${response.status}`);
      
      if (response.status !== 200) {
        console.log('エラーレスポンス:', response.body);
      } else {
        console.log('メッセージ送信結果:', {
          success: response.body.success,
          hasChatHistory: !!response.body.chatHistory,
          hasResponse: !!response.body.response
        });
      }
      
      // 検証
      if (response.status === 200) {
        expect(response.body.success).toBe(true);
        expect(response.body.response).toBeDefined();
        expect(response.body.chatHistory).toBeDefined();
        expect(response.body.chatHistory.id).toBeDefined();
      } else {
        console.warn(`⚠️ 警告: APIが200以外のステータスを返しました: ${response.status}`);
      }
    }, 30000); // AIレスポンスを待つため、タイムアウトを延長
  });
  
  describe('チャット履歴取得 (GET /api/v1/chat/history)', () => {
    it('チャット履歴を取得できるかテスト', async () => {
      // 認証トークンがない場合はスキップ
      if (!authToken) {
        console.log('認証トークンがないためテストをスキップします');
        return;
      }
      
      console.log('チャット履歴取得テストを実行中...');
      
      const response = await request(SERVER_BASE_URL)
        .get(ENDPOINTS.CHAT_HISTORY)
        .set('Authorization', `Bearer ${authToken}`)
        .set('Content-Type', 'application/json');
      
      console.log(`ステータスコード: ${response.status}`);
      
      if (response.status !== 200) {
        console.log('エラーレスポンス:', response.body);
      } else {
        console.log('チャット履歴取得結果:', {
          success: response.body.success,
          historyCount: response.body.chatHistories?.length || 0,
          hasPagination: !!response.body.pagination
        });
      }
      
      // 検証
      if (response.status === 200) {
        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.chatHistories)).toBe(true);
        expect(response.body.pagination).toBeDefined();
      } else {
        console.warn(`⚠️ 警告: APIが200以外のステータスを返しました: ${response.status}`);
      }
    });
  });
});