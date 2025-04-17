import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import * as fs from 'fs';

// ユーザーのメールアドレス
const EMAIL = 'shiraishi.tatsuya@mikoto.co.jp';
const ROLE = 'super_admin';

// サービスアカウントのパス
const SERVICE_ACCOUNT_PATH = '/Users/tatsuya/Desktop/システム開発/DailyFortune/docs/scopes/sys-76614112762438486420044584-firebase-adminsdk-fbsvc-cfd0a33bc9.json';

// Firebase初期化
async function initFirebase() {
  try {
    const serviceAccountJson = JSON.parse(fs.readFileSync(SERVICE_ACCOUNT_PATH, 'utf8'));
    
    const app = initializeApp({
      credential: cert(serviceAccountJson),
      databaseURL: `https://${serviceAccountJson.project_id}.firebaseio.com`
    }, 'update-admin-script');

    return getAuth(app);
  } catch (error) {
    console.error('Firebase初期化エラー:', error);
    throw error;
  }
}

// ユーザー権限の更新
async function updateUserRole() {
  try {
    const auth = await initFirebase();
    
    // ユーザーを取得
    const user = await auth.getUserByEmail(EMAIL);
    console.log(`現在のユーザー: ${user.displayName || user.email}`);
    console.log('現在の権限:', user.customClaims?.role || 'なし');
    
    // 権限を更新
    await auth.setCustomUserClaims(user.uid, { role: ROLE });
    
    // 更新後の確認
    const updatedUser = await auth.getUser(user.uid);
    console.log('更新後の権限:', updatedUser.customClaims?.role);
    console.log(`ユーザー ${EMAIL} の権限を ${ROLE} に変更しました`);
    
  } catch (error) {
    console.error('エラー:', error);
  }
}

// メイン処理
updateUserRole();