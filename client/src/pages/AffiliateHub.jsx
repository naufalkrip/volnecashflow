import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useFinanceStore } from '../store/financeStore';
import {
  LayoutGrid, Users, Wallet, FileText, Settings,
  ArrowUpRight, DollarSign, UserCheck, Percent,
  TrendingUp, Save, AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Finance from './Finance';
import Members from './Members';
import Reports from './Reports';

const formatCurrency = (value) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value);

const TABS = [
  { id: 'overview', label: 'Overview', icon: LayoutGrid },
  { id: 'members', label: 'Members', icon: Users },
  { id: 'transactions', label: 'Transactions', icon: Wallet },
  { id: 'reports', label: 'Reports', icon: FileText },
  { id: 'settings', label: 'Settings', icon: Settings },
];

// ─── Stat Card ────────────────────────────────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, sublabel, gradient }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    className={`relative overflow-hidden rounded-2xl p-5 ${gradient} shadow-lg shadow-black/5`}
  >
    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full translate-x-12 -translate-y-12 pointer-events-none" />
    <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full -translate-x-8 translate-y-8 pointer-events-none" />
    <div className="relative z-10">
      <div className="flex items-center justify-between mb-3">
        <span className="text-white/70 text-[11px] font-bold uppercase tracking-wider">{label}</span>
        <Icon size={20} className="text-white/40" />
      </div>
      <p className="text-2xl font-bold text-white tracking-tight">{value}</p>
      {sublabel && <p className="text-white/50 text-xs mt-1.5 font-medium">{sublabel}</p>}
    </div>
  </motion.div>
);

// ─── Overview Section ─────────────────────────────────────────────────────────
const OverviewSection = ({ records, members }) => {
  const incomeRecords = useMemo(() => records.filter(r => r.type === 'INCOME'), [records]);
  const withdrawalRecords = useMemo(() => records.filter(r => r.type === 'WITHDRAWAL'), [records]);

  const stats = useMemo(() => {
    const totalGross = incomeRecords.reduce((s, r) => s + r.amount, 0);
    const totalDeduction = incomeRecords.reduce((s, r) => s + r.deduction, 0);
    const totalNetIncome = incomeRecords.reduce((s, r) => s + r.netAmount, 0);
    const totalWithdrawal = withdrawalRecords.reduce((s, r) => s + r.amount, 0);
    const totalNet = totalNetIncome - totalWithdrawal;
    const activeMembers = members.filter(m => m.isActive).length;
    return { totalGross, totalDeduction, totalNet, totalMembers: members.length, activeMembers, totalTransactions: records.length };
  }, [incomeRecords, withdrawalRecords, records, members]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-slate-800">Affiliate Overview</h2>
        <p className="text-sm text-slate-400 mt-0.5">Ringkasan performa affiliate secara keseluruhan</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={ArrowUpRight}
          label="Total Gross Income"
          value={formatCurrency(stats.totalGross)}
          sublabel={`${stats.totalTransactions} total transaksi`}
          gradient="bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600"
        />
        <StatCard
          icon={DollarSign}
          label="Total Net Income"
          value={formatCurrency(stats.totalNet)}
          sublabel={stats.totalNet >= 0 ? 'Balance positif' : 'Balance negatif'}
          gradient="bg-gradient-to-br from-teal-500 via-teal-600 to-emerald-700"
        />
        <StatCard
          icon={Percent}
          label="Total Potongan"
          value={formatCurrency(stats.totalDeduction)}
          sublabel="Biaya administrasi"
          gradient="bg-gradient-to-br from-emerald-600 via-green-600 to-teal-700"
        />
        <StatCard
          icon={UserCheck}
          label="Total Member"
          value={`${stats.activeMembers} / ${stats.totalMembers}`}
          sublabel={`${stats.activeMembers} member aktif`}
          gradient="bg-gradient-to-br from-teal-500 via-emerald-500 to-green-600"
        />
      </div>

      {records.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
          <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
            <TrendingUp size={16} className="text-red-500" />
            Ringkasan Cepat
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-emerald-50 rounded-xl p-3.5 text-center">
              <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">Pemasukan</p>
              <p className="text-xl font-bold text-emerald-700 mt-1">{incomeRecords.length}</p>
            </div>
            <div className="bg-emerald-50 rounded-xl p-3.5 text-center">
              <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">Penarikan</p>
              <p className="text-xl font-bold text-emerald-700 mt-1">{withdrawalRecords.length}</p>
            </div>
            <div className="bg-emerald-50 rounded-xl p-3.5 text-center">
              <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">Member Aktif</p>
              <p className="text-xl font-bold text-emerald-700 mt-1">{stats.activeMembers}</p>
            </div>
            <div className="bg-emerald-50 rounded-xl p-3.5 text-center">
              <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">Total Transaksi</p>
              <p className="text-xl font-bold text-emerald-700 mt-1">{stats.totalTransactions}</p>
            </div>
          </div>
        </div>
      )}

      {records.length === 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-10 text-center">
          <TrendingUp size={40} className="mx-auto text-slate-200 mb-3" />
          <p className="font-semibold text-slate-500">Belum ada data transaksi</p>
          <p className="text-sm text-slate-400 mt-1">Mulai dengan menambahkan transaksi pertama di tab Transactions</p>
        </div>
      )}
    </div>
  );
};

// ─── Tab Bar ──────────────────────────────────────────────────────────────────
const TabBar = ({ activeTab, onTabChange }) => (
  <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-1.5 overflow-x-auto no-scrollbar">
    <div className="flex gap-1 min-w-max">
      {TABS.map(tab => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`relative flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 whitespace-nowrap ${
              isActive
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/20'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Icon size={16} />
            {tab.label}
          </button>
        );
      })}
    </div>
  </div>
);

// ─── Settings Section ─────────────────────────────────────────────────────────
const SettingsSection = () => {
  const { settings, fetchSettings, updateSettings, isLoading } = useFinanceStore();
  const [deduction, setDeduction] = useState('');
  const [saveStatus, setSaveStatus] = useState(null);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  useEffect(() => {
    if (settings) {
      setDeduction(settings.deductionPercentage.toString());
    }
  }, [settings]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaveStatus(null);
    const success = await updateSettings({ deductionPercentage: parseFloat(deduction) });
    if (success) {
      setSaveStatus('success');
      setTimeout(() => setSaveStatus(null), 3000);
    } else {
      setSaveStatus('error');
    }
  };

  return (
    <div className="max-w-lg mx-auto">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <h2 className="text-lg font-bold text-slate-800 mb-1 flex items-center gap-2">
          <Settings size={18} className="text-emerald-500" />
          Affiliate Settings
        </h2>
        <p className="text-sm text-slate-400 mb-6 pb-4 border-b border-slate-100">
          Konfigurasi biaya administrasi affiliate
        </p>

        <form onSubmit={handleSave} className="space-y-6">
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

          <div className="flex items-center gap-4">
            <button type="submit" disabled={isLoading || !deduction}
              className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2.5 rounded-xl transition-all font-medium text-sm shadow-sm shadow-emerald-500/20 disabled:opacity-70">
              <Save size={16} />
              {isLoading ? 'Menyimpan...' : 'Simpan Pengaturan'}
            </button>
            <AnimatePresence>
              {saveStatus === 'success' && (
                <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-emerald-500 text-sm font-medium">
                  ✓ Tersimpan!
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
      </div>
    </div>
  );
};

// ─── Main Affiliate Hub Page ──────────────────────────────────────────────────
const AffiliateHub = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [renderedTabs, setRenderedTabs] = useState(new Set(['overview']));
  const { records, members, fetchRecords, fetchMembers, fetchSettings } = useFinanceStore();

  useEffect(() => {
    fetchRecords();
    fetchMembers();
    fetchSettings();
  }, [fetchRecords, fetchMembers, fetchSettings]);

  const handleTabChange = useCallback((tabId) => {
    setActiveTab(tabId);
    setRenderedTabs(prev => new Set(prev).add(tabId));
  }, []);

  const renderTabContent = () => (
    <div className="relative">
      {renderedTabs.has('overview') && (
        <div className={activeTab === 'overview' ? 'block' : 'hidden'}>
          <OverviewSection records={records} members={members} />
        </div>
      )}
      {renderedTabs.has('members') && (
        <div className={activeTab === 'members' ? 'block' : 'hidden'}>
          <Members />
        </div>
      )}
      {renderedTabs.has('transactions') && (
        <div className={activeTab === 'transactions' ? 'block' : 'hidden'}>
          <Finance />
        </div>
      )}
      {renderedTabs.has('reports') && (
        <div className={activeTab === 'reports' ? 'block' : 'hidden'}>
          <Reports />
        </div>
      )}
      {renderedTabs.has('settings') && (
        <div className={activeTab === 'settings' ? 'block' : 'hidden'}>
          <SettingsSection />
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <TabBar activeTab={activeTab} onTabChange={handleTabChange} />
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.15 }}
        >
          {renderTabContent()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default AffiliateHub;
