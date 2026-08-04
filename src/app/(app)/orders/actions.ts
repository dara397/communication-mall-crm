"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "../../../crmlib/prisma";
import { nextNumber } from "../../../crmlib/numbering";
import { parseDocumentPayload, lineItemCreateData } from "../../../crmlib/parsePayload";
import type { OrderStatus } from "@prisma/client";

export async function createOrder(formData: FormData) {
  const doc = parseDocumentPayload(formData);
  const number = await nextNumber("ORDER");
  const order = await prisma.serviceOrder.create({
    data: {
      number,
      customerId: doc.customerId,
      notes: doc.notes,
      scheduledAt: doc.date,
      taxRate: doc.taxRate,
      subtotal: doc.subtotal,
      taxAmount: doc.taxAmount,
      total: doc.total,
      mrcTotal: doc.mrcTotal,
      lineItems: { create: lineItemCreateData(doc.items) },
    },
  });
  revalidatePath("/orders");
  revalidatePath("/schedule");
  redirect(`/orders/${order.id}`);
}

export async function updateOrder(id: string, formData: FormData) {
  const doc = parseDocumentPayload(formData);
  await prisma.$transaction([
    prisma.lineItem.deleteMany({ where: { serviceOrderId: id } }),
    prisma.serviceOrder.update({
      where: { id },
      data: {
        customerId: doc.customerId,
        notes: doc.notes,
        scheduledAt: doc.date,
        taxRate: doc.taxRate,
        subtotal: doc.subtotal,
        taxAmount: doc.taxAmount,
        total: doc.total,
        mrcTotal: doc.mrcTotal,
        lineItems: { create: lineItemCreateData(doc.items) },
      },
    }),
  ]);
  revalidatePath("/orders");
  revalidatePath("/schedule");
  revalidatePath(`/orders/${id}`);
  redirect(`/orders/${id}`);
}

export async function setOrderStatus(id: string, status: OrderStatus) {
  await prisma.serviceOrder.update({
    where: { id },
    data: {
      status,
      completedAt: status === "COMPLETED" ? new Date() : undefined,
    },
  });
  revalidatePath("/orders");
  revalidatePath("/schedule");
  revalidatePath(`/orders/${id}`);
}

export async function rescheduleOrder(id: string, formData: FormData) {
  const value = (formData.get("scheduledAt") || "").toString();
  const date = value ? new Date(value) : null;
  await prisma.serviceOrder.update({
    where: { id },
    data: { scheduledAt: date && !isNaN(date.getTime()) ? date : null },
  });
  revalidatePath("/orders");
  revalidatePath("/schedule");
  revalidatePath(`/orders/${id}`);
}

export async function deleteOrder(id: string) {
  await prisma.serviceOrder.delete({ where: { id } });
  revalidatePath("/orders");
  revalidatePath("/schedule");
  redirect("/orders");
}

export async function convertOrderToInvoice(id: string) {
  const order = await prisma.serviceOrder.findUnique({
    where: { id },
    include: { lineItems: { orderBy: { sortOrder: "asc" } } },
  });
  if (!order) throw new Error("Service order not found");

  const number = await nextNumber("INVOICE");
  const due = new Date();
  due.setDate(due.getDate() + 30);

  const invoice = await prisma.invoice.create({
    data: {
      number,
      customerId: order.customerId,
      serviceOrderId: order.id,
      status: "DRAFT",
      notes: order.notes,
      issuedAt: new Date(),
      dueDate: due,
      taxRate: order.taxRate,
      subtotal: order.subtotal,
      taxAmount: order.taxAmount,
      total: order.total,
      mrcTotal: order.mrcTotal,
      lineItems: {
        create: order.lineItems.map((li, idx) => ({
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

  await prisma.serviceOrder.update({
    where: { id },
    data: { status: "INVOICED" },
  });

  revalidatePath("/orders");
  revalidatePath("/invoices");
  redirect(`/invoices/${invoice.id}`);
}
