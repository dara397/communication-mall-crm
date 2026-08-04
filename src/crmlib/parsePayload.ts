import { z } from "zod";
import { computeTotals, type LineItemInput } from "./totals";

const itemSchema = z.object({
  description: z.string().default(""),
  quantity: z.number().default(1),
  unitPrice: z.number().default(0),
  mrc: z.number().default(0),
  productId: z.string().nullable().optional(),
  equipmentId: z.string().nullable().optional(),
});

const payloadSchema = z.object({
  customerId: z.string().min(1, "Customer is required"),
  taxRate: z.number().default(0),
  notes: z.string().optional().default(""),
  dateValue: z.string().optional().default(""),
  items: z.array(itemSchema).default([]),
});

export type ParsedDoc = {
  customerId: string;
  notes: string | null;
  date: Date | null;
  items: LineItemInput[];
  taxRate: number;
  subtotal: number;
  taxAmount: number;
  total: number;
  mrcTotal: number;
};

export function parseDocumentPayload(formData: FormData): ParsedDoc {
  const raw = formData.get("payload");
  if (!raw) throw new Error("Missing form data");
  const parsed = payloadSchema.parse(JSON.parse(raw.toString()));

  const items: LineItemInput[] = parsed.items
    .filter((i) => (i.description || "").trim().length > 0)
    .map((i) => ({
      description: i.description.trim(),
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      mrc: i.mrc,
      productId: i.productId || null,
      equipmentId: i.equipmentId || null,
    }));

  if (items.length === 0) throw new Error("Add at least one line item");

  const totals = computeTotals(items, parsed.taxRate);

  let date: Date | null = null;
  if (parsed.dateValue) {
    const d = new Date(parsed.dateValue);
    if (!isNaN(d.getTime())) date = d;
  }

  return {
    customerId: parsed.customerId,
    notes: parsed.notes?.trim() || null,
    date,
    items,
    taxRate: totals.taxRate,
    subtotal: totals.subtotal,
    taxAmount: totals.taxAmount,
    total: totals.total,
    mrcTotal: totals.mrcTotal,
  };
}

export function lineItemCreateData(items: LineItemInput[]) {
  return items.map((i, idx) => ({
    description: i.description,
    quantity: i.quantity,
    unitPrice: i.unitPrice,
    mrc: i.mrc,
    lineTotal: Math.round(i.quantity * i.unitPrice * 100) / 100,
    productId: i.productId || null,
    equipmentId: i.equipmentId || null,
    sortOrder: idx,
  }));
}
