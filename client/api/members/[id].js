import supabase from '../_lib/supabase.js';
import { setCors, verifyToken } from '../_lib/auth.js';

export default async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    verifyToken(req);
  } catch (e) {
    return res.status(401).json({ message: e.message });
  }

  const { id } = req.query;

  // PUT /api/members/[id]
  if (req.method === 'PUT') {
    try {
      const { name, username, isActive } = req.body;
      const { data, error } = await supabase
        .from('AffiliateMember')
        .update({ name, username, isActive, updatedAt: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      res.json(data);
    } catch (error) {
      console.error('Update member error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }

  // DELETE /api/members/[id]
  else if (req.method === 'DELETE') {
    try {
      const { error } = await supabase.from('AffiliateMember').delete().eq('id', id);
      if (error) throw error;
      res.json({ message: 'Member deleted successfully' });
    } catch (error) {
      console.error('Delete member error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }

  else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}
