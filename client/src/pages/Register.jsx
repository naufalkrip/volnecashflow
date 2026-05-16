import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useFinanceStore } from '../store/financeStore';
import { motion } from 'framer-motion';
import { User, Lock, ArrowRight, Loader2, CheckCircle, AlertCircle, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import logo from '../assets/logo.png';

const Register = () => {
  const [form, setForm] = useState({ username: '', password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState({});
  const { register, isLoading } = useFinanceStore();
  const navigate = useNavigate();

  const validate = () => {
    const errs = {};
    if (!form.username.trim()) errs.username = 'Username wajib diisi';
    else if (form.username.length < 3) errs.username = 'Username minimal 3 karakter';
    if (!form.password) errs.password = 'Password wajib diisi';
    else if (form.password.length < 6) errs.password = 'Password minimal 6 karakter';
    if (!form.confirmPassword) errs.confirmPassword = 'Konfirmasi password wajib diisi';
    else if (form.password !== form.confirmPassword) errs.confirmPassword = 'Password tidak cocok';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    const success = await register(form.username, form.password);
    if (success) {
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Soft emerald gradient backgrounds */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-50 rounded-full blur-3xl opacity-70 pointer-events-none transform translate-x-1/3 -translate-y-1/3" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-emerald-50/50 rounded-full blur-3xl opacity-50 pointer-events-none transform -translate-x-1/3 translate-y-1/3" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-md z-10"
      >
        <div className="bg-white/80 backdrop-blur-xl border border-slate-200/80 p-8 md:p-10 rounded-3xl shadow-xl shadow-slate-200/60">
          
          {/* Logo */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, type: 'spring', stiffness: 200, damping: 20 }}
              className="w-16 h-16 mx-auto flex items-center justify-center mb-4"
            >
              <img src={logo} alt="Volne" className="w-full h-full object-contain drop-shadow-sm" />
            </motion.div>
            <h1 className="text-xl font-bold text-slate-800">Buat Akun Baru</h1>
            <p className="text-slate-400 text-sm mt-1">Daftar untuk mengakses portal anggota</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 pl-1">Username</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User size={18} className="text-slate-400" />
                </div>
                <input
                  type="text"
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  className={`w-full pl-11 pr-4 py-3 bg-slate-50 border text-slate-800 rounded-xl outline-none transition-all font-medium placeholder:text-slate-400 ${
                    errors.username ? 'border-rose-300 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400' : 'border-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400'
                  }`}
                  placeholder="Pilih username"
                />
              </div>
              {errors.username && (
                <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-xs text-rose-500 mt-1.5 pl-1 flex items-center gap-1">
                  <AlertCircle size={12} /> {errors.username}
                </motion.p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 pl-1">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock size={18} className="text-slate-400" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className={`w-full pl-11 pr-12 py-3 bg-slate-50 border text-slate-800 rounded-xl outline-none transition-all font-medium placeholder:text-slate-400 ${
                    errors.password ? 'border-rose-300 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400' : 'border-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400'
                  }`}
                  placeholder="Minimal 6 karakter"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 inset-y-0 flex items-center text-slate-400 hover:text-slate-600">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && (
                <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-xs text-rose-500 mt-1.5 pl-1 flex items-center gap-1">
                  <AlertCircle size={12} /> {errors.password}
                </motion.p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 pl-1">Konfirmasi Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock size={18} className="text-slate-400" />
                </div>
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={form.confirmPassword}
                  onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                  className={`w-full pl-11 pr-12 py-3 bg-slate-50 border text-slate-800 rounded-xl outline-none transition-all font-medium placeholder:text-slate-400 ${
                    errors.confirmPassword ? 'border-rose-300 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400' : 'border-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400'
                  }`}
                  placeholder="Ulangi password"
                />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 inset-y-0 flex items-center text-slate-400 hover:text-slate-600">
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.confirmPassword && (
                <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-xs text-rose-500 mt-1.5 pl-1 flex items-center gap-1">
                  <AlertCircle size={12} /> {errors.confirmPassword}
                </motion.p>
              )}
            </div>

            {/* Password match indicator */}
            {form.password && form.confirmPassword && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className={`flex items-center gap-2 text-xs font-medium px-3 py-2 rounded-lg ${
                  form.password === form.confirmPassword ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                }`}
              >
                {form.password === form.confirmPassword ? (
                  <><CheckCircle size={14} /> Password cocok</>
                ) : (
                  <><AlertCircle size={14} /> Password tidak cocok</>
                )}
              </motion.div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-emerald-500 hover:bg-emerald-600 active:scale-[0.98] text-white font-semibold py-3.5 px-4 rounded-xl shadow-sm shadow-emerald-500/20 hover:shadow-md hover:shadow-emerald-500/30 transition-all duration-200 flex items-center justify-center gap-2 group disabled:opacity-60 disabled:cursor-not-allowed mt-2"
            >
              {isLoading ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <>
                  <span>Daftar Akun</span>
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Back to Login */}
          <div className="mt-6 text-center">
            <Link
              to="/login"
              className="text-sm text-slate-400 hover:text-emerald-600 transition-colors font-medium inline-flex items-center gap-1"
            >
              <ArrowLeft size={14} />
              Kembali ke Login
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Register;
