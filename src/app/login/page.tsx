import { Suspense } from "react";
import LoginForm from "./LoginForm";
import Logo from "../../crmui/Logo";
import { company } from "../../crmlib/config";

export const metadata = { title: "Sign in — Communication Mall CRM" };

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex justify-center">
            <Logo src={company.logoUrl} size={48} />
          </div>
          <h1 className="text-xl font-semibold text-slate-800">
            Communication Mall CRM
          </h1>
          <p className="mt-1 text-sm text-slate-500">Sign in to continue</p>
        </div>
        <Suspense fallback={<div className="card p-6 text-sm text-slate-400">Loading…</div>}>
          <LoginForm />
        </Suspense>
        <p className="mt-4 text-center text-xs text-slate-400">
          Communication Mall — internal use only
        </p>
      </div>
    </div>
  );
}
