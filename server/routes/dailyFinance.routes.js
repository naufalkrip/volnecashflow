import express from 'express';
import {
  getDailyRecords,
  createDailyRecord,
  updateDailyRecord,
  deleteDailyRecord,
  getDailyStats,
  getDailyReport,
  getGroups,
  createGroup,
  updateGroup,
  deleteGroup
} from '../controllers/dailyFinance.controller.js';
import { verifyToken } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(verifyToken);

router.get('/stats', getDailyStats);
router.get('/report', getDailyReport);
router.get('/groups', getGroups);
router.post('/groups', createGroup);
router.put('/groups/:id', updateGroup);
router.delete('/groups/:id', deleteGroup);
router.get('/', getDailyRecords);
router.post('/', createDailyRecord);
router.put('/:id', updateDailyRecord);
router.delete('/:id', deleteDailyRecord);

export default router;
