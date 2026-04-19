import { Router } from 'express';
import { createTrip, deleteTrip, getTrips, updateTrip } from '../controllers/tripController';
import { protect } from '../middleware/auth';

const router = Router();

router.use(protect);
router.get('/', getTrips);
router.post('/', createTrip);
router.put('/:id', updateTrip);
router.delete('/:id', deleteTrip);

export default router;
