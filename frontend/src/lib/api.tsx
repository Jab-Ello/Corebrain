// src/lib/api.ts
import { CONFIG } from "@/lib/config";

const API_ORIGIN = CONFIG.API_BASE_URL;

// ─── TYPES DE BASE ─────────────────────────────────────────────────────────────
export type ProjectCreateBody = {
  user_id: string;
  name: string;
  description?: string | null;
  context?: string | null;
  color?: string | null;
  priority?: number;
  plannedEndDate?: string | null; // ISO ex: "2025-10-28T00:00:00.000Z"
};

export type Project = {
  id: string;
  name: string;
  description?: string | null;
  context?: string | null;
  color?: string | null;
  priority: number;
  status: string;
  user_id: string;
  createdAt: string;
  updatedAt: string;
  plannedEndDate?: string | null;
  endDate?: string | null;
};

export type ProjectNote = {
  note_id: string;
  title: string;
  content: string;
  createdAt: string;
};

export type Note = {
  id: string;
  title: string;
  content: string;
  summary?: string | null;
  pinned: boolean;
  user_id: string;
  createdAt: string;
  updatedAt: string;
};

export type NoteCreateBody = {
  user_id: string;
  title: string;
  content: string;
  summary?: string | null;
  pinned?: boolean;
  project_ids?: string[];
  area_ids?: string[];
  tag_names?: string[];
};

export type NoteUpdateBody = {
  title?: string;
  content?: string;
  summary?: string | null;
  pinned?: boolean;
  project_ids?: string[];
  area_ids?: string[];
  tag_names?: string[];
};

export type ProjectStatus = "active" | "archived";
export const PROJECT_STATUSES: ProjectStatus[] = ["active", "archived"];

export type AgentTriggerBody = {
  action?: "analyze" | "summarize" | "plan" | "triage";
  max_tokens?: number;
  dry_run?: boolean;
};

export type TriggerResponse = {
  ok: boolean;
  queued?: boolean;
  project_id?: string;
  message?: string;
};

// ─── REQUEST WRAPPER (avec anti-cache pour GET) ────────────────────────────────
async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const isGet = !init.method || init.method.toUpperCase() === "GET";
  const pathWithTs = isGet ? `${path}${path.includes("?") ? "&" : "?"}_=${Date.now()}` : path;
  const url = CONFIG.url.api(pathWithTs);

  const res = await fetch(url, {
    ...init,
    credentials: "include",
    cache: "no-store",
    // @ts-ignore
    next: { revalidate: 0 },
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "Cache-Control": "no-cache",
      Pragma: "no-cache",
      ...(init.headers || {}),
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} ${res.statusText} @ ${url}\n${text}`);
  }

  return res.headers.get("content-type")?.includes("application/json")
    ? (res.json() as Promise<T>)
    : (Promise.resolve(undefined as unknown as T));
}

// ─── AUTRES TYPES ──────────────────────────────────────────────────────────────
export type User = {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  createdAt?: string;
};

export type AreaCreateBody = {
  user_id: string;
  name: string;
  description?: string | null;
  color?: string | null;
};

export type Area = {
  id: string;
  name: string;
  description?: string | null;
  color?: string | null;
  user_id: string;
  createdAt: string;
  updatedAt: string;
};

export type AreaNote = {
  note_id: string;
  title: string;
  content: string;
  createdAt: string;
};

export type ProjectTodo = {
  id: string;
  title: string;
  done: boolean;
  dueDate?: string | null;
  priority?: "low" | "medium" | "high";
  noteId?: string | null;
};

// ─── API ───────────────────────────────────────────────────────────────────────
export const api = {
  // ─── AUTH ─────────────────────────────────────────────────────────────
  login: (body: { email: string; password: string }) =>
    request<{ message: string; user_id: string; name: string }>("/users/login", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  createUser: (b: { name: string; email: string; password: string; avatarUrl?: string }) =>
    request<User>("/users/", { method: "POST", body: JSON.stringify(b) }),
  getUsers: () => request<User[]>("/users/"),
  getUser: (id: string) => request<User>(`/users/${id}`),
  updateUser: (id: string, b: Partial<{ name: string; avatarUrl: string; password: string }>) =>
    request<User>(`/users/${id}`, { method: "PUT", body: JSON.stringify(b) }),
  deleteUser: (id: string) => request(`/users/${id}`, { method: "DELETE" }),

  // ─── PROJECTS ─────────────────────────────────────────────────────────
  getProjectsByUser: (userId: string) => request<Project[]>(`/projects/user/${userId}`),
  createProject: (body: ProjectCreateBody) =>
    request<Project>("/projects/", { method: "POST", body: JSON.stringify(body) }),
  getProject: (id: string) => request<Project>(`/projects/${id}`),
  updateProject: (id: string, body: Partial<Project>) =>
    request<Project>(`/projects/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  updateProjectStatus: (id: string, status: ProjectStatus) =>
    request(`/projects/${id}`, { method: "PUT", body: JSON.stringify({ status }) }),

  // ─── N8N Trigger / Workflow ───────────────────────────────────────────
  triggerProjectAgent: (projectId: string, body?: AgentTriggerBody) =>
    request<TriggerResponse>(`/projects/${projectId}/trigger`, {
      method: "POST",
      body: JSON.stringify(body ?? {}),
    }),

  // ─── PROJECT NOTES ────────────────────────────────────────────────────
  getProjectNotes: (projectId: string) =>
    request<ProjectNote[]>(`/projects/${projectId}/notes`),
  attachNoteToProject: (projectId: string, noteId: string) =>
    request<{ message: string }>(`/projects/${projectId}/notes/${noteId}`, {
      method: "POST",
    }),

  // ─── NOTES ────────────────────────────────────────────────────────────
  getNote: (noteId: string) => request<Note>(`/notes/${noteId}`),
  getUserNotes: (userId: string) => request<Note[]>(`/notes/user/${userId}`),
  createNote: (body: NoteCreateBody) =>
    request<Note>(`/notes/`, { method: "POST", body: JSON.stringify(body) }),
  updateNote: (noteId: string, body: NoteUpdateBody) =>
    request<Note>(`/notes/${noteId}`, { method: "PUT", body: JSON.stringify(body) }),
  deleteNote: (noteId: string) => request<void>(`/notes/${noteId}`, { method: "DELETE" }),

  // ─── AREAS ────────────────────────────────────────────────────────────
  getAreasByUser: (userId: string) => request<Area[]>(`/areas/user/${userId}`),
  getArea: (areaId: string) => request<Area>(`/areas/${areaId}`),
  createArea: (body: AreaCreateBody) =>
    request<Area>(`/areas/`, { method: "POST", body: JSON.stringify(body) }),
  updateArea: (areaId: string, body: Partial<Omit<Area, "id" | "user_id" | "createdAt" | "updatedAt">>) =>
    request<Area>(`/areas/${areaId}`, { method: "PUT", body: JSON.stringify(body) }),
  deleteArea: (areaId: string) => request<void>(`/areas/${areaId}`, { method: "DELETE" }),
  getAreaNotes: (areaId: string) => request<AreaNote[]>(`/areas/${areaId}/notes`),
  attachNoteToArea: (areaId: string, noteId: string) =>
    request<{ message: string }>(`/areas/${areaId}/notes/${noteId}`, { method: "POST" }),

  // ─── AGENT CHAT ───────────────────────────────────────────────────────
  agentChat: (body: { user_id: string; conversation_id?: string | null; message: string }) =>
    request<{ conversation_id?: string; reply?: string }>(CONFIG.endpoints.agentChat(), {
      method: "POST",
      body: JSON.stringify(body),
    }),

  // ─── PROJECT TODOS & PLANNING ─────────────────────────────────────────
  getProjectTodos: (projectId: string) =>
    request<ProjectTodo[]>(`/projects/${projectId}/agent/todos`),

  getProjectPlanning: (projectId: string) =>
    request<any>(`/projects/${projectId}/agent/planning`),

  // ─── N8N GLOBAL ROUTES ────────────────────────────────────────────────
  getAgentTodos: () => request<any>(`/projects/agent/todos/latest`),
  getAgentAnalysis: () => request<any>(`/projects/agent/analysis/latest`),
  getAgentAdvices: () => request<any>(`/projects/agent/advices/latest`),
};

export { API_ORIGIN };
