import { prisma } from './prisma';

/* ---------- money ----------
   Stored as Float, rounded to cents at every boundary so nothing drifts. */

export const cents = (n) => Math.round((Number(n) || 0) * 100) / 100;

export function totals(doc) {
  const items = doc?.items || [];
  const subtotal = items.reduce((s, li) => s + li.qty * li.unitPrice, 0);
  const taxable = items.reduce((s, li) => (li.taxable ? s + li.qty * li.unitPrice : s), 0);
  const tax = taxable * ((doc?.taxRate ?? 0) / 100);
  const monthly = items.reduce((s, li) => s + li.qty * (li.monthly || 0), 0);
  return {
    subtotal: cents(subtotal),
    tax: cents(tax),
    total: cents(subtotal + tax),
    monthly: cents(monthly), // recurring per month, shown separately — not added to total
  };
}

/* ---------- catalog (telecom price book) ---------- */

export const getCatalog = () =>
  prisma.catalogItem.findMany({
    where: { active: true },
    orderBy: [{ category: 'asc' }, { name: 'asc' }],
  });

export const getCatalogItem = (id) => prisma.catalogItem.findUnique({ where: { id } });

export async function getCatalogCategories() {
  const items = await prisma.catalogItem.findMany({
    where: { active: true },
    select: { category: true },
  });
  const counts = {};
  for (const i of items) counts[i.category] = (counts[i.category] || 0) + 1;
  return Object.entries(counts)
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => a.category.localeCompare(b.category));
}

/* ---------- includes ---------- */

const withItems = { items: { orderBy: { position: 'asc' } } };

/* ---------- settings ---------- */

export async function getCompany() {
  const s = await prisma.settings.findUnique({ where: { id: 1 } });
  if (s) return s;
  return prisma.settings.create({
    data: {
      id: 1,
      name: 'Communication Mall',
      tagline: 'Business telecom, sourced and installed',
      address: '',
      phone: '',
      email: '',
    },
  });
}

export async function updateCompany(data) {
  return prisma.settings.update({ where: { id: 1 }, data });
}

/** Allocates the next document number inside the caller's transaction. */
export async function nextNumber(tx, kind) {
  const field = {
    quote: 'quoteCounter',
    order: 'orderCounter',
    invoice: 'invoiceCounter',
    po: 'poCounter',
  }[kind];
  const prefix = { quote: 'Q', order: 'SO', invoice: 'INV', po: 'PO' }[kind];
  const s = await tx.settings.update({
    where: { id: 1 },
    data: { [field]: { increment: 1 } },
    select: { [field]: true },
  });
  return `${prefix}-${s[field]}`;
}

/* ---------- customers ---------- */

export const getCustomers = () => prisma.customer.findMany({ orderBy: { name: 'asc' } });
export const getCustomer = (id) => prisma.customer.findUnique({ where: { id } });

export const getCustomersWithBilling = () =>
  prisma.customer.findMany({
    orderBy: { name: 'asc' },
    include: { invoices: { include: { items: true } } },
  });

/** Everything tied to one customer — for their profile page. */
export const getCustomerWithHistory = (id) =>
  prisma.customer.findUnique({
    where: { id },
    include: {
      quotes: { include: { items: true }, orderBy: { createdAt: 'desc' } },
      orders: { include: { items: true }, orderBy: { createdAt: 'desc' } },
      invoices: { include: { items: true }, orderBy: { createdAt: 'desc' } },
    },
  });

/* ---------- inventory ---------- */

export const getInventory = () =>
  prisma.inventoryItem.findMany({ orderBy: [{ category: 'asc' }, { name: 'asc' }] });

/* ---------- quotes ---------- */

export const getQuotes = () =>
  prisma.quote.findMany({
    orderBy: { createdAt: 'desc' },
    include: { ...withItems, customer: true, order: { select: { id: true, number: true } } },
  });

export const getQuote = (id) =>
  prisma.quote.findUnique({
    where: { id },
    include: {
      ...withItems,
      customer: true,
      order: { include: { invoice: { select: { id: true, number: true } } } },
    },
  });

/* ---------- orders ---------- */

export const getOrders = () =>
  prisma.order.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      ...withItems,
      customer: true,
      quote: { select: { id: true, number: true } },
      invoice: { select: { id: true, number: true } },
    },
  });

export const getOrder = (id) =>
  prisma.order.findUnique({
    where: { id },
    include: {
      ...withItems,
      customer: true,
      quote: { select: { id: true, number: true } },
      invoice: { select: { id: true, number: true } },
      purchaseOrders: {
        orderBy: { createdAt: 'desc' },
        select: { id: true, number: true, supplier: true, status: true },
      },
    },
  });

/* ---------- purchase orders ---------- */

export const getPurchaseOrders = () =>
  prisma.purchaseOrder.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      ...withItems,
      order: {
        select: { id: true, number: true, customer: { select: { name: true } } },
      },
    },
  });

export const getPurchaseOrder = (id) =>
  prisma.purchaseOrder.findUnique({
    where: { id },
    include: {
      ...withItems,
      order: { include: { customer: true } },
    },
  });

/** All non-invoiced orders, for the calendar and the status board. */
export const getScheduledOrders = () =>
  prisma.order.findMany({
    orderBy: { scheduledDate: 'asc' },
    include: {
      ...withItems,
      customer: { select: { id: true, name: true } },
    },
  });

/* ---------- invoices ---------- */

export const getInvoices = () =>
  prisma.invoice.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      ...withItems,
      customer: true,
      order: { select: { id: true, number: true } },
    },
  });

export const getInvoice = (id) =>
  prisma.invoice.findUnique({
    where: { id },
    include: {
      ...withItems,
      customer: true,
      payments: { orderBy: { createdAt: 'desc' } },
      order: { include: { quote: { select: { id: true, number: true } } } },
    },
  });

/* ---------- leads & pipeline (one object) ---------- */

// Pipeline stages in order. Probability weights the open pipeline.
export const LEAD_STAGES = ['New', 'Qualified', 'Site walk', 'Quoted', 'Won', 'Lost'];
export const STAGE_PROB = { New: 0.1, Qualified: 0.3, 'Site walk': 0.5, Quoted: 0.75, Won: 1, Lost: 0 };
const OPEN_STAGES = ['New', 'Qualified', 'Site walk', 'Quoted'];

export const getLeads = () =>
  prisma.lead.findMany({
    orderBy: { receivedAt: 'desc' },
    include: {
      customer: { select: { id: true, name: true } },
      _count: { select: { activities: true } },
    },
  });

export const getLead = (id) =>
  prisma.lead.findUnique({
    where: { id },
    include: {
      customer: true,
      activities: { orderBy: { createdAt: 'desc' } },
    },
  });

/* ---------- installed base ---------- */

export const getInstalled = () =>
  prisma.installedEquipment.findMany({
    orderBy: [{ createdAt: 'desc' }],
    include: { customer: { select: { id: true, name: true } } },
  });

/* ---------- sales metrics (dashboard + pipeline) ---------- */

export async function getLeadMetrics() {
  const leads = await prisma.lead.findMany({
    select: { status: true, estimatedValue: true, receivedAt: true },
  });
  const open = leads.filter((l) => OPEN_STAGES.includes(l.status));
  const openLeads = open.length;
  const weekAgo = new Date(Date.now() - 7 * 864e5);
  const newLeads = leads.filter((l) => new Date(l.receivedAt) >= weekAgo).length;
  const openValue = cents(open.reduce((s, l) => s + l.estimatedValue, 0));
  const weighted = cents(open.reduce((s, l) => s + l.estimatedValue * (STAGE_PROB[l.status] ?? 0), 0));
  const quotedValue = cents(
    leads.filter((l) => l.status === 'Quoted').reduce((s, l) => s + l.estimatedValue, 0)
  );
  const won = leads.filter((l) => l.status === 'Won');
  const lost = leads.filter((l) => l.status === 'Lost').length;
  const wonValue = cents(won.reduce((s, l) => s + l.estimatedValue, 0));
  const decided = won.length + lost;
  const winRate = decided ? Math.round((won.length / decided) * 100) : null;
  return { openLeads, newLeads, openValue, weighted, quotedValue, wonValue, winRate };
}

/* ---------- integrations (connected platforms) ---------- */

import { maskSecret, decryptSecret } from './secrets';

/**
 * Integrations for display: secrets are decrypted only to build a masked
 * preview — the raw key never leaves the server.
 */
export async function getIntegrations() {
  const rows = await prisma.integration.findMany({
    orderBy: [{ active: 'desc' }, { name: 'asc' }],
  });
  return rows.map((r) => ({
    ...r,
    apiKey: undefined,
    apiSecret: undefined,
    apiKeyMask: maskSecret(decryptSecret(r.apiKey)),
    apiSecretMask: maskSecret(decryptSecret(r.apiSecret)),
    hasKey: Boolean(r.apiKey),
    hasSecret: Boolean(r.apiSecret),
  }));
}

/** One integration for the edit form (masked, no raw secrets). */
export async function getIntegration(id) {
  const r = await prisma.integration.findUnique({ where: { id } });
  if (!r) return null;
  return {
    ...r,
    apiKey: undefined,
    apiSecret: undefined,
    apiKeyMask: maskSecret(decryptSecret(r.apiKey)),
    apiSecretMask: maskSecret(decryptSecret(r.apiSecret)),
    hasKey: Boolean(r.apiKey),
    hasSecret: Boolean(r.apiSecret),
  };
}

/** Internal: full row incl. encrypted secrets, for the test action only. */
export const getIntegrationRaw = (id) =>
  prisma.integration.findUnique({ where: { id } });

/* ---------- dashboard + nav ---------- */

export async function getDashboard() {
  const [quotes, orders, invoices, lowStock] = await Promise.all([
    prisma.quote.findMany({
      include: { ...withItems, customer: true, order: { select: { id: true } } },
    }),
    prisma.order.findMany({ include: { ...withItems, customer: true } }),
    prisma.invoice.findMany({ include: { ...withItems, customer: true } }),
    prisma.inventoryItem.findMany({ where: { stock: { lte: 5 } }, orderBy: { stock: 'asc' } }),
  ]);
  return { quotes, orders, invoices, lowStock };
}

export async function getNavCounts() {
  const [quotes, orders, invoices, customers, inventory, catalog, pos, openLeads, installed] =
    await Promise.all([
      prisma.quote.count(),
      prisma.order.count(),
      prisma.invoice.count(),
      prisma.customer.count(),
      prisma.inventoryItem.count(),
      prisma.catalogItem.count({ where: { active: true } }),
      prisma.purchaseOrder.count(),
      prisma.lead.count({ where: { status: { in: OPEN_STAGES } } }),
      prisma.installedEquipment.count(),
    ]);
  return {
    quotes, orders, invoices, customers, inventory, catalog, pos,
    leads: openLeads, pipeline: openLeads, installed,
  };
}
