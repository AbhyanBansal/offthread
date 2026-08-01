/**
 * Remove the placeholder seed products. Run with:  pnpm db:clear-seed
 * Order history is preserved (order_items keep their name/price snapshots).
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { inArray } from "drizzle-orm";
import * as schema from "./schema";
import { products } from "./schema";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is missing in .env.local");
  process.exit(1);
}

const db = drizzle(neon(url), { schema, casing: "snake_case" });

const SEED_SLUGS = [
  "manifest-heavyweight-tee",
  "utility-cargo-pants",
  "raw-denim-jacket",
  "box-logo-hoodie",
  "panelled-track-pant",
  "tactical-crossbody-bag",
];

async function main() {
  const deleted = await db
    .delete(products)
    .where(inArray(products.slug, SEED_SLUGS))
    .returning({ slug: products.slug });

  console.log(
    `Deleted ${deleted.length} seed product(s): ${deleted
      .map((d) => d.slug)
      .join(", ")}`,
  );
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
