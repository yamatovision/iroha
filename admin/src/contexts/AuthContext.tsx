import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { IUser, UserRole, JWT_AUTH } from '@shared/index'
import axios from 'axios'

// JWTトークンデコード用の簡易関数
const parseJwt = (token: string) => {
  try {
    return JSON.parse(atob(token.split('.')[1]))
  } catch (e) {
    return null
  }
}

// 認証コンテキストの型定義
type AuthContextType = {
  userProfile: IUser | null
  loading: boolean
  login: (email: string, password: string) => Promise<IUser>
  logout: () => Promise<void>
  isSuperAdmin: boolean
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

  // 初期認証状態の確認
  useEffect(() => {
    const checkAuthState = async () => {
      try {
        // ローカルストレージからトークンを取得
        const token = localStorage.getItem('df_access_token')
        if (!token) {
          setLoading(false)
          return
        }

        // トークンの有効期限をチェック
        const decoded = parseJwt(token)
        if (!decoded || decoded.exp * 1000 < Date.now()) {
          console.log('トークンの有効期限が切れています')
          localStorage.removeItem('df_access_token')
          localStorage.removeItem('df_refresh_token')
          setLoading(false)
          return
        }

        // 有効なトークンがある場合はユーザー情報を取得
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080'
        const response = await axios.get(`${apiUrl}/api/v1/users/profile`, {
          headers: { Authorization: `Bearer ${token}` }
        })

        if (response.status === 200) {
          const userData = response.data
          setUserProfile(userData)
        }
      } catch (error) {
        console.error('認証状態の確認中にエラーが発生しました:', error)
        // エラーが発生した場合はトークンをクリア
        localStorage.removeItem('df_access_token')
        localStorage.removeItem('df_refresh_token')
      } finally {
        setLoading(false)
      }
    }

    checkAuthState()
  }, [])

  // JWT認証でのログイン
  const login = async (email: string, password: string): Promise<IUser> => {
    try {
      setLoading(true)
      
      // API URLを環境変数から取得
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080'
      
      // JWT認証エンドポイントにリクエスト
      const response = await axios.post(`${apiUrl}${JWT_AUTH.LOGIN}`, {
        email,
        password
      })
      
      if (response.status === 200 && response.data.tokens) {
        // トークンをローカルストレージに保存
        const { accessToken, refreshToken } = response.data.tokens
        localStorage.setItem('df_access_token', accessToken)
        localStorage.setItem('df_refresh_token', refreshToken)
        
        // ユーザープロファイルを設定
        setUserProfile(response.data.user)
        
        return response.data.user
      } else {
        throw new Error('ログインに失敗しました')
      }
    } catch (error) {
      console.error('ログインエラー:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  // ログアウト機能
  const logout = async () => {
    try {
      setLoading(true)
      const refreshToken = localStorage.getItem('df_refresh_token')
      
      if (refreshToken) {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080'
        // サーバー側のトークンを無効化
        await axios.post(`${apiUrl}${JWT_AUTH.LOGOUT}`, { refreshToken })
      }
    } catch (error) {
      console.error('ログアウトエラー:', error)
    } finally {
      // ローカルのトークンをクリア
      localStorage.removeItem('df_access_token')
      localStorage.removeItem('df_refresh_token')
      localStorage.removeItem('debugToken')
      setUserProfile(null)
      setLoading(false)
    }
  }

  // スーパー管理者権限チェック
  // 文字列として比較するため、UserRoleを文字列に変換して比較
  const role = userProfile?.role as string;
  const isSuperAdmin = role === UserRole.SUPER_ADMIN || 
                      role === 'SuperAdmin' || 
                      role === 'super_admin'

  const value = {
    userProfile,
    loading,
    login,
    logout,
    isSuperAdmin
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

// 認証コンテキストフック
export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
