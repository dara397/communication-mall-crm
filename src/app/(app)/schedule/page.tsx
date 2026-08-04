import Link from "next/link";
import { prisma } from "../../../crmlib/prisma";
import { PageHeader, StatusBadge } from "../../../crmui/ui";
import { money } from "../../../crmlib/format";
import {
  weekDays,
  startOfWeek,
  endOfWeek,
  addDays,
  sameDay,
  dayName,
} from "../../../crmlib/dates";

export const dynamic = "force-dynamic";

function fmtTime(d: Date) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(d);
}

export default async function SchedulePage({
  searchParams,
}: {
  searchParams: { week?: string };
}) {
  const offset = parseInt(searchParams.week || "0", 10) || 0;
  const anchor = addDays(new Date(), offset * 7);
  const days = weekDays(anchor);
  const rangeStart = startOfWeek(anchor);
  const rangeEnd = endOfWeek(anchor);

  const orders = await prisma.serviceOrder.findMany({
    where: {
      scheduledAt: { gte: rangeStart, lt: rangeEnd },
      status: { not: "CANCELLED" },
    },
    orderBy: { scheduledAt: "asc" },
    include: { customer: true },
  });

  const label = `${new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(rangeStart)} – ${new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(addDays(rangeEnd, -1))}`;

  return (
    <>
      <PageHeader
        title="Schedule"
        subtitle={label}
        action={
          <div className="flex gap-2">
            <Link href={`/schedule?week=${offset - 1}`} className="btn-secondary">
              ← Prev
            </Link>
            <Link href="/schedule" className="btn-ghost">
              Today
            </Link>
            <Link href={`/schedule?week=${offset + 1}`} className="btn-secondary">
              Next →
            </Link>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-3 md:grid-cols-7">
        {days.map((day) => {
          const dayOrders = orders.filter(
            (o) => o.scheduledAt && sameDay(o.scheduledAt, day)
          );
          const isToday = sameDay(day, new Date());
          return (
            <div
              key={day.toISOString()}
              className={`rounded-xl border p-2 ${
                isToday ? "border-brand-300 bg-brand-50/40" : "border-slate-200 bg-white"
              }`}
            >
              <div className="mb-2 px-1">
                <div className="text-xs font-semibold uppercase text-slate-400">
                  {dayName(day)}
                </div>
                <div
                  className={`text-lg font-semibold ${
                    isToday ? "text-brand-700" : "text-slate-700"
                  }`}
                >
                  {day.getDate()}
                </div>
              </div>
              <div className="space-y-2">
                {dayOrders.map((o) => (
                  <Link
                    key={o.id}
                    href={`/orders/${o.id}`}
                    className="block rounded-lg border border-slate-200 bg-white p-2 text-xs shadow-sm transition hover:shadow"
                  >
                    <div className="font-semibold text-brand-700">
                      {o.scheduledAt ? fmtTime(o.scheduledAt) : ""}
                    </div>
                    <div className="truncate font-medium text-slate-700">
                      {o.customer.name}
                    </div>
                    <div className="mt-1 flex items-center justify-between">
                      <span className="text-slate-400">{o.number}</span>
                      <StatusBadge status={o.status} />
                    </div>
                  </Link>
                ))}
                {dayOrders.length === 0 && (
                  <p className="px-1 py-2 text-center text-xs text-slate-300">—</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <p className="mt-4 text-sm text-slate-500">
        {orders.length} job{orders.length === 1 ? "" : "s"} scheduled this week ·{" "}
        {money(orders.reduce((s, o) => s + o.total, 0))} total
      </p>
    </>
  );
}
