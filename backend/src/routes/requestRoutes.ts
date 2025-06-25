import { Router } from 'express';
import { createRequest, getRequests, getRequestById, updateRequest, createRequestSchema, updateRequestSchema } from '../controllers/requestController';
import { authenticate, requireAdmin, requireClient } from '../middlewares/authMiddleware';
import { validateBody } from '../middlewares/validationMiddleware';

const router = Router();

router.post('/', authenticate, requireClient, validateBody(createRequestSchema), createRequest);
router.get('/', authenticate, getRequests);
router.get('/:id', authenticate, getRequestById);
router.put('/:id', authenticate, requireAdmin, validateBody(updateRequestSchema), updateRequest);

export default router; 