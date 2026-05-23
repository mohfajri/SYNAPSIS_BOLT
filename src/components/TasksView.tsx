import React, { useState, useEffect } from "react";
import { Task, Project, User, SubTask } from "../types";
import { 
  Search, 
  Plus, 
  Download, 
  LayoutGrid, 
  ListOrdered, 
  Calendar, 
  Paperclip, 
  Eye, 
  Edit2, 
  UserCheck, 
  CheckSquare, 
  Trash2,
  X,
  PlusCircle,
  AlertCircle,
  Info,
  FileText,
  Share2
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface TasksViewProps {
  tasks: Task[];
  projects: Project[];
  currentUser: User | null;
  picsList: string[];
  modulsList: string[];
  tasktypesList: string[];
  catProgsList: string[];
  picThemeColors: (picName: string) => string;
  onAddTask: (data: Partial<Task>) => Promise<void>;
  onUpdateTask: (id: string, data: Partial<Task>) => Promise<void>;
  onDeleteTask: (id: string) => Promise<void>;
  prioritiesList?: string[];
  progressStatusesList?: string[];
  initialOpenWithStatus?: string | null;
  onClearInitialStatus?: () => void;
}

export default function TasksView({
  tasks,
  projects,
  currentUser,
  picsList,
  modulsList,
  tasktypesList,
  catProgsList,
  picThemeColors,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
  prioritiesList = ["Urgent", "High", "Medium", "Low", "Very Low"],
  progressStatusesList = ["Not Started", "In Progress", "Done", "Pending", "Cancelled", "Backlog"],
  initialOpenWithStatus,
  onClearInitialStatus
}: TasksViewProps) {
  
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterPriority, setFilterPriority] = useState("");
  const [filterPic, setFilterPic] = useState("");
  const [filterProject, setFilterProject] = useState("");
  const [filterTaskType, setFilterTaskType] = useState("");
  const [filterCatProgress, setFilterCatProgress] = useState("");
  
  // View mode State: 'ticket' (interactive grid cards) or 'table' (rows)
  const [viewMode, setViewMode] = useState<'ticket' | 'table'>('ticket');

  // Detail Modal State
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  
  // Create / Edit Form Active State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  
  // Form input variables
  const [projectCode, setProjectCode] = useState("");
  const [modulName, setModulName] = useState("");
  const [taskName, setTaskName] = useState("");
  const [taskType, setTaskType] = useState("");
  const [catProgress, setCatProgress] = useState("");
  const [pic, setPic] = useState("");
  const [priority, setPriority] = useState<string>("Medium");
  const [status, setStatus] = useState<string>("Not Started");
  const [startDate, setStartDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [progressManual, setProgressManual] = useState(0);
  const [notes, setNotes] = useState("");
  const [url, setUrl] = useState("");
  const [tempSubTasks, setTempSubTasks] = useState<SubTask[]>([]);
  const [newSubTitle, setNewSubTitle] = useState("");

  // Penyesuaian 10 & 14 States
  const [taskCategoryType, setTaskCategoryType] = useState<string>("Project");
  const [reporterName, setReporterName] = useState("");
  const [reporterDept, setReporterDept] = useState("");
  const [glpiId, setGlpiId] = useState("");
  const [mantisId, setMantisId] = useState("");
  const [gitlabId, setGitlabId] = useState("");
  const [externalTicketStatus, setExternalTicketStatus] = useState<string>("");

  const todayStr = new Date().toISOString().slice(0, 10);

  // Filters logic mapping
  const filtered = tasks.filter((t) => {
    const sQuery = `${t.task} ${t.modul || ""} ${t.categoryProgress || ""} ${t.project}`.toLowerCase();
    const matchesSearch = sQuery.includes(search.toLowerCase());
    const matchesStatus = filterStatus === "" || t.status === filterStatus;
    const matchesPriority = filterPriority === "" || t.priority === filterPriority;
    const matchesPic = filterPic === "" || t.pic === filterPic;
    const matchesProject = filterProject === "" || t.project === filterProject;
    const matchesTaskType = filterTaskType === "" || t.taskType === filterTaskType;
    const matchesCatProgress = filterCatProgress === "" || t.categoryProgress === filterCatProgress;

    return (
      matchesSearch &&
      matchesStatus &&
      matchesPriority &&
      matchesPic &&
      matchesProject &&
      matchesTaskType &&
      matchesCatProgress
    );
  });

  // Export CSV Helper
  function handleExportCSV() {
    const headers = [
      "ID Tugas", "Kode Project", "Nama Project", "Nama Tugas", "Modul", 
      "Kategori Progress", "PIC Pelaksana", "Prioritas", "Batas Waktu", "Status", "Progress (%)"
    ];
    
    const rows = filtered.map((t) => {
      const pName = projects.find(p => p.kode === t.project)?.nama || t.project;
      return [
        t.id, t.project, `"${pName}"`, `"${t.task}"`, `"${t.modul || ""}"`,
        `"${t.categoryProgress || ""}"`, `"${t.pic || ""}"`, t.priority, t.dueDate || "", t.status, `${t.progress}%`
      ];
    });

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
      + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `TaskMaster_Export_${todayStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function openCreate() {
    setEditingTask(null);
    setProjectCode(projects[0]?.kode || "");
    setModulName(modulsList[0] || "");
    setTaskName("");
    setTaskType(tasktypesList[0] || "");
    setCatProgress(catProgsList[0] || "");
    setPic(picsList[0] || "");
    setPriority("Medium");
    setStatus("Not Started");
    setStartDate(todayStr);
    setDueDate("");
    setProgressManual(0);
    setNotes("");
    setUrl("");
    setTempSubTasks([]);
    setTaskCategoryType("Project");
    setReporterName("");
    setReporterDept("");
    setGlpiId("");
    setMantisId("");
    setGitlabId("");
    setExternalTicketStatus("");
    setIsFormOpen(true);
  }

  // Auto-preset for Quick Add on Kanban Board (Item #13)
  useEffect(() => {
    if (initialOpenWithStatus) {
      openCreate();
      setStatus(initialOpenWithStatus);
      if (onClearInitialStatus) {
        onClearInitialStatus();
      }
    }
  }, [initialOpenWithStatus, onClearInitialStatus]);

  function openEdit(t: Task) {
    setEditingTask(t);
    setProjectCode(t.project || "");
    setModulName(t.modul || "");
    setTaskName(t.task);
    setTaskType(t.taskType || "");
    setCatProgress(t.categoryProgress || "");
    setPic(t.pic || "");
    setPriority(t.priority);
    setStatus(t.status);
    setStartDate(t.startDate || "");
    setDueDate(t.dueDate || "");
    setProgressManual(t.progress || 0);
    setNotes(t.notes || "");
    setUrl(t.url || "");
    setTempSubTasks(t.subtasks || []);
    setTaskCategoryType(t.taskCategoryType || "Project");
    setReporterName(t.reporterName || "");
    setReporterDept(t.reporterDept || "");
    setGlpiId(t.glpiId || "");
    setMantisId(t.mantisId || "");
    setGitlabId(t.gitlabId || "");
    setExternalTicketStatus(t.externalTicketStatus || "");
    setIsFormOpen(true);
  }

  // Handle addition of temporary subtask checklist on the form
  function handleAddTempSub() {
    if (!newSubTitle.trim()) return;
    const item: SubTask = {
      id: "sub-" + Math.random().toString(36).slice(2, 9),
      title: newSubTitle.trim(),
      done: false
    };
    const nextList = [...tempSubTasks, item];
    setTempSubTasks(nextList);
    setNewSubTitle("");

    // Recalculate automatic progress if subtasks exist
    const completed = nextList.filter(s => s.done).length;
    setProgressManual(Math.round((completed / nextList.length) * 100));
  }

  function toggleTempSubDone(id: string) {
    const list = tempSubTasks.map(s => s.id === id ? { ...s, done: !s.done } : s);
    setTempSubTasks(list);
    const completed = list.filter(s => s.done).length;
    setProgressManual(Math.round((completed / list.length) * 100));
  }

  function deleteTempSub(id: string) {
    const list = tempSubTasks.filter(s => s.id !== id);
    setTempSubTasks(list);
    if (list.length > 0) {
      const completed = list.filter(s => s.done).length;
      setProgressManual(Math.round((completed / list.length) * 100));
    } else {
      setProgressManual(0);
    }
  }

  async function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!taskName.trim()) return;

    // Auto-calculate progress and override base metrics if list is active
    let finalProgress = progressManual;
    let finalStatus = status;

    if (tempSubTasks.length > 0) {
      const completedCount = tempSubTasks.filter(s => s.done).length;
      finalProgress = Math.round((completedCount / tempSubTasks.length) * 100);
      if (finalProgress === 100) {
        finalStatus = "Done";
      } else if (finalProgress > 0 && finalStatus === "Not Started") {
        finalStatus = "In Progress";
      }
    }

    const payload: Partial<Task> = {
      project: taskCategoryType === "Project" ? projectCode : "",
      modul: taskCategoryType === "Project" ? modulName : "",
      task: taskName,
      taskType,
      categoryProgress: catProgress,
      pic,
      priority,
      status: finalStatus,
      startDate,
      dueDate,
      progress: finalProgress,
      notes,
      url,
      subtasks: tempSubTasks,
      taskCategoryType,
      reporterName: taskCategoryType !== "Project" ? reporterName : "",
      reporterDept: taskCategoryType !== "Project" ? reporterDept : "",
      glpiId,
      mantisId,
      gitlabId,
      externalTicketStatus
    };

    if (editingTask) {
      await onUpdateTask(editingTask.id, payload);
    } else {
      await onAddTask(payload);
    }
    setIsFormOpen(false);
  }

  // Live checker modifier on view popup
  async function handleLiveSubToggle(t: Task, subId: string) {
    const nextSubs = t.subtasks.map(s => s.id === subId ? { ...s, done: !s.done } : s);
    const completed = nextSubs.filter(s => s.done).length;
    let progress = Math.round((completed / nextSubs.length) * 100);
    
    let nextStatus = t.status;
    if (progress === 100) nextStatus = "Done";
    else if (progress > 0 && t.status === "Not Started") nextStatus = "In Progress";

    const updateBody = {
      ...t,
      subtasks: nextSubs,
      progress,
      status: nextStatus
    };

    await onUpdateTask(t.id, updateBody);
    setSelectedTask(updateBody); // refresh detail view
  }

  // Custom pill binders
  function getStatusStyle(st: string) {
    const maps: Record<string, string> = {
      Done: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400",
      "In Progress": "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400",
      "Not Started": "bg-slate-100 text-slate-800 dark:bg-slate-800/60 dark:text-slate-400",
      Pending: "bg-purple-100 text-purple-805 dark:bg-purple-950/40 dark:text-purple-400",
      Cancelled: "bg-red-100 text-red-800 dark:bg-red-955/40 dark:text-red-400",
      Backlog: "bg-cyan-100 text-cyan-850 dark:bg-cyan-950/40 dark:text-cyan-400"
    };
    return maps[st] || "bg-slate-100 text-slate-700";
  }

  function getPriorityStyle(p: string) {
    const maps: Record<string, string> = {
      Urgent: "bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-955/35 dark:text-rose-400",
      High: "bg-orange-50 border-orange-100 text-orange-755 dark:bg-orange-950/20 dark:text-orange-400",
      Medium: "bg-amber-50 border-amber-250 text-amber-700 dark:bg-amber-950/10 dark:text-amber-400",
      Low: "bg-emerald-50 border-emerald-100 text-emerald-705 dark:bg-emerald-955/10 dark:text-emerald-400",
      "Very Low": "bg-slate-50 border-slate-200 text-slate-700 dark:bg-slate-800/10 dark:text-slate-400"
    };
    return (maps[p] || "bg-slate-50 text-slate-700") + " border text-[10px] font-bold px-2 py-0.5 rounded";
  }

  // --- RENDERING MAIN LOGIC ---

  // RENDER METHOD 1: TASK CREATION & EDITING FORM (FULL VIEW INSTEAD OF POPUP MODAL)
  if (isFormOpen) {
    return (
      <div className="space-y-6 fade-in font-sans pb-24 max-w-4xl mx-auto">
        
        {/* Breadcrumbs Navigation */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-xs space-y-4">
          <nav className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500 mb-2">
            <span 
              className="text-xs font-bold hover:underline cursor-pointer" 
              onClick={() => setIsFormOpen(false)}
            >
              Tugas & Progress
            </span>
            <span className="text-xs font-bold">&rarr;</span>
            <span className="text-xs font-black text-blue-600 dark:text-blue-400">
              {editingTask ? "Ubah Rincian Tugas" : "Tambah Tugas Baru"}
            </span>
          </nav>

          <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4">
            <div>
              <div className="flex items-center gap-1.5 text-[10px] text-blue-605 dark:text-blue-400 font-black uppercase tracking-widest mb-1 font-mono">
                <span>Task Master</span>
                <span>/</span>
                <span className="text-slate-550 dark:text-slate-400">{editingTask ? "Edit Mode" : "Creation Mode"}</span>
              </div>
              <h2 className="text-2xl font-black text-slate-800 dark:text-white leading-tight">
                {editingTask ? "Ubah Rincian Tugas" : "Tambah Tugas Baru"}
              </h2>
              <p className="text-xs text-slate-450 dark:text-slate-500 font-medium mt-1">
                Tentukan deskripsi tugas, penanggung jawab (PIC) serta prioritas penyelesaian tugas yang detail.
              </p>
            </div>
            
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="px-5 py-2.5 border border-slate-250 dark:border-slate-800 text-slate-600 dark:text-slate-400 text-xs font-bold rounded-lg hover:bg-slate-50 dark:hover:bg-slate-850/30 transition-all cursor-pointer"
              >
                Cancel / Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  const btnSubmit = document.getElementById("submit-btn-trigger");
                  if (btnSubmit) btnSubmit.click();
                }}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black rounded-lg hover:shadow-lg active:scale-95 transition-all cursor-pointer"
              >
                {editingTask ? "Simpan Perubahan" : "Simpan & Buat"}
              </button>
            </div>
          </div>
        </div>

        {/* Form Body layout */}
        <form onSubmit={handleFormSubmit} className="space-y-6 text-xs">
          
          {/* Section 1: Basic Info */}
          <div className="bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 p-6 rounded-2xl shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800/60">
              <Info className="w-4.5 h-4.5 text-blue-600 dark:text-blue-400 shrink-0" />
              <h3 className="font-extrabold text-[11px] text-slate-800 dark:text-slate-200 uppercase tracking-widest">Informasi Utama (Basic Info)</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2 flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">NAMA TUGAS / DESKRIPSI *</label>
                <input
                  type="text"
                  required
                  value={taskName}
                  onChange={(e) => setTaskName(e.target.value)}
                  placeholder="Contoh: Implementasi Form Pendaftaran Pasien Baru"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-lg p-3 text-slate-800 dark:text-slate-100 font-semibold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-550 transition-all placeholder:font-normal placeholder:opacity-50"
                />
              </div>

              <div className="flex flex-col gap-1.5 md:col-span-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">KATEGORI TUGAS *</label>
                <div className="flex gap-4 p-1 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
                  {["Project", "Request", "Incident"].map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setTaskCategoryType(type)}
                      className={`flex-1 py-2 text-center rounded-lg font-black text-xs transition-all cursor-pointer ${
                        taskCategoryType === type
                          ? "bg-blue-600 text-white shadow-xs"
                          : "text-slate-600 dark:text-slate-450 hover:bg-slate-100 dark:hover:bg-slate-900"
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {taskCategoryType === "Project" ? (
                <>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">PROJECT SELECTION</label>
                    <select
                      value={projectCode}
                      onChange={(e) => setProjectCode(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-lg p-3 text-slate-800 dark:text-slate-200 font-medium focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer"
                    >
                      {projects.map(p => (
                        <option key={p.kode} value={p.kode}>{p.kode} – {p.nama}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">MODULE / MODUL TERKAIT</label>
                    <select
                      value={modulName}
                      onChange={(e) => setModulName(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-lg p-3 text-slate-800 dark:text-slate-200 font-medium focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer"
                    >
                      {modulsList.map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">NAMA PELAPOR *</label>
                    <input
                      type="text"
                      required
                      value={reporterName}
                      onChange={(e) => setReporterName(e.target.value)}
                      placeholder="Ketik nama pelapor / helpdesk..."
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-lg p-3 text-slate-800 dark:text-slate-100 font-semibold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-550 transition-all placeholder:font-normal placeholder:opacity-50"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">BAGIAN PELAPOR / UNIT *</label>
                    <input
                      type="text"
                      required
                      value={reporterDept}
                      onChange={(e) => setReporterDept(e.target.value)}
                      placeholder="Contoh: Unit SIMRS, Rawat Jalan, Keuangan..."
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-lg p-3 text-slate-800 dark:text-slate-100 font-semibold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-550 transition-all placeholder:font-normal placeholder:opacity-50"
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Section 2: Task Metadata */}
          <div className="bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 p-6 rounded-2xl shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800/60">
              <UserCheck className="w-4.5 h-4.5 text-blue-600 dark:text-blue-400 shrink-0" />
              <h3 className="font-extrabold text-[11px] text-slate-800 dark:text-slate-200 uppercase tracking-widest">Task Metadata</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* TIPE TUGAS / TASK TYPE AS RADIO PILLS */}
              <div className="flex flex-col gap-2 md:col-span-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">TIPE TUGAS (TASK TYPE)</label>
                <div className="flex flex-wrap gap-2">
                  {tasktypesList.map(t => (
                    <label key={t} className="cursor-pointer">
                      <input
                        type="radio"
                        name="task_type_radio"
                        className="hidden peer"
                        checked={taskType === t}
                        onChange={() => setTaskType(t)}
                      />
                      <span className="px-4 py-2.5 rounded-full border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-950 text-[11px] font-bold hover:shadow-xs peer-checked:bg-blue-600 peer-checked:text-white peer-checked:border-blue-600 transition-all block select-none">
                        {t}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">PIC / ASSIGNEE</label>
                <select
                  value={pic}
                  onChange={(e) => setPic(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-lg p-3 text-slate-800 dark:text-slate-200 font-medium focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer"
                >
                  {picsList.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">CATEGORY PROGRESS</label>
                <select
                  value={catProgress}
                  onChange={(e) => setCatProgress(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-lg p-3 text-slate-800 dark:text-slate-200 font-medium focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer"
                >
                  {catProgsList.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">PRIORITAS TUGAS (PRIORITY)</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-lg p-3 text-slate-800 dark:text-slate-200 font-medium focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer"
                >
                  {prioritiesList.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">STATUS PROGRESS SEKARANG</label>
                <select
                  value={status}
                  disabled={tempSubTasks.length > 0}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-lg p-3 text-slate-800 dark:text-slate-200 font-medium focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {progressStatusesList.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                {tempSubTasks.length > 0 && (
                  <span className="text-[9px] text-blue-600/90 dark:text-blue-400 font-bold italic mt-0.5">Dikunci otomatis oleh progress checklist.</span>
                )}
              </div>

              {/* Progress slider layout */}
              <div className="flex flex-col gap-1 md:col-span-2 pt-1 font-mono">
                <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  <span>Penyelesaian ({progressManual}%)</span>
                  <span>{progressManual}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  disabled={tempSubTasks.length > 0}
                  value={progressManual}
                  onChange={(e) => setProgressManual(parseInt(e.target.value))}
                  className="w-full accent-blue-600 disabled:opacity-40 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Section: Integrasi ID Tiket Eksternal (Penyesuaian 14) */}
          <div className="bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 p-6 rounded-2xl shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800/60">
              <Share2 className="w-4.5 h-4.5 text-blue-600 dark:text-blue-400 shrink-0" />
              <h3 className="font-extrabold text-[11px] text-slate-800 dark:text-slate-200 uppercase tracking-widest">Integrasi ID Tiket Eksternal (GLPI, Mantis, Gitlab)</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">GLPI ID TIKET</label>
                <input
                  type="text"
                  maxLength={10}
                  value={glpiId}
                  onChange={(e) => {
                    const cleaned = e.target.value.replace(/\D/g, ""); // Allow only digits
                    setGlpiId(cleaned);
                  }}
                  placeholder="Maks 10 digit angka"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-lg p-3 text-slate-800 dark:text-slate-100 font-semibold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-550 transition-all placeholder:font-normal"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">MANTIS ID TIKET</label>
                <input
                  type="text"
                  maxLength={10}
                  value={mantisId}
                  onChange={(e) => {
                    const cleaned = e.target.value.replace(/\D/g, ""); // Allow only digits
                    setMantisId(cleaned);
                  }}
                  placeholder="Maks 10 digit angka"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-lg p-3 text-slate-800 dark:text-slate-100 font-semibold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-550 transition-all placeholder:font-normal"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">GITLAB ID TIKET</label>
                <input
                  type="text"
                  maxLength={10}
                  value={gitlabId}
                  onChange={(e) => {
                    const cleaned = e.target.value.replace(/\D/g, ""); // Allow only digits
                    setGitlabId(cleaned);
                  }}
                  placeholder="Maks 10 digit angka"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-lg p-3 text-slate-800 dark:text-slate-100 font-semibold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-550 transition-all placeholder:font-normal"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">STATUS TIKET EKSTERNAL</label>
                <select
                  value={externalTicketStatus}
                  onChange={(e) => setExternalTicketStatus(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-lg p-3 text-slate-800 dark:text-slate-200 font-medium focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer"
                >
                  <option value="">Belum Ditautkan</option>
                  <option value="Open">🟢 OPEN</option>
                  <option value="Closed">🔴 CLOSED</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 3: Timeline */}
          <div className="bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 p-6 rounded-2xl shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800/60">
              <Calendar className="w-4.5 h-4.5 text-blue-600 dark:text-blue-400 shrink-0" />
              <h3 className="font-extrabold text-[11px] text-slate-800 dark:text-slate-200 uppercase tracking-widest">Timeline</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">START DATE (TGL MULAI)</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-lg p-3 text-slate-800 dark:text-slate-100 font-semibold focus:ring-2 focus:ring-blue-500/20 transition-all font-mono"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">DUE DATE (JATUH TEMPO)</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-lg p-3 text-slate-800 dark:text-slate-100 font-semibold focus:ring-2 focus:ring-blue-500/20 transition-all font-mono"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Details & Extras */}
          <div className="bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 p-6 rounded-2xl shadow-xs space-y-5">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800/60">
              <FileText className="w-4.5 h-4.5 text-blue-600 dark:text-blue-400 shrink-0" />
              <h3 className="font-extrabold text-[11px] text-slate-800 dark:text-slate-200 uppercase tracking-widest">Rincian & Dokumen Checklist</h3>
            </div>

            <div className="space-y-4">
              {/* Sub-tasks checklist */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">SUB-TASKS CHECKLIST (PEMECAHAN RINCIAN)</label>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-950 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
                    <CheckSquare className="w-4.5 h-4.5 text-slate-400 shrink-0" />
                    <input
                      type="text"
                      value={newSubTitle}
                      onChange={(e) => setNewSubTitle(e.target.value)}
                      placeholder="Tulis butir tugas baru dan tekan enter atau klik tombol..."
                      className="flex-1 bg-transparent border-none p-0 focus:ring-0 text-slate-800 dark:text-slate-100 placeholder:opacity-50 font-semibold"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddTempSub();
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleAddTempSub}
                      className="text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-405 px-3 py-1.5 rounded-md font-bold transition-all shrink-0"
                    >
                      + Tambah
                    </button>
                  </div>

                  {/* List items */}
                  {tempSubTasks.length > 0 && (
                    <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1 bg-white/50 dark:bg-slate-900/30 p-2 rounded-xl border border-slate-200/50 dark:border-slate-850">
                      {tempSubTasks.map((sub) => (
                        <div
                          key={sub.id}
                          className="flex items-center justify-between gap-2 p-2 bg-white dark:bg-slate-900 border border-slate-150/10 dark:border-slate-800/40 rounded-lg group"
                        >
                          <div className="flex items-center gap-2.5">
                            <input
                              type="checkbox"
                              checked={sub.done}
                              onChange={() => toggleTempSubDone(sub.id)}
                              className="w-4 h-4 rounded text-blue-600 accent-blue-605 border-slate-350 dark:border-slate-800 cursor-pointer"
                            />
                            <span className={`text-[11px] font-semibold ${sub.done ? "line-through text-slate-400 italic" : "text-slate-700 dark:text-slate-305"}`}>
                              {sub.title}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => deleteTempSub(sub.id)}
                            className="text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded px-1.5 py-0.5 text-sm font-black"
                            title="Hapus checklist item"
                          >
                            &times;
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Notes */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">NOTES / KETERANGAN RINCIAN</label>
                <textarea
                  rows={4}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Berikan instruksi detil atau konteks tambahan bagi pelaksana tugas di sini..."
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-3 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500/20 transition-all leading-relaxed text-xs font-sans"
                />
              </div>

              {/* Attachment / URL */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">ATTACHMENT / URL TAUTAN DOKUMEN</label>
                <div className="relative">
                  <Paperclip className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://figma.com/file/... atau Google Drive"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-255 dark:border-slate-800 py-2.5 pl-9 pr-3 rounded-lg text-slate-800 dark:text-slate-105 font-mono text-[11px] focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Footer buttons / actions */}
          <div className="flex justify-between items-center pt-4 border-t border-slate-200 dark:border-slate-800">
            {editingTask ? (() => {
              const canModify = !editingTask.createdBy || editingTask.createdBy === currentUser?.username || currentUser?.role === "Administrator";
              return (
                <button
                  type="button"
                  onClick={() => {
                    if (confirm("Hapus tugas ini secara berantai dari system database?")) {
                      onDeleteTask(editingTask.id);
                      setIsFormOpen(false);
                    }
                  }}
                  disabled={!canModify}
                  className={`px-4 py-2.5 text-xs font-extrabold rounded-lg border transition-all font-sans ${
                    canModify 
                      ? "bg-red-50 hover:bg-red-100 hover:text-red-700 text-red-650 border-red-200 cursor-pointer" 
                      : "bg-slate-50 dark:bg-slate-850 text-slate-300 dark:text-slate-700 border-transparent cursor-not-allowed opacity-50"
                  }`}
                  title={canModify ? "Hapus Tugas" : `Hanya penginput (${editingTask.createdBy}) yang boleh menghapus`}
                >
                  Hapus Tugas
                </button>
              );
            })() : <span />}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="px-5 py-2.5 border border-slate-250 text-slate-550 dark:text-slate-400 text-xs font-bold rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer font-sans"
              >
                Batal / Cancel
              </button>
              {(() => {
                const canModify = !editingTask || !editingTask.createdBy || editingTask.createdBy === currentUser?.username || currentUser?.role === "Administrator";
                return (
                  <button
                    id="submit-btn-trigger"
                    type="submit"
                    disabled={!canModify}
                    className={`px-6 py-2.5 text-xs font-black rounded-lg hover:shadow-lg active:scale-95 transition-all font-sans ${
                      canModify 
                        ? "bg-blue-600 hover:bg-blue-700 text-white cursor-pointer" 
                        : "bg-slate-100 dark:bg-slate-800 text-slate-300 dark:text-slate-650 cursor-not-allowed opacity-50"
                    }`}
                    title={canModify ? "" : `Hanya penginput (${editingTask?.createdBy}) yang boleh menyimpan perubahan`}
                  >
                    {editingTask ? "Ubah & Simpan Tugas" : "Buat Tugas Baru"}
                  </button>
                );
              })()}
            </div>
          </div>

        </form>

        {/* Mobile Fixed bottom footer matching custom pattern */}
        <div className="sm:hidden fixed bottom-16 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 p-4 flex gap-3 shadow-[0_-4px_12px_rgba(0,0,0,0.08)] z-40">
          <button
            type="button"
            onClick={() => setIsFormOpen(false)}
            className="flex-1 py-3 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-305 font-bold rounded-lg text-xs"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={() => {
              const btnSubmit = document.getElementById("submit-btn-trigger");
              if (btnSubmit) btnSubmit.click();
            }}
            className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-lg text-xs shadow-md"
          >
            {editingTask ? "Simpan" : "Buat Tugas"}
          </button>
        </div>
      </div>
    );
  }


  // RENDER METHOD 2: TRADITIONAL MAIN GRID & SPREADSHEET TABLE OF TASKS
  return (
    <div className="space-y-6 fade-in font-sans pb-10">
      
      {/* Interactive Filters Grid & Visual togglers */}
      <div className="flex flex-wrap items-center gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-xs">
        
        {/* Keyword filter input */}
        <div className="relative flex-1 min-w-[150px]">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari deskripsi tugas..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg py-1.5 pl-9 pr-4 text-xs text-slate-800 dark:text-slate-100"
          />
        </div>

        {/* Filters Select boxes mapping */}
        <select
          value={filterProject}
          onChange={(e) => setFilterProject(e.target.value)}
          className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs py-1.5 px-3 rounded-lg text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500/25"
        >
          <option value="">Semua Project</option>
          {projects.map(p => <option key={p.kode} value={p.kode}>{p.nama}</option>)}
        </select>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs py-1.5 px-3 rounded-lg text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500/25"
        >
          <option value="">Semua Status</option>
          {progressStatusesList.map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        <select
          value={filterPriority}
          onChange={(e) => setFilterPriority(e.target.value)}
          className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs py-1.5 px-3 rounded-lg text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500/25"
        >
          <option value="">Semua Prioritas</option>
          {prioritiesList.map(p => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>

        <select
          value={filterPic}
          onChange={(e) => setFilterPic(e.target.value)}
          className="bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 text-xs py-1.5 px-3 rounded-lg text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500/25"
        >
          <option value="">Semua PIC</option>
          {picsList.map(p => <option key={p} value={p}>{p}</option>)}
        </select>

        <select
          value={filterTaskType}
          onChange={(e) => setFilterTaskType(e.target.value)}
          className="bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 text-xs py-1.5 px-3 rounded-lg text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500/25"
        >
          <option value="">Semua Tipe Tugas</option>
          {tasktypesList.map(t => <option key={t} value={t}>{t}</option>)}
        </select>

        <select
          value={filterCatProgress}
          onChange={(e) => setFilterCatProgress(e.target.value)}
          className="bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 text-xs py-1.5 px-3 rounded-lg text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500/25"
        >
          <option value="">Semua Kategori Progress</option>
          {catProgsList.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        {/* View togglers & action button */}
        <div className="flex bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-1">
          <button
            onClick={() => setViewMode('ticket')}
            className={`p-1.5 rounded-md transition-all ${viewMode === 'ticket' ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs' : 'text-slate-450 dark:text-slate-500'}`}
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`p-1.5 rounded-md transition-all ${viewMode === 'table' ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs' : 'text-slate-450 dark:text-slate-500'}`}
          >
            <ListOrdered className="w-4 h-4" />
          </button>
        </div>

        <button
          onClick={handleExportCSV}
          className="p-1.5 border border-slate-250 hover:bg-slate-100 dark:border-slate-800 dark:hover:bg-slate-850 rounded-lg text-slate-500 dark:text-slate-400 transition-colors"
          title="Export CSV"
        >
          <Download className="w-4 h-4" />
        </button>

        {currentUser?.role !== "Client" && (
          <button
            onClick={openCreate}
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg flex items-center gap-1 shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Tambah Task
          </button>
        )}
      </div>

      {/* Visual Workspace List */}
      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
            <CheckSquare className="w-10 h-10 text-slate-300 mx-auto mb-2 opacity-40" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Tidak ada tugas ditemukan</p>
            <p className="text-xs text-slate-400">Sesuaikan saringan atau parameter pencarian Anda di formulir atas.</p>
          </div>
        ) : viewMode === 'ticket' ? (
          
          /* VIEW MODE: TICKET/CARDS GRID */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 font-sans">
            {filtered.map((t) => {
              const overdue = t.status !== "Done" && t.status !== "Cancelled" && t.dueDate && t.dueDate < todayStr;
              const subTotal = t.subtasks?.length || 0;
              const subDone = t.subtasks?.filter(s => s.done).length || 0;

              return (
                <div 
                  key={t.id}
                  onClick={() => setSelectedTask(t)}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs hover:border-blue-500/40 transition-all cursor-pointer flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-[10px] font-mono font-bold text-slate-400">
                      <span>TKT-{String(tasks.indexOf(t) + 1).padStart(4, "0")}</span>
                      <span className={getPriorityStyle(t.priority)}>{t.priority}</span>
                    </div>
                    
                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 leading-snug truncate-2-lines line-clamp-2">
                      {t.task}
                    </h4>
                    <p className="text-xs text-slate-400 font-medium truncate">
                      {projects.find(p => p.kode === t.project)?.nama || t.project}
                    </p>

                    <div className="flex flex-wrap gap-1.5 pt-1">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${getStatusStyle(t.status)}`}>
                        {t.status}
                      </span>
                      {subTotal > 0 && (
                        <span className="bg-slate-100 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5">
                          Check {subDone}/{subTotal}
                        </span>
                      )}
                      {t.categoryProgress && (
                        <span className="bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/30 text-blue-600 dark:text-blue-400 text-[10px] font-bold px-1.5 py-0.5 rounded">
                          {t.categoryProgress}
                        </span>
                      )}
                      {t.createdBy && (
                        <span className="bg-indigo-50/75 dark:bg-indigo-950/45 border border-indigo-100/35 text-indigo-650 dark:text-indigo-400 text-[10px] font-bold px-1.5 py-0.5 rounded">
                          🧑‍💻 {t.createdBy}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Footer Stats of Ticket */}
                  <div className="border-t border-slate-100 dark:border-slate-800/80 pt-3 space-y-2.5">
                    <div className="flex justify-between items-center text-xs">
                      <div className="flex items-center gap-1.5 shrink-0 max-w-[50%]">
                        <span className={`w-6 h-6 rounded-full text-[10px] font-bold flex items-center justify-center ${picThemeColors(t.pic || "")}`}>
                          {t.pic ? t.pic.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() : "?"}
                        </span>
                        <span className="text-slate-700 dark:text-slate-300 font-semibold truncate text-[11px]">
                          {t.pic || "Unassigned"}
                        </span>
                      </div>
                      <div className="text-right">
                        <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">Jatuh Tempo</p>
                        <p className={`font-mono text-[11px] font-bold ${overdue ? "text-red-500" : "text-slate-600 dark:text-slate-400"}`}>
                          {t.dueDate ? new Date(t.dueDate).toLocaleDateString("id-ID") : "—"}
                        </p>
                      </div>
                    </div>

                    {/* Progress Slider Display */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[9px] text-slate-400 uppercase tracking-wider font-bold">
                        <span>Penyelesaian</span>
                        <span>{t.progress}%</span>
                      </div>
                      <div className="h-1.5 bg-slate-100 dark:bg-slate-805 h-1 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-600 transition-all font-mono" style={{ width: `${t.progress}%` }} />
                      </div>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        ) : (
          
          /* VIEW MODE: SPREADSHEET TABLE */
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-850 dark:text-slate-200 border-collapse">
                <thead className="bg-slate-50/80 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold">
                  <tr>
                    <th className="p-3">Project</th>
                    <th className="p-3">Uraian Tugas</th>
                    <th className="p-3">Kategori</th>
                    <th className="p-3">PIC</th>
                    <th className="p-3">Prioritas</th>
                    <th className="p-3">Due Date</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Progress</th>
                    <th className="p-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 leading-normal">
                  {filtered.map((t) => {
                    const overdue = t.status !== "Done" && t.status !== "Cancelled" && t.dueDate && t.dueDate < todayStr;
                    return (
                      <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-950/20 transition-colors">
                        <td className="p-3">
                          <span className="bg-blue-50 dark:bg-blue-950/40 text-blue-605 dark:text-blue-400 border border-blue-105/20 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold block w-fit">
                            {t.project}
                          </span>
                        </td>
                        <td className="p-3 font-bold text-slate-800 dark:text-slate-100 max-w-xs truncate">{t.task}</td>
                        <td className="p-3 text-slate-455 dark:text-slate-400 font-medium">{t.categoryProgress || "—"}</td>
                        <td className="p-3">
                          <div className="flex items-center gap-1.5 w-fit">
                            <span className={`w-5 h-5 rounded-full text-[9px] font-bold flex items-center justify-center ${picThemeColors(t.pic || "")}`}>
                              {t.pic ? t.pic.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() : "?"}
                            </span>
                            <span className="font-semibold text-slate-700 dark:text-slate-300">{t.pic || "—"}</span>
                          </div>
                        </td>
                        <td className="p-3">
                          <span className={getPriorityStyle(t.priority)}>{t.priority}</span>
                        </td>
                        <td className={`p-3 font-mono font-semibold ${overdue ? "text-red-500 font-bold" : "text-slate-600 dark:text-slate-400"}`}>
                          {t.dueDate ? new Date(t.dueDate).toLocaleDateString("id-ID") : "—"}
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${getStatusStyle(t.status)}`}>
                            {t.status}
                          </span>
                        </td>
                        <td className="p-3 font-mono font-bold">{t.progress}%</td>
                        <td className="p-3 text-right">
                          <button 
                            onClick={() => setSelectedTask(t)}
                            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-400 hover:text-blue-500 transition-colors cursor-pointer"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* DETAIL DRAWER POPUP OVERLAY */}
      <AnimatePresence>
        {selectedTask && (
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-start gap-3">
                <div>
                  <h3 className="font-black text-lg text-slate-800 dark:text-slate-100 leading-snug">
                    {selectedTask.task}
                  </h3>
                  <p className="text-xs text-blue-600 dark:text-blue-400 font-bold mt-1">
                    {projects.find(p => p.kode === selectedTask.project)?.nama || selectedTask.project}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedTask(null)}
                  className="text-slate-400 hover:text-slate-600 p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs font-semibold">
                <div>
                  <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">Status Tugas</p>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold inline-block mt-0.5 ${getStatusStyle(selectedTask.status)}`}>
                    {selectedTask.status}
                  </span>
                </div>
                <div>
                  <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">Prioritas</p>
                  <span className="inline-block mt-0.5 font-sans">
                    <span className={getPriorityStyle(selectedTask.priority)}>
                      {selectedTask.priority}
                    </span>
                  </span>
                </div>
                <div>
                  <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">PIC Pelaksana</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className={`w-5 h-5 rounded-full text-[9px] font-bold flex items-center justify-center ${picThemeColors(selectedTask.pic || "")}`}>
                      {selectedTask.pic ? selectedTask.pic.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() : "?"}
                    </span>
                    <span className="font-bold text-slate-700 dark:text-slate-350">{selectedTask.pic || "—"}</span>
                  </div>
                </div>
                <div>
                  <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">Tipe Tugas</p>
                  <p className="font-bold text-slate-800 dark:text-slate-200 mt-1">{selectedTask.taskType || "—"}</p>
                </div>
                <div>
                  <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">Kategori Progress</p>
                  <p className="font-bold text-slate-800 dark:text-slate-200 mt-1">{selectedTask.categoryProgress || "—"}</p>
                </div>
                <div>
                  <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">Modul Terkait</p>
                  <p className="font-bold text-slate-800 dark:text-slate-200 mt-1">{selectedTask.modul || "—"}</p>
                </div>
                <div>
                  <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest font-sans">Jatuh Tempo</p>
                  <p className="font-bold font-mono text-slate-850 dark:text-slate-200 mt-1">
                    {selectedTask.dueDate ? new Date(selectedTask.dueDate).toLocaleDateString("id-ID") : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest font-sans">Tanggal Mulai</p>
                  <p className="font-bold font-mono text-slate-850 dark:text-slate-200 mt-1">
                    {selectedTask.startDate ? new Date(selectedTask.startDate).toLocaleDateString("id-ID") : "—"}
                  </p>
                </div>
                {selectedTask.createdBy && (
                  <div>
                    <p className="text-[8px] text-indigo-400 font-bold uppercase tracking-widest font-sans">Dibuat Oleh</p>
                    <p className="font-bold text-indigo-600 dark:text-indigo-450 mt-1">
                      🧑‍💻 {selectedTask.createdBy}
                    </p>
                  </div>
                )}
              </div>

              {/* Progress Panel */}
              <div className="space-y-1 font-mono">
                <div className="flex justify-between text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                  <span>Persentase Penyelesaian</span>
                  <span>{selectedTask.progress}%</span>
                </div>
                <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-600" style={{ width: `${selectedTask.progress}%` }} />
                </div>
              </div>

              {/* LIVE Subtask Checklist Builder in Drawer */}
              <div className="border-t border-slate-150/60 dark:border-slate-800 pt-4 space-y-3 font-sans">
                <div className="flex justify-between items-center text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest font-mono">
                  <span>Sub-Tugas / Checklist Real-time</span>
                  <span>
                    {selectedTask.subtasks?.filter(s => s.done).length || 0}/
                    {selectedTask.subtasks?.length || 0} Selesai
                  </span>
                </div>

                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                  {!selectedTask.subtasks || selectedTask.subtasks.length === 0 ? (
                    <p className="text-xs text-slate-450 italic">Belum ada checklist teknis tambahan.</p>
                  ) : (
                    selectedTask.subtasks.map((sub) => (
                      <div 
                        key={sub.id} 
                        className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-150/10 dark:border-slate-800/40"
                      >
                        <input
                          type="checkbox"
                          checked={sub.done}
                          onChange={() => handleLiveSubToggle(selectedTask, sub.id)}
                          className="w-4 h-4 rounded text-blue-600 border-slate-350 focus:outline-none"
                        />
                        <span className={`text-xs ${sub.done ? "line-through text-slate-400" : "text-slate-700 dark:text-slate-300 font-medium"}`}>
                          {sub.title}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Dynamic Reporter Detail block if request/incident to support Penyesuaian 10 details */}
              {selectedTask.taskCategoryType && selectedTask.taskCategoryType !== "Project" && (
                <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200/55 p-3 rounded-xl text-xs space-y-1">
                  <p className="font-bold text-amber-700 dark:text-amber-400 uppercase text-[9px] tracking-wider">Detail Pelapor ({selectedTask.taskCategoryType})</p>
                  <p className="text-slate-850 dark:text-slate-200">
                    <span className="text-slate-400 font-bold">Nama Pelapor:</span> {selectedTask.reporterName || "—"}
                  </p>
                  <p className="text-slate-850 dark:text-slate-200">
                    <span className="text-slate-400 font-bold">Bagian/Unit:</span> {selectedTask.reporterDept || "—"}
                  </p>
                </div>
              )}

              {/* External Tickets Tracker Panel in details to support Penyesuaian 14 details */}
              {(selectedTask.glpiId || selectedTask.mantisId || selectedTask.gitlabId) && (
                <div className="bg-slate-50 dark:bg-slate-950 border border-slate-150/10 dark:border-slate-800/40 p-3.5 rounded-xl text-xs space-y-2">
                  <p className="font-bold text-slate-400 uppercase text-[9px] tracking-wider">Tautan Tiket Eksternal</p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1.5">
                    {selectedTask.glpiId && (
                      <p className="text-slate-700 dark:text-slate-300">
                        <span className="text-slate-400 font-bold font-sans">GLPI:</span> <span className="font-mono bg-slate-100 dark:bg-slate-900 px-1.5 py-0.5 rounded text-[11px] font-bold">{selectedTask.glpiId}</span>
                      </p>
                    )}
                    {selectedTask.mantisId && (
                      <p className="text-slate-700 dark:text-slate-300">
                        <span className="text-slate-400 font-bold font-sans">Mantis:</span> <span className="font-mono bg-slate-100 dark:bg-slate-900 px-1.5 py-0.5 rounded text-[11px] font-bold">{selectedTask.mantisId}</span>
                      </p>
                    )}
                    {selectedTask.gitlabId && (
                      <p className="text-slate-700 dark:text-slate-300">
                        <span className="text-slate-400 font-bold font-sans">GitLab:</span> <span className="font-mono bg-slate-100 dark:bg-slate-900 px-1.5 py-0.5 rounded text-[11px] font-bold">{selectedTask.gitlabId}</span>
                      </p>
                    )}
                  </div>
                  {selectedTask.externalTicketStatus && (
                    <p className="text-xs pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center gap-1.5">
                      <span className="text-slate-400 font-bold">Status Tiket:</span>{" "}
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black ${selectedTask.externalTicketStatus === "Open" ? "bg-emerald-55 text-emerald-700 dark:bg-emerald-950/25 dark:text-emerald-400 border border-emerald-250" : "bg-red-50 text-red-650 dark:bg-red-950/25 dark:text-red-400 border border-red-200"}`}>
                        {selectedTask.externalTicketStatus.toUpperCase()}
                      </span>
                    </p>
                  )}
                </div>
              )}

              {/* Extra notes */}
              {selectedTask.notes && (
                <div className="bg-slate-50 dark:bg-slate-950 border border-slate-150/10 dark:border-slate-800/40 p-3.5 rounded-xl text-xs">
                  <p className="font-bold text-slate-400 uppercase text-[9px] tracking-wider mb-1">Catatan</p>
                  <p className="text-slate-700 dark:text-slate-305 whitespace-pre-wrap leading-relaxed">
                    {selectedTask.notes}
                  </p>
                </div>
              )}

              {selectedTask.url && (
                <div className="flex pt-1 font-mono text-[11px]">
                  <a 
                    href={selectedTask.url} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="text-xs text-blue-600 dark:text-blue-400 font-bold hover:underline"
                  >
                    Buka Lampiran Tautan ↗
                  </a>
                </div>
              )}

              <div className="flex justify-between items-center pt-3 border-t border-slate-100 dark:border-slate-800">
                {currentUser?.role !== "Client" ? (() => {
                  const canModify = !selectedTask.createdBy || selectedTask.createdBy === currentUser?.username || currentUser?.role === "Administrator";
                  return (
                    <button
                      onClick={() => {
                        setSelectedTask(null);
                        openEdit(selectedTask);
                      }}
                      disabled={!canModify}
                      className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
                        canModify 
                          ? "bg-slate-100 hover:bg-slate-205 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer" 
                          : "bg-slate-50 dark:bg-slate-850 text-slate-300 dark:text-slate-700 cursor-not-allowed opacity-50"
                      }`}
                      title={canModify ? "Edit Tugas" : `Hanya penginput (${selectedTask.createdBy}) yang boleh mengedit`}
                    >
                      Edit Tugas
                    </button>
                  );
                })() : <span />}

                <button
                  onClick={() => setSelectedTask(null)}
                  className="px-5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-all cursor-pointer"
                >
                  Tutup
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
