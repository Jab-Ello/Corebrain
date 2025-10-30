"use client";

import { useEffect, useState } from "react";
import { api, Project } from "@/lib/api";
import { getSession } from "@/lib/session";
import Link from "next/link";

export default function ProjectsPage() {
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const s = getSession();
    if (!s) {
      setError("Non connecté. Redirection vers /login…");
      // tu peux aussi router.replace("/login") si tu veux forcer
      return;
    }

    (async () => {
      try {
        const data = await api.getProjectsByUser(s.userId);
        setProjects(data);
      } catch (e: any) {
        setError(e?.message ?? "Impossible de charger les projets.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return <div className="p-6 text-sm text-white/70">Chargement des projets…</div>;
  }
  if (error) {
    return <div className="p-6 text-sm text-red-300">{error}</div>;
  }

  return (
    <main className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Projects</h1>
        <Link
          href="/projects/new"
          className="rounded-lg bg-white/10 border border-white/10 px-3 py-2 text-sm hover:bg-white/15"
        >
          + New project
        </Link>
      </div>

      {projects.length === 0 ? (
        <p className="text-white/70">Aucun projet pour l’instant.</p>
      ) : (
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {projects.map((p) => (
            <li
              key={p.id}
              className="rounded-xl bg-white/5 border border-white/10 p-4 hover:bg-white/10 transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <h3 className="font-semibold">{p.name}</h3>
                  <span className="text-xs px-2 py-0.5 rounded bg-white/10 border border-white/10">
                    {p.status}
                  </span>
                </div>

                {p.description && (
                  <p className="text-sm text-white/70 mt-1 line-clamp-3">{p.description}</p>
                )}

                <div className="mt-3 flex gap-2 text-xs text-white/60">
                  <span>Priority: {p.priority}</span>
                  <span>•</span>
                  <span>{new Date(p.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-4 flex items-center justify-between">
                <Link
                  href={`/projects/${p.id}`}
                  className="text-sm underline decoration-white/30 hover:decoration-white/80"
                >
                  View details
                </Link>
                <Link
                  href={`/notes?projectId=${p.id}`}
                  className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold
                            bg-sky-500 text-black/90 hover:bg-sky-400
                            border border-white/10 shadow-sm transition
                            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300"
                >
                  🧠 View related notes
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
