"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSession } from "@/lib/session";
import { api, type Project } from "@/lib/api";

export default function ArchivesPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    const s = getSession();
    if (!s) { router.replace("/login"); return; }
    (async () => {
      try {
        setLoading(true);
        const data = await api.getProjectsByUser(s.userId);
        setProjects(data);
      } catch (e: any) {
        setErr(e?.message ?? "Unable to load archived projects.");
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  // quels statuts considérer comme "archivés/achevés"
  const isArchived = (status?: string | null) => {
    const v = (status || "").toLowerCase();
    return v === "archived" || v === "achevé" || v === "acheve" || v === "completed" || v === "done";
  };

  const archived = useMemo(
    () => projects.filter(p => isArchived(p.status)),
    [projects]
  );

  const reactivate = async (projectId: string) => {
    try {
      setSavingId(projectId);
      const updated = await api.updateProject(projectId, { status: "active" as any });
      setProjects(prev => prev.map(p => (p.id === projectId ? { ...p, status: String((updated as any).status) } : p)));
    } catch (e: any) {
      setErr(e?.message ?? "Failed to reactivate project.");
    } finally {
      setSavingId(null);
    }
  };

  if (loading) return <main className="p-6 text-sm text-white/70">Loading…</main>;
  if (err) return <main className="p-6 text-sm text-red-300">{err}</main>;

  return (
    <main className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Archives</h1>
        <Link
          href="/projects"
          className="rounded-lg bg-white/10 border border-white/10 px-3 py-2 text-sm hover:bg-white/15"
        >
          ← Back to projects
        </Link>
      </div>

      {archived.length === 0 ? (
        <div className="rounded-2xl bg-white/5 border border-white/10 p-6 text-sm text-white/70">
          No archived projects yet.
        </div>
      ) : (
        <ul className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {archived
            .slice()
            .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
            .map((p) => (
              <li key={p.id} className="rounded-xl bg-white/5 border border-white/10 p-4 hover:bg-white/10 transition">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-semibold">{p.name}</h3>
                  <span className="text-[10px] uppercase tracking-wide text-white/60">Archived</span>
                </div>
                {p.description && (
                  <p className="text-sm text-white/70 mt-1 line-clamp-3">{p.description}</p>
                )}
                <div className="text-xs text-white/50 mt-1">
                  Updated {new Date(p.updatedAt).toLocaleDateString()}
                </div>

                <div className="mt-3 flex justify-end gap-2">
                  <Link
                    href={`/projects/${p.id}`}
                    className="rounded-lg border border-white/10 px-3 py-1.5 text-xs hover:bg-white/10"
                  >
                    View
                  </Link>
                  <button
                    className="rounded-lg bg-white/90 text-black px-3 py-1.5 text-xs hover:bg-white disabled:opacity-60"
                    onClick={() => reactivate(p.id)}
                    disabled={savingId === p.id}
                  >
                    {savingId === p.id ? "Reactivating…" : "Reactivate"}
                  </button>
                </div>
              </li>
            ))}
        </ul>
      )}
    </main>
  );
}
