import { Resend } from "resend";
import { company } from "./config";

export type SendResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

export function emailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);
}

export async function sendDocumentEmail({
  to,
  subject,
  html,
  fileName,
  pdf,
}: {
  to: string;
  subject: string;
  html: string;
  fileName: string;
  pdf: Buffer;
}): Promise<SendResult> {
  const resend = getResend();
  const from = process.env.EMAIL_FROM;
  if (!resend) return { ok: false, error: "RESEND_API_KEY is not set." };
  if (!from) return { ok: false, error: "EMAIL_FROM is not set." };

  try {
    const { data, error } = await resend.emails.send({
      from,
      to,
      subject,
      html,
      attachments: [{ filename: fileName, content: pdf }],
    });
    if (error) return { ok: false, error: error.message || String(error) };
    return { ok: true, id: data?.id || "sent" };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function sendTestEmail(to: string): Promise<SendResult> {
  const resend = getResend();
  const from = process.env.EMAIL_FROM;
  if (!resend) return { ok: false, error: "RESEND_API_KEY is not set." };
  if (!from) return { ok: false, error: "EMAIL_FROM is not set." };
  try {
    const { data, error } = await resend.emails.send({
      from,
      to,
      subject: `${company.name} CRM — test email`,
      html: `<p>This is a test email from your ${company.name} CRM. If you received this, Resend is configured correctly.</p>`,
    });
    if (error) return { ok: false, error: error.message || String(error) };
    return { ok: true, id: data?.id || "sent" };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export function documentEmailHtml({
  docLabel,
  number,
  total,
}: {
  docLabel: string;
  number: string;
  total: string;
}): string {
  return `
  <div style="font-family: Arial, sans-serif; color: #334155;">
    <p>Hello,</p>
    <p>Please find your ${docLabel.toLowerCase()} <strong>${number}</strong> from ${company.name} attached as a PDF.</p>
    <p><strong>Total: ${total}</strong></p>
    <p>Thank you for your business.</p>
    <p style="color:#64748b;font-size:12px;">${company.name}${
    company.phone ? ` · ${company.phone}` : ""
  }${company.email ? ` · ${company.email}` : ""}</p>
  </div>`;
}
