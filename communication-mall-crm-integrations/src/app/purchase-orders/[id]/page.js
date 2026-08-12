import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getPurchaseOrder, getInventory, totals } from '@/applib/db';
import { money, day } from '@/applib/format';
import { Chip, LineTable } from '@/appui/Doc';
import PrintButton from '@/appui/PrintButton';
import {
  updatePurchaseOrder,
  setPurchaseOrderStatus,
  addPartToPO,
  addLineToPO,
  updatePOLine,
  removePOLine,
  deletePurchaseOrder,
} from '@/applib/actions';

export const dynamic = 'force-dynamic';

export default async function PurchaseOrderPage({ params, searchParams }) {
  const po = await getPurchaseOrder(params.id);
  if (!po) notFound();
  const editId = searchParams?.edit;

  const inventory = await getInventory();
  const order = po.order;
  const customer = order?.customer;
  const t = totals(po);

  return (
    <>
      <div className="page-head">
        <div>
          <div className="eyebrow">Purchase order {po.number}</div>
          <h1>{po.supplier || 'Purchase order'}</h1>
          <p className="sub">
            {order ? (
              <>
                For {order.number}
                {customer?.name ? ` · ${customer.name}` : ''} ·{' '}
              </>
            ) : null}
            Issued {day(po.issueDate)}
            {po.expectedDate ? ` · Expected ${day(po.expectedDate)}` : ''}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }} className="no-print">
          <Chip status={po.status} />
          <PrintButton />
          {order ? (
            <Link href={`/orders/${order.id}`} className="btn">
              Open service order →
            </Link>
          ) : null}
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <h2>Items to order</h2>
          <span className="note">
            {po.items.length} {po.items.length === 1 ? 'line' : 'lines'}
          </span>
        </div>

        {po.items.length === 0 ? (
          <div className="empty">
            <strong>Nothing on this PO yet</strong>
            Add parts from inventory below, or add a free-form line like freight.
          </div>
        ) : (
          <div className="card-body card-body--tight">
            <LineTable items={po.items} editable editId={editId} kind="po" docId={po.id} unitLabel="Unit cost" />
            <div className="card-body">
              <div className="totals">
                <div className="totals-row">
                  <span>Subtotal</span>
                  <span>{money(t.subtotal)}</span>
                </div>
                {po.taxRate > 0 ? (
                  <div className="totals-row">
                    <span>Tax ({po.taxRate}%)</span>
                    <span>{money(t.tax)}</span>
                  </div>
                ) : null}
                <div className="totals-row totals-row--grand">
                  <span>Total cost</span>
                  <span>{money(t.total)}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="grid-2 no-print">
        <div className="card">
          <div className="card-head">
            <h2>Add a part from inventory</h2>
            <Link href="/inventory" className="note">
              Inventory →
            </Link>
          </div>
          <div className="card-body">
            <form action={addPartToPO}>
              <input type="hidden" name="poId" value={po.id} />
              <div className="field">
                <label className="field-label" htmlFor="inventoryId">Part</label>
                <select id="inventoryId" name="inventoryId" required defaultValue="">
                  <option value="" disabled>
                    Choose a part
                  </option>
                  {inventory.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.sku} · {p.name}
                      {p.cost > 0 ? ` · ${money(p.cost)} cost` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div className="row">
                <div className="field field--sm">
                  <label className="field-label" htmlFor="partQty">Qty</label>
                  <input id="partQty" name="qty" type="number" min="1" step="1" defaultValue="1" />
                </div>
                <button className="btn btn--primary" type="submit">
                  Add
                </button>
              </div>
              <p className="note" style={{ marginTop: 12 }}>
                Priced at the part&apos;s dealer cost. Adjust the unit cost on the line if the
                supplier quotes something different.
              </p>
            </form>
          </div>
        </div>

        <div className="card">
          <div className="card-head">
            <h2>Add a free-form line</h2>
          </div>
          <div className="card-body">
            <form action={addLineToPO}>
              <input type="hidden" name="poId" value={po.id} />
              <div className="row" style={{ marginBottom: 12 }}>
                <div className="field">
                  <label className="field-label" htmlFor="description">Description</label>
                  <input
                    id="description"
                    name="description"
                    required
                    placeholder="Freight / shipping"
                  />
                </div>
                <div className="field field--sm">
                  <label className="field-label" htmlFor="kind">Type</label>
                  <select id="kind" name="kind" defaultValue="Other">
                    <option>Part</option>
                    <option>Freight</option>
                    <option>Other</option>
                  </select>
                </div>
              </div>
              <div className="row">
                <div className="field field--sm">
                  <label className="field-label" htmlFor="lqty">Qty</label>
                  <input id="lqty" name="qty" type="number" step="0.25" min="0" defaultValue="1" />
                </div>
                <div className="field field--sm">
                  <label className="field-label" htmlFor="unitPrice">Unit cost</label>
                  <input
                    id="unitPrice"
                    name="unitPrice"
                    type="number"
                    step="0.01"
                    min="0"
                    defaultValue="0"
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

      <div className="grid-2 no-print">
        <div className="card">
          <div className="card-head">
            <h2>Purchase order details</h2>
          </div>
          <div className="card-body">
            <form action={updatePurchaseOrder}>
              <input type="hidden" name="id" value={po.id} />
              <div className="field">
                <label className="field-label" htmlFor="supplier">Supplier</label>
                <input
                  id="supplier"
                  name="supplier"
                  defaultValue={po.supplier}
                  placeholder="Graybar, Anixter, …"
                />
              </div>
              <div className="row" style={{ marginBottom: 12 }}>
                <div className="field">
                  <label className="field-label" htmlFor="supplierContact">Contact</label>
                  <input
                    id="supplierContact"
                    name="supplierContact"
                    defaultValue={po.supplierContact}
                  />
                </div>
                <div className="field">
                  <label className="field-label" htmlFor="supplierPhone">Phone</label>
                  <input
                    id="supplierPhone"
                    name="supplierPhone"
                    defaultValue={po.supplierPhone}
                  />
                </div>
              </div>
              <div className="row" style={{ marginBottom: 12 }}>
                <div className="field">
                  <label className="field-label" htmlFor="supplierEmail">Email</label>
                  <input
                    id="supplierEmail"
                    name="supplierEmail"
                    type="email"
                    defaultValue={po.supplierEmail}
                  />
                </div>
                <div className="field">
                  <label className="field-label" htmlFor="reference">Supplier ref #</label>
                  <input id="reference" name="reference" defaultValue={po.reference} />
                </div>
              </div>
              <div className="field">
                <label className="field-label" htmlFor="supplierAddress">Ship to / address</label>
                <input
                  id="supplierAddress"
                  name="supplierAddress"
                  defaultValue={po.supplierAddress}
                />
              </div>
              <div className="row" style={{ marginBottom: 12 }}>
                <div className="field">
                  <label className="field-label" htmlFor="status">Status</label>
                  <select id="status" name="status" defaultValue={po.status}>
                    <option>Draft</option>
                    <option>Ordered</option>
                    <option>Received</option>
                    <option>Cancelled</option>
                  </select>
                </div>
                <div className="field">
                  <label className="field-label" htmlFor="issueDate">Issued</label>
                  <input
                    id="issueDate"
                    name="issueDate"
                    type="date"
                    defaultValue={po.issueDate}
                  />
                </div>
                <div className="field">
                  <label className="field-label" htmlFor="expectedDate">Expected</label>
                  <input
                    id="expectedDate"
                    name="expectedDate"
                    type="date"
                    defaultValue={po.expectedDate}
                  />
                </div>
                <div className="field field--sm">
                  <label className="field-label" htmlFor="taxRate">Tax %</label>
                  <input
                    id="taxRate"
                    name="taxRate"
                    type="number"
                    step="0.01"
                    defaultValue={po.taxRate}
                  />
                </div>
              </div>
              <div className="field">
                <label className="field-label" htmlFor="notes">Notes to supplier</label>
                <textarea id="notes" name="notes" defaultValue={po.notes} />
              </div>
              <button className="btn btn--primary" type="submit">
                Save changes
              </button>
            </form>
          </div>
        </div>

        <div>
          <div className="card">
            <div className="card-head">
              <h2>For service order</h2>
            </div>
            <div className="card-body">
              {order ? (
                <dl className="meta-list">
                  <dt>Job</dt>
                  <dd className="strong">
                    <Link href={`/orders/${order.id}`} className="doc-no">
                      {order.number}
                    </Link>{' '}
                    {order.title}
                  </dd>
                  <dt>Customer</dt>
                  <dd>{customer?.name || '—'}</dd>
                  <dt>Site</dt>
                  <dd>{order.siteAddress || '—'}</dd>
                </dl>
              ) : (
                <p className="muted">Not linked to a job.</p>
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-head">
              <h2>Move it along</h2>
            </div>
            <div className="card-body">
              <div className="row">
                <form action={setPurchaseOrderStatus} className="inline-form">
                  <input type="hidden" name="id" value={po.id} />
                  <input type="hidden" name="status" value="Ordered" />
                  <button className="btn" type="submit">Mark as ordered</button>
                </form>
                <form action={setPurchaseOrderStatus} className="inline-form">
                  <input type="hidden" name="id" value={po.id} />
                  <input type="hidden" name="status" value="Received" />
                  <button className="btn" type="submit">Mark as received</button>
                </form>
                <form action={deletePurchaseOrder} className="inline-form">
                  <input type="hidden" name="id" value={po.id} />
                  <button className="btn btn--ghost" type="submit">Delete PO</button>
                </form>
              </div>
              <p className="note" style={{ marginTop: 12 }}>
                Status is for your tracking only — marking a PO received doesn&apos;t change
                inventory stock.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
