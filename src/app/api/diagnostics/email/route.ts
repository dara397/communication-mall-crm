import { NextRequest, NextResponse } from "next/server";
import { getSession } from "../../../../crmlib/auth";
import { sendTestEmail, emailConfigured } from "../../../../crmlib/email";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!emailConfigured()) {
    return NextResponse.json(
      { error: "Email is not configured. Set RESEND_API_KEY and EMAIL_FROM." },
      { status: 400 }
    );
  }
  let to = "";
  try {
    to = (await req.json()).to;
  } catch {
    /* ignore */
  }
  if (!to) return NextResponse.json({ error: "Recipient email required." }, { status: 400 });

  const result = await sendTestEmail(to);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 502 });
  return NextResponse.json({ ok: true, id: result.id });
}
