import Link from "next/link";
import { prisma } from "../../../crmlib/prisma";
import { PageHeader, EmptyState, StatusBadge } from "../../../crmui/ui";
import { money, shortDate } from "../../../crmlib/format";

export const dynamic = "force-dynamic";

export default async function QuotesPage() {
  const quotes = await prisma.quote.findMany({
    orderBy: { createdAt: "desc" },
    include: { customer: true },
  });

  return (
    <>
      <PageHeader
        title="Quotes"
        subtitle={`${quotes.length} total`}
        action={
          <Link href="/quotes/new" className="btn-primary">
            + New quote
          </Link>
        }
      />

      {quotes.length === 0 ? (
        <EmptyState
          title="No quotes yet"
          hint="Create a quote, then convert it into a service order and invoice."
          action={
            <Link href="/quotes/new" className="btn-primary">
              + New quote
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
                <th className="th">Created</th>
                <th className="th text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {quotes.map((q) => (
                <tr key={q.id} className="hover:bg-slate-50">
                  <td className="td">
                    <Link
                      href={`/quotes/${q.id}`}
                      className="font-medium text-brand-700 hover:underline"
                    >
                      {q.number}
                    </Link>
                  </td>
                  <td className="td">{q.customer.name}</td>
                  <td className="td">
                    <StatusBadge status={q.status} />
                  </td>
                  <td className="td text-slate-500">{shortDate(q.createdAt)}</td>
                  <td className="td text-right font-medium">{money(q.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
