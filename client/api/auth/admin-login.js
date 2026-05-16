import bcrypt from 'bcryptjs';
import supabase from '../_lib/supabase.js';
import { setCors, generateToken } from '../_lib/auth.js';

export default async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });

  try {
    const { username, password } = req.body;

    let { data: user, error } = await supabase
      .from('User')
      .select('*')
      .eq('username', username)
      .single();

    if (!user && username === 'admin') {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      const { data: newUser, error: createError } = await supabase
        .from('User')
        .insert([{ name: 'Admin', username: 'admin', password: hashedPassword, role: 'ADMIN' }])
        .select()
        .single();
      if (createError) throw createError;
      user = newUser;
    }

    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    if (user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const token = generateToken({ id: user.id, username: user.username, role: user.role });

    res.json({
      message: 'Admin login successful',
      user: { id: user.id, name: user.name, username: user.username, role: user.role },
      token
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
}
