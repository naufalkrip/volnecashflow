import supabase from '../_lib/supabase.js';
import { setCors, verifyToken } from '../_lib/auth.js';

export default async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ message: 'Method not allowed' });

  try {
    verifyToken(req);
  } catch (e) {
    return res.status(401).json({ message: e.message });
  }

  try {
    const { data: records, error } = await supabase
      .from('FinanceRecord')
      .select('*');
    if (error) throw error;

    const income = records.filter(r => r.type === 'INCOME');
    const withdrawal = records.filter(r => r.type === 'WITHDRAWAL');

    const totalAmount = income.reduce((acc, curr) => acc + curr.amount, 0);
    const totalDeduction = income.reduce((acc, curr) => acc + curr.deduction, 0);
    const totalNetAmount = income.reduce((acc, curr) => acc + curr.netAmount, 0);
    const totalWithdrawal = withdrawal.reduce((acc, curr) => acc + curr.amount, 0);

    // Build daily chart data — last 30 days
    const dailyData = {};
    const today = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const key = d.toISOString().split('T')[0];
      const label = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
      dailyData[key] = { name: label, date: key, netAmount: 0, amount: 0 };
    }

    records.forEach(record => {
      const key = new Date(record.date).toISOString().split('T')[0];
      if (dailyData[key] && record.type === 'INCOME') {
        dailyData[key].amount += record.amount;
        dailyData[key].netAmount += record.netAmount;
      }
    });

    const chartData = Object.values(dailyData);
    res.json({ totalAmount, totalDeduction, totalNetAmount, totalWithdrawal, chartData });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
}
