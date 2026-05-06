import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useFinanceStore } from './store/financeStore';
import { Loader2 } from 'lucide-react';
import MainLayout from './components/layout/MainLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Finance from './pages/Finance';
import Settings from './pages/Settings';
import Reports from './pages/Reports';
import Members from './pages/Members';
import { Toaster } from 'react-hot-toast';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isCheckingAuth } = useFinanceStore();
  
  if (isCheckingAuth) {
    return null; // The main App component will handle the loading spinner
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

function App() {
  const { checkAuth, isCheckingAuth } = useFinanceStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center font-sans">
        <Loader2 size={40} className="text-emerald-500 animate-spin mb-4" />
        <p className="text-slate-500 font-medium animate-pulse">Memverifikasi sesi...</p>
      </div>
    );
  }

  return (
    <>
      <Toaster position="top-right" toastOptions={{ className: 'font-sans text-sm font-medium rounded-xl shadow-lg' }} />
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
        
        <Route path="/" element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="finance" element={<Finance />} />
          <Route path="members" element={<Members />} />
          <Route path="reports" element={<Reports />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </Router>
    </>
  );
}

export default App;
