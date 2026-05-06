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

  // GET /api/settings
  if (req.method === 'GET') {
    try {
      let { data: settings, error } = await supabase
        .from('Settings').select('*').limit(1).single();

      if (!settings) {
        const { data: newSettings, error: createError } = await supabase
          .from('Settings')
          .insert([{ deductionPercentage: 30.0, language: 'id' }])
          .select().single();
        if (createError) throw createError;
        settings = newSettings;
      }

      res.json(settings);
    } catch (error) {
      console.error('Get settings error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }

  // PUT /api/settings
  else if (req.method === 'PUT') {
    try {
      const { deductionPercentage, language } = req.body;
      let { data: settings } = await supabase.from('Settings').select('*').limit(1).single();

      const updateData = { updatedAt: new Date().toISOString() };
      if (deductionPercentage !== undefined) updateData.deductionPercentage = parseFloat(deductionPercentage);
      if (language !== undefined) updateData.language = language;

      let result;
      if (settings) {
        const { data, error } = await supabase
          .from('Settings').update(updateData).eq('id', settings.id).select().single();
        if (error) throw error;
        result = data;
      } else {
        const { data, error } = await supabase
          .from('Settings')
          .insert([{ deductionPercentage: deductionPercentage ?? 30.0, language: language || 'id' }])
          .select().single();
        if (error) throw error;
        result = data;
      }

      res.json(result);
    } catch (error) {
      console.error('Update settings error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }

  else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}
