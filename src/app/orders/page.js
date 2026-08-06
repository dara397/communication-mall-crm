import Link from 'next/link';
import { getOrders, totals } from '@/applib/db';
import { money, day } from '@/applib/format';
import { Chip } from '@/appui/Doc';

export const dynamic = 'force-dynamic';

export default async function OrdersPage() {
  const orders = await getOrders();

  return (
    <>
      <div className="page-head">
        <div>
          <div className="eyebrow">Pipeline · Step 2</div>
          <h1>Service orders</h1>
          <p className="sub">
            Accepted work, scheduled for a tech. Close it out and invoice it.
          </p>
        </div>
      </div>

      <div className="card">
        {orders.length === 0 ? (
          <div className="empty">
            <strong>No service orders yet</strong>
            Convert an accepted quote and it lands here.{' '}
            <Link href="/quotes" style={{ color: 'var(--signal)' }}>
              Go to quotes →
            </Link>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Order</th>
                <th>From quote</th>
                <th>Customer</th>
                <th>Scheduled</th>
                <th>Technician</th>
                <th>Status</th>
                <th className="num">Total</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id}>
                  <td>
                    <Link href={`/orders/${o.id}`} className="doc-no">
                      {o.number}
                    </Link>
                    <div className="note">{o.title}</div>
                  </td>
                  <td>
                    <Link href={`/quotes/${o.quoteId}`} className="doc-no muted">
                      {o.quote?.number}
                    </Link>
                  </td>
                  <td>{o.customer?.name}</td>
                  <td className="muted">{day(o.scheduledDate)}</td>
                  <td className="muted">{o.technician || 'Unassigned'}</td>
                  <td>
                    <Chip status={o.status} />
                  </td>
                  <td className="num strong">{money(totals(o).total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
