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

  // GET /api/members
  if (req.method === 'GET') {
    try {
      const { search } = req.query;
      let query = supabase
        .from('AffiliateMember')
        .select('*')
        .order('createdAt', { ascending: false });

      if (search) query = query.ilike('name', `%${search}%`);

      const { data, error } = await query;
      if (error) throw error;
      res.json(data);
    } catch (error) {
      console.error('Get members error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }

  // POST /api/members
  else if (req.method === 'POST') {
    try {
      const { name, username, isActive } = req.body;
      const { data, error } = await supabase
        .from('AffiliateMember')
        .insert([{ name, username, isActive: isActive !== undefined ? isActive : true }])
        .select()
        .single();
      if (error) throw error;
      res.status(201).json(data);
    } catch (error) {
      console.error('Create member error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }

  else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}
