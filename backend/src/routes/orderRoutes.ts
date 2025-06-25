import { Router } from 'express';
import { createOrder, getOrders, getOrderById, updateOrder, deleteOrder, createOrderSchema, updateOrderSchema, chatbotCreateOrder, getOrderSimpleStatus } from '../controllers/orderController';
import { authenticate, requireAdmin, requireClient } from '../middlewares/authMiddleware';
import { validateBody } from '../middlewares/validationMiddleware';

const router = Router();

router.post('/', authenticate, requireClient, validateBody(createOrderSchema), createOrder);
router.get('/', authenticate, getOrders);
router.get('/:id', authenticate, getOrderById);
router.put('/:id', authenticate, validateBody(updateOrderSchema), updateOrder);
router.delete('/:id', authenticate, requireAdmin, deleteOrder);
router.post('/chatbot', authenticate, requireClient, chatbotCreateOrder);
router.get('/:id/simple-status', authenticate, getOrderSimpleStatus);

export default router; 