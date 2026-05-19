import { config } from "dotenv";
config({ path: ".env" });
config({ path: ".env.local", override: true });

import { neon } from "@neondatabase/serverless";

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL absent");
  }

  const sql = neon(process.env.DATABASE_URL);

  const info = (
    await sql<{ db: string; now: string }[]>`
      SELECT current_database() AS db, now() AS now
    `
  )[0];

  const tables = await sql<{ table_name: string }[]>`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
    ORDER BY table_name
  `;

  console.log("✓ Connexion réussie à Neon");
  console.log("  Base       :", info.db);
  console.log("  Heure base :", info.now);
  console.log("");
  console.log(`Tables présentes (${tables.length}) :`);
  for (const t of tables) {
    console.log("  •", t.table_name);
  }
}

main().catch((err) => {
  console.error("✗ Erreur :", err.message);
  process.exit(1);
});
