"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSession } from "@/lib/session";
import { api, type Area } from "@/lib/api";

export default function AreasPage() {
  const router = useRouter();
  const [areas, setAreas] = useState<Area[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // Create modal state
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [color, setColor] = useState("");

  useEffect(() => {
    const s = getSession();
    if (!s) { router.replace("/login"); return; }
    (async () => {
      try {
        setLoading(true);
        const res = await api.getAreasByUser(s.userId);
        setAreas(res);
      } catch (e: any) {
        setErr(e?.message ?? "Unable to load areas.");
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  const createArea = async () => {
    const s = getSession();
    if (!s) { router.replace("/login"); return; }
    if (!name.trim()) return;

    try {
      setSaving(true);
      const a = await api.createArea({
        user_id: s.userId,
        name: name.trim(),
        description: desc || undefined,
        color: color || undefined,
      });
      setAreas(prev => [a, ...prev]);
      setOpen(false);
      setName(""); setDesc(""); setColor("");
    } catch (e: any) {
      setErr(e?.message ?? "Create failed.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <main className="p-6 text-white/70 text-sm">Loading…</main>;
  if (err) return <main className="p-6 text-red-300 text-sm">{err}</main>;

  return (
    <main className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Areas</h1>
        <button
          className="rounded-lg bg-white/90 text-black px-3 py-2 text-sm hover:bg-white"
          onClick={() => setOpen(true)}
        >
          + New area
        </button>
      </div>

      {areas.length === 0 ? (
        <div className="rounded-2xl bg-white/5 border border-white/10 p-6 text-sm text-white/70">
          No areas yet.
        </div>
      ) : (
        <ul className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {areas
            .slice()
            .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
            .map((a) => (
              <li key={a.id} className="rounded-xl bg-white/5 border border-white/10 p-4 hover:bg-white/10 transition">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-semibold">{a.name}</h3>
                  {a.color && (
                    <span className="inline-flex h-3 w-3 rounded-full border border-white/30"
                          style={{ backgroundColor: a.color }} />
                  )}
                </div>
                {a.description && (
                  <p className="text-sm text-white/70 mt-1 line-clamp-3">{a.description}</p>
                )}
                <div className="mt-3 flex justify-end">
                  <Link
                    href={`/areas/${a.id}`}
                    className="rounded-lg border border-white/10 px-3 py-1.5 text-xs hover:bg-white/10"
                  >
                    View
                  </Link>
                </div>
              </li>
            ))}
        </ul>
      )}

      {open && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
          <div className="relative z-10 w-full max-w-lg rounded-2xl bg-[var(--bg,#0b0b0b)] border border-white/10 p-4">
            <h2 className="text-lg font-semibold mb-3">New area</h2>

            <div className="flex flex-col gap-3">
              <label className="text-sm">
                <span className="block text-white/70 mb-1">Name</span>
                <input
                  className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Health, Finances, Relationships…"
                />
              </label>
              <label className="text-sm">
                <span className="block text-white/70 mb-1">Description (optional)</span>
                <textarea
                  className="w-full min-h-[100px] rounded-lg bg-white/5 border border-white/10 px-3 py-2"
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                />
              </label>
              <label className="text-sm">
                <span className="block text-white/70 mb-1">Color (hex, optional)</span>
                <input
                  className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  placeholder="#7c3aed"
                />
              </label>

              <div className="flex justify-end gap-2 pt-2">
                <button className="rounded-lg px-3 py-1.5 text-sm border border-white/10 hover:bg-white/10"
                        onClick={() => setOpen(false)} disabled={saving}>
                  Cancel
                </button>
                <button className="rounded-lg px-3 py-1.5 text-sm bg-white/90 text-black hover:bg-white"
                        onClick={createArea} disabled={saving || !name.trim()}>
                  {saving ? "Creating…" : "Create"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
