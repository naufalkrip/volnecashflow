import supabase from '../_lib/supabase.js';
import { setCors, verifyToken } from '../_lib/auth.js';

const TABLE = 'DailyFinanceTransaction';

const toDateStart = (d) => {
  const dt = new Date(d);
  dt.setHours(0, 0, 0, 0);
  return dt.toISOString();
};

const toDateEnd = (d) => {
  const dt = new Date(d);
  dt.setHours(23, 59, 59, 999);
  return dt.toISOString();
};

export default async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    verifyToken(req);
  } catch (e) {
    return res.status(401).json({ message: e.message });
  }

  if (req.method === 'GET') {
    try {
      let query = supabase
        .from(TABLE)
        .select('*')
        .order('transactionDate', { ascending: false });

      const { search, type, startDate, endDate } = req.query;

      if (startDate) query = query.gte('transactionDate', toDateStart(startDate));
      if (endDate) query = query.lte('transactionDate', toDateEnd(endDate));
      if (type && (type === 'INCOME' || type === 'EXPENSE')) {
        query = query.eq('type', type);
      }

      const { data, error } = await query;
      if (error) throw error;

      let records = data || [];
      if (search) {
        const q = search.toLowerCase();
        records = records.filter(r => r.description?.toLowerCase().includes(q));
      }

      return res.json(records);
    } catch (error) {
      console.error('Get daily records error:', error);
      return res.status(500).json({ message: 'Server error' });
    }
  }

  if (req.method === 'POST') {
    try {
      const { type, description, amount, transactionDate } = req.body;
      if (!description || amount === undefined || amount === null) {
        return res.status(400).json({ message: 'Description and amount are required' });
      }

      const { data, error } = await supabase
        .from(TABLE)
        .insert([{
          type: type || 'INCOME',
          description,
          amount: parseFloat(amount),
          transactionDate: transactionDate ? new Date(transactionDate).toISOString() : new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;
      return res.status(201).json(data);
    } catch (error) {
      console.error('Create daily record error:', error);
      return res.status(500).json({ message: 'Server error' });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
}
