import "server-only";
import { z } from "zod";

/**
 * Server-only secrets, validated lazily and in independent groups.
 *
 * Why grouped + lazy: using the database shouldn't require the Razorpay or AWS
 * secrets to exist yet. Each group validates only when first accessed, so
 * secrets can be provisioned one phase at a time. The `server-only` import
 * guarantees none of this reaches the browser bundle.
 */

function load<S extends z.ZodTypeAny>(schema: S, group: string): z.infer<S> {
  // Escape hatch for build / type-check steps that run without real secrets.
  if (process.env.SKIP_ENV_VALIDATION) {
    return process.env as z.infer<S>;
  }
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");
    throw new Error(
      `Missing/invalid ${group} environment variables:\n${details}`,
    );
  }
  return parsed.data;
}

function memo<T>(factory: () => T): () => T {
  let cached: T;
  let loaded = false;
  return () => {
    if (!loaded) {
      cached = factory();
      loaded = true;
    }
    return cached;
  };
}

export const dbEnv = memo(() =>
  load(
    z.object({
      DATABASE_URL: z.string().min(1),
    }),
    "database",
  ),
);

export const authEnv = memo(() =>
  load(
    z.object({
      AUTH_SECRET: z
        .string()
        .min(32, "AUTH_SECRET must be at least 32 characters"),
      AUTH_GOOGLE_ID: z.string().min(1),
      AUTH_GOOGLE_SECRET: z.string().min(1),
    }),
    "auth",
  ),
);

// Needed to create orders + verify the checkout response (test mode ready).
export const razorpayEnv = memo(() =>
  load(
    z.object({
      RAZORPAY_KEY_ID: z.string().min(1),
      RAZORPAY_KEY_SECRET: z.string().min(1),
    }),
    "razorpay",
  ),
);

// Only the webhook route needs this; it's configured after deploy (public URL).
export const razorpayWebhookEnv = memo(() =>
  load(
    z.object({
      RAZORPAY_WEBHOOK_SECRET: z.string().min(1),
    }),
    "razorpay-webhook",
  ),
);

// Cloudflare R2 (S3-compatible). Endpoint is derived from the account id.
export const r2Env = memo(() =>
  load(
    z.object({
      R2_ACCOUNT_ID: z.string().min(1),
      R2_ACCESS_KEY_ID: z.string().min(1),
      R2_SECRET_ACCESS_KEY: z.string().min(1),
      R2_BUCKET: z.string().min(1),
    }),
    "r2",
  ),
);
