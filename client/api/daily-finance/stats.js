import supabase from '../_lib/supabase.js';
import { setCors, verifyToken } from '../_lib/auth.js';

const TABLE = 'DailyFinanceTransaction';

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
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStart = today.toISOString();
    const todayEnd = new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1).toISOString();

    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .gte('transactionDate', todayStart)
      .lte('transactionDate', todayEnd);

    if (error) throw error;

    const records = data || [];
    const totalIncome = records
      .filter(r => r.type === 'INCOME')
      .reduce((s, r) => s + r.amount, 0);
    const totalExpense = records
      .filter(r => r.type === 'EXPENSE')
      .reduce((s, r) => s + r.amount, 0);

    return res.json({
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense,
      transactionCount: records.length
    });
  } catch (error) {
    console.error('Get daily stats error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
}
