"use client";
import { useEffect, useRef, useState } from "react";

export type NewNotePayload = {
  title: string;
  content: string;
  tags: string[];
};

export default function NewNoteModal({
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
  presetTags?: string[]; // ex: ["Project","Ideas"]
}) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState<string[]>(presetTags);
  const [tagInput, setTagInput] = useState("");
  const dialogRef = useRef<HTMLDivElement>(null);

  // Reset quand on ouvre
  useEffect(() => {
    if (open) {
      setTitle("");
      setContent("");
      setTags(presetTags);
      setTagInput("");
    }
  }, [open, presetTags]);

  // Fermeture par ESC / backdrop
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const addTag = () => {
    const t = tagInput.trim();
    if (!t) return;
    if (!tags.includes(t)) setTags(prev => [...prev, t]);
    setTagInput("");
  };

  const removeTag = (t: string) => {
    setTags(prev => prev.filter(x => x !== t));
  };

  const submit = () => {
    if (!title.trim() && !content.trim()) return; // évite note vide
    onSave({ title: title.trim(), content: content.trim(), tags });
    onClose();
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      aria-modal="true"
      role="dialog"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Dialog */}
      <div
        ref={dialogRef}
        className="relative w-full max-w-2xl rounded-2xl bg-[#121316] text-gray-100 border border-white/10 shadow-xl"
      >
        <div className="px-6 pt-6">
          <h2 className="text-2xl font-semibold text-white text-center mb-4">
            Create New Note
          </h2>

          {/* Title */}
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title"
            className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-gray-200 placeholder:text-gray-500 focus:outline-none focus:ring-2 mb-3"
          />

          {/* Tags row: selected + input */}
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

            {/* Add tag input + button */}
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

        {/* Optional AI button (cosmetic) */}
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
