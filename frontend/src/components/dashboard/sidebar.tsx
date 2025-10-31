"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getSession, type Session } from "@/lib/session";
import { api, type Project, type User } from "@/lib/api";
import { usePathname } from "next/navigation";

function iconFor(label: string) { /* inchangé */ }

function Avatar({ src }: { src?: string | null }) {
  const [broken, setBroken] = useState(false);
  const avatarSrc = !src || broken ? "/default-avatar.png" : src;
  return (
    <img
      src={avatarSrc}
      alt="User avatar"
      className="h-9 w-9 rounded-full object-cover border border-white/10"
      referrerPolicy="no-referrer"
      onError={() => setBroken(true)}
    />
  );
}

export default function Sidebar() {
  const pathname = usePathname();

  // NEW: éviter lecture de session pendant SSR
  const [mounted, setMounted] = useState(false);
  const [session, setSessionState] = useState<Session | null>(null);

  const [projects, setProjects] = useState<Project[] | null>(null);
  const [projError, setProjError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  // 1) Marquer "monté" côté client
  useEffect(() => { setMounted(true); }, []);

  // 2) Lire la session côté client uniquement
  useEffect(() => {
    if (!mounted) return;
    setSessionState(getSession());
  }, [mounted]);

  // 3) Charger les données quand on a une session
  useEffect(() => {
    (async () => {
      try {
        if (!mounted) return;
        if (!session) { // pas connecté
          setProjects(null);
          setUser(null);
          setLoading(false);
          return;
        }
        setLoading(true);
        const [projectsRes, userRes] = await Promise.all([
          api.getProjectsByUser(session.userId),
          api.getUser(session.userId).catch(() => null),
        ]);
        setProjects(projectsRes);
        setUser(userRes);
      } catch (e: any) {
        setProjError(e?.message ?? "Unable to load projects.");
      } finally {
        setLoading(false);
      }
    })();
  }, [mounted, session]);

  const displayProjects = useMemo(
    () =>
      (projects ?? [])
        .slice()
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .slice(0, 6),
    [projects]
  );

  const displayName = user?.name ?? session?.name ?? "Guest";
  const displayEmail = user?.email ?? (session ? "—" : "username@example.com");
  const avatarSrc = user?.avatarUrl;

  // --- 🔒 Hydration-safe rendering:
  // Tant que !mounted, rendre un squelette STABLE (identique SSR/Client initial)
  if (!mounted) {
    return (
      <aside aria-label="Primary" className="w-[260px] min-w-[260px] bg-[var(--bg)] border-r border-[var(--border)] p-6 hidden lg:flex lg:flex-col">
        <div className="flex items-center gap-3 text-xl font-black tracking-tight mb-6">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/10">🧠</span>
          <span>SecondBrain</span>
        </div>

        <div className="relative mb-4">
          <div className="w-full h-9 rounded-xl bg-white/5 border border-[var(--border)] animate-pulse" />
        </div>

        <nav className="space-y-1 text-sm">
          {["/", "/projects", "/areas", "/resources", "/archives"].map((href) => (
            <div key={href} className="h-8 rounded-lg bg-white/5 border border-[var(--border)] animate-pulse" />
          ))}
        </nav>

        <div className="mt-8">
          <div className="h-4 w-32 bg-white/5 border border-white/10 rounded mb-3 animate-pulse" />
          <ul className="space-y-2 text-sm">
            {Array.from({ length: 4 }).map((_, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="mt-0.5">📁</span>
                <div className="h-4 w-40 bg-white/10 rounded animate-pulse" />
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-auto pt-6 space-y-6">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-white/10" />
            <div className="leading-tight">
              <div className="h-4 w-24 bg-white/10 rounded mb-1" />
              <div className="h-3 w-28 bg-white/10 rounded" />
            </div>
          </div>
        </div>
      </aside>
    );
  }

  // --- rendu normal (client)
  return (
    <aside aria-label="Primary" className="w-[260px] min-w-[260px] bg-[var(--bg)] border-r border-[var(--border)] p-6 hidden lg:flex lg:flex-col">
      <div className="flex items-center gap-3 text-xl font-black tracking-tight mb-6">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/10">🧠</span>
        <span>SecondBrain</span>
      </div>

      <div className="relative mb-4">
        <label htmlFor="search" className="sr-only">Search your SecondBrain</label>
        <input
          id="search"
          placeholder="Search your SecondBrain"
          className="w-full rounded-xl bg-white/5 border border-[var(--border)] px-4 py-2 text-sm placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
        />
      </div>

      <nav className="space-y-1 text-sm">
        {[
          { href: "/", label: "Dashboard" },
          { href: "/projects", label: "Projects" },
          { href: "/areas", label: "Areas" },
          { href: "/resources", label: "Resources" },
          { href: "/archives", label: "Archives" },
        ].map((item) => {
          const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={[
                "flex items-center gap-3 rounded-lg px-3 py-2",
                active ? "bg-white/10 text-white" : "text-white/80 hover:bg-white/10 hover:text-white"
              ].join(" ")}
            >
              <span className="inline-block w-5">{iconFor(item.label)}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-8">
        <h4 className="text-white/60 text-xs uppercase tracking-wider mb-3">Current projects</h4>

        {!session && (
          <p className="text-sm text-white/60">
            Please <Link href="/login" className="underline">log in</Link> to see your projects.
          </p>
        )}

        {session && loading && (
          <ul className="space-y-2 text-sm animate-pulse">
            {Array.from({ length: 4 }).map((_, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="mt-0.5">📁</span>
                <div className="h-4 w-40 bg-white/10 rounded" />
              </li>
            ))}
          </ul>
        )}

        {session && !loading && projError && (
          <p className="text-xs text-red-300">{projError}</p>
        )}

        {session && !loading && !projError && displayProjects.length === 0 && (
          <p className="text-sm text-white/60">No projects yet.</p>
        )}

        {session && !loading && !projError && displayProjects.length > 0 && (
          <ul className="space-y-2 text-sm">
            {displayProjects.map((p) => (
              <li key={p.id} className="flex items-start gap-2">
                <span className="mt-0.5">📁</span>
                <Link className="hover:underline decoration-white/30 leading-snug" href={`/projects/${p.id}`}>
                  {p.name}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-auto pt-6 space-y-6">
        <div className="flex items-center gap-3">
          <Avatar src={avatarSrc} />
          <div className="leading-tight">
            <div className="text-sm">{displayName}</div>
            <div className="text-xs text-white/70">{displayEmail}</div>
          </div>
        </div>

        <div className="space-y-2 text-sm">
          <Link href="/preferences" className="block rounded-lg bg-white/5 border border-[var(--border)] px-3 py-2 hover:bg-white/10">
            Preferences
          </Link>

          {!session ? (
            <Link href="/login" className="block rounded-lg bg-white/5 border border-[var(--border)] px-3 py-2 hover:bg-white/10">
              Log in
            </Link>
          ) : (
            <Link href="/logout" className="block rounded-lg bg-white/5 border border-[var(--border)] px-3 py-2 hover:bg-white/10">
              Log out
            </Link>
          )}
        </div>
      </div>
    </aside>
  );
}
