import Link from "next/link";
import { prisma } from "../../crmlib/prisma";
import { PageHeader, StatCard, StatusBadge } from "../../crmui/ui";
import { money } from "../../crmlib/format";
import { startOfWeek, endOfWeek, weekDays, sameDay, dayName } from "../../crmlib/dates";

export const dynamic = "force-dynamic";

function fmtTime(d: Date) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(d);
}

export default async function DashboardPage() {
  const now = new Date();
  const weekStart = startOfWeek(now);
  const weekEnd = endOfWeek(now);

  const [
    openQuotes,
    activeJobs,
    outstandingAgg,
    customerCount,
    weekOrders,
  ] = await Promise.all([
    prisma.quote.count({ where: { status: { in: ["DRAFT", "SENT"] } } }),
    prisma.serviceOrder.count({
      where: { status: { in: ["SCHEDULED", "IN_PROGRESS", "ON_HOLD"] } },
    }),
    prisma.invoice.aggregate({
      _sum: { total: true },
      where: { status: { in: ["SENT", "OVERDUE", "DRAFT"] } },
    }),
    prisma.customer.count(),
    prisma.serviceOrder.findMany({
      where: {
        scheduledAt: { gte: weekStart, lt: weekEnd },
        status: { not: "CANCELLED" },
      },
      orderBy: { scheduledAt: "asc" },
      include: { customer: true },
    }),
  ]);

  const days = weekDays(now);

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle={new Intl.DateTimeFormat("en-US", {
          weekday: "long",
          month: "long",
          day: "numeric",
          year: "numeric",
        }).format(now)}
        action={
          <Link href="/quotes/new" className="btn-primary">
            + New quote
          </Link>
        }
      />

      {/* This week's schedule — front and center */}
      <section className="mb-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-800">This week&apos;s schedule</h2>
          <Link href="/schedule" className="text-sm font-medium text-brand-700 hover:underline">
            Open calendar →
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-7">
          {days.map((day) => {
            const dayOrders = weekOrders.filter(
              (o) => o.scheduledAt && sameDay(o.scheduledAt, day)
            );
            const isToday = sameDay(day, now);
            return (
              <div
                key={day.toISOString()}
                className={`rounded-xl border p-2 ${
                  isToday ? "border-brand-300 bg-brand-50/50" : "border-slate-200 bg-white"
                }`}
              >
                <div className="mb-2 px-1">
                  <div className="text-xs font-semibold uppercase text-slate-400">
                    {dayName(day)}
                  </div>
                  <div
                    className={`text-base font-semibold ${
                      isToday ? "text-brand-700" : "text-slate-700"
                    }`}
                  >
                    {day.getDate()}
                  </div>
                </div>
                <div className="space-y-1.5">
                  {dayOrders.map((o) => (
                    <Link
                      key={o.id}
                      href={`/orders/${o.id}`}
                      className="block rounded-md border border-slate-200 bg-white p-1.5 text-xs shadow-sm hover:shadow"
                    >
                      <div className="font-semibold text-brand-700">
                        {o.scheduledAt ? fmtTime(o.scheduledAt) : ""}
                      </div>
                      <div className="truncate text-slate-600">{o.customer.name}</div>
                    </Link>
                  ))}
                  {dayOrders.length === 0 && (
                    <p className="py-1 text-center text-xs text-slate-300">—</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* KPI stats */}
      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Open quotes" value={openQuotes} href="/quotes" />
        <StatCard label="Active jobs" value={activeJobs} href="/orders" />
        <StatCard
          label="Outstanding invoices"
          value={money(outstandingAgg._sum.total || 0)}
          href="/invoices"
          accent="text-amber-600"
        />
        <StatCard label="Customers" value={customerCount} href="/customers" />
      </section>
    </>
  );
}
