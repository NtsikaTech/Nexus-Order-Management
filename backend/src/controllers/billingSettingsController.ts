import { Request, Response } from 'express';
import prisma from '../config/db';
import { recordAuditLog } from '../services/auditLogService';
import Joi from 'joi';

export const getSettings = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (user.role !== 'ADMIN') return res.status(403).json({ message: 'Admin only' });
    let settings = await prisma.billingSettings.findFirst();
    if (!settings) {
      // Create default if not exists
      settings = await prisma.billingSettings.create({
        data: {
          vatRate: 0.15,
          companyName: '',
          companyAddress: '',
        },
      });
    }
    return res.json(settings);
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch billing settings', error: err });
  }
};

export const updateSettings = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (user.role !== 'ADMIN') return res.status(403).json({ message: 'Admin only' });
    const { vatRate, companyName, companyAddress } = req.body;
    let settings = await prisma.billingSettings.findFirst();
    if (!settings) {
      settings = await prisma.billingSettings.create({
        data: { vatRate, companyName, companyAddress },
      });
    } else {
      settings = await prisma.billingSettings.update({
        where: { id: settings.id },
        data: { vatRate, companyName, companyAddress, updatedAt: new Date() },
      });
    }
    await recordAuditLog(user.userId, 'UPDATE', 'BillingSettings', settings.id, { vatRate, companyName, companyAddress });
    return res.json(settings);
  } catch (err) {
    return res.status(500).json({ message: 'Failed to update billing settings', error: err });
  }
};

export const updateBillingSettingsSchema = Joi.object({
  vatRate: Joi.number().min(0).max(1).required(),
  companyName: Joi.string().required(),
  companyAddress: Joi.string().required(),
}); 