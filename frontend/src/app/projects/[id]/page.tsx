"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api, type Project } from "../../../lib/api";
import { getSession } from "../../../lib/session";
import AIAgent from "../../../components/dashboard/AiAgent";
import TodoListCard from "../../../components/dashboard/ToDoListCard";
import PlanningJsonPanel from "../../../components/dashboard/PlanningJsonPanel";

export default function ProjectDetailsPage() {
  const router = useRouter();
  const { id: projectId } = useParams<{ id: string }>();

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("active");
  const [savingStatus, setSavingStatus] = useState(false);
  const [actionErr, setActionErr] = useState<string | null>(null);
  const [triggering, setTriggering] = useState(false);
  const [triggerMsg, setTriggerMsg] = useState<string | null>(null);

  // ─── Analyse (N8N) ─────────────────────────────────────────────
  const [analysis, setAnalysis] = useState<any>(null);
  const [rawAnalysis, setRawAnalysis] = useState<any>(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [showRawAnalysis, setShowRawAnalysis] = useState(false);
  const [analysisErr, setAnalysisErr] = useState<string | null>(null);

  // ─── Conseils (Advices) ─────────────────────────────────────────
  const [advices, setAdvices] = useState<any>(null);
  const [rawAdvices, setRawAdvices] = useState<any>(null);
  const [loadingAdvices, setLoadingAdvices] = useState(false);
  const [showRawAdvices, setShowRawAdvices] = useState(false);
  const [advicesErr, setAdvicesErr] = useState<string | null>(null);

  async function fetchAnalysis() {
    try {
      setLoadingAnalysis(true);
      setAnalysisErr(null);
      const data = await api.getAgentAnalysis();
      setRawAnalysis(data);
      let parsed;
      try {
        parsed =
          typeof data?.analyse === "string"
            ? JSON.parse(data.analyse)
            : data?.analyse ?? {};
      } catch {
        parsed = {};
      }
      setAnalysis(parsed);
    } catch (e: any) {
      setAnalysisErr(e?.message ?? "Impossible de récupérer l'analyse.");
      setAnalysis(null);
    } finally {
      setLoadingAnalysis(false);
    }
  }

  async function fetchAdvices() {
    try {
      setLoadingAdvices(true);
      setAdvicesErr(null);
      const data = await api.getAgentAdvices();
      setRawAdvices(data);
      let parsed;
      try {
        parsed =
          typeof data?.advices === "string"
            ? JSON.parse(data.advices)
            : data?.advices ?? {};
      } catch {
        parsed = {};
      }
      setAdvices(parsed);
    } catch (e: any) {
      setAdvicesErr(e?.message ?? "Impossible de récupérer les conseils.");
      setAdvices(null);
    } finally {
      setLoadingAdvices(false);
    }
  }

  // ─── Chargement projet ──────────────────────────────────────────
  useEffect(() => {
    if (!projectId) return;
    const s = getSession();
    if (!s) {
      router.replace("/login");
      return;
    }
    (async () => {
      try {
        setLoading(true);
        const data = await api.getProject(projectId);
        setProject(data);
        setStatus(data.status ?? "active");
      } catch (e: any) {
        setError(e?.message ?? "Impossible de charger le projet.");
      } finally {
        setLoading(false);
      }
    })();
  }, [projectId, router]);

  // ─── Changement de statut / archive ─────────────────────────────
  const saveStatus = async () => {
    if (!project) return;
    try {
      setSavingStatus(true);
      setActionErr(null);
      const updated = await api.updateProject(project.id, { status });
      setProject(updated);
      setStatus(updated.status ?? status);
    } catch (e: any) {
      setActionErr(e?.message ?? "Échec de la mise à jour du statut.");
    } finally {
      setSavingStatus(false);
    }
  };

  const toggleArchive = async () => {
    if (!project) return;
    const target =
      (project.status || "").toLowerCase() === "archived" ? "active" : "archived";
    try {
      setSavingStatus(true);
      setActionErr(null);
      const updated = await api.updateProject(project.id, { status: target as any });
      setProject(updated);
      setStatus(updated.status ?? target);
    } catch (e: any) {
      setActionErr(e?.message ?? "Impossible de changer le statut.");
    } finally {
      setSavingStatus(false);
    }
  };

  // ─── Déclenchement N8N (analyse) ────────────────────────────────
  const triggerN8N = async () => {
    if (!project) return;
    try {
      setTriggering(true);
      setTriggerMsg(null);
      await api.triggerProjectAgent(project.id, {
        action: "analyze",
        max_tokens: 1200,
        dry_run: false,
      });
      setTriggerMsg("Analyse lancée");
    } catch (e: any) {
      setTriggerMsg(e?.message ?? "Échec du déclenchement de l'analyse");
    } finally {
      setTriggering(false);
    }
  };

  if (loading)
    return <div className="p-6 text-sm text-white/70">Chargement du projet…</div>;

  if (error || !project)
    return (
      <main className="p-6">
        <Link
          href="/projects"
          className="text-sm underline decoration-white/30 hover:decoration-white/80"
        >
          ← Retour aux projets
        </Link>
        <div className="mt-3 text-sm text-red-300">
          {error ?? "Projet introuvable."}
        </div>
      </main>
    );

  const isArchived = (project.status || "").toLowerCase() === "archived";

  return (
    <main className="p-6 space-y-6">
      {/* ─── HEADER ───────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-3xl font-bold">{project.name}</h1>

        <div className="flex items-center gap-2">
          <Link
            href={`/notes?projectId=${project.id}`}
            className="rounded-lg bg-white/10 border border-white/10 px-3 py-2 text-sm hover:bg-white/15"
          >
            Notes
          </Link>

          <button
            onClick={toggleArchive}
            disabled={savingStatus}
            className="rounded-lg bg-white/90 text-black px-3 py-2 text-sm hover:bg-white disabled:opacity-60"
          >
            {savingStatus
              ? isArchived
                ? "Reactivating…"
                : "Archiving…"
              : isArchived
              ? "Reactivate"
              : "Archive project"}
          </button>

          <Link
            href={`/projects/${project.id}/edit`}
            className="rounded-lg bg-white/10 border border-white/10 px-3 py-2 text-sm hover:bg-white/15"
          >
            Edit
          </Link>
          <Link
            href="/projects"
            className="rounded-lg bg-white/10 border border-white/10 px-3 py-2 text-sm hover:bg-white/15"
          >
            ← Back
          </Link>
        </div>
      </div>

      {/* ─── INFOS PROJET (restaurées) ───────────────────────── */}
      <div className="rounded-2xl bg-white/5 border border-white/10 p-6 shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span
                className="inline-block w-3 h-3 rounded-full"
                style={{ backgroundColor: project.color || "#8884d8" }}
              />
              <span className="text-xs uppercase tracking-wider text-white/60">
                {project.status}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <select
                className="rounded-lg bg-white/5 border border-white/10 px-2 py-1 text-xs"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                disabled={savingStatus}
              >
                <option value="active">active</option>
                <option value="archived">archived</option>
              </select>
              <button
                onClick={saveStatus}
                disabled={savingStatus || status === (project.status ?? "active")}
                className="rounded-lg border border-white/10 px-2.5 py-1.5 text-xs hover:bg-white/10 disabled:opacity-60"
              >
                {savingStatus ? "Saving…" : "Save status"}
              </button>
            </div>
          </div>

          <span className="text-xs text-white/50">
            Créé le {new Date(project.createdAt).toLocaleDateString()}
          </span>
        </div>

        <section className="mb-6">
          <h2 className="text-sm uppercase tracking-wider text-white/60 mb-2">
            Description
          </h2>
          {project.description ? (
            <p className="text-sm leading-relaxed text-white/90">
              {project.description}
            </p>
          ) : (
            <p className="text-sm italic text-white/50">
              Aucune description disponible.
            </p>
          )}
        </section>

        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="rounded-xl bg-white/5 border border-white/10 p-4">
            <div className="text-xs text-white/60 mb-1">Contexte</div>
            <div className="font-medium text-white/90">
              {project.context || "Non précisé"}
            </div>
          </div>

          <div className="rounded-xl bg-white/5 border border-white/10 p-4">
            <div className="text-xs text-white/60 mb-1">Priorité</div>
            <div className="font-medium text-white/90">{project.priority}</div>
          </div>

          <div className="rounded-xl bg-white/5 border border-white/10 p-4">
            <div className="text-xs text-white/60 mb-1">Dernière mise à jour</div>
            <div className="font-medium text-white/90">
              {new Date(project.updatedAt).toLocaleDateString()}
            </div>
          </div>

          {project.plannedEndDate && (
            <div className="rounded-xl bg-white/5 border border-white/10 p-4">
              <div className="text-xs text-white/60 mb-1">Date de fin prévue</div>
              <div className="font-medium text-white/90">
                {new Date(project.plannedEndDate).toLocaleDateString()}
              </div>
            </div>
          )}
        </section>
      </div>

      {/* ─── WORKFLOW D’ANALYSE ─────────────────────────────── */}
      <div className="rounded-2xl bg-white/5 border border-white/10 p-4 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="text-sm uppercase tracking-wider text-white/60">
              Workflow d’analyse
            </h3>
            <p className="text-sm text-white/80">
              Lancer une analyse du projet
            </p>
          </div>
          <button
            onClick={triggerN8N}
            disabled={triggering}
            className="w-full sm:w-auto rounded-lg bg-white/90 text-black px-4 py-2 text-sm hover:bg-white disabled:opacity-60"
          >
            {triggering ? "Lancement…" : "Déclencher l’analyse"}
          </button>
        </div>
        {triggerMsg && (
          <p className="mt-3 text-xs text-white/70">{triggerMsg}</p>
        )}
      </div>

      {/* ─── ANALYSE (N8N) ───────────────────────────────────── */}
      <div className="rounded-2xl bg-white/5 border border-white/10 p-4 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
          <div>
            <h3 className="text-sm uppercase tracking-wider text-white/60">
              Analyse
            </h3>
            <p className="text-sm text-white/80">
              Récupération depuis le workflow.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchAnalysis}
              disabled={loadingAnalysis}
              className="rounded-lg bg-white/90 text-black px-3 py-2 text-sm hover:bg-white disabled:opacity-60"
            >
              {loadingAnalysis ? "Rafraîchissement…" : "Rafraîchir"}
            </button>
            <button
              onClick={() => setShowRawAnalysis((s) => !s)}
              className="rounded-lg border border-white/10 px-3 py-2 text-sm hover:bg-white/10"
            >
              {showRawAnalysis ? "Masquer JSON" : "Voir JSON brut"}
            </button>
          </div>
        </div>

        {analysisErr && <p className="mb-3 text-xs text-red-300">{analysisErr}</p>}
        {!analysis && !analysisErr && (
          <p className="text-sm text-white/60">Aucune donnée d'analyse.</p>
        )}

        {analysis && !showRawAnalysis && (
          <div className="text-sm text-white/90 space-y-3">
            {analysis.project_summary && (
              <div>
                <h4 className="text-white/70 font-semibold mb-1">Résumé du projet</h4>
                <p>{analysis.project_summary}</p>
              </div>
            )}
            {analysis.objectives && (
              <div>
                <h4 className="text-white/70 font-semibold mb-1">Objectifs</h4>
                <p>{analysis.objectives}</p>
              </div>
            )}
            {analysis.key_context && (
              <div>
                <h4 className="text-white/70 font-semibold mb-1">Contexte clé</h4>
                <p>{analysis.key_context}</p>
              </div>
            )}
            {analysis.unknowns && (
              <div>
                <h4 className="text-white/70 font-semibold mb-1">Points inconnus</h4>
                <ul className="list-disc pl-5 text-white/80">
                  {Array.isArray(analysis.unknowns)
                    ? analysis.unknowns.map((u: string, i: number) => (
                        <li key={i}>{u}</li>
                      ))
                    : Object.values(analysis.unknowns).map((v: any, i: number) => (
                        <li key={i}>{String(v)}</li>
                      ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {showRawAnalysis && (
          <pre className="mt-3 text-xs whitespace-pre-wrap break-words bg-black/30 rounded-lg p-3 border border-white/10">
{JSON.stringify(rawAnalysis, null, 2)}
          </pre>
        )}
      </div>

      {/* ─── TO-DO ───────────────────────────────────────────── */}
      <TodoListCard projectId={project.id} />

      {/* ─── CONSEILS (ADVICES) ─────────────────────────────── */}
      <div className="rounded-2xl bg-white/5 border border-white/10 p-4 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
          <div>
            <h3 className="text-sm uppercase tracking-wider text-white/60">
              Conseils (Advices)
            </h3>
            <p className="text-sm text-white/80">Liste des derniers conseils</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchAdvices}
              disabled={loadingAdvices}
              className="rounded-lg bg-white/90 text-black px-3 py-2 text-sm hover:bg-white disabled:opacity-60"
            >
              {loadingAdvices ? "Rafraîchissement…" : "Rafraîchir"}
            </button>
            <button
              onClick={() => setShowRawAdvices((s) => !s)}
              className="rounded-lg border border-white/10 px-3 py-2 text-sm hover:bg-white/10"
            >
              {showRawAdvices ? "Masquer JSON" : "Voir JSON brut"}
            </button>
          </div>
        </div>

        {advicesErr && <p className="mb-3 text-xs text-red-300">{advicesErr}</p>}
        {!advices && !advicesErr && (
          <p className="text-sm text-white/60">Aucun conseil disponible.</p>
        )}

        {advices && !showRawAdvices && (
          <div className="text-sm text-white/90 space-y-3">
            {advices.summary && (
              <div>
                <h4 className="text-white/70 font-semibold mb-1">Résumé</h4>
                <p>{advices.summary}</p>
              </div>
            )}
            {advices.next_steps && Array.isArray(advices.next_steps) && (
              <div>
                <h4 className="text-white/70 font-semibold mb-1">Prochaines étapes</h4>
                <ul className="list-disc pl-5 text-white/80">
                  {advices.next_steps.map((step: string, i: number) => (
                    <li key={i}>{step}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {showRawAdvices && (
          <pre className="mt-3 text-xs whitespace-pre-wrap break-words bg-black/30 rounded-lg p-3 border border-white/10">
{JSON.stringify(rawAdvices, null, 2)}
          </pre>
        )}
      </div>

      {/* ───AI ──── */}
      <AIAgent projectId={project.id} />
    </main>
  );
}
