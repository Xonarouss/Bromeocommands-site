import type { NextAuthOptions } from 'next-auth';
import TwitchProvider from 'next-auth/providers/twitch';

// We ask for user:read:subscriptions so we can check if the logged-in user is subscribed.
// (Mods/VIPs verification is done with the broadcaster token on the server.)
const twitchScopes = ['openid', 'user:read:email', 'user:read:subscriptions'];

export const authOptions: NextAuthOptions = {
  providers: [
    TwitchProvider({
      clientId: process.env.TWITCH_CLIENT_ID!,
      clientSecret: process.env.TWITCH_CLIENT_SECRET!,
      authorization: {
        params: { scope: twitchScopes.join(' ') }
      }
    })
  ],
  session: { strategy: 'jwt' },
  callbacks: {
    async jwt({ token, account, profile }) {
      // Initial sign in
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.expiresAt = account.expires_at; // seconds since epoch
      }
      if (profile) {
        // Twitch returns a profile with id
        // @ts-expect-error - next-auth types don't include id on Twitch profile
        token.twitchUserId = profile.id;
        // @ts-expect-error
        token.login = profile.preferred_username ?? profile.login;
        // @ts-expect-error
        token.displayName = profile.name ?? profile.display_name;
        // @ts-expect-error
        token.image = profile.picture ?? profile.image_url;
      }
      return token;
    },
    async session({ session, token }) {
      // Expose what we need client-side
      (session as any).accessToken = token.accessToken;
      (session.user as any).twitchUserId = token.twitchUserId;
      (session.user as any).login = token.login;
      (session.user as any).displayName = token.displayName;
      (session.user as any).image = token.image;
      return session;
    }
  }
};
