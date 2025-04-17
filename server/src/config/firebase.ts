/**
 * Firebase認証は廃止されました。
 * 互換性のためのダミー実装です。
 * 全ての認証はJWTベースに移行済みです。
 */

// ダミーの認証オブジェクト（既存コードがインポートしている場合に備えて）
export const auth = {
  createUser: async () => {
    console.warn('Firebase認証は廃止されました。JWTベースの認証を使用してください。');
    throw new Error('Firebase認証は廃止されました。');
  },
  
  setCustomUserClaims: async () => {
    console.warn('Firebase認証は廃止されました。JWTベースの認証を使用してください。');
    throw new Error('Firebase認証は廃止されました。');
  },
  
  deleteUser: async () => {
    console.warn('Firebase認証は廃止されました。JWTベースの認証を使用してください。');
    throw new Error('Firebase認証は廃止されました。');
  },
  
  verifyIdToken: async () => {
    console.warn('Firebase認証は廃止されました。JWTベースの認証を使用してください。');
    throw new Error('Firebase認証は廃止されました。');
  }
};

// ダミーのFirebaseアプリ
export const firebaseAdmin = {
  name: 'firebase-auth-deprecated'
};