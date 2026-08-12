import { redirect } from 'next/navigation';
import { AuthError } from 'next-auth';
import { signIn, auth } from '@/auth';

export const dynamic = 'force-dynamic';

export default async function SignInPage({ searchParams }) {
  const session = await auth();
  if (session?.user) redirect('/');

  const failed = searchParams?.error === 'credentials';

  async function authenticate(formData) {
    'use server';
    try {
      await signIn('credentials', {
        email: formData.get('email'),
        password: formData.get('password'),
        redirectTo: '/',
      });
    } catch (error) {
      if (error instanceof AuthError) redirect('/sign-in?error=credentials');
      throw error;
    }
  }

  return (
    <div className="signin">
      <div className="signin-card">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className="signin-logo"
          src="/telexpress-logo-blue.png"
          alt="Tele Express Business Systems"
        />
        <p className="sub" style={{ marginBottom: 24, textAlign: 'center' }}>
          Sign in to quotes, orders, and invoices.
        </p>

        <form action={authenticate}>
          <div className="field">
            <label className="field-label" htmlFor="email">Email</label>
            <input id="email" name="email" type="email" required autoComplete="username" />
          </div>
          <div className="field">
            <label className="field-label" htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
            />
          </div>
          {failed ? (
            <p className="signin-error">That email and password don&apos;t match an account.</p>
          ) : null}
          <button className="btn btn--primary btn--block" type="submit">
            Sign in
          </button>
        </form>
      </div>
    </div>
  );
}
