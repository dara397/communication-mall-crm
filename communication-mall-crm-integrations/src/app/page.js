import Link from 'next/link';
import { getDashboard, getScheduledOrders, getLeadMetrics, totals } from '@/applib/db';
import { money, day, today } from '@/applib/format';

export const dynamic = 'force-dynamic';

const WEEKDAY = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// Monday-start week containing today, as 7 YYYY-MM-DD strings.
function thisWeekDays() {
  const d = new Date();
  const dow = (d.getDay() + 6) % 7; // Mon = 0
  d.setDate(d.getDate() - dow);
  return Array.from({ length: 7 }, (_, i) => {
    const x = new Date(d);
    x.setDate(d.getDate() + i);
    return x.toISOString().slice(0, 10);
  });
}

export default async function Dashboard() {
  const [{ quotes, orders, invoices }, scheduled, sales] = await Promise.all([
    getDashboard(),
    getScheduledOrders(),
    getLeadMetrics(),
  ]);

  const openQuotes = quotes.filter((q) => !q.order);
  const openQuoteValue = openQuotes.reduce((s, q) => s + totals(q).total, 0);
  const activeOrders = orders.filter((o) => o.status !== 'Invoiced');
  const outstanding = invoices
    .filter((i) => i.status !== 'Paid')
    .reduce((s, i) => s + totals(i).total - i.amountPaid, 0);

  const days = thisWeekDays();
  const now = today();
  const jobs = scheduled.filter((o) => o.status !== 'Invoiced');
  const label = (iso) => {
    const dd = new Date(iso + 'T12:00:00');
    return `${dd.getMonth() + 1}/${dd.getDate()}`;
  };

  return (
    <>
      <div className="page-head">
        <div>
          <div className="eyebrow">Today · {day(now)}</div>
          <h1>This week</h1>
          <p className="sub">What&apos;s on the calendar, and where the numbers stand.</p>
        </div>
        <Link href="/quotes/new" className="btn btn--primary">
          Start a quote
        </Link>
      </div>

      <div className="grid-4" style={{ marginBottom: 20 }}>
        <div className="stat">
          <div className="stat-label">Open leads</div>
          <div className="stat-value">{sales.openLeads}</div>
          <div className="stat-foot">{sales.newLeads} new this week</div>
        </div>
        <div className="stat">
          <div className="stat-label">Weighted pipeline</div>
          <div className="stat-value">{money(sales.weighted)}</div>
          <div className="stat-foot">{money(sales.openValue)} open</div>
        </div>
        <div className="stat">
          <div className="stat-label">Quoted</div>
          <div className="stat-value">{money(sales.quotedValue)}</div>
          <div className="stat-foot">Out for decision</div>
        </div>
        <div className="stat">
          <div className="stat-label">Win rate</div>
          <div className="stat-value">{sales.winRate === null ? '—' : `${sales.winRate}%`}</div>
          <div className="stat-foot">Won vs. closed</div>
        </div>
      </div>

      <div className="grid-3" style={{ marginBottom: 24 }}>
        <div className="stat">
          <div className="stat-label">Open quotes</div>
          <div className="stat-value">{money(openQuoteValue)}</div>
          <div className="stat-foot">{openQuotes.length} awaiting a decision</div>
        </div>
        <div className="stat">
          <div className="stat-label">Jobs in the field</div>
          <div className="stat-value">{activeOrders.length}</div>
          <div className="stat-foot">Scheduled or in progress</div>
        </div>
        <div className="stat">
          <div className="stat-label">Outstanding</div>
          <div className="stat-value">{money(outstanding)}</div>
          <div className="stat-foot">Invoiced, not yet paid</div>
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <h2>Schedule</h2>
          <Link href="/schedule" className="note">
            Full calendar &amp; reschedule →
          </Link>
        </div>
        <div className="card-body">
          <div className="calendar">
            {days.map((d, i) => {
              const dayJobs = jobs.filter((j) => j.scheduledDate === d);
              const isToday = d === now;
              return (
                <div key={d} className="cal-day" data-today={isToday}>
                  <div className="cal-day-head">
                    <span className="cal-dow">{WEEKDAY[i]}</span>
                    <span className="cal-date" data-today={isToday}>{label(d)}</span>
                  </div>
                  <div className="cal-day-body">
                    {dayJobs.length === 0 ? (
                      <div className="cal-empty">—</div>
                    ) : (
                      dayJobs.map((j) => (
                        <Link
                          href={`/orders/${j.id}`}
                          key={j.id}
                          className="cal-job"
                          data-status={j.status}
                          style={{ display: 'block' }}
                        >
                          <div className="cal-job-link">
                            <div className="cal-job-no">{j.number}</div>
                            <div className="cal-job-title">{j.title}</div>
                            <div className="cal-job-meta">{j.customer?.name}</div>
                            <div className="cal-job-foot">
                              <span>{j.technician || 'Unassigned'}</span>
                              <span className="strong">{money(totals(j).total)}</span>
                            </div>
                          </div>
                        </Link>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          {jobs.length === 0 ? (
            <p className="note" style={{ marginTop: 14 }}>
              No jobs scheduled yet. Accept a quote and convert it to a service order — it
              lands here.
            </p>
          ) : null}
        </div>
      </div>
    </>
  );
}
