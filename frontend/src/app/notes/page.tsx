"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/session";
import {
  api,
  type ProjectNote,
  type Note,
  type NoteUpdateBody,
  type AreaNote,
  type NoteCreateBody,
} from "@/lib/api";

type UiNote = {
  id: string;
  title: string;
  content: string;
  createdAt: string;
};

type EditState = {
  open: boolean;
  note: UiNote | null;
  saving: boolean;
  error: string | null;
};

type CreateState = {
  open: boolean;
  title: string;
  content: string;
  saving: boolean;
  error: string | null;
};

export default function NotesPage() {
  const router = useRouter();
  const search = useSearchParams();
  const projectId = search.get("projectId") ?? undefined;
  const areaId = search.get("areaId") ?? undefined;

  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState<UiNote[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [edit, setEdit] = useState<EditState>({
    open: false,
    note: null,
    saving: false,
    error: null,
  });

  const [create, setCreate] = useState<CreateState>({
    open: false,
    title: "",
    content: "",
    saving: false,
    error: null,
  });

  // FETCH
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
          // Notes liées à un projet
          const data: ProjectNote[] = await api.getProjectNotes(projectId);
          setNotes(
            data.map((n) => ({
              id: n.note_id,
              title: n.title,
              content: n.content,
              createdAt: n.createdAt,
            }))
          );
        } else if (areaId) {
          // Notes liées à une area
          const data: AreaNote[] = await api.getAreaNotes(areaId);
          setNotes(
            data.map((n) => ({
              id: n.note_id,
              title: n.title,
              content: n.content,
              createdAt: n.createdAt,
            }))
          );
        } else {
          // Notes utilisateur
          const data: Note[] = await api.getUserNotes(s.userId);
          setNotes(
            data.map((n) => ({
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
  }, [projectId, areaId, router]);

  // EDIT helpers
  const openEdit = (n: UiNote) =>
    setEdit({ open: true, note: { ...n }, saving: false, error: null });

  const closeEdit = () =>
    setEdit((prev) => ({ ...prev, open: false, note: null, error: null }));

  const onEditField = (field: keyof UiNote, value: string) => {
    setEdit((prev) =>
      prev.note ? { ...prev, note: { ...prev.note, [field]: value } } : prev
    );
  };

  const saveEdit = async () => {
    if (!edit.note) return;
    try {
      setEdit((prev) => ({ ...prev, saving: true, error: null }));
      const payload: NoteUpdateBody = {
        title: edit.note.title,
        content: edit.note.content,
      };
      const updated = await api.updateNote(edit.note.id, payload);

      setNotes((prev) =>
        prev.map((n) =>
          n.id === updated.id
            ? {
                ...n,
                title: updated.title,
                content: updated.content,
                createdAt: updated.createdAt,
              }
            : n
        )
      );

      closeEdit();
    } catch (e: any) {
      setEdit((prev) => ({
        ...prev,
        error: e?.message ?? "Échec de la sauvegarde.",
      }));
    } finally {
      setEdit((prev) => ({ ...prev, saving: false }));
    }
  };

  // CREATE helpers
  const openCreate = () =>
    setCreate({ open: true, title: "", content: "", saving: false, error: null });

  const closeCreate = () =>
    setCreate((prev) => ({
      ...prev,
      open: false,
      title: "",
      content: "",
      error: null,
    }));

  const saveCreate = async () => {
    const s = getSession();
    if (!s) {
      router.replace("/login");
      return;
    }

    if (!create.title.trim()) {
      setCreate((prev) => ({ ...prev, error: "Le titre est requis." }));
      return;
    }

    if (!projectId && !areaId) {
      setCreate((prev) => ({
        ...prev,
        error:
          "La création ici nécessite un projectId ou un areaId dans l’URL.",
      }));
      return;
    }

    try {
      setCreate((prev) => ({ ...prev, saving: true, error: null }));

      // Construire le payload dynamiquement selon les query params
      const payload: NoteCreateBody = {
        user_id: s.userId,
        title: create.title.trim(),
        content: create.content,
        ...(projectId ? { project_ids: [projectId] } : {}),
        ...(areaId ? { area_ids: [areaId] } : {}),
      };

      const newNote = await api.createNote(payload);

      // insérer en tête
      setNotes((prev) => [
        {
          id: newNote.id,
          title: newNote.title,
          content: newNote.content,
          createdAt: newNote.createdAt,
        },
        ...prev,
      ]);

      closeCreate();
    } catch (e: any) {
      setCreate((prev) => ({
        ...prev,
        error: e?.message ?? "Échec de la création.",
      }));
    } finally {
      setCreate((prev) => ({ ...prev, saving: false }));
    }
  };

  if (loading) return <div className="p-6 text-sm text-white/70">Chargement…</div>;
  if (error)
    return (
      <main className="p-6">
        <div className="mb-2">
          <Link
            href={
              projectId
                ? `/projects/${projectId}`
                : areaId
                ? `/areas/${areaId}`
                : "/projects"
            }
            className="text-sm underline decoration-white/30 hover:decoration-white/80"
          >
            ← Back
          </Link>
        </div>
        <div className="text-sm text-red-300">{error}</div>
      </main>
    );

  const pageTitle = projectId
    ? "Project notes"
    : areaId
    ? "Area notes"
    : "All notes";

  const backHref = projectId
    ? `/projects/${projectId}`
    : areaId
    ? `/areas/${areaId}`
    : "/projects";

  return (
    <main className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">{pageTitle}</h1>

        <div className="flex gap-2">
          {(projectId || areaId) && (
            <button
              className="rounded-lg bg-white/90 text-black px-3 py-2 text-sm hover:bg-white"
              onClick={openCreate}
            >
              + New note
            </button>
          )}
          <Link
            href={backHref}
            className="rounded-lg bg-white/10 border border-white/10 px-3 py-2 text-sm hover:bg-white/15"
          >
            ← Back
          </Link>
        </div>
      </div>

      {notes.length === 0 ? (
        <div className="rounded-2xl bg-white/5 border border-white/10 p-6">
          <p className="text-sm text-white/70">
            {projectId
              ? "Aucune note liée à ce projet."
              : areaId
              ? "Aucune note liée à cette zone."
              : "Aucune note pour l’instant."}
          </p>
        </div>
      ) : (
        <ul className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {notes.map((n) => (
            <li
              key={n.id}
              className="rounded-xl bg-white/5 border border-white/10 p-4 flex flex-col gap-3 hover:bg-white/10 transition"
            >
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
                  onClick={() => router.push(`/notes/${n.id}`)}
                >
                  View
                </button>
                <button
                  className="rounded-lg border border-white/10 px-3 py-1.5 text-xs hover:bg-white/10"
                  onClick={() => openEdit(n)}
                >
                  Edit
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* CREATE MODAL */}
      {create.open && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center"
        >
          <div className="absolute inset-0 bg-black/60" onClick={closeCreate} />
          <div className="relative z-10 w-full max-w-lg rounded-2xl bg-[var(--bg,#0b0b0b)] border border-white/10 p-4">
            <h2 className="text-lg font-semibold mb-3">
              Nouvelle note {projectId ? "dans le projet" : areaId ? "dans la zone" : ""}
            </h2>

            {!projectId && !areaId && (
              <p className="text-xs text-amber-300 mb-2">
                Ouvre cette page depuis un projet (avec <code>?projectId=…</code>) ou depuis une zone (avec <code>?areaId=…</code>).
              </p>
            )}

            <div className="flex flex-col gap-3">
              <label className="text-sm">
                <span className="block text-white/70 mb-1">Titre</span>
                <input
                  className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2"
                  value={create.title}
                  onChange={(e) =>
                    setCreate((prev) => ({ ...prev, title: e.target.value }))
                  }
                  placeholder="Ex: Kickoff recap"
                />
              </label>

              <label className="text-sm">
                <span className="block text-white/70 mb-1">Contenu</span>
                <textarea
                  className="w-full min-h-[140px] rounded-lg bg-white/5 border border-white/10 px-3 py-2"
                  value={create.content}
                  onChange={(e) =>
                    setCreate((prev) => ({ ...prev, content: e.target.value }))
                  }
                  placeholder="Notes..."
                />
              </label>

              {create.error && (
                <p className="text-xs text-red-300">{create.error}</p>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  className="rounded-lg px-3 py-1.5 text-sm border border-white/10 hover:bg-white/10"
                  onClick={closeCreate}
                  disabled={create.saving}
                >
                  Annuler
                </button>
                <button
                  className="rounded-lg px-3 py-1.5 text-sm bg-white/90 text-black hover:bg-white"
                  onClick={saveCreate}
                  disabled={create.saving || !projectId && !areaId || !create.title.trim()}
                >
                  {create.saving ? "Création…" : "Créer"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
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

              {edit.error && <p className="text-xs text-red-300">{edit.error}</p>}

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
