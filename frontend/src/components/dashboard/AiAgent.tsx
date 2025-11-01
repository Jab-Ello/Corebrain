"use client";
import { useState, useEffect, useRef } from "react";
import { api } from "../../lib/api";

type AIAgentProps = {
  projectId?: string;
  projectData?: {
    id: string;
    name: string;
    description?: string | null;
    context?: string | null;
    priority?: number;
    status?: string | null;
    color?: string | null;
    createdAt?: string;
    updatedAt?: string;
    plannedEndDate?: string | null;
    endDate?: string | null;
  };
};

export default function AIAgent({ projectId, projectData }: AIAgentProps) {
  const [messages, setMessages] = useState<{ who: "user" | "bot"; text: string }[]>([
    { who: "bot", text: "Say hi to the assistant 👋" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);

  // ------------------------------------------------------------
  // 🔹 Gestion de l'identifiant utilisateur
  // ------------------------------------------------------------
  const getUserId = (): string => {
    let uid = localStorage.getItem("user_id");
    if (!uid) {
      uid = "web-" + Math.random().toString(36).slice(2, 10);
      localStorage.setItem("user_id", uid);
    }
    return uid;
  };

  // ------------------------------------------------------------
  // 🔹 Conversation propre à chaque projet
  // ------------------------------------------------------------
  const key = `conversation_id_${projectId ?? "global"}`;
  const getConvId = (): string | null => localStorage.getItem(key);
  const setConvId = (id?: string) => id && localStorage.setItem(key, id);
  const clearConvId = () => localStorage.removeItem(key);

  // ------------------------------------------------------------
  // 🔹 Scroll automatique du chat
  // ------------------------------------------------------------
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [messages]);

  // ------------------------------------------------------------
  // 🔹 Envoi d’un message à l’agent IA
  // ------------------------------------------------------------
  const sendMessage = async (text: string) => {
    setMessages((prev) => [...prev, { who: "user", text }]);
    setLoading(true);
    try {
      const payload = {
        user_id: getUserId(),
        conversation_id: getConvId() ?? undefined,
        project_id: projectId ?? undefined,
        project_context: projectData ?? undefined, // ✅ envoi du contexte complet
        message: text,
      };

      const data = await api.agentChat(payload);
      if (data.conversation_id) setConvId(data.conversation_id);
      setMessages((prev) => [...prev, { who: "bot", text: data.reply ?? "[empty reply]" }]);
    } catch (err: any) {
      console.error("❌ Error sending message:", err);
      setMessages((prev) => [...prev, { who: "bot", text: "Error: " + err.message }]);
    } finally {
      setLoading(false);
    }
  };

  // ------------------------------------------------------------
  // 🔹 Gestion du formulaire
  // ------------------------------------------------------------
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    sendMessage(text);
  };

  // ------------------------------------------------------------
  // 🔹 Réinitialiser la conversation du projet
  // ------------------------------------------------------------
  const handleResetConversation = async () => {
    const convId = getConvId();
    if (!convId) {
      setMessages([{ who: "bot", text: "No conversation to reset." }]);
      return;
    }

    try {
      const res = await fetch("http://127.0.0.1:8000/api/agent/conversation", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: getUserId(),
          conversation_id: convId,
        }),
      });

      if (!res.ok) throw new Error("HTTP " + res.status);
      clearConvId();
      setMessages([{ who: "bot", text: "Conversation reset. Say hi to start again 👋" }]);
    } catch (err: any) {
      console.error(err);
      setMessages([{ who: "bot", text: "Error resetting conversation: " + err.message }]);
    }
  };

  // ------------------------------------------------------------
  // 🔹 Rendu du composant
  // ------------------------------------------------------------
  return (
    <section className="rounded-2xl bg-[var(--card-bg)] border border-[var(--border)]">
      <div className="p-5 flex justify-between items-center">
        <div>
          <div className="text-lg font-semibold">AI assistant</div>
          <p className="text-xl md:text-2xl font-extrabold tracking-tight mt-3 leading-snug text-[var(--muted-90)]">
            Ask the assistant anything.
          </p>
        </div>
        <button
          onClick={handleResetConversation}
          className="rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm hover:bg-white/10"
        >
          🗑 Reset
        </button>
      </div>

      <div className="border-t border-[var(--border)] p-4">
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
          {loading && <div className="my-1 text-white/70 italic">Agent is typing...</div>}
        </div>

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
            disabled={loading}
          />
          <button
            aria-label="Send message"
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg border border-[var(--border)] bg-[var(--card-bg)] px-2 py-1 text-sm hover:bg-white/10"
          >
            {loading ? "…" : "➤"}
          </button>
        </form>
      </div>
    </section>
  );
}
