"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, type ProjectTodo } from "@/lib/api";

type Props = { projectId: string; title?: string };

export default function TodoListCard({ projectId, title = "Todos (N8N)" }: Props) {
  const [todos, setTodos] = useState<ProjectTodo[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [showRaw, setShowRaw] = useState(false);

  const fetchTodos = async () => {
    try {
      setLoading(true);
      setErr(null);
      const data = await api.getProjectTodos(projectId);
      const normalized = (Array.isArray(data) ? data : []).map((t, i) => ({
        id: t.id ?? String(i),
        title: t.title ?? "Sans titre",
        done: !!t.done,
        dueDate: t.dueDate ?? null,
        priority: (t.priority as ProjectTodo["priority"]) ?? "medium",
        noteId: t.noteId ?? null,
      })) as ProjectTodo[];
      setTodos(normalized);
    } catch (e: any) {
      setErr(e?.message ?? "Impossible de récupérer les todos.");
      setTodos(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!projectId) return;
    fetchTodos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  return (
    <div className="rounded-2xl bg-white/5 border border-white/10 p-4 shadow-lg">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
        <div>
          <h3 className="text-sm uppercase tracking-wider text-white/60">{title}</h3>
          <p className="text-sm text-white/80">Récupération depuis le workflow N8N (via backend).</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchTodos}
            disabled={loading}
            className="rounded-lg bg-white/90 text-black px-3 py-2 text-sm hover:bg-white disabled:opacity-60"
          >
            {loading ? "Rafraîchissement…" : "Rafraîchir"}
          </button>
          <button
            onClick={() => setShowRaw((s) => !s)}
            className="rounded-lg border border-white/10 px-3 py-2 text-sm hover:bg-white/10"
          >
            {showRaw ? "Masquer JSON" : "Voir JSON brut"}
          </button>
        </div>
      </div>

      {err && <p className="mb-3 text-xs text-red-300">{err}</p>}

      {!todos && !err && <p className="text-sm text-white/60">Aucune donnée pour l’instant.</p>}

      {todos && !showRaw && (
        <ul className="space-y-2">
          {todos.map((t) => (
            <li
              key={t.id}
              className="flex items-center justify-between gap-3 rounded-xl bg-white/5 border border-white/10 px-3 py-2"
            >
              <div className="flex items-center gap-3 min-w-0">
                <input
                  type="checkbox"
                  checked={t.done}
                  readOnly
                  className="h-4 w-4 rounded border-white/20 bg-transparent"
                />
                <div className="min-w-0">
                  <div className="truncate">
                    <span className={t.done ? "line-through text-white/50" : "text-white/90"}>
                      {t.title}
                    </span>
                  </div>
                  <div className="text-xs text-white/50 mt-0.5 flex gap-3">
                    {t.priority && <span>prio: {t.priority}</span>}
                    {t.dueDate && <span>due: {new Date(t.dueDate).toLocaleDateString()}</span>}
                    {t.noteId && (
                      <Link
                        href={`/notes?noteId=${t.noteId}`}
                        className="underline decoration-white/30 hover:decoration-white/80"
                      >
                        ouvrir la note
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {todos && showRaw && (
        <pre className="mt-3 text-xs whitespace-pre-wrap break-words bg-black/30 rounded-lg p-3 border border-white/10">
{JSON.stringify(todos, null, 2)}
        </pre>
      )}
    </div>
  );
}
