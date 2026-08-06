import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { prisma } from '@/applib/prisma';
import { getCompany } from '@/applib/db';
import {
  saveCompany,
  createUser,
  resetPassword,
  deleteUser,
} from '@/applib/actions';

export const dynamic = 'force-dynamic';

const flashBase = {
  padding: '10px 14px',
  borderRadius: 8,
  marginBottom: 16,
  fontSize: 14,
  border: '1px solid',
};

function roleLabel(role) {
  return role === 'admin' ? 'Admin — full access' : 'Technician';
}

export default async function SettingsPage({ searchParams }) {
  const session = await auth();
  if (session?.user?.role !== 'admin') redirect('/');

  const company = await getCompany();
  const users = await prisma.user.findMany({ orderBy: { createdAt: 'asc' } });

  const ok = typeof searchParams?.ok === 'string' ? searchParams.ok : null;
  const err = typeof searchParams?.err === 'string' ? searchParams.err : null;
  const myId = session.user.id;

  return (
    <>
      <div className="page-head">
        <div>
          <div className="eyebrow">Admin</div>
          <h1>Settings</h1>
          <p className="sub">
            What prints on your quotes and invoices, and who can sign in to the system.
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

      <div className="card" style={{ maxWidth: 620, marginTop: 20 }}>
        <div className="card-head">
          <h2>Team members</h2>
          <span className="note">
            {users.length} {users.length === 1 ? 'person' : 'people'}
          </span>
        </div>
        <div className="card-body">
          {ok ? (
            <div
              style={{
                ...flashBase,
                background: 'rgba(34,197,94,0.12)',
                borderColor: 'rgba(34,197,94,0.5)',
                color: '#166534',
              }}
            >
              {ok}
            </div>
          ) : null}
          {err ? (
            <div
              style={{
                ...flashBase,
                background: 'rgba(239,68,68,0.10)',
                borderColor: 'rgba(239,68,68,0.5)',
                color: '#991b1b',
              }}
            >
              {err}
            </div>
          ) : null}

          <p className="sub" style={{ marginTop: 0 }}>
            Everyone here can sign in at your website. Admins can reach this Settings page and
            manage the team; technicians can work on quotes, orders, and invoices.
          </p>

          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th style={{ width: 150 }}>Role</th>
                <th className="no-print" style={{ width: 110 }}></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td className="strong">
                    {u.name}
                    {u.id === myId ? <span className="note"> (you)</span> : null}
                  </td>
                  <td className="muted">{u.email}</td>
                  <td>{roleLabel(u.role)}</td>
                  <td className="no-print">
                    <details>
                      <summary
                        className="btn btn--ghost btn--sm"
                        style={{ listStyle: 'none', cursor: 'pointer' }}
                      >
                        Manage
                      </summary>
                      <div
                        style={{
                          marginTop: 10,
                          padding: 12,
                          border: '1px solid var(--line, #e2e8f0)',
                          borderRadius: 8,
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 12,
                        }}
                      >
                        <form action={resetPassword}>
                          <input type="hidden" name="id" value={u.id} />
                          <label className="field-label" htmlFor={`pw-${u.id}`}>
                            Set a new password
                          </label>
                          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                            <input
                              id={`pw-${u.id}`}
                              name="password"
                              type="password"
                              placeholder="At least 10 characters"
                              minLength={10}
                              required
                              style={{ flex: 1 }}
                            />
                            <button className="btn btn--sm" type="submit">Update</button>
                          </div>
                        </form>
                        {u.id !== myId ? (
                          <form action={deleteUser}>
                            <input type="hidden" name="id" value={u.id} />
                            <button className="btn btn--ghost btn--sm" type="submit">
                              Remove from team
                            </button>
                          </form>
                        ) : (
                          <p className="note" style={{ margin: 0 }}>
                            This is your own account.
                          </p>
                        )}
                      </div>
                    </details>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <h3 style={{ marginTop: 24, marginBottom: 12 }}>Add a team member</h3>
          <form action={createUser}>
            <div className="row" style={{ marginBottom: 12 }}>
              <div className="field">
                <label className="field-label" htmlFor="newName">Name</label>
                <input id="newName" name="name" placeholder="Jane Smith" required />
              </div>
              <div className="field">
                <label className="field-label" htmlFor="newEmail">Email</label>
                <input
                  id="newEmail"
                  name="email"
                  type="email"
                  placeholder="jane@communicationmall.com"
                  required
                />
              </div>
            </div>
            <div className="row" style={{ marginBottom: 12 }}>
              <div className="field">
                <label className="field-label" htmlFor="newPassword">Temporary password</label>
                <input
                  id="newPassword"
                  name="password"
                  type="text"
                  placeholder="At least 10 characters"
                  minLength={10}
                  required
                />
              </div>
              <div className="field">
                <label className="field-label" htmlFor="newRole">Role</label>
                <select id="newRole" name="role" defaultValue="tech">
                  <option value="tech">Technician</option>
                  <option value="admin">Admin — full access</option>
                </select>
              </div>
            </div>
            <button className="btn btn--primary" type="submit">Add team member</button>
          </form>
          <p className="note" style={{ marginTop: 10 }}>
            Give them the email and temporary password you entered — they can sign in right away,
            and you can set a new password for them here any time.
          </p>
        </div>
      </div>

      <p className="note">
        Document numbers continue from Q-{company.quoteCounter}, SO-{company.orderCounter},
        INV-{company.invoiceCounter}.
      </p>
    </>
  );
}
