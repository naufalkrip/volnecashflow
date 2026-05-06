import React, { useEffect, useState, useMemo } from 'react';
import { useFinanceStore } from '../store/financeStore';
import { Plus, ArrowDownCircle, ArrowUpCircle, ChevronDown, ChevronUp, X, AlertCircle, TrendingUp, Edit2, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ConfirmModal from '../components/ui/ConfirmModal';

const formatCurrency = (value) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value);

// ─── Transaction Modal (Add & Edit) ──────────────────────────────────────────
const TransactionModal = ({ type, onClose, members, settings, onSubmit, isLoading, editData }) => {
  const isEdit = !!editData;
  const [formData, setFormData] = useState({
    memberId: editData?.memberId || '',
    amount: editData?.amount?.toString() || '',
    date: editData?.date ? new Date(editData.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
  });

  const resolvedType = isEdit ? editData.type : type;
  const amountNum = parseFloat(formData.amount) || 0;
  const deductionRate = settings?.deductionPercentage || 30;
  const isIncome = resolvedType === 'INCOME';
  const previewDeduction = isIncome ? (amountNum * deductionRate) / 100 : 0;
  const previewNet = isIncome ? amountNum - previewDeduction : amountNum;
  const activeMembers = members.filter(m => m.isActive);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ ...formData, type: resolvedType });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />

      <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }} transition={{ type: 'spring', stiffness: 280, damping: 28 }}
        className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className={`flex items-center justify-between px-6 py-5 border-b border-slate-100 ${isIncome ? 'bg-emerald-50/50' : 'bg-red-50/50'}`}>
          <div className="flex items-center gap-3">
            {isIncome
              ? <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center"><ArrowDownCircle size={22} className="text-emerald-600" /></div>
              : <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center"><ArrowUpCircle size={22} className="text-red-500" /></div>
            }
            <div>
              <h3 className="text-base font-bold text-slate-800">
                {isEdit ? 'Edit Transaksi' : (isIncome ? 'Tambah Transaksi' : 'Penarikan Dana')}
              </h3>
              <p className="text-xs text-slate-400">{isIncome ? 'Input pemasukan affiliate' : 'Input penarikan saldo'}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-white/70 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-5">
          <form id="txn-form" onSubmit={handleSubmit} className="space-y-4">
            {/* Member */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Anggota Affiliate</label>
              <div className="relative">
                <select required value={formData.memberId} onChange={e => setFormData({ ...formData, memberId: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm appearance-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 outline-none font-medium">
                  <option value="" disabled>Pilih anggota...</option>
                  {activeMembers.map(m => <option key={m.id} value={m.id}>{m.name}{m.username ? ` (@${m.username})` : ''}</option>)}
                </select>
                <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-slate-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                </div>
              </div>
              {activeMembers.length === 0 && (
                <p className="text-xs text-amber-500 mt-1.5 flex items-center gap-1"><AlertCircle size={12} />Belum ada anggota aktif.</p>
              )}
            </div>

            {/* Amount */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                {isIncome ? 'Nominal Pemasukan (IDR)' : 'Nominal Penarikan (IDR)'}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 font-semibold text-sm">Rp</div>
                <input type="number" required min="1" value={formData.amount}
                  onChange={e => setFormData({ ...formData, amount: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 outline-none"
                  placeholder="0" />
              </div>
            </div>

            {/* Date */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Tanggal</label>
              <input type="date" required value={formData.date}
                onChange={e => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 outline-none" />
            </div>

            {/* Preview */}
            {amountNum > 0 && (
              <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                className={`rounded-2xl p-4 border ${isIncome ? 'bg-emerald-50/60 border-emerald-100' : 'bg-red-50/40 border-red-100'}`}>
                <p className={`text-[10px] font-bold uppercase tracking-wider mb-3 ${isIncome ? 'text-emerald-700' : 'text-red-600'}`}>Preview Kalkulasi</p>
                {isIncome ? (
                  <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between text-slate-600"><span>Gross Amount</span><span className="font-medium">{formatCurrency(amountNum)}</span></div>
                    <div className="flex justify-between text-rose-500"><span>Potongan Admin ({deductionRate}%)</span><span className="font-medium">-{formatCurrency(previewDeduction)}</span></div>
                    <div className="pt-2 border-t border-emerald-100 flex justify-between font-bold text-emerald-700">
                      <span>Net Income</span><span>{formatCurrency(previewNet)}</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm flex justify-between text-slate-600">
                    <span>Jumlah Penarikan</span>
                    <span className="font-bold text-red-600">-{formatCurrency(amountNum)}</span>
                  </div>
                )}
              </motion.div>
            )}
          </form>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex gap-3 shrink-0">
          <button type="button" onClick={onClose}
            className="flex-1 py-3 border border-slate-200 text-slate-600 font-semibold rounded-xl hover:bg-white transition-colors text-sm">
            Batal
          </button>
          <button type="submit" form="txn-form" disabled={isLoading || activeMembers.length === 0}
            className={`flex-1 py-3 text-white font-semibold rounded-xl transition-all text-sm shadow-sm disabled:opacity-50 disabled:cursor-not-allowed ${
              isIncome ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20' : 'bg-red-500 hover:bg-red-600 shadow-red-500/20'
            }`}>
            {isLoading ? 'Menyimpan...' : (isEdit ? 'Simpan Perubahan' : (isIncome ? 'Simpan Transaksi' : 'Simpan Penarikan'))}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

// ─── Desktop: Member Table Row ───────────────────────────────────────────────
const MemberRow = ({ memberRecords, member, onEdit, onDelete }) => {
  const [expanded, setExpanded] = useState(false);

  const totalMasuk = memberRecords.filter(r => r.type === 'INCOME').reduce((s, r) => s + r.netAmount, 0);
  const totalKeluar = memberRecords.filter(r => r.type === 'WITHDRAWAL').reduce((s, r) => s + r.amount, 0);
  const saldo = totalMasuk - totalKeluar;
  const last5 = [...memberRecords].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);

  return (
    <>
      <tr className="hover:bg-slate-50 transition-colors cursor-pointer group" onClick={() => setExpanded(!expanded)}>
        <td className="px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 font-bold text-sm shrink-0">
              {member?.name?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">{member?.name || 'Unknown'}</p>
              {member?.username && <p className="text-xs text-slate-400">@{member.username}</p>}
            </div>
          </div>
        </td>
        <td className="px-5 py-4 text-sm font-semibold text-emerald-600">{formatCurrency(totalMasuk)}</td>
        <td className="px-5 py-4 text-sm font-semibold text-red-500">{totalKeluar > 0 ? `-${formatCurrency(totalKeluar)}` : '-'}</td>
        <td className="px-5 py-4">
          <span className={`text-sm font-bold ${saldo >= 0 ? 'text-slate-800' : 'text-red-600'}`}>{formatCurrency(saldo)}</span>
        </td>
        <td className="px-5 py-4 text-right">
          <div className="flex items-center justify-end gap-1 text-slate-400 group-hover:text-slate-600 transition-colors">
            <span className="text-xs font-medium">{expanded ? 'Tutup' : 'Detail'}</span>
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>
        </td>
      </tr>

      <AnimatePresence>
        {expanded && (
          <tr>
            <td colSpan="5" className="p-0">
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                <div className="bg-slate-50 border-t border-b border-slate-100 px-5 py-4">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">5 Transaksi Terakhir</p>
                  <div className="space-y-2">
                    {last5.length === 0 ? (
                      <p className="text-sm text-slate-400 text-center py-2">Tidak ada transaksi</p>
                    ) : (
                      last5.map(record => (
                        <div key={record.id} className="flex items-center justify-between bg-white rounded-xl px-4 py-2.5 border border-slate-100 shadow-sm">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            {record.type === 'INCOME' ? <ArrowDownCircle size={16} className="text-emerald-500 shrink-0" /> : <ArrowUpCircle size={16} className="text-red-400 shrink-0" />}
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-slate-700">{record.type === 'INCOME' ? 'Pemasukan' : 'Penarikan'}</p>
                              <p className="text-[10px] text-slate-400">{new Date(record.date).toLocaleDateString('id-ID')}</p>
                            </div>
                          </div>
                          <div className="text-right mx-3 shrink-0">
                            {record.type === 'INCOME' ? (
                              <>
                                <p className="text-xs font-bold text-emerald-600">+{formatCurrency(record.netAmount)}</p>
                                <p className="text-[10px] text-slate-400">Gross: {formatCurrency(record.amount)}</p>
                              </>
                            ) : (
                              <p className="text-xs font-bold text-red-500">-{formatCurrency(record.amount)}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                            <button onClick={() => onEdit(record)} className="p-1.5 rounded-lg bg-blue-50 text-blue-500 hover:bg-blue-100 transition-colors"><Edit2 size={13} /></button>
                            <button onClick={() => onDelete(record)} className="p-1.5 rounded-lg bg-red-50 text-red-400 hover:bg-red-100 transition-colors"><Trash2 size={13} /></button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </motion.div>
            </td>
          </tr>
        )}
      </AnimatePresence>
    </>
  );
};

// ─── Mobile: Member Card (full-width, no table) ───────────────────────────────
const MemberCard = ({ memberRecords, member, onEdit, onDelete }) => {
  const [expanded, setExpanded] = useState(false);

  const totalMasuk = memberRecords.filter(r => r.type === 'INCOME').reduce((s, r) => s + r.netAmount, 0);
  const totalKeluar = memberRecords.filter(r => r.type === 'WITHDRAWAL').reduce((s, r) => s + r.amount, 0);
  const saldo = totalMasuk - totalKeluar;
  const last5 = [...memberRecords].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);

  return (
    <div className="border-b border-slate-100 last:border-b-0">
      {/* Card Header — tap to expand */}
      <button
        className="w-full text-left px-4 py-4 active:bg-slate-50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        {/* Member identity */}
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 font-bold text-sm shrink-0">
            {member?.name?.charAt(0)?.toUpperCase() || '?'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-slate-800 truncate">{member?.name || 'Unknown'}</p>
            {member?.username && <p className="text-xs text-slate-400">@{member.username}</p>}
          </div>
          <div className="text-slate-400 shrink-0">
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>
        </div>

        {/* Stats row — 3 columns */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-emerald-50 rounded-xl px-3 py-2.5">
            <p className="text-[9px] font-bold text-emerald-600 uppercase tracking-wide mb-0.5">Net Masuk</p>
            <p className="text-xs font-bold text-emerald-700 leading-tight">{formatCurrency(totalMasuk)}</p>
          </div>
          <div className="bg-red-50 rounded-xl px-3 py-2.5">
            <p className="text-[9px] font-bold text-red-500 uppercase tracking-wide mb-0.5">Keluar</p>
            <p className="text-xs font-bold text-red-600 leading-tight">{totalKeluar > 0 ? formatCurrency(totalKeluar) : '-'}</p>
          </div>
          <div className={`rounded-xl px-3 py-2.5 ${saldo >= 0 ? 'bg-slate-50' : 'bg-red-50'}`}>
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wide mb-0.5">Saldo</p>
            <p className={`text-xs font-bold leading-tight ${saldo >= 0 ? 'text-slate-800' : 'text-red-600'}`}>{formatCurrency(saldo)}</p>
          </div>
        </div>
      </button>

      {/* Expanded transactions */}
      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="bg-slate-50 px-4 py-3 border-t border-slate-100">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">5 Transaksi Terakhir</p>
              <div className="space-y-2">
                {last5.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-2">Tidak ada transaksi</p>
                ) : (
                  last5.map(record => (
                    <div key={record.id} className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
                      {/* Top row: type + date + actions */}
                      <div className="flex items-center justify-between px-3 pt-2.5 pb-1">
                        <div className="flex items-center gap-2">
                          {record.type === 'INCOME'
                            ? <ArrowDownCircle size={14} className="text-emerald-500" />
                            : <ArrowUpCircle size={14} className="text-red-400" />
                          }
                          <span className="text-xs font-semibold text-slate-700">
                            {record.type === 'INCOME' ? 'Pemasukan' : 'Penarikan'}
                          </span>
                          <span className="text-[10px] text-slate-400">{new Date(record.date).toLocaleDateString('id-ID')}</span>
                        </div>
                        <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                          <button onClick={() => onEdit(record)} className="p-1.5 rounded-lg bg-blue-50 text-blue-500 active:bg-blue-100 transition-colors">
                            <Edit2 size={12} />
                          </button>
                          <button onClick={() => onDelete(record)} className="p-1.5 rounded-lg bg-red-50 text-red-400 active:bg-red-100 transition-colors">
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                      {/* Bottom row: amounts */}
                      <div className="px-3 pb-2.5">
                        {record.type === 'INCOME' ? (
                          <div className="flex items-baseline gap-2">
                            <span className="text-sm font-bold text-emerald-600">+{formatCurrency(record.netAmount)}</span>
                            <span className="text-[10px] text-slate-400">Gross: {formatCurrency(record.amount)}</span>
                          </div>
                        ) : (
                          <span className="text-sm font-bold text-red-500">-{formatCurrency(record.amount)}</span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};


// ─── Main Finance Page ────────────────────────────────────────────────────────
const Finance = () => {
  const { records, fetchRecords, addRecord, updateRecord, deleteRecord, members, fetchMembers, settings, fetchSettings, isLoading } = useFinanceStore();
  const [modalType, setModalType] = useState(null); // 'INCOME' | 'WITHDRAWAL' | null
  const [editRecord, setEditRecord] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, record: null });

  useEffect(() => {
    fetchRecords();
    fetchMembers();
    fetchSettings();
  }, [fetchRecords, fetchMembers, fetchSettings]);

  const handleSubmit = async (formData) => {
    if (editRecord) {
      const success = await updateRecord(editRecord.id, formData);
      if (success) { setEditRecord(null); setModalType(null); }
    } else {
      const success = await addRecord(formData);
      if (success) setModalType(null);
    }
  };

  const handleEdit = (record) => {
    setEditRecord(record);
    setModalType(record.type);
  };

  const handleDeleteRequest = (record) => {
    setDeleteConfirm({ open: true, record });
  };

  const confirmDelete = async () => {
    if (deleteConfirm.record) {
      await deleteRecord(deleteConfirm.record.id);
    }
    setDeleteConfirm({ open: false, record: null });
  };

  // Today's income total
  const today = new Date().toDateString();
  const todayIncome = records.filter(r => r.type === 'INCOME' && new Date(r.date).toDateString() === today)
    .reduce((s, r) => s + r.netAmount, 0);
  const todayGross = records.filter(r => r.type === 'INCOME' && new Date(r.date).toDateString() === today)
    .reduce((s, r) => s + r.amount, 0);

  // Group by member — sorted oldest to newest
  const memberGroups = useMemo(() => {
    const groups = {};
    [...records]
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .forEach(record => {
        const key = record.memberId;
        if (!groups[key]) groups[key] = { member: record.affiliate, records: [] };
        groups[key].records.push(record);
      });
    return Object.entries(groups);
  }, [records]);

  return (
    <div className="space-y-6">

      {/* Today's Income Summary - STAND OUT */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600 rounded-2xl p-6 shadow-lg shadow-emerald-500/20"
      >
        <div className="absolute top-0 right-0 w-56 h-56 bg-white/5 rounded-full transform translate-x-20 -translate-y-20 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-white/5 rounded-full transform -translate-x-16 translate-y-16 pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp size={18} className="text-emerald-200" />
              <p className="text-emerald-100 text-sm font-semibold uppercase tracking-wider">Total Rekap Hari Ini</p>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">{formatCurrency(todayIncome)}</h2>
            <p className="text-emerald-200 text-sm mt-1">
              Net Income hari ini &nbsp;·&nbsp; Gross: <span className="font-semibold text-white">{formatCurrency(todayGross)}</span>
            </p>
          </div>
          <div className="flex gap-3 flex-col sm:flex-row">
            <button
              onClick={() => { setEditRecord(null); setModalType('INCOME'); }}
              className="flex items-center justify-center gap-2 bg-white text-emerald-700 font-bold px-5 py-3 rounded-xl hover:bg-emerald-50 transition-all shadow-sm text-sm"
            >
              <ArrowDownCircle size={18} />
              Tambah Transaksi
            </button>
            <button
              onClick={() => { setEditRecord(null); setModalType('WITHDRAWAL'); }}
              className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 border border-white/30 text-white font-bold px-5 py-3 rounded-xl transition-all text-sm"
            >
              <ArrowUpCircle size={18} />
              Penarikan Dana
            </button>
          </div>
        </div>
      </motion.div>

      {/* Summary Table per Member */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-4 sm:px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-800">Rekap Per Anggota</h3>
            <p className="text-xs text-slate-400 mt-0.5">Klik baris untuk lihat &amp; edit 5 transaksi terakhir</p>
          </div>
          <span className="text-xs font-bold text-slate-400 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">{memberGroups.length} Anggota</span>
        </div>

        {/* ── DESKTOP TABLE ── */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-left min-w-[480px]">
            <thead>
              <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="px-5 py-3.5">Anggota</th>
                <th className="px-5 py-3.5">Total Masuk (Net)</th>
                <th className="px-5 py-3.5">Total Keluar</th>
                <th className="px-5 py-3.5">Saldo</th>
                <th className="px-5 py-3.5 text-right">Detail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {memberGroups.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-14 text-center text-slate-400">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-14 h-14 bg-slate-50 rounded-full flex items-center justify-center border border-slate-100">
                        <Plus size={24} className="text-slate-300" />
                      </div>
                      <p className="font-semibold text-slate-500">Belum ada transaksi</p>
                      <p className="text-sm text-slate-400">Tambahkan transaksi pertama dengan tombol di atas</p>
                    </div>
                  </td>
                </tr>
              ) : (
                memberGroups.map(([memberId, { member, records: memberRecords }]) => (
                  <MemberRow
                    key={memberId}
                    memberId={memberId}
                    memberRecords={memberRecords}
                    member={member}
                    onEdit={handleEdit}
                    onDelete={handleDeleteRequest}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* ── MOBILE CARD LIST ── */}
        <div className="sm:hidden">
          {memberGroups.length === 0 ? (
            <div className="py-12 text-center flex flex-col items-center gap-3">
              <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center border border-slate-100">
                <Plus size={22} className="text-slate-300" />
              </div>
              <p className="font-semibold text-slate-500 text-sm">Belum ada transaksi</p>
            </div>
          ) : (
            memberGroups.map(([memberId, { member, records: memberRecords }]) => (
              <MemberCard
                key={memberId}
                memberRecords={memberRecords}
                member={member}
                onEdit={handleEdit}
                onDelete={handleDeleteRequest}
              />
            ))
          )}
        </div>
      </div>

      {/* Add / Edit Modal */}
      <AnimatePresence>
        {modalType && (
          <TransactionModal
            type={modalType}
            onClose={() => { setModalType(null); setEditRecord(null); }}
            members={members}
            settings={settings}
            onSubmit={handleSubmit}
            isLoading={isLoading}
            editData={editRecord}
          />
        )}
      </AnimatePresence>

      {/* Delete Confirm Modal */}
      <ConfirmModal
        isOpen={deleteConfirm.open}
        onClose={() => setDeleteConfirm({ open: false, record: null })}
        onConfirm={confirmDelete}
        type="danger"
        title="Hapus Transaksi"
        message={`Apakah Anda yakin ingin menghapus transaksi ${deleteConfirm.record?.type === 'INCOME' ? 'pemasukan' : 'penarikan'} sebesar ${deleteConfirm.record ? formatCurrency(deleteConfirm.record.amount) : ''}?`}
        subMessage="Tindakan ini tidak dapat dibatalkan."
        confirmLabel="Hapus Transaksi"
        loading={isLoading}
      />
    </div>
  );
};

export default Finance;
