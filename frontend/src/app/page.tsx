'use client'; // ✅ assure que la page est rendue côté client
export const dynamic = 'force-dynamic'; // ✅ empêche le prerendering statique

import { Suspense } from 'react';
import DashboardOverview from "@/components/dashboard/dashboardOverview";
import Progress from "@/components/dashboard/progress";
import NewEntries from "@/components/dashboard/NotesTags";
import NotesTags from "@/components/dashboard/NotesTags";
import AIAgent from "@/components/dashboard/AiAgent";

export default function Page() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-6">
        <DashboardOverview />
        <NotesTags />
      </div>

      {/* ✅ Enveloppe la section contenant useSearchParams() dans un Suspense */}
      <Suspense fallback={<div>Chargement des notes...</div>}>
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-6">
        </div>
      </Suspense>

      <AIAgent />
    </div>
  );
}
