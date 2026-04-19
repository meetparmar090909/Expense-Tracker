import { Router } from 'express';
import { register, login, googleLogin, getMe, updateBudget } from '../controllers/authController';
import { protect } from '../middleware/auth';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/google', googleLogin);
router.get('/me', protect, getMe);
router.put('/update-budget', protect, updateBudget);

export default router;
