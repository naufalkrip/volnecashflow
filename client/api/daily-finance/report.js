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

  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    let query = supabase
      .from(TABLE)
      .select('*')
      .order('transactionDate', { ascending: true });

    const { startDate, endDate } = req.query;

    if (startDate) query = query.gte('transactionDate', toDateStart(startDate));
    if (endDate) query = query.lte('transactionDate', toDateEnd(endDate));

    const { data, error } = await query;
    if (error) throw error;

    const records = data || [];
    const totalIncome = records
      .filter(r => r.type === 'INCOME')
      .reduce((s, r) => s + r.amount, 0);
    const totalExpense = records
      .filter(r => r.type === 'EXPENSE')
      .reduce((s, r) => s + r.amount, 0);

    return res.json({
      records,
      summary: {
        totalIncome,
        totalExpense,
        balance: totalIncome - totalExpense,
        transactionCount: records.length
      }
    });
  } catch (error) {
    console.error('Get daily report error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
}
