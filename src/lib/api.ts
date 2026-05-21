import { User, Project, Task, CommLog, MeetingLog, Documentation, LogEntry } from "../types";

const API_BASE = "/api";

// Helper for dynamic response handling
async function handleResponse(res: Response) {
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || `HTTP error! status: ${res.status}`);
  }
  return res.json();
}

// Session Helpers
export function getSavedToken(): string | null {
  return localStorage.getItem("taskhub_token");
}

export function getSavedUser(): User | null {
  const u = localStorage.getItem("taskhub_user");
  return u ? JSON.parse(u) : null;
}

export function saveSession(token: string, user: User) {
  localStorage.setItem("taskhub_token", token);
  localStorage.setItem("taskhub_user", JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem("taskhub_token");
  localStorage.removeItem("taskhub_user");
}

export const api = {
  // Authentication
  async login(username: string, password: string): Promise<{ token: string; user: User }> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });
    return handleResponse(res);
  },

  async register(data: Partial<User>): Promise<{ message: string; user: User }> {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  // Users CRUD (Admin Area)
  async getUsers(): Promise<User[]> {
    const res = await fetch(`${API_BASE}/users`);
    return handleResponse(res);
  },

  async createUser(data: Partial<User>): Promise<User> {
    const res = await fetch(`${API_BASE}/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async updateUser(id: string, data: Partial<User>): Promise<User> {
    const res = await fetch(`${API_BASE}/users/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async deleteUser(id: string): Promise<{ success: boolean }> {
    const res = await fetch(`${API_BASE}/users/${id}`, {
      method: "DELETE"
    });
    return handleResponse(res);
  },

  // Projects CRUD
  async getProjects(): Promise<Project[]> {
    const res = await fetch(`${API_BASE}/projects`);
    return handleResponse(res);
  },

  async createProject(data: Partial<Project>): Promise<Project> {
    const res = await fetch(`${API_BASE}/projects`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async updateProject(id: string, data: Partial<Project>): Promise<Project> {
    const res = await fetch(`${API_BASE}/projects/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async deleteProject(id: string): Promise<{ success: boolean }> {
    const res = await fetch(`${API_BASE}/projects/${id}`, {
      method: "DELETE"
    });
    return handleResponse(res);
  },

  // Tasks CRUD
  async getTasks(): Promise<Task[]> {
    const res = await fetch(`${API_BASE}/tasks`);
    return handleResponse(res);
  },

  async createTask(data: Partial<Task>): Promise<Task> {
    const res = await fetch(`${API_BASE}/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async updateTask(id: string, data: Partial<Task>): Promise<Task> {
    const res = await fetch(`${API_BASE}/tasks/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async deleteTask(id: string): Promise<{ success: boolean }> {
    const res = await fetch(`${API_BASE}/tasks/${id}`, {
      method: "DELETE"
    });
    return handleResponse(res);
  },

  // Communication Logs CRUD
  async getCommLogs(): Promise<CommLog[]> {
    const res = await fetch(`${API_BASE}/commlogs`);
    return handleResponse(res);
  },

  async createCommLog(data: Partial<CommLog>): Promise<CommLog> {
    const res = await fetch(`${API_BASE}/commlogs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async deleteCommLog(id: string): Promise<{ success: boolean }> {
    const res = await fetch(`${API_BASE}/commlogs/${id}`, {
      method: "DELETE"
    });
    return handleResponse(res);
  },

  // Minutes of Meeting CRUD
  async getMeetingLogs(): Promise<MeetingLog[]> {
    const res = await fetch(`${API_BASE}/meetinglogs`);
    return handleResponse(res);
  },

  async createMeetingLog(data: Partial<MeetingLog>): Promise<MeetingLog> {
    const res = await fetch(`${API_BASE}/meetinglogs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async deleteMeetingLog(id: string): Promise<{ success: boolean }> {
    const res = await fetch(`${API_BASE}/meetinglogs/${id}`, {
      method: "DELETE"
    });
    return handleResponse(res);
  },

  // Documentations CRUD
  async getDocs(): Promise<Documentation[]> {
    const res = await fetch(`${API_BASE}/docs`);
    return handleResponse(res);
  },

  async createDoc(data: Partial<Documentation>): Promise<Documentation> {
    const res = await fetch(`${API_BASE}/docs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async deleteDoc(id: string): Promise<{ success: boolean }> {
    const res = await fetch(`${API_BASE}/docs/${id}`, {
      method: "DELETE"
    });
    return handleResponse(res);
  },

  // Diagnostic Logs (issue, solution, focus) CRUD
  async getLogs(): Promise<LogEntry[]> {
    const res = await fetch(`${API_BASE}/logs`);
    return handleResponse(res);
  },

  async createLog(data: Partial<LogEntry>): Promise<LogEntry> {
    const res = await fetch(`${API_BASE}/logs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async deleteLog(id: string): Promise<{ success: boolean }> {
    const res = await fetch(`${API_BASE}/logs/${id}`, {
      method: "DELETE"
    });
    return handleResponse(res);
  },

  // System Settings Config
  async getSettings(): Promise<any> {
    const res = await fetch(`${API_BASE}/settings`);
    return handleResponse(res);
  },

  async updateSettings(data: any): Promise<any> {
    const res = await fetch(`${API_BASE}/settings`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  }
};
