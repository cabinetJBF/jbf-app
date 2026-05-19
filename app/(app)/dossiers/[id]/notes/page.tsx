import { notFound } from "next/navigation";
import { count, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { noteRevisions, notes, users } from "@/lib/db/schema";
import { requireUser } from "@/lib/auth/dal";
import { NoteAddForm } from "@/components/note-add-form";
import { NoteItem } from "@/components/note-item";

type Params = Promise<{ id: string }>;
const uuidSchema = z.string().uuid();

export default async function DossierNotesPage({
  params,
}: {
  params: Params;
}) {
  const currentUser = await requireUser();
  const { id } = await params;
  const parsedId = uuidSchema.safeParse(id);
  if (!parsedId.success) notFound();

  const dossierId = parsedId.data;

  const rows = await db
    .select({
      id: notes.id,
      contenu: notes.contenu,
      createdAt: notes.createdAt,
      updatedAt: notes.updatedAt,
      auteurId: notes.auteurId,
      auteurPrenom: users.prenom,
      auteurNom: users.nom,
    })
    .from(notes)
    .innerJoin(users, eq(notes.auteurId, users.id))
    .where(eq(notes.dossierId, dossierId))
    .orderBy(desc(notes.createdAt));

  const revisionsRows = await db
    .select({
      noteId: noteRevisions.noteId,
      count: count(),
    })
    .from(noteRevisions)
    .groupBy(noteRevisions.noteId);

  const revisionsByNote = new Map<string, number>(
    revisionsRows.map((r) => [r.noteId, Number(r.count)]),
  );

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-medium text-slate-900">Notes</h2>
        <p className="mt-1 text-xs text-slate-500">
          Fil chronologique. Toute modification est tracée automatiquement.
          Seul l&apos;auteur peut modifier sa note.
        </p>
      </div>

      <NoteAddForm dossierId={dossierId} />

      {rows.length === 0 ? (
        <p className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
          Aucune note pour l&apos;instant. Ajoutez la première ci-dessus.
        </p>
      ) : (
        <ul className="space-y-3">
          {rows.map((n) => (
            <li key={n.id}>
              <NoteItem
                id={n.id}
                contenu={n.contenu}
                createdAt={
                  typeof n.createdAt === "string"
                    ? n.createdAt
                    : n.createdAt.toISOString()
                }
                updatedAt={
                  n.updatedAt
                    ? typeof n.updatedAt === "string"
                      ? n.updatedAt
                      : n.updatedAt.toISOString()
                    : null
                }
                auteur={{
                  id: n.auteurId,
                  prenom: n.auteurPrenom,
                  nom: n.auteurNom,
                }}
                currentUserId={currentUser.id}
                revisionCount={revisionsByNote.get(n.id) ?? 0}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
