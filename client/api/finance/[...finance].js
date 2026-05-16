import supabase from '../_lib/supabase.js';
import { setCors, verifyToken } from '../_lib/auth.js';
import { calculateDeduction } from '../_lib/calculation.js';

export default async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  let decoded;
  try { decoded = verifyToken(req); } catch (e) { return res.status(401).json({ message: e.message }); }

  const path = (req.query.finance || []).join('/');
  const { month, year, search, id } = req.query;

  try {
    // /api/finance
    if (!path) {
      if (req.method === 'GET') {
        let query = supabase.from('FinanceRecord').select('*, affiliate:AffiliateMember(*)').order('date', { ascending: false });
        if (month && year) {
          const startDate = new Date(year, month - 1, 1).toISOString();
          const endDate = new Date(year, month, 0, 23, 59, 59).toISOString();
          query = query.gte('date', startDate).lte('date', endDate);
        }
        const { data, error } = await query;
        if (error) throw error;
        let records = data;
        if (search) records = data.filter(r => r.affiliate?.name?.toLowerCase().includes(search.toLowerCase()));
        return res.json(records);
      }

      if (req.method === 'POST') {
        const { memberId, amount, date, status, type } = req.body;
        const recordType = type || 'INCOME';
        let deduction = 0;
        let netAmount = parseFloat(amount);
        if (recordType === 'INCOME') {
          const { data: settings } = await supabase.from('Settings').select('*').limit(1).single();
          const deductionPercentage = settings ? settings.deductionPercentage : 30.0;
          const calc = calculateDeduction(parseFloat(amount), deductionPercentage);
          deduction = calc.deduction;
          netAmount = calc.netAmount;
        }
        const { data, error } = await supabase.from('FinanceRecord').insert([{
          memberId, type: recordType, amount: parseFloat(amount), deduction, netAmount,
          status: status || 'COMPLETED', date: date ? new Date(date).toISOString() : new Date().toISOString()
        }]).select('*, affiliate:AffiliateMember(*)').single();
        if (error) throw error;
        return res.status(201).json(data);
      }

      return res.status(405).json({ message: 'Method not allowed' });
    }

    // /api/finance/dashboard
    if (path === 'dashboard') {
      if (req.method !== 'GET') return res.status(405).json({ message: 'Method not allowed' });
      const { data: records } = await supabase.from('FinanceRecord').select('*');
      const income = records.filter(r => r.type === 'INCOME');
      const withdrawal = records.filter(r => r.type === 'WITHDRAWAL');
      const totalAmount = income.reduce((acc, curr) => acc + curr.amount, 0);
      const totalDeduction = income.reduce((acc, curr) => acc + curr.deduction, 0);
      const totalNetAmount = income.reduce((acc, curr) => acc + curr.netAmount, 0);
      const totalWithdrawal = withdrawal.reduce((acc, curr) => acc + curr.amount, 0);
      const dailyData = {};
      const today = new Date();
      for (let i = 29; i >= 0; i--) {
        const d = new Date(today); d.setDate(today.getDate() - i);
        const key = d.toISOString().split('T')[0];
        const label = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
        dailyData[key] = { name: label, date: key, netAmount: 0, amount: 0 };
      }
      (records || []).forEach(record => {
        const key = new Date(record.date).toISOString().split('T')[0];
        if (dailyData[key] && record.type === 'INCOME') {
          dailyData[key].amount += record.amount;
          dailyData[key].netAmount += record.netAmount;
        }
      });
      return res.json({ totalAmount, totalDeduction, totalNetAmount, totalWithdrawal, chartData: Object.values(dailyData) });
    }

    // /api/finance/admin-stats
    if (path === 'admin-stats') {
      if (req.method !== 'GET') return res.status(405).json({ message: 'Method not allowed' });
      if (decoded.role !== 'ADMIN') return res.status(403).json({ message: 'Admin access required' });
      const { data: users } = await supabase.from('User').select('id, role, createdAt');
      const { data: records } = await supabase.from('FinanceRecord').select('*');
      const { data: members } = await supabase.from('AffiliateMember').select('id');
      const totalUsers = users.length;
      const totalAdmins = users.filter(u => u.role === 'ADMIN').length;
      const totalMembers = users.filter(u => u.role === 'USER').length;
      const totalAffiliates = members.length;
      const totalIncome = records.filter(r => r.type === 'INCOME').reduce((acc, curr) => acc + curr.amount, 0);
      const totalDeduction = records.filter(r => r.type === 'INCOME').reduce((acc, curr) => acc + curr.deduction, 0);
      const totalNetAmount = records.filter(r => r.type === 'INCOME').reduce((acc, curr) => acc + curr.netAmount, 0);
      const totalWithdrawal = records.filter(r => r.type === 'WITHDRAWAL').reduce((acc, curr) => acc + curr.amount, 0);
      return res.json({ totalUsers, totalAdmins, totalMembers, totalAffiliates, totalIncome, totalDeduction, totalNetAmount, totalWithdrawal });
    }

    // /api/finance/[id]
    if (/^[0-9a-f-]{36}$/.test(path) || id) {
      const recordId = id || path;
      if (req.method === 'PUT') {
        const { memberId, amount, date, status, type } = req.body;
        let recordData = { updatedAt: new Date().toISOString() };
        if (memberId) recordData.memberId = memberId;
        if (date) recordData.date = new Date(date).toISOString();
        if (status) recordData.status = status;
        if (type) recordData.type = type;
        if (amount !== undefined) {
          const recordType = type || 'INCOME';
          let deduction = 0;
          let netAmount = parseFloat(amount);
          if (recordType === 'INCOME') {
            const { data: settings } = await supabase.from('Settings').select('*').limit(1).single();
            const deductionPercentage = settings ? settings.deductionPercentage : 30.0;
            const calc = calculateDeduction(parseFloat(amount), deductionPercentage);
            deduction = calc.deduction;
            netAmount = calc.netAmount;
          }
          recordData.amount = parseFloat(amount);
          recordData.deduction = deduction;
          recordData.netAmount = netAmount;
        }
        const { data, error } = await supabase.from('FinanceRecord').update(recordData).eq('id', recordId).select('*, affiliate:AffiliateMember(*)').single();
        if (error) throw error;
        return res.json(data);
      }

      if (req.method === 'DELETE') {
        const { error } = await supabase.from('FinanceRecord').delete().eq('id', recordId);
        if (error) throw error;
        return res.json({ message: 'Record deleted successfully' });
      }

      return res.status(405).json({ message: 'Method not allowed' });
    }

    return res.status(404).json({ message: 'Not found' });
  } catch (error) {
    console.error(`Finance handler [${path}] error:`, error);
    return res.status(500).json({ message: 'Server error' });
  }
}
