import { Router } from 'express';
import { getAuditLogs } from '../controllers/auditLogController';
import { authenticate, requireAdmin } from '../middlewares/authMiddleware';

const router = Router();

router.get('/', authenticate, requireAdmin, getAuditLogs);

export default router; 