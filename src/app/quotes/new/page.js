import Link from 'next/link';
import { getCustomers, getCompany } from '@/applib/db';
import { createQuote } from '@/applib/actions';

export const dynamic = 'force-dynamic';

export default async function NewQuotePage({ searchParams }) {
  const [customers, company] = await Promise.all([getCustomers(), getCompany()]);
  const preselect = searchParams?.customerId || '';

  if (customers.length === 0) {
    return (
      <div className="card">
        <div className="empty">
          <strong>Add a customer first</strong>
          A quote needs someone to send it to.{' '}
          <Link href="/customers" style={{ color: 'var(--signal)' }}>
            Go to customers →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="page-head">
        <div>
          <div className="eyebrow">Pipeline · Step 1</div>
          <h1>Start a quote</h1>
          <p className="sub">Set the header now. Parts and labor come next.</p>
        </div>
      </div>

      <div className="card" style={{ maxWidth: 620 }}>
        <div className="card-body">
          <form action={createQuote}>
            <div className="field">
              <label className="field-label" htmlFor="customerId">Customer</label>
              <select id="customerId" name="customerId" defaultValue={preselect} required>
                <option value="" disabled>
                  Choose a customer
                </option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label className="field-label" htmlFor="title">Scope of work</label>
              <input
                id="title"
                name="title"
                required
                placeholder="Hosted VoIP cutover — 12 stations"
              />
            </div>

            <div className="field">
              <label className="field-label" htmlFor="siteAddress">Install site</label>
              <input id="siteAddress" name="siteAddress" placeholder="Leave blank to use the billing address" />
            </div>

            <div className="row" style={{ marginBottom: 12 }}>
              <div className="field field--sm">
                <label className="field-label" htmlFor="taxRate">Tax %</label>
                <input
                  id="taxRate"
                  name="taxRate"
                  type="number"
                  step="0.01"
                  defaultValue={company.defaultTaxRate}
                />
              </div>
            </div>

            <div className="field">
              <label className="field-label" htmlFor="notes">Notes to the customer</label>
              <textarea
                id="notes"
                name="notes"
                placeholder="What's included, what isn't, lead times."
              />
            </div>

            <button className="btn btn--primary" type="submit">
              Create quote and add parts
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
