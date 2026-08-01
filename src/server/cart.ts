"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { cartItems, carts } from "@/lib/db/schema";

const CART_COOKIE = "ot_cart";
const CART_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

async function readCartId(): Promise<string | null> {
  const jar = await cookies();
  return jar.get(CART_COOKIE)?.value ?? null;
}

/**
 * Resolve the current cart id from the cookie, creating a cart (and the cookie)
 * for guests. The cookie is httpOnly so it can't be read from client JS. When a
 * user logs in, their guest cart is merged in the auth phase.
 */
async function getOrCreateCartId(): Promise<string> {
  const jar = await cookies();
  const existing = jar.get(CART_COOKIE)?.value;

  if (existing) {
    const found = await db.query.carts.findFirst({
      where: eq(carts.id, existing),
      columns: { id: true },
    });
    if (found) return found.id;
  }

  const [created] = await db.insert(carts).values({}).returning({
    id: carts.id,
  });

  jar.set(CART_COOKIE, created.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: CART_MAX_AGE,
  });

  return created.id;
}

export async function addToCart(variantId: string, qty = 1) {
  const quantity = Math.max(1, Math.floor(qty));
  const cartId = await getOrCreateCartId();

  await db
    .insert(cartItems)
    .values({ cartId, variantId, qty: quantity })
    .onConflictDoUpdate({
      target: [cartItems.cartId, cartItems.variantId],
      set: { qty: sql`${cartItems.qty} + ${quantity}` },
    });

  revalidatePath("/cart");
  return { ok: true as const };
}

/**
 * Full cart contents for rendering. Prices are read from the DB (variant
 * override, else product base) — the client never dictates price.
 */
export async function getCart() {
  const cartId = await readCartId();
  if (!cartId) return { id: null, items: [], subtotal: 0 };

  const cart = await db.query.carts.findFirst({
    where: eq(carts.id, cartId),
    with: {
      items: {
        with: {
          variant: {
            with: { product: { with: { images: true } } },
          },
        },
      },
    },
  });

  if (!cart) return { id: null, items: [], subtotal: 0 };

  const items = cart.items.map((it) => {
    const unitPrice = it.variant.priceOverride ?? it.variant.product.basePrice;
    const primary =
      it.variant.product.images.find((img) => img.isPrimary) ??
      it.variant.product.images[0];
    return {
      id: it.id,
      variantId: it.variantId,
      qty: it.qty,
      size: it.variant.size,
      name: it.variant.product.name,
      slug: it.variant.product.slug,
      s3Key: primary?.s3Key ?? null,
      stockQty: it.variant.stockQty,
      unitPrice,
      lineTotal: unitPrice * it.qty,
    };
  });

  const subtotal = items.reduce((sum, i) => sum + i.lineTotal, 0);
  return { id: cart.id, items, subtotal };
}

export async function getCartCount() {
  const cartId = await readCartId();
  if (!cartId) return 0;
  const [row] = await db
    .select({ count: sql<number>`coalesce(sum(${cartItems.qty}), 0)` })
    .from(cartItems)
    .where(eq(cartItems.cartId, cartId));
  return Number(row?.count ?? 0);
}

export async function updateCartItem(itemId: string, qty: number) {
  const cartId = await readCartId();
  if (!cartId) return;

  // Scope every mutation to the caller's own cart so an item id from another
  // cart can never be touched.
  if (qty <= 0) {
    await db
      .delete(cartItems)
      .where(and(eq(cartItems.id, itemId), eq(cartItems.cartId, cartId)));
  } else {
    await db
      .update(cartItems)
      .set({ qty: Math.floor(qty) })
      .where(and(eq(cartItems.id, itemId), eq(cartItems.cartId, cartId)));
  }
  revalidatePath("/cart");
}

export async function removeCartItem(itemId: string) {
  const cartId = await readCartId();
  if (!cartId) return;
  await db
    .delete(cartItems)
    .where(and(eq(cartItems.id, itemId), eq(cartItems.cartId, cartId)));
  revalidatePath("/cart");
}
