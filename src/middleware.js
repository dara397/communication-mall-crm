import NextAuth from 'next-auth';
import { authConfig } from '@/auth.config';

export default NextAuth(authConfig).auth;

export const config = {
  // Everything except the auth endpoints, the sign-in page, and static assets.
  // The trailing extension group lets files in /public (e.g. the logo shown on
  // the sign-in page) load without being redirected to /sign-in when signed out.
  matcher: [
    '/((?!api/auth|sign-in|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico)).*)',
  ],
};
