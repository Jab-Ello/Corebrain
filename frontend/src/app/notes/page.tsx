'use client';
export const dynamic = 'force-dynamic'; // évite les erreurs de prerender

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import NotesCanvas, { Note } from "../../components/notes/notesCanvas"; 
import NotesTabs, { Scope } from "../../components/notes/notesTab";

const DATA: Record<Scope, Note[]> = {
  projects: [
    { id: "p1", title: "Kickoff", content: "Timeline & milestones…", tags: ["Meetings"], createdAt: "2025-10-12" },
    { id: "p2", title: "UX Ideas", content: "Blue accent audit…", tags: ["Design"], createdAt: "2025-10-10" },
  ],
  areas: [
    { id: "a1", title: "Area Vision", content: "North star & principles…", tags: ["Reflections"], createdAt: "2025-10-08" },
  ],
  resources: [
    { id: "r1", title: "Paper highlights", content: "Agentic systems notes…", tags: ["Research"], createdAt: "2025-10-07" },
  ],
  archives: [
    { id: "x1", title: "Retro", content: "What went well…", tags: ["Reflections"], createdAt: "2025-09-29" },
  ],
};

// Séparer la logique dans un composant enfant
function NotesContent() {
  const sp = useSearchParams();
  const initialTab = (sp.get("tab") as Scope) || "projects";

  const [scope, setScope] = useState<Scope>(initialTab);
  const notes = useMemo(() => DATA[scope] ?? [], [scope]);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8 py-6">
        <header className="mb-2">
          <h1 className="text-2xl font-semibold text-white">Notes</h1>
          <p className="text-sm text-gray-400">
            Browse notes across Projects, Areas, Resources, or Archives.
          </p>
        </header>

        <NotesTabs initial={initialTab} onChange={setScope} />

        <NotesCanvas
          title={`${scope.charAt(0).toUpperCase() + scope.slice(1)} Notes`}
          notes={notes}
          onNewNote={() => console.log("New note for scope:", scope)}
        />
      </div>
    </div>
  );
}

export default function GlobalNotesPage() {
  return (
    <Suspense fallback={<div className="p-6 text-gray-400">Chargement des notes...</div>}>
      <NotesContent />
    </Suspense>
  );
}
