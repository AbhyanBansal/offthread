"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { addresses } from "@/lib/db/schema";

const schema = z.object({
  name: z.string().trim().min(1).max(120),
  phone: z.string().trim().min(8).max(20),
  line1: z.string().trim().min(1).max(200),
  line2: z.string().trim().max(200).optional().default(""),
  city: z.string().trim().min(1).max(80),
  state: z.string().trim().min(1).max(80),
  pincode: z.string().trim().min(4).max(12),
});

/** Save (upsert) the signed-in customer's single shipping address. */
export async function saveAddress(raw: unknown) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not signed in");

  const data = schema.parse(raw);

  await db.delete(addresses).where(eq(addresses.userId, session.user.id));
  await db.insert(addresses).values({
    userId: session.user.id,
    name: data.name,
    phone: data.phone,
    line1: data.line1,
    line2: data.line2 || null,
    city: data.city,
    state: data.state,
    pincode: data.pincode,
    country: "IN",
    isDefault: true,
  });

  revalidatePath("/account");
  return { ok: true as const };
}
