import bcrypt from 'bcryptjs';
import supabase from '../_lib/supabase.js';
import { setCors, verifyToken } from '../_lib/auth.js';

export default async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'PUT') return res.status(405).json({ message: 'Method not allowed' });

  let decoded;
  try {
    decoded = verifyToken(req);
  } catch (e) {
    return res.status(401).json({ message: e.message });
  }

  try {
    const { currentPassword, newUsername, newPassword } = req.body;

    if (!currentPassword) {
      return res.status(400).json({ message: 'Password saat ini wajib diisi' });
    }

    // Fetch current user from DB
    const { data: user, error } = await supabase
      .from('User')
      .select('*')
      .eq('id', decoded.id)
      .single();

    if (error || !user) {
      return res.status(404).json({ message: 'User tidak ditemukan' });
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Password saat ini salah' });
    }

    // Build update object
    const updateData = { updatedAt: new Date().toISOString() };

    if (newUsername && newUsername.trim() !== '') {
      // Check if username is taken by another user
      const { data: existing } = await supabase
        .from('User')
        .select('id')
        .eq('username', newUsername.trim())
        .neq('id', decoded.id)
        .maybeSingle();

      if (existing) {
        return res.status(400).json({ message: 'Username sudah digunakan' });
      }
      updateData.username = newUsername.trim();
    }

    if (newPassword && newPassword.trim() !== '') {
      if (newPassword.length < 6) {
        return res.status(400).json({ message: 'Password baru minimal 6 karakter' });
      }
      updateData.password = await bcrypt.hash(newPassword, 10);
    }

    if (Object.keys(updateData).length === 1) {
      return res.status(400).json({ message: 'Tidak ada perubahan yang disimpan' });
    }

    const { data: updated, error: updateError } = await supabase
      .from('User')
      .update(updateData)
      .eq('id', decoded.id)
      .select('id, name, username')
      .single();

    if (updateError) throw updateError;

    res.json({ message: 'Kredensial berhasil diperbarui', user: updated });
  } catch (error) {
    console.error('Change credentials error:', error);
    res.status(500).json({ message: 'Server error' });
  }
}
