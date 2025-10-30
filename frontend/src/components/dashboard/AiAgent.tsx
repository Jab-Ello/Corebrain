"use client";
import { useState, useEffect, useRef } from "react";

interface Conversation {
  id: number;
  title: string;
  createdAt: string;
}

export default function AIAgent() {
  // ------------------------------------------------------------
  // 🔹 États
  // ------------------------------------------------------------
  const [messages, setMessages] = useState<{ who: "user" | "bot"; text: string }[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConv, setActiveConv] = useState<number | null>(null);
  const logRef = useRef<HTMLDivElement>(null);

  // ------------------------------------------------------------
  // 🔹 Helpers localStorage (IDs numériques)
  // ------------------------------------------------------------
  const getUserId = (): number => {
    let uid = localStorage.getItem("user_id");
    if (!uid) {
      // ⚠️ On part d'un utilisateur déjà existant en base (ex: 1)
      uid = "1";
      localStorage.setItem("user_id", uid);
    }
    return parseInt(uid, 10);
  };

  const readConvId = (): number | null => {
    const v = localStorage.getItem("conversation_id");
    return v ? parseInt(v, 10) : null;
  };

  const writeConvId = (id: number | null) => {
    if (id == null) {
      localStorage.removeItem("conversation_id");
      setActiveConv(null);
    } else {
      localStorage.setItem("conversation_id", String(id));
      setActiveConv(id);
    }
  };

  // ------------------------------------------------------------
  // 🔹 Scroll auto
  // ------------------------------------------------------------
  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [messages]);

  // ------------------------------------------------------------
  // 🔹 Charger la liste des conversations
  // ------------------------------------------------------------
  const loadConversations = async () => {
    const user_id = getUserId();
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/agent/conversations/${user_id}`);
      if (!res.ok) throw new Error("Erreur de chargement des conversations");
      const data: Conversation[] = await res.json();
      setConversations(data);
    } catch (err) {
      console.error("❌ Impossible de charger les conversations:", err);
    }
  };

  useEffect(() => {
    // réhydrate l'activeConv depuis le storage au premier rendu
    const stored = readConvId();
    if (stored !== null) setActiveConv(stored);
    loadConversations();
  }, []);

  // ------------------------------------------------------------
  // 🔹 Charger l’historique d’une conversation
  //     Garde-fou : on vérifie que l’onglet actif n’a pas changé
  // ------------------------------------------------------------
  const loadConversation = async (convId: number) => {
    // Sélection immédiate côté UI + persistance
    writeConvId(convId);

    try {
      const res = await fetch(`http://127.0.0.1:8000/api/agent/history/${convId}`);
      if (!res.ok) throw new Error("Erreur de chargement de l’historique");
      const data = await res.json();

      // Si l’utilisateur a cliqué ailleurs entre temps, on n’écrase pas l’affichage actuel
      if (readConvId() !== convId) return;

      if (Array.isArray(data.history)) {
        const parsed = data.history
          .filter((m: any) => m.role !== "system")
          .map((m: any) => ({
            who: m.role === "user" ? "user" : "bot",
            text: m.content,
          }));
        setMessages(parsed);
      } else {
        setMessages([{ who: "bot", text: "Unable to load this conversation 😕" }]);
      }
    } catch (err) {
      console.error("❌ Erreur lors du chargement de la conversation:", err);
      setMessages([{ who: "bot", text: "Unable to load this conversation 😕" }]);
    }
  };

  // ------------------------------------------------------------
  // 🔹 Envoi d’un message
  //     Garde-fou : on n’insère la réponse que si on est encore sur la même conv
  // ------------------------------------------------------------
  const sendMessage = async (text: string) => {
    // Optimistic append du message utilisateur (lié au contexte courant)
    setMessages((prev) => [...prev, { who: "user", text }]);
    setLoading(true);

    // On capture la conv active au moment de l’envoi
    const requestConvId = activeConv;

    try {
      const user_id = getUserId();

      const res = await fetch("http://127.0.0.1:8000/api/agent/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id,
          conversation_id: requestConvId, // peut être null → le backend créera une conv
          message: text,
        }),
      });

      if (!res.ok) throw new Error("HTTP " + res.status);
      const data = await res.json();

      // Si une nouvelle conversation vient d’être créée, on la sélectionne et on persiste
      const returnedConvId: number | null = data.conversation_id ?? null;
      if (!requestConvId && returnedConvId) {
        writeConvId(returnedConvId);
        // rafraîchir la sidebar
        loadConversations();
      }

      // 👉 Garde-fou : si l'utilisateur a changé d'onglet pendant l'attente,
      // on n'injecte pas la réponse dans le mauvais fil.
      const finalTarget = returnedConvId ?? requestConvId;
      if (finalTarget !== null && finalTarget === readConvId()) {
        setMessages((prev) => [...prev, { who: "bot", text: data.reply ?? "[empty reply]" }]);
      } else {
        // On ignore l’insertion pour éviter le mélange de conversations
        console.warn("Reply received for a non-active conversation. Skipping UI append.");
      }
    } catch (err: any) {
      console.error("❌ Erreur d’envoi:", err);
      setMessages((prev) => [...prev, { who: "bot", text: "Error: " + err.message }]);
    } finally {
      setLoading(false);
    }
  };

  // ------------------------------------------------------------
  // 🔹 Envoi via formulaire
  // ------------------------------------------------------------
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    sendMessage(text);
  };

  // ------------------------------------------------------------
  // 🔹 Supprimer / réinitialiser la conversation
  // ------------------------------------------------------------
  const handleResetConversation = async () => {
    const conv_id = readConvId();
    const user_id = getUserId();

    if (!conv_id) {
      setMessages([{ who: "bot", text: "No conversation to reset." }]);
      return;
    }

    try {
      const res = await fetch("http://127.0.0.1:8000/api/agent/conversation", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id, conversation_id: conv_id }),
      });

      if (!res.ok) throw new Error("HTTP " + res.status);

      // On nettoie l’état local et on rafraîchit la liste
      writeConvId(null);
      setMessages([{ who: "bot", text: "Conversation reset. Say hi to start again 👋" }]);
      loadConversations();
    } catch (err: any) {
      console.error(err);
      setMessages([{ who: "bot", text: "Error resetting conversation: " + err.message }]);
    }
  };

  // ------------------------------------------------------------
  // 🔹 Nouvelle conversation (on laisse le backend en créer une au premier message)
  // ------------------------------------------------------------
  const startNewConversation = () => {
    writeConvId(null);
    setMessages([{ who: "bot", text: "New conversation started 👋" }]);
  };

  // ------------------------------------------------------------
  // 🔹 Rendu
  // ------------------------------------------------------------
  return (
    <section className="flex gap-4">
      {/* 🔹 Sidebar des conversations */}
      <aside className="w-64 bg-[var(--bg)] border border-[var(--border)] rounded-xl p-4 overflow-y-auto">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-semibold text-white">Conversations</h3>
          <button
            onClick={startNewConversation}
            className="text-xs bg-indigo-600 px-2 py-1 rounded hover:bg-indigo-700"
          >
            + New
          </button>
        </div>

        {conversations.length === 0 ? (
          <p className="text-white/60 text-sm">No conversations yet.</p>
        ) : (
          <ul>
            {conversations.map((c) => (
              <li
                key={c.id}
                onClick={() => loadConversation(c.id)}
                className={`cursor-pointer rounded-md px-2 py-1 text-sm mb-1 ${
                  activeConv === c.id ? "bg-indigo-600 text-white" : "hover:bg-white/10 text-white/80"
                }`}
              >
                {c.title || `Conversation #${c.id}`}
              </li>
            ))}
          </ul>
        )}
      </aside>

      {/* 🔹 Zone principale du chat */}
      <div className="flex-1 rounded-2xl bg-[var(--card-bg)] border border-[var(--border)]">
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
      </div>
    </section>
  );
}
