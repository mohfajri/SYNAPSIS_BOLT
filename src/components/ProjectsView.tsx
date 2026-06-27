import React, { useState, useEffect } from "react";
import { Project, Task, LogEntry, User, Client, AppModule, SiteModuleImplementation, CommLog, MeetingLog, Documentation } from "../types";
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
  ClipboardList,
  Layers,
  MessageSquare,
  Clock,
  HeartPulse,
  Activity,
  FileText,
  PlusCircle,
  Link
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface ProjectsViewProps {
  projects: Project[];
  tasks: Task[];
  logs: LogEntry[];
  currentUser: User | null;
  picsList: string[];
  users?: User[];
  clients?: Client[];
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
  siteImplementations?: SiteModuleImplementation[];
  appModules?: AppModule[];
  commLogs?: CommLog[];
  meetingLogs?: MeetingLog[];
  docs?: Documentation[];
  onAddDoc?: (data: Partial<Documentation>) => Promise<void>;
  onDeleteDoc?: (id: string) => Promise<void>;
  subRouteParam?: string | null;
  onSubRouteUpdate?: (param: string | null) => void;
}

export default function ProjectsView({
  projects,
  tasks,
  logs,
  currentUser,
  picsList,
  users = [],
  clients = [],
  modulsList,
  asalsList,
  pstatusesList,
  catProgsList,
  picThemeColors,
  onAddProject,
  onUpdateProject,
  onDeleteProject,
  onAddDiagnosticLog,
  onDeleteDiagnosticLog,
  siteImplementations = [],
  appModules = [],
  commLogs = [],
  meetingLogs = [],
  docs = [],
  onAddDoc,
  onDeleteDoc,
  subRouteParam,
  onSubRouteUpdate
}: ProjectsViewProps) {
  
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterClient, setFilterClient] = useState("");
  const [filterModul, setFilterModul] = useState("");
  
  // Modal & form states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProj, setEditingProj] = useState<Project | null>(null);

  // Sync sub-routing param with editingProj
  useEffect(() => {
    if (subRouteParam) {
      const found = projects.find(p => p.id === subRouteParam);
      if (found) {
        if (!editingProj || editingProj.id !== subRouteParam) {
          setEditingProj(found);
          setIsFormOpen(true);
        }
      }
    } else {
      if (editingProj) {
        setEditingProj(null);
        setIsFormOpen(false);
      }
    }
  }, [subRouteParam, projects]);

  useEffect(() => {
    const targetParam = (isFormOpen && editingProj) ? editingProj.id : null;
    if (onSubRouteUpdate && subRouteParam !== targetParam) {
      onSubRouteUpdate(targetParam);
    }
  }, [isFormOpen, editingProj?.id]);
  const [dateError, setDateError] = useState("");
  
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
  const [fiturModul, setFiturModul] = useState<string[]>([]);
  const [linkedCommLogIds, setLinkedCommLogIds] = useState<string[]>([]);
  const [linkedMeetingLogIds, setLinkedMeetingLogIds] = useState<string[]>([]);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const isKantorPusat = currentUser?.role === "Administrator" || currentUser?.siteTugas?.toLowerCase().trim() === "kantor pusat";

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

  // Derived filter helper lists
  const clientOptions = React.useMemo(() => {
    const list = clients ? clients.map(cl => cl.namaRS) : [];
    if (client && !list.includes(client)) {
      list.push(client);
    }
    if (editingProj?.client && !list.includes(editingProj.client)) {
      list.push(editingProj.client);
    }
    return Array.from(new Set(list)).filter(Boolean).sort();
  }, [clients, client, editingProj]);

  const siteOptions = React.useMemo(() => {
    const fromClients = clients.map(c => c.namaRS);
    const fromProjects = projects.map(p => p.client);
    const combined = Array.from(new Set([...fromClients, ...fromProjects])).filter(Boolean);
    return combined.sort();
  }, [clients, projects]);

  const modulOptions = React.useMemo(() => {
    const fromSiteImpls = (siteImplementations || [])
      .filter(impl => !impl.subModuleId)
      .map(impl => impl.appModuleName);
    const combined = Array.from(new Set([...fromSiteImpls, ...projects.map(p => p.modul)])).filter(Boolean);
    return combined.sort();
  }, [siteImplementations, projects]);

  // Modul Utama selection takes options from "Implementasi Modul per Site"
  const availableModulesForForm = React.useMemo(() => {
    const clientName = client.trim();

    if (!clientName) {
      return [];
    }

    const filteredImpls = (siteImplementations || []).filter(
      impl => !impl.subModuleId && impl.clientRS && impl.clientRS.trim().toLowerCase() === clientName.toLowerCase()
    );
    const uniqueForClient = Array.from(new Set(filteredImpls.map(impl => impl.appModuleName))).filter(Boolean);
    const result = uniqueForClient.sort();

    // Include editingProj's current modul to prevent blank dropdown during edit if matching client
    if (editingProj?.modul && editingProj.client?.trim().toLowerCase() === clientName.toLowerCase()) {
      if (!result.includes(editingProj.modul)) {
        result.push(editingProj.modul);
      }
    }
    return result;
  }, [siteImplementations, client, editingProj]);

  // Features available for selected Modul Utama (from appModules)
  const availableFeatures = React.useMemo(() => {
    if (!appModules || appModules.length === 0) return [];
    const appMod = appModules.find(m => m.name === modul);
    return appMod?.subModules || [];
  }, [appModules, modul]);

  // Sync selected modul selection with available options (Only if non-empty and not in list)
  useEffect(() => {
    if (isFormOpen) {
      if (availableModulesForForm.length === 0) {
        setModul("");
      } else if (modul && !availableModulesForForm.includes(modul)) {
        if (editingProj && editingProj.modul && availableModulesForForm.includes(editingProj.modul)) {
          setModul(editingProj.modul);
        } else {
          setModul("");
        }
      }
    }
  }, [availableModulesForForm, isFormOpen, modul, editingProj]);

  // Sync features list when selected module or form modal shifts context
  useEffect(() => {
    if (isFormOpen) {
      if (!editingProj) {
        setFiturModul(availableFeatures.map(f => f.name));
      } else {
        if (editingProj.modul === modul && editingProj.fiturModul) {
          setFiturModul(editingProj.fiturModul);
        } else {
          setFiturModul(availableFeatures.map(f => f.name));
        }
      }
    }
  }, [availableFeatures, isFormOpen, editingProj, modul]);

  // Diagnostic states
  const [activeLogProjId, setActiveLogProjId] = useState<string | null>(null);
  const [logType, setLogType] = useState<'kendala' | 'solusi' | 'fokus'>("kendala");
  const [logText, setLogText] = useState("");

  // Document states (Point 2.C)
  const [activeDocProjId, setActiveDocProjId] = useState<string | null>(null);
  const [docCategory, setDocCategory] = useState<'API Specs' | 'User Manual' | 'Desain' | 'Kontrak' | 'Lainnya'>("Lainnya");
  const [docTitle, setDocTitle] = useState("");
  const [docUrl, setDocUrl] = useState("");
  const [docDesc, setDocDesc] = useState("");

  async function handleAddDocLocal(projCode: string) {
    if (!docTitle.trim() || !docUrl.trim()) {
      alert("Judul dan URL Berkas harus diisi!");
      return;
    }
    if (onAddDoc) {
      await onAddDoc({
        project: projCode,
        category: docCategory,
        title: docTitle,
        url: docUrl,
        desc: docDesc,
        date: new Date().toISOString().split('T')[0],
        createdBy: currentUser?.username || "Sys"
      });
      setActiveDocProjId(null);
      setDocCategory("Lainnya");
      setDocTitle("");
      setDocUrl("");
      setDocDesc("");
    }
  }

  // States for connecting collaboration logs to project (after creation)
  const [collabModalProjId, setCollabModalProjId] = useState<string | null>(null);
  const [collabModalType, setCollabModalType] = useState<'comm' | 'meeting' | null>(null);
  const [tempCheckedCollabIds, setTempCheckedCollabIds] = useState<string[]>([]);
  const [collabSearch, setCollabSearch] = useState("");

  const filtered = projects.filter((p) => {
    const sQuery = `${p.kode} ${p.nama} ${p.client}`.toLowerCase();
    const matchesSearch = sQuery.includes(search.toLowerCase());
    const matchesStatus = filterStatus === "" || p.status === filterStatus;
    const matchesClient = filterClient === "" || (p.client && p.client.toLowerCase() === filterClient.toLowerCase());
    const matchesModul = filterModul === "" || (p.modul && p.modul.toLowerCase() === filterModul.toLowerCase());
    return matchesSearch && matchesStatus && matchesClient && matchesModul;
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
    setModul("");
    setPic(picsList[0] || "");
    setClient(currentUser?.siteTugas || "");
    setAsal(asalsList[0] || "");
    setStatus("On Track");
    setStartDate(new Date().toISOString().slice(0, 10));
    setEndDate("");
    setCompletionDate("");
    setPrasyarat("");
    setNotes("");
    setUrl("");
    setFiturModul([]);
    setLinkedCommLogIds([]);
    setLinkedMeetingLogIds([]);
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
    setFiturModul(p.fiturModul || []);
    setLinkedCommLogIds(p.linkedCommLogIds || []);
    setLinkedMeetingLogIds(p.linkedMeetingLogIds || []);
    setIsFormOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nama.trim()) return;

    if (!client.trim()) {
      alert("⚠️ Error: Akun Anda tidak memiliki data rujukan 'Site Tugas' (Dinas RS) terdaftar. Silahkan hubungi administrator atau atur 'Site Tugas' Anda terlebih dahulu agar data project dapat otomatis terikat ke site Anda bertugas!");
      return;
    }

    // Modul Utama is now optional, no validation mandatory check is required

    // Validation checks
    if (startDate && endDate && endDate < startDate) {
      alert("⚠️ Error: Tanggal Batas Akhir tidak boleh mendahului Tanggal Mulai proyek!");
      setDateError("Tanggal Batas Akhir tidak boleh mendahului Tanggal Mulai.");
      return;
    }

    if (startDate && completionDate && completionDate < startDate) {
      alert("⚠️ Error: Tanggal Selesai Riil tidak boleh mendahului Tanggal Mulai proyek!");
      setDateError("Tanggal Selesai Riil tidak boleh mendahului Tanggal Mulai.");
      return;
    }

    const body: Partial<Project> = {
      kode,
      nama,
      modul,
      fiturModul,
      pic,
      client,
      asal,
      status,
      startDate,
      endDate,
      completionDate,
      prasyarat,
      notes,
      url,
      linkedCommLogIds,
      linkedMeetingLogIds
    };

    try {
      if (editingProj) {
        await onUpdateProject(editingProj.id, body);
      } else {
        await onAddProject(body);
      }
      setIsFormOpen(false);
      setDateError("");
    } catch (err: any) {
      alert("Gagal menyimpan proyek: " + err.message);
    }
  }

  async function handleAddLog(projId: string) {
    if (!logText.trim()) return;
    const dateStr = new Date().toISOString().slice(0, 10);
    await onAddDiagnosticLog(projId, logType, logText, dateStr);
    setLogText("");
    setActiveLogProjId(null);
  }

  const handleSaveProjectCollab = async () => {
    if (!collabModalProjId || !collabModalType) return;
    try {
      const field = collabModalType === 'comm' ? 'linkedCommLogIds' : 'linkedMeetingLogIds';
      await onUpdateProject(collabModalProjId, {
        [field]: tempCheckedCollabIds
      });
      setCollabModalProjId(null);
      setCollabModalType(null);
    } catch (err: any) {
      alert("Gagal memperbarui koneksi arsip kolaborasi: " + err.message);
    }
  };

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
                  className="w-full bg-slate-101 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 py-3 px-3 rounded-lg text-blue-600 font-bold cursor-not-allowed font-mono text-xs uppercase"
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

              {isKantorPusat && (
                <div className="flex flex-col gap-1.5 justify-center bg-slate-50 dark:bg-slate-955/40 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">NAMA CLIENT / DINAS RS</label>
                  <span className="text-sm font-extrabold text-blue-600 dark:text-blue-400 mt-1">
                    {client || currentUser?.siteTugas || "— Belum diatur —"}
                  </span>
                  <span className="text-[9px] text-slate-400 dark:text-slate-500 font-medium">
                    {editingProj ? "Terkunci (Mode Edit)" : "Otomatis diikat ke Site Tugas akun Anda"}
                  </span>
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  MODUL UTAMA (OPSIONAL)
                  {isKantorPusat && client ? ` (Terimplementasi di ${client})` : ""}
                </label>
                <select
                  value={modul}
                  onChange={(e) => setModul(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-250 dark:border-slate-800 rounded-lg p-3 text-slate-800 dark:text-slate-200 font-medium focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer"
                >
                  {!client.trim() ? (
                    <option value="">-- Silahkan Pilih Client Terlebih Dahulu --</option>
                  ) : availableModulesForForm.length > 0 ? (
                    <>
                      <option value="">-- Pilih Modul Utama --</option>
                      {availableModulesForForm.map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </>
                  ) : (
                    <option value="">-- Belum ada modul terimplementasi di site ini --</option>
                  )}
                </select>
                {client.trim() && availableModulesForForm.length === 0 && (
                  <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold leading-relaxed bg-amber-500/10 p-2.5 rounded-lg border border-amber-500/20 mt-1 block">
                    ⚠️ Site <strong>"{client}"</strong> belum mendaftarkan Modul Utama di menu <strong>"Implementasi Modul per Site"</strong>. Silahkan daftarkan modul terlebih dahulu di menu tersebut agar dapat dipilih di sini.
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-1.5 col-span-1 md:col-span-2">
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

              {/* Fitur Modul (Koneksi Fitur) - Multi Select Checkbox */}
              <div className="md:col-span-2 flex flex-col gap-2 mt-2">
                <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-950 p-2.5 rounded-lg border border-slate-200 dark:border-slate-850">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5 text-blue-600" /> Fitur Modul ({fiturModul.length} terpilih)
                  </span>
                  {availableFeatures.length > 0 && (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setFiturModul(availableFeatures.map(f => f.name))}
                        className="text-[10.5px] font-bold text-blue-600 hover:underline"
                      >
                        Pilih Semua
                      </button>
                      <span className="text-[10px] text-slate-300">|</span>
                      <button
                        type="button"
                        onClick={() => setFiturModul([])}
                        className="text-[10.5px] font-bold text-red-500 hover:underline"
                      >
                        Hapus Semua
                      </button>
                    </div>
                  )}
                </div>

                {availableFeatures.length === 0 ? (
                  <p className="text-[11px] text-slate-400 italic p-3 bg-slate-50/50 dark:bg-slate-950/20 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-center">
                    Tidak ada list rincian fitur / sub-modul yang didaftarkan untuk Modul Utama "{modul || '—'}" pada modul Registrasi SIMRS.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 p-4 bg-slate-50/50 dark:bg-slate-950/10 rounded-xl border border-slate-200 dark:border-slate-800">
                    {availableFeatures.map((feat) => {
                      const isChecked = fiturModul.includes(feat.name);
                      return (
                        <label 
                          key={feat.id} 
                          className={`flex items-start gap-2 p-2 rounded-lg border cursor-pointer transition-all ${
                            isChecked
                              ? "bg-blue-50/30 dark:bg-blue-950/20 border-blue-500/30 text-blue-900 dark:text-blue-300 shadow-xs"
                              : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 text-slate-600 dark:text-slate-400"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFiturModul([...fiturModul, feat.name]);
                              } else {
                                setFiturModul(fiturModul.filter(f => f !== feat.name));
                              }
                            }}
                            className="mt-1 accent-blue-600 w-3.5 h-3.5"
                          />
                          <div className="flex flex-col gap-0.5">
                            <span className="text-xs font-bold leading-tight select-none">{feat.name}</span>
                            {feat.featureDesc && (
                              <span className="text-[10px] text-slate-400 dark:text-slate-500 leading-snug line-clamp-2 select-none">
                                {feat.featureDesc}
                              </span>
                            )}
                          </div>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Section 2: Contractual / Client Metadata */}
          <div className="bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 p-6 rounded-2xl shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800/60">
              <User2 className="w-4.5 h-4.5 text-blue-600 dark:text-blue-400 shrink-0" />
              <h3 className="font-extrabold text-[11px] text-slate-800 dark:text-slate-200 uppercase tracking-widest">Administrasi Proyek & Milestone Status</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-101 flex items-center gap-2">
            <FolderLock className="w-5.5 h-5.5 text-blue-600" /> Project Master
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">
            Gunakan portal ini untuk meregistrasi project baru, memantau milestones, target UAT, serta mencatat log kendala & solusi.
          </p>
        </div>
      </div>

      {/* Search and Quick Filters bar */}
      <div className="flex flex-wrap items-center gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-xs">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder={isKantorPusat ? "Cari project, kode, client..." : "Cari project, kode..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-lg py-1.5 pl-9 pr-4 text-xs font-sans text-slate-800 dark:text-slate-101 placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
          />
        </div>
        
        {/* Dropdown Filter Site */}
        {isKantorPusat && (
          <select
            value={filterClient}
            onChange={(e) => setFilterClient(e.target.value)}
            className="bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 text-xs py-1.5 px-3 rounded-lg text-slate-700 dark:text-slate-300 focus:outline-none"
          >
            <option value="">Semua Site / RS</option>
            {siteOptions.map(site => (
              <option key={site} value={site}>{site}</option>
            ))}
          </select>
        )}

        {/* Dropdown Filter Modul Utama */}
        <select
          value={filterModul}
          onChange={(e) => setFilterModul(e.target.value)}
          className="bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 text-xs py-1.5 px-3 rounded-lg text-slate-700 dark:text-slate-300 focus:outline-none"
        >
          <option value="">Semua Modul Utama</option>
          {modulOptions.map(modName => (
            <option key={modName} value={modName}>{modName}</option>
          ))}
        </select>

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
                      {isKantorPusat && (
                        <span className="flex items-center gap-1">
                          <Target className="w-4 h-4 text-slate-400" /> Client: <strong>{p.client || "—"}</strong>
                        </span>
                      )}
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

                  {/* Point 2.A: Visual Health Monitor & Interactive Timeline Indicator */}
                  {(() => {
                    const today = new Date();
                    today.setHours(0,0,0,0);
                    const startD = p.startDate ? new Date(p.startDate) : null;
                    const endD = p.endDate ? new Date(p.endDate) : null;
                    const complD = p.completionDate ? new Date(p.completionDate) : null;
                    
                    if (startD) startD.setHours(0,0,0,0);
                    if (endD) endD.setHours(0,0,0,0);
                    if (complD) complD.setHours(0,0,0,0);

                    let totalDays = 0;
                    let elapsedDays = 0;
                    let timelinePercent = 0;

                    if (startD && endD) {
                      totalDays = Math.ceil((endD.getTime() - startD.getTime()) / (1000 * 60 * 60 * 24));
                      const endDateOrToday = complD ? complD : (today > endD ? endD : today);
                      
                      if (endDateOrToday >= startD) {
                        elapsedDays = Math.ceil((endDateOrToday.getTime() - startD.getTime()) / (1000 * 60 * 60 * 24));
                      }
                      timelinePercent = totalDays > 0 ? Math.min(100, Math.max(0, Math.round((elapsedDays / totalDays) * 100))) : 0;
                    }

                    // Health Status Evaluation:
                    let healthScoreStr = "On Track";
                    let healthColor = "bg-emerald-50 text-emerald-705 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/40";
                    let healthLevel = "Normal";
                    let healthExplanation = "";

                    if (p.status === "Completed" || overallPct === 100) {
                      healthScoreStr = "Selesai Sempurna";
                      healthColor = "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/40";
                      healthLevel = "Excellent";
                      healthExplanation = "Seluruh tugas tuntas tepat waktu.";
                    } else if (p.status === "Delayed") {
                      healthScoreStr = "Delayed";
                      healthColor = "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-955/20 dark:text-rose-450 dark:border-rose-900/40";
                      healthLevel = "Terhambat / Delay";
                      healthExplanation = "Milestone proyek tertunda. Solusi & fokus mendesak diperlukan!";
                    } else if (p.status === "On Hold") {
                      healthScoreStr = "On Hold";
                      healthColor = "bg-amber-50 text-amber-705 border-amber-200 dark:bg-amber-955/20 dark:text-amber-450 dark:border-amber-900/40";
                      healthLevel = "On Hold";
                      healthExplanation = "Aktivitas proyek dijeda sementara.";
                    } else {
                      if (timelinePercent > overallPct + 15) {
                        healthScoreStr = "Potensi Terlambat";
                        healthColor = "bg-rose-55 text-rose-705 border-rose-200 dark:bg-rose-955/20 dark:text-rose-450 dark:border-rose-900/40";
                        healthLevel = "Risiko Tinggi";
                        healthExplanation = `Batas waktu berjalan (${timelinePercent}%) mendahului kemajuan tugas (${overallPct}%) secara signifikan!`;
                      } else if (timelinePercent > overallPct) {
                        healthScoreStr = "Butuh Perhatian";
                        healthColor = "bg-amber-50 text-amber-750 border-amber-205 dark:bg-amber-955/20 dark:text-amber-450 dark:border-amber-900/40";
                        healthLevel = "Risiko Sedang";
                        healthExplanation = `Laju waktu berjalan (${timelinePercent}%) mendahului penyelesaian tugas (${overallPct}%).`;
                      } else {
                        healthScoreStr = "Sangat Baik (On Track)";
                        healthColor = "bg-emerald-50 text-emerald-705 border-emerald-205 dark:bg-emerald-955/20 dark:text-emerald-450 dark:border-emerald-900/40";
                        healthLevel = "Sangat Baik";
                        healthExplanation = "Penyelesaian tugas berjalan optimal sesuai dengan tenggat waktu.";
                      }
                    }

                    return (
                      <div className="bg-slate-50/45 dark:bg-slate-950/20 border border-slate-200/60 dark:border-slate-800/80 p-4 rounded-xl space-y-3.5">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                          <span className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-1.5 select-none">
                            <HeartPulse className="w-4.5 h-4.5 text-rose-500 animate-pulse" /> Monitor Kesehatan Proyek
                          </span>
                          <div className={`text-[10.5px] px-2.5 py-1 rounded-md border font-extrabold flex items-center gap-1.5 ${healthColor}`}>
                            <span className="inline-block w-1.5 h-1.5 rounded-full bg-current" />
                            <span>{healthScoreStr} ({healthLevel})</span>
                          </div>
                        </div>

                        {/* Explanation text */}
                        <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-normal font-sans italic">
                          💡 <strong className="not-italic text-slate-700 dark:text-slate-205 font-bold">Rekomendasi:</strong> {healthExplanation}
                          {kendala.length > 0 && ` Terdapat ${kendala.length} kendala aktif yang masih belum memiliki solusi.`}
                        </p>

                        {/* Interactive Timeline Track */}
                        {startD && endD && (
                          <div className="space-y-2 pt-1 font-sans">
                            <div className="flex justify-between text-[9.5px] font-bold text-slate-450 dark:text-slate-400 uppercase tracking-widest font-mono select-none">
                              <span>Mulai: {startD.toLocaleDateString("id-ID")}</span>
                              <span>Sisa: {Math.max(0, totalDays - elapsedDays)} Hari ({totalDays} hari total)</span>
                              <span>Target: {endD.toLocaleDateString("id-ID")}</span>
                            </div>

                            {/* Linear visualization */}
                            <div className="relative h-6 bg-slate-200/70 dark:bg-slate-850 rounded-lg overflow-hidden flex items-center select-none shadow-xs border border-slate-300/20">
                              {/* Left shaded part based on actual task progress */}
                              <div 
                                className="absolute left-0 top-0 bottom-0 bg-blue-600/15 dark:bg-blue-500/20 border-r border-blue-500/20"
                                style={{ width: `${overallPct}%` }}
                              />
                              
                              {/* Horizontal middle ruler line */}
                              <div className="absolute left-0 right-0 h-[1.5px] bg-slate-300 dark:bg-slate-700 top-1/2 -translate-y-1/2" />

                              {/* Elapsed timeline progress bar */}
                              <div 
                                className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-indigo-500 rounded-full transition-all"
                                style={{ width: `${timelinePercent}%` }}
                              />

                              {/* Marker pin details */}
                              <div className="absolute inset-0 flex items-center justify-between px-3 text-[10px] font-bold z-10 select-none">
                                <span className="text-blue-700 dark:text-blue-300 bg-white/80 dark:bg-slate-900/80 px-1.5 py-0.2 rounded border border-blue-500/10">Tugas: {overallPct}%</span>
                                <span className="text-indigo-700 dark:text-indigo-300 bg-white/80 dark:bg-slate-900/80 px-1.5 py-0.2 rounded border border-indigo-500/10">Waktu: {timelinePercent}%</span>
                              </div>
                            </div>
                            
                            {/* Visual Ruler Dots for status events */}
                            <div className="flex justify-between items-center text-[9px] text-slate-400 dark:text-slate-500 font-mono font-medium select-none">
                              <span className="flex items-center gap-0.5">• Kick Off</span>
                              <span className="flex items-center gap-0.5">• Saat Ini ({elapsedDays} hari berjalan)</span>
                              <span className="flex items-center gap-0.5">• Serah Terima / BAST</span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}

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

                  {/* Fitur Modul Terpantau Badge List */}
                  {p.fiturModul && p.fiturModul.length > 0 && (
                    <div className="bg-slate-50 dark:bg-slate-950/40 border border-slate-150/10 p-3.5 rounded-xl text-xs space-y-2">
                      <p className="font-bold text-slate-500 uppercase text-[9px] tracking-wider flex items-center gap-1">
                        <Layers className="w-3.5 h-3.5 text-blue-600" /> Fitur Modul Terpantau ({p.fiturModul.length})
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {p.fiturModul.map((feat, idx) => (
                          <span key={idx} className="bg-blue-50/50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300 text-[10.5px] font-bold px-2 py-0.5 rounded-md border border-blue-150/10 hover:bg-blue-100 dark:hover:bg-blue-950/40 transition-colors">
                            ✓ {feat}
                          </span>
                        ))}
                      </div>
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

                  {/* Collaboration Section */}
                  {(() => {
                    const linkedComms = Array.from(new Map(
                      commLogs.filter(l => 
                        (p.linkedCommLogIds && p.linkedCommLogIds.includes(l.id)) || 
                        (l.project === p.kode)
                      ).map(l => [l.id, l])
                    ).values());

                    const linkedMoMs = Array.from(new Map(
                      meetingLogs.filter(l => 
                        (p.linkedMeetingLogIds && p.linkedMeetingLogIds.includes(l.id)) || 
                        (l.project === p.kode)
                      ).map(l => [l.id, l])
                    ).values());

                    return (
                      <div className="border-t border-slate-100 dark:border-slate-800 pt-4 font-sans">
                        <h5 className="text-xs font-black text-indigo-650 dark:text-indigo-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                          <MessageSquare className="w-4 h-4 text-indigo-550" /> Arsip Kolaborasi terhubung ({linkedComms.length + linkedMoMs.length})
                        </h5>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Log Koordinasi */}
                          <div className="space-y-2 font-sans">
                            <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-950/40 p-1.5 px-2 rounded-md border border-slate-100 dark:border-slate-800/40">
                              <span className="text-[11px] font-bold text-slate-700 dark:text-slate-350">
                                💬 Log Koordinasi / WA & Email ({linkedComms.length})
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  setCollabModalProjId(p.id);
                                  setCollabModalType('comm');
                                  setTempCheckedCollabIds(p.linkedCommLogIds || []);
                                  setCollabSearch("");
                                }}
                                className="text-[10px] text-blue-600 hover:underline font-bold"
                              >
                                + Hubungkan
                              </button>
                            </div>
                            {linkedComms.length === 0 ? (
                              <p className="text-[10px] text-slate-400 italic font-medium p-1 text-center">Tidak ada log koordinasi terhubung proyek ini.</p>
                            ) : (
                              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                                {linkedComms.map((log) => {
                                  const isExpanded = expandedLogId === log.id;
                                  return (
                                    <div 
                                      key={log.id} 
                                      className="border border-slate-150 dark:border-slate-800/80 rounded-xl p-2.5 bg-slate-50/45 dark:bg-slate-950/25 space-y-1 transition-all"
                                    >
                                      <div className="flex justify-between items-start gap-2">
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                          {log.noID && (
                                            <span className="text-[9px] font-mono font-black text-indigo-700 dark:text-indigo-400 bg-indigo-50/80 dark:bg-indigo-950/40 px-1.5 py-0.5 rounded border border-indigo-100/30">
                                              {log.noID}
                                            </span>
                                          )}
                                          <span className="text-[9px] font-bold text-slate-400">
                                            {new Date(log.date).toLocaleDateString("id-ID")}
                                          </span>
                                          <span className="bg-slate-100 dark:bg-slate-805 text-slate-550 dark:text-slate-455 text-[9px] font-bold px-1 rounded">
                                            {log.type}
                                          </span>
                                        </div>
                                        <button
                                          type="button"
                                          onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                                          className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline font-bold shrink-0"
                                        >
                                          {isExpanded ? "Tutup" : "Lihat Detail"}
                                        </button>
                                      </div>
                                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200 line-clamp-1">
                                        {log.summary}
                                      </p>
                                      {isExpanded && (
                                        <div 
                                          className="text-xs pt-2 border-t border-slate-200/50 dark:border-slate-800/60 mt-2 text-slate-600 dark:text-slate-300 space-y-2 leading-relaxed"
                                        >
                                          <div>
                                            <span className="font-bold text-[10px] text-slate-400 block uppercase tracking-wider">Partisipan / Pihak:</span>
                                            <p className="font-semibold text-slate-700 dark:text-slate-300">{log.participants}</p>
                                          </div>
                                          <div>
                                            <span className="font-bold text-[10px] text-slate-405 block uppercase tracking-wider font-extrabold text-blue-600 dark:text-blue-400">Detail Koordinasi:</span>
                                            <p className="whitespace-pre-wrap mt-0.5 font-medium bg-white dark:bg-slate-905 border border-slate-100 dark:border-slate-805/50 p-2.5 rounded-lg leading-relaxed text-slate-705 dark:text-slate-300">{log.detail}</p>
                                          </div>
                                          {log.createdBy && (
                                            <p className="text-[9px] text-slate-400 text-right">Dicatat oleh: {log.createdBy}</p>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>

                          {/* MoM Logs */}
                          <div className="space-y-2 font-sans">
                            <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-950/40 p-1.5 px-2 rounded-md border border-slate-100 dark:border-slate-800/40">
                              <span className="text-[11px] font-bold text-slate-700 dark:text-slate-350">
                                👥 Minutes of Meeting ({linkedMoMs.length})
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  setCollabModalProjId(p.id);
                                  setCollabModalType('meeting');
                                  setTempCheckedCollabIds(p.linkedMeetingLogIds || []);
                                  setCollabSearch("");
                                }}
                                className="text-[10px] text-blue-600 hover:underline font-bold"
                              >
                                + Hubungkan
                              </button>
                            </div>
                            {linkedMoMs.length === 0 ? (
                              <p className="text-[10px] text-slate-400 italic font-medium font-sans p-1 text-center">Tidak ada MoM terhubung proyek ini.</p>
                            ) : (
                              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                                {linkedMoMs.map((log) => {
                                  const isExpanded = expandedLogId === log.id;
                                  return (
                                    <div 
                                      key={log.id} 
                                      className="border border-slate-150 dark:border-slate-800/80 rounded-xl p-2.5 bg-slate-50/45 dark:bg-slate-950/25 space-y-1 transition-all"
                                    >
                                      <div className="flex justify-between items-start gap-2">
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                          {log.noID && (
                                            <span className="text-[9px] font-mono font-black text-indigo-700 dark:text-indigo-400 bg-indigo-50/80 dark:bg-indigo-950/40 px-1.5 py-0.5 rounded border border-indigo-100/30">
                                              {log.noID}
                                            </span>
                                          )}
                                          <span className="text-[9px] font-bold text-slate-400">
                                            {new Date(log.date).toLocaleDateString("id-ID")}
                                          </span>
                                        </div>
                                        <button
                                          type="button"
                                          onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                                          className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline font-bold shrink-0"
                                        >
                                          {isExpanded ? "Tutup" : "Lihat Detail"}
                                        </button>
                                      </div>
                                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200 line-clamp-1">
                                        {log.title}
                                      </p>
                                      {isExpanded && (
                                        <div 
                                          className="text-xs pt-2 border-t border-slate-200/50 dark:border-slate-800/60 mt-2 text-slate-605 dark:text-slate-300 space-y-2 leading-relaxed"
                                        >
                                          <div>
                                            <span className="font-bold text-[10px] text-slate-405 block uppercase tracking-wider">Peserta Rapat:</span>
                                            <p className="font-semibold text-slate-700 dark:text-slate-300">{log.attendees}</p>
                                          </div>
                                          <div>
                                            <span className="font-bold text-[10px] text-slate-405 block uppercase tracking-wider">Agenda Pembahasan:</span>
                                            <p className="whitespace-pre-wrap text-slate-700 dark:text-slate-300 font-medium bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-805/30 p-2.5 rounded-lg mt-0.5">{log.agenda}</p>
                                          </div>
                                          <div>
                                            <span className="font-bold text-[10px] text-slate-405 block uppercase tracking-wider font-extrabold text-blue-600 dark:text-blue-400">Keputusan / Hasil (Decisions):</span>
                                            <p className="whitespace-pre-wrap text-slate-800 dark:text-slate-200 font-bold bg-blue-50/20 dark:bg-blue-900/10 border border-blue-105/30 p-2.5 rounded-lg mt-0.5">{log.decisions}</p>
                                          </div>
                                          {log.actions && (
                                            <div>
                                              <span className="font-bold text-[10px] text-slate-405 block uppercase tracking-wider font-extrabold text-amber-600 dark:text-amber-400">Tindak Lanjut (Actions):</span>
                                              <p className="whitespace-pre-wrap text-slate-705 dark:text-slate-305 font-medium bg-amber-500/5 border border-amber-500/10 p-2.5 rounded-lg mt-0.5">{log.actions}</p>
                                            </div>
                                          )}
                                          {log.createdBy && (
                                            <p className="text-[9px] text-slate-400 text-right">Dicatat oleh: {log.createdBy}</p>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* DIRECT PROJECT DOCUMENTS / TARGET UAT ATTACHMENTS REPOSITORY (POINT 2.C) */}
                  <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-3 font-sans">
                    <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-950/40 p-2.5 rounded-lg border border-slate-150/10 dark:border-slate-800/40">
                      <span className="text-xs font-black text-indigo-650 dark:text-indigo-400 uppercase tracking-widest flex items-center gap-1.5 select-none font-sans">
                        <FileText className="w-4 h-4 text-indigo-500" /> Berkas Proyek & Target UAT / Dokumen Terkait ({docs.filter(d => d.project === p.kode).length})
                      </span>
                      {currentUser?.role !== "Client" && (
                        <button
                          type="button"
                          onClick={() => {
                            setActiveDocProjId(p.id);
                            setDocCategory("Lainnya");
                            setDocTitle("");
                            setDocUrl("");
                            setDocDesc("");
                          }}
                          className="text-[10.5px] bg-indigo-55/10 hover:bg-indigo-55/20 text-indigo-600 dark:text-indigo-400 px-3 py-1 rounded-md border border-indigo-200/30 font-bold flex items-center gap-1 transition-all cursor-pointer font-sans"
                        >
                          <PlusCircle className="w-3.5 h-3.5" /> + Berkas Baru
                        </button>
                      )}
                    </div>

                    {docs.filter(d => d.project === p.kode).length === 0 ? (
                      <p className="text-[10.5px] text-slate-400 dark:text-slate-550 italic p-4 text-center bg-slate-50/50 dark:bg-slate-950/5 rounded-xl border border-dashed border-slate-150 dark:border-slate-800/60 font-sans">
                        Belum ada berkas spesifikasi, regulasi, desain figma, atau checklist UAT tertaut pada proyek ini. Silakan klik "+ Berkas Baru" untuk menghubungkan.
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {docs.filter(d => d.project === p.kode).map((doc) => {
                          const canDeleteDoc = currentUser?.role === "Administrator" || doc.createdBy === currentUser?.username;
                          return (
                            <div 
                              key={doc.id} 
                              className="bg-white dark:bg-slate-905 border border-slate-200 dark:border-slate-800/75 hover:border-slate-300 dark:hover:border-slate-700 rounded-xl p-3 shadow-xs space-y-2 flex flex-col justify-between"
                            >
                              <div className="space-y-1.5 text-left font-sans">
                                <div className="flex justify-between items-start gap-2">
                                  <span className={`text-[9.5px] font-black px-2 py-0.5 rounded-full border ${
                                    doc.category === 'API Specs' ? 'bg-orange-50 text-orange-700 border-orange-200/50 dark:bg-orange-950/20 dark:text-orange-400 dark:border-orange-900/30' :
                                    doc.category === 'User Manual' ? 'bg-emerald-50 text-emerald-700 border-emerald-200/50 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30' :
                                    doc.category === 'Desain' ? 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200/50 dark:bg-fuchsia-950/20 dark:text-fuchsia-400 dark:border-fuchsia-900/30' :
                                    doc.category === 'Kontrak' ? 'bg-indigo-50 text-indigo-700 border-indigo-200/50 dark:bg-indigo-950/20 dark:text-indigo-400 dark:border-indigo-900/30' :
                                    'bg-slate-100 text-slate-700 border-slate-205 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                                  }`}>
                                    {doc.category}
                                  </span>
                                  
                                  {canDeleteDoc && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (confirm(`Hapus dokumen "${doc.title}" dari proyek ini?`)) {
                                          if (onDeleteDoc) onDeleteDoc(doc.id);
                                        }
                                      }}
                                      className="text-slate-400 hover:text-red-500 p-0.5 rounded transition-colors cursor-pointer"
                                      title="Hapus berkas"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                                <h6 className="text-xs font-bold text-slate-800 dark:text-slate-200 line-clamp-1 leading-normal">{doc.title}</h6>
                                {doc.desc && <p className="text-[10.5px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">{doc.desc}</p>}
                              </div>
                              <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/60 mt-1 font-sans">
                                <span className="text-[9.5px] text-slate-400 font-medium">
                                  {doc.createdBy || "Sys"} &bull; {doc.date ? new Date(doc.date).toLocaleDateString("id-ID") : "—"}
                                </span>
                                <a
                                  href={doc.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-[10.5px] text-blue-600 dark:text-blue-400 hover:underline font-bold"
                                >
                                  <Link className="w-3 h-3" /> Buka ↗
                                </a>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
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

      {/* MODAL: ADD DIRECT DOC LINK (POINT 2.C) */}
      <AnimatePresence>
        {activeDocProjId && (
          <div className="fixed inset-0 bg-slate-950/65 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-800 rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4 font-sans text-left"
            >
              <div>
                <h3 className="font-bold text-base text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-indigo-550" /> Unggah Berkas & Dokumen Baru
                </h3>
                <p className="text-xs text-slate-400 font-medium font-sans">
                  Sematkan spesifikasi, panduan kertas kerja, cetak mockup figma, atau lembar checklist UAT untuk proyek {projects.find(x => x.id === activeDocProjId)?.kode}.
                </p>
              </div>

              <div className="space-y-3.5 text-xs text-left">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest font-sans">Kategori Berkas</label>
                  <select
                    value={docCategory}
                    onChange={(e) => setDocCategory(e.target.value as any)}
                    className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-205 dark:border-slate-800 rounded-lg p-2.5 text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
                  >
                    <option value="API Specs">🔌 API Specs (Spesifikasi API)</option>
                    <option value="User Manual">📘 User Manual / Kertas Kerja</option>
                    <option value="Desain">🎨 Desain Layout & Figma Mockup</option>
                    <option value="Kontrak">📂 Dokumen Kontrak & BAST</option>
                    <option value="Lainnya">📎 Lainnya / Lampiran Umum</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest font-sans">Nama / Judul Berkas *</label>
                  <input
                    type="text"
                    value={docTitle}
                    onChange={(e) => setDocTitle(e.target.value)}
                    placeholder="Contoh: Dokumen Hasil UAT Modul Registrasi"
                    className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-205 dark:border-slate-800 rounded-lg p-2.5 text-slate-800 dark:text-slate-200 focus:outline-none"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest font-sans font-mono">Drive URL / Tautan Resource *</label>
                  <input
                    type="url"
                    value={docUrl}
                    onChange={(e) => setDocUrl(e.target.value)}
                    placeholder="https://drive.google.com/..."
                    className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-205 dark:border-slate-800 rounded-lg p-2.5 text-slate-800 dark:text-slate-200 font-mono text-xs focus:outline-none"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest font-sans">Keterangan / Deskripsi Ringkas</label>
                  <textarea
                    rows={3}
                    value={docDesc}
                    onChange={(e) => setDocDesc(e.target.value)}
                    placeholder="Sebutkan hal penting berkas atau lampiran pelengkap..."
                    className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-205 dark:border-slate-800 rounded-lg p-2.5 text-slate-800 dark:text-slate-200 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 font-sans">
                <button
                  type="button"
                  onClick={() => setActiveDocProjId(null)}
                  className="px-4 py-2 border border-slate-250 text-slate-500 dark:text-slate-400 text-xs font-semibold rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-all font-sans cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const activeP = projects.find(x => x.id === activeDocProjId);
                    if (activeP) {
                      handleAddDocLocal(activeP.kode);
                    }
                  }}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg hover:shadow-md transition-all font-sans cursor-pointer"
                >
                  Simpan Berkas
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: MANAGE COLLABORATION LOGS CONNECTION */}
      <AnimatePresence>
        {collabModalProjId && collabModalType && (
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-800 rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4 font-sans"
            >
              <div>
                <h3 className="font-bold text-base text-slate-800 dark:text-slate-200">
                  Hubungkan {collabModalType === 'comm' ? "Log Koordinasi" : "Minutes of Meeting (MoM)"}
                </h3>
                <p className="text-xs text-slate-400 font-medium font-sans">Pilih catatan kolaborasi yang ingin dipautkan ke project ini.</p>
              </div>

              {/* Search Bar */}
              <div className="relative font-sans">
                <input
                  type="text"
                  value={collabSearch}
                  onChange={(e) => setCollabSearch(e.target.value)}
                  placeholder="Cari berdasarkan kata kunci..."
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg py-1.5 px-3 text-xs text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              {/* List of items with checkboxes */}
              <div className="max-h-60 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-lg p-2 space-y-1.5 bg-slate-50/50 dark:bg-slate-950/20 font-sans">
                {(() => {
                  const filteredLogs = (collabModalType === 'comm' ? commLogs : meetingLogs).filter(log => {
                    const text = collabModalType === 'comm' 
                      ? `${(log as any).noID || ""} ${(log as any).summary || ""} ${(log as any).detail || ""}`
                      : `${(log as any).noID || ""} ${(log as any).title || ""} ${(log as any).agenda || ""}`;
                    return text.toLowerCase().includes(collabSearch.toLowerCase());
                  });

                  if (filteredLogs.length === 0) {
                    return <span className="text-[10px] text-slate-405 block p-2 italic text-center">Tidak ada data ditemukan</span>;
                  }

                  return filteredLogs.map((log) => {
                    const isChecked = tempCheckedCollabIds.includes(log.id);
                    return (
                      <label
                        key={log.id}
                        className={`flex items-start gap-2.5 p-2 rounded-lg border transition-all text-xs cursor-pointer ${
                          isChecked
                            ? "bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-800/60 text-indigo-900 dark:text-indigo-300 font-semibold"
                            : "border-transparent text-slate-650 dark:text-slate-400 hover:bg-slate-100/55 dark:hover:bg-slate-850/55"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setTempCheckedCollabIds([...tempCheckedCollabIds, log.id]);
                            } else {
                              setTempCheckedCollabIds(tempCheckedCollabIds.filter(id => id !== log.id));
                            }
                          }}
                          className="mt-0.5 accent-indigo-600 rounded"
                        />
                        <div className="flex flex-col gap-0.5 max-w-[90%] font-sans text-left">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {log.noID && (
                              <span className="text-[9px] font-mono font-black text-indigo-600 bg-indigo-50 dark:bg-indigo-900/10 px-1 py-0.2 rounded">
                                {log.noID}
                              </span>
                            )}
                            <span className="text-[9px] font-bold text-slate-455 font-mono">
                              {new Date(log.date).toLocaleDateString("id-ID")}
                            </span>
                            {log.project && (
                              <span className="text-[9px] font-semibold text-blue-500 bg-blue-50 dark:bg-blue-900/10 px-1 py-0.2 rounded">
                                {log.project}
                              </span>
                            )}
                          </div>
                          <span className="font-bold text-[11px] line-clamp-1">
                            {collabModalType === 'comm' ? (log as any).summary : (log as any).title}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium line-clamp-1">
                            {collabModalType === 'comm' ? (log as any).detail : (log as any).agenda}
                          </span>
                        </div>
                      </label>
                    );
                  });
                })()}
              </div>

              {/* Footer action buttons */}
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 font-sans">
                <button
                  type="button"
                  onClick={() => { setCollabModalProjId(null); setCollabModalType(null); }}
                  className="px-4 py-1.5 border border-slate-250 text-slate-500 dark:text-slate-400 text-xs font-semibold rounded-lg hover:bg-slate-100 transition-all"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSaveProjectCollab}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg hover:shadow-lg transition-all"
                >
                  Simpan Koneksi
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
