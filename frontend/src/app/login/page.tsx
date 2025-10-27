"use client";

import { api } from "@/lib/api";
import { setSession } from "@/lib/session";
import { useState } from "react";
import Link from "next/link";

// If you're using the App Router, save this as: src/app/login/page.tsx
// This page keeps the look & feel consistent with your existing gray sidebar theme,
// using a clean centered auth card. It doesn't depend on shadcn to avoid extra setup.

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
  e.preventDefault();
  setError(null);

  if (!email || !password) { setError("E-mail et mot de passe requis."); return; }

  try {
    setLoading(true);
    const res = await api.login({ email, password });
    // Sauvegarde "session" en localStorage
    setSession({ userId: res.user_id, name: res.name });
    // Redirige où tu veux
    window.location.href = "/";
  } catch (err: any) {
    setError(err?.message ?? "Impossible de se connecter.");
  } finally {
    setLoading(false);
  }
}

  return (
    <main className="min-h-[100dvh] bg-gray-50 dark:bg-gray-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Brand header */}
        <div className="mb-6 text-center">
          <div className="inline-flex items-center justify-center size-12 rounded-2xl bg-gray-800 text-white shadow">
            {/* Simple logo glyph */}
            <svg aria-hidden="true" viewBox="0 0 24 24" className="size-6">
              <path fill="currentColor" d="M12 2a10 10 0 1 0 10 10A10.011 10.011 0 0 0 12 2Zm1 14.5a1 1 0 0 1-2 0V11a1 1 0 0 1 2 0Zm-1-8a1.25 1.25 0 1 1 1.25-1.25A1.251 1.251 0 0 1 12 8.5Z"/>
            </svg>
          </div>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">
            Connecte‑toi
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Entre tes identifiants pour accéder à ton espace.
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl bg-white dark:bg-gray-900 shadow-sm ring-1 ring-gray-200/60 dark:ring-white/10 p-6">
          <form onSubmit={onSubmit} className="space-y-4" noValidate>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                E‑mail
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                inputMode="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@exemple.com"
                className="mt-1 block w-full rounded-xl border border-gray-300 dark:border-white/10 bg-white dark:bg-gray-950 px-3 py-2 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-800/70"
              />
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                  Mot de passe
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="text-xs text-gray-600 dark:text-gray-300 hover:underline"
                  aria-pressed={showPassword}
                >
                  {showPassword ? "Masquer" : "Afficher"}
                </button>
              </div>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 block w-full rounded-xl border border-gray-300 dark:border-white/10 bg-white dark:bg-gray-950 px-3 py-2 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-800/70"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 select-none">
                <input type="checkbox" className="size-4 rounded border-gray-300 dark:border-white/10" />
                Se souvenir de moi
              </label>
              <Link href="/forgot-password" className="text-sm text-gray-700 dark:text-gray-200 hover:underline">
                Mot de passe oublié ?
              </Link>
            </div>

            {error && (
              <div className="rounded-lg border border-red-300/60 dark:border-red-500/30 bg-red-50/80 dark:bg-red-950/30 px-3 py-2 text-sm text-red-700 dark:text-red-200">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-gray-800 text-white py-2.5 font-medium shadow-sm hover:bg-gray-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? "Connexion…" : "Se connecter"}
            </button>

            {/* Divider */}
            <div className="relative my-2">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-200 dark:border-white/10" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white dark:bg-gray-900 px-2 text-xs text-gray-500">ou</span>
              </div>
            </div>

            {/* Social buttons — wire up as needed */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                className="rounded-xl border border-gray-300 dark:border-white/10 bg-white dark:bg-gray-950 px-3 py-2 text-sm text-gray-800 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-900"
                onClick={() => alert("TODO: OAuth Google")}>
                Continuer avec Google
              </button>
              <button
                type="button"
                className="rounded-xl border border-gray-300 dark:border-white/10 bg-white dark:bg-gray-950 px-3 py-2 text-sm text-gray-800 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-900"
                onClick={() => alert("TODO: OAuth GitHub")}>
                Continuer avec GitHub
              </button>
            </div>

            <p className="text-center text-sm text-gray-600 dark:text-gray-300">
              Pas de compte ?{" "}
              <Link href="/register" className="font-medium text-gray-900 dark:text-white hover:underline">
                Crée un compte
              </Link>
            </p>
          </form>
        </div>

        {/* Footer hint to keep parity with your sidebar theme */}
        <p className="mt-6 text-center text-xs text-gray-500 dark:text-gray-400">
          Protégé par chiffrement côté serveur. En te connectant, tu acceptes nos Conditions d'utilisation.
        </p>
      </div>
    </main>
  );
}
