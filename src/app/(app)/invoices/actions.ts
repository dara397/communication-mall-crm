"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "../../../crmlib/prisma";
import { nextNumber } from "../../../crmlib/numbering";
import { parseDocumentPayload, lineItemCreateData } from "../../../crmlib/parsePayload";
import type { InvoiceStatus } from "@prisma/client";

export async function createInvoice(formData: FormData) {
  const doc = parseDocumentPayload(formData);
  const number = await nextNumber("INVOICE");
  const invoice = await prisma.invoice.create({
    data: {
      number,
      customerId: doc.customerId,
      notes: doc.notes,
      issuedAt: new Date(),
      dueDate: doc.date,
      taxRate: doc.taxRate,
      subtotal: doc.subtotal,
      taxAmount: doc.taxAmount,
      total: doc.total,
      mrcTotal: doc.mrcTotal,
      lineItems: { create: lineItemCreateData(doc.items) },
    },
  });
  revalidatePath("/invoices");
  redirect(`/invoices/${invoice.id}`);
}

export async function updateInvoice(id: string, formData: FormData) {
  const doc = parseDocumentPayload(formData);
  await prisma.$transaction([
    prisma.lineItem.deleteMany({ where: { invoiceId: id } }),
    prisma.invoice.update({
      where: { id },
      data: {
        customerId: doc.customerId,
        notes: doc.notes,
        dueDate: doc.date,
        taxRate: doc.taxRate,
        subtotal: doc.subtotal,
        taxAmount: doc.taxAmount,
        total: doc.total,
        mrcTotal: doc.mrcTotal,
        lineItems: { create: lineItemCreateData(doc.items) },
      },
    }),
  ]);
  revalidatePath("/invoices");
  revalidatePath(`/invoices/${id}`);
  redirect(`/invoices/${id}`);
}

export async function setInvoiceStatus(id: string, status: InvoiceStatus) {
  await prisma.invoice.update({
    where: { id },
    data: {
      status,
      paidAt: status === "PAID" ? new Date() : status === "DRAFT" ? null : undefined,
    },
  });
  revalidatePath("/invoices");
  revalidatePath(`/invoices/${id}`);
}

export async function deleteInvoice(id: string) {
  await prisma.invoice.delete({ where: { id } });
  revalidatePath("/invoices");
  redirect("/invoices");
}
