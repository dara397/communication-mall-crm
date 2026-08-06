import { getInstalled, getCustomers } from '@/applib/db';
import { day, today } from '@/applib/format';
import { saveInstalled, deleteInstalled } from '@/applib/actions';

export const dynamic = 'force-dynamic';

// Warranty within 90 days (or past) gets flagged for a renewal conversation.
function warrantyTone(end) {
  if (!end) return undefined;
  const days = (new Date(end + 'T12:00:00') - new Date(today() + 'T12:00:00')) / 864e5;
  if (days < 0) return 'alert';
  if (days <= 90) return 'copper';
  return undefined;
}

export default async function InstalledPage() {
  const [items, customers] = await Promise.all([getInstalled(), getCustomers()]);

  return (
    <>
      <div className="page-head">
        <div>
          <div className="eyebrow">Records</div>
          <h1>Installed base</h1>
          <p className="sub">Equipment deployed at each site — for service, warranty renewals, and upsell.</p>
        </div>
      </div>

      <div className="split">
        <div className="card">
          <div className="card-head">
            <h2>{items.length} units on file</h2>
          </div>
          {items.length === 0 ? (
            <div className="empty">
              <strong>Nothing logged yet</strong>
              Add a unit on the right after each install.
            </div>
          ) : (
            <div className="card-body card-body--tight">
              <table>
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Product</th>
                    <th>Room</th>
                    <th className="num">Qty</th>
                    <th>Installed</th>
                    <th>Warranty ends</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((i) => (
                    <tr key={i.id}>
                      <td className="strong">{i.customer?.name}</td>
                      <td>
                        {i.product}
                        {i.sku ? <div className="note">{i.sku}</div> : null}
                        {i.serial ? <div className="note">S/N {i.serial}</div> : null}
                      </td>
                      <td className="muted">{i.room || '—'}</td>
                      <td className="num">{i.quantity}</td>
                      <td className="muted">{day(i.installedDate)}</td>
                      <td>
                        {i.warrantyEnd ? (
                          <span className="chip" data-tone={warrantyTone(i.warrantyEnd)}>{day(i.warrantyEnd)}</span>
                        ) : (
                          <span className="muted">—</span>
                        )}
                      </td>
                      <td className="num">
                        <form action={deleteInstalled} className="inline-form">
                          <input type="hidden" name="id" value={i.id} />
                          <button className="btn btn--ghost btn--sm" type="submit">Remove</button>
                        </form>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-head">
            <h2>Log a unit</h2>
          </div>
          <div className="card-body">
            <form action={saveInstalled}>
              <div className="field">
                <label className="field-label" htmlFor="customerId">Customer</label>
                <select id="customerId" name="customerId" required defaultValue="">
                  <option value="" disabled>Select a customer…</option>
                  {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="field">
                <label className="field-label" htmlFor="product">Product</label>
                <input id="product" name="product" required placeholder="MAXHUB XBoard V7 65&quot;" />
              </div>
              <div className="row" style={{ marginBottom: 12 }}>
                <div className="field">
                  <label className="field-label" htmlFor="sku">SKU / model</label>
                  <input id="sku" name="sku" placeholder="V6550" />
                </div>
                <div className="field field--sm">
                  <label className="field-label" htmlFor="quantity">Qty</label>
                  <input id="quantity" name="quantity" type="number" min="1" defaultValue="1" />
                </div>
              </div>
              <div className="row" style={{ marginBottom: 12 }}>
                <div className="field">
                  <label className="field-label" htmlFor="room">Room / location</label>
                  <input id="room" name="room" placeholder="Main boardroom" />
                </div>
                <div className="field">
                  <label className="field-label" htmlFor="serial">Serial #</label>
                  <input id="serial" name="serial" placeholder="Optional" />
                </div>
              </div>
              <div className="row" style={{ marginBottom: 12 }}>
                <div className="field">
                  <label className="field-label" htmlFor="installedDate">Installed</label>
                  <input id="installedDate" name="installedDate" type="date" />
                </div>
                <div className="field">
                  <label className="field-label" htmlFor="warrantyEnd">Warranty ends</label>
                  <input id="warrantyEnd" name="warrantyEnd" type="date" />
                </div>
              </div>
              <div className="field">
                <label className="field-label" htmlFor="notes">Notes</label>
                <textarea id="notes" name="notes" placeholder="Mount type, firmware, service history." />
              </div>
              <button className="btn btn--primary btn--block" type="submit">Save unit</button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
