import { ReactNode, useEffect, useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
// tokenService は verifyAuthStatus によって内部的に使用されるため、直接インポートは不要
import LoadingIndicator from './LoadingIndicator'

type ProtectedRouteProps = {
  children: ReactNode
  requiredRole?: 'user' | 'admin' | 'super_admin'
}

// 保護されたルートコンポーネント
export const ProtectedRoute = ({ 
  children, 
  requiredRole = 'user'  // デフォルトは一般ユーザー
}: ProtectedRouteProps) => {
  const { userProfile, loading, isAdmin, isSuperAdmin, tokenError, verifyAuthStatus } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [tokenChecking, setTokenChecking] = useState(true)
  const [hasValidAuth, setHasValidAuth] = useState(false)

  // JWT認証のアクセストークンを確認（非同期処理）
  useEffect(() => {
    const checkToken = async () => {
      try {
        // 認証状態をチェック
        const isAuthenticated = await verifyAuthStatus()
        setHasValidAuth(isAuthenticated)
        
        // トークンエラーがある場合の処理
        if (tokenError) {
          console.log(`認証エラーが検出されました: ${tokenError}`);
          navigate('/login', { state: { from: location }, replace: true });
          return;
        }
      } catch (error) {
        console.error('トークン検証エラー:', error)
        setHasValidAuth(false)
      } finally {
        setTokenChecking(false)
      }
    }

    if (!loading) {
      checkToken()
    }
  }, [loading, tokenError, navigate, location, verifyAuthStatus])

  // 認証状態またはトークンチェック中はローディングを表示
  if (loading || tokenChecking) {
    return <LoadingIndicator message="認証情報を確認中..." size="medium" />
  }
  
  // 未ログインの場合はログインページにリダイレクト
  if (!hasValidAuth) {
    console.log("有効な認証情報がありません。ログイン画面へリダイレクトします。");
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // ユーザープロフィールが取得できていない場合はログイン画面へリダイレクト
  if (!userProfile) {
    console.log("ユーザープロフィールが取得できていません。ログイン画面へリダイレクトします。");
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // 権限チェック
  if (requiredRole === 'admin' && !isAdmin) {
    return <Navigate to="/unauthorized" replace />
  }

  if (requiredRole === 'super_admin' && !isSuperAdmin) {
    return <Navigate to="/unauthorized" replace />
  }

  // 認証&権限チェック通過後、子コンポーネントをレンダリング
  return <>{children}</>
}