import { Request, Response } from 'express';
import prisma from '../config/db';
import { recordAuditLog } from '../services/auditLogService';
import Joi from 'joi';

export const generateSubscriptionSchema = Joi.object({
  orderId: Joi.string().required(),
  startDate: Joi.date().required(),
  endDate: Joi.date().optional().allow(null),
});

export const generateSubscription = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (user.role !== 'ADMIN') return res.status(403).json({ message: 'Admin only' });
    const { orderId, startDate, endDate } = req.body;
    if (!orderId || !startDate) return res.status(400).json({ message: 'Order ID and startDate required' });
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) return res.status(404).json({ message: 'Order not found' });
    // Only allow if not already has a subscription
    const existing = await prisma.subscription.findUnique({ where: { orderId } });
    if (existing) return res.status(400).json({ message: 'Subscription already exists for this order' });
    const subscription = await prisma.subscription.create({
      data: {
        clientId: order.clientId,
        orderId: order.id,
        status: 'ACTIVE',
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
      },
    });
    await recordAuditLog(user.userId, 'CREATE', 'Subscription', subscription.id, { orderId, startDate, endDate });
    return res.status(201).json(subscription);
  } catch (err) {
    return res.status(500).json({ message: 'Failed to generate subscription', error: err });
  }
};

export const getSubscriptions = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { page = 1, pageSize = 20, status, clientId } = req.query;
    const take = Number(pageSize);
    const skip = (Number(page) - 1) * take;
    let where: any = {};
    if (status) where.status = status;
    if (user.role === 'CLIENT') {
      const client = await prisma.client.findUnique({ where: { userId: user.userId } });
      if (!client) return res.status(400).json({ message: 'Client profile not found' });
      where.clientId = client.id;
    } else if (clientId) {
      where.clientId = clientId;
    }
    const [subscriptions, total] = await Promise.all([
      prisma.subscription.findMany({ where, skip, take, orderBy: { createdAt: 'desc' } }),
      prisma.subscription.count({ where })
    ]);
    return res.json({ subscriptions, total, page: Number(page), pageSize: take });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch subscriptions', error: err });
  }
};

export const getSubscriptionById = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;
    const subscription = await prisma.subscription.findUnique({ where: { id } });
    if (!subscription) return res.status(404).json({ message: 'Subscription not found' });
    if (user.role === 'CLIENT') {
      const client = await prisma.client.findUnique({ where: { userId: user.userId } });
      if (!client || subscription.clientId !== client.id) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }
    return res.json(subscription);
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch subscription', error: err });
  }
};

export const requestCancellation = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (user.role !== 'CLIENT') return res.status(403).json({ message: 'Client only' });
    const { id } = req.params;
    const subscription = await prisma.subscription.findUnique({ where: { id } });
    if (!subscription) return res.status(404).json({ message: 'Subscription not found' });
    const client = await prisma.client.findUnique({ where: { userId: user.userId } });
    if (!client || subscription.clientId !== client.id) {
      return res.status(403).json({ message: 'Access denied' });
    }
    if (subscription.status !== 'ACTIVE') {
      return res.status(400).json({ message: 'Only active subscriptions can be cancelled' });
    }
    const updated = await prisma.subscription.update({
      where: { id },
      data: { status: 'PENDING_CANCELLATION', cancellationRequested: true, updatedAt: new Date() },
    });
    await recordAuditLog(user.userId, 'REQUEST_CANCEL', 'Subscription', id, { previousStatus: subscription.status });
    return res.json(updated);
  } catch (err) {
    return res.status(500).json({ message: 'Failed to request cancellation', error: err });
  }
};

export const processCancellation = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (user.role !== 'ADMIN') return res.status(403).json({ message: 'Admin only' });
    const { id } = req.params;
    const subscription = await prisma.subscription.findUnique({ where: { id } });
    if (!subscription) return res.status(404).json({ message: 'Subscription not found' });
    if (subscription.status !== 'PENDING_CANCELLATION') {
      return res.status(400).json({ message: 'Only pending cancellations can be processed' });
    }
    const updated = await prisma.subscription.update({
      where: { id },
      data: { status: 'CANCELLED', updatedAt: new Date() },
    });
    await recordAuditLog(user.userId, 'PROCESS_CANCEL', 'Subscription', id, { previousStatus: subscription.status });
    return res.json(updated);
  } catch (err) {
    return res.status(500).json({ message: 'Failed to process cancellation', error: err });
  }
}; 