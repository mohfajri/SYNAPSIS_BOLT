import React, { useState } from "react";
import { Task, Project } from "../types";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Layers } from "lucide-react";

interface CalendarViewProps {
  tasks: Task[];
  projects: Project[];
  onViewTaskDetail: (taskId: string) => void;
}

export default function CalendarView({
  tasks,
  projects,
  onViewTaskDetail
}: CalendarViewProps) {
  
  const [currentDate, setCurrentDate] = useState(new Date(2026, 4, 21));
  const [filterProj, setFilterProj] = useState("");
  const [filterTime, setFilterTime] = useState("all");
  const [activeDateEvents, setActiveDateEvents] = useState<{ dateStr: string; events: any[] } | null>(null);

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
    "Januari", "Februari", "Maret", "April", "Mei", "Juni", 
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];
  
  const weekdays = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

  function handlePrevMonth() {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    setActiveDateEvents(null);
  }

  function handleNextMonth() {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    setActiveDateEvents(null);
  }

  function goToday() {
    setCurrentDate(new Date(2026, 4, 21));
    setActiveDateEvents(null);
  }

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const cells: Date[] = [];
  
  const firstDayIndex = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrev = new Date(year, month, 0).getDate();
  
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    cells.push(new Date(year, month - 1, daysInPrev - i));
  }
  for (let i = 1; i <= daysInMonth; i++) {
    cells.push(new Date(year, month, i));
  }
  const remainingSize = 42 - cells.length;
  for (let i = 1; i <= remainingSize; i++) {
    cells.push(new Date(year, month + 1, i));
  }

  const parsedEvents: Record<string, any[]> = {};

  tasks
    .filter(t => !filterProj || t.project === filterProj)
    .filter(t => matchesDateFilter(t.startDate, filterTime) || matchesDateFilter(t.dueDate, filterTime))
    .forEach((t) => {
      const color = t.status === "Done" ? "#16a34a" : t.status === "In Progress" ? "#d97706" : "#2563eb";
      if (t.dueDate) {
        if (!parsedEvents[t.dueDate]) parsedEvents[t.dueDate] = [];
        parsedEvents[t.dueDate].push({
          id: t.id,
          title: t.task,
          sub: `${t.project} • ${t.pic || "—"}`,
          color: "#dc2626",
          type: "task"
        });
      }
      if (t.startDate && t.startDate !== t.dueDate) {
        if (!parsedEvents[t.startDate]) parsedEvents[t.startDate] = [];
        parsedEvents[t.startDate].push({
          id: t.id,
          title: t.task,
          sub: `${t.project}`,
          color: color,
          type: "task"
        });
      }
    });

  projects
    .filter(p => !filterProj || p.kode === filterProj)
    .filter(p => matchesDateFilter(p.startDate, filterTime) || matchesDateFilter(p.endDate, filterTime))
    .forEach((p) => {
      if (p.startDate) {
        if (!parsedEvents[p.startDate]) parsedEvents[p.startDate] = [];
        parsedEvents[p.startDate].push({
          id: p.id,
          title: `Kickoff: ${p.nama}`,
          sub: `${p.kode}`,
          color: "#0891b2",
          type: "project"
        });
      }
      if (p.endDate) {
        if (!parsedEvents[p.endDate]) parsedEvents[p.endDate] = [];
        parsedEvents[p.endDate].push({
          id: p.id,
          title: `Deadline: ${p.nama}`,
          sub: `${p.kode}`,
          color: "#7c3aed",
          type: "project"
        });
      }
    });

  function handleCellClick(dateStr: string) {
    setActiveDateEvents({
      dateStr,
      events: parsedEvents[dateStr] || []
    });
  }

  return (
    <div className="space-y-4 fade-in pb-10">
      
      {/* Controls */}
      <div className="flex flex-wrap gap-3 items-center bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-4 rounded-xl">
        
        <div className="flex items-center gap-1">
          <button onClick={handlePrevMonth} className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors">
            <ChevronLeft className="w-4 h-4 text-neutral-500" />
          </button>
          <span className="text-sm font-medium px-3 text-neutral-800 dark:text-neutral-200 min-w-[140px] text-center">
            {months[month]} {year}
          </span>
          <button onClick={handleNextMonth} className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors">
            <ChevronRight className="w-4 h-4 text-neutral-500" />
          </button>
        </div>

        <button onClick={goToday} className="px-3 py-1.5 text-sm font-medium text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors">
          Hari Ini
        </button>

        <select
          value={filterProj}
          onChange={(e) => setFilterProj(e.target.value)}
          className="bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-sm py-1.5 px-3 rounded-lg text-neutral-700 dark:text-neutral-300 focus:outline-none"
        >
          <option value="">Semua Proyek</option>
          {projects.map(p => <option key={p.kode} value={p.kode}>{p.kode} – {p.nama}</option>)}
        </select>

        <select
          value={filterTime}
          onChange={(e) => setFilterTime(e.target.value)}
          className="bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-sm py-1.5 px-3 rounded-lg text-neutral-700 dark:text-neutral-300 focus:outline-none"
        >
          <option value="all">Semua Waktu</option>
          <option value="hari">Hari Ini</option>
          <option value="minggu">Minggu Ini</option>
          <option value="bulan">Bulan Ini</option>
          <option value="tahun">Tahun Ini</option>
        </select>

        <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-neutral-400 ml-auto">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-500" /> Deadline
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-500" /> Mulai
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-cyan-500" /> Proyek
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* Calendar Grid */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden lg:col-span-8">
          
          <div className="grid grid-cols-7 bg-neutral-50 dark:bg-neutral-950 border-b border-neutral-200 dark:border-neutral-800 text-center py-2.5 text-neutral-400 text-xs font-medium">
            {weekdays.map(day => <div key={day}>{day}</div>)}
          </div>

          <div className="grid grid-cols-7">
            {cells.map((dateObj, idx) => {
              const isCurrentMonth = dateObj.getMonth() === month;
              const dateStr = dateObj.toISOString().slice(0, 10);
              const isToday = dateStr === "2026-05-21";
              const evs = parsedEvents[dateStr] || [];
              const showEvents = evs.slice(0, 2);
              const remainder = evs.length - showEvents.length;

              return (
                <div
                  key={idx}
                  onClick={() => handleCellClick(dateStr)}
                  className={`min-h-[80px] border-r border-b border-neutral-100 dark:border-neutral-800 p-2 hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-all cursor-pointer flex flex-col justify-between ${!isCurrentMonth ? "opacity-25" : ""} ${isToday ? "bg-neutral-50 dark:bg-neutral-800/40" : ""}`}
                >
                  <span className={`text-xs font-medium ${isToday ? "text-neutral-900 dark:text-white bg-neutral-900 dark:bg-white w-6 h-6 rounded-full flex items-center justify-center" : "text-neutral-400 dark:text-neutral-500"}`}>
                    {dateObj.getDate()}
                  </span>

                  <div className="space-y-1 mt-1 flex-1">
                    {showEvents.map((ev, sIdx) => (
                      <div
                        key={sIdx}
                        className="text-[10px] font-medium p-1 rounded truncate leading-tight block select-none bg-neutral-100 dark:bg-neutral-800"
                        style={{ color: ev.color, borderLeft: `2px solid ${ev.color}` }}
                        title={ev.title}
                      >
                        {ev.title}
                      </div>
                    ))}
                    {remainder > 0 && (
                      <p className="text-[10px] text-neutral-400 font-medium">+{remainder}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Day Panel */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 lg:col-span-4 space-y-4">
          <h3 className="text-sm font-medium text-neutral-500 dark:text-neutral-400 flex items-center gap-2">
            <CalendarIcon className="w-4 h-4" /> Agenda
          </h3>

          {activeDateEvents ? (
            <div className="space-y-3">
              <p className="text-xs text-neutral-700 dark:text-neutral-300 font-medium">
                {new Date(activeDateEvents.dateStr).toLocaleDateString("id-ID", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
              </p>
              
              {activeDateEvents.events.length === 0 ? (
                <p className="text-xs text-neutral-400 italic">Tidak ada kegiatan</p>
              ) : (
                <div className="space-y-2">
                  {activeDateEvents.events.map((ev, idx) => (
                    <div
                      key={idx}
                      onClick={() => { if (ev.id && ev.type === "task") onViewTaskDetail(ev.id); }}
                      className={`p-3 bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-100 dark:border-neutral-800 rounded-lg transition-all ${ev.type === "task" ? "cursor-pointer hover:border-neutral-300 dark:hover:border-neutral-600" : ""}`}
                    >
                      <p className="font-medium text-xs" style={{ color: ev.color }}>{ev.title}</p>
                      <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1">{ev.sub}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-neutral-400">
              <Layers className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-xs">Klik tanggal untuk melihat agenda</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
