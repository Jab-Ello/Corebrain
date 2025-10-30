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
  createdAt: string;    // ISO
  updatedAt: string;    // ISO
};

export type NoteCreateBody = {
  user_id: string;                 // requis par ton backend
  title: string;
  content: string;
  summary?: string | null;
  pinned?: boolean;
  project_ids?: string[];          // lier dès la création
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
    getProject: (id: string) => request<Project>(`/projects/${id}`),
    updateProject: (id: string, body: Partial<Project>) =>
  request<Project>(`/projects/${id}`, {
    method: "PUT",
    body: JSON.stringify(body),
  }),
    /** Notes liées à un projet (backend/routes/project.py -> GET /projects/{project_id}/notes) */
  async getProjectNotes(projectId: string) {
    return request<ProjectNote[]>(`/projects/${projectId}/notes`);
  },

  /** Toutes les notes d'un utilisateur (backend/routes/note.py -> GET /notes/user/{user_id}) */
  async getUserNotes(userId: string) {
    return request<Note[]>(`/notes/user/${userId}`);
  },

  /** Créer une note (backend/routes/note.py -> POST /notes) */
  async createNote(body: NoteCreateBody) {
    return request<Note>(`/notes/`, {
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  /** Mettre à jour une note (backend/routes/note.py -> PUT /notes/{note_id}) */
  async updateNote(noteId: string, body: NoteUpdateBody) {
    return request<Note>(`/notes/${noteId}`, {
      method: "PUT",
      body: JSON.stringify(body),
    });
  },

  /** Supprimer une note (backend/routes/note.py -> DELETE /notes/{note_id}) */
  async deleteNote(noteId: string) {
    return request<void>(`/notes/${noteId}`, { method: "DELETE" });
  },

  /** Lier une note existante à un projet (backend/routes/project.py -> POST /projects/{project_id}/notes/{note_id}) */
  async attachNoteToProject(projectId: string, noteId: string) {
    return request<{ message: string }>(`/projects/${projectId}/notes/${noteId}`, {
      method: "POST",
    });
  },

};
