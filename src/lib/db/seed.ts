/**
 * Seed sample catalog data. Run with:  pnpm db:seed
 *
 * Self-contained (its own db client) so it can run outside Next.js under tsx.
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";
import { products, variants } from "./schema";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is missing in .env.local");
  process.exit(1);
}

const db = drizzle(neon(url), { schema, casing: "snake_case" });

const APPAREL_SIZES = ["S", "M", "L", "XL", "XXL"];

type SeedProduct = {
  slug: string;
  name: string;
  category: string;
  basePrice: number; // paise
  description: string;
  sizes?: string[];
};

const SEED: SeedProduct[] = [
  {
    slug: "manifest-heavyweight-tee",
    name: "Manifest Heavyweight Tee",
    category: "Tees",
    basePrice: 149900,
    description:
      "320 GSM combed cotton, boxy fit, garment-dyed. The base layer of Manifest 04.",
  },
  {
    slug: "utility-cargo-pants",
    name: "Utility Cargo Pants",
    category: "Cargos",
    basePrice: 349900,
    description:
      "Double-knee ripstop cargos with eight pockets and an adjustable hem.",
  },
  {
    slug: "raw-denim-jacket",
    name: "Raw Denim Jacket",
    category: "Denim",
    basePrice: 599900,
    description: "14oz raw selvedge trucker that breaks in to you over time.",
  },
  {
    slug: "box-logo-hoodie",
    name: "Box Logo Hoodie",
    category: "Hoodies",
    basePrice: 399900,
    description:
      "440 GSM brushed-back fleece with a screen-printed box logo. Built to outlive trends.",
  },
  {
    slug: "panelled-track-pant",
    name: "Panelled Track Pant",
    category: "Bottoms",
    basePrice: 279900,
    description:
      "Heavyweight jersey track pant with contrast side panels and a tapered leg.",
  },
  {
    slug: "tactical-crossbody-bag",
    name: "Tactical Crossbody Bag",
    category: "Accessories",
    basePrice: 179900,
    description:
      "Water-resistant Cordura crossbody with modular webbing. One size.",
    sizes: ["OS"],
  },
];

async function main() {
  for (const p of SEED) {
    const [row] = await db
      .insert(products)
      .values({
        slug: p.slug,
        name: p.name,
        category: p.category,
        basePrice: p.basePrice,
        description: p.description,
        status: "active",
      })
      .onConflictDoNothing({ target: products.slug })
      .returning({ id: products.id });

    if (!row) {
      console.log(`- skip ${p.slug} (already exists)`);
      continue;
    }

    const sizes = p.sizes ?? APPAREL_SIZES;
    await db.insert(variants).values(
      sizes.map((size, i) => ({
        productId: row.id,
        sku: `${p.slug}-${size}`.toUpperCase(),
        size,
        // Leave one size out of stock to exercise the sold-out UI.
        stockQty: size === "XXL" ? 0 : 20,
        position: i,
      })),
    );

    console.log(`+ seeded ${p.slug} (${sizes.length} sizes)`);
  }

  console.log("Seed complete.");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
