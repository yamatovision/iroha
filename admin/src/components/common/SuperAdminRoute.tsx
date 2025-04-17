import { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import LoadingIndicator from './LoadingIndicator'

type SuperAdminRouteProps = {
  children: ReactNode
}

// スーパー管理者専用ルート保護コンポーネント
export const SuperAdminRoute = ({ children }: SuperAdminRouteProps) => {
  const { userProfile, loading, isSuperAdmin } = useAuth()
  const location = useLocation()

  // 認証状態ロード中は読み込み表示
  if (loading) {
    return <LoadingIndicator message="認証情報を確認中..." />
  }

  // 未ログインの場合はログインページにリダイレクト
  if (!userProfile) {
    console.log('認証されていません。ログインページにリダイレクトします')
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // スーパー管理者権限チェック
  if (!isSuperAdmin) {
    console.log('スーパー管理者権限がありません')
    return <Navigate to="/unauthorized" replace />
  }

  console.log('認証成功: スーパー管理者ルートへのアクセスを許可します')
  
  // 認証&権限チェック通過後、子コンポーネントをレンダリング
  return <>{children}</>
}
