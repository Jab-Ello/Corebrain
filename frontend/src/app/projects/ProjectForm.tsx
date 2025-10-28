"use client";

import { useState } from "react";
import type { ProjectCreateBody } from "../../lib/api";

type Props = {
  onSubmit: (data: ProjectCreateBody) => Promise<void>;
  userId: string;
  submitting?: boolean;
};

export default function ProjectForm({ onSubmit, userId, submitting }: Props) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [context, setContext] = useState("");
  const [color, setColor] = useState("");
  const [priority, setPriority] = useState<number>(0);
  const [plannedEndDate, setPlannedEndDate] = useState<string>("");

  const field =
    "w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-indigo-500/40";

  function toISO(d?: string | null) {
    if (!d) return null;
    return new Date(`${d}T00:00:00`).toISOString();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await onSubmit({
      user_id: userId,
      name: name.trim(),
      description: description.trim() || null,
      context: context.trim() || null,
      color: color.trim() || null,
      priority: Number.isFinite(priority) ? priority : 0,
      plannedEndDate: toISO(plannedEndDate),
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
      <div>
        <label className="block text-sm mb-1 text-white/80">Name *</label>
        <input className={field} value={name} onChange={e=>setName(e.target.value)} required placeholder="Project name" />
      </div>

      <div>
        <label className="block text-sm mb-1 text-white/80">Description</label>
        <textarea className={field} rows={4} value={description} onChange={e=>setDescription(e.target.value)} placeholder="What is this about?" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm mb-1 text-white/80">Context</label>
          <input className={field} value={context} onChange={e=>setContext(e.target.value)} placeholder="Work, Personal…" />
        </div>
        <div>
          <label className="block text-sm mb-1 text-white/80">Color</label>
          <input className={field} value={color} onChange={e=>setColor(e.target.value)} placeholder="#4f46e5 or indigo-500" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm mb-1 text-white/80">Priority (0–10)</label>
          <input type="number" min={0} max={10} className={field} value={priority} onChange={e=>setPriority(parseInt(e.target.value||"0",10))} />
        </div>
        <div>
          <label className="block text-sm mb-1 text-white/80">Planned end date</label>
          <input type="date" className={field} value={plannedEndDate} onChange={e=>setPlannedEndDate(e.target.value)} />
        </div>
      </div>

      <div className="flex gap-2">
        <button type="submit" disabled={submitting} className="rounded-xl bg-white/10 border border-white/10 px-4 py-2 text-sm hover:bg-white/15 disabled:opacity-60">
          {submitting ? "Creating…" : "Create project"}
        </button>
      </div>
    </form>
  );
}
