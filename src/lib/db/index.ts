import "server-only";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { dbEnv } from "@/lib/env.server";
import * as schema from "./schema";

/**
 * Neon serverless (HTTP) client + Drizzle.
 *
 * The HTTP driver is edge-native and the recommended choice for serverless /
 * Cloudflare Workers. `casing: "snake_case"` maps camelCase TS fields to
 * snake_case columns.
 *
 * During a build without secrets (SKIP_ENV_VALIDATION=1) we construct with a
 * dummy connection string. The Neon HTTP driver connects lazily (only on a
 * query), so no real connection is made at build time — this just lets the
 * Drizzle instance exist for the Auth.js adapter's dialect detection.
 */
const connectionString = process.env.SKIP_ENV_VALIDATION
  ? "postgresql://build:build@localhost:5432/build"
  : dbEnv().DATABASE_URL;

const sql = neon(connectionString);

export const db = drizzle(sql, { schema, casing: "snake_case" });

export { schema };
