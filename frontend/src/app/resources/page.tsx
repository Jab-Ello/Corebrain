"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSession } from "@/lib/session";
import { api, type Note } from "@/lib/api";

type SortKey = "created_desc" | "created_asc" | "title_asc" | "title_desc" | "updated_desc" | "updated_asc";

export default function ResourcesPage() {
  const router = useRouter();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [sort, setSort] = useState<SortKey>("created_desc");

  useEffect(() => {
    const s = getSession();
    if (!s) { router.replace("/login"); return; }

    (async () => {
      try {
        setLoading(true);
        const data = await api.getUserNotes(s.userId);
        setNotes(data);
      } catch (e: any) {
        setErr(e?.message ?? "Unable to load resources.");
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  const sorted = useMemo(() => {
    const arr = notes.slice();
    const byDate = (a: string, b: string, dir: 1 | -1) => (new Date(a).getTime() - new Date(b).getTime()) * dir;
    const byTitle = (a: string, b: string, dir: 1 | -1) => a.localeCompare(b) * dir;

    switch (sort) {
      case "created_desc": arr.sort((a,b) => byDate(b.createdAt, a.createdAt, 1)); break;
      case "created_asc":  arr.sort((a,b) => byDate(a.createdAt, b.createdAt, 1)); break;
      case "updated_desc": arr.sort((a,b) => byDate(b.updatedAt, a.updatedAt, 1)); break;
      case "updated_asc":  arr.sort((a,b) => byDate(a.updatedAt, b.updatedAt, 1)); break;
      case "title_asc":    arr.sort((a,b) => byTitle(a.title, b.title, 1)); break;
      case "title_desc":   arr.sort((a,b) => byTitle(b.title, a.title, 1)); break;
    }
    return arr;
  }, [notes, sort]);

  if (loading) return <main className="p-6 text-sm text-white/70">Loading…</main>;
  if (err) return (
    <main className="p-6">
      <div className="text-sm text-red-300">{err}</div>
    </main>
  );

  return (
    <main className="p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Resources</h1>

        <div className="flex items-center gap-2">
          <label className="text-xs text-white/60" htmlFor="sort">Sort</label>
          <select
            id="sort"
            className="rounded-lg bg-white/5 border border-white/10 px-2 py-1 text-sm"
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
          >
            <option value="created_desc">Newest (created)</option>
            <option value="created_asc">Oldest (created)</option>
            <option value="updated_desc">Newest (updated)</option>
            <option value="updated_asc">Oldest (updated)</option>
            <option value="title_asc">Title A→Z</option>
            <option value="title_desc">Title Z→A</option>
          </select>
        </div>
      </div>

      {sorted.length === 0 ? (
        <div className="rounded-2xl bg-white/5 border border-white/10 p-6 text-sm text-white/70">
          No notes yet.
        </div>
      ) : (
        <ul className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {sorted.map((n) => (
            <li key={n.id} className="rounded-xl bg-white/5 border border-white/10 p-4 flex flex-col gap-3 hover:bg-white/10 transition">
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-semibold">{n.title}</h3>
                <span className="text-xs text-white/60">
                  {new Date(n.updatedAt ?? n.createdAt).toLocaleDateString()}
                </span>
              </div>
              {n.summary ? (
                <p className="text-sm text-white/70 line-clamp-4">{n.summary}</p>
              ) : (
                <p className="text-sm text-white/70 line-clamp-4">{n.content}</p>
              )}
              <div className="flex items-center justify-end gap-2">
                <Link
                  href={`/notes/${n.id}`}
                  className="rounded-lg bg-white/10 border border-white/10 px-3 py-1.5 text-xs hover:bg-white/15"
                >
                  View
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
