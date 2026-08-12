import crypto from 'crypto';

/**
 * Secret storage for integration credentials.
 *
 * API keys are encrypted at rest with AES-256-GCM. The encryption key is
 * derived from an environment secret so the raw keys are never readable in
 * the database. We reuse AUTH_SECRET / NEXTAUTH_SECRET (which every deploy of
 * this app already sets for sign-in) so encryption works out of the box; you
 * can override it with CRM_SECRET_KEY if you want a dedicated key.
 *
 * If no secret is configured at all (e.g. a bare local run), we fall back to
 * a clearly-marked, un-encrypted format so the app still works — but in that
 * case the values are only obfuscated, not secured. Set AUTH_SECRET in
 * production and this is never used.
 */

const ENC_PREFIX = 'enc:v1:';
const PLAIN_PREFIX = 'plain:v1:';

function secretMaterial() {
  return (
    process.env.CRM_SECRET_KEY ||
    process.env.AUTH_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    ''
  );
}

function keyFromEnv() {
  const material = secretMaterial();
  if (!material) return null;
  // 32-byte key derived from whatever secret is available.
  return crypto.createHash('sha256').update(String(material)).digest();
}

/** True when real encryption is active (an env secret is present). */
export function encryptionActive() {
  return Boolean(secretMaterial());
}

/** Encrypt a plaintext secret for storage. Empty input stays empty. */
export function encryptSecret(plain) {
  const value = plain == null ? '' : String(plain);
  if (!value) return '';

  const key = keyFromEnv();
  if (!key) {
    // No secret configured — store obfuscated (base64) and mark it.
    return PLAIN_PREFIX + Buffer.from(value, 'utf8').toString('base64');
  }

  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const enc = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return (
    ENC_PREFIX +
    [iv.toString('base64'), tag.toString('base64'), enc.toString('base64')].join(':')
  );
}

/** Decrypt a stored secret back to plaintext. Returns '' on any problem. */
export function decryptSecret(stored) {
  if (!stored) return '';
  const value = String(stored);

  if (value.startsWith(PLAIN_PREFIX)) {
    try {
      return Buffer.from(value.slice(PLAIN_PREFIX.length), 'base64').toString('utf8');
    } catch {
      return '';
    }
  }

  if (value.startsWith(ENC_PREFIX)) {
    const key = keyFromEnv();
    if (!key) return '';
    try {
      const [ivB64, tagB64, dataB64] = value.slice(ENC_PREFIX.length).split(':');
      const iv = Buffer.from(ivB64, 'base64');
      const tag = Buffer.from(tagB64, 'base64');
      const data = Buffer.from(dataB64, 'base64');
      const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
      decipher.setAuthTag(tag);
      return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
    } catch {
      return '';
    }
  }

  // Legacy / unknown format — treat the stored string as plaintext.
  return value;
}

/**
 * Mask a secret for display: show only the last few characters so a person
 * can recognise which key it is without exposing it. Never returns the whole
 * value.
 */
export function maskSecret(plain) {
  const value = plain == null ? '' : String(plain);
  if (!value) return '';
  const tail = value.slice(-4);
  return '••••••••' + tail;
}
