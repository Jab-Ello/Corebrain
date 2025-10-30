"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/session";
import { api, type ProjectNote, type Note } from "@/lib/api";

type UiNote = {
  id: string;
  title: string;
  content: string;
  createdAt: string;
};

export default function NotesPage() {
  const router = useRouter();
  const search = useSearchParams();
  const projectId = search.get("projectId") ?? undefined;

  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState<UiNote[]>([]);
  const [error, setError] = useState<string | null>(null);

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
          // Notes depuis /projects/{id}/notes (ProjectNote -> UiNote)
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
          // Notes utilisateur depuis /notes/user/{user_id} (Note -> UiNote)
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
                {/* Placeholders d’actions; on branchera plus tard */}
                <button className="rounded-lg bg-white/10 border border-white/10 px-3 py-1.5 text-xs hover:bg-white/15">
                  View
                </button>
                <button className="rounded-lg border border-white/10 px-3 py-1.5 text-xs hover:bg-white/10">
                  Edit
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
