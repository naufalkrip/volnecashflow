import React, { useEffect, useState } from 'react';
import { useFinanceStore } from '../store/financeStore';
import { AlertCircle, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Settings = () => {
  const { changeCredentials, isLoading, user } = useFinanceStore();
  
  // Credentials State
  const [credForm, setCredForm] = useState({
    currentPassword: '',
    newUsername: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [credSaving, setCredSaving] = useState(false);
  const [credError, setCredError] = useState('');

  const handleChangeCredentials = async (e) => {
    e.preventDefault();
    setCredError('');

    if (!credForm.currentPassword) {
      setCredError('Password saat ini wajib diisi.');
      return;
    }
    if (!credForm.newUsername && !credForm.newPassword) {
      setCredError('Isi minimal username baru atau password baru.');
      return;
    }
    if (credForm.newPassword && credForm.newPassword !== credForm.confirmPassword) {
      setCredError('Password baru dan konfirmasi tidak cocok.');
      return;
    }
    if (credForm.newPassword && credForm.newPassword.length < 6) {
      setCredError('Password baru minimal 6 karakter.');
      return;
    }

    setCredSaving(true);
    const success = await changeCredentials({
      currentPassword: credForm.currentPassword,
      newUsername: credForm.newUsername || undefined,
      newPassword: credForm.newPassword || undefined,
    });
    setCredSaving(false);

    if (success) {
      setCredForm({ currentPassword: '', newUsername: '', newPassword: '', confirmPassword: '' });
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">

      {/* Change Credentials */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-100"
      >
        <h2 className="text-lg font-bold text-slate-800 mb-2 flex items-center gap-2">
          <ShieldCheck size={18} className="text-violet-500" />
          Keamanan Akun
        </h2>
        <p className="text-sm text-slate-400 mb-6 pb-4 border-b border-slate-100">
          Ubah username dan password login Anda. Setelah berhasil, Anda akan diarahkan untuk login kembali.
        </p>

        {/* Current account info */}
        <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 mb-6">
          <div className="w-9 h-9 rounded-full bg-violet-100 flex items-center justify-center text-violet-600 font-bold text-sm shrink-0">
            {user?.username?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800">{user?.name || 'User'}</p>
            <p className="text-xs text-slate-400">@{user?.username || '-'} · Akun aktif</p>
          </div>
        </div>

        <form onSubmit={handleChangeCredentials} className="space-y-5">
          {/* Current Password */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Password Saat Ini <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <input
                type={showCurrentPw ? 'text' : 'password'}
                value={credForm.currentPassword}
                onChange={e => setCredForm({ ...credForm, currentPassword: e.target.value })}
                placeholder="Masukkan password saat ini"
                className="w-full px-4 py-2.5 pr-12 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 outline-none"
              />
              <button type="button" onClick={() => setShowCurrentPw(!showCurrentPw)}
                className="absolute right-3 inset-y-0 flex items-center text-slate-400 hover:text-slate-600">
                {showCurrentPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="border-t border-dashed border-slate-200 pt-5 grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* New Username */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Username Baru <span className="text-slate-400 text-xs font-normal">(opsional)</span>
              </label>
              <input
                type="text"
                value={credForm.newUsername}
                onChange={e => setCredForm({ ...credForm, newUsername: e.target.value })}
                placeholder={`Saat ini: @${user?.username || '-'}`}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 outline-none"
              />
            </div>

            {/* New Password */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Password Baru <span className="text-slate-400 text-xs font-normal">(opsional)</span>
              </label>
              <div className="relative">
                <input
                  type={showNewPw ? 'text' : 'password'}
                  value={credForm.newPassword}
                  onChange={e => setCredForm({ ...credForm, newPassword: e.target.value })}
                  placeholder="Min. 6 karakter"
                  className="w-full px-4 py-2.5 pr-12 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 outline-none"
                />
                <button type="button" onClick={() => setShowNewPw(!showNewPw)}
                  className="absolute right-3 inset-y-0 flex items-center text-slate-400 hover:text-slate-600">
                  {showNewPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          </div>

          {/* Confirm Password */}
          {credForm.newPassword && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Konfirmasi Password Baru</label>
              <input
                type="password"
                value={credForm.confirmPassword}
                onChange={e => setCredForm({ ...credForm, confirmPassword: e.target.value })}
                placeholder="Ulangi password baru"
                className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-sm font-medium outline-none focus:ring-2 ${
                  credForm.confirmPassword && credForm.newPassword !== credForm.confirmPassword
                    ? 'border-rose-300 focus:ring-rose-500/20 focus:border-rose-400'
                    : 'border-slate-200 focus:ring-violet-500/20 focus:border-violet-400'
                }`}
              />
              {credForm.confirmPassword && credForm.newPassword !== credForm.confirmPassword && (
                <p className="text-xs text-rose-500 mt-1">Password tidak cocok</p>
              )}
            </motion.div>
          )}

          {/* Error message */}
          <AnimatePresence>
            {credError && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="flex items-center gap-2 text-rose-600 bg-rose-50 border border-rose-100 rounded-xl px-4 py-3 text-sm">
                <AlertCircle size={15} />
                {credError}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="pt-2">
            <button
              type="submit"
              disabled={credSaving || !credForm.currentPassword}
              className="flex items-center gap-2 bg-violet-500 hover:bg-violet-600 text-white px-6 py-2.5 rounded-xl transition-all font-medium text-sm shadow-sm shadow-violet-500/20 disabled:opacity-70"
            >
              <ShieldCheck size={16} />
              {credSaving ? 'Menyimpan...' : 'Perbarui Kredensial'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default Settings;
