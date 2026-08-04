import { PageHeader } from "../../../crmui/ui";
import { emailConfigured } from "../../../crmlib/email";
import { company } from "../../../crmlib/config";
import { getSession } from "../../../crmlib/auth";
import EmailTest from "./EmailTest";

export const dynamic = "force-dynamic";

export default async function DiagnosticsPage() {
  const session = await getSession();
  const configured = emailConfigured();
  const from = process.env.EMAIL_FROM || "(not set)";
  const hasDbUrl = Boolean(process.env.DATABASE_URL);
  const hasSecret = Boolean(process.env.NEXTAUTH_SECRET);

  return (
    <>
      <PageHeader
        title="Diagnostics"
        subtitle="Check that email and environment are configured correctly."
      />

      <div className="space-y-6">
        <section className="card p-6">
          <h2 className="mb-4 text-sm font-semibold text-slate-700">Environment</h2>
          <ul className="space-y-2 text-sm">
            <Check ok={hasDbUrl} label="DATABASE_URL is set" />
            <Check ok={hasSecret} label="NEXTAUTH_SECRET is set" />
            <Check ok={Boolean(process.env.RESEND_API_KEY)} label="RESEND_API_KEY is set" />
            <Check ok={Boolean(process.env.EMAIL_FROM)} label={`EMAIL_FROM is set (${from})`} />
          </ul>
        </section>

        <section className="card p-6">
          <h2 className="mb-2 text-sm font-semibold text-slate-700">Email send test</h2>
          {configured ? (
            <>
              <p className="mb-4 text-sm text-slate-500">
                Sends a plain test email through Resend using{" "}
                <code>{from}</code> as the sender. If it fails, the exact Resend error
                is shown below — the most common cause is that the sender domain isn&apos;t
                verified in Resend.
              </p>
              <EmailTest defaultTo={session?.user.email || ""} />
            </>
          ) : (
            <div className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Email is not configured. Set <code>RESEND_API_KEY</code> and{" "}
              <code>EMAIL_FROM</code> in your environment variables, then redeploy.
            </div>
          )}
        </section>

        <section className="card p-6 text-sm text-slate-500">
          <h2 className="mb-2 text-sm font-semibold text-slate-700">Notes for {company.name}</h2>
          <p>
            Quotes and invoices are attached as PDFs when emailed. The sender address&apos;s
            domain must be verified in your Resend account, otherwise Resend rejects the
            message. Use this page to confirm delivery before sending to customers.
          </p>
        </section>
      </div>
    </>
  );
}

function Check({ ok, label }: { ok: boolean; label: string }) {
  return (
    <li className="flex items-center gap-2">
      <span
        className={`flex h-5 w-5 items-center justify-center rounded-full text-xs text-white ${
          ok ? "bg-green-500" : "bg-slate-300"
        }`}
      >
        {ok ? "✓" : "—"}
      </span>
      <span className={ok ? "text-slate-700" : "text-slate-400"}>{label}</span>
    </li>
  );
}
