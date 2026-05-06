import supabase from '../config/supabase.js';
import { calculateDeduction } from '../utils/calculation.js';

export const getMembers = async (req, res) => {
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
};

export const createMember = async (req, res) => {
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
};

export const updateMember = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, username, isActive } = req.body;
    const { data, error } = await supabase
      .from('AffiliateMember')
      .update({ name, username, isActive, updatedAt: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Update member error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const deleteMember = async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase.from('AffiliateMember').delete().eq('id', id);
    if (error) throw error;
    res.json({ message: 'Member deleted successfully' });
  } catch (error) {
    console.error('Delete member error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
