import "server-only";
import { AwsClient } from "aws4fetch";
import { r2Env } from "@/lib/env.server";

/**
 * Cloudflare R2 (S3-compatible) presigned uploads via aws4fetch — edge-native,
 * no AWS SDK. The browser PUTs the file directly to R2 using the signed URL, so
 * the bytes never pass through our server.
 */
function r2Client() {
  const { R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY } = r2Env();
  return new AwsClient({
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
    region: "auto",
    service: "s3",
  });
}

/** A short-lived presigned PUT URL for a direct browser upload. */
export async function presignUpload(key: string) {
  const { R2_ACCOUNT_ID, R2_BUCKET } = r2Env();
  const endpoint = `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;
  const url = `${endpoint}/${R2_BUCKET}/${key}?X-Amz-Expires=600`;
  const signed = await r2Client().sign(url, {
    method: "PUT",
    aws: { signQuery: true },
  });
  return signed.url;
}
