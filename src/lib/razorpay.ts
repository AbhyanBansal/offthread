import "server-only";
import { razorpayEnv, razorpayWebhookEnv } from "@/lib/env.server";

const BASE = "https://api.razorpay.com/v1";

function authHeader(): string {
  const { RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET } = razorpayEnv();
  // btoa works on both the Node and edge runtimes.
  return `Basic ${btoa(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`)}`;
}

/** HMAC-SHA256 -> lowercase hex, via Web Crypto (works on Node + edge). */
async function hmacHex(secret: string, message: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Constant-time string compare to avoid signature timing leaks. */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

export async function createRazorpayOrder(input: {
  amount: number; // paise
  receipt: string;
  notes?: Record<string, string>;
}) {
  const res = await fetch(`${BASE}/orders`, {
    method: "POST",
    headers: {
      Authorization: authHeader(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: input.amount,
      currency: "INR",
      receipt: input.receipt,
      notes: input.notes ?? {},
    }),
  });

  if (!res.ok) {
    throw new Error(`Razorpay order creation failed (${res.status})`);
  }

  return (await res.json()) as {
    id: string;
    amount: number;
    currency: string;
    status: string;
  };
}

/** Verify the checkout handler response signature (order_id|payment_id). */
export async function verifyPaymentSignature(
  orderId: string,
  paymentId: string,
  signature: string,
): Promise<boolean> {
  const expected = await hmacHex(
    razorpayEnv().RAZORPAY_KEY_SECRET,
    `${orderId}|${paymentId}`,
  );
  return safeEqual(expected, signature);
}

/** Verify a webhook payload signature against the raw request body. */
export async function verifyWebhookSignature(
  rawBody: string,
  signature: string,
): Promise<boolean> {
  const expected = await hmacHex(
    razorpayWebhookEnv().RAZORPAY_WEBHOOK_SECRET,
    rawBody,
  );
  return safeEqual(expected, signature);
}
