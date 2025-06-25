import { Router } from 'express';
import { generateInvoice, getInvoices, getInvoiceById, updateInvoiceStatus, generateInvoiceSchema, updateInvoiceStatusSchema, getInvoicePDF } from '../controllers/invoiceController';
import { authenticate, requireAdmin } from '../middlewares/authMiddleware';
import { validateBody } from '../middlewares/validationMiddleware';

const router = Router();

router.post('/', authenticate, validateBody(generateInvoiceSchema), generateInvoice);
router.get('/', authenticate, getInvoices);
router.get('/:id', authenticate, getInvoiceById);
router.put('/:id/status', authenticate, requireAdmin, validateBody(updateInvoiceStatusSchema), updateInvoiceStatus);
router.get('/:id/pdf', authenticate, getInvoicePDF);

export default router; 