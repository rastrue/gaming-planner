import { UserRoleName } from '@prisma/client';
import { z } from 'zod';

export const registerSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, 'Имя пользователя должно содержать минимум 3 символа')
    .max(32, 'Имя пользователя должно содержать не более 32 символов')
    .regex(/^[a-zA-Z0-9_]+$/, 'Имя пользователя может содержать только буквы, цифры и символ подчёркивания'),
  email: z.string().trim().email('Укажите корректный email'),
  password: z
    .string()
    .min(8, 'Пароль должен содержать минимум 8 символов')
    .max(128, 'Пароль должен содержать не более 128 символов'),
  displayName: z
    .string()
    .trim()
    .min(1, 'Отображаемое имя обязательно')
    .max(64, 'Отображаемое имя должно содержать не более 64 символов'),
  roleName: z.nativeEnum(UserRoleName, {
    errorMap: () => ({ message: 'Выберите роль' }),
  }),
});

export const loginSchema = z.object({
  identifier: z.string().trim().min(1, 'Укажите email или имя пользователя'),
  password: z.string().min(1, 'Пароль обязателен'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
