import supabase from '../config/supabase.js';
import { calculateDeduction } from '../utils/calculation.js';

export const getFinanceRecords = async (req, res) => {
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

    // Filter by affiliate name if search provided
    let records = data;
    if (search) {
      records = data.filter(r => r.affiliate?.name?.toLowerCase().includes(search.toLowerCase()));
    }

    res.json(records);
  } catch (error) {
    console.error('Get finance records error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const createFinanceRecord = async (req, res) => {
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
};

export const updateFinanceRecord = async (req, res) => {
  try {
    const { id } = req.params;
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
};

export const deleteFinanceRecord = async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase.from('FinanceRecord').delete().eq('id', id);
    if (error) throw error;
    res.json({ message: 'Record deleted successfully' });
  } catch (error) {
    console.error('Delete finance record error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getDashboardStats = async (req, res) => {
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
      const key = d.toISOString().split('T')[0]; // YYYY-MM-DD
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

    // Only return days that have data OR the last 14 days always shown
    const chartData = Object.values(dailyData);

    res.json({ totalAmount, totalDeduction, totalNetAmount, totalWithdrawal, chartData });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

