import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { IUser, UserRole, USER } from '@shared/index'
import apiService from '../services/api.service'
import tokenService from '../services/auth/token.service'
import jwtAuthService from '../services/auth/jwt-auth.service'
import storageService from '../services/storage/storage-factory'

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
  // 認証状態関連
  verifyAuthStatus: () => Promise<boolean>
  tokenError: string | null
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
  // 認証関連の状態
  const [tokenError, setTokenError] = useState<string | null>(null)
  
  // アクティブチームIDの初期化は空文字列から始めて非同期で更新
  const [activeTeamId, setActiveTeamId] = useState<string | null>(null)

  // 初期設定の読み込み
  useEffect(() => {
    const loadInitialSettings = async () => {
      try {
        // アクティブチームIDを読み込み
        const savedTeamId = await storageService.get('activeTeamId');
        if (savedTeamId) {
          setActiveTeamId(savedTeamId);
        }
      } catch (error) {
        console.error('初期設定読み込みエラー:', error);
      }
    };
    
    loadInitialSettings();
  }, []);

  // ユーザー認証状態の監視
  useEffect(() => {
    setLoading(true);
    
    // JWTトークンの有効性をチェックしてユーザープロフィールを取得
    const loadUserAuthentication = async () => {
      try {
        // リフレッシュトークンの存在を確認
        const refreshToken = await tokenService.getRefreshToken();
        const hasJwtToken = !!refreshToken;
        
        if (hasJwtToken) {
          // トークンの有効性をチェック
          const isTokenValid = await tokenService.isRefreshTokenValid();
          
          if (isTokenValid) {
            try {
              // 有効なトークンがある場合はプロフィールを取得
              await loadUserProfile();
              // トークンエラーをクリア
              setTokenError(null);
            } catch (error) {
              console.error('JWTトークンでのプロフィール取得エラー:', error);
              setUserProfile(null);
              // トークンをクリア
              await tokenService.clearTokens();
            }
          } else {
            // リフレッシュトークンが無効な場合はクリア
            console.log('リフレッシュトークンが無効です、トークンをクリアします');
            await tokenService.clearTokens();
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
    
    // セッションマネージャーがトークン管理を行うため、ここでの更新タイマーは不要
    // 代わりに、認証状態の変更を検出するリスナーを追加
    
    return () => {
      // クリーンアップ時の処理
      console.log('AuthContext: クリーンアップ');
    };
  }, []);
  
  // JWT認証でのユーザープロフィール取得
  const loadUserProfile = async () => {
    try {
      // トークンの更新が必要か確認
      const isValid = await tokenService.isAccessTokenValid();
      const remainingTime = await tokenService.getRemainingTime();
      
      if (isValid && remainingTime !== null && remainingTime < 5 * 60 * 1000) {
        // 残り5分未満ならトークンを更新
        const refreshResult = await jwtAuthService.refreshToken();
        if (!refreshResult.success) {
          if (refreshResult.error === 'token_mismatch') {
            setTokenError('token_mismatch');
            return null;
          }
        }
      }
      
      // プロフィールを取得
      const response = await apiService.get<IUser>(USER.GET_PROFILE);
      
      if (response.status === 200) {
        // トークンからユーザーIDを取得
        const tokenPayload = await tokenService.getTokenPayload();
        
        // ユーザーIDの整合性をチェック
        if (tokenPayload && response.data.id !== tokenPayload.sub) {
          console.error('ユーザーID不一致エラー', {
            profileId: response.data.id,
            tokenSubject: tokenPayload.sub
          });
          
          // トークンをクリアして認証エラー状態に
          await tokenService.clearTokens();
          setTokenError('user_id_mismatch');
          throw new Error('ユーザー認証の不整合が検出されました');
        }
        
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
      
      // ログイン後にキャッシュをクリア
      await apiService.clearCache('/api/v1/users/profile');
      console.log('ユーザープロフィールキャッシュをクリアしました');
      
      // ユーザープロフィールを取得
      const profile = await refreshUserProfile();
      console.log('プロフィール取得成功:', !!profile);
      
      // トークンエラーをクリア
      setTokenError(null);
      
      // トークンからユーザーIDを取得
      const tokenPayload = await tokenService.getTokenPayload();
      
      // ユーザーIDの整合性をチェック
      if (profile && tokenPayload && profile.id !== tokenPayload.sub) {
        console.error('ユーザーID不一致エラー', {
          profileId: profile.id,
          tokenSubject: tokenPayload.sub
        });
        
        // トークンをクリアして認証エラー状態に
        await tokenService.clearTokens();
        setTokenError('user_id_mismatch');
        throw new Error('ユーザー認証の不整合が検出されました');
      }
      
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
      // アクティブユーザーがいる場合はログアウト処理を実行
      
      // ログアウト実行
      await jwtAuthService.logout();
      
      // キャッシュをクリア
      try {
        await apiService.clearCache();
        console.log('アプリキャッシュをクリアしました');
      } catch (cacheError) {
        console.error('キャッシュクリアエラー:', cacheError);
      }
      
      // 状態をクリア
      setUserProfile(null);
      setTokenError(null);
      
      return;
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
    const accessToken = await tokenService.getAccessToken();
    if (!accessToken) {
      return null;
    }
    
    try {
      // apiServiceを使用してプロフィールを取得
      const response = await apiService.get(USER.GET_PROFILE);
      
      if (response.status !== 200) {
        throw new Error('プロフィール取得に失敗しました');
      }
      
      const userData = response.data;
      
      // トークンからユーザーIDを取得
      const tokenPayload = await tokenService.getTokenPayload();
      
      // ユーザーIDの整合性をチェック
      if (tokenPayload && userData.id !== tokenPayload.sub) {
        console.error('ユーザーID不一致エラー', {
          profileId: userData.id,
          tokenSubject: tokenPayload.sub
        });
        
        // トークンをクリアして認証エラー状態に
        await tokenService.clearTokens();
        setTokenError('user_id_mismatch');
        throw new Error('ユーザー認証の不整合が検出されました');
      }
      
      setUserProfile(userData);
      return userData;
    } catch (error) {
      console.error('プロフィール取得エラー:', error);
      return null;
    }
  };

  // 認証状態を検証する関数
  const verifyAuthStatus = async (): Promise<boolean> => {
    try {
      const accessToken = await tokenService.getAccessToken();
      if (!accessToken) {
        return false;
      }
      
      const isValid = await tokenService.isAccessTokenValid();
      if (!isValid) {
        const refreshResult = await jwtAuthService.refreshToken();
        if (!refreshResult.success) {
          if (refreshResult.error === 'token_mismatch') {
            setTokenError('token_mismatch');
          }
          return false;
        }
      }
      
      // トークンは有効だがユーザープロフィールがない場合、取得を試みる
      if (!userProfile) {
        const profile = await refreshUserProfile();
        return !!profile;
      }
      
      return true;
    } catch (error) {
      console.error('認証状態検証エラー:', error);
      return false;
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
  const handleSetActiveTeamId = async (teamId: string) => {
    try {
      await storageService.set('activeTeamId', teamId);
      setActiveTeamId(teamId);
      console.log(`アクティブチームIDを設定: ${teamId}`);
    } catch (error) {
      console.error('アクティブチームID保存エラー:', error);
    }
  };

  // 認証関連の補助関数（必要に応じて追加）

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
    verifyAuthStatus,
    tokenError
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