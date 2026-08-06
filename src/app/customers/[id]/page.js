import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCustomerWithHistory, totals } from '@/applib/db';
import { money, day } from '@/applib/format';
import { Chip } from '@/appui/Doc';

export const dynamic = 'force-dynamic';

export default async function CustomerPage({ params }) {
  const c = await getCustomerWithHistory(params.id);
  if (!c) notFound();

  const invoiced = c.invoices.reduce((s, i) => s + totals(i).total, 0);
  const collected = c.invoices.reduce((s, i) => s + i.amountPaid, 0);
  const outstanding = invoiced - collected;

  const rows = [
    ...c.quotes.map((d) => ({ ...d, type: 'Quote', href: `/quotes/${d.id}` })),
    ...c.orders.map((d) => ({ ...d, type: 'Service order', href: `/orders/${d.id}` })),
    ...c.invoices.map((d) => ({ ...d, type: 'Invoice', href: `/invoices/${d.id}` })),
  ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return (
    <>
      <div className="page-head">
        <div>
          <div className="eyebrow">
            <Link href="/customers" style={{ color: 'var(--ink-3)' }}>Customers</Link> ›
          </div>
          <h1>{c.name}</h1>
          <p className="sub">
            {c.contact ? `${c.contact} · ` : ''}
            {c.phone || ''}{c.email ? ` · ${c.email}` : ''}
          </p>
        </div>
        <Link href={`/quotes/new?customerId=${c.id}`} className="btn btn--primary">
          New quote
        </Link>
      </div>

      <div className="grid-4" style={{ marginBottom: 20 }}>
        <div className="stat">
          <div className="stat-label">Quotes</div>
          <div className="stat-value">{c.quotes.length}</div>
        </div>
        <div className="stat">
          <div className="stat-label">Jobs</div>
          <div className="stat-value">{c.orders.length}</div>
        </div>
        <div className="stat">
          <div className="stat-label">Billed</div>
          <div className="stat-value">{money(invoiced)}</div>
        </div>
        <div className="stat">
          <div className="stat-label">Outstanding</div>
          <div className="stat-value">{money(outstanding)}</div>
          <div className="stat-foot">{money(collected)} collected</div>
        </div>
      </div>

      <div className="split">
        <div className="card">
          <div className="card-head">
            <h2>History</h2>
            <span className="note">Everything for this customer</span>
          </div>
          {rows.length === 0 ? (
            <div className="empty">
              <strong>Nothing yet</strong>
              Start a quote to begin their history.
            </div>
          ) : (
            <div className="card-body card-body--tight">
              <table>
                <thead>
                  <tr>
                    <th>Document</th>
                    <th>Scope</th>
                    <th>Status</th>
                    <th className="num">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((d) => (
                    <tr key={d.id}>
                      <td>
                        <Link href={d.href} className="doc-no">{d.number}</Link>
                        <div className="note">{d.type} · {day(d.createdAt?.toISOString?.().slice(0,10) || d.issueDate || d.openedDate)}</div>
                      </td>
                      <td className="muted">{d.title}</td>
                      <td><Chip status={d.status} /></td>
                      <td className="num strong">{money(totals(d).total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-head">
            <h2>Details</h2>
          </div>
          <div className="card-body">
            <dl className="meta-list">
              <dt>Contact</dt>
              <dd>{c.contact || '—'}</dd>
              <dt>Phone</dt>
              <dd>{c.phone || '—'}</dd>
              <dt>Email</dt>
              <dd>{c.email || '—'}</dd>
              <dt>Address</dt>
              <dd>{[c.address, c.city, c.state, c.zip].filter(Boolean).join(', ') || '—'}</dd>
              <dt>Notes</dt>
              <dd className="muted">{c.notes || '—'}</dd>
            </dl>
          </div>
        </div>
      </div>
    </>
  );
}
