import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "@shared/schema";

// Keep the existing external database intact during the transition. New
// deployments should set DATABASE_URL only; NEON_DATABASE_URL is a legacy alias.
const connectionString = process.env.NEON_DATABASE_URL || process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is required (a standard PostgreSQL connection URL).");
}

export const pool = new pg.Pool({ connectionString });
pool.on("error", (error) => console.error("Database pool error:", error));
export const db = drizzle({ client: pool, schema });
