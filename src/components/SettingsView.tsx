import React, { useState } from "react";
import { 
  ShieldCheck, 
  Flag, 
  CheckSquare, 
  Layers, 
  AlertCircle, 
  Activity, 
  Trash2, 
  Plus, 
  Save, 
  Lock,
  Edit2,
  Check,
  X,
  FileSpreadsheet,
  HeartPulse,
  FileText,
  FileCheck,
  Boxes,
  Zap
} from "lucide-react";
import { Project, Task, User, Client } from "../types";

interface RoleSettings {
  roleName: string;
  allowedViews: string[];
  active: boolean;
}

interface ItemConfig {
  value: string;
  active: boolean;
}

interface SettingsConfig {
  roles: RoleSettings[];
  milestoneStatuses: ItemConfig[];
  taskTypes: ItemConfig[];
  catProgresses: ItemConfig[];
  priorities: ItemConfig[];
  progressStatuses: ItemConfig[];
  tipeMedika?: ItemConfig[];
  tipeMedia?: ItemConfig[];
  kategoriDokumen?: ItemConfig[];
  jenisBeritaAcara?: ItemConfig[];
  jenisModul?: ItemConfig[];
  statusImplementasi?: ItemConfig[];
  jenisAplikasiModul?: ItemConfig[];
  platformModul?: ItemConfig[];
  statusModul?: ItemConfig[];
  statusImplementasiSite?: ItemConfig[];
  statusPenggunaan?: ItemConfig[];
  kategoriImplementasi?: ItemConfig[];
  jenisLaporan?: ItemConfig[];
  kategoriLaporan?: ItemConfig[];
}

const AVAILABLE_VIEWS = [
  { id: "dashboard", label: "Dashboard Portal" },
  { id: "projects", label: "Project Master" },
  { id: "tasks", label: "Tugas & Progress" },
  { id: "monev", label: "Monitoring & Evaluasi" },
  { id: "kanban", label: "Kanban Timeline" },
  { id: "gantt", label: "Gantt Timeline" },
  { id: "calendar", label: "Kalender Deadline" },
  { id: "collab", label: "Arsip Kolaborasi" },
  { id: "tickets", label: "Helpdesk & Troubleshoot" },
  { id: "appmodules", label: "Registrasi Modul SIMRS" },
  { id: "sitemodules", label: "Implementasi Modul per Site" },
  { id: "assets", label: "Aset & Alat Tambahan" },
  { id: "atk", label: "Pemesanan ATK (Logistik)" },
  { id: "billing", label: "Billing KSO & ATK" },
  { id: "kassite", label: "Kas Site (Petty Cash)" },
  { id: "clients", label: "Profile Client / RS" },
  { id: "users", label: "Penyusunan Akun (CRUD)" },
  { id: "settings", label: "Setting Sistem" }
];

interface SettingsViewProps {
  settings: SettingsConfig;
  onUpdateSettings: (newSettings: SettingsConfig) => Promise<void>;
  users: User[];
  projects: Project[];
  tasks: Task[];
  clients?: Client[];
  onCascadeRename: (category: string, oldValue: string, newValue: string) => void;
}

export default function SettingsView({ 
  settings, 
  onUpdateSettings, 
  users, 
  projects, 
  tasks,
  clients = [],
  onCascadeRename
}: SettingsViewProps) {
  
  const [activeTab, setActiveTab] = useState<string>("roles");
  const [successMsg, setSuccessMsg] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string>("");

  // Local state for inline inputs or edits
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState<string>("");
  const [newValInput, setNewValInput] = useState<string>("");

  const [editingRoleIndex, setEditingRoleIndex] = useState<number | null>(null);
  const [editingRoleValue, setEditingRoleValue] = useState<string>("");

  // Role creation states
  const [newRoleName, setNewRoleName] = useState<string>("");
  const [newRoleViews, setNewRoleViews] = useState<string[]>(["dashboard"]);

  // Safety checks based on actual transactions
  const isRoleUsed = (roleName: string) => users.some(u => u.role === roleName);
  const isMilestoneUsed = (val: string) => projects.some(p => p.status === val);
  const isTaskTypeUsed = (val: string) => tasks.some(t => t.taskType === val);
  const isCatProgressUsed = (val: string) => tasks.some(t => t.categoryProgress === val);
  const isPriorityUsed = (val: string) => tasks.some(t => t.priority === val);
  const isTaskStatusUsed = (val: string) => tasks.some(t => t.status === val);
  const isTipeMedikaUsed = (val: string) => clients.some(c => c.tipeMedika === val);

  const getIsUsed = (category: string, value: string) => {
    switch (category) {
      case "roles": return isRoleUsed(value);
      case "milestoneStatuses": return isMilestoneUsed(value);
      case "taskTypes": return isTaskTypeUsed(value);
      case "catProgresses": return isCatProgressUsed(value);
      case "priorities": return isPriorityUsed(value);
      case "progressStatuses": return isTaskStatusUsed(value);
      case "tipeMedika": return isTipeMedikaUsed(value);
      case "tipeMedia":
      case "kategoriDokumen":
      case "jenisBeritaAcara":
      case "jenisModul":
      case "statusImplementasi":
      case "jenisAplikasiModul":
      case "platformModul":
      case "statusModul":
      case "statusImplementasiSite":
      case "statusPenggunaan":
      case "kategoriImplementasi":
      case "jenisLaporan":
      case "kategoriLaporan":
        return false;
      default: return false;
    }
  };

  // Toast notifier
  const triggerToast = (msg: string, isError: boolean = false) => {
    if (isError) {
      setErrorMsg(msg);
      setTimeout(() => setErrorMsg(""), 4000);
    } else {
      setSuccessMsg(msg);
      setTimeout(() => setSuccessMsg(""), 3000);
    }
  };

  // General Update Handler
  const handleSaveSettings = async (nextSettings: SettingsConfig) => {
    try {
      await onUpdateSettings(nextSettings);
      triggerToast("Konfigurasi tersimpan sukses di database.");
    } catch (err: any) {
      triggerToast("Gagal menyimpan konfigurasi: " + err.message, true);
    }
  };

  // TAB 1: ROLES CRUD
  const handleToggleRoleActive = (index: number) => {
    const roles = [...settings.roles];
    const r = roles[index];
    if (r.roleName === "Administrator") {
      triggerToast("Peran Administrator tidak bisa dinonaktifkan!", true);
      return;
    }
    roles[index] = { ...r, active: !r.active };
    handleSaveSettings({ ...settings, roles });
  };

  const handleToggleRoleView = (roleIdx: number, viewId: string) => {
    const roles = [...settings.roles];
    const r = roles[roleIdx];
    
    // Safety check for Admin
    if (r.roleName === "Administrator" && viewId === "settings") {
      triggerToast("Akses menu Setting Sistem wajib dimiliki oleh Administrator!", true);
      return;
    }

    let nextViews = [...r.allowedViews];
    if (nextViews.includes(viewId)) {
      nextViews = nextViews.filter(v => v !== viewId);
    } else {
      nextViews.push(viewId);
    }

    roles[roleIdx] = { ...r, allowedViews: nextViews };
    handleSaveSettings({ ...settings, roles });
  };

  const handleAddRoleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleName.trim()) return;

    const exists = settings.roles.some(r => r.roleName.toLowerCase() === newRoleName.trim().toLowerCase());
    if (exists) {
      triggerToast("Role / Hak Akses tersebut sudah terdaftar!", true);
      return;
    }

    const nextRole: RoleSettings = {
      roleName: newRoleName.trim(),
      allowedViews: newRoleViews,
      active: true
    };

    const roles = [...settings.roles, nextRole];
    handleSaveSettings({ ...settings, roles });
    setNewRoleName("");
    setNewRoleViews(["dashboard"]);
  };

  const handleDeleteRole = (index: number) => {
    const role = settings.roles[index];
    if (role.roleName === "Administrator") {
      triggerToast("Role Administrator utama tidak boleh dihapus!", true);
      return;
    }
    if (isRoleUsed(role.roleName)) {
      triggerToast("Role ini sedang digunakan oleh pengguna aktif! Tidak bisa dihapus, hanya bisa dinonaktifkan.", true);
      return;
    }
    const roles = settings.roles.filter((_, idx) => idx !== index);
    handleSaveSettings({ ...settings, roles });
  };

  const handleSaveRoleEdit = async (index: number) => {
    if (!editingRoleValue.trim()) return;
    const r = settings.roles[index];
    if (r.roleName === "Administrator") {
      triggerToast("Nama peran Administrator tidak bisa diubah!", true);
      return;
    }
    const oldValue = r.roleName;
    const newValue = editingRoleValue.trim();

    // Check duplicate
    const exists = settings.roles.some((role, idx) => idx !== index && role.roleName.toLowerCase() === newValue.toLowerCase());
    if (exists) {
      triggerToast("Nama peran tersebut sudah terdaftar!", true);
      return;
    }

    const roles = [...settings.roles];
    roles[index] = { ...r, roleName: newValue };

    // Cascade rename users with this role
    if (users.some(u => u.role === oldValue)) {
      onCascadeRename("roles", oldValue, newValue);
      triggerToast(`Nama peran diubah & rujukan pengguna disinkronkan.`);
    }

    handleSaveSettings({ ...settings, roles });
    setEditingRoleIndex(null);
  };

  // OTHERS DYNAMIC GENERAL LISTS CRUD
  const handleAddListItem = (category: keyof SettingsConfig) => {
    if (!newValInput.trim()) return;
    
    const currentList = (settings[category] || []) as ItemConfig[];
    const exists = currentList.some(item => item && item.value && item.value.toLowerCase() === newValInput.trim().toLowerCase());
    if (exists) {
      triggerToast("Nilai tersebut sudah terdaftar dalam list!", true);
      return;
    }

    const nextList = [...currentList, { value: newValInput.trim(), active: true }];
    const nextSettings = { ...settings, [category]: nextList };
    
    handleSaveSettings(nextSettings);
    setNewValInput("");
  };

  const handleToggleItemActive = (category: keyof SettingsConfig, index: number) => {
    const currentList = [...((settings[category] || []) as ItemConfig[])];
    if (!currentList[index]) return;
    const item = currentList[index];
    currentList[index] = { ...item, active: !item.active };
    handleSaveSettings({ ...settings, [category]: currentList });
  };

  const handleStartEdit = (index: number, val: string) => {
    setEditingIndex(index);
    setEditingValue(val);
  };

  const handleSaveEdit = (category: keyof SettingsConfig, index: number) => {
    if (!editingValue.trim()) return;

    const currentList = [...((settings[category] || []) as ItemConfig[])];
    if (!currentList[index]) return;
    const oldValue = currentList[index].value;
    const newValue = editingValue.trim();

    // Check duplicate
    const exists = currentList.some((item, idx) => idx !== index && item && item.value && item.value.toLowerCase() === newValue.toLowerCase());
    if (exists) {
      triggerToast("Nilai ini sudah terdaftar!", true);
      return;
    }

    currentList[index] = { ...currentList[index], value: newValue };
    
    // Fire Cascade Rename (updates projects & tasks) if used
    if (getIsUsed(category, oldValue)) {
      onCascadeRename(category, oldValue, newValue);
      triggerToast(`Nilai diubah & merubah rujukan data yang ada.`);
    }

    handleSaveSettings({ ...settings, [category]: currentList });
    setEditingIndex(null);
  };

  const handleDeleteListItem = (category: keyof SettingsConfig, index: number) => {
    const currentList = (settings[category] || []) as ItemConfig[];
    if (!currentList[index]) return;
    const item = currentList[index];

    if (getIsUsed(category, item.value)) {
      triggerToast("Item tidak bisa dihapus karena sudah ada rujukan transaksi! Silahkan menonaktifkan rujukan ini terlebih dahulu.", true);
      return;
    }

    const nextList = currentList.filter((_, idx) => idx !== index);
    handleSaveSettings({ ...settings, [category]: nextList });
  };

  return (
    <div className="space-y-6 fade-in font-sans pb-16">
      
      {/* Title Header Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-xs space-y-2">
        <div className="flex items-center gap-1.5 text-[10px] text-blue-600 dark:text-blue-400 font-extrabold tracking-widest uppercase font-mono">
          <span>Maintenance Suite</span>
          <span>&bull;</span>
          <span>Administrator panel</span>
        </div>
        <h2 className="text-xl font-black text-slate-800 dark:text-white leading-tight">
          Pusat Pengaturan & Konfigurasi Sistem
        </h2>
        <p className="text-xs text-slate-500 max-w-2xl leading-relaxed">
          Kustomisasi tipe data, peran pengguna, status transisi, serta kontrol visibilitas menu sidebar secara penuh. Sesuai regulasi: data yang telah memiliki rujukan transaksi tidak dapat didelete melainkan hanya dinonaktifkan.
        </p>

        {/* Global Notifications Panel */}
        {successMsg && (
          <div className="mt-4 p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-900/40 text-xs font-semibold rounded-xl flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-500 animate-pulse" />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="mt-4 p-3 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200/50 dark:border-rose-900/40 text-xs font-semibold rounded-xl flex items-center gap-2">
            <X className="w-4 h-4 text-rose-500 animate-bounce" />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>

      {/* Primary Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Sidebar Tabs */}
        <div className="lg:col-span-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-1">
          <p className="text-[10px] font-black uppercase text-slate-450 dark:text-slate-500 tracking-wider px-3 pb-2 border-b border-slate-100 dark:border-slate-800 mb-2">KATEGORI SETTING</p>
          
          <button
            onClick={() => { setActiveTab("roles"); setEditingIndex(null); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold transition-all ${activeTab === "roles" ? "bg-blue-600 text-white shadow-xs" : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-850"}`}
          >
            <ShieldCheck className="w-4.5 h-4.5 shrink-0" />
            <span>Hak Akses / Role</span>
          </button>

          <button
            onClick={() => { setActiveTab("milestoneStatuses"); setEditingIndex(null); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold transition-all ${activeTab === "milestoneStatuses" ? "bg-blue-600 text-white shadow-xs" : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-850"}`}
          >
            <Flag className="w-4.5 h-4.5 shrink-0" />
            <span>Status Milestone Project</span>
          </button>

          <button
            onClick={() => { setActiveTab("taskTypes"); setEditingIndex(null); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold transition-all ${activeTab === "taskTypes" ? "bg-blue-600 text-white shadow-xs" : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-850"}`}
          >
            <CheckSquare className="w-4.5 h-4.5 shrink-0" />
            <span>Tipe Tugas (Task Type)</span>
          </button>

          <button
            onClick={() => { setActiveTab("catProgresses"); setEditingIndex(null); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold transition-all ${activeTab === "catProgresses" ? "bg-blue-600 text-white shadow-xs" : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-850"}`}
          >
            <Layers className="w-4.5 h-4.5 shrink-0" />
            <span>Category Progress</span>
          </button>

          <button
            onClick={() => { setActiveTab("priorities"); setEditingIndex(null); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold transition-all ${activeTab === "priorities" ? "bg-blue-600 text-white shadow-xs" : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-850"}`}
          >
            <AlertCircle className="w-4.5 h-4.5 shrink-0" />
            <span>Prioritas Tugas (Priority)</span>
          </button>

          <button
            onClick={() => { setActiveTab("progressStatuses"); setEditingIndex(null); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold transition-all ${activeTab === "progressStatuses" ? "bg-blue-600 text-white shadow-xs" : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-850"}`}
          >
            <Activity className="w-4.5 h-4.5 shrink-0" />
            <span>Status Progress Sekarang</span>
          </button>

          <button
            onClick={() => { setActiveTab("tipeMedika"); setEditingIndex(null); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold transition-all ${activeTab === "tipeMedika" ? "bg-blue-600 text-white shadow-xs" : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-850"}`}
          >
            <HeartPulse className="w-4.5 h-4.5 shrink-0 animate-pulse text-red-500" />
            <span>Tipe Medika (Kategori RS)</span>
          </button>

          <button
            onClick={() => { setActiveTab("tipeMedia"); setEditingIndex(null); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold transition-all ${activeTab === "tipeMedia" ? "bg-blue-600 text-white shadow-xs" : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-850"}`}
          >
            <Boxes className="w-4.5 h-4.5 shrink-0" />
            <span>Tipe Media</span>
          </button>

          <button
            onClick={() => { setActiveTab("kategoriDokumen"); setEditingIndex(null); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold transition-all ${activeTab === "kategoriDokumen" ? "bg-blue-600 text-white shadow-xs" : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-850"}`}
          >
            <FileText className="w-4.5 h-4.5 shrink-0" />
            <span>Kategori Dokumen</span>
          </button>

          <button
            onClick={() => { setActiveTab("jenisBeritaAcara"); setEditingIndex(null); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold transition-all ${activeTab === "jenisBeritaAcara" ? "bg-blue-600 text-white shadow-xs" : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-850"}`}
          >
            <FileCheck className="w-4.5 h-4.5 shrink-0" />
            <span>Jenis Berita Acara</span>
          </button>

          <button
            onClick={() => { setActiveTab("jenisModul"); setEditingIndex(null); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold transition-all ${activeTab === "jenisModul" ? "bg-blue-600 text-white shadow-xs" : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-850"}`}
          >
            <Boxes className="w-4.5 h-4.5 shrink-0" />
            <span>Jenis Modul</span>
          </button>

          <button
            onClick={() => { setActiveTab("statusImplementasi"); setEditingIndex(null); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold transition-all ${activeTab === "statusImplementasi" ? "bg-blue-600 text-white shadow-xs" : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-850"}`}
          >
            <Zap className="w-4.5 h-4.5 shrink-0" />
            <span>Status Implementasi</span>
          </button>

          <button
            onClick={() => { setActiveTab("jenisAplikasiModul"); setEditingIndex(null); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold transition-all ${activeTab === "jenisAplikasiModul" ? "bg-blue-600 text-white shadow-xs" : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-850"}`}
          >
            <Boxes className="w-4.5 h-4.5 shrink-0" />
            <span>Jenis Aplikasi Modul</span>
          </button>

          <button
            onClick={() => { setActiveTab("platformModul"); setEditingIndex(null); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold transition-all ${activeTab === "platformModul" ? "bg-blue-600 text-white shadow-xs" : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-850"}`}
          >
            <Boxes className="w-4.5 h-4.5 shrink-0" />
            <span>Platform Modul</span>
          </button>

          <button
            onClick={() => { setActiveTab("statusModul"); setEditingIndex(null); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold transition-all ${activeTab === "statusModul" ? "bg-blue-600 text-white shadow-xs" : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-850"}`}
          >
            <Zap className="w-4.5 h-4.5 shrink-0" />
            <span>Status Modul & Fitur</span>
          </button>

          <button
            onClick={() => { setActiveTab("statusImplementasiSite"); setEditingIndex(null); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold transition-all ${activeTab === "statusImplementasiSite" ? "bg-blue-600 text-white shadow-xs" : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-850"}`}
          >
            <Zap className="w-4.5 h-4.5 shrink-0" />
            <span>Status Implementasi Site</span>
          </button>

          <button
            onClick={() => { setActiveTab("statusPenggunaan"); setEditingIndex(null); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold transition-all ${activeTab === "statusPenggunaan" ? "bg-blue-600 text-white shadow-xs" : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-850"}`}
          >
            <CheckSquare className="w-4.5 h-4.5 shrink-0" />
            <span>Status Penggunaan Site</span>
          </button>

          <button
            onClick={() => { setActiveTab("kategoriImplementasi"); setEditingIndex(null); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold transition-all ${activeTab === "kategoriImplementasi" ? "bg-blue-600 text-white shadow-xs" : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-850"}`}
          >
            <Layers className="w-4.5 h-4.5 shrink-0" />
            <span>Kategori Implementasi Site</span>
          </button>

          <button
            onClick={() => { setActiveTab("jenisLaporan"); setEditingIndex(null); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold transition-all ${activeTab === "jenisLaporan" ? "bg-blue-600 text-white shadow-xs" : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-850"}`}
          >
            <FileText className="w-4.5 h-4.5 shrink-0" />
            <span>Jenis Laporan (Helpdesk)</span>
          </button>

          <button
            onClick={() => { setActiveTab("kategoriLaporan"); setEditingIndex(null); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold transition-all ${activeTab === "kategoriLaporan" ? "bg-blue-600 text-white shadow-xs" : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-850"}`}
          >
            <Layers className="w-4.5 h-4.5 shrink-0" />
            <span>Kategori Laporan (Helpdesk)</span>
          </button>
        </div>

        {/* Dynamic Detail Card Panels */}
        <div className="lg:col-span-9 bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-2xl p-6 shadow-xs min-h-[400px]">
          
          {/* TAB: ROLES & PERMISSIONS */}
          {activeTab === "roles" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider">Tabel Hak Akses & Menu</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">Definisikan kelompok peran serta batasan menu sistem di bawah ini.</p>
                </div>
              </div>

              {/* Roles list */}
              <div className="space-y-4">
                {settings.roles.map((role, rIdx) => {
                  const used = isRoleUsed(role.roleName);
                  return (
                    <div 
                      key={role.roleName}
                      className="p-5 border border-slate-200 dark:border-slate-800 rounded-xl space-y-4 bg-slate-50/50 dark:bg-slate-900/50"
                    >
                      <div className="flex justify-between items-start gap-3">
                        <div>
                          {editingRoleIndex === rIdx ? (
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                value={editingRoleValue}
                                onChange={(e) => setEditingRoleValue(e.target.value)}
                                className="bg-white dark:bg-slate-950 border border-blue-500 py-1.5 px-3 rounded-md font-semibold text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 max-w-[200px]"
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") handleSaveRoleEdit(rIdx);
                                }}
                                autoFocus
                              />
                              <button
                                type="button"
                                onClick={() => handleSaveRoleEdit(rIdx)}
                                className="p-1 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                              >
                                <Check className="w-3.5 h-3.5" /> Simpan
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingRoleIndex(null)}
                                className="p-1 px-2.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                              >
                                <X className="w-3.5 h-3.5" /> Batal
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs font-extrabold text-slate-850 dark:text-slate-100 uppercase tracking-widest bg-white dark:bg-slate-800 px-2.5 py-1 rounded-md border border-slate-200/50 dark:border-slate-700/50 shadow-2xs">
                              {role.roleName}
                            </span>
                          )}
                          
                          <div className="flex items-center gap-3 mt-2.5">
                            {/* Toggle active state */}
                            <button
                              type="button"
                              onClick={() => handleToggleRoleActive(rIdx)}
                              className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border transition-all ${role.active ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400" : "bg-red-50 text-red-600 border-red-200 dark:bg-red-950/20 dark:text-red-400"}`}
                            >
                              Status: {role.active ? "● Aktif" : "○ Non-aktif"}
                            </button>

                            {/* Counter of accounts */}
                            <span className="text-[10px] text-slate-450 font-bold bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                              {users.filter(u => u.role === role.roleName).length} Akun
                            </span>
                          </div>
                        </div>

                        {role.roleName !== "Administrator" ? (
                          <div className="flex items-center gap-1.5">
                            {editingRoleIndex !== rIdx && (
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingRoleIndex(rIdx);
                                  setEditingRoleValue(role.roleName);
                                }}
                                className="p-2 bg-blue-50 text-blue-650 border border-blue-250 hover:bg-blue-105 dark:bg-blue-950/20 dark:border-blue-900 rounded-lg transition-all cursor-pointer"
                                title="Edit Peran"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              type="button"
                              disabled={used}
                              onClick={() => {
                                if (confirm(`Hapus peran "${role.roleName}"?`)) {
                                  handleDeleteRole(rIdx);
                                }
                              }}
                              className={`p-2 rounded-lg border transition-all ${used ? "bg-slate-100 text-slate-300 border-slate-200 cursor-not-allowed dark:bg-slate-850 dark:border-slate-800" : "bg-red-50 text-red-650 border-red-200 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-950/40 cursor-pointer"}`}
                              title={used ? "Role ini memiliki relasi pengguna aktif, tidak bisa didelete." : "Hapus Peran"}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                            <Lock className="w-3.5 h-3.5 text-blue-500" /> Utama (System Lock)
                          </span>
                        )}
                      </div>

                      {/* Sidebars Menu Controls */}
                      <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800/60">
                        <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">Batasan Menu Sidebar & Hak Integrasi:</p>
                        
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 pt-1.5">
                          {AVAILABLE_VIEWS.map(view => {
                            const isAllowed = role.allowedViews.includes(view.id);
                            return (
                              <label 
                                key={view.id}
                                className={`flex items-center gap-2 p-2 rounded-lg border text-[10px] font-bold cursor-pointer transition-all select-none ${isAllowed ? "bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-950/20 dark:border-blue-900" : "bg-white dark:bg-slate-950 border-slate-100 dark:border-slate-850 text-slate-400 hover:border-slate-200"}`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isAllowed}
                                  onChange={() => handleToggleRoleView(rIdx, view.id)}
                                  className="rounded border-slate-350 text-blue-600 focus:ring-blue-500/20 shrink-0 cursor-pointer"
                                />
                                <span className="truncate">{view.label}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Add New Role Form */}
              <form onSubmit={handleAddRoleSubmit} className="p-5 border border-dashed border-slate-250 dark:border-slate-800 rounded-xl space-y-4 bg-slate-50/20 dark:bg-slate-950/20">
                <span className="text-[10px] font-black uppercase text-blue-605 col-span-2 block tracking-widest">SETUP TIM PERAN (ROLE) BARU</span>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Nama Hak Akses Baru *</label>
                    <input
                      type="text"
                      required
                      value={newRoleName}
                      onChange={(e) => setNewRoleName(e.target.value)}
                      placeholder="Contoh: General Manager atau Supervisor"
                      className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 py-2.5 px-3 rounded-lg text-slate-800 dark:text-slate-100 font-semibold"
                    />
                  </div>
                  
                  <div className="flex flex-col justify-end">
                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black rounded-lg hover:shadow-lg transition-all flex items-center justify-center gap-1.5 self-start cursor-pointer font-sans"
                    >
                      <Plus className="w-4.5 h-4.5 shrink-0" /> Buat Peran
                    </button>
                  </div>
                </div>
              </form>
            </div>
          )}

          {/* TAB: OTHER GENERAL CONFIG CODES (Status milestone, taskType, etc) */}
          {activeTab !== "roles" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider">
                    {activeTab === "milestoneStatuses" && "Status Milestone Project"}
                    {activeTab === "taskTypes" && "Katalog Tipe Tugas (Task Type)"}
                    {activeTab === "catProgresses" && "Katalog Kategori Progress"}
                    {activeTab === "priorities" && "List Prioritas Tugas"}
                    {activeTab === "progressStatuses" && "Indikator Status Progress"}
                    {activeTab === "tipeMedika" && "Katalog Tipe Medika (Kategori RS)"}
                    {activeTab === "tipeMedia" && "Katalog Tipe Media Korespondensi"}
                    {activeTab === "kategoriDokumen" && "Kategori Dokumen Arsip"}
                    {activeTab === "jenisBeritaAcara" && "Jenis Berita Acara (BA)"}
                    {activeTab === "jenisModul" && "Katalog Jenis Modul Aplikasi (Front/Back Office, Bridging)"}
                    {activeTab === "statusImplementasi" && "Status Tahap Implementasi"}
                    {activeTab === "jenisAplikasiModul" && "Katalog Jenis Aplikasi Modul (Web, Mobile)"}
                    {activeTab === "platformModul" && "Katalog Platform Modul (Web, Desktop)"}
                    {activeTab === "statusModul" && "Katalog Status Modul & Fitur (Aktif, Non Aktif, Dalam Pengembangan)"}
                    {activeTab === "statusImplementasiSite" && "Katalog Status Implementasi Site (e.g. Berjalan, Tidak Berjalan)"}
                    {activeTab === "statusPenggunaan" && "Katalog Status Penggunaan Site (e.g. Optimal, Tidak Optimal)"}
                    {activeTab === "kategoriImplementasi" && "Kategori Kategori Implementasi Site (e.g. Request, Pengembangan)"}
                    {activeTab === "jenisLaporan" && "Katalog Jenis Laporan Helpdesk (Incident/Request, dsb)"}
                    {activeTab === "kategoriLaporan" && "Katalog Kategori Masalah Helpdesk (SIMRS, PC, Printer, dsb)"}
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">Kelola data isian rujukan secara global, data lama tetap dipertahankan.</p>
                </div>
              </div>

              {/* Inline addition channel */}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Ketik entri data baru disini..."
                  value={newValInput}
                  onChange={(e) => setNewValInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleAddListItem(activeTab as keyof SettingsConfig);
                    }
                  }}
                  className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 py-2.5 px-3 rounded-lg font-semibold text-xs focus:ring-2 focus:ring-blue-500/20"
                />
                <button
                  type="button"
                  onClick={() => handleAddListItem(activeTab as keyof SettingsConfig)}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-750 text-white text-xs font-black rounded-lg transition-all flex items-center gap-1 cursor-pointer font-sans shadow-2xs hover:shadow-xs"
                >
                  <Plus className="w-4 h-4" /> Tambah
                </button>
              </div>

              {/* Configured Item rows table */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-2xs">
                <table className="w-full text-left text-xs text-slate-700 dark:text-slate-205 border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-850/50 text-[10px] font-black uppercase text-slate-500 tracking-wider">
                      <th className="py-3 px-4">Nama Isian / Nilai Rujukan</th>
                      <th className="py-3 px-4 w-40">Status Keaktifan</th>
                      <th className="py-3 px-4 w-40">Frekuensi Input</th>
                      <th className="py-3 px-4 w-28 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-805">
                    {((settings[activeTab as keyof SettingsConfig] || []) as ItemConfig[]).map((item, idx) => {
                      const valueUsed = getIsUsed(activeTab, item.value);
                      const isEditing = editingIndex === idx;

                      // Count references
                      let freq = 0;
                      if (activeTab === "milestoneStatuses") freq = projects.filter(p => p.status === item.value).length;
                      if (activeTab === "taskTypes") freq = tasks.filter(t => t.taskType === item.value).length;
                      if (activeTab === "catProgresses") freq = tasks.filter(t => t.categoryProgress === item.value).length;
                      if (activeTab === "priorities") freq = tasks.filter(t => t.priority === item.value as any).length;
                      if (activeTab === "progressStatuses") freq = tasks.filter(t => t.status === item.value as any).length;

                      return (
                        <tr key={`${item.value}-${idx}`} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/10 transition-colors">
                          <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">
                            {isEditing ? (
                              <div className="flex items-center gap-1.5 font-sans">
                                <input
                                  type="text"
                                  value={editingValue}
                                  onChange={(e) => setEditingValue(e.target.value)}
                                  className="bg-white dark:bg-slate-950 border border-blue-500 py-1 px-2 rounded-md font-semibold text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 max-w-[200px]"
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") handleSaveEdit(activeTab as keyof SettingsConfig, idx);
                                  }}
                                  autoFocus
                                />
                                <button
                                  type="button"
                                  onClick={() => handleSaveEdit(activeTab as keyof SettingsConfig, idx)}
                                  className="p-1 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 rounded"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingIndex(null)}
                                  className="p-1 text-red-650 hover:bg-red-50 dark:hover:bg-red-950/20 rounded"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            ) : (
                              <span className={item.active ? "" : "text-slate-400 line-through decoration-1"}>
                                {item.value}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <button
                              type="button"
                              onClick={() => handleToggleItemActive(activeTab as keyof SettingsConfig, idx)}
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border transition-all cursor-pointer ${item.active ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400" : "bg-red-50 text-red-650 border-red-200 dark:bg-red-950/20 dark:text-red-400"}`}
                            >
                              {item.active ? "Aktif" : "Non-aktif"}
                            </button>
                          </td>
                          <td className="py-3 px-4 font-mono text-[10px] font-bold text-slate-500">
                            {freq} inputan
                          </td>
                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center gap-1">
                              {/* Inline Edit Trigger */}
                              {!isEditing && (
                                <button
                                  type="button"
                                  onClick={() => handleStartEdit(idx, item.value)}
                                  className="p-1.5 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/30 rounded transition-all cursor-pointer"
                                  title="Edit Nama"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                              
                              {/* Delete button */}
                              <button
                                type="button"
                                disabled={valueUsed}
                                onClick={() => {
                                  if (confirm(`Hapus entri "${item.value}" dari database?`)) {
                                    handleDeleteListItem(activeTab as keyof SettingsConfig, idx);
                                  }
                                }}
                                className={`p-1.5 rounded transition-all cursor-pointer ${valueUsed ? "text-slate-350 dark:text-slate-800 cursor-not-allowed" : "text-red-650 hover:bg-red-50 dark:hover:bg-red-950/30"}`}
                                title={valueUsed ? "Terdapat inputan aktif, entri tidak bisa didelete (bisa dinonaktifkan)" : "Hapus Permanen"}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      </div>

    </div>
  );
}
