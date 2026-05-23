import React, { useState } from "react";
import { AppModule, SubModule, Client, Project, User } from "../types";
import { 
  Cpu, 
  Plus, 
  Trash2, 
  Layers, 
  Calendar, 
  User as UserIcon, 
  ChevronDown, 
  ChevronUp, 
  CornerDownRight, 
  Code, 
  Edit, 
  Building2, 
  CheckCircle2, 
  Hourglass,
  ListPlus,
  Play,
  Search
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface ApplicationModulesViewProps {
  appModules: AppModule[];
  clients: Client[];
  projects: Project[];
  currentUser: User | null;
  onAddModule: (module: Partial<AppModule>) => Promise<void>;
  onUpdateModule: (id: string, module: Partial<AppModule>) => Promise<void>;
  onDeleteModule: (id: string) => Promise<void>;
}

export default function ApplicationModulesView({
  appModules,
  clients,
  projects,
  currentUser,
  onAddModule,
  onUpdateModule,
  onDeleteModule
}: ApplicationModulesViewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterProject, setFilterProject] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [expandedModuleIds, setExpandedModuleIds] = useState<Record<string, boolean>>({});

  // Modal control
  const [isOpen, setIsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState("");

  // AppModule form states
  const [projectName, setProjectName] = useState("");
  const [name, setName] = useState("");
  const [type, setType] = useState("");
  const [implementationStatus, setImplementationStatus] = useState("Not Started");
  const [implementationDate, setImplementationDate] = useState("");
  const [pic, setPic] = useState("");

  // SubModules in form state
  const [subModules, setSubModules] = useState<SubModule[]>([]);

  // Temp sub-module creation states
  const [subName, setSubName] = useState("");
  const [subDesc, setSubDesc] = useState("");
  const [subStart, setSubStart] = useState("");
  const [subEnd, setSubEnd] = useState("");
  const [subStatus, setSubStatus] = useState("In Progress");

  // Dynamic references
  const projectList = projects.map(p => p.nama);
  const hospitalList = clients.map(c => c.namaRS);
  const allRefs = Array.from(new Set([...projectList, ...hospitalList, "Global Module"]));

  const toggleExpand = (id: string) => {
    setExpandedModuleIds(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleOpenNew = () => {
    setProjectName(allRefs[0] || "Global Module");
    setName("");
    setType("Core SIMRS");
    setImplementationStatus("Not Started");
    setImplementationDate(new Date().toISOString().slice(0, 10));
    setPic(currentUser?.name || "");
    setSubModules([]);
    
    // clear sub module temp form
    setSubName("");
    setSubDesc("");
    setSubStart("");
    setSubEnd("");
    setSubStatus("In Progress");

    setIsEditing(false);
    setIsOpen(true);
  };

  const handleOpenEdit = (am: AppModule) => {
    setProjectName(am.projectName || allRefs[0] || "Global Module");
    setName(am.name || "");
    setType(am.type || "Core SIMRS");
    setImplementationStatus(am.implementationStatus || "In Progress");
    setImplementationDate(am.implementationDate || "");
    setPic(am.pic || "");
    setSubModules(am.subModules || []);
    setEditId(am.id);

    // clear sub module temp form
    setSubName("");
    setSubDesc("");
    setSubStart("");
    setSubEnd("");
    setSubStatus("In Progress");

    setIsEditing(true);
    setIsOpen(true);
  };

  // Add sub-module to list inside form
  const handleAddSubModuleToForm = () => {
    if (!subName.trim()) {
      alert("Nama Sub Modul wajib diisi!");
      return;
    }
    const newSub: SubModule = {
      id: "sub-" + Math.random().toString(36).slice(2, 9),
      name: subName,
      featureDesc: subDesc,
      startDate: subStart || new Date().toISOString().slice(0, 10),
      endDate: subEnd || new Date().toISOString().slice(0, 10),
      status: subStatus
    };
    setSubModules(prev => [...prev, newSub]);
    
    // reset temp inputs
    setSubName("");
    setSubDesc("");
    setSubStart("");
    setSubEnd("");
    setSubStatus("In Progress");
  };

  const handleRemoveSubFromForm = (subId: string) => {
    setSubModules(prev => prev.filter(s => s.id !== subId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert("Nama Modul Utama wajib diisi!");
      return;
    }

    const payload: Partial<AppModule> = {
      projectName,
      name,
      type,
      implementationStatus,
      implementationDate,
      pic,
      subModules
    };

    if (isEditing) {
      await onUpdateModule(editId, payload);
    } else {
      await onAddModule(payload);
    }
    setIsOpen(false);
  };

  const filteredModules = appModules.filter(am => {
    const matchesSearch = 
      am.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      am.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      am.pic.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesProject = !filterProject || am.projectName === filterProject;
    const matchesStatus = !filterStatus || am.implementationStatus === filterStatus;

    return matchesSearch && matchesProject && matchesStatus;
  });

  // Calculations for KPI badge counts
  const totalMod = appModules.length;
  const goLiveMod = appModules.filter(m => m.implementationStatus === "Go-Live" || m.implementationStatus === "Go-Live / Stabil" || m.implementationStatus === "Stabil").length;
  const inProgMod = appModules.filter(m => m.implementationStatus === "In Progress" || m.implementationStatus === "Pilot Launching").length;

  return (
    <div className="space-y-6 animate-fadeIn font-sans pb-10" id="appmodules-view-container">
      {/* Header section with Stats Card */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Cpu className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            <h1 className="text-xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Modul SIMRS & Versi Aplikasi</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">Mengelola modul, sub-modul riil SIMRS, cakupan fitur, PIC, status, dan estimasi rilis produk.</p>
        </div>

        {currentUser?.role !== "Client" && (
          <button
            onClick={handleOpenNew}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-md hover:shadow-lg transition-all"
          >
            <Plus className="w-4 h-4" /> Registrasi Modul Baru
          </button>
        )}
      </div>

      {/* Brief Summary Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-slate-50 dark:bg-slate-800 text-emerald-500 flex items-center justify-center">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 uppercase font-black">Registrasi Modul SIMRS</p>
            <p className="text-xl font-black text-slate-800 dark:text-white">{totalMod} Modul Utama</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 uppercase font-black">Modul Go-Live / Stabil</p>
            <p className="text-xl font-black text-emerald-600 dark:text-emerald-400">{goLiveMod} Modul</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950/20 text-blue-500 flex items-center justify-center">
            <Hourglass className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 uppercase font-black">Modul Dalam Pengerjaan</p>
            <p className="text-xl font-black text-blue-600 dark:text-blue-400">{inProgMod} Sedang Berjalan</p>
          </div>
        </div>
      </div>

      {/* Control panel for filters */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-wrap gap-3 items-center justify-between">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Cari modul, jenis, atau PIC..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 pr-4 py-1.5 w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs"
          />
        </div>

        <div className="flex flex-wrap gap-2.5 items-center">
          <select
            value={filterProject}
            onChange={(e) => setFilterProject(e.target.value)}
            className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 py-1.5 px-3 rounded-lg text-xs font-semibold"
          >
            <option value="">Semua RS / Project Reference</option>
            {allRefs.map(ref => <option key={ref} value={ref}>{ref}</option>)}
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 py-1.5 px-3 rounded-lg text-xs font-semibold"
          >
            <option value="">Semua Status</option>
            <option value="Not Started">Not Started</option>
            <option value="In Progress">In Progress</option>
            <option value="Pilot Launching">Pilot Launching</option>
            <option value="Go-Live">Go-Live / Stabil</option>
          </select>
        </div>
      </div>

      {/* Module versioning Accordion List */}
      <div className="space-y-4">
        {filteredModules.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
            <Cpu className="w-12 h-12 text-slate-350 mx-auto mb-3 opacity-30" />
            <p className="text-sm font-black text-slate-700 dark:text-slate-350">Belum ada modul versi aplikasi</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">Daftarkan modul utama beserta sub-modul anak yang diimplementasikan di RS terkait.</p>
          </div>
        ) : (
          filteredModules.map(am => {
            const isExpanded = !!expandedModuleIds[am.id];
            const childrenCount = am.subModules?.length || 0;
            return (
              <div 
                key={am.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs transition-all hover:border-slate-350 dark:hover:border-slate-700"
              >
                {/* Accordion Trigger Header */}
                <div 
                  className={`p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer select-none transition-colors ${isExpanded ? "bg-slate-50 dark:bg-slate-950/40" : ""}`}
                  onClick={() => toggleExpand(am.id)}
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2 text-[9px] font-mono font-bold">
                      <span className="bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/40 px-2.5 py-0.5 rounded-full uppercase tracking-wider font-extrabold">
                        {am.projectName}
                      </span>
                      <span className="bg-slate-100 dark:bg-slate-850 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded">
                        {am.type || "Core Modul"}
                      </span>
                      {am.createdBy && (
                        <span className="bg-indigo-50 dark:bg-indigo-950/45 border border-indigo-100/30 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-md flex items-center gap-1 font-sans">
                          🧑‍💻 Input: {am.createdBy}
                        </span>
                      )}
                      <span className="text-slate-400 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" /> Tanggal: {am.implementationDate || "-"}
                      </span>
                    </div>

                    <h3 className="text-base font-black text-slate-800 dark:text-slate-100 mt-2 tracking-tight flex items-center gap-1.5 leading-snug">
                      <Code className="w-4 h-4 text-emerald-500" /> {am.name}
                    </h3>
                  </div>

                  <div className="flex items-center gap-3 md:self-center">
                    <div className="text-right text-xs">
                      <span className={`text-[10.5px] font-bold px-2.5 py-1 rounded-md border ${
                        am.implementationStatus === "Go-Live" || am.implementationStatus === "Go-Live / Stabil" || am.implementationStatus === "Stabil"
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                          : am.implementationStatus === "Pilot Launching"
                          ? "bg-purple-500/10 text-purple-400 border-purple-500/20"
                          : am.implementationStatus === "In Progress"
                          ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-850"
                      }`}>
                        {am.implementationStatus}
                      </span>
                    </div>

                    <div className="border-l border-slate-200 dark:border-slate-800 pl-3 h-8 flex items-center gap-1 shrink-0">
                      <span className="text-xs text-slate-450 font-bold bg-slate-100 dark:bg-slate-800/80 px-2 py-1 rounded">
                        {childrenCount} Sub-Modul
                      </span>

                      {currentUser?.role !== "Client" && (() => {
                        const canModify = !am.createdBy || am.createdBy === currentUser?.username || currentUser?.role === "Administrator";
                        return (
                          <div className="flex gap-0.5 ml-2 mr-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenEdit(am);
                              }}
                              disabled={!canModify}
                              className={`p-1 rounded ${
                                canModify 
                                  ? "text-slate-455 hover:text-emerald-500 hover:bg-slate-100 dark:hover:bg-slate-850 cursor-pointer" 
                                  : "text-slate-200 dark:text-slate-850 cursor-not-allowed opacity-35"
                              }`}
                              title={canModify ? "Edit Modul & Sub Modul" : `Hanya penginput (${am.createdBy}) yang boleh mengedit`}
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={async (e) => {
                                e.stopPropagation();
                                if (confirm(`Hapus master modul "${am.name}" berikut seluruh data sub-modul di dalamnya?`)) {
                                  await onDeleteModule(am.id);
                                }
                              }}
                              disabled={!canModify}
                              className={`p-1 rounded ${
                                canModify 
                                  ? "text-slate-455 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-850 cursor-pointer" 
                                  : "text-slate-200 dark:text-slate-850 cursor-not-allowed opacity-35"
                              }`}
                              title={canModify ? "Hapus Modul" : `Hanya penginput (${am.createdBy}) yang boleh menghapus`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        );
                      })()}

                      {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                    </div>
                  </div>
                </div>

                {/* Relational Table child view */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="border-t border-slate-150 dark:border-slate-805 bg-slate-50/50 dark:bg-slate-950/20 p-5 space-y-4"
                    >
                      <div className="flex justify-between items-center text-xs font-bold text-slate-400 uppercase tracking-wider">
                        <span className="flex items-center gap-1.5">
                          <CornerDownRight className="w-4 h-4 text-emerald-500 shrink-0" />
                          Rincian Relasi Sub-Modul & Rentang Implementasi
                        </span>
                        <span className="text-[10px] text-slate-400 px-2 py-0.5 border border-slate-200 dark:border-slate-800 rounded">
                          PIC Modul: <strong className="text-slate-700 dark:text-slate-350">{am.pic || "-"}</strong>
                        </span>
                      </div>

                      {childrenCount === 0 ? (
                        <div className="text-center py-6 bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                          <p className="text-xs italic text-slate-400">Belum ada rincian sub-modul dipetakan untuk modul utama ini.</p>
                        </div>
                      ) : (
                        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead>
                              <tr className="bg-slate-50 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800 text-[10px] font-black text-slate-500 uppercase tracking-wider">
                                <th className="px-4 py-3">Nama Sub-Modul</th>
                                <th className="px-4 py-3">Keterangan Fitur</th>
                                <th className="px-4 py-3">Rentang Implementasi</th>
                                <th className="px-4 py-3 text-right">Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-medium">
                              {am.subModules?.map(sub => (
                                <tr key={sub.id} className="hover:bg-slate-50/55 dark:hover:bg-slate-850/20">
                                  <td className="px-4 py-3 font-semibold text-slate-850 dark:text-slate-200">
                                    {sub.name}
                                  </td>
                                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400 max-w-xs leading-relaxed font-normal">
                                    {sub.featureDesc || "-"}
                                  </td>
                                  <td className="px-4 py-3 font-mono text-[11px] text-slate-550 dark:text-slate-400 whitespace-nowrap">
                                    {sub.startDate || "-"} s/d {sub.endDate || "-"}
                                  </td>
                                  <td className="px-4 py-3 text-right">
                                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                                      sub.status === "Selesai" || sub.status === "Done" || sub.status === "Go-Live"
                                        ? "bg-emerald-950/15 text-emerald-400 border-emerald-900/40"
                                        : sub.status === "Selesai Sebagian"
                                        ? "bg-amber-950/15 text-amber-400 border-amber-900/40"
                                        : "bg-blue-950/15 text-blue-400 border-blue-900/40"
                                    }`}>
                                      {sub.status}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })
        )}
      </div>

      {/* Dynamic AppModule Creator Modal */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl w-full max-w-2xl p-6 space-y-4 max-h-[92vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
                <div>
                  <h3 className="font-bold text-base text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Cpu className="w-5 h-5 text-emerald-500 shrink-0" /> {isEditing ? "Perbarui Modul & Sub Modul" : "Registrasi Master Modul SIMRS"}
                  </h3>
                  <p className="text-xs text-slate-450-g">Daftarkan modul utama beserta sub-modul anak, fungsi kustom, dan rentang tanggal implementasi.</p>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-slate-400 hover:text-slate-650 dark:hover:text-slate-250 text-xl font-bold"
                >
                  &times;
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 text-xs font-semibold">
                
                {/* Modul Utama Grid */}
                <div className="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-950/40 p-4 border border-slate-100 dark:border-slate-800/80 rounded-xl">
                  <div className="col-span-2 text-[10.5px] font-black uppercase text-slate-450 tracking-wider">
                    Definisi Modul Tingkat Atas (Parent)
                  </div>

                  <div className="flex flex-col gap-1 col-span-2 md:col-span-1">
                    <label className="text-[10px] text-slate-500 uppercase tracking-widest">Site / Project Acuan *</label>
                    <select
                      value={projectName}
                      onChange={(e) => setProjectName(e.target.value)}
                      className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 py-2 px-3 rounded-lg text-slate-800 dark:text-slate-200"
                    >
                      {allRefs.map(ref => <option key={ref} value={ref}>{ref}</option>)}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1 col-span-2 md:col-span-1">
                    <label className="text-[10px] text-slate-500 uppercase tracking-widest">Nama Modul SIMRS Pelayanan *</label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Modul Rekam Medis (RME)"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 py-2 px-3 rounded-lg text-slate-800 dark:text-slate-100 font-bold"
                    />
                  </div>

                  <div className="flex flex-col gap-1 col-span-2 md:col-span-1">
                    <label className="text-[10px] text-slate-400 uppercase tracking-widest">Jenis Kelompok Modul</label>
                    <input
                      type="text"
                      placeholder="Contoh: Core SIMRS, Integrasi Eksternal, Backoffice"
                      value={type}
                      onChange={(e) => setType(e.target.value)}
                      className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 py-2 px-3 rounded-lg text-slate-800 dark:text-slate-100"
                    />
                  </div>

                  <div className="flex flex-col gap-1 col-span-2 md:col-span-1">
                    <label className="text-[10px] text-slate-500 uppercase tracking-widest">PIC Implementator / Lead</label>
                    <input
                      type="text"
                      placeholder="Nama PIC tim pelaksana"
                      value={pic}
                      onChange={(e) => setPic(e.target.value)}
                      className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 py-2 px-3 rounded-lg text-slate-800 dark:text-slate-100"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-slate-500 uppercase tracking-widest">Status Implementasi Modul</label>
                    <select
                      value={implementationStatus}
                      onChange={(e) => setImplementationStatus(e.target.value)}
                      className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 py-2 px-3 rounded-lg text-slate-800 dark:text-slate-200 font-bold"
                    >
                      <option value="Not Started">Not Started</option>
                      <option value="In Progress">In Progress (Developing)</option>
                      <option value="Pilot Launching">Pilot Launching (Sosialisasi)</option>
                      <option value="Go-Live">Go-Live / Stabil</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-slate-500 uppercase tracking-widest">Tanggal Implementasi</label>
                    <input
                      type="date"
                      value={implementationDate}
                      onChange={(e) => setImplementationDate(e.target.value)}
                      className="bg-white dark:bg-slate-955 border border-slate-200 dark:border-slate-805 py-2 px-3 rounded-lg text-slate-800 dark:text-slate-200"
                    />
                  </div>
                </div>

                {/* RELATIONAL CHILD (SUB-MODULES) GENERATOR SECTION */}
                <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-4">
                  <div className="flex items-center gap-1.5 text-[10.5px] font-black text-slate-500 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800/80 pb-2">
                    <ListPlus className="w-4 h-4 text-emerald-500" />
                    Penyusunan Sub-Modul Anak (Relasional Set)
                  </div>

                  {/* Sub module temporary insertion mini form */}
                  <div className="grid grid-cols-1 md:grid-cols-6 gap-2 bg-slate-50/50 dark:bg-slate-950/20 p-3 rounded-lg border border-slate-100 dark:border-slate-850">
                    <div className="md:col-span-2">
                      <label className="text-[9px] uppercase font-bold text-slate-500 block mb-0.5">Nama Sub-Modul</label>
                      <input
                        type="text"
                        placeholder="e.g. Modul Rawat Darurat"
                        value={subName}
                        onChange={(e) => setSubName(e.target.value)}
                        className="w-full bg-white dark:bg-slate-950 border border-slate-250 dark:border-slate-800 py-1.5 px-2.5 rounded-md text-slate-800 dark:text-slate-100 text-xs"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="text-[9px] uppercase font-bold text-slate-500 block mb-0.5">Uraian Fitur / Cakupan</label>
                      <input
                        type="text"
                        placeholder="e.g. Triase, Assessment, SOAP"
                        value={subDesc}
                        onChange={(e) => setSubDesc(e.target.value)}
                        className="w-full bg-white dark:bg-slate-950 border border-slate-250 dark:border-slate-800 py-1.5 px-2.5 rounded-md text-slate-800 dark:text-slate-100 text-xs"
                      />
                    </div>

                    <div>
                      <label className="text-[9px] uppercase font-bold text-slate-500 block mb-0.5">Siklus Mulai</label>
                      <input
                        type="date"
                        value={subStart}
                        onChange={(e) => setSubStart(e.target.value)}
                        className="w-full bg-white dark:bg-slate-955 border border-slate-250 dark:border-slate-805 py-1 px-1.5 rounded-md text-slate-800 dark:text-slate-200 text-xs"
                      />
                    </div>

                    <div>
                      <label className="text-[9px] uppercase font-bold text-slate-500 block mb-0.5">Siklus Selesai</label>
                      <input
                        type="date"
                        value={subEnd}
                        onChange={(e) => setSubEnd(e.target.value)}
                        className="w-full bg-white dark:bg-slate-955 border border-slate-250 dark:border-slate-805 py-1 px-1.5 rounded-md text-slate-800 dark:text-slate-200 text-xs"
                      />
                    </div>

                    <div className="md:col-span-3">
                      <label className="text-[9px] uppercase font-bold text-slate-500 block mb-0.5">Status Target</label>
                      <select
                        value={subStatus}
                        onChange={(e) => setSubStatus(e.target.value)}
                        className="w-full bg-white dark:bg-slate-950 border border-slate-250 dark:border-slate-800 py-1.5 px-2.5 rounded-md text-slate-800 dark:text-slate-300 text-xs"
                      >
                        <option value="Dalam Pengerjaan">Dalam Pengerjaan</option>
                        <option value="Selesai Sebagian">Selesai Sebagian</option>
                        <option value="Selesai">Selesai</option>
                        <option value="Pending">Pending</option>
                      </select>
                    </div>

                    <div className="md:col-span-3 flex items-end">
                      <button
                        type="button"
                        onClick={handleAddSubModuleToForm}
                        className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg flex items-center justify-center gap-1 text-xs"
                      >
                        <Plus className="w-3.5 h-3.5" /> Tambah Sub-Modul ke List
                      </button>
                    </div>
                  </div>

                  {/* Temporary mapped sub-modules inside form state */}
                  <div className="space-y-1.5 max-h-[160px] overflow-y-auto">
                    {subModules.length === 0 ? (
                      <p className="text-center text-slate-400 italic py-3 bg-slate-50 dark:bg-slate-950/10 rounded-lg">Belum draf sub-modul yang dimasukkan.</p>
                    ) : (
                      subModules.map((sub, idx) => (
                        <div 
                          key={sub.id || idx}
                          className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800/80 p-2.5 rounded-lg flex items-center justify-between text-xs font-semibold gap-4"
                        >
                          <div className="min-w-0">
                            <p className="font-extrabold text-slate-800 dark:text-slate-250 truncate">{sub.name}</p>
                            <p className="text-[10px] text-slate-500 font-normal truncate mt-0.5">{sub.featureDesc || "Tanpa rincian fitur"}</p>
                          </div>
                          
                          <div className="flex items-center gap-3 shrink-0 text-right">
                            <span className="text-[10px] font-mono text-slate-450">
                              {sub.startDate} s/d {sub.endDate}
                            </span>
                            <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                              {sub.status}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRemoveSubFromForm(sub.id)}
                              className="text-red-400 hover:text-red-500 p-0.5 rounded"
                              title="Hapus sub-modul ini"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Submits */}
                <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="px-4 py-2 border border-slate-250 dark:border-slate-800 text-slate-550 dark:text-slate-400 text-xs font-semibold rounded-lg hover:bg-slate-50"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-md transition-all flex items-center gap-1"
                  >
                    <CheckCircle2 className="w-4 h-4" /> {isEditing ? "Perbarui Modul & Sub-Modul" : "Simpan Master Modul SIMRS"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
