import { config } from "dotenv";
config({ path: ".env" });
config({ path: ".env.local", override: true });

import { neon } from "@neondatabase/serverless";

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL absent");
  }

  const sql = neon(process.env.DATABASE_URL);
  const rows = await sql<{ version: string; db: string; now: string }[]>`
    SELECT version() AS version, current_database() AS db, now() AS now
  `;
  const info = rows[0];

  console.log("✓ Connexion réussie à Neon");
  console.log("  Base       :", info.db);
  console.log("  Heure base :", info.now);
  console.log("  Version    :", info.version.split(",")[0]);
}

main().catch((err) => {
  console.error("✗ Erreur de connexion :", err.message);
  process.exit(1);
});
