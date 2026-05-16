import { create } from 'zustand';
import api from '../services/api';
import toast from 'react-hot-toast';

export const useDailyFinanceStore = create((set, get) => ({
  records: [],
  stats: { totalIncome: 0, totalExpense: 0, balance: 0, transactionCount: 0 },
  groups: [],
  selectedGroup: null,
  isLoading: false,
  error: null,

  fetchRecords: async (params = {}, silent = false) => {
    if (!silent) set({ isLoading: true, error: null });
    try {
      const response = await api.get('/daily-finance', { params });
      set({ records: response.data, isLoading: false });
    } catch (error) {
      set({ error: error.message, isLoading: false });
    }
  },

  fetchStats: async () => {
    try {
      const response = await api.get('/daily-finance/stats');
      set({ stats: response.data });
    } catch (error) {
      console.error('Fetch daily stats error:', error);
    }
  },

  fetchGroups: async () => {
    try {
      const response = await api.get('/daily-finance/groups');
      set({ groups: response.data });
    } catch (error) {
      console.error('Fetch groups error:', error);
    }
  },

  createGroup: async (name) => {
    set({ isLoading: true, error: null });
    try {
      await api.post('/daily-finance/groups', { name });
      set({ isLoading: false });
      get().fetchGroups();
      toast.success('Grup berhasil dibuat');
      return true;
    } catch (error) {
      const msg = error.response?.data?.message || 'Gagal membuat grup';
      set({ error: msg, isLoading: false });
      toast.error(msg);
      return false;
    }
  },

  renameGroup: async (id, name) => {
    set({ isLoading: true, error: null });
    try {
      await api.put(`/daily-finance/groups/${id}`, { name });
      set({ isLoading: false });
      get().fetchGroups();
      const { selectedGroup } = get();
      if (selectedGroup?.id === id) {
        set({ selectedGroup: { ...selectedGroup, name } });
        get().fetchRecords({ group: name }, true);
      }
      toast.success('Grup berhasil diubah');
      return true;
    } catch (error) {
      const msg = error.response?.data?.message || 'Gagal mengubah grup';
      set({ error: msg, isLoading: false });
      toast.error(msg);
      return false;
    }
  },

  deleteGroup: async (id) => {
    try {
      await api.delete(`/daily-finance/groups/${id}`);
      get().fetchGroups();
      const { selectedGroup } = get();
      if (selectedGroup?.id === id) {
        set({ selectedGroup: null });
      }
      toast.success('Grup berhasil dihapus');
      return true;
    } catch (error) {
      const msg = error.response?.data?.message || 'Gagal menghapus grup';
      toast.error(msg);
      return false;
    }
  },

  setSelectedGroup: (group) => {
    set({ selectedGroup: group });
  },

  addRecord: async (recordData) => {
    set({ isLoading: true, error: null });
    try {
      await api.post('/daily-finance', recordData);
      set({ isLoading: false });
      const { selectedGroup } = get();
      const params = selectedGroup ? { group: selectedGroup.name } : {};
      get().fetchRecords(params, true);
      get().fetchStats();
      toast.success('Transaksi berhasil ditambahkan');
      return true;
    } catch (error) {
      const msg = error.response?.data?.message || 'Gagal menambahkan transaksi';
      set({ error: msg, isLoading: false });
      toast.error(msg);
      return false;
    }
  },

  updateRecord: async (id, recordData) => {
    set({ isLoading: true, error: null });
    try {
      await api.put(`/daily-finance/${id}`, recordData);
      set({ isLoading: false });
      const { selectedGroup } = get();
      const params = selectedGroup ? { group: selectedGroup.name } : {};
      get().fetchRecords(params, true);
      get().fetchStats();
      toast.success('Transaksi berhasil diperbarui');
      return true;
    } catch (error) {
      const msg = error.response?.data?.message || 'Gagal memperbarui transaksi';
      set({ error: msg, isLoading: false });
      toast.error(msg);
      return false;
    }
  },

  deleteRecord: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await api.delete(`/daily-finance/${id}`);
      set({ isLoading: false });
      const { selectedGroup } = get();
      const params = selectedGroup ? { group: selectedGroup.name } : {};
      get().fetchRecords(params, true);
      get().fetchStats();
      toast.success('Transaksi berhasil dihapus');
      return true;
    } catch (error) {
      const msg = error.response?.data?.message || 'Gagal menghapus transaksi';
      set({ error: msg, isLoading: false });
      toast.error(msg);
      return false;
    }
  }
}));
