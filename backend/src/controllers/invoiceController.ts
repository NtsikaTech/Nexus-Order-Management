import { Request, Response } from 'express';
import prisma from '../config/db';
import { recordAuditLog } from '../services/auditLogService';
import Joi from 'joi';
import PDFDocument from 'pdfkit';

function generateInvoiceNumber() {
  return 'INV-' + Date.now();
}

export const generateInvoiceSchema = Joi.object({
  orderId: Joi.string().required(),
});

export const updateInvoiceStatusSchema = Joi.object({
  status: Joi.string().valid('PENDING', 'PAID', 'CANCELLED').required(),
});

export const generateInvoice = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { orderId } = req.body;
    if (!orderId) return res.status(400).json({ message: 'Order ID required' });
    const order = await prisma.order.findUnique({ where: { id: orderId }, include: { client: true } });
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (user.role === 'CLIENT') {
      const client = await prisma.client.findUnique({ where: { userId: user.userId } });
      if (!client || order.clientId !== client.id) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }
    // Only allow invoice if order is COMPLETED or SUBMITTED_TO_VISP
    if (!['COMPLETED', 'SUBMITTED_TO_VISP'].includes(order.status)) {
      return res.status(400).json({ message: 'Invoice can only be generated for completed/submitted orders' });
    }
    // Calculate amounts (stub: expects order.details.amount)
    const amount = order.details.amount || 0;
    const vatRate = 0.15; // 15% VAT, can fetch from BillingSettings
    const subtotal = amount;
    const vat = subtotal * vatRate;
    const total = subtotal + vat;
    const invoice = await prisma.invoice.create({
      data: {
        orderId: order.id,
        clientId: order.clientId,
        invoiceNumber: generateInvoiceNumber(),
        subtotal,
        vat,
        total,
        status: 'PENDING',
      },
    });
    await recordAuditLog(user.userId, 'CREATE', 'Invoice', invoice.id, { orderId, subtotal, vat, total });
    return res.status(201).json(invoice);
  } catch (err) {
    return res.status(500).json({ message: 'Failed to generate invoice', error: err });
  }
};

export const getInvoices = async (req: Request, res: Response) => {
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
    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({ where, skip, take, orderBy: { createdAt: 'desc' } }),
      prisma.invoice.count({ where })
    ]);
    return res.json({ invoices, total, page: Number(page), pageSize: take });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch invoices', error: err });
  }
};

export const getInvoiceById = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;
    const invoice = await prisma.invoice.findUnique({ where: { id } });
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });
    if (user.role === 'CLIENT') {
      const client = await prisma.client.findUnique({ where: { userId: user.userId } });
      if (!client || invoice.clientId !== client.id) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }
    return res.json(invoice);
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch invoice', error: err });
  }
};

export const updateInvoiceStatus = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (user.role !== 'ADMIN') return res.status(403).json({ message: 'Admin only' });
    const { id } = req.params;
    const { status } = req.body;
    if (!['PENDING', 'PAID', 'CANCELLED'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    const invoice = await prisma.invoice.update({ where: { id }, data: { status } });
    await recordAuditLog(user.userId, 'UPDATE', 'Invoice', id, { status });
    return res.json(invoice);
  } catch (err) {
    return res.status(500).json({ message: 'Failed to update invoice', error: err });
  }
};

export const getInvoicePDF = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;
    const invoice = await prisma.invoice.findUnique({ where: { id }, include: { order: true, client: true } });
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });
    if (user.role === 'CLIENT') {
      const client = await prisma.client.findUnique({ where: { userId: user.userId } });
      if (!client || invoice.clientId !== client.id) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }
    // Generate PDF
    const doc = new PDFDocument();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename=invoice-${invoice.invoiceNumber}.pdf`);
    doc.pipe(res);
    doc.fontSize(20).text('Invoice', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Invoice Number: ${invoice.invoiceNumber}`);
    doc.text(`Date: ${invoice.createdAt.toISOString().slice(0, 10)}`);
    doc.text(`Status: ${invoice.status}`);
    doc.moveDown();
    doc.text(`Client: ${invoice.clientId}`);
    doc.text(`Order ID: ${invoice.orderId}`);
    doc.moveDown();
    doc.text(`Subtotal: R${invoice.subtotal.toFixed(2)}`);
    doc.text(`VAT: R${invoice.vat.toFixed(2)}`);
    doc.text(`Total: R${invoice.total.toFixed(2)}`);
    doc.end();
  } catch (err) {
    return res.status(500).json({ message: 'Failed to generate invoice PDF', error: err });
  }
}; 