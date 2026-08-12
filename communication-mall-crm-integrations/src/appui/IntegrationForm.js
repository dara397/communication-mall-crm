'use client';

import { useState } from 'react';
import { PROVIDERS, AUTH_TYPES, providerBySlug } from '@/applib/integrations';

/**
 * Add / edit form for a connected platform. Picking a platform from the list
 * prefills its API URL and the kind of credential it expects; you can still
 * override anything or choose "Custom platform".
 */
export default function IntegrationForm({ action, initial }) {
  const editing = Boolean(initial?.id);
  const [provider, setProvider] = useState(initial?.provider || 'quickbooks');
  const [authType, setAuthType] = useState(
    initial?.authType || providerBySlug(initial?.provider || 'quickbooks').authType
  );
  const [baseUrl, setBaseUrl] = useState(initial?.baseUrl ?? '');
  const [name, setName] = useState(initial?.name ?? '');

  function onProviderChange(slug) {
    setProvider(slug);
    const preset = providerBySlug(slug);
    // Only auto-fill when the fields are empty / not being actively edited,
    // so we don't clobber what someone typed.
    if (preset.authType) setAuthType(preset.authType);
    if (preset.baseUrl && (!baseUrl || PROVIDERS.some((p) => p.baseUrl === baseUrl))) {
      setBaseUrl(preset.baseUrl);
    }
    if (!name && preset.slug !== 'custom') setName(preset.name);
  }

  const preset = providerBySlug(provider);
  const needsKey = authType !== 'none';
  const needsSecret = authType === 'basic' || provider === 'stripe' || provider === 'twilio' || authType === 'api_key';

  return (
    <form action={action}>
      {editing ? <input type="hidden" name="id" value={initial.id} /> : null}

      <div className="field">
        <label className="field-label" htmlFor="provider">Platform</label>
        <select
          id="provider"
          name="provider"
          value={provider}
          onChange={(e) => onProviderChange(e.target.value)}
        >
          {PROVIDERS.map((p) => (
            <option key={p.slug} value={p.slug}>{p.name}</option>
          ))}
        </select>
        {preset?.hint ? <div className="note">{preset.hint}</div> : null}
      </div>

      <div className="field">
        <label className="field-label" htmlFor="name">Connection name</label>
        <input
          id="name"
          name="name"
          required
          placeholder="e.g. QuickBooks — main account"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div className="row" style={{ marginBottom: 12 }}>
        <div className="field">
          <label className="field-label" htmlFor="authType">Authentication</label>
          <select
            id="authType"
            name="authType"
            value={authType}
            onChange={(e) => setAuthType(e.target.value)}
          >
            {AUTH_TYPES.map((a) => (
              <option key={a.value} value={a.value}>{a.label}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label className="field-label" htmlFor="baseUrl">API base URL</label>
          <input
            id="baseUrl"
            name="baseUrl"
            placeholder="https://api.example.com"
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
          />
        </div>
      </div>

      {authType === 'basic' ? (
        <div className="field">
          <label className="field-label" htmlFor="username">Username / account ID</label>
          <input
            id="username"
            name="username"
            placeholder="Account SID, username, etc."
            defaultValue={initial?.username ?? ''}
          />
        </div>
      ) : null}

      {needsKey ? (
        <div className="field">
          <label className="field-label" htmlFor="apiKey">
            {authType === 'basic' ? 'Password / auth token' : 'API key / token'}
          </label>
          <input
            id="apiKey"
            name="apiKey"
            type="password"
            autoComplete="off"
            placeholder={
              editing && initial?.hasKey
                ? `Saved: ${initial.apiKeyMask} — leave blank to keep`
                : 'Paste the key from the platform'
            }
          />
        </div>
      ) : null}

      {needsSecret && authType !== 'basic' ? (
        <div className="field">
          <label className="field-label" htmlFor="apiSecret">Secondary secret (optional)</label>
          <input
            id="apiSecret"
            name="apiSecret"
            type="password"
            autoComplete="off"
            placeholder={
              editing && initial?.hasSecret
                ? `Saved: ${initial.apiSecretMask} — leave blank to keep`
                : 'Client secret / signing key, if any'
            }
          />
        </div>
      ) : null}

      <div className="field">
        <label className="field-label" htmlFor="notes">Notes</label>
        <textarea
          id="notes"
          name="notes"
          placeholder="What this connection is for, whose account it uses, etc."
          defaultValue={initial?.notes ?? ''}
        />
      </div>

      <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, cursor: 'pointer' }}>
        <input type="checkbox" name="active" defaultChecked={initial ? initial.active : true} />
        <span className="note" style={{ margin: 0 }}>Active — this connection is in use</span>
      </label>

      <button className="btn btn--primary btn--block" type="submit">
        {editing ? 'Save changes' : 'Connect platform'}
      </button>
    </form>
  );
}
