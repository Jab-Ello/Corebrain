"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const item = (href: string, label: string) => {
    const active = pathname === href;
    return (
      <Link
        href={href}
        className={[
          "block px-3 py-2 rounded transition",
          active ? "bg-gray-700 text-white" : "text-gray-200 hover:bg-gray-700/60"
        ].join(" ")}
      >
        {label}
      </Link>
    );
  };

  return (
    <div className="flex min-h-screen bg-gray-900">
      <aside className="w-64 bg-gray-800 text-white p-4">
        <h2 className="text-xl font-bold mb-4">Sidebar</h2>
        <nav className="space-y-1">
          {item("/", "Dashboard")}
          {item("/projects", "Projects")}
          {item("/ask", "Ask")}
        </nav>
      </aside>
      <main className="flex-1 p-6 bg-gray-100 dark:bg-gray-900 text-gray-100">{children}</main>
    </div>
  );
}
