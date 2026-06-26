import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema.ts";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL)
  throw new Error("Missing required environment variable: DATABASE_URL");

const connection = postgres(DATABASE_URL);
export const db = drizzle(connection, { schema });
