export default function MiniStat({ label, value }: { label: string; value: string }) {
return (
<div className="rounded-xl bg-[var(--bg)] border border-[var(--border)] p-4 flex items-center gap-3">
<div className="h-8 w-8 rounded-lg bg-white/10 grid place-items-center text-sm">{value}</div>
<div className="text-sm text-white/80">{label}</div>
</div>
);
}