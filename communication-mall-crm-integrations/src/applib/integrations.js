/**
 * Catalog of platforms you can connect. This is just UI convenience — it
 * prefills the base URL and the kind of credential a platform expects. You can
 * always pick "Custom platform" and type your own values, so *any* platform
 * with an API can be connected.
 *
 * authType meanings:
 *   api_key  — a single API key sent as a header (X-API-Key or Authorization)
 *   bearer   — a token sent as "Authorization: Bearer <token>"
 *   basic    — a username + secret sent as HTTP Basic auth
 *   none     — no auth needed for the test call (e.g. a plain webhook URL)
 */
export const PROVIDERS = [
  { slug: 'quickbooks', name: 'QuickBooks Online', authType: 'bearer', baseUrl: 'https://quickbooks.api.intuit.com', hint: 'Accounting — sync customers & invoices.' },
  { slug: 'stripe', name: 'Stripe', authType: 'bearer', baseUrl: 'https://api.stripe.com/v1', hint: 'Payments — use your secret API key.' },
  { slug: 'hubspot', name: 'HubSpot', authType: 'bearer', baseUrl: 'https://api.hubapi.com', hint: 'CRM / marketing — private app token.' },
  { slug: 'twilio', name: 'Twilio', authType: 'basic', baseUrl: 'https://api.twilio.com', hint: 'SMS / voice — Account SID + Auth Token.' },
  { slug: 'ringcentral', name: 'RingCentral', authType: 'bearer', baseUrl: 'https://platform.ringcentral.com', hint: 'Business phone — OAuth token.' },
  { slug: 'mailchimp', name: 'Mailchimp', authType: 'api_key', baseUrl: 'https://us1.api.mailchimp.com/3.0', hint: 'Email marketing — API key.' },
  { slug: 'slack', name: 'Slack', authType: 'bearer', baseUrl: 'https://slack.com/api', hint: 'Team messaging — bot token.' },
  { slug: 'google', name: 'Google Workspace', authType: 'bearer', baseUrl: 'https://www.googleapis.com', hint: 'Calendar / Drive / Gmail — OAuth token.' },
  { slug: 'microsoft', name: 'Microsoft 365', authType: 'bearer', baseUrl: 'https://graph.microsoft.com/v1.0', hint: 'Outlook / Teams — Graph token.' },
  { slug: 'zapier', name: 'Zapier / Webhook', authType: 'none', baseUrl: '', hint: 'Automation — paste your webhook URL as the base URL.' },
  { slug: 'custom', name: 'Custom platform', authType: 'api_key', baseUrl: '', hint: 'Any other service with an API.' },
];

export function providerBySlug(slug) {
  return PROVIDERS.find((p) => p.slug === slug) || PROVIDERS.find((p) => p.slug === 'custom');
}

export const AUTH_TYPES = [
  { value: 'api_key', label: 'API key (header)' },
  { value: 'bearer', label: 'Bearer token' },
  { value: 'basic', label: 'Username + secret (Basic)' },
  { value: 'none', label: 'No authentication' },
];

export function authTypeLabel(value) {
  return (AUTH_TYPES.find((a) => a.value === value) || {}).label || value;
}
