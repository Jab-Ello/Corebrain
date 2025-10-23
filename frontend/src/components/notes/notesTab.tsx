"use client";
import { useState, useEffect } from "react";

export type Scope = "projects" | "areas" | "resources" | "archives";

export default function NotesTabs({
  initial = "projects",
  onChange,
}: {
  initial?: Scope;
  onChange: (scope: Scope) => void;
}) {
  const [active, setActive] = useState<Scope>(initial);

  useEffect(() => { onChange(active); }, [active, onChange]);

  const items: Scope[] = ["projects", "areas", "resources", "archives"];

  return (
    <div className="flex gap-2 border-b border-white/10 pb-2 mb-4">
      {items.map((k) => {
        const isActive = active === k;
        return (
          <button
            key={k}
            onClick={() => setActive(k)}
            className={`px-3 py-1.5 rounded-lg text-sm capitalize transition ${
              isActive ? "bg-white/10 text-white" : "text-gray-300 hover:bg-white/5"
            }`}
          >
            {k}
          </button>
        );
      })}
    </div>
  );
}
