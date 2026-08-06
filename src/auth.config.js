/**
 * Edge-safe half of the auth config. No database, no bcrypt — the middleware
 * bundle can't carry either. The middleware only asks: is there a session?
 */
export const authConfig = {
  pages: { signIn: '/sign-in' },
  session: { strategy: 'jwt', maxAge: 60 * 60 * 12 },
  providers: [],
  callbacks: {
    authorized({ auth }) {
      return Boolean(auth?.user);
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.name = user.name;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
      }
      return session;
    },
  },
};
