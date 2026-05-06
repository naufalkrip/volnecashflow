import bcrypt from 'bcryptjs';
import supabase from '../_lib/supabase.js';
import { setCors } from '../_lib/auth.js';

// ONE-TIME PASSWORD RESET ENDPOINT
// Call: GET /api/auth/reset-admin
// This will reset/create the admin user with known credentials
export default async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ message: 'Method not allowed' });

  try {
    const newPassword = 'volne2025';
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Try to update existing nopal user
    const { data: existing } = await supabase
      .from('User')
      .select('id, username')
      .eq('username', 'nopal')
      .single();

    if (existing) {
      await supabase
        .from('User')
        .update({ password: hashedPassword, updatedAt: new Date().toISOString() })
        .eq('id', existing.id);

      return res.json({
        message: 'Password berhasil direset!',
        username: 'nopal',
        password: newPassword
      });
    }

    // Also try admin user
    const { data: adminUser } = await supabase
      .from('User')
      .select('id, username')
      .eq('username', 'admin')
      .single();

    if (adminUser) {
      await supabase
        .from('User')
        .update({ password: hashedPassword, username: 'nopal', name: 'Nopal', updatedAt: new Date().toISOString() })
        .eq('id', adminUser.id);

      return res.json({
        message: 'User admin direset dan diubah ke nopal!',
        username: 'nopal',
        password: newPassword
      });
    }

    // Create fresh user
    const { data: newUser, error } = await supabase
      .from('User')
      .insert([{ name: 'Nopal', username: 'nopal', password: hashedPassword, role: 'ADMIN' }])
      .select()
      .single();

    if (error) throw error;

    return res.json({
      message: 'User baru berhasil dibuat!',
      username: 'nopal',
      password: newPassword
    });

  } catch (error) {
    console.error('Reset error:', error);
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
}
