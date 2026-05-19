import {
  pgTable,
  text,
  uuid,
  timestamp,
  boolean,
  numeric,
  date,
  pgEnum,
  jsonb,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// ──────────────────────────────────────────────────────────────────────────────
// ENUMS
// ──────────────────────────────────────────────────────────────────────────────

export const typeProcedureEnum = pgEnum("type_procedure", [
  "garde_a_vue",
  "instruction",
  "correctionnelle",
  "criminelle",
  "comparution_immediate",
  "appel",
  "cassation",
  "autre",
]);

export const statutDossierEnum = pgEnum("statut_dossier", [
  "en_cours",
  "cloture",
]);

export const emailTypeEnum = pgEnum("email_type", [
  "audience_J-7",
  "audience_J-3",
  "audience_J-0",
  "rappel_J-3",
  "rappel_J-0",
]);

// ──────────────────────────────────────────────────────────────────────────────
// UTILISATEURS (associés)
// ──────────────────────────────────────────────────────────────────────────────

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    nom: text("nom").notNull(),
    prenom: text("prenom").notNull(),
    email: text("email").notNull(),
    passwordHash: text("password_hash").notNull(),
    actif: boolean("actif").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [uniqueIndex("users_email_unique").on(t.email)],
);

// ──────────────────────────────────────────────────────────────────────────────
// CLIENTS
// ──────────────────────────────────────────────────────────────────────────────

export const clients = pgTable(
  "clients",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    nom: text("nom").notNull(),
    prenom: text("prenom").notNull(),
    telephone: text("telephone").notNull(),
    email: text("email"),
    alertes: text("alertes"),
    archiveLe: timestamp("archive_le", { withTimezone: true }),
    archivePar: uuid("archive_par").references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    createdBy: uuid("created_by")
      .notNull()
      .references(() => users.id),
  },
  (t) => [
    index("clients_nom_idx").on(t.nom),
    index("clients_prenom_idx").on(t.prenom),
    index("clients_telephone_idx").on(t.telephone),
  ],
);

// ──────────────────────────────────────────────────────────────────────────────
// DOSSIERS
// ──────────────────────────────────────────────────────────────────────────────

export const dossiers = pgTable(
  "dossiers",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    numeroDossier: text("numero_dossier").notNull(),
    clientId: uuid("client_id")
      .notNull()
      .references(() => clients.id, { onDelete: "restrict" }),
    typeProcedure: typeProcedureEnum("type_procedure").notNull(),
    typeProcedureAutre: text("type_procedure_autre"),
    juridiction: text("juridiction").notNull(),
    associeResponsableId: uuid("associe_responsable_id")
      .notNull()
      .references(() => users.id),
    statut: statutDossierEnum("statut").notNull().default("en_cours"),
    description: text("description"),
    montantConvenu: numeric("montant_convenu", { precision: 12, scale: 2 }),
    archiveLe: timestamp("archive_le", { withTimezone: true }),
    archivePar: uuid("archive_par").references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    createdBy: uuid("created_by")
      .notNull()
      .references(() => users.id),
  },
  (t) => [
    uniqueIndex("dossiers_numero_unique").on(t.numeroDossier),
    index("dossiers_client_idx").on(t.clientId),
    index("dossiers_associe_idx").on(t.associeResponsableId),
    index("dossiers_statut_idx").on(t.statut),
  ],
);

// ──────────────────────────────────────────────────────────────────────────────
// AUDIENCES
// ──────────────────────────────────────────────────────────────────────────────

export const audiences = pgTable(
  "audiences",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    dossierId: uuid("dossier_id")
      .notNull()
      .references(() => dossiers.id, { onDelete: "cascade" }),
    dateHeure: timestamp("date_heure", { withTimezone: true }).notNull(),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    createdBy: uuid("created_by")
      .notNull()
      .references(() => users.id),
  },
  (t) => [
    index("audiences_dossier_idx").on(t.dossierId),
    index("audiences_date_idx").on(t.dateHeure),
  ],
);

// ──────────────────────────────────────────────────────────────────────────────
// NOTES (modifiables par l'auteur, historique conservé dans note_revisions)
// ──────────────────────────────────────────────────────────────────────────────

export const notes = pgTable(
  "notes",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    dossierId: uuid("dossier_id")
      .notNull()
      .references(() => dossiers.id, { onDelete: "cascade" }),
    auteurId: uuid("auteur_id")
      .notNull()
      .references(() => users.id),
    contenu: text("contenu").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }),
  },
  (t) => [
    index("notes_dossier_idx").on(t.dossierId),
    index("notes_created_idx").on(t.createdAt),
  ],
);

export const noteRevisions = pgTable(
  "note_revisions",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    noteId: uuid("note_id")
      .notNull()
      .references(() => notes.id, { onDelete: "cascade" }),
    contenuAvant: text("contenu_avant").notNull(),
    modifieLe: timestamp("modifie_le", { withTimezone: true })
      .notNull()
      .defaultNow(),
    modifiePar: uuid("modifie_par")
      .notNull()
      .references(() => users.id),
  },
  (t) => [index("note_revisions_note_idx").on(t.noteId)],
);

// ──────────────────────────────────────────────────────────────────────────────
// RAPPELS (to-do par dossier)
// ──────────────────────────────────────────────────────────────────────────────

export const rappels = pgTable(
  "rappels",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    dossierId: uuid("dossier_id")
      .notNull()
      .references(() => dossiers.id, { onDelete: "cascade" }),
    titre: text("titre").notNull(),
    dateEcheance: date("date_echeance").notNull(),
    termine: boolean("termine").notNull().default(false),
    terminePar: uuid("termine_par").references(() => users.id),
    termineLe: timestamp("termine_le", { withTimezone: true }),
    createurId: uuid("createur_id")
      .notNull()
      .references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("rappels_dossier_idx").on(t.dossierId),
    index("rappels_echeance_idx").on(t.dateEcheance),
    index("rappels_termine_idx").on(t.termine),
  ],
);

// ──────────────────────────────────────────────────────────────────────────────
// ENCAISSEMENTS (honoraires perçus)
// ──────────────────────────────────────────────────────────────────────────────

export const encaissements = pgTable(
  "encaissements",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    dossierId: uuid("dossier_id")
      .notNull()
      .references(() => dossiers.id, { onDelete: "cascade" }),
    date: date("date").notNull(),
    montant: numeric("montant", { precision: 12, scale: 2 }).notNull(),
    libelle: text("libelle"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    createdBy: uuid("created_by")
      .notNull()
      .references(() => users.id),
  },
  (t) => [index("encaissements_dossier_idx").on(t.dossierId)],
);

// ──────────────────────────────────────────────────────────────────────────────
// JOURNALISATION (connexions et actions sensibles)
// ──────────────────────────────────────────────────────────────────────────────

export const accessLogs = pgTable(
  "access_logs",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: uuid("user_id").references(() => users.id),
    action: text("action").notNull(),
    targetType: text("target_type"),
    targetId: uuid("target_id"),
    ip: text("ip"),
    userAgent: text("user_agent"),
    details: jsonb("details"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("access_logs_user_idx").on(t.userId),
    index("access_logs_created_idx").on(t.createdAt),
    index("access_logs_action_idx").on(t.action),
  ],
);

// ──────────────────────────────────────────────────────────────────────────────
// EMAIL LOG (anti-doublon pour les rappels automatiques)
// ──────────────────────────────────────────────────────────────────────────────

export const emailLog = pgTable(
  "email_log",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    emailType: emailTypeEnum("email_type").notNull(),
    audienceId: uuid("audience_id").references(() => audiences.id, {
      onDelete: "cascade",
    }),
    rappelId: uuid("rappel_id").references(() => rappels.id, {
      onDelete: "cascade",
    }),
    destinataire: text("destinataire").notNull(),
    sentAt: timestamp("sent_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("email_log_audience_idx").on(t.audienceId),
    index("email_log_rappel_idx").on(t.rappelId),
    uniqueIndex("email_log_audience_type_unique")
      .on(t.audienceId, t.emailType)
      .where(sql`audience_id IS NOT NULL`),
    uniqueIndex("email_log_rappel_type_unique")
      .on(t.rappelId, t.emailType)
      .where(sql`rappel_id IS NOT NULL`),
  ],
);
