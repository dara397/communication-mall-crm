import Link from 'next/link';
import { getPurchaseOrders, totals } from '@/applib/db';
import { money, day } from '@/applib/format';
import { Chip } from '@/appui/Doc';

export const dynamic = 'force-dynamic';

export default async function PurchaseOrdersPage() {
  const pos = await getPurchaseOrders();

  return (
    <>
      <div className="page-head">
        <div>
          <div className="eyebrow">Procurement</div>
          <h1>Purchase orders</h1>
          <p className="sub">
            Parts you&apos;re buying from suppliers for a job. Create one from a service order.
          </p>
        </div>
      </div>

      <div className="card">
        {pos.length === 0 ? (
          <div className="empty">
            <strong>No purchase orders yet</strong>
            Open a service order and use &ldquo;Create purchase order&rdquo; to order the parts
            that job needs.
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>PO</th>
                <th>Supplier</th>
                <th>For job</th>
                <th>Issued</th>
                <th>Status</th>
                <th className="num">Total</th>
              </tr>
            </thead>
            <tbody>
              {pos.map((po) => (
                <tr key={po.id}>
                  <td>
                    <Link href={`/purchase-orders/${po.id}`} className="doc-no">
                      {po.number}
                    </Link>
                    <div className="note">{day(po.issueDate)}</div>
                  </td>
                  <td>{po.supplier || <span className="muted">— not set —</span>}</td>
                  <td className="muted">
                    {po.order ? (
                      <>
                        {po.order.number}
                        {po.order.customer?.name ? ` · ${po.order.customer.name}` : ''}
                      </>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="muted">{day(po.issueDate)}</td>
                  <td>
                    <Chip status={po.status} />
                  </td>
                  <td className="num strong">{money(totals(po).total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
