import React, { useState } from "react";
import { Project, Task, CommLog, Ticket } from "../types";
import { 
  LayoutDashboard, 
  Briefcase, 
  CheckSquare, 
  Clock, 
  AlertTriangle, 
  ChevronRight, 
  ArrowRight, 
  Search,
  Building2,
  TrendingUp,
  User,
  Calendar,
  CheckCircle2,
  PlusCircle,
  Filter,
  Activity,
  MessageSquare,
  Ticket as TicketIcon,
  ShoppingBag,
  RefreshCw,
  FolderPlus,
  FileSpreadsheet
} from "lucide-react";
import { motion } from "motion/react";

interface DashboardViewProps {
  projects: Project[];
  tasks: Task[];
  commlogs?: CommLog[];
  tickets?: Ticket[];
  onNavigateToView: (view: string) => void;
  onViewTaskDetail: (taskId: string) => void;
  picThemeColors: (picName: string) => string;
}

export default function DashboardView({
  projects = [],
  tasks = [],
  commlogs = [],
  tickets = [],
  onNavigateToView,
  onViewTaskDetail,
  picThemeColors
}: DashboardViewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPic, setSelectedPic] = useState("");
  const [rightColumnTab, setRightColumnTab] = useState<"critical" | "activity">("critical");

  // Get unique list of PICs from both projects and tasks
  const allPics = Array.from(
    new Set([
      ...projects.map(p => p.pic).filter(Boolean),
      ...tasks.map(t => t.pic).filter(Boolean)
    ])
  ).sort() as string[];

  // Filter projects & tasks by selected PIC
  const filteredProjectsByPic = selectedPic
    ? projects.filter(p => p.pic === selectedPic)
    : projects;

  const filteredTasksByPic = selectedPic
    ? tasks.filter(t => t.pic === selectedPic)
    : tasks;

  // Statistics calculation based on global PIC filter
  const totalProjects = filteredProjectsByPic.length;
  const activeProjects = filteredProjectsByPic.filter(p => p.status !== "Completed" && p.status !== "Cancelled").length;
  
  const totalTasks = filteredTasksByPic.length;
  const doneTasks = filteredTasksByPic.filter(t => t.status === "Done").length;
  const activeTasks = filteredTasksByPic.filter(t => t.status !== "Done" && t.status !== "Cancelled").length;
  
  const completionRate = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  // Overdue status check
  const todayStr = new Date().toISOString().slice(0, 10);
  const overdueTasks = filteredTasksByPic.filter(t => {
    return t.status !== "Done" && t.status !== "Cancelled" && t.dueDate && t.dueDate < todayStr;
  });

  // Filtered projects for the progress table (Search & PIC filter)
  const filteredProjects = filteredProjectsByPic.filter(p => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      p.nama.toLowerCase().includes(q) ||
      p.kode.toLowerCase().includes(q) ||
      (p.client && p.client.toLowerCase().includes(q)) ||
      (p.pic && p.pic.toLowerCase().includes(q))
    );
  });

  // Critical task list (Urgent or Overdue, limit to 6)
  const criticalTasks = filteredTasksByPic
    .filter(t => {
      const isUrgent = t.priority === "Urgent" || t.priority === "High";
      const isOverdue = t.status !== "Done" && t.status !== "Cancelled" && t.dueDate && t.dueDate < todayStr;
      const isPending = t.status !== "Done" && t.status !== "Cancelled";
      return isPending && (isUrgent || isOverdue);
    })
    .sort((a, b) => {
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return a.dueDate.localeCompare(b.dueDate);
    })
    .slice(0, 6);

  // Dynamic greetings based on current local hours
  const currentHour = new Date().getHours();
  let greetingText = "Selamat Pagi";
  if (currentHour >= 11 && currentHour < 15) {
    greetingText = "Selamat Siang";
  } else if (currentHour >= 15 && currentHour < 18) {
    greetingText = "Selamat Sore";
  } else if (currentHour >= 18 || currentHour < 4) {
    greetingText = "Selamat Malam";
  }

  // Calculate task distribution by priority for chart
  const priorityCounts = {
    Urgent: filteredTasksByPic.filter(t => t.priority === "Urgent").length,
    High: filteredTasksByPic.filter(t => t.priority === "High").length,
    Medium: filteredTasksByPic.filter(t => t.priority === "Medium" || t.priority === "Normal").length,
    Low: filteredTasksByPic.filter(t => t.priority === "Low").length,
  };
  const totalPriorityTasks = priorityCounts.Urgent + priorityCounts.High + priorityCounts.Medium + priorityCounts.Low;

  // Calculate top PICs workload (tasks count completed vs active)
  const picWorkload = allPics.map(picName => {
    const picTasks = tasks.filter(t => t.pic === picName);
    const completed = picTasks.filter(t => t.status === "Done").length;
    const active = picTasks.filter(t => t.status !== "Done" && t.status !== "Cancelled").length;
    return {
      pic: picName,
      completed,
      active,
      total: picTasks.length
    };
  })
  .sort((a, b) => b.total - a.total)
  .slice(0, 5); // Take top 5

  // Generate Activities Feed
  const activitiesFeed = (() => {
    const feed: Array<{
      id: string;
      type: "project" | "task" | "commlog" | "ticket";
      title: string;
      subtitle: string;
      date: string;
      badge?: string;
      badgeColor?: string;
    }> = [];

    // Add recent projects
    projects.forEach(p => {
      if (p.createdAt) {
        feed.push({
          id: `p-${p.id}`,
          type: "project",
          title: `Inisiasi Projek Baru: ${p.nama}`,
          subtitle: `Modul: ${p.modul} • PIC: ${p.pic || "—"}`,
          date: p.createdAt,
          badge: p.status,
          badgeColor: p.status === "On Track" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
        });
      }
    });

    // Add recent tasks
    tasks.forEach(t => {
      if (t.createdAt) {
        feed.push({
          id: `t-${t.id}`,
          type: "task",
          title: `Tugas Baru: ${t.task}`,
          subtitle: `Projek: ${t.project} • PIC: ${t.pic || "—"} • Prioritas: ${t.priority}`,
          date: t.createdAt,
          badge: t.status,
          badgeColor: t.status === "Done" ? "bg-emerald-100 text-emerald-800" : "bg-blue-50 text-blue-700"
        });
      }
    });

    // Add recent commlogs
    commlogs.forEach(c => {
      if (c.date) {
        feed.push({
          id: `c-${c.id}`,
          type: "commlog",
          title: `Log Komunikasi: ${c.summary || "Diskusi KSO"}`,
          subtitle: `Peserta: ${c.participants || "Tim Teknis"}`,
          date: c.date.includes("T") ? c.date : `${c.date}T00:00:00.000Z`,
          badge: c.type || "Diskusi",
          badgeColor: "bg-purple-50 text-purple-700"
        });
      }
    });

    // Add recent tickets
    tickets.forEach(tick => {
      if (tick.createdAt) {
        feed.push({
          id: `tk-${tick.id}`,
          type: "ticket",
          title: `Tiket Masuk: ${tick.title}`,
          subtitle: `Pelapor: ${tick.reporterName} • Status: ${tick.status}`,
          date: tick.createdAt,
          badge: tick.priority || "Incident",
          badgeColor: tick.priority === "Urgent" || tick.priority === "High" ? "bg-rose-50 text-rose-700" : "bg-slate-50 text-slate-700"
        });
      }
    });

    // Sort by date descending and take top 6
    return feed
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 6);
  })();

  const handleResetFilter = () => {
    setSelectedPic("");
  };

  return (
    <div className="space-y-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-900 duration-200 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold text-xs uppercase tracking-wider mb-1">
            <LayoutDashboard className="w-4 h-4" />
            <span>Enterprise Command Center</span>
          </div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">
            {greetingText}, Tim Synapsis
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
            Selamat datang kembali di portal Synapsis. Seluruh data projek, ATK, pemeliharaan, serta monitoring kinerja kso tersaji terpusat dan sinkron secara realtime.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {/* PIC Dropdown Filter */}
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 rounded-xl px-3 py-1.5 shadow-2xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedPic}
              onChange={(e) => setSelectedPic(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-700 dark:text-slate-200 outline-none pr-2 cursor-pointer"
            >
              <option value="" className="dark:bg-slate-900">Semua PIC</option>
              {allPics.map(pic => (
                <option key={pic} value={pic} className="dark:bg-slate-900">{pic}</option>
              ))}
            </select>
            {selectedPic && (
              <button 
                onClick={handleResetFilter} 
                className="text-xs text-rose-600 dark:text-rose-450 hover:text-rose-700 font-extrabold cursor-pointer transition-colors"
                title="Reset Filter"
              >
                <RefreshCw className="w-3 h-3 animate-spin-reverse" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800 rounded-xl px-4 py-2.5">
            <div className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </div>
            <div className="text-[11px] leading-tight text-left">
              <span className="font-extrabold text-slate-800 dark:text-slate-200 block">Sistem Aktif</span>
              <span className="text-slate-500 dark:text-slate-400 font-medium text-[10px]">Sinkronisasi Real-Time</span>
            </div>
          </div>
        </div>
      </div>

      {/* QUICK STATS 4-CARD GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Projects Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-5 py-4 rounded-xl flex items-center justify-between shadow-xs">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider block">Projek Berjalan</span>
            <h3 className="text-2xl font-black text-slate-800 dark:text-white">
              {activeProjects} <span className="text-xs text-slate-450 dark:text-slate-550 font-normal">/ {totalProjects} total</span>
            </h3>
            <button 
              onClick={() => onNavigateToView("projects")}
              className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline font-bold flex items-center gap-0.5 mt-2 cursor-pointer"
            >
              Lihat Projek <ChevronRight className="w-2.5 h-2.5" />
            </button>
          </div>
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl">
            <Briefcase className="w-5 h-5" />
          </div>
        </div>

        {/* Total Tasks Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-5 py-4 rounded-xl flex items-center justify-between shadow-xs">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider block">Tugas Aktif</span>
            <h3 className="text-2xl font-black text-slate-800 dark:text-white">
              {activeTasks} <span className="text-xs text-slate-450 dark:text-slate-550 font-normal">belum selesai</span>
            </h3>
            <button 
              onClick={() => onNavigateToView("tasks")}
              className="text-[10px] text-indigo-600 dark:text-indigo-400 hover:underline font-bold flex items-center gap-0.5 mt-2 cursor-pointer"
            >
              Lihat Tugas <ChevronRight className="w-2.5 h-2.5" />
            </button>
          </div>
          <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-xl">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        {/* Completion Progress Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-5 py-4 rounded-xl flex items-center justify-between shadow-xs">
          <div className="space-y-1.5 flex-1 pr-2">
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider block">Rasio Kerja</span>
            <div className="flex items-baseline gap-1.5">
              <h3 className="text-2xl font-black text-slate-800 dark:text-white">{completionRate}%</h3>
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">({doneTasks}/{totalTasks} Tugas)</span>
            </div>
            {/* Simple styling progress bar */}
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div className="bg-emerald-500 h-full rounded-full transition-all" style={{ width: `${completionRate}%` }} />
            </div>
          </div>
          <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-xl">
            <CheckSquare className="w-5 h-5" />
          </div>
        </div>

        {/* Overdue/Urgent Tasks card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-5 py-4 rounded-xl flex items-center justify-between shadow-xs">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider block">Tugas Terlambat</span>
            <h3 className={`text-2xl font-black ${overdueTasks.length > 0 ? "text-rose-600 dark:text-rose-450" : "text-amber-600 dark:text-amber-400"}`}>
              {overdueTasks.length} <span className="text-xs text-slate-450 dark:text-slate-550 font-normal">tugas</span>
            </h3>
            <span className="text-[10px] text-slate-450 dark:text-slate-500 block mt-2">melewati batas waktu</span>
          </div>
          <div className={`p-3 rounded-xl ${overdueTasks.length > 0 ? "bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400" : "bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400"}`}>
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* QUICK ACTIONS BUTTONS ROW */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
        <h2 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3.5 flex items-center gap-1.5">
          <PlusCircle className="w-4 h-4 text-slate-400" />
          Tindakan Cepat & Akses Instan
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <button
            onClick={() => onNavigateToView("projects")}
            className="flex items-center gap-3 p-3 bg-blue-50/50 hover:bg-blue-100/60 dark:bg-blue-950/20 dark:hover:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-xl border border-blue-100/50 dark:border-blue-900/30 transition-all text-left group cursor-pointer"
          >
            <div className="p-2 bg-blue-600 text-white rounded-lg group-hover:scale-105 transition-transform">
              <FolderPlus className="w-4 h-4" />
            </div>
            <div>
              <span className="block text-xs font-bold leading-tight">Kelola Projek</span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">Tambah & edit milestone</span>
            </div>
          </button>

          <button
            onClick={() => onNavigateToView("tasks")}
            className="flex items-center gap-3 p-3 bg-indigo-50/50 hover:bg-indigo-100/60 dark:bg-indigo-950/20 dark:hover:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 rounded-xl border border-indigo-100/50 dark:border-indigo-900/30 transition-all text-left group cursor-pointer"
          >
            <div className="p-2 bg-indigo-600 text-white rounded-lg group-hover:scale-105 transition-transform">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <span className="block text-xs font-bold leading-tight">Daftar Tugas</span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">Buat tugas & delegasi</span>
            </div>
          </button>

          <button
            onClick={() => onNavigateToView("tickets")}
            className="flex items-center gap-3 p-3 bg-rose-50/50 hover:bg-rose-100/60 dark:bg-rose-950/20 dark:hover:bg-rose-900/30 text-rose-700 dark:text-rose-400 rounded-xl border border-rose-100/50 dark:border-rose-900/30 transition-all text-left group cursor-pointer"
          >
            <div className="p-2 bg-rose-600 text-white rounded-lg group-hover:scale-105 transition-transform">
              <TicketIcon className="w-4 h-4" />
            </div>
            <div>
              <span className="block text-xs font-bold leading-tight">Tiket Komplain</span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">Lihat issue & resolusi</span>
            </div>
          </button>

          <button
            onClick={() => onNavigateToView("atk")}
            className="flex items-center gap-3 p-3 bg-amber-50/50 hover:bg-amber-100/60 dark:bg-amber-950/20 dark:hover:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-xl border border-amber-100/50 dark:border-amber-900/30 transition-all text-left group cursor-pointer"
          >
            <div className="p-2 bg-amber-600 text-white rounded-lg group-hover:scale-105 transition-transform">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div>
              <span className="block text-xs font-bold leading-tight">Pengajuan ATK</span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">Order perlengkapan site</span>
            </div>
          </button>
        </div>
      </div>

      {/* VISUAL CHARTS & METRICS SECTION */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card A: Beban Kerja PIC */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-sm font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-emerald-500" />
                  Beban Kerja Tim Teknis / PIC (Top 5)
                </h3>
                <p className="text-[10px] text-slate-400 dark:text-slate-500">
                  Perbandingan tugas aktif (belum selesai) vs tugas selesai yang diampu PIC.
                </p>
              </div>
            </div>

            {/* Custom Bar Chart representation */}
            <div className="space-y-4">
              {picWorkload.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400 dark:text-slate-550">
                  Tidak ada data PIC yang tersedia.
                </div>
              ) : (
                picWorkload.map(item => {
                  const maxTasks = Math.max(...picWorkload.map(x => x.total), 1);
                  const activeWidth = (item.active / maxTasks) * 100;
                  const completedWidth = (item.completed / maxTasks) * 100;

                  return (
                    <div key={item.pic} className="space-y-1">
                      <div className="flex justify-between items-center text-xs font-semibold text-slate-700 dark:text-slate-300">
                        <span className="flex items-center gap-1.5">
                          <span className={`w-2.5 h-2.5 rounded-full ${picThemeColors(item.pic)}`} />
                          {item.pic}
                        </span>
                        <span className="font-mono text-[10.5px]">
                          <span className="text-indigo-600 dark:text-indigo-400 font-bold">{item.active} Aktif</span>
                          <span className="text-slate-400 mx-1">/</span>
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold">{item.completed} Selesai</span>
                        </span>
                      </div>
                      
                      {/* Stacked bar */}
                      <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3 flex overflow-hidden">
                        {item.active > 0 && (
                          <div 
                            className="bg-indigo-500 dark:bg-indigo-600 transition-all cursor-pointer" 
                            style={{ width: `${activeWidth}%` }}
                            title={`${item.active} tugas aktif`}
                          />
                        )}
                        {item.completed > 0 && (
                          <div 
                            className="bg-emerald-500 dark:bg-emerald-600 transition-all cursor-pointer border-l border-white dark:border-slate-800" 
                            style={{ width: `${completedWidth}%` }}
                            title={`${item.completed} tugas selesai`}
                          />
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-[10px] text-slate-400">
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-indigo-500 rounded-xs" /> Tugas Aktif</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-emerald-500 rounded-xs" /> Tugas Selesai</span>
            <span className="font-mono text-slate-500">Total PIC Terdaftar: {allPics.length}</span>
          </div>
        </div>

        {/* Card B: Distribusi Prioritas Tugas */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-1.5 mb-1">
              <CheckSquare className="w-4 h-4 text-blue-500" />
              Prioritas & Urgensi Tugas
            </h3>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mb-4">
              Pengelompokan seluruh penugasan berdasarkan skala prioritas pengerjaan.
            </p>

            {/* Custom Interactive Priority distribution bars */}
            <div className="space-y-3.5">
              {/* Urgent */}
              <div>
                <div className="flex justify-between items-center text-xs mb-1">
                  <span className="font-extrabold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                    Urgent (Mendesak)
                  </span>
                  <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                    {priorityCounts.Urgent} <span className="text-[10px] font-normal text-slate-400">tugas</span>
                  </span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-rose-500 h-full rounded-full transition-all" 
                    style={{ width: `${totalPriorityTasks > 0 ? (priorityCounts.Urgent / totalPriorityTasks) * 100 : 0}%` }} 
                  />
                </div>
              </div>

              {/* High */}
              <div>
                <div className="flex justify-between items-center text-xs mb-1">
                  <span className="font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    High (Tinggi)
                  </span>
                  <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                    {priorityCounts.High} <span className="text-[10px] font-normal text-slate-400">tugas</span>
                  </span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-amber-500 h-full rounded-full transition-all" 
                    style={{ width: `${totalPriorityTasks > 0 ? (priorityCounts.High / totalPriorityTasks) * 100 : 0}%` }} 
                  />
                </div>
              </div>

              {/* Medium */}
              <div>
                <div className="flex justify-between items-center text-xs mb-1">
                  <span className="font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    Medium (Normal)
                  </span>
                  <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                    {priorityCounts.Medium} <span className="text-[10px] font-normal text-slate-400">tugas</span>
                  </span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-blue-500 h-full rounded-full transition-all" 
                    style={{ width: `${totalPriorityTasks > 0 ? (priorityCounts.Medium / totalPriorityTasks) * 100 : 0}%` }} 
                  />
                </div>
              </div>

              {/* Low */}
              <div>
                <div className="flex justify-between items-center text-xs mb-1">
                  <span className="font-bold text-slate-500 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-slate-400" />
                    Low (Rendah)
                  </span>
                  <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                    {priorityCounts.Low} <span className="text-[10px] font-normal text-slate-400">tugas</span>
                  </span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-slate-400 h-full rounded-full transition-all" 
                    style={{ width: `${totalPriorityTasks > 0 ? (priorityCounts.Low / totalPriorityTasks) * 100 : 0}%` }} 
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-450 dark:text-slate-500 text-center font-semibold">
            Total Tugas Terdaftar: {totalTasks} Tugas
          </div>
        </div>
      </div>

      {/* DETAILED DOUBLE-COLUMN LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: ACTIVE PROJECTS LIST WITH PROGRESS BAR (8 COLS) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs lg:col-span-8 flex flex-col">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4 mb-4">
            <div>
              <h2 className="text-base font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-blue-600" />
                Daftar & Progres Milestone Projek
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Progres pengerjaan tugas selesai per masing-masing modul rumah sakit / klien.
              </p>
            </div>
            
            {/* Search filter in Projects Section */}
            <div className="relative w-full sm:w-60">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari kode, nama, pic atau client..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-lg py-1 pl-8 pr-3 text-[11px] outline-none focus:ring-1 focus:ring-blue-500 transition-all text-slate-700 dark:text-slate-350"
              />
            </div>
          </div>

          {/* Project List Table inside Column */}
          <div className="overflow-x-auto flex-1">
            {filteredProjects.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <Briefcase className="w-10 h-10 text-slate-300 dark:text-slate-700 mb-2" />
                <p className="text-xs text-slate-500 dark:text-slate-550 font-bold">Tidak ada projek ditemukan</p>
                <p className="text-[10px] text-slate-400 mt-1">Coba sesuaikan kata kunci pencarian Anda</p>
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    <th className="pb-3 pr-2">KSO</th>
                    <th className="pb-3 pr-10">Rumah Sakit / Client</th>
                    <th className="pb-3 pr-4">Total Tugas</th>
                    <th className="pb-3 pr-4">Progres</th>
                    <th className="pb-3 text-center">PIC</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150/40 dark:divide-slate-800/50">
                  {filteredProjects.map((p) => {
                    const projectTasks = tasks.filter(t => t.project === p.kode);
                    const completed = projectTasks.filter(t => t.status === "Done").length;
                    const percent = projectTasks.length === 0 ? 0 : Math.round((completed / projectTasks.length) * 100);

                    return (
                      <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="py-3 px-1 font-mono font-bold text-blue-600 dark:text-blue-400 text-[10.5px]">
                          {p.kode || "—"}
                        </td>
                        <td className="py-3 pr-4">
                          <div className="font-extrabold text-slate-800 dark:text-white leading-snug">{p.nama}</div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-450 flex items-center gap-1.5 mt-0.5">
                            <span className="font-medium">{p.client || "Client Lapangan"}</span>
                            <span>&bull;</span>
                            <span className="font-mono text-[9px] bg-slate-100 dark:bg-slate-800 px-1 rounded">{p.modul || "Modul Utama"}</span>
                          </div>
                        </td>
                        <td className="py-3 pr-2 font-mono text-[11px] font-bold text-slate-600 dark:text-slate-400">
                          {projectTasks.length} <span className="text-[10px] text-slate-400 font-normal">tugas ({completed} Selesai)</span>
                        </td>
                        <td className="py-3 pr-4">
                          <div className="w-32">
                            <div className="flex items-center justify-between text-[10px] mb-0.5">
                              <span className="font-bold text-slate-700 dark:text-slate-300">{percent}%</span>
                            </div>
                            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                              <div 
                                className="bg-blue-600 dark:bg-blue-500 h-full rounded-full transition-all" 
                                style={{ width: `${percent}%` }} 
                              />
                            </div>
                          </div>
                        </td>
                        <td className="py-3 text-center">
                          <div className="inline-flex items-center justify-center">
                            {p.pic ? (
                              <div 
                                className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black text-white shrink-0 ${picThemeColors(p.pic)}`}
                                title={p.pic}
                              >
                                {p.pic.substring(0, 2).toUpperCase()}
                              </div>
                            ) : (
                              <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                                <User className="w-3.5 h-3.5" />
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: CRITICAL / OVERDUE TASKS SPEED LIST OR ACTIVITY FEED (4 COLS) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs lg:col-span-4 flex flex-col">
          {/* TAB HEADERS */}
          <div className="flex border-b border-slate-150 dark:border-slate-800 mb-4 pb-0.5">
            <button
              onClick={() => setRightColumnTab("critical")}
              className={`flex-1 pb-2.5 text-xs font-extrabold flex items-center justify-center gap-1.5 border-b-2 transition-all cursor-pointer ${
                rightColumnTab === "critical"
                  ? "border-blue-600 text-blue-600 dark:border-blue-450 dark:text-blue-400 font-black"
                  : "border-transparent text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              Tugas Kritis ({criticalTasks.length})
            </button>
            <button
              onClick={() => setRightColumnTab("activity")}
              className={`flex-1 pb-2.5 text-xs font-extrabold flex items-center justify-center gap-1.5 border-b-2 transition-all cursor-pointer ${
                rightColumnTab === "activity"
                  ? "border-blue-600 text-blue-600 dark:border-blue-450 dark:text-blue-400 font-black"
                  : "border-transparent text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              Aktivitas Terbaru
            </button>
          </div>

          {/* TAB CONTENTS */}
          <div className="space-y-3 flex-1 overflow-y-auto max-h-[360px] pr-1">
            {rightColumnTab === "critical" ? (
              /* CRITICAL TASKS */
              criticalTasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center h-full">
                  <CheckCircle2 className="w-10 h-10 text-emerald-500 mb-2" />
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-bold">Semua Aman & Terkontrol!</p>
                  <p className="text-[10px] text-slate-400 mt-1">Tidak ada tugas urgent yang terlambat saat ini.</p>
                </div>
              ) : (
                criticalTasks.map((task) => {
                  const isOverdue = task.dueDate && task.dueDate < todayStr;
                  return (
                    <div 
                      key={task.id} 
                      className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/50 dark:border-slate-700/30 hover:border-blue-400/50 dark:hover:border-slate-600 transition-colors flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex justify-between items-start gap-2">
                          <span className={`text-[8.5px] font-black px-1.5 py-0.5 rounded uppercase ${
                            task.priority === "Urgent" 
                              ? "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-455" 
                              : "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-455"
                          }`}>
                            {task.priority || "Normal"}
                          </span>
                          
                          {task.dueDate && (
                            <span className={`text-[9.5px] font-mono font-bold flex items-center gap-1 ${isOverdue ? "text-rose-600 dark:text-rose-400 animate-pulse" : "text-slate-500 dark:text-slate-400"}`}>
                              <Calendar className="w-3 h-3" />
                              {task.dueDate}
                            </span>
                          )}
                        </div>

                        <p className="text-xs font-extrabold text-slate-800 dark:text-white mt-2 leading-snug">
                          {task.task}
                        </p>

                        <div className="flex justify-between items-center text-[10px] text-slate-500 dark:text-slate-455 mt-2 pt-2 border-t border-slate-150/50 dark:border-slate-700/20">
                          <span className="font-mono font-bold text-slate-600 dark:text-slate-400">Projek: {task.project}</span>
                          {task.pic && (
                            <span className="font-semibold bg-slate-250/50 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-700 dark:text-slate-300">
                              PIC: {task.pic}
                            </span>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => onViewTaskDetail(task.id)}
                        className="mt-3 w-full bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-white border border-slate-250 dark:border-slate-700 rounded-lg py-1 text-[11px] font-bold transition-all flex items-center justify-center gap-1 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer"
                      >
                        Buka Rincian <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })
              )
            ) : (
              /* RECENT ACTIVITIES TIMELINE FEED */
              activitiesFeed.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center h-full">
                  <Activity className="w-10 h-10 text-slate-300 mb-2 animate-pulse" />
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-bold">Belum Ada Aktivitas</p>
                  <p className="text-[10px] text-slate-400 mt-1">Daftarkan projek atau buat tugas untuk memulai.</p>
                </div>
              ) : (
                <div className="relative border-l-2 border-slate-100 dark:border-slate-800 pl-4 ml-2.5 space-y-4 py-2">
                  {activitiesFeed.map((act) => (
                    <div key={act.id} className="relative">
                      {/* Timeline Dot Indicator with Icon */}
                      <span className={`absolute -left-[24.5px] top-0.5 rounded-full p-1 border-2 border-white dark:border-slate-900 text-white ${
                        act.type === "project" 
                          ? "bg-blue-600" 
                          : act.type === "task" 
                          ? "bg-indigo-600" 
                          : act.type === "commlog" 
                          ? "bg-purple-600" 
                          : "bg-rose-600"
                      }`}>
                        {act.type === "project" && <Briefcase className="w-2.5 h-2.5" />}
                        {act.type === "task" && <CheckSquare className="w-2.5 h-2.5" />}
                        {act.type === "commlog" && <MessageSquare className="w-2.5 h-2.5" />}
                        {act.type === "ticket" && <TicketIcon className="w-2.5 h-2.5" />}
                      </span>

                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10.5px] font-extrabold text-slate-800 dark:text-slate-200 leading-snug">
                            {act.title}
                          </span>
                          {act.badge && (
                            <span className={`text-[8px] font-black px-1 py-0.5 rounded uppercase tracking-wide shrink-0 ${act.badgeColor}`}>
                              {act.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-550 dark:text-slate-450 mt-0.5 leading-tight">
                          {act.subtitle}
                        </p>
                        <span className="text-[9px] font-mono text-slate-400 block mt-1">
                          📅 {new Date(act.date).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "short",
                            year: "numeric"
                          })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
