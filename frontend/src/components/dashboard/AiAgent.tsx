import Card from "@/components/ui/card";


"use client";
import { useState, useEffect, useRef } from "react";

export default function AIAgent() {
  // état local des messages
  const [messages, setMessages] = useState<{ who: "user" | "bot"; text: string }[]>([
    { who: "bot", text: "Say hi to the assistant 👋" },
  ]);
  const [input, setInput] = useState("");
  const logRef = useRef<HTMLDivElement>(null);

  // scroll automatique vers le bas à chaque nouveau message
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [messages]);

  // Fonctions utilitaires équivalentes à ton script
  const getUserId = () => {
    let uid = localStorage.getItem("user_id");
    if (!uid) {
      uid = "web-" + Math.random().toString(36).slice(2, 10);
      localStorage.setItem("user_id", uid);
    }
    return uid;
  };

  const getConvId = () => localStorage.getItem("conversation_id");
  const setConvId = (id?: string) => id && localStorage.setItem("conversation_id", id);

  // Fonction d’envoi du message
  const sendMessage = async (text: string) => {
    setMessages((prev) => [...prev, { who: "user", text }]);
    try {
      const res = await fetch("http://127.0.0.1:8000/api/agent/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: getUserId(),
          conversation_id: getConvId(),
          message: text,
        }),
      });

      if (!res.ok) throw new Error("HTTP " + res.status);
      const data = await res.json();
      if (data.conversation_id) setConvId(data.conversation_id);
      setMessages((prev) => [...prev, { who: "bot", text: data.reply ?? "[empty reply]" }]);
    } catch (err: any) {
      setMessages((prev) => [...prev, { who: "bot", text: "Error: " + err.message }]);
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;
    setInput("");
    sendMessage(text);
  };

  return (
    <section className="rounded-2xl bg-[var(--card-bg)] border border-[var(--border)]">
      <div className="p-5">
        <div className="text-lg font-semibold">AI assistant</div>
        <p className="text-xl md:text-2xl font-extrabold tracking-tight mt-3 leading-snug text-[var(--muted-90)]">
          Ask the assistant anything.
        </p>
      </div>

      <div className="border-t border-[var(--border)] p-4">
        {/* zone d’affichage du chat */}
        <div
          ref={logRef}
          id="ai-log"
          className="rounded-xl bg-[var(--bg)] border border-[var(--border)] p-3 text-sm max-h-72 overflow-y-auto"
        >
          {messages.map((m, i) => (
            <div key={i} className="my-1">
              <div className={m.who === "user" ? "text-white" : "text-white/90"}>
                <strong>{m.who === "user" ? "Me:" : "Agent:"}</strong> {m.text}
              </div>
            </div>
          ))}
        </div>

        {/* champ de saisie */}
        <form onSubmit={handleSubmit} className="relative mt-4">
          <label htmlFor="aiq" className="sr-only">
            Ask anything…
          </label>
          <input
            id="aiq"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask anything… (press Enter to send)"
            className="w-full rounded-xl bg-[var(--bg)] border border-[var(--border)] px-4 py-3 text-sm placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
          />
          <button
            aria-label="More actions"
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg border border-[var(--border)] bg-[var(--card-bg)] px-2 py-1 text-sm hover:bg-white/10"
          >
            ⋯
          </button>
        </form>
      </div>
    </section>
  );
}
