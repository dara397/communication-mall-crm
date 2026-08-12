import { Fragment } from 'react';
import { getCatalog } from '@/applib/db';
import { money } from '@/applib/format';
import { auth } from '@/auth';

export const dynamic = 'force-dynamic';

const margin = (cost, sell) =>
  sell > 0 && cost > 0 ? Math.round(((sell - cost) / sell) * 1000) / 10 : null;

export default async function CatalogPage() {
  const session = await auth();
  const isAdmin = session?.user?.role === 'admin';
  const items = await getCatalog();

  const groups = items.reduce((acc, it) => {
    (acc[it.category] ||= []).push(it);
    return acc;
  }, {});

  // admin-only totals
  const withCost = items.filter((i) => i.cost > 0 && i.nrc > 0);
  const avgMargin =
    isAdmin && withCost.length
      ? Math.round(
          (withCost.reduce((s, i) => s + (i.nrc - i.cost) / i.nrc, 0) / withCost.length) * 1000
        ) / 10
      : null;

  // column count changes when admin sees cost/margin
  const cols = isAdmin ? 6 : 4;

  return (
    <>
      <div className="page-head">
        <div>
          <div className="eyebrow">Records</div>
          <h1>Products &amp; services</h1>
          <p className="sub">
            Your price book. MRC is billed monthly; NRC is a one-time setup charge.
            {isAdmin ? ' Dealer cost and margin are shown to admins only and never appear on customer quotes.' : ''}
          </p>
        </div>
        <div className="stat" style={{ minWidth: 150 }}>
          <div className="stat-label">Catalog items</div>
          <div className="stat-value">{items.length}</div>
          {avgMargin !== null ? (
            <div className="stat-foot">Avg margin {avgMargin}%</div>
          ) : null}
        </div>
      </div>

      <div className="card">
        <div className="card-body card-body--tight">
          <table>
            <thead>
              <tr>
                <th>Code</th>
                <th>Product</th>
                {isAdmin ? <th className="num">Dealer cost</th> : null}
                <th className="num">Monthly (MRC)</th>
                <th className="num">Setup / Sell (NRC)</th>
                {isAdmin ? <th className="num">Margin</th> : null}
              </tr>
            </thead>
            <tbody>
              {Object.entries(groups).map(([category, rows]) => (
                <Fragment key={category}>
                  <tr style={{ background: '#fafbfa' }}>
                    <td colSpan={cols}>
                      <span className="eyebrow">{category} · {rows.length}</span>
                    </td>
                  </tr>
                  {rows.map((it) => {
                    const m = margin(it.cost, it.nrc);
                    return (
                      <tr key={it.id}>
                        <td className="doc-no muted">{it.usoc}</td>
                        <td>
                          <div className="strong">{it.name}</div>
                          {it.description ? (
                            <div className="note" style={{ maxWidth: 560 }}>
                              {it.description.length > 160
                                ? it.description.slice(0, 160) + '…'
                                : it.description}
                            </div>
                          ) : null}
                        </td>
                        {isAdmin ? (
                          <td className="num muted">
                            {it.cost > 0 ? money(it.cost) : '—'}
                          </td>
                        ) : null}
                        <td className="num">
                          {it.mrc > 0 ? (
                            <span className="strong">{money(it.mrc)}<span className="note">/mo</span></span>
                          ) : (
                            <span className="muted">—</span>
                          )}
                        </td>
                        <td className="num">
                          {it.nrc > 0 ? money(it.nrc) : <span className="muted">—</span>}
                        </td>
                        {isAdmin ? (
                          <td className="num">
                            {m !== null ? (
                              <span className={m < 20 ? 'stock-low' : 'strong'} style={m >= 20 ? { color: 'var(--signal)' } : undefined}>
                                {m}%
                              </span>
                            ) : (
                              <span className="muted">—</span>
                            )}
                          </td>
                        ) : null}
                      </tr>
                    );
                  })}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
