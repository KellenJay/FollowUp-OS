import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { findUserByEmail, resolveOrCreateUserByEmail } from "@/lib/users";
import { verifyPassword } from "@/lib/password";
import { upsertMailbox } from "@/lib/mailboxes";
import { upsertOwnerName } from "@/lib/account";
import { GOOGLE_SCOPES } from "@/lib/google/scopes";

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.AUTH_SECRET,
  // Explicit rather than relying on the implicit default (no adapter is
  // configured, so this was already JWT — the Credentials provider added
  // below requires it to be stated explicitly).
  session: { strategy: "jwt" },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          scope: GOOGLE_SCOPES,
          access_type: "offline",
          // Forces Google to re-issue a refresh_token on every sign-in, since
          // it otherwise only grants one on a mailbox's very first consent —
          // and cron jobs need that refresh token independent of any live
          // browser session.
          prompt: "consent",
        },
      },
    }),
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = String(credentials?.email ?? "").toLowerCase().trim();
        const password = String(credentials?.password ?? "");
        if (!email || !password) return null;

        const user = await findUserByEmail(email);
        // No password_hash means this is a Google-only account — refuse
        // rather than treat a missing hash as "any password works."
        if (!user?.password_hash) return null;

        const valid = await verifyPassword(password, user.password_hash);
        if (!valid) return null;

        return { id: user.id, email: user.email, name: user.name ?? undefined };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile, user }) {
      if (account?.provider === "google" && account.refresh_token && profile?.email) {
        // Identity is resolved by email (see supabase/migrations/0010's
        // note) — token.sub becomes our own users.id, not Google's own
        // subject id, so every downstream owner_id read is the real
        // multi-tenant identity rather than a per-provider one.
        const userRow = await resolveOrCreateUserByEmail(
          profile.email,
          typeof profile.name === "string" ? profile.name : undefined
        );
        token.sub = userRow.id;
        await upsertMailbox(userRow.id, profile.email, account.refresh_token, account.expires_at);
        if (typeof profile.name === "string") {
          await upsertOwnerName(userRow.id, profile.name);
        }
      } else if (account?.provider === "credentials" && user) {
        token.sub = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
});
