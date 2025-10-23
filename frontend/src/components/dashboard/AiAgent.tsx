import Card from "@/components/ui/card";


export default function AIAgent() {
return (
<section className="rounded-2xl bg-[var(--card-bg)] border border-[var(--border)]">
<div className="p-5">
<div className="text-lg font-semibold">AI assistant</div>
<p className="text-xl md:text-2xl font-extrabold tracking-tight mt-3 leading-snug text-[var(--muted-90)]">
This week, focus on: polishing the contact info page, planning your home studio upgrades, and sketching your Prague summer trip.
</p>
</div>
<div className="border-t border-[var(--border)] p-4">
<div className="relative">
<label htmlFor="aiq" className="sr-only">Ask anything…</label>
<input
id="aiq"
placeholder="Ask anything…"
className="w-full rounded-xl bg-[var(--bg)] border border-[var(--border)] px-4 py-3 text-sm placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
/>
<button
aria-label="More actions"
className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg border border-[var(--border)] bg-[var(--card-bg)] px-2 py-1 text-sm hover:bg-white/10"
>
⋯
</button>
</div>
</div>
</section>
);
}