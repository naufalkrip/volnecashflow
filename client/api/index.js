import express from 'express';
import bcrypt from 'bcryptjs';
import supabase from './_lib/supabase.js';
import { generateToken, verifyToken } from './_lib/auth.js';
import { calculateDeduction } from './_lib/calculation.js';

const app = express();

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  next();
});

app.use((req, res, next) => {
  if (req.method === 'GET' || req.method === 'OPTIONS' || req.body) return next();
  let data = '';
  req.on('data', chunk => data += chunk);
  req.on('end', () => {
    try { req.body = JSON.parse(data); } catch (e) { req.body = {}; }
    next();
  });
});

function auth(req, res, next) {
  try { req.user = verifyToken(req); next(); }
  catch (e) { return res.status(401).json({ message: e.message }); }
}

function adminOnly(req, res, next) {
  if (req.user?.role !== 'ADMIN') return res.status(403).json({ message: 'Admin access required' });
  next();
}

// ── AUTH ──
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body || {};
  const { data: user } = await supabase.from('User').select('*').eq('username', username).maybeSingle();
  if (!user) return res.status(400).json({ message: 'Invalid credentials' });
  if (!(await bcrypt.compare(password, user.password))) return res.status(400).json({ message: 'Invalid credentials' });
  const token = generateToken({ id: user.id, username: user.username, role: user.role });
  return res.json({ message: 'Login successful', user: { id: user.id, name: user.name, username: user.username, role: user.role }, token });
});

app.post('/api/auth/register', async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) return res.status(400).json({ message: 'Username and password are required' });
  if (password.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters' });
  const { data: existing } = await supabase.from('User').select('id').eq('username', username).maybeSingle();
  if (existing) return res.status(400).json({ message: 'Username already exists' });
  const pw = await bcrypt.hash(password, 10);
  const { error: e } = await supabase.from('User').insert([{ name: username, username, password: pw, role: 'USER' }]);
  if (e) throw e;
  return res.status(201).json({ message: 'Registration successful' });
});

app.post('/api/auth/admin-login', async (req, res) => {
  const { username, password } = req.body || {};
  let { data: user } = await supabase.from('User').select('*').eq('username', username).maybeSingle();
  if (username === 'admin') {
    const pw = await bcrypt.hash('admin123', 10);
    if (!user) {
      const { data: nu, error: ce } = await supabase.from('User').insert([{ name: 'Admin', username: 'admin', password: pw, role: 'ADMIN' }]).select().single();
      if (ce) throw ce;
      user = nu;
    } else {
      const upd = {};
      if (!(await bcrypt.compare(password, user.password))) upd.password = pw;
      if (user.role !== 'ADMIN') upd.role = 'ADMIN';
      if (Object.keys(upd).length) {
        const { data: nu, error: ue } = await supabase.from('User').update(upd).eq('id', user.id).select().single();
        if (ue) throw ue;
        user = nu;
      }
    }
  }
  if (!user) return res.status(400).json({ message: 'Invalid credentials' });
  if (!(await bcrypt.compare(password, user.password))) return res.status(400).json({ message: 'Invalid credentials' });
  if (user.role !== 'ADMIN') return res.status(403).json({ message: 'Access denied. Admin only.' });
  const token = generateToken({ id: user.id, username: user.username, role: user.role });
  return res.json({ message: 'Admin login successful', user: { id: user.id, name: user.name, username: user.username, role: user.role }, token });
});

app.get('/api/auth/me', auth, async (req, res) => {
  const { data: user } = await supabase.from('User').select('id, name, username, role').eq('id', req.user.id).maybeSingle();
  if (!user) return res.status(401).json({ message: 'User not found' });
  return res.json({ valid: true, user });
});

app.get('/api/auth/users', auth, adminOnly, async (req, res) => {
  const { data: users } = await supabase.from('User').select('id, name, username, role, createdAt').order('createdAt', { ascending: false });
  return res.json(users);
});

app.put('/api/auth/change-credentials', auth, async (req, res) => {
  const { currentPassword, newUsername, newPassword } = req.body || {};
  if (!currentPassword) return res.status(400).json({ message: 'Password saat ini wajib diisi' });
  const { data: user } = await supabase.from('User').select('*').eq('id', req.user.id).single();
  if (!user) return res.status(404).json({ message: 'User tidak ditemukan' });
  if (!(await bcrypt.compare(currentPassword, user.password))) return res.status(400).json({ message: 'Password saat ini salah' });
  const upd = { updatedAt: new Date().toISOString() };
  if (newUsername?.trim()) {
    const { data: ex } = await supabase.from('User').select('id').eq('username', newUsername.trim()).neq('id', req.user.id).maybeSingle();
    if (ex) return res.status(400).json({ message: 'Username sudah digunakan' });
    upd.username = newUsername.trim();
  }
  if (newPassword?.trim()) {
    if (newPassword.length < 6) return res.status(400).json({ message: 'Password baru minimal 6 karakter' });
    upd.password = await bcrypt.hash(newPassword, 10);
  }
  if (Object.keys(upd).length === 1) return res.status(400).json({ message: 'Tidak ada perubahan yang disimpan' });
  const { data: updated, error: ue } = await supabase.from('User').update(upd).eq('id', req.user.id).select('id, name, username').single();
  if (ue) throw ue;
  return res.json({ message: 'Kredensial berhasil diperbarui', user: updated });
});

// ── FINANCE ──
app.get('/api/finance/dashboard', auth, async (req, res) => {
  const { data: records } = await supabase.from('FinanceRecord').select('*');
  const income = records.filter(r => r.type === 'INCOME');
  const withdrawal = records.filter(r => r.type === 'WITHDRAWAL');
  const totalAmount = income.reduce((s, r) => s + r.amount, 0);
  const totalDeduction = income.reduce((s, r) => s + r.deduction, 0);
  const totalNetAmount = income.reduce((s, r) => s + r.netAmount, 0);
  const totalWithdrawal = withdrawal.reduce((s, r) => s + r.amount, 0);
  const dailyData = {};
  const today = new Date();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today); d.setDate(today.getDate() - i);
    const key = d.toISOString().split('T')[0];
    dailyData[key] = { name: `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}`, date: key, netAmount: 0, amount: 0 };
  }
  (records || []).forEach(r => { const k = new Date(r.date).toISOString().split('T')[0]; if (dailyData[k] && r.type === 'INCOME') { dailyData[k].amount += r.amount; dailyData[k].netAmount += r.netAmount; } });
  return res.json({ totalAmount, totalDeduction, totalNetAmount, totalWithdrawal, chartData: Object.values(dailyData) });
});

app.get('/api/finance/admin-stats', auth, adminOnly, async (req, res) => {
  const [urs, recs, mems] = await Promise.all([
    supabase.from('User').select('id, role, createdAt'),
    supabase.from('FinanceRecord').select('*'),
    supabase.from('AffiliateMember').select('id')
  ]);
  return res.json({
    totalUsers: urs.data.length, totalAdmins: urs.data.filter(u => u.role === 'ADMIN').length,
    totalMembers: urs.data.filter(u => u.role === 'USER').length, totalAffiliates: mems.data.length,
    totalIncome: recs.data.filter(r => r.type === 'INCOME').reduce((s, r) => s + r.amount, 0),
    totalDeduction: recs.data.filter(r => r.type === 'INCOME').reduce((s, r) => s + r.deduction, 0),
    totalNetAmount: recs.data.filter(r => r.type === 'INCOME').reduce((s, r) => s + r.netAmount, 0),
    totalWithdrawal: recs.data.filter(r => r.type === 'WITHDRAWAL').reduce((s, r) => s + r.amount, 0)
  });
});

app.get('/api/finance', auth, async (req, res) => {
  let q = supabase.from('FinanceRecord').select('*, affiliate:AffiliateMember(*)').order('date', { ascending: false });
  const { month, year, search } = req.query;
  if (month && year) { const s = new Date(year, month-1, 1).toISOString(); const e = new Date(year, month, 0, 23, 59, 59).toISOString(); q = q.gte('date', s).lte('date', e); }
  const { data, error } = await q;
  if (error) throw error;
  let records = data;
  if (search) records = data.filter(r => r.affiliate?.name?.toLowerCase().includes(search.toLowerCase()));
  return res.json(records);
});

app.post('/api/finance', auth, async (req, res) => {
  const { memberId, amount, date, status, type } = req.body || {};
  const rt = type || 'INCOME';
  let ded = 0, net = parseFloat(amount);
  if (rt === 'INCOME') {
    const { data: settings } = await supabase.from('Settings').select('*').limit(1).single();
    const pct = settings ? settings.deductionPercentage : 30.0;
    const calc = calculateDeduction(parseFloat(amount), pct);
    ded = calc.deduction; net = calc.netAmount;
  }
  const { data, error } = await supabase.from('FinanceRecord').insert([{
    memberId, type: rt, amount: parseFloat(amount), deduction: ded, netAmount: net,
    status: status || 'COMPLETED', date: date ? new Date(date).toISOString() : new Date().toISOString()
  }]).select('*, affiliate:AffiliateMember(*)').single();
  if (error) throw error;
  return res.status(201).json(data);
});

app.put('/api/finance/:id', auth, async (req, res) => {
  const { memberId, amount, date, status, type } = req.body || {};
  const rd = { updatedAt: new Date().toISOString() };
  if (memberId) rd.memberId = memberId;
  if (date) rd.date = new Date(date).toISOString();
  if (status) rd.status = status;
  if (type) rd.type = type;
  if (amount !== undefined) {
    const rt = type || 'INCOME'; let ded = 0, net = parseFloat(amount);
    if (rt === 'INCOME') {
      const { data: settings } = await supabase.from('Settings').select('*').limit(1).single();
      const pct = settings ? settings.deductionPercentage : 30.0;
      const calc = calculateDeduction(parseFloat(amount), pct);
      ded = calc.deduction; net = calc.netAmount;
    }
    rd.amount = parseFloat(amount); rd.deduction = ded; rd.netAmount = net;
  }
  const { data, error } = await supabase.from('FinanceRecord').update(rd).eq('id', req.params.id).select('*, affiliate:AffiliateMember(*)').single();
  if (error) throw error;
  return res.json(data);
});

app.delete('/api/finance/:id', auth, async (req, res) => {
  const { error } = await supabase.from('FinanceRecord').delete().eq('id', req.params.id);
  if (error) throw error;
  return res.json({ message: 'Record deleted successfully' });
});

// ── MEMBERS ──
app.get('/api/members', auth, async (req, res) => {
  let q = supabase.from('AffiliateMember').select('*').order('createdAt', { ascending: false });
  const { search } = req.query;
  if (search) q = q.ilike('name', `%${search}%`);
  const { data, error } = await q;
  if (error) throw error;
  return res.json(data);
});

app.post('/api/members', auth, async (req, res) => {
  const { name, username, isActive } = req.body || {};
  const { data, error } = await supabase.from('AffiliateMember').insert([{ name, username, isActive: isActive !== undefined ? isActive : true }]).select().single();
  if (error) throw error;
  return res.status(201).json(data);
});

app.put('/api/members/:id', auth, async (req, res) => {
  const { name, username, isActive } = req.body || {};
  const { data, error } = await supabase.from('AffiliateMember').update({ name, username, isActive, updatedAt: new Date().toISOString() }).eq('id', req.params.id).select().single();
  if (error) throw error;
  return res.json(data);
});

app.delete('/api/members/:id', auth, async (req, res) => {
  const { error } = await supabase.from('AffiliateMember').delete().eq('id', req.params.id);
  if (error) throw error;
  return res.json({ message: 'Member deleted successfully' });
});

// ── SETTINGS ──
app.get('/api/settings', auth, async (req, res) => {
  let { data: settings } = await supabase.from('Settings').select('*').limit(1).maybeSingle();
  if (!settings) {
    const { data: ns, error: ce } = await supabase.from('Settings').insert([{ deductionPercentage: 30.0, language: 'id' }]).select().single();
    if (ce) throw ce;
    settings = ns;
  }
  return res.json(settings);
});

app.put('/api/settings', auth, async (req, res) => {
  const { deductionPercentage, language } = req.body || {};
  const ud = { updatedAt: new Date().toISOString() };
  if (deductionPercentage !== undefined) ud.deductionPercentage = parseFloat(deductionPercentage);
  if (language !== undefined) ud.language = language;
  let { data: settings } = await supabase.from('Settings').select('*').limit(1).maybeSingle();
  let result;
  if (settings) {
    const { data, error } = await supabase.from('Settings').update(ud).eq('id', settings.id).select().single();
    if (error) throw error;
    result = data;
  } else {
    const { data, error } = await supabase.from('Settings').insert([{ deductionPercentage: deductionPercentage ?? 30.0, language: language || 'id' }]).select().single();
    if (error) throw error;
    result = data;
  }
  return res.json(result);
});

// ── DAILY FINANCE ──
const T = 'DailyFinanceTransaction';

app.get('/api/daily-finance/stats', auth, async (req, res) => {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const ts = today.toISOString();
  const te = new Date(today.getTime() + 24*60*60*1000 - 1).toISOString();
  const { data, error } = await supabase.from(T).select('*').gte('transactionDate', ts).lte('transactionDate', te);
  if (error) throw error;
  const recs = data || [];
  const ti = recs.filter(r => r.type === 'INCOME').reduce((s, r) => s + r.amount, 0);
  const te2 = recs.filter(r => r.type === 'EXPENSE').reduce((s, r) => s + r.amount, 0);
  return res.json({ totalIncome: ti, totalExpense: te2, balance: ti - te2, transactionCount: recs.length });
});

app.get('/api/daily-finance/report', auth, async (req, res) => {
  let q = supabase.from(T).select('*').order('transactionDate', { ascending: true });
  const { startDate, endDate } = req.query;
  if (startDate) { const d = new Date(startDate); d.setHours(0,0,0,0); q = q.gte('transactionDate', d.toISOString()); }
  if (endDate) { const d = new Date(endDate); d.setHours(23,59,59,999); q = q.lte('transactionDate', d.toISOString()); }
  const { data, error } = await q;
  if (error) throw error;
  const recs = data || [];
  const ti = recs.filter(r => r.type === 'INCOME').reduce((s, r) => s + r.amount, 0);
  const te = recs.filter(r => r.type === 'EXPENSE').reduce((s, r) => s + r.amount, 0);
  return res.json({ records: recs, summary: { totalIncome: ti, totalExpense: te, balance: ti - te, transactionCount: recs.length } });
});

app.get('/api/daily-finance', auth, async (req, res) => {
  let q = supabase.from(T).select('*').order('transactionDate', { ascending: false });
  const { startDate, endDate, type, search } = req.query;
  if (startDate) { const d = new Date(startDate); d.setHours(0,0,0,0); q = q.gte('transactionDate', d.toISOString()); }
  if (endDate) { const d = new Date(endDate); d.setHours(23,59,59,999); q = q.lte('transactionDate', d.toISOString()); }
  if (type && (type === 'INCOME' || type === 'EXPENSE')) q = q.eq('type', type);
  const { data, error } = await q;
  if (error) throw error;
  let recs = data || [];
  if (search) { const qs = search.toLowerCase(); recs = recs.filter(r => r.description?.toLowerCase().includes(qs)); }
  return res.json(recs);
});

app.post('/api/daily-finance', auth, async (req, res) => {
  const { type, description, amount, transactionDate } = req.body || {};
  if (!description || amount === undefined || amount === null) return res.status(400).json({ message: 'Description and amount are required' });
  const { data, error } = await supabase.from(T).insert([{ type: type || 'INCOME', description, amount: parseFloat(amount), transactionDate: transactionDate ? new Date(transactionDate).toISOString() : new Date().toISOString() }]).select().single();
  if (error) throw error;
  return res.status(201).json(data);
});

app.put('/api/daily-finance/:id', auth, async (req, res) => {
  const { type, description, amount, transactionDate } = req.body || {};
  const ud = {};
  if (type) ud.type = type;
  if (description !== undefined) ud.description = description;
  if (amount !== undefined) ud.amount = parseFloat(amount);
  if (transactionDate) ud.transactionDate = new Date(transactionDate).toISOString();
  const { data, error } = await supabase.from(T).update(ud).eq('id', req.params.id).select().single();
  if (error) throw error;
  return res.json(data);
});

app.delete('/api/daily-finance/:id', auth, async (req, res) => {
  const { error } = await supabase.from(T).delete().eq('id', req.params.id);
  if (error) throw error;
  return res.json({ message: 'Record deleted successfully' });
});

// ── Error handler ──
app.use((err, req, res, next) => {
  console.error('API error:', err.message);
  res.status(500).json({ message: 'Server error' });
});

export default app;
