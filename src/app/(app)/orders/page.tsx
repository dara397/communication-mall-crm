import Link from "next/link";
import { prisma } from "../../../crmlib/prisma";
import { PageHeader, EmptyState, StatusBadge } from "../../../crmui/ui";
import { money, shortDate } from "../../../crmlib/format";
import type { OrderStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

const COLUMNS: { status: OrderStatus; label: string }[] = [
  { status: "SCHEDULED", label: "Scheduled" },
  { status: "IN_PROGRESS", label: "In progress" },
  { status: "ON_HOLD", label: "On hold" },
  { status: "COMPLETED", label: "Completed" },
  { status: "INVOICED", label: "Invoiced" },
];

export default async function OrdersPage() {
  const orders = await prisma.serviceOrder.findMany({
    where: { status: { not: "CANCELLED" } },
    orderBy: [{ scheduledAt: "asc" }, { createdAt: "desc" }],
    include: { customer: true },
  });

  const byStatus = (s: OrderStatus) => orders.filter((o) => o.status === s);

  return (
    <>
      <PageHeader
        title="Service orders"
        subtitle="Job status board — track work from scheduled to invoiced."
        action={
          <Link href="/orders/new" className="btn-primary">
            + New order
          </Link>
        }
      />

      {orders.length === 0 ? (
        <EmptyState
          title="No service orders yet"
          hint="Create one directly, or convert an accepted quote into a service order."
          action={
            <Link href="/orders/new" className="btn-primary">
              + New order
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
          {COLUMNS.map((col) => {
            const list = byStatus(col.status);
            return (
              <div key={col.status} className="rounded-xl bg-slate-100/70 p-3">
                <div className="mb-3 flex items-center justify-between px-1">
                  <span className="text-sm font-semibold text-slate-600">
                    {col.label}
                  </span>
                  <span className="rounded-full bg-white px-2 py-0.5 text-xs text-slate-500">
                    {list.length}
                  </span>
                </div>
                <div className="space-y-2">
                  {list.map((o) => (
                    <Link
                      key={o.id}
                      href={`/orders/${o.id}`}
                      className="block rounded-lg border border-slate-200 bg-white p-3 shadow-sm transition hover:shadow-md"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-brand-700">
                          {o.number}
                        </span>
                        <span className="text-sm font-medium text-slate-700">
                          {money(o.total)}
                        </span>
                      </div>
                      <div className="mt-1 truncate text-sm text-slate-600">
                        {o.customer.name}
                      </div>
                      <div className="mt-2 text-xs text-slate-400">
                        {o.scheduledAt
                          ? `Scheduled ${shortDate(o.scheduledAt)}`
                          : "Unscheduled"}
                      </div>
                    </Link>
                  ))}
                  {list.length === 0 && (
                    <p className="px-1 py-4 text-center text-xs text-slate-400">—</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
