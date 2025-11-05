"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { api, type Project, type ProjectCreateBody } from "@/lib/api";
import { getSession } from "@/lib/session";
import ProjectForm from "@/app/projects/ProjectForm";
import PlanningJsonPanel from "@/components/dashboard/PlanningJsonPanel";

export default function EditProjectPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const s = getSession();
    if (!s) {
      router.replace("/login");
      return;
    }
    (async () => {
      try {
        const p = await api.getProject(id);
        setProject(p);
      } catch (e: any) {
        setError(e?.message ?? "Impossible de charger le projet.");
      } finally {
        setLoading(false);
      }
    })();
  }, [id, router]);

  async function handleUpdate(data: ProjectCreateBody) {
    if (!project) return;
    setError(null);
    try {
      setSubmitting(true);
      await api.updateProject(project.id, data);
      router.push(`/projects/${project.id}`);
    } catch (e: any) {
      setError(e?.message ?? "Erreur lors de la mise à jour du projet.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading)
    return <div className="p-6 text-sm text-white/70">Chargement du projet…</div>;

  if (error || !project)
    return (
      <main className="p-6">
        <Link href="/projects" className="text-sm underline decoration-white/30 hover:decoration-white/80">
          ← Retour aux projets
        </Link>
        <div className="mt-3 text-sm text-red-300">{error ?? "Projet introuvable."}</div>
      </main>
    );

  return (
    <main className="p-6 space-y-8">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Edit Project</h1>
        <Link href={`/projects/${project.id}`} className="text-sm underline decoration-white/30 hover:decoration-white/80">
          Cancel
        </Link>
      </div>

      {error && (
        <div className="mb-4 text-sm rounded-lg border border-red-500/30 bg-red-950/30 px-3 py-2">
          {error}
        </div>
      )}

      <ProjectForm
        onSubmit={handleUpdate}
        userId={project.user_id}
        submitting={submitting}
        initialValues={{
          name: project.name,
          description: project.description ?? "",
          context: project.context ?? "",
          color: project.color ?? "",
          priority: project.priority ?? 0,
          plannedEndDate: project.plannedEndDate ?? "",
        }}
      />

      <div style={{border:'1px dashed #666', padding:6, margin:'8px 0', color:'#aaa'}}>
  DEBUG: edit page mounted
</div>

      <section className="mt-6">
        <h2 className="px-1 pb-2 text-sm font-medium text-white/60">PLANNING (N8N)</h2>
        <PlanningJsonPanel
          projectId={project.id}
          className="mt-2"
          title="Planning (JSON brut)"
          autoFetch
          collapsible
        />
      </section>
    </main>
  );
}
