import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

// Lightweight, adapter-free instance for the edge proxy (formerly "middleware").
const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { pathname, origin } = req.nextUrl;
  const isAdmin = req.auth?.user?.role === "admin";

  // /admin requires an admin.
  if (pathname.startsWith("/admin")) {
    if (!isAdmin) return Response.redirect(new URL("/", origin));
    return;
  }

  // Admins are staff, not shoppers — bounce them from shopper flows to the
  // dashboard so they land where they actually work.
  if (isAdmin) {
    const shopperFlow =
      pathname === "/" ||
      pathname.startsWith("/account") ||
      pathname.startsWith("/cart") ||
      pathname.startsWith("/checkout");
    if (shopperFlow) return Response.redirect(new URL("/admin", origin));
  }
});

export const config = {
  // Run on page routes only (skip api, _next, and any static file with an ext).
  matcher: ["/((?!api|_next|.*\\.).*)"],
};
