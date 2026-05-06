import React, { useEffect, useState } from 'react';
import { useFinanceStore } from '../store/financeStore';
import { Users, Plus, Edit2, Trash2, X, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ConfirmModal from '../components/ui/ConfirmModal';

const Members = () => {
  const { members, fetchMembers, addMember, updateMember, deleteMember, isLoading } = useFinanceStore();
  
  // Member Management State
  const [searchMember, setSearchMember] = useState('');
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [memberForm, setMemberForm] = useState({ id: null, name: '', username: '', isActive: true });
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, member: null });

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const handleSearchMember = (e) => {
    e.preventDefault();
    fetchMembers({ search: searchMember });
  };

  const openMemberModal = (member = null) => {
    if (member) {
      setMemberForm({ id: member.id, name: member.name, username: member.username || '', isActive: member.isActive });
    } else {
      setMemberForm({ id: null, name: '', username: '', isActive: true });
    }
    setIsMemberModalOpen(true);
  };

  const closeMemberModal = () => {
    setIsMemberModalOpen(false);
    setMemberForm({ id: null, name: '', username: '', isActive: true });
  };

  const handleSaveMember = async (e) => {
    e.preventDefault();
    if (memberForm.id) {
      await updateMember(memberForm.id, {
        name: memberForm.name,
        username: memberForm.username,
        isActive: memberForm.isActive
      });
    } else {
      await addMember({
        name: memberForm.name,
        username: memberForm.username,
        isActive: memberForm.isActive
      });
    }
    closeMemberModal();
  };

  const handleDeleteMember = (member) => {
    setDeleteConfirm({ open: true, member });
  };

  const confirmDeleteMember = async () => {
    if (deleteConfirm.member) {
      await deleteMember(deleteConfirm.member.id);
    }
    setDeleteConfirm({ open: false, member: null });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
          <form onSubmit={handleSearchMember} className="relative w-full sm:w-96">
            <input 
              type="text" 
              placeholder="Search members..." 
              value={searchMember}
              onChange={(e) => setSearchMember(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-sm"
            />
            <Search size={18} className="absolute left-3.5 top-3 text-slate-400" />
          </form>

          <button 
            onClick={() => openMemberModal()}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2.5 rounded-xl transition-all font-medium text-sm shadow-sm shadow-emerald-500/20"
          >
            <Plus size={18} />
            Add Member
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">

          {/* ── DESKTOP TABLE ── */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-sm border-b border-slate-100">
                  <th className="px-6 py-4 font-medium">Name</th>
                  <th className="px-6 py-4 font-medium">Username</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium">Joined Date</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {members.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center">
                        <Users size={40} className="mb-3 text-slate-300" />
                        <p className="font-medium text-slate-600">No members found</p>
                        <p className="text-xs text-slate-400 mt-1">Add your first affiliate member to get started.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  members.map((member) => (
                    <tr key={member.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4 font-medium text-slate-800">{member.name}</td>
                      <td className="px-6 py-4 text-slate-500">{member.username ? `@${member.username}` : '-'}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
                          member.isActive
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}>
                          {member.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-500">{new Date(member.createdAt).toLocaleDateString('en-GB')}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => openMemberModal(member)}
                            className="p-1.5 rounded-lg bg-blue-50 text-blue-500 hover:bg-blue-100 hover:text-blue-600 transition-colors"
                            title="Edit anggota"
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            onClick={() => handleDeleteMember(member)}
                            className="p-1.5 rounded-lg bg-red-50 text-red-400 hover:bg-red-100 hover:text-red-600 transition-colors"
                            title="Hapus anggota"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* ── MOBILE CARD LIST ── */}
          <div className="sm:hidden">
            {members.length === 0 ? (
              <div className="px-4 py-10 text-center flex flex-col items-center">
                <Users size={36} className="mb-3 text-slate-300" />
                <p className="font-medium text-slate-600 text-sm">No members found</p>
                <p className="text-xs text-slate-400 mt-1">Add your first affiliate member.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {members.map((member) => (
                  <div key={member.id} className="px-4 py-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-9 h-9 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 font-bold text-sm shrink-0">
                        {member.name?.charAt(0)?.toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-800 text-sm truncate">{member.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {member.username && <span className="text-xs text-slate-400">@{member.username}</span>}
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                            member.isActive
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}>
                            {member.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => openMemberModal(member)}
                        className="p-2 rounded-lg bg-blue-50 text-blue-500 hover:bg-blue-100 transition-colors"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => handleDeleteMember(member)}
                        className="p-2 rounded-lg bg-red-50 text-red-400 hover:bg-red-100 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Add/Edit Member Modal */}
      <AnimatePresence>
        {isMemberModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              onClick={closeMemberModal}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h3 className="text-lg font-bold text-slate-800">{memberForm.id ? 'Edit Member' : 'Add New Member'}</h3>
                <button onClick={closeMemberModal} className="text-slate-400 hover:text-slate-600 transition-colors bg-white rounded-full p-1 border border-slate-200 shadow-sm">
                  <X size={18} />
                </button>
              </div>
              <form onSubmit={handleSaveMember} className="p-6 space-y-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Full Name</label>
                  <input 
                    type="text" 
                    required
                    value={memberForm.name}
                    onChange={(e) => setMemberForm({...memberForm, name: e.target.value})}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                    placeholder="e.g. John Doe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Username (Optional)</label>
                  <input 
                    type="text" 
                    value={memberForm.username}
                    onChange={(e) => setMemberForm({...memberForm, username: e.target.value})}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                    placeholder="e.g. johndoe_tt"
                  />
                </div>
                <div className="flex items-center gap-3 pt-2">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={memberForm.isActive}
                      onChange={(e) => setMemberForm({...memberForm, isActive: e.target.checked})}
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                  </label>
                  <span className="text-sm font-medium text-slate-700">Active Member</span>
                </div>
                <div className="pt-6 flex gap-3">
                  <button 
                    type="button"
                    onClick={closeMemberModal}
                    className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-600 font-medium rounded-xl hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-xl shadow-sm shadow-emerald-500/20 transition-all disabled:opacity-70"
                  >
                    {isLoading ? 'Saving...' : 'Save Member'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Member Confirm Modal */}
      <ConfirmModal
        isOpen={deleteConfirm.open}
        onClose={() => setDeleteConfirm({ open: false, member: null })}
        onConfirm={confirmDeleteMember}
        type="danger"
        title="Hapus Anggota"
        message={`Apakah Anda yakin ingin menghapus anggota "${deleteConfirm.member?.name}"?`}
        subMessage="Semua catatan transaksi anggota ini juga akan ikut terhapus. Tindakan ini tidak dapat dibatalkan."
        confirmLabel="Hapus Anggota"
        loading={isLoading}
      />
    </div>
  );
};

export default Members;
