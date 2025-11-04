"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Card from "@/components/ui/card";
import MiniStat from "@/components/dashboard/ministat";
import { getSession } from "@/lib/session";
import { api, type Project, type Note, type Area } from "@/lib/api";

export default function DashboardOverview() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [projectsCount, setProjectsCount] = useState<number | null>(null);
  const [notesCount, setNotesCount] = useState<number | null>(null);
  const [areasCount, setAreasCount] = useState<number | null>(null);
  const [archivesCount, setArchivesCount] = useState<number | null>(null);

  useEffect(() => {
    const s = getSession();
    if (!s) {
      router.replace("/login");
      return;
    }

    (async () => {
      try {
        setLoading(true);

        const [projects, notes, areas] = await Promise.all([
          api.getProjectsByUser(s.userId) as Promise<Project[]>,
          api.getUserNotes(s.userId) as Promise<Note[]>,
          api.getAreasByUser(s.userId) as Promise<Area[]>,
        ]);

        setProjectsCount(projects.length);
        setNotesCount(notes.length);
        setAreasCount(areas.length);

        // handle both "archived" and "ARCHIVED"
        const isArchived = (p: Project) =>
          String(p.status).toLowerCase() === "archived";
        setArchivesCount(projects.filter(isArchived).length);
      } catch (e: any) {
        setError(e?.message ?? "Unable to load dashboard data.");
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  const show = (n: number | null) => (n !== null ? String(n) : (loading ? "…" : "0"));

  return (
    <Card title="Overview">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        <MiniStat label="Projects"  value={show(projectsCount)} />
        <MiniStat label="Notes"     value={show(notesCount)} />
        <MiniStat label="Areas"     value={show(areasCount)} />
        <MiniStat label="Archives"  value={show(archivesCount)} />
      </div>

      {error && <p className="mt-3 text-xs text-red-300">{error}</p>}
    </Card>
  );
}
