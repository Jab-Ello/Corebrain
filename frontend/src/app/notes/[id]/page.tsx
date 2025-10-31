"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { api, Note } from "@/lib/api";
import { getSession } from "@/lib/session";

export default function NoteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [note, setNote] = useState<Note | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const s = getSession();
    if (!s) { router.replace("/login"); return; }
    (async () => {
      try {
        const n = await api.getNote(id);
        setNote(n);
      } catch (e: any) {
        setError(e?.message ?? "Impossible de charger la note.");
      }
    })();
  }, [id, router]);

  if (error) return <main className="p-6 text-red-300">{error}</main>;
  if (!note) return <main className="p-6 text-white/70">Chargement…</main>;

  return (
    <main className="p-6">
      <div className="mb-4">
        <Link href="/notes" className="text-sm underline decoration-white/30 hover:decoration-white/80">← Back</Link>
      </div>
      <h1 className="text-2xl font-bold mb-2">{note.title}</h1>
      <div className="text-xs text-white/60 mb-4">
        Créée le {new Date(note.createdAt).toLocaleString()} • MAJ {new Date(note.updatedAt).toLocaleString()}
      </div>
      <article className="prose prose-invert max-w-none whitespace-pre-wrap">
        {note.content}
      </article>
    </main>
  );
}
