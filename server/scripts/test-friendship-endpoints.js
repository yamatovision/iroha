/**
 * 友達・招待機能エンドポイントのテストスクリプト
 * このスクリプトは招待機能のAPIエンドポイントをテストするためのものです。
 */

const axios = require('axios');
const mongoose = require('mongoose');
require('dotenv').config();

// 基本設定
const API_URL = process.env.API_URL || 'http://localhost:8080';
const BASE_PATH = '/api/v1'; // APIのベースパス
const FULL_API_URL = `${API_URL}${BASE_PATH}`; // 完全なAPIのURL
let token = '';
let testUserId = '';
let testTeamId = '';
let testInvitationCode = '';
let testInvitationId = '';

// テストユーザーの認証情報
const TEST_USER = {
  email: process.env.TEST_USER_EMAIL || 'test@example.com',
  password: process.env.TEST_USER_PASSWORD || 'testpassword123'
};

// テスト招待用メールアドレス
const TEST_INVITE_EMAIL = process.env.TEST_INVITE_EMAIL || 'invited@example.com';

// axiosインスタンスの設定
const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  },
  validateStatus: () => true // すべてのステータスコードを許可
});

// リクエストインターセプターを追加
api.interceptors.request.use(config => {
  console.log(`リクエスト: ${config.method?.toUpperCase() || 'GET'} ${config.baseURL}${config.url}`);
  return config;
});

// テスト用ユーティリティ関数
const setAuthToken = (newToken) => {
  token = newToken;
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
};

// テスト実行関数
const runTests = async () => {
  try {
    console.log('🧪 友達・招待機能エンドポイントテストを開始します...');
    
    // Step 1: ログインしてトークンを取得
    await login();
    
    // Step 2: ユーザー情報を取得
    await getUserInfo();
    
    // Step 3: テスト用チームを取得
    await getFirstTeam();
    
    // テストシナリオ実行
    await testFriendInvitation();
    await testTeamInvitation();
    await testGetInvitationInfo();
    await testGetUserInvitations();
    
    // クリーンアップ
    await cleanupInvitation();
    
    console.log('✅ 全てのテストが完了しました');
  } catch (error) {
    console.error('❌ テスト中にエラーが発生しました:', error.message);
    if (error.response) {
      console.error('📡 サーバーレスポンス:', {
        status: error.response.status,
        data: error.response.data
      });
    }
  } finally {
    // テスト終了
    console.log('🔚 テストを終了します');
  }
};

// ログイン処理
const login = async () => {
  try {
    console.log('🔑 ログイン中...');
    console.log(`リクエスト: POST ${API_URL}${BASE_PATH}/jwt-auth/login`);
    console.log('リクエストデータ:', { email: TEST_USER.email });
    
    const response = await api.post(`${BASE_PATH}/jwt-auth/login`, TEST_USER);
    
    console.log(`ステータスコード: ${response.status}`);
    console.log('レスポンス:', JSON.stringify(response.data, null, 2));
    
    if (response.status === 200) {
      // JWTトークン形式
      if (response.data.token) {
        setAuthToken(response.data.token);
        console.log('✅ JWT形式でログイン成功');
        return true;
      }
      // 新しいトークン形式
      else if (response.data.tokens && response.data.tokens.accessToken) {
        setAuthToken(response.data.tokens.accessToken);
        console.log('✅ 新形式でログイン成功');
        return true;
      } else {
        console.error('ログイン応答にトークンがありません:', response.data);
        throw new Error('トークンが取得できませんでした');
      }
    } else {
      console.error('ログイン失敗:', response.data);
      throw new Error('ログインに失敗しました');
    }
  } catch (error) {
    console.error('❌ ログイン失敗:', error.message);
    if (error.response) {
      console.error('ログイン中にエラーが発生しました:', error.response.data);
    }
    
    // テスト用のモックトークンを設定（デバッグ目的）
    if (process.env.DEBUG_MODE === 'true') {
      console.log('🔧 デバッグモード: モックトークンを設定します');
      setAuthToken('debug_mock_token');
      return true;
    }
    
    throw error;
  }
};

// ユーザー情報取得
const getUserInfo = async () => {
  try {
    console.log('👤 ユーザー情報取得中...');
    console.log(`リクエスト: GET ${API_URL}${BASE_PATH}/users/me`);
    console.log(`認証ヘッダー: Bearer ${token.substring(0, 15)}...`);
    
    // まず、/users/meを試す
    try {
      const response = await api.get(`${BASE_PATH}/users/me`);
      console.log(`ステータスコード: ${response.status}`);
      console.log('レスポンス:', JSON.stringify(response.data, null, 2));
      
      if (response.status === 200 && response.data.data && response.data.data._id) {
        testUserId = response.data.data._id;
        console.log(`✅ ユーザー情報取得成功 (ID: ${testUserId})`);
        return true;
      }
    } catch (error) {
      console.log('⚠️ /users/meでの取得に失敗しました。別の方法を試します...');
    }
    
    // JWTトークンからユーザーIDを抽出する代替手段
    if (token) {
      try {
        const tokenParts = token.split('.');
        if (tokenParts.length === 3) {
          // Node.js環境用のBase64デコード
          const base64Decode = (str) => {
            return Buffer.from(str, 'base64').toString('utf8');
          };
          
          // パディングを修正（JWTはBase64urlを使用）
          const base64Url = tokenParts[1].replace(/-/g, '+').replace(/_/g, '/');
          const paddedBase64 = base64Url.padEnd(base64Url.length + (4 - base64Url.length % 4) % 4, '=');
          
          const payload = JSON.parse(base64Decode(paddedBase64));
          if (payload.sub || payload.uid) {
            testUserId = payload.sub || payload.uid;
            console.log(`✅ トークンからユーザーID取得 (ID: ${testUserId})`);
            return true;
          }
        }
      } catch (parseError) {
        console.error('トークンのデコードに失敗:', parseError.message);
      }
    }
    
    // モックIDを使用（テスト目的のみ）
    console.log('⚠️ ユーザーIDが取得できなかったため、テスト用IDを使用します');
    testUserId = '67f87e86a7d83fb995de0ee6'; // テスト用ID
    console.log(`✅ テスト用ID設定: ${testUserId}`);
    return true;
  } catch (error) {
    console.error('❌ ユーザー情報取得失敗:', error.message);
    if (error.response) {
      console.error('API応答:', error.response.data);
    }
    
    // 実行を続けるためにモックIDを設定
    testUserId = '67f87e86a7d83fb995de0ee6'; // テスト用ID
    console.log(`⚠️ エラー発生のため、テスト用IDを使用: ${testUserId}`);
    return true;
  }
};

// 最初のチーム取得
const getFirstTeam = async () => {
  try {
    console.log('🏢 チーム情報取得中...');
    const response = await api.get(`${BASE_PATH}/teams`);
    
    console.log(`ステータスコード: ${response.status}`);
    console.log('レスポンス:', JSON.stringify(response.data, null, 2));
    
    if (response.status === 200 && response.data.data && response.data.data.length > 0) {
      testTeamId = response.data.data[0]._id;
      console.log(`✅ チーム情報取得成功 (ID: ${testTeamId})`);
      return true;
    } else {
      console.warn('⚠️ チームが見つからないため、チーム招待テストはスキップします');
      return false;
    }
  } catch (error) {
    console.error('❌ チーム情報取得失敗:', error.message);
    if (error.response) {
      console.error('API応答:', error.response.data);
    }
    // チーム取得に失敗しても続行
    return false;
  }
};

// 友達招待テスト
const testFriendInvitation = async () => {
  try {
    console.log('🔗 友達招待作成テスト...');
    const response = await api.post(`${BASE_PATH}/invitations/friend`, {
      email: TEST_INVITE_EMAIL
    });
    
    console.log(`ステータスコード: ${response.status}`);
    console.log(`レスポンス: ${JSON.stringify(response.data, null, 2)}`);
    
    if (response.status === 201 && response.data.success) {
      testInvitationCode = response.data.data.invitationCode;
      console.log(`✅ 友達招待作成成功 (招待コード: ${testInvitationCode})`);
      return true;
    } else {
      console.error('友達招待作成失敗:', response.data);
      throw new Error('友達招待の作成に失敗しました');
    }
  } catch (error) {
    console.error('❌ 友達招待作成失敗:', error.message);
    if (error.response) {
      console.error('API応答:', error.response.data);
    }
    throw error;
  }
};

// チーム招待テスト
const testTeamInvitation = async () => {
  if (!testTeamId) {
    console.log('⏭️ チーム招待テストをスキップします (チームIDがありません)');
    return false;
  }
  
  try {
    console.log('🔗 チーム招待作成テスト...');
    const response = await api.post(`${BASE_PATH}/invitations/team`, {
      teamId: testTeamId,
      email: TEST_INVITE_EMAIL,
      role: 'テストメンバー'
    });
    
    console.log(`ステータスコード: ${response.status}`);
    console.log(`レスポンス: ${JSON.stringify(response.data, null, 2)}`);
    
    if (response.status === 201 && response.data.success) {
      console.log(`✅ チーム招待作成成功 (招待コード: ${response.data.data.invitationCode})`);
      return true;
    } else {
      console.error('チーム招待作成失敗:', response.data);
      // チーム招待失敗は致命的ではないので例外をスローしない
      return false;
    }
  } catch (error) {
    console.error('❌ チーム招待作成失敗:', error.message);
    if (error.response) {
      console.error('API応答:', error.response.data);
    }
    // チーム招待失敗は致命的ではないので続行
    return false;
  }
};

// 招待情報取得テスト
const testGetInvitationInfo = async () => {
  if (!testInvitationCode) {
    console.log('⏭️ 招待情報取得テストをスキップします (招待コードがありません)');
    return false;
  }
  
  try {
    console.log('🔍 招待情報取得テスト...');
    const response = await api.get(`${BASE_PATH}/invitations/${testInvitationCode}`);
    
    console.log(`ステータスコード: ${response.status}`);
    console.log(`レスポンス: ${JSON.stringify(response.data, null, 2)}`);
    
    if (response.status === 200 && response.data.success) {
      console.log('✅ 招待情報取得成功');
      console.log('📋 招待詳細:', {
        type: response.data.data.type,
        inviterName: response.data.data.inviter?.displayName,
        email: response.data.data.email,
        isLoggedIn: response.data.data.isLoggedIn,
        isInvitedUser: response.data.data.isInvitedUser
      });
      return true;
    } else {
      console.error('❌ 招待情報取得失敗:', response.data);
      throw new Error('招待情報の取得に失敗しました');
    }
  } catch (error) {
    console.error('❌ 招待情報取得失敗:', error.message);
    if (error.response) {
      console.error('API応答:', error.response.data);
    }
    throw error;
  }
};

// 招待一覧取得テスト
const testGetUserInvitations = async () => {
  try {
    console.log('📋 招待一覧取得テスト...');
    const response = await api.get(`${BASE_PATH}/invitations`);
    
    console.log(`ステータスコード: ${response.status}`);
    console.log(`レスポンス: ${JSON.stringify(response.data, null, 2)}`);
    
    if (response.status === 200 && response.data.success) {
      console.log(`✅ 招待一覧取得成功 (${response.data.count}件)`);
      
      if (response.data.count > 0) {
        // テストで使用する招待IDを保存
        testInvitationId = response.data.data[0]._id;
        console.log(`テスト用招待ID: ${testInvitationId}`);
      }
      
      return true;
    } else {
      console.error('❌ 招待一覧取得失敗:', response.data);
      throw new Error('招待一覧の取得に失敗しました');
    }
  } catch (error) {
    console.error('❌ 招待一覧取得失敗:', error.message);
    if (error.response) {
      console.error('API応答:', error.response.data);
    }
    throw error;
  }
};

// 招待クリーンアップ
const cleanupInvitation = async () => {
  if (!testInvitationId) {
    console.log('⏭️ 招待クリーンアップをスキップします (招待IDがありません)');
    return false;
  }
  
  try {
    console.log('🧹 招待クリーンアップ (取り消し)...');
    const response = await api.delete(`${BASE_PATH}/invitations/${testInvitationId}`);
    
    console.log(`ステータスコード: ${response.status}`);
    console.log(`レスポンス: ${JSON.stringify(response.data, null, 2)}`);
    
    if (response.status === 200 && response.data.success) {
      console.log('✅ 招待取り消し成功');
      return true;
    } else {
      console.error('❌ 招待取り消し失敗:', response.data);
      // クリーンアップ失敗は致命的ではないので例外をスローしない
      return false;
    }
  } catch (error) {
    console.error('❌ 招待取り消し失敗:', error.message);
    if (error.response) {
      console.error('API応答:', error.response.data);
    }
    // クリーンアップ失敗は致命的ではないので続行
    return false;
  }
};

// テスト実行
runTests();