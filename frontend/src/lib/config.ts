// src/lib/config.ts
// Point unique de vérité pour toutes les URLs/Routes front & back.

function trimSlash(s: string) {
  return s.replace(/\/+$/, "");
}
function joinUrl(base: string, path: string) {
  const b = trimSlash(base);
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${b}${p}`;
}

export const CONFIG = {
  // ORIGINES
  API_BASE_URL: trimSlash(process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://pretangible-annett-perseverant.ngrok-free.dev"),
  FRONTEND_ORIGIN: trimSlash(process.env.NEXT_PUBLIC_FRONTEND_ORIGIN ?? "https://pretangible-annett-perseverant.ngrok-free.dev"),

  // ENDPOINTS BACKEND (toutes les routes publiques du backend passent par ici)
  endpoints: {
    // Projects
    projects: () => "/projects",
    projectById: (projectId: string) => `/projects/${projectId}`,
    notesForProject: (projectId: string) => `/projects/${projectId}/notes`,
    // Users
    userProjects: (userId: string) => `/users/${userId}/projects`,
    // Auth si besoin (exemple)
    login: () => "/auth/login",
    logout: () => "/auth/logout",
    agentChat: () => "/api/agent/chat",
  },

  // Helpers pour construire des URLs absolues depuis les endpoints
  url: {
    api: (path: string) => joinUrl(process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://pretangible-annett-perseverant.ngrok-free.dev", path),
    app: (path: string) => joinUrl(process.env.NEXT_PUBLIC_FRONTEND_ORIGIN ?? "https://pretangible-annett-perseverant.ngrok-free.dev", path),
  },
} as const;
