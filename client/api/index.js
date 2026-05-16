import bcrypt from 'bcryptjs';
import supabase from './_lib/supabase.js';
import { setCors, generateToken, verifyToken } from './_lib/auth.js';
import { calculateDeduction } from './_lib/calculation.js';

export default async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (typeof req.body === 'string') {
    try { req.body = JSON.parse(req.body); } catch (e) { req.body = {}; }
  } else if (!req.body || typeof req.body !== 'object') {
    req.body = {};
  }

  const url = new URL(req.url, 'http://localhost');
  const parts = url.pathname.replace(/^\/api\/?/, '').split('/').filter(Boolean);
  const [group, ...rest] = parts;
  const sub = rest.join('/');
  const { search, type, startDate, endDate, month, year } = req.query;

  const respond = (status, data) => res.status(status).json(data);
  const ok = (data) => res.json(data);
  const created = (data) => res.status(201).json(data);
  const methodErr = () => respond(405, { message: 'Method not allowed' });
  const notFound = () => respond(404, { message: 'Not found' });

  try {
    // ───────────────────────────── AUTH ─────────────────────────────
    if (group === 'auth') {
      if (sub === 'login' && req.method === 'POST') {
        const { username, password } = req.body;
        const { data: user } = await supabase.from('User').select('*').eq('username', username).maybeSingle();
        if (!user) return respond(400, { message: 'Invalid credentials' });
        if (!(await bcrypt.compare(password, user.password))) return respond(400, { message: 'Invalid credentials' });
        const token = generateToken({ id: user.id, username: user.username, role: user.role });
        return ok({ message: 'Login successful', user: { id: user.id, name: user.name, username: user.username, role: user.role }, token });
      }

      if (sub === 'register' && req.method === 'POST') {
        const { username, password } = req.body;
        if (!username || !password) return respond(400, { message: 'Username and password are required' });
        if (password.length < 6) return respond(400, { message: 'Password must be at least 6 characters' });
        const { data: existing } = await supabase.from('User').select('id').eq('username', username).maybeSingle();
        if (existing) return respond(400, { message: 'Username already exists' });
        const pw = await bcrypt.hash(password, 10);
        const { error: e } = await supabase.from('User').insert([{ name: username, username, password: pw, role: 'USER' }]);
        if (e) throw e;
        return created({ message: 'Registration successful' });
      }

      if (sub === 'admin-login' && req.method === 'POST') {
        const { username, password } = req.body;
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
        if (!user) return respond(400, { message: 'Invalid credentials' });
        if (!(await bcrypt.compare(password, user.password))) return respond(400, { message: 'Invalid credentials' });
        if (user.role !== 'ADMIN') return respond(403, { message: 'Access denied. Admin only.' });
        const token = generateToken({ id: user.id, username: user.username, role: user.role });
        return ok({ message: 'Admin login successful', user: { id: user.id, name: user.name, username: user.username, role: user.role }, token });
      }

      if (sub === 'me' && req.method === 'GET') {
        const decoded = verifyToken(req);
        const { data: user } = await supabase.from('User').select('id, name, username, role').eq('id', decoded.id).maybeSingle();
        if (!user) return respond(401, { message: 'User not found' });
        return ok({ valid: true, user });
      }

      if (sub === 'users' && req.method === 'GET') {
        const admin = verifyToken(req);
        if (admin.role !== 'ADMIN') return respond(403, { message: 'Admin access required' });
        const { data: users } = await supabase.from('User').select('id, name, username, role, createdAt').order('createdAt', { ascending: false });
        return ok(users);
      }

      if (sub === 'change-credentials' && req.method === 'PUT') {
        const decoded = verifyToken(req);
        const { currentPassword, newUsername, newPassword } = req.body;
        if (!currentPassword) return respond(400, { message: 'Password saat ini wajib diisi' });
        const { data: user } = await supabase.from('User').select('*').eq('id', decoded.id).single();
        if (!user) return respond(404, { message: 'User tidak ditemukan' });
        if (!(await bcrypt.compare(currentPassword, user.password))) return respond(400, { message: 'Password saat ini salah' });
        const upd = { updatedAt: new Date().toISOString() };
        if (newUsername?.trim()) {
          const { data: ex } = await supabase.from('User').select('id').eq('username', newUsername.trim()).neq('id', decoded.id).maybeSingle();
          if (ex) return respond(400, { message: 'Username sudah digunakan' });
          upd.username = newUsername.trim();
        }
        if (newPassword?.trim()) {
          if (newPassword.length < 6) return respond(400, { message: 'Password baru minimal 6 karakter' });
          upd.password = await bcrypt.hash(newPassword, 10);
        }
        if (Object.keys(upd).length === 1) return respond(400, { message: 'Tidak ada perubahan yang disimpan' });
        const { data: updated, error: ue } = await supabase.from('User').update(upd).eq('id', decoded.id).select('id, name, username').single();
        if (ue) throw ue;
        return ok({ message: 'Kredensial berhasil diperbarui', user: updated });
      }

      return notFound();
    }

    // ───────────────────────────── FINANCE ─────────────────────────────
    if (group === 'finance') {
      let decoded;
      try { decoded = verifyToken(req); } catch (e) { return respond(401, { message: e.message }); }

      if (sub === 'dashboard' && req.method === 'GET') {
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
        return ok({ totalAmount, totalDeduction, totalNetAmount, totalWithdrawal, chartData: Object.values(dailyData) });
      }

      if (sub === 'admin-stats' && req.method === 'GET') {
        if (decoded.role !== 'ADMIN') return respond(403, { message: 'Admin access required' });
        const { data: users } = await supabase.from('User').select('id, role, createdAt');
        const { data: records } = await supabase.from('FinanceRecord').select('*');
        const { data: members } = await supabase.from('AffiliateMember').select('id');
        const totalUsers = users.length;
        const totalAdmins = users.filter(u => u.role === 'ADMIN').length;
        const totalMembers = users.filter(u => u.role === 'USER').length;
        const totalAffiliates = members.length;
        const totalIncome = records.filter(r => r.type === 'INCOME').reduce((s, r) => s + r.amount, 0);
        const totalDeduction = records.filter(r => r.type === 'INCOME').reduce((s, r) => s + r.deduction, 0);
        const totalNetAmount = records.filter(r => r.type === 'INCOME').reduce((s, r) => s + r.netAmount, 0);
        const totalWithdrawal = records.filter(r => r.type === 'WITHDRAWAL').reduce((s, r) => s + r.amount, 0);
        return ok({ totalUsers, totalAdmins, totalMembers, totalAffiliates, totalIncome, totalDeduction, totalNetAmount, totalWithdrawal });
      }

      // /api/finance (list + create)
      if (!sub) {
        if (req.method === 'GET') {
          let q = supabase.from('FinanceRecord').select('*, affiliate:AffiliateMember(*)').order('date', { ascending: false });
          if (month && year) { const s = new Date(year, month-1, 1).toISOString(); const e = new Date(year, month, 0, 23, 59, 59).toISOString(); q = q.gte('date', s).lte('date', e); }
          const { data, error } = await q;
          if (error) throw error;
          let records = data;
          if (search) records = data.filter(r => r.affiliate?.name?.toLowerCase().includes(search.toLowerCase()));
          return ok(records);
        }
        if (req.method === 'POST') {
          const { memberId, amount, date, status, type } = req.body;
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
          return created(data);
        }
        return methodErr();
      }

      // /api/finance/[id]
      const finId = sub;
      if (req.method === 'PUT') {
        const { memberId, amount, date, status, type } = req.body;
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
        const { data, error } = await supabase.from('FinanceRecord').update(rd).eq('id', finId).select('*, affiliate:AffiliateMember(*)').single();
        if (error) throw error;
        return ok(data);
      }
      if (req.method === 'DELETE') {
        const { error } = await supabase.from('FinanceRecord').delete().eq('id', finId);
        if (error) throw error;
        return ok({ message: 'Record deleted successfully' });
      }
      return methodErr();
    }

    // ───────────────────────────── MEMBERS ─────────────────────────────
    if (group === 'members') {
      try { verifyToken(req); } catch (e) { return respond(401, { message: e.message }); }

      // /api/members (list + create)
      if (!sub) {
        if (req.method === 'GET') {
          let q = supabase.from('AffiliateMember').select('*').order('createdAt', { ascending: false });
          if (search) q = q.ilike('name', `%${search}%`);
          const { data, error } = await q;
          if (error) throw error;
          return ok(data);
        }
        if (req.method === 'POST') {
          const { name, username, isActive } = req.body;
          const { data, error } = await supabase.from('AffiliateMember').insert([{ name, username, isActive: isActive !== undefined ? isActive : true }]).select().single();
          if (error) throw error;
          return created(data);
        }
        return methodErr();
      }

      // /api/members/[id]
      const memId = sub;
      if (req.method === 'PUT') {
        const { name, username, isActive } = req.body;
        const { data, error } = await supabase.from('AffiliateMember').update({ name, username, isActive, updatedAt: new Date().toISOString() }).eq('id', memId).select().single();
        if (error) throw error;
        return ok(data);
      }
      if (req.method === 'DELETE') {
        const { error } = await supabase.from('AffiliateMember').delete().eq('id', memId);
        if (error) throw error;
        return ok({ message: 'Member deleted successfully' });
      }
      return methodErr();
    }

    // ───────────────────────────── SETTINGS ─────────────────────────────
    if (group === 'settings') {
      try { verifyToken(req); } catch (e) { return respond(401, { message: e.message }); }

      if (req.method === 'GET') {
        let { data: settings } = await supabase.from('Settings').select('*').limit(1).maybeSingle();
        if (!settings) {
          const { data: ns, error: ce } = await supabase.from('Settings').insert([{ deductionPercentage: 30.0, language: 'id' }]).select().single();
          if (ce) throw ce;
          settings = ns;
        }
        return ok(settings);
      }

      if (req.method === 'PUT') {
        const { deductionPercentage, language } = req.body;
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
        return ok(result);
      }

      return methodErr();
    }

    // ───────────────────────────── DAILY FINANCE ─────────────────────────────
    if (group === 'daily-finance') {
      try { verifyToken(req); } catch (e) { return respond(401, { message: e.message }); }

      const T = 'DailyFinanceTransaction';

      if (sub === 'stats' && req.method === 'GET') {
        const today = new Date(); today.setHours(0, 0, 0, 0);
        const ts = today.toISOString();
        const te = new Date(today.getTime() + 24*60*60*1000 - 1).toISOString();
        const { data, error } = await supabase.from(T).select('*').gte('transactionDate', ts).lte('transactionDate', te);
        if (error) throw error;
        const recs = data || [];
        const ti = recs.filter(r => r.type === 'INCOME').reduce((s, r) => s + r.amount, 0);
        const te2 = recs.filter(r => r.type === 'EXPENSE').reduce((s, r) => s + r.amount, 0);
        return ok({ totalIncome: ti, totalExpense: te2, balance: ti - te2, transactionCount: recs.length });
      }

      if (sub === 'report' && req.method === 'GET') {
        let q = supabase.from(T).select('*').order('transactionDate', { ascending: true });
        if (startDate) { const d = new Date(startDate); d.setHours(0,0,0,0); q = q.gte('transactionDate', d.toISOString()); }
        if (endDate) { const d = new Date(endDate); d.setHours(23,59,59,999); q = q.lte('transactionDate', d.toISOString()); }
        const { data, error } = await q;
        if (error) throw error;
        const recs = data || [];
        const ti = recs.filter(r => r.type === 'INCOME').reduce((s, r) => s + r.amount, 0);
        const te = recs.filter(r => r.type === 'EXPENSE').reduce((s, r) => s + r.amount, 0);
        return ok({ records: recs, summary: { totalIncome: ti, totalExpense: te, balance: ti - te, transactionCount: recs.length } });
      }

      // /api/daily-finance (list + create)
      if (!sub) {
        if (req.method === 'GET') {
          let q = supabase.from(T).select('*').order('transactionDate', { ascending: false });
          if (startDate) { const d = new Date(startDate); d.setHours(0,0,0,0); q = q.gte('transactionDate', d.toISOString()); }
          if (endDate) { const d = new Date(endDate); d.setHours(23,59,59,999); q = q.lte('transactionDate', d.toISOString()); }
          if (type && (type === 'INCOME' || type === 'EXPENSE')) q = q.eq('type', type);
          const { data, error } = await q;
          if (error) throw error;
          let recs = data || [];
          if (search) { const qs = search.toLowerCase(); recs = recs.filter(r => r.description?.toLowerCase().includes(qs)); }
          return ok(recs);
        }
        if (req.method === 'POST') {
          const { type, description, amount, transactionDate } = req.body;
          if (!description || amount === undefined || amount === null) return respond(400, { message: 'Description and amount are required' });
          const { data, error } = await supabase.from(T).insert([{ type: type || 'INCOME', description, amount: parseFloat(amount), transactionDate: transactionDate ? new Date(transactionDate).toISOString() : new Date().toISOString() }]).select().single();
          if (error) throw error;
          return created(data);
        }
        return methodErr();
      }

      // /api/daily-finance/[id]
      const dfId = sub;
      if (req.method === 'PUT') {
        const { type, description, amount, transactionDate } = req.body;
        const ud = {};
        if (type) ud.type = type;
        if (description !== undefined) ud.description = description;
        if (amount !== undefined) ud.amount = parseFloat(amount);
        if (transactionDate) ud.transactionDate = new Date(transactionDate).toISOString();
        const { data, error } = await supabase.from(T).update(ud).eq('id', dfId).select().single();
        if (error) throw error;
        return ok(data);
      }
      if (req.method === 'DELETE') {
        const { error } = await supabase.from(T).delete().eq('id', dfId);
        if (error) throw error;
        return ok({ message: 'Record deleted successfully' });
      }
      return methodErr();
    }

    return notFound();
  } catch (error) {
    console.error(`API [${parts.join('/')}] error:`, error.message);
    return respond(500, { message: 'Server error' });
  }
}
