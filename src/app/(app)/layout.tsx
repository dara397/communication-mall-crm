import { redirect } from "next/navigation";
import { getSession } from "../../crmlib/auth";
import Sidebar from "../../crmui/Sidebar";
import { company } from "../../crmlib/config";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar userName={session.user?.name} logoUrl={company.logoUrl} />
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-6xl px-6 py-8">{children}</div>
      </main>
    </div>
  );
}
