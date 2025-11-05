"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import clsx from "clsx";

type PlanningJsonPanelProps = {
  projectId: string;
  className?: string;
  title?: string;
  autoFetch?: boolean;
  collapsible?: boolean;
};

export default function PlanningJsonPanel({
  projectId,
  className,
  title = "Planning (JSON brut)",
  autoFetch = true,
  collapsible = true,
}: PlanningJsonPanelProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(true);

  async function fetchPlanning() {
    if (!projectId) return;
    setError(null);
    setLoading(true);
    try {
      const payload = await api.getProjectPlanning(projectId);
      setData(payload ?? null);
    } catch (e: any) {
      setError(e?.message ?? "Impossible de récupérer le planning.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (autoFetch && projectId) fetchPlanning();
  }, [autoFetch, projectId]);

  async function copyToClipboard() {
    if (!data) return;
    await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
  }

  const Container: React.ElementType = collapsible ? "section" : "div";

  return (
    <Container className={clsx("rounded-xl border border-white/10 bg-white/[0.03]", className)}>
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          {collapsible && (
            <button
              onClick={() => setOpen(v => !v)}
              className="text-white/60 hover:text-white/90"
              aria-label={open ? "Replier" : "Déplier"}
            >
              {open ? "▾" : "▸"}
            </button>
          )}
          <h2 className="text-sm font-semibold text-white/90">{title}</h2>
          <span className="ml-2 text-[11px] text-white/40">(lecture seule)</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchPlanning}
            disabled={loading}
            className="text-xs rounded-md border border-white/10 px-3 py-1 hover:bg-white/5 disabled:opacity-50"
          >
            {loading ? "Rafraîchissement…" : "Rafraîchir"}
          </button>
          <button
            onClick={copyToClipboard}
            disabled={!data}
            className="text-xs rounded-md border border-white/10 px-3 py-1 hover:bg-white/5 disabled:opacity-50"
          >
            Copier
          </button>
        </div>
      </div>

      {open && (
        <div className="p-3">
          {error && (
            <div className="mb-3 text-sm rounded-lg border border-red-500/30 bg-red-950/30 px-3 py-2">
              {error}
            </div>
          )}
          {!error && !loading && !data && (
            <div className="text-sm text-white/60">Aucune donnée de planning.</div>
          )}
          {!error && loading && <div className="text-sm text-white/60">Chargement…</div>}
          {!error && data && (
            <pre className="max-h-[420px] overflow-auto rounded-lg bg-black/50 p-3 text-[11.5px] leading-relaxed text-white/80">
{JSON.stringify(data, null, 2)}
            </pre>
          )}
        </div>
      )}
    </Container>
  );
}
