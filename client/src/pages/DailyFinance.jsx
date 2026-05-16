import React, { useEffect, useState, useMemo } from 'react';
import { useDailyFinanceStore } from '../store/dailyFinanceStore';
import {
  Plus, TrendingUp, TrendingDown, Wallet, X, Edit2, Trash2,
  Search, Filter, Download, FileText, Loader2,
  ChevronDown, ChevronUp, ChevronLeft, ChevronRight, ArrowDownCircle, ArrowUpCircle,
  AlertCircle, CheckCircle, MessageCircle, FolderOpen, Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ConfirmModal from '../components/ui/ConfirmModal';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import logoSrc from '../assets/logo.png';

const formatCurrency = (v) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(Math.abs(v));

const formatDate = (d) =>
  new Date(d).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' });

const formatDateShort = (d) =>
  new Date(d).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' });

const formatTime = (d) =>
  new Date(d).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

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

const todayStr = () => formatDateInput(new Date());
const nowStr = () => formatDateTimeInput(new Date());

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

let _logoPromise = null;
const getLogoBase64 = () => {
  if (_logoPromise) return _logoPromise;
  _logoPromise = new Promise((resolve) => {
    const img = document.createElement('img');
    img.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:0;height:0;opacity:0;';
    img.onload = () => {
      try {
        const w = img.naturalWidth || 200;
        const h = img.naturalHeight || 200;
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        const b64 = canvas.toDataURL('image/png');
        document.body.removeChild(img);
        resolve(b64);
      } catch (e) {
        if (document.body.contains(img)) document.body.removeChild(img);
        resolve(null);
      }
    };
    img.onerror = () => {
      if (document.body.contains(img)) document.body.removeChild(img);
      resolve(null);
    };
    img.src = logoSrc;
    document.body.appendChild(img);
  });
  return _logoPromise;
};
getLogoBase64();

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
              <h3 className="text-sm sm:text-base font-bold text-slate-800 truncate">Transaksi Baru</h3>
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
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Nama Transaksi</label>
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
          <form id="daily-txn-form" onSubmit={handleSubmit} className="space-y-5">
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
            {amount > 0 && (
              <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl p-4 border bg-emerald-50/60 border-emerald-100">
                <p className="text-[10px] font-bold uppercase tracking-wider mb-2 text-emerald-700">
                  Ringkasan
                </p>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">{type === 'INCOME' ? 'Uang Masuk' : 'Uang Keluar'}</span>
                  <span className="font-bold text-emerald-600">
                    {type === 'INCOME' ? '+' : '-'}{formatCurrency(parseFloat(amount))}
                  </span>
                </div>
              </motion.div>
            )}
          </form>
        </div>
        <div className="px-4 sm:px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex gap-3 shrink-0">
          <button type="button" onClick={onClose}
            className="flex-1 py-3 border border-slate-200 text-slate-600 font-semibold rounded-xl hover:bg-white transition-colors text-sm">
            Batal
          </button>
          <button type="submit" form="daily-txn-form" disabled={isLoading || !description.trim() || !amount}
            className={`flex-1 py-3 text-white font-semibold rounded-xl transition-all text-sm shadow-sm disabled:opacity-50 disabled:cursor-not-allowed ${
              'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20'
            }`}>
            {isLoading ? 'Menyimpan...' : (isEdit ? 'Simpan Perubahan' : 'Simpan Transaksi')}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export const PdfModal = ({ records, onClose }) => {
  const [option, setOption] = useState('today');
  const [startDate, setStartDate] = useState(todayStr());
  const [endDate, setEndDate] = useState(todayStr());
  const [dateError, setDateError] = useState('');
  const [step, setStep] = useState('form');
  const [pdfBlob, setPdfBlob] = useState(null);
  const [pdfFileName, setPdfFileName] = useState('');

  const validateDates = (start, end) => {
    if (!start || !end) { setDateError(''); return true; }
    const diff = (new Date(end) - new Date(start)) / (1000 * 60 * 60 * 24);
    if (diff < 0) { setDateError('Tanggal akhir tidak boleh sebelum tanggal mulai.'); return false; }
    setDateError('');
    return true;
  };

  const getFilteredRecords = () => {
    let filtered = [...records].sort((a, b) => new Date(a.transactionDate) - new Date(b.transactionDate));
    if (option === 'today') {
      const today = todayStr();
      filtered = filtered.filter(r => formatDateInput(r.transactionDate) === today);
    } else if (option === 'range') {
      if (startDate) filtered = filtered.filter(r => formatDateInput(r.transactionDate) >= startDate);
      if (endDate) filtered = filtered.filter(r => formatDateInput(r.transactionDate) <= endDate);
    }
    return filtered;
  };

  const getPeriodText = () => {
    if (option === 'today') return `Hari Ini (${formatDate(new Date())})`;
    if (option === 'range') return `${formatDate(startDate)} – ${formatDate(endDate)}`;
    return 'Semua Tanggal';
  };

  const handleGenerate = async () => {
    if (option === 'range' && !validateDates(startDate, endDate)) return;
    setStep('loading');

    const logoBase64 = await getLogoBase64();
    const filtered = getFilteredRecords();
    const totalIncome = filtered.filter(r => r.type === 'INCOME').reduce((s, r) => s + r.amount, 0);
    const totalExpense = filtered.filter(r => r.type === 'EXPENSE').reduce((s, r) => s + r.amount, 0);
    const balance = totalIncome - totalExpense;

    try {
      const doc = new jsPDF();
      const pageW = doc.internal.pageSize.width;
      let y = 12;

      if (logoBase64) {
        doc.addImage(logoBase64, 'PNG', 14, y, 12, 12);
      } else {
        doc.setFillColor(5, 150, 105);
        doc.roundedRect(14, y, 12, 12, 2, 2, 'F');
      }

      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(5, 150, 105);
      doc.text('Volne Cash Flow', 30, y + 8);

      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text('Manajemen Keuangan Harian', 30, y + 13);

      y += 18;
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.4);
      doc.line(14, y, pageW - 14, y);
      y += 8;

      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text('Laporan Keuangan Harian', 14, y);

      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text(`Periode: ${getPeriodText()}`, 14, y + 6);

      const generatedDate = `Dibuat: ${formatDate(new Date())}`;
      const dateW = doc.getTextWidth(generatedDate);
      doc.text(generatedDate, pageW - 14 - dateW, y);

      y += 14;

      const rows = filtered.map((r, i) => [
        i + 1,
        formatDateShort(r.transactionDate),
        r.type === 'INCOME' ? 'Uang Masuk' : 'Uang Keluar',
        r.description,
        (r.type === 'INCOME' ? 'Rp ' : '-Rp ') + new Intl.NumberFormat('id-ID').format(r.amount),
      ]);

      autoTable(doc, {
        startY: y,
        head: [['No', 'Tanggal', 'Jenis', 'Keterangan', 'Jumlah']],
        body: rows,
        foot: [
          [
            '',
            '',
            '',
            { content: 'Total Uang Masuk', styles: { fontStyle: 'bold' } },
            { content: `+${formatCurrency(totalIncome)}`, styles: { fontStyle: 'bold' } }
          ],
          [
            '',
            '',
            '',
            { content: 'Total Uang Keluar', styles: { fontStyle: 'bold' } },
            { content: `-${formatCurrency(totalExpense)}`, styles: { fontStyle: 'bold' } }
          ],
          [
            '',
            '',
            '',
            { content: 'Saldo Akhir', styles: { fontStyle: 'bold' } },
            { content: formatCurrency(balance), styles: { fontStyle: 'bold' } }
          ],
        ],
        theme: 'grid',
        headStyles: {
          fillColor: [0, 158, 96],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 7,
          cellPadding: 3,
          lineColor: [0, 130, 80],
          lineWidth: 0.3,
        },
        bodyStyles: {
          fillColor: [255, 255, 255],
          textColor: [30, 41, 59],
          fontSize: 7,
          cellPadding: 2.5,
          lineColor: [200, 220, 200],
          lineWidth: 0.3,
        },
        footStyles: {
          fillColor: [0, 158, 96],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 7,
          cellPadding: 3,
          lineColor: [0, 130, 80],
          lineWidth: 0.3,
        },
        alternateRowStyles: { fillColor: [255, 255, 255] },
      });

      const pageCount = doc.internal.pages.length - 1;
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(180);
        doc.line(14, doc.internal.pageSize.height - 14, pageW - 14, doc.internal.pageSize.height - 14);
        doc.text(
          `Halaman ${i} dari ${pageCount}  ·  Volne Cash Flow  ·  Laporan Keuangan Harian`,
          pageW / 2,
          doc.internal.pageSize.height - 8,
          { align: 'center' }
        );
      }

      const blob = doc.output('blob');
      setPdfBlob(blob);
      setPdfFileName(`Laporan_Keuangan_Harian_${option === 'today' ? 'Hari_Ini' : option === 'range' ? `${startDate}_${endDate}` : 'Semua'}.pdf`);
      setStep('success');
    } catch (err) {
      console.error('PDF generation error:', err);
      setStep('form');
    }
  };

  const handleDownload = () => {
    const url = URL.createObjectURL(pdfBlob);
    const a = document.createElement('a');
    a.href = url; a.download = pdfFileName; a.click();
    URL.revokeObjectURL(url);
  };

  const handleWhatsApp = async () => {
    const file = new File([pdfBlob], pdfFileName, { type: 'application/pdf' });
    const shareMsg = `Halo, berikut laporan keuangan harian dari Volne Cash Flow.\nPeriode: ${getPeriodText()}`;

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: pdfFileName, text: shareMsg });
        return;
      } catch (err) {
        if (err.name === 'AbortError') return;
      }
    }

    const url = URL.createObjectURL(pdfBlob);
    const a = document.createElement('a');
    a.href = url; a.download = pdfFileName; a.click();
    URL.revokeObjectURL(url);
    setTimeout(() => {
      window.open(`https://wa.me/?text=${encodeURIComponent(shareMsg + '\n\n_(File PDF sudah terdownload, lampirkan ke chat ini)_')}`, '_blank');
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }} transition={{ type: 'spring', stiffness: 280, damping: 28 }}
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90dvh]">
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 sm:py-5 border-b border-slate-100">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
              <FileText size={20} className="text-emerald-500" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-bold text-slate-800 truncate">Download Laporan PDF</h3>
              <p className="text-xs text-slate-400">Pilih periode laporan keuangan</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors shrink-0">
            <X size={20} />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 px-4 sm:px-6 py-4 sm:py-6">
          {step === 'form' && (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-3">Pilih Periode</label>
                <div className="space-y-2">
                  {[
                    { value: 'today', label: 'Hari Ini', desc: 'Transaksi hari ini saja' },
                    { value: 'range', label: 'Rentang Tanggal', desc: 'Pilih tanggal mulai dan akhir' },
                    { value: 'all', label: 'Semua Tanggal', desc: 'Seluruh transaksi yang tersimpan' },
                  ].map(opt => (
                    <button key={opt.value} type="button" onClick={() => { setOption(opt.value); setDateError(''); }}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all ${
                        option === opt.value
                          ? 'border-emerald-500 bg-emerald-50'
                          : 'border-slate-200 bg-slate-50 hover:border-slate-300'
                      }`}>
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                        option === opt.value ? 'border-emerald-500' : 'border-slate-300'
                      }`}>
                        {option === opt.value && <div className="w-2 h-2 rounded-full bg-emerald-500" />}
                      </div>
                      <div>
                        <p className={`text-sm font-semibold ${option === opt.value ? 'text-emerald-700' : 'text-slate-700'}`}>{opt.label}</p>
                        <p className="text-xs text-slate-400">{opt.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
              {option === 'range' && (
                <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Tanggal Mulai</label>
                      <input type="date" value={startDate} onChange={e => { setStartDate(e.target.value); validateDates(e.target.value, endDate); }}
                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 outline-none transition-all" />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Tanggal Akhir</label>
                      <input type="date" value={endDate} onChange={e => { setEndDate(e.target.value); validateDates(startDate, e.target.value); }}
                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 outline-none transition-all" />
                    </div>
                  </div>
                  {dateError && (
                    <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                      className="text-xs text-emerald-600 font-medium flex items-center gap-1.5 bg-emerald-50 px-3 py-2 rounded-lg border border-emerald-100">
                      <AlertCircle size={13} />{dateError}
                    </motion.p>
                  )}
                </motion.div>
              )}

              {/* Preview Data */}
              {(() => {
                const filtered = getFilteredRecords();
                const previewIncome = filtered.filter(r => r.type === 'INCOME').reduce((s, r) => s + r.amount, 0);
                const previewExpense = filtered.filter(r => r.type === 'EXPENSE').reduce((s, r) => s + r.amount, 0);
                const previewBalance = previewIncome - previewExpense;
                if (filtered.length === 0) return null;
                return (
                  <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                    className="bg-emerald-50/60 border border-emerald-100 rounded-2xl p-4 space-y-2">
                    <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-2">Preview Data</p>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Jumlah Transaksi</span>
                      <span className="font-bold text-slate-700">{filtered.length} transaksi</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Total Pemasukan</span>
                      <span className="font-medium text-emerald-600">+{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(previewIncome)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Total Pengeluaran</span>
                      <span className="font-medium text-rose-500">-{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(previewExpense)}</span>
                    </div>
                    <div className="pt-2 border-t border-emerald-100 flex justify-between text-sm">
                      <span className="font-bold text-slate-700">Saldo Akhir</span>
                      <span className="font-bold text-emerald-600">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(previewBalance)}</span>
                    </div>
                  </motion.div>
                );
              })()}
            </div>
          )}
          {step === 'loading' && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-50 border-2 border-emerald-100 flex items-center justify-center">
                <Loader2 size={30} className="text-emerald-500 animate-spin" />
              </div>
              <p className="text-slate-600 font-semibold">Membuat laporan PDF...</p>
              <p className="text-xs text-slate-400">Mohon tunggu sebentar</p>
            </div>
          )}
          {step === 'success' && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center py-8 space-y-5 text-center">
              <div className="w-20 h-20 rounded-full bg-emerald-50 border-2 border-emerald-200 flex items-center justify-center">
                <CheckCircle size={40} className="text-emerald-500" />
              </div>
              <div>
                <p className="text-xl font-bold text-slate-800">Laporan Siap!</p>
                <p className="text-sm text-slate-500 mt-1">PDF laporan keuangan telah berhasil dibuat.</p>
              </div>
              <div className="w-full space-y-3 pt-2">
                <button onClick={handleDownload}
                  className="w-full flex items-center justify-center gap-2.5 bg-emerald-500 hover:bg-emerald-600 text-white py-3.5 rounded-xl font-semibold transition-all shadow-sm shadow-emerald-500/20 group">
                  <Download size={18} className="group-hover:-translate-y-0.5 transition-transform" />
                  Download PDF
                </button>
                <button onClick={handleWhatsApp}
                  className="w-full flex items-center justify-center gap-2.5 bg-[#25D366] hover:bg-[#1ebe5a] text-white py-3.5 rounded-xl font-semibold transition-all shadow-sm shadow-green-500/20 group">
                  <MessageCircle size={18} className="group-hover:scale-110 transition-transform" />
                  Share ke WhatsApp
                </button>
              </div>
            </motion.div>
          )}
        </div>
        {step === 'form' && (
          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex gap-3">
            <button onClick={onClose}
              className="flex-1 py-3 border border-slate-200 text-slate-600 font-semibold rounded-xl hover:bg-white transition-colors text-sm">
              Batal
            </button>
            <button onClick={handleGenerate}
              disabled={!!dateError}
              className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl transition-all text-sm shadow-sm shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed">
              Generate PDF
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
};

const Skeleton = ({ className }) => (
  <div className={`animate-pulse bg-slate-200 rounded-lg ${className || ''}`} />
);

const DailyFinance = ({ readOnly = false }) => {
  const { records, stats, groups, selectedGroup, isLoading, fetchRecords, fetchStats, fetchGroups, addRecord, updateRecord, deleteRecord, createGroup, deleteGroup, setSelectedGroup } = useDailyFinanceStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [editRecord, setEditRecord] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, record: null });
  const [groupDeleteConfirm, setGroupDeleteConfirm] = useState({ open: false, group: null });
  const [pdfModalOpen, setPdfModalOpen] = useState(false);
  const [groupModalOpen, setGroupModalOpen] = useState(false);
  const [quickTxnOpen, setQuickTxnOpen] = useState(false);
  const [quickTxnName, setQuickTxnName] = useState('');
  const [expandedDate, setExpandedDate] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [initialLoading, setInitialLoading] = useState(true);
  const [viewState, setViewState] = useState('groups');

  const handleGroupSelect = (group) => {
    setSelectedGroup(group);
    setViewState('report');
  };

  const handleClearGroup = () => {
    setSelectedGroup(null);
    setViewState('groups');
  };

  const handleShowGlobalReport = () => {
    setSelectedGroup(null);
    setViewState('report');
  };

  const handleBackToGroups = () => {
    setViewState('groups');
  };

  useEffect(() => {
    const params = selectedGroup ? { group: selectedGroup.name } : {};
    Promise.all([fetchRecords(params), fetchStats(), fetchGroups()]).finally(() => setInitialLoading(false));
  }, [fetchRecords, fetchStats, fetchGroups, selectedGroup]);

  const filteredRecords = useMemo(() => {
    let filtered = [...records];
    if (selectedGroup) {
      filtered = filtered.filter(r => r.group === selectedGroup.name);
    }
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
  }, [records, selectedGroup, searchQuery, filterType, filterStartDate, filterEndDate]);

  const groupedData = useMemo(() => groupByDate(filteredRecords), [filteredRecords]);

  const totalIncome = useMemo(() =>
    filteredRecords.filter(r => r.type === 'INCOME').reduce((s, r) => s + r.amount, 0),
  [filteredRecords]);

  const totalExpense = useMemo(() =>
    filteredRecords.filter(r => r.type === 'EXPENSE').reduce((s, r) => s + r.amount, 0),
  [filteredRecords]);

  const totalBalance = totalIncome - totalExpense;

  const handleQuickTxn = async () => {
    if (!quickTxnName.trim()) return;
    const success = await addRecord({
      type: 'INCOME',
      description: quickTxnName.trim(),
      amount: 0,
      transactionDate: todayStr(),
    });
    if (success) {
      setQuickTxnOpen(false);
      setQuickTxnName('');
    }
  };

  const handleAdd = () => {
    setEditRecord(null);
    setModalOpen(true);
  };

  const handleEdit = (record) => {
    setEditRecord(record);
    setModalOpen(true);
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

  const handleGroupDeleteRequest = (group) => {
    setGroupDeleteConfirm({ open: true, group });
  };

  const confirmGroupDelete = async () => {
    if (groupDeleteConfirm.group) {
      await deleteGroup(groupDeleteConfirm.group.id);
    }
    setGroupDeleteConfirm({ open: false, group: null });
  };

  const handleCreateGroup = async (name) => {
    const success = await createGroup(name);
    if (success) {
      setGroupModalOpen(false);
    }
  };

  const handleSubmit = async (formData) => {
    let success;
    if (editRecord) {
      success = await updateRecord(editRecord.id, formData);
    } else {
      success = await addRecord(formData);
    }
    if (success) {
      setModalOpen(false);
      setEditRecord(null);
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setFilterType('');
    setFilterStartDate('');
    setFilterEndDate('');
  };

  const hasActiveFilters = searchQuery || filterType || filterStartDate || filterEndDate;

  if (initialLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white p-5 rounded-2xl border border-slate-100">
              <Skeleton className="h-4 w-24 mb-3" />
              <Skeleton className="h-8 w-36" />
            </div>
          ))}
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-6">
          <Skeleton className="h-6 w-48 mb-4" />
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {viewState === 'groups' ? (
        <>
          {/* ── GROUPS VIEW ── */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-100">
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
              {!readOnly && (<button onClick={() => setGroupModalOpen(true)}
                className="flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold px-5 py-2.5 rounded-xl transition-all shadow-sm shadow-emerald-500/20 text-sm w-full sm:w-auto">
                <Plus size={16} />
                Tambah Transaksi
              </button>)}
            </div>
          </motion.div>

          {/* Laporan Keuangan Global Card */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <div onClick={handleShowGlobalReport}
              className="bg-white rounded-2xl shadow-sm border border-slate-100 hover:border-emerald-200 hover:shadow-md hover:shadow-emerald-500/5 transition-all cursor-pointer overflow-hidden group">
              <div className="p-5 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-sm shrink-0">
                  <FileText size={24} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-slate-800">Laporan Keuangan</h4>
                  <p className="text-xs text-slate-400 mt-0.5">Rekap keuangan global semua transaksi</p>
                </div>
                <ChevronRight size={20} className="text-slate-300 group-hover:text-emerald-500 transition-colors shrink-0" />
              </div>
              <div className="h-1 bg-gradient-to-r from-emerald-400 to-teal-500" />
            </div>
          </motion.div>

          {groups.length === 0 ? (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl shadow-sm border border-slate-100 p-10 text-center">
              <div className="w-16 h-16 mx-auto bg-slate-50 rounded-full flex items-center justify-center border border-slate-100 mb-4">
                <FolderOpen size={28} className="text-slate-300" />
              </div>
              <h3 className="text-base font-bold text-slate-600">Belum Ada Transaksi</h3>
              <p className="text-sm text-slate-400 mt-1 max-w-sm mx-auto">
                Buat grup transaksi baru untuk memisahkan laporan keuangan khusus, seperti "Liburan Jogja" atau "Proyek A".
              </p>
              <button onClick={() => setGroupModalOpen(true)}
                className="mt-4 inline-flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold px-5 py-2.5 rounded-xl text-sm shadow-sm shadow-emerald-500/20 hover:from-emerald-600 hover:to-teal-700 transition-all">
                <Plus size={16} />
                Buat Transaksi Baru
              </button>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {groups.map((group, idx) => {
                const groupTxnCount = records.filter(r => r.group === group.name).length;
                const groupIncome = records.filter(r => r.group === group.name && r.type === 'INCOME').reduce((s, r) => s + r.amount, 0);
                const groupExpense = records.filter(r => r.group === group.name && r.type === 'EXPENSE').reduce((s, r) => s + r.amount, 0);
                return (
                  <motion.div key={group.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}>
                    <div className="group relative bg-white rounded-2xl shadow-sm border border-slate-100 hover:border-emerald-200 hover:shadow-md hover:shadow-emerald-500/5 transition-all cursor-pointer overflow-hidden"
                      onClick={() => handleGroupSelect(group)}>
                      <div className="p-5">
                        <div className="flex items-start justify-between mb-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-sm">
                            <FolderOpen size={20} className="text-white" />
                          </div>
                          <button onClick={(e) => { e.stopPropagation(); handleGroupDeleteRequest(group); }}
                            className="p-1.5 rounded-lg text-slate-300 hover:text-red-400 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all">
                            <Trash2 size={14} />
                          </button>
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
        </>
      ) : (
        <>
          {/* ── REPORT VIEW ── */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <button onClick={handleBackToGroups}
              className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-emerald-600 transition-colors bg-white px-4 py-2.5 rounded-xl border border-slate-100 shadow-sm hover:border-emerald-200">
              <ChevronLeft size={18} />
              Kembali ke Daftar Transaksi
            </button>
          </motion.div>

          {selectedGroup && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-r from-emerald-500 to-teal-600 p-4 sm:p-5 rounded-2xl shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-white/15">
                  <FolderOpen size={18} className="text-white" />
                </div>
                <div>
                  <p className="text-[10px] text-emerald-200 font-semibold uppercase tracking-wider">Grup Transaksi</p>
                  <p className="text-sm font-bold text-white">{selectedGroup.name}</p>
                </div>
              </div>
              <button onClick={handleClearGroup}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-white text-xs font-semibold transition-all">
                <X size={14} />
                Tutup
              </button>
            </motion.div>
          )}

          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="relative overflow-hidden bg-gradient-to-br from-emerald-500 to-teal-600 p-5 rounded-2xl shadow-lg shadow-emerald-500/20">
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
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="relative overflow-hidden bg-gradient-to-br from-emerald-500 to-teal-600 p-5 rounded-2xl shadow-lg shadow-emerald-500/20">
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
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              className={`relative overflow-hidden p-5 rounded-2xl shadow-lg ${
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
            </motion.div>
          </div>

          {/* Action Bar */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
            className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-slate-800">Laporan Keuangan</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {selectedGroup ? `Ringkasan pemasukan dan pengeluaran untuk "${selectedGroup.name}"` : 'Ringkasan pemasukan dan pengeluaran harian'}
                </p>
              </div>
              <div className="flex gap-3 w-full sm:w-auto">
                <button onClick={() => setPdfModalOpen(true)}
                  className="flex items-center justify-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 font-semibold px-5 py-2.5 rounded-xl transition-all text-sm flex-1 sm:flex-none">
                  <Download size={16} />
                  <span className="hidden sm:inline">Download PDF</span>
                </button>
                {!readOnly && (<button onClick={handleAdd}
                  className="flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold px-5 py-2.5 rounded-xl transition-all shadow-sm shadow-emerald-500/20 text-sm flex-1 sm:flex-none">
                  <Plus size={16} />
                  Tambah Transaksi
                </button>)}
              </div>
            </div>
          </motion.div>

          {/* Filter Bar */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
            className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-slate-100">
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
          </motion.div>

          {/* Table */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
            className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            {filteredRecords.length === 0 ? (
              <div className="py-16 text-center">
                <div className="w-16 h-16 mx-auto bg-slate-50 rounded-full flex items-center justify-center border border-slate-100 mb-4">
                  <Wallet size={28} className="text-slate-300" />
                </div>
                <h3 className="text-base font-bold text-slate-600">Belum Ada Transaksi</h3>
                <p className="text-sm text-slate-400 mt-1 max-w-sm mx-auto">
                  {hasActiveFilters
                    ? 'Tidak ada transaksi yang cocok dengan filter. Coba ubah filter atau atur ulang.'
                    : 'Mulai catat pemasukan dan pengeluaran harian dengan menekan tombol "Tambah Transaksi".'}
                </p>
                {!hasActiveFilters && !readOnly && (
                  <button onClick={handleAdd}
                    className="mt-4 inline-flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold px-5 py-2.5 rounded-xl text-sm shadow-sm shadow-emerald-500/20 hover:from-emerald-600 hover:to-teal-700 transition-all">
                    <Plus size={16} />
                    Tambah Transaksi Pertama
                  </button>
                )}
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
                              <ChevronDown size={16} className="text-slate-300 group-hover:text-slate-500" />
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
                            <div className={`text-slate-300 group-hover:text-slate-500 transition-colors ${isExpanded ? 'rotate-180' : ''}`}>
                              <ChevronDown size={16} />
                            </div>
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
                                      {!readOnly && (<div className="sm:hidden flex gap-1.5 pl-9 mt-1.5">
                                        <button onClick={() => handleEdit(record)}
                                          className="p-1 rounded-md bg-blue-50 text-blue-500 hover:bg-blue-100 transition-colors">
                                          <Edit2 size={12} />
                                        </button>
                                        <button onClick={() => handleDeleteRequest(record)}
                                          className="p-1 rounded-md bg-emerald-50 text-emerald-400 hover:bg-emerald-100 transition-colors">
                                          <Trash2 size={12} />
                                        </button>
                                      </div>)}
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
                                      {!readOnly && (<div className="hidden sm:flex col-span-1 items-center justify-end gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity">
                                        <button onClick={() => handleEdit(record)}
                                          className="p-1.5 rounded-lg bg-blue-50 text-blue-500 hover:bg-blue-100 transition-colors">
                                          <Edit2 size={13} />
                                        </button>
                                        <button onClick={() => handleDeleteRequest(record)}
                                          className="p-1.5 rounded-lg bg-emerald-50 text-emerald-400 hover:bg-emerald-100 transition-colors">
                                          <Trash2 size={13} />
                                        </button>
                                      </div>)}
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
          </motion.div>
        </>
      )}

      {/* Quick Transaction Modal */}
      {!readOnly && (<AnimatePresence>
        {quickTxnOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => { setQuickTxnOpen(false); setQuickTxnName(''); }} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }} transition={{ type: 'spring', stiffness: 280, damping: 28 }}
              className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between px-4 sm:px-6 py-4 sm:py-5 border-b border-slate-100 bg-emerald-50/50">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                    <Plus size={20} className="text-emerald-600" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm sm:text-base font-bold text-slate-800 truncate">Transaksi Baru</h3>
                    <p className="text-xs text-slate-400">Catat transaksi cepat</p>
                  </div>
                </div>
                <button onClick={() => { setQuickTxnOpen(false); setQuickTxnName(''); }} className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-white/70 transition-colors shrink-0">
                  <X size={20} />
                </button>
              </div>
              <div className="px-4 sm:px-6 py-4 sm:py-5">
                <form onSubmit={(e) => { e.preventDefault(); handleQuickTxn(); }} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Nama Transaksi</label>
                    <textarea required value={quickTxnName} onChange={e => setQuickTxnName(e.target.value)}
                      placeholder="Masukkan nama transaksi..."
                      rows={3}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 outline-none resize-none" />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button type="button" onClick={() => { setQuickTxnOpen(false); setQuickTxnName(''); }}
                      className="flex-1 py-3 border border-slate-200 text-slate-600 font-semibold rounded-xl hover:bg-white transition-colors text-sm">
                      Batal
                    </button>
                    <button type="submit" disabled={isLoading || !quickTxnName.trim()}
                      className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl transition-all text-sm shadow-sm shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed">
                      {isLoading ? 'Menyimpan...' : 'Simpan'}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>)}

      {/* Group Modal */}
      <AnimatePresence>
        {groupModalOpen && (
          <GroupModal
            onClose={() => setGroupModalOpen(false)}
            onSubmit={handleCreateGroup}
            isLoading={isLoading}
          />
        )}
      </AnimatePresence>

      {/* Transaction Modal */}
      {!readOnly && (<AnimatePresence>
        {modalOpen && (
          <TransactionModal
            onClose={() => { setModalOpen(false); setEditRecord(null); }}
            onSubmit={handleSubmit}
            isLoading={isLoading}
            editData={editRecord}
            selectedGroupName={selectedGroup?.name || ''}
          />
        )}
      </AnimatePresence>)}

      {/* PDF Modal */}
      <AnimatePresence>
        {pdfModalOpen && (
          <PdfModal records={records} onClose={() => setPdfModalOpen(false)} />
        )}
      </AnimatePresence>

      {/* Delete Confirm */}
      <ConfirmModal
        isOpen={deleteConfirm.open}
        onClose={() => setDeleteConfirm({ open: false, record: null })}
        onConfirm={confirmDelete}
        type="danger"
        title="Hapus Transaksi"
        message={`Apakah Anda yakin ingin menghapus transaksi "${deleteConfirm.record?.description || ''}" sebesar ${deleteConfirm.record ? formatCurrency(deleteConfirm.record.amount) : ''}?`}
        subMessage="Tindakan ini tidak dapat dibatalkan."
        confirmLabel="Hapus Transaksi"
        loading={isLoading}
      />

      {/* Group Delete Confirm */}
      <ConfirmModal
        isOpen={groupDeleteConfirm.open}
        onClose={() => setGroupDeleteConfirm({ open: false, group: null })}
        onConfirm={confirmGroupDelete}
        type="danger"
        title="Hapus Grup Transaksi"
        message={`Apakah Anda yakin ingin menghapus grup "${groupDeleteConfirm.group?.name || ''}"?`}
        subMessage="Transaksi dalam grup ini tidak akan ikut terhapus."
        confirmLabel="Hapus Grup"
        loading={isLoading}
      />
    </div>
  );
};

export default DailyFinance;
