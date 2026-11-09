import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';

const googleEnabled = Boolean(
  process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET,
);

export const authConfigured = googleEnabled;

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  secret: process.env.AUTH_SECRET || 'vedaix-local-development-secret',
  session: { strategy: 'jwt' },
  providers: googleEnabled
    ? [
        Google({
          clientId: process.env.AUTH_GOOGLE_ID,
          clientSecret: process.env.AUTH_GOOGLE_SECRET,
          allowDangerousEmailAccountLinking: false,
        }),
      ]
    : [],
  pages: {
    signIn: '/?auth=signin',
  },
});
