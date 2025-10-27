import Link from "next/link";

function iconFor(label: string) {
  const map: Record<string, string> = {
    Dashboard: "🏠",
    Projects: "📂",
    Areas: "✅",
    Resources: "📚",
    Archives: "🗄️",
  };
  return map[label] ?? "•";
}

export default function Sidebar() {
  return (
    <aside
      aria-label="Primary"
      className="w-[260px] min-w-[260px] bg-[var(--bg)] border-r border-[var(--border)] p-6 hidden lg:flex lg:flex-col"
    >
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
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-white/80 hover:bg-white/10 hover:text-white"
          >
            <span className="inline-block w-5">{iconFor(item.label)}</span>
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="mt-8">
        <h4 className="text-white/60 text-xs uppercase tracking-wider mb-3">Current projects</h4>
        <ul className="space-y-2 text-sm">
          {[
            "Design the UX of the contact information page",
            "Organise Lauren's surprise birthday party",
            "Renovate the garage",
            "Organise your cloud storage",
          ].map((p) => (
            <li key={p} className="flex items-start gap-2">
              <span className="mt-0.5">📁</span>
              <a className="hover:underline decoration-white/30 leading-snug" href="#">
                {p}
              </a>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-auto pt-6 space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-white/10 grid place-items-center">👤</div>
          <div className="leading-tight">
            <div className="text-sm">User Name</div>
            <div className="text-xs text-white/70">username@example.com</div>
          </div>
        </div>
      <div className="space-y-2 text-sm">
        <Link href="/preferences" className="block rounded-lg bg-white/5 border border-[var(--border)] px-3 py-2 hover:bg-white/10">
          Preferences
        </Link>
        <Link href="/login" className="block rounded-lg bg-white/5 border border-[var(--border)] px-3 py-2 hover:bg-white/10">
          Log in
        </Link>
        <Link href="/logout" className="block rounded-lg bg-white/5 border border-[var(--border)] px-3 py-2 hover:bg-white/10">
          Log out
        </Link>
      </div>

      </div>
    </aside>
  );
}
