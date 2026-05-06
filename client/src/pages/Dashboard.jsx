import React, { useEffect, useMemo } from 'react';
import { useFinanceStore } from '../store/financeStore';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, Cell, Legend
} from 'recharts';
import { Wallet, TrendingUp, DollarSign, Activity, Users } from 'lucide-react';
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

const StatCard = ({ title, value, icon: Icon, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.4 }}
    className="relative overflow-hidden bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600 p-5 rounded-2xl shadow-lg shadow-emerald-500/20 group"
  >
    <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full transform translate-x-8 -translate-y-8 pointer-events-none group-hover:scale-125 transition-transform duration-500" />
    <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/5 rounded-full transform -translate-x-6 translate-y-6 pointer-events-none" />
    <div className="relative z-10 flex items-start gap-4">
      <div className="p-2.5 rounded-xl bg-white/15 backdrop-blur-sm">
        <Icon size={22} className="text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-emerald-100 text-xs font-semibold uppercase tracking-wider mb-1 truncate">{title}</p>
        <h3 className="text-xl sm:text-2xl font-bold text-white truncate">{value}</h3>
      </div>
    </div>
  </motion.div>
);

// Custom tooltip for bar chart
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

const Dashboard = () => {
  const { dashboardStats, fetchDashboardStats, records, fetchRecords, members, fetchMembers, isLoading } = useFinanceStore();

  // ⚠️ Hooks MUST be called before any early return
  const chartData = dashboardStats?.chartData || [];

  useEffect(() => {
    fetchDashboardStats();
    fetchRecords();
    fetchMembers();
  }, [fetchDashboardStats, fetchRecords, fetchMembers]);

  if (isLoading && !dashboardStats) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  const { totalAmount, totalDeduction, totalNetAmount } = dashboardStats;

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard title="Total Gross Revenue" value={formatCurrency(totalAmount)} icon={Wallet} delay={0.1} />
        <StatCard title="Admin Deductions" value={formatCurrency(totalDeduction)} icon={Activity} delay={0.2} />
        <StatCard title="Total Net Income" value={formatCurrency(totalNetAmount)} icon={DollarSign} delay={0.3} />
        <StatCard title="Total Affiliates" value={members.length.toString()} icon={Users} delay={0.4} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bar Chart — Daily Revenue */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.4 }}
          className="lg:col-span-2 bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col"
        >
          <div className="flex justify-between items-start mb-5">
            <div>
              <h3 className="text-base font-bold text-slate-800">Revenue Per Hari</h3>
              <p className="text-xs text-slate-400 mt-0.5">Net Income harian — 30 hari terakhir</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-emerald-500 inline-block"></span>
                <span className="text-slate-500 font-medium">Net</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-indigo-300 inline-block"></span>
                <span className="text-slate-500 font-medium">Gross</span>
              </span>
            </div>
          </div>
          <div className="flex-1 min-h-[240px] sm:min-h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
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
                <Bar dataKey="amount" name="Gross" fill="#a5b4fc" radius={[4, 4, 0, 0]} maxBarSize={20} />
                <Bar dataKey="netAmount" name="Net" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Recent Transactions */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.4 }}
          className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col"
        >
          <h3 className="text-lg font-bold text-slate-800 mb-6">Recent Transactions</h3>
          <div className="flex-1 flex flex-col gap-4 overflow-y-auto custom-scrollbar pr-2 max-h-[300px] lg:max-h-full">
            {records.length === 0 ? (
              <div className="flex-1 flex flex-col justify-center items-center text-slate-400 h-full py-10">
                <Activity size={40} className="mb-3 opacity-20" />
                <p className="text-sm">No recent transactions.</p>
              </div>
            ) : (
              records.slice(0, 5).map((record) => (
                <div key={record.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                      <Wallet size={18} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">{record.affiliate?.name || 'Unknown'}</p>
                      <p className="text-xs text-slate-500 truncate">{new Date(record.date).toLocaleDateString('en-GB')}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-4">
                    <p className="text-sm font-bold text-emerald-600">+{formatCurrency(record.netAmount)}</p>
                    <p className="text-xs text-rose-500">-{formatCurrency(record.deduction)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;
