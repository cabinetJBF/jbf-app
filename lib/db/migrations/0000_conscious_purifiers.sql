CREATE TYPE "public"."email_type" AS ENUM('audience_J-7', 'audience_J-3', 'audience_J-0', 'rappel_J-3', 'rappel_J-0');--> statement-breakpoint
CREATE TYPE "public"."statut_dossier" AS ENUM('en_cours', 'cloture');--> statement-breakpoint
CREATE TYPE "public"."type_procedure" AS ENUM('garde_a_vue', 'instruction', 'correctionnelle', 'criminelle', 'comparution_immediate', 'appel', 'cassation', 'autre');--> statement-breakpoint
CREATE TABLE "access_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"action" text NOT NULL,
	"target_type" text,
	"target_id" uuid,
	"ip" text,
	"user_agent" text,
	"details" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audiences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"dossier_id" uuid NOT NULL,
	"date_heure" timestamp with time zone NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nom" text NOT NULL,
	"prenom" text NOT NULL,
	"telephone" text NOT NULL,
	"email" text,
	"alertes" text,
	"archive_le" timestamp with time zone,
	"archive_par" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dossiers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"numero_dossier" text NOT NULL,
	"client_id" uuid NOT NULL,
	"type_procedure" "type_procedure" NOT NULL,
	"juridiction" text NOT NULL,
	"associe_responsable_id" uuid NOT NULL,
	"statut" "statut_dossier" DEFAULT 'en_cours' NOT NULL,
	"description" text,
	"montant_convenu" numeric(12, 2),
	"archive_le" timestamp with time zone,
	"archive_par" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email_type" "email_type" NOT NULL,
	"audience_id" uuid,
	"rappel_id" uuid,
	"destinataire" text NOT NULL,
	"sent_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "encaissements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"dossier_id" uuid NOT NULL,
	"date" date NOT NULL,
	"montant" numeric(12, 2) NOT NULL,
	"libelle" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "note_revisions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"note_id" uuid NOT NULL,
	"contenu_avant" text NOT NULL,
	"modifie_le" timestamp with time zone DEFAULT now() NOT NULL,
	"modifie_par" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"dossier_id" uuid NOT NULL,
	"auteur_id" uuid NOT NULL,
	"contenu" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "rappels" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"dossier_id" uuid NOT NULL,
	"titre" text NOT NULL,
	"date_echeance" date NOT NULL,
	"termine" boolean DEFAULT false NOT NULL,
	"termine_par" uuid,
	"termine_le" timestamp with time zone,
	"createur_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nom" text NOT NULL,
	"prenom" text NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"actif" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "access_logs" ADD CONSTRAINT "access_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audiences" ADD CONSTRAINT "audiences_dossier_id_dossiers_id_fk" FOREIGN KEY ("dossier_id") REFERENCES "public"."dossiers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audiences" ADD CONSTRAINT "audiences_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clients" ADD CONSTRAINT "clients_archive_par_users_id_fk" FOREIGN KEY ("archive_par") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clients" ADD CONSTRAINT "clients_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dossiers" ADD CONSTRAINT "dossiers_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dossiers" ADD CONSTRAINT "dossiers_associe_responsable_id_users_id_fk" FOREIGN KEY ("associe_responsable_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dossiers" ADD CONSTRAINT "dossiers_archive_par_users_id_fk" FOREIGN KEY ("archive_par") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dossiers" ADD CONSTRAINT "dossiers_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_log" ADD CONSTRAINT "email_log_audience_id_audiences_id_fk" FOREIGN KEY ("audience_id") REFERENCES "public"."audiences"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_log" ADD CONSTRAINT "email_log_rappel_id_rappels_id_fk" FOREIGN KEY ("rappel_id") REFERENCES "public"."rappels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "encaissements" ADD CONSTRAINT "encaissements_dossier_id_dossiers_id_fk" FOREIGN KEY ("dossier_id") REFERENCES "public"."dossiers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "encaissements" ADD CONSTRAINT "encaissements_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "note_revisions" ADD CONSTRAINT "note_revisions_note_id_notes_id_fk" FOREIGN KEY ("note_id") REFERENCES "public"."notes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "note_revisions" ADD CONSTRAINT "note_revisions_modifie_par_users_id_fk" FOREIGN KEY ("modifie_par") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notes" ADD CONSTRAINT "notes_dossier_id_dossiers_id_fk" FOREIGN KEY ("dossier_id") REFERENCES "public"."dossiers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notes" ADD CONSTRAINT "notes_auteur_id_users_id_fk" FOREIGN KEY ("auteur_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rappels" ADD CONSTRAINT "rappels_dossier_id_dossiers_id_fk" FOREIGN KEY ("dossier_id") REFERENCES "public"."dossiers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rappels" ADD CONSTRAINT "rappels_termine_par_users_id_fk" FOREIGN KEY ("termine_par") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rappels" ADD CONSTRAINT "rappels_createur_id_users_id_fk" FOREIGN KEY ("createur_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "access_logs_user_idx" ON "access_logs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "access_logs_created_idx" ON "access_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "access_logs_action_idx" ON "access_logs" USING btree ("action");--> statement-breakpoint
CREATE INDEX "audiences_dossier_idx" ON "audiences" USING btree ("dossier_id");--> statement-breakpoint
CREATE INDEX "audiences_date_idx" ON "audiences" USING btree ("date_heure");--> statement-breakpoint
CREATE INDEX "clients_nom_idx" ON "clients" USING btree ("nom");--> statement-breakpoint
CREATE INDEX "clients_prenom_idx" ON "clients" USING btree ("prenom");--> statement-breakpoint
CREATE INDEX "clients_telephone_idx" ON "clients" USING btree ("telephone");--> statement-breakpoint
CREATE UNIQUE INDEX "dossiers_numero_unique" ON "dossiers" USING btree ("numero_dossier");--> statement-breakpoint
CREATE INDEX "dossiers_client_idx" ON "dossiers" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "dossiers_associe_idx" ON "dossiers" USING btree ("associe_responsable_id");--> statement-breakpoint
CREATE INDEX "dossiers_statut_idx" ON "dossiers" USING btree ("statut");--> statement-breakpoint
CREATE INDEX "email_log_audience_idx" ON "email_log" USING btree ("audience_id");--> statement-breakpoint
CREATE INDEX "email_log_rappel_idx" ON "email_log" USING btree ("rappel_id");--> statement-breakpoint
CREATE UNIQUE INDEX "email_log_audience_type_unique" ON "email_log" USING btree ("audience_id","email_type") WHERE audience_id IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "email_log_rappel_type_unique" ON "email_log" USING btree ("rappel_id","email_type") WHERE rappel_id IS NOT NULL;--> statement-breakpoint
CREATE INDEX "encaissements_dossier_idx" ON "encaissements" USING btree ("dossier_id");--> statement-breakpoint
CREATE INDEX "note_revisions_note_idx" ON "note_revisions" USING btree ("note_id");--> statement-breakpoint
CREATE INDEX "notes_dossier_idx" ON "notes" USING btree ("dossier_id");--> statement-breakpoint
CREATE INDEX "notes_created_idx" ON "notes" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "rappels_dossier_idx" ON "rappels" USING btree ("dossier_id");--> statement-breakpoint
CREATE INDEX "rappels_echeance_idx" ON "rappels" USING btree ("date_echeance");--> statement-breakpoint
CREATE INDEX "rappels_termine_idx" ON "rappels" USING btree ("termine");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_unique" ON "users" USING btree ("email");