import bcrypt from 'bcryptjs';
import supabase from '../_lib/supabase.js';
import { setCors, generateToken, verifyToken } from '../_lib/auth.js';

export default async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const path = (req.query.auth || []).join('/');

  try {
    switch (path) {
      case 'login': {
        if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });
        const { username, password } = req.body;
        let { data: user } = await supabase.from('User').select('*').eq('username', username).maybeSingle();
        if (!user) return res.status(400).json({ message: 'Invalid credentials' });
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });
        const token = generateToken({ id: user.id, username: user.username, role: user.role });
        return res.json({ message: 'Login successful', user: { id: user.id, name: user.name, username: user.username, role: user.role }, token });
      }

      case 'register': {
        if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });
        const { username, password } = req.body;
        if (!username || !password) return res.status(400).json({ message: 'Username and password are required' });
        if (password.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters' });
        const { data: existing } = await supabase.from('User').select('id').eq('username', username).maybeSingle();
        if (existing) return res.status(400).json({ message: 'Username already exists' });
        const hashedPassword = await bcrypt.hash(password, 10);
        const { error: createError } = await supabase.from('User').insert([{ name: username, username, password: hashedPassword, role: 'USER' }]);
        if (createError) throw createError;
        return res.status(201).json({ message: 'Registration successful' });
      }

      case 'admin-login': {
        if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });
        const { username, password } = req.body;
        let { data: user } = await supabase.from('User').select('*').eq('username', username).maybeSingle();
        if (!user && username === 'admin') {
          const hashedPassword = await bcrypt.hash('admin123', 10);
          const { data: newUser, error: createError } = await supabase.from('User').insert([{ name: 'Admin', username: 'admin', password: hashedPassword, role: 'ADMIN' }]).select().single();
          if (createError) throw createError;
          user = newUser;
        }
        if (!user) return res.status(400).json({ message: 'Invalid credentials' });
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });
        if (user.role !== 'ADMIN') return res.status(403).json({ message: 'Access denied. Admin only.' });
        const token = generateToken({ id: user.id, username: user.username, role: user.role });
        return res.json({ message: 'Admin login successful', user: { id: user.id, name: user.name, username: user.username, role: user.role }, token });
      }

      case 'me': {
        if (req.method !== 'GET') return res.status(405).json({ message: 'Method not allowed' });
        const decoded = verifyToken(req);
        const { data: user } = await supabase.from('User').select('id, name, username, role').eq('id', decoded.id).maybeSingle();
        if (!user) return res.status(401).json({ message: 'User not found' });
        return res.json({ valid: true, user });
      }

      case 'users': {
        if (req.method !== 'GET') return res.status(405).json({ message: 'Method not allowed' });
        const admin = verifyToken(req);
        if (admin.role !== 'ADMIN') return res.status(403).json({ message: 'Admin access required' });
        const { data: users } = await supabase.from('User').select('id, name, username, role, createdAt').order('createdAt', { ascending: false });
        return res.json(users);
      }

      case 'change-credentials': {
        if (req.method !== 'PUT') return res.status(405).json({ message: 'Method not allowed' });
        const decoded = verifyToken(req);
        const { currentPassword, newUsername, newPassword } = req.body;
        if (!currentPassword) return res.status(400).json({ message: 'Password saat ini wajib diisi' });
        const { data: user } = await supabase.from('User').select('*').eq('id', decoded.id).single();
        if (!user) return res.status(404).json({ message: 'User tidak ditemukan' });
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Password saat ini salah' });
        const updateData = { updatedAt: new Date().toISOString() };
        if (newUsername && newUsername.trim() !== '') {
          const { data: existing } = await supabase.from('User').select('id').eq('username', newUsername.trim()).neq('id', decoded.id).maybeSingle();
          if (existing) return res.status(400).json({ message: 'Username sudah digunakan' });
          updateData.username = newUsername.trim();
        }
        if (newPassword && newPassword.trim() !== '') {
          if (newPassword.length < 6) return res.status(400).json({ message: 'Password baru minimal 6 karakter' });
          updateData.password = await bcrypt.hash(newPassword, 10);
        }
        if (Object.keys(updateData).length === 1) return res.status(400).json({ message: 'Tidak ada perubahan yang disimpan' });
        const { data: updated, error: updateError } = await supabase.from('User').update(updateData).eq('id', decoded.id).select('id, name, username').single();
        if (updateError) throw updateError;
        return res.json({ message: 'Kredensial berhasil diperbarui', user: updated });
      }

      default:
        return res.status(404).json({ message: 'Not found' });
    }
  } catch (error) {
    const status = error.message?.includes('denied') || error.message?.includes('token') ? 401 : 500;
    console.error(`Auth handler [${path}] error:`, error);
    return res.status(status).json({ message: status === 401 ? error.message : 'Server error' });
  }
}
