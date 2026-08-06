import { notFound } from 'next/navigation';
import { getInvoice, getCompany, totals, cents } from '@/applib/db';
import { money, day } from '@/applib/format';
import { Chain, Chip, LineTable, Totals } from '@/appui/Doc';
import { recordPayment, updateInvoice, emailInvoice } from '@/applib/actions';
import { emailConfigured } from '@/applib/email';
import PrintButton from '@/appui/PrintButton';

export const dynamic = 'force-dynamic';

export default async function InvoicePage({ params, searchParams }) {
  const invoice = await getInvoice(params.id);
  if (!invoice) notFound();

  const editId = searchParams?.edit;
  const emailState = searchParams?.email;
  const emailWhy = searchParams?.why;
  const canEmail = emailConfigured();

  const company = await getCompany();
  const order = invoice.order;
  const quote = order?.quote || null;
  const customer = invoice.customer;
  const t = totals(invoice);
  const balance = cents(t.total - invoice.amountPaid);

  return (
    <>
      <div className="page-head">
        <div>
          <div className="eyebrow">Invoice {invoice.number}</div>
          <h1>{invoice.title}</h1>
          <p className="sub">
            {customer?.name} · Issued {day(invoice.issueDate)} · {invoice.terms}, due{' '}
            {day(invoice.dueDate)}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }} className="no-print">
          <Chip status={invoice.status} />
          <form action={emailInvoice}>
            <input type="hidden" name="id" value={invoice.id} />
            <button
              className="btn"
              type="submit"
              disabled={!canEmail || !customer?.email}
              title={
                !canEmail
                  ? 'Email isn\'t set up yet'
                  : !customer?.email
                  ? 'This customer has no email on file'
                  : 'Email this invoice'
              }
            >
              Email invoice
            </button>
          </form>
          <PrintButton />
        </div>
      </div>

      {emailState === 'sent' ? (
        <div className="banner banner--ok no-print">Invoice emailed to {customer?.email}.</div>
      ) : null}
      {emailState === 'failed' ? (
        <div className="banner banner--bad no-print">
          {emailWhy || 'Couldn\'t send the email. Check that email is set up and the customer has an address on file.'}
        </div>
      ) : null}

      <Chain quote={quote} order={order} invoice={invoice} current="invoice" />

      <div className="card">
        <div className="card-head">
          <div>
            <h2>{company.name}</h2>
            <div className="note">
              {company.address} · {company.phone} · {company.email}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="eyebrow">Bill to</div>
            <div className="strong">{customer?.name}</div>
            <div className="note">
              {[customer?.address, customer?.city, customer?.state, customer?.zip]
                .filter(Boolean)
                .join(', ')}
            </div>
          </div>
        </div>
        <div className="card-body card-body--tight">
          <LineTable items={invoice.items} editable={invoice.status !== 'Paid'} editId={editId} kind="invoice" docId={invoice.id} unitLabel="Unit" />
          <div className="card-body">
            <Totals doc={invoice} totals={t} paid={invoice.amountPaid} />
          </div>
        </div>
      </div>

      <div className="grid-2 no-print">
        <div className="card">
          <div className="card-head">
            <h2>Record a payment</h2>
            <span className="note">Balance {money(balance)}</span>
          </div>
          <div className="card-body">
            {balance <= 0.005 ? (
              <p className="note">Paid in full. Nothing left to collect.</p>
            ) : (
              <form action={recordPayment}>
                <input type="hidden" name="id" value={invoice.id} />
                <div className="row">
                  <div className="field">
                    <label className="field-label" htmlFor="amount">Amount received</label>
                    <input
                      id="amount"
                      name="amount"
                      type="number"
                      step="0.01"
                      min="0"
                      defaultValue={balance.toFixed(2)}
                    />
                  </div>
                  <button className="btn btn--convert" type="submit">
                    Record payment
                  </button>
                </div>
              </form>
            )}

            {invoice.payments.length > 0 ? (
              <>
                <div className="divider" />
                <div className="eyebrow" style={{ marginBottom: 8 }}>Payment history</div>
                {invoice.payments.map((p) => (
                  <div className="totals-row" key={p.id} style={{ padding: '4px 0' }}>
                    <span>
                      {day(p.receivedOn)}
                      {p.recordedBy ? ` · ${p.recordedBy}` : ''}
                    </span>
                    <span>{money(p.amount)}</span>
                  </div>
                ))}
              </>
            ) : null}
          </div>
        </div>

        <div className="card">
          <div className="card-head">
            <h2>Billing terms</h2>
          </div>
          <div className="card-body">
            <form action={updateInvoice}>
              <input type="hidden" name="id" value={invoice.id} />
              <div className="row" style={{ marginBottom: 12 }}>
                <div className="field">
                  <label className="field-label" htmlFor="terms">Terms</label>
                  <select id="terms" name="terms" defaultValue={invoice.terms}>
                    <option>Due on receipt</option>
                    <option>Net 15</option>
                    <option>Net 30</option>
                    <option>Net 60</option>
                  </select>
                </div>
                <div className="field">
                  <label className="field-label" htmlFor="dueDate">Due date</label>
                  <input
                    id="dueDate"
                    name="dueDate"
                    type="date"
                    defaultValue={invoice.dueDate}
                  />
                </div>
                <div className="field">
                  <label className="field-label" htmlFor="status">Status</label>
                  <select id="status" name="status" defaultValue={invoice.status}>
                    <option>Unpaid</option>
                    <option>Partly paid</option>
                    <option>Paid</option>
                  </select>
                </div>
              </div>
              <button className="btn btn--primary" type="submit">
                Save changes
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
