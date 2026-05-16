import React, { useEffect, useState, useMemo } from 'react';
import { useFinanceStore } from '../store/financeStore';
import { useDailyFinanceStore } from '../store/dailyFinanceStore';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer
} from 'recharts';
import {
  Wallet, TrendingUp, DollarSign, Activity, Users, ArrowUpRight,
  ArrowDownRight, Plus, FileText, Settings, Clock, Calendar,
  ShoppingCart, UserPlus, Download, LayoutGrid, Sparkles,
  ChevronRight, Zap, Target, BarChart3, RefreshCw
} from 'lucide-react';
import { motion } from 'framer-motion';

const formatCurrency = (value) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(value);
};

const formatShort = (value) => {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}Jt`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
  return value;
};

const formatTime = (date) => {
  return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
};

const formatDate = (date) => {
  return date.toLocaleDateString('id-ID', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
};

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Selamat Pagi';
  if (h < 15) return 'Selamat Siang';
  if (h < 18) return 'Selamat Sore';
  return 'Selamat Malam';
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } }
};

const scaleVariants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.35, ease: 'easeOut' } }
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-4 min-w-[160px]">
        <p className="text-xs font-bold text-slate-500 mb-2">{label}</p>
        {payload.map((p, i) => (
          <div key={i} className="flex items-center justify-between gap-4">
            <span className="text-xs font-medium" style={{ color: p.color }}>{p.name}</span>
            <span className="text-xs font-bold text-slate-800">{formatCurrency(p.value)}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const AnimatedCounter = ({ value, duration = 1.5 }) => {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (value === 0) { setDisplay(0); return; }
    const start = performance.now();
    const from = 0;
    const diff = value - from;
    const animate = (now) => {
      const elapsed = (now - start) / 1000;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(from + diff * eased));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [value, duration]);

  return <>{display.toLocaleString('id-ID')}</>;
};

const StatCard = ({ title, value, icon: Icon, trend, trendLabel, delay, color, gradient }) => {
  const isPositive = trend >= 0;
  return (
    <motion.div
      variants={itemVariants}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="relative group cursor-pointer"
    >
      <div className="relative overflow-hidden bg-white rounded-2xl shadow-sm border border-slate-100 p-5 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/5 hover:border-emerald-200/50">
        <div className={`absolute top-0 right-0 w-32 h-32 rounded-full transform translate-x-12 -translate-y-12 pointer-events-none transition-transform duration-500 ${gradient || 'bg-emerald-50'}`} />
        <div className="relative z-10">
          <div className="flex items-start justify-between mb-3">
            <div className={`p-2.5 rounded-xl ${color || 'bg-emerald-50 text-emerald-600'}`}>
              <Icon size={20} />
            </div>
            {trend !== undefined && (
              <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold ${
                isPositive ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'
              }`}>
                {isPositive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                {Math.abs(trend)}%
              </div>
            )}
          </div>
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">{title}</p>
          <h3 className="text-xl font-bold text-slate-800">{value}</h3>
          {trendLabel && (
            <p className="text-[11px] text-slate-400 mt-1">{trendLabel}</p>
          )}
        </div>
      </div>
    </motion.div>
  );
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, dashboardStats, fetchDashboardStats, records, fetchRecords, members, fetchMembers, isLoading } = useFinanceStore();
  const { stats: dailyStats, fetchStats: fetchDailyStats, records: dailyRecords, fetchRecords: fetchDailyRecords } = useDailyFinanceStore();
  const [time, setTime] = useState(new Date());
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetchDashboardStats();
    fetchRecords();
    fetchMembers();
    fetchDailyStats();
    fetchDailyRecords();
  }, [fetchDashboardStats, fetchRecords, fetchMembers, fetchDailyStats, fetchDailyRecords]);

  const { totalAmount = 0, totalDeduction = 0, totalNetAmount = 0, totalWithdrawal = 0 } = dashboardStats || {};

  const dailyChartData = useMemo(() => {
    const dailyData = {};
    const today = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const key = d.toISOString().split('T')[0];
      const label = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
      dailyData[key] = { name: label, date: key, income: 0, expense: 0 };
    }
    (dailyRecords || []).forEach(r => {
      const key = new Date(r.transactionDate).toISOString().split('T')[0];
      if (dailyData[key]) {
        if (r.type === 'INCOME') dailyData[key].income += r.amount;
        else dailyData[key].expense += r.amount;
      }
    });
    return Object.values(dailyData);
  }, [dailyRecords]);

  const totalAffiliateNet = totalNetAmount;
  const totalDailyIncome = dailyStats?.totalIncome || 0;
  const totalDailyExpense = dailyStats?.totalExpense || 0;
  const totalDailyBalance = dailyStats?.balance || 0;
  const dailyTransactionCount = dailyStats?.transactionCount || 0;

  const totalCashFlow = totalDailyIncome + totalAffiliateNet;
  const totalMembers = members?.length || 0;

  const recentActivities = useMemo(() => {
    const activities = [];
    (dailyRecords || []).slice(0, 5).forEach(r => {
      activities.push({
        id: `daily-${r.id}`,
        type: r.type === 'INCOME' ? 'income' : 'expense',
        title: r.description,
        subtitle: r.type === 'INCOME' ? 'Pemasukan' : 'Pengeluaran',
        amount: r.amount,
        date: r.transactionDate,
        group: 'keuangan'
      });
    });
    (records || []).slice(0, 5).forEach(r => {
      activities.push({
        id: `aff-${r.id}`,
        type: 'affiliate',
        title: r.affiliate?.name || 'Unknown',
        subtitle: 'Komisi Affiliate',
        amount: r.netAmount,
        deduction: r.deduction,
        date: r.date,
        group: 'affiliate'
      });
    });
    activities.sort((a, b) => new Date(b.date) - new Date(a.date));
    return activities.slice(0, 8);
  }, [dailyRecords, records]);

  if (!dashboardStats && !dailyStats) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="animate-spin rounded-full h-12 w-12 border-2 border-emerald-500/30 border-t-emerald-500" />
            <div className="absolute inset-0 rounded-full bg-emerald-500/5 animate-pulse" />
          </div>
          <p className="text-slate-400 text-sm font-medium">Memuat dashboard...</p>
        </div>
      </div>
    );
  }

  const quickActions = [
    { label: 'Tambah Transaksi', icon: Plus, color: 'bg-emerald-500', href: '/keuangan', desc: 'Catat pemasukan atau pengeluaran baru' },
    { label: 'Tambah Anggota', icon: UserPlus, color: 'bg-blue-500', href: '/affiliate-hub', desc: 'Daftarkan affiliate baru' },
    { label: 'Download Laporan', icon: Download, color: 'bg-violet-500', href: '/keuangan', desc: 'Unduh PDF laporan keuangan' },
    { label: 'Kelola Data', icon: Settings, color: 'bg-slate-700', href: '/settings', desc: 'Atur pengaturan sistem' },
  ];

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate={mounted ? "visible" : "hidden"}
      className="space-y-6"
    >
      {/* ───── HERO SECTION ───── */}
      <motion.div variants={itemVariants} className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600 p-6 sm:p-8 lg:p-10 shadow-lg shadow-emerald-500/20">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full translate-x-8 -translate-y-8 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full -translate-x-6 translate-y-6 pointer-events-none" />

        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/10">
                  <Sparkles size={24} className="text-emerald-300" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-white">
                    {getGreeting()}, {user?.username || 'User'}
                  </h1>
                  <p className="text-sm text-emerald-200/70">Business Operations System</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-3 px-4 py-2 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
                <Clock size={14} className="text-emerald-300" />
                <span className="text-sm font-semibold text-white tabular-nums">{formatTime(time)}</span>
              </div>
              <div className="hidden sm:flex items-center gap-3 px-4 py-2 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
                <Calendar size={14} className="text-emerald-300" />
                <span className="text-xs font-medium text-emerald-200/80">{formatDate(time)}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
            {[
              { label: 'Pemasukan Hari Ini', value: `Rp${dailyTransactionCount > 0 ? (totalDailyIncome / Math.max(dailyTransactionCount, 1)).toFixed(0) : 0}`, icon: TrendingUp, color: 'text-emerald-300' },
              { label: 'Total Transaksi', value: `${dailyTransactionCount + records.length}`, icon: Activity, color: 'text-blue-300' },
              { label: 'Anggota Aktif', value: `${totalMembers}`, icon: Users, color: 'text-violet-300' },
              { label: 'Saldo Sistem', value: formatShort(totalCashFlow), icon: Wallet, color: 'text-amber-300' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 backdrop-blur-sm border border-white/5">
                <item.icon size={18} className={item.color} />
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold text-white/50 uppercase tracking-wider">{item.label}</p>
                  <p className="text-sm font-bold text-white truncate">{item.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* ───── STATS GRID ───── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Pemasukan"
          value={formatCurrency(totalDailyIncome)}
          icon={TrendingUp}
          trend={12}
          color="bg-emerald-50 text-emerald-600"
          gradient="bg-emerald-50"
        />
        <StatCard
          title="Total Pengeluaran"
          value={formatCurrency(totalDailyExpense)}
          icon={ArrowDownRight}
          trend={-3}
          color="bg-red-50 text-red-500"
          gradient="bg-red-50"
        />
        <StatCard
          title="Saldo Bersih"
          value={formatCurrency(totalDailyBalance)}
          icon={Wallet}
          trend={8}
          color="bg-blue-50 text-blue-600"
          gradient="bg-blue-50"
        />
        <StatCard
          title="Komisi Affiliate"
          value={formatCurrency(totalAffiliateNet)}
          icon={DollarSign}
          trend={15}
          color="bg-violet-50 text-violet-600"
          gradient="bg-violet-50"
        />
      </div>

      {/* ───── CHARTS + ACTIVITY ───── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div variants={scaleVariants} className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 p-5 sm:p-6 flex flex-col">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-base font-bold text-slate-800">Keuangan Harian</h3>
              <p className="text-xs text-slate-400 mt-0.5">Pemasukan & Pengeluaran — 30 hari terakhir</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-emerald-500 inline-block" />
                <span className="text-slate-500 font-medium">Pemasukan</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-red-300 inline-block" />
                <span className="text-slate-500 font-medium">Pengeluaran</span>
              </span>
            </div>
          </div>
          <div className="flex-1 min-h-[240px] sm:min-h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={dailyChartData}
                margin={{ top: 4, right: 4, left: -16, bottom: 0 }}
                barCategoryGap="30%"
                barGap={2}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94a3b8', fontSize: 10 }}
                  dy={8}
                  interval={4}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94a3b8', fontSize: 10 }}
                  tickFormatter={formatShort}
                  width={40}
                />
                <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc', radius: 4 }} />
                <Bar dataKey="income" name="Pemasukan" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={20} />
                <Bar dataKey="expense" name="Pengeluaran" fill="#f87171" radius={[4, 4, 0, 0]} maxBarSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div variants={scaleVariants} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 sm:p-6 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-slate-800">Aktivitas Terbaru</h3>
            <RefreshCw size={14} className="text-slate-300" />
          </div>
          <div className="flex-1 space-y-0">
            {recentActivities.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full py-10 text-slate-400">
                <Activity size={36} className="mb-3 opacity-30" />
                <p className="text-sm">Belum ada aktivitas</p>
              </div>
            ) : (
              <div className="relative">
                <div className="absolute left-[17px] top-2 bottom-2 w-px bg-slate-100" />
                <div className="space-y-0">
                  {recentActivities.map((act, i) => (
                    <motion.div
                      key={act.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05, duration: 0.3 }}
                      className="relative flex items-start gap-4 py-2.5 group"
                    >
                      <div className={`relative z-10 w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                        act.type === 'income' ? 'bg-emerald-50 text-emerald-600' :
                        act.type === 'expense' ? 'bg-red-50 text-red-500' :
                        'bg-violet-50 text-violet-600'
                      }`}>
                        {act.type === 'income' ? <ArrowUpRight size={14} /> :
                         act.type === 'expense' ? <ArrowDownRight size={14} /> :
                         <Users size={14} />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-slate-700 truncate">{act.title}</p>
                        <p className="text-[11px] text-slate-400">{act.subtitle}</p>
                      </div>
                      <div className="text-right shrink-0">
                        {act.amount && (
                          <p className={`text-xs font-bold ${
                            act.type === 'income' ? 'text-emerald-600' :
                            act.type === 'expense' ? 'text-red-500' :
                            'text-violet-600'
                          }`}>
                            {act.type === 'expense' ? '-' : '+'}{formatShort(act.amount)}
                          </p>
                        )}
                        {act.deduction && (
                          <p className="text-[10px] text-red-400">-{formatShort(act.deduction)}</p>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* ───── QUICK ACTIONS ───── */}
      <motion.div variants={itemVariants}>
        <div className="flex items-center gap-2 mb-4">
          <Zap size={16} className="text-emerald-500" />
          <h3 className="text-sm font-bold text-slate-700">Quick Actions</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {quickActions.map((action, i) => (
            <motion.button
              key={i}
              variants={itemVariants}
              whileHover={{ y: -3, transition: { duration: 0.2 } }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate(action.href)}
              className="relative overflow-hidden bg-white rounded-2xl border border-slate-100 p-4 text-left transition-all duration-200 hover:shadow-lg hover:shadow-slate-200/50 hover:border-slate-200 group"
            >
              <div className={`w-10 h-10 rounded-xl ${action.color} flex items-center justify-center mb-3 shadow-sm`}>
                <action.icon size={18} className="text-white" />
              </div>
              <p className="text-sm font-bold text-slate-700 group-hover:text-slate-900 transition-colors">{action.label}</p>
              <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">{action.desc}</p>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* ───── BOTTOM INSIGHT ───── */}
      <motion.div variants={itemVariants} className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl p-5 sm:p-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center">
            <BarChart3 size={24} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-white">Ringkasan Bisnis</p>
            <p className="text-xs text-emerald-100/80 mt-0.5">
              Total pemasukan: {formatCurrency(totalDailyIncome)} &middot; Total komisi: {formatCurrency(totalAffiliateNet)} &middot; {totalMembers} anggota
            </p>
          </div>
        </div>
        <Target size={28} className="text-white/30" />
      </motion.div>
    </motion.div>
  );
};

export default Dashboard;
