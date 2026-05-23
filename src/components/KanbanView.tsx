import React, { useState } from "react";
import { Task, Project } from "../types";
import { 
  Plus, 
  HelpCircle, 
  AlertCircle, 
  User2, 
  FileCheck2, 
  ChevronsRight,
  TrendingDown
} from "lucide-react";
import { motion } from "motion/react";

interface KanbanViewProps {
  tasks: Task[];
  projects: Project[];
  picsList: string[];
  pstatusesList: string[];
  progressStatusesList?: string[];
  picThemeColors: (picName: string) => string;
  onUpdateTask: (id: string, data: Partial<Task>) => Promise<void>;
  onViewTaskDetail: (id: string) => void;
  onAddTaskQuick: (status: any) => void;
}

export default function KanbanView({
  tasks,
  projects,
  picsList,
  pstatusesList,
  progressStatusesList,
  picThemeColors,
  onUpdateTask,
  onViewTaskDetail,
  onAddTaskQuick
}: KanbanViewProps) {
  
  const [filterProj, setFilterProj] = useState("");
  const [filterPic, setFilterPic] = useState("");
  const [filterTime, setFilterTime] = useState("all");
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);

  const getRefDate = () => {
    const d = new Date();
    if (d.getFullYear() !== 2026) {
      return new Date("2026-05-21");
    }
    return d;
  };

  const matchesDateFilter = (dateStr: string | undefined, filterType: string): boolean => {
    if (filterType === "all") return true;
    if (!dateStr) return false;
    
    const ref = getRefDate();
    const itemDate = new Date(dateStr);
    if (isNaN(itemDate.getTime())) return false;
    
    // Set hours to midnight for pure date comparison
    ref.setHours(0,0,0,0);
    const itemCompare = new Date(itemDate);
    itemCompare.setHours(0,0,0,0);
    
    if (filterType === "hari") {
      return itemCompare.toDateString() === ref.toDateString();
    }
    
    if (filterType === "minggu") {
      const startOfWeek = new Date(ref);
      startOfWeek.setDate(ref.getDate() - ref.getDay());
      startOfWeek.setHours(0,0,0,0);
      
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23,59,59,999);
      
      const itemTime = itemCompare.getTime();
      return itemTime >= startOfWeek.getTime() && itemTime <= endOfWeek.getTime();
    }
    
    if (filterType === "bulan") {
      return itemCompare.getFullYear() === ref.getFullYear() && itemCompare.getMonth() === ref.getMonth();
    }
    
    if (filterType === "tahun") {
      return itemCompare.getFullYear() === ref.getFullYear();
    }
    
    return true;
  };

  const baseStatuses = (progressStatusesList && progressStatusesList.length > 0)
    ? progressStatusesList
    : ["Not Started", "In Progress", "Pending", "Backlog", "Done", "Cancelled"];

  // Shift Backlog to the far-left (index 0) of the list
  const statuses = baseStatuses.includes("Backlog")
    ? ["Backlog", ...baseStatuses.filter(s => s !== "Backlog")]
    : baseStatuses;

  // Filter tasks
  const filtered = tasks.filter((t) => {
    const matchesProj = filterProj === "" || t.project === filterProj;
    const matchesPic = filterPic === "" || t.pic === filterPic;
    const matchesTime = matchesDateFilter(t.dueDate, filterTime) || matchesDateFilter(t.startDate, filterTime);
    return matchesProj && matchesPic && matchesTime;
  });

  // Drag & drop handlers
  function handleDragStart(e: React.DragEvent, id: string) {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = "move";
  }

  function handleDragEnd() {
    setDraggedId(null);
    setDragOverCol(null);
  }

  function handleDragOver(e: React.DragEvent, col: string) {
    e.preventDefault();
    if (dragOverCol !== col) {
      setDragOverCol(col);
    }
  }

  async function handleDrop(e: React.DragEvent, col: string) {
    e.preventDefault();
    if (!draggedId) return;

    const t = tasks.find(x => x.id === draggedId);
    if (t && t.status !== col) {
      let nextProgress = t.progress;
      if (col === "Done") nextProgress = 100;
      else if (col === "Not Started") nextProgress = 0;

      await onUpdateTask(t.id, {
        status: col,
        progress: nextProgress
      });
    }
    setDraggedId(null);
    setDragOverCol(null);
  }

  function getHeaderColor(st: string) {
    const maps: Record<string, string> = {
      "Not Started": "border-t-slate-400 bg-slate-50 dark:bg-slate-900 border-t-4",
      "In Progress": "border-t-amber-500 bg-amber-50/50 dark:bg-amber-950/20 border-t-4",
      Pending: "border-t-purple-500 bg-purple-50/50 dark:bg-purple-950/20 border-t-4",
      Backlog: "border-t-cyan-500 bg-cyan-50/50 dark:bg-cyan-950/20 border-t-4",
      Done: "border-t-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/25 border-t-4",
      Cancelled: "border-t-red-400 bg-rose-50/50 dark:bg-rose-950/20 border-t-4"
    };
    return maps[st] || "border-t-slate-350";
  }

  return (
    <div className="space-y-4 fade-in font-sans pb-10">
      
      {/* Sorters and quick filters bar */}
      <div className="flex flex-wrap gap-3 items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-xs">
        <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mr-2">Saringan Kanban:</span>
        
        <select
          value={filterProj}
          onChange={(e) => setFilterProj(e.target.value)}
          className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs py-1.5 px-3 rounded-lg text-slate-700 dark:text-slate-300 focus:outline-none"
        >
          <option value="">Semua Project</option>
          {projects.map(p => <option key={p.kode} value={p.kode}>{p.kode} – {p.nama}</option>)}
        </select>

        <select
          value={filterPic}
          onChange={(e) => setFilterPic(e.target.value)}
          className="bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 text-xs py-1.5 px-3 rounded-lg text-slate-700 dark:text-slate-300 focus:outline-none"
        >
          <option value="">Semua PIC</option>
          {picsList.map(p => <option key={p} value={p}>{p}</option>)}
        </select>

        <select
          value={filterTime}
          onChange={(e) => setFilterTime(e.target.value)}
          className="bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 text-xs py-1.5 px-3 rounded-lg text-slate-700 dark:text-slate-300 focus:outline-none font-semibold text-blue-600 dark:text-blue-400"
        >
          <option value="all">📅 Semua Batas Waktu Berjalan</option>
          <option value="hari">☀️ Hari Ini (Today)</option>
          <option value="minggu">📅 Minggu Ini (This Week)</option>
          <option value="bulan">🌙 Bulan Ini (This Month)</option>
          <option value="tahun">✨ Tahun Ini (This Year)</option>
        </select>

        <div className="text-[11px] text-slate-500 font-bold ml-auto font-mono bg-slate-50 dark:bg-slate-950 px-2.5 py-1.5 rounded-lg border border-slate-150/10">
          Total beban: {filtered.length} tugas
        </div>
      </div>

      <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1 bg-blue-50/50 dark:bg-blue-950/20 p-2.5 rounded-lg border border-blue-105/30 w-fit">
        <HelpCircle className="w-4 h-4 text-blue-500" />
        <span>Tips: Geser (drag-and-drop) tiket di bawah dari satu kolom ke kolom lain untuk memperbarui status dan progress tugas secara real-time.</span>
      </div>

      {/* Kanban Board Container */}
      <div className="overflow-x-auto pb-4 shrink-0">
        <div className="flex gap-4 min-w-[1200px] items-start">
          {statuses.map((status) => {
            const colTasks = filtered.filter(t => t.status === status);
            const isOver = dragOverCol === status;

            return (
              <div
                key={status}
                onDragOver={(e) => handleDragOver(e, status)}
                onDrop={(e) => handleDrop(e, status)}
                className={`bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800/80 rounded-xl w-64 flex-shrink-0 shadow-xs overflow-hidden flex flex-col max-h-[70vh] transition-all ${isOver ? "ring-2 ring-blue-500 bg-blue-50/15" : ""}`}
              >
                
                {/* Status Column Header */}
                <div className={`p-4 flex justify-between items-center font-bold text-xs ${getHeaderColor(status)}`}>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-800 dark:text-slate-100">{status}</span>
                    <span className="bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold">
                      {colTasks.length}
                    </span>
                  </div>
                </div>

                {/* Cards Block */}
                <div className="p-3 overflow-y-auto space-y-2.5 flex-1 min-h-[400px]">
                  {colTasks.length === 0 ? (
                    <div className="h-40 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-center p-4 text-center">
                      <p className="text-[10px] text-slate-400 italic">Belum ada tugas di kolom ini.</p>
                    </div>
                  ) : (
                    colTasks.map((t) => {
                      const initials = t.pic ? t.pic.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() : "?";
                      const overdue = t.status !== "Done" && t.status !== "Cancelled" && t.dueDate && t.dueDate < new Date().toISOString().slice(0, 10);
                      const subTotal = t.subtasks?.length || 0;
                      const subDone = t.subtasks?.filter(s => s.done).length || 0;

                      return (
                        <div
                          key={t.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, t.id)}
                          onDragEnd={handleDragEnd}
                          onClick={() => onViewTaskDetail(t.id)}
                          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3.5 rounded-lg shadow-xs hover:border-blue-500/40 transition-all cursor-grab active:cursor-grabbing space-y-3"
                        >
                          <div className="space-y-1">
                            <span className="text-[9px] font-bold font-mono text-blue-600 dark:text-blue-450 block truncate">
                              {projects.find(p => p.kode === t.project)?.nama.slice(0, 24) || t.project}
                            </span>
                            <h5 className="text-[11.5px] font-extrabold text-slate-800 dark:text-slate-100 leading-snug truncate-2-lines line-clamp-2">
                              {t.task}
                            </h5>
                          </div>

                          <div className="flex justify-between items-center text-[10px] gap-2 pt-1">
                            <span className="bg-slate-100 dark:bg-slate-850 px-1.5 py-0.5 rounded text-[9px] font-bold font-mono text-slate-500">
                              {t.priority}
                            </span>
                            {t.dueDate && (
                              <span className={`font-mono font-bold shrink-0 ${overdue ? "text-red-500 font-extrabold" : "text-slate-450 dark:text-slate-500"}`}>
                                {new Date(t.dueDate).toLocaleDateString("id-ID", { month: "short", day: "numeric" })}
                              </span>
                            )}
                          </div>

                          {/* Footer Info */}
                          <div className="flex justify-between items-center pt-2.5 border-t border-slate-100 dark:border-slate-800/80">
                            <div className="flex items-center gap-1.5 max-w-[60%] shrink-0">
                              <span className={`w-5 h-5 rounded-full text-[9px] font-bold flex items-center justify-center shrink-0 ${picThemeColors(t.pic || "")}`}>
                                {initials}
                              </span>
                              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 truncate">
                                {t.pic || "Unassigned"}
                              </span>
                            </div>
                            
                            <div className="flex items-center gap-1 text-[10px] font-bold font-mono text-slate-400">
                              {subTotal > 0 && (
                                <span className="bg-slate-50 border border-slate-150/10 px-1.5 py-0.5 rounded text-[9px] text-slate-500">
                                  {subDone}/{subTotal}
                                </span>
                              )}
                              <span>{t.progress}%</span>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Quick Addition Button on Kanban bottom */}
                <div className="p-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => onAddTaskQuick(status)}
                    className="w-full py-1.5 border border-dashed border-slate-200 hover:border-blue-500 hover:text-blue-600 dark:border-slate-800 dark:hover:border-blue-400 font-sans font-bold text-[10.5px] text-slate-500 dark:text-slate-400 rounded-lg flex items-center justify-center gap-1 transition-all"
                  >
                    + Tambah Tugas
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
