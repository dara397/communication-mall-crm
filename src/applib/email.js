import { getCompany } from './db';
import { money, day } from './format';

/** Is email turned on? Controlled by one env var in SETTINGS.txt. */
export const emailConfigured = () => Boolean(process.env.RESEND_API_KEY);

function lineRows(items) {
  return items
    .map(
      (li) =>
        `<tr>
          <td style="padding:6px 10px;border-bottom:1px solid #eee">${li.description}</td>
          <td style="padding:6px 10px;border-bottom:1px solid #eee;text-align:right">${li.qty}</td>
          <td style="padding:6px 10px;border-bottom:1px solid #eee;text-align:right">${money(li.unitPrice)}</td>
          <td style="padding:6px 10px;border-bottom:1px solid #eee;text-align:right">${money(li.qty * li.unitPrice)}</td>
        </tr>`
    )
    .join('');
}

/** Builds a simple, self-contained HTML document for a quote or invoice. */
export function documentHtml({ company, customer, doc, kind, totals }) {
  const heading = kind === 'quote' ? 'Quote' : 'Invoice';
  const dateLabel = kind === 'quote' ? `Valid until ${day(doc.validUntil)}` : `Due ${day(doc.dueDate)}`;

  return `<!doctype html><html><body style="font-family:Arial,sans-serif;color:#12181d;max-width:640px;margin:0 auto;padding:24px">
    <div style="display:flex;justify-content:space-between;border-bottom:2px solid #12181d;padding-bottom:12px;margin-bottom:16px">
      <div>
        <div style="font-size:20px;font-weight:700">${company.name}</div>
        <div style="color:#666;font-size:13px">${company.address || ''} · ${company.phone || ''}</div>
      </div>
      <div style="text-align:right">
        <div style="font-size:22px;font-weight:700">${heading}</div>
        <div style="color:#666;font-size:13px">${doc.number}</div>
      </div>
    </div>
    <div style="margin-bottom:16px">
      <div style="color:#666;font-size:11px;text-transform:uppercase;letter-spacing:.08em">Bill to</div>
      <div style="font-weight:600">${customer.name}</div>
      <div style="color:#666;font-size:13px">${[customer.address, customer.city, customer.state, customer.zip].filter(Boolean).join(', ')}</div>
    </div>
    <div style="font-weight:600;margin-bottom:8px">${doc.title}</div>
    <table style="width:100%;border-collapse:collapse;font-size:14px">
      <thead>
        <tr style="text-align:left;color:#666;font-size:11px;text-transform:uppercase">
          <th style="padding:6px 10px">Description</th>
          <th style="padding:6px 10px;text-align:right">Qty</th>
          <th style="padding:6px 10px;text-align:right">Unit</th>
          <th style="padding:6px 10px;text-align:right">Amount</th>
        </tr>
      </thead>
      <tbody>${lineRows(doc.items)}</tbody>
    </table>
    <div style="margin-top:16px;text-align:right;font-size:14px">
      <div style="color:#666">Subtotal ${money(totals.subtotal)}</div>
      <div style="color:#666">Tax ${money(totals.tax)}</div>
      <div style="font-size:18px;font-weight:700;margin-top:6px">Total ${money(totals.total)}</div>
    </div>
    <div style="margin-top:12px;color:#666;font-size:13px">${dateLabel}</div>
    ${doc.notes ? `<div style="margin-top:16px;padding-top:12px;border-top:1px solid #eee;color:#444;font-size:13px">${doc.notes}</div>` : ''}
  </body></html>`;
}

/** Sends via Resend. Returns {ok, error}. Never throws. */
export async function sendDocumentEmail({ to, subject, html }) {
  if (!emailConfigured()) {
    return {
      ok: false,
      error:
        "Email isn't set up. Your SETTINGS.txt has no RESEND_API_KEY, or the app wasn't restarted after you added it. Close the black window, run SETUP, then SHARE-ON-NETWORK.",
    };
  }
  if (!to) return { ok: false, error: 'This customer has no email address on file.' };

  const company = await getCompany();
  // Until you verify your own domain in Resend, this MUST be onboarding@resend.dev.
  const from = process.env.EMAIL_FROM?.trim() || 'onboarding@resend.dev';

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from: `${company.name} <${from}>`, to: [to], subject, html }),
    });

    if (!res.ok) {
      let reason = `HTTP ${res.status}`;
      try {
        const body = await res.json();
        if (body?.message) reason = body.message;
      } catch {
        /* keep the HTTP status */
      }
      let hint = '';
      if (/domain is not verified|not verified/i.test(reason)) {
        hint =
          ' - Your "from" domain is not verified in Resend. Leave EMAIL_FROM blank in SETTINGS.txt so it uses onboarding@resend.dev, or verify your domain in Resend first.';
      } else if (/testing emails to your own|can only send testing/i.test(reason)) {
        hint =
          ' - A new Resend account can only email the address you signed up with until you verify a domain. Verify communicationmall.com in Resend to email customers.';
      } else if (/api key is invalid|unauthorized|401/i.test(reason)) {
        hint =
          ' - The API key looks wrong. Recopy it from Resend into SETTINGS.txt, then run SETUP again.';
      }
      return { ok: false, error: `Resend refused: ${reason}${hint}` };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: `Couldn't reach the email service: ${e.message}` };
  }
}
