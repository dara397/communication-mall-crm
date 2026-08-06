import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { getCompany } from '@/applib/db';
import { saveCompany } from '@/applib/actions';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const session = await auth();
  if (session?.user?.role !== 'admin') redirect('/');

  const company = await getCompany();

  return (
    <>
      <div className="page-head">
        <div>
          <div className="eyebrow">Admin</div>
          <h1>Settings</h1>
          <p className="sub">
            What prints on your quotes and invoices, and the defaults new documents start
            with.
          </p>
        </div>
      </div>

      <div className="card" style={{ maxWidth: 620 }}>
        <div className="card-head">
          <h2>Business details</h2>
          <Link href="/settings/email-test" className="note">Email not working? Test it →</Link>
        </div>
        <div className="card-body">
          <form action={saveCompany}>
            <div className="field">
              <label className="field-label" htmlFor="name">Business name</label>
              <input id="name" name="name" defaultValue={company.name} required />
            </div>
            <div className="field">
              <label className="field-label" htmlFor="tagline">Tagline</label>
              <input id="tagline" name="tagline" defaultValue={company.tagline} />
            </div>
            <div className="field">
              <label className="field-label" htmlFor="address">Address</label>
              <input id="address" name="address" defaultValue={company.address} />
            </div>
            <div className="row" style={{ marginBottom: 12 }}>
              <div className="field">
                <label className="field-label" htmlFor="phone">Phone</label>
                <input id="phone" name="phone" defaultValue={company.phone} />
              </div>
              <div className="field">
                <label className="field-label" htmlFor="email">Email</label>
                <input id="email" name="email" defaultValue={company.email} />
              </div>
            </div>
            <div className="row" style={{ marginBottom: 12 }}>
              <div className="field">
                <label className="field-label" htmlFor="defaultTaxRate">Default tax rate %</label>
                <input
                  id="defaultTaxRate"
                  name="defaultTaxRate"
                  type="number"
                  step="0.01"
                  defaultValue={company.defaultTaxRate}
                />
              </div>
              <div className="field">
                <label className="field-label" htmlFor="laborRate">Labor rate / hr</label>
                <input
                  id="laborRate"
                  name="laborRate"
                  type="number"
                  step="0.01"
                  defaultValue={company.laborRate}
                />
              </div>
            </div>
            <button className="btn btn--primary" type="submit">Save settings</button>
          </form>
        </div>
      </div>

      <p className="note">
        Document numbers continue from Q-{company.quoteCounter}, SO-{company.orderCounter},
        INV-{company.invoiceCounter}.
      </p>
    </>
  );
}
