import nodemailer from 'nodemailer';
import { AppError } from '../lib/errors.js';

const smtpHost = process.env.SMTP_HOST;
const smtpPort = Number(process.env.SMTP_PORT ?? 587);
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;
const smtpFrom = process.env.SMTP_FROM ?? 'QuestSync <noreply@questsync.test>';

function createTransport() {
  if (!smtpHost) {
    return nodemailer.createTransport({
      jsonTransport: true,
    });
  }

  return nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: smtpUser && smtpPass ? { user: smtpUser, pass: smtpPass } : undefined,
  });
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
      from: smtpFrom,
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
    throw new AppError(502, 'Failed to deliver report by email');
  }
}
