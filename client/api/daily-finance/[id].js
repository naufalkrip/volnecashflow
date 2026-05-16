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

  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ message: 'ID is required' });
  }

  if (req.method === 'PUT') {
    try {
      const { type, description, amount, transactionDate } = req.body;
      const updateData = {};
      if (type) updateData.type = type;
      if (description !== undefined) updateData.description = description;
      if (amount !== undefined) updateData.amount = parseFloat(amount);
      if (transactionDate) updateData.transactionDate = new Date(transactionDate).toISOString();

      const { data, error } = await supabase
        .from(TABLE)
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return res.json(data);
    } catch (error) {
      console.error('Update daily record error:', error);
      return res.status(500).json({ message: 'Server error' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const { error } = await supabase.from(TABLE).delete().eq('id', id);
      if (error) throw error;
      return res.json({ message: 'Record deleted successfully' });
    } catch (error) {
      console.error('Delete daily record error:', error);
      return res.status(500).json({ message: 'Server error' });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
}
