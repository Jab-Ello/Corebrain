"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getSession } from "@/lib/session";
import { api, type ProjectCreateBody } from "../../../lib/api";
import ProjectForm from "../ProjectForm";
import Link from "next/link";

export default function NewProjectPage() {
  const router = useRouter();
  const session = getSession(); // Option B: localStorage
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate(data: ProjectCreateBody) {
    setError(null);
    try {
      setSubmitting(true);
      await api.createProject(data);
      router.push("/projects"); // retour à la liste
    } catch (e: any) {
      setError(e?.message ?? "Failed to create project.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!session) {
    return (
      <main className="p-6">
        <p className="text-sm text-red-300">Not logged in.</p>
        <Link href="/login" className="underline">Go to login</Link>
      </main>
    );
  }

  return (
    <main className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">New project</h1>
        <Link href="/projects" className="text-sm underline decoration-white/30 hover:decoration-white/80">
          Back to projects
        </Link>
      </div>

      {error && (
        <div className="mb-4 text-sm rounded-lg border border-red-500/30 bg-red-950/30 px-3 py-2">
          {error}
        </div>
      )}

      <ProjectForm onSubmit={handleCreate} userId={session.userId} submitting={submitting} />
    </main>
  );
}
