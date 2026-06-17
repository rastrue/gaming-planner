import { z } from 'zod';

export const eventSlotEventParamsSchema = z.object({
  eventId: z.coerce.number().int().positive('Идентификатор события должен быть положительным целым числом'),
});

export const slotIdParamsSchema = z.object({
  id: z.coerce.number().int().positive('Идентификатор слота должен быть положительным целым числом'),
});

export const createSlotSchema = z.object({
  roleName: z
    .string()
    .trim()
    .min(1, 'Название роли обязательно')
    .max(64, 'Название роли должно содержать не более 64 символов'),
  displayOrder: z.coerce.number().int().positive('Порядок отображения должен быть положительным целым числом'),
  requiredCount: z.coerce.number().int().positive('Требуемое количество должно быть не меньше 1'),
});

export const updateSlotSchema = createSlotSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: 'Укажите хотя бы одно поле для обновления' },
);

export type CreateSlotInput = z.infer<typeof createSlotSchema>;
export type UpdateSlotInput = z.infer<typeof updateSlotSchema>;
