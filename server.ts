import "dotenv/config";
import express from "express";
import path from "path";
import fs from "fs/promises";
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
const SUPABASE_ANON_KEY = cleanEnvVar(process.env.SUPABASE_ANON_KEY || "");

let supabase: any = null;
try {
  if (SUPABASE_URL && SUPABASE_ANON_KEY) {
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log("Supabase client initialized successfully with URL:", SUPABASE_URL);
  }
} catch (err: any) {
  console.error("Critical: Failed to initialize Supabase client:", err.message || err);
}

if (supabase) {
  console.log("Supabase active. Database synchronization configured.");
} else {
  console.log("Supabase not configured. Using local JSON file store (db.json).");
}

const DEFAULT_SETTINGS = {
  roles: [
    { roleName: "Administrator", allowedViews: ["settings", "users", "clients", "checklist"], active: true },
    { roleName: "Site Coordinator", allowedViews: ["dashboard", "projects", "tasks", "kanban", "gantt", "calendar", "collab", "tickets", "appmodules", "sitemodules", "assets", "monev", "billing", "checklist", "atk"], active: true },
    { roleName: "System Support", allowedViews: ["dashboard", "projects", "tasks", "kanban", "gantt", "calendar", "collab", "checklist"], active: true },
    { roleName: "Technical Support", allowedViews: ["dashboard", "projects", "tasks", "kanban", "gantt", "calendar", "collab", "checklist"], active: true },
    { roleName: "Assistant Technical Support", allowedViews: ["dashboard", "projects", "tasks", "kanban", "gantt", "calendar", "collab", "checklist"], active: true },
    { roleName: "Client", allowedViews: ["dashboard", "projects", "tasks", "checklist"], active: true },
    { roleName: "Project Lead", allowedViews: ["dashboard", "projects", "tasks", "kanban", "gantt", "calendar", "collab", "checklist"], active: true },
    { roleName: "Developer", allowedViews: ["dashboard", "projects", "tasks", "kanban", "gantt", "checklist"], active: true },
    { roleName: "Manager", allowedViews: ["dashboard", "projects", "tasks", "kanban", "gantt", "calendar", "collab", "tickets", "appmodules", "sitemodules", "assets", "clients", "users", "monev", "billing", "checklist"], active: true },
    { roleName: "Manager Keuangan", allowedViews: ["dashboard", "projects", "tasks", "kanban", "gantt", "calendar", "collab", "tickets", "appmodules", "sitemodules", "assets", "clients", "users", "monev", "billing", "checklist"], active: true },
    { roleName: "Logistik Kantor Pusat", allowedViews: ["dashboard", "projects", "tasks", "kanban", "gantt", "calendar", "collab", "tickets", "appmodules", "sitemodules", "assets", "clients", "users", "monev", "billing", "atk", "checklist"], active: true }
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
  ],
  tipeMedika: [
    { value: "Rumah Sakit", active: true },
    { value: "Klinik Utama", active: true },
    { value: "Klinik Pratama", active: true },
    { value: "Puskesmas", active: true },
    { value: "Laboratorium", active: true }
  ],
  kategoriDokumen: [
    { value: "MOM Rapat", active: true },
    { value: "Berita Acara", active: true },
    { value: "User Manual", active: true },
    { value: "Desain UI/UX", active: true },
    { value: "Dokumen Kontrak", active: true },
    { value: "API Specs", active: true }
  ],
  jenisBeritaAcara: [
    { value: "BA Serah Terima Alat", active: true },
    { value: "BA Instalasi Aplikasi", active: true },
    { value: "BA Training /... Sosialisasi", active: true },
    { value: "BA Go-Live", active: true },
    { value: "BA Penyelesaian Pekerjaan", active: true }
  ],
  jenisModul: [
    { value: "Modul Utama", active: true },
    { value: "Modul Integrasi", active: true },
    { value: "Modul Penunjang", active: true },
    { value: "Modul Pelaporan / Dashboard", active: true }
  ],
  statusImplementasi: [
    { value: "Belum Mulai", active: true },
    { value: "Analisis Fit & Gap", active: true },
    { value: "Instalasi / Setting", active: true },
    { value: "Pelatihan User", active: true },
    { value: "Pendampingan UAT", active: true },
    { value: "Selesai Implementasi", active: true }
  ],
  tipeMedia: [
    { value: "WhatsApp", active: true },
    { value: "Email", active: true },
    { value: "Rapat", active: true },
    { value: "Telepon", active: true }
  ],
  statusImplementasiSite: [
    { value: "Berjalan", active: true },
    { value: "Tidak Berjalan", active: true }
  ],
  statusPenggunaan: [
    { value: "Optimal", active: true },
    { value: "Tidak Optimal", active: true }
  ],
  kategoriImplementasi: [
    { value: "Request", active: true },
    { value: "Pengembangan", active: true }
  ],
  jenisAplikasiModul: [
    { value: "Web", active: true },
    { value: "Mobile", active: true }
  ],
  platformModul: [
    { value: "Web", active: true },
    { value: "Desktop", active: true }
  ],
  statusModul: [
    { value: "Aktif", active: true },
    { value: "Non Aktif", active: true },
    { value: "Dalam Pengembangan", active: true }
  ],
  jenisLaporan: [
    { value: "Incident", active: true },
    { value: "Request", active: true }
  ],
  kategoriLaporan: [
    { value: "Software/SIMRS", active: true },
    { value: "Hardware/PC", active: true },
    { value: "Network/Internet", active: true },
    { value: "Peripheral/Printer", active: true },
    { value: "Access/Account", active: true }
  ],
  subKategori: [
    { value: "Software/SIMRS: EMR", active: true },
    { value: "Software/SIMRS: Pendaftaran", active: true },
    { value: "Software/SIMRS: Poli", active: true },
    { value: "Software/SIMRS: Apotek", active: true },
    { value: "Software/SIMRS: Laboratorium", active: true },
    { value: "Software/SIMRS: Kasir", active: true },
    { value: "Hardware/PC: PC Desktop", active: true },
    { value: "Hardware/PC: Laptop", active: true },
    { value: "Hardware/PC: Monitor", active: true },
    { value: "Hardware/PC: RAM/Harddisk", active: true },
    { value: "Network/Internet: Koneksi Wifi", active: true },
    { value: "Network/Internet: LAN Cable", active: true },
    { value: "Network/Internet: Switch/Hub", active: true },
    { value: "Network/Internet: Mikrotik Router", active: true },
    { value: "Peripheral/Printer: Printer Thermal", active: true },
    { value: "Peripheral/Printer: Printer Inkjet", active: true },
    { value: "Peripheral/Printer: Barcode Scanner", active: true },
    { value: "Access/Account: Akun SIMRS", active: true },
    { value: "Access/Account: Email RS", active: true },
    { value: "Access/Account: Hak Akses Menu", active: true }
  ],
  jenisMasalah: [
    { value: "EMR: Buka Berkas Pasien", active: true },
    { value: "EMR: Input Diagnosa Gagal", active: true },
    { value: "EMR: Cari Berkas Pasien", active: true },
    { value: "EMR: Resep EMR tidak tampil", active: true },
    { value: "Pendaftaran: Gagal Cetak Tracer", active: true },
    { value: "Pendaftaran: No RM Ganda", active: true },
    { value: "Pendaftaran: Pasien BPJS tidak valid", active: true },
    { value: "Apotek: Stok Obat Minus", active: true },
    { value: "Apotek: Resep Elektronik pending", active: true },
    { value: "Printer Thermal: Kertas printer macet", active: true },
    { value: "Printer Thermal: Cetak struk pudar / tidak jelas", active: true }
  ],
  divisi: [
    { value: "Site Management", active: true },
    { value: "Quality Control", active: true },
    { value: "Development", active: true },
    { value: "HRD", active: true },
    { value: "Keuangan", active: true },
    { value: "Infrastruktur", active: true },
    { value: "General Affair", active: true }
  ]
};

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

let memoryDB: any = null;

// Helper to write database
async function writeDB(data: any) {
  memoryDB = data; // Keep in-memory store updated!

  if (supabase) {
    try {
      const { error } = await supabase
        .from("simrs_config")
        .upsert({ id: "app_state", data, updated_at: new Date().toISOString() });
      if (error) {
        console.error("Error writing to Supabase:", error.message);
      } else {
        console.log("Database state successfully synchronized with Supabase.");
        // Fire and forget collection synchronization in background
        syncCollectionsToSupabase(data).catch((e) => {
          console.error("Relational background synchronization error:", e.message || e);
        });
      }
    } catch (e: any) {
      console.error("Exception writing to Supabase:", e.message || e);
    }
  }

  try {
    await fs.writeFile(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (fsErr: any) {
    // Graceful handling for read-only environments like Vercel Serverless
    console.warn("Local db.json write skipped or failed (read-only environment like Vercel). Status has been updated in-memory.");
    if (supabase) {
      console.log("State has been safely synchronized via Supabase.");
    } else {
      console.warn("WARNING: Supabase is not configured! Changes will be lost when the serverless function cold-starts. Please configure SUPABASE_URL and SUPABASE_ANON_KEY on Vercel for persistence.");
    }
  }
}

// Background Relational Sync Engine for Supabase
async function syncCollectionsToSupabase(data: any) {
  if (!supabase || !data) return;

  const syncTable = async (tableName: string, rows: any[]) => {
    if (!rows || rows.length === 0) return;
    try {
      const { error } = await supabase.from(tableName).upsert(rows);
      if (error) {
        console.warn(`[Supabase Sync] Table "${tableName}" failed to sync (Does the table exist in Supabase? Run supabase-schema.sql to build it):`, error.message);
      } else {
        console.log(`[Supabase Sync] Table "${tableName}" synced successfully with ${rows.length} rows.`);
      }
    } catch (err: any) {
      console.warn(`[Supabase Sync] Exception during sync of Table "${tableName}":`, err.message || err);
    }
  };

  const syncTasks = [
    syncTable("users", (data.users || []).map((u: any) => ({
      id: u.id,
      username: u.username || "",
      name: u.name || "",
      nickname: u.nickname || "",
      password: u.password || "",
      role: u.role || "",
      email: u.email || "",
      status_aktif: u.statusAktif !== false,
      site_tugas: u.siteTugas || "",
      divisi: u.divisi || "",
      created_at: u.createdAt || new Date().toISOString()
    }))),
    
    syncTable("projects", (data.projects || []).map((p: any) => ({
      id: p.id,
      kode: p.kode || "",
      nama: p.nama || "",
      modul: p.modul || "",
      pic: p.pic || "",
      client: p.client || "",
      asal: p.asal || "",
      status: p.status || "",
      start_date: p.startDate || "",
      end_date: p.endDate || "",
      completion_date: p.completionDate || "",
      prasyarat: p.prasyarat || "",
      notes: p.notes || "",
      url: p.url || "",
      created_at: p.createdAt || new Date().toISOString()
    }))),

    syncTable("clients", (data.clients || []).map((c: any) => ({
      id: c.id,
      code: c.kodeRS || c.code || "",
      name: c.namaRS || c.name || "",
      pic: c.direkturRS || c.pic || "",
      status: c.tipeMedika || c.status || "",
      created_at: c.createdAt || new Date().toISOString(),
      kode_rs: c.kodeRS || "",
      status_aktif: c.statusAktif !== false
    }))),

    syncTable("client_rooms", (data.clients || []).flatMap((c: any) => 
      (c.rooms || []).map((r: any) => ({
        id: r.id,
        client_id: c.id,
        name: r.name || "",
        building: r.building || "",
        code: r.code || "",
        floor: r.floor || "",
        description: r.description || "",
        sub_room_name: r.subRoomName || "",
        created_at: r.createdAt || new Date().toISOString()
      }))
    )),

    syncTable("tasks", (data.tasks || []).map((t: any) => ({
      id: t.id,
      project: t.project || "",
      modul: t.modul || "",
      task: t.task || "",
      task_type: t.taskType || "",
      category_progress: t.categoryProgress || "",
      pic: t.pic || "",
      priority: t.priority || "",
      status: t.status || "",
      start_date: t.startDate || "",
      due_date: t.dueDate || "",
      progress: typeof t.progress === 'number' ? t.progress : 0,
      notes: t.notes || "",
      created_at: t.createdAt || new Date().toISOString()
    }))),

    syncTable("tickets", (data.tickets || []).map((t: any) => ({
      id: t.id,
      ticket_no: t.ticketNo || "",
      client: t.client || "",
      modul: t.modul || "",
      issue: t.issue || "",
      reported_by: t.reportedBy || "",
      priority: t.priority || "",
      status: t.status || "",
      assigned_to: t.assignedTo || "",
      solution: t.solution || "",
      created_at: t.createdAt || new Date().toISOString()
    }))),

    syncTable("commlogs", (data.commlogs || []).map((l: any) => ({
      id: l.id,
      project: l.project || "",
      client: l.client || "",
      speaker: l.speaker || "",
      media: l.media || "",
      topic: l.topic || "",
      notes: l.notes || "",
      date: l.date || "",
      created_at: l.createdAt || new Date().toISOString()
    }))),

    syncTable("meetinglogs", (data.meetinglogs || []).map((l: any) => ({
      id: l.id,
      project: l.project || "",
      client: l.client || "",
      topic: l.topic || "",
      host: l.host || "",
      notes: l.notes || "",
      date: l.date || "",
      created_at: l.createdAt || new Date().toISOString()
    }))),

    syncTable("checklists", (data.checklists || []).map((c: any) => ({
      id: c.id,
      site: c.site || "",
      verified_by: c.verifiedBy || "",
      notes: c.notes || "",
      score: typeof c.score === 'number' ? c.score : 0,
      created_at: c.createdAt || new Date().toISOString(),
      items: c.items || []
    }))),

    syncTable("assets", (data.assets || []).map((a: any) => ({
      id: a.id,
      name: a.name || "",
      code: a.code || "",
      category: a.category || "",
      status: a.status || "",
      location: a.location || "",
      owner: a.owner || "",
      created_at: a.createdAt || new Date().toISOString()
    }))),

    syncTable("monev", (data.monev || []).map((m: any) => ({
      id: m.id,
      site: m.site || "",
      indicator: m.indicator || "",
      target: typeof m.target === 'number' ? m.target : 0,
      actual: typeof m.actual === 'number' ? m.actual : 0,
      status: m.status || "",
      notes: m.notes || "",
      period: m.period || "",
      created_at: m.createdAt || new Date().toISOString()
    }))),

    syncTable("billing", (data.billing || []).map((b: any) => ({
      id: b.id,
      invoice_no: b.invoiceNo || "",
      client: b.client || "",
      amount: typeof b.amount === 'number' ? b.amount : 0,
      due_date: b.dueDate || "",
      status: b.status || "",
      notes: b.notes || "",
      created_at: b.createdAt || new Date().toISOString()
    }))),

    syncTable("atk_items", (data.atkItems || []).map((i: any) => ({
      id: i.id,
      name: i.name || "",
      unit: i.unit || "",
      price: typeof i.price === 'number' ? i.price : 0,
      created_at: i.createdAt || new Date().toISOString(),
      created_by: i.createdBy || ""
    }))),

    syncTable("atk_orders", (data.atkOrders || []).map((o: any) => ({
      id: o.id,
      item_id: o.itemId || "",
      item_name: o.itemName || "",
      quantity: typeof o.quantity === 'number' ? o.quantity : 1,
      requested_by: o.requestedBy || "",
      status: o.status || "",
      notes: o.notes || "",
      created_at: o.createdAt || new Date().toISOString()
    }))),

    syncTable("kas_site_transactions", (data.kasSiteTransactions || []).map((t: any) => ({
      id: t.id,
      site: t.site || "",
      type: t.type || "",
      amount: typeof t.amount === 'number' ? t.amount : 0,
      description: t.description || "",
      reported_by: t.reportedBy || "",
      date: t.date || "",
      created_at: t.createdAt || new Date().toISOString()
    })))
  ];

  await Promise.allSettled(syncTasks);
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

    const initialClients: Client[] = [
      {
        id: "c-01",
        namaRS: "RS Mataram",
        noKSO: "KSO-2026-001",
        direkturRS: "dr. Ahmad Wijaya, Sp.PD",
        modulSIMRS: "Front Office, Back Office, Farmasi, Laboratorium",
        tanggalProject: "2026-04-01",
        tanggalCutOff: "2026-08-31",
        tipeMedika: "Rumah Sakit",
        createdAt: "2026-04-01T00:00:00Z"
      },
      {
        id: "c-02",
        namaRS: "Puskesmas Ampenan",
        noKSO: "KSO-2026-002",
        direkturRS: "dr. Siti Aminah",
        modulSIMRS: "Front Office, KIA, Apotek",
        tanggalProject: "2026-05-10",
        tanggalCutOff: "2026-09-15",
        tipeMedika: "Puskesmas",
        createdAt: "2026-05-10T00:00:00Z"
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
      settings: DEFAULT_SETTINGS,
      clients: initialClients
    };

    await writeDB(initialDB);
    console.log("Database initialized successfully at " + DB_FILE);
  }
}

// Ensure the DB is ready on load
initializeDB();

const DEFAULT_CHECKLIST_ITEMS = [
  // 1. NETWORKING
  { id: "cl-item-1", category: "NETWORKING", name: "A. The Dude", okLabel: "Reply", notOkLabel: "RTO", active: true, order: 1 },
  { id: "cl-item-2", category: "NETWORKING", name: "B. Link Internet - 1. Test Email", okLabel: "ON", notOkLabel: "OFF", active: true, order: 2 },
  { id: "cl-item-3", category: "NETWORKING", name: "B. Link Internet - 2. Link Gitlab", okLabel: "ON", notOkLabel: "OFF", active: true, order: 3 },
  { id: "cl-item-4", category: "NETWORKING", name: "B. Link Internet - 3. Link Mantis", okLabel: "ON", notOkLabel: "OFF", active: true, order: 4 },
  
  // 2. ANTRIAN PENDAFTARAN MANDIRI
  { id: "cl-item-5", category: "ANTRIAN PENDAFTARAN MANDIRI", name: "1. KiosK", okLabel: "ON", notOkLabel: "OFF", active: true, order: 5 },
  { id: "cl-item-6", category: "ANTRIAN PENDAFTARAN MANDIRI", name: "2. APM 1", okLabel: "ON", notOkLabel: "OFF", active: true, order: 6 },
  { id: "cl-item-7", category: "ANTRIAN PENDAFTARAN MANDIRI", name: "3. APM 2", okLabel: "ON", notOkLabel: "OFF", active: true, order: 7 },
  { id: "cl-item-8", category: "ANTRIAN PENDAFTARAN MANDIRI", name: "4. APM 3", okLabel: "ON", notOkLabel: "OFF", active: true, order: 8 },
  { id: "cl-item-9", category: "ANTRIAN PENDAFTARAN MANDIRI", name: "5. Cetak Antrian", okLabel: "ON", notOkLabel: "OFF", active: true, order: 9 },

  // 3. LOKET PENDAFTARAN
  { id: "cl-item-10", category: "LOKET PENDAFTARAN", name: "1. www.admission.healthcare/daftar-pasien", okLabel: "ON", notOkLabel: "OFF", active: true, order: 10 },
  { id: "cl-item-11", category: "LOKET PENDAFTARAN", name: "2. Suara", okLabel: "ON", notOkLabel: "OFF", active: true, order: 11 },
  { id: "cl-item-12", category: "LOKET PENDAFTARAN", name: "3. Cetak Antrian", okLabel: "ON", notOkLabel: "OFF", active: true, order: 12 },
  { id: "cl-item-13", category: "LOKET PENDAFTARAN", name: "4. Display Antrian Loket TV 42 Inc .1", okLabel: "ON", notOkLabel: "OFF", active: true, order: 13 },
  { id: "cl-item-14", category: "LOKET PENDAFTARAN", name: "5. Loket 1 : Display TV 22 Inc", okLabel: "ON", notOkLabel: "OFF", active: true, order: 14 },
  { id: "cl-item-15", category: "LOKET PENDAFTARAN", name: "6. Loket 2 : Display TV 22 Inc", okLabel: "ON", notOkLabel: "OFF", active: true, order: 15 },
  { id: "cl-item-16", category: "LOKET PENDAFTARAN", name: "7. Loket 3 : Display TV 22 Inc", okLabel: "ON", notOkLabel: "OFF", active: true, order: 16 },
  { id: "cl-item-17", category: "LOKET PENDAFTARAN", name: "8. Loket 4 : Display TV 22 Inc", okLabel: "ON", notOkLabel: "OFF", active: true, order: 17 },
  { id: "cl-item-18", category: "LOKET PENDAFTARAN", name: "9. Loket 5 : Display TV 22 Inc", okLabel: "ON", notOkLabel: "OFF", active: true, order: 18 },
  { id: "cl-item-19", category: "LOKET PENDAFTARAN", name: "10. Loket 6 : Display TV 22 Inc", okLabel: "ON", notOkLabel: "OFF", active: true, order: 19 },

  // 4. FARMASI
  { id: "cl-item-20", category: "FARMASI", name: "1. Suara", okLabel: "ON", notOkLabel: "OFF", active: true, order: 20 },
  { id: "cl-item-21", category: "FARMASI", name: "2. www.farmasi.healthcare/daftar-pasien", okLabel: "Reply", notOkLabel: "RTO", active: true, order: 21 },
  { id: "cl-item-22", category: "FARMASI", name: "3. Printer Antrian", okLabel: "ON", notOkLabel: "Tidak", active: true, order: 22 },
  { id: "cl-item-23", category: "FARMASI", name: "4. Nomer Antrian", okLabel: "ON", notOkLabel: "Tidak", active: true, order: 23 },
  { id: "cl-item-24", category: "FARMASI", name: "5. Display Antrian Farmasi BPJS TV 42 Inc", okLabel: "ON", notOkLabel: "OFF", active: true, order: 24 },
  { id: "cl-item-25", category: "FARMASI", name: "6. Display Antrian Farmasi Umum TV 22 Inc", okLabel: "ON", notOkLabel: "OFF", active: true, order: 25 },
  { id: "cl-item-26", category: "FARMASI", name: "7. Antrian Farmasi", okLabel: "ON", notOkLabel: "OFF", active: true, order: 26 },

  // 5. PELAYANAN
  { id: "cl-item-27", category: "PELAYANAN", name: "A. ANTRIAN PELAYANAN - 1. Display Antrian Pelayanan Poli TV 42 Inc .1", okLabel: "ON", notOkLabel: "OFF", active: true, order: 27 },
  { id: "cl-item-28", category: "PELAYANAN", name: "A. ANTRIAN PELAYANAN - 2. Display Antrian Pelayanan Poli TV 42 Inc .2", okLabel: "ON", notOkLabel: "OFF", active: true, order: 28 },
  { id: "cl-item-29", category: "PELAYANAN", name: "A. ANTRIAN PELAYANAN - 3. Display Antrian Pelayanan Poli TV 42 Inc .3", okLabel: "ON", notOkLabel: "OFF", active: true, order: 29 },
  { id: "cl-item-30", category: "PELAYANAN", name: "A. ANTRIAN PELAYANAN - 4. Display Antrian Pelayanan Rehab TV 42 Inc", okLabel: "ON", notOkLabel: "OFF", active: true, order: 30 },
  { id: "cl-item-31", category: "PELAYANAN", name: "A. ANTRIAN PELAYANAN - 5. Poli Paru : Display TV 22 Inc", okLabel: "ON", notOkLabel: "OFF", active: true, order: 31 },
  { id: "cl-item-32", category: "PELAYANAN", name: "A. ANTRIAN PELAYANAN - 6. Poli Penyakit Dalam : Display TV 22 Inc", okLabel: "ON", notOkLabel: "OFF", active: true, order: 32 },
  { id: "cl-item-33", category: "PELAYANAN", name: "A. ANTRIAN PELAYANAN - 7. Poli Gigi : Display TV 22 Inc", okLabel: "ON", notOkLabel: "OFF", active: true, order: 33 },
  { id: "cl-item-34", category: "PELAYANAN", name: "A. ANTRIAN PELAYANAN - 8. Poli THT : Display TV 22 Inc", okLabel: "ON", notOkLabel: "OFF", active: true, order: 34 },
  { id: "cl-item-35", category: "PELAYANAN", name: "A. ANTRIAN PELAYANAN - 9. Poli Kandungan : Display TV 22 Inc", okLabel: "ON", notOkLabel: "OFF", active: true, order: 35 },
  { id: "cl-item-36", category: "PELAYANAN", name: "A. ANTRIAN PELAYANAN - 10. Poli Psikiatri : Display TV 22 Inc", okLabel: "ON", notOkLabel: "OFF", active: true, order: 36 },
  { id: "cl-item-37", category: "PELAYANAN", name: "A. ANTRIAN PELAYANAN - 11. Poli Psikologi : Display TV 22 Inc", okLabel: "ON", notOkLabel: "OFF", active: true, order: 37 },
  { id: "cl-item-38", category: "PELAYANAN", name: "A. ANTRIAN PELAYANAN - 12. Poli Bedah : Display TV 22 Inc", okLabel: "ON", notOkLabel: "OFF", active: true, order: 38 },
  { id: "cl-item-39", category: "PELAYANAN", name: "A. ANTRIAN PELAYANAN - 13. Poli Kulit Kelamin : Display TV 22 Inc", okLabel: "ON", notOkLabel: "OFF", active: true, order: 39 },
  { id: "cl-item-40", category: "PELAYANAN", name: "A. ANTRIAN PELAYANAN - 14. Poli Anak : Display TV 22 Inc", okLabel: "ON", notOkLabel: "OFF", active: true, order: 40 },
  { id: "cl-item-41", category: "PELAYANAN", name: "A. ANTRIAN PELAYANAN - 15. Poli Mata : Display TV 22 Inc", okLabel: "ON", notOkLabel: "OFF", active: true, order: 41 },
  { id: "cl-item-42", category: "PELAYANAN", name: "A. ANTRIAN PELAYANAN - 16. Poli Bedah Saraf/Urologi : Display TV 22 Inc Ind", okLabel: "ON", notOkLabel: "OFF", active: true, order: 42 },
  { id: "cl-item-43", category: "PELAYANAN", name: "A. ANTRIAN PELAYANAN - 17. Poli Saraf : Display TV 22 Inc", okLabel: "ON", notOkLabel: "OFF", active: true, order: 43 },
  { id: "cl-item-44", category: "PELAYANAN", name: "A. ANTRIAN PELAYANAN - 18. Poli Jantung : Display TV 22 Inc", okLabel: "ON", notOkLabel: "OFF", active: true, order: 44 },
  { id: "cl-item-45", category: "PELAYANAN", name: "A. ANTRIAN PELAYANAN - 19. Poli Penyakit Dalam : Display TV 22 Inc", okLabel: "ON", notOkLabel: "OFF", active: true, order: 45 },
  { id: "cl-item-46", category: "PELAYANAN", name: "A. ANTRIAN PELAYANAN - 20. Poli Geriatri : Display TV 22 Inc", okLabel: "ON", notOkLabel: "OFF", active: true, order: 46 },
  { id: "cl-item-47", category: "PELAYANAN", name: "A. ANTRIAN PELAYANAN - 21. Poli Bedah Tulang : Display TV 22 Inc", okLabel: "ON", notOkLabel: "OFF", active: true, order: 47 },
  { id: "cl-item-48", category: "PELAYANAN", name: "B. EMR PELAYANAN - 1. https://ww.pelayanan.healthcare/#/home", okLabel: "Reply", notOkLabel: "RTO", active: true, order: 48 },

  // 6. BED MONITORING & JADWAL OPERASI
  { id: "cl-item-49", category: "BED MONITORING & JADWAL OPERASI", name: "1. Display Bed Monitoring", okLabel: "ON", notOkLabel: "OFF", active: true, order: 49 },
  { id: "cl-item-50", category: "BED MONITORING & JADWAL OPERASI", name: "2. Jadwal Operasi", okLabel: "ON", notOkLabel: "OFF", active: true, order: 50 },

  // 7. BI DIREKSI
  { id: "cl-item-51", category: "BI DIREKSI", name: "1. Display BI DIREKSI", okLabel: "ON", notOkLabel: "OFF", active: true, order: 51 },

  // 8. BRIDGING
  { id: "cl-item-52", category: "BRIDGING", name: "1. Server Antrian RS", okLabel: "ON", notOkLabel: "OFF", active: true, order: 52 },
  { id: "cl-item-53", category: "BRIDGING", name: "2. Server APM", okLabel: "ON", notOkLabel: "OFF", active: true, order: 53 },
  { id: "cl-item-54", category: "BRIDGING", name: "3. Server VClaim V2", okLabel: "ON", notOkLabel: "OFF", active: true, order: 54 },
  { id: "cl-item-55", category: "BRIDGING", name: "4. Server Antrian Online", okLabel: "ON", notOkLabel: "OFF", active: true, order: 55 },
  { id: "cl-item-56", category: "BRIDGING", name: "5. Server PDF", okLabel: "ON", notOkLabel: "OFF", active: true, order: 56 },
  { id: "cl-item-57", category: "BRIDGING", name: "6. Vclaim", okLabel: "ON", notOkLabel: "OFF", active: true, order: 57 },
  { id: "cl-item-58", category: "BRIDGING", name: "7. Aplicares", okLabel: "ON", notOkLabel: "OFF", active: true, order: 58 },
  { id: "cl-item-59", category: "BRIDGING", name: "8. Siranap", okLabel: "ON", notOkLabel: "OFF", active: true, order: 59 },
  { id: "cl-item-60", category: "BRIDGING", name: "9. Reparasi Database Eklaim", okLabel: "ON", notOkLabel: "OFF", active: true, order: 60 },
  { id: "cl-item-61", category: "BRIDGING", name: "10. Apotek Online", okLabel: "ON", notOkLabel: "OFF", active: true, order: 61 },
  { id: "cl-item-62", category: "BRIDGING", name: "11. SISRUTE", okLabel: "ON", notOkLabel: "OFF", active: true, order: 62 }
];

// DB Access helper
async function readDB() {
  await initializeDB();
  
  let db: any = null;

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("simrs_config")
        .select("data")
        .eq("id", "app_state")
        .single();

      if (error) {
        console.warn("Could not retrieve state from Supabase, error or row absent:", error.message);
      } else if (data && data.data) {
        db = data.data;
        // Trigger background sync to individual tables so they are always in sync with 'app_state'
        syncCollectionsToSupabase(db).catch((e) => {
          console.error("Relational boot background sync error:", e.message || e);
        });
      }
    } catch (e: any) {
      console.error("Exception fetching database from Supabase:", e.message || e);
    }
  }

  if (!db) {
    if (memoryDB) {
      db = memoryDB;
    } else {
      try {
        const raw = await fs.readFile(DB_FILE, "utf-8");
        db = JSON.parse(raw);
        memoryDB = db;
      } catch (err: any) {
        console.warn("Could not read local DB_FILE, fallback to empty state:", err.message);
        db = { users: [] };
        memoryDB = db;
      }
    }

    if (supabase) {
      console.log("Supabase active but database state empty. Migrating local data directly to Supabase cloud table...");
      try {
        await supabase
          .from("simrs_config")
          .upsert({ id: "app_state", data: db, updated_at: new Date().toISOString() });
        console.log("Migration successful!");
        // Sync collections too in background
        syncCollectionsToSupabase(db).catch((e) => {
          console.error("Relational migration background sync error:", e.message || e);
        });
      } catch (migErr: any) {
        console.error("Failed to migrate initial data to Supabase:", migErr.message || migErr);
      }
    }
  }

  let modified = false;
  if (!db.clients) {
    db.clients = [];
    modified = true;
  }
  if (!db.siteImplementations) {
    db.siteImplementations = [];
    modified = true;
  }
  if (!db.tickets) {
    db.tickets = [];
    modified = true;
  }
  if (!db.appModules) {
    db.appModules = [];
    modified = true;
  }
  if (!db.assets) {
    db.assets = [];
    modified = true;
  }
  if (!db.monev) {
    db.monev = [];
    modified = true;
  }
  if (!db.billing) {
    db.billing = [];
    modified = true;
  }
  if (!db.atkItems) {
    db.atkItems = [
      { id: "atk-item-1", name: "Kertas HVS A4 80gr", unit: "Rim", price: 55000, createdAt: new Date().toISOString(), createdBy: "system" },
      { id: "atk-item-2", name: "Pulpen Kantor Standard Pen", unit: "Box", price: 24000, createdAt: new Date().toISOString(), createdBy: "system" },
      { id: "atk-item-3", name: "Buku Log Penyerahan Dinas", unit: "Pcs", price: 15000, createdAt: new Date().toISOString(), createdBy: "system" },
      { id: "atk-item-4", name: "Spidol Boardmarker Hitam Snowman", unit: "Pcs", price: 8500, createdAt: new Date().toISOString(), createdBy: "system" },
      { id: "atk-item-5", name: "Staples No. 10 Max", unit: "Box", price: 12000, createdAt: new Date().toISOString(), createdBy: "system" },
      { id: "atk-item-6", name: "Klip Kertas Paper Clip Besar No.50", unit: "Box", price: 6000, createdAt: new Date().toISOString(), createdBy: "system" }
    ];
    modified = true;
  }
  if (!db.atkOrders) {
    db.atkOrders = [];
    modified = true;
  }
  if (!db.kasSiteTransactions) {
    db.kasSiteTransactions = [];
    modified = true;
  }
  if (!db.kasLocks) {
    db.kasLocks = [];
    modified = true;
  }
  if (!db.kasUnlockRequests) {
    db.kasUnlockRequests = [];
    modified = true;
  }
  if (!db.checklistItemsSetting) {
    db.checklistItemsSetting = [...DEFAULT_CHECKLIST_ITEMS];
    modified = true;
  }
  if (!db.checklists) {
    db.checklists = [];
    modified = true;
  }
  if (db.users) {
    db.users.forEach((u: any) => {
      if (u.statusAktif === undefined) {
        u.statusAktif = true;
        modified = true;
      }
      if (u.siteTugas === undefined) {
        u.siteTugas = "";
        modified = true;
      }
    });
  }
  if (db.settings && db.settings.roles) {
    const adminRole = db.settings.roles.find((r: any) => r.roleName === "Administrator");
    if (adminRole) {
      if (!adminRole.allowedViews.includes("clients")) {
        adminRole.allowedViews.push("clients");
        modified = true;
      }
      if (!adminRole.allowedViews.includes("tickets")) {
        adminRole.allowedViews.push("tickets");
        modified = true;
      }
      if (!adminRole.allowedViews.includes("appmodules")) {
        adminRole.allowedViews.push("appmodules");
        modified = true;
      }
      if (!adminRole.allowedViews.includes("assets")) {
        adminRole.allowedViews.push("assets");
        modified = true;
      }
      if (!adminRole.allowedViews.includes("monev")) {
        adminRole.allowedViews.push("monev");
        modified = true;
      }
      if (!adminRole.allowedViews.includes("billing")) {
        adminRole.allowedViews.push("billing");
        modified = true;
      }
      if (!adminRole.allowedViews.includes("kassite")) {
        adminRole.allowedViews.push("kassite");
        modified = true;
      }
      if (!adminRole.allowedViews.includes("checklist")) {
        adminRole.allowedViews.push("checklist");
        modified = true;
      }
    }
    
    // Also enable for other roles by default so they are easy to access
    db.settings.roles.forEach((r: any) => {
      if (r.roleName !== "Administrator" && r.roleName !== "Client") {
        if (!r.allowedViews.includes("tickets")) {
          r.allowedViews.push("tickets");
          modified = true;
        }
        if (!r.allowedViews.includes("appmodules")) {
          r.allowedViews.push("appmodules");
          modified = true;
        }
        if (!r.allowedViews.includes("sitemodules")) {
          r.allowedViews.push("sitemodules");
          modified = true;
        }
        if (!r.allowedViews.includes("assets")) {
          r.allowedViews.push("assets");
          modified = true;
        }
        if (!r.allowedViews.includes("monev")) {
          r.allowedViews.push("monev");
          modified = true;
        }
        if (!r.allowedViews.includes("billing")) {
          r.allowedViews.push("billing");
          modified = true;
        }
        if (!r.allowedViews.includes("kassite")) {
          r.allowedViews.push("kassite");
          modified = true;
        }
        if (!r.allowedViews.includes("checklist")) {
          r.allowedViews.push("checklist");
          modified = true;
        }
        if (["Logistik Kantor Pusat", "Manager", "Manager Keuangan", "Site Coordinator"].includes(r.roleName)) {
          if (!r.allowedViews.includes("atk")) {
            r.allowedViews.push("atk");
            modified = true;
          }
        }
      } else if (r.roleName === "Client") {
        // Can read or interact with it too if in their permissions
        if (!r.allowedViews.includes("monev")) {
          r.allowedViews.push("monev");
          modified = true;
        }
        if (!r.allowedViews.includes("billing")) {
          r.allowedViews.push("billing");
          modified = true;
        }
        if (!r.allowedViews.includes("checklist")) {
          r.allowedViews.push("checklist");
          modified = true;
        }
      }
    });

    const hasLogisticsHQ = db.settings.roles.some((r: any) => r.roleName === "Logistik Kantor Pusat");
    if (!hasLogisticsHQ) {
      db.settings.roles.push({
        roleName: "Logistik Kantor Pusat",
        allowedViews: ["dashboard", "projects", "tasks", "kanban", "gantt", "calendar", "collab", "tickets", "appmodules", "sitemodules", "assets", "clients", "users", "monev", "billing", "atk"],
        active: true
      });
      modified = true;
    }
  }
  
  // Backfill noID for existing records if they don't have it
  let backfilled = false;
  if (db.commLogs) {
    let commCount = 0;
    for (let i = db.commLogs.length - 1; i >= 0; i--) {
      if (!db.commLogs[i].noID) {
        commCount++;
        db.commLogs[i].noID = `KRD-${String(commCount).padStart(3, '0')}`;
        backfilled = true;
      } else {
        const match = db.commLogs[i].noID.match(/KRD-(\d+)/);
        if (match) {
          commCount = Math.max(commCount, parseInt(match[1], 10));
        }
      }
    }
  }

  if (db.meetingLogs) {
    let momCount = 0;
    for (let i = db.meetingLogs.length - 1; i >= 0; i--) {
      if (!db.meetingLogs[i].noID) {
        momCount++;
        db.meetingLogs[i].noID = `MOM-${String(momCount).padStart(3, '0')}`;
        backfilled = true;
      } else {
        const match = db.meetingLogs[i].noID.match(/MOM-(\d+)/);
        if (match) {
          momCount = Math.max(momCount, parseInt(match[1], 10));
        }
      }
    }
  }

  if (db.baLogs) {
    let baCount = 0;
    for (let i = db.baLogs.length - 1; i >= 0; i--) {
      if (!db.baLogs[i].noID) {
        baCount++;
        db.baLogs[i].noID = `BA-${String(baCount).padStart(3, '0')}`;
        backfilled = true;
      } else {
        const match = db.baLogs[i].noID.match(/BA-(\d+)/);
        if (match) {
          baCount = Math.max(baCount, parseInt(match[1], 10));
        }
      }
    }
  }

  if (db.docs) {
    let docCount = 0;
    for (let i = db.docs.length - 1; i >= 0; i--) {
      if (!db.docs[i].noID) {
        docCount++;
        db.docs[i].noID = `DOC-${String(docCount).padStart(3, '0')}`;
        backfilled = true;
      } else {
        const match = db.docs[i].noID.match(/DOC-(\d+)/);
        if (match) {
          docCount = Math.max(docCount, parseInt(match[1], 10));
        }
      }
    }
  }

  if (modified || backfilled) {
    await writeDB(db);
  }
  return db;
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

    if (user.statusAktif === false) {
      return res.status(403).json({ error: "Akun Anda tidak aktif! Silakan hubungi Administrator Utama." });
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
    const { username, name, nickname, password, email, role, divisi } = req.body;
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
      divisi: divisi || "",
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
    const { username, name, nickname, password, email, role, siteTugas, statusAktif, divisi, photoUrl } = req.body;
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
      siteTugas: siteTugas || "",
      statusAktif: statusAktif !== undefined ? Boolean(statusAktif) : true,
      divisi: divisi || "",
      photoUrl: photoUrl || "",
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
    const { name, nickname, email, role, password, siteTugas, statusAktif, divisi, photoUrl } = req.body;
    const db = await readDB();
    const idx = db.users.findIndex((u: any) => u.id === id);
    if (idx === -1) {
      return res.status(404).json({ error: "User tidak ditemukan!" });
    }

    db.users[idx].name = name || db.users[idx].name;
    db.users[idx].nickname = nickname || db.users[idx].nickname;
    db.users[idx].email = email || db.users[idx].email;
    db.users[idx].role = role || db.users[idx].role;
    if (siteTugas !== undefined) {
      db.users[idx].siteTugas = siteTugas;
    }
    if (statusAktif !== undefined) {
      db.users[idx].statusAktif = Boolean(statusAktif);
    }
    if (divisi !== undefined) {
      db.users[idx].divisi = divisi;
    }
    if (photoUrl !== undefined) {
      db.users[idx].photoUrl = photoUrl;
    }
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


// Helper to generate sequential next ID for collaboration logs
function generateNextId(prefix: string, list: any[]) {
  let maxNum = 0;
  if (list && list.length > 0) {
    list.forEach(item => {
      if (item.noID && item.noID.startsWith(prefix)) {
        const numPart = parseInt(item.noID.substring(prefix.length), 10);
        if (!isNaN(numPart) && numPart > maxNum) {
          maxNum = numPart;
        }
      }
    });
  }
  return `${prefix}${String(maxNum + 1).padStart(3, '0')}`;
}


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
    if (!db.commLogs) db.commLogs = [];
    const nextNoID = generateNextId("KRD-", db.commLogs);
    const newComm: CommLog = { 
      ...req.body, 
      id: "c-" + Math.random().toString(36).slice(2, 9), 
      date: req.body.date || new Date().toISOString().slice(0, 10),
      noID: nextNoID
    };
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

app.put("/api/commlogs/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const db = await readDB();
    const idx = (db.commLogs || []).findIndex((c: any) => c.id === id);
    if (idx !== -1) {
      db.commLogs[idx] = { ...db.commLogs[idx], ...req.body };
      await writeDB(db);
      return res.json(db.commLogs[idx]);
    } else {
      return res.status(404).json({ error: "Log koordinasi tidak ditemukan" });
    }
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
    if (!db.meetingLogs) db.meetingLogs = [];
    const nextNoID = generateNextId("MOM-", db.meetingLogs);
    const newMeet: MeetingLog = { 
      ...req.body, 
      id: "m-" + Math.random().toString(36).slice(2, 9), 
      date: req.body.date || new Date().toISOString().slice(0, 10),
      noID: nextNoID
    };
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

app.put("/api/meetinglogs/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const db = await readDB();
    const idx = (db.meetingLogs || []).findIndex((m: any) => m.id === id);
    if (idx !== -1) {
      db.meetingLogs[idx] = { ...db.meetingLogs[idx], ...req.body };
      await writeDB(db);
      return res.json(db.meetingLogs[idx]);
    } else {
      return res.status(404).json({ error: "Notula rapat tidak ditemukan" });
    }
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
    if (!db.docs) db.docs = [];
    const nextNoID = generateNextId("DOC-", db.docs);
    const newDoc: Documentation = { 
      ...req.body, 
      id: "d-" + Math.random().toString(36).slice(2, 9), 
      date: req.body.date || new Date().toISOString().slice(0,10),
      noID: nextNoID
    };
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

app.put("/api/docs/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const db = await readDB();
    const idx = (db.docs || []).findIndex((d: any) => d.id === id);
    if (idx !== -1) {
      db.docs[idx] = { ...db.docs[idx], ...req.body };
      await writeDB(db);
      return res.json(db.docs[idx]);
    } else {
      return res.status(404).json({ error: "Dokumen tidak ditemukan" });
    }
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});


// ── BERITA ACARA (BA) LOGS CRUD ──────────────────────────────────────────
app.get("/api/balogs", async (req, res) => {
  try {
    const db = await readDB();
    return res.json(db.baLogs || []);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post("/api/balogs", async (req, res) => {
  try {
    const db = await readDB();
    if (!db.baLogs) db.baLogs = [];
    const nextNoID = generateNextId("BA-", db.baLogs);
    const newBA: BALog = { 
      ...req.body, 
      id: "ba-" + Math.random().toString(36).slice(2, 9), 
      date: req.body.date || new Date().toISOString().slice(0, 10),
      status: req.body.status || "Draft",
      noID: nextNoID
    };
    db.baLogs.unshift(newBA);
    await writeDB(db);
    return res.status(201).json(newBA);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.delete("/api/balogs/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const db = await readDB();
    db.baLogs = (db.baLogs || []).filter((ba: any) => ba.id !== id);
    await writeDB(db);
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.put("/api/balogs/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const db = await readDB();
    const idx = (db.baLogs || []).findIndex((ba: any) => ba.id === id);
    if (idx !== -1) {
      db.baLogs[idx] = { ...db.baLogs[idx], ...req.body };
      await writeDB(db);
      return res.json(db.baLogs[idx]);
    } else {
      return res.status(404).json({ error: "Berita Acara tidak ditemukan" });
    }
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


// ── CLIENTS / RS CRUD ──────────────────────────────────────────────────────
app.get("/api/clients", async (req, res) => {
  try {
    const db = await readDB();
    return res.json(db.clients || []);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post("/api/clients", async (req, res) => {
  try {
    const { namaRS, noKSO, direkturRS, modulSIMRS, tanggalProject, tanggalCutOff, tipeMedika, moduleStatuses, persentaseKSO, directors, rooms, kodeRS, statusAktif } = req.body;
    if (!namaRS) {
      return res.status(400).json({ error: "Nama RS wajib diisi!" });
    }
    const db = await readDB();
    const newClient: Client = {
      id: "c-" + Math.random().toString(36).slice(2, 9),
      namaRS,
      noKSO: noKSO || "",
      direkturRS: direkturRS || "",
      modulSIMRS: modulSIMRS || "",
      tanggalProject: tanggalProject || "",
      tanggalCutOff: tanggalCutOff || "",
      tipeMedika: tipeMedika || "",
      createdAt: new Date().toISOString(),
      moduleStatuses: moduleStatuses || [],
      persentaseKSO: persentaseKSO !== undefined ? parseFloat(persentaseKSO) : 100,
      directors: directors || [],
      rooms: rooms || [],
      kodeRS: (kodeRS || "").substring(0, 5),
      statusAktif: statusAktif !== undefined ? !!statusAktif : true
    };
    db.clients.push(newClient);
    await writeDB(db);
    return res.status(201).json(newClient);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.put("/api/clients/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { namaRS, noKSO, direkturRS, modulSIMRS, tanggalProject, tanggalCutOff, tipeMedika, moduleStatuses, persentaseKSO, directors, rooms, kodeRS, statusAktif } = req.body;
    const db = await readDB();
    const idx = db.clients.findIndex((cl: any) => cl.id === id);
    if (idx === -1) {
      return res.status(404).json({ error: "Data Client / RS tidak ditemukan!" });
    }
    if (namaRS !== undefined) db.clients[idx].namaRS = namaRS;
    if (noKSO !== undefined) db.clients[idx].noKSO = noKSO;
    if (direkturRS !== undefined) db.clients[idx].direkturRS = direkturRS;
    if (modulSIMRS !== undefined) db.clients[idx].modulSIMRS = modulSIMRS;
    if (tanggalProject !== undefined) db.clients[idx].tanggalProject = tanggalProject;
    if (tanggalCutOff !== undefined) db.clients[idx].tanggalCutOff = tanggalCutOff;
    if (tipeMedika !== undefined) db.clients[idx].tipeMedika = tipeMedika;
    if (moduleStatuses !== undefined) db.clients[idx].moduleStatuses = moduleStatuses;
    if (persentaseKSO !== undefined) db.clients[idx].persentaseKSO = persentaseKSO !== null ? parseFloat(persentaseKSO) : undefined;
    if (directors !== undefined) db.clients[idx].directors = directors;
    if (rooms !== undefined) db.clients[idx].rooms = rooms;
    if (kodeRS !== undefined) db.clients[idx].kodeRS = (kodeRS || "").substring(0, 5);
    if (statusAktif !== undefined) db.clients[idx].statusAktif = !!statusAktif;
    
    await writeDB(db);
    return res.json(db.clients[idx]);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.delete("/api/clients/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const db = await readDB();
    db.clients = (db.clients || []).filter((cl: any) => cl.id !== id);
    await writeDB(db);
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});


// ── TICKETS CRUD ─────────────────────────────────────────────────────────
app.get("/api/tickets", async (req, res) => {
  try {
    const db = await readDB();
    return res.json(db.tickets || []);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post("/api/tickets", async (req, res) => {
  try {
    const db = await readDB();
    const newTicket = { id: "tk-" + Math.random().toString(36).slice(2, 9), createdAt: new Date().toISOString(), ...req.body };
    db.tickets = db.tickets || [];
    db.tickets.unshift(newTicket);
    await writeDB(db);
    return res.status(201).json(newTicket);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.put("/api/tickets/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const db = await readDB();
    const idx = (db.tickets || []).findIndex((tk: any) => tk.id === id);
    if (idx === -1) {
      return res.status(404).json({ error: "Ticket tidak ditemukan!" });
    }
    db.tickets[idx] = { ...db.tickets[idx], ...req.body };
    await writeDB(db);
    return res.json(db.tickets[idx]);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.delete("/api/tickets/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const db = await readDB();
    db.tickets = (db.tickets || []).filter((tk: any) => tk.id !== id);
    await writeDB(db);
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});


// ── APPLICATION MODULES CRUD ──────────────────────────────────────────────
app.get("/api/appmodules", async (req, res) => {
  try {
    const db = await readDB();
    return res.json(db.appModules || []);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post("/api/appmodules", async (req, res) => {
  try {
    const db = await readDB();
    const newModule = { id: "am-" + Math.random().toString(36).slice(2, 9), createdAt: new Date().toISOString(), ...req.body };
    db.appModules = db.appModules || [];
    db.appModules.unshift(newModule);
    await writeDB(db);
    return res.status(201).json(newModule);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.put("/api/appmodules/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const db = await readDB();
    const idx = (db.appModules || []).findIndex((am: any) => am.id === id);
    if (idx === -1) {
      return res.status(404).json({ error: "Modul Utama tidak ditemukan!" });
    }
    db.appModules[idx] = { ...db.appModules[idx], ...req.body };
    await writeDB(db);
    return res.json(db.appModules[idx]);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.delete("/api/appmodules/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const db = await readDB();
    db.appModules = (db.appModules || []).filter((am: any) => am.id !== id);
    await writeDB(db);
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});


// ── ASSETS CRUD ──────────────────────────────────────────────────────────
app.get("/api/assets", async (req, res) => {
  try {
    const db = await readDB();
    return res.json(db.assets || []);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post("/api/assets", async (req, res) => {
  try {
    const db = await readDB();
    const newAsset = { id: "as-" + Math.random().toString(36).slice(2, 9), createdAt: new Date().toISOString(), ...req.body };
    db.assets = db.assets || [];
    db.assets.unshift(newAsset);
    await writeDB(db);
    return res.status(201).json(newAsset);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.put("/api/assets/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const db = await readDB();
    const idx = (db.assets || []).findIndex((as: any) => as.id === id);
    if (idx === -1) {
      return res.status(404).json({ error: "Aset tidak ditemukan!" });
    }
    db.assets[idx] = { ...db.assets[idx], ...req.body };
    await writeDB(db);
    return res.json(db.assets[idx]);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.delete("/api/assets/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const db = await readDB();
    db.assets = (db.assets || []).filter((as: any) => as.id !== id);
    await writeDB(db);
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});


// ── SITE IMPLEMENTATIONS CRUD ─────────────────────────────────────────────
app.get("/api/siteimplementations", async (req, res) => {
  try {
    const db = await readDB();
    return res.json(db.siteImplementations || []);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post("/api/siteimplementations", async (req, res) => {
  try {
    const db = await readDB();
    const newImpl = { 
      id: "impl-" + Math.random().toString(36).slice(2, 9), 
      createdAt: new Date().toISOString(), 
      ...req.body 
    };
    db.siteImplementations = db.siteImplementations || [];
    db.siteImplementations.unshift(newImpl);
    await writeDB(db);
    return res.status(201).json(newImpl);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.put("/api/siteimplementations/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const db = await readDB();
    const idx = (db.siteImplementations || []).findIndex((impl: any) => impl.id === id);
    if (idx === -1) {
      return res.status(404).json({ error: "Data implementasi tidak ditemukan!" });
    }
    db.siteImplementations[idx] = { ...db.siteImplementations[idx], ...req.body };
    await writeDB(db);
    return res.json(db.siteImplementations[idx]);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.delete("/api/siteimplementations/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const db = await readDB();
    db.siteImplementations = (db.siteImplementations || []).filter((impl: any) => impl.id !== id);
    await writeDB(db);
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});


// ── CHECKLISTS CRUD ──────────────────────────────────────────────────────
app.get("/api/checklist/settings", async (req, res) => {
  try {
    const db = await readDB();
    return res.json(db.checklistItemsSetting || []);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post("/api/checklist/settings", async (req, res) => {
  try {
    const db = await readDB();
    const newItem = {
      id: "cl-item-" + Math.random().toString(36).slice(2, 9),
      active: true,
      order: (db.checklistItemsSetting || []).length + 1,
      ...req.body
    };
    db.checklistItemsSetting = db.checklistItemsSetting || [];
    db.checklistItemsSetting.push(newItem);
    await writeDB(db);
    return res.status(201).json(newItem);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.put("/api/checklist/settings/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const db = await readDB();
    const idx = (db.checklistItemsSetting || []).findIndex((item: any) => item.id === id);
    if (idx === -1) {
      return res.status(404).json({ error: "Checklist item tidak ditemukan!" });
    }
    db.checklistItemsSetting[idx] = { ...db.checklistItemsSetting[idx], ...req.body };
    await writeDB(db);
    return res.json(db.checklistItemsSetting[idx]);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.delete("/api/checklist/settings/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const db = await readDB();
    db.checklistItemsSetting = (db.checklistItemsSetting || []).filter((item: any) => item.id !== id);
    await writeDB(db);
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.get("/api/checklists", async (req, res) => {
  try {
    const db = await readDB();
    return res.json(db.checklists || []);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post("/api/checklists", async (req, res) => {
  try {
    const db = await readDB();
    const newChecklist = {
      id: "cl-sub-" + Math.random().toString(36).slice(2, 9),
      createdAt: new Date().toISOString(),
      ...req.body
    };
    db.checklists = db.checklists || [];
    db.checklists.unshift(newChecklist);
    await writeDB(db);
    return res.status(201).json(newChecklist);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.put("/api/checklists/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const db = await readDB();
    const idx = (db.checklists || []).findIndex((cl: any) => cl.id === id);
    if (idx === -1) {
      return res.status(404).json({ error: "Checklist submission tidak ditemukan!" });
    }
    db.checklists[idx] = { ...db.checklists[idx], ...req.body };
    await writeDB(db);
    return res.json(db.checklists[idx]);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.delete("/api/checklists/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const db = await readDB();
    db.checklists = (db.checklists || []).filter((cl: any) => cl.id !== id);
    await writeDB(db);
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(550).json({ error: err.message });
  }
});


// ── SETTINGS CRUD ────────────────────────────────────────────────────────
app.get("/api/settings", async (req, res) => {
  try {
    const db = await readDB();
    if (!db.settings) {
      db.settings = { ...DEFAULT_SETTINGS };
      await writeDB(db);
    } else {
      let modified = false;
      const keys = ["tipeMedika", "kategoriDokumen", "jenisBeritaAcara", "jenisModul", "statusImplementasi", "tipeMedia", "statusImplementasiSite", "statusPenggunaan", "kategoriImplementasi", "jenisAplikasiModul", "platformModul", "statusModul", "jenisLaporan", "kategoriLaporan", "subKategori", "jenisMasalah", "divisi"];
      for (const key of keys) {
        if (!db.settings[key]) {
          db.settings[key] = (DEFAULT_SETTINGS as any)[key];
          modified = true;
        }
      }
      if (modified) {
        await writeDB(db);
      }
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


// ── COMPANY PROFILE CRUD ───────────────────────────────────────────────
const DEFAULT_COMPANY_PROFILE = {
  id: "default",
  nama: "PT. Medika KSO Syanapsis",
  alamat: "Gedung Cyber 2 Lantai 18, Jl. H.R. Rasuna Said Blok X-5 No. 13, Kuningan Timur, Jakarta Selatan 12950",
  telepon: "021-5228585",
  fax: "021-5228586",
  web: "https://syanapsis.taskhub.co.id",
  email: "info@syanapsis.taskhub.co.id",
  logoUrl: "",
  updatedAt: "2026-06-22T00:00:00.000Z"
};

app.get("/api/company-profile", async (req, res) => {
  try {
    const db = await readDB();
    if (!db.companyProfile) {
      db.companyProfile = { ...DEFAULT_COMPANY_PROFILE, updatedAt: new Date().toISOString() };
      await writeDB(db);
    }
    return res.json(db.companyProfile);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.put("/api/company-profile", async (req, res) => {
  try {
    const db = await readDB();
    db.companyProfile = { 
      ...(db.companyProfile || DEFAULT_COMPANY_PROFILE), 
      ...req.body, 
      updatedAt: new Date().toISOString() 
    };
    await writeDB(db);
    return res.json(db.companyProfile);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});


// ── MONITORING EVALUASI (MONEV) CRUD ─────────────────────────────────────
app.get("/api/monev", async (req, res) => {
  try {
    const db = await readDB();
    return res.json(db.monev || []);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post("/api/monev", async (req, res) => {
  try {
    const db = await readDB();
    const newMonev = {
      id: "monev-" + Math.random().toString(36).slice(2, 9),
      createdAt: new Date().toISOString(),
      ...req.body
    };
    db.monev = db.monev || [];
    db.monev.unshift(newMonev);
    await writeDB(db);
    return res.status(201).json(newMonev);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.put("/api/monev/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const db = await readDB();
    const idx = (db.monev || []).findIndex((e: any) => e.id === id);
    if (idx === -1) {
      return res.status(404).json({ error: "Data Monev tidak ditemukan!" });
    }
    db.monev[idx] = { ...db.monev[idx], ...req.body };
    await writeDB(db);
    return res.json(db.monev[idx]);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.delete("/api/monev/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const db = await readDB();
    db.monev = (db.monev || []).filter((e: any) => e.id !== id);
    await writeDB(db);
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});


// ── BILLING KSO CRUD ─────────────────────────────────────────────────────
app.get("/api/billing", async (req, res) => {
  try {
    const db = await readDB();
    return res.json(db.billing || []);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post("/api/billing", async (req, res) => {
  try {
    const db = await readDB();
    const newBilling: BillingKSO = {
      id: "bill-" + Math.random().toString(36).slice(2, 9),
      createdAt: new Date().toISOString(),
      ...req.body
    };
    db.billing = db.billing || [];
    db.billing.unshift(newBilling);
    await writeDB(db);
    return res.status(201).json(newBilling);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.put("/api/billing/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const db = await readDB();
    const idx = (db.billing || []).findIndex((e: any) => e.id === id);
    if (idx === -1) {
      return res.status(404).json({ error: "Data Billing KSO tidak ditemukan!" });
    }
    db.billing[idx] = { ...db.billing[idx], ...req.body };
    await writeDB(db);
    return res.json(db.billing[idx]);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.delete("/api/billing/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const db = await readDB();
    db.billing = (db.billing || []).filter((e: any) => e.id !== id);
    await writeDB(db);
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});


// ── ATK MASTER ITEMS CRUD ───────────────────────────────────────────────
app.get("/api/atk/items", async (req, res) => {
  try {
    const db = await readDB();
    return res.json(db.atkItems || []);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post("/api/atk/items", async (req, res) => {
  try {
    const db = await readDB();
    const newItem = {
      id: "atk-item-" + Math.random().toString(36).slice(2, 9),
      createdAt: new Date().toISOString(),
      ...req.body
    };
    db.atkItems = db.atkItems || [];
    db.atkItems.unshift(newItem);
    await writeDB(db);
    return res.status(201).json(newItem);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.put("/api/atk/items/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const db = await readDB();
    const idx = (db.atkItems || []).findIndex((e: any) => e.id === id);
    if (idx === -1) {
      return res.status(404).json({ error: "Item ATK tidak ditemukan!" });
    }
    db.atkItems[idx] = { ...db.atkItems[idx], ...req.body };
    await writeDB(db);
    return res.json(db.atkItems[idx]);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.delete("/api/atk/items/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const db = await readDB();
    db.atkItems = (db.atkItems || []).filter((e: any) => e.id !== id);
    await writeDB(db);
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});


// ── ATK ORDERS CRUD ─────────────────────────────────────────────────────
app.get("/api/atk/orders", async (req, res) => {
  try {
    const db = await readDB();
    return res.json(db.atkOrders || []);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post("/api/atk/orders", async (req, res) => {
  try {
    const db = await readDB();
    db.atkOrders = db.atkOrders || [];
    
    // Auto sequence number for order
    const now = new Date();
    const prefix = `ORD-ATK-${now.getFullYear()}`;
    const yearOrders = db.atkOrders.filter((o: any) => o.noPemesanan && o.noPemesanan.startsWith(prefix));
    const nextSeq = String(yearOrders.length + 1).padStart(4, "0");
    const noPemesanan = `${prefix}-${nextSeq}`;

    const newOrder = {
      id: "atk-ord-" + Math.random().toString(36).slice(2, 9),
      noPemesanan,
      createdAt: now.toISOString(),
      ...req.body
    };
    
    db.atkOrders.unshift(newOrder);
    await writeDB(db);
    return res.status(201).json(newOrder);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.put("/api/atk/orders/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const db = await readDB();
    const idx = (db.atkOrders || []).findIndex((e: any) => e.id === id);
    if (idx === -1) {
      return res.status(404).json({ error: "Order ATK tidak ditemukan!" });
    }
    db.atkOrders[idx] = { ...db.atkOrders[idx], ...req.body };
    await writeDB(db);
    return res.json(db.atkOrders[idx]);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.delete("/api/atk/orders/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const db = await readDB();
    db.atkOrders = (db.atkOrders || []).filter((e: any) => e.id !== id);
    await writeDB(db);
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});


// ── KAS SITE MOVEMENT CRUD ──────────────────────────────────────────────
app.get("/api/kassite", async (req, res) => {
  try {
    const db = await readDB();
    return res.json(db.kasSiteTransactions || []);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post("/api/kassite", async (req, res) => {
  try {
    const db = await readDB();
    db.kasSiteTransactions = db.kasSiteTransactions || [];

    // Auto generated sequence for receipts
    const now = new Date();
    const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
    const typeStr = req.body.type === "Masuk" ? "IN" : "OUT";
    const prefix = `KAS-${typeStr}-${yearMonth}`;
    
    const matchingTrans = db.kasSiteTransactions.filter((t: any) => t.receiptNo && t.receiptNo.startsWith(prefix));
    const nextSeq = String(matchingTrans.length + 1).padStart(4, "0");
    const generatedReceiptNo = `${prefix}-${nextSeq}`;

    const newTrans = {
      id: "kas-" + Math.random().toString(36).slice(2, 9),
      receiptNo: req.body.receiptNo || generatedReceiptNo,
      createdAt: now.toISOString(),
      status: req.body.status || "Draft",
      ...req.body
    };

    db.kasSiteTransactions.unshift(newTrans);
    await writeDB(db);
    return res.status(201).json(newTrans);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.put("/api/kassite/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const db = await readDB();
    const idx = (db.kasSiteTransactions || []).findIndex((e: any) => e.id === id);
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

app.delete("/api/kassite/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const db = await readDB();
    db.kasSiteTransactions = (db.kasSiteTransactions || []).filter((e: any) => e.id !== id);
    await writeDB(db);
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});


// ── KAS SITE REPLENISHMENTS ──────────────────────────────────────────────
app.get("/api/kassite/replenish", async (req, res) => {
  try {
    const db = await readDB();
    return res.json(db.kasSiteReplenishments || []);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post("/api/kassite/replenish", async (req, res) => {
  try {
    const db = await readDB();
    db.kasSiteReplenishments = db.kasSiteReplenishments || [];

    const now = new Date();
    const dateStr = now.toISOString().split("T")[0].replace(/-/g, "");
    const rnd = Math.floor(1000 + Math.random() * 9000);
    const generatedReqNo = `REQ-REPL-${dateStr}-${rnd}`;

    const newReplen = {
      id: "repl-" + Math.random().toString(36).slice(2, 9),
      createdAt: now.toISOString(),
      reqNo: req.body.reqNo || generatedReqNo,
      status: req.body.status || "Pending",
      ...req.body
    };

    // Update status of associated transactions, binding them to replenishmentId
    if (newReplen.transactionIds && Array.isArray(newReplen.transactionIds)) {
      db.kasSiteTransactions = (db.kasSiteTransactions || []).map((t: any) => {
        if (newReplen.transactionIds.includes(t.id)) {
          return {
            ...t,
            status: "Pending",
            replenishmentId: newReplen.id
          };
        }
        return t;
      });
    }

    db.kasSiteReplenishments.unshift(newReplen);
    await writeDB(db);
    return res.status(201).json(newReplen);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.put("/api/kassite/replenish/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const db = await readDB();
    const idx = (db.kasSiteReplenishments || []).findIndex((e: any) => e.id === id);
    if (idx === -1) {
      return res.status(404).json({ error: "Pengajuan dana tidak ditemukan!" });
    }

    const oldStatus = db.kasSiteReplenishments[idx].status;
    db.kasSiteReplenishments[idx] = { ...db.kasSiteReplenishments[idx], ...req.body };
    const newStatus = db.kasSiteReplenishments[idx].status;

    // If status has been updated (e.g. from Pending -> Approved/Rejected)
    if (newStatus && newStatus !== oldStatus) {
      const tIds = db.kasSiteReplenishments[idx].transactionIds || [];
      if (tIds.length > 0) {
        db.kasSiteTransactions = (db.kasSiteTransactions || []).map((t: any) => {
          if (tIds.includes(t.id)) {
            return {
              ...t,
              status: newStatus === "Approved" ? "Approved" : "Rejected"
            };
          }
          return t;
        });
      }

      // If Approved, automatically inject the "KAS MASUK" inflow dropping transaction
      if (newStatus === "Approved" && oldStatus !== "Approved") {
        const repl = db.kasSiteReplenishments[idx];
        const dateStr = new Date().toISOString().split("T")[0];
        const fileDate = dateStr.replace(/-/g, "");
        const genInflowId = "kas-" + Math.random().toString(36).slice(2, 9);
        const autoInflow = {
          id: genInflowId,
          project: repl.project,
          type: "Masuk",
          date: dateStr,
          amount: Number(repl.requestedAmount || 0),
          description: `[AUTO-REPL] Penerimaan Dropping Dana HQ via pengajuan Rekap ${repl.reqNo}`,
          receiptNo: `KAS-IN-${fileDate.substring(0, 6)}-REPL`,
          status: "Approved",
          receiptUrl: repl.transferProofUrl || "",
          createdAt: new Date().toISOString(),
          createdBy: "Kantor Pusat (System)"
        };
        db.kasSiteTransactions = db.kasSiteTransactions || [];
        db.kasSiteTransactions.unshift(autoInflow);
      }
    }

    await writeDB(db);
    return res.json(db.kasSiteReplenishments[idx]);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.delete("/api/kassite/replenish/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const db = await readDB();

    // Release/unlock associated transactions back to Draft status and clear replenishmentId
    db.kasSiteTransactions = (db.kasSiteTransactions || []).map((t: any) => {
      if (t.replenishmentId === id) {
        return {
          ...t,
          status: "Draft",
          replenishmentId: ""
        };
      }
      return t;
    });

    db.kasSiteReplenishments = (db.kasSiteReplenishments || []).filter((e: any) => e.id !== id);
    await writeDB(db);
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});


// ── KAS SITE LOCKS & UNLOCK REQUESTS ────────────────────────────────────
app.get("/api/kassite/locks", async (req, res) => {
  try {
    const db = await readDB();
    return res.json(db.kasLocks || []);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post("/api/kassite/locks", async (req, res) => {
  try {
    const db = await readDB();
    db.kasLocks = db.kasLocks || [];
    const { month, site, isLocked, lockedBy } = req.body;
    
    const idx = db.kasLocks.findIndex((l: any) => l.month === month && l.site === site);
    if (idx !== -1) {
      db.kasLocks[idx] = {
        ...db.kasLocks[idx],
        isLocked,
        lockedAt: new Date().toISOString(),
        lockedBy: lockedBy || "HQ Finance"
      };
    } else {
      db.kasLocks.push({
        id: "lock-" + Math.random().toString(36).slice(2, 9),
        month,
        site,
        isLocked,
        lockedAt: new Date().toISOString(),
        lockedBy: lockedBy || "HQ Finance"
      });
    }
    
    await writeDB(db);
    return res.json(db.kasLocks);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.get("/api/kassite/unlock-requests", async (req, res) => {
  try {
    const db = await readDB();
    return res.json(db.kasUnlockRequests || []);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post("/api/kassite/unlock-requests", async (req, res) => {
  try {
    const db = await readDB();
    db.kasUnlockRequests = db.kasUnlockRequests || [];
    
    const newReq = {
      id: "req-unl-" + Math.random().toString(36).slice(2, 9),
      createdAt: new Date().toISOString(),
      status: "Pending",
      ...req.body
    };
    
    db.kasUnlockRequests.unshift(newReq);
    await writeDB(db);
    return res.status(201).json(newReq);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.put("/api/kassite/unlock-requests/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const db = await readDB();
    db.kasUnlockRequests = db.kasUnlockRequests || [];
    
    const idx = db.kasUnlockRequests.findIndex((r: any) => r.id === id);
    if (idx === -1) {
      return res.status(404).json({ error: "Pengajuan unlock tidak ditemukan!" });
    }
    
    db.kasUnlockRequests[idx] = { ...db.kasUnlockRequests[idx], ...req.body };
    const requestItem = db.kasUnlockRequests[idx];
    
    // If approved, dynamically temporarily unlock that month/site
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



// ── VITE INTERACTION LAYER ──────────────────────────────────────────────
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
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

export default app;
