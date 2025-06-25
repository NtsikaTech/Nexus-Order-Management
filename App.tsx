import React, { ReactNode } from 'react';
import { HashRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import NewOrderPage from './pages/NewOrderPage';
import OrderDetailPage from './pages/OrderDetailPage';
import ManagedOrdersPage from './pages/ManagedOrdersPage';
import ReportsPage from './pages/ReportsPage';
import AdminManagementPage from './pages/AdminManagementPage';
import Header from './components/Header';
import LoadingSpinner from './components/LoadingSpinner';
import AdminRoute from './components/AdminRoute';
import UserSettingsPage from './pages/UserSettingsPage'; // Added UserSettingsPage
import Chatbot from './components/Chatbot';

// Client Portal Pages
import ClientDashboardPage from './pages/client/ClientDashboardPage';
import ClientOrdersPage from './pages/client/ClientOrdersPage';
import ClientOrderDetailPage from './pages/client/ClientOrderDetailPage';
import ClientInvoicesPage from './pages/client/ClientInvoicesPage';
import ClientRequestsPage from './pages/client/ClientRequestsPage';
import NewClientRequestPage from './pages/client/NewClientRequestPage';
import ClientSubscriptionsPage from './pages/client/ClientSubscriptionsPage';
import ClientProfilePage from './pages/client/ClientProfilePage';
import ClientNewServiceOrderPage from './pages/client/ClientNewServiceOrderPage'; // Added

// Admin Billing Page
import AdminBillingPage from './pages/admin/AdminBillingPage';
import AdminAuditTrailPage from './pages/admin/AdminAuditTrailPage';


interface ProtectedRouteProps {
  children?: ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <div className="h-screen flex items-center justify-center bg-brand-bg-dark"><LoadingSpinner message="Verifying access..." /></div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const isClientRoute = location.pathname.startsWith('/portal');
  const isSettingsRoute = location.pathname.startsWith('/settings');

  if (user?.role === 'client' && !isClientRoute && location.pathname !== '/login') {
    return <Navigate to="/portal/dashboard" replace />;
  }
  
  if ((user?.role === 'admin' || user?.role === 'user') && isClientRoute) {
     return <Navigate to="/" replace />;
  }
  
  // Prevent clients from accessing general settings page if it's meant for admin/user
  if (user?.role === 'client' && isSettingsRoute) {
    return <Navigate to="/portal/dashboard" replace />;
  }


  return children ? <>{children}</> : <Outlet />;
};

const MainLayout: React.FC = () => {
  const { user } = useAuth();
  return (
    <div className="flex flex-col h-screen bg-brand-bg-dark">
      <Header />
      <main className="flex-1 overflow-x-hidden overflow-y-auto bg-brand-bg-dark">
        <Outlet />
      </main>
      {user?.role === 'client' && <Chatbot />}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <HashRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          
          {/* Authenticated Routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<MainLayout />}>
              {/* Admin/User Routes */}
              <Route path="/" element={<DashboardPage />} />
              <Route path="/orders/new" element={<NewOrderPage />} />
              <Route path="/orders/managed" element={<ManagedOrdersPage />} />
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="/orders/:orderId" element={<OrderDetailPage />} />
              <Route path="/settings" element={<UserSettingsPage />} /> {/* Default to Account tab */}
              <Route path="/settings/:tab" element={<UserSettingsPage />} />
              
              <Route element={<AdminRoute />}>
                <Route path="/admin/management" element={<AdminManagementPage />} />
                <Route path="/admin/billing" element={<AdminBillingPage />} /> 
                <Route path="/admin/audit-trail" element={<AdminAuditTrailPage />} />
              </Route>

              {/* Client Portal Routes */}
              <Route path="/portal/dashboard" element={<ClientDashboardPage />} />
              <Route path="/portal/orders" element={<ClientOrdersPage />} />
              <Route path="/portal/orders/:orderId" element={<ClientOrderDetailPage />} />
              <Route path="/portal/services/new" element={<ClientNewServiceOrderPage />} /> {/* New Route */}
              <Route path="/portal/invoices" element={<ClientInvoicesPage />} />
              <Route path="/portal/requests" element={<ClientRequestsPage />} />
              <Route path="/portal/requests/new" element={<NewClientRequestPage />} />
              <Route path="/portal/subscriptions" element={<ClientSubscriptionsPage />} />
              <Route path="/portal/profile" element={<ClientProfilePage />} />
            </Route>
          </Route>
          
          <Route path="*" element={<CatchAllNavigate />} />
        </Routes>
      </HashRouter>
    </AuthProvider>
  );
};

const CatchAllNavigate = () => {
  const { isAuthenticated, user } = useAuth();
  if (isAuthenticated) {
    if (user?.role === 'client') return <Navigate to="/portal/dashboard" replace />;
    // If settings is the only other main page for admin/user, they could be directed to /settings or /
    // For now, keeping it as /
    return <Navigate to="/" replace />;
  }
  return <Navigate to="/login" replace />;
}

export default App;