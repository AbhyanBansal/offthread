import { clientEnv } from "@/lib/env";

/**
 * Build a public CDN URL from an S3 object key. We only ever store the object
 * key in the database; the raw bucket URL is never exposed to the browser.
 */
export function imageUrl(s3Key: string) {
  const base = clientEnv.NEXT_PUBLIC_CDN_URL.replace(/\/+$/, "");
  const key = s3Key.replace(/^\/+/, "");
  return `${base}/${key}`;
}
