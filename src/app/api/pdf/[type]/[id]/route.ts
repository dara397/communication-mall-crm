import { NextRequest, NextResponse } from "next/server";
import { getSession } from "../../../../../crmlib/auth";
import { loadDocForPdf } from "../../../../../crmlib/docData";
import { renderDocumentPdf } from "../../../../../crmlib/pdf";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  _req: NextRequest,
  { params }: { params: { type: string; id: string } }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const doc = await loadDocForPdf(params.type, params.id);
  if (!doc) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const buffer = await renderDocumentPdf(doc.pdf);
  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${doc.fileName}"`,
      "Cache-Control": "no-store",
    },
  });
}
