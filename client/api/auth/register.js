import bcrypt from 'bcryptjs';
import supabase from '../_lib/supabase.js';
import { setCors } from '../_lib/auth.js';

export default async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });

  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const { data: existing } = await supabase
      .from('User')
      .select('id')
      .eq('username', username)
      .single();

    if (existing) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const { error: createError } = await supabase
      .from('User')
      .insert([{ name: username, username, password: hashedPassword, role: 'USER' }]);

    if (createError) throw createError;

    res.status(201).json({ message: 'Registration successful' });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Server error' });
  }
}
