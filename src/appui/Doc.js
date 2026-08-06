import Link from 'next/link';
import { money, qty } from '@/applib/format';
import {
  updateQuoteLine,
  removeQuoteLine,
  updateOrderLine,
  removeOrderLine,
  updateInvoiceLine,
  removeInvoiceLine,
  updatePOLine,
  removePOLine,
} from '@/applib/actions';

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

/* ---------- inline row-edit icons ---------- */

function PencilIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 6h18" />
      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <line x1="10" y1="11" x2="10" y2="17" />
      <line x1="14" y1="11" x2="14" y2="17" />
    </svg>
  );
}

const LINE_ACTIONS = {
  quote: { update: updateQuoteLine, remove: removeQuoteLine, idField: 'quoteId', base: '/quotes' },
  order: { update: updateOrderLine, remove: removeOrderLine, idField: 'orderId', base: '/orders' },
  invoice: { update: updateInvoiceLine, remove: removeInvoiceLine, idField: 'invoiceId', base: '/invoices' },
  po: { update: updatePOLine, remove: removePOLine, idField: 'poId', base: '/purchase-orders' },
};

const actionCell = { display: 'flex', gap: 6, justifyContent: 'flex-end', alignItems: 'center' };

/**
 * Line items. Read-only by default (used in the printable document view).
 * Pass `editable` + `kind` + `docId` to turn on inline edit (pencil) and delete
 * (trash) controls. `editId` is the line currently open for editing (from ?edit=).
 */
export function LineTable({ items, editable = false, editId = null, kind, docId, unitLabel = 'Unit' }) {
  const cfg = editable && kind ? LINE_ACTIONS[kind] : null;
  const showActions = Boolean(cfg);

  return (
    <table>
      <thead>
        <tr>
          <th style={{ width: 90 }}>Type</th>
          <th style={{ width: 120 }}>SKU</th>
          <th>Description</th>
          <th className="num" style={{ width: 80 }}>Qty</th>
          <th className="num" style={{ width: 110 }}>{unitLabel}</th>
          <th className="num" style={{ width: 110 }}>Amount</th>
          {showActions ? <th className="no-print" style={{ width: 110 }}></th> : null}
        </tr>
      </thead>
      <tbody>
        {items.map((li) => {
          const isEditing = showActions && editId === li.id;
          const formId = `edit-${kind}-${li.id}`;
          return (
            <tr key={li.id}>
              <td className="muted">{li.kind}</td>
              <td className="doc-no muted">{li.sku}</td>
              <td>
                {isEditing ? (
                  <input
                    form={formId}
                    name="description"
                    defaultValue={li.description}
                    aria-label="Description"
                    style={{ width: '100%' }}
                  />
                ) : (
                  <>
                    {li.description}
                    {li.monthly > 0 ? (
                      <div className="note" style={{ color: 'var(--signal)' }}>
                        + {money(li.qty * li.monthly)}/mo recurring
                      </div>
                    ) : null}
                  </>
                )}
              </td>
              <td className="num">
                {isEditing ? (
                  <form action={cfg.update} id={formId}>
                    <input type="hidden" name={cfg.idField} value={docId} />
                    <input type="hidden" name="lineId" value={li.id} />
                    <input
                      name="qty"
                      type="number"
                      step="0.25"
                      min="0"
                      defaultValue={li.qty}
                      aria-label="Quantity"
                    />
                  </form>
                ) : (
                  qty(li.qty)
                )}
              </td>
              <td className="num">
                {isEditing ? (
                  <input
                    form={formId}
                    name="unitPrice"
                    type="number"
                    step="0.01"
                    min="0"
                    defaultValue={li.unitPrice}
                    aria-label={unitLabel}
                  />
                ) : (
                  money(li.unitPrice)
                )}
              </td>
              <td className="num strong">{money(li.qty * li.unitPrice)}</td>
              {showActions ? (
                <td className="num no-print">
                  {isEditing ? (
                    <div style={actionCell}>
                      <button form={formId} className="btn btn--sm" type="submit">
                        Save
                      </button>
                      <Link href={`${cfg.base}/${docId}`} className="btn btn--ghost btn--sm">
                        Cancel
                      </Link>
                    </div>
                  ) : (
                    <div style={actionCell}>
                      <Link
                        href={`${cfg.base}/${docId}?edit=${li.id}`}
                        className="btn btn--ghost btn--sm"
                        aria-label="Edit line"
                        title="Edit"
                      >
                        <PencilIcon />
                      </Link>
                      <form action={cfg.remove} className="inline-form">
                        <input type="hidden" name={cfg.idField} value={docId} />
                        <input type="hidden" name="lineId" value={li.id} />
                        <button
                          className="btn btn--ghost btn--sm"
                          type="submit"
                          aria-label="Delete line"
                          title="Delete"
                        >
                          <TrashIcon />
                        </button>
                      </form>
                    </div>
                  )}
                </td>
              ) : null}
            </tr>
          );
        })}
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
