# 認証システムアーキテクチャ設計

このドキュメントでは、DailyFortuneアプリケーションの認証システムアーキテクチャについて定義します。

## 1. 認証サービス選択

DailyFortuneの認証システムには **Firebase Authentication** を採用します。

### 選定理由:

1. **堅牢なセキュリティ**
   - グーグルのインフラストラクチャによる高いセキュリティ
   - なりすまし防止、漏洩対策など複数のセキュリティ機能を標準搭載

2. **管理の容易さ**
   - 日本語対応の管理コンソール
   - 認証関連の複雑な実装を外部化でき、開発工数を削減

3. **複数の認証方法**
   - メール/パスワード認証の基本機能
   - 将来的なソーシャルログイン（Google, Apple等）拡張の容易さ

4. **スケーラビリティ**
   - 無料枠で十分なクォータ（10万ユーザー/月）
   - 必要に応じて容易にスケールアップ可能

5. **シームレスな統合**
   - フロントエンド（React）とのネイティブ連携
   - Firebase Hostingとの相性の良さ

## 2. 認証フロー設計

### 2.1 基本認証フロー

```
+---------------+    1. ログイン要求     +--------------------+
|               | ------------------->  |                    |
|   ユーザー     |                       |  Firebase Auth     |
|  (ブラウザ)    | <-------------------  |                    |
+---------------+    2. トークン返却     +--------------------+
        |                                          |
        | 3. トークンを                             | 4. トークン検証
        |    付与してAPI要求                        |    (Firebase Admin SDK)
        v                                          v
+------------------------------------+    +--------------------+
|                                    |    |                    |
|           APIサーバー               | <- |  バックエンド処理   |
|                                    |    |                    |
+------------------------------------+    +--------------------+
```

### 2.2 ログインフロー

1. ユーザーがログインフォームに認証情報（メール/パスワード）を入力
2. クライアントアプリがFirebase Authentication SDKを使用して認証リクエストを送信
3. 認証成功時、FirebaseからIDトークン、リフレッシュトークンを取得
4. クライアントはIDトークンをローカルストレージに保存
5. 以降のAPI要求はIDトークンをAuthorizationヘッダーに含めて送信

### 2.3 会員登録フロー

1. ユーザーが登録フォームに必要情報（メール/パスワード/表示名）を入力
2. クライアントアプリがFirebase Authentication SDKを使用してユーザー作成
3. 登録成功時、FirebaseからIDトークンを取得
4. バックエンドAPIにユーザー追加情報を送信してユーザーレコード作成
5. 登録完了後、プロフィール設定ページにリダイレクト

### 2.4 認証状態管理

1. アプリ起動時に認証状態をチェック（Firebase Auth onAuthStateChangedリスナー）
2. 認証済みの場合、IDトークンを取得してAPIリクエストに使用
3. トークン有効期限切れの場合、リフレッシュトークンを使用して自動更新
4. ログアウト時にローカルストレージからトークンを削除

## 3. 認証コンテキスト実装

認証状態はアプリケーション全体で共有される中央管理型の認証コンテキストで管理します。

```tsx
// client/src/contexts/AuthContext.tsx
import { createContext, useContext, useState, useEffect } from 'react';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { app } from '../config/firebase';

const auth = getAuth(app);

// 認証コンテキスト型定義
type AuthContextType = {
  currentUser: any;
  loading: boolean;
  login: (email: string, password: string) => Promise<any>;
  register: (email: string, password: string, displayName: string) => Promise<any>;
  logout: () => Promise<void>;
  isAdmin: boolean;
  isSuperAdmin: boolean;
};

// 認証コンテキスト作成
const AuthContext = createContext<AuthContextType | null>(null);

// 認証プロバイダーコンポーネント
export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState('user');
  const [loading, setLoading] = useState(true);

  // ユーザー認証状態の監視
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      if (user) {
        // ユーザーの詳細情報（権限など）をAPIから取得
        try {
          const idToken = await user.getIdToken();
          const response = await fetch('/api/v1/auth/profile', {
            headers: {
              Authorization: `Bearer ${idToken}`
            }
          });
          const userData = await response.json();
          setUserRole(userData.role);
        } catch (error) {
          console.error('ユーザー情報取得エラー:', error);
        }
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // ログイン機能
  const login = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  // 会員登録機能
  const register = async (email, password, displayName) => {
    // Firebaseで認証ユーザー作成
    const result = await createUserWithEmailAndPassword(auth, email, password);
    
    // バックエンドAPIにユーザー情報を登録
    const idToken = await result.user.getIdToken();
    await fetch('/api/v1/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`
      },
      body: JSON.stringify({ displayName })
    });
    
    return result;
  };

  // ログアウト機能
  const logout = () => {
    return signOut(auth);
  };

  // 管理者権限チェック
  const isAdmin = userRole === 'admin' || userRole === 'super_admin';
  
  // スーパー管理者権限チェック
  const isSuperAdmin = userRole === 'super_admin';

  const value = {
    currentUser,
    loading,
    login,
    register,
    logout,
    isAdmin,
    isSuperAdmin
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

// 認証コンテキストフック
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
```

## 4. ルート保護パターン

認証が必要なルートを保護するために、専用の`ProtectedRoute`コンポーネントを実装します。

```tsx
// client/src/components/common/ProtectedRoute.tsx
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

// 保護されたルートコンポーネント
export const ProtectedRoute = ({ 
  children, 
  requiredRole = 'user'  // デフォルトは一般ユーザー
}) => {
  const { currentUser, loading, isAdmin, isSuperAdmin } = useAuth();
  const location = useLocation();

  // 認証状態ロード中は何も表示しない
  if (loading) {
    return <div>Loading...</div>;
  }

  // 未ログインの場合はログインページにリダイレクト
  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 権限チェック
  if (requiredRole === 'admin' && !isAdmin) {
    return <Navigate to="/unauthorized" replace />;
  }

  if (requiredRole === 'super_admin' && !isSuperAdmin) {
    return <Navigate to="/unauthorized" replace />;
  }

  // 認証&権限チェック通過後、子コンポーネントをレンダリング
  return children;
};
```

## 5. ルート定義

認証状態に基づくルーティング設定は以下のように実装します。

```tsx
// client/src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/common/ProtectedRoute';

// ページコンポーネント
import { Login } from './pages/Login';
import { Register } from './pages/Login/Register';
import { ForgotPassword } from './pages/Login/ForgotPassword';
import { Profile } from './pages/Profile';
import { Fortune } from './pages/Fortune';
import { Chat } from './pages/Chat';
import { Team } from './pages/Team';
import { AdminDashboard } from './pages/Admin';
import { Unauthorized } from './pages/Unauthorized';

const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* 公開ルート */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* 一般ユーザー保護ルート */}
          <Route path="/profile" element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } />
          <Route path="/fortune" element={
            <ProtectedRoute>
              <Fortune />
            </ProtectedRoute>
          } />
          <Route path="/chat" element={
            <ProtectedRoute>
              <Chat />
            </ProtectedRoute>
          } />
          <Route path="/team" element={
            <ProtectedRoute>
              <Team />
            </ProtectedRoute>
          } />

          {/* 管理者保護ルート */}
          <Route path="/admin/*" element={
            <ProtectedRoute requiredRole="admin">
              <AdminDashboard />
            </ProtectedRoute>
          } />

          {/* デフォルトルート */}
          <Route path="/" element={<Navigate to="/fortune" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
```

## 6. バックエンド認証検証

バックエンドでは、Firebase Admin SDKを使用してIDトークンを検証する認証ミドルウェアを実装します。

```typescript
// server/src/middleware/auth.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { getAuth } from 'firebase-admin/auth';
import { firebaseAdmin } from '../config/firebase';
import { UserRole } from '../../shared';

// リクエスト型拡張
interface AuthRequest extends Request {
  user?: {
    uid: string;
    email: string;
    role: UserRole;
  };
}

// 認証ミドルウェア
export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: '認証トークンがありません' });
    }
    
    const token = authHeader.split('Bearer ')[1];
    
    // Firebaseでトークン検証
    const decodedToken = await getAuth().verifyIdToken(token);
    
    if (!decodedToken.uid) {
      return res.status(401).json({ message: '無効なトークンです' });
    }
    
    // データベースからユーザー情報取得（役割など）
    const user = await getUserFromDatabase(decodedToken.uid);
    
    if (!user) {
      return res.status(401).json({ message: 'ユーザーが見つかりません' });
    }
    
    // リクエストオブジェクトにユーザー情報を添付
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email || '',
      role: user.role
    };
    
    next();
  } catch (error) {
    console.error('認証エラー:', error);
    return res.status(401).json({ message: '認証に失敗しました' });
  }
};

// 管理者権限ミドルウェア
export const requireAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return res.status(401).json({ message: '認証されていません' });
  }
  
  if (req.user.role !== UserRole.ADMIN && req.user.role !== UserRole.SUPER_ADMIN) {
    return res.status(403).json({ message: '管理者権限が必要です' });
  }
  
  next();
};

// スーパー管理者権限ミドルウェア
export const requireSuperAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return res.status(401).json({ message: '認証されていません' });
  }
  
  if (req.user.role !== UserRole.SUPER_ADMIN) {
    return res.status(403).json({ message: 'スーパー管理者権限が必要です' });
  }
  
  next();
};

// データベースからユーザー情報を取得する関数
const getUserFromDatabase = async (uid: string) => {
  // MongoDBなどのデータベースからユーザー情報を取得する実装
  // （実際の実装は省略）
  
  return {
    uid,
    role: UserRole.USER // デフォルト役割
  };
};
```

## 7. 権限管理

DailyFortuneでは3階層の権限レベルを定義します：

### 7.1 権限レベル定義

| 権限レベル | 説明 | アクセス範囲 |
|------------|------|-------------|
| **USER**<br>(一般ユーザー) | チームメンバー/従業員 | - 個人プロフィール管理<br>- 四柱推命情報閲覧<br>- 個人運勢閲覧<br>- AIチャット機能利用<br>- チームメンバー情報閲覧<br>- チーム相性情報閲覧 |
| **ADMIN**<br>(管理者) | 経営者/チームリーダー | - 一般ユーザー権限すべて<br>- チーム管理（メンバー追加/編集）<br>- チーム目標設定<br>- 経営者ダッシュボード閲覧<br>- メンバーインサイト閲覧<br>- アラート通知確認 |
| **SUPER_ADMIN**<br>(システム管理者) | システム全体の管理者 | - 管理者権限すべて<br>- 管理者サイト専用機能<br>- 管理者アカウント管理<br>- システム設定変更<br>- 利用統計閲覧<br>- メンテナンス機能 |

### 7.2 権限遷移

1. 新規ユーザー登録時は常に`USER`権限で登録
2. `ADMIN`権限は`SUPER_ADMIN`のみが付与可能
3. `SUPER_ADMIN`権限は最初の管理者アカウントのみ持ち、他の`SUPER_ADMIN`が追加可能

### 7.3 権限チェック実装例（API）

```typescript
// server/src/routes/admin.routes.ts
import { Router } from 'express';
import { authenticate, requireAdmin, requireSuperAdmin } from '../middleware/auth.middleware';
import * as adminController from '../controllers/admin.controller';

const router = Router();

// 管理者ダッシュボード（Admin権限）
router.get('/dashboard', authenticate, requireAdmin, adminController.getDashboard);

// ユーザーインサイト（Admin権限）
router.get('/insights/user/:userId', authenticate, requireAdmin, adminController.getUserInsights);

// チームインサイト（Admin権限）
router.get('/insights/team/:teamId', authenticate, requireAdmin, adminController.getTeamInsights);

// システム設定（SuperAdmin権限）
router.get('/settings', authenticate, requireSuperAdmin, adminController.getSystemSettings);

// 設定更新（SuperAdmin権限）
router.put('/settings/:key', authenticate, requireSuperAdmin, adminController.updateSystemSetting);

// 統計情報（SuperAdmin権限）
router.get('/stats', authenticate, requireSuperAdmin, adminController.getSystemStats);

// 管理者管理（SuperAdmin権限）
router.get('/admins', authenticate, requireSuperAdmin, adminController.getAdmins);
router.post('/admins', authenticate, requireSuperAdmin, adminController.addAdmin);
router.delete('/admins/:userId', authenticate, requireSuperAdmin, adminController.removeAdmin);
router.put('/admins/:userId/role', authenticate, requireSuperAdmin, adminController.updateAdminRole);

export default router;
```

## 8. セキュリティ対策

### 8.1 トークンセキュリティ

1. **トークン保存**
   - IDトークンはローカルストレージに保存
   - リフレッシュトークンはHTTP Onlyセキュアクッキーで保存

2. **トークン有効期限**
   - IDトークンの有効期限: 1時間（Firebase デフォルト）
   - リフレッシュトークンの有効期限: 30日

3. **自動更新メカニズム**
   - Firebase SDKが自動的にトークンを更新
   - バックグラウンドでの透過的な更新

### 8.2 CSRF対策

1. Firebase Authentication SDKの内部的なCSRF対策を活用
2. 重要な操作（パスワード変更など）は再認証を要求

### 8.3 入力検証

1. フロントエンドとバックエンドの両方で入力検証を実施
2. APIリクエストはスキーマベースのバリデーションで検証

### 8.4 レート制限

1. ログイン試行回数制限（Firebase機能）
2. API要求の速度制限（Express rate-limiterミドルウェア）

## 9. 認証関連機能

### 9.1 パスワードリセット

1. ユーザーがパスワードリセットフォームでメールアドレスを入力
2. Firebase Authentication SDKの`sendPasswordResetEmail`を使用
3. ユーザーはメール内のリンクからパスワードをリセット

### 9.2 メール検証

1. 新規登録時にFirebase Authentication SDKの`sendEmailVerification`を使用
2. ユーザーはメール内のリンクからアカウントを検証
3. バックエンドでのアクセス制御時に検証状態をチェック可能

### 9.3 アカウント管理

1. ユーザーはプロフィールページでパスワード変更可能
2. Firebase Authentication SDKの`updatePassword`を使用
3. 重要な変更（メールアドレス変更など）は再認証を要求

## 10. モバイル対応

DailyFortuneはモバイルファーストで設計されており、認証システムもモバイルデバイスに最適化されています。

1. **PWA対応**
   - ServiceWorkerを使用したオフライン認証状態の保持
   - 再接続時の自動的な認証状態の同期

2. **モバイル操作性**
   - タッチフレンドリーなログインフォーム
   - 生体認証（TouchID/FaceID）対応（将来実装）

## 11. まとめ

この認証アーキテクチャは、セキュリティ、使いやすさ、保守性、拡張性のバランスを取りながら、DailyFortuneの要件に適した設計となっています。Firebase Authenticationを中心に据えることで、認証における複雑な実装を簡素化し、開発リソースをビジネスロジックに集中させることができます。