import { prisma } from "./prisma";
import type { PdfData } from "./pdf";
import { shortDate } from "./format";

export type LoadedDoc = {
  pdf: PdfData;
  fileName: string;
  customerEmail: string | null;
  number: string;
};

export async function loadQuoteForPdf(id: string): Promise<LoadedDoc | null> {
  const q = await prisma.quote.findUnique({
    where: { id },
    include: { customer: true, lineItems: { orderBy: { sortOrder: "asc" } } },
  });
  if (!q) return null;
  return {
    number: q.number,
    customerEmail: q.customer.email,
    fileName: `Quote-${q.number}.pdf`,
    pdf: {
      docLabel: "Quote",
      number: q.number,
      dateLabel: "Date",
      dateValue: shortDate(q.createdAt),
      customer: q.customer,
      lineItems: q.lineItems,
      subtotal: q.subtotal,
      taxRate: q.taxRate,
      taxAmount: q.taxAmount,
      total: q.total,
      mrcTotal: q.mrcTotal,
      notes: q.notes,
    },
  };
}

export async function loadInvoiceForPdf(id: string): Promise<LoadedDoc | null> {
  const inv = await prisma.invoice.findUnique({
    where: { id },
    include: { customer: true, lineItems: { orderBy: { sortOrder: "asc" } } },
  });
  if (!inv) return null;
  return {
    number: inv.number,
    customerEmail: inv.customer.email,
    fileName: `Invoice-${inv.number}.pdf`,
    pdf: {
      docLabel: "Invoice",
      number: inv.number,
      dateLabel: inv.dueDate ? "Due" : "Date",
      dateValue: shortDate(inv.dueDate || inv.issuedAt || inv.createdAt),
      customer: inv.customer,
      lineItems: inv.lineItems,
      subtotal: inv.subtotal,
      taxRate: inv.taxRate,
      taxAmount: inv.taxAmount,
      total: inv.total,
      mrcTotal: inv.mrcTotal,
      notes: inv.notes,
    },
  };
}

export async function loadDocForPdf(
  type: string,
  id: string
): Promise<LoadedDoc | null> {
  if (type === "quote") return loadQuoteForPdf(id);
  if (type === "invoice") return loadInvoiceForPdf(id);
  return null;
}
