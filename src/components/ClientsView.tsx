import React, { useState } from "react";
import { Client } from "../types";
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
  FileText
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
}

export default function ClientsView({
  clients = [],
  onAddClient,
  onUpdateClient,
  onDeleteClient,
  tipeMedikaList = ["Rumah Sakit", "Klinik Utama", "Klinik Pratama", "Puskesmas", "Laboratorium"],
  jenisModulList = ["Modul Utama", "Modul Integrasi", "Modul Penunjang", "Modul Pelaporan / Dashboard"],
  statusImplementasiList = ["Belum Mulai", "Analisis Fit & Gap", "Instalasi / Setting", "Pelatihan User", "Pendampingan UAT", "Selesai Implementasi"]
}: ClientsViewProps) {
  
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

  // Edit Client State
  const [editClient, setEditClient] = useState<Client | null>(null);
  const [editNamaRS, setEditNamaRS] = useState("");
  const [editNoKSO, setEditNoKSO] = useState("");
  const [editDirekturRS, setEditDirekturRS] = useState("");
  const [editModulSIMRS, setEditModulSIMRS] = useState("");
  const [editTanggalProject, setEditTanggalProject] = useState("");
  const [editTanggalCutOff, setEditTanggalCutOff] = useState("");
  const [editTipeMedika, setEditTipeMedika] = useState("");

  // Module Status Management
  const [expandedModuleClientId, setExpandedModuleClientId] = useState<string | null>(null);
  const [addModulName, setAddModulName] = useState(jenisModulList[0] || "");
  const [addModulStatus, setAddModulStatus] = useState(statusImplementasiList[0] || "");

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
      updatedAt: new Date().toISOString()
    };
    const updated = [...currentStatuses, newItem];
    await onUpdateClient(cl.id, { moduleStatuses: updated });
  }

  async function handleUpdateModuleStatusValue(cl: Client, id: string, nextStatus: string) {
    const currentStatuses = cl.moduleStatuses || [];
    const updated = currentStatuses.map(m => m.id === id ? { ...m, status: nextStatus, updatedAt: new Date().toISOString() } : m);
    await onUpdateClient(cl.id, { moduleStatuses: updated });
  }

  async function handleDeleteModuleStatus(cl: Client, id: string) {
    const currentStatuses = cl.moduleStatuses || [];
    const updated = currentStatuses.filter(m => m.id !== id);
    await onUpdateClient(cl.id, { moduleStatuses: updated });
  }

  async function handleCreateSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorText("");

    if (!namaRS.trim()) {
      setErrorText("Nama RS/Client wajib diisi!");
      return;
    }

    await onAddClient({
      namaRS: namaRS.trim(),
      noKSO: noKSO.trim(),
      direkturRS: direkturRS.trim(),
      modulSIMRS: modulSIMRS.trim(),
      tanggalProject,
      tanggalCutOff,
      tipeMedika
    });

    // Reset Form
    setNamaRS("");
    setNoKSO("");
    setDirekturRS("");
    setModulSIMRS("");
    setTanggalProject("");
    setTanggalCutOff("");
    setTipeMedika(tipeMedikaList[0] || "Rumah Sakit");
    setIsFormOpen(false);
  }

  async function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editClient) return;

    if (!editNamaRS.trim()) {
      alert("Nama RS/Client wajib diisi!");
      return;
    }

    await onUpdateClient(editClient.id, {
      namaRS: editNamaRS.trim(),
      noKSO: editNoKSO.trim(),
      direkturRS: editDirekturRS.trim(),
      modulSIMRS: editModulSIMRS.trim(),
      tanggalProject: editTanggalProject,
      tanggalCutOff: editTanggalCutOff,
      tipeMedika: editTipeMedika
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
  }

  const filteredClients = clients.filter(cl => 
    cl.namaRS.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (cl.noKSO || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (cl.direkturRS || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (cl.modulSIMRS || "").toLowerCase().includes(searchTerm.toLowerCase())
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
        <button
          onClick={() => setIsFormOpen(!isFormOpen)}
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-3 py-2 rounded-lg transition-all shadow-md shadow-blue-600/20 active:scale-95 cursor-pointer"
        >
          {isFormOpen ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
          {isFormOpen ? "Batal" : "Tambah Client RS"}
        </button>
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

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Direktur RS</label>
                  <input
                    type="text"
                    value={direkturRS}
                    onChange={(e) => setDirekturRS(e.target.value)}
                    placeholder="Nama & Gelar Direktur"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Modul SIMRS Ditugaskan</label>
                  <input
                    type="text"
                    value={modulSIMRS}
                    onChange={(e) => setModulSIMRS(e.target.value)}
                    placeholder="e.g. Front Office, Rawat Inap, Apotek, Antrean Mandiri"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-blue-500"
                  />
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

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Nama RS / Client</label>
                          <input
                            type="text"
                            required
                            value={editNamaRS}
                            onChange={(e) => setEditNamaRS(e.target.value)}
                            className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-blue-500"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Tipe Medika</label>
                          <select
                            value={editTipeMedika}
                            onChange={(e) => setEditTipeMedika(e.target.value)}
                            className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-blue-500"
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
                            className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-blue-500"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Direktur RS</label>
                          <input
                            type="text"
                            value={editDirekturRS}
                            onChange={(e) => setEditDirekturRS(e.target.value)}
                            className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-blue-500"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Modul SIMRS</label>
                          <input
                            type="text"
                            value={editModulSIMRS}
                            onChange={(e) => setEditModulSIMRS(e.target.value)}
                            className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-blue-500"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Tanggal Project</label>
                          <input
                            type="date"
                            value={editTanggalProject}
                            onChange={(e) => setEditTanggalProject(e.target.value)}
                            className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-blue-500"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Tanggal Cut-Off</label>
                          <input
                            type="date"
                            value={editTanggalCutOff}
                            onChange={(e) => setEditTanggalCutOff(e.target.value)}
                            className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-blue-500"
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
                              <UserCheck2 className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                              <span className="font-semibold text-slate-600 dark:text-slate-300">Direktur RS:</span>
                              <span className="text-slate-800 dark:text-slate-200">{cl.direkturRS || "-"}</span>
                            </div>

                            <div className="flex items-center gap-1.5 md:col-span-2">
                              <Building2 className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                              <span className="font-semibold text-slate-600 dark:text-slate-300">Modul SIMRS:</span>
                              <span className="text-slate-800 dark:text-slate-200">{cl.modulSIMRS || "-"}</span>
                            </div>

                            <div className="flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                              <span className="font-semibold text-slate-600 dark:text-slate-300">Tanggal Project:</span>
                              <span className="text-slate-800 dark:text-slate-300">{cl.tanggalProject || "-"}</span>
                            </div>

                            <div className="flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0" />
                              <span className="font-semibold text-slate-600 dark:text-slate-300">Cut Off:</span>
                              <span className="text-orange-600 dark:text-orange-400 font-bold">{cl.tanggalCutOff || "-"}</span>
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
                                setAddModulName(jenisModulList[0] || "");
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
                        </div>
                      </div>

                      {/* Dynamic Manage Module Statuses Drawer */}
                      {expandedModuleClientId === cl.id && (
                        <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl space-y-4">
                          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                            <div className="flex items-center gap-1.5 text-xs font-black text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                              <Building2 className="w-4 h-4 text-blue-500" />
                              <span>Konfigurasi Status Implementasi per Modul</span>
                            </div>
                            <button 
                              type="button"
                              onClick={() => setExpandedModuleClientId(null)} 
                              className="text-slate-400 dark:text-slate-500 hover:text-slate-950 dark:hover:text-white text-xs font-bold cursor-pointer"
                            >
                              Tutup
                            </button>
                          </div>

                          {/* List of active tracking modules */}
                          <div className="space-y-2">
                            {!cl.moduleStatuses || cl.moduleStatuses.length === 0 ? (
                              <p className="text-xs text-slate-500 italic font-medium">Belum ada pemantauan status per modul untuk RS ini.</p>
                            ) : (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pb-2">
                                {cl.moduleStatuses.map((m) => (
                                  <div key={m.id} className="flex items-center justify-between gap-3 bg-white dark:bg-slate-950 p-2.5 rounded-lg border border-slate-200 dark:border-slate-850">
                                    <div className="truncate">
                                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{m.modulName}</p>
                                      <p className="text-[9px] text-slate-500">Update: {new Date(m.updatedAt || "").toLocaleString("id-ID")}</p>
                                    </div>

                                    <div className="flex items-center gap-2 shrink-0">
                                      <select
                                        value={m.status}
                                        onChange={(e) => handleUpdateModuleStatusValue(cl, m.id, e.target.value)}
                                        className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-205 text-xs rounded-md px-1.5 py-1 focus:outline-none focus:border-blue-500"
                                      >
                                        {statusImplementasiList.map((st) => (
                                          <option key={st} value={st}>{st}</option>
                                        ))}
                                      </select>

                                      <button
                                        type="button"
                                        onClick={() => handleDeleteModuleStatus(cl, m.id)}
                                        className="p-1 text-slate-400 hover:text-red-400 rounded hover:bg-slate-100 dark:hover:bg-slate-900 transition-all cursor-pointer"
                                        title="Hapus Pemantauan"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Inline form to Add monitoring */}
                          <div className="bg-white dark:bg-slate-950 p-3 rounded-lg border border-slate-200 dark:border-slate-850 space-y-3">
                            <h4 className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider">Mulai Pantau Modul Baru</h4>
                            <div className="flex flex-col sm:flex-row items-end gap-3">
                              <div className="w-full sm:flex-1">
                                <label className="block text-[9px] text-slate-500 dark:text-slate-400 font-bold uppercase mb-1">Pilih Modul SIMRS</label>
                                <select
                                  value={addModulName}
                                  onChange={(e) => setAddModulName(e.target.value)}
                                  className="w-full bg-slate-50 dark:bg-slate-905 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 rounded-md px-2.5 py-1.5 focus:outline-none focus:border-blue-500 font-medium"
                                >
                                  {jenisModulList.map((m) => (
                                    <option key={m} value={m}>{m}</option>
                                  ))}
                                </select>
                              </div>

                              <div className="w-full sm:flex-1">
                                <label className="block text-[9px] text-slate-500 dark:text-slate-400 font-bold uppercase mb-1">Status Implementasi Awal</label>
                                <select
                                  value={addModulStatus}
                                  onChange={(e) => setAddModulStatus(e.target.value)}
                                  className="w-full bg-slate-50 dark:bg-slate-905 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 rounded-md px-2.5 py-1.5 focus:outline-none focus:border-blue-500 font-medium"
                                >
                                  {statusImplementasiList.map((st) => (
                                    <option key={st} value={st}>{st}</option>
                                  ))}
                                </select>
                              </div>

                              <button
                                type="button"
                                onClick={() => handleAddModuleStatus(cl)}
                                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 py-1.5 rounded-md transition-all shrink-0 h-8.5 cursor-pointer"
                              >
                                Tambah Modul
                              </button>
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
