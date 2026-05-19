import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL n'est pas défini. Vérifier .env.local en local ou les variables Netlify en production.");
}

const sql = neon(process.env.DATABASE_URL);
export const db = drizzle({ client: sql, schema });
