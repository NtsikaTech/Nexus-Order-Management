import { Request, Response } from 'express';
import prisma from '../config/db';
import { recordAuditLog } from '../services/auditLogService';
import Joi from 'joi';

// Helper to add activity log entry
function appendActivityLog(order: any, action: string, userId: string) {
  const log = order.activityLog || [];
  log.push({ action, userId, timestamp: new Date().toISOString() });
  return log;
}

export const createOrderSchema = Joi.object({
  details: Joi.object().required(),
});

export const updateOrderSchema = Joi.object({
  details: Joi.object(),
  status: Joi.string().valid('NEW', 'IN_PROGRESS', 'COMPLETED', 'SUBMITTED_TO_VISP', 'CANCELLED'),
});

export const createOrder = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (user.role !== 'CLIENT') return res.status(403).json({ message: 'Only clients can create orders' });
    const client = await prisma.client.findUnique({ where: { userId: user.userId } });
    if (!client) return res.status(400).json({ message: 'Client profile not found' });
    const { details } = req.body;
    if (!details) return res.status(400).json({ message: 'Order details required' });
    const order = await prisma.order.create({
      data: {
        clientId: client.id,
        status: 'NEW',
        details,
        activityLog: [{ action: 'Order created', userId: user.userId, timestamp: new Date().toISOString() }],
      },
    });
    await recordAuditLog(user.userId, 'CREATE', 'Order', order.id, { details });
    return res.status(201).json(order);
  } catch (err) {
    return res.status(500).json({ message: 'Failed to create order', error: err });
  }
};

export const getOrders = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { page = 1, pageSize = 20, status } = req.query;
    const take = Number(pageSize);
    const skip = (Number(page) - 1) * take;
    let where: any = {};
    if (status) where.status = status;
    if (user.role === 'CLIENT') {
      const client = await prisma.client.findUnique({ where: { userId: user.userId } });
      if (!client) return res.status(400).json({ message: 'Client profile not found' });
      where.clientId = client.id;
    }
    const [orders, total] = await Promise.all([
      prisma.order.findMany({ where, skip, take, orderBy: { createdAt: 'desc' } }),
      prisma.order.count({ where })
    ]);
    return res.json({ orders, total, page: Number(page), pageSize: take });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch orders', error: err });
  }
};

export const getOrderById = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;
    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (user.role === 'CLIENT') {
      const client = await prisma.client.findUnique({ where: { userId: user.userId } });
      if (!client || order.clientId !== client.id) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }
    return res.json(order);
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch order', error: err });
  }
};

export const updateOrder = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;
    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (user.role === 'CLIENT') {
      const client = await prisma.client.findUnique({ where: { userId: user.userId } });
      if (!client || order.clientId !== client.id) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }
    const { details, status } = req.body;
    const updateData: any = {};
    if (details) updateData.details = details;
    if (status && user.role === 'ADMIN') updateData.status = status;
    updateData.activityLog = appendActivityLog(order, 'Order updated', user.userId);
    updateData.updatedAt = new Date();
    const updated = await prisma.order.update({ where: { id }, data: updateData });
    await recordAuditLog(user.userId, 'UPDATE', 'Order', id, { details, status });
    return res.json(updated);
  } catch (err) {
    return res.status(500).json({ message: 'Failed to update order', error: err });
  }
};

export const deleteOrder = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (user.role !== 'ADMIN') return res.status(403).json({ message: 'Admin only' });
    const { id } = req.params;
    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) return res.status(404).json({ message: 'Order not found' });
    await prisma.order.delete({ where: { id } });
    await recordAuditLog(user.userId, 'DELETE', 'Order', id, { order });
    return res.json({ message: 'Order deleted' });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to delete order', error: err });
  }
};

export const chatbotCreateOrder = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (user.role !== 'CLIENT') return res.status(403).json({ message: 'Only clients can create orders' });
    const client = await prisma.client.findUnique({ where: { userId: user.userId } });
    if (!client) return res.status(400).json({ message: 'Client profile not found' });
    const { details } = req.body;
    if (!details) return res.status(400).json({ message: 'Order details required' });
    // Optionally validate details structure here
    const order = await prisma.order.create({
      data: {
        clientId: client.id,
        status: 'NEW',
        details,
        activityLog: [{ action: 'Order created (chatbot)', userId: user.userId, timestamp: new Date().toISOString() }],
      },
    });
    await recordAuditLog(user.userId, 'CREATE', 'Order', order.id, { details, source: 'chatbot' });
    return res.status(201).json(order);
  } catch (err) {
    return res.status(500).json({ message: 'Failed to create order', error: err });
  }
};

export const getOrderSimpleStatus = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;
    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (user.role === 'CLIENT') {
      const client = await prisma.client.findUnique({ where: { userId: user.userId } });
      if (!client || order.clientId !== client.id) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }
    return res.json({ id: order.id, status: order.status, createdAt: order.createdAt, details: order.details });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch order status', error: err });
  }
}; 