import React, { useState } from "react";
import { Project, Task } from "../types";
import { 
  BarChart3, 
  Layers, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  FolderLock, 
  Sparkles, 
  ArrowUpRight,
  TrendingUp,
  Award,
  Search
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
  projects,
  tasks,
  onNavigateToView,
  onViewTaskDetail,
  picThemeColors
}: DashboardViewProps) {
  const [projSearch, setProjSearch] = useState("");
  
  // Greeting based on time of day
  const hour = new Date().getHours();
  const greeting = hour < 11 ? "Selamat Pagi 🌅" : hour < 15 ? "Selamat Siang ☀️" : hour < 18 ? "Selamat Sore 🌇" : "Selamat Malam 🌙";

  // Calculate high-level statistics
  const totalTasks = tasks.length;
  const doneTasks = tasks.filter((t) => t.status === "Done").length;
  const inProgressTasks = tasks.filter((t) => t.status === "In Progress").length;
  const pendingTasks = tasks.filter((t) => t.status === "Pending").length;
  const backlogTasks = tasks.filter((t) => t.status === "Backlog").length;
  const cancelledTasks = tasks.filter((t) => t.status === "Cancelled").length;
  const notStartedTasks = tasks.filter((t) => t.status === "Not Started").length;

  // Determine current date string
  const formattedDate = new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  }).format(new Date());

  // Overdue calculation
  const todayStr = new Date().toISOString().slice(0, 10);
  const overdueTasks = tasks.filter((t) => {
    return (
      t.status !== "Done" &&
      t.status !== "Cancelled" &&
      t.dueDate &&
      t.dueDate < todayStr
    );
  });

  // Calculate project completion rates
  const projectSummaries = projects.map((p) => {
    const projTasks = tasks.filter((t) => t.project === p.kode);
    const completed = projTasks.filter((t) => t.status === "Done").length;
    const progressPercent = projTasks.length === 0 ? 0 : Math.round((completed / projTasks.length) * 100);
    return {
      ...p,
      progressPercent,
      taskCount: projTasks.length,
      doneCount: completed
    };
  });

  const filteredProjectSummaries = projectSummaries.filter(p => {
    const q = projSearch.trim().toLowerCase();
    if (!q) return true;
    return (
      (p.nama && p.nama.toLowerCase().includes(q)) || 
      (p.kode && p.kode.toLowerCase().includes(q)) || 
      (p.pic && p.pic.toLowerCase().includes(q)) ||
      (p.client && p.client.toLowerCase().includes(q))
    );
  });

  // Category summary calculations for display
  const priorities = ["Urgent", "High", "Medium", "Low", "Very Low"] as const;
  const maxPriorityCount = Math.max(
    ...priorities.map(p => tasks.filter(t => t.priority === p).length),
    1
  );

  return (
    <div className="space-y-6 fade-in font-sans">
      
      {/* Top Greeting Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
        <div>
          <h2 className="text-2xl font-bold font-sans text-slate-800 dark:text-slate-100 flex items-center gap-2">
            {greeting}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">
            Hari ini adalah {formattedDate} &bull; Selamat bekerja di SYNAPSIS.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/30 rounded-xl px-4 py-3">
          <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />
          <div className="text-xs">
            <span className="font-bold text-slate-800 dark:text-slate-200 block">Status PostgreSQL Terkoneksi</span>
            <span className="text-slate-500 dark:text-slate-400">Arsitektur Spring & Node Aktif</span>
          </div>
        </div>
      </div>

      {/* Stats Matrix */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-sm text-center">
          <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold tracking-widest">Total Tugas</p>
          <p className="text-3xl font-extrabold text-blue-600 dark:text-blue-400 mt-1">{totalTasks}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-xs text-center border-l-4 border-l-emerald-500">
          <p className="text-[10px] text-emerald-600 dark:text-emerald-400 uppercase font-bold tracking-widest">Selesai</p>
          <p className="text-3xl font-extrabold text-emerald-500 dark:text-emerald-400 mt-1">{doneTasks}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-sm text-center border-l-4 border-l-amber-500">
          <p className="text-[10px] text-amber-600 dark:text-amber-400 uppercase font-bold tracking-widest">Sedang Jalan</p>
          <p className="text-3xl font-extrabold text-amber-500 mt-1">{inProgressTasks}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-sm text-center border-l-4 border-l-purple-500">
          <p className="text-[10px] text-purple-600 dark:text-purple-400 uppercase font-bold tracking-widest">Pending</p>
          <p className="text-3xl font-extrabold text-purple-500 mt-1">{pendingTasks}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-sm text-center border-l-4 border-l-red-500">
          <p className="text-[10px] text-red-600 dark:text-red-400 uppercase font-bold tracking-widest">Terlambat</p>
          <p className="text-3xl font-extrabold text-red-500 mt-1">{overdueTasks.length}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-sm text-center">
          <p className="text-[10px] text-cyan-600 dark:text-cyan-400 uppercase font-bold tracking-widest">Backlog</p>
          <p className="text-3xl font-extrabold text-cyan-500 mt-1">{backlogTasks}</p>
        </div>
      </div>

      {/* Two and Three Column Breakdown Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Priority Progress Indicators */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm lg:col-span-4">
          <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-slate-400" /> Beban Berdasarkan Prioritas
          </h3>
          <div className="space-y-4">
            {priorities.map((p) => {
              const count = tasks.filter((t) => t.priority === p).length;
              const pct = maxPriorityCount === 0 ? 0 : (count / maxPriorityCount) * 100;
              const priorityColors: Record<string, string> = {
                Urgent: "bg-red-500",
                High: "bg-orange-500",
                Medium: "bg-amber-500",
                Low: "bg-emerald-500",
                "Very Low": "bg-slate-400"
              };

              return (
                <div key={p} className="space-y-1">
                  <div className="flex justify-between text-xs font-medium text-slate-700 dark:text-slate-300">
                    <span className="flex items-center gap-1.5 font-semibold">
                      <span className={`w-2 h-2 rounded-full ${priorityColors[p]}`} />
                      {p}
                    </span>
                    <span className="font-mono font-bold">{count} tugas</span>
                  </div>
                  <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className={`h-full ${priorityColors[p]}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Pie-chart / Status Flow List */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm lg:col-span-8 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <Layers className="w-4 h-4 text-slate-400" /> Distribusi Alur Tugas status
            </h3>
            <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded">
              Grafik Status
            </span>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[
              { label: "Done", count: doneTasks, color: "bg-emerald-500", text: "text-emerald-600" },
              { label: "In Progress", count: inProgressTasks, color: "bg-amber-500", text: "text-amber-600" },
              { label: "Not Started", count: notStartedTasks, color: "bg-slate-400", text: "text-slate-500" },
              { label: "Pending", count: pendingTasks, color: "bg-purple-500", text: "text-purple-600" },
              { label: "Backlog", count: backlogTasks, color: "bg-cyan-500", text: "text-cyan-600" },
              { label: "Cancelled", count: cancelledTasks, color: "bg-red-400", text: "text-red-500" }
            ].map((st) => {
              const pct = totalTasks === 0 ? 0 : Math.round((st.count / totalTasks) * 100);
              return (
                <div key={st.label} className="bg-slate-50 dark:bg-slate-950/40 border border-slate-250/20 dark:border-slate-800/60 p-4 rounded-xl space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{st.label}</span>
                    <span className={`w-2.5 h-2.5 rounded-full ${st.color}`} />
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black text-slate-800 dark:text-slate-200">{st.count}</span>
                    <span className="text-xs font-mono font-bold text-slate-400">({pct}%)</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* Project Milestones and Completion Panel */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
            <FolderLock className="w-4 h-4 text-blue-500" /> Status Project Master (Database PostgreSQL)
          </h3>
          <div className="flex items-center gap-3">
            <div className="relative font-sans text-xs shrink-0 max-w-[200px] w-full">
              <input
                type="text"
                placeholder="Cari project..."
                value={projSearch}
                onChange={(e) => setProjSearch(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 rounded-lg py-1.5 pl-8 pr-3 font-semibold text-slate-700 dark:text-slate-300 outline-none focus:ring-1 focus:ring-blue-500/30 text-xs"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            </div>
            <button 
              onClick={() => onNavigateToView("projects")} 
              className="text-xs text-blue-600 dark:text-blue-400 font-bold hover:underline flex items-center gap-1 transition-all shrink-0"
            >
              Kelola <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {projectSummaries.length === 0 ? (
          <p className="text-xs text-slate-500 dark:text-slate-400 italic">Belum ada project master terdaftar di database.</p>
        ) : filteredProjectSummaries.length === 0 ? (
          <p className="text-xs text-slate-450 dark:text-slate-500 italic">Tidak ada project yang cocok dengan pencarian "{projSearch}".</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {filteredProjectSummaries.map((p) => {
              const statusColors: Record<string, string> = {
                "On Track": "text-emerald-500",
                "Completed": "text-emerald-600",
                "Delayed": "text-red-500",
                "On Hold": "text-amber-500",
                "Cancelled": "text-slate-400"
              };
              const textPercentColor = p.progressPercent === 100 ? "text-emerald-500" : "text-blue-600 dark:text-blue-400";
              const barPercentColor = p.progressPercent === 100 ? "bg-emerald-500" : "bg-blue-600";

              return (
                <div 
                  key={p.id} 
                  className="bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800/80 rounded-xl p-5 hover:border-blue-500/40 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex justify-between items-start gap-2">
                      <div className="min-w-0">
                        <span className="bg-slate-250 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[9px] font-bold font-mono px-2 py-0.5 rounded">
                          {p.kode}
                        </span>
                        <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 mt-2 truncate leading-tight" title={p.nama}>
                          {p.nama}
                        </h4>
                      </div>
                      <div className="text-right shrink-0">
                        <span className={`text-xl font-black font-mono ${textPercentColor}`}>
                          {p.progressPercent}%
                        </span>
                        <p className={`text-[9px] font-bold uppercase tracking-wider ${statusColors[p.status] || "text-slate-500"} mt-1`}>
                          {p.status || "Draft"}
                        </p>
                      </div>
                    </div>

                    <div className="h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden mt-4">
                      <div className={`h-full ${barPercentColor}`} style={{ width: `${p.progressPercent}%` }} />
                    </div>

                    <div className="flex justify-between text-[10px] text-slate-400 dark:text-slate-500 mt-2 font-medium">
                      <span>{p.doneCount}/{p.taskCount} tugas selesai</span>
                      <span>Target: {p.endDate || "No Deadline"}</span>
                    </div>
                  </div>

                  {p.pic && (
                    <div className="border-t border-slate-200/60 dark:border-slate-800/60 pt-3 mt-4 flex items-center gap-2">
                      <span className={`w-5 h-5 rounded-full font-bold text-[9px] flex items-center justify-center ${picThemeColors(p.pic)} shrink-0`}>
                        {p.pic.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()}
                      </span>
                      <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 truncate">
                        PIC: {p.pic} &bull; {p.client || "No Client"}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Critical and Overdue Actions Warning Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500" /> Tindakan Kritis Utama (Tugas Terlambat)
            {overdueTasks.length > 0 && (
              <span className="bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-rose-100 dark:border-rose-900/30">
                {overdueTasks.length} Terlambat
              </span>
            )}
          </h3>
          <button 
            onClick={() => onNavigateToView("tasks")} 
            className="text-xs text-blue-600 dark:text-blue-400 font-bold hover:underline"
          >
            Lihat Semua Tugas &rarr;
          </button>
        </div>

        {overdueTasks.length === 0 ? (
          <p className="text-xs text-slate-500 dark:text-slate-400 italic">Selamat! Tidak ada tugas kritis maupun jatuh tempo yang terlambat.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-450 dark:text-slate-550 border-b border-slate-200 dark:border-slate-800 font-bold">
                  <th className="pb-2">Project</th>
                  <th className="pb-2">Nama Tugas</th>
                  <th className="pb-2">Eselon / PIC</th>
                  <th className="pb-2 text-rose-500">Batas Waktu</th>
                  <th className="pb-2">Progress</th>
                  <th className="pb-2 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {overdueTasks.slice(0, 5).map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-950/20 transition-colors">
                    <td className="py-2.5 font-bold text-blue-600 dark:text-blue-400">
                      <span className="bg-blue-50 dark:bg-blue-950/60 border border-blue-100 dark:border-blue-900/30 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold mr-1.5 align-middle">
                        {t.project}
                      </span>
                      {projects.find(p => p.kode === t.project)?.nama || t.project}
                    </td>
                    <td className="py-2.5 font-bold text-slate-800 dark:text-slate-200">{t.task}</td>
                    <td className="py-2.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${picThemeColors(t.pic)}`}>
                        {t.pic || "—"}
                      </span>
                    </td>
                    <td className="py-2.5 font-mono text-red-500 font-bold">
                      {t.dueDate ? new Date(t.dueDate).toLocaleDateString("id-ID") : "—"}
                    </td>
                    <td className="py-2.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-semibold text-slate-500 dark:text-slate-400">{t.progress}%</span>
                        <div className="w-16 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden shrink-0">
                          <div className="h-full bg-red-500" style={{ width: `${t.progress}%` }} />
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5 text-right">
                      <button 
                        onClick={() => onViewTaskDetail(t.id)}
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-500 font-bold transition-all text-xs"
                      >
                        Buka Detail
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
