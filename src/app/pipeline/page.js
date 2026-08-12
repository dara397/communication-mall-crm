import Link from 'next/link';
import { getLeads, getLeadMetrics, LEAD_STAGES } from '@/applib/db';
import { money, day } from '@/applib/format';

export const dynamic = 'force-dynamic';

const BLURB = {
  New: 'Fresh — needs a first touch',
  Qualified: 'Real fit, worth pursuing',
  'Site walk': 'Scoping the rooms',
  Quoted: 'Options priced & sent',
  Won: 'Closed — convert to order',
  Lost: 'Closed — no sale',
};

export default async function PipelinePage() {
  const [leads, m] = await Promise.all([getLeads(), getLeadMetrics()]);
  const byStage = (s) => leads.filter((l) => l.status === s);

  return (
    <>
      <div className="page-head">
        <div>
          <div className="eyebrow">Sales</div>
          <h1>Pipeline</h1>
          <p className="sub">Every lead by stage. Open one to move it along — status is a dropdown, not a drag.</p>
        </div>
      </div>

      <div className="grid-4" style={{ marginBottom: 24 }}>
        <div className="stat">
          <div className="stat-label">Weighted pipeline</div>
          <div className="stat-value">{money(m.weighted)}</div>
          <div className="stat-foot">{money(m.openValue)} open · {m.openLeads} leads</div>
        </div>
        <div className="stat">
          <div className="stat-label">Quoted</div>
          <div className="stat-value">{money(m.quotedValue)}</div>
          <div className="stat-foot">Out for decision</div>
        </div>
        <div className="stat">
          <div className="stat-label">Win rate</div>
          <div className="stat-value">{m.winRate === null ? '—' : `${m.winRate}%`}</div>
          <div className="stat-foot">Won vs. closed</div>
        </div>
        <div className="stat">
          <div className="stat-label">Won value</div>
          <div className="stat-value">{money(m.wonValue)}</div>
          <div className="stat-foot">Closed-won to date</div>
        </div>
      </div>

      <div className="board" style={{ gridTemplateColumns: 'repeat(6, 1fr)' }}>
        {LEAD_STAGES.map((stage) => {
          const list = byStage(stage);
          const value = list.reduce((s, l) => s + l.estimatedValue, 0);
          return (
            <div className="board-col" key={stage}>
              <div className="board-col-head">
                <span className="board-col-title">{stage}</span>
                <span className="nav-count">{list.length}</span>
              </div>
              <div className="board-col-blurb">{BLURB[stage]}{value ? ` · ${money(value)}` : ''}</div>
              {list.length === 0 ? (
                <div className="board-empty">—</div>
              ) : (
                list.map((l) => (
                  <Link href={`/leads/${l.id}`} className="board-card" key={l.id}>
                    <div className="board-card-title">{l.name}</div>
                    <div className="board-card-meta">
                      {l.company || 'No company'}{l.roomQty > 1 ? ` · ${l.roomQty} rooms` : ''}
                    </div>
                    <div className="board-card-foot">
                      <span>{day(l.receivedAt.toISOString().slice(0, 10))}</span>
                      <span className="strong">{l.estimatedValue ? money(l.estimatedValue) : '—'}</span>
                    </div>
                  </Link>
                ))
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
