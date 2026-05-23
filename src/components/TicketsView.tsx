import React, { useState } from "react";
import { Ticket, Client, Project, User } from "../types";
import { 
  LifeBuoy, 
  Plus, 
  Trash2, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Search, 
  Building, 
  User as UserIcon, 
  CornerDownRight, 
  SlidersHorizontal,
  X,
  Edit,
  Activity,
  FileCheck2
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface TicketsViewProps {
  tickets: Ticket[];
  clients: Client[];
  projects: Project[];
  currentUser: User | null;
  onAddTicket: (ticket: Partial<Ticket>) => Promise<void>;
  onUpdateTicket: (id: string, ticket: Partial<Ticket>) => Promise<void>;
  onDeleteTicket: (id: string) => Promise<void>;
}

export default function TicketsView({
  tickets,
  clients,
  projects,
  currentUser,
  onAddTicket,
  onUpdateTicket,
  onDeleteTicket
}: TicketsViewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterProject, setFilterProject] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  // Modal Control
  const [isOpen, setIsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState("");

  // Form states
  const [projectName, setProjectName] = useState("");
  const [reporterName, setReporterName] = useState("");
  const [unit, setUnit] = useState("");
  const [reportType, setReportType] = useState<"Request" | "Incident">("Incident");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("Open");
  const [priority, setPriority] = useState("Medium");

  // Dynamic references
  const projectList = projects.map(p => p.nama);
  const hospitalList = clients.map(c => c.namaRS);
  const allRefs = Array.from(new Set([...projectList, ...hospitalList, "Global / Umum"]));

  // Pre-fill initial form
  const handleOpenNew = () => {
    setProjectName(allRefs[0] || "Global / Umum");
    setReporterName(currentUser?.name || "");
    setUnit("");
    setReportType("Incident");
    setTitle("");
    setDescription("");
    setStatus("Open");
    setPriority("Medium");
    setIsEditing(false);
    setIsOpen(true);
  };

  const handleOpenEdit = (tk: Ticket) => {
    setProjectName(tk.projectName || allRefs[0] || "Global / Umum");
    setReporterName(tk.reporterName || "");
    setUnit(tk.unit || "");
    setReportType(tk.reportType || "Incident");
    setTitle(tk.title || "");
    setDescription(tk.description || "");
    setStatus(tk.status || "Open");
    setPriority(tk.priority || "Medium");
    setEditId(tk.id);
    setIsEditing(true);
    setIsOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reporterName.trim() || !unit.trim() || !title.trim()) {
      alert("Nama User, Unit, dan Judul Laporan wajib diisi!");
      return;
    }

    const payload: Partial<Ticket> = {
      projectName,
      reporterName,
      unit,
      reportType,
      title,
      description,
      status,
      priority
    };

    if (isEditing) {
      await onUpdateTicket(editId, payload);
    } else {
      await onAddTicket(payload);
    }
    setIsOpen(false);
  };

  // Calculations for stats widgets
  const total = tickets.length;
  const openCount = tickets.filter(t => t.status === "Open").length;
  const progressCount = tickets.filter(t => t.status === "In Progress").length;
  const resolvedCount = tickets.filter(t => t.status === "Resolved").length;
  const incidentCount = tickets.filter(t => t.reportType === "Incident").length;
  const requestCount = tickets.filter(t => t.reportType === "Request").length;

  // Search & Filter
  const filteredTickets = tickets.filter(t => {
    const matchesSearch = 
      t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.reporterName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.unit.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.description && t.description.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesProject = !filterProject || t.projectName === filterProject;
    const matchesType = !filterType || t.reportType === filterType;
    const matchesStatus = !filterStatus || t.status === filterStatus;

    return matchesSearch && matchesProject && matchesType && matchesStatus;
  });

  return (
    <div className="space-y-6 animate-fadeIn font-sans pb-10" id="tickets-view-container">
      {/* Header section with Stats Card */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <LifeBuoy className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            <h1 className="text-xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Troubleshoot & Helpdesk Center</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">Pencatatan masalah harian, insiden, atau permintaan operasional langsung dari representatif RS & client.</p>
        </div>

        {currentUser?.role !== "Client" && (
          <button
            onClick={handleOpenNew}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-md hover:shadow-lg transition-all"
          >
            <Plus className="w-4 h-4" /> Buka Tiket Troubleshoot
          </button>
        )}
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-500 flex items-center justify-center shrink-0">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 uppercase font-black">Total Kasus</p>
            <p className="text-lg font-black text-slate-800 dark:text-white">{total}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-amber-50 dark:bg-amber-950/20 text-amber-500 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 uppercase font-black">Open</p>
            <p className="text-lg font-black text-amber-600 dark:text-amber-400">{openCount}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/20 text-blue-500 flex items-center justify-center shrink-0">
            <SlidersHorizontal className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 uppercase font-black">In Progress</p>
            <p className="text-lg font-black text-blue-600 dark:text-blue-400">{progressCount}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500 flex items-center justify-center shrink-0">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 uppercase font-black">Resolved</p>
            <p className="text-lg font-black text-emerald-600 dark:text-emerald-400">{resolvedCount}</p>
          </div>
        </div>

        <div className="col-span-2 lg:col-span-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] text-slate-400 uppercase font-black">Kategori Kasus</p>
            <div className="flex gap-3 text-xs">
              <span className="text-red-500 font-bold font-mono">Incident: {incidentCount}</span>
              <span className="text-indigo-500 font-bold font-mono">Request: {requestCount}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Control Panel bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-wrap gap-3 items-center justify-between">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Cari isu, pelapor, atau deskripsi..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 pr-4 py-1.5 w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs"
          />
        </div>

        <div className="flex flex-wrap gap-2.5 items-center">
          <select
            value={filterProject}
            onChange={(e) => setFilterProject(e.target.value)}
            className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 py-1.5 px-3 rounded-lg text-xs"
          >
            <option value="">Semua Site / Project</option>
            {allRefs.map(ref => <option key={ref} value={ref}>{ref}</option>)}
          </select>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 py-1.5 px-3 rounded-lg text-xs"
          >
            <option value="">Semua Jenis Laporan</option>
            <option value="Incident">Incident</option>
            <option value="Request">Request</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 py-1.5 px-3 rounded-lg text-xs"
          >
            <option value="">Semua Status</option>
            <option value="Open">Open</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
          </select>
        </div>
      </div>

      {/* Ticket Cards Grid layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredTickets.length === 0 ? (
          <div className="col-span-2 text-center py-16 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
            <LifeBuoy className="w-12 h-12 text-slate-350 mx-auto mb-3 opacity-30 animate-spin" />
            <p className="text-sm font-bold text-slate-700 dark:text-slate-350">Tidak ada tiket ditemukan</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">Coba sesuaikan kata kunci pencarian Anda atau tambahkan laporan troubleshoot baru untuk rumah sakit kerja sama.</p>
          </div>
        ) : (
          filteredTickets.map(tk => (
            <div 
              key={tk.id} 
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 hover:border-indigo-500/30 transition-all space-y-4 shadow-sm"
            >
              {/* Card Title Header Row */}
              <div className="flex justify-between items-start gap-4 border-b border-slate-100 dark:border-slate-800/80 pb-3">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-1.5 text-[9px] font-mono font-bold">
                    <span className="bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/40 px-2 py-0.5 rounded">
                      {tk.projectName}
                    </span>
                    <span className={`px-2 py-0.5 rounded border ${
                      tk.reportType === "Incident" 
                        ? "bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-450 border-rose-100 dark:border-rose-900/30" 
                        : "bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-450 border-purple-100 dark:border-purple-900/30"
                    }`}>
                      {tk.reportType}
                    </span>
                    <span className={`px-2 py-0.5 rounded border ${
                      tk.priority === "Urgent" || tk.priority === "High"
                        ? "bg-orange-500/10 text-orange-400 border-orange-500/20"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                    }`}>
                      {tk.priority} Priority
                    </span>
                    {tk.createdBy && (
                      <span className="bg-indigo-50/75 dark:bg-indigo-950/45 border border-indigo-150/10 text-indigo-650 dark:text-indigo-400 text-[9px] font-black px-1.5 py-0.5 rounded">
                        🧑‍💻 Input: {tk.createdBy}
                      </span>
                    )}
                  </div>

                  <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 tracking-tight leading-snug pt-1">
                    {tk.title}
                  </h3>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <span className={`text-[10px] font-black px-2.5 py-1 rounded-md border ${
                    tk.status === "Resolved" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                    tk.status === "In Progress" ? "bg-blue-500/10 text-blue-400 border-blue-500/20" :
                    "bg-amber-500/10 text-amber-400 border-amber-500/20"
                  }`}>
                    {tk.status}
                  </span>

                  {currentUser?.role !== "Client" && (() => {
                    const canModify = !tk.createdBy || tk.createdBy === currentUser?.username || currentUser?.role === "Administrator";
                    return (
                      <div className="flex gap-0.5">
                        <button
                          onClick={() => handleOpenEdit(tk)}
                          disabled={!canModify}
                          className={`p-1 rounded transition-colors ${
                            canModify 
                              ? "text-slate-400 hover:text-indigo-500 hover:bg-slate-50 dark:hover:bg-slate-805"
                              : "text-slate-200 dark:text-slate-800 cursor-not-allowed opacity-35"
                          }`}
                          title={canModify ? "Edit status/detail tiket" : `Hanya penginput (${tk.createdBy}) yang boleh mengedit`}
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={async () => {
                            if (confirm(`Hapus tiket pencatatan troubleshoot "${tk.title}"?`)) {
                              await onDeleteTicket(tk.id);
                            }
                          }}
                          disabled={!canModify}
                          className={`p-1 rounded transition-colors ${
                            canModify 
                              ? "text-slate-400 hover:text-red-500 hover:bg-slate-50 dark:hover:bg-slate-805"
                              : "text-slate-200 dark:text-slate-800 cursor-not-allowed opacity-35"
                          }`}
                          title={canModify ? "Hapus Tiket" : `Hanya penginput (${tk.createdBy}) yang boleh menghapus`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Body Brief Description */}
              <p className="text-xs text-slate-600 dark:text-slate-350 leading-relaxed font-medium">
                {tk.description || <span className="italic text-slate-400">Tidak ada rincian deskripsi tambahan</span>}
              </p>

              {/* Reporter details Section */}
              <div className="bg-slate-50 dark:bg-slate-950/40 p-2.5 border border-slate-100 dark:border-slate-800/60 rounded-lg flex items-center justify-between text-[11px] font-semibold text-slate-500">
                <div className="flex items-center gap-1.5">
                  <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                  <span>Pelapor: <span className="text-slate-850 dark:text-slate-200">{tk.reporterName}</span></span>
                </div>
                <div className="flex items-center gap-1">
                  <Building className="w-3.5 h-3.5 text-slate-400" />
                  <span>Unit: <span className="text-slate-850 dark:text-slate-200">{tk.unit}</span></span>
                </div>
                <div className="text-[10px] font-mono text-slate-400 uppercase font-black">
                  {new Date(tk.createdAt).toLocaleDateString("id-ID", { month: "short", day: "numeric" })}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Troubleshoot input / upgrade Modal */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
                <div>
                  <h3 className="font-bold text-base text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <LifeBuoy className="w-5 h-5 text-indigo-500 animate-spin" /> {isEditing ? "Perbarui Log Tiket / Isu" : "Catat Troubleshoot / Modul Baru"}
                  </h3>
                  <p className="text-xs text-slate-450">Tulis pelaporan operasional harian guna pelacakan KPI implementasi.</p>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-slate-400 hover:text-slate-650 dark:hover:text-slate-200 text-xl font-bold"
                >
                  &times;
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 text-xs font-medium">
                <div className="grid grid-cols-2 gap-4">
                  {/* Site list selection */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Site / Project Terkait</label>
                    <select
                      value={projectName}
                      onChange={(e) => setProjectName(e.target.value)}
                      className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 py-2 px-3 rounded-lg text-slate-800 dark:text-slate-200 font-semibold"
                    >
                      {allRefs.map(ref => (
                        <option key={ref} value={ref}>{ref}</option>
                      ))}
                    </select>
                  </div>

                  {/* Report Type */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-505 uppercase tracking-widest">Jenis Laporan *</label>
                    <select
                      value={reportType}
                      onChange={(e) => setReportType(e.target.value as any)}
                      className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 py-2 px-3 rounded-lg text-slate-800 dark:text-slate-300 font-bold"
                    >
                      <option value="Incident">Incident (Isu/Error/Kendala)</option>
                      <option value="Request">Request (Permintaan Fitur/Data)</option>
                    </select>
                  </div>

                  {/* Reporter Name */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-505 uppercase tracking-widest">Nama Pelapor RS / User *</label>
                    <input
                      type="text"
                      required
                      value={reporterName}
                      onChange={(e) => setReporterName(e.target.value)}
                      placeholder="Contoh: dr. Setiawan / Pak Budi"
                      className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 py-2 px-3 rounded-lg text-slate-800 dark:text-slate-100"
                    />
                  </div>

                  {/* Unit Name */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-505 uppercase tracking-widest">Unit / Bagian Pelapor *</label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Rekam Medis / Poli Anak / UGD"
                      value={unit}
                      onChange={(e) => setUnit(e.target.value)}
                      className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 py-2 px-3 rounded-lg text-slate-800 dark:text-slate-100"
                    />
                  </div>

                  {/* Status */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-505 uppercase tracking-widest">Status Pekerjaan</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 py-2 px-3 rounded-lg text-slate-800 dark:text-slate-200 font-bold"
                    >
                      <option value="Open">Open (Menunggu Tindakan)</option>
                      <option value="In Progress">In Progress (Sedang Ditangani)</option>
                      <option value="Resolved">Resolved (Selesai)</option>
                    </select>
                  </div>

                  {/* Priority */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-505 uppercase tracking-widest">Skala Prioritas</label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value)}
                      className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 py-2 px-3 rounded-lg text-slate-800 dark:text-slate-200 font-bold"
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Urgent">Urgent (Segera)</option>
                    </select>
                  </div>
                </div>

                {/* Report Title */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-505 uppercase tracking-widest">Judul Laporan Singkat *</label>
                  <input
                    type="text"
                    required
                    placeholder="Sebutkan ringkasan isu, contoh: Gagal simpan rujukan BPJS"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 py-2.5 px-3 rounded-lg text-slate-800 dark:text-slate-150"
                  />
                </div>

                {/* Description details */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-505 uppercase tracking-widest">Uraian Masalah / Investigasi Tambahan</label>
                  <textarea
                    rows={4}
                    placeholder="Sebutkan langkah reproduksi error atau detail spesifikasi permintaan user..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 py-2.5 px-3 rounded-lg text-slate-800 dark:text-slate-150"
                  />
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
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-md transition-all flex items-center gap-1"
                  >
                    <FileCheck2 className="w-4 h-4" /> {isEditing ? "Simpan Perubahan" : "Terbitkan Tiket"}
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
