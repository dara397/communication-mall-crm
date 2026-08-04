import Link from "next/link";
import { prisma } from "../../../crmlib/prisma";
import { getSession } from "../../../crmlib/auth";
import { PageHeader } from "../../../crmui/ui";
import DeleteButton from "../../../crmui/DeleteButton";
import { company, defaultTaxRate } from "../../../crmlib/config";
import { shortDate } from "../../../crmlib/format";
import { createUser, deleteUser } from "./actions";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await getSession();
  const isAdmin = session?.user.role === "ADMIN";
  const users = await prisma.user.findMany({ orderBy: { createdAt: "asc" } });

  return (
    <>
      <PageHeader title="Settings" subtitle="Company details, users, and diagnostics." />

      <div className="space-y-6">
        <section className="card p-6">
          <h2 className="mb-4 text-sm font-semibold text-slate-700">Company details</h2>
          <p className="mb-4 text-sm text-slate-500">
            These appear on quotes, invoices, and PDFs. Change them by editing the
            environment variables (<code>COMPANY_NAME</code>, <code>COMPANY_ADDRESS</code>,{" "}
            <code>COMPANY_PHONE</code>, <code>COMPANY_EMAIL</code>, <code>DEFAULT_TAX_RATE</code>){" "}
            in Vercel or your <code>.env</code> file.
          </p>
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <Field label="Company name" value={company.name} />
            <Field label="Phone" value={company.phone} />
            <Field label="Address" value={company.address} />
            <Field label="Email" value={company.email} />
            <Field label="Default tax rate" value={`${(defaultTaxRate * 100).toFixed(3)}%`} />
          </dl>
        </section>

        <section className="card p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-700">Users</h2>
            <Link href="/diagnostics" className="text-sm font-medium text-brand-700 hover:underline">
              Email diagnostics →
            </Link>
          </div>

          <div className="overflow-hidden rounded-lg border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="th">Name</th>
                  <th className="th">Email</th>
                  <th className="th">Role</th>
                  <th className="th">Added</th>
                  <th className="th"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => (
                  <tr key={u.id}>
                    <td className="td font-medium">{u.name}</td>
                    <td className="td">{u.email}</td>
                    <td className="td">
                      <span className="badge bg-slate-100 text-slate-600">{u.role}</span>
                    </td>
                    <td className="td text-slate-500">{shortDate(u.createdAt)}</td>
                    <td className="td text-right">
                      {isAdmin && u.id !== session?.user.id && (
                        <DeleteButton
                          action={deleteUser.bind(null, u.id)}
                          label="Remove"
                          className="btn-ghost h-8 py-1 text-red-600"
                          confirmText={`Remove ${u.name}?`}
                        />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {isAdmin ? (
            <form action={createUser} className="mt-5 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label">Name</label>
                <input name="name" className="input" required />
              </div>
              <div>
                <label className="label">Email</label>
                <input name="email" type="email" className="input" required />
              </div>
              <div>
                <label className="label">Temporary password</label>
                <input name="password" type="text" className="input" minLength={6} required />
              </div>
              <div>
                <label className="label">Role</label>
                <select name="role" className="input" defaultValue="STAFF">
                  <option value="STAFF">Staff</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <button type="submit" className="btn-primary">
                  Add user
                </button>
              </div>
            </form>
          ) : (
            <p className="mt-4 text-sm text-slate-400">
              Only administrators can add or remove users.
            </p>
          )}
        </section>
      </div>
    </>
  );
}

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <dt className="text-slate-400">{label}</dt>
      <dd className="text-slate-700">{value || "—"}</dd>
    </div>
  );
}
