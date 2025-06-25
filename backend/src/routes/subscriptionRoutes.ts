import { Router } from 'express';
import { generateSubscription, getSubscriptions, getSubscriptionById, requestCancellation, processCancellation, generateSubscriptionSchema } from '../controllers/subscriptionController';
import { authenticate, requireAdmin, requireClient } from '../middlewares/authMiddleware';
import { validateBody } from '../middlewares/validationMiddleware';

const router = Router();

router.post('/', authenticate, requireAdmin, validateBody(generateSubscriptionSchema), generateSubscription);
router.get('/', authenticate, getSubscriptions);
router.get('/:id', authenticate, getSubscriptionById);
router.post('/:id/cancel', authenticate, requireClient, requestCancellation);
router.put('/:id/cancel', authenticate, requireAdmin, processCancellation);

export default router; 