import React, { useState } from "react";
import { Client, AppModule, User, DirectorHistory } from "../types";
import { 
  Building2, 
  Plus, 
  Trash2, 
  FileCheck, 
  Clipboard, 
  UserCheck2,
  Calendar, 
  HeartPulse, 
  Search,
  Pencil,
  X,
  FileText,
  Layers,
  Code,
  Globe,
  ExternalLink,
  Percent
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface ClientsViewProps {
  clients: Client[];
  onAddClient: (data: Partial<Client>) => Promise<void>;
  onUpdateClient: (id: string, data: Partial<Client>) => Promise<void>;
  onDeleteClient: (id: string) => Promise<void>;
  tipeMedikaList?: string[];
  jenisModulList?: string[];
  statusImplementasiList?: string[];
  appModules?: AppModule[];
  currentUser?: User | null;
}

export default function ClientsView({
  clients = [],
  onAddClient,
  onUpdateClient,
  onDeleteClient,
  tipeMedikaList = ["Rumah Sakit", "Klinik Utama", "Klinik Pratama", "Puskesmas", "Laboratorium"],
  jenisModulList = ["Modul Utama", "Modul Integrasi", "Modul Penunjang", "Modul Pelaporan / Dashboard"],
  statusImplementasiList = ["Belum Mulai", "Analisis Fit & Gap", "Instalasi / Setting", "Pelatihan User", "Pendampingan UAT", "Selesai Implementasi"],
  appModules = [],
  currentUser = null
}: ClientsViewProps) {
  
  const isUserScoped = !!(currentUser && 
    currentUser.siteTugas && 
    currentUser.siteTugas.toLowerCase().trim() !== "kantor pusat" &&
    currentUser.role !== "Administrator" && 
    currentUser.role !== "Direktur");

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [errorText, setErrorText] = useState("");

  // Create Client State
  const [namaRS, setNamaRS] = useState("");
  const [noKSO, setNoKSO] = useState("");
  const [direkturRS, setDirekturRS] = useState("");
  const [modulSIMRS, setModulSIMRS] = useState("");
  const [tanggalProject, setTanggalProject] = useState("");
  const [tanggalCutOff, setTanggalCutOff] = useState("");
  const [tipeMedika, setTipeMedika] = useState<string>(tipeMedikaList[0] || "Rumah Sakit");
  const [persentaseKSO, setPersentaseKSO] = useState<number>(100);
  const [directors, setDirectors] = useState<DirectorHistory[]>([]);
  // Individual newly-added director sub-form fields
  const [newDirName, setNewDirName] = useState("");
  const [newDirNip, setNewDirNip] = useState("");
  const [newDirStart, setNewDirStart] = useState("");
  const [newDirEnd, setNewDirEnd] = useState("");
  const [newDirActive, setNewDirActive] = useState(true);

  // Edit Client State
  const [editClient, setEditClient] = useState<Client | null>(null);
  const [editNamaRS, setEditNamaRS] = useState("");
  const [editNoKSO, setEditNoKSO] = useState("");
  const [editDirekturRS, setEditDirekturRS] = useState("");
  const [editModulSIMRS, setEditModulSIMRS] = useState("");
  const [editTanggalProject, setEditTanggalProject] = useState("");
  const [editTanggalCutOff, setEditTanggalCutOff] = useState("");
  const [editTipeMedika, setEditTipeMedika] = useState("");
  const [editPersentaseKSO, setEditPersentaseKSO] = useState<number>(100);
  const [editDirectors, setEditDirectors] = useState<DirectorHistory[]>([]);
  // Individual editing director sub-form fields
  const [subDirName, setSubDirName] = useState("");
  const [subDirNip, setSubDirNip] = useState("");
  const [subDirStart, setSubDirStart] = useState("");
  const [subDirEnd, setSubDirEnd] = useState("");
  const [subDirActive, setSubDirActive] = useState(true);

  // Module Status Management
  const [expandedModuleClientId, setExpandedModuleClientId] = useState<string | null>(null);
  const [addModulName, setAddModulName] = useState(jenisModulList[0] || "");
  const [addModulStatus, setAddModulStatus] = useState(statusImplementasiList[0] || "");
  const [addModulTanggal, setAddModulTanggal] = useState(new Date().toISOString().slice(0, 10));
  const [editingModuleStatusId, setEditingModuleStatusId] = useState<string | null>(null);
  const [tempStatus, setTempStatus] = useState<string>("");
  const [tempTanggal, setTempTanggal] = useState<string>("");

  async function handleAddModuleStatus(cl: Client) {
    if (!addModulName) return;
    const currentStatuses = cl.moduleStatuses || [];
    if (currentStatuses.some(m => m.modulName === addModulName)) {
      alert(`Modul "${addModulName}" sudah dipantau untuk RS ini! Silakan ubah atau hapus modul yang bersangkutan.`);
      return;
    }
    const newItem = {
      id: "ms-" + Math.random().toString(36).slice(2, 9),
      modulName: addModulName,
      status: addModulStatus,
      tanggalImplementasi: addModulTanggal || new Date().toISOString().slice(0, 10),
      updatedAt: new Date().toISOString()
    };
    const updated = [...currentStatuses, newItem];
    await onUpdateClient(cl.id, { moduleStatuses: updated });

    // Pivot selection to the next available module name to avoid duplication
    const registeredNames = Array.from(new Set(appModules.map(m => m.name).filter(Boolean)));
    const clientImplemented = updated.map(m => m.modulName) || [];
    const nextAvail = registeredNames.filter(name => !clientImplemented.includes(name));
    setAddModulName(nextAvail[0] || "");
  }

  async function handleUpdateModuleStatusValue(cl: Client, id: string, nextStatus?: string, nextTanggal?: string) {
    const currentStatuses = cl.moduleStatuses || [];
    const updated = currentStatuses.map(m => {
      if (m.id === id) {
        return {
          ...m,
          status: nextStatus !== undefined ? nextStatus : m.status,
          tanggalImplementasi: nextTanggal !== undefined ? nextTanggal : m.tanggalImplementasi,
          updatedAt: new Date().toISOString()
        };
      }
      return m;
    });
    await onUpdateClient(cl.id, { moduleStatuses: updated });
  }

  async function handleDeleteModuleStatus(cl: Client, id: string) {
    const currentStatuses = cl.moduleStatuses || [];
    const itemToDelete = currentStatuses.find(m => m.id === id);
    const updated = currentStatuses.filter(m => m.id !== id);
    await onUpdateClient(cl.id, { moduleStatuses: updated });

    // Pivot selection since a deleted one might be chosen again
    const registeredNames = Array.from(new Set(appModules.map(m => m.name).filter(Boolean)));
    const clientImplemented = updated.map(m => m.modulName) || [];
    if (itemToDelete) {
      setAddModulName(prev => prev || itemToDelete.modulName);
    } else {
      const nextAvail = registeredNames.filter(name => !clientImplemented.includes(name));
      setAddModulName(nextAvail[0] || "");
    }
  }

  // Director List Management helpers
  const handleSetActiveDirInUnsaved = (id: string) => {
    setDirectors(prev => prev.map(d => ({
      ...d,
      isActive: d.id === id
    })));
  };

  const handleDeleteDirInUnsaved = (id: string) => {
    setDirectors(prev => prev.filter(d => d.id !== id));
  };

  const handleSetActiveDirInEditing = (id: string) => {
    setEditDirectors(prev => prev.map(d => ({
      ...d,
      isActive: d.id === id
    })));
  };

  const handleDeleteDirInEditing = (id: string) => {
    setEditDirectors(prev => prev.filter(d => d.id !== id));
  };

  async function handleCreateSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorText("");

    if (!namaRS.trim()) {
      setErrorText("Nama RS/Client wajib diisi!");
      return;
    }

    // Determine current active director text representation (name + NIP if exists)
    const activeDir = directors.find(d => d.isActive);
    const finalDirekturRS = activeDir ? `${activeDir.name}${activeDir.nip ? ` (NIP. ${activeDir.nip})` : ""}` : (direkturRS || "-");

    await onAddClient({
      namaRS: namaRS.trim(),
      noKSO: noKSO.trim(),
      direkturRS: finalDirekturRS,
      modulSIMRS: modulSIMRS.trim(),
      tanggalProject,
      tanggalCutOff,
      tipeMedika,
      persentaseKSO: persentaseKSO,
      directors: directors
    });

    // Reset Form
    setNamaRS("");
    setNoKSO("");
    setDirekturRS("");
    setModulSIMRS("");
    setTanggalProject("");
    setTanggalCutOff("");
    setTipeMedika(tipeMedikaList[0] || "Rumah Sakit");
    setPersentaseKSO(100);
    setDirectors([]);
    setNewDirName("");
    setNewDirNip("");
    setNewDirStart("");
    setNewDirEnd("");
    setNewDirActive(true);
    setIsFormOpen(false);
  }

  async function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editClient) return;

    if (!editNamaRS.trim()) {
      alert("Nama RS/Client wajib diisi!");
      return;
    }

    const activeDir = editDirectors.find(d => d.isActive);
    const finalDirekturRS = activeDir ? `${activeDir.name}${activeDir.nip ? ` (NIP. ${activeDir.nip})` : ""}` : (editDirekturRS || "-");

    await onUpdateClient(editClient.id, {
      namaRS: editNamaRS.trim(),
      noKSO: editNoKSO.trim(),
      direkturRS: finalDirekturRS,
      modulSIMRS: editModulSIMRS.trim(),
      tanggalProject: editTanggalProject,
      tanggalCutOff: editTanggalCutOff,
      tipeMedika: editTipeMedika,
      persentaseKSO: editPersentaseKSO,
      directors: editDirectors
    });

    setEditClient(null);
  }

  function startEdit(cl: Client) {
    setEditClient(cl);
    setEditNamaRS(cl.namaRS);
    setEditNoKSO(cl.noKSO || "");
    setEditDirekturRS(cl.direkturRS || "");
    setEditModulSIMRS(cl.modulSIMRS || "");
    setEditTanggalProject(cl.tanggalProject || "");
    setEditTanggalCutOff(cl.tanggalCutOff || "");
    setEditTipeMedika(cl.tipeMedika || tipeMedikaList[0] || "Rumah Sakit");
    setEditPersentaseKSO(cl.persentaseKSO !== undefined ? cl.persentaseKSO : 100);
    setEditDirectors(cl.directors || []);
    // Reset individual inputs
    setSubDirName("");
    setSubDirNip("");
    setSubDirStart("");
    setSubDirEnd("");
    setSubDirActive(true);
  }

  const filteredClients = clients.filter(cl => 
    cl.namaRS.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (cl.noKSO || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (cl.direkturRS || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (cl.modulSIMRS || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get unique list of registered module names from Registrasi Modul SIMRS (appModules)
  const registeredModuleNames = Array.from(
    new Set(appModules.map(m => m.name).filter(Boolean))
  );

  // Stats calculation
  const totalClientsCount = clients.length;
  const medikaBreakdown = clients.reduce((acc, curr) => {
    const type = curr.tipeMedika || "Belum Dikategorikan";
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div id="clients-view-root" className="space-y-6">
      
      {/* Visual Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm shadow-blue-500/5">
        <div>
          <div className="flex items-center gap-2 text-blue-500 dark:text-blue-400 font-bold uppercase tracking-wider text-xs">
            <Building2 className="w-4 h-4 text-blue-500" />
            <span>Katalog Lokasi & Akun Master</span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">Profile Client / RS</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Registrasikan data kemitraan RS, nomor kerjasama (KSO), Direktur Utama, modul tugas & penentuan tanggal cutoff project.
          </p>
        </div>
        {!isUserScoped && (
          <button
            onClick={() => setIsFormOpen(!isFormOpen)}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-3 py-2 rounded-lg transition-all shadow-md shadow-blue-600/20 active:scale-95 cursor-pointer"
          >
            {isFormOpen ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
            {isFormOpen ? "Batal" : "Tambah Client RS"}
          </button>
        )}
      </div>

      {/* Visual Statistics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-xl p-4 flex items-center gap-3 shadow-xs">
          <div className="w-10 h-10 bg-blue-50 dark:bg-blue-950 border border-blue-100 dark:border-blue-900/30 rounded-lg flex items-center justify-center">
            <Building2 className="w-5 h-5 text-blue-500 dark:text-blue-400" />
          </div>
          <div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-widest font-black">Total Site Client</div>
            <div className="text-lg font-bold text-slate-900 dark:text-white">{totalClientsCount} RS</div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-xl p-4 flex items-center gap-3 shadow-xs">
          <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-950 border border-indigo-100 dark:border-indigo-900/30 rounded-lg flex items-center justify-center">
            <HeartPulse className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
          </div>
          <div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-widest font-black">Tipe RS Medika</div>
            <div className="text-lg font-bold text-slate-900 dark:text-white">
              {medikaBreakdown["Rumah Sakit"] || 0} Unit
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-xl p-4 flex items-center gap-3 shadow-xs">
          <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-950 border border-emerald-100 dark:border-emerald-900/30 rounded-lg flex items-center justify-center">
            <FileText className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
          </div>
          <div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-widest font-black">Puskesmas / Klinik</div>
            <div className="text-lg font-bold text-slate-900 dark:text-white">
              {(medikaBreakdown["Puskesmas"] || 0) + (medikaBreakdown["Klinik Utama"] || 0) + (medikaBreakdown["Klinik Pratama"] || 0)} Unit
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-xl p-4 flex items-center gap-3 shadow-xs">
          <div className="w-10 h-10 bg-amber-50 dark:bg-amber-950 border border-amber-100 dark:border-amber-900/30 rounded-lg flex items-center justify-center">
            <Clipboard className="w-5 h-5 text-amber-500 dark:text-amber-400" />
          </div>
          <div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-widest font-black">Tipe Laboratorium</div>
            <div className="text-lg font-bold text-slate-900 dark:text-white">
              {medikaBreakdown["Laboratorium"] || 0} Unit
            </div>
          </div>
        </div>
      </div>

      {/* Creation Collapsible Drawer Form */}
      <AnimatePresence>
        {isFormOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <form onSubmit={handleCreateSubmit} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4 shadow-md shadow-blue-500/5">
              <h3 className="text-sm font-extrabold text-blue-500 dark:text-blue-400 uppercase tracking-wider flex items-center gap-2">
                <Plus className="w-4 h-4 text-blue-500" />
                Registrasi Client RS KSO Baru
              </h3>

              {errorText && (
                <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/40 text-xs py-2 px-3 rounded-lg font-bold font-sans">
                  ⚠️ {errorText}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Nama RS / Client <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={namaRS}
                    onChange={(e) => setNamaRS(e.target.value)}
                    placeholder="Nama RS (e.g. RS Medika Utama)"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Tipe Medika</label>
                  <select
                    value={tipeMedika}
                    onChange={(e) => setTipeMedika(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-blue-500"
                  >
                    {tipeMedikaList.map((tm) => (
                      <option key={tm} value={tm}>{tm}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Nomor Kerjasama (NO KSO)</label>
                  <input
                    type="text"
                    value={noKSO}
                    onChange={(e) => setNoKSO(e.target.value)}
                    placeholder="e.g. KSO/2026/IX-33"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Persentase Sharing KSO (%) <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={persentaseKSO}
                    onChange={(e) => setPersentaseKSO(parseFloat(e.target.value) || 0)}
                    placeholder="e.g. 10.5"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Riwayat Direktur RS Section */}
              <div className="bg-slate-50 dark:bg-slate-950/45 p-4 border border-slate-200 dark:border-slate-800 rounded-xl space-y-4">
                <div className="text-xs font-extrabold text-blue-600 dark:text-blue-400 uppercase tracking-wide flex items-center gap-1.5">
                  <UserCheck2 className="w-4 h-4" />
                  <span>Manajemen Riwayat Direktur Utama & NIP</span>
                </div>

                {directors.length === 0 ? (
                  <div className="text-center py-4 bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 rounded-lg">
                    <p className="text-[11px] text-slate-500 italic">Belum ada riwayat Direktur. Silakan tambahkan direktur baru di bawah.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {directors.map((dir) => (
                      <div key={dir.id} className={`flex flex-col justify-between p-3 rounded-lg border bg-white dark:bg-slate-900 transition-all ${dir.isActive ? "border-emerald-500 ring-1 ring-emerald-500/20" : "border-slate-200 dark:border-slate-800"}`}>
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-xs font-black text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                              {dir.name}
                              {dir.isActive && (
                                <span className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-605 dark:text-emerald-400 text-[9px] font-black px-1.5 rounded-sm border border-emerald-250 dark:border-emerald-900/50 uppercase">
                                  Aktif
                                </span>
                              )}
                            </p>
                            {dir.nip && (
                              <p className="text-[10px] font-mono text-slate-500 dark:text-slate-400 mt-0.5">NIP: {dir.nip}</p>
                            )}
                            {(dir.startDate || dir.endDate) && (
                              <p className="text-[9px] text-slate-550 dark:text-slate-450 mt-1 bg-slate-50 dark:bg-slate-950 px-1.5 py-0.5 rounded border border-slate-100 dark:border-slate-850">
                                {dir.startDate || "?"} s.d {dir.endDate || "Sekarang"}
                              </p>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-1">
                            {!dir.isActive && (
                              <button
                                type="button"
                                onClick={() => handleSetActiveDirInUnsaved(dir.id)}
                                className="text-[9px] bg-slate-100 hover:bg-emerald-5 border border-slate-200 dark:border-slate-800 hover:text-emerald-600 dark:bg-slate-800 dark:hover:bg-emerald-905 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded cursor-pointer"
                              >
                                Set Aktif
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleDeleteDirInUnsaved(dir.id)}
                              className="text-red-500 hover:bg-red-50 p-1 rounded hover:text-red-700 dark:hover:bg-red-950/30 shrink-0"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Inline form to append director to list */}
                <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-850 rounded-lg p-3 space-y-3">
                  <div className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest pb-1 border-b border-slate-50 dark:border-slate-850">
                    ➕ Formulir Direktur RS Baru
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
                    <div>
                      <label className="block text-[9px] font-bold text-slate-550 uppercase mb-0.5">Nama Direktur</label>
                      <input
                        type="text"
                        value={newDirName}
                        onChange={(e) => setNewDirName(e.target.value)}
                        placeholder="e.g. dr. Bambang, Sp.B"
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-2 py-1 text-xs text-slate-850 dark:text-slate-100"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-slate-550 uppercase mb-0.5">NIP Direktur</label>
                      <input
                        type="text"
                        value={newDirNip}
                        onChange={(e) => setNewDirNip(e.target.value)}
                        placeholder="e.g. 197508..."
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-2 py-1 text-xs text-slate-850 dark:text-slate-100"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-slate-550 uppercase mb-0.5">Mulai Jabatan</label>
                      <input
                        type="date"
                        value={newDirStart}
                        onChange={(e) => setNewDirStart(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-2 py-0.5 text-xs text-slate-850"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-slate-550 uppercase mb-0.5">Selasai Jabatan</label>
                      <input
                        type="date"
                        value={newDirEnd}
                        onChange={(e) => setNewDirEnd(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-2 py-0.5 text-xs text-slate-850"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 border-t border-slate-50 dark:border-slate-850">
                    <label className="inline-flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-slate-600 dark:text-slate-400">
                      <input
                        type="checkbox"
                        checked={newDirActive}
                        onChange={(e) => setNewDirActive(e.target.checked)}
                        className="rounded border-slate-300 dark:border-slate-800 text-indigo-600 focus:ring-indigo-500 shrink-0 w-3.5 h-3.5"
                      />
                      <span>Set sebagai Direktur Aktif saat ini</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        if (!newDirName.trim()) {
                          alert("Nama Direktur wajib diisi!");
                          return;
                        }
                        const id = "dir-" + Math.random().toString(36).slice(2, 9);
                        const newDir: DirectorHistory = {
                          id,
                          name: newDirName.trim(),
                          nip: newDirNip.trim(),
                          startDate: newDirStart,
                          endDate: newDirEnd,
                          isActive: newDirActive
                        };
                        let list = [...directors];
                        if (newDirActive) {
                          list = list.map(d => ({ ...d, isActive: false }));
                        }
                        setDirectors([...list, newDir]);
                        setNewDirName("");
                        setNewDirNip("");
                        setNewDirStart("");
                        setNewDirEnd("");
                        setNewDirActive(false);
                      }}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-extrabold px-3 py-1 rounded transition-all cursor-pointer"
                    >
                      Tambahkan
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Tanggal Mulai Project</label>
                  <input
                    type="date"
                    value={tanggalProject}
                    onChange={(e) => setTanggalProject(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Tanggal Cut-Off Sistem</label>
                  <input
                    type="date"
                    value={tanggalCutOff}
                    onChange={(e) => setTanggalCutOff(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold px-4 py-2 rounded-lg transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 py-2 rounded-lg transition-all shadow-md shadow-blue-600/20 cursor-pointer"
                >
                  Simpan Entry Baru
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Listing & Editing Area */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
        
        {/* Filter Toolbar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4 mb-4">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Database Record</h3>
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari RS, No KSO, modul, direktur..."
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg py-1.5 pl-9 pr-4 text-xs text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Clients list table / Cards */}
        {filteredClients.length === 0 ? (
          <div className="text-center py-12 text-slate-550 dark:text-slate-500">
            <Building2 className="w-12 h-12 text-slate-350 dark:text-slate-705 mx-auto mb-2" />
            <p className="text-sm">Tidak ada data Client RS yang ditemukan.</p>
            <p className="text-xs text-slate-550 dark:text-slate-650 mt-1">Silakan kurangi pencarian atau tambahkan Client baru.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredClients.map((cl) => {
              const isEditing = editClient?.id === cl.id;
              return (
                <div 
                  key={cl.id} 
                  className={`border rounded-xl p-5 transition-all ${isEditing ? "bg-slate-50 dark:bg-slate-950 border-blue-500 ring-1 ring-blue-500/30" : "bg-slate-50/50 dark:bg-slate-900/40 hover:bg-slate-100/50 dark:hover:bg-slate-800/40 border-slate-200 dark:border-slate-800"}`}
                >
                  {isEditing ? (
                    <form onSubmit={handleEditSubmit} className="space-y-4">
                       <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2 mb-2">
                        <span className="text-xs font-bold text-blue-600 dark:text-blue-400">📝 Mengedit Data Client: {cl.namaRS}</span>
                        <button type="button" onClick={() => setEditClient(null)} className="text-slate-400 hover:text-slate-900 dark:text-slate-500 dark:hover:text-white">
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Nama RS / Client</label>
                          <input
                            type="text"
                            required
                            value={editNamaRS}
                            onChange={(e) => setEditNamaRS(e.target.value)}
                            disabled={isUserScoped}
                            className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-blue-500 disabled:opacity-60"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Tipe Medika</label>
                          <select
                            value={editTipeMedika}
                            onChange={(e) => setEditTipeMedika(e.target.value)}
                            disabled={isUserScoped}
                            className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-blue-500 disabled:opacity-60"
                          >
                            {tipeMedikaList.map((tm) => (
                              <option key={tm} value={tm}>{tm}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">NO KSO</label>
                          <input
                            type="text"
                            value={editNoKSO}
                            onChange={(e) => setEditNoKSO(e.target.value)}
                            disabled={isUserScoped}
                            className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-blue-500 disabled:opacity-60"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Persentase Sharing KSO (%)</label>
                          <input
                            type="number"
                            step="any"
                            required
                            value={editPersentaseKSO}
                            onChange={(e) => setEditPersentaseKSO(parseFloat(e.target.value) || 0)}
                            className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-blue-500"
                          />
                        </div>
                      </div>

                      {/* Riwayat Direktur RS Section in Edit */}
                      <div className="bg-slate-50 dark:bg-slate-950/45 p-4 border border-slate-200 dark:border-slate-800 rounded-xl space-y-4">
                        <div className="text-xs font-extrabold text-blue-600 dark:text-blue-400 uppercase tracking-wide flex items-center gap-1.5">
                          <UserCheck2 className="w-4 h-4" />
                          <span>Manajemen Riwayat Direktur Utama & NIP</span>
                        </div>

                        {editDirectors.length === 0 ? (
                          <div className="text-center py-4 bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 rounded-lg">
                            <p className="text-[11px] text-slate-500 italic">Belum ada riwayat Direktur. Silakan tambahkan direktur baru di bawah.</p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {editDirectors.map((dir) => (
                              <div key={dir.id} className={`flex flex-col justify-between p-3 rounded-lg border bg-white dark:bg-slate-900 transition-all ${dir.isActive ? "border-emerald-500 ring-1 ring-emerald-500/20" : "border-slate-200 dark:border-slate-800"}`}>
                                <div className="flex items-start justify-between gap-2">
                                  <div>
                                    <p className="text-xs font-black text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                                      {dir.name}
                                      {dir.isActive && (
                                        <span className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-605 dark:text-emerald-400 text-[9px] font-black px-1.5 rounded-sm border border-emerald-250 dark:border-emerald-900/50 uppercase">
                                          Aktif
                                        </span>
                                      )}
                                    </p>
                                    {dir.nip && (
                                      <p className="text-[10px] font-mono text-slate-500 dark:text-slate-400 mt-0.5">NIP: {dir.nip}</p>
                                    )}
                                    {(dir.startDate || dir.endDate) && (
                                      <p className="text-[9px] text-slate-550 dark:text-slate-450 mt-1 bg-slate-50 dark:bg-slate-950 px-1.5 py-0.5 rounded border border-slate-100 dark:border-slate-850">
                                        {dir.startDate || "?"} s.d {dir.endDate || "Sekarang"}
                                      </p>
                                    )}
                                  </div>
                                  
                                  <div className="flex items-center gap-1">
                                    {!dir.isActive && (
                                      <button
                                        type="button"
                                        onClick={() => handleSetActiveDirInEditing(dir.id)}
                                        className="text-[9px] bg-slate-100 hover:bg-emerald-5 border border-slate-200 dark:border-slate-800 hover:text-emerald-600 dark:bg-slate-800 dark:hover:bg-emerald-905 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded cursor-pointer"
                                      >
                                        Set Aktif
                                      </button>
                                    )}
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteDirInEditing(dir.id)}
                                      className="text-red-500 hover:bg-red-50 p-1 rounded hover:text-red-700 dark:hover:bg-red-950/30 shrink-0"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Inline form to append director to edit list */}
                        <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-850 rounded-lg p-3 space-y-3">
                          <div className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest pb-1 border-b border-slate-50 dark:border-slate-850">
                            ➕ Formulir Direktur RS Baru
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
                            <div>
                              <label className="block text-[9px] font-bold text-slate-550 uppercase mb-0.5">Nama Direktur</label>
                              <input
                                type="text"
                                value={subDirName}
                                onChange={(e) => setSubDirName(e.target.value)}
                                placeholder="e.g. dr. Bambang, Sp.B"
                                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-2 py-1 text-xs text-slate-850 dark:text-slate-100"
                              />
                            </div>
                            <div>
                              <label className="block text-[9px] font-bold text-slate-550 uppercase mb-0.5">NIP Direktur</label>
                              <input
                                type="text"
                                value={subDirNip}
                                onChange={(e) => setSubDirNip(e.target.value)}
                                placeholder="e.g. 197508..."
                                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-2 py-1 text-xs text-slate-850 dark:text-slate-100"
                              />
                            </div>
                            <div>
                              <label className="block text-[9px] font-bold text-slate-550 uppercase mb-0.5">Mulai Jabatan</label>
                              <input
                                type="date"
                                value={subDirStart}
                                onChange={(e) => setSubDirStart(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-2 py-0.5 text-xs text-slate-850"
                              />
                            </div>
                            <div>
                              <label className="block text-[9px] font-bold text-slate-550 uppercase mb-0.5">Selasai Jabatan</label>
                              <input
                                type="date"
                                value={subDirEnd}
                                onChange={(e) => setSubDirEnd(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-2 py-0.5 text-xs text-slate-850"
                              />
                            </div>
                          </div>
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 border-t border-slate-50 dark:border-slate-850">
                            <label className="inline-flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-slate-600 dark:text-slate-400">
                              <input
                                type="checkbox"
                                checked={subDirActive}
                                onChange={(e) => setSubDirActive(e.target.checked)}
                                className="rounded border-slate-300 dark:border-slate-800 text-indigo-600 focus:ring-indigo-500 shrink-0 w-3.5 h-3.5"
                              />
                              <span>Set sebagai Direktur Aktif saat ini</span>
                            </label>
                            <button
                              type="button"
                              onClick={() => {
                                if (!subDirName.trim()) {
                                  alert("Nama Direktur wajib diisi!");
                                  return;
                                }
                                const id = "dir-" + Math.random().toString(36).slice(2, 9);
                                const newDir: DirectorHistory = {
                                  id,
                                  name: subDirName.trim(),
                                  nip: subDirNip.trim(),
                                  startDate: subDirStart,
                                  endDate: subDirEnd,
                                  isActive: subDirActive
                                };
                                let list = [...editDirectors];
                                if (subDirActive) {
                                  list = list.map(d => ({ ...d, isActive: false }));
                                }
                                setEditDirectors([...list, newDir]);
                                setSubDirName("");
                                setSubDirNip("");
                                setSubDirStart("");
                                setSubDirEnd("");
                                setSubDirActive(false);
                              }}
                              className="bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-extrabold px-3 py-1 rounded transition-all cursor-pointer"
                            >
                              Tambahkan
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Tanggal Project</label>
                          <input
                            type="date"
                            value={editTanggalProject}
                            onChange={(e) => setEditTanggalProject(e.target.value)}
                            disabled={isUserScoped}
                            className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-blue-500 disabled:opacity-60"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Tanggal Cut-Off</label>
                          <input
                            type="date"
                            value={editTanggalCutOff}
                            onChange={(e) => setEditTanggalCutOff(e.target.value)}
                            disabled={isUserScoped}
                            className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-blue-500 disabled:opacity-60"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-850">
                        <button
                          type="button"
                          onClick={() => setEditClient(null)}
                          className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-850 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold px-3 py-1.5 rounded-lg transition-all cursor-pointer"
                        >
                          Batal
                        </button>
                        <button
                          type="submit"
                          className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-all cursor-pointer"
                        >
                          Terapkan Perubahan
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div>
                      {/* RS Profile Read-only card */}
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-extrabold text-slate-900 dark:text-white">{cl.namaRS}</span>
                            <span className="text-[10px] bg-blue-50 dark:bg-slate-800 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-slate-705 rounded-sm px-1.5 py-0.5 font-bold uppercase tracking-wide">
                              {cl.tipeMedika || "Rumah Sakit"}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1.5 mt-3 text-xs text-slate-500 dark:text-slate-400">
                            <div className="flex items-center gap-1.5">
                              <FileCheck className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                              <span className="font-semibold text-slate-600 dark:text-slate-300">No KSO:</span>
                              <span className="font-mono text-slate-700 dark:text-slate-400">{cl.noKSO || "-"}</span>
                            </div>

                            <div className="flex items-center gap-1.5">
                              <Percent className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                              <span className="font-semibold text-slate-600 dark:text-slate-300">Nilai Persentase KSO:</span>
                              <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{cl.persentaseKSO !== undefined ? `${cl.persentaseKSO}%` : "100%"}</span>
                            </div>

                            <div className="flex items-center gap-1.5">
                              <UserCheck2 className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                              <span className="font-semibold text-slate-600 dark:text-slate-300">Direktur RS (Terbaru):</span>
                              <span className="text-slate-800 dark:text-slate-200 font-bold">{cl.direkturRS || "-"}</span>
                            </div>

                            <div className="flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                              <span className="font-semibold text-slate-600 dark:text-slate-300">Tanggal Project:</span>
                              <span className="text-slate-800 dark:text-slate-300">{cl.tanggalProject || "-"}</span>
                            </div>

                            <div className="flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0" />
                              <span className="font-semibold text-slate-600 dark:text-slate-300">Cut Off Sistem:</span>
                              <span className="text-orange-600 dark:text-orange-400 font-bold">{cl.tanggalCutOff || "-"}</span>
                            </div>
                          </div>

                          {/* Historical Directors Section */}
                          {cl.directors && cl.directors.length > 0 && (
                            <div className="mt-3 bg-slate-100/50 dark:bg-slate-950/20 p-2.5 rounded-lg border border-slate-200/50 dark:border-slate-800">
                              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1 mb-1.5">📚 Daftar Riwayat Direktur Utama ({cl.directors.length})</span>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {cl.directors.map(dir => (
                                  <div key={dir.id} className="text-[11px] px-2 py-1 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-850 rounded flex items-center justify-between">
                                    <div>
                                      <span className="font-bold text-slate-700 dark:text-slate-300">{dir.name}</span>
                                      {dir.nip && <span className="text-slate-400 block text-[9px] font-mono mt-0.5">NIP. {dir.nip}</span>}
                                      {(dir.startDate || dir.endDate) && (
                                        <span className="text-slate-450 block text-[9px] font-sans mt-0.5">🗓️ {dir.startDate || "?"} s/d {dir.endDate || "Sekarang"}</span>
                                      )}
                                    </div>
                                    <span className={`text-[9px] px-1.5 py-0.5 font-bold rounded ${dir.isActive ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50 uppercase" : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"}`}>
                                      {dir.isActive ? "Aktif" : "Selesai"}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Module Implementation Stats Accumulating from Registrasi Modul SIMRS (registeredModuleNames) */}
                          <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2">
                            <span className="text-[10px] uppercase font-extrabold text-blue-600 dark:text-blue-400 tracking-wider flex items-center gap-1">
                              <Layers className="w-3.5 h-3.5" /> Akumulasi Status Modul (Total Registrasi: {registeredModuleNames.length} Modul)
                            </span>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                              <div className="bg-white dark:bg-slate-950 p-2 rounded-lg border border-slate-150 dark:border-slate-850 flex flex-col justify-center items-center">
                                <span className="text-[9px] font-bold text-slate-500">Terimplementasi (Selesai)</span>
                                <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                                  {cl.moduleStatuses?.filter(m => m.status === "Selesai Implementasi").length || 0}
                                </span>
                              </div>
                              <div className="bg-white dark:bg-slate-950 p-2 rounded-lg border border-slate-150 dark:border-slate-850 flex flex-col justify-center items-center">
                                <span className="text-[9px] font-bold text-slate-500">Dalam Proses</span>
                                <span className="text-sm font-black text-amber-600 dark:text-amber-400">
                                  {cl.moduleStatuses?.filter(m => m.status !== "Selesai Implementasi").length || 0}
                                </span>
                              </div>
                              <div className="bg-white dark:bg-slate-950 p-2 rounded-lg border border-slate-150 dark:border-slate-850 flex flex-col justify-center items-center col-span-2 sm:col-span-1">
                                <span className="text-[9px] font-bold text-slate-500">Tidak Terimplementasi (Belum)</span>
                                <span className="text-sm font-black text-slate-600 dark:text-slate-400">
                                  {registeredModuleNames.length - (cl.moduleStatuses?.filter(m => m.status === "Selesai Implementasi").length || 0)}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Module Statuses Badges */}
                          {cl.moduleStatuses && cl.moduleStatuses.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/60">
                              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block mb-2">
                                Status Implementasi Per Modul:
                              </span>
                              <div className="flex flex-wrap gap-2">
                                {cl.moduleStatuses.map((m) => (
                                  <div 
                                    key={m.id} 
                                    className="text-xs bg-slate-100/60 dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-lg px-2.5 py-1.5 flex items-center gap-2"
                                  >
                                    <span className="font-bold text-slate-700 dark:text-slate-300">{m.modulName}:</span>
                                    <span className={`font-semibold px-2 py-0.5 rounded text-[10px] ${
                                      m.status === "Selesai Implementasi" ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50" :
                                      m.status.includes("UAT") || m.status.includes("Pending") || m.status.includes("Pelatihan") ? "bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900/50" :
                                      m.status.includes("Setting") || m.status.includes("Analisis") ? "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900/35" :
                                      "bg-slate-200/50 dark:bg-slate-850 text-slate-600 dark:text-slate-400"
                                    }`}>
                                      {m.status}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-2 self-end md:self-center border-t border-slate-100 dark:border-slate-900 md:border-none pt-3 md:pt-0">
                          <button
                            type="button"
                            onClick={() => {
                              if (expandedModuleClientId === cl.id) {
                                setExpandedModuleClientId(null);
                              } else {
                                setExpandedModuleClientId(cl.id);
                                const clientImplemented = cl.moduleStatuses?.map(ms => ms.modulName) || [];
                                const available = registeredModuleNames.filter(name => !clientImplemented.includes(name));
                                setAddModulName(available[0] || "");
                                setAddModulStatus(statusImplementasiList[0] || "");
                              }
                            }}
                            className={`p-2 h-8.5 rounded-lg border transition-all text-xs font-bold flex items-center gap-1.5 cursor-pointer ${
                              expandedModuleClientId === cl.id 
                                ? "bg-blue-600 border-blue-500 text-white shadow-md shadow-blue-600/30" 
                                : "bg-slate-105 border-slate-200 dark:bg-slate-900 dark:border-slate-850 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                            }`}
                            title="Kelola Modul & Status Implementasi"
                          >
                            <FileCheck className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Kelola Status Modul</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => startEdit(cl)}
                            className="bg-slate-100 border border-slate-200 hover:bg-slate-200 dark:bg-slate-900 dark:border-slate-850 dark:hover:bg-slate-800 p-2 rounded-lg text-slate-655 dark:text-slate-300 transition-all hover:text-slate-900 dark:hover:text-white cursor-pointer"
                            title="Edit"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          {!isUserScoped && (
                            <button
                              type="button"
                              onClick={async () => {
                                if (confirm(`Apakah Anda yakin ingin menghapus data Client ${cl.namaRS}?`)) {
                                  await onDeleteClient(cl.id);
                                }
                              }}
                              className="bg-red-950/20 hover:bg-red-900/30 border border-red-900/40 p-2 rounded-lg text-red-400 transition-all active:scale-95"
                              title="Hapus"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Dynamic Manage Module Statuses Drawer */}
                      {expandedModuleClientId === cl.id && (
                        <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl space-y-4">
                          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                            <div className="flex items-center gap-1.5 text-xs font-black text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                              <Building2 className="w-4 h-4 text-blue-500" />
                              <span>Kelola Status Implementasi Modul</span>
                            </div>
                            <button 
                              type="button"
                              onClick={() => setExpandedModuleClientId(null)} 
                              className="text-slate-400 dark:text-slate-500 hover:text-slate-950 dark:hover:text-white text-xs font-bold cursor-pointer"
                            >
                              Tutup
                            </button>
                          </div>

                          {/* List of active tracking modules styled exactly like Registrasi Modul SIMRS */}
                          <div className="space-y-3">
                            {!cl.moduleStatuses || cl.moduleStatuses.length === 0 ? (
                              <p className="text-xs text-slate-500 italic font-medium">Belum ada pemantauan status per modul untuk RS ini.</p>
                            ) : (
                              <div className="flex flex-col gap-4 pb-2">
                                {cl.moduleStatuses.map((m) => {
                                  const masterModule = appModules?.find(x => x.name === m.modulName);
                                  const status = m.status;
                                  const amNo = masterModule?.noModul || "001";
                                  const jenisMod = masterModule?.jenisModul || masterModule?.type || "Modul Utama";
                                  const jenisApp = masterModule?.jenisAplikasiModul || "Web";
                                  const platformMod = masterModule?.platformModul || "Web";
                                  const isEditingThisModule = editingModuleStatusId === m.id;

                                  return (
                                    <div 
                                      key={m.id}
                                      className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl overflow-hidden shadow-xs transition-all p-5 space-y-4 hover:border-slate-300 dark:hover:border-slate-800"
                                    >
                                      {/* Header metadata badges (Matches design in Registrasi Modul SIMRS) */}
                                      <div className="flex flex-wrap items-center gap-2 text-[9px] font-mono font-bold">
                                        <span className="bg-slate-100 dark:bg-slate-900 text-slate-650 dark:text-slate-300 px-2 py-0.5 rounded border border-slate-250 dark:border-slate-800">
                                          {jenisMod}
                                        </span>
                                        <span className="bg-indigo-50 dark:bg-indigo-950/40 text-indigo-650 dark:text-indigo-400 px-2 py-0.5 rounded border border-indigo-150/40">
                                          App: {jenisApp}
                                        </span>
                                        <span className="bg-amber-50 dark:bg-amber-950/40 text-amber-650 dark:text-amber-400 px-2 py-0.5 rounded border border-amber-150/40">
                                          Platform: {platformMod}
                                        </span>
                                        {masterModule?.pic && (
                                          <span className="text-slate-450 dark:text-slate-500 font-sans">
                                            PIC Master: {masterModule.pic}
                                          </span>
                                        )}
                                      </div>

                                      {/* Module Title row */}
                                      <div className="flex items-start justify-between gap-2">
                                        <h4 className="text-sm font-black text-slate-801 dark:text-slate-100 flex flex-wrap items-center gap-2 leading-tight">
                                          <span className="bg-emerald-600/10 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 px-1.5 py-0.5 rounded font-mono font-black border border-emerald-500/10 text-[10px]">
                                            NO.{amNo}
                                          </span>
                                          <Code className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> 
                                          <span className="truncate">{m.modulName}</span>
                                        </h4>
                                        
                                        <button
                                          type="button"
                                          onClick={() => handleDeleteModuleStatus(cl, m.id)}
                                          className="p-1 px-1.5 text-slate-400 hover:text-red-450 rounded hover:bg-slate-100 dark:hover:bg-slate-900 transition-all cursor-pointer flex items-center gap-1 text-[10px] font-bold border border-transparent hover:border-red-200/40 shrink-0"
                                          title="Hapus Pemantauan"
                                        >
                                          <Trash2 className="w-3 h-3 text-red-555" /> Hapus
                                        </button>
                                      </div>

                                      {/* Submodules features list metadata if any */}
                                      {masterModule && masterModule.subModules && masterModule.subModules.length > 0 && (
                                        <div className="bg-slate-50 dark:bg-slate-900/60 p-2 rounded-lg border border-slate-100 dark:border-slate-850/50 text-[10px] text-slate-700 dark:text-slate-350 space-y-1">
                                          <div className="font-bold flex items-center gap-1">
                                            <Layers className="w-3 h-3 text-indigo-500" />
                                            <span>Rincian Fitur Utama ({masterModule.subModules.length}):</span>
                                          </div>
                                          <div className="flex flex-wrap gap-1.5 pt-0.5">
                                            {masterModule.subModules.slice(0, 4).map((sub, sIdx) => (
                                              <span key={sub.id || sIdx} className="bg-slate-100 dark:bg-slate-800 text-[9px] px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-400 font-mono">
                                                #{sub.noFeature || String(sIdx + 1).padStart(3, "0")} {sub.name}
                                              </span>
                                            ))}
                                            {masterModule.subModules.length > 4 && (
                                              <span className="text-[9px] text-slate-400 self-center font-bold">+{masterModule.subModules.length - 4} lainnya</span>
                                            )}
                                          </div>
                                        </div>
                                      )}

                                      {/* Implementasi inputs or Read-Only display with locker */}
                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-100 dark:border-slate-850">
                                        {isEditingThisModule ? (
                                          <>
                                            <div>
                                              <label className="block text-[9px] text-slate-500 dark:text-slate-400 font-bold uppercase mb-1">📅 Tanggal Implementasi</label>
                                              <input
                                                type="date"
                                                value={tempTanggal}
                                                onChange={(e) => setTempTanggal(e.target.value)}
                                                className="w-full bg-slate-50 dark:bg-slate-900 border border-blue-500 text-slate-800 dark:text-slate-200 text-xs rounded-lg px-2.5 py-1 focus:outline-none focus:border-blue-500 font-mono font-bold"
                                              />
                                            </div>

                                            <div>
                                              <label className="block text-[9px] text-slate-500 dark:text-slate-400 font-bold uppercase mb-1">🏁 Status Implementasi</label>
                                              <select
                                                value={tempStatus}
                                                onChange={(e) => setTempStatus(e.target.value)}
                                                className="w-full bg-slate-50 dark:bg-slate-900 border border-blue-505 dark:border-blue-500 text-slate-850 dark:text-slate-200 text-xs rounded-lg px-2.5 py-1 focus:outline-none focus:border-blue-500 font-extrabold"
                                              >
                                                {statusImplementasiList.map((st) => (
                                                  <option key={st} value={st}>{st}</option>
                                                ))}
                                              </select>
                                            </div>
                                          </>
                                        ) : (
                                          <>
                                            <div>
                                              <span className="block text-[9px] text-slate-500 dark:text-slate-400 font-bold uppercase mb-1">📅 Tanggal Implementasi</span>
                                              <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-900 px-2.5 py-1 rounded inline-block">
                                                {m.tanggalImplementasi || "Belum Ditentukan"}
                                              </span>
                                            </div>

                                            <div>
                                              <span className="block text-[9px] text-slate-500 dark:text-slate-400 font-bold uppercase mb-1">🏁 Status Implementasi</span>
                                              <span className={`inline-block font-extrabold px-3 py-1 rounded text-xs border ${
                                                m.status === "Selesai Implementasi" ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50" :
                                                m.status.includes("UAT") || m.status.includes("Pending") || m.status.includes("Pelatihan") ? "bg-blue-50 dark:bg-blue-950/40 text-blue-650 dark:text-blue-400 border-blue-200 dark:border-blue-900/50" :
                                                m.status.includes("Setting") || m.status.includes("Analisis") ? "bg-amber-50 dark:bg-amber-950/40 text-amber-655 dark:text-amber-400 border-amber-200 dark:border-amber-900/35" :
                                                "bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200"
                                              }`}>
                                                {m.status}
                                              </span>
                                            </div>
                                          </>
                                        )}
                                      </div>

                                      <div className="flex items-center justify-between text-[8px] text-slate-400 mt-2 dark:text-slate-500 pt-1 border-t border-slate-100/50 dark:border-slate-900/50">
                                        <div className="flex items-center gap-3">
                                          <span>Last update: {new Date(m.updatedAt || "").toLocaleString("id-ID")}</span>
                                          {masterModule?.url && (
                                            <a 
                                              href={masterModule.url} 
                                              target="_blank" 
                                              rel="noreferrer"
                                              className="text-[9px] text-blue-505 hover:underline flex items-center gap-0.5 font-bold"
                                            >
                                              <Globe className="w-2.5 h-2.5 text-blue-500" /> URL Modul
                                            </a>
                                          )}
                                        </div>

                                        <div className="flex items-center gap-1.5">
                                          {isEditingThisModule ? (
                                            <>
                                              <button
                                                type="button"
                                                onClick={async () => {
                                                  await handleUpdateModuleStatusValue(cl, m.id, tempStatus, tempTanggal);
                                                  setEditingModuleStatusId(null);
                                                }}
                                                className="px-2.5 py-0.5 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-[9px] rounded transition-all cursor-pointer active:scale-95"
                                              >
                                                Simpan
                                              </button>
                                              <button
                                                type="button"
                                                onClick={() => setEditingModuleStatusId(null)}
                                                className="px-2.5 py-0.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-[9px] rounded transition-all cursor-pointer"
                                              >
                                                Batal
                                              </button>
                                            </>
                                          ) : (
                                            <button
                                              type="button"
                                              onClick={() => {
                                                setEditingModuleStatusId(m.id);
                                                setTempStatus(m.status);
                                                setTempTanggal(m.tanggalImplementasi || "");
                                              }}
                                              className="px-2.5 py-0.5 border border-slate-250 hover:bg-slate-100 dark:border-slate-800 dark:hover:bg-slate-900 text-blue-600 dark:text-blue-400 font-extrabold text-[9px] rounded transition-all flex items-center gap-1 active:scale-95 cursor-pointer"
                                            >
                                              <Pencil className="w-2 h-2 text-blue-500" /> Ubah
                                            </button>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>

                          {/* Inline form to Add monitoring (Includes Tanggal Implementasi input field as requested) */}
                          <div className="bg-white dark:bg-slate-950 p-4 rounded-lg border border-slate-200 dark:border-slate-850 space-y-3">
                            <h4 className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider">Mulai Pantau Modul Baru</h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                              <div>
                                <label className="block text-[9px] text-slate-500 dark:text-slate-400 font-bold uppercase mb-1">Pilih Modul SIMRS</label>
                                <select
                                  value={addModulName}
                                  onChange={(e) => setAddModulName(e.target.value)}
                                  className="w-full bg-slate-50 dark:bg-slate-905 border border-slate-200 dark:border-slate-800 text-xs text-slate-880 dark:text-slate-200 rounded-md px-2.5 py-1.5 focus:outline-none focus:border-blue-500 font-medium"
                                >
                                  {(() => {
                                    const clientImplemented = cl.moduleStatuses?.map(ms => ms.modulName) || [];
                                    const available = registeredModuleNames.filter(name => !clientImplemented.includes(name));
                                    if (registeredModuleNames.length === 0) {
                                      return <option value="">-- Daftarkan Modul di "Registrasi Modul SIMRS" Terlebih Dahulu --</option>;
                                    }
                                    if (available.length === 0) {
                                      return <option value="">-- Semua modul terdaftar sudah dipantau --</option>;
                                    }
                                    return available.map((m) => (
                                      <option key={m} value={m}>{m}</option>
                                    ));
                                  })()}
                                </select>
                              </div>

                              <div>
                                <label className="block text-[9px] text-slate-500 dark:text-slate-400 font-bold uppercase mb-1">Status Implementasi Awal</label>
                                <select
                                  value={addModulStatus}
                                  onChange={(e) => setAddModulStatus(e.target.value)}
                                  className="w-full bg-slate-50 dark:bg-slate-905 border border-slate-200 dark:border-slate-800 text-xs text-slate-880 dark:text-slate-200 rounded-md px-2.5 py-1.5 focus:outline-none focus:border-blue-500 font-medium"
                                >
                                  {statusImplementasiList.map((st) => (
                                    <option key={st} value={st}>{st}</option>
                                  ))}
                                </select>
                              </div>

                              <div>
                                <label className="block text-[9px] text-slate-500 dark:text-slate-400 font-bold uppercase mb-1">📅 Tanggal Implementasi</label>
                                <input
                                  type="date"
                                  value={addModulTanggal}
                                  onChange={(e) => setAddModulTanggal(e.target.value)}
                                  className="w-full bg-slate-50 dark:bg-slate-905 border border-slate-200 dark:border-slate-800 text-xs text-slate-880 dark:text-slate-200 rounded-md px-2.5 py-1.5 focus:outline-none focus:border-blue-500 font-medium"
                                />
                              </div>
                            </div>

                            <div className="flex justify-end pt-1">
                              {(() => {
                                const clientImplemented = cl.moduleStatuses?.map(ms => ms.modulName) || [];
                                const available = registeredModuleNames.filter(name => !clientImplemented.includes(name));
                                return (
                                  <button
                                    type="button"
                                    onClick={() => handleAddModuleStatus(cl)}
                                    disabled={available.length === 0}
                                    className="bg-blue-600 hover:bg-blue-500 disabled:bg-slate-200 disabled:dark:bg-slate-900 disabled:text-slate-400 text-white text-xs font-bold px-4 py-1.5 rounded-md transition-all shadow-md shadow-blue-500/10 cursor-pointer active:scale-95"
                                  >
                                    Tambah Modul Implementasi
                                  </button>
                                );
                              })()}
                            </div>
                          </div>
                        </div>
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
  );
}
