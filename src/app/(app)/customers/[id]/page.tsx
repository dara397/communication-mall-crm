import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "../../../../crmlib/prisma";
import { PageHeader, StatusBadge } from "../../../../crmui/ui";
import DeleteButton from "../../../../crmui/DeleteButton";
import { money, shortDate } from "../../../../crmlib/format";
import { deleteCustomer } from "../actions";

export const dynamic = "force-dynamic";

export default async function CustomerDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const customer = await prisma.customer.findUnique({
    where: { id: params.id },
    include: {
      quotes: { orderBy: { createdAt: "desc" } },
      serviceOrders: { orderBy: { createdAt: "desc" } },
      invoices: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!customer) notFound();

  const del = deleteCustomer.bind(null, customer.id);

  return (
    <>
      <PageHeader
        title={customer.name}
        subtitle={customer.company || undefined}
        action={
          <div className="flex gap-2">
            <Link href={`/quotes/new?customerId=${customer.id}`} className="btn-primary">
              + New quote
            </Link>
            <Link href={`/customers/${customer.id}/edit`} className="btn-secondary">
              Edit
            </Link>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="card space-y-3 p-5">
          <h2 className="text-sm font-semibold text-slate-700">Contact</h2>
          <dl className="space-y-2 text-sm">
            <Row label="Email" value={customer.email} />
            <Row label="Phone" value={customer.phone} />
            <Row
              label="Address"
              value={[
                customer.address,
                [customer.city, customer.state].filter(Boolean).join(", "),
                customer.zip,
              ]
                .filter(Boolean)
                .join(" · ")}
            />
            {customer.notes && (
              <div>
                <dt className="text-slate-400">Notes</dt>
                <dd className="mt-1 whitespace-pre-wrap text-slate-700">{customer.notes}</dd>
              </div>
            )}
          </dl>
        </div>

        <div className="space-y-6 lg:col-span-2">
          <DocList
            title="Quotes"
            href="/quotes"
            newHref={`/quotes/new?customerId=${customer.id}`}
            rows={customer.quotes.map((q) => ({
              id: q.id,
              href: `/quotes/${q.id}`,
              number: q.number,
              status: q.status,
              total: q.total,
              date: q.createdAt,
            }))}
          />
          <DocList
            title="Service orders"
            href="/orders"
            rows={customer.serviceOrders.map((o) => ({
              id: o.id,
              href: `/orders/${o.id}`,
              number: o.number,
              status: o.status,
              total: o.total,
              date: o.scheduledAt || o.createdAt,
            }))}
          />
          <DocList
            title="Invoices"
            href="/invoices"
            rows={customer.invoices.map((i) => ({
              id: i.id,
              href: `/invoices/${i.id}`,
              number: i.number,
              status: i.status,
              total: i.total,
              date: i.issuedAt || i.createdAt,
            }))}
          />
        </div>
      </div>

      <div className="mt-8">
        <DeleteButton
          action={del}
          label="Delete customer"
          confirmText={`Delete ${customer.name}? This only works if they have no documents.`}
        />
      </div>
    </>
  );
}

function Row({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex gap-2">
      <dt className="w-20 flex-shrink-0 text-slate-400">{label}</dt>
      <dd className="text-slate-700">{value || "—"}</dd>
    </div>
  );
}

function DocList({
  title,
  newHref,
  rows,
}: {
  title: string;
  href: string;
  newHref?: string;
  rows: {
    id: string;
    href: string;
    number: string;
    status: string;
    total: number;
    date: Date;
  }[];
}) {
  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
        <h2 className="text-sm font-semibold text-slate-700">{title}</h2>
        {newHref && (
          <Link href={newHref} className="text-sm font-medium text-brand-700 hover:underline">
            + New
          </Link>
        )}
      </div>
      {rows.length === 0 ? (
        <p className="px-5 py-6 text-sm text-slate-400">None yet.</p>
      ) : (
        <table className="min-w-full divide-y divide-slate-100">
          <tbody className="divide-y divide-slate-100">
            {rows.map((r) => (
              <tr key={r.id} className="hover:bg-slate-50">
                <td className="td">
                  <Link href={r.href} className="font-medium text-brand-700 hover:underline">
                    {r.number}
                  </Link>
                </td>
                <td className="td">
                  <StatusBadge status={r.status} />
                </td>
                <td className="td text-slate-500">{shortDate(r.date)}</td>
                <td className="td text-right font-medium">{money(r.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
