import bcrypt from 'bcryptjs';
import { UserRoleName } from '@prisma/client';
import { AppError } from '../lib/errors.js';
import prisma from '../lib/prisma.js';
import type { LoginInput, RegisterInput } from '../validators/authValidator.js';

export interface PublicUser {
  id: number;
  username: string;
  email: string;
  displayName: string;
  role: {
    id: number;
    name: UserRoleName;
    description: string;
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

function toPublicUser(user: {
  id: number;
  username: string;
  email: string;
  displayName: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  role: {
    id: number;
    name: UserRoleName;
    description: string;
  };
}): PublicUser {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    displayName: user.displayName,
    role: user.role,
    isActive: user.isActive,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

const userWithRoleSelect = {
  id: true,
  username: true,
  email: true,
  displayName: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
  role: {
    select: {
      id: true,
      name: true,
      description: true,
    },
  },
} as const;

export async function registerUser(input: RegisterInput): Promise<PublicUser> {
  const role = await prisma.role.findUnique({
    where: { name: input.roleName },
  });

  if (!role) {
    throw new AppError(500, 'Выбранная роль не настроена');
  }

  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [{ username: input.username }, { email: input.email.toLowerCase() }],
    },
    select: { username: true, email: true },
  });

  if (existingUser) {
    if (existingUser.username === input.username) {
      throw new AppError(409, 'Имя пользователя уже занято');
    }

    throw new AppError(409, 'Email уже зарегистрирован');
  }

  const passwordHash = await bcrypt.hash(input.password, 10);

  const user = await prisma.user.create({
    data: {
      username: input.username,
      email: input.email.toLowerCase(),
      passwordHash,
      displayName: input.displayName,
      roleId: role.id,
    },
    select: userWithRoleSelect,
  });

  return toPublicUser(user);
}

export async function loginUser(input: LoginInput): Promise<PublicUser> {
  const identifier = input.identifier.trim();
  const user = await prisma.user.findFirst({
    where: {
      OR: [{ email: identifier.toLowerCase() }, { username: identifier }],
    },
    select: {
      ...userWithRoleSelect,
      passwordHash: true,
    },
  });

  if (!user || !user.isActive) {
    throw new AppError(401, 'Неверные учётные данные');
  }

  const passwordMatches = await bcrypt.compare(input.password, user.passwordHash);

  if (!passwordMatches) {
    throw new AppError(401, 'Неверные учётные данные');
  }

  const { passwordHash: _passwordHash, ...publicUser } = user;
  return toPublicUser(publicUser);
}

export async function getUserById(userId: number): Promise<PublicUser> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: userWithRoleSelect,
  });

  if (!user || !user.isActive) {
    throw new AppError(401, 'Пользователь не найден или неактивен');
  }

  return toPublicUser(user);
}
