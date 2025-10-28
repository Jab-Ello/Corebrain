"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api, type Project } from "../../../lib/api";
import { getSession } from "../../../lib/session";

export default function ProjectDetailsPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const s = getSession();
    if (!s) {
      router.replace("/login");
      return;
    }

    (async () => {
      try {
        const data = await api.getProject(id);
        setProject(data);
      } catch (e: any) {
        setError(e?.message ?? "Impossible de charger le projet.");
      } finally {
        setLoading(false);
      }
    })();
  }, [id, router]);

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

  return (
    <main className="p-6">
      {/* Header avec actions */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">{project.name}</h1>
        <div className="flex items-center gap-2">
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

      {/* Project Card */}
      <div className="rounded-2xl bg-white/5 border border-white/10 p-6 shadow-lg">
        {/* Header infos */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-2">
            <span
              className="inline-block w-3 h-3 rounded-full"
              style={{ backgroundColor: project.color || "#8884d8" }}
            />
            <span className="text-xs uppercase tracking-wider text-white/60">
              {project.status}
            </span>
          </div>
          <span className="text-xs text-white/50">
            Créé le {new Date(project.createdAt).toLocaleDateString()}
          </span>
        </div>

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

        {/* Infos complémentaires */}
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
    </main>
  );
}
