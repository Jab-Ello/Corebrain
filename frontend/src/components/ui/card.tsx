import * as React from "react";


export default function Card({
title,
right,
children,
}: {
title?: string;
right?: React.ReactNode;
children: React.ReactNode;
}) {
return (
<section className="rounded-2xl bg-[var(--card-bg)] border border-[var(--border)] p-5">
{title && (
<div className="mb-4 flex items-center justify-between">
<h2 className="text-lg font-semibold tracking-tight">{title}</h2>
{right}
</div>
)}
{children}
</section>
);
}