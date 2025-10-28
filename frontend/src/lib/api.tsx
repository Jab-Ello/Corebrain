const API = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000";

export type ProjectCreateBody = {
  user_id: string;
  name: string;
  description?: string | null;
  context?: string | null;
  color?: string | null;
  priority?: number;
  // envoie une date ISO (ex: "2025-10-28T00:00:00.000Z") si tu l’utilises
  plannedEndDate?: string | null;
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
};

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<T>;
}

export type User = {
  id: string; name: string; email: string; avatarUrl?: string; createdAt?: string;
};

export const api = {
  // POST /users/login => { message, user_id, name }
  login: (body: { email: string; password: string }) =>
    request<{ message: string; user_id: string; name: string }>("/users/login", {
      method: "POST",
      body: JSON.stringify(body),
    }),
    
  // CRUD utiles
  createUser: (b: { name: string; email: string; password: string; avatarUrl?: string }) =>
    request<User>("/users/", { method: "POST", body: JSON.stringify(b) }),
  getUsers: () => request<User[]>("/users/"),
  getUser: (id: string) => request<User>(`/users/${id}`),
  updateUser: (id: string, b: Partial<{ name: string; avatarUrl: string; password: string }>) =>
    request<User>(`/users/${id}`, { method: "PUT", body: JSON.stringify(b) }),
  deleteUser: (id: string) => request(`/users/${id}`, { method: "DELETE" }),
  getProjectsByUser: (userId: string) =>
    request<Project[]>(`/projects/user/${userId}`),
  createProject: (body: ProjectCreateBody) =>
    request<Project>("/projects/", {
      method: "POST",
      body: JSON.stringify(body),
    }),
};
