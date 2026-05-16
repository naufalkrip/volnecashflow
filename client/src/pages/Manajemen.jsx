import React, { useEffect, useState, useMemo } from 'react';
import { useFinanceStore } from '../store/financeStore';
import { Plus, ArrowDownCircle, ArrowUpCircle, TrendingUp, TrendingDown, Wallet, X, Edit2, Trash2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ConfirmModal from '../components/ui/ConfirmModal';

const formatCurrency = (value) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value);

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
        className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        <div className={`flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-emerald-50/50`}>
          <div className="flex items-center gap-3">
            {isIncome
              ? <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center"><ArrowDownCircle size={22} className="text-emerald-600" /></div>
              : <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center"><ArrowUpCircle size={22} className="text-emerald-600" /></div>
            }
            <div>
              <h3 className="text-base font-bold text-slate-800">
                {isEdit ? 'Edit Transaksi' : (isIncome ? 'Uang Masuk' : 'Uang Keluar')}
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
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Tanggal</label>
              <input type="date" required value={formData.date}
                onChange={e => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 outline-none" />
            </div>
            {amountNum > 0 && (
              <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl p-4 border bg-emerald-50/60 border-emerald-100">
                <p className="text-[10px] font-bold uppercase tracking-wider mb-3 text-emerald-700">Preview Kalkulasi</p>
                {isIncome ? (
                  <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between text-slate-600"><span>Gross Amount</span><span className="font-medium">{formatCurrency(amountNum)}</span></div>
                    <div className="flex justify-between text-emerald-600"><span>Potongan Admin ({deductionRate}%)</span><span className="font-medium">-{formatCurrency(previewDeduction)}</span></div>
                    <div className="pt-2 border-t border-emerald-100 flex justify-between font-bold text-emerald-700">
                      <span>Net Income</span><span>{formatCurrency(previewNet)}</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm flex justify-between text-slate-600">
                    <span>Jumlah Penarikan</span>
                    <span className="font-bold text-emerald-600">-{formatCurrency(amountNum)}</span>
                  </div>
                )}
              </motion.div>
            )}
          </form>
        </div>
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex gap-3 shrink-0">
          <button type="button" onClick={onClose}
            className="flex-1 py-3 border border-slate-200 text-slate-600 font-semibold rounded-xl hover:bg-white transition-colors text-sm">
            Batal
          </button>
          <button type="submit" form="txn-form" disabled={isLoading || activeMembers.length === 0}
            className="flex-1 py-3 text-white font-semibold rounded-xl transition-all text-sm shadow-sm disabled:opacity-50 disabled:cursor-not-allowed bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20">
            {isLoading ? 'Menyimpan...' : (isEdit ? 'Simpan Perubahan' : (isIncome ? 'Simpan Transaksi' : 'Simpan Penarikan'))}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const Manajemen = () => {
  const { records, fetchRecords, addRecord, updateRecord, deleteRecord, members, fetchMembers, settings, fetchSettings, dashboardStats, fetchDashboardStats, isLoading } = useFinanceStore();
  const [modalType, setModalType] = useState(null);
  const [editRecord, setEditRecord] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, record: null });

  useEffect(() => {
    fetchRecords();
    fetchMembers();
    fetchSettings();
    fetchDashboardStats();
  }, [fetchRecords, fetchMembers, fetchSettings, fetchDashboardStats]);

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

  const totalMasuk = useMemo(() =>
    records.filter(r => r.type === 'INCOME').reduce((s, r) => s + r.netAmount, 0),
  [records]);

  const totalKeluar = useMemo(() =>
    records.filter(r => r.type === 'WITHDRAWAL').reduce((s, r) => s + r.amount, 0),
  [records]);

  const totalSaldo = totalMasuk - totalKeluar;

  const recentTransactions = useMemo(() =>
    [...records].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 10),
  [records]);

  return (
    <div className="space-y-6">
      {/* Three Main Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="relative overflow-hidden bg-gradient-to-br from-emerald-500 to-teal-600 p-5 rounded-2xl shadow-lg shadow-emerald-500/20"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full transform translate-x-8 -translate-y-8" />
          <div className="relative z-10 flex items-start gap-4">
            <div className="p-2.5 rounded-xl bg-white/15 backdrop-blur-sm">
              <TrendingDown size={22} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-emerald-100 text-xs font-semibold uppercase tracking-wider mb-1">Total Uang Masuk</p>
              <h3 className="text-xl sm:text-2xl font-bold text-white truncate">{formatCurrency(totalMasuk)}</h3>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="relative overflow-hidden bg-gradient-to-br from-emerald-500 to-teal-600 p-5 rounded-2xl shadow-lg shadow-emerald-500/20"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full transform translate-x-8 -translate-y-8" />
          <div className="relative z-10 flex items-start gap-4">
            <div className="p-2.5 rounded-xl bg-white/15 backdrop-blur-sm">
              <TrendingUp size={22} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-emerald-100 text-xs font-semibold uppercase tracking-wider mb-1">Total Uang Keluar</p>
              <h3 className="text-xl sm:text-2xl font-bold text-white truncate">{formatCurrency(totalKeluar)}</h3>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="relative overflow-hidden p-5 rounded-2xl shadow-lg bg-gradient-to-br from-emerald-600 to-teal-700 shadow-emerald-500/20"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full transform translate-x-8 -translate-y-8" />
          <div className="relative z-10 flex items-start gap-4">
            <div className="p-2.5 rounded-xl bg-white/15 backdrop-blur-sm">
              <Wallet size={22} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white/70 text-xs font-semibold uppercase tracking-wider mb-1">Total Saldo</p>
              <h3 className="text-xl sm:text-2xl font-bold text-white truncate">{formatCurrency(totalSaldo)}</h3>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-100"
      >
        <h3 className="text-base font-bold text-slate-800 mb-4">Aksi Cepat</h3>
        <div className="flex gap-3 flex-col sm:flex-row">
          <button
            onClick={() => { setEditRecord(null); setModalType('INCOME'); }}
            className="flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-6 py-3 rounded-xl transition-all shadow-sm shadow-emerald-500/20 text-sm flex-1"
          >
            <ArrowDownCircle size={18} />
            Tambah Uang Masuk
          </button>
          <button
            onClick={() => { setEditRecord(null); setModalType('WITHDRAWAL'); }}
            className="flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-6 py-3 rounded-xl transition-all shadow-sm shadow-emerald-500/20 text-sm flex-1"
          >
            <ArrowUpCircle size={18} />
            Tambah Uang Keluar
          </button>
        </div>
      </motion.div>

      {/* Recent Transactions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-white rounded-2xl shadow-sm border border-slate-100"
      >
        <div className="px-5 sm:px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-800">Transaksi Terbaru</h3>
            <p className="text-xs text-slate-400 mt-0.5">10 transaksi terakhir</p>
          </div>
          <span className="text-xs font-bold text-slate-400 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
            {records.length} Total
          </span>
        </div>
        <div className="divide-y divide-slate-50">
          {recentTransactions.length === 0 ? (
            <div className="py-14 text-center">
              <div className="w-14 h-14 mx-auto bg-slate-50 rounded-full flex items-center justify-center border border-slate-100 mb-3">
                <Plus size={24} className="text-slate-300" />
              </div>
              <p className="font-semibold text-slate-500">Belum ada transaksi</p>
              <p className="text-sm text-slate-400 mt-1">Tambahkan transaksi menggunakan tombol di atas</p>
            </div>
          ) : (
            recentTransactions.map((record, i) => (
              <div key={record.id} className="flex items-center justify-between px-5 sm:px-6 py-3.5 hover:bg-slate-50 transition-colors group">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 bg-emerald-50">
                    {record.type === 'INCOME'
                      ? <ArrowDownCircle size={18} className="text-emerald-500" />
                      : <ArrowUpCircle size={18} className="text-emerald-500" />
                    }
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">
                      {record.type === 'INCOME' ? 'Uang Masuk' : 'Uang Keluar'}
                      <span className="text-xs text-slate-400 font-normal ml-2">
                        {record.affiliate?.name || 'Unknown'}
                      </span>
                    </p>
                    <p className="text-xs text-slate-400">
                      {new Date(record.date).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                </div>
                <div className="text-right mx-3 shrink-0">
                  {record.type === 'INCOME' ? (
                    <>
                      <p className="text-sm font-bold text-emerald-600">+{formatCurrency(record.netAmount)}</p>
                      <p className="text-[10px] text-slate-400">Gross: {formatCurrency(record.amount)}</p>
                    </>
                  ) : (
                    <p className="text-sm font-bold text-emerald-600">-{formatCurrency(record.amount)}</p>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleEdit(record)} className="p-1.5 rounded-lg bg-emerald-50 text-emerald-500 hover:bg-emerald-100 transition-colors">
                    <Edit2 size={13} />
                  </button>
                  <button onClick={() => handleDeleteRequest(record)} className="p-1.5 rounded-lg bg-emerald-50 text-emerald-400 hover:bg-emerald-100 transition-colors">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </motion.div>

      {/* Modal */}
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

      {/* Delete Confirm */}
      <ConfirmModal
        isOpen={deleteConfirm.open}
        onClose={() => setDeleteConfirm({ open: false, record: null })}
        onConfirm={confirmDelete}
        type="danger"
        title="Hapus Transaksi"
        message={`Apakah Anda yakin ingin menghapus transaksi ${deleteConfirm.record?.type === 'INCOME' ? 'uang masuk' : 'uang keluar'} sebesar ${deleteConfirm.record ? formatCurrency(deleteConfirm.record.amount) : ''}?`}
        subMessage="Tindakan ini tidak dapat dibatalkan."
        confirmLabel="Hapus Transaksi"
        loading={isLoading}
      />
    </div>
  );
};

export default Manajemen;
