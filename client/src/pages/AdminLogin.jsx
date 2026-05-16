import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useFinanceStore } from '../store/financeStore';
import { motion } from 'framer-motion';
import { Lock, User, ArrowRight, Loader2, Shield, ArrowLeft } from 'lucide-react';
import logo from '../assets/logo.png';

const AdminLogin = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { adminLogin, isAuthenticated, isLoading, error, userRole } = useFinanceStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated && userRole === 'ADMIN') {
      navigate('/admin/dashboard', { replace: true });
    } else if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, userRole, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const success = await adminLogin(username, password);
    if (success) {
      navigate('/admin/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Soft emerald gradient backgrounds */}
      <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-emerald-50 rounded-full blur-3xl opacity-70 pointer-events-none transform -translate-x-1/3 -translate-y-1/3" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-emerald-50/50 rounded-full blur-3xl opacity-50 pointer-events-none transform translate-x-1/3 translate-y-1/3" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-md z-10"
      >
        <div className="bg-white/80 backdrop-blur-xl border border-slate-200/80 p-8 md:p-10 rounded-3xl shadow-xl shadow-slate-200/60">
          
          {/* Admin Badge */}
          <div className="text-center mb-10">
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, type: 'spring', stiffness: 200, damping: 20 }}
              className="w-20 h-20 mx-auto flex items-center justify-center mb-5"
            >
              <div className="w-full h-full rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <Shield size={36} className="text-white" />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h1 className="text-2xl font-bold tracking-tight mb-1">
                <span className="text-emerald-600">Admin</span>
                <span className="text-emerald-500"> Portal</span>
              </h1>
              <p className="text-slate-400 text-sm font-medium">Volne Cash Flow Administration</p>
            </motion.div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-600 text-sm font-medium text-center"
              >
                {error}
              </motion.div>
            )}

            <div className="space-y-4">
              <div className="relative group">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 pl-1">Admin Username</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <User size={18} className="text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                  </div>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 text-slate-800 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 outline-none transition-all placeholder:text-slate-400 font-medium"
                    placeholder="Enter admin username"
                  />
                </div>
              </div>

              <div className="relative group">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 pl-1">Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock size={18} className="text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 text-slate-800 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 outline-none transition-all placeholder:text-slate-400 font-medium"
                    placeholder="Enter admin password"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-semibold py-3.5 px-4 rounded-xl shadow-sm shadow-emerald-600/20 hover:shadow-md hover:shadow-emerald-600/30 transition-all duration-200 flex items-center justify-center gap-2 group disabled:opacity-60 disabled:cursor-not-allowed mt-2"
            >
              {isLoading ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <>
                  <Shield size={18} />
                  <span>Admin Sign In</span>
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Back to User Login */}
          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
            <Link
              to="/login"
              className="text-sm text-slate-400 hover:text-emerald-600 transition-colors font-medium inline-flex items-center gap-1"
            >
              <ArrowLeft size={14} />
              Kembali ke Login Anggota
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AdminLogin;
