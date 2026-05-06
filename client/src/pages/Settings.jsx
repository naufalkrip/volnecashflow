import React, { useEffect, useState } from 'react';
import { useFinanceStore } from '../store/financeStore';
import { Save, AlertCircle, Users, Plus, Edit2, Trash2, X, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ConfirmModal from '../components/ui/ConfirmModal';

const Settings = () => {
  const { settings, fetchSettings, updateSettings, isLoading } = useFinanceStore();
  
  // General Settings State
  const [deduction, setDeduction] = useState('');
  const [language, setLanguage] = useState('en');
  const [saveStatus, setSaveStatus] = useState(null);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  useEffect(() => {
    if (settings) {
      setDeduction(settings.deductionPercentage.toString());
      if (settings.language) {
        setLanguage(settings.language);
      }
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

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-100"
      >
          <h2 className="text-xl font-bold text-slate-800 mb-6 border-b border-slate-100 pb-4">General Configuration</h2>
          
          <form onSubmit={handleSaveGeneral} className="space-y-6">
            <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100 flex gap-4 items-start">
              <AlertCircle className="text-emerald-500 shrink-0 mt-0.5" size={20} />
              <div>
                <h4 className="text-sm font-semibold text-slate-800 mb-1">Admin Deduction Rate</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  This percentage will be automatically deducted from all newly created finance records. 
                  Existing records will not be affected unless edited.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Default Deduction (%)</label>
                <div className="relative">
                  <input 
                    type="number" 
                    step="0.1"
                    min="0"
                    max="100"
                    required
                    value={deduction}
                    onChange={(e) => setDeduction(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all pr-12 font-medium text-slate-800"
                  />
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-slate-400 font-medium">
                    %
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Display Language</label>
                <div className="relative">
                  <select 
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
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

            <div className="pt-6 border-t border-slate-100 flex items-center gap-4">
              <button 
                type="submit"
                disabled={isLoading || !deduction}
                className="flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-3 rounded-xl transition-all font-medium text-sm shadow-sm shadow-emerald-500/20 disabled:opacity-70"
              >
                <Save size={18} />
                {isLoading ? 'Saving...' : 'Save Settings'}
              </button>
              
              {saveStatus === 'success' && (
                <motion.span 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-emerald-500 text-sm font-medium"
                >
                  Settings saved successfully!
                </motion.span>
              )}
              {saveStatus === 'error' && (
                <motion.span 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-rose-500 text-sm font-medium"
                >
                  Failed to save settings.
                </motion.span>
              )}
            </div>
          </form>
      </motion.div>
    </div>
  );
};

export default Settings;
