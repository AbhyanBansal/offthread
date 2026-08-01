import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";

/**
 * Base auth config with NO database/adapter imports, so it is safe to run in
 * the edge middleware. Google auto-reads AUTH_GOOGLE_ID / AUTH_GOOGLE_SECRET
 * and Auth.js auto-reads AUTH_SECRET from the environment.
 *
 * Session uses a JWT stored in an httpOnly, Secure, SameSite=Lax cookie —
 * stateless and edge-friendly.
 */
export const authConfig = {
  providers: [Google],
  session: { strategy: "jwt" },
  // Required when running behind a proxy/CDN (Cloudflare) in production.
  trustHost: true,
  pages: { signIn: "/account" },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        const role = (user as { role?: "customer" | "admin" }).role;
        if (role) token.role = role;
      }
      // Env-driven admin allowlist — these emails always resolve to admin.
      const admins = (process.env.ADMIN_EMAILS ?? "")
        .split(",")
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean);
      const email = (token.email ?? "").toString().toLowerCase();
      if (email && admins.includes(email)) token.role = "admin";
      else if (!token.role) token.role = "customer";
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = (token.id as string) ?? session.user.id;
        session.user.role = (token.role as "customer" | "admin") ?? "customer";
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
