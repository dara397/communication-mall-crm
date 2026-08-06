import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getOrder, getCatalog, getCompany, totals } from '@/applib/db';
import { money, day, qty } from '@/applib/format';
import { Chain, Chip, Totals } from '@/appui/Doc';
import {
  updateOrder,
  addCatalogToOrder,
  addLineToOrder,
  removeOrderLine,
  convertOrderToInvoice,
  createPurchaseOrder,
} from '@/applib/actions';

export const dynamic = 'force-dynamic';

export default async function OrderPage({ params }) {
  const order = await getOrder(params.id);
  if (!order) notFound();

  const [catalog, company] = await Promise.all([getCatalog(), getCompany()]);
  const quote = order.quote;
  const invoice = order.invoice;
  const customer = order.customer;
  const t = totals(order);
  const locked = Boolean(invoice);

  return (
    <>
      <div className="page-head">
        <div>
          <div className="eyebrow">Service order {order.number}</div>
          <h1>{order.title}</h1>
          <p className="sub">
            {customer?.name} · Opened {day(order.openedDate)} · Scheduled{' '}
            {day(order.scheduledDate)}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }} className="no-print">
          <Chip status={order.status} />
          {!locked && order.items.length > 0 ? (
            <form action={convertOrderToInvoice}>
              <input type="hidden" name="id" value={order.id} />
              <button className="btn btn--convert" type="submit">
                Convert to invoice →
              </button>
            </form>
          ) : null}
          {locked ? (
            <Link href={`/invoices/${invoice.id}`} className="btn btn--convert">
              Open invoice →
            </Link>
          ) : null}
        </div>
      </div>

      <Chain quote={quote} order={order} invoice={invoice} current="order" />

      {locked ? (
        <p className="note" style={{ marginTop: -12, marginBottom: 20 }}>
          This order is closed and invoiced. Billing changes go on the invoice.
        </p>
      ) : null}

      <div className="card">
        <div className="card-head">
          <h2>Work and materials</h2>
          <span className="note">Carried over from {quote?.number}, plus anything added on site</span>
        </div>
        <div className="card-body card-body--tight">
          <table>
            <thead>
              <tr>
                <th style={{ width: 80 }}>Type</th>
                <th style={{ width: 120 }}>SKU</th>
                <th>Description</th>
                <th className="num" style={{ width: 70 }}>Qty</th>
                <th className="num" style={{ width: 100 }}>Unit</th>
                <th className="num" style={{ width: 110 }}>Amount</th>
                <th style={{ width: 90 }}></th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((li) => (
                <tr key={li.id}>
                  <td className="muted">{li.kind}</td>
                  <td className="doc-no muted">{li.sku}</td>
                  <td>{li.description}</td>
                  <td className="num">{qty(li.qty)}</td>
                  <td className="num">{money(li.unitPrice)}</td>
                  <td className="num strong">{money(li.qty * li.unitPrice)}</td>
                  <td className="num no-print">
                    {locked ? null : (
                      <form action={removeOrderLine} className="inline-form">
                        <input type="hidden" name="orderId" value={order.id} />
                        <input type="hidden" name="lineId" value={li.id} />
                        <button className="btn btn--ghost btn--sm" type="submit">
                          Remove
                        </button>
                      </form>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="card-body">
            <Totals doc={order} totals={t} />
          </div>
        </div>
      </div>

      {!locked ? (
        <div className="grid-2 no-print">
          <div className="card">
            <div className="card-head">
              <h2>Add a product or service</h2>
              <Link href="/catalog" className="note">Price book →</Link>
            </div>
            <div className="card-body">
              <form action={addCatalogToOrder}>
                <input type="hidden" name="orderId" value={order.id} />
                <div className="field">
                  <label className="field-label" htmlFor="catalogId">Product / service</label>
                  <select id="catalogId" name="catalogId" required defaultValue="">
                    <option value="" disabled>
                      Choose from the price book
                    </option>
                    {catalog.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                        {c.mrc > 0 ? ` · ${money(c.mrc)}/mo` : ''}
                        {c.nrc > 0 ? ` · ${money(c.nrc)} setup` : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="row">
                  <div className="field field--sm">
                    <label className="field-label" htmlFor="catQty">Qty</label>
                    <input id="catQty" name="qty" type="number" min="1" step="1" defaultValue="1" />
                  </div>
                  <button className="btn btn--primary" type="submit">
                    Add
                  </button>
                </div>
              </form>
            </div>
          </div>

          <div className="card">
            <div className="card-head">
              <h2>Add labor or a service</h2>
            </div>
            <div className="card-body">
              <form action={addLineToOrder}>
                <input type="hidden" name="orderId" value={order.id} />
                <div className="field">
                  <label className="field-label" htmlFor="description">Description</label>
                  <input
                    id="description"
                    name="description"
                    required
                    placeholder="Extra drop to the back office"
                  />
                </div>
                <div className="row">
                  <div className="field field--sm">
                    <label className="field-label" htmlFor="kind">Type</label>
                    <select id="kind" name="kind" defaultValue="Labor">
                      <option>Labor</option>
                      <option>Service</option>
                      <option>Trip charge</option>
                    </select>
                  </div>
                  <div className="field field--sm">
                    <label className="field-label" htmlFor="lqty">Hours</label>
                    <input id="lqty" name="qty" type="number" step="0.25" min="0" defaultValue="1" />
                  </div>
                  <div className="field field--sm">
                    <label className="field-label" htmlFor="unitPrice">Rate</label>
                    <input
                      id="unitPrice"
                      name="unitPrice"
                      type="number"
                      step="0.01"
                      defaultValue={company.laborRate}
                    />
                  </div>
                  <button className="btn btn--primary" type="submit">
                    Add line
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      ) : null}

      <div className="grid-2 no-print">
        <div className="card">
          <div className="card-head">
            <h2>Dispatch</h2>
          </div>
          <div className="card-body">
            <form action={updateOrder}>
              <input type="hidden" name="id" value={order.id} />
              <div className="row" style={{ marginBottom: 12 }}>
                <div className="field">
                  <label className="field-label" htmlFor="status">Status</label>
                  <select id="status" name="status" defaultValue={order.status} disabled={locked}>
                    <option>Scheduled</option>
                    <option>In progress</option>
                    <option>Completed</option>
                    {locked ? <option>Invoiced</option> : null}
                  </select>
                </div>
                <div className="field">
                  <label className="field-label" htmlFor="scheduledDate">Scheduled for</label>
                  <input
                    id="scheduledDate"
                    name="scheduledDate"
                    type="date"
                    defaultValue={order.scheduledDate}
                  />
                </div>
              </div>
              <div className="field">
                <label className="field-label" htmlFor="technician">Technician</label>
                <input
                  id="technician"
                  name="technician"
                  defaultValue={order.technician}
                  placeholder="Who's rolling the truck"
                />
              </div>
              <div className="field">
                <label className="field-label" htmlFor="siteAddress">Install site</label>
                <input id="siteAddress" name="siteAddress" defaultValue={order.siteAddress} />
              </div>
              <div className="field">
                <label className="field-label" htmlFor="workNotes">Field notes</label>
                <textarea
                  id="workNotes"
                  name="workNotes"
                  defaultValue={order.workNotes}
                  placeholder="What was found, what was done, what's left."
                />
              </div>
              <button className="btn btn--primary" type="submit">
                Save changes
              </button>
            </form>
          </div>
        </div>

        <div className="card">
          <div className="card-head">
            <h2>Customer</h2>
          </div>
          <div className="card-body">
            <dl className="meta-list">
              <dt>Business</dt>
              <dd className="strong">{customer?.name}</dd>
              <dt>Contact</dt>
              <dd>{customer?.contact || '—'}</dd>
              <dt>Phone</dt>
              <dd>{customer?.phone || '—'}</dd>
              <dt>Site</dt>
              <dd>
                {order.siteAddress ||
                  [customer?.address, customer?.city, customer?.state, customer?.zip]
                    .filter(Boolean)
                    .join(', ')}
              </dd>
              <dt>Notes</dt>
              <dd className="muted">{customer?.notes || '—'}</dd>
            </dl>
          </div>
        </div>
      </div>

      <div className="card no-print">
        <div className="card-head">
          <h2>Purchasing</h2>
          <form action={createPurchaseOrder} className="inline-form">
            <input type="hidden" name="orderId" value={order.id} />
            <button className="btn btn--primary btn--sm" type="submit">
              Create purchase order
            </button>
          </form>
        </div>
        <div className="card-body">
          {order.purchaseOrders && order.purchaseOrders.length > 0 ? (
            <table>
              <thead>
                <tr>
                  <th>PO</th>
                  <th>Supplier</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {order.purchaseOrders.map((po) => (
                  <tr key={po.id}>
                    <td>
                      <Link href={`/purchase-orders/${po.id}`} className="doc-no">
                        {po.number}
                      </Link>
                    </td>
                    <td>{po.supplier || <span className="muted">— not set —</span>}</td>
                    <td>
                      <Chip status={po.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="muted" style={{ margin: 0 }}>
              No purchase orders yet. Create one to order the parts this job needs — it starts
              pre-filled with the parts already on this order, priced at dealer cost.
            </p>
          )}
        </div>
      </div>
    </>
  );
}
