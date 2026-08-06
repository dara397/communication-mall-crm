import Link from 'next/link';
import { getLeads } from '@/applib/db';
import { money, day } from '@/applib/format';
import { saveLead } from '@/applib/actions';

export const dynamic = 'force-dynamic';

const STATUSES = ['New', 'Qualified', 'Site walk', 'Quoted', 'Won', 'Lost'];
const SOURCES = ['Web', 'Assistant', 'Phone', 'Referral', 'Manual'];
const ROOMS = ['Boardroom', 'Huddle room', 'Training room', 'Lobby / waiting room', 'Mixed'];

const sourceTone = (s) => (s === 'Web' ? 'signal' : s === 'Assistant' ? 'copper' : undefined);
const statusTone = (s) =>
  s === 'Won' ? 'signal' : s === 'Lost' ? 'alert' : s === 'Quoted' ? 'copper' : undefined;

export default async function LeadsPage({ searchParams }) {
  const sp = await searchParams;
  const q = (sp?.q || '').toLowerCase();
  const status = sp?.status || '';

  let leads = await getLeads();
  if (status) leads = leads.filter((l) => l.status === status);
  if (q)
    leads = leads.filter((l) =>
      [l.name, l.company, l.email, l.metro].filter(Boolean).join(' ').toLowerCase().includes(q)
    );

  const open = leads.filter((l) => l.status !== 'Won' && l.status !== 'Lost');

  return (
    <>
      <div className="page-head">
        <div>
          <div className="eyebrow">Sales</div>
          <h1>Leads</h1>
          <p className="sub">Inbound opportunities. Click any lead to work it, move its stage, or convert it.</p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-body">
          <form method="get" className="row" style={{ alignItems: 'flex-end', gap: 12, marginBottom: 0 }}>
            <div className="field" style={{ marginBottom: 0, flex: 2 }}>
              <label className="field-label" htmlFor="q">Search</label>
              <input id="q" name="q" defaultValue={sp?.q || ''} placeholder="Name, company, email, metro" />
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              <label className="field-label" htmlFor="status">Status</label>
              <select id="status" name="status" defaultValue={status}>
                <option value="">All statuses</option>
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <button className="btn" type="submit">Filter</button>
            <Link href="/leads" className="btn btn--ghost">Reset</Link>
          </form>
        </div>
      </div>

      <div className="split">
        <div className="card">
          <div className="card-head">
            <h2>{open.length} open</h2>
            <span className="note">{leads.length} shown</span>
          </div>
          {leads.length === 0 ? (
            <div className="empty">
              <strong>No leads here</strong>
              Add one on the right, or clear the filter.
            </div>
          ) : (
            <div className="card-body card-body--tight">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Room</th>
                    <th>Metro</th>
                    <th>Source</th>
                    <th>Status</th>
                    <th className="num">Est. value</th>
                    <th>Received</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map((l) => (
                    <tr key={l.id}>
                      <td>
                        <Link href={`/leads/${l.id}`} className="strong">{l.name}</Link>
                        {l.company ? <div className="note">{l.company}</div> : null}
                      </td>
                      <td className="muted">
                        {l.roomType || '—'}{l.roomQty > 1 ? ` ×${l.roomQty}` : ''}
                      </td>
                      <td className="muted">{l.metro || '—'}</td>
                      <td><span className="chip" data-tone={sourceTone(l.source)}>{l.source}</span></td>
                      <td><span className="chip" data-tone={statusTone(l.status)}>{l.status}</span></td>
                      <td className="num">{l.estimatedValue ? money(l.estimatedValue) : '—'}</td>
                      <td className="muted">{day(l.receivedAt.toISOString().slice(0, 10))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-head"><h2>Add a lead</h2></div>
          <div className="card-body">
            <form action={saveLead}>
              <div className="field">
                <label className="field-label" htmlFor="name">Contact name</label>
                <input id="name" name="name" required placeholder="Raha Aghaei" />
              </div>
              <div className="field">
                <label className="field-label" htmlFor="company">Company</label>
                <input id="company" name="company" placeholder="Meqias Inc." />
              </div>
              <div className="row" style={{ marginBottom: 12 }}>
                <div className="field">
                  <label className="field-label" htmlFor="phone">Phone</label>
                  <input id="phone" name="phone" placeholder="(949) 555-0140" />
                </div>
                <div className="field">
                  <label className="field-label" htmlFor="email">Email</label>
                  <input id="email" name="email" type="email" placeholder="name@company.com" />
                </div>
              </div>
              <div className="row" style={{ marginBottom: 12 }}>
                <div className="field">
                  <label className="field-label" htmlFor="roomType">Room type</label>
                  <select id="roomType" name="roomType" defaultValue="">
                    <option value="">—</option>
                    {ROOMS.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div className="field field--sm">
                  <label className="field-label" htmlFor="roomQty">Rooms</label>
                  <input id="roomQty" name="roomQty" type="number" min="1" defaultValue="1" />
                </div>
              </div>
              <div className="row" style={{ marginBottom: 12 }}>
                <div className="field">
                  <label className="field-label" htmlFor="metro">Metro</label>
                  <input id="metro" name="metro" placeholder="Orange County" />
                </div>
                <div className="field">
                  <label className="field-label" htmlFor="source">Source</label>
                  <select id="source" name="source" defaultValue="Manual">
                    {SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div className="field">
                <label className="field-label" htmlFor="estimatedValue">Estimated value ($)</label>
                <input id="estimatedValue" name="estimatedValue" type="number" step="0.01" min="0" defaultValue="0" />
              </div>
              <div className="field">
                <label className="field-label" htmlFor="notes">Notes</label>
                <textarea id="notes" name="notes" placeholder="What they need, budget, timeline." />
              </div>
              <button className="btn btn--primary btn--block" type="submit">Save lead</button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
