import React, { useState } from "react";
import { Project, Task, User } from "../types";
import { ChevronLeft, ChevronRight } from "lucide-react";

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

  const months = [
    { label: "Jan", index: 1 }, { label: "Feb", index: 2 }, { label: "Mar", index: 3 },
    { label: "Apr", index: 4 }, { label: "Mei", index: 5 }, { label: "Jun", index: 6 },
    { label: "Jul", index: 7 }, { label: "Ags", index: 8 }, { label: "Sep", index: 9 },
    { label: "Okt", index: 10 }, { label: "Nov", index: 11 }, { label: "Des", index: 12 }
  ];

  function getSpanFraction(startStr: string | undefined, endStr: string | undefined, year: number): { left: number; width: number } | null {
    if (!startStr || !endStr) return null;
    try {
      const sDate = new Date(startStr);
      const eDate = new Date(endStr);
      
      const sYear = sDate.getFullYear();
      const eYear = eDate.getFullYear();

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
    <div className="space-y-4 fade-in pb-10">
      
      {/* Controls */}
      <div className="flex flex-wrap gap-3 items-center bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-4 rounded-xl">
        
        <div className="flex bg-neutral-100 dark:bg-neutral-800 rounded-lg p-1 text-xs">
          <button
            onClick={() => setGanttGrouping('project')}
            className={`px-3 py-1.5 rounded-md font-medium transition-all ${ganttGrouping === 'project' ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-sm' : 'text-neutral-500'}`}
          >
            Proyek
          </button>
          <button
            onClick={() => setGanttGrouping('task')}
            className={`px-3 py-1.5 rounded-md font-medium transition-all ${ganttGrouping === 'task' ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-sm' : 'text-neutral-500'}`}
          >
            Tugas
          </button>
        </div>

        <div className="flex bg-neutral-100 dark:bg-neutral-800 rounded-lg p-1 text-xs">
          <button
            onClick={() => setTimelineScale('bulan')}
            className={`px-3 py-1.5 rounded-md font-medium transition-all ${timelineScale === 'bulan' ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-sm' : 'text-neutral-500'}`}
          >
            Bulan
          </button>
          <button
            onClick={() => setTimelineScale('minggu')}
            className={`px-3 py-1.5 rounded-md font-medium transition-all ${timelineScale === 'minggu' ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-sm' : 'text-neutral-500'}`}
          >
            Minggu
          </button>
        </div>

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

        <div className="flex items-center gap-1 ml-auto">
          <button onClick={() => setCurrentYear(currentYear - 1)} className="p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors">
            <ChevronLeft className="w-4 h-4 text-neutral-500" />
          </button>
          <span className="text-sm font-medium px-2 text-neutral-800 dark:text-neutral-200 min-w-[50px] text-center">
            {currentYear}
          </span>
          <button onClick={() => setCurrentYear(currentYear + 1)} className="p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors">
            <ChevronRight className="w-4 h-4 text-neutral-500" />
          </button>
        </div>
      </div>

      <div className="bg-neutral-50 dark:bg-neutral-950/50 p-2.5 text-xs text-neutral-500 dark:text-neutral-400 rounded-lg border border-neutral-200 dark:border-neutral-800 w-fit">
        Timeline untuk tahun <span className="font-medium text-neutral-800 dark:text-white">{currentYear}</span>
      </div>

      {/* Gantt Table */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-auto max-h-[580px] relative">
        <table className="w-full border-collapse text-xs min-w-[850px]">
          <thead className="sticky top-0 z-30 bg-neutral-50 dark:bg-neutral-950">
            <tr className="text-neutral-500 dark:text-neutral-400 font-medium border-b border-neutral-200 dark:border-neutral-800">
              <th className="sticky top-0 left-0 z-40 bg-neutral-100 dark:bg-neutral-900 p-4 border-r border-neutral-200 dark:border-neutral-800 text-left w-52">
                {ganttGrouping === 'project' ? "Proyek" : "Tugas"}
              </th>
              {timelineScale === 'bulan' ? (
                months.map((m) => (
                  <th key={m.index} className="sticky top-0 bg-neutral-50 dark:bg-neutral-950 p-2.5 border-r border-neutral-100 dark:border-neutral-800 text-center min-w-[45px] font-mono text-[11px]">
                    {m.label}
                  </th>
                ))
              ) : (
                weeks.map((wk) => (
                  <th key={wk.index} className="sticky top-0 bg-neutral-50 dark:bg-neutral-950 p-1 border-r border-neutral-100 dark:border-neutral-800 text-center min-w-[22px] font-mono text-[9px]" title={`Minggu ${wk.index}`}>
                    {wk.label}
                  </th>
                ))
              )}
            </tr>
          </thead>
          <tbody>
            
            {ganttGrouping === 'project' ? (
              projects
                .filter(p => !filterProj || p.kode === filterProj)
                .filter(p => !filterPic || p.pic === filterPic)
                .filter(p => matchesDateFilter(p.startDate, filterTime) || matchesDateFilter(p.endDate, filterTime))
                .map((p) => {
                  const span = getSpanFraction(p.startDate, p.endDate, currentYear);
                  
                  return (
                    <tr key={p.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors border-b border-neutral-100 dark:border-neutral-800/50">
                      <td className="sticky left-0 z-10 bg-white dark:bg-neutral-900 p-4 border-r border-neutral-200 dark:border-neutral-800 font-medium max-w-xs truncate">
                        <span className="bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 text-[10px] font-mono px-2 py-0.5 rounded mr-1.5">
                          {p.kode}
                        </span>
                        <span className="text-neutral-800 dark:text-neutral-200">{p.nama}</span>
                        <p className="text-[10px] text-neutral-400 mt-1">{p.pic || "—"}</p>
                      </td>
                      
                      <td colSpan={timelineScale === 'bulan' ? 12 : 52} className="relative p-2 h-14 bg-neutral-50/20 dark:bg-neutral-950/5">
                        {timelineScale === 'bulan' ? (
                          <div className="absolute inset-0 grid grid-cols-12 pointer-events-none divide-x divide-neutral-100 dark:divide-neutral-800/30" />
                        ) : (
                          <div className="absolute inset-0 flex pointer-events-none">
                            {weeks.map((wk) => (
                              <div key={wk.index} className="flex-1 h-full border-r border-neutral-100 dark:border-neutral-800/15" />
                            ))}
                          </div>
                        )}
 
                        {span ? (
                          <div
                            className="absolute bg-neutral-800 dark:bg-neutral-200 rounded-md py-2 px-3 text-white dark:text-neutral-900 text-[10px] font-medium flex items-center justify-between whitespace-nowrap cursor-default select-none"
                            style={{ left: `${span.left}%`, width: `${span.width}%` }}
                            title={`${p.nama} (${p.startDate} s/d ${p.endDate})`}
                          >
                            <span className="overflow-hidden text-ellipsis">{p.nama}</span>
                            <span className="font-mono text-[9px] opacity-70 ml-2">{p.status}</span>
                          </div>
                        ) : (
                          <span className="text-[10px] text-neutral-400 italic block text-center mt-3">Tidak dalam jangkauan {currentYear}</span>
                        )}
                      </td>
                    </tr>
                  );
                })
            ) : (
              tasks
                .filter(t => !filterProj || t.project === filterProj)
                .filter(t => !filterPic || t.pic === filterPic)
                .filter(t => matchesDateFilter(t.startDate, filterTime) || matchesDateFilter(t.dueDate, filterTime))
                .map((t) => {
                  const span = getSpanFraction(t.startDate, t.dueDate, currentYear);
                  const statusColors: Record<string, string> = {
                    Done: "bg-emerald-600 dark:bg-emerald-500",
                    "In Progress": "bg-amber-500",
                    "Not Started": "bg-neutral-400",
                    Pending: "bg-purple-500"
                  };
                  const barColor = statusColors[t.status] || "bg-neutral-800 dark:bg-neutral-200";
 
                  return (
                    <tr key={t.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors border-b border-neutral-100 dark:border-neutral-800/50">
                      <td className="sticky left-0 z-10 bg-white dark:bg-neutral-900 p-4 border-r border-neutral-200 dark:border-neutral-800 font-medium max-w-xs truncate">
                        <span className="bg-neutral-100 dark:bg-neutral-800 text-neutral-500 text-[10px] font-mono px-2 py-0.5 rounded mr-1.5">
                          {t.project}
                        </span>
                        <span className="text-neutral-800 dark:text-neutral-200">{t.task}</span>
                        <p className="text-[10px] text-neutral-400 mt-1">{t.pic || "—"}</p>
                      </td>
                      
                      <td colSpan={timelineScale === 'bulan' ? 12 : 52} className="relative p-2 h-14 bg-neutral-50/20 dark:bg-neutral-950/5">
                        {timelineScale === 'bulan' ? (
                          <div className="absolute inset-0 grid grid-cols-12 pointer-events-none divide-x divide-neutral-100 dark:divide-neutral-800/30" />
                        ) : (
                          <div className="absolute inset-0 flex pointer-events-none">
                            {weeks.map((wk) => (
                              <div key={wk.index} className="flex-1 h-full border-r border-neutral-100 dark:border-neutral-800/15" />
                            ))}
                          </div>
                        )}
 
                        {span ? (
                          <div
                            onClick={() => onViewTaskDetail(t.id)}
                            className={`absolute ${barColor} rounded-md py-1.5 px-3 text-white text-[10px] font-medium flex items-center justify-between whitespace-nowrap cursor-pointer select-none`}
                            style={{ left: `${span.left}%`, width: `${span.width}%` }}
                            title={`${t.task} (${t.startDate} s/d ${t.dueDate})`}
                          >
                            <span className="overflow-hidden text-ellipsis">{t.task}</span>
                            <span className="font-mono text-[9px] opacity-70 ml-2">{t.progress}%</span>
                          </div>
                        ) : (
                          <span className="text-[10px] text-neutral-400 italic block text-center mt-3">Tidak dalam jangkauan {currentYear}</span>
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
