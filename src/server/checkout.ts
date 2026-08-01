"use server";

import { z } from "zod";
import { cookies, headers } from "next/headers";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { addresses, cartItems, orderItems, orders } from "@/lib/db/schema";
import { getCart } from "@/server/cart";
import { auth } from "@/lib/auth";
import { clientEnv } from "@/lib/env";
import { computeShipping } from "@/lib/money";
import { createRazorpayOrder, verifyPaymentSignature } from "@/lib/razorpay";
import { fulfillOrder, generateOrderNumber } from "@/lib/orders";
import { rateLimit } from "@/lib/rate-limit";

async function clientIp() {
  const h = await headers();
  return (
    h.get("cf-connecting-ip") ||
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown"
  );
}

const addressSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email(),
  phone: z.string().trim().min(8).max(20),
  line1: z.string().trim().min(1).max(200),
  line2: z.string().trim().max(200).optional().default(""),
  city: z.string().trim().min(1).max(80),
  state: z.string().trim().min(1).max(80),
  pincode: z.string().trim().min(4).max(12),
});

/**
 * Create a pending order + a Razorpay order. All money is recomputed from the
 * database here — the client's cart totals are never trusted.
 */
export async function createCheckoutOrder(raw: unknown) {
  const ip = await clientIp();
  if (!rateLimit(`checkout:${ip}`, 8, 60_000).ok) {
    throw new Error("Too many attempts — please wait a minute and try again.");
  }

  const data = addressSchema.parse(raw);

  const cart = await getCart();
  if (cart.items.length === 0) throw new Error("Your bag is empty");

  const subtotal = cart.subtotal;
  const shippingFee = computeShipping(subtotal);
  const total = subtotal + shippingFee;

  const session = await auth();
  const orderNumber = generateOrderNumber();

  const rp = await createRazorpayOrder({
    amount: total,
    receipt: orderNumber,
    notes: { orderNumber },
  });

  const [order] = await db
    .insert(orders)
    .values({
      orderNumber,
      userId: session?.user?.id ?? null,
      email: data.email,
      status: "pending",
      subtotal,
      shippingFee,
      discount: 0,
      total,
      currency: "INR",
      shippingAddress: {
        name: data.name,
        phone: data.phone,
        line1: data.line1,
        line2: data.line2,
        city: data.city,
        state: data.state,
        pincode: data.pincode,
        country: "IN",
      },
      razorpayOrderId: rp.id,
    })
    .returning({ id: orders.id });

  await db.insert(orderItems).values(
    cart.items.map((it) => ({
      orderId: order.id,
      variantId: it.variantId,
      productName: it.name,
      variantLabel: it.size,
      unitPrice: it.unitPrice,
      qty: it.qty,
      lineTotal: it.lineTotal,
    })),
  );

  return {
    razorpayOrderId: rp.id,
    amount: total,
    orderNumber,
    keyId: clientEnv.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    prefill: { name: data.name, email: data.email, contact: data.phone },
  };
}

/**
 * Verify the Razorpay handler signature, fulfill the order (idempotent), and
 * clear the cart. The webhook is the authoritative backup for this same work.
 */
export async function confirmPayment(input: {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  signature: string;
}) {
  const valid = await verifyPaymentSignature(
    input.razorpayOrderId,
    input.razorpayPaymentId,
    input.signature,
  );
  if (!valid) throw new Error("Invalid payment signature");

  const order = await db.query.orders.findFirst({
    where: eq(orders.razorpayOrderId, input.razorpayOrderId),
    columns: {
      id: true,
      orderNumber: true,
      userId: true,
      shippingAddress: true,
    },
  });
  if (!order) throw new Error("Order not found");

  await db
    .update(orders)
    .set({ razorpayPaymentId: input.razorpayPaymentId })
    .where(eq(orders.id, order.id));

  await fulfillOrder(order.id);

  // Persist shipping details for a logged-in customer so future checkouts
  // prefill and they never re-enter them (one saved address per user).
  if (order.userId && order.shippingAddress) {
    const a = order.shippingAddress;
    await db.delete(addresses).where(eq(addresses.userId, order.userId));
    await db.insert(addresses).values({
      userId: order.userId,
      name: a.name,
      phone: a.phone,
      line1: a.line1,
      line2: a.line2 ?? null,
      city: a.city,
      state: a.state,
      pincode: a.pincode,
      country: a.country ?? "IN",
      isDefault: true,
    });
  }

  const jar = await cookies();
  const cartId = jar.get("ot_cart")?.value;
  if (cartId) {
    await db.delete(cartItems).where(eq(cartItems.cartId, cartId));
  }

  return { orderNumber: order.orderNumber };
}
