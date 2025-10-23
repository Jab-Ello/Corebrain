import Card from "@/components/ui/card";
import Button from "@/components/ui/button";
import { tags } from "@/lib/data";


export default function NotesTags() {
return (
<Card title="Note tags">
<ul className="space-y-3">
{tags.map((t) => (
<li key={t.name} className="flex items-center justify-between rounded-xl bg-[var(--bg)] border border-[var(--border)] p-3">
<div className="flex items-center gap-3">
<span className="h-9 w-9 rounded-lg bg-white/10 grid place-items-center text-base">
{t.emoji}
</span>
<div className="font-medium">{t.name}</div>
</div>
<div className="flex gap-2">
<Button size="sm" variant="ghost">Edit</Button>
<Button size="sm" variant="ghost">View</Button>
</div>
</li>
))}
</ul>
</Card>
);
}