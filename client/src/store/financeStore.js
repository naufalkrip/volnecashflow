import { create } from 'zustand';
import api from '../services/api';
import toast from 'react-hot-toast';

export const useFinanceStore = create((set, get) => ({
  user: null,
  token: localStorage.getItem('token') || null,
  isAuthenticated: false, // DON'T trust token immediately
  isCheckingAuth: true, // App starts in loading state
  records: [],
  members: [],
  dashboardStats: null,
  settings: null,
  isLoading: false,
  error: null,
  pollingIntervalId: null,

  startPolling: () => {
    // Prevent multiple intervals
    if (get().pollingIntervalId) return;
    
    const interval = setInterval(() => {
      if (get().isAuthenticated) {
        get().fetchDashboardStats(true);
        get().fetchRecords({}, true);
        get().fetchMembers({}, true);
      }
    }, 5000); // Poll every 5 seconds
    
    set({ pollingIntervalId: interval });
  },

  stopPolling: () => {
    const { pollingIntervalId } = get();
    if (pollingIntervalId) {
      clearInterval(pollingIntervalId);
      set({ pollingIntervalId: null });
    }
  },

  checkAuth: async () => {
    set({ isCheckingAuth: true });
    try {
      const response = await api.get('/auth/me');
      set({ 
        isAuthenticated: true, 
        user: response.data.user,
        isCheckingAuth: false 
      });
    } catch (error) {
      // Invalid token or no token
      localStorage.removeItem('token');
      set({ 
        isAuthenticated: false, 
        user: null,
        token: null,
        isCheckingAuth: false 
      });
    }
  },

  login: async (username, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/auth/login', { username, password });
      const { user, token } = response.data;
      localStorage.setItem('token', token);
      set({ user, token, isAuthenticated: true, isLoading: false });
      toast.success('Login successful!');
      return true;
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message || 'Login failed';
      set({ error: errorMsg, isLoading: false });
      toast.error(errorMsg);
      return false;
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    get().stopPolling();
    set({ user: null, token: null, isAuthenticated: false, records: [], members: [], dashboardStats: null });
  },

  fetchDashboardStats: async (silent = false) => {
    if (!silent) set({ isLoading: true, error: null });
    try {
      const response = await api.get('/finance/dashboard');
      set({ dashboardStats: response.data, isLoading: false });
    } catch (error) {
      set({ error: error.message, isLoading: false });
    }
  },

  fetchRecords: async (params = {}, silent = false) => {
    if (!silent) set({ isLoading: true, error: null });
    try {
      const response = await api.get('/finance', { params });
      set({ records: response.data, isLoading: false });
    } catch (error) {
      set({ error: error.message, isLoading: false });
    }
  },

  addRecord: async (recordData) => {
    set({ isLoading: true, error: null });
    try {
      await api.post('/finance', recordData);
      set({ isLoading: false });
      get().fetchRecords();
      get().fetchDashboardStats();
      return true;
    } catch (error) {
      set({ error: error.message, isLoading: false });
      return false;
    }
  },

  updateRecord: async (id, recordData) => {
    set({ isLoading: true, error: null });
    try {
      await api.put(`/finance/${id}`, recordData);
      set({ isLoading: false });
      get().fetchRecords();
      get().fetchDashboardStats();
      return true;
    } catch (error) {
      set({ error: error.message, isLoading: false });
      return false;
    }
  },

  deleteRecord: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await api.delete(`/finance/${id}`);
      set({ isLoading: false });
      get().fetchRecords();
      get().fetchDashboardStats();
      return true;
    } catch (error) {
      set({ error: error.message, isLoading: false });
      return false;
    }
  },

  fetchSettings: async () => {
    try {
      const response = await api.get('/settings');
      set({ settings: response.data });
    } catch (error) {
      console.error(error);
    }
  },

  updateSettings: async (settingsData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.put('/settings', settingsData);
      set({ settings: response.data, isLoading: false });
      toast.success('Settings saved successfully');
      return true;
    } catch (error) {
      set({ error: error.message, isLoading: false });
      toast.error('Failed to save settings');
      return false;
    }
  },

  fetchMembers: async (params = {}, silent = false) => {
    if (!silent) set({ isLoading: true, error: null });
    try {
      const response = await api.get('/members', { params });
      set({ members: response.data, isLoading: false });
    } catch (error) {
      set({ error: error.message, isLoading: false });
    }
  },

  addMember: async (memberData) => {
    set({ isLoading: true, error: null });
    try {
      await api.post('/members', memberData);
      set({ isLoading: false });
      get().fetchMembers();
      toast.success('Member added successfully');
      return true;
    } catch (error) {
      set({ error: error.message, isLoading: false });
      toast.error('Failed to add member');
      return false;
    }
  },

  updateMember: async (id, memberData) => {
    set({ isLoading: true, error: null });
    try {
      await api.put(`/members/${id}`, memberData);
      set({ isLoading: false });
      get().fetchMembers();
      toast.success('Member updated successfully');
      return true;
    } catch (error) {
      set({ error: error.message, isLoading: false });
      toast.error('Failed to update member');
      return false;
    }
  },

  deleteMember: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await api.delete(`/members/${id}`);
      set({ isLoading: false });
      get().fetchMembers();
      toast.success('Member deleted successfully');
      return true;
    } catch (error) {
      set({ error: error.message, isLoading: false });
      toast.error('Failed to delete member');
      return false;
    }
  }
}));
