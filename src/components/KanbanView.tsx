import React, { useState } from "react";
import { Task, Project, User } from "../types";
import { Plus, Circle as HelpCircle, User as User2 } from "lucide-react";

interface KanbanViewProps {
  tasks: Task[];
  projects: Project[];
  picsList: string[];
  users?: User[];
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
  users = [],
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
      
      return itemCompare.getTime() >= startOfWeek.getTime() && itemCompare.getTime() <= endOfWeek.getTime();
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

  const statuses = baseStatuses.includes("Backlog")
    ? ["Backlog", ...baseStatuses.filter(s => s !== "Backlog")]
    : baseStatuses;

  const filtered = tasks.filter((t) => {
    const matchesProj = filterProj === "" || t.project === filterProj;
    const matchesPic = filterPic === "" || t.pic === filterPic;
    const matchesTime = matchesDateFilter(t.dueDate, filterTime) || matchesDateFilter(t.startDate, filterTime);
    return matchesProj && matchesPic && matchesTime;
  });

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
      "Not Started": "border-t-neutral-400 bg-neutral-50 dark:bg-neutral-900",
      "In Progress": "border-t-amber-500 bg-amber-50 dark:bg-amber-950/20",
      Pending: "border-t-purple-500 bg-purple-50 dark:bg-purple-950/20",
      Backlog: "border-t-cyan-500 bg-cyan-50 dark:bg-cyan-950/20",
      Done: "border-t-emerald-500 bg-emerald-50 dark:bg-emerald-950/20",
      Cancelled: "border-t-red-400 bg-red-50 dark:bg-red-950/20"
    };
    return maps[st] || "border-t-neutral-300 bg-neutral-50 dark:bg-neutral-900";
  }

  return (
    <div className="space-y-4 fade-in pb-10">
      
      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-4 rounded-xl">
        <span className="text-xs font-medium text-neutral-400 mr-2">Filter:</span>
        
        <select
          value={filterProj}
          onChange={(e) => setFilterProj(e.target.value)}
          className="bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-xs py-1.5 px-3 rounded-lg text-neutral-700 dark:text-neutral-300 focus:outline-none"
        >
          <option value="">Semua Proyek</option>
          {projects.map(p => <option key={p.kode} value={p.kode}>{p.kode} – {p.nama}</option>)}
        </select>

        <select
          value={filterPic}
          onChange={(e) => setFilterPic(e.target.value)}
          className="bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-xs py-1.5 px-3 rounded-lg text-neutral-700 dark:text-neutral-300 focus:outline-none"
        >
          <option value="">Semua PIC</option>
          {picsList.map(p => <option key={p} value={p}>{p}</option>)}
        </select>

        <select
          value={filterTime}
          onChange={(e) => setFilterTime(e.target.value)}
          className="bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-xs py-1.5 px-3 rounded-lg text-neutral-700 dark:text-neutral-300 focus:outline-none"
        >
          <option value="all">Semua Waktu</option>
          <option value="hari">Hari Ini</option>
          <option value="minggu">Minggu Ini</option>
          <option value="bulan">Bulan Ini</option>
          <option value="tahun">Tahun Ini</option>
        </select>

        <div className="text-xs text-neutral-400 ml-auto font-mono">
          {filtered.length} tugas
        </div>
      </div>

      <div className="text-xs text-neutral-500 flex items-center gap-1 bg-neutral-50 dark:bg-neutral-950/50 p-2.5 rounded-lg w-fit">
        <HelpCircle className="w-3.5 h-3.5" />
        <span>Drag-and-drop tiket antar kolom untuk memperbarui status</span>
      </div>

      {/* Kanban Board */}
      <div className="overflow-x-auto pb-4 shrink-0">
        <div className="flex gap-3 min-w-[1200px] items-start">
          {statuses.map((status) => {
            const colTasks = filtered.filter(t => t.status === status);
            const isOver = dragOverCol === status;

            return (
              <div
                key={status}
                onDragOver={(e) => handleDragOver(e, status)}
                onDrop={(e) => handleDrop(e, status)}
                className={`bg-neutral-50 dark:bg-neutral-950/40 border border-neutral-200 dark:border-neutral-800 rounded-xl w-64 flex-shrink-0 overflow-hidden flex flex-col max-h-[70vh] transition-all ${isOver ? "ring-2 ring-neutral-400 dark:ring-neutral-600" : ""}`}
              >
                
                {/* Column Header */}
                <div className={`p-3.5 flex justify-between items-center font-medium text-xs border-t-2 ${getHeaderColor(status)}`}>
                  <div className="flex items-center gap-2">
                    <span className="text-neutral-800 dark:text-neutral-200">{status}</span>
                    <span className="bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 px-2 py-0.5 rounded-full text-[10px] font-mono">
                      {colTasks.length}
                    </span>
                  </div>
                </div>

                {/* Cards */}
                <div className="p-2.5 overflow-y-auto space-y-2 flex-1 min-h-[400px]">
                  {colTasks.length === 0 ? (
                    <div className="h-32 border-2 border-dashed border-neutral-200 dark:border-neutral-800 rounded-lg flex items-center justify-center">
                      <p className="text-[10px] text-neutral-400 italic">Kosong</p>
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
                          className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-3 rounded-lg hover:border-neutral-400 dark:hover:border-neutral-600 transition-all cursor-grab active:cursor-grabbing space-y-2"
                        >
                          <div className="space-y-1">
                            <span className="text-[10px] font-mono text-neutral-500 block truncate">
                              {projects.find(p => p.kode === t.project)?.nama.slice(0, 24) || t.project}
                            </span>
                            <h5 className="text-xs font-medium text-neutral-800 dark:text-neutral-200 leading-snug line-clamp-2">
                              {t.task}
                            </h5>
                          </div>

                          <div className="flex justify-between items-center text-[10px] gap-2">
                            <span className="bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded text-[10px] font-mono text-neutral-500">
                              {t.priority}
                            </span>
                            {t.dueDate && (
                              <span className={`font-mono shrink-0 ${overdue ? "text-red-500" : "text-neutral-400"}`}>
                                {new Date(t.dueDate).toLocaleDateString("id-ID", { month: "short", day: "numeric" })}
                              </span>
                            )}
                          </div>

                          <div className="flex justify-between items-center pt-2 border-t border-neutral-100 dark:border-neutral-800">
                            <div className="flex items-center gap-1.5 max-w-[60%] shrink-0">
                              <span className={`w-5 h-5 rounded-full text-[9px] font-medium flex items-center justify-center shrink-0 text-white ${picThemeColors(t.pic || "")}`}>
                                {initials}
                              </span>
                              <span className="text-[10px] text-neutral-500 dark:text-neutral-400 truncate">
                                {t.pic || "—"}
                              </span>
                            </div>
                            
                            <div className="flex items-center gap-1 text-[10px] font-mono text-neutral-400">
                              {subTotal > 0 && (
                                <span className="bg-neutral-50 dark:bg-neutral-800 px-1.5 py-0.5 rounded text-[9px]">
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

                {/* Add Button */}
                <div className="p-2 border-t border-neutral-100 dark:border-neutral-800">
                  <button
                    onClick={() => onAddTaskQuick(status)}
                    className="w-full py-1.5 border border-dashed border-neutral-200 hover:border-neutral-400 dark:border-neutral-800 dark:hover:border-neutral-600 text-neutral-400 hover:text-neutral-700 dark:text-neutral-500 dark:hover:text-neutral-300 text-[11px] font-medium rounded-lg flex items-center justify-center gap-1 transition-all"
                  >
                    <Plus className="w-3 h-3" /> Tambah
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
