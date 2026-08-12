import Link from 'next/link';
import { getInvoices, totals } from '@/applib/db';
import { money, day, today } from '@/applib/format';
import { Chip } from '@/appui/Doc';
import ClickableRow from '@/appui/ClickableRow';

export const dynamic = 'force-dynamic';

export default async function InvoicesPage() {
  const invoices = await getInvoices();
  const now = today();

  return (
    <>
      <div className="page-head">
        <div>
          <div className="eyebrow">Pipeline · Step 3</div>
          <h1>Invoices</h1>
          <p className="sub">Billed work. Record payments as they come in.</p>
        </div>
      </div>

      <div className="card">
        {invoices.length === 0 ? (
          <div className="empty">
            <strong>No invoices yet</strong>
            Close out a service order and invoice it.{' '}
            <Link href="/orders" style={{ color: 'var(--signal)' }}>
              Go to service orders →
            </Link>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Invoice</th>
                <th>From order</th>
                <th>Customer</th>
                <th>Due</th>
                <th>Status</th>
                <th className="num">Total</th>
                <th className="num">Balance</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => {
                const t = totals(inv);
                const balance = t.total - inv.amountPaid;
                const overdue = balance > 0.005 && inv.dueDate < now;
                return (
                  <ClickableRow key={inv.id} href={`/invoices/${inv.id}`} title={`Open ${inv.number}`}>
                    <td>
                      <Link href={`/invoices/${inv.id}`} className="doc-no">
                        {inv.number}
                      </Link>
                      <div className="note">{inv.title}</div>
                    </td>
                    <td>
                      <Link href={`/orders/${inv.orderId}`} className="doc-no muted">
                        {inv.order?.number}
                      </Link>
                    </td>
                    <td>{inv.customer?.name}</td>
                    <td className={overdue ? 'stock-out' : 'muted'}>
                      {day(inv.dueDate)}
                      {overdue ? <div className="note stock-out">Overdue</div> : null}
                    </td>
                    <td>
                      <Chip status={inv.status} />
                    </td>
                    <td className="num">{money(t.total)}</td>
                    <td className="num strong">{money(balance)}</td>
                  </ClickableRow>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
