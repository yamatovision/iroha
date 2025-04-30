import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import LoadingIndicator from './LoadingIndicator';
import { UserRole } from '../../types';

interface SuperAdminRouteProps {
  children: ReactNode;
}

/**
 * SuperAdmin権限を持つユーザーのみがアクセスできるルートコンポーネント
 * 未認証またはSuperAdmin以外のユーザーはログインページにリダイレクト
 */
const SuperAdminRoute = ({ children }: SuperAdminRouteProps) => {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return <LoadingIndicator />;
  }

  // 認証されていないか、SuperAdmin権限がない場合はログインページへリダイレクト
  if (!isAuthenticated || user?.role !== UserRole.SUPER_ADMIN) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export default SuperAdminRoute;