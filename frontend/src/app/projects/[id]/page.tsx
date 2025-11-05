// ⬅️ agent IA (adapte le chemin si besoin)
"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api, type Project } from "../../../lib/api";
import { getSession } from "../../../lib/session";
import AIAgent from "../../../components/dashboard/AiAgent";

export default function ProjectDetailsPage() {
  const router = useRouter();
  const { id: projectId } = useParams<{ id: string }>(); // ✅ ID est un string UUID

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [status, setStatus] = useState<string>("active");
  const [savingStatus, setSavingStatus] = useState(false);
  const [actionErr, setActionErr] = useState<string | null>(null);

  // 🔔 États pour le déclenchement N8N
  const [triggering, setTriggering] = useState(false);
  const [triggerMsg, setTriggerMsg] = useState<string | null>(null);

  // ------------------------------------------------------------
  // 🔹 Charger le projet
  // ------------------------------------------------------------
  useEffect(() => {
    if (!projectId) return; // 🚫 évite l'appel si ID non encore dispo

    const s = getSession();
    if (!s) {
      router.replace("/login");
      return;
    }

    (async () => {
      try {
        setLoading(true);
        const data = await api.getProject(projectId); // ✅ ID string
        setProject(data);
        setStatus(data.status ?? "active");
      } catch (e: any) {
        setError(e?.message ?? "Impossible de charger le projet.");
      } finally {
        setLoading(false);
      }
    })();
  }, [projectId, router]);

  // ------------------------------------------------------------
  // 🔹 Sauvegarder le statut
  // ------------------------------------------------------------
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

  // ------------------------------------------------------------
  // 🔹 Archiver / désarchiver
  // ------------------------------------------------------------
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

  // ------------------------------------------------------------
  // 🔔 Déclencher le workflow N8N (bouton)
  // ------------------------------------------------------------
  const triggerN8N = async () => {
    if (!project) return;
    try {
      setTriggering(true);
      setTriggerMsg(null);
      await api.triggerProjectAgent(project.id, {
        action: "analyze",   // libre : "analyze" | "summarize" | "plan" | "triage"
        max_tokens: 1200,    // limite démo si gérée côté n8n
        dry_run: false,
      });
      setTriggerMsg("Analyse lancée : N8N a bien été déclenché.");
    } catch (e: any) {
      setTriggerMsg(e?.message ?? "Échec du déclenchement N8N.");
    } finally {
      setTriggering(false);
    }
  };

  // ------------------------------------------------------------
  // 🔹 États de chargement / erreur
  // ------------------------------------------------------------
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

  // ------------------------------------------------------------
  // 🔹 Rendu principal
  // ------------------------------------------------------------
  return (
    <main className="p-6 space-y-6">
      {/* Header avec actions */}
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

      {/* Carte du projet */}
      <div className="rounded-2xl bg-white/5 border border-white/10 p-6 shadow-lg">
        {/* Header infos */}
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

            {/* Sélecteur de statut + bouton Save */}
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
                disabled={
                  savingStatus || status === (project.status ?? "active")
                }
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

        {actionErr && <p className="mb-4 text-xs text-red-300">{actionErr}</p>}

        {/* Description */}
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

        {/* Infos supplémentaires */}
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

      {/* 🔘 Bouton “Trigger N8N” au-dessus de l’agent */}
      <div className="rounded-2xl bg-white/5 border border-white/10 p-4 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="text-sm uppercase tracking-wider text-white/60">
              Workflow d’analyse
            </h3>
            <p className="text-sm text-white/80">
              Lance l’orchestrateur N8N pour analyser ce projet et ses notes liées.
            </p>
          </div>
          <button
            onClick={triggerN8N}
            disabled={triggering}
            className="w-full sm:w-auto rounded-lg bg-white/90 text-black px-4 py-2 text-sm hover:bg-white disabled:opacity-60"
          >
            {triggering ? "Lancement…" : "Déclencher l’analyse N8N"}
          </button>
        </div>
        {triggerMsg && (
          <p className="mt-3 text-xs text-white/70">{triggerMsg}</p>
        )}
      </div>

      {/* 🔹 Agent IA contextuel au projet */}
      <AIAgent projectId={project.id} />
    </main>
  );
}
