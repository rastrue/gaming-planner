import {
  DeliveryChannel,
  ReportFormat,
  ReportKind,
  ReportStatus,
} from '@prisma/client';
import { z } from 'zod';

export const reportIdParamsSchema = z.object({
  id: z.coerce.number().int().positive('Идентификатор отчёта должен быть положительным целым числом'),
});

export const listReportsQuerySchema = z.object({
  page: z.coerce.number().int().positive('Номер страницы должен быть положительным числом').optional().default(1),
  pageSize: z.coerce
    .number()
    .int()
    .positive('Размер страницы должен быть положительным числом')
    .max(100, 'Размер страницы не может превышать 100')
    .optional()
    .default(10),
});

export const createReportSchema = z
  .object({
    reportKind: z.nativeEnum(ReportKind, {
      errorMap: () => ({ message: 'Недопустимый тип отчёта' }),
    }),
    outputFormat: z.nativeEnum(ReportFormat, {
      errorMap: () => ({ message: 'Недопустимый формат отчёта' }),
    }),
    deliveryChannel: z.nativeEnum(DeliveryChannel, {
      errorMap: () => ({ message: 'Недопустимый канал доставки' }),
    }),
    recipientEmail: z.string().trim().email('Укажите корректный email').optional(),
    eventId: z.coerce.number().int().positive('Идентификатор события должен быть положительным числом').optional(),
    subjectUserId: z.coerce
      .number()
      .int()
      .positive('Идентификатор пользователя должен быть положительным числом')
      .optional(),
    periodStart: z.coerce.date({ invalid_type_error: 'Некорректная дата начала периода' }).optional(),
    periodEnd: z.coerce.date({ invalid_type_error: 'Некорректная дата окончания периода' }).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.deliveryChannel === DeliveryChannel.EMAIL && !data.recipientEmail) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Для отправки по email укажите адрес получателя',
        path: ['recipientEmail'],
      });
    }

    if (data.reportKind === ReportKind.EVENT_ATTENDANCE && !data.eventId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Для отчёта по посещаемости укажите событие',
        path: ['eventId'],
      });
    }

    if (data.reportKind === ReportKind.PLAYER_PARTICIPATION && !data.subjectUserId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Для отчёта об участии игрока укажите пользователя',
        path: ['subjectUserId'],
      });
    }

    if (data.periodStart && data.periodEnd && data.periodEnd < data.periodStart) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Дата окончания периода не может быть раньше даты начала',
        path: ['periodEnd'],
      });
    }
  });

export const updateReportSchema = z
  .object({
    recipientEmail: z.string().trim().email('Укажите корректный email').optional(),
    status: z.nativeEnum(ReportStatus, {
      errorMap: () => ({ message: 'Недопустимый статус отчёта' }),
    }).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Укажите хотя бы одно поле для обновления',
  });

export const emailReportSchema = z.object({
  recipientEmail: z.string().trim().email('Укажите корректный email').optional(),
});

export type ListReportsQuery = z.infer<typeof listReportsQuerySchema>;
export type CreateReportInput = z.infer<typeof createReportSchema>;
export type UpdateReportInput = z.infer<typeof updateReportSchema>;
export type EmailReportInput = z.infer<typeof emailReportSchema>;
