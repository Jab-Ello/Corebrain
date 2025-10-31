"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Card from "@/components/ui/card";
import MiniStat from "@/components/dashboard/ministat";
import { getSession } from "@/lib/session";
import { api, type Project, type Note } from "@/lib/api";

export default function DashboardOverview() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [projectsCount, setProjectsCount] = useState<number | null>(null);
  const [notesCount, setNotesCount] = useState<number | null>(null);

  useEffect(() => {
    const s = getSession();
    if (!s) {
      router.replace("/login");
      return;
    }

    (async () => {
      try {
        setLoading(true);
        const [projects, notes] = await Promise.all([
          api.getProjectsByUser(s.userId) as Promise<Project[]>,
          api.getUserNotes(s.userId) as Promise<Note[]>,
        ]);

        setProjectsCount(projects.length);
        setNotesCount(notes.length);
      } catch (e: any) {
        setError(e?.message ?? "Unable to load dashboard data.");
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  return (
    <Card title="Overview">
      {/* Removed Weekly Focus block entirely */}

      {/* MiniStats row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        <MiniStat label="Projects" value={projectsCount !== null ? String(projectsCount) : (loading ? "…" : "0")} />
        <MiniStat label="Notes" value={notesCount !== null ? String(notesCount) : (loading ? "…" : "0")} />

        {/* If you later expose these from the backend, add similar loaders: */}
        {/* <MiniStat label="Areas" value={areasCount !== null ? String(areasCount) : (loading ? "…" : "0")} /> */}
        {/* <MiniStat label="Resources" value={resourcesCount !== null ? String(resourcesCount) : (loading ? "…" : "0")} /> */}
      </div>

      {error && (
        <p className="mt-3 text-xs text-red-300">
          {error}
        </p>
      )}
    </Card>
  );
}
