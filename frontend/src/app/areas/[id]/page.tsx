"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { getSession } from "@/lib/session";
import {
  api,
  type Area,
  type AreaNote,
  type NoteCreateBody,
  type NoteUpdateBody,
} from "@/lib/api";

type UiNote = {
  id: string;        
  title: string;
  content: string;
  createdAt: string; 
};

export default function AreaDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [area, setArea] = useState<Area | null>(null);
  const [notes, setNotes] = useState<UiNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [editAreaOpen, setEditAreaOpen] = useState(false);
  const [ename, setEName] = useState("");
  const [edesc, setEDesc] = useState("");
  const [ecolor, setEColor] = useState("");
  const [savingArea, setSavingArea] = useState(false);

  const [createOpen, setCreateOpen] = useState(false);
  const [ntitle, setNTitle] = useState("");
  const [ncontent, setNContent] = useState("");
  const [savingNote, setSavingNote] = useState(false);

  const [noteEditOpen, setNoteEditOpen] = useState(false);
  const [editing, setEditing] = useState<UiNote | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  useEffect(() => {
    const s = getSession();
    if (!s) { router.replace("/login"); return; }
    (async () => {
      try {
        setLoading(true);
        const [a, ns] = await Promise.all([
          api.getArea(id),
          api.getAreaNotes(id),
        ]);
        setArea(a);
        setNotes(
          ns.map((n: AreaNote) => ({
            id: n.note_id,
            title: n.title,
            content: n.content,
            createdAt: n.createdAt,
          }))
        );
      } catch (e: any) {
        setErr(e?.message ?? "Unable to load area.");
      } finally {
        setLoading(false);
      }
    })();
  }, [id, router]);

  const openEditArea = () => {
    if (!area) return;
    setEName(area.name);
    setEDesc(area.description ?? "");
    setEColor(area.color ?? "");
    setEditAreaOpen(true);
  };

  const saveEditArea = async () => {
    try {
      setSavingArea(true);
      const updated = await api.updateArea(id, {
        name: ename || undefined,
        description: edesc || undefined,
        color: ecolor || undefined,
      });
      setArea(updated);
      setEditAreaOpen(false);
    } catch (e: any) {
      setErr(e?.message ?? "Update failed.");
    } finally {
      setSavingArea(false);
    }
  };

  const createNoteInArea = async () => {
    const s = getSession();
    if (!s) { router.replace("/login"); return; }
    if (!ntitle.trim()) return;

    try {
      setSavingNote(true);
      const payload: NoteCreateBody = {
        user_id: s.userId,
        title: ntitle.trim(),
        content: ncontent,
        area_ids: [id],
      };
      const note = await api.createNote(payload);
      setNotes(prev => [
        { id: note.id, title: note.title, content: note.content, createdAt: note.createdAt },
        ...prev,
      ]);
      setCreateOpen(false);
      setNTitle(""); setNContent("");
    } catch (e: any) {
      setErr(e?.message ?? "Create note failed.");
    } finally {
      setSavingNote(false);
    }
  };

  const openEditNote = (n: UiNote) => {
    setEditing({ ...n });
    setEditError(null);
    setNoteEditOpen(true);
  };

  const closeEditNote = () => {
    setNoteEditOpen(false);
    setEditing(null);
    setEditError(null);
  };

  const onEditField = (field: keyof UiNote, value: string) => {
    setEditing(prev => (prev ? { ...prev, [field]: value } : prev));
  };

  const saveEditNote = async () => {
    if (!editing) return;
    try {
      setSavingEdit(true);
      setEditError(null);

      const payload: NoteUpdateBody = {
        title: editing.title,
        content: editing.content,
      };
      const updated = await api.updateNote(editing.id, payload);

      setNotes(prev =>
        prev.map(n =>
          n.id === updated.id
            ? { ...n, title: updated.title, content: updated.content, createdAt: updated.createdAt }
            : n
        )
      );

      closeEditNote();
    } catch (e: any) {
      setEditError(e?.message ?? "Échec de la sauvegarde.");
    } finally {
      setSavingEdit(false);
    }
  };

  if (loading) return <main className="p-6 text-white/70 text-sm">Loading…</main>;
  if (err) return <main className="p-6 text-red-300 text-sm">{err}</main>;
  if (!area) return <main className="p-6 text-white/70 text-sm">Area not found.</main>;

  return (
    <main className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <Link href="/areas" className="text-sm underline decoration-white/30 hover:decoration-white/80">← Back to areas</Link>
          <h1 className="text-2xl font-bold mt-2">{area.name}</h1>
          <div className="text-xs text-white/60 mt-1">
            Created {new Date(area.createdAt).toLocaleString()} • Updated {new Date(area.updatedAt).toLocaleString()}
          </div>
        </div>
        <div className="flex gap-2">
          <button
            className="rounded-lg border border-white/10 px-3 py-2 text-sm hover:bg-white/10"
            onClick={openEditArea}
          >
            Edit area
          </button>
          <button
            className="rounded-lg bg-white/90 text-black px-3 py-2 text-sm hover:bg-white"
            onClick={() => setCreateOpen(true)}
          >
            + New note
          </button>
        </div>
      </div>

      {area.description && (
        <p className="text-sm text-white/70 mb-4">{area.description}</p>
      )}

      {notes.length === 0 ? (
        <div className="rounded-2xl bg-white/5 border border-white/10 p-6 text-sm text-white/70">
          No notes in this area yet.
        </div>
      ) : (
        <ul className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {notes.map((n) => (
            <li key={n.id} className="rounded-xl bg-white/5 border border-white/10 p-4 hover:bg-white/10 transition">
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-semibold">{n.title}</h3>
                <span className="text-xs text-white/60">
                  {new Date(n.createdAt).toLocaleDateString()}
                </span>
              </div>
              <p className="text-sm text-white/70 line-clamp-5">{n.content}</p>
              <div className="mt-3 flex justify-end gap-2">
                <Link
                  className="rounded-lg bg-white/10 border border-white/10 px-3 py-1.5 text-xs hover:bg-white/15"
                  href={`/notes/${n.id}`}
                >
                  View
                </Link>
                <button
                  className="rounded-lg border border-white/10 px-3 py-1.5 text-xs hover:bg-white/10"
                  onClick={() => openEditNote(n)}
                >
                  Edit
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* EDIT AREA MODAL */}
      {editAreaOpen && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => setEditAreaOpen(false)} />
          <div className="relative z-10 w-full max-w-lg rounded-2xl bg-[var(--bg,#0b0b0b)] border border-white/10 p-4">
            <h2 className="text-lg font-semibold mb-3">Edit area</h2>
            <div className="flex flex-col gap-3">
              <label className="text-sm">
                <span className="block text-white/70 mb-1">Name</span>
                <input className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2"
                       value={ename} onChange={(e) => setEName(e.target.value)} />
              </label>
              <label className="text-sm">
                <span className="block text-white/70 mb-1">Description</span>
                <textarea className="w-full min-h-[100px] rounded-lg bg-white/5 border border-white/10 px-3 py-2"
                          value={edesc} onChange={(e) => setEDesc(e.target.value)} />
              </label>
              <label className="text-sm">
                <span className="block text-white/70 mb-1">Color (hex)</span>
                <input className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2"
                       value={ecolor} onChange={(e) => setEColor(e.target.value)} placeholder="#7c3aed" />
              </label>

              <div className="flex justify-end gap-2 pt-2">
                <button className="rounded-lg px-3 py-1.5 text-sm border border-white/10 hover:bg-white/10"
                        onClick={() => setEditAreaOpen(false)} disabled={savingArea}>
                  Cancel
                </button>
                <button className="rounded-lg px-3 py-1.5 text-sm bg-white/90 text-black hover:bg-white"
                        onClick={saveEditArea} disabled={savingArea}>
                  {savingArea ? "Saving…" : "Save"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {createOpen && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => setCreateOpen(false)} />
          <div className="relative z-10 w-full max-w-lg rounded-2xl bg-[var(--bg,#0b0b0b)] border border-white/10 p-4">
            <h2 className="text-lg font-semibold mb-3">New note in this area</h2>
            <div className="flex flex-col gap-3">
              <label className="text-sm">
                <span className="block text-white/70 mb-1">Title</span>
                <input className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2"
                       value={ntitle} onChange={(e) => setNTitle(e.target.value)} placeholder="Ex: Monthly review" />
              </label>
              <label className="text-sm">
                <span className="block text-white/70 mb-1">Content</span>
                <textarea className="w-full min-h-[140px] rounded-lg bg-white/5 border border-white/10 px-3 py-2"
                          value={ncontent} onChange={(e) => setNContent(e.target.value)} />
              </label>

              <div className="flex justify-end gap-2 pt-2">
                <button className="rounded-lg px-3 py-1.5 text-sm border border-white/10 hover:bg-white/10"
                        onClick={() => setCreateOpen(false)} disabled={savingNote}>
                  Cancel
                </button>
                <button className="rounded-lg px-3 py-1.5 text-sm bg-white/90 text-black hover:bg-white"
                        onClick={createNoteInArea} disabled={savingNote || !ntitle.trim()}>
                  {savingNote ? "Creating…" : "Create note"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {noteEditOpen && editing && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={closeEditNote} />
          <div className="relative z-10 w-full max-w-lg rounded-2xl bg-[var(--bg,#0b0b0b)] border border-white/10 p-4">
            <h2 className="text-lg font-semibold mb-3">Modifier la note</h2>

            <div className="flex flex-col gap-3">
              <label className="text-sm">
                <span className="block text-white/70 mb-1">Titre</span>
                <input
                  className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2"
                  value={editing.title}
                  onChange={(e) => onEditField("title", e.target.value)}
                />
              </label>

              <label className="text-sm">
                <span className="block text-white/70 mb-1">Contenu</span>
                <textarea
                  className="w-full min-h-[140px] rounded-lg bg-white/5 border border-white/10 px-3 py-2"
                  value={editing.content}
                  onChange={(e) => onEditField("content", e.target.value)}
                />
              </label>

              {editError && <p className="text-xs text-red-300">{editError}</p>}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  className="rounded-lg px-3 py-1.5 text-sm border border-white/10 hover:bg-white/10"
                  onClick={closeEditNote}
                  disabled={savingEdit}
                >
                  Annuler
                </button>
                <button
                  className="rounded-lg px-3 py-1.5 text-sm bg-white/90 text-black hover:bg-white"
                  onClick={saveEditNote}
                  disabled={savingEdit}
                >
                  {savingEdit ? "Enregistrement…" : "Enregistrer"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
