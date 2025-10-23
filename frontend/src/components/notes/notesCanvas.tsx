"use client";
import React, { useMemo, useState } from "react";

export type Note = {
  id: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: string; // ISO
};

type SortKey = "newest" | "oldest" | "tag";

export default function NotesCanvas({
  title = "Notes",
  notes = [],
  accent = "#2151ff",
  onNewNote,
}: {
  title?: string;
  notes: Note[];
  accent?: string;
  onNewNote?: () => void;
}) {
  const [query, setQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string>("All");
  const [sort, setSort] = useState<SortKey>("newest");

  const allTags = useMemo(() => {
    const s = new Set<string>();
    notes.forEach(n => n.tags.forEach(t => s.add(t)));
    return ["All", ...Array.from(s).sort()];
  }, [notes]);

  const filtered = useMemo(() => {
    let out = notes.filter(n => {
      const byTag = selectedTag === "All" || n.tags.includes(selectedTag);
      const q = query.trim().toLowerCase();
      const byQuery =
        !q ||
        n.title.toLowerCase().includes(q) ||
        n.content.toLowerCase().includes(q) ||
        n.tags.some(t => t.toLowerCase().includes(q));
      return byTag && byQuery;
    });

    if (sort === "newest") out.sort((a,b) => +new Date(b.createdAt) - +new Date(a.createdAt));
    if (sort === "oldest") out.sort((a,b) => +new Date(a.createdAt) - +new Date(b.createdAt));
    if (sort === "tag")    out.sort((a,b) => (a.tags[0]||"").localeCompare(b.tags[0]||""));

    return out;
  }, [notes, query, selectedTag, sort]);

  return (
    <div className="min-h-[60vh]">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 py-4">
        <h2 className="text-xl font-semibold text-white">{title}</h2>
        <div className="flex items-center gap-2">
          <div className="hidden sm:block">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search notes…"
              className="w-56 rounded-full bg-white/5 border border-white/10 px-4 py-2 text-sm text-gray-200 placeholder:text-gray-500 focus:outline-none focus:ring-2"
            />
          </div>
          <button
            onClick={onNewNote ?? (() => alert("TODO: open new note composer"))}
            className="rounded-full px-4 py-2 text-sm font-medium border text-white transition"
            style={{ borderColor: accent, backgroundColor: `${accent}33` }}
          >
            + New Note
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="pb-3 border-b border-white/10">
        <div className="flex items-center gap-3">
          {/* Tags (scrollable) */}
          <div className="flex-1 overflow-x-auto">
            <div className="flex items-center gap-2 min-w-max pb-1">
              {allTags.map((t) => {
                const active = selectedTag === t;
                return (
                  <button
                    key={t}
                    onClick={() => setSelectedTag(t)}
                    className={`whitespace-nowrap rounded-full px-3 py-1 text-sm border transition ${
                      active
                        ? "text-white"
                        : "text-gray-300 bg-white/5 border-white/10 hover:bg-white/10"
                    }`}
                    style={active ? { backgroundColor: `${accent}33`, borderColor: accent } : undefined}
                  >
                    {t}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sort */}
          <div className="shrink-0">
            <label className="sr-only" htmlFor="sort">Sort</label>
            <select
              id="sort"
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-gray-200 focus:outline-none focus:ring-2"
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="tag">Tag (A→Z)</option>
            </select>
          </div>
        </div>

        {/* Mobile search */}
        <div className="sm:hidden mt-3">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search notes…"
            className="w-full rounded-full bg-white/5 border border-white/10 px-4 py-2 text-sm text-gray-200 placeholder:text-gray-500 focus:outline-none focus:ring-2"
          />
        </div>
      </div>

      {/* Grid */}
      <section className="py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((n) => (
            <article
              key={n.id}
              className="group relative rounded-2xl bg-white/5 border border-white/10 p-4 shadow-sm hover:shadow-md hover:border-white/20 transition"
            >
              <h3 className="text-white font-semibold text-lg pr-16">{n.title}</h3>
              <p className="mt-1 text-gray-300 line-clamp-2">{n.content}</p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {n.tags.map((t) => (
                  <span
                    key={t}
                    className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-gray-200 border border-white/10"
                  >
                    {t}
                  </span>
                ))}
              </div>
              <time className="absolute top-4 right-4 text-xs text-gray-400">{n.createdAt}</time>
            </article>
          ))}
        </div>

        {!filtered.length && (
          <div className="text-center text-gray-400 py-20">No notes found.</div>
        )}
      </section>
    </div>
  );
}
