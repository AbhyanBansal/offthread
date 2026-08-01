import "server-only";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { dbEnv } from "@/lib/env.server";
import * as schema from "./schema";

/**
 * Neon serverless (HTTP) client + Drizzle.
 *
 * The HTTP driver is edge-native and the recommended choice for serverless /
 * Cloudflare Workers. `casing: "snake_case"` lets us write camelCase fields in
 * TypeScript while columns stay snake_case in Postgres.
 */
const sql = neon(dbEnv().DATABASE_URL);

export const db = drizzle(sql, { schema, casing: "snake_case" });

export { schema };
