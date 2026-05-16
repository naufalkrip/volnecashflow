import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useFinanceStore } from './store/financeStore';
import { Loader2 } from 'lucide-react';
import MainLayout from './components/layout/MainLayout';
import AdminLayout from './components/layout/AdminLayout';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminLogin from './pages/AdminLogin';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import Settings from './pages/Settings';
import KeuanganHub from './pages/KeuanganHub';
import Members from './pages/Members';
import AffiliateHub from './pages/AffiliateHub';
import { Toaster } from 'react-hot-toast';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isCheckingAuth } = useFinanceStore();
  
  if (isCheckingAuth) {
    return null;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

const AdminRoute = ({ children }) => {
  const { isAuthenticated, isCheckingAuth, userRole } = useFinanceStore();
  
  if (isCheckingAuth) {
    return null;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }
  
  if (userRole !== 'ADMIN') {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

function App() {
  const { checkAuth, isCheckingAuth, isAuthenticated, startPolling, stopPolling } = useFinanceStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (isAuthenticated) {
      startPolling();
    } else {
      stopPolling();
    }
    return () => stopPolling();
  }, [isAuthenticated, startPolling, stopPolling]);

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center font-sans">
        <Loader2 size={40} className="text-emerald-500 animate-spin mb-4" />
        <p className="text-slate-400 font-medium animate-pulse">Memverifikasi sesi...</p>
      </div>
    );
  }

  return (
    <>
      <Toaster position="top-right" toastOptions={{ className: 'font-sans text-sm font-medium rounded-xl shadow-lg' }} />
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          
          {/* User Routes */}
          <Route path="/" element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="affiliate-hub" element={<AffiliateHub />} />
            <Route path="members" element={<Members />} />
            <Route path="settings" element={<Settings />} />
            <Route path="keuangan" element={<KeuanganHub />} />
          </Route>

          {/* Admin Routes */}
          <Route path="/admin" element={
            <AdminRoute>
              <AdminLayout />
            </AdminRoute>
          }>
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="keuangan" element={<KeuanganHub />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
      </Router>
    </>
  );
}

export default App;
