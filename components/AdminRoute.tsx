
import React, { ReactNode } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import LoadingSpinner from './LoadingSpinner';

interface AdminRouteProps {
  children?: ReactNode;
}

const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  const { isAuthenticated, user, isLoading } = useAuth();

  if (isLoading) {
    return <div className="h-screen flex items-center justify-center bg-brand-bg-dark"><LoadingSpinner message="Verifying admin access..." /></div>;
  }

  if (!isAuthenticated) {
    // Should be caught by ProtectedRoute first, but as a fallback
    return <Navigate to="/login" replace />;
  }

  if (user?.role !== 'admin') {
    // User is authenticated but not an admin
    // Redirect to dashboard or a specific "Unauthorized" page
    // For now, redirecting to dashboard
    return <Navigate to="/" replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};

export default AdminRoute;
