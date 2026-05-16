import supabase from '../_lib/supabase.js';
import { setCors, verifyToken } from '../_lib/auth.js';

export default async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ message: 'Method not allowed' });

  try {
    const decoded = verifyToken(req);
    if (decoded.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const { data: users, error: userError } = await supabase
      .from('User')
      .select('id, role, createdAt');
    if (userError) throw userError;

    const { data: records, error: recError } = await supabase
      .from('FinanceRecord')
      .select('*');
    if (recError) throw recError;

    const { data: members, error: memError } = await supabase
      .from('AffiliateMember')
      .select('id');
    if (memError) throw memError;

    const totalUsers = users.length;
    const totalAdmins = users.filter(u => u.role === 'ADMIN').length;
    const totalMembers = users.filter(u => u.role === 'USER').length;
    const totalAffiliates = members.length;

    const totalIncome = records
      .filter(r => r.type === 'INCOME')
      .reduce((acc, curr) => acc + curr.amount, 0);
    const totalDeduction = records
      .filter(r => r.type === 'INCOME')
      .reduce((acc, curr) => acc + curr.deduction, 0);
    const totalNetAmount = records
      .filter(r => r.type === 'INCOME')
      .reduce((acc, curr) => acc + curr.netAmount, 0);
    const totalWithdrawal = records
      .filter(r => r.type === 'WITHDRAWAL')
      .reduce((acc, curr) => acc + curr.amount, 0);

    res.json({ totalUsers, totalAdmins, totalMembers, totalAffiliates, totalIncome, totalDeduction, totalNetAmount, totalWithdrawal });
  } catch (error) {
    console.error('Get admin stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
}
