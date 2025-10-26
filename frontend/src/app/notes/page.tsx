'use client';
export const dynamic = 'force-dynamic'; // évite les erreurs de prerender

import { useMemo, useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import NotesCanvas, { Note } from "../../components/notes/notesCanvas";
import NotesTabs, { Scope } from "../../components/notes/notesTab";

type NewNotePayload = { title: string; content: string; tags: string[] };

const DATA_INIT: Record<Scope, Note[]> = {
  projects: [
    { id: "p1", title: "Kickoff", content: "Timeline & milestones…", tags: ["Meetings"], createdAt: "2025-10-12" },
    { id: "p2", title: "UX Ideas", content: "Blue accent audit…", tags: ["Design"], createdAt: "2025-10-10" },
  ],
  areas: [
    { id: "a1", title: "Area Vision", content: "North star & principles…", tags: ["Reflections"], createdAt: "2025-10-08" },
  ],
  resources: [
    { id: "r1", title: "Paper highlights", content: "Agentic systems notes…", tags: ["Research"], createdAt: "2025-10-07" },
  ],
  archives: [
    { id: "x1", title: "Retro", content: "What went well…", tags: ["Reflections"], createdAt: "2025-09-29" },
  ],
};

function NewNoteModal({
  open,
  onClose,
  onSave,
  accent = "#2151ff",
  presetTags = [],
}: {
  open: boolean;
  onClose: () => void;
  onSave: (note: NewNotePayload) => void;
  accent?: string;
  presetTags?: string[];
}) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState<string[]>(presetTags);
  const [tagInput, setTagInput] = useState("");
  const dialogRef = useRef<HTMLDivElement>(null);

  // reset à l'ouverture
  useEffect(() => {
    if (open) {
      setTitle("");
      setContent("");
      setTags(presetTags);
      setTagInput("");
    }
  }, [open, presetTags]);

  // fermer par ESC
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const addTag = () => {
    const t = tagInput.trim();
    if (!t) return;
    if (!tags.includes(t)) setTags((prev) => [...prev, t]);
    setTagInput("");
  };

  const removeTag = (t: string) => {
    setTags((prev) => prev.filter((x) => x !== t));
  };

  const submit = () => {
    if (!title.trim() && !content.trim()) return; // empêche une note vide
    onSave({ title: title.trim(), content: content.trim(), tags });
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Dialog */}
      <div
        ref={dialogRef}
        className="relative w-full max-w-2xl rounded-2xl bg-[#121316] text-gray-100 border border-white/10 shadow-xl"
      >
        <div className="px-6 pt-6">
          <h2 className="text-2xl font-semibold text-white text-center mb-4">Create New Note</h2>

          {/* Title */}
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title"
            className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-gray-200 placeholder:text-gray-500 focus:outline-none focus:ring-2 mb-3"
          />

          {/* Tags */}
          <div className="flex flex-wrap items-center gap-2 mb-3">
            {tags.map((t) => (
              <span
                key={t}
                className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm text-white border"
                style={{ backgroundColor: `${accent}33`, borderColor: accent }}
              >
                {t}
                <button
                  type="button"
                  className="opacity-80 hover:opacity-100"
                  onClick={() => removeTag(t)}
                  aria-label={`Remove ${t}`}
                >
                  ×
                </button>
              </span>
            ))}
            <div className="flex items-center gap-2">
              <input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                placeholder="+ Add Tag"
                className="rounded-full bg-white/5 border border-white/10 px-3 py-1.5 text-sm text-gray-200 placeholder:text-gray-500 focus:outline-none focus:ring-2"
              />
              <button
                type="button"
                onClick={addTag}
                className="rounded-full px-3 py-1.5 text-sm font-medium border text-white transition"
                style={{ borderColor: accent, backgroundColor: `${accent}33` }}
              >
                Add
              </button>
            </div>
          </div>

          {/* Content */}
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write your note here…"
            className="w-full min-h-[180px] rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-gray-200 placeholder:text-gray-500 focus:outline-none focus:ring-2"
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-5">
          <button
            onClick={onClose}
            className="rounded-full px-4 py-2 text-sm border border-white/15 text-gray-200 hover:bg-white/5"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            className="rounded-full px-4 py-2 text-sm font-medium text-white"
            style={{ backgroundColor: accent }}
          >
            Save Note
          </button>
        </div>

        {/* Bouton AI (cosmétique pour plus tard) */}
        <button
          type="button"
          className="absolute bottom-5 right-5 w-9 h-9 rounded-full flex items-center justify-center text-white"
          title="AI assist (coming soon)"
          style={{ backgroundColor: accent }}
        >
          💡
        </button>
      </div>
    </div>
  );
}

export default function GlobalNotesPage() {
  const sp = useSearchParams();
  const initialTab = (sp.get("tab") as Scope) || "projects";

  // État des notes par scope (mutable)
  const [data, setData] = useState<Record<Scope, Note[]>>(DATA_INIT);
  const [scope, setScope] = useState<Scope>(initialTab);

  // Modal
  const [open, setOpen] = useState(false);

  const notes = useMemo(() => data[scope] ?? [], [data, scope]);

  const handleSave = (payload: NewNotePayload) => {
    const newNote: Note = {
      id: (crypto as any).randomUUID?.() || String(Date.now()),
      title: payload.title || "Untitled",
      content: payload.content || "",
      tags: payload.tags,
      createdAt: new Date().toISOString().slice(0, 10),
    };
    setData((prev) => ({ ...prev, [scope]: [newNote, ...(prev[scope] || [])] }));
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8 py-6">
        <header className="mb-2">
          <h1 className="text-2xl font-semibold text-white">Notes</h1>
          <p className="text-sm text-gray-400">
            Browse notes across Projects, Areas, Resources, or Archives.
          </p>
        </header>

        <NotesTabs initial={initialTab} onChange={(s: Scope) => setScope(s)} />

        <NotesCanvas
          title={`${scope.charAt(0).toUpperCase() + scope.slice(1)} Notes`}
          notes={notes}
          onNewNote={() => setOpen(true)}   // ouvre le modal
        />
      </div>

      <NewNoteModal
        open={open}
        onClose={() => setOpen(false)}
        onSave={handleSave}
        presetTags={[scope.charAt(0).toUpperCase() + scope.slice(1)]} // ex: "Projects"
        accent="#2151ff"
      />
    </div>
  );
}
