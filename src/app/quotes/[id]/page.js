import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getQuote, getCatalog, getCompany, getCustomers, totals } from '@/applib/db';
import { money, day, qty } from '@/applib/format';
import { Chain, Chip, Totals } from '@/appui/Doc';
import { emailConfigured } from '@/applib/email';
import {
  emailQuote,
  addCatalogToQuote,
  addLineToQuote,
  updateQuoteLine,
  removeQuoteLine,
  updateQuote,
  setQuoteStatus,
  convertQuoteToOrder,
  duplicateQuote,
  deleteQuote,
} from '@/applib/actions';

export const dynamic = 'force-dynamic';

export default async function QuotePage({ params, searchParams }) {
  const quote = await getQuote(params.id);
  if (!quote) notFound();

  const [catalog, company, customers] = await Promise.all([
    getCatalog(),
    getCompany(),
    getCustomers(),
  ]);
  const customer = quote.customer;
  const order = quote.order;
  const invoice = order?.invoice || null;
  const t = totals(quote);
  const locked = Boolean(order);
  const emailState = searchParams?.email;
  const emailWhy = searchParams?.why;
  const canEmail = emailConfigured();

  return (
    <>
      <div className="page-head">
        <div>
          <div className="eyebrow">Quote {quote.number}</div>
          <h1>{quote.title}</h1>
          <p className="sub">
            {customer?.name} · Issued {day(quote.issueDate)} · Valid through{' '}
            {day(quote.validUntil)}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }} className="no-print">
          <Chip status={quote.status} />
          {quote.items.length > 0 ? (
            <form action={emailQuote}>
              <input type="hidden" name="id" value={quote.id} />
              <button
                className="btn"
                type="submit"
                disabled={!canEmail || !customer?.email}
                title={
                  !canEmail
                    ? 'Email isn\'t set up yet'
                    : !customer?.email
                    ? 'This customer has no email on file'
                    : 'Email this quote'
                }
              >
                Email quote
              </button>
            </form>
          ) : null}
          {!locked && quote.items.length > 0 ? (
            <form action={convertQuoteToOrder}>
              <input type="hidden" name="id" value={quote.id} />
              <button className="btn btn--convert" type="submit">
                Convert to service order →
              </button>
            </form>
          ) : null}
          {locked ? (
            <Link href={`/orders/${order.id}`} className="btn btn--convert">
              Open service order →
            </Link>
          ) : null}
        </div>
      </div>

      {emailState === 'sent' ? (
        <div className="banner banner--ok no-print">Quote emailed to {customer?.email}.</div>
      ) : null}
      {emailState === 'failed' ? (
        <div className="banner banner--bad no-print">
          {emailWhy || 'Couldn\'t send the email. Check that email is set up and the customer has an address on file.'}
        </div>
      ) : null}

      <Chain quote={quote} order={order} invoice={invoice} current="quote" />

      {locked ? (
        <p className="note" style={{ marginTop: -12, marginBottom: 20 }}>
          This quote is locked because it was converted. Change the work on the service
          order instead.
        </p>
      ) : null}

      <div className="card">
        <div className="card-head">
          <h2>Line items</h2>
          <span className="note">
            {quote.items.length} {quote.items.length === 1 ? 'line' : 'lines'}
          </span>
        </div>

        {quote.items.length === 0 ? (
          <div className="empty">
            <strong>Nothing on this quote yet</strong>
            Add a product or service from the catalog below, or add labor.
          </div>
        ) : (
          <div className="card-body card-body--tight">
            <table>
              <thead>
                <tr>
                  <th style={{ width: 80 }}>Type</th>
                  <th style={{ width: 120 }}>SKU</th>
                  <th>Description</th>
                  <th className="num" style={{ width: 90 }}>Qty</th>
                  <th className="num" style={{ width: 120 }}>Unit price</th>
                  <th className="num" style={{ width: 110 }}>Amount</th>
                  <th style={{ width: 130 }}></th>
                </tr>
              </thead>
              <tbody>
                {quote.items.map((li) => (
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
                    {locked ? (
                      <>
                        <td className="num">{qty(li.qty)}</td>
                        <td className="num">{money(li.unitPrice)}</td>
                      </>
                    ) : (
                      <>
                        <td className="num">
                          <form action={updateQuoteLine} id={`line-${li.id}`}>
                            <input type="hidden" name="quoteId" value={quote.id} />
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
                        </td>
                        <td className="num">
                          <input
                            form={`line-${li.id}`}
                            name="unitPrice"
                            type="number"
                            step="0.01"
                            min="0"
                            defaultValue={li.unitPrice}
                            aria-label="Unit price"
                          />
                        </td>
                      </>
                    )}
                    <td className="num strong">{money(li.qty * li.unitPrice)}</td>
                    <td className="num no-print">
                      {locked ? null : (
                        <>
                          <button
                            form={`line-${li.id}`}
                            className="btn btn--sm"
                            type="submit"
                          >
                            Update
                          </button>{' '}
                          <form action={removeQuoteLine} className="inline-form">
                            <input type="hidden" name="quoteId" value={quote.id} />
                            <input type="hidden" name="lineId" value={li.id} />
                            <button className="btn btn--ghost btn--sm" type="submit">
                              Remove
                            </button>
                          </form>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="card-body">
              <Totals doc={quote} totals={t} />
            </div>
          </div>
        )}
      </div>

      {!locked ? (
        <div className="grid-2 no-print">
          <div className="card">
            <div className="card-head">
              <h2>Add a product or service</h2>
              <Link href="/catalog" className="note">
                Price book →
              </Link>
            </div>
            <div className="card-body">
              <form action={addCatalogToQuote}>
                <input type="hidden" name="quoteId" value={quote.id} />
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
                <p className="note" style={{ marginTop: 12 }}>
                  Monthly charges (MRC) show as a separate recurring total. Setup fees (NRC)
                  go into the one-time total.
                </p>
              </form>
            </div>
          </div>

          <div className="card">
            <div className="card-head">
              <h2>Add labor or a service</h2>
            </div>
            <div className="card-body">
              <form action={addLineToQuote}>
                <input type="hidden" name="quoteId" value={quote.id} />
                <div className="row" style={{ marginBottom: 12 }}>
                  <div className="field">
                    <label className="field-label" htmlFor="description">Description</label>
                    <input
                      id="description"
                      name="description"
                      required
                      placeholder="On-site install and cutover"
                    />
                  </div>
                  <div className="field field--sm">
                    <label className="field-label" htmlFor="kind">Type</label>
                    <select id="kind" name="kind" defaultValue="Labor">
                      <option>Labor</option>
                      <option>Service</option>
                      <option>Recurring</option>
                      <option>Trip charge</option>
                    </select>
                  </div>
                </div>
                <div className="row">
                  <div className="field field--sm">
                    <label className="field-label" htmlFor="lqty">Hours / qty</label>
                    <input id="lqty" name="qty" type="number" step="0.25" min="0" defaultValue="1" />
                  </div>
                  <div className="field field--sm">
                    <label className="field-label" htmlFor="unitPrice">Rate</label>
                    <input
                      id="unitPrice"
                      name="unitPrice"
                      type="number"
                      step="0.01"
                      min="0"
                      defaultValue={company.laborRate}
                    />
                  </div>
                  <label className="check">
                    <input type="checkbox" name="taxable" />
                    Taxable
                  </label>
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
            <h2>Quote details</h2>
          </div>
          <div className="card-body">
            <form action={updateQuote}>
              <input type="hidden" name="id" value={quote.id} />
              <div className="field">
                <label className="field-label" htmlFor="qtitle">Scope of work</label>
                <input id="qtitle" name="title" defaultValue={quote.title} />
              </div>
              <div className="row" style={{ marginBottom: 12 }}>
                <div className="field">
                  <label className="field-label" htmlFor="status">Status</label>
                  <select id="status" name="status" defaultValue={quote.status}>
                    <option>Draft</option>
                    <option>Sent</option>
                    <option>Accepted</option>
                    <option>Declined</option>
                  </select>
                </div>
                <div className="field">
                  <label className="field-label" htmlFor="validUntil">Valid until</label>
                  <input
                    id="validUntil"
                    name="validUntil"
                    type="date"
                    defaultValue={quote.validUntil}
                  />
                </div>
                <div className="field field--sm">
                  <label className="field-label" htmlFor="qtax">Tax %</label>
                  <input
                    id="qtax"
                    name="taxRate"
                    type="number"
                    step="0.01"
                    defaultValue={quote.taxRate}
                  />
                </div>
              </div>
              <div className="field">
                <label className="field-label" htmlFor="qsite">Install site</label>
                <input id="qsite" name="siteAddress" defaultValue={quote.siteAddress} />
              </div>
              <div className="field">
                <label className="field-label" htmlFor="qnotes">Notes to the customer</label>
                <textarea id="qnotes" name="notes" defaultValue={quote.notes} />
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
                <dt>Email</dt>
                <dd>{customer?.email || '—'}</dd>
                <dt>Site</dt>
                <dd>
                  {quote.siteAddress ||
                    [customer?.address, customer?.city, customer?.state, customer?.zip]
                      .filter(Boolean)
                      .join(', ')}
                </dd>
              </dl>
            </div>
          </div>

          <div className="card">
            <div className="card-head">
              <h2>Duplicate this quote</h2>
            </div>
            <div className="card-body">
              <form action={duplicateQuote}>
                <input type="hidden" name="id" value={quote.id} />
                <div className="field">
                  <label className="field-label" htmlFor="dupCustomer">
                    Customer for the copy
                  </label>
                  <select
                    id="dupCustomer"
                    name="customerId"
                    defaultValue={quote.customerId}
                  >
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <p className="note" style={{ marginBottom: 12 }}>
                  Copies every line item into a new Draft quote. Leave the customer as-is
                  for a repeat job, or pick a different one to reuse this quote as a
                  template.
                </p>
                <button className="btn" type="submit">
                  Duplicate quote →
                </button>
              </form>
            </div>
          </div>

          {!locked ? (
            <div className="card">
              <div className="card-head">
                <h2>Move it along</h2>
              </div>
              <div className="card-body">
                <div className="row">
                  <form action={setQuoteStatus} className="inline-form">
                    <input type="hidden" name="id" value={quote.id} />
                    <input type="hidden" name="status" value="Sent" />
                    <button className="btn" type="submit">Mark as sent</button>
                  </form>
                  <form action={setQuoteStatus} className="inline-form">
                    <input type="hidden" name="id" value={quote.id} />
                    <input type="hidden" name="status" value="Declined" />
                    <button className="btn" type="submit">Mark as declined</button>
                  </form>
                  <form action={deleteQuote} className="inline-form">
                    <input type="hidden" name="id" value={quote.id} />
                    <button className="btn btn--ghost" type="submit">Delete quote</button>
                  </form>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </>
  );
}
