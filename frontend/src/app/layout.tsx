import type { Metadata } from "next";
import "../styles/globals.css";
import Sidebar from "@/components/dashboard/sidebar";


export const metadata: Metadata = {
title: "SecondBrain",
description: "Personal knowledge and projects dashboard",
};


export default function RootLayout({ children }: { children: React.ReactNode }) {
return (
<html lang="en">
<body className="min-h-screen bg-[var(--bg)] text-white">
<div className="flex gap-6 min-h-screen">
{/* Sidebar is a Server Component (no client hooks) */}
<Sidebar />
<main className="flex-1 pr-6 pb-8 pt-6 max-w-[1150px] mx-auto w-full">
{children}
</main>
</div>
</body>
</html>
);
}