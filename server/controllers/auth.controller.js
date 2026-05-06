import supabase from '../config/supabase.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    let { data: user, error } = await supabase
      .from('User')
      .select('*')
      .eq('username', username)
      .single();

    // Auto-seed admin if not exists
    if (!user && username === 'admin') {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      const { data: newUser, error: createError } = await supabase
        .from('User')
        .insert([{ name: 'Super Admin', username: 'admin', password: hashedPassword, role: 'ADMIN' }])
        .select()
        .single();
      if (createError) throw createError;
      user = newUser;
    }

    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username },
      process.env.JWT_SECRET || 'volne_super_secret_key_123!@#',
      { expiresIn: '1d' }
    );

    res.json({
      message: 'Login successful',
      user: { id: user.id, name: user.name, username: user.username },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
