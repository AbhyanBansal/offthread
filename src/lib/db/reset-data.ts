/**
 * Pre-deploy data reset. Removes ALL test transactional data and every
 * non-admin user, leaving only: products/variants/images + the admin user(s)
 * from ADMIN_EMAILS (whose role is set to 'admin').
 *
 * Run with:  pnpm db:clear-data
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { inArray, notInArray } from "drizzle-orm";
import * as schema from "./schema";
import { carts, orders, users } from "./schema";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is missing in .env.local");
  process.exit(1);
}

const db = drizzle(neon(url), { schema, casing: "snake_case" });

const adminEmails = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

async function main() {
  if (adminEmails.length === 0) {
    console.error("ADMIN_EMAILS is not set — aborting to avoid deleting every user.");
    process.exit(1);
  }

  const allUsers = await db
    .select({ id: users.id, email: users.email })
    .from(users);
  const adminIds = allUsers
    .filter((u) => adminEmails.includes(u.email.toLowerCase()))
    .map((u) => u.id);

  // Wipe test transactional data (cascades to order_items / cart_items).
  await db.delete(orders);
  await db.delete(carts);

  if (adminIds.length > 0) {
    // Remove every non-admin user (cascades accounts/sessions/addresses/carts).
    await db.delete(users).where(notInArray(users.id, adminIds));
    // Ensure the admin role is set in the DB.
    await db.update(users).set({ role: "admin" }).where(inArray(users.id, adminIds));
  } else {
    console.warn(
      "No admin user found in the DB yet (has the admin signed in?). Cleared orders/carts but left users untouched to be safe.",
    );
  }

  const remaining = await db
    .select({ email: users.email, role: users.role })
    .from(users);
  console.log("Orders + carts cleared.");
  console.log("Remaining users:", remaining);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
