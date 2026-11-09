import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import Auth0 from 'next-auth/providers/auth0';

const googleId = process.env.AUTH_GOOGLE_ID || process.env.GOOGLE_CLIENT_ID;
const googleSecret =
  process.env.AUTH_GOOGLE_SECRET || process.env.GOOGLE_CLIENT_SECRET;

const auth0Id = process.env.AUTH_AUTH0_ID || process.env.AUTH0_CLIENT_ID;
const auth0Secret =
  process.env.AUTH_AUTH0_SECRET || process.env.AUTH0_CLIENT_SECRET;
const auth0Issuer =
  process.env.AUTH_AUTH0_ISSUER || process.env.AUTH0_ISSUER;

export const isGoogleEnabled = Boolean(googleId && googleSecret);
export const isAuth0Enabled = Boolean(auth0Id && auth0Secret && auth0Issuer);

export const authConfigured = isGoogleEnabled || isAuth0Enabled;

const activeProviders: any[] = [];

if (isGoogleEnabled) {
  activeProviders.push(
    Google({
      clientId: googleId!,
      clientSecret: googleSecret!,
      allowDangerousEmailAccountLinking: true,
    }),
  );
}

if (isAuth0Enabled) {
  activeProviders.push(
    Auth0({
      clientId: auth0Id!,
      clientSecret: auth0Secret!,
      issuer: auth0Issuer!,
      allowDangerousEmailAccountLinking: true,
    }),
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  secret: process.env.AUTH_SECRET || 'vedaix-local-development-secret',
  session: { strategy: 'jwt' },
  providers: activeProviders,
  pages: {
    signIn: '/?auth=signin',
  },
});
