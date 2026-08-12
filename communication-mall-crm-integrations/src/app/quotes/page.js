import Link from 'next/link';
import { getQuotes, totals } from '@/applib/db';
import { money, day } from '@/applib/format';
import { Chip } from '@/appui/Doc';
import ClickableRow from '@/appui/ClickableRow';

export const dynamic = 'force-dynamic';

export default async function QuotesPage() {
  const quotes = await getQuotes();

  return (
    <>
      <div className="page-head">
        <div>
          <div className="eyebrow">Pipeline · Step 1</div>
          <h1>Quotes</h1>
          <p className="sub">Price the job. Accept it and it becomes a service order.</p>
        </div>
        <Link href="/quotes/new" className="btn btn--primary">
          Start a quote
        </Link>
      </div>

      <div className="card">
        {quotes.length === 0 ? (
          <div className="empty">
            <strong>No quotes yet</strong>
            Start one, add products and services from the catalog, and send it.
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Quote</th>
                <th>Customer</th>
                <th>Scope</th>
                <th>Valid until</th>
                <th>Status</th>
                <th className="num">Total</th>
              </tr>
            </thead>
            <tbody>
              {quotes.map((q) => (
                <ClickableRow key={q.id} href={`/quotes/${q.id}`} title={`Open ${q.number}`}>
                  <td>
                    <Link href={`/quotes/${q.id}`} className="doc-no">
                      {q.number}
                    </Link>
                    <div className="note">{day(q.issueDate)}</div>
                  </td>
                  <td>{q.customer?.name}</td>
                  <td className="muted">{q.title}</td>
                  <td className="muted">{day(q.validUntil)}</td>
                  <td>
                    <Chip status={q.status} />
                    {q.order ? <div className="note">Converted</div> : null}
                  </td>
                  <td className="num strong">{money(totals(q).total)}</td>
                </ClickableRow>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
