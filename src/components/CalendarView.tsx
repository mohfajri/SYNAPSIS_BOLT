import React, { useState } from "react";
import { Task, Project } from "../types";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, BookMarked, Layers } from "lucide-react";

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
  
  const [currentDate, setCurrentDate] = useState(new Date(2026, 4, 21)); // Seeding time May 2026
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
    setCurrentDate(new Date(2026, 4, 21)); // Lock coordinate according to environment metadata
    setActiveDateEvents(null);
  }

  // Construct calendar cells
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayIndex = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrev = new Date(year, month, 0).getDate();

  const cells: Date[] = [];
  
  // Backfill previous month days
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    cells.push(new Date(year, month - 1, daysInPrev - i));
  }
  // Current month days
  for (let i = 1; i <= daysInMonth; i++) {
    cells.push(new Date(year, month, i));
  }
  // Pad forward days for complete 6-week matrix
  const remainingSize = 42 - cells.length;
  for (let i = 1; i <= remainingSize; i++) {
    cells.push(new Date(year, month + 1, i));
  }

  // Event parsing & mapping
  const parsedEvents: Record<string, any[]> = {};

  // 1. Task dates (start and end)
  tasks
    .filter(t => !filterProj || t.project === filterProj)
    .filter(t => matchesDateFilter(t.startDate, filterTime) || matchesDateFilter(t.dueDate, filterTime))
    .forEach((t) => {
      const color = t.status === "Done" ? "#10b981" : t.status === "In Progress" ? "#f59e0b" : "#6366f1";
      if (t.dueDate) {
        if (!parsedEvents[t.dueDate]) parsedEvents[t.dueDate] = [];
        parsedEvents[t.dueDate].push({
          id: t.id,
          title: `⏰ TKT: ${t.task}`,
          sub: `${t.project} &bull; PIC: ${t.pic || "Unassigned"}`,
          color: "#d97706",
          type: "task"
        });
      }
      if (t.startDate && t.startDate !== t.dueDate) {
        if (!parsedEvents[t.startDate]) parsedEvents[t.startDate] = [];
        parsedEvents[t.startDate].push({
          id: t.id,
          title: `▶ Mulai: ${t.task}`,
          sub: `${t.project}`,
          color: color,
          type: "task"
        });
      }
    });

  // 2. Project target dates
  projects
    .filter(p => !filterProj || p.kode === filterProj)
    .filter(p => matchesDateFilter(p.startDate, filterTime) || matchesDateFilter(p.endDate, filterTime))
    .forEach((p) => {
      if (p.startDate) {
        if (!parsedEvents[p.startDate]) parsedEvents[p.startDate] = [];
        parsedEvents[p.startDate].push({
          id: p.id,
          title: `🚀 Kickoff: ${p.nama}`,
          sub: `${p.kode} &bull; Client: ${p.client || "No Client"}`,
          color: "#0891b2",
          type: "project"
        });
      }
      if (p.endDate) {
        if (!parsedEvents[p.endDate]) parsedEvents[p.endDate] = [];
        parsedEvents[p.endDate].push({
          id: p.id,
          title: `🏁 Target Selesai: ${p.nama}`,
          sub: `${p.kode}`,
          color: "#8b5cf6",
          type: "project"
        });
      }
    });

  function handleCellClick(dateStr: string) {
    const evs = parsedEvents[dateStr] || [];
    setActiveDateEvents({
      dateStr,
      events: evs
    });
  }

  return (
    <div className="space-y-4 fade-in font-sans pb-10">
      
      {/* Sorter and Month Nav headers */}
      <div className="flex flex-wrap gap-3 items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-xs">
        
        {/* Month selector navigation */}
        <div className="flex items-center gap-1">
          <button 
            onClick={handlePrevMonth}
            className="p-1 border border-slate-250 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 rounded flex items-center"
          >
            <ChevronLeft className="w-4 h-4 text-slate-500" />
          </button>
          <span className="text-xs font-black px-2 mt-0.5 text-center min-w-[150px] text-slate-700 dark:text-slate-300">
            {months[month]} {year}
          </span>
          <button 
            onClick={handleNextMonth}
            className="p-1 border border-slate-250 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 rounded flex items-center"
          >
            <ChevronRight className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        <button 
          onClick={goToday}
          className="px-3.5 py-1.5 border border-slate-250 dark:border-slate-800 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all"
        >
          Mei 2026
        </button>

        {/* Project Filters */}
        <select
          value={filterProj}
          onChange={(e) => setFilterProj(e.target.value)}
          className="bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 text-xs py-1.5 px-3 rounded-lg text-slate-700 dark:text-slate-300 focus:outline-none"
        >
          <option value="">Semua Project</option>
          {projects.map(p => <option key={p.kode} value={p.kode}>{p.kode} – {p.nama}</option>)}
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

        {/* Legend pills */}
        <div className="flex flex-wrap gap-x-3 gap-y-1.5 text-[9px] font-bold text-slate-400 uppercase tracking-wider ml-auto">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" /> Batas Tugas
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 inline-block" /> Mulai Tugas
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 inline-block" /> Mulai Project
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500 inline-block" /> Target Project
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left column: Responsive Calendar Grid */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs lg:col-span-8">
          
          {/* Week name header cells */}
          <div className="grid grid-cols-7 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-805 text-center font-bold py-2.5 text-slate-400 uppercase tracking-widest text-[9px]">
            {weekdays.map(day => <div key={day}>{day}</div>)}
          </div>

          {/* Grid Cells */}
          <div className="grid grid-cols-7">
            {cells.map((dateObj, idx) => {
              const isCurrentMonth = dateObj.getMonth() === month;
              const dateStr = dateObj.toISOString().slice(0, 10);
              const isToday = dateStr === "2026-05-21"; // environment time coordinate code
              const evs = parsedEvents[dateStr] || [];
              const showEvents = evs.slice(0, 2);
              const remainder = evs.length - showEvents.length;

              return (
                <div
                  key={idx}
                  onClick={() => handleCellClick(dateStr)}
                  className={`min-h-[90px] border-r border-b border-slate-100 dark:border-slate-800 p-2 hover:bg-slate-50/50 dark:hover:bg-slate-950/20 transition-all cursor-pointer flex flex-col justify-between ${!isCurrentMonth ? "opacity-30" : ""} ${isToday ? "bg-blue-50/20 dark:bg-blue-950/15 border-l-2 border-l-blue-600" : ""}`}
                >
                  <span className={`font-mono text-xs font-bold ${isToday ? "text-blue-600 dark:text-blue-400 underline decoration-2 underline-offset-2" : "text-slate-400 dark:text-slate-500"}`}>
                    {dateObj.getDate()}
                  </span>

                  <div className="space-y-1.5 mt-1 flex-1">
                    {showEvents.map((ev, sIdx) => (
                      <div
                        key={sIdx}
                        className="text-[9px] font-bold p-1 rounded truncate border border-slate-150/10 leading-tight block select-none bg-slate-100/50 dark:bg-slate-800"
                        style={{ color: ev.color, borderLeft: `2.5px solid ${ev.color}` }}
                        title={ev.title}
                      >
                        {ev.title}
                      </div>
                    ))}
                    {remainder > 0 && (
                      <p className="text-[9px] text-blue-500 font-extrabold">+ {remainder} lagi</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right column: Selected Day Event Reader Info */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs lg:col-span-4 space-y-4">
          <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
            <CalendarIcon className="w-4 h-4 text-blue-500" /> Agenda Kegiatan Hari Terpilih
          </h3>

          {activeDateEvents ? (
            <div className="space-y-3">
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300 border-b border-slate-150/60 pb-1 font-mono">
                Tanggal: {new Date(activeDateEvents.dateStr).toLocaleDateString("id-ID", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
              </p>
              
              {activeDateEvents.events.length === 0 ? (
                <p className="text-xs text-slate-400 italic">Tidak ada rilis tugas maupun kickoff project terdaftar pada tanggal ini.</p>
              ) : (
                <div className="space-y-2.5">
                  {activeDateEvents.events.map((ev, idx) => (
                    <div
                      key={idx}
                      onClick={() => {
                        if (ev.id && ev.type === "task") {
                          onViewTaskDetail(ev.id);
                        }
                      }}
                      className={`p-3 bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800 rounded-xl transition-all ${ev.type === "task" ? "cursor-pointer hover:border-blue-500/25" : ""}`}
                    >
                      <p className="font-bold text-xs" style={{ color: ev.color }}>{ev.title}</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: ev.sub }} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-6 text-slate-400">
              <Layers className="w-8 h-8 mx-auto mb-2 opacity-35 text-slate-400" />
              <p className="text-xs italic">Klik salah satu tanggal di grid kalender untuk membaca rincian timeline tugas di sini.</p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
