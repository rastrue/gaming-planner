import {
  DeliveryChannel,
  ReportFormat,
  ReportKind,
  ReportStatus,
} from '@prisma/client';
import { z } from 'zod';

export const reportIdParamsSchema = z.object({
  id: z.coerce.number().int().positive('Report id must be a positive integer'),
});

export const listReportsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  pageSize: z.coerce.number().int().positive().max(100).optional().default(10),
});

export const createReportSchema = z
  .object({
    reportKind: z.nativeEnum(ReportKind),
    outputFormat: z.nativeEnum(ReportFormat),
    deliveryChannel: z.nativeEnum(DeliveryChannel),
    recipientEmail: z.string().trim().email().optional(),
    eventId: z.coerce.number().int().positive().optional(),
    subjectUserId: z.coerce.number().int().positive().optional(),
    periodStart: z.coerce.date().optional(),
    periodEnd: z.coerce.date().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.deliveryChannel === DeliveryChannel.EMAIL && !data.recipientEmail) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Recipient email is required for email delivery',
        path: ['recipientEmail'],
      });
    }

    if (data.reportKind === ReportKind.EVENT_ATTENDANCE && !data.eventId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'eventId is required for event attendance reports',
        path: ['eventId'],
      });
    }

    if (data.reportKind === ReportKind.PLAYER_PARTICIPATION && !data.subjectUserId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'subjectUserId is required for player participation reports',
        path: ['subjectUserId'],
      });
    }

    if (data.periodStart && data.periodEnd && data.periodEnd < data.periodStart) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'periodEnd must be on or after periodStart',
        path: ['periodEnd'],
      });
    }
  });

export const updateReportSchema = z
  .object({
    recipientEmail: z.string().trim().email().optional(),
    status: z.nativeEnum(ReportStatus).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update',
  });

export const emailReportSchema = z.object({
  recipientEmail: z.string().trim().email().optional(),
});

export type ListReportsQuery = z.infer<typeof listReportsQuerySchema>;
export type CreateReportInput = z.infer<typeof createReportSchema>;
export type UpdateReportInput = z.infer<typeof updateReportSchema>;
export type EmailReportInput = z.infer<typeof emailReportSchema>;
