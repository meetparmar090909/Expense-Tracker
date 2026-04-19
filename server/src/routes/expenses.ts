import { Router } from 'express';
import { getExpenses, createExpense, updateExpense, deleteExpense, getStats } from '../controllers/expenseController';
import { protect } from '../middleware/auth';

const router = Router();

router.use(protect);
router.get('/stats', getStats);
router.get('/', getExpenses);
router.post('/', createExpense);
router.put('/:id', updateExpense);
router.delete('/:id', deleteExpense);

export default router;
