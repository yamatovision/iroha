import { ReactNode, useEffect, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import tokenService from '../../services/auth/token.service'
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
  const { userProfile, loading, isAdmin, isSuperAdmin } = useAuth()
  const location = useLocation()
  const [tokenChecking, setTokenChecking] = useState(true)
  const [hasJwtToken, setHasJwtToken] = useState(false)

  // JWT認証のアクセストークンを確認（非同期処理）
  useEffect(() => {
    const checkToken = async () => {
      try {
        const token = await tokenService.getAccessToken()
        const isValid = await tokenService.isAccessTokenValid()
        setHasJwtToken(!!token && isValid)
      } catch (error) {
        console.error('トークン検証エラー:', error)
        setHasJwtToken(false)
      } finally {
        setTokenChecking(false)
      }
    }

    if (!loading) {
      checkToken()
    }
  }, [loading])

  // 認証状態またはトークンチェック中はローディングを表示
  if (loading || tokenChecking) {
    return <LoadingIndicator message="認証情報を確認中..." size="medium" />
  }
  
  // 未ログインの場合はログインページにリダイレクト
  if (!hasJwtToken) {
    console.log("JWT認証情報がありません。ログイン画面へリダイレクトします。");
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
