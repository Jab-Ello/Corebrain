import Card from "@/components/ui/card";
import MiniStat from "@/components/dashboard/ministat";


export default function DashboardOverview() {
return (
<Card title="Overview">
<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
<div className="flex md:col-span-1">
<div className="relative h-28 w-28 rounded-full bg-[var(--bg)] border-2 border-[var(--border-strong)] grid place-items-center shadow-inner">
<div className="text-center">
<div className="text-3xl font-black">9.0</div>
<div className="text-xs text-white/70">/10</div>
</div>
<span className="absolute -inset-1 rounded-full border border-white/5 pointer-events-none" />
</div>
<div className="ml-4">
<div className="text-sm text-white/70">Weekly focus score</div>
<p className="text-xs text-white/60 mt-1 max-w-[14ch]">How consistently you touched notes & projects</p>
</div>
</div>


<div className="md:col-span-2 grid grid-cols-3 gap-3">
<MiniStat label="Projects" value="8" />
<MiniStat label="Areas" value="5" />
<MiniStat label="Resources" value="67" />
<MiniStat label="Archives" value="13" />
</div>
</div>
</Card>
);
}