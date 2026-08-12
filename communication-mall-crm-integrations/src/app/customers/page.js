import Link from 'next/link';
import { getCustomersWithBilling, totals } from '@/applib/db';
import { money } from '@/applib/format';
import { saveCustomer, deleteCustomer } from '@/applib/actions';
import ClickableRow from '@/appui/ClickableRow';

export const dynamic = 'force-dynamic';

export default async function CustomersPage() {
  const customers = await getCustomersWithBilling();

  const spendFor = (c) => c.invoices.reduce((s, i) => s + totals(i).total, 0);

  return (
    <>
      <div className="page-head">
        <div>
          <div className="eyebrow">Records</div>
          <h1>Customers</h1>
          <p className="sub">Everyone you quote, install for, and bill.</p>
        </div>
      </div>

      <div className="split">
        <div className="card">
          <div className="card-head">
            <h2>{customers.length} on file</h2>
          </div>
          {customers.length === 0 ? (
            <div className="empty">
              <strong>No customers yet</strong>
              Add one on the right to start quoting.
            </div>
          ) : (
            <div className="card-body card-body--tight">
              <table>
                <thead>
                  <tr>
                    <th>Business</th>
                    <th>Contact</th>
                    <th>Site</th>
                    <th className="num">Billed</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((c) => (
                    <ClickableRow key={c.id} href={`/customers/${c.id}`} title={`Open ${c.name}`}>
                      <td>
                        <Link href={`/customers/${c.id}`} className="strong">{c.name}</Link>
                        {c.notes ? <div className="note">{c.notes}</div> : null}
                      </td>
                      <td>
                        {c.contact}
                        <div className="note">{c.phone}</div>
                      </td>
                      <td className="muted">
                        {c.city}
                        {c.state ? `, ${c.state}` : ''}
                      </td>
                      <td className="num">{money(spendFor(c))}</td>
                      <td className="num">
                        <Link
                          href={`/quotes/new?customerId=${c.id}`}
                          className="btn btn--sm"
                        >
                          Quote
                        </Link>
                        <form action={deleteCustomer} className="inline-form">
                          <input type="hidden" name="id" value={c.id} />
                          <button className="btn btn--ghost btn--sm" type="submit">
                            Remove
                          </button>
                        </form>
                      </td>
                    </ClickableRow>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-head">
            <h2>Add a customer</h2>
          </div>
          <div className="card-body">
            <form action={saveCustomer}>
              <div className="field">
                <label className="field-label" htmlFor="name">Business name</label>
                <input id="name" name="name" required placeholder="Harbor Point Dental" />
              </div>
              <div className="field">
                <label className="field-label" htmlFor="contact">Primary contact</label>
                <input id="contact" name="contact" placeholder="Renee Alvarado" />
              </div>
              <div className="row" style={{ marginBottom: 12 }}>
                <div className="field">
                  <label className="field-label" htmlFor="phone">Phone</label>
                  <input id="phone" name="phone" placeholder="(949) 555-0140" />
                </div>
              </div>
              <div className="field">
                <label className="field-label" htmlFor="email">Email</label>
                <input id="email" name="email" type="email" placeholder="name@company.com" />
              </div>
              <div className="field">
                <label className="field-label" htmlFor="address">Service address</label>
                <input id="address" name="address" placeholder="18271 McDurmott West" />
              </div>
              <div className="row" style={{ marginBottom: 12 }}>
                <div className="field">
                  <label className="field-label" htmlFor="city">City</label>
                  <input id="city" name="city" />
                </div>
                <div className="field field--sm">
                  <label className="field-label" htmlFor="state">State</label>
                  <input id="state" name="state" defaultValue="CA" />
                </div>
                <div className="field field--sm">
                  <label className="field-label" htmlFor="zip">ZIP</label>
                  <input id="zip" name="zip" />
                </div>
              </div>
              <div className="field">
                <label className="field-label" htmlFor="notes">Site notes</label>
                <textarea id="notes" name="notes" placeholder="Gate code, closet location, who to call on site." />
              </div>
              <button className="btn btn--primary btn--block" type="submit">
                Save customer
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
