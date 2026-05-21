import express from "express";
import path from "path";
import fs from "fs/promises";
import { createServer as createViteServer } from "vite";
import { User, Project, Task, CommLog, MeetingLog, Documentation, LogEntry } from "./src/types.js";

const app = express();
const PORT = 3000;
const DB_FILE = path.join(process.cwd(), "db.json");

const DEFAULT_SETTINGS = {
  roles: [
    { roleName: "Administrator", allowedViews: ["settings", "users"], active: true },
    { roleName: "Site Coordinator", allowedViews: ["dashboard", "projects", "tasks", "kanban", "gantt", "calendar", "collab"], active: true },
    { roleName: "System Support", allowedViews: ["dashboard", "projects", "tasks", "kanban", "gantt", "calendar", "collab"], active: true },
    { roleName: "Technical Support", allowedViews: ["dashboard", "projects", "tasks", "kanban", "gantt", "calendar", "collab"], active: true },
    { roleName: "Assistant Technical Support", allowedViews: ["dashboard", "projects", "tasks", "kanban", "gantt", "calendar", "collab"], active: true },
    { roleName: "Client", allowedViews: ["dashboard", "projects", "tasks"], active: true },
    { roleName: "Project Lead", allowedViews: ["dashboard", "projects", "tasks", "kanban", "gantt", "calendar", "collab"], active: true },
    { roleName: "Developer", allowedViews: ["dashboard", "projects", "tasks", "kanban", "gantt"], active: true }
  ],
  milestoneStatuses: [
    { value: "On Track", active: true },
    { value: "Completed", active: true },
    { value: "Delayed", active: true },
    { value: "On Hold", active: true },
    { value: "Cancelled", active: true }
  ],
  taskTypes: [
    { value: "Setting", active: true },
    { value: "Fit and Gap", active: true },
    { value: "Instalasi", active: true },
    { value: "Training", active: true },
    { value: "Security Audit", active: true },
    { value: "Database Tune", active: true }
  ],
  catProgresses: [
    { value: "Prasyarat", active: true },
    { value: "Aplikasi", active: true },
    { value: "Infrastruktur & Hardware", active: true },
    { value: "Training", active: true }
  ],
  priorities: [
    { value: "Urgent", active: true },
    { value: "High", active: true },
    { value: "Medium", active: true },
    { value: "Low", active: true },
    { value: "Very Low", active: true }
  ],
  progressStatuses: [
    { value: "Not Started", active: true },
    { value: "In Progress", active: true },
    { value: "Done", active: true },
    { value: "Pending", active: true },
    { value: "Cancelled", active: true },
    { value: "Backlog", active: true }
  ]
};

app.use(express.json());

// Helper to write database
async function writeDB(data: any) {
  await fs.writeFile(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
}

// Initial seeding helper
async function initializeDB() {
  try {
    await fs.access(DB_FILE);
  } catch {
    // DB doesn't exist, seed initial data
    const initialUsers: User[] = [
      {
        id: "u-admin",
        username: "admin",
        name: "Administrator Utama",
        nickname: "Admin",
        password: "admin123", // Humble default password for live preview
        role: "Administrator",
        email: "admin@taskhub.com",
        createdAt: "2026-05-21T00:00:00Z"
      },
      {
        id: "u-lead",
        username: "fajar",
        name: "Fajar Pratama",
        nickname: "Fajar",
        password: "fajar123",
        role: "Site Coordinator",
        email: "fajar@taskhub.com",
        createdAt: "2026-05-21T00:00:00Z"
      },
      {
        id: "u-nanda",
        username: "nanda",
        name: "Nanda Wardhana",
        nickname: "Nanda",
        password: "password123",
        role: "Technical Support",
        email: "nanda@taskhub.com",
        createdAt: "2026-05-21T00:00:00Z"
      }
    ];

    const initialProjects: Project[] = [
      {
        id: "p-01",
        kode: "P01",
        nama: "Sistem Informasi Rumah Sakit",
        modul: "Front Office",
        pic: "Fajar",
        client: "RS Mataram",
        asal: "Tender",
        status: "On Track",
        startDate: "2026-04-01",
        endDate: "2026-08-31",
        completionDate: "",
        prasyarat: "Server AWS disiapkan oleh RS, tim teknis RS dilatih sebelum launching.",
        notes: "Ulasan berkala dilakukan setiap hari Jumat jam 14.00 WITA.",
        url: "https://hospital-project-drive.example.com",
        createdAt: "2026-04-01T00:00:00Z"
      },
      {
        id: "p-02",
        kode: "P02",
        nama: "Aplikasi Keuangan Daerah",
        modul: "Back Office",
        pic: "Nanda",
        client: "Pemerintah Provinsi NTB",
        asal: "Hibah",
        status: "Delayed",
        startDate: "2026-03-01",
        endDate: "2026-07-30",
        completionDate: "",
        prasyarat: "Reorganisasi database lama, migrasi skema tabel diselesaikan client.",
        notes: "Mendapat revisi regulasi di bagian pelaporan anggaran daerah.",
        url: "https://finance-project-shared.example.com",
        createdAt: "2026-03-01T00:00:00Z"
      },
      {
        id: "p-03",
        kode: "P03",
        nama: "Portal Layanan Publik Satu Atap",
        modul: "Admin",
        pic: "Admin",
        client: "Diskominfo Provinsi",
        asal: "Internal",
        status: "On Track",
        startDate: "2026-05-01",
        endDate: "2026-09-30",
        completionDate: "",
        prasyarat: "Sertifikasi SSL domain utama dari pemerintah sudah di-approve.",
        notes: "Prioritas tinggi untuk integrasi SSO ASN.",
        url: "",
        createdAt: "2026-05-01T00:00:00Z"
      }
    ];

    const initialTasks: Task[] = [
      {
        id: "t-01",
        project: "P01",
        modul: "Front Office",
        task: "Setup Halaman Login & Autentikasi JWT",
        taskType: "Setting",
        categoryProgress: "Aplikasi",
        pic: "Fajar",
        priority: "Urgent",
        status: "In Progress",
        startDate: "2026-05-01",
        dueDate: "2026-05-28",
        progress: 50,
        notes: "Mencakup flow refresh token ganda.",
        url: "",
        subtasks: [
          { id: "sub-1-1", title: "Desain UI Form Login", done: true },
          { id: "sub-1-2", title: "Integrasi API Autentikasi", done: false },
          { id: "sub-1-3", title: "Enkripsi Session LocalStorage", done: false }
        ],
        createdAt: "2026-05-01T00:00:00Z"
      },
      {
        id: "t-02",
        project: "P01",
        modul: "Back Office",
        task: "Integrasi Gerbang Pembayaran (Payment Gateway)",
        taskType: "Setting",
        categoryProgress: "Aplikasi",
        pic: "Nanda",
        priority: "High",
        status: "Not Started",
        startDate: "2026-05-10",
        dueDate: "2026-06-15",
        progress: 0,
        notes: "Menunggu key credential sandbox dari pihak bank.",
        url: "",
        subtasks: [],
        createdAt: "2026-05-01T00:00:00Z"
      },
      {
        id: "t-03",
        project: "P01",
        modul: "Front Office",
        task: "Pengujian End-to-End Modul Kasir",
        taskType: "Fit and Gap",
        categoryProgress: "Aplikasi",
        pic: "Nanda",
        priority: "High",
        status: "Done",
        startDate: "2026-04-01",
        dueDate: "2026-04-30",
        progress: 100,
        notes: "Berhasil meluncurkan 15 test-case tanpa kegagalan krusial.",
        url: "",
        subtasks: [
          { id: "sub-3-1", title: "Skenario Pembayaran Tunai", done: true },
          { id: "sub-3-2", title: "Skenario Pembayaran BPJS", done: true }
        ],
        createdAt: "2026-04-01T00:00:00Z"
      },
      {
        id: "t-04",
        project: "P01",
        modul: "Admin",
        task: "Konfigurasi Server AWS Production",
        taskType: "Instalasi",
        categoryProgress: "Infrastruktur & Hardware",
        pic: "Admin",
        priority: "Urgent",
        status: "In Progress",
        startDate: "2026-05-05",
        dueDate: "2026-05-24",
        progress: 80,
        notes: "Setup VPC, Load Balancer, SSL, dan auto-scaling kelompok web server.",
        url: "",
        subtasks: [],
        createdAt: "2026-05-05T00:00:00Z"
      },
      {
        id: "t-05",
        project: "P01",
        modul: "Admin",
        task: "Training Penggunaan Aplikasi untuk Perawat",
        taskType: "Training",
        categoryProgress: "Training",
        pic: "Fajar",
        priority: "Medium",
        status: "Done",
        startDate: "2026-04-20",
        dueDate: "2026-04-28",
        progress: 100,
        notes: "Disertai modul video tutorial berdurasi 30 menit.",
        url: "",
        subtasks: [],
        createdAt: "2026-04-20T00:00:00Z"
      },
      {
        id: "t-06",
        project: "P02",
        modul: "Reporting",
        task: "Dashboard Kompilasi Laporan Anggaran Bulanan",
        taskType: "Setting",
        categoryProgress: "Aplikasi",
        pic: "Nanda",
        priority: "Medium",
        status: "Pending",
        startDate: "2026-04-15",
        dueDate: "2026-05-20",
        progress: 30,
        notes: "Menunggu regulasi format baru disetujui BPKAD.",
        url: "",
        subtasks: [],
        createdAt: "2026-04-15T00:00:00Z"
      }
    ];

    const initialCommLogs: CommLog[] = [
      {
        id: "c-01",
        project: "P01",
        type: "Email",
        date: "2026-05-18",
        participants: "Fajar Pratama (Lead) -> Manajemen RS Mataram",
        summary: "Persetujuan Dokumen UAT Modul Front Office",
        detail: "Penyampaian link formulir persetujuan dan hasil pengujian sirkuit kasir. Pihak RS membalas ok dengan catatan kecil tentang tombol print struk."
      },
      {
        id: "c-02",
        project: "P02",
        type: "WhatsApp",
        date: "2026-05-20",
        participants: "Nanda Wardhana <-> BPKAD NTB",
        summary: "Diskusi Desain Skema Pajak Daerah",
        detail: "Mengklarifikasi formula pemotongan retribusi terintegrasi. Menyeimbangkan parameter input sesuai surat instruksi gubernur terbaru."
      }
    ];

    const initialMeetingLogs: MeetingLog[] = [
      {
        id: "m-01",
        project: "P01",
        date: "2026-05-15",
        title: "Evaluasi Sprint 1 & Penentuan Titik Integrasi BPJS",
        attendees: "Fajar Pratama, Nanda Wardhana, Tim IT RS Mataram, Dokter Spesialis RS",
        agenda: "1. Demo status UAT Front Office.\n2. Hambatan konektivitas web service BPJS local.",
        decisions: "1. Jalur Kasir dinyatakan selesai dan disetujui.\n2. Untuk sinkronisasi BPJS, RS berkomitmen membuka port VPN mulai 22 Mei.\n3. Pertemuan teknis lanjutan direncanakan pada 25 Mei.",
        actions: "1. Fajar: Selesaikan draf manual book admin (Target 21 Mei).\n2. Nanda: Hubungkan mock endpoints dengan rute VPN baru."
      }
    ];

    const initialDocs: Documentation[] = [
      {
        id: "d-01",
        project: "P01",
        category: "API Specs",
        title: "Panduan Integrasi BPJS Health API V2.1",
        url: "https://example.com/bpjs-api-docs",
        desc: "Detail payload JSON untuk pendaftaran rujukan balik online, sinkronisasi antrean RS, dan pencetakan SEP.",
        date: "2026-05-01"
      },
      {
        id: "d-02",
        project: "P01",
        category: "Desain",
        title: "Figma Hospital Suite UI/UX Design Baseline",
        url: "https://figma.com/file/hospital-specs",
        desc: "Skema warna lengkap, ikon kustomisasi, layout dashboard rawat inap, rawat jalan, serta mobile layout.",
        date: "2026-04-12"
      }
    ];

    const initialLogs: LogEntry[] = [
      {
        id: "l-01",
        projId: "p-01",
        type: "kendala",
        date: "2026-05-10",
        text: "Koneksi database lokal RS mengalami bottleneck saat testing load 500 requests/second."
      },
      {
        id: "l-02",
        projId: "p-01",
        type: "solusi",
        date: "2026-05-11",
        text: "Menambahkan lapisan caching Redis untuk meringankan beban query pasien berulang sebesar 75%."
      },
      {
        id: "l-03",
        projId: "p-01",
        type: "fokus",
        date: "2026-05-17",
        text: "Penyelesaian deployment arsitektur AWS production dan pengujian kestabilan modul klaim asuransi."
      }
    ];

    const initialDB = {
      users: initialUsers,
      projects: initialProjects,
      tasks: initialTasks,
      commLogs: initialCommLogs,
      meetingLogs: initialMeetingLogs,
      docs: initialDocs,
      logs: initialLogs,
      settings: DEFAULT_SETTINGS
    };

    await writeDB(initialDB);
    console.log("Database initialized successfully at " + DB_FILE);
  }
}

// Ensure the DB is ready on load
initializeDB();

// DB Access helper
async function readDB() {
  await initializeDB();
  const raw = await fs.readFile(DB_FILE, "utf-8");
  return JSON.parse(raw);
}

// ── AUTHENTICATION API ──────────────────────────────────────────────────

// LOGIN
app.post("/api/auth/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: "Username dan password diperlukan" });
    }
    const db = await readDB();
    const user = db.users.find((u: any) => u.username.toLowerCase() === username.toLowerCase());
    
    if (!user || user.password !== password) {
      return res.status(401).json({ error: "Username atau Password yang Anda masukkan salah!" });
    }
    
    // Return session packet without the password
    const { password: _, ...sessionUser } = user;
    return res.json({ token: `dummy-jwt-token-for-${user.id}`, user: sessionUser });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// PRIVATE REGISTER (can be called by guests or admins depending on interface context)
app.post("/api/auth/register", async (req, res) => {
  try {
    const { username, name, nickname, password, email, role } = req.body;
    if (!username || !name || !password || !email) {
      return res.status(400).json({ error: "Input formulir registrasi tidak lengkap!" });
    }
    const db = await readDB();
    const exists = db.users.some((u: any) => u.username.toLowerCase() === username.toLowerCase());
    if (exists) {
      return res.status(400).json({ error: "Username sudah terdaftar!" });
    }

    const newUser: User = {
      id: "u-" + Math.random().toString(36).slice(2, 9),
      username: username.toLowerCase(),
      name,
      nickname: nickname || username,
      password,
      role: role || "Technical Support",
      email,
      createdAt: new Date().toISOString()
    };

    db.users.push(newUser);
    await writeDB(db);

    const { password: _, ...registeredUser } = newUser;
    return res.status(201).json({ message: "Registrasi berhasil", user: registeredUser });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});


// ── ADMINISTRATIVE USERS CRUD ───────────────────────────────────────────
app.get("/api/users", async (req, res) => {
  try {
    const db = await readDB();
    // Safety check: hide passwords in query response
    const safeUsers = db.users.map(({ password: _, ...u }: any) => u);
    return res.json(safeUsers);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post("/api/users", async (req, res) => {
  try {
    const { username, name, nickname, password, email, role } = req.body;
    if (!username || !name || !nickname || !password || !email || !role) {
      return res.status(400).json({ error: "Seluruh data user wajib diisi!" });
    }
    const db = await readDB();
    const exists = db.users.some((u: any) => u.username.toLowerCase() === username.toLowerCase());
    if (exists) {
      return res.status(400).json({ error: "Username tersebut sudah terpakai!" });
    }

    const newUser: User = {
      id: "u-" + Math.random().toString(36).slice(2, 9),
      username: username.toLowerCase(),
      name,
      nickname,
      password,
      role,
      email,
      createdAt: new Date().toISOString()
    };

    db.users.push(newUser);
    await writeDB(db);

    const { password: _, ...registeredUser } = newUser;
    return res.json(registeredUser);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.put("/api/users/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, nickname, email, role, password } = req.body;
    const db = await readDB();
    const idx = db.users.findIndex((u: any) => u.id === id);
    if (idx === -1) {
      return res.status(404).json({ error: "User tidak ditemukan!" });
    }

    db.users[idx].name = name || db.users[idx].name;
    db.users[idx].nickname = nickname || db.users[idx].nickname;
    db.users[idx].email = email || db.users[idx].email;
    db.users[idx].role = role || db.users[idx].role;
    if (password) {
      db.users[idx].password = password;
    }

    await writeDB(db);
    const { password: _, ...updatedUser } = db.users[idx];
    return res.json(updatedUser);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.delete("/api/users/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (id === "u-admin") {
      return res.status(400).json({ error: "User Administrator Utama tidak boleh dihapus!" });
    }
    const db = await readDB();
    const originalLength = db.users.length;
    db.users = db.users.filter((u: any) => u.id !== id);
    if (db.users.length === originalLength) {
      return res.status(404).json({ error: "User tidak ditemukan!" });
    }
    await writeDB(db);
    return res.json({ success: true, message: "User berhasil dihapus!" });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});


// ── PROJECTS CRUD ───────────────────────────────────────────────────────
app.get("/api/projects", async (req, res) => {
  try {
    const db = await readDB();
    return res.json(db.projects);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post("/api/projects", async (req, res) => {
  try {
    const db = await readDB();
    const newProject: Project = { ...req.body, id: "p-" + Math.random().toString(36).slice(2, 9), createdAt: new Date().toISOString() };
    db.projects.push(newProject);
    await writeDB(db);
    return res.status(201).json(newProject);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.put("/api/projects/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const db = await readDB();
    const idx = db.projects.findIndex((p: any) => p.id === id);
    if (idx === -1) {
      return res.status(404).json({ error: "Project tidak ditemukan!" });
    }
    db.projects[idx] = { ...db.projects[idx], ...req.body };
    await writeDB(db);
    return res.json(db.projects[idx]);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.delete("/api/projects/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const db = await readDB();
    const p = db.projects.find((item: any) => item.id === id);
    if (p) {
      // Also delete diagnostic logs linked to this project
      db.logs = db.logs.filter((l: any) => l.projId !== id);
    }
    db.projects = db.projects.filter((p: any) => p.id !== id);
    await writeDB(db);
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});


// ── TASKS CRUD ──────────────────────────────────────────────────────────
app.get("/api/tasks", async (req, res) => {
  try {
    const db = await readDB();
    return res.json(db.tasks);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post("/api/tasks", async (req, res) => {
  try {
    const db = await readDB();
    const newTask: Task = { ...req.body, id: "t-" + Math.random().toString(36).slice(2, 9), createdAt: new Date().toISOString() };
    db.tasks.unshift(newTask);
    await writeDB(db);
    return res.status(201).json(newTask);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.put("/api/tasks/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const db = await readDB();
    const idx = db.tasks.findIndex((t: any) => t.id === id);
    if (idx === -1) {
      return res.status(404).json({ error: "Task tidak ditemukan!" });
    }
    db.tasks[idx] = { ...db.tasks[idx], ...req.body };
    await writeDB(db);
    return res.json(db.tasks[idx]);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.delete("/api/tasks/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const db = await readDB();
    db.tasks = db.tasks.filter((t: any) => t.id !== id);
    await writeDB(db);
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});


// ── COMMUNICATION LOGS CRUD ──────────────────────────────────────────────
app.get("/api/commlogs", async (req, res) => {
  try {
    const db = await readDB();
    return res.json(db.commLogs || []);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post("/api/commlogs", async (req, res) => {
  try {
    const db = await readDB();
    const newComm: CommLog = { ...req.body, id: "c-" + Math.random().toString(36).slice(2, 9), date: req.body.date || new Date().toISOString().slice(0, 10) };
    if (!db.commLogs) db.commLogs = [];
    db.commLogs.unshift(newComm);
    await writeDB(db);
    return res.status(201).json(newComm);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.delete("/api/commlogs/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const db = await readDB();
    db.commLogs = (db.commLogs || []).filter((c: any) => c.id !== id);
    await writeDB(db);
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});


// ── MEETING MINUTES MOMLOGS CRUD ─────────────────────────────────────────
app.get("/api/meetinglogs", async (req, res) => {
  try {
    const db = await readDB();
    return res.json(db.meetingLogs || []);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post("/api/meetinglogs", async (req, res) => {
  try {
    const db = await readDB();
    const newMeet: MeetingLog = { ...req.body, id: "m-" + Math.random().toString(36).slice(2, 9), date: req.body.date || new Date().toISOString().slice(0, 10) };
    if (!db.meetingLogs) db.meetingLogs = [];
    db.meetingLogs.unshift(newMeet);
    await writeDB(db);
    return res.status(201).json(newMeet);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.delete("/api/meetinglogs/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const db = await readDB();
    db.meetingLogs = (db.meetingLogs || []).filter((m: any) => m.id !== id);
    await writeDB(db);
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});


// ── DOCUMENTATION CRUD ───────────────────────────────────────────────────
app.get("/api/docs", async (req, res) => {
  try {
    const db = await readDB();
    return res.json(db.docs || []);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post("/api/docs", async (req, res) => {
  try {
    const db = await readDB();
    const newDoc: Documentation = { ...req.body, id: "d-" + Math.random().toString(36).slice(2, 9), date: req.body.date || new Date().toISOString().slice(0,10) };
    if (!db.docs) db.docs = [];
    db.docs.unshift(newDoc);
    await writeDB(db);
    return res.status(201).json(newDoc);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.delete("/api/docs/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const db = await readDB();
    db.docs = (db.docs || []).filter((d: any) => d.id !== id);
    await writeDB(db);
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});


// ── DIAGNOSTIC LOGS (KENDALA/SOLUSI/FOKUS) CRUD ─────────────────────────
app.get("/api/logs", async (req, res) => {
  try {
    const db = await readDB();
    return res.json(db.logs || []);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post("/api/logs", async (req, res) => {
  try {
    const db = await readDB();
    const newLog: LogEntry = { ...req.body, id: "l-" + Math.random().toString(36).slice(2, 9) };
    if (!db.logs) db.logs = [];
    db.logs.push(newLog);
    await writeDB(db);
    return res.status(201).json(newLog);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.delete("/api/logs/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const db = await readDB();
    db.logs = (db.logs || []).filter((l: any) => l.id !== id);
    await writeDB(db);
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});


// ── SETTINGS CRUD ────────────────────────────────────────────────────────
app.get("/api/settings", async (req, res) => {
  try {
    const db = await readDB();
    if (!db.settings) {
      db.settings = { ...DEFAULT_SETTINGS };
      await writeDB(db);
    }
    return res.json(db.settings);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.put("/api/settings", async (req, res) => {
  try {
    const db = await readDB();
    db.settings = { ...db.settings, ...req.body };
    await writeDB(db);
    return res.json(db.settings);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
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

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[SYS] Server running perfectly on port ${PORT}`);
  });
}

startServer();
