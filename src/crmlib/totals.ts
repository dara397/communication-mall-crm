export type LineItemInput = {
  description: string;
  quantity: number;
  unitPrice: number;
  mrc: number;
  productId?: string | null;
  equipmentId?: string | null;
};

export function computeLine(li: LineItemInput) {
  const qty = Number(li.quantity) || 0;
  const unit = Number(li.unitPrice) || 0;
  return {
    ...li,
    quantity: qty,
    unitPrice: unit,
    mrc: Number(li.mrc) || 0,
    lineTotal: Math.round(qty * unit * 100) / 100,
  };
}

export function computeTotals(items: LineItemInput[], taxRate: number) {
  const computed = items.map(computeLine);
  const subtotal = round2(computed.reduce((s, i) => s + i.lineTotal, 0));
  const mrcTotal = round2(
    computed.reduce((s, i) => s + (Number(i.mrc) || 0) * (Number(i.quantity) || 0), 0)
  );
  const rate = Number(taxRate) || 0;
  const taxAmount = round2(subtotal * rate);
  const total = round2(subtotal + taxAmount);
  return { computed, subtotal, taxAmount, total, mrcTotal, taxRate: rate };
}

export function round2(n: number) {
  return Math.round((Number(n) || 0) * 100) / 100;
}
