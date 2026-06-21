import React, { useState } from "react";
import { Project, Task } from "../types";
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
  CheckCircle2
} from "lucide-react";
import { motion } from "motion/react";

interface DashboardViewProps {
  projects: Project[];
  tasks: Task[];
  onNavigateToView: (view: string) => void;
  onViewTaskDetail: (taskId: string) => void;
  picThemeColors: (picName: string) => string;
}

export default function DashboardView({
  projects = [],
  tasks = [],
  onNavigateToView,
  onViewTaskDetail,
  picThemeColors
}: DashboardViewProps) {
  const [searchTerm, setSearchTerm] = useState("");

  // Statistics calculation
  const totalProjects = projects.length;
  const activeProjects = projects.filter(p => p.status !== "Completed" && p.status !== "Cancelled").length;
  
  const totalTasks = tasks.length;
  const doneTasks = tasks.filter(t => t.status === "Done").length;
  const activeTasks = tasks.filter(t => t.status !== "Done" && t.status !== "Cancelled").length;
  
  const completionRate = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  // Overdue status check
  const todayStr = new Date().toISOString().slice(0, 10);
  const overdueTasks = tasks.filter(t => {
    return t.status !== "Done" && t.status !== "Cancelled" && t.dueDate && t.dueDate < todayStr;
  });

  // Filtered projects for the progress table
  const filteredProjects = projects.filter(p => {
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
  const criticalTasks = tasks
    .filter(t => {
      const isUrgent = t.priority === "Urgent" || t.priority === "High";
      const isOverdue = t.status !== "Done" && t.status !== "Cancelled" && t.dueDate && t.dueDate < todayStr;
      const isPending = t.status !== "Done" && t.status !== "Cancelled";
      return isPending && (isUrgent || isOverdue);
    })
    .sort((a, b) => {
      // Sort by due date ascending
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

      {/* QUICK STATS 4-CARD GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Projects Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-5 py-4 rounded-xl flex items-center justify-between shadow-xs">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider block">Projek Berjalan</span>
            <h3 className="text-2xl font-black text-slate-800 dark:text-white">{activeProjects} <span className="text-xs text-slate-450 dark:text-slate-500 font-normal">/ {totalProjects} total</span></h3>
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
            <h3 className="text-2xl font-black text-slate-800 dark:text-white">{activeTasks} <span className="text-xs text-slate-450 dark:text-slate-500 font-normal">belum selesai</span></h3>
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
              {overdueTasks.length} <span className="text-xs text-slate-450 dark:text-slate-500 font-normal">tugas</span>
            </h3>
            <span className="text-[10px] text-slate-450 dark:text-slate-500 block mt-2">melewati batas waktu</span>
          </div>
          <div className={`p-3 rounded-xl ${overdueTasks.length > 0 ? "bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400" : "bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400"}`}>
            <AlertTriangle className="w-5 h-5" />
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

        {/* RIGHT COLUMN: CRITICAL / OVERDUE TASKS SPEED LIST (4 COLS) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs lg:col-span-4 flex flex-col">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-4 mb-4">
            <h2 className="text-base font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-1.5">
              <AlertTriangle className="w-4.5 h-4.5 text-amber-500 animate-pulse" />
              Tugas Kritis & Mendesak
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Daftar tugas urgent yang belum tuntas atau mendekati tanggal jatuh tempo.
            </p>
          </div>

          {/* Critical Task Container */}
          <div className="space-y-3 flex-1 overflow-y-auto">
            {criticalTasks.length === 0 ? (
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
                        {/* Task priority badge */}
                        <span className={`text-[8.5px] font-black px-1.5 py-0.5 rounded uppercase ${
                          task.priority === "Urgent" 
                            ? "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-455" 
                            : "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-455"
                        }`}>
                          {task.priority || "Normal"}
                        </span>
                        
                        {/* Due Date Indicator */}
                        {task.dueDate && (
                          <span className={`text-[9.5px] font-mono font-bold flex items-center gap-1 ${isOverdue ? "text-rose-600 dark:text-rose-400 animate-pulse" : "text-slate-500 dark:text-slate-400"}`}>
                            <Calendar className="w-3 h-3" />
                            {task.dueDate}
                          </span>
                        )}
                      </div>

                      {/* Task title */}
                      <p className="text-xs font-extrabold text-slate-800 dark:text-white mt-2 leading-snug">
                        {task.task}
                      </p>

                      {/* Project info & PIC */}
                      <div className="flex justify-between items-center text-[10px] text-slate-500 dark:text-slate-450 mt-2 pt-2 border-t border-slate-150/50 dark:border-slate-700/20">
                        <span className="font-mono font-bold text-slate-600 dark:text-slate-400">Projek: {task.project}</span>
                        {task.pic && (
                          <span className="font-semibold bg-slate-200/60 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-700 dark:text-slate-300">
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
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
