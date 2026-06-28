import React, { useState } from "react";
import { Project, Task, CommLog, Ticket } from "../types";
import { Briefcase, SquareCheck as CheckSquare, Clock, TriangleAlert as AlertTriangle, ChevronRight, ArrowRight, Search, Building2, TrendingUp, User, Calendar, CircleCheck as CheckCircle2, CirclePlus as PlusCircle, ListFilter as Filter, Activity, MessageSquare, Ticket as TicketIcon, ShoppingBag, RefreshCw, FolderPlus } from "lucide-react";

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

  const allPics = Array.from(
    new Set([
      ...projects.map(p => p.pic).filter(Boolean),
      ...tasks.map(t => t.pic).filter(Boolean)
    ])
  ).sort() as string[];

  const filteredProjectsByPic = selectedPic
    ? projects.filter(p => p.pic === selectedPic)
    : projects;

  const filteredTasksByPic = selectedPic
    ? tasks.filter(t => t.pic === selectedPic)
    : tasks;

  const totalProjects = filteredProjectsByPic.length;
  const activeProjects = filteredProjectsByPic.filter(p => p.status !== "Completed" && p.status !== "Cancelled").length;
  
  const totalTasks = filteredTasksByPic.length;
  const doneTasks = filteredTasksByPic.filter(t => t.status === "Done").length;
  const activeTasks = filteredTasksByPic.filter(t => t.status !== "Done" && t.status !== "Cancelled").length;
  
  const completionRate = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  const todayStr = new Date().toISOString().slice(0, 10);
  const overdueTasks = filteredTasksByPic.filter(t => {
    return t.status !== "Done" && t.status !== "Cancelled" && t.dueDate && t.dueDate < todayStr;
  });

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

  const currentHour = new Date().getHours();
  let greetingText = "Selamat Pagi";
  if (currentHour >= 11 && currentHour < 15) {
    greetingText = "Selamat Siang";
  } else if (currentHour >= 15 && currentHour < 18) {
    greetingText = "Selamat Sore";
  } else if (currentHour >= 18 || currentHour < 4) {
    greetingText = "Selamat Malam";
  }

  const priorityCounts = {
    Urgent: filteredTasksByPic.filter(t => t.priority === "Urgent").length,
    High: filteredTasksByPic.filter(t => t.priority === "High").length,
    Medium: filteredTasksByPic.filter(t => t.priority === "Medium" || t.priority === "Normal").length,
    Low: filteredTasksByPic.filter(t => t.priority === "Low").length,
  };
  const totalPriorityTasks = priorityCounts.Urgent + priorityCounts.High + priorityCounts.Medium + priorityCounts.Low;

  const picWorkload = allPics.map(picName => {
    const picTasks = tasks.filter(t => t.pic === picName);
    const completed = picTasks.filter(t => t.status === "Done").length;
    const active = picTasks.filter(t => t.status !== "Done" && t.status !== "Cancelled").length;
    return { pic: picName, completed, active, total: picTasks.length };
  })
  .sort((a, b) => b.total - a.total)
  .slice(0, 5);

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

    projects.forEach(p => {
      if (p.createdAt) {
        feed.push({
          id: `p-${p.id}`,
          type: "project",
          title: `Proyek baru: ${p.nama}`,
          subtitle: `${p.modul} • PIC: ${p.pic || "—"}`,
          date: p.createdAt,
          badge: p.status,
          badgeColor: p.status === "On Track" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
        });
      }
    });

    tasks.forEach(t => {
      if (t.createdAt) {
        feed.push({
          id: `t-${t.id}`,
          type: "task",
          title: `Tugas: ${t.task}`,
          subtitle: `${t.project} • ${t.pic || "—"}`,
          date: t.createdAt,
          badge: t.status,
          badgeColor: t.status === "Done" ? "bg-emerald-100 text-emerald-800" : "bg-blue-50 text-blue-700"
        });
      }
    });

    commlogs.forEach(c => {
      if (c.date) {
        feed.push({
          id: `c-${c.id}`,
          type: "commlog",
          title: `Komunikasi: ${c.summary || "Diskusi"}`,
          subtitle: c.participants || "Tim Teknis",
          date: c.date.includes("T") ? c.date : `${c.date}T00:00:00.000Z`,
          badge: c.type || "Diskusi",
          badgeColor: "bg-purple-50 text-purple-700"
        });
      }
    });

    tickets.forEach(tick => {
      if (tick.createdAt) {
        feed.push({
          id: `tk-${tick.id}`,
          type: "ticket",
          title: `Tiket: ${tick.title}`,
          subtitle: `${tick.reporterName} • ${tick.status}`,
          date: tick.createdAt,
          badge: tick.priority || "Incident",
          badgeColor: tick.priority === "Urgent" || tick.priority === "High" ? "bg-rose-50 text-rose-700" : "bg-slate-50 text-slate-700"
        });
      }
    });

    return feed.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6);
  })();

  const handleResetFilter = () => {
    setSelectedPic("");
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900 dark:text-white tracking-tight">
            {greetingText}
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
            Ringkasan aktivitas dan progres proyek hari ini.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg px-3 py-2">
            <Filter className="w-3.5 h-3.5 text-neutral-400" />
            <select
              value={selectedPic}
              onChange={(e) => setSelectedPic(e.target.value)}
              className="bg-transparent text-sm text-neutral-700 dark:text-neutral-200 outline-none cursor-pointer"
            >
              <option value="">Semua PIC</option>
              {allPics.map(pic => (
                <option key={pic} value={pic}>{pic}</option>
              ))}
            </select>
            {selectedPic && (
              <button onClick={handleResetFilter} className="text-neutral-400 hover:text-neutral-600">
                <RefreshCw className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 px-5 py-4 rounded-xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-neutral-400 font-medium block">Proyek Aktif</span>
            <h3 className="text-2xl font-semibold text-neutral-900 dark:text-white">
              {activeProjects} <span className="text-sm text-neutral-400 font-normal">/ {totalProjects}</span>
            </h3>
            <button onClick={() => onNavigateToView("projects")} className="text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-white font-medium flex items-center gap-0.5 mt-1">
              Lihat <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          <div className="p-2.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 rounded-lg">
            <Briefcase className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 px-5 py-4 rounded-xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-neutral-400 font-medium block">Tugas Aktif</span>
            <h3 className="text-2xl font-semibold text-neutral-900 dark:text-white">
              {activeTasks}
            </h3>
            <button onClick={() => onNavigateToView("tasks")} className="text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-white font-medium flex items-center gap-0.5 mt-1">
              Lihat <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          <div className="p-2.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 rounded-lg">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 px-5 py-4 rounded-xl flex items-center justify-between">
          <div className="space-y-1.5 flex-1 pr-2">
            <span className="text-xs text-neutral-400 font-medium block">Progres</span>
            <div className="flex items-baseline gap-1.5">
              <h3 className="text-2xl font-semibold text-neutral-900 dark:text-white">{completionRate}%</h3>
            </div>
            <div className="w-full bg-neutral-100 dark:bg-neutral-800 rounded-full h-1.5 overflow-hidden">
              <div className="bg-neutral-900 dark:bg-white h-full rounded-full transition-all" style={{ width: `${completionRate}%` }} />
            </div>
          </div>
          <div className="p-2.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 rounded-lg">
            <CheckSquare className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 px-5 py-4 rounded-xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-neutral-400 font-medium block">Terlambat</span>
            <h3 className={`text-2xl font-semibold ${overdueTasks.length > 0 ? "text-red-600" : "text-neutral-900 dark:text-white"}`}>
              {overdueTasks.length}
            </h3>
            <span className="text-xs text-neutral-400 block">tugas melewati deadline</span>
          </div>
          <div className={`p-2.5 rounded-lg ${overdueTasks.length > 0 ? "bg-red-50 dark:bg-red-950/20 text-red-600" : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600"}`}>
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <button onClick={() => onNavigateToView("projects")} className="flex items-center gap-3 p-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:border-neutral-400 dark:hover:border-neutral-600 rounded-xl text-left transition-colors group">
          <div className="p-2 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-lg">
            <FolderPlus className="w-4 h-4" />
          </div>
          <div>
            <span className="block text-sm font-medium text-neutral-800 dark:text-neutral-200">Proyek</span>
            <span className="text-xs text-neutral-400">Kelola milestone</span>
          </div>
        </button>

        <button onClick={() => onNavigateToView("tasks")} className="flex items-center gap-3 p-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:border-neutral-400 dark:hover:border-neutral-600 rounded-xl text-left transition-colors group">
          <div className="p-2 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-lg">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <span className="block text-sm font-medium text-neutral-800 dark:text-neutral-200">Tugas</span>
            <span className="text-xs text-neutral-400">Daftar & delegasi</span>
          </div>
        </button>

        <button onClick={() => onNavigateToView("tickets")} className="flex items-center gap-3 p-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:border-neutral-400 dark:hover:border-neutral-600 rounded-xl text-left transition-colors group">
          <div className="p-2 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-lg">
            <TicketIcon className="w-4 h-4" />
          </div>
          <div>
            <span className="block text-sm font-medium text-neutral-800 dark:text-neutral-200">Tiket</span>
            <span className="text-xs text-neutral-400">Issue & resolusi</span>
          </div>
        </button>

        <button onClick={() => onNavigateToView("atk")} className="flex items-center gap-3 p-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:border-neutral-400 dark:hover:border-neutral-600 rounded-xl text-left transition-colors group">
          <div className="p-2 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-lg">
            <ShoppingBag className="w-4 h-4" />
          </div>
          <div>
            <span className="block text-sm font-medium text-neutral-800 dark:text-neutral-200">ATK</span>
            <span className="text-xs text-neutral-400">Pengajuan perlengkapan</span>
          </div>
        </button>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5">
          <h3 className="text-sm font-medium text-neutral-800 dark:text-white mb-4">Beban Kerja PIC</h3>
          <div className="space-y-3">
            {picWorkload.length === 0 ? (
              <div className="py-8 text-center text-sm text-neutral-400">Tidak ada data PIC</div>
            ) : (
              picWorkload.map(item => {
                const maxTasks = Math.max(...picWorkload.map(x => x.total), 1);
                const activeWidth = (item.active / maxTasks) * 100;
                const completedWidth = (item.completed / maxTasks) * 100;
                return (
                  <div key={item.pic} className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="flex items-center gap-1.5 text-neutral-700 dark:text-neutral-300">
                        <span className={`w-2 h-2 rounded-full ${picThemeColors(item.pic)}`} />
                        {item.pic}
                      </span>
                      <span className="text-neutral-400 text-[11px]">
                        {item.active} aktif / {item.completed} selesai
                      </span>
                    </div>
                    <div className="w-full bg-neutral-100 dark:bg-neutral-800 rounded-full h-2 flex overflow-hidden">
                      {item.active > 0 && (
                        <div className="bg-neutral-600 dark:bg-neutral-400 transition-all" style={{ width: `${activeWidth}%` }} />
                      )}
                      {item.completed > 0 && (
                        <div className="bg-neutral-900 dark:bg-white transition-all border-l border-white dark:border-neutral-900" style={{ width: `${completedWidth}%` }} />
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5">
          <h3 className="text-sm font-medium text-neutral-800 dark:text-white mb-4">Distribusi Prioritas</h3>
          <div className="space-y-3">
            {[
              { key: "Urgent", label: "Urgent", color: "bg-red-500" },
              { key: "High", label: "High", color: "bg-amber-500" },
              { key: "Medium", label: "Medium", color: "bg-blue-500" },
              { key: "Low", label: "Low", color: "bg-neutral-400" }
            ].map(({ key, label, color }) => {
              const count = priorityCounts[key as keyof typeof priorityCounts];
              return (
                <div key={key}>
                  <div className="flex justify-between items-center text-xs mb-1">
                    <span className="text-neutral-600 dark:text-neutral-400">{label}</span>
                    <span className="text-neutral-800 dark:text-neutral-200 font-medium">{count}</span>
                  </div>
                  <div className="w-full bg-neutral-100 dark:bg-neutral-800 h-1.5 rounded-full overflow-hidden">
                    <div className={`${color} h-full rounded-full transition-all`} style={{ width: `${totalPriorityTasks > 0 ? (count / totalPriorityTasks) * 100 : 0}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 lg:col-span-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
            <h2 className="text-sm font-medium text-neutral-800 dark:text-white">Daftar Proyek</h2>
            <div className="relative w-full sm:w-56">
              <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari proyek..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-lg py-1.5 pl-8 pr-3 text-xs outline-none focus:border-neutral-400 transition-colors text-neutral-700 dark:text-neutral-300"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            {filteredProjects.length === 0 ? (
              <div className="py-10 text-center text-sm text-neutral-400">Tidak ada proyek ditemukan</div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-neutral-100 dark:border-neutral-800 text-[11px] font-medium text-neutral-400">
                    <th className="pb-2 pr-2">Kode</th>
                    <th className="pb-2 pr-4">Nama</th>
                    <th className="pb-2 pr-4">Tugas</th>
                    <th className="pb-2 pr-4">Progres</th>
                    <th className="pb-2 text-center">PIC</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-50 dark:divide-neutral-800/50">
                  {filteredProjects.map((p) => {
                    const projectTasks = tasks.filter(t => t.project === p.kode);
                    const completed = projectTasks.filter(t => t.status === "Done").length;
                    const percent = projectTasks.length === 0 ? 0 : Math.round((completed / projectTasks.length) * 100);
                    return (
                      <tr key={p.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors">
                        <td className="py-2.5 px-1 font-mono font-medium text-neutral-500 text-[11px]">
                          {p.kode || "—"}
                        </td>
                        <td className="py-2.5 pr-4">
                          <div className="font-medium text-neutral-800 dark:text-neutral-200 text-xs">{p.nama}</div>
                          <div className="text-[10px] text-neutral-400 mt-0.5">{p.client || "—"}</div>
                        </td>
                        <td className="py-2.5 pr-2 text-[11px] text-neutral-500">
                          {projectTasks.length} ({completed} selesai)
                        </td>
                        <td className="py-2.5 pr-4">
                          <div className="w-24">
                            <div className="w-full bg-neutral-100 dark:bg-neutral-800 rounded-full h-1 overflow-hidden">
                              <div className="bg-neutral-900 dark:bg-white h-full rounded-full transition-all" style={{ width: `${percent}%` }} />
                            </div>
                            <span className="text-[10px] text-neutral-400 mt-0.5">{percent}%</span>
                          </div>
                        </td>
                        <td className="py-2.5 text-center">
                          {p.pic ? (
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-medium text-white mx-auto ${picThemeColors(p.pic)}`}>
                              {p.pic.substring(0, 2).toUpperCase()}
                            </div>
                          ) : (
                            <User className="w-3.5 h-3.5 text-neutral-300 mx-auto" />
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 lg:col-span-4 flex flex-col">
          <div className="flex border-b border-neutral-100 dark:border-neutral-800 mb-4">
            <button
              onClick={() => setRightColumnTab("critical")}
              className={`flex-1 pb-2.5 text-xs font-medium flex items-center justify-center gap-1.5 border-b-2 transition-all cursor-pointer ${
                rightColumnTab === "critical"
                  ? "border-neutral-900 text-neutral-900 dark:border-white dark:text-white"
                  : "border-transparent text-neutral-400 hover:text-neutral-600 dark:text-neutral-500 dark:hover:text-neutral-300"
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              Kritis ({criticalTasks.length})
            </button>
            <button
              onClick={() => setRightColumnTab("activity")}
              className={`flex-1 pb-2.5 text-xs font-medium flex items-center justify-center gap-1.5 border-b-2 transition-all cursor-pointer ${
                rightColumnTab === "activity"
                  ? "border-neutral-900 text-neutral-900 dark:border-white dark:text-white"
                  : "border-transparent text-neutral-400 hover:text-neutral-600 dark:text-neutral-500 dark:hover:text-neutral-300"
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              Aktivitas
            </button>
          </div>

          <div className="space-y-2 flex-1 overflow-y-auto max-h-[320px]">
            {rightColumnTab === "critical" ? (
              criticalTasks.length === 0 ? (
                <div className="py-8 text-center text-sm text-neutral-400">
                  <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-500" />
                  <p>Semua terkontrol</p>
                </div>
              ) : (
                criticalTasks.map((task) => {
                  const isOverdue = task.dueDate && task.dueDate < todayStr;
                  return (
                    <div key={task.id} className="p-3 bg-neutral-50 dark:bg-neutral-800/40 rounded-lg border border-neutral-100 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors">
                      <div className="flex justify-between items-start gap-2">
                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                          task.priority === "Urgent" ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-600"
                        }`}>
                          {task.priority}
                        </span>
                        {task.dueDate && (
                          <span className={`text-[10px] font-mono ${isOverdue ? "text-red-500" : "text-neutral-400"}`}>
                            {task.dueDate}
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-medium text-neutral-800 dark:text-white mt-1.5">{task.task}</p>
                      <div className="flex justify-between items-center text-[10px] text-neutral-400 mt-1.5">
                        <span>{task.project}</span>
                        {task.pic && <span>{task.pic}</span>}
                      </div>
                      <button
                        onClick={() => onViewTaskDetail(task.id)}
                        className="mt-2 w-full py-1 text-[11px] font-medium text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white border border-neutral-200 dark:border-neutral-800 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                      >
                        Buka <ArrowRight className="w-3 h-3 inline" />
                      </button>
                    </div>
                  );
                })
              )
            ) : (
              activitiesFeed.length === 0 ? (
                <div className="py-8 text-center text-sm text-neutral-400">
                  <Activity className="w-8 h-8 mx-auto mb-2" />
                  <p>Belum ada aktivitas</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {activitiesFeed.map((act) => (
                    <div key={act.id} className="flex gap-3">
                      <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                        act.type === "project" ? "bg-blue-500" :
                        act.type === "task" ? "bg-indigo-500" :
                        act.type === "commlog" ? "bg-purple-500" : "bg-rose-500"
                      }`} />
                      <div className="flex-1">
                        <p className="text-xs font-medium text-neutral-700 dark:text-neutral-300">{act.title}</p>
                        <p className="text-[10px] text-neutral-400 mt-0.5">{act.subtitle}</p>
                        <span className="text-[10px] text-neutral-400">
                          {new Date(act.date).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                        </span>
                      </div>
                      {act.badge && (
                        <span className={`text-[9px] px-1.5 py-0.5 rounded ${act.badgeColor}`}>
                          {act.badge}
                        </span>
                      )}
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
