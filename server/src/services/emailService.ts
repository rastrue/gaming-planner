import nodemailer from 'nodemailer';
import type SMTPTransport from 'nodemailer/lib/smtp-transport/index.js';
import { AppError } from '../lib/errors.js';

const smtpHost = process.env.SMTP_HOST?.trim();
const smtpPort = Number(process.env.SMTP_PORT ?? 587);
const smtpUser = process.env.SMTP_USER?.trim();
const smtpPass = process.env.SMTP_PASS;
const smtpFrom = process.env.SMTP_FROM?.trim();

export function isEmailDeliveryConfigured(): boolean {
  return Boolean(smtpHost && smtpUser && smtpPass);
}

function assertSmtpConfigured(): void {
  if (!smtpHost) {
    throw new AppError(
      503,
      'Email delivery is not configured. Set SMTP_HOST, SMTP_USER, and SMTP_PASS in the root .env file.',
    );
  }

  if (!smtpUser || !smtpPass) {
    throw new AppError(
      503,
      'SMTP authentication is not configured. Set SMTP_USER and SMTP_PASS in the root .env file.',
    );
  }
}

function createTransport() {
  assertSmtpConfigured();

  const options: SMTPTransport.Options = {
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: {
      user: smtpUser!,
      pass: smtpPass!,
    },
  };

  if (smtpPort === 587) {
    options.requireTLS = true;
  }

  return nodemailer.createTransport(options);
}

function resolveFromAddress(): string {
  if (smtpFrom) {
    return smtpFrom;
  }

  if (smtpUser) {
    return `QuestSync <${smtpUser}>`;
  }

  return 'QuestSync <noreply@questsync.test>';
}

export async function sendReportEmail(options: {
  to: string;
  subject: string;
  text: string;
  fileName: string;
  fileBuffer: Buffer;
  mimeType: string;
}): Promise<void> {
  const transport = createTransport();

  try {
    await transport.sendMail({
      from: resolveFromAddress(),
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
    const detail = error instanceof Error ? error.message : 'Unknown email error';
    throw new AppError(502, `Failed to deliver report by email: ${detail}`);
  }
}
