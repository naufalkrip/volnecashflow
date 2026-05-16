import supabase from '../_lib/supabase.js';
import { setCors, verifyToken } from '../_lib/auth.js';

export default async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  try { verifyToken(req); } catch (e) { return res.status(401).json({ message: e.message }); }

  const path = (req.query.members || []).join('/');
  const { search, id } = req.query;

  try {
    // /api/members
    if (!path) {
      if (req.method === 'GET') {
        let query = supabase.from('AffiliateMember').select('*').order('createdAt', { ascending: false });
        if (search) query = query.ilike('name', `%${search}%`);
        const { data, error } = await query;
        if (error) throw error;
        return res.json(data);
      }

      if (req.method === 'POST') {
        const { name, username, isActive } = req.body;
        const { data, error } = await supabase.from('AffiliateMember').insert([{ name, username, isActive: isActive !== undefined ? isActive : true }]).select().single();
        if (error) throw error;
        return res.status(201).json(data);
      }

      return res.status(405).json({ message: 'Method not allowed' });
    }

    // /api/members/[id]
    const memberId = id || path;
    if (req.method === 'PUT') {
      const { name, username, isActive } = req.body;
      const { data, error } = await supabase.from('AffiliateMember').update({ name, username, isActive, updatedAt: new Date().toISOString() }).eq('id', memberId).select().single();
      if (error) throw error;
      return res.json(data);
    }

    if (req.method === 'DELETE') {
      const { error } = await supabase.from('AffiliateMember').delete().eq('id', memberId);
      if (error) throw error;
      return res.json({ message: 'Member deleted successfully' });
    }

    return res.status(405).json({ message: 'Method not allowed' });
  } catch (error) {
    console.error(`Members handler [${path}] error:`, error);
    return res.status(500).json({ message: 'Server error' });
  }
}
