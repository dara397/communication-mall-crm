import { money, shortDate } from "../crmlib/format";
import { company } from "../crmlib/config";
import Logo from "./Logo";

type LineItem = {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  mrc: number;
  lineTotal: number;
};

type Customer = {
  name: string;
  company?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
};

export default function DocumentView({
  docLabel,
  number,
  date,
  customer,
  lineItems,
  subtotal,
  taxRate,
  taxAmount,
  total,
  mrcTotal,
  notes,
}: {
  docLabel: string;
  number: string;
  date?: Date | null;
  customer: Customer;
  lineItems: LineItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  mrcTotal: number;
  notes?: string | null;
}) {
  return (
    <div className="card p-8">
      <div className="flex items-start justify-between">
        <div>
          {company.logoUrl && (
            <div className="mb-2">
              <Logo src={company.logoUrl} size={44} rounded={false} />
            </div>
          )}
          <div className="text-lg font-bold text-slate-900">{company.name}</div>
          <div className="mt-1 whitespace-pre-line text-sm text-slate-500">
            {[company.address, company.phone, company.email].filter(Boolean).join("\n")}
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            {docLabel}
          </div>
          <div className="text-xl font-bold text-slate-900">{number}</div>
          {date && <div className="mt-1 text-sm text-slate-500">{shortDate(date)}</div>}
        </div>
      </div>

      <div className="mt-6 border-t border-slate-100 pt-4">
        <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          Bill to
        </div>
        <div className="mt-1 text-sm text-slate-700">
          <div className="font-medium">{customer.company || customer.name}</div>
          {customer.company && <div>{customer.name}</div>}
          {customer.address && <div>{customer.address}</div>}
          {(customer.city || customer.state || customer.zip) && (
            <div>
              {[customer.city, customer.state].filter(Boolean).join(", ")} {customer.zip}
            </div>
          )}
          {customer.email && <div>{customer.email}</div>}
          {customer.phone && <div>{customer.phone}</div>}
        </div>
      </div>

      <table className="mt-6 min-w-full">
        <thead>
          <tr className="border-b border-slate-200">
            <th className="th">Description</th>
            <th className="th text-right">Qty</th>
            <th className="th text-right">Unit</th>
            <th className="th text-right">MRC/mo</th>
            <th className="th text-right">Amount</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {lineItems.map((li) => (
            <tr key={li.id}>
              <td className="td">{li.description}</td>
              <td className="td text-right">{li.quantity}</td>
              <td className="td text-right">{money(li.unitPrice)}</td>
              <td className="td text-right text-slate-500">
                {li.mrc ? money(li.mrc) : "—"}
              </td>
              <td className="td text-right font-medium">{money(li.lineTotal)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-6 flex justify-end">
        <div className="w-64 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-500">Subtotal</span>
            <span className="font-medium">{money(subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Tax ({(taxRate * 100).toFixed(2)}%)</span>
            <span className="font-medium">{money(taxAmount)}</span>
          </div>
          <div className="flex justify-between border-t border-slate-200 pt-2 text-base">
            <span className="font-semibold">Total</span>
            <span className="font-bold">{money(total)}</span>
          </div>
          {mrcTotal > 0 && (
            <div className="flex justify-between rounded bg-brand-50 px-2 py-1 text-brand-700">
              <span>Monthly recurring</span>
              <span className="font-semibold">{money(mrcTotal)}/mo</span>
            </div>
          )}
        </div>
      </div>

      {notes && (
        <div className="mt-6 border-t border-slate-100 pt-4">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Notes
          </div>
          <p className="mt-1 whitespace-pre-wrap text-sm text-slate-600">{notes}</p>
        </div>
      )}
    </div>
  );
}
