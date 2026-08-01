import "server-only";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

/**
 * Admins are staff, not shoppers — bounce them to the dashboard from shopper
 * routes. Call at the top of shopper-facing server pages. (The /admin area is
 * separately gated in its own layout.)
 */
export async function bounceAdminToDashboard() {
  const session = await auth();
  if (session?.user?.role === "admin") redirect("/admin");
}
