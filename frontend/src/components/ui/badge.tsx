import * as React from "react";


export default function Badge({ children }: { children: React.ReactNode }) {
return (
<span className="inline-flex items-center justify-center h-6 min-w-6 px-2 rounded-full text-xs bg-white/10 border border-[var(--border-strong)]">
{children}
</span>
);
}