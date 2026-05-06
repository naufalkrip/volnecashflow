import React, { useEffect, useState, useMemo } from 'react';
import { useFinanceStore } from '../store/financeStore';
import { Download, FileText, Search, Calendar, Filter, X, Loader2, CheckCircle, MessageCircle, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import logoSrc from '../assets/logo.png';

const formatCurrency = (v) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(v);

// Module-level logo loader — loads once, cached forever
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
        canvas.width = w;
        canvas.height = h;
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

// Kick off loading immediately on module import
getLogoBase64();

// ─── PDF Generation Modal ────────────────────────────────────────────────────
const PdfModal = ({ members, records, onClose }) => {
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [dateError, setDateError] = useState('');
  const [step, setStep] = useState('form');
  const [pdfBlob, setPdfBlob] = useState(null);
  const [pdfFileName, setPdfFileName] = useState('');

  const validateDates = (start, end) => {
    if (!start || !end) { setDateError(''); return true; }
    const diff = (new Date(end) - new Date(start)) / (1000 * 60 * 60 * 24);
    if (diff < 0) { setDateError('Tanggal akhir tidak boleh sebelum tanggal mulai.'); return false; }
    if (diff > 31) { setDateError('Rentang waktu maksimal 1 bulan (31 hari).'); return false; }
    setDateError('');
    return true;
  };

  const handleStartChange = (val) => { setStartDate(val); validateDates(val, endDate); };
  const handleEndChange = (val) => { setEndDate(val); validateDates(startDate, val); };

  const selectedMember = members.find(m => m.id === selectedMemberId);

  const filteredRecords = useMemo(() => {
    if (!selectedMemberId) return [];
    return records.filter(r => {
      if (r.memberId !== selectedMemberId) return false;
      const d = new Date(r.date);
      if (startDate && d < new Date(startDate)) return false;
      if (endDate && d > new Date(endDate + 'T23:59:59')) return false;
      return true;
    });
  }, [records, selectedMemberId, startDate, endDate]);

  const totalGross = filteredRecords.reduce((s, r) => s + r.amount, 0);
  const totalDeduction = filteredRecords.reduce((s, r) => s + r.deduction, 0);
  const totalNet = filteredRecords.reduce((s, r) => s + r.netAmount, 0);

  const handleGenerate = async () => {
    if (!selectedMemberId) return;
    if (!validateDates(startDate, endDate)) return;
    setStep('loading');

    // Await logo — guaranteed to be loaded by now (started on module import)
    const logoBase64 = await getLogoBase64();

    try {
      const doc = new jsPDF();
      const pageW = doc.internal.pageSize.width;
      let y = 14;

        // ── HEADER: White clean ─────────────────────────────────────
        // Logo image (if loaded) or fallback green square
        if (logoBase64) {
          doc.addImage(logoBase64, 'PNG', 14, y, 20, 20);
        } else {
          doc.setFillColor(6, 78, 59);
          doc.roundedRect(14, y, 20, 20, 2, 2, 'F');
        }

        // Brand name
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(6, 78, 59);
        doc.text('Volne Cash Flow', 38, y + 10);

        // Subtitle
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 116, 139);
        doc.text('Affiliate Revenue Management System', 38, y + 17);

        y += 28;

        // Thin divider line
        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.4);
        doc.line(14, y, pageW - 14, y);
        y += 8;

        // ── AFFILIATE INFO: Left = name & period, Right = date ──────
        const affiliateName = selectedMember?.name || '';
        const periodeText = (startDate && endDate)
          ? `${new Date(startDate).toLocaleDateString('id-ID')} – ${new Date(endDate).toLocaleDateString('id-ID')}`
          : 'Semua Waktu';
        const generatedDate = `Dibuat: ${new Date().toLocaleDateString('id-ID')}`;

        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(15, 23, 42);
        doc.text(`Laporan Affiliate: ${affiliateName}`, 14, y);

        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 116, 139);
        doc.text(`Periode: ${periodeText}`, 14, y + 6);

        // Date aligned right
        const dateW = doc.getTextWidth(generatedDate);
        doc.text(generatedDate, pageW - 14 - dateW, y);

        y += 18;

        // ── TOTAL NET INCOME: centered, bold green, large ───────────
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 116, 139);
        doc.text('Total Net Income', pageW / 2, y, { align: 'center' });

        y += 7;
        doc.setFontSize(22);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(6, 78, 59);
        doc.text(formatCurrency(totalNet), pageW / 2, y, { align: 'center' });

        y += 14;

        // ── TABLE ──────────────────────────────────────────────────
        const rows = filteredRecords.map(r => [
          new Date(r.date).toLocaleDateString('id-ID'),
          formatCurrency(r.amount),
          formatCurrency(r.deduction),
          formatCurrency(r.netAmount),
          r.status,
        ]);

        autoTable(doc, {
          startY: y,
          head: [['Tanggal', 'Gross Income', 'Deduction', 'Net Income', 'Status']],
          body: rows,
          foot: [[
            { content: 'TOTAL', styles: { fontStyle: 'bold' } },
            { content: formatCurrency(totalGross), styles: { fontStyle: 'bold' } },
            { content: formatCurrency(totalDeduction), styles: { fontStyle: 'bold' } },
            { content: formatCurrency(totalNet), styles: { fontStyle: 'bold' } },
            '',
          ]],
          theme: 'grid',
          headStyles: {
            fillColor: [220, 252, 231],   // very light green
            textColor: [0, 0, 0],
            fontStyle: 'bold',
            fontSize: 9,
            cellPadding: 5,
            lineColor: [200, 230, 210],
            lineWidth: 0.3,
          },
          bodyStyles: {
            fillColor: [255, 255, 255],
            textColor: [0, 0, 0],
            fontSize: 9,
            cellPadding: 4,
            lineColor: [220, 220, 220],
            lineWidth: 0.3,
          },
          footStyles: {
            fillColor: [220, 252, 231],   // very light green
            textColor: [0, 0, 0],
            fontStyle: 'bold',
            fontSize: 9,
            cellPadding: 5,
            lineColor: [200, 230, 210],
            lineWidth: 0.3,
          },
          alternateRowStyles: { fillColor: [255, 255, 255] },
        });

        // ── PAGE FOOTER ─────────────────────────────────────────────
        const pageCount = doc.internal.pages.length - 1;
        for (let i = 1; i <= pageCount; i++) {
          doc.setPage(i);
          doc.setFontSize(7);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(180);
          doc.line(14, doc.internal.pageSize.height - 14, pageW - 14, doc.internal.pageSize.height - 14);
          doc.text(
            `Halaman ${i} dari ${pageCount}  ·  Volne Cash Flow  ·  Dokumen Rahasia`,
            pageW / 2,
            doc.internal.pageSize.height - 8,
            { align: 'center' }
          );
        }

        const blob = doc.output('blob');
        const fileName = `Laporan_${affiliateName.replace(/\s+/g, '_') || 'Affiliate'}_${startDate || 'semua'}.pdf`;
        setPdfBlob(blob);
        setPdfFileName(fileName);
        setStep('success');
    } catch (err) {
      console.error('PDF generation error:', err);
      setStep('form');
      // Error ditampilkan via console, tidak memakai alert browser
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
    const shareMsg = `Halo, berikut laporan affiliate *${selectedMember?.name || ''}* dari Volne Cash Flow.\nPeriode: ${startDate || 'semua'} s/d ${endDate || 'sekarang'}\nTotal Net Income: ${formatCurrency(totalNet)}`;

    // Try Web Share API with file (works on mobile Chrome/Safari)
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: pdfFileName, text: shareMsg });
        return;
      } catch (err) {
        if (err.name === 'AbortError') return; // user cancelled
      }
    }

    // Fallback for desktop: download file + open WhatsApp with text
    const url = URL.createObjectURL(pdfBlob);
    const a = document.createElement('a');
    a.href = url; a.download = pdfFileName; a.click();
    URL.revokeObjectURL(url);
    setTimeout(() => {
      window.open(`https://wa.me/?text=${encodeURIComponent(shareMsg + '\n\n_(File PDF sudah terdownload, lampirkan ke chat ini)_')}`, '_blank');
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />

      <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }} transition={{ type: 'spring', stiffness: 280, damping: 28 }}
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <div>
            <h3 className="text-lg font-bold text-slate-800">Generate Affiliate Report</h3>
            <p className="text-xs text-slate-400 mt-0.5">Buat laporan PDF berdasarkan anggota dan periode</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="overflow-y-auto flex-1 px-6 py-6">
          {step === 'form' && (
            <div className="space-y-5">
              {/* Select Affiliate */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Pilih Anggota Affiliate</label>
                <div className="relative">
                  <select value={selectedMemberId} onChange={e => setSelectedMemberId(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 appearance-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 outline-none transition-all"
                  >
                    <option value="" disabled>-- Pilih anggota --</option>
                    {members.map(m => <option key={m.id} value={m.id}>{m.name}{m.username ? ` (@${m.username})` : ''}</option>)}
                  </select>
                  <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-slate-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                  </div>
                </div>
                {members.length === 0 && <p className="text-xs text-amber-500 mt-1.5 flex items-center gap-1"><AlertCircle size={12} />Belum ada anggota. Tambahkan di Settings terlebih dahulu.</p>}
              </div>

              {/* Date Range */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Rentang Tanggal <span className="text-slate-400 font-normal">(maks. 1 bulan)</span></label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Tanggal Mulai</label>
                    <input type="date" value={startDate} onChange={e => handleStartChange(e.target.value)}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 outline-none transition-all" />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Tanggal Akhir</label>
                    <input type="date" value={endDate} onChange={e => handleEndChange(e.target.value)} min={startDate}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 outline-none transition-all" />
                  </div>
                </div>
                {dateError && (
                  <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                    className="mt-2 text-xs text-rose-500 font-medium flex items-center gap-1.5 bg-rose-50 px-3 py-2 rounded-lg border border-rose-100">
                    <AlertCircle size={13} />{dateError}
                  </motion.p>
                )}
              </div>

              {/* Preview (if member selected) */}
              {selectedMemberId && (
                <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                  className="bg-emerald-50/60 border border-emerald-100 rounded-2xl p-4 space-y-2">
                  <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-2">Preview Data</p>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Transaksi ditemukan</span>
                    <span className="font-bold text-slate-700">{filteredRecords.length} transaksi</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Total Gross</span>
                    <span className="font-medium text-slate-700">{formatCurrency(totalGross)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Total Deduction</span>
                    <span className="font-medium text-rose-500">-{formatCurrency(totalDeduction)}</span>
                  </div>
                  <div className="pt-2 border-t border-emerald-100 flex justify-between text-sm">
                    <span className="font-bold text-slate-700">Total Net Income</span>
                    <span className="font-bold text-emerald-600">{formatCurrency(totalNet)}</span>
                  </div>
                </motion.div>
              )}
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
                <p className="text-sm text-slate-500 mt-1">PDF laporan untuk <strong>{selectedMember?.name}</strong> telah berhasil dibuat.</p>
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
                <p className="text-[11px] text-slate-400 leading-relaxed px-2">
                  ⓘ WhatsApp akan terbuka dengan pesan otomatis. Download PDF terlebih dahulu lalu lampirkan file di chat WhatsApp tersebut.
                </p>
              </div>
            </motion.div>
          )}
        </div>

        {/* Modal Footer */}
        {step === 'form' && (
          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex gap-3">
            <button onClick={onClose}
              className="flex-1 py-3 border border-slate-200 text-slate-600 font-semibold rounded-xl hover:bg-white transition-colors text-sm">
              Batal
            </button>
            <button onClick={handleGenerate}
              disabled={!selectedMemberId || !!dateError || filteredRecords.length === 0}
              className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl transition-all text-sm shadow-sm shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed">
              Generate PDF
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
};

// ─── Main Reports Page ────────────────────────────────────────────────────────
const Reports = () => {
  const { records, fetchRecords, members, fetchMembers } = useFinanceStore();
  const [selectedMember, setSelectedMember] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);

  useEffect(() => {
    fetchRecords();
    fetchMembers();
  }, [fetchRecords, fetchMembers]);

  const groupedData = useMemo(() => {
    let filtered = [...records];
    if (searchQuery) {
      const lq = searchQuery.toLowerCase();
      filtered = filtered.filter(r => r.affiliate?.name?.toLowerCase().includes(lq) || r.status.toLowerCase().includes(lq));
    }
    if (selectedMonth) {
      filtered = filtered.filter(r => {
        const d = new Date(r.date);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` === selectedMonth;
      });
    }
    if (selectedMember !== 'ALL') filtered = filtered.filter(r => r.memberId === selectedMember);

    const grouped = filtered.reduce((acc, record) => {
      const key = record.memberId || 'unknown';
      if (!acc[key]) acc[key] = { affiliate: record.affiliate || { name: 'Unknown' }, records: [], totalGross: 0, totalDeduction: 0, totalNet: 0 };
      acc[key].records.push(record);
      acc[key].totalGross += record.amount;
      acc[key].totalDeduction += record.deduction;
      acc[key].totalNet += record.netAmount;
      return acc;
    }, {});
    return Object.values(grouped).sort((a, b) => a.affiliate.name.localeCompare(b.affiliate.name));
  }, [records, selectedMember, searchQuery, selectedMonth]);

  return (
    <div className="space-y-6">
      {/* Filter Bar */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Filter size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
            <select value={selectedMember} onChange={e => setSelectedMember(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm appearance-none font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 outline-none">
              <option value="ALL">All Affiliates</option>
              {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>
          <div className="relative">
            <Calendar size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
            <input type="month" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 outline-none" />
          </div>
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
            <input type="text" placeholder="Search..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 outline-none" />
          </div>
        </div>
        <button onClick={() => setIsPdfModalOpen(true)}
          className="w-full lg:w-auto flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-sm shadow-emerald-500/20 shrink-0">
          <FileText size={17} />Download PDF Report
        </button>
      </div>

      {/* Affiliate Groups */}
      <div className="space-y-6">
        {groupedData.length === 0 ? (
          <div className="bg-white p-10 rounded-2xl shadow-sm border border-slate-100 text-center flex flex-col items-center">
            <div className="w-14 h-14 bg-slate-50 rounded-full flex items-center justify-center mb-4 text-slate-200 border border-slate-100">
              <FileText size={28} />
            </div>
            <h3 className="text-base font-bold text-slate-700">No Reports Found</h3>
            <p className="text-sm text-slate-400 mt-1">Coba ubah filter atau tambahkan transaksi baru.</p>
          </div>
        ) : (
          groupedData.map(group => (
            <motion.div key={group.affiliate.id || group.affiliate.name}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">

              {/* Affiliate Header */}
              <div className="px-4 sm:px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Affiliate Member</p>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <span className="text-base sm:text-lg font-bold text-slate-800">{group.affiliate.name}</span>
                    {group.affiliate.username && (
                      <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                        @{group.affiliate.username}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-left sm:text-right shrink-0">
                  <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide">Net Income</p>
                  <p className="text-base font-bold text-emerald-600">{formatCurrency(group.totalNet)}</p>
                </div>
              </div>

              {/* ── DESKTOP TABLE ── */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-left min-w-[520px]">
                  <thead>
                    <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      <th className="px-5 py-3.5">Tanggal</th>
                      <th className="px-5 py-3.5">Gross Income</th>
                      <th className="px-5 py-3.5">Deduction</th>
                      <th className="px-5 py-3.5">Net Income</th>
                      <th className="px-5 py-3.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {group.records.map(record => (
                      <tr key={record.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-5 py-3.5 text-sm font-medium text-slate-600">{new Date(record.date).toLocaleDateString('id-ID')}</td>
                        <td className="px-5 py-3.5 text-sm text-slate-600">{formatCurrency(record.amount)}</td>
                        <td className="px-5 py-3.5 text-sm text-rose-500 font-medium">-{formatCurrency(record.deduction)}</td>
                        <td className="px-5 py-3.5 text-sm font-bold text-emerald-600">{formatCurrency(record.netAmount)}</td>
                        <td className="px-5 py-3.5">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${record.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                            {record.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
                      <td className="px-5 py-3.5 text-xs font-bold uppercase tracking-widest text-emerald-100">Total</td>
                      <td className="px-5 py-3.5">
                        <p className="text-[10px] text-emerald-200 font-semibold uppercase">Gross</p>
                        <p className="text-sm font-bold text-white mt-0.5">{formatCurrency(group.totalGross)}</p>
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="text-[10px] text-emerald-200 font-semibold uppercase">Deduction</p>
                        <p className="text-sm font-bold text-white mt-0.5">-{formatCurrency(group.totalDeduction)}</p>
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="text-[10px] text-emerald-200 font-semibold uppercase">Net Income</p>
                        <p className="text-sm font-bold text-white mt-0.5">{formatCurrency(group.totalNet)}</p>
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* ── MOBILE CARD LIST ── */}
              <div className="sm:hidden divide-y divide-slate-50">
                {group.records.map(record => (
                  <div key={record.id} className="px-4 py-3.5 flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${record.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                          {record.status}
                        </span>
                        <span className="text-xs text-slate-400">{new Date(record.date).toLocaleDateString('id-ID')}</span>
                      </div>
                      <p className="text-xs text-slate-500">Gross: <span className="font-medium text-slate-700">{formatCurrency(record.amount)}</span></p>
                      <p className="text-xs text-rose-400">Potongan: -{formatCurrency(record.deduction)}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[10px] text-slate-400 font-semibold uppercase">Net</p>
                      <p className="text-sm font-bold text-emerald-600">{formatCurrency(record.netAmount)}</p>
                    </div>
                  </div>
                ))}
                {/* Mobile Total */}
                <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-3.5 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-emerald-200 font-semibold">Total Gross</p>
                    <p className="text-sm font-bold text-white">{formatCurrency(group.totalGross)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-emerald-200 font-semibold">Potongan</p>
                    <p className="text-sm font-bold text-white">-{formatCurrency(group.totalDeduction)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-emerald-200 font-semibold">Net Income</p>
                    <p className="text-sm font-bold text-white">{formatCurrency(group.totalNet)}</p>
                  </div>
                </div>
              </div>

            </motion.div>
          ))
        )}
      </div>

      {/* PDF Modal */}
      <AnimatePresence>
        {isPdfModalOpen && (
          <PdfModal members={members} records={records} onClose={() => setIsPdfModalOpen(false)} />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Reports;
