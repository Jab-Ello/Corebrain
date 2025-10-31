"use client";
export const dynamic = "force-dynamic";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/session";
import { api, type ProjectNote, type Note, type NoteUpdateBody } from "@/lib/api";

type UiNote = {
  id: string;
  title: string;
  content: string;
  createdAt: string;
};

type EditState = { // NEW
  open: boolean;
  note: UiNote | null;
  saving: boolean;
  error: string | null;
};

export default function NotesPage() {
  const router = useRouter();
  const search = useSearchParams();
  const projectId = search.get("projectId") ?? undefined;

  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState<UiNote[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [edit, setEdit] = useState<EditState>({ // NEW
    open: false,
    note: null,
    saving: false,
    error: null,
  });

  useEffect(() => {
    const s = getSession();
    if (!s) {
      router.replace("/login");
      return;
    }

    (async () => {
      try {
        setLoading(true);
        if (projectId) {
          const data: ProjectNote[] = await api.getProjectNotes(projectId);
          setNotes(
            data.map(n => ({
              id: n.note_id,
              title: n.title,
              content: n.content,
              createdAt: n.createdAt,
            }))
          );
        } else {
          const s = getSession();
          if (!s) throw new Error("Session invalide.");
          const data: Note[] = await api.getUserNotes(s.userId);
          setNotes(
            data.map(n => ({
              id: n.id,
              title: n.title,
              content: n.content,
              createdAt: n.createdAt,
            }))
          );
        }
      } catch (e: any) {
        setError(e?.message ?? "Impossible de charger les notes.");
      } finally {
        setLoading(false);
      }
    })();
  }, [projectId, router]);

  // Helpers NEW
  const openEdit = (n: UiNote) =>
    setEdit({ open: true, note: { ...n }, saving: false, error: null });

  const closeEdit = () =>
    setEdit(prev => ({ ...prev, open: false, note: null, error: null }));

  const onEditField = (field: keyof UiNote, value: string) => {
    setEdit(prev => prev.note ? { ...prev, note: { ...prev.note, [field]: value } } : prev);
  };

  const saveEdit = async () => {
    if (!edit.note) return;
    try {
      setEdit(prev => ({ ...prev, saving: true, error: null }));

      // Construis un payload partiel — ici title + content (tu peux étendre à summary/pinned)
      const payload: NoteUpdateBody = {
        title: edit.note.title,
        content: edit.note.content,
      };

      const updated = await api.updateNote(edit.note.id, payload);

      // Mets à jour la liste localement (optimiste confirmé)
      setNotes(prev =>
        prev.map(n =>
          n.id === updated.id
            ? { ...n, title: updated.title, content: updated.content, createdAt: updated.createdAt }
            : n
        )
      );

      closeEdit();
    } catch (e: any) {
      setEdit(prev => ({ ...prev, error: e?.message ?? "Échec de la sauvegarde." }));
    } finally {
      setEdit(prev => ({ ...prev, saving: false }));
    }
  };

  if (loading) return <div className="p-6 text-sm text-white/70">Chargement…</div>;
  if (error) return (
    <main className="p-6">
      <div className="mb-2">
        <Link href={projectId ? `/projects/${projectId}` : "/projects"} className="text-sm underline decoration-white/30 hover:decoration-white/80">
          ← Back
        </Link>
      </div>
      <div className="text-sm text-red-300">{error}</div>
    </main>
  );

  return (
    <main className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">
          {projectId ? "Project notes" : "All notes"}
        </h1>
        <div className="flex gap-2">
          {projectId ? (
            <Link
              href={`/projects/${projectId}`}
              className="rounded-lg bg-white/10 border border-white/10 px-3 py-2 text-sm hover:bg-white/15"
            >
              ← Back to project
            </Link>
          ) : (
            <Link
              href="/projects"
              className="rounded-lg bg-white/10 border border-white/10 px-3 py-2 text-sm hover:bg-white/15"
            >
              ← Back to projects
            </Link>
          )}
        </div>
      </div>

      {notes.length === 0 ? (
        <div className="rounded-2xl bg-white/5 border border-white/10 p-6">
          <p className="text-sm text-white/70">
            {projectId ? "Aucune note liée à ce projet." : "Aucune note pour l’instant."}
          </p>
        </div>
      ) : (
        <ul className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {notes.map((n) => (
            <li key={n.id} className="rounded-xl bg-white/5 border border-white/10 p-4 flex flex-col gap-3 hover:bg-white/10 transition">
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-semibold">{n.title}</h3>
                <span className="text-xs text-white/60">
                  {new Date(n.createdAt).toLocaleDateString()}
                </span>
              </div>
              <p className="text-sm text-white/70 line-clamp-5">{n.content}</p>
              <div className="flex items-center justify-end gap-2">
                <button
                  className="rounded-lg bg-white/10 border border-white/10 px-3 py-1.5 text-xs hover:bg-white/15"
                  onClick={() => router.push(`/notes/${n.id}`)} // “View” vers page dédiée (si tu crées la route)
                >
                  View
                </button>
                <button
                  className="rounded-lg border border-white/10 px-3 py-1.5 text-xs hover:bg-white/10"
                  onClick={() => openEdit(n)} // NEW
                >
                  Edit
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* EDIT MODAL — NEW */}
      {edit.open && edit.note && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center"
        >
          <div className="absolute inset-0 bg-black/60" onClick={closeEdit} />
          <div className="relative z-10 w-full max-w-lg rounded-2xl bg-[var(--bg,#0b0b0b)] border border-white/10 p-4">
            <h2 className="text-lg font-semibold mb-3">Modifier la note</h2>

            <div className="flex flex-col gap-3">
              <label className="text-sm">
                <span className="block text-white/70 mb-1">Titre</span>
                <input
                  className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2"
                  value={edit.note.title}
                  onChange={(e) => onEditField("title", e.target.value)}
                />
              </label>

              <label className="text-sm">
                <span className="block text-white/70 mb-1">Contenu</span>
                <textarea
                  className="w-full min-h-[140px] rounded-lg bg-white/5 border border-white/10 px-3 py-2"
                  value={edit.note.content}
                  onChange={(e) => onEditField("content", e.target.value)}
                />
              </label>

              {edit.error && (
                <p className="text-xs text-red-300">{edit.error}</p>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  className="rounded-lg px-3 py-1.5 text-sm border border-white/10 hover:bg-white/10"
                  onClick={closeEdit}
                  disabled={edit.saving}
                >
                  Annuler
                </button>
                <button
                  className="rounded-lg px-3 py-1.5 text-sm bg-white/90 text-black hover:bg-white"
                  onClick={saveEdit}
                  disabled={edit.saving}
                >
                  {edit.saving ? "Enregistrement…" : "Enregistrer"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
