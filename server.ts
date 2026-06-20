import express from "express";
import path from "path";
import fs from "fs/promises";
import { createServer as createViteServer } from "vite";
import { createClient } from "@supabase/supabase-js";
import { User, Project, Task, CommLog, MeetingLog, Documentation, LogEntry, Client, BALog, MonevLog, BillingKSO, KasSiteTransaction } from "./src/types.js";

const app = express();
const PORT = 3000;
const DB_FILE = path.join(process.cwd(), "db.json");

// Helper to sanitize environment variables (removes quotes & extra spaces added by mistake)
function cleanEnvVar(val: string): string {
  if (!val) return "";
  let cleaned = val.trim();
  if ((cleaned.startsWith('"') && cleaned.endsWith('"')) || (cleaned.startsWith("'") && cleaned.endsWith("'"))) {
    cleaned = cleaned.slice(1, -1).trim();
  }
  return cleaned;
}

// Configure Supabase client if environment variables are provided
const SUPABASE_URL = cleanEnvVar(process.env.SUPABASE_URL || "");
// Configure Supabase client if environment variables are provided
const SUPABASE_URL = cleanEnvVar(process.env.SUPABASE_URL || "");
const SUPABASE_ANON_KEY = cleanEnvVar(process.env.SUPABASE_ANON_KEY || "");

let supabase: any = null;
try {
  if (SUPABASE_URL && SUPABASE_ANON_KEY) {
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log("Supabase client initialized successfully with URL:", SUPABASE_URL);
  }
} catch (err: any) {
  console.error("Critical: Failed to initialize Supabase client:", err.message);
}

// ── DATABASE INTERACTION LAYER (HYBRID INTEGRATION FOR VERCEL) ───────────────
let dbCache: any = null;

async function readDB(): Promise<any> {
  if (supabase) {
    try {
      const { data, error } = await supabase.from("simrs_config").select("data").eq("id", "app_state").single();
      if (!error && data?.data) { dbCache = data.data; return data.data; }
    } catch (err) { console.error("Supabase read error:", err); }
  }
  try {
    const fileData = await fs.readFile(DB_FILE, "utf-8");
    dbCache = JSON.parse(fileData);
    return dbCache;
  } catch (err) {
    return { users: [], projects: [], tasks: [], settings: { roles: [] } };
  }
}

async function writeDB(data: any): Promise<void> {
  dbCache = data;
  if (supabase) {
    const { error } = await supabase.from("simrs_config").update({ data: data, updated_at: new Date() }).eq("id", "app_state");
    if (!error) return;
  }
  await fs.writeFile(DB_FILE, JSON.stringify(data, null, 2));
}

// Jalankan pemanasan koneksi pertama saat boot
if (supabase) { console.log("Supabase active. Integration ready."); readDB(); }

const DEFAULT_SETTINGS = {
  roles: [
    {
      roleName: "Administrator",
      allowedViews: ["settings", "users", "clients", "tickets", "projects", "tasks", "dashboard"],
      active: true,
    },
    {
      roleName: "Site Coordinator",
      allowedViews: ["dashboard", "projects", "tasks", "checklist"],
      active: true,
    },
  ],
};

async function checkAndMigrateSchema(db: any): Promise<boolean> {
  let changed = false;
  if (!db.users) { db.users = []; changed = true; }
  if (!db.projects) { db.projects = []; changed = true; }
  if (!db.tasks) { db.tasks = []; changed = true; }
  if (!db.commLogs) { db.commLogs = []; changed = true; }
  if (!db.meetingLogs) { db.meetingLogs = []; changed = true; }
  if (!db.docs) { db.docs = []; changed = true; }
  if (!db.logs) { db.logs = []; changed = true; }
  if (!db.clients) { db.clients = []; changed = true; }
  if (!db.siteImplementations) { db.siteImplementations = []; changed = true; }
  if (!db.tickets) { db.tickets = []; changed = true; }
  if (!db.appModules) { db.appModules = []; changed = true; }
  if (!db.assets) { db.assets = []; changed = true; }
  if (!db.monev) { db.monev = []; changed = true; }
  if (!db.billing) { db.billing = []; changed = true; }
  if (!db.atkItems) { db.atkItems = []; changed = true; }
  if (!db.atkOrders) { db.atkOrders = []; changed = true; }
  if (!db.kasSiteTransactions) { db.kasSiteTransactions = []; changed = true; }
  if (!db.kasLocks) { db.kasLocks = []; changed = true; }
  if (!db.kasUnlockRequests) { db.kasUnlockRequests = []; changed = true; }
  if (!db.checklistItemsSetting) { db.checklistItemsSetting = []; changed = true; }
  if (!db.checklists) { db.checklists = []; changed = true; }

  if (!db.settings || !db.settings.roles || db.settings.roles.length === 0) {
    db.settings = DEFAULT_SETTINGS;
    changed = true;
  }
  return changed;
}

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

let memoryDB: any = null;

// Initial seeding helper
async function initializeDB() {
  try {
    await fs.access(DB_FILE);
  } catch {
    const initialData = {
      users: [
        {
          id: "u-admin",
          username: "admin",
          name: "Administrator Utama",
          nickname: "Admin",
          password: "admin123",
          role: "Administrator",
          email: "admin@taskhub.com",
          createdAt: new Date().toISOString(),
          statusAktif: true,
          siteTugas: "",
        },
      ],
      projects: [],
      tasks: [],
      commLogs: [],
      meetingLogs: [],
      docs: [],
      logs: [],
      settings: DEFAULT_SETTINGS,
      clients: [],
      siteImplementations: [],
      tickets: [],
      appModules: [],
      assets: [],
      monev: [],
      billing: [],
      atkItems: [],
      atkOrders: [],
      kasSiteTransactions: [],
      kasLocks: [],
      kasUnlockRequests: [],
      checklistItemsSetting: [],
      checklists: [],
    };
    await writeDB(initialData);
  }

  const current = await readDB();
  const migrated = await checkAndMigrateSchema(current);
  if (migrated) {
    await writeDB(current);
    console.log("Database schema successfully verified and auto-migrated.");
  }
}
initializeDB().catch(console.error);

// ─── AUTHENTICATION ENDPOINTS ────────────────────────────────────────────────
app.post("/api/auth/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    const db = await readDB();
    const user = db.users.find((u: any) => u.username === username && u.password === password);

    if (!user) {
      return res.status(401).json({ error: "Username atau password salah!" });
    }
    if (user.statusAktif === false) {
      return res.status(403).json({ error: "Akun Anda dinonaktifkan oleh Administrator!" });
    }

    return res.json({
      id: user.id,
      username: user.username,
      name: user.name,
      nickname: user.nickname || user.name,
      role: user.role,
      email: user.email,
      siteTugas: user.siteTugas || "",
      divisi: user.divisi || "",
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ─── SETTINGS & ROLES ENDPOINTS ──────────────────────────────────────────────
app.get("/api/settings", async (req, res) => {
  try {
    const db = await readDB();
    res.json(db.settings || DEFAULT_SETTINGS);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/settings", async (req, res) => {
  try {
    const db = await readDB();
    db.settings = { ...db.settings, ...req.body };
    await writeDB(db);
    res.json(db.settings);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── USERS MANAGEMENT ENDPOINTS ──────────────────────────────────────────────
app.get("/api/users", async (req, res) => {
  try {
    const db = await readDB();
    res.json(db.users || []);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/users", async (req, res) => {
  try {
    const db = await readDB();
    const newUser = {
      id: "u-" + Math.random().toString(36).substr(2, 7),
      createdAt: new Date().toISOString(),
      statusAktif: true,
      siteTugas: "",
      ...req.body,
    };
    db.users.push(newUser);
    await writeDB(db);
    res.status(201).json(newUser);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/users/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const db = await readDB();
    const idx = db.users.findIndex((u: any) => u.id === id);
    if (idx === -1) return res.status(404).json({ error: "User tidak ditemukan!" });

    db.users[idx] = { ...db.users[idx], ...req.body };
    await writeDB(db);
    res.json(db.users[idx]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/users/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const db = await readDB();
    db.users = db.users.filter((u: any) => u.id !== id);
    await writeDB(db);
    res.json({ message: "User berhasil dihapus" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── CLIENTS / RUMAH SAKIT ENDPOINTS ─────────────────────────────────────────
app.get("/api/clients", async (req, res) => {
  try {
    const db = await readDB();
    res.json(db.clients || []);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/clients", async (req, res) => {
  try {
    const db = await readDB();
    const newClient = {
      id: "c-" + Math.random().toString(36).substr(2, 7),
      createdAt: new Date().toISOString(),
      ...req.body,
    };
    db.clients.push(newClient);
    await writeDB(db);
    res.status(201).json(newClient);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/clients/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const db = await readDB();
    const idx = db.clients.findIndex((c: any) => c.id === id);
    if (idx === -1) return res.status(404).json({ error: "Client tidak ditemukan!" });

    db.clients[idx] = { ...db.clients[idx], ...req.body };
    await writeDB(db);
    res.json(db.clients[idx]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/clients/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const db = await readDB();
    db.clients = db.clients.filter((c: any) => c.id !== id);
    await writeDB(db);
    res.json({ message: "Client berhasil dihapus" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── PROJECTS MANAGEMENT ENDPOINTS ───────────────────────────────────────────
app.get("/api/projects", async (req, res) => {
  try {
    const db = await readDB();
    res.json(db.projects || []);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/projects", async (req, res) => {
  try {
    const db = await readDB();
    const newProj = {
      id: "p-" + Math.random().toString(36).substr(2, 7),
      createdAt: new Date().toISOString(),
      ...req.body,
    };
    db.projects.push(newProj);
    await writeDB(db);
    res.status(201).json(newProj);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/projects/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const db = await readDB();
    const idx = db.projects.findIndex((p: any) => p.id === id);
    if (idx === -1) return res.status(404).json({ error: "Proyek tidak ditemukan!" });

    db.projects[idx] = { ...db.projects[idx], ...req.body };
    await writeDB(db);
    res.json(db.projects[idx]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/projects/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const db = await readDB();
    db.projects = db.projects.filter((p: any) => p.id !== id);
    await writeDB(db);
    res.json({ message: "Proyek berhasil dihapus" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── TASKS MANAGEMENT ENDPOINTS ──────────────────────────────────────────────
app.get("/api/tasks", async (req, res) => {
  try {
    const db = await readDB();
    res.json(db.tasks || []);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/tasks", async (req, res) => {
  try {
    const db = await readDB();
    const newTask = {
      id: "t-" + Math.random().toString(36).substr(2, 7),
      createdAt: new Date().toISOString(),
      subtasks: req.body.subtasks || [],
      ...req.body,
    };
    db.tasks.push(newTask);
    await writeDB(db);
    res.status(201).json(newTask);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/tasks/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const db = await readDB();
    const idx = db.tasks.findIndex((t: any) => t.id === id);
    if (idx === -1) return res.status(404).json({ error: "Task tidak ditemukan!" });

    db.tasks[idx] = { ...db.tasks[idx], ...req.body };
    await writeDB(db);
    res.json(db.tasks[idx]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/tasks/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const db = await readDB();
    db.tasks = db.tasks.filter((t: any) => t.id !== id);
    await writeDB(db);
    res.json({ message: "Task berhasil dihapus" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── COMMUNICATION LOGS ENDPOINTS ────────────────────────────────────────────
app.get("/api/comm-logs", async (req, res) => {
  try {
    const db = await readDB();
    res.json(db.commLogs || []);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/comm-logs", async (req, res) => {
  try {
    const db = await readDB();
    const newLog = {
      id: "c-" + Math.random().toString(36).substr(2, 7),
      ...req.body,
    };
    db.commLogs.push(newLog);
    await writeDB(db);
    res.status(201).json(newLog);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/comm-logs/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const db = await readDB();
    const idx = db.commLogs.findIndex((l: any) => l.id === id);
    if (idx === -1) return res.status(404).json({ error: "Log komunikasi tidak ditemukan!" });

    db.commLogs[idx] = { ...db.commLogs[idx], ...req.body };
    await writeDB(db);
    res.json(db.commLogs[idx]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/comm-logs/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const db = await readDB();
    db.commLogs = db.commLogs.filter((l: any) => l.id !== id);
    await writeDB(db);
    res.json({ message: "Log komunikasi berhasil dihapus" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── MEETING LOGS ENDPOINTS ──────────────────────────────────────────────────
app.get("/api/meeting-logs", async (req, res) => {
  try {
    const db = await readDB();
    res.json(db.meetingLogs || []);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/meeting-logs", async (req, res) => {
  try {
    const db = await readDB();
    const newLog = {
      id: "m-" + Math.random().toString(36).substr(2, 7),
      ...req.body,
    };
    db.meetingLogs.push(newLog);
    await writeDB(db);
    res.status(201).json(newLog);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/meeting-logs/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const db = await readDB();
    const idx = db.meetingLogs.findIndex((l: any) => l.id === id);
    if (idx === -1) return res.status(404).json({ error: "MoM tidak ditemukan!" });

    db.meetingLogs[idx] = { ...db.meetingLogs[idx], ...req.body };
    await writeDB(db);
    res.json(db.meetingLogs[idx]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/meeting-logs/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const db = await readDB();
    db.meetingLogs = db.meetingLogs.filter((l: any) => l.id !== id);
    await writeDB(db);
    res.json({ message: "MoM berhasil dihapus" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── DOCUMENTATION ENDPOINTS ─────────────────────────────────────────────────
app.get("/api/docs", async (req, res) => {
  try {
    const db = await readDB();
    res.json(db.docs || []);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/docs", async (req, res) => {
  try {
    const db = await readDB();
    const newDoc = {
      id: "d-" + Math.random().toString(36).substr(2, 7),
      ...req.body,
    };
    db.docs.push(newDoc);
    await writeDB(db);
    res.status(201).json(newDoc);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/docs/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const db = await readDB();
    const idx = db.docs.findIndex((d: any) => d.id === id);
    if (idx === -1) return res.status(404).json({ error: "Dokumen tidak ditemukan!" });

    db.docs[idx] = { ...db.docs[idx], ...req.body };
    await writeDB(db);
    res.json(db.docs[idx]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/docs/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const db = await readDB();
    db.docs = db.docs.filter((d: any) => d.id !== id);
    await writeDB(db);
    res.json({ message: "Dokumen berhasil dihapus" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── SITE IMPLEMENTATION LOGS ENDPOINTS ──────────────────────────────────────
app.get("/api/logs", async (req, res) => {
  try {
    const db = await readDB();
    res.json(db.logs || []);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/logs", async (req, res) => {
  try {
    const db = await readDB();
    const newLog = {
      id: "l-" + Math.random().toString(36).substr(2, 7),
      ...req.body,
    };
    db.logs.push(newLog);
    await writeDB(db);
    res.status(201).json(newLog);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/logs/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const db = await readDB();
    db.logs = db.logs.filter((l: any) => l.id !== id);
    await writeDB(db);
    res.json({ message: "Log berhasil dihapus" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── TICKETS / COMPLAINTS ENDPOINTS ──────────────────────────────────────────
app.get("/api/tickets", async (req, res) => {
  try {
    const db = await readDB();
    res.json(db.tickets || []);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/tickets", async (req, res) => {
  try {
    const db = await readDB();
    const newTicket = {
      id: "tk-" + Math.random().toString(36).substr(2, 7),
      createdAt: new Date().toISOString(),
      status: "Open",
      responseLogs: [],
      ...req.body,
    };
    db.tickets.push(newTicket);
    await writeDB(db);
    res.status(201).json(newTicket);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/tickets/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const db = await readDB();
    const idx = db.tickets.findIndex((t: any) => t.id === id);
    if (idx === -1) return res.status(404).json({ error: "Tiket tidak ditemukan!" });

    db.tickets[idx] = { ...db.tickets[idx], ...req.body };
    await writeDB(db);
    res.json(db.tickets[idx]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/tickets/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const db = await readDB();
    db.tickets = db.tickets.filter((t: any) => t.id !== id);
    await writeDB(db);
    res.json({ message: "Tiket berhasil dihapus" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── APP MODULES METADATA ENDPOINTS ──────────────────────────────────────────
app.get("/api/app-modules", async (req, res) => {
  try {
    const db = await readDB();
    res.json(db.appModules || []);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/app-modules", async (req, res) => {
  try {
    const db = await readDB();
    const newMod = {
      id: "mod-" + Math.random().toString(36).substr(2, 7),
      ...req.body,
    };
    db.appModules.push(newMod);
    await writeDB(db);
    res.status(201).json(newMod);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/app-modules/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const db = await readDB();
    const idx = db.appModules.findIndex((m: any) => m.id === id);
    if (idx === -1) return res.status(404).json({ error: "Modul tidak ditemukan!" });
    db.appModules[idx] = { ...db.appModules[idx], ...req.body };
    await writeDB(db);
    res.json(db.appModules[idx]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/app-modules/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const db = await readDB();
    db.appModules = db.appModules.filter((m: any) => m.id !== id);
    await writeDB(db);
    res.json({ message: "Modul berhasil dihapus" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── SITE IMPLEMENTATION STATUS ENDPOINTS ────────────────────────────────────
app.get("/api/site-implementations", async (req, res) => {
  try {
    const db = await readDB();
    res.json(db.siteImplementations || []);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/site-implementations", async (req, res) => {
  try {
    const db = await readDB();
    const newImpl = {
      id: "impl-" + Math.random().toString(36).substr(2, 7),
      historyLogs: req.body.historyLogs || [],
      ...req.body,
    };
    db.siteImplementations.push(newImpl);
    await writeDB(db);
    res.status(201).json(newImpl);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/site-implementations/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const db = await readDB();
    const idx = db.siteImplementations.findIndex((si: any) => si.id === id);
    if (idx === -1) return res.status(404).json({ error: "Data implementasi site tidak ditemukan!" });

    db.siteImplementations[idx] = { ...db.siteImplementations[idx], ...req.body };
    await writeDB(db);
    res.json(db.siteImplementations[idx]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/site-implementations/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const db = await readDB();
    db.siteImplementations = db.siteImplementations.filter((si: any) => si.id !== id);
    await writeDB(db);
    res.json({ message: "Data implementasi site berhasil dihapus" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── ASSETS MANAGEMENT ENDPOINTS ─────────────────────────────────────────────
app.get("/api/assets", async (req, res) => {
  try {
    const db = await readDB();
    res.json(db.assets || []);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/assets", async (req, res) => {
  try {
    const db = await readDB();
    const newAsset = {
      id: "as-" + Math.random().toString(36).substr(2, 7),
      createdAt: new Date().toISOString(),
      ...req.body,
    };
    db.assets.push(newAsset);
    await writeDB(db);
    res.status(201).json(newAsset);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/assets/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const db = await readDB();
    const idx = db.assets.findIndex((a: any) => a.id === id);
    if (idx === -1) return res.status(404).json({ error: "Aset tidak ditemukan!" });

    db.assets[idx] = { ...db.assets[idx], ...req.body };
    await writeDB(db);
    res.json(db.assets[idx]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/assets/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const db = await readDB();
    db.assets = db.assets.filter((a: any) => a.id !== id);
    await writeDB(db);
    res.json({ message: "Aset berhasil dihapus" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── MONEV (MONITORING & EVALUASI) ENDPOINTS ─────────────────────────────────
app.get("/api/monev", async (req, res) => {
  try {
    const db = await readDB();
    res.json(db.monev || []);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/monev", async (req, res) => {
  try {
    const db = await readDB();
    const newMonev = {
      id: "mo-" + Math.random().toString(36).substr(2, 7),
      createdAt: new Date().toISOString(),
      ...req.body,
    };
    db.monev.push(newMonev);
    await writeDB(db);
    res.status(201).json(newMonev);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/monev/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const db = await readDB();
    const idx = db.monev.findIndex((m: any) => m.id === id);
    if (idx === -1) return res.status(404).json({ error: "Data monev tidak ditemukan!" });

    db.monev[idx] = { ...db.monev[idx], ...req.body };
    await writeDB(db);
    res.json(db.monev[idx]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/monev/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const db = await readDB();
    db.monev = db.monev.filter((m: any) => m.id !== id);
    await writeDB(db);
    res.json({ message: "Data monev berhasil dihapus" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── BILLING KSO ENDPOINTS ───────────────────────────────────────────────────
app.get("/api/billing", async (req, res) => {
  try {
    const db = await readDB();
    res.json(db.billing || []);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/billing", async (req, res) => {
  try {
    const db = await readDB();
    const newBill = {
      id: "bl-" + Math.random().toString(36).substr(2, 7),
      createdAt: new Date().toISOString(),
      ...req.body,
    };
    db.billing.push(newBill);
    await writeDB(db);
    res.status(201).json(newBill);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/billing/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const db = await readDB();
    const idx = db.billing.findIndex((b: any) => b.id === id);
    if (idx === -1) return res.status(404).json({ error: "Data billing tidak ditemukan!" });

    db.billing[idx] = { ...db.billing[idx], ...req.body };
    await writeDB(db);
    res.json(db.billing[idx]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/billing/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const db = await readDB();
    db.billing = db.billing.filter((b: any) => b.id !== id);
    await writeDB(db);
    res.json({ message: "Data billing berhasil dihapus" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── ATK INVENTORY ENDPOINTS ─────────────────────────────────────────────────
app.get("/api/atk-items", async (req, res) => {
  try {
    const db = await readDB();
    res.json(db.atkItems || []);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/atk-items", async (req, res) => {
  try {
    const db = await readDB();
    const newItem = {
      id: "atk-i-" + Math.random().toString(36).substr(2, 7),
      stok: Number(req.body.stok) || 0,
      ...req.body,
    };
    db.atkItems.push(newItem);
    await writeDB(db);
    res.status(201).json(newItem);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/atk-items/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const db = await readDB();
    const idx = db.atkItems.findIndex((i: any) => i.id === id);
    if (idx === -1) return res.status(404).json({ error: "Item ATK tidak ditemukan!" });

    db.atkItems[idx] = { ...db.atkItems[idx], ...req.body, stok: Number(req.body.stok) || 0 };
    await writeDB(db);
    res.json(db.atkItems[idx]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/atk-items/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const db = await readDB();
    db.atkItems = db.atkItems.filter((i: any) => i.id !== id);
    await writeDB(db);
    res.json({ message: "Item ATK berhasil dihapus" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── ATK ORDERS ENDPOINTS ────────────────────────────────────────────────────
app.get("/api/atk-orders", async (req, res) => {
  try {
    const db = await readDB();
    res.json(db.atkOrders || []);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/atk-orders", async (req, res) => {
  try {
    const db = await readDB();
    const newOrder = {
      id: "atk-o-" + Math.random().toString(36).substr(2, 7),
      tanggalSelesai: "",
      ...req.body,
    };
    db.atkOrders.push(newOrder);
    await writeDB(db);
    res.status(201).json(newOrder);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/atk-orders/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const db = await readDB();
    const idx = db.atkOrders.findIndex((o: any) => o.id === id);
    if (idx === -1) return res.status(404).json({ error: "Pesanan ATK tidak ditemukan!" });

    const oldStatus = db.atkOrders[idx].status;
    const newStatus = req.body.status;

    db.atkOrders[idx] = { ...db.atkOrders[idx], ...req.body };

    if (oldStatus !== "Selesai" && newStatus === "Selesai") {
      db.atkOrders[idx].tanggalSelesai = new Date().toISOString().split("T")[0];
      const orderItemName = db.atkOrders[idx].namaItem;
      const orderQty = Number(db.atkOrders[idx].jumlah) || 0;

      const itemIdx = db.atkItems.findIndex((i: any) => i.namaItem === orderItemName);
      if (itemIdx !== -1) {
        db.atkItems[itemIdx].stok = Math.max(0, db.atkItems[itemIdx].stok - orderQty);
      }
    }

    await writeDB(db);
    res.json(db.atkOrders[idx]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/atk-orders/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const db = await readDB();
    db.atkOrders = db.atkOrders.filter((o: any) => o.id !== id);
    await writeDB(db);
    res.json({ message: "Pesanan ATK berhasil dihapus" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── FINANCIAL KAS SITE ENDPOINTS ────────────────────────────────────────────
app.get("/api/kas-site", async (req, res) => {
  try {
    const db = await readDB();
    return res.json(db.kasSiteTransactions || []);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post("/api/kas-site", async (req, res) => {
  try {
    const db = await readDB();
    const newTx = {
      id: "tx-" + Math.random().toString(36).substr(2, 7),
      createdAt: new Date().toISOString(),
      ...req.body,
    };
    db.kasSiteTransactions = db.kasSiteTransactions || [];
    db.kasSiteTransactions.push(newTx);
    await writeDB(db);
    return res.status(201).json(newTx);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.put("/api/kas-site/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const db = await readDB();
    const idx = db.kasSiteTransactions.findIndex((t: any) => t.id === id);
    if (idx === -1) {
      return res.status(404).json({ error: "Transaksi Kas Site tidak ditemukan!" });
    }
    db.kasSiteTransactions[idx] = { ...db.kasSiteTransactions[idx], ...req.body };
    await writeDB(db);
    return res.json(db.kasSiteTransactions[idx]);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.delete("/api/kas-site/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const db = await readDB();
    db.kasSiteTransactions = db.kasSiteTransactions.filter((t: any) => t.id !== id);
    await writeDB(db);
    return res.json({ message: "Transaksi berhasil dihapus" });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ─── KAS LOCKS AND CLOSING ENDPOINTS ─────────────────────────────────────────
app.get("/api/kas-locks", async (req, res) => {
  try {
    const db = await readDB();
    return res.json(db.kasLocks || []);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post("/api/kas-locks/lock", async (req, res) => {
  try {
    const { month, site, lockedBy } = req.body;
    const db = await readDB();
    db.kasLocks = db.kasLocks || [];

    const idx = db.kasLocks.findIndex((l: any) => l.month === month && l.site === site);
    const lockEntry = {
      month,
      site,
      isLocked: true,
      lockedAt: new Date().toISOString(),
      lockedBy,
    };

    if (idx !== -1) {
      db.kasLocks[idx] = lockEntry;
    } else {
      db.kasLocks.push(lockEntry);
    }

    await writeDB(db);
    return res.json(lockEntry);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ─── KAS SITE UNLOCK REQUESTS ENDPOINTS ──────────────────────────────────────
app.get("/api/kas-unlock-requests", async (req, res) => {
  try {
    const db = await readDB();
    return res.json(db.kasUnlockRequests || []);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post("/api/kas-unlock-requests", async (req, res) => {
  try {
    const db = await readDB();
    const newReq = {
      id: "req-" + Math.random().toString(36).substr(2, 7),
      createdAt: new Date().toISOString(),
      status: "Pending",
      ...req.body,
    };
    db.kasUnlockRequests = db.kasUnlockRequests || [];
    db.kasUnlockRequests.push(newReq);
    await writeDB(db);
    return res.status(201).json(newReq);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.put("/api/kas-unlock-requests/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const db = await readDB();
    const idx = db.kasUnlockRequests.findIndex((r: any) => r.id === id);
    if (idx === -1) {
      return res.status(404).json({ error: "Pengajuan unlock tidak ditemukan!" });
    }

    db.kasUnlockRequests[idx] = { ...db.kasUnlockRequests[idx], ...req.body };
    const requestItem = db.kasUnlockRequests[idx];

    if (requestItem.status === "Approved") {
      db.kasLocks = db.kasLocks || [];
      const lockIdx = db.kasLocks.findIndex((l: any) => l.month === requestItem.month && l.site === requestItem.site);
      if (lockIdx !== -1) {
        db.kasLocks[lockIdx].isLocked = false;
      }
    }

    await writeDB(db);
    return res.json(db.kasUnlockRequests[idx]);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ─── CHECKLIST ITEMS MASTER ENDPOINTS ────────────────────────────────────────
app.get("/api/checklist-settings", async (req, res) => {
  try {
    const db = await readDB();
    res.json(db.checklistItemsSetting || []);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/checklist-settings", async (req, res) => {
  try {
    const db = await readDB();
    const newItem = {
      id: "cl-item-" + Math.random().toString(36).substr(2, 7),
      active: true,
      order: db.checklistItemsSetting.length + 1,
      ...req.body,
    };
    db.checklistItemsSetting.push(newItem);
    await writeDB(db);
    res.status(201).json(newItem);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/checklist-settings/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const db = await readDB();
    const idx = db.checklistItemsSetting.findIndex((i: any) => i.id === id);
    if (idx === -1) return res.status(404).json({ error: "Item master checklist tidak ditemukan!" });

    db.checklistItemsSetting[idx] = { ...db.checklistItemsSetting[idx], ...req.body };
    await writeDB(db);
    res.json(db.checklistItemsSetting[idx]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/checklist-settings/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const db = await readDB();
    db.checklistItemsSetting = db.checklistItemsSetting.filter((i: any) => i.id !== id);
    await writeDB(db);
    res.json({ message: "Master checklist berhasil dihapus" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── DAILY CHECKLIST FILL TRANSACTION ENDPOINTS ──────────────────────────────
app.get("/api/checklists", async (req, res) => {
  try {
    const db = await readDB();
    res.json(db.checklists || []);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/checklists", async (req, res) => {
  try {
    const db = await readDB();
    const newChecklist = {
      id: "cl-tx-" + Math.random().toString(36).substr(2, 7),
      createdAt: new Date().toISOString(),
      filledItems: req.body.filledItems || [],
      ...req.body,
    };
    db.checklists.push(newChecklist);
    await writeDB(db);
    res.status(201).json(newChecklist);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/checklists/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const db = await readDB();
    const idx = db.checklists.findIndex((c: any) => c.id === id);
    if (idx === -1) return res.status(404).json({ error: "Data transaksi checklist tidak ditemukan!" });

    db.checklists[idx] = { ...db.checklists[idx], ...req.body };
    await writeDB(db);
    res.json(db.checklists[idx]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── VITE INTERACTION LAYER ──────────────────────────────────────────────
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, () => {
    console.log(`Server is running beautifully at http://localhost:${PORT}`);
  });
}

startServer().catch(console.error);

export default app;
