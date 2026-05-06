import supabase from '../config/supabase.js';

export const getSettings = async (req, res) => {
  try {
    let { data: settings, error } = await supabase
      .from('Settings')
      .select('*')
      .limit(1)
      .single();

    if (!settings) {
      const { data: newSettings, error: createError } = await supabase
        .from('Settings')
        .insert([{ deductionPercentage: 30.0, language: 'id' }])
        .select()
        .single();
      if (createError) throw createError;
      settings = newSettings;
    }

    res.json(settings);
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateSettings = async (req, res) => {
  try {
    const { deductionPercentage, language } = req.body;

    let { data: settings } = await supabase
      .from('Settings')
      .select('*')
      .limit(1)
      .single();

    const updateData = { updatedAt: new Date().toISOString() };
    if (deductionPercentage !== undefined) updateData.deductionPercentage = parseFloat(deductionPercentage);
    if (language !== undefined) updateData.language = language;

    let result;
    if (settings) {
      const { data, error } = await supabase
        .from('Settings')
        .update(updateData)
        .eq('id', settings.id)
        .select()
        .single();
      if (error) throw error;
      result = data;
    } else {
      const { data, error } = await supabase
        .from('Settings')
        .insert([{
          deductionPercentage: deductionPercentage !== undefined ? parseFloat(deductionPercentage) : 30.0,
          language: language || 'id'
        }])
        .select()
        .single();
      if (error) throw error;
      result = data;
    }

    res.json(result);
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
