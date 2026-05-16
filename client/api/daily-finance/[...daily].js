import supabase from '../_lib/supabase.js';
import { setCors, verifyToken } from '../_lib/auth.js';

const TABLE = 'DailyFinanceTransaction';

const toDateStart = (d) => { const dt = new Date(d); dt.setHours(0, 0, 0, 0); return dt.toISOString(); };
const toDateEnd = (d) => { const dt = new Date(d); dt.setHours(23, 59, 59, 999); return dt.toISOString(); };

export default async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  try { verifyToken(req); } catch (e) { return res.status(401).json({ message: e.message }); }

  const path = (req.query.daily || []).join('/');
  const { search, type, startDate, endDate, id } = req.query;

  try {
    // /api/daily-finance
    if (!path) {
      if (req.method === 'GET') {
        let query = supabase.from(TABLE).select('*').order('transactionDate', { ascending: false });
        if (startDate) query = query.gte('transactionDate', toDateStart(startDate));
        if (endDate) query = query.lte('transactionDate', toDateEnd(endDate));
        if (type && (type === 'INCOME' || type === 'EXPENSE')) query = query.eq('type', type);
        const { data, error } = await query;
        if (error) throw error;
        let records = data || [];
        if (search) { const q = search.toLowerCase(); records = records.filter(r => r.description?.toLowerCase().includes(q)); }
        return res.json(records);
      }

      if (req.method === 'POST') {
        const { type, description, amount, transactionDate } = req.body;
        if (!description || amount === undefined || amount === null) return res.status(400).json({ message: 'Description and amount are required' });
        const { data, error } = await supabase.from(TABLE).insert([{
          type: type || 'INCOME', description, amount: parseFloat(amount),
          transactionDate: transactionDate ? new Date(transactionDate).toISOString() : new Date().toISOString()
        }]).select().single();
        if (error) throw error;
        return res.status(201).json(data);
      }

      return res.status(405).json({ message: 'Method not allowed' });
    }

    // /api/daily-finance/stats
    if (path === 'stats') {
      if (req.method !== 'GET') return res.status(405).json({ message: 'Method not allowed' });
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const todayStart = today.toISOString();
      const todayEnd = new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1).toISOString();
      const { data, error } = await supabase.from(TABLE).select('*').gte('transactionDate', todayStart).lte('transactionDate', todayEnd);
      if (error) throw error;
      const records = data || [];
      const totalIncome = records.filter(r => r.type === 'INCOME').reduce((s, r) => s + r.amount, 0);
      const totalExpense = records.filter(r => r.type === 'EXPENSE').reduce((s, r) => s + r.amount, 0);
      return res.json({ totalIncome, totalExpense, balance: totalIncome - totalExpense, transactionCount: records.length });
    }

    // /api/daily-finance/report
    if (path === 'report') {
      if (req.method !== 'GET') return res.status(405).json({ message: 'Method not allowed' });
      let query = supabase.from(TABLE).select('*').order('transactionDate', { ascending: true });
      if (startDate) query = query.gte('transactionDate', toDateStart(startDate));
      if (endDate) query = query.lte('transactionDate', toDateEnd(endDate));
      const { data, error } = await query;
      if (error) throw error;
      const records = data || [];
      const totalIncome = records.filter(r => r.type === 'INCOME').reduce((s, r) => s + r.amount, 0);
      const totalExpense = records.filter(r => r.type === 'EXPENSE').reduce((s, r) => s + r.amount, 0);
      return res.json({ records, summary: { totalIncome, totalExpense, balance: totalIncome - totalExpense, transactionCount: records.length } });
    }

    // /api/daily-finance/[id]
    const recordId = id || path;
    if (req.method === 'PUT') {
      const { type, description, amount, transactionDate } = req.body;
      const updateData = {};
      if (type) updateData.type = type;
      if (description !== undefined) updateData.description = description;
      if (amount !== undefined) updateData.amount = parseFloat(amount);
      if (transactionDate) updateData.transactionDate = new Date(transactionDate).toISOString();
      const { data, error } = await supabase.from(TABLE).update(updateData).eq('id', recordId).select().single();
      if (error) throw error;
      return res.json(data);
    }

    if (req.method === 'DELETE') {
      const { error } = await supabase.from(TABLE).delete().eq('id', recordId);
      if (error) throw error;
      return res.json({ message: 'Record deleted successfully' });
    }

    return res.status(405).json({ message: 'Method not allowed' });
  } catch (error) {
    console.error(`Daily finance handler [${path}] error:`, error);
    return res.status(500).json({ message: 'Server error' });
  }
}
