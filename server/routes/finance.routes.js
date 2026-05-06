import express from 'express';
import { 
  getFinanceRecords, 
  createFinanceRecord, 
  updateFinanceRecord, 
  deleteFinanceRecord, 
  getDashboardStats 
} from '../controllers/finance.controller.js';
import { verifyToken } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(verifyToken);

router.get('/dashboard', getDashboardStats);
router.get('/', getFinanceRecords);
router.post('/', createFinanceRecord);
router.put('/:id', updateFinanceRecord);
router.delete('/:id', deleteFinanceRecord);

export default router;
