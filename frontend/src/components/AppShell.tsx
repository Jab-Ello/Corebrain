import { ReactNode } from "react";

export default function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <aside className="w-64 bg-gray-800 text-white p-4">
        <h2 className="text-xl font-bold mb-4">Sidebar</h2>
        <nav>
          <ul>
            <li><a href="/" className="block py-2">Inbox</a></li>
            <li><a href="/ask" className="block py-2">Ask</a></li>
          </ul>
        </nav>
      </aside>
      <main className="flex-1 p-6 bg-gray-100">
        {children}
      </main>
    </div>
  )
}
