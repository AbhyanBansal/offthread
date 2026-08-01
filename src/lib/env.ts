import { z } from "zod";

/**
 * Public configuration — safe to expose to the browser.
 *
 * Only `NEXT_PUBLIC_*` variables belong here. Next.js inlines them into the
 * client bundle at build time, so they must NEVER hold a secret. We reference
 * each one statically (not through a dynamic key) so Next can inline them.
 */
const clientSchema = z.object({
  NEXT_PUBLIC_SITE_URL: z.string().min(1),
  NEXT_PUBLIC_CDN_URL: z.string().min(1),
  NEXT_PUBLIC_RAZORPAY_KEY_ID: z.string().min(1),
});

const clientProcessEnv = {
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  NEXT_PUBLIC_CDN_URL: process.env.NEXT_PUBLIC_CDN_URL,
  NEXT_PUBLIC_RAZORPAY_KEY_ID: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
};

function loadClientEnv() {
  // Escape hatch for build / type-check steps that run without real values.
  if (process.env.SKIP_ENV_VALIDATION) {
    return clientProcessEnv as z.infer<typeof clientSchema>;
  }
  const parsed = clientSchema.safeParse(clientProcessEnv);
  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");
    throw new Error(`Invalid public environment variables:\n${details}`);
  }
  return parsed.data;
}

export const clientEnv = loadClientEnv();
