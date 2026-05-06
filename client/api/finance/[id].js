import supabase from '../../_lib/supabase.js';
import { setCors, verifyToken } from '../../_lib/auth.js';
import { calculateDeduction } from '../../_lib/calculation.js';

export default async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    verifyToken(req);
  } catch (e) {
    return res.status(401).json({ message: e.message });
  }

  const { id } = req.query;

  // PUT /api/finance/[id]
  if (req.method === 'PUT') {
    try {
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

      const { data, error } = await supabase
        .from('FinanceRecord')
        .update(recordData)
        .eq('id', id)
        .select('*, affiliate:AffiliateMember(*)')
        .single();

      if (error) throw error;
      res.json(data);
    } catch (error) {
      console.error('Update finance record error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }

  // DELETE /api/finance/[id]
  else if (req.method === 'DELETE') {
    try {
      const { error } = await supabase.from('FinanceRecord').delete().eq('id', id);
      if (error) throw error;
      res.json({ message: 'Record deleted successfully' });
    } catch (error) {
      console.error('Delete finance record error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }

  else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}
