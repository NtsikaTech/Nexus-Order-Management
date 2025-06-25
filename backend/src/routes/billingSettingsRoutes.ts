import { Router } from 'express';
import { getSettings, updateSettings, updateBillingSettingsSchema } from '../controllers/billingSettingsController';
import { authenticate, requireAdmin } from '../middlewares/authMiddleware';
import { validateBody } from '../middlewares/validationMiddleware';

const router = Router();

router.get('/', authenticate, requireAdmin, getSettings);
router.put('/', authenticate, requireAdmin, validateBody(updateBillingSettingsSchema), updateSettings);

export default router; 