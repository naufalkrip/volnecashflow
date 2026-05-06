import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, LogOut, Trash2, X } from 'lucide-react';

/**
 * Reusable confirm modal — replaces all browser alert/confirm popups
 *
 * Props:
 *   isOpen       {boolean}
 *   onClose      {() => void}
 *   onConfirm    {() => void}
 *   title        {string}
 *   message      {string}
 *   subMessage   {string}   optional extra warning
 *   confirmLabel {string}   default: "Hapus"
 *   cancelLabel  {string}   default: "Batal"
 *   type         {'danger'|'warning'|'logout'}  controls color scheme
 *   loading      {boolean}
 */
const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Konfirmasi',
  message = 'Apakah Anda yakin?',
  subMessage,
  confirmLabel,
  cancelLabel = 'Batal',
  type = 'danger',
  loading = false,
}) => {
  // Close on ESC key
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  const config = {
    danger: {
      icon: <Trash2 size={24} className="text-red-500" />,
      iconBg: 'bg-red-50',
      confirmBtn: 'bg-red-500 hover:bg-red-600 focus:ring-red-300 shadow-red-200',
      label: confirmLabel || 'Hapus',
    },
    warning: {
      icon: <AlertTriangle size={24} className="text-amber-500" />,
      iconBg: 'bg-amber-50',
      confirmBtn: 'bg-amber-500 hover:bg-amber-600 focus:ring-amber-300 shadow-amber-200',
      label: confirmLabel || 'Lanjutkan',
    },
    logout: {
      icon: <LogOut size={24} className="text-rose-500" />,
      iconBg: 'bg-rose-50',
      confirmBtn: 'bg-rose-500 hover:bg-rose-600 focus:ring-rose-300 shadow-rose-200',
      label: confirmLabel || 'Logout',
    },
  };

  const c = config[type] || config.danger;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={!loading ? onClose : undefined}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 16 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Close btn */}
            {!loading && (
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X size={16} />
              </button>
            )}

            <div className="p-6">
              {/* Icon */}
              <div className={`w-12 h-12 rounded-2xl ${c.iconBg} flex items-center justify-center mb-4`}>
                {c.icon}
              </div>

              {/* Content */}
              <h3 className="text-base font-bold text-slate-800 mb-2">{title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{message}</p>
              {subMessage && (
                <p className="text-xs text-slate-400 mt-2 bg-slate-50 px-3 py-2 rounded-lg border border-slate-100">
                  {subMessage}
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="px-6 pb-6 flex gap-3">
              <button
                onClick={onClose}
                disabled={loading}
                className="flex-1 py-2.5 px-4 border border-slate-200 text-slate-600 font-semibold rounded-xl hover:bg-slate-50 transition-colors text-sm disabled:opacity-50"
              >
                {cancelLabel}
              </button>
              <button
                onClick={onConfirm}
                disabled={loading}
                className={`flex-1 py-2.5 px-4 text-white font-semibold rounded-xl transition-all text-sm shadow-md focus:outline-none focus:ring-2 disabled:opacity-60 disabled:cursor-not-allowed ${c.confirmBtn}`}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    Memproses...
                  </span>
                ) : c.label}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ConfirmModal;
