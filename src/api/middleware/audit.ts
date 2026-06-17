import type { NextFunction, Request, Response } from 'express';
import { prisma } from '../../database/prisma.js';
import { logger } from '../../utils/logger.js';

export type AuditLogOptions = {
  action: string;
  entityType: string;
  entityIdParam?: string;
};

/**
 * Express middleware to record audit events for successful write actions.
 * Logs actor, action, target entity type, and ID.
 */
export function auditLog(options: AuditLogOptions) {
  return (req: Request, res: Response, next: NextFunction): void => {
    res.on('finish', async () => {
      // Only log successful write operations (2xx statuses)
      if (res.statusCode < 200 || res.statusCode >= 300) {
        return;
      }

      try {
        const context = req.context;
        if (!context) {
          return;
        }

        const entityId = options.entityIdParam ? req.params[options.entityIdParam] : undefined;

        await prisma.auditEvent.create({
          data: {
            tenantId: context.tenantId,
            actorUserId: context.userId ?? null,
            action: options.action,
            entityType: options.entityType,
            entityId: entityId ?? null,
            metadata: {
              method: req.method,
              url: req.originalUrl,
              ip: req.ip,
              userAgent: req.header('user-agent') ?? null,
            },
          },
        });
      } catch (err) {
        logger.error({ err, action: options.action }, 'Failed to write audit log event');
      }
    });

    next();
  };
}
