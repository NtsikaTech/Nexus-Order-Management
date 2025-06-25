import prisma from '../config/db';

export async function recordAuditLog(userId: string, action: string, entity: string, entityId: string, details?: any) {
  await prisma.auditLog.create({
    data: {
      userId,
      action,
      entity,
      entityId,
      details: details ? details : undefined,
    },
  });
} 