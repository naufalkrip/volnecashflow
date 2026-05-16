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

    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET || 'volne_super_secret_key_123!@#',
      { expiresIn: '1d' }
    );

    res.json({
      message: 'Login successful',
      user: { id: user.id, name: user.name, username: user.username, role: user.role },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const register = async (req, res) => {
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
    const { data: newUser, error: createError } = await supabase
      .from('User')
      .insert([{ name: username, username, password: hashedPassword, role: 'USER' }])
      .select()
      .single();

    if (createError) throw createError;

    res.status(201).json({
      message: 'Registration successful'
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const adminLogin = async (req, res) => {
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

    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    if (user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET || 'volne_super_secret_key_123!@#',
      { expiresIn: '1d' }
    );

    res.json({
      message: 'Admin login successful',
      user: { id: user.id, name: user.name, username: user.username, role: user.role },
      token
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getMe = async (req, res) => {
  try {
    const { data: user, error } = await supabase
      .from('User')
      .select('id, name, username, role')
      .eq('id', req.user.id)
      .single();

    if (error || !user) {
      return res.status(401).json({ message: 'User not found' });
    }

    res.json({ valid: true, user });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getUsers = async (req, res) => {
  try {
    const { data: users, error } = await supabase
      .from('User')
      .select('id, name, username, role, createdAt')
      .order('createdAt', { ascending: false });

    if (error) throw error;
    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
