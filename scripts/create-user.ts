import * as readline from "node:readline/promises";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { hashPassword } from "@/lib/auth/password";

async function ask(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  const answer = await rl.question(question);
  rl.close();
  return answer.trim();
}

async function main() {
  console.log("\nCréation d'un compte associé pour Cabinet JBF");
  console.log("──────────────────────────────────────────────\n");

  const prenom = await ask("Prénom : ");
  const nom = await ask("Nom : ");
  const email = (await ask("Email  : ")).toLowerCase();
  const password = await ask("Mot de passe (min. 12 caractères) : ");

  if (!prenom || !nom || !email || !password) {
    throw new Error("Tous les champs sont requis.");
  }
  if (password.length < 12) {
    throw new Error("Le mot de passe doit faire au moins 12 caractères.");
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("Format d'email invalide.");
  }

  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existing.length > 0) {
    throw new Error(`Un compte existe déjà avec l'email ${email}.`);
  }

  const passwordHash = await hashPassword(password);
  const [created] = await db
    .insert(users)
    .values({ prenom, nom, email, passwordHash })
    .returning({ id: users.id });

  console.log(`\n✓ Compte créé`);
  console.log(`  ID    : ${created.id}`);
  console.log(`  Nom   : ${prenom} ${nom}`);
  console.log(`  Email : ${email}`);
  console.log(
    "\nVous pouvez maintenant vous connecter sur la page /login avec ces identifiants.\n",
  );
}

main()
  .catch((err) => {
    console.error(`\n✗ ${err.message}\n`);
    process.exit(1);
  })
  .then(() => process.exit(0));
