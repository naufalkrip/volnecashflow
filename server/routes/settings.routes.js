import express from 'express';
import { getSettings, updateSettings } from '../controllers/settings.controller.js';
import { verifyToken } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(verifyToken);

router.get('/', getSettings);
router.put('/', updateSettings);

export default router;
