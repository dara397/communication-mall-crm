import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getLead } from '@/applib/db';
import { money, day } from '@/applib/format';
import { updateLead, saveLead, convertLead, addLeadNote, deleteLeadNote, deleteLead } from '@/applib/actions';

export const dynamic = 'force-dynamic';

const STATUSES = ['New', 'Qualified', 'Site walk', 'Quoted', 'Won', 'Lost'];
const SOURCES = ['Web', 'Assistant', 'Phone', 'Referral', 'Manual'];
const ROOMS = ['Boardroom', 'Huddle room', 'Training room', 'Lobby / waiting room', 'Mixed'];
const statusTone = (s) =>
  s === 'Won' ? 'signal' : s === 'Lost' ? 'alert' : s === 'Quoted' ? 'copper' : undefined;

function Detail({ label, children }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, padding: '7px 0', borderBottom: '1px solid var(--line)' }}>
      <span className="field-label" style={{ marginTop: 2 }}>{label}</span>
      <span style={{ textAlign: 'right' }}>{children || <span className="muted">—</span>}</span>
    </div>
  );
}

export default async function LeadDetail({ params }) {
  const { id } = await params;
  const lead = await getLead(id);
  if (!lead) notFound();

  return (
    <>
      <div className="page-head">
        <div>
          <div className="eyebrow">
            Lead · {lead.source} · received {day(lead.receivedAt.toISOString().slice(0, 10))}
          </div>
          <h1>{lead.name}</h1>
          <p className="sub">
            {lead.company || 'No company given'} · <span className="chip" data-tone={statusTone(lead.status)}>{lead.status}</span>
            {lead.estimatedValue ? ` · ${money(lead.estimatedValue)}` : ''}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Link href="/leads" className="btn btn--ghost">← Back to leads</Link>
          <form action={deleteLead} className="inline-form">
            <input type="hidden" name="id" value={lead.id} />
            <button className="btn btn--ghost" type="submit">Delete</button>
          </form>
        </div>
      </div>

      <div className="grid-2">
        {/* LEFT COLUMN */}
        <div>
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-head"><h2>Details</h2></div>
            <div className="card-body">
              <Detail label="Email">
                {lead.email ? <a href={`mailto:${lead.email}`}>{lead.email}</a> : null}
              </Detail>
              <Detail label="Phone">
                {lead.phone ? <a href={`tel:${lead.phone}`}>{lead.phone}</a> : null}
              </Detail>
              <Detail label="Room type">{lead.roomType}</Detail>
              <Detail label="Rooms">{lead.roomQty}</Detail>
              <Detail label="Metro">{lead.metro}</Detail>
              <Detail label="Estimated value">{lead.estimatedValue ? money(lead.estimatedValue) : null}</Detail>
              {lead.customer ? (
                <Detail label="Account">
                  <Link href={`/customers/${lead.customer.id}`} className="strong">{lead.customer.name}</Link>
                </Detail>
              ) : null}
              {lead.notes ? (
                <div style={{ marginTop: 10 }}>
                  <div className="field-label" style={{ marginBottom: 4 }}>Notes</div>
                  <p className="note" style={{ whiteSpace: 'pre-wrap' }}>{lead.notes}</p>
                </div>
              ) : null}
            </div>
          </div>

          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-head"><h2>Activity</h2></div>
            <div className="card-body">
              {lead.activities.length === 0 ? (
                <p className="note">Nothing recorded yet.</p>
              ) : (
                <div style={{ marginBottom: 14 }}>
                  {lead.activities.map((a) => (
                    <div key={a.id} style={{ padding: '8px 0', borderBottom: '1px solid var(--line)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span className="note">{a.author || 'Team'} · {day(a.createdAt.toISOString().slice(0, 10))}</span>
                        <form action={deleteLeadNote} className="inline-form">
                          <input type="hidden" name="id" value={a.id} />
                          <input type="hidden" name="leadId" value={lead.id} />
                          <button className="btn btn--ghost btn--sm" type="submit">×</button>
                        </form>
                      </div>
                      <div style={{ whiteSpace: 'pre-wrap' }}>{a.body}</div>
                    </div>
                  ))}
                </div>
              )}
              <form action={addLeadNote}>
                <input type="hidden" name="leadId" value={lead.id} />
                <div className="field">
                  <label className="field-label" htmlFor="body">Add a note</label>
                  <textarea id="body" name="body" required placeholder="Call summary, next step, site-walk notes…" />
                </div>
                <button className="btn btn--block" type="submit">Add note</button>
              </form>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div>
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-head"><h2>Update</h2></div>
            <div className="card-body">
              <form action={updateLead}>
                <input type="hidden" name="id" value={lead.id} />
                <div className="field">
                  <label className="field-label" htmlFor="status">Stage</label>
                  <select id="status" name="status" defaultValue={lead.status}>
                    {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label className="field-label" htmlFor="estimatedValue">Estimated value ($)</label>
                  <input id="estimatedValue" name="estimatedValue" type="number" step="0.01" min="0" defaultValue={lead.estimatedValue} />
                </div>
                <div className="field">
                  <label className="field-label" htmlFor="lostReason">Reason, if lost</label>
                  <input id="lostReason" name="lostReason" defaultValue={lead.lostReason} placeholder="Budget, timing, competitor…" />
                </div>
                <button className="btn btn--primary btn--block" type="submit">Save changes</button>
              </form>
            </div>
          </div>

          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-head"><h2>Account</h2></div>
            <div className="card-body">
              {lead.customer ? (
                <>
                  <p className="note" style={{ marginBottom: 10 }}>
                    Linked to <Link href={`/customers/${lead.customer.id}`} className="strong">{lead.customer.name}</Link>.
                  </p>
                  <Link href={`/quotes/new?customerId=${lead.customer.id}`} className="btn btn--primary btn--block">
                    Create a quote
                  </Link>
                </>
              ) : (
                <>
                  <p className="note" style={{ marginBottom: 10 }}>
                    Not linked to a customer yet. Converting creates the account (or attaches to an existing
                    one with the same name) so you can quote and invoice.
                  </p>
                  <form action={convertLead}>
                    <input type="hidden" name="id" value={lead.id} />
                    <button className="btn btn--convert btn--block" type="submit">Convert to account</button>
                  </form>
                </>
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-head"><h2>Edit details</h2></div>
            <div className="card-body">
              <form action={saveLead}>
                <input type="hidden" name="id" value={lead.id} />
                <input type="hidden" name="status" value={lead.status} />
                <div className="field">
                  <label className="field-label" htmlFor="name">Name</label>
                  <input id="name" name="name" required defaultValue={lead.name} />
                </div>
                <div className="field">
                  <label className="field-label" htmlFor="company">Company</label>
                  <input id="company" name="company" defaultValue={lead.company} />
                </div>
                <div className="row" style={{ marginBottom: 12 }}>
                  <div className="field">
                    <label className="field-label" htmlFor="phone">Phone</label>
                    <input id="phone" name="phone" defaultValue={lead.phone} />
                  </div>
                  <div className="field">
                    <label className="field-label" htmlFor="email">Email</label>
                    <input id="email" name="email" type="email" defaultValue={lead.email} />
                  </div>
                </div>
                <div className="row" style={{ marginBottom: 12 }}>
                  <div className="field">
                    <label className="field-label" htmlFor="roomType">Room type</label>
                    <select id="roomType" name="roomType" defaultValue={lead.roomType}>
                      <option value="">—</option>
                      {ROOMS.map((r) => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                  <div className="field field--sm">
                    <label className="field-label" htmlFor="roomQty">Rooms</label>
                    <input id="roomQty" name="roomQty" type="number" min="1" defaultValue={lead.roomQty} />
                  </div>
                </div>
                <div className="row" style={{ marginBottom: 12 }}>
                  <div className="field">
                    <label className="field-label" htmlFor="metro">Metro</label>
                    <input id="metro" name="metro" defaultValue={lead.metro} />
                  </div>
                  <div className="field">
                    <label className="field-label" htmlFor="source">Source</label>
                    <select id="source" name="source" defaultValue={lead.source}>
                      {SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
                <div className="field">
                  <label className="field-label" htmlFor="notes">Notes</label>
                  <textarea id="notes" name="notes" defaultValue={lead.notes} />
                </div>
                <button className="btn btn--block" type="submit">Save details</button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
