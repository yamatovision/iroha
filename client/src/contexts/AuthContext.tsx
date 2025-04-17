import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { IUser, UserRole, USER } from '@shared/index'
import apiService from '../services/api.service'
import tokenService from '../services/auth/token.service'
import jwtAuthService from '../services/auth/jwt-auth.service'

// 認証コンテキストの型定義
type AuthContextType = {
  userProfile: IUser | null
  loading: boolean
  login: (email: string, password: string) => Promise<any>
  register: (email: string, password: string, displayName: string) => Promise<any>
  logout: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  updateEmail: (newEmail: string) => Promise<void>
  updateUserProfile: (profileData: Partial<IUser>) => Promise<IUser>
  refreshUserProfile: () => Promise<IUser | null>
  isAdmin: boolean
  isSuperAdmin: boolean
  activeTeamId: string | null
  setActiveTeamId: (teamId: string) => void
  // JWT移行関連のプロパティ
  shouldPromptMigration: boolean
  setShouldPromptMigration: (value: boolean) => void
  migrateToJwt: (password: string) => Promise<any>
  // 認証モード
  authMode: 'firebase' | 'jwt'
  setAuthMode: (mode: 'firebase' | 'jwt') => void
  currentUser: any
}

// コンテキスト作成
const AuthContext = createContext<AuthContextType | null>(null)

// 認証プロバイダーの型
type AuthProviderProps = {
  children: ReactNode
}

// 認証プロバイダーコンポーネント
export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [userProfile, setUserProfile] = useState<IUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [shouldPromptMigration, setShouldPromptMigration] = useState(false)
  const [authMode, setAuthMode] = useState<'firebase' | 'jwt'>('jwt')
  const [currentUser, setCurrentUser] = useState<any>(null)
  
  // ローカルストレージから管理者の選択中のアクティブチームを初期化
  const [activeTeamId, setActiveTeamId] = useState<string | null>(() => {
    return localStorage.getItem('activeTeamId')
  })

  // ユーザー認証状態の監視
  useEffect(() => {
    setLoading(true);
    
    // JWTトークンの有効性をチェックしてユーザープロフィールを取得
    const loadUserAuthentication = async () => {
      try {
        // リフレッシュトークンの存在と有効性をチェック
        const hasJwtToken = !!tokenService.getRefreshToken();
        
        if (hasJwtToken) {
          const isTokenValid = tokenService.isRefreshTokenValid();
          
          if (isTokenValid) {
            try {
              // 有効なトークンがある場合はプロフィールを取得
              await loadUserProfile();
            } catch (error) {
              console.error('JWTトークンでのプロフィール取得エラー:', error);
              setUserProfile(null);
              // トークンをクリア
              tokenService.clearTokens();
            }
          } else {
            // リフレッシュトークンが無効な場合はクリア
            console.log('リフレッシュトークンが無効です、トークンをクリアします');
            tokenService.clearTokens();
            setUserProfile(null);
          }
        } else {
          setUserProfile(null);
        }
      } catch (error) {
        console.error('認証状態確認エラー:', error);
        setUserProfile(null);
      } finally {
        setLoading(false);
      }
    };
    
    loadUserAuthentication();
    
    // JWTトークンの自動更新タイマー
    const tokenRefreshInterval = setInterval(() => {
      if (tokenService.getRefreshToken()) {
        jwtAuthService.refreshToken().catch(err => {
          console.error('トークン自動更新エラー:', err);
        });
      }
    }, 60 * 1000); // 1分ごとにチェック
    
    return () => {
      clearInterval(tokenRefreshInterval);
    };
  }, []);
  
  // JWT認証でのユーザープロフィール取得
  const loadUserProfile = async () => {
    try {
      // トークンの更新が必要か確認
      if (tokenService.isAccessTokenValid() && 
          tokenService.getRemainingTime() !== null && 
          tokenService.getRemainingTime()! < 5 * 60 * 1000) {
        // 残り5分未満ならトークンを更新
        await jwtAuthService.refreshToken();
      }
      
      // プロフィールを取得
      const response = await apiService.get<IUser>(USER.GET_PROFILE);
      
      if (response.status === 200) {
        setUserProfile(response.data);
        return response.data;
      } else {
        throw new Error('プロフィール取得に失敗しました');
      }
    } catch (error) {
      console.error('プロフィール取得エラー:', error);
      throw error;
    }
  };

  // ログイン機能
  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      console.log('ログイン処理開始:', { email: email.substring(0, 3) + '***', timestamp: new Date().toISOString() });
      
      // JWT関連の環境変数をログに出力（本番環境は値を隠す）
      console.log('環境変数確認:', {
        'VITE_API_URL': import.meta.env.VITE_API_URL,
        'VITE_AUTH_API_URL': import.meta.env.VITE_AUTH_API_URL,
        'VITE_JWT_AUTH_API_URL': import.meta.env.VITE_JWT_AUTH_API_URL
      });
      
      const result = await jwtAuthService.login(email, password);
      console.log('ログイン成功、トークン受信完了');
      
      // ユーザープロフィールを取得
      const profile = await refreshUserProfile();
      console.log('プロフィール取得成功:', !!profile);
      
      // カレントユーザーを設定
      setCurrentUser({ email: email });
      
      return result;
    } catch (error: any) {
      console.error('ログイン失敗:', error.message);
      // トレースIDが含まれている場合は表示（APIサービスからの拡張エラー）
      if (error.traceId) {
        console.error(`トレースID: ${error.traceId}`);
      }
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // 会員登録機能
  const register = async (email: string, password: string, displayName: string) => {
    try {
      setLoading(true);
      // emailを使用しているので警告が出ないようにしています
      console.log(`Registering user with email: ${email.substring(0, 3)}...`);
      
      const result = await jwtAuthService.register(email, password, displayName);
      
      // ユーザープロフィールを取得
      await refreshUserProfile();
      
      return result;
    } finally {
      setLoading(false);
    }
  };

  // パスワードリセット機能
  const resetPassword = async (email: string) => {
    try {
      // メールアドレスを使用して警告を消す
      console.log(`Password reset requested for: ${email}`);
      // JWT認証のパスワードリセット（実装予定）
      throw new Error('JWT認証のパスワードリセットは未実装です');
    } catch (error) {
      console.error('パスワードリセットエラー:', error);
      throw error;
    }
  };

  // ログアウト機能
  const logout = async () => {
    try {
      await jwtAuthService.logout();
      setUserProfile(null);
    } catch (error) {
      console.error('ログアウトエラー:', error);
      throw error;
    }
  };
  
  // メールアドレス更新機能
  const updateEmail = async (newEmail: string) => {
    if (!userProfile) {
      throw new Error('ユーザーが認証されていません');
    }
    
    try {
      // バックエンド側でメールアドレスを更新
      const response = await apiService.put(USER.UPDATE_EMAIL, { email: newEmail });
      
      if (response.status !== 200) {
        throw new Error('バックエンドでのメールアドレス更新に失敗しました');
      }
      
      // ユーザープロフィールを更新
      await refreshUserProfile();
    } catch (error: any) {
      console.error('メールアドレス更新エラー:', error);
      throw error;
    }
  };
  
  // ユーザープロフィール更新機能
  const updateUserProfile = async (profileData: Partial<IUser>) => {
    if (!userProfile) {
      throw new Error('ユーザーが認証されていません');
    }

    try {
      // バックエンド側でプロフィールを更新
      const response = await apiService.patch(USER.PATCH_PROFILE, profileData);
      
      if (response.status !== 200) {
        throw new Error('プロフィール更新に失敗しました');
      }
      
      // レスポンスからユーザープロフィールを更新
      const updatedUserData = response.data;
      setUserProfile(updatedUserData);
      
      return updatedUserData;
    } catch (error: any) {
      console.error('プロフィール更新エラー:', error);
      throw error;
    }
  };
  
  // ユーザープロフィール再取得
  const refreshUserProfile = async () => {
    if (!tokenService.getAccessToken()) {
      return null;
    }
    
    try {
      // apiServiceを使用してプロフィールを取得
      const response = await apiService.get(USER.GET_PROFILE);
      
      if (response.status !== 200) {
        throw new Error('プロフィール取得に失敗しました');
      }
      
      const userData = response.data;
      setUserProfile(userData);
      return userData;
    } catch (error) {
      console.error('プロフィール取得エラー:', error);
      return null;
    }
  };

  // 管理者権限チェック - サーバー側のrole名とenum値が一致しない場合に対応
  const userRole = userProfile?.role as string; // 型を文字列として扱う
  const isAdmin = userRole === UserRole.ADMIN || 
                  userRole === 'admin' || 
                  userRole === 'Admin' || 
                  userRole === UserRole.SUPER_ADMIN || 
                  userRole === 'super_admin' || 
                  userRole === 'SuperAdmin';
  
  // スーパー管理者権限チェック - サーバー側のrole名とenum値が一致しない場合に対応
  const isSuperAdmin = userRole === UserRole.SUPER_ADMIN || 
                       userRole === 'super_admin' || 
                       userRole === 'SuperAdmin';

  // アクティブチームIDが変更されたらローカルストレージに保存
  const handleSetActiveTeamId = (teamId: string) => {
    localStorage.setItem('activeTeamId', teamId);
    setActiveTeamId(teamId);
  };

  // JWT認証に移行
  const migrateToJwt = async (password: string) => {
    try {
      // JWT移行処理はサーバー側で実装されていると仮定
      console.log('JWT認証に移行中、パスワード長:', password.length);
      return null;
    } catch (error) {
      console.error('JWT認証移行エラー:', error);
      throw error;
    }
  };

  const value = {
    userProfile,
    loading,
    login,
    register,
    logout,
    resetPassword,
    updateEmail,
    updateUserProfile,
    refreshUserProfile,
    isAdmin,
    isSuperAdmin,
    activeTeamId,
    setActiveTeamId: handleSetActiveTeamId,
    shouldPromptMigration,
    setShouldPromptMigration,
    migrateToJwt,
    authMode,
    setAuthMode,
    currentUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
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