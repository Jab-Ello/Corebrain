"use client";
import * as React from "react";


type Variant = "solid" | "secondary" | "ghost";
type Size = "sm" | "md";


const base =
"rounded-xl border transition-colors disabled:opacity-60 disabled:cursor-not-allowed";
const sizes: Record<Size, string> = {
sm: "text-xs px-3 py-1.5",
md: "text-sm px-4 py-2",
};
const variants: Record<Variant, string> = {
solid: "bg-white/10 border-[var(--border-strong)] hover:bg-white/20",
secondary: "bg-[var(--card-bg)] border-[var(--border-strong)] hover:bg-white/10",
ghost: "bg-transparent border-[var(--border)] hover:bg-white/10",
};


export interface ButtonProps
extends React.ButtonHTMLAttributes<HTMLButtonElement> {
variant?: Variant;
size?: Size;
}


export default function Button({ variant = "solid", size = "md", className, ...props }: ButtonProps) {
return (
<button className={[base, sizes[size], variants[variant], className].filter(Boolean).join(" ")} {...props} />
);
}