import { Request, Response } from 'express';
import prisma from '../config/db';
import { recordAuditLog } from '../services/auditLogService';
import Joi from 'joi';

export const createRequestSchema = Joi.object({
  type: Joi.string().required(),
  details: Joi.object().required(),
});

export const updateRequestSchema = Joi.object({
  status: Joi.string().valid('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'),
  details: Joi.object(),
});

export const createRequest = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (user.role !== 'CLIENT') return res.status(403).json({ message: 'Only clients can create requests' });
    const client = await prisma.client.findUnique({ where: { userId: user.userId } });
    if (!client) return res.status(400).json({ message: 'Client profile not found' });
    const { type, details } = req.body;
    if (!type || !details) return res.status(400).json({ message: 'Type and details required' });
    const request = await prisma.request.create({
      data: {
        clientId: client.id,
        userId: user.userId,
        type,
        status: 'OPEN',
        details,
      },
    });
    await recordAuditLog(user.userId, 'CREATE', 'Request', request.id, { type, details });
    return res.status(201).json(request);
  } catch (err) {
    return res.status(500).json({ message: 'Failed to create request', error: err });
  }
};

export const getRequests = async (req: Request, res: Response) => {
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
    const [requests, total] = await Promise.all([
      prisma.request.findMany({ where, skip, take, orderBy: { createdAt: 'desc' } }),
      prisma.request.count({ where })
    ]);
    return res.json({ requests, total, page: Number(page), pageSize: take });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch requests', error: err });
  }
};

export const getRequestById = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;
    const request = await prisma.request.findUnique({ where: { id } });
    if (!request) return res.status(404).json({ message: 'Request not found' });
    if (user.role === 'CLIENT') {
      const client = await prisma.client.findUnique({ where: { userId: user.userId } });
      if (!client || request.clientId !== client.id) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }
    return res.json(request);
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch request', error: err });
  }
};

export const updateRequest = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (user.role !== 'ADMIN') return res.status(403).json({ message: 'Admin only' });
    const { id } = req.params;
    const { status, details } = req.body;
    const updateData: any = {};
    if (status) updateData.status = status;
    if (details) updateData.details = details;
    updateData.updatedAt = new Date();
    const updated = await prisma.request.update({ where: { id }, data: updateData });
    await recordAuditLog(user.userId, 'UPDATE', 'Request', id, { status, details });
    return res.json(updated);
  } catch (err) {
    return res.status(500).json({ message: 'Failed to update request', error: err });
  }
}; 