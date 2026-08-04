import Link from "next/link";
import { prisma } from "../../../crmlib/prisma";
import { PageHeader, EmptyState } from "../../../crmui/ui";

export const dynamic = "force-dynamic";

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const q = (searchParams.q || "").trim();
  const customers = await prisma.customer.findMany({
    where: q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { company: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
          ],
        }
      : undefined,
    orderBy: { name: "asc" },
    include: {
      _count: { select: { quotes: true, serviceOrders: true, invoices: true } },
    },
  });

  return (
    <>
      <PageHeader
        title="Customers"
        subtitle={`${customers.length} account${customers.length === 1 ? "" : "s"}`}
        action={
          <Link href="/customers/new" className="btn-primary">
            + New customer
          </Link>
        }
      />

      <form className="mb-4">
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Search by name, company, or email…"
          className="input max-w-md"
        />
      </form>

      {customers.length === 0 ? (
        <EmptyState
          title="No customers yet"
          hint="Add your first customer to start creating quotes and service orders."
          action={
            <Link href="/customers/new" className="btn-primary">
              + New customer
            </Link>
          }
        />
      ) : (
        <div className="card overflow-hidden">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="th">Name</th>
                <th className="th">Company</th>
                <th className="th">Contact</th>
                <th className="th text-right">Documents</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {customers.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50">
                  <td className="td">
                    <Link
                      href={`/customers/${c.id}`}
                      className="font-medium text-brand-700 hover:underline"
                    >
                      {c.name}
                    </Link>
                  </td>
                  <td className="td">{c.company || "—"}</td>
                  <td className="td">
                    <div>{c.email || "—"}</div>
                    <div className="text-xs text-slate-400">{c.phone || ""}</div>
                  </td>
                  <td className="td text-right text-slate-500">
                    {c._count.quotes} quotes · {c._count.serviceOrders} orders ·{" "}
                    {c._count.invoices} invoices
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
