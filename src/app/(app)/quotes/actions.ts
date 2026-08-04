"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "../../../crmlib/prisma";
import { nextNumber } from "../../../crmlib/numbering";
import { parseDocumentPayload, lineItemCreateData } from "../../../crmlib/parsePayload";
import type { QuoteStatus } from "@prisma/client";

export async function createQuote(formData: FormData) {
  const doc = parseDocumentPayload(formData);
  const number = await nextNumber("QUOTE");
  const quote = await prisma.quote.create({
    data: {
      number,
      customerId: doc.customerId,
      notes: doc.notes,
      validUntil: doc.date,
      taxRate: doc.taxRate,
      subtotal: doc.subtotal,
      taxAmount: doc.taxAmount,
      total: doc.total,
      mrcTotal: doc.mrcTotal,
      lineItems: { create: lineItemCreateData(doc.items) },
    },
  });
  revalidatePath("/quotes");
  redirect(`/quotes/${quote.id}`);
}

export async function updateQuote(id: string, formData: FormData) {
  const doc = parseDocumentPayload(formData);
  await prisma.$transaction([
    prisma.lineItem.deleteMany({ where: { quoteId: id } }),
    prisma.quote.update({
      where: { id },
      data: {
        customerId: doc.customerId,
        notes: doc.notes,
        validUntil: doc.date,
        taxRate: doc.taxRate,
        subtotal: doc.subtotal,
        taxAmount: doc.taxAmount,
        total: doc.total,
        mrcTotal: doc.mrcTotal,
        lineItems: { create: lineItemCreateData(doc.items) },
      },
    }),
  ]);
  revalidatePath("/quotes");
  revalidatePath(`/quotes/${id}`);
  redirect(`/quotes/${id}`);
}

export async function setQuoteStatus(id: string, status: QuoteStatus) {
  await prisma.quote.update({ where: { id }, data: { status } });
  revalidatePath("/quotes");
  revalidatePath(`/quotes/${id}`);
}

export async function deleteQuote(id: string) {
  await prisma.quote.delete({ where: { id } });
  revalidatePath("/quotes");
  redirect("/quotes");
}

/**
 * Convert a quote into a service order, copying line items and totals.
 * Marks the quote CONVERTED.
 */
export async function convertQuoteToOrder(id: string) {
  const quote = await prisma.quote.findUnique({
    where: { id },
    include: { lineItems: { orderBy: { sortOrder: "asc" } } },
  });
  if (!quote) throw new Error("Quote not found");

  const number = await nextNumber("ORDER");
  const order = await prisma.serviceOrder.create({
    data: {
      number,
      customerId: quote.customerId,
      quoteId: quote.id,
      notes: quote.notes,
      taxRate: quote.taxRate,
      subtotal: quote.subtotal,
      taxAmount: quote.taxAmount,
      total: quote.total,
      mrcTotal: quote.mrcTotal,
      lineItems: {
        create: quote.lineItems.map((li, idx) => ({
          description: li.description,
          quantity: li.quantity,
          unitPrice: li.unitPrice,
          mrc: li.mrc,
          lineTotal: li.lineTotal,
          productId: li.productId,
          equipmentId: li.equipmentId,
          sortOrder: idx,
        })),
      },
    },
  });

  await prisma.quote.update({
    where: { id },
    data: { status: "CONVERTED" },
  });

  revalidatePath("/quotes");
  revalidatePath("/orders");
  redirect(`/orders/${order.id}`);
}
