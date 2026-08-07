import './globals.css';
import Nav from '@/appui/Nav';
import { auth, signOut } from '@/auth';
import { getCompany, getNavCounts } from '@/applib/db';

export const metadata = {
  title: 'Tele Express Business Systems',
  description: 'Quotes, service orders, invoices, and equipment inventory.',
};

export const dynamic = 'force-dynamic';

export default async function RootLayout({ children }) {
  const session = await auth();

  if (!session?.user) {
    return (
      <html lang="en">
        <body>{children}</body>
      </html>
    );
  }

  const [company, counts] = await Promise.all([getCompany(), getNavCounts()]);

  async function endSession() {
    'use server';
    await signOut({ redirectTo: '/sign-in' });
  }

  return (
    <html lang="en">
      <body>
        <div className="shell">
          <Nav
            counts={counts}
            company={company}
            user={session.user}
            signOutAction={endSession}
          />
          <main className="main">{children}</main>
        </div>
      </body>
    </html>
  );
}
