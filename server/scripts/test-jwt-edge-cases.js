/**
 * JWT認証のエッジケーステスト用スクリプト
 * 
 * 使用方法:
 * node scripts/test-jwt-edge-cases.js <Firebase認証トークン>
 */
const axios = require('axios');
const dotenv = require('dotenv');

// 環境変数の読み込み
dotenv.config();

const API_BASE_URL = 'http://127.0.0.1:8080/api/v1'; // APIのベースURL
const JWT_AUTH_ENDPOINTS = {
  LOGIN: `${API_BASE_URL}/jwt-auth/login`,
  REGISTER: `${API_BASE_URL}/jwt-auth/register`,
  REFRESH_TOKEN: `${API_BASE_URL}/jwt-auth/refresh-token`,
  LOGOUT: `${API_BASE_URL}/jwt-auth/logout`,
  MIGRATE_TO_JWT: `${API_BASE_URL}/jwt-auth/migrate-to-jwt`,
};

// Firebase認証トークン（get-token.jsで取得したもの）
const firebaseToken = process.argv[2];

// トークン情報を格納
let jwtTokens = {
  accessToken: null,
  refreshToken: null
};

/**
 * Firebase → JWT認証への移行テスト（準備）
 */
async function setupJwtTokens() {
  try {
    console.log('JWT認証トークンを準備中...');
    
    const response = await axios.post(JWT_AUTH_ENDPOINTS.MIGRATE_TO_JWT, {
      password: 'edgeCaseTest123' // テスト用パスワード
    }, {
      headers: {
        'Authorization': `Bearer ${firebaseToken}`
      }
    });
    
    jwtTokens = {
      accessToken: response.data.tokens.accessToken,
      refreshToken: response.data.tokens.refreshToken
    };
    
    console.log('JWT認証トークン準備完了:');
    console.log('- アクセストークン:', jwtTokens.accessToken.substring(0, 20) + '...');
    console.log('- リフレッシュトークン:', jwtTokens.refreshToken.substring(0, 20) + '...');
    
    return true;
  } catch (error) {
    console.error('JWT準備エラー:', error.response ? error.response.data : error.message);
    return false;
  }
}

/**
 * エッジケース1: 期限切れトークン検出
 * 注意: このテストは実際のトークンを期限切れにはできないため、
 * 期限切れに近いトークンの警告ヘッダーをテストします
 */
async function testExpiryWarningHeaders() {
  console.log('\n=== エッジケース1: 期限切れ警告ヘッダー ===');
  
  try {
    // 複数回リクエストを行い、期限切れ警告ヘッダーを確認
    console.log('複数回リクエストを実行して期限切れに近づけます（シミュレーション）...');
    
    // 実際のサーバーでは有効期限が近づくと警告ヘッダーが付与される
    const response = await axios.get(`${API_BASE_URL}/users/profile`, {
      headers: {
        'Authorization': `Bearer ${jwtTokens.accessToken}`
      }
    });
    
    // レスポンスヘッダーをチェック
    const expiryWarning = response.headers['x-token-expiring-soon'];
    const expiresIn = response.headers['x-token-expires-in'];
    
    if (expiryWarning) {
      console.log('期限切れ警告ヘッダーを検出!');
      console.log('トークンの残り有効期間:', expiresIn, '秒');
      return true;
    } else {
      console.log('期限切れ警告ヘッダーは検出されませんでした（トークンはまだ十分有効）');
      return false;
    }
  } catch (error) {
    console.error('エッジケース1テストエラー:', error.response ? error.response.data : error.message);
    return false;
  }
}

/**
 * エッジケース2: トークンバージョンの不一致テスト
 * 無効化されたトークンを使用する状況をシミュレート
 */
async function testTokenVersionMismatch() {
  console.log('\n=== エッジケース2: トークンバージョン不一致 ===');
  
  try {
    // 1. まずユーザーIDを取得
    const profileResponse = await axios.get(`${API_BASE_URL}/users/profile`, {
      headers: {
        'Authorization': `Bearer ${jwtTokens.accessToken}`
      }
    });
    
    const userId = profileResponse.data.id;
    console.log(`ユーザーID(${userId})でトークンバージョン不一致をテスト`);
    
    // 2. トークンの無効化をシミュレート（管理者APIを使用）
    const invalidateResponse = await axios.post(`${API_BASE_URL}/admin/settings/auth/users/${userId}/invalidate`, {}, {
      headers: {
        'Authorization': `Bearer ${firebaseToken}` // 管理者トークンを使用
      }
    });
    
    console.log('トークン無効化結果:', invalidateResponse.data);
    
    // 3. 無効化されたトークンで再度リクエスト
    try {
      const response = await axios.get(`${API_BASE_URL}/users/profile`, {
        headers: {
          'Authorization': `Bearer ${jwtTokens.accessToken}`
        }
      });
      
      console.log('※エラー※ 無効化されたトークンが受け入れられました:', response.data);
      return false;
    } catch (error) {
      // 期待されるエラー
      if (error.response && error.response.status === 401) {
        console.log('期待通りの結果: 無効化されたトークンが拒否されました');
        console.log('エラーメッセージ:', error.response.data);
        
        // エラーコードを確認
        if (error.response.data.code === 'TOKEN_VERSION_INVALID') {
          console.log('正確なエラーコード "TOKEN_VERSION_INVALID" を検出！');
        }
        
        return true;
      } else {
        console.error('予期しないエラー:', error.message);
        return false;
      }
    }
  } catch (error) {
    console.error('エッジケース2テストエラー:', error.response ? error.response.data : error.message);
    return false;
  }
}

/**
 * エッジケース3: リフレッシュトークン再利用検出テスト
 */
async function testRefreshTokenReuseDetection() {
  console.log('\n=== エッジケース3: リフレッシュトークン再利用検出 ===');
  
  try {
    // 1. まず正規のリフレッシュを実行
    console.log('正規のリフレッシュトークン更新を実行...');
    const refreshResponse = await axios.post(JWT_AUTH_ENDPOINTS.REFRESH_TOKEN, {
      refreshToken: jwtTokens.refreshToken
    });
    
    console.log('トークン更新成功。');
    
    // 更新後の新しいトークンを取得
    const newTokens = {
      accessToken: refreshResponse.data.tokens.accessToken,
      refreshToken: refreshResponse.data.tokens.refreshToken
    };
    
    // 2. 古いリフレッシュトークンを再利用して再度リフレッシュを試みる
    console.log('古いリフレッシュトークンを再利用...');
    try {
      const reusedResponse = await axios.post(JWT_AUTH_ENDPOINTS.REFRESH_TOKEN, {
        refreshToken: jwtTokens.refreshToken // 古いトークン
      });
      
      console.log('※エラー※ 再利用されたリフレッシュトークンが受け入れられました:', reusedResponse.data);
      return false;
    } catch (error) {
      // 期待されるエラー
      if (error.response && (error.response.status === 401 || error.response.status === 403)) {
        console.log('期待通りの結果: 再利用されたリフレッシュトークンが拒否されました');
        console.log('エラーステータス:', error.response.status);
        console.log('エラーメッセージ:', error.response.data);
        
        // セキュリティ対策が実施されたか確認
        if (error.response.data.code === 'TOKEN_REUSE_DETECTED') {
          console.log('正確なエラーコード "TOKEN_REUSE_DETECTED" を検出！');
        }
        
        return true;
      } else {
        console.error('予期しないエラー:', error.message);
        return false;
      }
    }
  } catch (error) {
    console.error('エッジケース3テストエラー:', error.response ? error.response.data : error.message);
    return false;
  }
}

/**
 * エッジケース4: ネットワーク回復テスト
 */
async function testNetworkRecovery() {
  console.log('\n=== エッジケース4: ネットワーク回復 ===');
  
  try {
    // ネットワーク回復フラグをヘッダーに含めてリクエスト
    const response = await axios.get(`${API_BASE_URL}/status`, {
      headers: {
        'X-Network-Recovery': 'true',
        'X-Device-ID': 'test-device-001',
        'Authorization': `Bearer ${firebaseToken}`
      }
    });
    
    // 回復確認ヘッダーをチェック
    const recoveryAcknowledged = response.headers['x-recovery-acknowledged'];
    
    if (recoveryAcknowledged === 'true') {
      console.log('ネットワーク回復ヘッダーを検出!');
      console.log('サーバーがネットワーク回復を正常に認識しました');
      return true;
    } else {
      console.log('※警告※ ネットワーク回復ヘッダーが返されませんでした');
      return false;
    }
  } catch (error) {
    console.error('エッジケース4テストエラー:', error.response ? error.response.data : error.message);
    return false;
  }
}

/**
 * 複数デバイスからのログインシミュレーション
 */
async function testMultiDeviceLogin() {
  console.log('\n=== エッジケース5: 複数デバイスからのログイン ===');
  
  try {
    // 別のデバイスIDでのリクエストをシミュレート
    for (let i = 1; i <= 3; i++) {
      console.log(`デバイス${i}からのリクエストをシミュレート...`);
      
      const response = await axios.get(`${API_BASE_URL}/users/profile`, {
        headers: {
          'Authorization': `Bearer ${firebaseToken}`,
          'X-Device-ID': `simulation-device-${i}`
        }
      });
      
      console.log(`デバイス${i}からのリクエスト成功。ステータス: ${response.status}`);
    }
    
    console.log('複数デバイスからのログインシミュレーション成功!');
    return true;
  } catch (error) {
    console.error('エッジケース5テストエラー:', error.response ? error.response.data : error.message);
    return false;
  }
}

/**
 * すべてのエッジケーステストを実行
 */
async function runAllTests() {
  if (!firebaseToken) {
    console.error('Firebaseトークンが指定されていません。');
    console.error('使用法: node test-jwt-edge-cases.js <Firebase認証トークン>');
    console.error('トークンは`node scripts/get-token.js shiraishi.tatsuya@mikoto.co.jp aikakumei`で取得できます。');
    process.exit(1);
  }
  
  console.log('JWT認証エッジケーステスト開始...');
  
  // テスト結果を追跡
  const results = {
    jwtSetup: false,
    expiryWarning: false,
    tokenVersionMismatch: false,
    refreshTokenReuse: false,
    networkRecovery: false,
    multiDeviceLogin: false
  };
  
  // JWT認証トークンを設定
  results.jwtSetup = await setupJwtTokens();
  
  if (results.jwtSetup) {
    // 各エッジケーステストを実行
    results.expiryWarning = await testExpiryWarningHeaders();
    results.tokenVersionMismatch = await testTokenVersionMismatch();
    // 以前のリフレッシュトークンで再実行
    results.refreshTokenReuse = await testRefreshTokenReuseDetection();
    results.networkRecovery = await testNetworkRecovery();
    results.multiDeviceLogin = await testMultiDeviceLogin();
  } else {
    console.log('JWT認証トークンの準備に失敗したため、テストを中止します。');
    return;
  }
  
  // 結果サマリーを表示
  console.log('\n=== テスト結果サマリー ===');
  console.log('1. JWT認証トークン準備:', results.jwtSetup ? '✅ 成功' : '❌ 失敗');
  console.log('2. 期限切れ警告ヘッダー:', results.expiryWarning ? '✅ 成功' : '❌ 失敗/未検出');
  console.log('3. トークンバージョン不一致:', results.tokenVersionMismatch ? '✅ 成功' : '❌ 失敗');
  console.log('4. リフレッシュトークン再利用検出:', results.refreshTokenReuse ? '✅ 成功' : '❌ 失敗');
  console.log('5. ネットワーク回復:', results.networkRecovery ? '✅ 成功' : '❌ 失敗');
  console.log('6. 複数デバイスログイン:', results.multiDeviceLogin ? '✅ 成功' : '❌ 失敗');
  
  const successCount = Object.values(results).filter(Boolean).length;
  const totalTests = Object.keys(results).length;
  
  console.log(`\n全体の結果: ${successCount}/${totalTests} テスト成功`);
  
  if (successCount === totalTests) {
    console.log('🎉 すべてのエッジケーステストが成功しました！JWT認証システムは堅牢です。');
  } else {
    console.log('⚠️ 一部のテストが失敗しました。上記のエラーメッセージを確認してください。');
  }
}

// テストを実行
runAllTests().catch(error => {
  console.error('テスト実行中にエラーが発生しました:', error);
});