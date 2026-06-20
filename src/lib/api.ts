import { User, Project, Task, CommLog, MeetingLog, Documentation, LogEntry, Client, BALog, Ticket, AppModule, Asset, SiteModuleImplementation, MonevLog, BillingKSO, AtkItem, AtkOrder, KasSiteTransaction, KasSiteReplenishment, KasLock, KasUnlockRequest, ChecklistItemSetting, ChecklistSubmission } from "../types";

const API_BASE = "/api";

// Robust fetch wrapper with backoff retry to handle dev server startup/restarts gracefully
async function safeFetch(url: string, options?: RequestInit, retries = 5, delay = 800): Promise<Response> {
  try {
    return await fetch(url, options);
  } catch (err: any) {
    if (retries > 0) {
      console.warn(`[API] Fetch to ${url} failed: ${err.message || err}. Retrying in ${delay}ms (${retries} attempts left)...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return safeFetch(url, options, retries - 1, delay * 1.5);
    }
    throw err;
  }
}


// Helper for dynamic response handling
async function handleResponse(res: Response) {
  const contentType = res.headers.get("content-type") || "";
  
  if (!res.ok) {
    let errorMessage = `HTTP error! status: ${res.status}`;
    if (contentType.includes("application/json")) {
      const errData = await res.json().catch(() => ({}));
      errorMessage = errData.error || errorMessage;
    } else {
      const text = await res.text().catch(() => "");
      console.error(`Error response body: ${text.slice(0, 200)}`);
    }
    throw new Error(errorMessage);
  }
  
  if (!contentType.includes("application/json")) {
    const text = await res.text().catch(() => "");
    console.error(`Expected JSON but received content-type: ${contentType}. Body sample: ${text.slice(0, 200)}`);
    throw new Error(`Server returned unexpected format (non-JSON response).`);
  }
  
  return res.json().catch((err) => {
    console.error("Failed to parse JSON response:", err);
    throw new Error("Gagal mengurai respon server (Format JSON tidak valid).");
  });
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
    const res = await safeFetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });
    return handleResponse(res);
  },

  async register(data: Partial<User>): Promise<{ message: string; user: User }> {
    const res = await safeFetch(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  // Users CRUD (Admin Area)
  async getUsers(): Promise<User[]> {
    const res = await safeFetch(`${API_BASE}/users`);
    return handleResponse(res);
  },

  async createUser(data: Partial<User>): Promise<User> {
    const res = await safeFetch(`${API_BASE}/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async updateUser(id: string, data: Partial<User>): Promise<User> {
    const res = await safeFetch(`${API_BASE}/users/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async deleteUser(id: string): Promise<{ success: boolean }> {
    const res = await safeFetch(`${API_BASE}/users/${id}`, {
      method: "DELETE"
    });
    return handleResponse(res);
  },

  // Projects CRUD
  async getProjects(): Promise<Project[]> {
    const res = await safeFetch(`${API_BASE}/projects`);
    return handleResponse(res);
  },

  async createProject(data: Partial<Project>): Promise<Project> {
    const res = await safeFetch(`${API_BASE}/projects`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async updateProject(id: string, data: Partial<Project>): Promise<Project> {
    const res = await safeFetch(`${API_BASE}/projects/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async deleteProject(id: string): Promise<{ success: boolean }> {
    const res = await safeFetch(`${API_BASE}/projects/${id}`, {
      method: "DELETE"
    });
    return handleResponse(res);
  },

  // Tasks CRUD
  async getTasks(): Promise<Task[]> {
    const res = await safeFetch(`${API_BASE}/tasks`);
    return handleResponse(res);
  },

  async createTask(data: Partial<Task>): Promise<Task> {
    const res = await safeFetch(`${API_BASE}/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async updateTask(id: string, data: Partial<Task>): Promise<Task> {
    const res = await safeFetch(`${API_BASE}/tasks/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async deleteTask(id: string): Promise<{ success: boolean }> {
    const res = await safeFetch(`${API_BASE}/tasks/${id}`, {
      method: "DELETE"
    });
    return handleResponse(res);
  },

  // Communication Logs CRUD
  async getCommLogs(): Promise<CommLog[]> {
    const res = await safeFetch(`${API_BASE}/commlogs`);
    return handleResponse(res);
  },

  async createCommLog(data: Partial<CommLog>): Promise<CommLog> {
    const res = await safeFetch(`${API_BASE}/commlogs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async deleteCommLog(id: string): Promise<{ success: boolean }> {
    const res = await safeFetch(`${API_BASE}/commlogs/${id}`, {
      method: "DELETE"
    });
    return handleResponse(res);
  },

  async updateCommLog(id: string, data: Partial<CommLog>): Promise<CommLog> {
    const res = await safeFetch(`${API_BASE}/commlogs/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  // Minutes of Meeting CRUD
  async getMeetingLogs(): Promise<MeetingLog[]> {
    const res = await safeFetch(`${API_BASE}/meetinglogs`);
    return handleResponse(res);
  },

  async createMeetingLog(data: Partial<MeetingLog>): Promise<MeetingLog> {
    const res = await safeFetch(`${API_BASE}/meetinglogs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async deleteMeetingLog(id: string): Promise<{ success: boolean }> {
    const res = await safeFetch(`${API_BASE}/meetinglogs/${id}`, {
      method: "DELETE"
    });
    return handleResponse(res);
  },

  async updateMeetingLog(id: string, data: Partial<MeetingLog>): Promise<MeetingLog> {
    const res = await safeFetch(`${API_BASE}/meetinglogs/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  // Documentations CRUD
  async getDocs(): Promise<Documentation[]> {
    const res = await safeFetch(`${API_BASE}/docs`);
    return handleResponse(res);
  },

  async createDoc(data: Partial<Documentation>): Promise<Documentation> {
    const res = await safeFetch(`${API_BASE}/docs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async deleteDoc(id: string): Promise<{ success: boolean }> {
    const res = await safeFetch(`${API_BASE}/docs/${id}`, {
      method: "DELETE"
    });
    return handleResponse(res);
  },

  async updateDoc(id: string, data: Partial<Documentation>): Promise<Documentation> {
    const res = await safeFetch(`${API_BASE}/docs/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  // Diagnostic Logs (issue, solution, focus) CRUD
  async getLogs(): Promise<LogEntry[]> {
    const res = await safeFetch(`${API_BASE}/logs`);
    return handleResponse(res);
  },

  async createLog(data: Partial<LogEntry>): Promise<LogEntry> {
    const res = await safeFetch(`${API_BASE}/logs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async deleteLog(id: string): Promise<{ success: boolean }> {
    const res = await safeFetch(`${API_BASE}/logs/${id}`, {
      method: "DELETE"
    });
    return handleResponse(res);
  },

  // System Settings Config
  async getSettings(): Promise<any> {
    const res = await safeFetch(`${API_BASE}/settings`);
    return handleResponse(res);
  },

  async updateSettings(data: any): Promise<any> {
    const res = await safeFetch(`${API_BASE}/settings`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  // Clients / RS CRUD
  async getClients(): Promise<Client[]> {
    const res = await safeFetch(`${API_BASE}/clients`);
    return handleResponse(res);
  },

  async createClient(data: Partial<Client>): Promise<Client> {
    const res = await safeFetch(`${API_BASE}/clients`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async updateClient(id: string, data: Partial<Client>): Promise<Client> {
    const res = await safeFetch(`${API_BASE}/clients/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async deleteClient(id: string): Promise<{ success: boolean }> {
    const res = await safeFetch(`${API_BASE}/clients/${id}`, {
      method: "DELETE"
    });
    return handleResponse(res);
  },

  // Berita Acara (BA) Logs CRUD
  async getBALogs(): Promise<BALog[]> {
    const res = await safeFetch(`${API_BASE}/balogs`);
    return handleResponse(res);
  },

  async createBALog(data: Partial<BALog>): Promise<BALog> {
    const res = await safeFetch(`${API_BASE}/balogs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async deleteBALog(id: string): Promise<{ success: boolean }> {
    const res = await safeFetch(`${API_BASE}/balogs/${id}`, {
      method: "DELETE"
    });
    return handleResponse(res);
  },

  async updateBALog(id: string, data: Partial<BALog>): Promise<BALog> {
    const res = await safeFetch(`${API_BASE}/balogs/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  // Ticket / Helpdesk CRUD
  async getTickets(): Promise<Ticket[]> {
    const res = await safeFetch(`${API_BASE}/tickets`);
    return handleResponse(res);
  },

  async createTicket(data: Partial<Ticket>): Promise<Ticket> {
    const res = await safeFetch(`${API_BASE}/tickets`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async updateTicket(id: string, data: Partial<Ticket>): Promise<Ticket> {
    const res = await safeFetch(`${API_BASE}/tickets/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async deleteTicket(id: string): Promise<{ success: boolean }> {
    const res = await safeFetch(`${API_BASE}/tickets/${id}`, {
      method: "DELETE"
    });
    return handleResponse(res);
  },

  // App Modules CRUD
  async getAppModules(): Promise<AppModule[]> {
    const res = await safeFetch(`${API_BASE}/appmodules`);
    return handleResponse(res);
  },

  async createAppModule(data: Partial<AppModule>): Promise<AppModule> {
    const res = await safeFetch(`${API_BASE}/appmodules`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async updateAppModule(id: string, data: Partial<AppModule>): Promise<AppModule> {
    const res = await safeFetch(`${API_BASE}/appmodules/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async deleteAppModule(id: string): Promise<{ success: boolean }> {
    const res = await safeFetch(`${API_BASE}/appmodules/${id}`, {
      method: "DELETE"
    });
    return handleResponse(res);
  },

  // Assets Management CRUD
  async getAssets(): Promise<Asset[]> {
    const res = await safeFetch(`${API_BASE}/assets`);
    return handleResponse(res);
  },

  async createAsset(data: Partial<Asset>): Promise<Asset> {
    const res = await safeFetch(`${API_BASE}/assets`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async updateAsset(id: string, data: Partial<Asset>): Promise<Asset> {
    const res = await safeFetch(`${API_BASE}/assets/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async deleteAsset(id: string): Promise<{ success: boolean }> {
    const res = await safeFetch(`${API_BASE}/assets/${id}`, {
      method: "DELETE"
    });
    return handleResponse(res);
  },

  // Site Module Implementations CRUD
  async getSiteImplementations(): Promise<SiteModuleImplementation[]> {
    const res = await safeFetch(`${API_BASE}/siteimplementations`);
    return handleResponse(res);
  },

  async createSiteImplementation(data: Partial<SiteModuleImplementation>): Promise<SiteModuleImplementation> {
    const res = await safeFetch(`${API_BASE}/siteimplementations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async updateSiteImplementation(id: string, data: Partial<SiteModuleImplementation>): Promise<SiteModuleImplementation> {
    const res = await safeFetch(`${API_BASE}/siteimplementations/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async deleteSiteImplementation(id: string): Promise<{ success: boolean }> {
    const res = await safeFetch(`${API_BASE}/siteimplementations/${id}`, {
      method: "DELETE"
    });
    return handleResponse(res);
  },

  // Monitoring Evaluasi (Monev) CRUD
  async getMonevLogs(): Promise<MonevLog[]> {
    const res = await safeFetch(`${API_BASE}/monev`);
    return handleResponse(res);
  },

  async createMonevLog(data: Partial<MonevLog>): Promise<MonevLog> {
    const res = await safeFetch(`${API_BASE}/monev`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async updateMonevLog(id: string, data: Partial<MonevLog>): Promise<MonevLog> {
    const res = await safeFetch(`${API_BASE}/monev/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async deleteMonevLog(id: string): Promise<{ success: boolean }> {
    const res = await safeFetch(`${API_BASE}/monev/${id}`, {
      method: "DELETE"
    });
    return handleResponse(res);
  },

  // Billing KSO & ATK CRUD
  async getBillings(): Promise<BillingKSO[]> {
    const res = await safeFetch(`${API_BASE}/billing`);
    return handleResponse(res);
  },

  async createBilling(data: Partial<BillingKSO>): Promise<BillingKSO> {
    const res = await safeFetch(`${API_BASE}/billing`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async updateBilling(id: string, data: Partial<BillingKSO>): Promise<BillingKSO> {
    const res = await safeFetch(`${API_BASE}/billing/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async deleteBilling(id: string): Promise<{ success: boolean }> {
    const res = await safeFetch(`${API_BASE}/billing/${id}`, {
      method: "DELETE"
    });
    return handleResponse(res);
  },

  // ATK Master Items API
  async getAtkItems(): Promise<AtkItem[]> {
    const res = await safeFetch(`${API_BASE}/atk/items`);
    return handleResponse(res);
  },

  async createAtkItem(data: Partial<AtkItem>): Promise<AtkItem> {
    const res = await safeFetch(`${API_BASE}/atk/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async updateAtkItem(id: string, data: Partial<AtkItem>): Promise<AtkItem> {
    const res = await safeFetch(`${API_BASE}/atk/items/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async deleteAtkItem(id: string): Promise<{ success: boolean }> {
    const res = await safeFetch(`${API_BASE}/atk/items/${id}`, {
      method: "DELETE"
    });
    return handleResponse(res);
  },

  // ATK Orders API
  async getAtkOrders(): Promise<AtkOrder[]> {
    const res = await safeFetch(`${API_BASE}/atk/orders`);
    return handleResponse(res);
  },

  async createAtkOrder(data: Partial<AtkOrder>): Promise<AtkOrder> {
    const res = await safeFetch(`${API_BASE}/atk/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async updateAtkOrder(id: string, data: Partial<AtkOrder>): Promise<AtkOrder> {
    const res = await safeFetch(`${API_BASE}/atk/orders/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async deleteAtkOrder(id: string): Promise<{ success: boolean }> {
    const res = await safeFetch(`${API_BASE}/atk/orders/${id}`, {
      method: "DELETE"
    });
    return handleResponse(res);
  },

  // Kas Site CRUD API
  async getKasSiteTransactions(): Promise<KasSiteTransaction[]> {
    const res = await safeFetch(`${API_BASE}/kassite`);
    return handleResponse(res);
  },

  async createKasSiteTransaction(data: Partial<KasSiteTransaction>): Promise<KasSiteTransaction> {
    const res = await safeFetch(`${API_BASE}/kassite`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async updateKasSiteTransaction(id: string, data: Partial<KasSiteTransaction>): Promise<KasSiteTransaction> {
    const res = await safeFetch(`${API_BASE}/kassite/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async deleteKasSiteTransaction(id: string): Promise<{ success: boolean }> {
    const res = await safeFetch(`${API_BASE}/kassite/${id}`, {
      method: "DELETE"
    });
    return handleResponse(res);
  },

  // Kas Site Replenishment CRUD API
  async getKasSiteReplenishments(): Promise<KasSiteReplenishment[]> {
    const res = await safeFetch(`${API_BASE}/kassite/replenish`);
    return handleResponse(res);
  },

  async createKasSiteReplenishment(data: Partial<KasSiteReplenishment>): Promise<KasSiteReplenishment> {
    const res = await safeFetch(`${API_BASE}/kassite/replenish`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async updateKasSiteReplenishment(id: string, data: Partial<KasSiteReplenishment>): Promise<KasSiteReplenishment> {
    const res = await safeFetch(`${API_BASE}/kassite/replenish/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async deleteKasSiteReplenishment(id: string): Promise<{ success: boolean }> {
    const res = await safeFetch(`${API_BASE}/kassite/replenish/${id}`, {
      method: "DELETE"
    });
    return handleResponse(res);
  },

  // Lock and Unlock Requests API
  async getKasLocks(): Promise<KasLock[]> {
    const res = await safeFetch(`${API_BASE}/kassite/locks`);
    return handleResponse(res);
  },

  async toggleKasLock(data: Partial<KasLock>): Promise<KasLock> {
    const res = await safeFetch(`${API_BASE}/kassite/locks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async getKasUnlockRequests(): Promise<KasUnlockRequest[]> {
    const res = await safeFetch(`${API_BASE}/kassite/unlock-requests`);
    return handleResponse(res);
  },

  async createKasUnlockRequest(data: Partial<KasUnlockRequest>): Promise<KasUnlockRequest> {
    const res = await safeFetch(`${API_BASE}/kassite/unlock-requests`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async updateKasUnlockRequest(id: string, data: Partial<KasUnlockRequest>): Promise<KasUnlockRequest> {
    const res = await safeFetch(`${API_BASE}/kassite/unlock-requests/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  // Checklist Settings CRUD APIs
  async getChecklistSettings(): Promise<ChecklistItemSetting[]> {
    const res = await safeFetch(`${API_BASE}/checklist/settings`);
    return handleResponse(res);
  },

  async createChecklistItemSetting(data: Partial<ChecklistItemSetting>): Promise<ChecklistItemSetting> {
    const res = await safeFetch(`${API_BASE}/checklist/settings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async updateChecklistItemSetting(id: string, data: Partial<ChecklistItemSetting>): Promise<ChecklistItemSetting> {
    const res = await safeFetch(`${API_BASE}/checklist/settings/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async deleteChecklistItemSetting(id: string): Promise<{ success: boolean }> {
    const res = await safeFetch(`${API_BASE}/checklist/settings/${id}`, {
      method: "DELETE"
    });
    return handleResponse(res);
  },

  // Checklist Submissions CRUD APIs
  async getChecklistSubmissions(): Promise<ChecklistSubmission[]> {
    const res = await safeFetch(`${API_BASE}/checklists`);
    return handleResponse(res);
  },

  async createChecklistSubmission(data: Partial<ChecklistSubmission>): Promise<ChecklistSubmission> {
    const res = await safeFetch(`${API_BASE}/checklists`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async updateChecklistSubmission(id: string, data: Partial<ChecklistSubmission>): Promise<ChecklistSubmission> {
    const res = await safeFetch(`${API_BASE}/checklists/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async deleteChecklistSubmission(id: string): Promise<{ success: boolean }> {
    const res = await safeFetch(`${API_BASE}/checklists/${id}`, {
      method: "DELETE"
    });
    return handleResponse(res);
  }
};
