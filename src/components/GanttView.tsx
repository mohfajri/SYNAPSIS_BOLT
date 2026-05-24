import React, { useState } from "react";
import { Project, Task, User } from "../types";
import { Calendar, Layers, Hourglass, FolderLock, Shield, ChevronLeft, ChevronRight } from "lucide-react";

interface GanttViewProps {
  tasks: Task[];
  projects: Project[];
  picsList: string[];
  users?: User[];
  pstatusesList: string[];
  picThemeColors: (picName: string) => string;
  onViewTaskDetail: (taskId: string) => void;
}

export default function GanttView({
  tasks,
  projects,
  picsList,
  users = [],
  pstatusesList,
  picThemeColors,
  onViewTaskDetail
}: GanttViewProps) {
  
  // Anchor navigation
  const [currentYear, setCurrentYear] = useState(2026);
  const [filterProj, setFilterProj] = useState("");
  const [filterPic, setFilterPic] = useState("");
  const [filterTime, setFilterTime] = useState("all");
  const [ganttGrouping, setGanttGrouping] = useState<'project' | 'task'>('project');
  const [timelineScale, setTimelineScale] = useState<'bulan' | 'minggu'>('bulan');

  const weeks = Array.from({ length: 52 }, (_, i) => ({
    label: `M${i + 1}`,
    index: i + 1
  }));

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

  // Months array representation
  const months = [
    { label: "Jan", index: 1 },
    { label: "Feb", index: 2 },
    { label: "Mar", index: 3 },
    { label: "Apr", index: 4 },
    { label: "Mei", index: 5 },
    { label: "Jun", index: 6 },
    { label: "Jul", index: 7 },
    { label: "Ags", index: 8 },
    { label: "Sep", index: 9 },
    { label: "Okt", index: 10 },
    { label: "Nov", index: 11 },
    { label: "Des", index: 12 }
  ];

  // Helper to extract year & month
  function getTimelineFraction(dateStr: string | undefined, year: number): { startPercent: number; widthPercent: number } | null {
    if (!dateStr) return null;
    const parts = dateStr.split("-");
    if (parts.length < 2) return null;
    const itemYear = parseInt(parts[0]);
    const itemMonth = parseInt(parts[1]);
    const itemDay = parts[2] ? parseInt(parts[2]) : 15;

    if (itemYear !== year) {
      if (itemYear < year) return { startPercent: 0, widthPercent: 100 };
      if (itemYear > year) return null;
    }

    // Fraction calculation relative to a 12-month calendar grid
    const monthIndex = itemMonth - 1; // 0 to 11
    const dayFraction = itemDay / 30; // 0 to 1
    const totalFraction = (monthIndex + dayFraction) / 12; // 0 to 1
    
    return {
      startPercent: Math.round(totalFraction * 100),
      widthPercent: Math.max(8, Math.round((1 / 12) * 100)) // Min fallback width
    };
  }

  // Combine and calculate spanning fractions
  function getSpanFraction(startStr: string | undefined, endStr: string | undefined, year: number): { left: number; width: number } | null {
    if (!startStr || !endStr) return null;
    try {
      const sDate = new Date(startStr);
      const eDate = new Date(endStr);
      
      const sYear = sDate.getFullYear();
      const eYear = eDate.getFullYear();

      // Lock bounds in scope
      let sMonth = sYear === year ? sDate.getMonth() : 0;
      let sDay = sYear === year ? sDate.getDate() : 1;
      let eMonth = eYear === year ? eDate.getMonth() : 11;
      let eDay = eYear === year ? eDate.getDate() : 30;

      if (sYear > year || eYear < year) return null;

      const totalDaysInYear = 365;
      const calcDayOfYear = (dStr: string) => {
        const dObj = new Date(dStr);
        const start = new Date(dObj.getFullYear(), 0, 0);
        const diff = dObj.getTime() - start.getTime();
        const oneDay = 1000 * 60 * 60 * 24;
        return Math.floor(diff / oneDay);
      };

      let startDayOfYear = sYear === year ? calcDayOfYear(startStr) : 1;
      let endDayOfYear = eYear === year ? calcDayOfYear(endStr) : 365;

      if (startDayOfYear > endDayOfYear) {
        // Swap bounds if faulty
        const tmp = startDayOfYear;
        startDayOfYear = endDayOfYear;
        endDayOfYear = tmp;
      }

      const left = Math.round((startDayOfYear / totalDaysInYear) * 100);
      const width = Math.max(10, Math.round(((endDayOfYear - startDayOfYear + 1) / totalDaysInYear) * 100));

      return {
        left: Math.min(left, 90),
        width: Math.min(width, 100 - left)
      };

    } catch {
      return null;
    }
  }

  return (
    <div className="space-y-4 fade-in font-sans pb-10">
      
      {/* Upper sorters box */}
      <div className="flex flex-wrap gap-3 items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-xs">
        
        {/* Toggle Group type */}
        <div className="flex bg-slate-150/60 dark:bg-slate-950 border border-slate-200 dark:border-slate-855 rounded-lg p-1 text-xs">
          <button
            onClick={() => setGanttGrouping('project')}
            className={`px-3 py-1.5 rounded-md font-bold transition-all flex items-center gap-1 ${ganttGrouping === 'project' ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs' : 'text-slate-500'}`}
          >
            <FolderLock className="w-3.5 h-3.5" /> Per Project Master
          </button>
          <button
            onClick={() => setGanttGrouping('task')}
            className={`px-3 py-1.5 rounded-md font-bold transition-all flex items-center gap-1 ${ganttGrouping === 'task' ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs' : 'text-slate-500'}`}
          >
            <Hourglass className="w-3.5 h-3.5" /> Per Detail Tugas
          </button>
        </div>

        {/* Toggle Scale */}
        <div className="flex bg-slate-150/60 dark:bg-slate-950 border border-slate-200 dark:border-slate-855 rounded-lg p-1 text-xs">
          <button
            onClick={() => setTimelineScale('bulan')}
            className={`px-3 py-1.5 rounded-md font-bold transition-all ${timelineScale === 'bulan' ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs' : 'text-slate-500'}`}
          >
            📅 Bulanan
          </button>
          <button
            onClick={() => setTimelineScale('minggu')}
            className={`px-3 py-1.5 rounded-md font-bold transition-all ${timelineScale === 'minggu' ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs' : 'text-slate-500'}`}
          >
            🗓️ Mingguan
          </button>
        </div>

        {/* Filters */}
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

        {/* Anchors navigations */}
        <div className="flex items-center gap-1 ml-auto">
          <button 
            onClick={() => setCurrentYear(currentYear - 1)}
            className="p-1 border border-slate-250 dark:border-slate-850 hover:bg-slate-100 rounded"
          >
            <ChevronLeft className="w-4 h-4 text-slate-500" />
          </button>
          <span className="text-xs font-black px-2 mt-0.5 text-slate-700 dark:text-slate-300 font-mono">
            {currentYear}
          </span>
          <button 
            onClick={() => setCurrentYear(currentYear + 1)}
            className="p-1 border border-slate-250 dark:border-slate-850 hover:bg-slate-100 rounded"
          >
            <ChevronRight className="w-4 h-4 text-slate-500" />
          </button>
        </div>
      </div>

      <div className="bg-slate-50/65 dark:bg-slate-950/20 p-2 text-[11px] text-slate-500 dark:text-slate-400 font-medium rounded-lg border border-slate-150/10 mb-2 w-fit">
         Timeline di bawah mencerminkan visualisasi jadwal start date dan end date untuk tahun <span className="font-bold text-blue-600 dark:text-blue-400 font-mono">{currentYear}</span>.
      </div>

      {/* Gantt Table Grid Container with Max Height and Dual Scroll */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-auto max-h-[580px] shadow-sm relative">
        <table className="w-full border-collapse text-xs min-w-[850px]">
          <thead className="sticky top-0 z-30 bg-slate-50 dark:bg-slate-950 shadow-xs">
            {/* Headers row with Month or Week labels */}
            <tr className="bg-slate-50 dark:bg-slate-950/95 text-slate-500 dark:text-slate-455 font-bold border-b border-slate-200 dark:border-slate-800">
              <th className="sticky top-0 left-0 z-40 bg-slate-100 dark:bg-slate-950 p-4 border-r border-slate-200 dark:border-slate-800 text-left w-52 border-b border-slate-250 dark:border-slate-850">
                Rincian Entitas ({ganttGrouping === 'project' ? "Project Master" : "Tugas Pelaksana"})
              </th>
              {timelineScale === 'bulan' ? (
                months.map((m) => (
                  <th key={m.index} className="sticky top-0 bg-slate-50 dark:bg-slate-950/95 p-2.5 border-r border-slate-150 dark:border-slate-805 text-center min-w-[45px] font-mono border-b border-slate-250 dark:border-slate-850">
                    {m.label}
                  </th>
                ))
              ) : (
                weeks.map((wk) => (
                  <th key={wk.index} className="sticky top-0 bg-slate-50 dark:bg-slate-950/95 p-1 border-r border-slate-150 dark:border-slate-805 text-center min-w-[22px] font-mono text-[9px] border-b border-slate-250 dark:border-slate-850" title={`Minggu ${wk.index}`}>
                    {wk.label}
                  </th>
                ))
              )}
            </tr>
          </thead>
          <tbody>
            
            {ganttGrouping === 'project' ? (
              
              /* RENDER METHOD: PROJECTS TIMELINE ROWS */
              projects
                .filter(p => !filterProj || p.kode === filterProj)
                .filter(p => !filterPic || p.pic === filterPic)
                .filter(p => matchesDateFilter(p.startDate, filterTime) || matchesDateFilter(p.endDate, filterTime))
                .map((p) => {
                  const span = getSpanFraction(p.startDate, p.endDate, currentYear);
                  
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-950/25 transition-colors border-b border-slate-100 dark:border-slate-850/60">
                      <td className="sticky left-0 z-10 bg-white dark:bg-slate-900 p-4 border-r border-slate-200 dark:border-slate-800 font-bold max-w-xs truncate shadow-sm">
                        <span className="bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 text-[9px] font-bold font-mono px-2 py-0.5 rounded mr-1.5 align-middle">
                          {p.kode}
                        </span>
                        <span className="text-slate-800 dark:text-slate-100">{p.nama}</span>
                        <p className="text-[10px] text-slate-400 font-semibold mt-1">PIC: {p.pic || "—"}</p>
                      </td>
                      
                      <td colSpan={timelineScale === 'bulan' ? 12 : 52} className="relative p-2 h-14 bg-slate-50/20 dark:bg-slate-950/5">
                        {/* Month / Week guide lines */}
                        {timelineScale === 'bulan' ? (
                          <div className="absolute inset-0 grid grid-cols-12 pointer-events-none divide-x divide-slate-100 dark:divide-slate-800/40" />
                        ) : (
                          <div className="absolute inset-0 flex pointer-events-none">
                            {weeks.map((wk) => (
                              <div key={wk.index} className="flex-1 h-full border-r border-slate-100 dark:border-slate-800/20" />
                            ))}
                          </div>
                        )}
 
                        {span ? (
                          <div
                            className="absolute bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-600 rounded-lg py-2.5 px-3 text-white text-[10px] font-extrabold flex items-center justify-between whitespace-nowrap shadow-sm shadow-indigo-500/10 cursor-alias select-none"
                            style={{ left: `${span.left}%`, width: `${span.width}%` }}
                            title={`${p.nama} (${p.startDate} s/d ${p.endDate})`}
                          >
                            <span className="overflow-hidden text-ellipsis">{p.nama}</span>
                            <span className="font-mono bg-black/20 text-[9px] px-1 rounded">{p.status}</span>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 italic block text-center mt-3">Tidak dalam jangkauan aktif tahun {currentYear}</span>
                        )}
                      </td>
                    </tr>
                  );
                })
            ) : (
              
              /* RENDER METHOD: TASKS SCROLL TIMELINES ROW */
              tasks
                .filter(t => !filterProj || t.project === filterProj)
                .filter(t => !filterPic || t.pic === filterPic)
                .filter(t => matchesDateFilter(t.startDate, filterTime) || matchesDateFilter(t.dueDate, filterTime))
                .map((t) => {
                  const span = getSpanFraction(t.startDate, t.dueDate, currentYear);
                  const statusColors: Record<string, string> = {
                    Done: "from-emerald-500 to-emerald-600 shadow-emerald-500/10",
                    "In Progress": "from-amber-500 to-amber-600 shadow-amber-500/10",
                    "Not Started": "from-slate-400 to-slate-500",
                    Pending: "from-purple-500 to-purple-600 shadow-purple-500/10"
                  };
                  const barGradient = statusColors[t.status] || "from-blue-500 to-blue-600";
 
                  return (
                    <tr key={t.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-950/25 transition-colors border-b border-slate-100 dark:border-slate-850/60">
                      <td className="sticky left-0 z-10 bg-white dark:bg-slate-900 p-4 border-r border-slate-200 dark:border-slate-800 font-bold max-w-xs truncate shadow-sm">
                        <span className="bg-slate-200 dark:bg-slate-800 text-slate-755 dark:text-slate-300 text-[9px] font-bold font-mono px-2 py-0.5 rounded mr-1.5 align-middle">
                          {t.project}
                        </span>
                        <span className="text-slate-850 dark:text-slate-100">{t.task}</span>
                        <p className="text-[10px] text-slate-400 font-semibold mt-1">PIC: {t.pic || "—"}</p>
                      </td>
                      
                      <td colSpan={timelineScale === 'bulan' ? 12 : 52} className="relative p-2 h-14 bg-slate-50/20 dark:bg-slate-950/5">
                        {/* Month / Week guide lines */}
                        {timelineScale === 'bulan' ? (
                          <div className="absolute inset-0 grid grid-cols-12 pointer-events-none divide-x divide-slate-100 dark:divide-slate-800/40" />
                        ) : (
                          <div className="absolute inset-0 flex pointer-events-none">
                            {weeks.map((wk) => (
                              <div key={wk.index} className="flex-1 h-full border-r border-slate-100 dark:border-slate-800/20" />
                            ))}
                          </div>
                        )}
 
                        {span ? (
                          <div
                            onClick={() => onViewTaskDetail(t.id)}
                            className={`absolute bg-gradient-to-r ${barGradient} rounded-lg py-1.5 px-3.5 text-white text-[10px] font-bold flex items-center justify-between whitespace-nowrap shadow-xs cursor-pointer select-none`}
                            style={{ left: `${span.left}%`, width: `${span.width}%` }}
                            title={`${t.task} (${t.startDate} s/d ${t.dueDate})`}
                          >
                            <span className="overflow-hidden text-ellipsis">{t.task}</span>
                            <span className="font-mono text-[9px]">{t.progress}%</span>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 italic block text-center mt-3">Tidak dalam jangkauan aktif tahun {currentYear}</span>
                        )}
                      </td>
                    </tr>
                  );
                })
            )}
 
          </tbody>
        </table>
      </div>

    </div>
  );
}
