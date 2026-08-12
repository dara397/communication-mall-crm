import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { getIntegrations, getIntegration } from '@/applib/db';
import { authTypeLabel, providerBySlug } from '@/applib/integrations';
import { encryptionActive } from '@/applib/secrets';
import IntegrationForm from '@/appui/IntegrationForm';
import {
  saveIntegration,
  deleteIntegration,
  testIntegration,
  toggleIntegration,
} from '@/applib/actions';

export const dynamic = 'force-dynamic';

const flashBase = {
  padding: '10px 14px',
  borderRadius: 8,
  marginBottom: 16,
  fontSize: 14,
  border: '1px solid',
};

function whenTested(dt) {
  if (!dt) return null;
  return new Date(dt).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function statusTone(i) {
  if (!i.active) return undefined;
  if (i.lastTestOk === true) return 'signal';
  if (i.lastTestOk === false) return 'alert';
  return 'copper';
}

function statusLabel(i) {
  if (!i.active) return 'Disabled';
  if (i.lastTestOk === true) return 'Connected';
  if (i.lastTestOk === false) return 'Attention';
  return 'Not tested';
}

export default async function IntegrationsPage({ searchParams }) {
  const session = await auth();
  if (session?.user?.role !== 'admin') redirect('/');

  const integrations = await getIntegrations();
  const editId = typeof searchParams?.edit === 'string' ? searchParams.edit : null;
  const editing = editId ? await getIntegration(editId) : null;

  const ok = typeof searchParams?.ok === 'string' ? searchParams.ok : null;
  const err = typeof searchParams?.err === 'string' ? searchParams.err : null;
  const secure = encryptionActive();

  return (
    <>
      <div className="page-head">
        <div>
          <div className="eyebrow">Admin</div>
          <h1>Integrations</h1>
          <p className="sub">
            Connect outside platforms — accounting, payments, phone, marketing, or any service with
            an API — by storing their API keys here so the portal can talk to them.
          </p>
        </div>
      </div>

      {ok ? (
        <div style={{ ...flashBase, background: 'rgba(34,197,94,0.12)', borderColor: 'rgba(34,197,94,0.5)', color: '#166534' }}>
          {ok}
        </div>
      ) : null}
      {err ? (
        <div style={{ ...flashBase, background: 'rgba(239,68,68,0.10)', borderColor: 'rgba(239,68,68,0.5)', color: '#991b1b' }}>
          {err}
        </div>
      ) : null}

      <div className="split">
        <div className="card">
          <div className="card-head">
            <h2>{integrations.length} {integrations.length === 1 ? 'connection' : 'connections'}</h2>
            <span className="note">
              {secure ? 'Keys encrypted at rest' : 'Set AUTH_SECRET to encrypt keys'}
            </span>
          </div>

          {integrations.length === 0 ? (
            <div className="empty">
              <strong>No platforms connected yet</strong>
              Add one on the right — pick a platform, paste its API key, and test it.
            </div>
          ) : (
            <div className="card-body card-body--tight">
              <table>
                <thead>
                  <tr>
                    <th>Platform</th>
                    <th>Auth</th>
                    <th>Key</th>
                    <th>Status</th>
                    <th className="no-print"></th>
                  </tr>
                </thead>
                <tbody>
                  {integrations.map((i) => {
                    const prov = providerBySlug(i.provider);
                    const tested = whenTested(i.lastTestedAt);
                    return (
                      <tr key={i.id}>
                        <td>
                          <div className="strong">{i.name}</div>
                          <div className="note">{prov.name}{i.baseUrl ? ` · ${i.baseUrl}` : ''}</div>
                        </td>
                        <td className="muted">{authTypeLabel(i.authType)}</td>
                        <td className="muted">
                          {i.hasKey ? <code>{i.apiKeyMask}</code> : <span className="muted">—</span>}
                        </td>
                        <td>
                          <span className="chip" data-tone={statusTone(i)}>{statusLabel(i)}</span>
                          {i.lastTestMessage ? (
                            <div className="note" style={{ maxWidth: 220 }}>
                              {i.lastTestMessage}{tested ? ` · ${tested}` : ''}
                            </div>
                          ) : null}
                        </td>
                        <td className="no-print num" style={{ whiteSpace: 'nowrap' }}>
                          <form action={testIntegration} className="inline-form">
                            <input type="hidden" name="id" value={i.id} />
                            <button className="btn btn--sm" type="submit">Test</button>
                          </form>
                          <Link href={`/integrations?edit=${i.id}`} className="btn btn--sm">Edit</Link>
                          <form action={toggleIntegration} className="inline-form">
                            <input type="hidden" name="id" value={i.id} />
                            <button className="btn btn--ghost btn--sm" type="submit">
                              {i.active ? 'Disable' : 'Enable'}
                            </button>
                          </form>
                          <form action={deleteIntegration} className="inline-form">
                            <input type="hidden" name="id" value={i.id} />
                            <button className="btn btn--ghost btn--sm" type="submit">Remove</button>
                          </form>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <div className="card-body">
            <p className="note" style={{ margin: 0 }}>
              “Test” makes a quick call to the platform’s API URL with the saved key to confirm it
              can be reached. Reaching the platform but getting rejected usually means the key needs
              updating.
            </p>
          </div>
        </div>

        <div className="card" id="connect">
          <div className="card-head">
            <h2>{editing ? 'Edit connection' : 'Connect a platform'}</h2>
            {editing ? <Link href="/integrations" className="note">Cancel</Link> : null}
          </div>
          <div className="card-body">
            <IntegrationForm
              key={editing ? editing.id : 'new'}
              action={saveIntegration}
              initial={editing}
            />
            {!secure ? (
              <p className="note" style={{ marginTop: 12 }}>
                Heads up: no encryption secret is set, so keys are only obfuscated. On Vercel, set an
                <code> AUTH_SECRET</code> environment variable (you likely already have one for
                sign-in) and saved keys will be encrypted automatically.
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </>
  );
}
