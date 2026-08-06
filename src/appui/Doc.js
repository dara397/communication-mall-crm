import Link from 'next/link';
import { money, qty } from '@/applib/format';

/** Quote → Service order → Invoice, with the links that exist so far. */
export function Chain({ quote, order, invoice, current }) {
  const nodes = [
    { step: 'Quote', doc: quote, href: quote ? `/quotes/${quote.id}` : null, me: 'quote' },
    { step: 'Service order', doc: order, href: order ? `/orders/${order.id}` : null, me: 'order' },
    { step: 'Invoice', doc: invoice, href: invoice ? `/invoices/${invoice.id}` : null, me: 'invoice' },
  ];

  return (
    <div className="chain">
      {nodes.map((n) => {
        const state = n.me === current ? 'current' : n.doc ? 'done' : 'pending';
        return (
          <div className="chain-node" key={n.step} data-state={state}>
            <span className="chain-step">{n.step}</span>
            {n.doc ? (
              n.me === current ? (
                <span className="chain-value">{n.doc.number}</span>
              ) : (
                <Link href={n.href} className="chain-value">
                  {n.doc.number}
                </Link>
              )
            ) : (
              <span className="chain-value chain-value--muted">Not created</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

const TONES = {
  Draft: 'neutral',
  Sent: 'copper',
  Accepted: 'signal',
  Declined: 'alert',
  Scheduled: 'copper',
  'In progress': 'copper',
  Completed: 'signal',
  Invoiced: 'signal',
  Unpaid: 'alert',
  'Partly paid': 'copper',
  Paid: 'signal',
  Ordered: 'copper',
  Received: 'signal',
  Cancelled: 'alert',
};

export function Chip({ status }) {
  return (
    <span className="chip" data-tone={TONES[status] || 'neutral'}>
      {status}
    </span>
  );
}

/** Read-only line items — used on service orders and invoices. */
export function LineTable({ items }) {
  return (
    <table>
      <thead>
        <tr>
          <th style={{ width: 90 }}>Type</th>
          <th style={{ width: 120 }}>SKU</th>
          <th>Description</th>
          <th className="num" style={{ width: 70 }}>Qty</th>
          <th className="num" style={{ width: 100 }}>Unit</th>
          <th className="num" style={{ width: 110 }}>Amount</th>
        </tr>
      </thead>
      <tbody>
        {items.map((li) => (
          <tr key={li.id}>
            <td className="muted">{li.kind}</td>
            <td className="doc-no muted">{li.sku}</td>
            <td>
              {li.description}
              {li.monthly > 0 ? (
                <div className="note" style={{ color: 'var(--signal)' }}>
                  + {money(li.qty * li.monthly)}/mo recurring
                </div>
              ) : null}
            </td>
            <td className="num">{qty(li.qty)}</td>
            <td className="num">{money(li.unitPrice)}</td>
            <td className="num strong">{money(li.qty * li.unitPrice)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function Totals({ doc, totals, paid }) {
  return (
    <div className="totals">
      <div className="totals-row">
        <span>Subtotal (one-time)</span>
        <span>{money(totals.subtotal)}</span>
      </div>
      <div className="totals-row">
        <span>Sales tax ({doc.taxRate}% on parts)</span>
        <span>{money(totals.tax)}</span>
      </div>
      <div className="totals-row totals-row--grand">
        <span>One-time total</span>
        <span>{money(totals.total)}</span>
      </div>
      {totals.monthly > 0 ? (
        <div className="totals-row totals-row--grand" style={{ borderTopColor: 'var(--signal)' }}>
          <span style={{ color: 'var(--signal)' }}>Monthly recurring</span>
          <span style={{ color: 'var(--signal)' }}>{money(totals.monthly)}/mo</span>
        </div>
      ) : null}
      {paid !== undefined ? (
        <>
          <div className="totals-row">
            <span>Paid to date</span>
            <span>{money(paid)}</span>
          </div>
          <div className="totals-row totals-row--grand">
            <span>Balance due</span>
            <span>{money(totals.total - paid)}</span>
          </div>
        </>
      ) : null}
    </div>
  );
}
