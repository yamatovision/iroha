/**
 * テスト用認証ミドルウェアユーティリティ
 * テスト実行時に実際のJWTトークンを取得するためのユーティリティ関数
 */

import axios from 'axios';
import { config } from 'dotenv';
import path from 'path';

// 環境変数を読み込む
config({ path: path.resolve(__dirname, '../../../.env') });

// テスト用のユーザー情報
const TEST_USER = {
  email: process.env.TEST_USER_EMAIL || 'shiraishi.tatsuya@mikoto.co.jp',
  password: process.env.TEST_USER_PASSWORD || 'test12345',
};

/**
 * テスト用の認証ヘッダーを取得
 * 
 * @returns 認証ヘッダーのオブジェクト (Authorization: Bearer xxx)
 */
export async function withRealAuth(): Promise<Record<string, string>> {
  try {
    // サーバーのベースURL
    const SERVER_BASE_URL = process.env.SERVER_BASE_URL || 'http://localhost:8080';
    
    // JWTトークンを取得するエンドポイントにリクエスト
    console.log(`テスト用認証トークンを取得しています (${TEST_USER.email})...`);
    
    // テスト用のJWTトークンを取得
    const response = await axios.post(`${SERVER_BASE_URL}/api/v1/auth/jwt-login`, {
      email: TEST_USER.email,
      password: TEST_USER.password
    });
    
    // レスポンスからトークンを取得
    const token = response.data.token;
    
    if (!token) {
      throw new Error('認証トークンの取得に失敗しました');
    }
    
    console.log('テスト用認証トークンを取得しました');
    
    // 認証ヘッダーを返す
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  } catch (error) {
    console.error('テスト用認証トークンの取得に失敗しました:', error);
    
    // テスト実行を続行するためのダミートークンを返す
    return {
      'Authorization': 'Bearer dummy-test-token-for-testing-only',
      'Content-Type': 'application/json'
    };
  }
}

/**
 * テスト用のアクセストークンを取得
 * 
 * @returns JWTアクセストークン
 */
export async function getAccessToken(): Promise<string> {
  try {
    const headers = await withRealAuth();
    return headers.Authorization.replace('Bearer ', '');
  } catch (error) {
    console.error('テスト用アクセストークンの取得に失敗しました:', error);
    return 'dummy-test-token-for-testing-only';
  }
}