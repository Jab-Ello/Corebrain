import Card from "@/components/ui/card";
import Button from "@/components/ui/button";
import { activities } from "@/lib/data";


export default function Progress() {
return (
<Card title="Recent progress">
<ul className="space-y-3">
{activities.map((r, i) => (
<li key={`${r.title}-${i}`} className="flex items-center justify-between rounded-xl bg-[var(--bg)] border border-[var(--border)] p-3">
<div className="flex items-center gap-3">
<span className="h-9 w-9 rounded-lg bg-white/10 grid place-items-center text-base">{r.icon}</span>
<div>
<div className="font-medium">{r.title}</div>
<div className="text-xs text-white/70">{r.desc}</div>
</div>
</div>
<div className="flex gap-2">
<Button size="sm" variant="ghost">View</Button>
{i === activities.length - 1 && <Button size="sm" variant="secondary">Explore</Button>}
</div>
</li>
))}
</ul>
</Card>
);
}