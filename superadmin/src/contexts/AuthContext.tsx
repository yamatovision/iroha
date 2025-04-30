import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/auth.service';
import tokenService from '../services/token.service';
import { UserRole } from '../types';

type User = {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  organizationId?: string;
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
};

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const initAuth = async () => {
      try {
        // アクセストークンの検証
        const token = await tokenService.getAccessToken();
        if (token) {
          const isValid = await tokenService.isAccessTokenValid();
          if (isValid) {
            // ユーザープロフィールの取得
            const userInfo = await authService.getProfile();
            // SuperAdmin権限をチェック
            if (userInfo && authService.checkIsSuperAdmin(userInfo)) {
              setUser(userInfo);
            } else {
              // SuperAdmin権限がない場合はログアウト
              await tokenService.clearTokens();
              navigate('/login');
            }
          } else {
            // トークンリフレッシュを試行
            const refreshResult = await authService.refreshToken();
            if (refreshResult.success) {
              const userInfo = await authService.getProfile();
              if (userInfo && authService.checkIsSuperAdmin(userInfo)) {
                setUser(userInfo);
              } else {
                await tokenService.clearTokens();
                navigate('/login');
              }
            } else {
              // リフレッシュ失敗時はログイン画面へ
              navigate('/login');
            }
          }
        }
      } catch (err) {
        console.error('認証初期化エラー:', err);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, [navigate]);

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await authService.login(email, password);
      
      // SuperAdmin権限チェック
      if (response.user.role !== 'SuperAdmin') {
        setError('SuperAdmin権限が必要です');
        await authService.logout();
        return;
      }
      
      setUser(response.user);
    } catch (err: any) {
      setError(err.message || 'ログインに失敗しました');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
      setUser(null);
      navigate('/login');
    } catch (err) {
      console.error('ログアウトエラー:', err);
    }
  };

  const value = {
    user,
    loading,
    error,
    login,
    logout,
    isAuthenticated: !!user
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthはAuthProviderの中で使用する必要があります');
  }
  return context;
};