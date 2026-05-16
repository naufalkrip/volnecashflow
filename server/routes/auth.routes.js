import express from 'express';
import { login, register, adminLogin, getMe, getUsers } from '../controllers/auth.controller.js';
import { verifyToken, verifyAdmin } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/login', login);
router.post('/register', register);
router.post('/admin-login', adminLogin);
router.get('/me', verifyToken, getMe);
router.get('/users', verifyToken, verifyAdmin, getUsers);

export default router;
