import Link from "next/link";
import { prisma } from "../../../crmlib/prisma";
import { PageHeader, EmptyState, StatusBadge } from "../../../crmui/ui";
import { money, shortDate } from "../../../crmlib/format";

export const dynamic = "force-dynamic";

export default async function InvoicesPage() {
  const invoices = await prisma.invoice.findMany({
    orderBy: { createdAt: "desc" },
    include: { customer: true },
  });

  const outstanding = invoices
    .filter((i) => ["SENT", "OVERDUE", "DRAFT"].includes(i.status))
    .reduce((s, i) => s + i.total, 0);

  return (
    <>
      <PageHeader
        title="Invoices"
        subtitle={`${invoices.length} total · ${money(outstanding)} outstanding`}
        action={
          <Link href="/invoices/new" className="btn-primary">
            + New invoice
          </Link>
        }
      />

      {invoices.length === 0 ? (
        <EmptyState
          title="No invoices yet"
          hint="Convert a completed service order into an invoice, or create one directly."
          action={
            <Link href="/invoices/new" className="btn-primary">
              + New invoice
            </Link>
          }
        />
      ) : (
        <div className="card overflow-hidden">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="th">Number</th>
                <th className="th">Customer</th>
                <th className="th">Status</th>
                <th className="th">Due</th>
                <th className="th text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoices.map((i) => (
                <tr key={i.id} className="hover:bg-slate-50">
                  <td className="td">
                    <Link
                      href={`/invoices/${i.id}`}
                      className="font-medium text-brand-700 hover:underline"
                    >
                      {i.number}
                    </Link>
                  </td>
                  <td className="td">{i.customer.name}</td>
                  <td className="td">
                    <StatusBadge status={i.status} />
                  </td>
                  <td className="td text-slate-500">{shortDate(i.dueDate)}</td>
                  <td className="td text-right font-medium">{money(i.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
