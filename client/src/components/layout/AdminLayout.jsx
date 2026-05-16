import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useFinanceStore } from '../../store/financeStore';
import { 
  LayoutDashboard, 
  Wallet, 
  Settings, 
  LogOut,
  Menu,
  X,
  Users,
  Shield,
  UserCheck,
  LayoutGrid
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import logo from '../../assets/logo.png';
import ConfirmModal from '../ui/ConfirmModal';

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [logoutConfirm, setLogoutConfirm] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useFinanceStore();

  const handleLogout = () => setLogoutConfirm(true);

  const confirmLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const navItems = [
    { path: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/admin/keuangan', icon: Wallet, label: 'Keuangan' },
    { path: '/admin/settings', icon: Settings, label: 'Settings' },
  ];

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 h-20 px-5 border-b border-slate-100 shrink-0">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-md shrink-0">
          <Shield size={18} className="text-white" />
        </div>
        <div className="min-w-0">
          <span className="block text-[13px] font-bold leading-tight text-red-600 tracking-tight">
            Volne Admin
          </span>
          <span className="block text-[8px] font-normal text-slate-400 leading-tight mt-0.5 tracking-wide">
            System Management
          </span>
        </div>
        <button
          onClick={() => setSidebarOpen(false)}
          className="ml-auto lg:hidden text-slate-400 hover:text-slate-600 transition-colors shrink-0"
        >
          <X size={22} />
        </button>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto p-4 space-y-1">
        <div className="mb-3 mt-1 text-[10px] font-bold text-slate-400 uppercase tracking-[0.18em] px-3">
          Admin Menu
        </div>
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`group relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 overflow-hidden ${
                  isActive
                    ? 'bg-red-50 text-red-600 font-semibold ring-1 ring-red-100'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700 font-medium'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="adminActiveTab"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-7 bg-red-500 rounded-r-full"
                  />
                )}
                <Icon
                  size={19}
                  className={`transition-all duration-200 ${
                    isActive ? 'text-red-500' : 'group-hover:text-red-500/80 group-hover:scale-105'
                  }`}
                />
                <span className="text-sm">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom */}
      <div className="p-4 border-t border-slate-100 shrink-0 space-y-2">
        {/* Switch to User View */}
        <Link
          to="/dashboard"
          className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-700 font-medium text-sm transition-all duration-200 border border-slate-200 hover:border-slate-300"
        >
          <UserCheck size={16} />
          <span>User View</span>
        </Link>
        {/* Logout */}
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleLogout}
          className="flex items-center justify-center gap-2.5 w-full py-3 px-4 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 font-semibold text-sm transition-all duration-200 border border-red-100 hover:border-red-200 hover:shadow-sm"
        >
          <LogOut size={17} />
          <span>Log Out</span>
        </motion.button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden w-full max-w-full">
      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-sm lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <div className="hidden lg:flex w-64 xl:w-72 bg-white border-r border-slate-200 shadow-sm flex-col h-full shrink-0">
        <SidebarContent />
      </div>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ x: -288 }}
            animate={{ x: 0 }}
            exit={{ x: -288 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-2xl flex flex-col lg:hidden"
          >
            <SidebarContent />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white/90 backdrop-blur-md border-b border-slate-200/70 flex items-center justify-between px-4 sm:px-6 lg:px-8 z-30 sticky top-0 shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <Menu size={20} />
            </button>
            <div className="flex items-center gap-2">
              <div className="px-2 py-0.5 rounded-md bg-red-50 border border-red-100">
                <span className="text-[10px] font-bold text-red-600 uppercase tracking-wider">Admin</span>
              </div>
              <h1 className="text-lg font-bold text-slate-800 capitalize">
                {(location.pathname.split('/')[2] || 'Dashboard').replace(/-/g, ' ')}
              </h1>
            </div>
          </div>
          <div className="text-right hidden sm:block">
            <div className="flex items-center justify-end gap-2">
              <p className="text-sm font-bold text-slate-700">
                {new Date().getHours() < 12 ? 'Good Morning' : 'Good Evening'}, Admin
              </p>
            </div>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Logout Confirm Modal */}
      <ConfirmModal
        isOpen={logoutConfirm}
        onClose={() => setLogoutConfirm(false)}
        onConfirm={confirmLogout}
        type="logout"
        title="Keluar dari Admin Panel"
        message="Apakah Anda yakin ingin keluar dari admin panel?"
        confirmLabel="Logout"
      />
    </div>
  );
};

export default AdminLayout;
