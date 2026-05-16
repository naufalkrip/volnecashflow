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

    const { data: users, error } = await supabase
      .from('User')
      .select('id, name, username, role, createdAt')
      .order('createdAt', { ascending: false });

    if (error) throw error;
    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(401).json({ message: error.message });
  }
}
