import {
  DeliveryChannel,
  ReportFormat,
  ReportKind,
  ReportStatus,
} from '@prisma/client';
import { z } from 'zod';

export const reportIdParamsSchema = z.object({
  id: z.coerce.number().int().positive('Report ID must be a positive integer'),
});

export const listReportsQuerySchema = z.object({
  page: z.coerce.number().int().positive('Page number must be a positive integer').optional().default(1),
  pageSize: z.coerce
    .number()
    .int()
    .positive('Page size must be a positive integer')
    .max(100, 'Page size cannot exceed 100')
    .optional()
    .default(10),
});

export const createReportSchema = z
  .object({
    reportKind: z.nativeEnum(ReportKind, {
      errorMap: () => ({ message: 'Invalid report type' }),
    }),
    outputFormat: z.nativeEnum(ReportFormat, {
      errorMap: () => ({ message: 'Invalid report format' }),
    }),
    deliveryChannel: z.nativeEnum(DeliveryChannel, {
      errorMap: () => ({ message: 'Invalid delivery channel' }),
    }),
    recipientEmail: z.string().trim().email('Enter a valid email').optional(),
    eventId: z.coerce.number().int().positive('Event ID must be a positive integer').optional(),
    subjectUserId: z.coerce
      .number()
      .int()
      .positive('User ID must be a positive integer')
      .optional(),
    periodStart: z.coerce.date({ invalid_type_error: 'Invalid period start date' }).optional(),
    periodEnd: z.coerce.date({ invalid_type_error: 'Invalid period end date' }).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.deliveryChannel === DeliveryChannel.EMAIL && !data.recipientEmail) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Provide a recipient email address for email delivery',
        path: ['recipientEmail'],
      });
    }

    if (data.reportKind === ReportKind.EVENT_ATTENDANCE && !data.eventId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Specify an event for attendance reports',
        path: ['eventId'],
      });
    }

    if (data.reportKind === ReportKind.PLAYER_PARTICIPATION && !data.subjectUserId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Specify a user for player participation reports',
        path: ['subjectUserId'],
      });
    }

    if (data.periodStart && data.periodEnd && data.periodEnd < data.periodStart) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Period end date cannot be before period start date',
        path: ['periodEnd'],
      });
    }
  });

export const updateReportSchema = z
  .object({
    recipientEmail: z.string().trim().email('Enter a valid email').optional(),
    status: z.nativeEnum(ReportStatus, {
      errorMap: () => ({ message: 'Invalid report status' }),
    }).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Provide at least one field to update',
  });

export const emailReportSchema = z.object({
  recipientEmail: z.string().trim().email('Enter a valid email').optional(),
});

export type ListReportsQuery = z.infer<typeof listReportsQuerySchema>;
export type CreateReportInput = z.infer<typeof createReportSchema>;
export type UpdateReportInput = z.infer<typeof updateReportSchema>;
export type EmailReportInput = z.infer<typeof emailReportSchema>;
