import { setCors, verifyToken } from '../_lib/auth.js';

export default async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ message: 'Method not allowed' });

  try {
    const decoded = verifyToken(req);
    res.json({ valid: true, user: decoded });
  } catch (error) {
    res.status(401).json({ message: error.message });
  }
}
