import { Request, Response } from 'express';
import prisma from '../config/db';

export const getAuditLogs = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (user.role !== 'ADMIN') return res.status(403).json({ message: 'Admin only' });
    const { page = 1, pageSize = 20, userId, action, entity, entityId, from, to } = req.query;
    const take = Number(pageSize);
    const skip = (Number(page) - 1) * take;
    let where: any = {};
    if (userId) where.userId = userId;
    if (action) where.action = action;
    if (entity) where.entity = entity;
    if (entityId) where.entityId = entityId;
    if (from || to) {
      where.timestamp = {};
      if (from) where.timestamp.gte = new Date(from as string);
      if (to) where.timestamp.lte = new Date(to as string);
    }
    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({ where, skip, take, orderBy: { timestamp: 'desc' }, include: { user: true } }),
      prisma.auditLog.count({ where })
    ]);
    return res.json({ logs, total, page: Number(page), pageSize: take });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch audit logs', error: err });
  }
}; 