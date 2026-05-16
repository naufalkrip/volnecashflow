import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { FileText, ArrowLeftRight, Wallet, ArrowDownCircle, ArrowUpCircle, Plus, X, Edit2, Trash2, Search, Filter, Download, TrendingUp, TrendingDown, FolderOpen, Layers, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDailyFinanceStore } from '../store/dailyFinanceStore';
import ConfirmModal from '../components/ui/ConfirmModal';
import { PdfModal } from './DailyFinance';

const TABS = [
  { id: 'laporan', label: 'Laporan Keuangan', icon: FileText },
  { id: 'transaksi', label: 'Transaksi', icon: ArrowLeftRight },
];

const formatCurrency = (v) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(Math.abs(v));

const formatDate = (d) =>
  new Date(d).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' });

const formatDateInput = (d) =>
  new Date(d).toISOString().split('T')[0];

const formatDateTimeInput = (d) => {
  const date = new Date(d);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const h = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  return `${y}-${m}-${day}T${h}:${min}`;
};

const nowStr = () => formatDateTimeInput(new Date());

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

const GroupModal = ({ onClose, onSubmit, isLoading }) => {
  const [name, setName] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit(name.trim());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }} transition={{ type: 'spring', stiffness: 280, damping: 28 }}
        className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 sm:py-5 border-b border-slate-100">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-emerald-100 shrink-0">
              <FolderOpen size={22} className="text-emerald-600" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-bold text-slate-800 truncate">Grup Baru</h3>
              <p className="text-xs text-slate-400">Buat grup transaksi baru</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors shrink-0">
            <X size={20} />
          </button>
        </div>
        <div className="px-4 sm:px-6 py-4 sm:py-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Nama Grup</label>
              <input required value={name} onChange={e => setName(e.target.value)}
                placeholder="Contoh: Liburan Jogja"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 outline-none" />
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={onClose}
                className="flex-1 py-3 border border-slate-200 text-slate-600 font-semibold rounded-xl hover:bg-white transition-colors text-sm">
                Batal
              </button>
              <button type="submit" disabled={isLoading || !name.trim()}
                className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl transition-all text-sm shadow-sm shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed">
                {isLoading ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

const TransactionModal = ({ onClose, onSubmit, isLoading, editData, selectedGroupName }) => {
  const isEdit = !!editData;
  const [type, setType] = useState(editData?.type || 'INCOME');
  const [description, setDescription] = useState(editData?.description || '');
  const [amount, setAmount] = useState(editData?.amount?.toString() || '');
  const [transactionDate, setTransactionDate] = useState(
    editData?.transactionDate ? formatDateTimeInput(editData.transactionDate) : nowStr()
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!description.trim() || !amount) return;
    onSubmit({ type, description: description.trim(), amount: parseFloat(amount), transactionDate, group: selectedGroupName || '' });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }} transition={{ type: 'spring', stiffness: 280, damping: 28 }}
        className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90dvh]">
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 sm:py-5 border-b border-slate-100">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-emerald-100 shrink-0">
              {type === 'INCOME'
                ? <ArrowDownCircle size={22} className="text-emerald-600" />
                : <ArrowUpCircle size={22} className="text-emerald-600" />
              }
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-bold text-slate-800 truncate">
                {isEdit ? 'Edit Transaksi' : 'Tambah Transaksi'}
              </h3>
              <p className="text-xs text-slate-400">Catat pemasukan atau pengeluaran harian</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors shrink-0">
            <X size={20} />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 px-4 sm:px-6 py-4 sm:py-5">
          <form id="txn-form" onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Jenis Transaksi</label>
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => setType('INCOME')}
                  className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold border-2 transition-all ${
                    type === 'INCOME'
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                      : 'border-slate-200 bg-slate-50 text-slate-500 hover:border-slate-300'
                  }`}>
                  <ArrowDownCircle size={16} />
                  Uang Masuk
                </button>
                <button type="button" onClick={() => setType('EXPENSE')}
                  className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold border-2 transition-all ${
                    type === 'EXPENSE'
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                      : 'border-slate-200 bg-slate-50 text-slate-500 hover:border-slate-300'
                  }`}>
                  <ArrowUpCircle size={16} />
                  Uang Keluar
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Keterangan</label>
              <textarea required value={description} onChange={e => setDescription(e.target.value)}
                placeholder="Masukkan keterangan transaksi..."
                rows={3}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 outline-none resize-none" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Jumlah Uang</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 font-semibold text-sm">Rp</div>
                <input type="number" required min="1" value={amount}
                  onChange={e => setAmount(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 outline-none"
                  placeholder="0" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Tanggal</label>
              <input type="datetime-local" required value={transactionDate}
                onChange={e => setTransactionDate(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 outline-none" />
            </div>
          </form>
        </div>
        <div className="px-4 sm:px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex gap-3 shrink-0">
          <button type="button" onClick={onClose}
            className="flex-1 py-3 border border-slate-200 text-slate-600 font-semibold rounded-xl hover:bg-white transition-colors text-sm">
            Batal
          </button>
          <button type="submit" form="txn-form" disabled={isLoading || !description.trim() || !amount}
            className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl transition-all text-sm shadow-sm shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed">
            {isLoading ? 'Menyimpan...' : (isEdit ? 'Simpan Perubahan' : 'Simpan Transaksi')}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const formatDateShort = (d) =>
  new Date(d).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' });

const formatTime = (d) =>
  new Date(d).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

const groupByDate = (records) => {
  const map = {};
  const sorted = [...records].sort((a, b) => new Date(b.transactionDate) - new Date(a.transactionDate));
  sorted.forEach(r => {
    const key = formatDateInput(r.transactionDate);
    if (!map[key]) map[key] = { date: key, records: [], totalIncome: 0, totalExpense: 0 };
    map[key].records.push(r);
    if (r.type === 'INCOME') map[key].totalIncome += r.amount;
    else map[key].totalExpense += r.amount;
  });
  return Object.values(map).sort((a, b) => new Date(b.date) - new Date(a.date));
};

const GroupDetail = ({ group, records, onBack, onAddTxn, onEdit, onDeleteTxn, onPdf, isLoading }) => {
  const [expandedDate, setExpandedDate] = useState(null);

  const filteredRecords = useMemo(() =>
    records.filter(r => r.group === group.name),
  [records, group.name]);

  const groupedData = useMemo(() => groupByDate(filteredRecords), [filteredRecords]);

  const totalIncome = filteredRecords.filter(r => r.type === 'INCOME').reduce((s, r) => s + r.amount, 0);
  const totalExpense = filteredRecords.filter(r => r.type === 'EXPENSE').reduce((s, r) => s + r.amount, 0);
  const totalBalance = totalIncome - totalExpense;

  return (
    <div className="space-y-4">
      <button onClick={onBack}
        className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-emerald-600 transition-colors bg-white px-4 py-2.5 rounded-xl border border-slate-100 shadow-sm hover:border-emerald-200">
        <ChevronLeft size={18} />
        Kembali
      </button>

      <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-4 sm:p-5 rounded-2xl shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-white/15">
            <FolderOpen size={18} className="text-white" />
          </div>
          <div>
            <p className="text-[10px] text-emerald-200 font-semibold uppercase tracking-wider">Grup Transaksi</p>
            <p className="text-sm font-bold text-white">{group.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {onPdf && (
            <button onClick={onPdf}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-white text-xs font-semibold transition-all">
              <Download size={14} />
              PDF
            </button>
          )}
          <button onClick={onAddTxn}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-white text-xs font-semibold transition-all">
            <Plus size={14} />
            Tambah
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-4 rounded-2xl shadow-sm">
          <p className="text-emerald-100 text-xs font-semibold uppercase tracking-wider">Uang Masuk</p>
          <p className="text-lg font-bold text-white mt-1">{formatCurrency(totalIncome)}</p>
        </div>
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-4 rounded-2xl shadow-sm">
          <p className="text-emerald-100 text-xs font-semibold uppercase tracking-wider">Uang Keluar</p>
          <p className="text-lg font-bold text-white mt-1">{formatCurrency(totalExpense)}</p>
        </div>
        <div className="bg-gradient-to-br from-slate-700 to-slate-800 p-4 rounded-2xl shadow-sm">
          <p className="text-white/70 text-xs font-semibold uppercase tracking-wider">Saldo</p>
          <p className="text-lg font-bold text-white mt-1">{formatCurrency(totalBalance)}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {filteredRecords.length === 0 ? (
          <div className="py-12 text-center">
            <Wallet size={32} className="mx-auto text-slate-200 mb-3" />
            <p className="font-semibold text-slate-500">Belum ada transaksi</p>
          </div>
        ) : (
          <div>
            <div className="hidden sm:grid grid-cols-12 gap-4 px-6 py-3.5 bg-slate-50/80 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              <div className="col-span-3">Tanggal</div>
              <div className="col-span-2 text-right">Total Masuk</div>
              <div className="col-span-2 text-right">Total Keluar</div>
              <div className="col-span-2 text-right">Saldo</div>
              <div className="col-span-2 text-center">Transaksi</div>
              <div className="col-span-1" />
            </div>
            <div className="divide-y divide-slate-50">
              {groupedData.map(group => {
                const isExpanded = expandedDate === group.date;
                const dayBalance = group.totalIncome - group.totalExpense;
                return (
                  <div key={group.date}>
                    <button onClick={() => setExpandedDate(isExpanded ? null : group.date)}
                      className="w-full grid grid-cols-2 sm:grid-cols-12 gap-2 sm:gap-4 px-4 sm:px-6 py-4 hover:bg-slate-50 transition-colors text-left group">
                      <div className="col-span-2 sm:col-span-3 flex items-center gap-2.5">
                        <div className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
                          <ChevronRight size={16} className="text-slate-300" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-800">{formatDateShort(group.date)}</p>
                          <p className="text-[10px] text-slate-400">{new Date(group.date).toLocaleDateString('id-ID', { weekday: 'long' })}</p>
                        </div>
                      </div>
                      <div className="sm:col-span-2 text-right">
                        <p className="text-sm font-bold text-emerald-600">+{formatCurrency(group.totalIncome)}</p>
                      </div>
                      <div className="sm:col-span-2 text-right">
                        <p className="text-sm font-bold text-emerald-600">-{formatCurrency(group.totalExpense)}</p>
                      </div>
                      <div className="sm:col-span-2 text-right">
                        <p className="text-sm font-bold text-emerald-600">{formatCurrency(dayBalance)}</p>
                      </div>
                      <div className="sm:col-span-2 text-center">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-slate-100 text-[11px] font-bold text-slate-500">
                          {group.records.length} transaksi
                        </span>
                      </div>
                      <div className="sm:col-span-1 hidden sm:flex items-center justify-end">
                        <ChevronRight size={16} className="text-slate-300" />
                      </div>
                    </button>
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
                          className="overflow-hidden">
                          <div className="bg-slate-50/50 border-t border-slate-100">
                            <div className="hidden sm:grid grid-cols-12 gap-4 px-6 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                              <div className="col-span-1" />
                              <div className="col-span-2">Jenis</div>
                              <div className="col-span-4">Keterangan</div>
                              <div className="col-span-2 text-right">Jumlah</div>
                              <div className="col-span-2">Jam</div>
                              <div className="col-span-1" />
                            </div>
                            <div className="divide-y divide-slate-100">
                              {group.records.map(record => (
                                <div key={record.id}
                                  className="grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-4 px-4 sm:px-6 py-3 hover:bg-white/60 transition-colors group/item">
                                  <div className="sm:hidden flex items-center justify-between w-full">
                                    <div className="flex items-center gap-2">
                                      <div className="w-7 h-7 rounded-full flex items-center justify-center bg-emerald-100">
                                        {record.type === 'INCOME'
                                          ? <ArrowDownCircle size={14} className="text-emerald-600" />
                                          : <ArrowUpCircle size={14} className="text-emerald-600" />
                                        }
                                      </div>
                                      <div>
                                        <p className="text-sm font-semibold text-slate-700">
                                          {record.type === 'INCOME' ? 'Uang Masuk' : 'Uang Keluar'}
                                        </p>
                                        <p className="text-xs text-slate-400">{formatTime(record.transactionDate)}</p>
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <p className="text-sm font-bold text-emerald-600">
                                        {record.type === 'INCOME' ? '+' : '-'}{formatCurrency(record.amount)}
                                      </p>
                                    </div>
                                  </div>
                                  <p className="sm:hidden text-xs text-slate-500 pl-9 -mt-1">{record.description}</p>
                                  <div className="sm:hidden flex gap-1.5 pl-9 mt-1.5">
                                    <button onClick={() => onEdit(record)}
                                      className="p-1 rounded-md bg-blue-50 text-blue-500 hover:bg-blue-100 transition-colors">
                                      <Edit2 size={12} />
                                    </button>
                                    <button onClick={() => onDeleteTxn(record)}
                                      className="p-1 rounded-md bg-emerald-50 text-emerald-400 hover:bg-emerald-100 transition-colors">
                                      <Trash2 size={12} />
                                    </button>
                                  </div>
                                  <div className="hidden sm:flex col-span-1 items-center">
                                    <div className="w-8 h-8 rounded-full flex items-center justify-center bg-emerald-100">
                                      {record.type === 'INCOME'
                                        ? <ArrowDownCircle size={16} className="text-emerald-600" />
                                        : <ArrowUpCircle size={16} className="text-emerald-600" />
                                      }
                                    </div>
                                  </div>
                                  <div className="hidden sm:flex col-span-2 items-center">
                                    <span className="text-sm font-semibold text-emerald-700">
                                      {record.type === 'INCOME' ? 'Uang Masuk' : 'Uang Keluar'}
                                    </span>
                                  </div>
                                  <div className="hidden sm:flex col-span-4 items-center">
                                    <p className="text-sm text-slate-600 truncate">{record.description}</p>
                                  </div>
                                  <div className="hidden sm:flex col-span-2 items-center justify-end">
                                    <p className="text-sm font-bold text-emerald-600">
                                      {record.type === 'INCOME' ? '+' : '-'}{formatCurrency(record.amount)}
                                    </p>
                                  </div>
                                  <div className="hidden sm:flex col-span-2 items-center">
                                    <p className="text-xs text-slate-400">{formatTime(record.transactionDate)}</p>
                                  </div>
                                  <div className="hidden sm:flex col-span-1 items-center justify-end gap-1">
                                    <button onClick={() => onEdit(record)}
                                      className="p-1.5 rounded-lg bg-blue-50 text-blue-500 hover:bg-blue-100 transition-colors">
                                      <Edit2 size={13} />
                                    </button>
                                    <button onClick={() => onDeleteTxn(record)}
                                      className="p-1.5 rounded-lg bg-emerald-50 text-emerald-400 hover:bg-emerald-100 transition-colors">
                                      <Trash2 size={13} />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
            <div className="bg-gradient-to-r from-emerald-600 to-teal-700 px-6 py-4">
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <p className="text-[10px] text-emerald-200 font-semibold uppercase tracking-wider">Total Masuk</p>
                  <p className="text-sm font-bold text-white mt-0.5">+{formatCurrency(totalIncome)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-emerald-200 font-semibold uppercase tracking-wider">Total Keluar</p>
                  <p className="text-sm font-bold text-white mt-0.5">-{formatCurrency(totalExpense)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-emerald-200 font-semibold uppercase tracking-wider">Saldo Akhir</p>
                  <p className="text-sm font-bold text-white mt-0.5">{formatCurrency(totalBalance)}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-emerald-200 font-semibold uppercase tracking-wider">Total Transaksi</p>
                  <p className="text-sm font-bold text-white mt-0.5">{filteredRecords.length} transaksi</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const RenameModal = ({ onClose, onSubmit, isLoading, initialValue }) => {
  const [name, setName] = useState(initialValue || '');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit(name.trim());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }} transition={{ type: 'spring', stiffness: 280, damping: 28 }}
        className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 sm:py-5 border-b border-slate-100">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-blue-100 shrink-0">
              <Edit2 size={22} className="text-blue-600" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-bold text-slate-800 truncate">Ubah Grup</h3>
              <p className="text-xs text-slate-400">Ganti nama grup transaksi</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors shrink-0">
            <X size={20} />
          </button>
        </div>
        <div className="px-4 sm:px-6 py-4 sm:py-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Nama Grup</label>
              <input required value={name} onChange={e => setName(e.target.value)}
                placeholder="Contoh: Liburan Jogja"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 outline-none" />
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={onClose}
                className="flex-1 py-3 border border-slate-200 text-slate-600 font-semibold rounded-xl hover:bg-white transition-colors text-sm">
                Batal
              </button>
              <button type="submit" disabled={isLoading || !name.trim()}
                className="flex-1 py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-xl transition-all text-sm shadow-sm shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed">
                {isLoading ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

const TransactionManager = () => {
  const { records, groups, isLoading, error, fetchRecords, fetchGroups, addRecord, updateRecord, deleteRecord, createGroup, renameGroup, deleteGroup, fetchStats } = useDailyFinanceStore();
  const [groupModalOpen, setGroupModalOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [txnModalOpen, setTxnModalOpen] = useState(false);
  const [editTxn, setEditTxn] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, record: null });
  const [renameModalOpen, setRenameModalOpen] = useState(false);
  const [groupToRename, setGroupToRename] = useState(null);
  const [renameValue, setRenameValue] = useState('');
  const [pdfModalOpen, setPdfModalOpen] = useState(false);
  const [pdfGroup, setPdfGroup] = useState(null);

  useEffect(() => {
    fetchRecords({});
    fetchGroups();
  }, [fetchRecords, fetchGroups]);

  const handleCreateGroup = async (name) => {
    const success = await createGroup(name);
    if (success) {
      setGroupModalOpen(false);
    }
  };

  const handleSelectGroup = (group) => {
    setSelectedGroup(group);
  };

  const handleAddTxn = () => {
    setEditTxn(null);
    setTxnModalOpen(true);
  };

  const handleEditTxn = (record) => {
    setEditTxn(record);
    setTxnModalOpen(true);
  };

  const handleSubmitTxn = async (formData) => {
    let success;
    if (editTxn) {
      success = await updateRecord(editTxn.id, formData);
    } else {
      success = await addRecord(formData);
    }
    if (success) {
      setTxnModalOpen(false);
      setEditTxn(null);
      fetchStats();
    }
  };

  const handleDeleteTxn = (record) => {
    setDeleteConfirm({ open: true, record });
  };

  const confirmDelete = async () => {
    if (deleteConfirm.record) {
      await deleteRecord(deleteConfirm.record.id);
      fetchStats();
    }
    setDeleteConfirm({ open: false, record: null });
  };

  const handleDeleteGroup = async (group) => {
    const success = await deleteGroup(group.id);
    if (success && selectedGroup?.id === group.id) {
      setSelectedGroup(null);
    }
  };

  const handleOpenRename = (group) => {
    setGroupToRename(group);
    setRenameValue(group.name);
    setRenameModalOpen(true);
  };

  const handleOpenPdf = (group) => {
    setPdfGroup(group.name);
    setPdfModalOpen(true);
  };

  const handleRenameGroup = async () => {
    if (!renameValue.trim() || !groupToRename) return;
    const success = await renameGroup(groupToRename.id, renameValue.trim());
    if (success) {
      setRenameModalOpen(false);
      setGroupToRename(null);
      setRenameValue('');
    }
  };

  if (selectedGroup) {
    return (
      <>
        <GroupDetail
          group={selectedGroup}
          records={records}
          onBack={() => setSelectedGroup(null)}
          onAddTxn={handleAddTxn}
          onEdit={handleEditTxn}
          onDeleteTxn={handleDeleteTxn}
          onPdf={() => handleOpenPdf(selectedGroup)}
          isLoading={isLoading}
        />
        <AnimatePresence>
          {txnModalOpen && (
            <TransactionModal
              onClose={() => { setTxnModalOpen(false); setEditTxn(null); }}
              onSubmit={handleSubmitTxn}
              isLoading={isLoading}
              editData={editTxn}
              selectedGroupName={selectedGroup.name}
            />
          )}
        </AnimatePresence>
        <ConfirmModal
          isOpen={deleteConfirm.open}
          onClose={() => setDeleteConfirm({ open: false, record: null })}
          onConfirm={confirmDelete}
          type="danger"
          title="Hapus Transaksi"
          message={`Hapus transaksi "${deleteConfirm.record?.description || ''}"?`}
          confirmLabel="Hapus"
          loading={isLoading}
        />
        <AnimatePresence>
          {pdfModalOpen && (
            <PdfModal
              records={pdfGroup ? records.filter(r => r.group === pdfGroup) : []}
              onClose={() => { setPdfModalOpen(false); setPdfGroup(null); }}
            />
          )}
        </AnimatePresence>
      </>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-600 text-sm font-medium flex items-center gap-2">
          <AlertCircle size={16} />
          {error}
        </div>
      )}
      <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center">
              <Layers size={20} className="text-emerald-500" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">Manajemen Transaksi</h3>
              <p className="text-xs text-slate-400 mt-0.5">Kelola grup transaksi khusus</p>
            </div>
          </div>
          <button onClick={() => setGroupModalOpen(true)}
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold px-5 py-2.5 rounded-xl transition-all shadow-sm shadow-emerald-500/20 text-sm w-full sm:w-auto">
            <Plus size={16} />
            Buat Grup Baru
          </button>
        </div>
      </div>

      {groups.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-10 text-center">
          <div className="w-16 h-16 mx-auto bg-slate-50 rounded-full flex items-center justify-center border border-slate-100 mb-4">
            <FolderOpen size={28} className="text-slate-300" />
          </div>
          <h3 className="text-base font-bold text-slate-600">Belum Ada Grup</h3>
          <p className="text-sm text-slate-400 mt-1 max-w-sm mx-auto">
            Buat grup transaksi baru untuk memisahkan laporan keuangan khusus, seperti "Liburan Jogja" atau "Proyek A".
          </p>
          <button onClick={() => setGroupModalOpen(true)}
            className="mt-4 inline-flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold px-5 py-2.5 rounded-xl text-sm shadow-sm shadow-emerald-500/20 hover:from-emerald-600 hover:to-teal-700 transition-all">
            <Plus size={16} />
            Buat Grup Baru
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {groups.map((group, idx) => {
            const groupTxnCount = records.filter(r => r.group === group.name).length;
            const groupIncome = records.filter(r => r.group === group.name && r.type === 'INCOME').reduce((s, r) => s + r.amount, 0);
            const groupExpense = records.filter(r => r.group === group.name && r.type === 'EXPENSE').reduce((s, r) => s + r.amount, 0);
            return (
              <motion.div key={group.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}>
                <div className="group relative bg-white rounded-2xl shadow-sm border border-slate-100 hover:border-emerald-200 hover:shadow-md hover:shadow-emerald-500/5 transition-all cursor-pointer overflow-hidden"
                  onClick={() => handleSelectGroup(group)}>
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-sm">
                        <FolderOpen size={20} className="text-white" />
                      </div>
                      <div className="flex items-center gap-1">
                        <button onClick={(e) => { e.stopPropagation(); handleOpenPdf(group); }}
                          className="p-1.5 rounded-lg text-slate-300 hover:text-emerald-500 hover:bg-emerald-50 transition-all">
                          <Download size={14} />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); handleOpenRename(group); }}
                          className="p-1.5 rounded-lg text-slate-300 hover:text-blue-500 hover:bg-blue-50 transition-all">
                          <Edit2 size={14} />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); handleDeleteGroup(group); }}
                          className="p-1.5 rounded-lg text-slate-300 hover:text-red-400 hover:bg-red-50 transition-all">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    <h4 className="text-sm font-bold text-slate-800 mb-1 truncate">{group.name}</h4>
                    <div className="flex items-center gap-3 text-xs text-slate-400">
                      <span>{groupTxnCount} transaksi</span>
                      {groupTxnCount > 0 && (
                        <>
                          <span className="text-emerald-500 font-semibold">+{formatCurrency(groupIncome)}</span>
                          <span className="text-red-400 font-semibold">-{formatCurrency(groupExpense)}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="h-1 bg-gradient-to-r from-emerald-400 to-teal-500" />
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      <AnimatePresence>
        {groupModalOpen && (
          <GroupModal
            onClose={() => setGroupModalOpen(false)}
            onSubmit={handleCreateGroup}
            isLoading={isLoading}
          />
        )}
        {renameModalOpen && (
          <RenameModal
            onClose={() => { setRenameModalOpen(false); setGroupToRename(null); setRenameValue(''); }}
            onSubmit={handleRenameGroup}
            isLoading={isLoading}
            initialValue={renameValue}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {pdfModalOpen && (
          <PdfModal
            records={pdfGroup ? records.filter(r => r.group === pdfGroup) : []}
            onClose={() => { setPdfModalOpen(false); setPdfGroup(null); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

const LaporanKeuangan = () => {
  const { records, isLoading, fetchRecords, addRecord, updateRecord, deleteRecord, fetchStats } = useDailyFinanceStore();
  const [expandedDate, setExpandedDate] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [pdfModalOpen, setPdfModalOpen] = useState(false);
  const [txnModalOpen, setTxnModalOpen] = useState(false);
  const [editRecord, setEditRecord] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, record: null });

  useEffect(() => {
    fetchRecords({});
  }, [fetchRecords]);

  const handleAddTxn = async (formData) => {
    const success = await addRecord(formData);
    if (success) {
      setTxnModalOpen(false);
      fetchStats();
    }
  };

  const handleEditTxn = (record) => {
    setEditRecord(record);
    setTxnModalOpen(true);
  };

  const handleUpdateTxn = async (formData) => {
    let success;
    if (editRecord) {
      success = await updateRecord(editRecord.id, formData);
    } else {
      success = await addRecord(formData);
    }
    if (success) {
      setTxnModalOpen(false);
      setEditRecord(null);
      fetchStats();
    }
  };

  const handleDeleteRequest = (record) => {
    setDeleteConfirm({ open: true, record });
  };

  const confirmDelete = async () => {
    if (deleteConfirm.record) {
      await deleteRecord(deleteConfirm.record.id);
      fetchStats();
    }
    setDeleteConfirm({ open: false, record: null });
  };

  const ungroupedRecords = useMemo(() =>
    records.filter(r => !r.group),
  [records]);

  const filteredRecords = useMemo(() => {
    let filtered = [...ungroupedRecords];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(r => r.description?.toLowerCase().includes(q));
    }
    if (filterType) {
      filtered = filtered.filter(r => r.type === filterType);
    }
    if (filterStartDate) {
      filtered = filtered.filter(r => formatDateInput(r.transactionDate) >= filterStartDate);
    }
    if (filterEndDate) {
      filtered = filtered.filter(r => formatDateInput(r.transactionDate) <= filterEndDate);
    }
    return filtered;
  }, [records, searchQuery, filterType, filterStartDate, filterEndDate]);

  const groupedData = useMemo(() => groupByDate(filteredRecords), [filteredRecords]);

  const totalIncome = useMemo(() =>
    filteredRecords.filter(r => r.type === 'INCOME').reduce((s, r) => s + r.amount, 0), [filteredRecords]);
  const totalExpense = useMemo(() =>
    filteredRecords.filter(r => r.type === 'EXPENSE').reduce((s, r) => s + r.amount, 0), [filteredRecords]);
  const totalBalance = totalIncome - totalExpense;

  const hasActiveFilters = searchQuery || filterType || filterStartDate || filterEndDate;

  const clearFilters = () => {
    setSearchQuery('');
    setFilterType('');
    setFilterStartDate('');
    setFilterEndDate('');
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        <div className="relative overflow-hidden bg-gradient-to-br from-emerald-500 to-teal-600 p-5 rounded-2xl shadow-lg shadow-emerald-500/20">
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full transform translate-x-8 -translate-y-8" />
          <div className="relative z-10 flex items-start gap-4">
            <div className="p-2.5 rounded-xl bg-white/15 backdrop-blur-sm">
              <TrendingDown size={22} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-emerald-100 text-xs font-semibold uppercase tracking-wider mb-1">Total Uang Masuk</p>
              <h3 className="text-xl sm:text-2xl font-bold text-white truncate">{formatCurrency(totalIncome)}</h3>
            </div>
          </div>
        </div>
        <div className="relative overflow-hidden bg-gradient-to-br from-emerald-500 to-teal-600 p-5 rounded-2xl shadow-lg shadow-emerald-500/20">
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full transform translate-x-8 -translate-y-8" />
          <div className="relative z-10 flex items-start gap-4">
            <div className="p-2.5 rounded-xl bg-white/15 backdrop-blur-sm">
              <TrendingUp size={22} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-emerald-100 text-xs font-semibold uppercase tracking-wider mb-1">Total Uang Keluar</p>
              <h3 className="text-xl sm:text-2xl font-bold text-white truncate">{formatCurrency(totalExpense)}</h3>
            </div>
          </div>
        </div>
        <div className={`relative overflow-hidden p-5 rounded-2xl shadow-lg ${
          totalBalance >= 0
            ? 'bg-gradient-to-br from-slate-700 to-slate-800 shadow-slate-500/20'
            : 'bg-gradient-to-br from-emerald-600 to-teal-700 shadow-emerald-500/20'
        }`}>
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full transform translate-x-8 -translate-y-8" />
          <div className="relative z-10 flex items-start gap-4">
            <div className="p-2.5 rounded-xl bg-white/15 backdrop-blur-sm">
              <Wallet size={22} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white/70 text-xs font-semibold uppercase tracking-wider mb-1">Saldo Akhir</p>
              <h3 className="text-xl sm:text-2xl font-bold text-white truncate">{formatCurrency(totalBalance)}</h3>
            </div>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-800">Laporan Keuangan Global</h3>
            <p className="text-xs text-slate-400 mt-0.5">Ringkasan pemasukan dan pengeluaran harian</p>
          </div>
          <div className="flex gap-3 w-full sm:w-auto">
            <button onClick={() => setTxnModalOpen(true)}
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold px-5 py-2.5 rounded-xl transition-all shadow-sm shadow-emerald-500/20 text-sm flex-1 sm:flex-none">
              <Plus size={16} />
              Tambah Transaksi
            </button>
            <button onClick={() => setPdfModalOpen(true)}
              className="flex items-center justify-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 font-semibold px-5 py-2.5 rounded-xl transition-all text-sm flex-1 sm:flex-none">
              <Download size={16} />
              Download PDF
            </button>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-slate-100">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="relative lg:col-span-2">
            <Search size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
            <input type="text" placeholder="Cari keterangan..." value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 outline-none" />
          </div>
          <div className="relative">
            <Filter size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
            <select value={filterType} onChange={e => setFilterType(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm appearance-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 outline-none">
              <option value="">Semua Jenis</option>
              <option value="INCOME">Uang Masuk</option>
              <option value="EXPENSE">Uang Keluar</option>
            </select>
          </div>
          <div>
            <input type="date" value={filterStartDate} onChange={e => setFilterStartDate(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 outline-none" />
          </div>
          <div>
            <input type="date" value={filterEndDate} onChange={e => setFilterEndDate(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 outline-none" />
          </div>
        </div>
        {hasActiveFilters && (
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100">
            <span className="text-xs text-slate-400">Filter aktif:</span>
            <button onClick={clearFilters}
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100 transition-colors">
              Hapus Filter
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {filteredRecords.length === 0 ? (
          <div className="py-16 text-center">
            <Wallet size={28} className="mx-auto text-slate-200 mb-3" />
            <h3 className="text-base font-bold text-slate-600">
              {hasActiveFilters ? 'Tidak ada transaksi' : 'Belum Ada Transaksi'}
            </h3>
          </div>
        ) : (
          <div>
            <div className="hidden sm:grid grid-cols-12 gap-4 px-5 sm:px-6 py-3.5 bg-slate-50/80 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              <div className="col-span-3">Tanggal</div>
              <div className="col-span-2 text-right">Total Masuk</div>
              <div className="col-span-2 text-right">Total Keluar</div>
              <div className="col-span-2 text-right">Saldo</div>
              <div className="col-span-2 text-center">Transaksi</div>
              <div className="col-span-1" />
            </div>
            <div className="divide-y divide-slate-50 max-h-[460px] overflow-y-auto custom-scrollbar">
              {groupedData.map(group => {
                const isExpanded = expandedDate === group.date;
                const dayBalance = group.totalIncome - group.totalExpense;
                return (
                  <div key={group.date}>
                    <button onClick={() => setExpandedDate(isExpanded ? null : group.date)}
                      className="w-full grid grid-cols-2 sm:grid-cols-12 gap-2 sm:gap-4 px-4 sm:px-6 py-4 hover:bg-slate-50 transition-colors text-left group">
                      <div className="col-span-2 sm:col-span-3 flex items-center gap-2.5">
                        <div className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
                          <ChevronRight size={16} className="text-slate-300" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-800">{formatDateShort(group.date)}</p>
                          <p className="text-[10px] text-slate-400">{new Date(group.date).toLocaleDateString('id-ID', { weekday: 'long' })}</p>
                        </div>
                      </div>
                      <div className="sm:col-span-2 text-right">
                        <p className="text-sm font-bold text-emerald-600">+{formatCurrency(group.totalIncome)}</p>
                      </div>
                      <div className="sm:col-span-2 text-right">
                        <p className="text-sm font-bold text-emerald-600">-{formatCurrency(group.totalExpense)}</p>
                      </div>
                      <div className="sm:col-span-2 text-right">
                        <p className="text-sm font-bold text-emerald-600">{formatCurrency(dayBalance)}</p>
                      </div>
                      <div className="sm:col-span-2 text-center">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-slate-100 text-[11px] font-bold text-slate-500">
                          {group.records.length} transaksi
                        </span>
                      </div>
                      <div className="sm:col-span-1 hidden sm:flex items-center justify-end">
                        <ChevronRight size={16} className="text-slate-300" />
                      </div>
                    </button>
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
                          className="overflow-hidden">
                          <div className="bg-slate-50/50 border-t border-slate-100">
                            <div className="hidden sm:grid grid-cols-12 gap-4 px-6 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                              <div className="col-span-1" />
                              <div className="col-span-2">Jenis</div>
                              <div className="col-span-4">Keterangan</div>
                              <div className="col-span-2 text-right">Jumlah</div>
                              <div className="col-span-2">Jam</div>
                              <div className="col-span-1" />
                            </div>
                            <div className="divide-y divide-slate-100">
                              {group.records.map(record => (
                                <div key={record.id}
                                  className="grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-4 px-4 sm:px-6 py-3 hover:bg-white/60 transition-colors">
                                  <div className="sm:hidden flex items-center justify-between w-full">
                                    <div className="flex items-center gap-2">
                                      <div className="w-7 h-7 rounded-full flex items-center justify-center bg-emerald-100">
                                        {record.type === 'INCOME'
                                          ? <ArrowDownCircle size={14} className="text-emerald-600" />
                                          : <ArrowUpCircle size={14} className="text-emerald-600" />
                                        }
                                      </div>
                                      <div>
                                        <p className="text-sm font-semibold text-slate-700">
                                          {record.type === 'INCOME' ? 'Uang Masuk' : 'Uang Keluar'}
                                        </p>
                                        <p className="text-xs text-slate-400">{formatTime(record.transactionDate)}</p>
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <p className="text-sm font-bold text-emerald-600">
                                        {record.type === 'INCOME' ? '+' : '-'}{formatCurrency(record.amount)}
                                      </p>
                                    </div>
                                  </div>
                                  <p className="sm:hidden text-xs text-slate-500 pl-9 -mt-1">{record.description}</p>
                                  <div className="sm:hidden flex gap-1.5 pl-9 mt-1.5">
                                    <button onClick={() => handleEditTxn(record)}
                                      className="p-1 rounded-md bg-blue-50 text-blue-500 hover:bg-blue-100 transition-colors">
                                      <Edit2 size={12} />
                                    </button>
                                    <button onClick={() => handleDeleteRequest(record)}
                                      className="p-1 rounded-md bg-emerald-50 text-emerald-400 hover:bg-emerald-100 transition-colors">
                                      <Trash2 size={12} />
                                    </button>
                                  </div>
                                  <div className="hidden sm:flex col-span-1 items-center">
                                    <div className="w-8 h-8 rounded-full flex items-center justify-center bg-emerald-100">
                                      {record.type === 'INCOME'
                                        ? <ArrowDownCircle size={16} className="text-emerald-600" />
                                        : <ArrowUpCircle size={16} className="text-emerald-600" />
                                      }
                                    </div>
                                  </div>
                                  <div className="hidden sm:flex col-span-2 items-center">
                                    <span className="text-sm font-semibold text-emerald-700">
                                      {record.type === 'INCOME' ? 'Uang Masuk' : 'Uang Keluar'}
                                    </span>
                                  </div>
                                  <div className="hidden sm:flex col-span-4 items-center">
                                    <p className="text-sm text-slate-600 truncate">{record.description}</p>
                                  </div>
                                  <div className="hidden sm:flex col-span-2 items-center justify-end">
                                    <p className="text-sm font-bold text-emerald-600">
                                      {record.type === 'INCOME' ? '+' : '-'}{formatCurrency(record.amount)}
                                    </p>
                                  </div>
                                  <div className="hidden sm:flex col-span-2 items-center">
                                    <p className="text-xs text-slate-400">{formatTime(record.transactionDate)}</p>
                                  </div>
                                                  <div className="hidden sm:flex col-span-1 items-center justify-end gap-1">
                                                    <button onClick={() => handleEditTxn(record)}
                                                      className="p-1.5 rounded-lg bg-blue-50 text-blue-500 hover:bg-blue-100 transition-colors">
                                                      <Edit2 size={13} />
                                                    </button>
                                                    <button onClick={() => handleDeleteRequest(record)}
                                                      className="p-1.5 rounded-lg bg-emerald-50 text-emerald-400 hover:bg-emerald-100 transition-colors">
                                                      <Trash2 size={13} />
                                                    </button>
                                                  </div>
                                                                        </div>
                                                                      ))}
                                                            </div>
                                                          </div>
                                                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
            <div className="bg-gradient-to-r from-emerald-600 to-teal-700 px-5 sm:px-6 py-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <p className="text-[10px] text-emerald-200 font-semibold uppercase tracking-wider">Total Masuk</p>
                  <p className="text-sm sm:text-base font-bold text-white mt-0.5">+{formatCurrency(totalIncome)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-emerald-200 font-semibold uppercase tracking-wider">Total Keluar</p>
                  <p className="text-sm sm:text-base font-bold text-white mt-0.5">-{formatCurrency(totalExpense)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-emerald-200 font-semibold uppercase tracking-wider">Saldo Akhir</p>
                  <p className="text-sm sm:text-base font-bold text-white mt-0.5">{formatCurrency(totalBalance)}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-emerald-200 font-semibold uppercase tracking-wider">Total Transaksi</p>
                  <p className="text-sm sm:text-base font-bold text-white mt-0.5">{filteredRecords.length} transaksi</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {txnModalOpen && (
          <TransactionModal
            onClose={() => { setTxnModalOpen(false); setEditRecord(null); }}
            onSubmit={handleUpdateTxn}
            isLoading={isLoading}
            editData={editRecord}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {pdfModalOpen && (
          <PdfModal records={ungroupedRecords} onClose={() => setPdfModalOpen(false)} />
        )}
      </AnimatePresence>

      <ConfirmModal
        isOpen={deleteConfirm.open}
        onClose={() => setDeleteConfirm({ open: false, record: null })}
        onConfirm={confirmDelete}
        type="danger"
        title="Hapus Transaksi"
        message={`Hapus transaksi "${deleteConfirm.record?.description || ''}"?`}
        confirmLabel="Hapus"
        loading={isLoading}
      />
    </div>
  );
};

const KeuanganHub = () => {
  const [activeTab, setActiveTab] = useState('laporan');
  const [renderedTabs, setRenderedTabs] = useState(new Set(['laporan']));

  const handleTabChange = useCallback((tabId) => {
    setActiveTab(tabId);
    setRenderedTabs(prev => new Set(prev).add(tabId));
  }, []);

  const renderTabContent = () => (
    <div className="relative">
      {renderedTabs.has('laporan') && (
        <div className={activeTab === 'laporan' ? 'block' : 'hidden'}>
          <LaporanKeuangan />
        </div>
      )}
      {renderedTabs.has('transaksi') && (
        <div className={activeTab === 'transaksi' ? 'block' : 'hidden'}>
          <TransactionManager />
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

export default KeuanganHub;
