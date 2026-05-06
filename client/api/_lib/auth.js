import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'volne_super_secret_key_123!@#';

export function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

export function verifyToken(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader) throw new Error('No token provided, authorization denied');
  const token = authHeader.split(' ')[1];
  if (!token) throw new Error('No token provided, authorization denied');
  return jwt.verify(token, JWT_SECRET);
}

export function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '1d' });
}
