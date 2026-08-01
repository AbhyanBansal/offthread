import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { orders } from "@/lib/db/schema";
import { verifyWebhookSignature } from "@/lib/razorpay";
import { fulfillOrder } from "@/lib/orders";

type RpEntity = { id?: string; order_id?: string };
type RpEvent = {
  event?: string;
  payload?: {
    payment?: { entity?: RpEntity };
    order?: { entity?: RpEntity };
  };
};

export async function POST(req: Request) {
  // Signature must be verified against the RAW body.
  const raw = await req.text();
  const signature = req.headers.get("x-razorpay-signature") ?? "";

  const valid = await verifyWebhookSignature(raw, signature);
  if (!valid) return new Response("invalid signature", { status: 400 });

  let event: RpEvent;
  try {
    event = JSON.parse(raw) as RpEvent;
  } catch {
    return new Response("bad payload", { status: 400 });
  }

  if (event.event === "payment.captured" || event.event === "order.paid") {
    const rpOrderId =
      event.payload?.payment?.entity?.order_id ??
      event.payload?.order?.entity?.id ??
      null;
    const rpPaymentId = event.payload?.payment?.entity?.id ?? null;

    if (rpOrderId) {
      const order = await db.query.orders.findFirst({
        where: eq(orders.razorpayOrderId, rpOrderId),
        columns: { id: true },
      });
      if (order) {
        if (rpPaymentId) {
          await db
            .update(orders)
            .set({ razorpayPaymentId: rpPaymentId })
            .where(eq(orders.id, order.id));
        }
        await fulfillOrder(order.id);
      }
    }
  }

  return new Response("ok");
}
