'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import bcrypt from 'bcryptjs';
import { prisma } from './prisma';
import { nextNumber, totals, cents, getCompany } from './db';
import { today, addDays } from './format';
import { auth } from '@/auth';
import { documentHtml, sendDocumentEmail } from './email';

/* ---------------- guards ---------------- */

async function requireUser() {
  const session = await auth();
  if (!session?.user) redirect('/sign-in');
  return session.user;
}

async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== 'admin') throw new Error('Admins only.');
  return user;
}

const num = (v, fallback = 0) => {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : fallback;
};
const str = (v, fallback = '') => (typeof v === 'string' ? v.trim() : fallback);

/* ---------------- customers ---------------- */

export async function saveCustomer(formData) {
  await requireUser();
  const id = formData.get('id');
  const name = str(formData.get('name'));
  if (!name) return;

  const data = {
    name,
    contact: str(formData.get('contact')),
    email: str(formData.get('email')),
    phone: str(formData.get('phone')),
    address: str(formData.get('address')),
    city: str(formData.get('city')),
    state: str(formData.get('state')),
    zip: str(formData.get('zip')),
    notes: str(formData.get('notes')),
  };

  if (id) await prisma.customer.update({ where: { id }, data });
  else await prisma.customer.create({ data });

  revalidatePath('/customers');
}

export async function deleteCustomer(formData) {
  await requireAdmin();
  await prisma.customer.delete({ where: { id: formData.get('id') } });
  revalidatePath('/customers');
}

/* ---------------- equipment inventory ---------------- */

export async function saveInventoryItem(formData) {
  await requireUser();
  const id = formData.get('id');
  const sku = str(formData.get('sku')).toUpperCase();
  const name = str(formData.get('name'));
  if (!sku || !name) return;

  const data = {
    sku,
    name,
    category: str(formData.get('category')) || 'Uncategorized',
    unit: str(formData.get('unit')) || 'each',
    cost: cents(num(formData.get('cost'))),
    price: cents(num(formData.get('price'))),
    stock: Math.round(num(formData.get('stock'))),
  };

  if (id) await prisma.inventoryItem.update({ where: { id }, data });
  else await prisma.inventoryItem.upsert({ where: { sku }, update: data, create: data });

  revalidatePath('/inventory');
}

export async function adjustStock(formData) {
  await requireUser();
  const id = formData.get('id');
  const delta = Math.round(num(formData.get('delta')));
  const item = await prisma.inventoryItem.findUnique({ where: { id } });
  if (!item) return;
  await prisma.inventoryItem.update({
    where: { id },
    data: { stock: Math.max(0, item.stock + delta) },
  });
  revalidatePath('/inventory');
}

export async function deleteInventoryItem(formData) {
  await requireAdmin();
  await prisma.inventoryItem.delete({ where: { id: formData.get('id') } });
  revalidatePath('/inventory');
}

/* ---------------- quotes ---------------- */

export async function createQuote(formData) {
  await requireUser();
  const customerId = formData.get('customerId');
  if (!customerId) return;

  const company = await getCompany();

  const quote = await prisma.$transaction(async (tx) => {
    const number = await nextNumber(tx, 'quote');
    return tx.quote.create({
      data: {
        number,
        customerId,
        title: str(formData.get('title')) || 'New quote',
        issueDate: today(),
        validUntil: addDays(30),
        siteAddress: str(formData.get('siteAddress')),
        notes: str(formData.get('notes')),
        taxRate: num(formData.get('taxRate'), company.defaultTaxRate),
      },
    });
  });

  revalidatePath('/quotes');
  redirect(`/quotes/${quote.id}`);
}

export async function updateQuote(formData) {
  await requireUser();
  const id = formData.get('id');
  const quote = await prisma.quote.findUnique({ where: { id }, include: { order: true } });
  if (!quote || quote.order) return;

  await prisma.quote.update({
    where: { id },
    data: {
      title: str(formData.get('title')) || quote.title,
      status: formData.get('status') || quote.status,
      validUntil: formData.get('validUntil') || quote.validUntil,
      siteAddress: str(formData.get('siteAddress')),
      notes: str(formData.get('notes')),
      taxRate: num(formData.get('taxRate'), quote.taxRate),
    },
  });
  revalidatePath(`/quotes/${id}`);
  revalidatePath('/quotes');
}

export async function setQuoteStatus(formData) {
  await requireUser();
  const id = formData.get('id');
  await prisma.quote.update({ where: { id }, data: { status: formData.get('status') } });
  revalidatePath(`/quotes/${id}`);
  revalidatePath('/quotes');
}

/** Pull a part straight off the equipment inventory onto the quote. */
export async function addPartToQuote(formData) {
  await requireUser();
  const quoteId = formData.get('quoteId');
  const inventoryId = formData.get('inventoryId');
  const quantity = Math.max(1, Math.round(num(formData.get('qty'), 1)));

  await prisma.$transaction(async (tx) => {
    const quote = await tx.quote.findUnique({
      where: { id: quoteId },
      include: { items: true, order: true },
    });
    const part = await tx.inventoryItem.findUnique({ where: { id: inventoryId } });
    if (!quote || quote.order || !part) return;

    const existing = quote.items.find((li) => li.inventoryId === part.id);
    if (existing) {
      await tx.lineItem.update({
        where: { id: existing.id },
        data: { qty: existing.qty + quantity },
      });
    } else {
      await tx.lineItem.create({
        data: {
          quoteId,
          kind: 'Part',
          inventoryId: part.id,
          sku: part.sku,
          description: part.name,
          qty: quantity,
          unitPrice: part.price,
          taxable: true,
          position: quote.items.length,
        },
      });
    }
  });

  revalidatePath(`/quotes/${quoteId}`);
}

/** Add a service from the telecom price book — carries setup fee AND monthly. */
export async function addCatalogToQuote(formData) {
  await requireUser();
  const quoteId = formData.get('quoteId');
  const catalogId = formData.get('catalogId');
  const quantity = Math.max(1, Math.round(num(formData.get('qty'), 1)));

  await prisma.$transaction(async (tx) => {
    const quote = await tx.quote.findUnique({
      where: { id: quoteId },
      include: { items: true, order: true },
    });
    const item = await tx.catalogItem.findUnique({ where: { id: catalogId } });
    if (!quote || quote.order || !item) return;

    const existing = quote.items.find((li) => li.catalogId === item.id);
    if (existing) {
      await tx.lineItem.update({
        where: { id: existing.id },
        data: { qty: existing.qty + quantity },
      });
    } else {
      await tx.lineItem.create({
        data: {
          quoteId,
          kind: item.mrc > 0 ? 'Recurring' : 'Service',
          catalogId: item.id,
          sku: item.usoc,
          description: item.name,
          qty: quantity,
          unitPrice: item.nrc, // one-time setup (NRC)
          monthly: item.mrc, // per-month (MRC)
          taxable: true,
          position: quote.items.length,
        },
      });
    }
  });

  revalidatePath(`/quotes/${quoteId}`);
}

/** Labor, service plans, trip charges — anything not stocked. */
export async function addLineToQuote(formData) {
  await requireUser();
  const quoteId = formData.get('quoteId');
  const description = str(formData.get('description'));
  if (!description) return;

  const quote = await prisma.quote.findUnique({
    where: { id: quoteId },
    include: { items: true, order: true },
  });
  if (!quote || quote.order) return;

  await prisma.lineItem.create({
    data: {
      quoteId,
      kind: formData.get('kind') || 'Labor',
      sku: '—',
      description,
      qty: Math.max(0, num(formData.get('qty'), 1)),
      unitPrice: cents(num(formData.get('unitPrice'))),
      monthly: cents(num(formData.get('monthly'))),
      taxable: formData.get('taxable') === 'on',
      position: quote.items.length,
    },
  });
  revalidatePath(`/quotes/${quoteId}`);
}

export async function updateQuoteLine(formData) {
  await requireUser();
  const quoteId = formData.get('quoteId');
  const quote = await prisma.quote.findUnique({ where: { id: quoteId }, include: { order: true } });
  if (!quote) return;

  const description = formData.get('description');
  await prisma.lineItem.update({
    where: { id: formData.get('lineId') },
    data: {
      qty: Math.max(0, num(formData.get('qty'), 1)),
      unitPrice: cents(num(formData.get('unitPrice'))),
      ...(description != null ? { description: str(description) } : {}),
    },
  });
  revalidatePath(`/quotes/${quoteId}`);
  redirect(`/quotes/${quoteId}`);
}

export async function removeQuoteLine(formData) {
  await requireUser();
  const quoteId = formData.get('quoteId');
  const quote = await prisma.quote.findUnique({ where: { id: quoteId }, include: { order: true } });
  if (!quote) return;

  await prisma.lineItem.delete({ where: { id: formData.get('lineId') } });
  revalidatePath(`/quotes/${quoteId}`);
}

export async function deleteQuote(formData) {
  await requireAdmin();
  await prisma.quote.delete({ where: { id: formData.get('id') } });
  revalidatePath('/quotes');
  redirect('/quotes');
}

/**
 * Copy an existing quote — every line item and all its settings — into a
 * brand-new Draft. Leave customerId blank to keep the same customer (a repeat
 * job), or pass a different one to reuse this quote as a template for someone
 * else. Works on locked/converted quotes too; the copy is always a fresh Draft.
 */
export async function duplicateQuote(formData) {
  await requireUser();
  const sourceId = formData.get('id');

  const copy = await prisma.$transaction(async (tx) => {
    const source = await tx.quote.findUnique({
      where: { id: sourceId },
      include: { items: { orderBy: { position: 'asc' } } },
    });
    if (!source) return null;

    const customerId = str(formData.get('customerId')) || source.customerId;
    const number = await nextNumber(tx, 'quote');

    return tx.quote.create({
      data: {
        number,
        customerId,
        title: source.title,
        status: 'Draft',
        issueDate: today(),
        validUntil: addDays(30),
        siteAddress: source.siteAddress,
        notes: source.notes,
        taxRate: source.taxRate,
        items: {
          create: source.items.map((li, i) => ({
            kind: li.kind,
            inventoryId: li.inventoryId,
            catalogId: li.catalogId,
            sku: li.sku,
            description: li.description,
            qty: li.qty,
            unitPrice: li.unitPrice,
            monthly: li.monthly,
            taxable: li.taxable,
            position: i,
          })),
        },
      },
    });
  });

  if (!copy) return;

  revalidatePath('/quotes');
  redirect(`/quotes/${copy.id}`);
}

/* ---------------- quote → service order ---------------- */

export async function convertQuoteToOrder(formData) {
  await requireUser();
  const quoteId = formData.get('id');

  const order = await prisma.$transaction(async (tx) => {
    const quote = await tx.quote.findUnique({
      where: { id: quoteId },
      include: { items: { orderBy: { position: 'asc' } }, order: true },
    });
    if (!quote || quote.order || quote.items.length === 0) return null;

    const number = await nextNumber(tx, 'order');

    const created = await tx.order.create({
      data: {
        number,
        quoteId: quote.id,
        customerId: quote.customerId,
        title: quote.title,
        openedDate: today(),
        scheduledDate: addDays(7),
        siteAddress: quote.siteAddress,
        taxRate: quote.taxRate,
        items: {
          create: quote.items.map((li, i) => ({
            kind: li.kind,
            inventoryId: li.inventoryId,
            catalogId: li.catalogId,
            sku: li.sku,
            description: li.description,
            qty: li.qty,
            unitPrice: li.unitPrice,
            monthly: li.monthly,
            taxable: li.taxable,
            position: i,
          })),
        },
      },
    });

    // Reserve parts out of the equipment inventory.
    for (const li of quote.items) {
      if (!li.inventoryId) continue;
      const part = await tx.inventoryItem.findUnique({ where: { id: li.inventoryId } });
      if (!part) continue;
      await tx.inventoryItem.update({
        where: { id: part.id },
        data: { stock: Math.max(0, part.stock - Math.round(li.qty)) },
      });
    }

    await tx.quote.update({ where: { id: quote.id }, data: { status: 'Accepted' } });
    return created;
  });

  if (!order) return;

  revalidatePath('/quotes');
  revalidatePath('/orders');
  revalidatePath('/inventory');
  redirect(`/orders/${order.id}`);
}

/* ---------------- purchase orders ---------------- */

/**
 * Spin up a purchase order for a service order. It starts pre-filled with the
 * physical parts already on the job (the inventory-linked lines), priced at
 * dealer cost so you can send it straight to a supplier and tweak from there.
 * Paperwork only — this never touches inventory stock.
 */
export async function createPurchaseOrder(formData) {
  await requireUser();
  const orderId = formData.get('orderId');
  if (!orderId) return;

  const po = await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: { items: { orderBy: { position: 'asc' } } },
    });
    if (!order) return null;

    // Only the physical parts get carried over — look up each part's cost.
    const partLines = order.items.filter((li) => li.inventoryId);
    const cost = {};
    for (const li of partLines) {
      if (cost[li.inventoryId] === undefined) {
        const inv = await tx.inventoryItem.findUnique({ where: { id: li.inventoryId } });
        cost[li.inventoryId] = inv ? inv.cost : 0;
      }
    }

    const number = await nextNumber(tx, 'po');
    return tx.purchaseOrder.create({
      data: {
        number,
        orderId,
        issueDate: today(),
        status: 'Draft',
        items: {
          create: partLines.map((li, i) => ({
            kind: 'Part',
            inventoryId: li.inventoryId,
            sku: li.sku,
            description: li.description,
            qty: li.qty,
            unitPrice: cost[li.inventoryId] ?? 0,
            taxable: true,
            position: i,
          })),
        },
      },
    });
  });

  if (!po) return;

  revalidatePath('/purchase-orders');
  revalidatePath(`/orders/${orderId}`);
  redirect(`/purchase-orders/${po.id}`);
}

export async function updatePurchaseOrder(formData) {
  await requireUser();
  const id = formData.get('id');
  const po = await prisma.purchaseOrder.findUnique({ where: { id } });
  if (!po) return;

  await prisma.purchaseOrder.update({
    where: { id },
    data: {
      supplier: str(formData.get('supplier')),
      supplierContact: str(formData.get('supplierContact')),
      supplierEmail: str(formData.get('supplierEmail')),
      supplierPhone: str(formData.get('supplierPhone')),
      supplierAddress: str(formData.get('supplierAddress')),
      status: formData.get('status') || po.status,
      issueDate: formData.get('issueDate') || po.issueDate,
      expectedDate: str(formData.get('expectedDate')),
      reference: str(formData.get('reference')),
      notes: str(formData.get('notes')),
      taxRate: num(formData.get('taxRate'), po.taxRate),
    },
  });
  revalidatePath(`/purchase-orders/${id}`);
  revalidatePath('/purchase-orders');
}

export async function setPurchaseOrderStatus(formData) {
  await requireUser();
  const id = formData.get('id');
  await prisma.purchaseOrder.update({
    where: { id },
    data: { status: formData.get('status') },
  });
  revalidatePath(`/purchase-orders/${id}`);
  revalidatePath('/purchase-orders');
}

/** Add an inventory part to a PO, priced at dealer cost. */
export async function addPartToPO(formData) {
  await requireUser();
  const poId = formData.get('poId');
  const inventoryId = formData.get('inventoryId');
  const quantity = Math.max(1, Math.round(num(formData.get('qty'), 1)));

  await prisma.$transaction(async (tx) => {
    const po = await tx.purchaseOrder.findUnique({
      where: { id: poId },
      include: { items: true },
    });
    const part = await tx.inventoryItem.findUnique({ where: { id: inventoryId } });
    if (!po || !part) return;

    const existing = po.items.find((li) => li.inventoryId === part.id);
    if (existing) {
      await tx.lineItem.update({
        where: { id: existing.id },
        data: { qty: existing.qty + quantity },
      });
    } else {
      await tx.lineItem.create({
        data: {
          poId,
          kind: 'Part',
          inventoryId: part.id,
          sku: part.sku,
          description: part.name,
          qty: quantity,
          unitPrice: part.cost, // dealer cost — what you pay the supplier
          taxable: true,
          position: po.items.length,
        },
      });
    }
  });

  revalidatePath(`/purchase-orders/${poId}`);
}

/** Freight, misc, or anything not stocked. */
export async function addLineToPO(formData) {
  await requireUser();
  const poId = formData.get('poId');
  const description = str(formData.get('description'));
  if (!description) return;

  const po = await prisma.purchaseOrder.findUnique({
    where: { id: poId },
    include: { items: true },
  });
  if (!po) return;

  await prisma.lineItem.create({
    data: {
      poId,
      kind: formData.get('kind') || 'Other',
      sku: '—',
      description,
      qty: Math.max(0, num(formData.get('qty'), 1)),
      unitPrice: cents(num(formData.get('unitPrice'))),
      taxable: formData.get('taxable') === 'on',
      position: po.items.length,
    },
  });
  revalidatePath(`/purchase-orders/${poId}`);
}

export async function updatePOLine(formData) {
  await requireUser();
  const poId = formData.get('poId');
  const po = await prisma.purchaseOrder.findUnique({ where: { id: poId } });
  if (!po) return;

  const description = formData.get('description');
  await prisma.lineItem.update({
    where: { id: formData.get('lineId') },
    data: {
      qty: Math.max(0, num(formData.get('qty'), 1)),
      unitPrice: cents(num(formData.get('unitPrice'))),
      ...(description != null ? { description: str(description) } : {}),
    },
  });
  revalidatePath(`/purchase-orders/${poId}`);
  redirect(`/purchase-orders/${poId}`);
}

export async function removePOLine(formData) {
  await requireUser();
  const poId = formData.get('poId');
  await prisma.lineItem.delete({ where: { id: formData.get('lineId') } });
  revalidatePath(`/purchase-orders/${poId}`);
}

export async function deletePurchaseOrder(formData) {
  await requireAdmin();
  const id = formData.get('id');
  const po = await prisma.purchaseOrder.findUnique({ where: { id } });
  await prisma.purchaseOrder.delete({ where: { id } });
  revalidatePath('/purchase-orders');
  if (po) revalidatePath(`/orders/${po.orderId}`);
  redirect('/purchase-orders');
}

/* ---------------- service orders ---------------- */

export async function updateOrder(formData) {
  await requireUser();
  const id = formData.get('id');
  const order = await prisma.order.findUnique({ where: { id }, include: { invoice: true } });
  if (!order) return;

  await prisma.order.update({
    where: { id },
    data: {
      status: order.invoice ? order.status : formData.get('status') || order.status,
      scheduledDate: formData.get('scheduledDate') || order.scheduledDate,
      technician: str(formData.get('technician')),
      siteAddress: str(formData.get('siteAddress')),
      workNotes: str(formData.get('workNotes')),
    },
  });
  revalidatePath(`/orders/${id}`);
  revalidatePath('/orders');
}

/** Move a job to a new date — used by the calendar's drag-and-drop. */
export async function rescheduleOrder(formData) {
  await requireUser();
  const id = formData.get('id');
  const date = formData.get('scheduledDate');
  if (!id || !date) return;

  const order = await prisma.order.findUnique({ where: { id }, include: { invoice: true } });
  if (!order || order.invoice) return; // invoiced jobs are done, don't move them

  await prisma.order.update({ where: { id }, data: { scheduledDate: date } });
  revalidatePath('/schedule');
  revalidatePath('/board');
  revalidatePath(`/orders/${id}`);
  revalidatePath('/orders');
}

/** Add a catalog product/service to an order — carries setup fee AND monthly. */
export async function addCatalogToOrder(formData) {
  await requireUser();
  const orderId = formData.get('orderId');
  const catalogId = formData.get('catalogId');
  const quantity = Math.max(1, Math.round(num(formData.get('qty'), 1)));

  await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: { items: true, invoice: true },
    });
    const item = await tx.catalogItem.findUnique({ where: { id: catalogId } });
    if (!order || order.invoice || !item) return;

    const existing = order.items.find((li) => li.catalogId === item.id);
    if (existing) {
      await tx.lineItem.update({
        where: { id: existing.id },
        data: { qty: existing.qty + quantity },
      });
    } else {
      await tx.lineItem.create({
        data: {
          orderId,
          kind: item.mrc > 0 ? 'Recurring' : 'Service',
          catalogId: item.id,
          sku: item.usoc,
          description: item.name,
          qty: quantity,
          unitPrice: item.nrc,
          monthly: item.mrc,
          taxable: true,
          position: order.items.length,
        },
      });
    }
  });

  revalidatePath(`/orders/${orderId}`);
}

/** Parts used at the truck — pulls stock as it goes on. */
export async function addPartToOrder(formData) {
  await requireUser();
  const orderId = formData.get('orderId');
  const inventoryId = formData.get('inventoryId');
  const quantity = Math.max(1, Math.round(num(formData.get('qty'), 1)));

  await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: { items: true, invoice: true },
    });
    const part = await tx.inventoryItem.findUnique({ where: { id: inventoryId } });
    if (!order || order.invoice || !part) return;

    await tx.inventoryItem.update({
      where: { id: part.id },
      data: { stock: Math.max(0, part.stock - quantity) },
    });

    const existing = order.items.find((li) => li.inventoryId === part.id);
    if (existing) {
      await tx.lineItem.update({
        where: { id: existing.id },
        data: { qty: existing.qty + quantity },
      });
    } else {
      await tx.lineItem.create({
        data: {
          orderId,
          kind: 'Part',
          inventoryId: part.id,
          sku: part.sku,
          description: part.name,
          qty: quantity,
          unitPrice: part.price,
          taxable: true,
          position: order.items.length,
        },
      });
    }
  });

  revalidatePath(`/orders/${orderId}`);
  revalidatePath('/inventory');
}

export async function addLineToOrder(formData) {
  await requireUser();
  const orderId = formData.get('orderId');
  const description = str(formData.get('description'));
  if (!description) return;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true, invoice: true },
  });
  if (!order || order.invoice) return;

  await prisma.lineItem.create({
    data: {
      orderId,
      kind: formData.get('kind') || 'Labor',
      sku: '—',
      description,
      qty: Math.max(0, num(formData.get('qty'), 1)),
      unitPrice: cents(num(formData.get('unitPrice'))),
      monthly: cents(num(formData.get('monthly'))),
      taxable: formData.get('taxable') === 'on',
      position: order.items.length,
    },
  });
  revalidatePath(`/orders/${orderId}`);
}

export async function removeOrderLine(formData) {
  await requireUser();
  const orderId = formData.get('orderId');
  const lineId = formData.get('lineId');

  await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: { invoice: true },
    });
    const li = await tx.lineItem.findUnique({ where: { id: lineId } });
    if (!order || !li) return;

    if (li.inventoryId) {
      const part = await tx.inventoryItem.findUnique({ where: { id: li.inventoryId } });
      if (part) {
        await tx.inventoryItem.update({
          where: { id: part.id },
          data: { stock: part.stock + Math.round(li.qty) }, // back on the shelf
        });
      }
    }
    await tx.lineItem.delete({ where: { id: lineId } });
  });

  revalidatePath(`/orders/${orderId}`);
  revalidatePath('/inventory');
}

/* ---------------- service order → invoice ---------------- */

export async function convertOrderToInvoice(formData) {
  await requireUser();
  const orderId = formData.get('id');

  const invoice = await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: { items: { orderBy: { position: 'asc' } }, invoice: true },
    });
    if (!order || order.invoice || order.items.length === 0) return null;

    const number = await nextNumber(tx, 'invoice');

    const created = await tx.invoice.create({
      data: {
        number,
        orderId: order.id,
        customerId: order.customerId,
        title: order.title,
        issueDate: today(),
        dueDate: addDays(30),
        terms: 'Net 30',
        taxRate: order.taxRate,
        items: {
          create: order.items.map((li, i) => ({
            kind: li.kind,
            inventoryId: li.inventoryId,
            catalogId: li.catalogId,
            sku: li.sku,
            description: li.description,
            qty: li.qty,
            unitPrice: li.unitPrice,
            monthly: li.monthly,
            taxable: li.taxable,
            position: i,
          })),
        },
      },
    });

    await tx.order.update({ where: { id: order.id }, data: { status: 'Invoiced' } });
    return created;
  });

  if (!invoice) return;

  revalidatePath('/orders');
  revalidatePath('/invoices');
  redirect(`/invoices/${invoice.id}`);
}

/* ---------------- invoices ---------------- */

export async function recordPayment(formData) {
  const user = await requireUser();
  const id = formData.get('id');
  const amount = cents(num(formData.get('amount')));
  if (amount <= 0) return;

  await prisma.$transaction(async (tx) => {
    const invoice = await tx.invoice.findUnique({ where: { id }, include: { items: true } });
    if (!invoice) return;

    const { total } = totals(invoice);
    const paid = cents(Math.min(total, invoice.amountPaid + amount));
    const applied = cents(paid - invoice.amountPaid);
    if (applied <= 0) return;

    await tx.payment.create({
      data: { invoiceId: id, amount: applied, receivedOn: today(), recordedBy: user.email || '' },
    });

    await tx.invoice.update({
      where: { id },
      data: {
        amountPaid: paid,
        status: paid >= total - 0.005 ? 'Paid' : 'Partly paid',
      },
    });
  });

  revalidatePath(`/invoices/${id}`);
  revalidatePath('/invoices');
}

export async function updateInvoice(formData) {
  await requireUser();
  const id = formData.get('id');
  const invoice = await prisma.invoice.findUnique({ where: { id } });
  if (!invoice) return;

  await prisma.invoice.update({
    where: { id },
    data: {
      dueDate: formData.get('dueDate') || invoice.dueDate,
      terms: formData.get('terms') || invoice.terms,
      status: formData.get('status') || invoice.status,
    },
  });
  revalidatePath(`/invoices/${id}`);
  revalidatePath('/invoices');
}

/* ---------------- emailing documents ---------------- */

export async function emailQuote(formData) {
  await requireUser();
  const id = formData.get('id');
  const quote = await prisma.quote.findUnique({
    where: { id },
    include: { items: { orderBy: { position: 'asc' } }, customer: true },
  });
  if (!quote) return;

  const company = await getCompany();
  const html = documentHtml({
    company,
    customer: quote.customer,
    doc: quote,
    kind: 'quote',
    totals: totals(quote),
  });
  const result = await sendDocumentEmail({
    to: quote.customer.email,
    subject: `${company.name} — Quote ${quote.number}`,
    html,
  });

  if (result.ok && quote.status === 'Draft') {
    await prisma.quote.update({ where: { id }, data: { status: 'Sent' } });
  }
  revalidatePath(`/quotes/${id}`);
  const q = result.ok ? 'email=sent' : `email=failed&why=${encodeURIComponent(result.error || '')}`;
  redirect(`/quotes/${id}?${q}`);
}

export async function emailInvoice(formData) {
  await requireUser();
  const id = formData.get('id');
  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: { items: { orderBy: { position: 'asc' } }, customer: true },
  });
  if (!invoice) return;

  const company = await getCompany();
  const html = documentHtml({
    company,
    customer: invoice.customer,
    doc: invoice,
    kind: 'invoice',
    totals: totals(invoice),
  });
  const result = await sendDocumentEmail({
    to: invoice.customer.email,
    subject: `${company.name} — Invoice ${invoice.number}`,
    html,
  });

  revalidatePath(`/invoices/${id}`);
  const q = result.ok ? 'email=sent' : `email=failed&why=${encodeURIComponent(result.error || '')}`;
  redirect(`/invoices/${id}?${q}`);
}

/* ---------------- settings ---------------- */

export async function saveCompany(formData) {
  await requireAdmin();
  await prisma.settings.update({
    where: { id: 1 },
    data: {
      name: str(formData.get('name')) || 'Tele Express Business Systems',
      tagline: str(formData.get('tagline')),
      address: str(formData.get('address')),
      phone: str(formData.get('phone')),
      email: str(formData.get('email')),
      defaultTaxRate: num(formData.get('defaultTaxRate'), 7.75),
      laborRate: cents(num(formData.get('laborRate'), 125)),
    },
  });
  revalidatePath('/settings');
}

/* ---------------- team members (users) ---------------- */

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const settingsErr = (m) => redirect('/settings?err=' + encodeURIComponent(m));
const settingsOk = (m) => redirect('/settings?ok=' + encodeURIComponent(m));

export async function createUser(formData) {
  await requireAdmin();
  const name = str(formData.get('name'));
  const email = str(formData.get('email')).toLowerCase();
  const password = String(formData.get('password') || '');
  const role = str(formData.get('role')) === 'admin' ? 'admin' : 'tech';

  if (!name) settingsErr('Please enter their name.');
  if (!EMAIL_RE.test(email)) settingsErr('Please enter a valid email address.');
  if (password.length < 10) settingsErr('Password must be at least 10 characters.');

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) settingsErr('Someone already uses that email address.');

  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.user.create({ data: { name, email, passwordHash, role } });
  revalidatePath('/settings');
  settingsOk(`${name} can now sign in with ${email}.`);
}

export async function resetPassword(formData) {
  await requireAdmin();
  const id = str(formData.get('id'));
  const password = String(formData.get('password') || '');
  if (!id) settingsErr('Could not find that team member.');
  if (password.length < 10) settingsErr('New password must be at least 10 characters.');

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) settingsErr('Could not find that team member.');

  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.user.update({ where: { id }, data: { passwordHash } });
  revalidatePath('/settings');
  settingsOk(`Password updated for ${user.name}.`);
}

export async function deleteUser(formData) {
  const me = await requireAdmin();
  const id = str(formData.get('id'));
  if (!id) settingsErr('Could not find that team member.');
  if (id === me.id) settingsErr('You can’t remove your own account.');

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) settingsErr('Could not find that team member.');

  if (user.role === 'admin') {
    const admins = await prisma.user.count({ where: { role: 'admin' } });
    if (admins <= 1) settingsErr('You need at least one admin account.');
  }

  await prisma.user.delete({ where: { id } });
  revalidatePath('/settings');
  settingsOk(`Removed ${user.name}.`);
}

/* ---------------- leads / pipeline ---------------- */

const LEAD_STATUSES = ['New', 'Qualified', 'Site walk', 'Quoted', 'Won', 'Lost'];

export async function saveLead(formData) {
  await requireUser();
  const id = formData.get('id');
  const name = str(formData.get('name'));
  if (!name) return;

  const status = str(formData.get('status'));
  const data = {
    name,
    company: str(formData.get('company')),
    email: str(formData.get('email')),
    phone: str(formData.get('phone')),
    roomType: str(formData.get('roomType')),
    roomQty: Math.max(1, Math.round(num(formData.get('roomQty'), 1))),
    metro: str(formData.get('metro')),
    source: str(formData.get('source')) || 'Manual',
    status: LEAD_STATUSES.includes(status) ? status : 'New',
    estimatedValue: cents(num(formData.get('estimatedValue'))),
    notes: str(formData.get('notes')),
  };

  if (id) {
    await prisma.lead.update({ where: { id }, data });
    revalidatePath(`/leads/${id}`);
  } else {
    await prisma.lead.create({ data });
  }
  revalidatePath('/leads');
  revalidatePath('/pipeline');
  revalidatePath('/');
}

// Move a lead along the pipeline (status), set its estimated value / lost reason.
export async function updateLead(formData) {
  await requireUser();
  const id = formData.get('id');
  if (!id) return;
  const status = str(formData.get('status'));
  const data = {
    status: LEAD_STATUSES.includes(status) ? status : undefined,
    estimatedValue: cents(num(formData.get('estimatedValue'))),
    lostReason: str(formData.get('lostReason')),
  };
  await prisma.lead.update({ where: { id }, data });
  revalidatePath(`/leads/${id}`);
  revalidatePath('/leads');
  revalidatePath('/pipeline');
  revalidatePath('/');
}

export async function addLeadNote(formData) {
  const user = await requireUser();
  const leadId = formData.get('leadId');
  const body = str(formData.get('body'));
  if (!leadId || !body) return;
  await prisma.leadNote.create({ data: { leadId, body, author: user.name || '' } });
  revalidatePath(`/leads/${leadId}`);
}

export async function deleteLeadNote(formData) {
  await requireUser();
  const id = formData.get('id');
  const leadId = formData.get('leadId');
  await prisma.leadNote.delete({ where: { id } });
  revalidatePath(`/leads/${leadId}`);
}

// Create (or attach to) a Customer account from the lead. Status is unchanged.
export async function convertLead(formData) {
  await requireUser();
  const id = formData.get('id');
  const lead = await prisma.lead.findUnique({ where: { id } });
  if (!lead) return;

  let customerId = lead.customerId;
  if (!customerId) {
    const wanted = lead.company || lead.name;
    const existing = await prisma.customer.findFirst({ where: { name: wanted } });
    customerId =
      existing?.id ||
      (
        await prisma.customer.create({
          data: {
            name: wanted,
            contact: lead.name,
            email: lead.email,
            phone: lead.phone,
            city: lead.metro,
            notes: lead.notes,
          },
        })
      ).id;
    await prisma.lead.update({ where: { id }, data: { customerId } });
  }

  revalidatePath(`/leads/${id}`);
  revalidatePath('/customers');
  revalidatePath('/leads');
  redirect(`/leads/${id}`);
}

export async function deleteLead(formData) {
  await requireAdmin();
  await prisma.lead.delete({ where: { id: formData.get('id') } });
  revalidatePath('/leads');
  revalidatePath('/pipeline');
  redirect('/leads');
}

/* ---------------- installed base ---------------- */

export async function saveInstalled(formData) {
  await requireUser();
  const id = formData.get('id');
  const customerId = formData.get('customerId');
  const product = str(formData.get('product'));
  if (!customerId || !product) return;

  const data = {
    customerId,
    product,
    sku: str(formData.get('sku')),
    room: str(formData.get('room')),
    serial: str(formData.get('serial')),
    quantity: Math.max(1, Math.round(num(formData.get('quantity'), 1))),
    installedDate: str(formData.get('installedDate')),
    warrantyEnd: str(formData.get('warrantyEnd')),
    notes: str(formData.get('notes')),
  };

  if (id) await prisma.installedEquipment.update({ where: { id }, data });
  else await prisma.installedEquipment.create({ data });

  revalidatePath('/installed');
}

export async function deleteInstalled(formData) {
  await requireAdmin();
  await prisma.installedEquipment.delete({ where: { id: formData.get('id') } });
  revalidatePath('/installed');
}


/* ---------------- inline line editing (added) ---------------- */

export async function updateOrderLine(formData) {
  await requireUser();
  const orderId = formData.get('orderId');
  const lineId = formData.get('lineId');

  await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { id: orderId }, include: { invoice: true } });
    const li = await tx.lineItem.findUnique({ where: { id: lineId } });
    if (!order || !li) return;

    const newQty = Math.max(0, num(formData.get('qty'), li.qty));

    // Keep reserved stock accurate when a physical part's quantity changes.
    if (li.inventoryId) {
      const delta = Math.round(newQty) - Math.round(li.qty);
      if (delta !== 0) {
        const part = await tx.inventoryItem.findUnique({ where: { id: li.inventoryId } });
        if (part) {
          await tx.inventoryItem.update({
            where: { id: part.id },
            data: { stock: Math.max(0, part.stock - delta) },
          });
        }
      }
    }

    const description = formData.get('description');
    await tx.lineItem.update({
      where: { id: lineId },
      data: {
        qty: newQty,
        unitPrice: cents(num(formData.get('unitPrice'), li.unitPrice)),
        ...(description != null ? { description: str(description) } : {}),
      },
    });
  });

  revalidatePath(`/orders/${orderId}`);
  revalidatePath('/inventory');
  redirect(`/orders/${orderId}`);
}

export async function updateInvoiceLine(formData) {
  await requireUser();
  const invoiceId = formData.get('invoiceId');
  const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } });
  if (!invoice) return;

  const description = formData.get('description');
  await prisma.lineItem.update({
    where: { id: formData.get('lineId') },
    data: {
      qty: Math.max(0, num(formData.get('qty'), 1)),
      unitPrice: cents(num(formData.get('unitPrice'))),
      ...(description != null ? { description: str(description) } : {}),
    },
  });
  revalidatePath(`/invoices/${invoiceId}`);
  redirect(`/invoices/${invoiceId}`);
}

export async function removeInvoiceLine(formData) {
  await requireUser();
  const invoiceId = formData.get('invoiceId');
  await prisma.lineItem.delete({ where: { id: formData.get('lineId') } });
  revalidatePath(`/invoices/${invoiceId}`);
}
