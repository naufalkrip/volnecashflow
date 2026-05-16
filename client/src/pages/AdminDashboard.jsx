import React, { useEffect } from 'react';
import { useFinanceStore } from '../store/financeStore';
import { motion } from 'framer-motion';
import { Users, Shield, UserCheck, UserX, Calendar, Search, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';

const AdminDashboard = () => {
  const { users, fetchUsers } = useFinanceStore();
  const [searchQuery, setSearchQuery] = React.useState('');

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const filtered = users.filter(u =>
    u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.username?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeCount = users.filter(u => u.role === 'USER').length;
  const adminCount = users.filter(u => u.role === 'ADMIN').length;
  const totalCount = users.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-emerald-500 to-teal-600 p-5 sm:p-6 rounded-2xl shadow-lg shadow-emerald-500/20 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full transform translate-x-12 -translate-y-12" />
        <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/5 rounded-full transform -translate-x-6 translate-y-6" />
        <div className="relative z-10 flex items-center gap-4">
          <div className="p-2.5 rounded-xl bg-white/15 backdrop-blur-sm">
            <Shield size={22} className="text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Admin Dashboard</h2>
            <p className="text-sm text-emerald-100">{totalCount} pengguna terdaftar</p>
          </div>
        </div>
      </motion.div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-3">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-3"
        >
          <div className="p-2.5 rounded-xl bg-emerald-50">
            <Users size={20} className="text-emerald-600" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Anggota</p>
            <p className="text-xl font-bold text-slate-800">{activeCount}</p>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-3"
        >
          <div className="p-2.5 rounded-xl bg-slate-50">
            <Shield size={20} className="text-slate-600" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Admin</p>
            <p className="text-xl font-bold text-slate-800">{adminCount}</p>
          </div>
        </motion.div>
      </div>

      {/* Settings Card */}
      <Link to="/admin/settings">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-3 hover:border-emerald-200 hover:shadow-md transition-all group"
        >
          <div className="p-2.5 rounded-xl bg-violet-50 group-hover:bg-violet-100 transition-colors">
            <Settings size={20} className="text-violet-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-slate-800">Pengaturan Akun</p>
            <p className="text-xs text-slate-400">Ubah username dan password admin</p>
          </div>
          <span className="text-emerald-500 text-sm font-semibold group-hover:translate-x-1 transition-transform">&rarr;</span>
        </motion.div>
      </Link>

      {/* Users List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden"
      >
        <div className="p-4 sm:p-5 border-b border-slate-100">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <Users size={18} className="text-emerald-500" />
              Daftar Pengguna Terdaftar
            </h3>
            <div className="relative w-full sm:w-64">
              <Search size={16} className="absolute left-3.5 top-3 text-slate-400" />
              <input type="text" placeholder="Cari pengguna..." value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 outline-none" />
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Nama</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Username</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Role</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Bergabung</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <UserX size={32} className="text-slate-300" />
                      <p className="text-slate-400 text-sm font-medium">
                        {searchQuery ? 'Pengguna tidak ditemukan' : 'Belum ada pengguna terdaftar'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((u, i) => (
                  <tr key={u.id} className="border-b border-slate-50 hover:bg-emerald-50/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-sm ${
                          u.role === 'ADMIN'
                            ? 'bg-gradient-to-br from-red-400 to-red-600'
                            : 'bg-gradient-to-br from-emerald-400 to-emerald-600'
                        }`}>
                          {u.name?.charAt(0)?.toUpperCase()}
                        </div>
                        <span className="font-medium text-slate-700">{u.name}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-slate-500">@{u.username || '-'}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold ${
                        u.role === 'ADMIN'
                          ? 'bg-red-50 text-red-600 ring-1 ring-red-200'
                          : 'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200'
                      }`}>
                        {u.role === 'ADMIN' ? <Shield size={12} /> : <UserCheck size={12} />}
                        {u.role === 'ADMIN' ? 'Admin' : 'Anggota'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-xs text-slate-400 flex items-center gap-1.5">
                        <Calendar size={12} />
                        {u.createdAt
                          ? new Date(u.createdAt).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' })
                          : '-'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {filtered.length > 0 && (
          <div className="px-4 py-3 border-t border-slate-100 bg-slate-50/50 text-xs text-slate-400 text-right">
            Menampilkan {filtered.length} dari {totalCount} pengguna
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default AdminDashboard;
