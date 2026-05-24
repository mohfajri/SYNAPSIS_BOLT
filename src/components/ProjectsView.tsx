import React, { useState, useEffect } from "react";
import { Project, Task, LogEntry, User } from "../types";
import { 
  FolderLock, 
  Search, 
  Plus, 
  ExternalLink, 
  Calendar, 
  User2, 
  FileCheck2, 
  AlertTriangle, 
  HelpCircle, 
  Target, 
  BookMarked,
  Trash2,
  Edit,
  ClipboardList
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface ProjectsViewProps {
  projects: Project[];
  tasks: Task[];
  logs: LogEntry[];
  currentUser: User | null;
  picsList: string[];
  users?: User[];
  modulsList: string[];
  asalsList: string[];
  pstatusesList: string[];
  catProgsList: string[];
  picThemeColors: (picName: string) => string;
  onAddProject: (data: Partial<Project>) => Promise<void>;
  onUpdateProject: (id: string, data: Partial<Project>) => Promise<void>;
  onDeleteProject: (id: string) => Promise<void>;
  onAddDiagnosticLog: (projId: string, type: 'kendala' | 'solusi' | 'fokus', text: string, date: string) => Promise<void>;
  onDeleteDiagnosticLog: (id: string) => Promise<void>;
}

export default function ProjectsView({
  projects,
  tasks,
  logs,
  currentUser,
  picsList,
  users = [],
  modulsList,
  asalsList,
  pstatusesList,
  catProgsList,
  picThemeColors,
  onAddProject,
  onUpdateProject,
  onDeleteProject,
  onAddDiagnosticLog,
  onDeleteDiagnosticLog
}: ProjectsViewProps) {
  
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  
  // Modal & form states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProj, setEditingProj] = useState<Project | null>(null);
  
  // Create / Edit Form Variables
  const [nama, setNama] = useState("");
  const [kode, setKode] = useState("");
  const [modul, setModul] = useState("");
  const [pic, setPic] = useState("");
  const [client, setClient] = useState("");
  const [asal, setAsal] = useState("");
  const [status, setStatus] = useState("On Track");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [completionDate, setCompletionDate] = useState("");
  const [prasyarat, setPrasyarat] = useState("");
  const [notes, setNotes] = useState("");
  const [url, setUrl] = useState("");

  // Get dynamic PIC options filter based on target site/client entered
  const getDynamicPicsList = () => {
    // Exclude administrators, display users according to site/project client
    if (!users || users.length === 0) {
      return picsList.filter(p => p !== "Admin" && p !== "admin");
    }
    
    // Find client RS name of the project
    const targetSite = client || currentUser?.siteTugas || "";
    
    // Filter active users who are not Administrator
    const activeNonAdminUsers = users.filter(u => u.statusAktif !== false && u.role !== "Administrator" && u.username !== "admin");
    
    if (targetSite) {
      const siteSpecificUsers = activeNonAdminUsers.filter(u => u.siteTugas && u.siteTugas.toLowerCase() === targetSite.toLowerCase());
      if (siteSpecificUsers.length > 0) {
        return siteSpecificUsers.map(u => u.nickname || u.username);
      }
    }
    
    // If no target site is set, or no users are assigned to that site, fallback to all active non-admin users
    return activeNonAdminUsers.map(u => u.nickname || u.username);
  };

  // Synchronize pic choice dynamically when client is changed during creation
  useEffect(() => {
    if (!editingProj && isFormOpen) {
      const dynamicPics = getDynamicPicsList();
      if (dynamicPics.length > 0 && !dynamicPics.includes(pic)) {
        setPic(dynamicPics[0]);
      }
    }
  }, [client, isFormOpen, editingProj, users]);

  // Diagnostic states
  const [activeLogProjId, setActiveLogProjId] = useState<string | null>(null);
  const [logType, setLogType] = useState<'kendala' | 'solusi' | 'fokus'>("kendala");
  const [logText, setLogText] = useState("");

  const filtered = projects.filter((p) => {
    const sQuery = `${p.kode} ${p.nama} ${p.client}`.toLowerCase();
    const matchesSearch = sQuery.includes(search.toLowerCase());
    const matchesStatus = filterStatus === "" || p.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  function openCreate() {
    // Generate code
    const numerals = projects.map(p => {
      const match = p.kode.match(/P(\d+)/);
      return match ? parseInt(match[1]) : 0;
    });
    const nextNum = (numerals.length ? Math.max(...numerals) : 0) + 1;
    const computedCode = `P${String(nextNum).padStart(2, "0")}`;

    setEditingProj(null);
    setKode(computedCode);
    setNama("");
    setModul(modulsList[0] || "");
    setPic(picsList[0] || "");
    setClient("");
    setAsal(asalsList[0] || "");
    setStatus("On Track");
    setStartDate(new Date().toISOString().slice(0, 10));
    setEndDate("");
    setCompletionDate("");
    setPrasyarat("");
    setNotes("");
    setUrl("");
    setIsFormOpen(true);
  }

  function openEdit(p: Project) {
    setEditingProj(p);
    setKode(p.kode);
    setNama(p.nama);
    setModul(p.modul);
    setPic(p.pic);
    setClient(p.client);
    setAsal(p.asal);
    setStatus(p.status);
    setStartDate(p.startDate);
    setEndDate(p.endDate);
    setCompletionDate(p.completionDate);
    setPrasyarat(p.prasyarat);
    setNotes(p.notes);
    setUrl(p.url);
    setIsFormOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nama.trim()) return;

    const body: Partial<Project> = {
      kode,
      nama,
      modul,
      pic,
      client,
      asal,
      status,
      startDate,
      endDate,
      completionDate,
      prasyarat,
      notes,
      url
    };

    if (editingProj) {
      await onUpdateProject(editingProj.id, body);
    } else {
      await onAddProject(body);
    }
    setIsFormOpen(false);
  }

  async function handleAddLog(projId: string) {
    if (!logText.trim()) return;
    const dateStr = new Date().toISOString().slice(0, 10);
    await onAddDiagnosticLog(projId, logType, logText, dateStr);
    setLogText("");
    setActiveLogProjId(null);
  }

  // Early return for Create / Edit Form View instead of Modal Pop-up
  if (isFormOpen) {
    return (
      <div className="space-y-6 fade-in font-sans pb-24 max-w-4xl mx-auto">
        
        {/* Breadcrumbs Navigation */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-xs space-y-4">
          <nav className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500 mb-2">
            <span 
              className="text-xs font-bold hover:underline cursor-pointer" 
              onClick={() => setIsFormOpen(false)}
            >
              Project Master
            </span>
            <span className="text-xs font-bold">&rarr;</span>
            <span className="text-xs font-black text-blue-600 dark:text-blue-400">
              {editingProj ? "Ubah Rincian Project" : "Setup Project Baru"}
            </span>
          </nav>

          <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4">
            <div>
              <div className="flex items-center gap-1.5 text-[10px] text-blue-605 dark:text-blue-400 font-black uppercase tracking-widest mb-1 font-mono">
                <span>Project Master</span>
                <span>/</span>
                <span className="text-slate-550 dark:text-slate-400">{editingProj ? "Edit Mode" : "Creation Mode"}</span>
              </div>
              <h2 className="text-2xl font-black text-slate-800 dark:text-white leading-tight">
                {editingProj ? "Ubah Rincian Project" : "Tambah Project Baru"}
              </h2>
              <p className="text-xs text-slate-450 dark:text-slate-500 font-medium mt-1">
                Lengkapi rute integrasi, hak rincian kontrak, nama dinas client serta PIC terkait di database.
              </p>
            </div>
            
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="px-5 py-2.5 border border-slate-250 dark:border-slate-800 text-slate-600 dark:text-slate-400 text-xs font-bold rounded-lg hover:bg-slate-50 dark:hover:bg-slate-850/30 transition-all cursor-pointer"
              >
                Batal / Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const btnSubmit = document.getElementById("submit-btn-project-trigger");
                  if (btnSubmit) btnSubmit.click();
                }}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black rounded-lg hover:shadow-lg active:scale-95 transition-all cursor-pointer"
              >
                {editingProj ? "Simpan Perubahan" : "Simpan & Buat"}
              </button>
            </div>
          </div>
        </div>

        {/* Form Body layout */}
        <form onSubmit={handleSubmit} className="space-y-6 text-xs">
          
          {/* Section 1: Basic Info */}
          <div className="bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 p-6 rounded-2xl shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800/60">
              <FolderLock className="w-4.5 h-4.5 text-blue-600 dark:text-blue-400 shrink-0" />
              <h3 className="font-extrabold text-[11px] text-slate-800 dark:text-slate-200 uppercase tracking-widest">Informasi Utama (Basic Info)</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">KODE PROJECT</label>
                <input
                  type="text"
                  disabled
                  value={kode}
                  className="w-full bg-slate-100 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 py-3 px-3 rounded-lg text-blue-600 font-bold cursor-not-allowed font-mono text-xs uppercase"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">NAMA PROJECT *</label>
                <input
                  type="text"
                  required
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  placeholder="Contoh: Portal Satu Pintu"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-lg p-3 text-slate-800 dark:text-slate-101 font-semibold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-550 transition-all placeholder:font-normal placeholder:opacity-50"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">MODUL UTAMA</label>
                <select
                  value={modul}
                  onChange={(e) => setModul(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-250 dark:border-slate-800 rounded-lg p-3 text-slate-800 dark:text-slate-200 font-medium focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer"
                >
                  {modulsList.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">PIC PENYELENGGARA</label>
                <select
                  value={pic}
                  onChange={(e) => setPic(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-250 dark:border-slate-805 rounded-lg p-3 text-slate-800 dark:text-slate-200 font-medium focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer"
                >
                  {getDynamicPicsList().map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Contractual / Client Metadata */}
          <div className="bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 p-6 rounded-2xl shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800/60">
              <User2 className="w-4.5 h-4.5 text-blue-600 dark:text-blue-400 shrink-0" />
              <h3 className="font-extrabold text-[11px] text-slate-800 dark:text-slate-200 uppercase tracking-widest">Administrasi & Client (Dinas/Lembaga)</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">NAMA CLIENT/DINAS</label>
                <input
                  type="text"
                  value={client}
                  onChange={(e) => setClient(e.target.value)}
                  placeholder="Contoh: Diskominfo / Rumah Sakit"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-lg p-3 text-slate-800 dark:text-slate-101 font-semibold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-550 transition-all placeholder:font-normal placeholder:opacity-50"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">SISTEM ASAL KONTRAK / SUMBER</label>
                <select
                  value={asal}
                  onChange={(e) => setAsal(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-250 dark:border-slate-800 rounded-lg p-3 text-slate-800 dark:text-slate-200 font-medium focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer"
                >
                  {asalsList.map(a => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">STATUS MILESTONE PROJECT</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-250 dark:border-slate-800 rounded-lg p-3 text-slate-805 dark:text-slate-200 font-bold focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer"
                >
                  {pstatusesList.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Section 3: Timeline & Milestones */}
          <div className="bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 p-6 rounded-2xl shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800/60">
              <Calendar className="w-4.5 h-4.5 text-blue-600 dark:text-blue-400 shrink-0" />
              <h3 className="font-extrabold text-[11px] text-slate-800 dark:text-slate-200 uppercase tracking-widest">Timeline & Realisasi Selesai</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">TANGGAL MULAI (START DATE)</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-255 dark:border-slate-800 p-3 rounded-lg text-slate-800 dark:text-slate-100 font-semibold focus:ring-2 focus:ring-blue-500/20 font-mono text-xs"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">BATAS AKHIR (TARGET DATE)</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-255 dark:border-slate-800 p-3 rounded-lg text-slate-800 dark:text-slate-100 font-semibold focus:ring-2 focus:ring-blue-500/20 font-mono text-xs"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">SELESAI RIIL (COMPLETION RIIL)</label>
                <input
                  type="date"
                  value={completionDate}
                  onChange={(e) => setCompletionDate(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-255 dark:border-slate-800 p-3 rounded-lg text-slate-800 dark:text-slate-100 font-semibold focus:ring-2 focus:ring-blue-500/20 font-mono text-xs"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Details & Extras */}
          <div className="bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 p-6 rounded-2xl shadow-xs space-y-5">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800/60">
              <ClipboardList className="w-4.5 h-4.5 text-blue-600 dark:text-blue-400 shrink-0" />
              <h3 className="font-extrabold text-[11px] text-slate-800 dark:text-slate-200 uppercase tracking-widest">Deskripsi Prasyarat & Catatan</h3>
            </div>

            <div className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-sans">PRASYARAT BERKAS EKSTERNAL</label>
                <textarea
                  rows={3}
                  value={prasyarat}
                  onChange={(e) => setPrasyarat(e.target.value)}
                  placeholder="Konfigurasi database, kelengkapan form kriteria, dll..."
                  className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-lg p-3 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500/20 transition-all leading-relaxed text-xs"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-sans">CATATAN & EVALUASI MANDIRI</label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Keterangan regulasi..."
                  className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-lg p-3 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500/20 transition-all leading-relaxed text-xs"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">DRIVE URL / FIGMA ASSET LAYOUT</label>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 p-3 rounded-lg text-slate-800 dark:text-slate-100 font-mono text-[11px] focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>
          </div>

          {/* Footer buttons */}
          <div className="flex justify-between items-center pt-4 border-t border-slate-200 dark:border-slate-800">
            {editingProj && currentUser?.role === "Administrator" ? (
              <button
                type="button"
                onClick={() => {
                  if (confirm(`Hapus project "${nama}" secara permanen? Seluruh tugas terkait akan terhapus!`)) {
                    onDeleteProject(editingProj.id);
                    setIsFormOpen(false);
                  }
                }}
                className="px-4 py-2.5 bg-red-50 hover:bg-red-100 hover:text-red-700 text-red-650 text-xs font-extrabold rounded-lg border border-red-200 transition-all font-sans"
              >
                Hapus Project
              </button>
            ) : <span />}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="px-5 py-2.5 border border-slate-250 text-slate-555 dark:text-slate-400 text-xs font-bold rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer font-sans"
              >
                Batal / Cancel
              </button>
              <button
                id="submit-btn-project-trigger"
                type="submit"
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black rounded-lg hover:shadow-lg active:scale-95 transition-all cursor-pointer font-sans"
              >
                {editingProj ? "Ubah & Simpan" : "Setup Project"}
              </button>
            </div>
          </div>

        </form>

        {/* Mobile Fixed bottom footer */}
        <div className="sm:hidden fixed bottom-16 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 p-4 flex gap-3 shadow-[0_-4px_12px_rgba(0,0,0,0.08)] z-40">
          <button
            type="button"
            onClick={() => setIsFormOpen(false)}
            className="flex-1 py-3 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-305 font-bold rounded-lg text-xs"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={() => {
              const btnSubmit = document.getElementById("submit-btn-project-trigger");
              if (btnSubmit) btnSubmit.click();
            }}
            className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-lg text-xs shadow-md"
          >
            {editingProj ? "Simpan" : "Setup Project"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 fade-in font-sans pb-10">
      
      {/* Upper info banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <FolderLock className="w-5.5 h-5.5 text-blue-600" /> Project Master
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">
            Gunakan portal ini untuk meregistrasi project baru, memantau milestones, target UAT, serta mencatat log kendala & solusi.
          </p>
        </div>
        
        {currentUser?.role !== "Client" && (
          <button
            onClick={openCreate}
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg flex items-center gap-1 shadow-sm transition-all animate-pulse"
          >
            <Plus className="w-4 h-4" /> Tambah Project Baru
          </button>
        )}
      </div>

      {/* Search and Quick Filters bar */}
      <div className="flex flex-wrap items-center gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-xs">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari project, kode, client..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-lg py-1.5 pl-9 pr-4 text-xs font-sans text-slate-800 dark:text-slate-101 placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
          />
        </div>
        
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 text-xs py-1.5 px-3 rounded-lg text-slate-700 dark:text-slate-300 focus:outline-none"
        >
          <option value="">Semua Status Project</option>
          {pstatusesList.map(s => <option key={s} value={s}>{s}</option>)}
        </select>

        {currentUser?.role !== "Client" && (
          <button
            onClick={openCreate}
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg flex items-center gap-1 shadow-sm font-sans transition-all ml-auto"
          >
            <Plus className="w-4 h-4" /> Tambah Project
          </button>
        )}
      </div>

      {/* Projects Timeline Stack */}
      <div className="space-y-6">
        {filtered.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
            <FolderLock className="w-10 h-10 text-slate-400 mx-auto mb-2 opacity-40" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Belum ada project master</p>
            <p className="text-xs text-slate-400">Atur kriteria pencarian atau klik "+ Tambah Project" di pojok kanan.</p>
          </div>
        ) : (
          filtered.map((p) => {
            const projTasks = tasks.filter((t) => t.project === p.kode);
            const doneTasks = projTasks.filter((t) => t.status === "Done");
            const overallPct = projTasks.length === 0 ? 0 : Math.round((doneTasks.length / projTasks.length) * 100);

            // Group logs for this project
            const projLogs = logs.filter((l) => l.projId === p.id);
            const kendala = projLogs.filter((l) => l.type === "kendala");
            const solusi = projLogs.filter((l) => l.type === "solusi");
            const fokus = projLogs.filter((l) => l.type === "fokus");

            return (
              <div 
                key={p.id} 
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-shadow"
              >
                
                {/* Banner Header */}
                <div className="bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 p-5 flex flex-wrap justify-between items-start gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 text-[10px] font-black font-mono px-2 py-0.5 rounded-full border border-blue-100 dark:border-blue-900/30">
                        {p.kode}
                      </span>
                      <span className="bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        {p.status || "Draft"}
                      </span>
                    </div>
                    <h4 className="text-lg font-black text-slate-800 dark:text-slate-100 mt-2 tracking-tight leading-tight">
                      {p.nama}
                    </h4>
                    
                    <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-slate-500 dark:text-slate-400 mt-2.5 font-medium">
                      <span className="flex items-center gap-1">
                        <User2 className="w-4 h-4 text-slate-400" /> PIC: <strong>{p.pic || "—"}</strong>
                      </span>
                      <span className="flex items-center gap-1">
                        <Target className="w-4 h-4 text-slate-400" /> Client: <strong>{p.client || "—"}</strong>
                      </span>
                      <span className="flex items-center gap-1">
                        <BookMarked className="w-4 h-4 text-slate-400" /> Asal: <strong>{p.asal || "—"}</strong>
                      </span>
                      {p.createdBy && (
                        <span className="flex items-center gap-1 text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded-md border border-indigo-150/10">
                          🧑‍💻 Penginput: <strong className="font-extrabold">{p.createdBy}</strong>
                        </span>
                      )}
                    </div>
                  </div>

                  {currentUser?.role !== "Client" && (() => {
                    const canModify = !p.createdBy || p.createdBy === currentUser?.username || currentUser?.role === "Administrator";
                    return (
                      <div className="flex items-center gap-1 shrink-0">
                        <button 
                          onClick={() => openEdit(p)}
                          disabled={!canModify}
                          className={`p-1.5 rounded-lg transition-all ${
                            canModify 
                              ? "text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800" 
                              : "text-slate-300 dark:text-slate-700 cursor-not-allowed opacity-40 bg-slate-100/50 dark:bg-slate-800/30"
                          }`}
                          title={canModify ? "Edit Project" : `Hanya penginput (${p.createdBy}) yang boleh mengedit`}
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        {currentUser?.role === "Administrator" && (
                          <button 
                            onClick={() => {
                              if (confirm(`Hapus project "${p.nama}" secara permanen? Seluruh tugas terkait akan terhapus!`)) {
                                onDeleteProject(p.id);
                              }
                            }}
                            disabled={!canModify}
                            className={`p-1.5 rounded-lg transition-all ${
                              canModify 
                                ? "text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-800" 
                                : "text-slate-300 dark:text-slate-700 cursor-not-allowed opacity-40 bg-slate-100/50 dark:bg-slate-800/30"
                            }`}
                            title={canModify ? "Hapus Project" : `Hanya penginput (${p.createdBy}) yang boleh menghapus`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    );
                  })()}
                </div>

                {/* Body Content */}
                <div className="p-6 space-y-5">
                  
                  {/* Timeline Cards Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                    <div className="bg-slate-50 dark:bg-slate-950/40 p-3 rounded-xl border border-slate-150/10">
                      <p className="text-[9px] text-slate-400 uppercase font-black tracking-wider">Modul</p>
                      <p className="font-bold text-slate-800 dark:text-slate-200 mt-1 truncate">{p.modul || "—"}</p>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-950/40 p-3 rounded-xl border border-slate-150/10">
                      <p className="text-[9px] text-slate-400 uppercase font-black tracking-wider">Start Date</p>
                      <p className="font-bold font-mono text-slate-800 dark:text-slate-200 mt-1">
                        {p.startDate ? new Date(p.startDate).toLocaleDateString("id-ID") : "—"}
                      </p>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-950/40 p-3 rounded-xl border border-slate-150/10">
                      <p className="text-[9px] text-slate-400 uppercase font-black tracking-wider">Target Date</p>
                      <p className="font-bold font-mono text-slate-800 dark:text-slate-200 mt-1">
                        {p.endDate ? new Date(p.endDate).toLocaleDateString("id-ID") : "—"}
                      </p>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-950/40 p-3 rounded-xl border border-slate-150/10">
                      <p className="text-[9px] text-slate-400 uppercase font-black tracking-wider">Completion Riil</p>
                      <p className="font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1">
                        {p.completionDate ? new Date(p.completionDate).toLocaleDateString("id-ID") : "Belum Selesai"}
                      </p>
                    </div>
                  </div>

                  {/* Task Progress Bar */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs font-semibold text-slate-700 dark:text-slate-300">
                      <span>Proses Penyelesaian Tugas</span>
                      <span className="text-blue-600 dark:text-blue-400 font-mono font-bold">
                        {overallPct}% ({doneTasks.length}/{projTasks.length} Done)
                      </span>
                    </div>
                    <div className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-600 rounded-full transition-all" style={{ width: `${overallPct}%` }} />
                    </div>
                  </div>

                  {/* Prasyarat Banner */}
                  {p.prasyarat && (
                    <div className="bg-amber-50/60 dark:bg-amber-950/10 border border-amber-200/50 dark:border-amber-900/30 p-3.5 rounded-xl text-xs space-y-1">
                      <p className="font-bold text-amber-700 dark:text-amber-500 uppercase text-[9px] tracking-wider flex items-center gap-1">
                        <FileCheck2 className="w-3.5 h-3.5" /> Prasyarat Project
                      </p>
                      <p className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                        {p.prasyarat}
                      </p>
                    </div>
                  )}

                  {p.url && (
                    <div>
                      <a 
                        href={p.url} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="inline-flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 font-bold hover:underline bg-blue-55/10 dark:bg-blue-950/20 px-3 py-1.5 rounded-lg border border-blue-500/20"
                      >
                        <ExternalLink className="w-3.5 h-3.5" /> Buka Folder Project Master ↗
                      </a>
                    </div>
                  )}

                  {/* Category Progress Breakdown mapping */}
                  <div className="border-t border-slate-100 dark:border-slate-800/80 pt-4">
                    <h5 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-1">
                      <ClipboardList className="w-3.5 h-3.5" /> Kemajuan Berdasarkan Kategori
                    </h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      {catProgsList.map((catName) => {
                        const allCatTasks = projTasks.filter(t => t.categoryProgress === catName);
                        if (allCatTasks.length === 0) return null;
                        const catDone = allCatTasks.filter(t => t.status === "Done").length;
                        const catPct = Math.round((catDone / allCatTasks.length) * 100);

                        return (
                          <div key={catName} className="bg-slate-50 dark:bg-slate-950/30 border border-slate-150/10 dark:border-slate-800/40 p-3 rounded-xl">
                            <div className="flex justify-between items-center text-xs mb-1">
                              <span className="font-bold text-slate-700 dark:text-slate-300">{catName}</span>
                              <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                                {catDone}/{allCatTasks.length} &bull; {catPct}%
                              </span>
                            </div>
                            <div className="h-1 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden mb-2">
                              <div className="h-full bg-blue-600" style={{ width: `${catPct}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* DIagnostic Log Section: Kendala / Solusi / Fokus */}
                  <div className="border-t border-slate-100 dark:border-slate-800 pt-4 grid grid-cols-1 md:grid-cols-3 gap-6">
                    
                    {/* Columns representing Kendala */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-red-650 dark:text-red-400 uppercase tracking-wider flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5" /> Kendala / Isu ({kendala.length})
                        </span>
                        <button 
                          onClick={() => { setActiveLogProjId(p.id); setLogType("kendala"); }}
                          className="text-[10px] text-blue-600 hover:underline font-bold"
                        >
                          + Tambah
                        </button>
                      </div>
                      <div className="space-y-1.5">
                        {kendala.length === 0 ? (
                          <p className="text-[11px] text-slate-400 italic">Belum ada kendala dicatat.</p>
                        ) : (
                          kendala.map((l) => (
                            <div key={l.id} className="bg-red-50/50 dark:bg-red-950/10 border border-red-100 dark:border-red-900/30 p-2.5 rounded-xl flex justify-between gap-2">
                              <div>
                                <span className="text-[9px] font-mono text-slate-400 font-bold">{new Date(l.date).toLocaleDateString("id-ID")}</span>
                                <p className="text-xs text-slate-700 dark:text-slate-300 mt-0.5 whitespace-pre-wrap leading-relaxed">{l.text}</p>
                              </div>
                              <button onClick={() => onDeleteDiagnosticLog(l.id)} className="text-slate-400 hover:text-red-500 h-fit">
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Columns representing Solusi */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-emerald-650 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                          <FileCheck2 className="w-3.5 h-3.5" /> Solusi Aktif ({solusi.length})
                        </span>
                        <button 
                          onClick={() => { setActiveLogProjId(p.id); setLogType("solusi"); }}
                          className="text-[10px] text-blue-600 hover:underline font-bold"
                        >
                          + Tambah
                        </button>
                      </div>
                      <div className="space-y-1.5">
                        {solusi.length === 0 ? (
                          <p className="text-[11px] text-slate-400 italic">Belum ada solusi dicatat.</p>
                        ) : (
                          solusi.map((l) => (
                            <div key={l.id} className="bg-emerald-50/50 dark:bg-emerald-950/10 border border-emerald-100/50 dark:border-emerald-900/30 p-2.5 rounded-xl flex justify-between gap-2">
                              <div>
                                <span className="text-[9px] font-mono text-slate-400 font-bold">{new Date(l.date).toLocaleDateString("id-ID")}</span>
                                <p className="text-xs text-slate-700 dark:text-slate-300 mt-0.5 whitespace-pre-wrap leading-relaxed">{l.text}</p>
                              </div>
                              <button onClick={() => onDeleteDiagnosticLog(l.id)} className="text-slate-400 hover:text-red-500 h-fit">
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Columns representing Fokus */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-blue-650 dark:text-blue-400 uppercase tracking-wider flex items-center gap-1">
                          <Target className="w-3.5 h-3.5" /> Fokus Lanjutan ({fokus.length})
                        </span>
                        <button 
                          onClick={() => { setActiveLogProjId(p.id); setLogType("fokus"); }}
                          className="text-[10px] text-blue-600 hover:underline font-bold"
                        >
                          + Tambah
                        </button>
                      </div>
                      <div className="space-y-1.5">
                        {fokus.length === 0 ? (
                          <p className="text-[11px] text-slate-400 italic">Belum ada fokus lanjutan dicatat.</p>
                        ) : (
                          fokus.map((l) => (
                            <div key={l.id} className="bg-blue-50/50 dark:bg-blue-950/10 border border-blue-100 dark:border-blue-900/30 p-2.5 rounded-xl flex justify-between gap-2">
                              <div>
                                <span className="text-[9px] font-mono text-slate-400 font-bold">{new Date(l.date).toLocaleDateString("id-ID")}</span>
                                <p className="text-xs text-slate-700 dark:text-slate-300 mt-0.5 whitespace-pre-wrap leading-relaxed">{l.text}</p>
                              </div>
                              <button onClick={() => onDeleteDiagnosticLog(l.id)} className="text-slate-400 hover:text-red-500 h-fit">
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                  </div>

                </div>
              </div>
            );
          })
        )}
      </div>

      {/* MODAL: ADD LOG ENTRY */}
      <AnimatePresence>
        {activeLogProjId && (
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-800 rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4"
            >
              <div>
                <h3 className="font-bold text-base text-slate-800 dark:text-slate-200">
                  Tambah Catatan Diagnostik
                </h3>
                <p className="text-xs text-slate-400 font-medium">Bantu laporkan kendala atau koordinasikan solusi.</p>
              </div>

              <div className="space-y-3 shrink-0">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Kategori</label>
                  <select
                    value={logType}
                    onChange={(e) => setLogType(e.target.value as any)}
                    className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg py-1.5 px-3 text-xs text-slate-700 dark:text-slate-300"
                  >
                    <option value="kendala">⚠️ Kendala Teknis</option>
                    <option value="solusi">💡 Solusi Terpasang</option>
                    <option value="fokus">🎯 Fokus Lanjutan</option>
                  </select>
                </div>
                
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Uraian Detail *</label>
                  <textarea
                    rows={4}
                    value={logText}
                    onChange={(e) => setLogText(e.target.value)}
                    placeholder="Tulis kendala fungsional atau log pengait database..."
                    className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg py-2 px-3 text-xs text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setActiveLogProjId(null)}
                  className="px-4 py-1.5 border border-slate-250 text-slate-500 dark:text-slate-400 text-xs font-semibold rounded-lg hover:bg-slate-100 transition-all font-sans"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => handleAddLog(activeLogProjId)}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg hover:shadow-lg transition-all font-sans"
                >
                  Simpan Catatan
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
