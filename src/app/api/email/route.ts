import { NextRequest, NextResponse } from "next/server";
import { getSession } from "../../../crmlib/auth";
import { loadDocForPdf } from "../../../crmlib/docData";
import { renderDocumentPdf } from "../../../crmlib/pdf";
import { sendDocumentEmail, documentEmailHtml } from "../../../crmlib/email";
import { prisma } from "../../../crmlib/prisma";
import { money } from "../../../crmlib/format";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { type?: string; id?: string; to?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { type, id, to } = body;
  if (!type || !id || !to) {
    return NextResponse.json(
      { error: "Missing type, id, or recipient email." },
      { status: 400 }
    );
  }

  const doc = await loadDocForPdf(type, id);
  if (!doc) return NextResponse.json({ error: "Document not found." }, { status: 404 });

  const pdf = await renderDocumentPdf(doc.pdf);
  const html = documentEmailHtml({
    docLabel: doc.pdf.docLabel,
    number: doc.number,
    total: money(doc.pdf.total),
  });

  const result = await sendDocumentEmail({
    to,
    subject: `${doc.pdf.docLabel} ${doc.number}`,
    html,
    fileName: doc.fileName,
    pdf,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 502 });
  }

  // Best-effort: bump status to SENT when emailing a draft quote/invoice.
  try {
    if (type === "quote") {
      await prisma.quote.updateMany({
        where: { id, status: { in: ["DRAFT"] } },
        data: { status: "SENT" },
      });
    } else if (type === "invoice") {
      await prisma.invoice.updateMany({
        where: { id, status: { in: ["DRAFT"] } },
        data: { status: "SENT" },
      });
    }
  } catch {
    // ignore
  }

  return NextResponse.json({ ok: true, id: result.id });
}
