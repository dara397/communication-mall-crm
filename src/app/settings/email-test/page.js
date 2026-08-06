import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { getCompany } from '@/applib/db';
import { emailConfigured, sendDocumentEmail } from '@/applib/email';

export const dynamic = 'force-dynamic';

async function runTest(formData) {
  'use server';
  const session = await auth();
  if (session?.user?.role !== 'admin') redirect('/');

  const to = String(formData.get('to') || '').trim();
  const result = await sendDocumentEmail({
    to,
    subject: 'Communication Mall CRM — test email',
    html: '<p>This is a test from your CRM. If you received it, email is working.</p>',
  });

  const q = result.ok
    ? 'result=ok'
    : `result=fail&why=${encodeURIComponent(result.error || 'Unknown error')}`;
  redirect(`/settings/email-test?${q}&to=${encodeURIComponent(to)}`);
}

export default async function EmailTestPage({ searchParams }) {
  const session = await auth();
  if (session?.user?.role !== 'admin') redirect('/');

  const company = await getCompany();
  const configured = emailConfigured();
  const from = process.env.EMAIL_FROM?.trim() || 'onboarding@resend.dev';
  const result = searchParams?.result;
  const why = searchParams?.why;
  const lastTo = searchParams?.to || session.user.email || '';

  return (
    <>
      <div className="page-head">
        <div>
          <div className="eyebrow">
            <Link href="/settings" style={{ color: 'var(--ink-3)' }}>Settings</Link> ›
          </div>
          <h1>Email test</h1>
          <p className="sub">Sends one test email and tells you exactly what happens.</p>
        </div>
      </div>

      {/* checklist */}
      <div className="card">
        <div className="card-head"><h2>Checklist</h2></div>
        <div className="card-body">
          <div className="check-row">
            <span className={configured ? 'check-yes' : 'check-no'}>
              {configured ? '✓' : '✗'}
            </span>
            <div>
              <div className="strong">API key is loaded</div>
              <div className="note">
                {configured
                  ? 'The app can see a RESEND_API_KEY.'
                  : 'No key found. Your SETTINGS.txt is blank, OR you added the key but didn\u2019t re-run SETUP. Close the black window, run SETUP, then SHARE-ON-NETWORK.'}
              </div>
            </div>
          </div>

          <div className="check-row">
            <span className="check-info">i</span>
            <div>
              <div className="strong">Sending from: {from}</div>
              <div className="note">
                A new Resend account can only send from onboarding@resend.dev, and only
                <em> to </em> the email you signed up with — until you verify your own
                domain (communicationmall.com) in Resend. Verifying the domain lifts both
                limits.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* the test */}
      <div className="card">
        <div className="card-head"><h2>Send a test</h2></div>
        <div className="card-body">
          {result === 'ok' ? (
            <div className="banner banner--ok">
              Sent. Check the inbox for {lastTo} (and the spam folder). If it arrived, email
              works — the buttons on quotes and invoices will too.
            </div>
          ) : null}
          {result === 'fail' ? (
            <div className="banner banner--bad">{why}</div>
          ) : null}

          <form action={runTest}>
            <div className="row">
              <div className="field">
                <label className="field-label" htmlFor="to">Send test to</label>
                <input id="to" name="to" type="email" defaultValue={lastTo} required />
              </div>
              <button className="btn btn--primary" type="submit" disabled={!configured}>
                Send test email
              </button>
            </div>
            {!configured ? (
              <p className="note" style={{ marginTop: 10 }}>
                Fix the API key first (see the checklist above), then this button turns on.
              </p>
            ) : (
              <p className="note" style={{ marginTop: 10 }}>
                Tip: for your very first test, send it to the email you used to sign up for
                Resend. That always works, and proves the key is good.
              </p>
            )}
          </form>
        </div>
      </div>
    </>
  );
}
