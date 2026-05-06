import supabase from '../_lib/supabase.js';
import { setCors, verifyToken } from '../_lib/auth.js';
import { calculateDeduction } from '../_lib/calculation.js';

export default async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    verifyToken(req);
  } catch (e) {
    return res.status(401).json({ message: e.message });
  }

  // GET /api/finance
  if (req.method === 'GET') {
    try {
      const { month, year, search } = req.query;
      let query = supabase
        .from('FinanceRecord')
        .select('*, affiliate:AffiliateMember(*)')
        .order('date', { ascending: false });

      if (month && year) {
        const startDate = new Date(year, month - 1, 1).toISOString();
        const endDate = new Date(year, month, 0, 23, 59, 59).toISOString();
        query = query.gte('date', startDate).lte('date', endDate);
      }

      const { data, error } = await query;
      if (error) throw error;

      let records = data;
      if (search) {
        records = data.filter(r => r.affiliate?.name?.toLowerCase().includes(search.toLowerCase()));
      }

      res.json(records);
    } catch (error) {
      console.error('Get finance records error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }

  // POST /api/finance
  else if (req.method === 'POST') {
    try {
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

      const { data, error } = await supabase
        .from('FinanceRecord')
        .insert([{
          memberId,
          type: recordType,
          amount: parseFloat(amount),
          deduction,
          netAmount,
          status: status || 'COMPLETED',
          date: date ? new Date(date).toISOString() : new Date().toISOString()
        }])
        .select('*, affiliate:AffiliateMember(*)')
        .single();

      if (error) throw error;
      res.status(201).json(data);
    } catch (error) {
      console.error('Create finance record error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }

  else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}
