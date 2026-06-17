import nodemailer from 'nodemailer';
import type SMTPTransport from 'nodemailer/lib/smtp-transport/index.js';
import { AppError } from '../lib/errors.js';

interface SmtpConfig {
  host: string;
  port: number;
  user: string;
  pass: string;
  from?: string;
}

function readSmtpConfig(): Partial<SmtpConfig> {
  return {
    host: process.env.SMTP_HOST?.trim(),
    port: Number(process.env.SMTP_PORT ?? 587),
    user: process.env.SMTP_USER?.trim(),
    pass: process.env.SMTP_PASS?.trim(),
    from: process.env.SMTP_FROM?.trim(),
  };
}

export function isEmailDeliveryConfigured(): boolean {
  const config = readSmtpConfig();
  return Boolean(config.host && config.user && config.pass);
}

function assertSmtpConfigured(): SmtpConfig {
  const config = readSmtpConfig();

  if (!config.host) {
    throw new AppError(
      503,
      'Отправка email не настроена. Укажите SMTP_HOST, SMTP_USER и SMTP_PASS в корневом файле .env.',
    );
  }

  if (!config.user || !config.pass) {
    throw new AppError(
      503,
      'SMTP-аутентификация не настроена. Укажите SMTP_USER и SMTP_PASS в корневом файле .env.',
    );
  }

  return {
    host: config.host,
    port: config.port ?? 587,
    user: config.user,
    pass: config.pass,
    from: config.from,
  };
}

function createTransport(config: SmtpConfig) {
  const options: SMTPTransport.Options = {
    host: config.host,
    port: config.port,
    secure: config.port === 465,
    auth: {
      user: config.user,
      pass: config.pass,
    },
  };

  if (config.port === 587) {
    options.requireTLS = true;
  }

  return nodemailer.createTransport(options);
}

function resolveFromAddress(config: SmtpConfig): string {
  if (config.from) {
    return config.from;
  }

  return `QuestSync <${config.user}>`;
}

export async function sendReportEmail(options: {
  to: string;
  subject: string;
  text: string;
  fileName: string;
  fileBuffer: Buffer;
  mimeType: string;
}): Promise<void> {
  const smtpConfig = assertSmtpConfigured();
  const transport = createTransport(smtpConfig);

  try {
    await transport.sendMail({
      from: resolveFromAddress(smtpConfig),
      to: options.to,
      subject: options.subject,
      text: options.text,
      attachments: [
        {
          filename: options.fileName,
          content: options.fileBuffer,
          contentType: options.mimeType,
        },
      ],
    });
  } catch (error) {
    console.error('Email delivery failed:', error);
    const detail = error instanceof Error ? error.message : 'Неизвестная ошибка email';
    throw new AppError(502, `Не удалось отправить отчёт по email: ${detail}`);
  }
}
