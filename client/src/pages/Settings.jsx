import React, { useEffect, useState } from 'react';
import { useFinanceStore } from '../store/financeStore';
import { Save, AlertCircle, Eye, EyeOff, Lock, User, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Settings = () => {
  const { settings, fetchSettings, updateSettings, changeCredentials, isLoading, user } = useFinanceStore();
  
  // General Settings State
  const [deduction, setDeduction] = useState('');
  const [language, setLanguage] = useState('en');
  const [saveStatus, setSaveStatus] = useState(null);

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

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  useEffect(() => {
    if (settings) {
      setDeduction(settings.deductionPercentage.toString());
      if (settings.language) setLanguage(settings.language);
    }
  }, [settings]);

  const handleSaveGeneral = async (e) => {
    e.preventDefault();
    setSaveStatus(null);
    const success = await updateSettings({ 
      deductionPercentage: parseFloat(deduction),
      language
    });
    if (success) {
      setSaveStatus('success');
      setTimeout(() => setSaveStatus(null), 3000);
    } else {
      setSaveStatus('error');
    }
  };

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

      {/* General Settings */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-100"
      >
        <h2 className="text-lg font-bold text-slate-800 mb-6 pb-4 border-b border-slate-100 flex items-center gap-2">
          <AlertCircle size={18} className="text-emerald-500" />
          General Configuration
        </h2>
          
        <form onSubmit={handleSaveGeneral} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Default Deduction (%)</label>
              <div className="relative">
                <input 
                  type="number" step="0.1" min="0" max="100" required
                  value={deduction}
                  onChange={(e) => setDeduction(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all pr-12 font-medium text-slate-800"
                />
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-slate-400 font-medium">%</div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Display Language</label>
              <div className="relative">
                <select 
                  value={language} onChange={(e) => setLanguage(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all font-medium text-slate-800 appearance-none"
                >
                  <option value="id">Bahasa Indonesia</option>
                  <option value="en">English</option>
                </select>
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-slate-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center gap-4">
            <button 
              type="submit" disabled={isLoading || !deduction}
              className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2.5 rounded-xl transition-all font-medium text-sm shadow-sm shadow-emerald-500/20 disabled:opacity-70"
            >
              <Save size={16} />
              {isLoading ? 'Menyimpan...' : 'Simpan Pengaturan'}
            </button>
            <AnimatePresence>
              {saveStatus === 'success' && (
                <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-emerald-500 text-sm font-medium">
                  ✓ Pengaturan tersimpan!
                </motion.span>
              )}
              {saveStatus === 'error' && (
                <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-rose-500 text-sm font-medium">
                  Gagal menyimpan.
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        </form>
      </motion.div>

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
