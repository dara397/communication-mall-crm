"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { money } from "../crmlib/format";

type Customer = { id: string; name: string; company?: string | null };
type Product = {
  id: string;
  code: string;
  name: string;
  mrc: number;
  nrc: number;
  chargeType: string;
};
type Equipment = { id: string; sku: string; name: string; unitPrice: number };

type Item = {
  key: string;
  description: string;
  quantity: number;
  unitPrice: number;
  mrc: number;
  productId?: string | null;
  equipmentId?: string | null;
};

export type DocInitial = {
  customerId?: string;
  taxRate?: number;
  notes?: string;
  dateValue?: string; // validUntil / scheduledAt / dueDate as input value
  items?: Omit<Item, "key">[];
};

const DATE_LABELS: Record<string, { label: string; type: string }> = {
  QUOTE: { label: "Valid until", type: "date" },
  ORDER: { label: "Scheduled for", type: "datetime-local" },
  INVOICE: { label: "Due date", type: "date" },
};

let counter = 0;
const newKey = () => `li-${Date.now()}-${counter++}`;

export default function DocumentForm({
  action,
  docType,
  customers,
  products,
  equipment,
  initial,
  defaultTaxRate,
  lockedCustomer,
  cancelHref,
  submitLabel = "Save",
}: {
  action: (formData: FormData) => void;
  docType: "QUOTE" | "ORDER" | "INVOICE";
  customers: Customer[];
  products: Product[];
  equipment: Equipment[];
  initial?: DocInitial;
  defaultTaxRate: number;
  lockedCustomer?: Customer;
  cancelHref: string;
  submitLabel?: string;
}) {
  const [customerId, setCustomerId] = useState(
    initial?.customerId || lockedCustomer?.id || ""
  );
  const [taxRatePct, setTaxRatePct] = useState(
    String(((initial?.taxRate ?? defaultTaxRate) * 100).toFixed(3)).replace(/\.?0+$/, "")
  );
  const [notes, setNotes] = useState(initial?.notes || "");
  const [dateValue, setDateValue] = useState(initial?.dateValue || "");
  const [items, setItems] = useState<Item[]>(
    (initial?.items || []).map((i) => ({ ...i, key: newKey() }))
  );
  const [productPick, setProductPick] = useState("");
  const [equipmentPick, setEquipmentPick] = useState("");

  const dateMeta = DATE_LABELS[docType];
  const taxRate = (parseFloat(taxRatePct) || 0) / 100;

  const totals = useMemo(() => {
    const subtotal = items.reduce(
      (s, i) => s + (Number(i.quantity) || 0) * (Number(i.unitPrice) || 0),
      0
    );
    const mrcTotal = items.reduce(
      (s, i) => s + (Number(i.quantity) || 0) * (Number(i.mrc) || 0),
      0
    );
    const taxAmount = subtotal * taxRate;
    return {
      subtotal,
      mrcTotal,
      taxAmount,
      total: subtotal + taxAmount,
    };
  }, [items, taxRate]);

  function addCustom() {
    setItems((prev) => [
      ...prev,
      { key: newKey(), description: "", quantity: 1, unitPrice: 0, mrc: 0 },
    ]);
  }

  function addProduct(id: string) {
    const p = products.find((x) => x.id === id);
    if (!p) return;
    setItems((prev) => [
      ...prev,
      {
        key: newKey(),
        description: `${p.name}${p.code ? ` (${p.code})` : ""}`,
        quantity: 1,
        unitPrice: p.nrc || 0,
        mrc: p.mrc || 0,
        productId: p.id,
      },
    ]);
    setProductPick("");
  }

  function addEquipment(id: string) {
    const e = equipment.find((x) => x.id === id);
    if (!e) return;
    setItems((prev) => [
      ...prev,
      {
        key: newKey(),
        description: `${e.name}${e.sku ? ` (${e.sku})` : ""}`,
        quantity: 1,
        unitPrice: e.unitPrice || 0,
        mrc: 0,
        equipmentId: e.id,
      },
    ]);
    setEquipmentPick("");
  }

  function update(key: string, patch: Partial<Item>) {
    setItems((prev) => prev.map((i) => (i.key === key ? { ...i, ...patch } : i)));
  }

  function remove(key: string) {
    setItems((prev) => prev.filter((i) => i.key !== key));
  }

  const payload = JSON.stringify({
    customerId,
    taxRate,
    notes,
    dateValue,
    items: items.map((i) => ({
      description: i.description,
      quantity: Number(i.quantity) || 0,
      unitPrice: Number(i.unitPrice) || 0,
      mrc: Number(i.mrc) || 0,
      productId: i.productId ?? null,
      equipmentId: i.equipmentId ?? null,
    })),
  });

  const canSubmit = customerId && items.length > 0;

  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="payload" value={payload} />

      <div className="card space-y-4 p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Customer *</label>
            {lockedCustomer ? (
              <div className="input bg-slate-50 text-slate-600">
                {lockedCustomer.name}
                {lockedCustomer.company ? ` — ${lockedCustomer.company}` : ""}
              </div>
            ) : (
              <select
                className="input"
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                required
              >
                <option value="">Select a customer…</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                    {c.company ? ` — ${c.company}` : ""}
                  </option>
                ))}
              </select>
            )}
          </div>
          <div>
            <label className="label">{dateMeta.label}</label>
            <input
              type={dateMeta.type}
              className="input"
              value={dateValue}
              onChange={(e) => setDateValue(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 px-5 py-3">
          <h2 className="mr-auto text-sm font-semibold text-slate-700">Line items</h2>
          <select
            className="input h-9 w-48 py-1 text-sm"
            value={productPick}
            onChange={(e) => addProduct(e.target.value)}
          >
            <option value="">+ Add product…</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} {p.code ? `(${p.code})` : ""}
              </option>
            ))}
          </select>
          <select
            className="input h-9 w-44 py-1 text-sm"
            value={equipmentPick}
            onChange={(e) => addEquipment(e.target.value)}
          >
            <option value="">+ Add equipment…</option>
            {equipment.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name} {e.sku ? `(${e.sku})` : ""}
              </option>
            ))}
          </select>
          <button type="button" onClick={addCustom} className="btn-secondary h-9 py-1">
            + Custom line
          </button>
        </div>

        {items.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-slate-400">
            No line items yet. Add products, equipment, or a custom line above.
          </p>
        ) : (
          <table className="min-w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="th">Description</th>
                <th className="th w-20 text-right">Qty</th>
                <th className="th w-28 text-right">Unit price</th>
                <th className="th w-28 text-right">MRC/mo</th>
                <th className="th w-28 text-right">Line total</th>
                <th className="th w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((i) => (
                <tr key={i.key}>
                  <td className="px-3 py-2">
                    <input
                      className="input"
                      value={i.description}
                      placeholder="Description"
                      onChange={(e) => update(i.key, { description: e.target.value })}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      step="any"
                      className="input text-right"
                      value={i.quantity}
                      onChange={(e) =>
                        update(i.key, { quantity: parseFloat(e.target.value) })
                      }
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      step="0.01"
                      className="input text-right"
                      value={i.unitPrice}
                      onChange={(e) =>
                        update(i.key, { unitPrice: parseFloat(e.target.value) })
                      }
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      step="0.01"
                      className="input text-right"
                      value={i.mrc}
                      onChange={(e) => update(i.key, { mrc: parseFloat(e.target.value) })}
                    />
                  </td>
                  <td className="px-3 py-2 text-right text-sm font-medium text-slate-700">
                    {money((Number(i.quantity) || 0) * (Number(i.unitPrice) || 0))}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <button
                      type="button"
                      onClick={() => remove(i.key)}
                      className="text-slate-400 hover:text-red-600"
                      aria-label="Remove line"
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card space-y-3 p-5">
          <div>
            <label className="label">Notes</label>
            <textarea
              className="input"
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Terms, scope, or internal notes…"
            />
          </div>
        </div>

        <div className="card space-y-3 p-5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500">Subtotal (one-time)</span>
            <span className="font-medium">{money(totals.subtotal)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500">Tax rate</span>
            <div className="flex items-center gap-1">
              <input
                type="number"
                step="0.001"
                className="input h-8 w-24 py-1 text-right"
                value={taxRatePct}
                onChange={(e) => setTaxRatePct(e.target.value)}
              />
              <span className="text-slate-400">%</span>
            </div>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500">Tax</span>
            <span className="font-medium">{money(totals.taxAmount)}</span>
          </div>
          <div className="flex items-center justify-between border-t border-slate-200 pt-3 text-base">
            <span className="font-semibold text-slate-700">Total (one-time)</span>
            <span className="font-bold text-slate-900">{money(totals.total)}</span>
          </div>
          {totals.mrcTotal > 0 && (
            <div className="flex items-center justify-between rounded-lg bg-brand-50 px-3 py-2 text-sm">
              <span className="text-brand-700">Monthly recurring</span>
              <span className="font-semibold text-brand-700">
                {money(totals.mrcTotal)}/mo
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <Link href={cancelHref} className="btn-secondary">
          Cancel
        </Link>
        <button type="submit" className="btn-primary" disabled={!canSubmit}>
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
