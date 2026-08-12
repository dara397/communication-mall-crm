import Link from 'next/link';
import { getScheduledOrders, totals } from '@/applib/db';
import { money, day } from '@/applib/format';

export const dynamic = 'force-dynamic';

const COLUMNS = [
  { status: 'Scheduled', blurb: 'On the calendar, not started' },
  { status: 'In progress', blurb: 'Tech is on it' },
  { status: 'Completed', blurb: 'Done, ready to invoice' },
  { status: 'Invoiced', blurb: 'Billed and closed' },
];

export default async function BoardPage() {
  const orders = await getScheduledOrders();
  const byStatus = (s) => orders.filter((o) => o.status === s);

  return (
    <>
      <div className="page-head">
        <div>
          <div className="eyebrow">Pipeline</div>
          <h1>Job board</h1>
          <p className="sub">Every service order, grouped by where it stands.</p>
        </div>
      </div>

      <div className="board">
        {COLUMNS.map((col) => {
          const jobs = byStatus(col.status);
          return (
            <div className="board-col" key={col.status}>
              <div className="board-col-head">
                <span className="board-col-title">{col.status}</span>
                <span className="nav-count">{jobs.length}</span>
              </div>
              <div className="board-col-blurb">{col.blurb}</div>
              {jobs.length === 0 ? (
                <div className="board-empty">—</div>
              ) : (
                jobs.map((o) => (
                  <Link href={`/orders/${o.id}`} className="board-card" key={o.id}>
                    <div className="board-card-no">{o.number}</div>
                    <div className="board-card-title">{o.title}</div>
                    <div className="board-card-meta">{o.customer?.name}</div>
                    <div className="board-card-foot">
                      <span>{day(o.scheduledDate)}</span>
                      <span className="strong">{money(totals(o).total)}</span>
                    </div>
                    {o.technician ? (
                      <div className="board-card-tech">{o.technician}</div>
                    ) : (
                      <div className="board-card-tech muted">Unassigned</div>
                    )}
                  </Link>
                ))
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
