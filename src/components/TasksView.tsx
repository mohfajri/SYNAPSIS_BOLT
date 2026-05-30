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
  RefreshCw,
  X,
  PlusCircle,
  AlertCircle,
  Info,
  FileText,
  Share2,
  Layers
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface TasksViewProps {
  tasks: Task[];
  projects: Project[];
  currentUser: User | null;
  picsList: string[];
  users?: User[];
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
  users = [],
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
  
  // View mode State: 'ticket' (interactive grid cards), 'table' (rows) or 'delegation' (hierarchical trees)
  const [viewMode, setViewMode] = useState<'ticket' | 'table' | 'delegation'>('ticket');

  // Detail Modal State
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // Trash & Recycle Bin state variables
  const [showTrashOnly, setShowTrashOnly] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [deleteErrorReason, setDeleteErrorReason] = useState<string | null>(null);

  // Create / Edit Form Active State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const isCurrentlyClosedOrCompleted = !!(editingTask && (
    editingTask.status?.toLowerCase() === "selesai" || 
    editingTask.status?.toLowerCase() === "closed" || 
    editingTask.progress === 100
  ));
  
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
  const [isBroadcast, setIsBroadcast] = useState(false);
  const [reporterName, setReporterName] = useState("");
  const [reporterDept, setReporterDept] = useState("");
  const [glpiId, setGlpiId] = useState("");
  const [mantisId, setMantisId] = useState("");
  const [gitlabId, setGitlabId] = useState("");
  const [externalTicketStatus, setExternalTicketStatus] = useState<string>("");

  const todayStr = new Date().toISOString().slice(0, 10);

  // Hierarchical Delegation states (Opsi B)
  const [delegatingParentTask, setDelegatingParentTask] = useState<Task | null>(null);
  const [delTaskName, setDelTaskName] = useState("");
  const [delPic, setDelPic] = useState("");
  const [delDueDate, setDelDueDate] = useState("");
  const [delPriority, setDelPriority] = useState("Medium");
  const [delNotes, setDelNotes] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Get dynamic target PICs list for delegation based on current user's role hierarchy (Opsi B)
  const getDelegationPicsList = (parentProjCode: string) => {
    if (!users || users.length === 0) {
      return picsList;
    }
    
    // Determine eligible assignee roles based on assigner's role
    const myRole = currentUser?.role || "";
    let targetRoles: string[] = [];
    
    if (myRole === "Direktur" || myRole === "Administrator") {
      targetRoles = ["Manager", "Supervisor"];
    } else if (myRole === "Manager") {
      targetRoles = ["Supervisor"];
    } else if (myRole === "Supervisor") {
      targetRoles = ["Staff", "System Support", "Technical Support", "Assistant Technical Support"];
    } else {
      targetRoles = ["Staff", "System Support", "Technical Support", "Assistant Technical Support"];
    }
    
    // Find client RS name of target project to filter site specific users
    const currentProj = projects.find(p => p.kode === parentProjCode);
    const targetSite = currentProj?.client || currentUser?.siteTugas || "";
    
    // Filter active users with eligible roles
    const eligibleUsers = users.filter(u => 
      u.statusAktif !== false && 
      targetRoles.includes(u.role)
    );
    
    // Filter by site assignment if available
    if (targetSite && eligibleUsers.length > 0) {
      const siteSpecific = eligibleUsers.filter(u => u.siteTugas && u.siteTugas.toLowerCase() === targetSite.toLowerCase());
      if (siteSpecific.length > 0) {
        return siteSpecific.map(u => u.nickname || u.username);
      }
    }
    
    if (eligibleUsers.length > 0) {
      return eligibleUsers.map(u => u.nickname || u.username);
    }
    
    const activeNonAdmin = users.filter(u => u.statusAktif !== false && u.role !== "Administrator");
    if (targetSite) {
      const siteFiltered = activeNonAdmin.filter(u => u.siteTugas && u.siteTugas.toLowerCase() === targetSite.toLowerCase());
      if (siteFiltered.length > 0) return siteFiltered.map(u => u.nickname || u.username);
    }
    return activeNonAdmin.map(u => u.nickname || u.username);
  };

  // Handle submission of delegation
  const handleDelegationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!delegatingParentTask || !delTaskName.trim() || !delPic) return;
    
    const payload: Partial<Task> = {
      project: delegatingParentTask.project,
      modul: delegatingParentTask.modul,
      task: delTaskName.trim(),
      taskType: delegatingParentTask.taskType || "Setting",
      categoryProgress: delegatingParentTask.categoryProgress || "Instalasi",
      pic: delPic,
      priority: delPriority,
      status: "Not Started",
      startDate: todayStr,
      dueDate: delDueDate || delegatingParentTask.dueDate,
      progress: 0,
      notes: delNotes || `Delegasi instruksi dari ${currentUser?.name || currentUser?.username} untuk tugas "${delegatingParentTask.task}"`,
      url: "",
      subtasks: [],
      taskCategoryType: delegatingParentTask.taskCategoryType || "Project",
      parentTaskId: delegatingParentTask.id,
      assignerName: currentUser?.name || currentUser?.username || "System",
      assignerRole: currentUser?.role || "Staff",
      delegationNotes: delNotes,
      createdBy: currentUser?.username || "System"
    };
    
    try {
      await onAddTask(payload);
      setSuccessMessage(`Berhasil mendelegasikan tugas ke ${delPic}!`);
      setTimeout(() => {
        setSuccessMessage("");
        setDelegatingParentTask(null);
        setDelTaskName("");
        setDelPic("");
        setDelDueDate("");
        setDelNotes("");
      }, 2000);
    } catch (err: any) {
      alert(`Gagal menyimpan delegasi tugas: ${err.message}`);
    }
  };

  // Get dynamic PIC options filter based on target site of the selected project
  const getDynamicPicsList = () => {
    // Exclude administrators, display users according to site/project client
    if (!users || users.length === 0) {
      return picsList.filter(p => p !== "Admin" && p !== "admin");
    }
    
    // Find the client RS name of the currently selected project code
    const currentProj = projects.find(p => p.kode === projectCode);
    const targetSite = currentProj?.client || currentUser?.siteTugas || "";
    
    // Filter active users who are not Administrator
    const activeNonAdminUsers = users.filter(u => u.statusAktif !== false && u.role !== "Administrator" && u.username !== "admin");
    
    if (targetSite) {
      const siteSpecificUsers = activeNonAdminUsers.filter(u => u.siteTugas && u.siteTugas.toLowerCase() === targetSite.toLowerCase());
      if (siteSpecificUsers.length > 0) {
        return siteSpecificUsers.map(u => u.nickname || u.username);
      }
    }
    
    // If no target site is set, or no users are assigned to that site, fallback to all active non-admin users
    return activeNonAdminUsers.map(u => u.nickname || u.username);
  };

  // Synchronize pic choice dynamically when projectCode is changed during creation
  useEffect(() => {
    if (!editingTask && isFormOpen) {
      const dynamicPics = getDynamicPicsList();
      if (dynamicPics.length > 0 && !dynamicPics.includes(pic)) {
        setPic(dynamicPics[0]);
      }
    }
  }, [projectCode, isFormOpen, editingTask, users]);

  // Filters logic mapping
  const filtered = tasks.filter((t) => {
    // If showTrashOnly is true, only show deleted tasks. Otherwise, show active non-deleted tasks.
    const matchesTrash = showTrashOnly ? (t.isDeleted === true) : (!t.isDeleted);

    const sQuery = `${t.task} ${t.modul || ""} ${t.categoryProgress || ""} ${t.project}`.toLowerCase();
    const matchesSearch = sQuery.includes(search.toLowerCase());
    const matchesStatus = filterStatus === "" || t.status === filterStatus;
    const matchesPriority = filterPriority === "" || t.priority === filterPriority;
    const matchesPic = filterPic === "" || t.pic === filterPic;
    const matchesProject = filterProject === "" || t.project === filterProject;
    const matchesTaskType = filterTaskType === "" || t.taskType === filterTaskType;
    const matchesCatProgress = filterCatProgress === "" || t.categoryProgress === filterCatProgress;

    return (
      matchesTrash &&
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
    setIsBroadcast(false);
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
    setIsBroadcast(false);
    setReporterName(t.reporterName || "");
    setReporterDept(t.reporterDept || "");
    setGlpiId(t.glpiId || "");
    setMantisId(t.mantisId || "");
    setGitlabId(t.gitlabId || "");
    setExternalTicketStatus(t.externalTicketStatus || "");
    setIsFormOpen(true);
  }

  // Initiate custom task deletion with nested-subtasks & checklist checks
  const initiateDeleteTask = (task: Task) => {
    // 1. Check active children subtasks: "Ketika ada sub task yang terisi , maka harus di hapus satu persatu"
    const hasChildren = tasks.some(t => t.parentTaskId === task.id && !t.isDeleted);
    
    // 2. Check checklist item is checked done: "ketika sudah terchecklist selesai juga harus di unchecklist" / "jika memang ada task yang masih tercheklist maka akan ada informasi subtask sudah dikerjakan"
    const hasDoneSubtasks = !!(task.subtasks && task.subtasks.some(sub => sub.done));

    // 3. Check completed progress or status Selesai / Closed
    const isProgressCompleted = task.progress === 100 || 
                                task.status?.toLowerCase() === "selesai" || 
                                task.status?.toLowerCase() === "closed";

    let errorMsg = null;
    if (hasChildren) {
      errorMsg = "Tugas ini memiliki sub-tugas (delegasi) aktif di bawahnya. Sesuai aturan keamanan data, silakan hapus sub-tugas atau tugas turunannya satu per satu terlebih dahulu!";
    } else if (hasDoneSubtasks) {
      errorMsg = "Tugas tidak dapat dihapus karena masih ada subtask / checklist item yang sudah dikerjakan (terchecklist). Harap unchecklist (batalkan centang) atau batalkan status selesai pada subtask terlebih dahulu!";
    } else if (isProgressCompleted) {
      errorMsg = "Tugas yang sudah selesai / terchecklist (dengan status Selesai/Closed atau progress 100%) tidak dapat langsung dihapus. Harap ubah status atau unchecklist terlebih dahulu sebelum di-delete dari sistem!";
    }

    setTaskToDelete(task);
    setDeleteErrorReason(errorMsg);
  };

  // Perform soft deletion (moving to Trash)
  const executeSoftDelete = async (task: Task) => {
    try {
      await onUpdateTask(task.id, {
        isDeleted: true,
        deletedAt: new Date().toISOString(),
        deletedBy: currentUser?.username || currentUser?.name || "System"
      });
      setTaskToDelete(null);
      setDeleteErrorReason(null);
      setIsFormOpen(false);
      setSelectedTask(null);
      setSuccessMessage("Tugas berhasil dipindahkan ke Tong Sampah! 🗑️");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err: any) {
      alert("Gagal memindahkan tugas ke tempat sampah: " + err.message);
    }
  };

  // Perform restore from trash
  const executeRestoreTask = async (task: Task) => {
    try {
      await onUpdateTask(task.id, {
        isDeleted: false,
        deletedAt: undefined,
        deletedBy: undefined
      });
      setSuccessMessage("Berhasil memulihkan tugas dari Tong Sampah! 🌟");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err: any) {
      alert("Gagal memulihkan tugas: " + err.message);
    }
  };

  // Perform permanent delete
  const executePermanentDelete = async (task: Task) => {
    try {
      await onDeleteTask(task.id);
      setTaskToDelete(null);
      setSuccessMessage("Tugas telah secara permanen dihapus dari database!");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err: any) {
      alert("Gagal menghapus tugas secara permanen: " + err.message);
    }
  };

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

  // Auto-sync status and progress manual in form
  const handleStatusChange = (newStatus: string) => {
    setStatus(newStatus);
    if (tempSubTasks.length === 0) {
      if (newStatus === "Done") {
        setProgressManual(100);
      } else if (newStatus === "Not Started") {
        setProgressManual(0);
      } else if (progressManual === 100 && newStatus !== "Done" && newStatus !== "Cancelled") {
        setProgressManual(50); // lógico default
      }
    }
  };

  const handleProgressChange = (newProgress: number) => {
    setProgressManual(newProgress);
    if (tempSubTasks.length === 0) {
      if (newProgress === 100) {
        setStatus("Done");
      } else if (newProgress > 0 && (status === "Not Started" || status === "Done")) {
        setStatus("In Progress");
      } else if (newProgress === 0 && status === "In Progress") {
        setStatus("Not Started");
      }
    }
  };

  async function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!taskName.trim()) return;

    // Timeline Date sequence Validation check
    if (startDate && dueDate && dueDate < startDate) {
      alert("⚠️ Error: Tanggal Batas Waktu tidak boleh lebih awal dari Tanggal Mulai tugas!");
      return;
    }

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
      project: (taskCategoryType === "Project" || taskCategoryType === "Mandiri") ? projectCode : "",
      modul: (taskCategoryType === "Project" || taskCategoryType === "Mandiri") ? modulName : "",
      task: taskName,
      taskType,
      categoryProgress: catProgress,
      pic: isBroadcast ? "" : pic, // broadcast puts individual name later
      priority,
      status: finalStatus,
      startDate,
      dueDate,
      progress: finalProgress,
      notes,
      url,
      subtasks: tempSubTasks,
      taskCategoryType,
      reporterName: (taskCategoryType !== "Project" && taskCategoryType !== "Mandiri") ? reporterName : "",
      reporterDept: (taskCategoryType !== "Project" && taskCategoryType !== "Mandiri") ? reporterDept : "",
      glpiId,
      mantisId,
      gitlabId,
      externalTicketStatus,
      assignerName: editingTask ? (editingTask.assignerName || "System") : (currentUser?.name || currentUser?.username || "System"),
      assignerRole: editingTask ? (editingTask.assignerRole || "Direktur") : (currentUser?.role || "Staff"),
      parentTaskId: editingTask ? (editingTask.parentTaskId || "") : "",
      delegationNotes: editingTask ? (editingTask.delegationNotes || "") : ""
    };

    try {
      if (editingTask) {
        await onUpdateTask(editingTask.id, payload);
      } else if (isBroadcast) {
        const targetRoles = ["Supervisor", "Site Coordinator"];
        const targetUsers = users.filter(u => 
          u.statusAktif !== false && 
          targetRoles.includes(u.role)
        );

        if (targetUsers.length === 0) {
          alert("⚠️ Tidak ditemukan pengguna dengan peran Supervisor atau Site Coordinator aktif. Tugas akan disimpan sebagai tugas biasa untuk " + pic);
          await onAddTask({ ...payload, pic });
        } else {
          for (const u of targetUsers) {
            const userPic = u.nickname || u.username;
            await onAddTask({
              ...payload,
              pic: userPic,
              notes: (notes ? notes + "\n\n" : "") + `[Broadcast Massal] Tugas otomatis didelegasikan ke ${userPic} (${u.role}) di site ${u.siteTugas || "Umum"}.`
            });
          }
          alert(`📢 Berhasil membuat & mendistribusikan ${targetUsers.length} tugas secara merata ke semua Supervisor & Site Coordinator aktif!`);
        }
      } else {
        await onAddTask(payload);
      }
      setIsFormOpen(false);
      setIsBroadcast(false);
    } catch (err: any) {
      alert("Gagal menyimpan tugas: " + err.message);
    }
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

  // Recursive formatter for rendering the custom Hierarchical Delegation tree nodes
  const renderDelegationNode = (task: Task, level: number = 0): React.ReactNode => {
    const children = tasks.filter(t => t.parentTaskId === task.id);
    return (
      <div key={task.id} className="relative pl-6 md:pl-10 pb-6 last:pb-1">
        {/* Connection Element */}
        {children.length > 0 && (
          <span 
            className="absolute left-1.5 md:left-3.5 top-8 bottom-0 w-0.5 bg-slate-200 dark:bg-slate-800"
            style={{ borderLeft: '2px dashed #94a3b835' }}
          />
        )}
        
        {/* Circle Bullet Badge marker with success pulse */}
        <span className={`absolute left-0.5 md:left-2 top-3 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-slate-900 shadow-xs ${task.progress === 100 ? 'bg-emerald-500 ring-2 ring-emerald-400/20' : 'bg-blue-600'}`} />

        {/* Card for each node level */}
        <div className="bg-slate-50/50 dark:bg-slate-950/40 p-4 rounded-xl border border-slate-205 dark:border-slate-800/85 hover:border-blue-500/30 transition-all shadow-3xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5 flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 leading-none">
              <span className="bg-slate-100 dark:bg-slate-850 text-slate-700 dark:text-slate-300 text-[9px] font-black px-1.5 py-0.5 rounded tracking-wide uppercase select-none">
                Lvl {level + 1} • {task.assignerRole || (level === 0 ? "Direktur" : level === 1 ? "Manager" : "Supervisor")}
              </span>
              <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase ${getStatusStyle(task.status)}`}>
                {task.status}
              </span>
              <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${getPriorityStyle(task.priority)}`}>
                {task.priority}
              </span>
            </div>

            <p 
              onClick={() => setSelectedTask(task)}
              className="text-slate-850 dark:text-slate-100 font-extrabold text-[12.5px] hover:text-blue-600 dark:hover:text-blue-400 hover:underline cursor-pointer transition-all truncate leading-snug"
            >
              {task.task}
            </p>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-400 select-none">
              <p>
                PIC: <span className="font-extrabold text-slate-700 dark:text-slate-200">{task.pic || "Belum ditugaskan"}</span>
              </p>
              {task.dueDate && (
                <p>
                  Jatuh Tempo: <span className="font-mono font-bold text-slate-650 dark:text-slate-350">{new Date(task.dueDate).toLocaleDateString("id-ID")}</span>
                </p>
              )}
              {task.assignerName && (
                <p>
                  Pemberi: <span className="font-bold text-slate-600 dark:text-slate-400">{task.assignerName}</span>
                </p>
              )}
            </div>

            {task.delegationNotes && (
              <p className="text-slate-550 dark:text-slate-405 italic text-[11px] bg-white/50 dark:bg-slate-950/60 p-2.5 rounded-lg border border-slate-150/40 dark:border-slate-900/60 mt-1.5 leading-relaxed">
                &ldquo;{task.delegationNotes}&rdquo;
              </p>
            )}
          </div>

          {/* Progress Tracker gauge for this level */}
          <div className="flex items-center gap-3 shrink-0 font-mono">
            <div className="text-right">
              <span className={`text-xs font-black ${task.progress === 100 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-800 dark:text-slate-200'}`}>
                {task.progress}%
              </span>
              <p className="text-[8px] text-slate-400 font-bold uppercase tracking-wider">Progress Level</p>
            </div>
            <div className="w-16 h-1.5 bg-slate-205 dark:bg-slate-800 rounded-full overflow-hidden shrink-0">
              <div 
                className={`h-full transition-all duration-300 ${task.progress === 100 ? 'bg-emerald-500' : 'bg-blue-600'}`} 
                style={{ width: `${task.progress}%` }} 
              />
            </div>
          </div>
        </div>

        {/* Recursively generate children nested underneath */}
        {children.length > 0 && (
          <div className="mt-4 space-y-4">
            {children.map(child => renderDelegationNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

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

          {isCurrentlyClosedOrCompleted && (
            <div className="bg-amber-500/10 dark:bg-amber-500/5 border border-amber-500/20 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-amber-500 text-white rounded-xl shrink-0">
                  <AlertCircle className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-800 dark:text-slate-100 text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <span>🔒 Status Tugas Selesai / Closed (Read-Only)</span>
                  </h4>
                  <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5 leading-relaxed">
                    Tugas ini telah ditandai Selesai atau Closed. Pengeditan detail tugas dikunci demi konsistensi data. 
                    Jika perlu merubahnya, silakan klik tombol buka kembali di samping.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={async () => {
                  if (confirm("Apakah Anda yakin ingin membuka kembali tugas ini? (Progress akan dikembalikan ke 90% & status ke Under Progress)")) {
                    try {
                      await onUpdateTask(editingTask!.id, {
                        status: "Under Progress",
                        progress: 90
                      });
                      setEditingTask({
                        ...editingTask!,
                        status: "Under Progress",
                        progress: 90
                      });
                      setStatus("Under Progress");
                      setProgressManual(90);
                      setSuccessMessage("Tugas berhasil dibuka kembali!");
                      setTimeout(() => setSuccessMessage(""), 3000);
                    } catch (err: any) {
                      alert("Gagal membuka kembali tugas: " + err.message);
                    }
                  }
                }}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-extrabold text-[11px] rounded-xl cursor-pointer shadow-xs whitespace-nowrap scroll-smooth transition-all"
              >
                🔓 Buka Kembali Tugas
              </button>
            </div>
          )}
          
          <fieldset disabled={isCurrentlyClosedOrCompleted} className="space-y-6 border-none p-0 m-0">
          
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
                <div className="flex bg-slate-55 dark:bg-slate-950 p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 gap-2">
                  {["Project", "Request", "Incident", "Mandiri"].map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setTaskCategoryType(type)}
                      className={`flex-1 py-1.5 px-3 rounded-lg font-black text-xs transition-all cursor-pointer ${
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

              {taskCategoryType === "Project" || taskCategoryType === "Mandiri" ? (
                <>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                      {taskCategoryType === "Mandiri" ? "PROYEK TERKAIT (OPSIONAL)" : "PROJECT SELECTION"}
                    </label>
                    <select
                      value={projectCode}
                      onChange={(e) => setProjectCode(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-lg p-3 text-slate-800 dark:text-slate-200 font-medium focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer"
                    >
                      {taskCategoryType === "Mandiri" && (
                        <option value="">-- Tidak Terkait Proyek (Umum / Mandiri Umum) --</option>
                      )}
                      {projects.map(p => (
                        <option key={p.kode} value={p.kode}>{p.kode} – {p.nama}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                      {taskCategoryType === "Mandiri" ? "MODUL TERKAIT (OPSIONAL)" : "MODULE / MODUL TERKAIT"}
                    </label>
                    <select
                      value={modulName}
                      onChange={(e) => setModulName(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-lg p-3 text-slate-800 dark:text-slate-200 font-medium focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer"
                    >
                      {taskCategoryType === "Mandiri" && (
                        <option value="">-- Tidak Terkait Modul --</option>
                      )}
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

              <div className="flex flex-col gap-1.5 font-sans">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">PIC / ASSIGNEE</label>
                <select
                  value={pic}
                  disabled={isBroadcast}
                  onChange={(e) => setPic(e.target.value)}
                  className={`w-full border rounded-lg p-3 font-medium focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer ${
                    isBroadcast
                      ? "bg-slate-100 dark:bg-slate-850 text-slate-405 dark:text-slate-500 border-slate-205 dark:border-slate-800 cursor-not-allowed"
                      : "bg-slate-50 dark:bg-slate-955 border border-slate-250 dark:border-slate-800 text-slate-800 dark:text-slate-200"
                  }`}
                >
                  {isBroadcast ? (
                    <option value="">-- Semua Supervisor & Site Co. (Massal) --</option>
                  ) : (
                    getDynamicPicsList().map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))
                  )}
                </select>
              </div>

              {!editingTask && (currentUser?.role === "Manager" || currentUser?.role === "Direktur" || currentUser?.role === "Administrator") && (
                <div className="md:col-span-2 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border border-blue-200/60 dark:border-blue-900/40 rounded-xl flex items-start gap-3 mt-1 shadow-2xs font-sans">
                  <input
                    id="broadcast-toggle"
                    type="checkbox"
                    checked={isBroadcast}
                    onChange={(e) => setIsBroadcast(e.target.checked)}
                    className="mt-1.5 w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-550 cursor-pointer shrink-0"
                  />
                  <div className="flex-1">
                    <label htmlFor="broadcast-toggle" className="text-xs font-black text-blue-800 dark:text-blue-300 cursor-pointer select-none uppercase tracking-wide flex items-center gap-1.5">
                      📢 Kirim Massal / Broadcast ke Semua Supervisor & Site Coordinator
                    </label>
                    <p className="text-[11px] text-slate-505 dark:text-slate-400 mt-0.5 leading-relaxed font-semibold">
                      Opsi Spesial Manager: Sistem akan otomatis menduplikasi tugas ini untuk <span className="text-blue-600 dark:text-blue-400 font-bold">seluruh Supervisor dan Site Coordinatoraktif</span> di semua site rumah sakit agar dapat dikerjakan secara serentak.
                    </p>
                  </div>
                </div>
              )}

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
                  onChange={(e) => handleStatusChange(e.target.value)}
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
                  onChange={(e) => handleProgressChange(parseInt(e.target.value))}
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
          </fieldset>

           {/* Footer buttons / actions */}
          <div className="flex justify-between items-center pt-4 border-t border-slate-200 dark:border-slate-800">
            {editingTask ? (() => {
              const canModify = !editingTask.createdBy || 
                                editingTask.createdBy === currentUser?.username || 
                                currentUser?.role === "Administrator" || 
                                currentUser?.role === "Direktur" || 
                                currentUser?.role === "Manager";
              return (
                <button
                  type="button"
                  onClick={() => {
                    initiateDeleteTask(editingTask);
                  }}
                  disabled={!canModify}
                  className={`px-4 py-2.5 text-xs font-extrabold rounded-lg border transition-all font-sans ${
                    canModify 
                      ? "bg-red-50 hover:bg-red-100 hover:text-red-700 text-red-650 border-red-200 cursor-pointer" 
                      : "bg-slate-50 dark:bg-slate-850 text-slate-300 dark:text-slate-700 border-transparent cursor-not-allowed opacity-50"
                  }`}
                  title={canModify ? "Hapus Tugas" : `Hanya penginput (${editingTask.createdBy}) atau jajaran manajemen yang boleh menghapus`}
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
                const canModify = !editingTask || 
                                  !editingTask.createdBy || 
                                  editingTask.createdBy === currentUser?.username || 
                                  currentUser?.role === "Administrator" || 
                                  currentUser?.role === "Direktur" || 
                                  currentUser?.role === "Manager";
                const isBtnDisabled = !canModify || isCurrentlyClosedOrCompleted;
                return (
                  <button
                    id="submit-btn-trigger"
                    type="submit"
                    disabled={isBtnDisabled}
                    className={`px-6 py-2.5 text-xs font-black rounded-lg hover:shadow-lg active:scale-95 transition-all font-sans ${
                      !isBtnDisabled 
                        ? "bg-blue-600 hover:bg-blue-700 text-white cursor-pointer" 
                        : "bg-slate-100 dark:bg-slate-800 text-slate-350 dark:text-slate-600 cursor-not-allowed opacity-50"
                    }`}
                    title={
                      isCurrentlyClosedOrCompleted 
                        ? "Tugas Sudah Selesai/Closed (Hanya View Saja)" 
                        : canModify 
                          ? "" 
                          : `Hanya penginput (${editingTask?.createdBy}) atau manajemen yang boleh menyimpan perubahan`
                    }
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
            className={`p-1.5 rounded-md transition-all ${viewMode === 'ticket' ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs' : 'text-slate-450 dark:text-slate-500'} cursor-pointer`}
            title="Tampilan Kartu"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`p-1.5 rounded-md transition-all ${viewMode === 'table' ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs' : 'text-slate-450 dark:text-slate-500'} cursor-pointer`}
            title="Tampilan Tabel"
          >
            <ListOrdered className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('delegation')}
            className={`p-1.5 rounded-md transition-all ${viewMode === 'delegation' ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs' : 'text-slate-450 dark:text-slate-500'} cursor-pointer`}
            title="Peta Pohon Delegasi"
          >
            <Layers className="w-4 h-4" />
          </button>
        </div>

        <button
          onClick={() => setShowTrashOnly(!showTrashOnly)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-extrabold border transition-all cursor-pointer ${
            showTrashOnly
              ? "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900/60"
              : "border-slate-250 text-slate-550 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-850"
          }`}
          title={showTrashOnly ? "Kembali ke Tugas Aktif" : "Lihat Tong Sampah (Recycle Bin)"}
        >
          <Trash2 className="w-4 h-4 text-red-500 shrink-0" />
          <span className="hidden sm:inline">
            {showTrashOnly ? "Lihat Tugas Aktif" : `Tong Sampah (${tasks.filter(t => t.isDeleted).length})`}
          </span>
        </button>

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
              const childCount = tasks.filter(x => x.parentTaskId === t.id).length;

              return (
                <div 
                  key={t.id}
                  onClick={() => setSelectedTask(t)}
                  className={`bg-white dark:bg-slate-900 border-t-4 border border-x-slate-200 border-b-slate-200 dark:border-x-slate-800 dark:border-b-slate-800 rounded-xl p-5 shadow-xs hover:shadow-md hover:border-blue-500/40 transition-all cursor-pointer flex flex-col justify-between space-y-4 ${
                    t.taskCategoryType === "Mandiri"
                      ? "border-t-amber-500"
                      : t.taskCategoryType === "Incident"
                      ? "border-t-rose-500"
                      : t.taskCategoryType === "Request"
                      ? "border-t-sky-500"
                      : "border-t-blue-500"
                  }`}
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
                      {projects.find(p => p.kode === t.project)?.nama || t.project || "Umum / Non-Proyek"}
                    </p>

                    <div className="flex flex-wrap gap-1.5 pt-1">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${getStatusStyle(t.status)}`}>
                        {t.status}
                      </span>
                      {t.taskCategoryType && (
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black shrink-0 ${
                          t.taskCategoryType === "Mandiri"
                            ? "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400"
                            : t.taskCategoryType === "Incident"
                            ? "bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-400"
                            : t.taskCategoryType === "Request"
                            ? "bg-sky-100 text-sky-850 dark:bg-sky-950/40 dark:text-sky-400"
                            : "bg-blue-100 text-blue-800 dark:bg-blue-950/45 dark:text-blue-400"
                        }`}>
                          🏷️ {t.taskCategoryType}
                        </span>
                      )}
                      {subTotal > 0 && (
                        <span className="bg-slate-100 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5">
                          Check {subDone}/{subTotal}
                        </span>
                      )}
                      {t.categoryProgress && (
                        <span className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-650 dark:text-slate-400 text-[10px] font-bold px-1.5 py-0.5 rounded">
                          {t.categoryProgress}
                        </span>
                      )}
                      {t.assignerName ? (
                        <span className="bg-purple-50 text-purple-700 dark:bg-purple-950/25 dark:text-purple-400 text-[10px] font-black px-1.5 py-0.5 rounded" title={`Ditugaskan oleh ${t.assignerName}`}>
                          👑 dari {t.assignerName}
                        </span>
                      ) : t.createdBy ? (
                        <span className="bg-indigo-50/75 dark:bg-indigo-950/45 border border-indigo-100/35 text-indigo-650 dark:text-indigo-400 text-[10px] font-bold px-1.5 py-0.5 rounded">
                          🧑‍💻 {t.createdBy}
                        </span>
                      ) : null}
                      {t.parentTaskId && (
                        <span 
                          className="bg-amber-50/80 border border-amber-200/50 text-amber-700 dark:bg-amber-950/35 dark:text-amber-400 text-[10px] font-black px-1.5 py-0.5 rounded flex items-center gap-1 select-none"
                          title={t.assignerName ? `Didelegasikan oleh ${t.assignerName} (${t.assignerRole})` : "Tugas Delegasi"}
                        >
                          <Share2 className="w-2.5 h-2.5 shrink-0 text-amber-600 dark:text-amber-400" />
                          <span>Delegasi Atasan</span>
                        </span>
                      )}
                      {childCount > 0 && (
                        <span className="bg-indigo-50/85 border border-indigo-200/40 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400 text-[10px] font-black px-1.5 py-0.5 rounded flex items-center gap-1 select-none">
                          <Layers className="w-2.5 h-2.5 shrink-0 text-indigo-600 dark:text-indigo-400" />
                          <span>Delegasi Turunan ({childCount})</span>
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

                    {t.isDeleted && (
                      <div className="flex gap-2 pt-2 border-t border-red-200/20 dark:border-red-950/20">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            executeRestoreTask(t);
                          }}
                          className="flex-1 py-1.5 bg-emerald-500/15 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-extrabold text-[10px] rounded-lg cursor-pointer text-center uppercase tracking-widest transition-all"
                        >
                          🌟 Pulihkan Tugas
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            initiateDeleteTask(t);
                          }}
                          className="px-2.5 py-1.5 bg-red-500/15 hover:bg-red-500/20 text-red-650 dark:text-red-400 font-extrabold text-[10px] rounded-lg cursor-pointer text-center uppercase tracking-widest transition-all"
                          title="Hapus Permanen Selamanya"
                        >
                          🔥 Hapus Permanen
                        </button>
                      </div>
                    )}
                  </div>

                </div>
              );
            })}
          </div>
        ) : viewMode === 'table' ? (
          
          /* VIEW MODE: SPREADSHEET TABLE */
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-850 dark:text-slate-200 border-collapse">
                <thead className="bg-slate-50/80 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold">
                  <tr>
                    <th className="p-3">Project</th>
                    <th className="p-3">Uraian Tugas</th>
                    <th className="p-3">Kategori</th>
                    <th className="p-3">Pemberi Tugas</th>
                    <th className="p-3">PIC / Penerima</th>
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
                            {t.project || "Umum"}
                          </span>
                        </td>
                        <td className="p-3 font-bold text-slate-800 dark:text-slate-100 max-w-xs truncate">
                          <div className="flex flex-col gap-0.5">
                            <span className="truncate">{t.task}</span>
                            <div className="flex gap-1 items-center">
                              {t.parentTaskId && (
                                <span className="bg-amber-50 text-amber-650 border border-amber-200/50 dark:bg-amber-955/20 dark:text-amber-400 text-[8.5px] font-extrabold px-1 py-0.2 rounded inline-block w-fit">
                                  🗳️ Delegasi Atasan
                                </span>
                              )}
                              {tasks.some(x => x.parentTaskId === t.id) && (
                                <span className="bg-indigo-50 text-indigo-755 border border-indigo-200/40 dark:bg-indigo-955/20 dark:text-indigo-400 text-[8.5px] font-extrabold px-1 py-0.2 rounded inline-block w-fit">
                                  👥 Delegasi Turunan ({tasks.filter(x => x.parentTaskId === t.id).length})
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="p-3 font-semibold text-slate-700 dark:text-slate-300">
                          <div className="flex flex-col gap-1 items-start w-fit">
                            {t.categoryProgress && (
                              <span className="text-slate-600 dark:text-slate-400 text-[11px] font-medium">{t.categoryProgress}</span>
                            )}
                            {t.taskCategoryType && (
                              <span className={`text-[8.5px] font-bold px-1.5 py-0.2 rounded select-none ${
                                t.taskCategoryType === "Mandiri"
                                  ? "bg-amber-100 text-amber-800 dark:bg-amber-950/30 dark:text-amber-450 font-black uppercase"
                                  : t.taskCategoryType === "Incident"
                                  ? "bg-rose-100 text-rose-800 dark:bg-rose-950/30 dark:text-rose-400 uppercase"
                                  : t.taskCategoryType === "Request"
                                  ? "bg-sky-100 text-sky-850 dark:bg-sky-950/30 dark:text-sky-400 uppercase"
                                  : "bg-blue-105/10 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 uppercase"
                              }`}>
                                {t.taskCategoryType}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex flex-col gap-0.5 w-fit">
                            <span className="font-bold text-slate-800 dark:text-slate-200 text-xs flex items-center gap-1">
                              👑 {t.assignerName || t.createdBy || "System"}
                            </span>
                            {t.assignerRole && (
                              <span className="text-[9px] bg-slate-100 dark:bg-slate-800 px-1 py-0.2 rounded text-slate-450 font-bold uppercase tracking-wider">{t.assignerRole}</span>
                            )}
                          </div>
                        </td>
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
                          <div className="flex justify-end items-center gap-1.5 whitespace-nowrap">
                            <button 
                              onClick={() => setSelectedTask(t)}
                              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-400 hover:text-blue-500 transition-colors cursor-pointer"
                              title="Tampilkan Detail"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            {t.isDeleted && (
                              <>
                                <button
                                  onClick={() => executeRestoreTask(t)}
                                  className="p-1 hover:bg-emerald-50 text-emerald-600 dark:hover:bg-emerald-950/40 dark:text-emerald-400 rounded transition-colors cursor-pointer"
                                  title="🌟 Pulihkan Tugas"
                                >
                                  <RefreshCw className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => initiateDeleteTask(t)}
                                  className="p-1 hover:bg-red-50 text-red-650 dark:hover:bg-red-950/40 dark:text-red-400 rounded transition-colors cursor-pointer"
                                  title="🔥 Hapus Permanen"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          
          /* VIEW MODE: DELEGATION TREE MAP */
          <div className="space-y-6 font-sans">
            <div className="p-4 bg-emerald-500/5 dark:bg-emerald-500/5 border border-emerald-500/10 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
              <div className="space-y-1">
                <h4 className="text-sm font-black text-slate-850 dark:text-slate-100 flex items-center gap-2">
                  <span className="p-1 rounded bg-emerald-500 text-white"><Share2 className="w-3.5 h-3.5" /></span>
                  Peta Progress Hubungan Delegasi Berjenjang (Hierarki Tugas)
                </h4>
                <p className="text-xs text-slate-500 select-none">
                  Lacak runtutan delegasi tugas dari <strong>Direktur &rarr; Manager &rarr; Supervisor &rarr; Staff</strong>.
                </p>
              </div>
              <div className="text-xs sm:text-right whitespace-nowrap">
                <span className="font-bold text-slate-700 dark:text-slate-350">Petunjuk penyelesaian:</span>
                <p className="text-[10px] text-slate-400 mt-0.5">Progress <strong className="text-emerald-500">100%</strong> akan otomatis berwarna hijau <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />.</p>
              </div>
            </div>

            {(() => {
              // Get all true roots of any task chain (has children, and no parent or parent is missing)
              const rootTasks = filtered.filter(t => !t.parentTaskId || !tasks.some(p => p.id === t.parentTaskId));

              if (rootTasks.length === 0) {
                return (
                  <div className="text-center py-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
                    <Layers className="w-10 h-10 text-slate-300 mx-auto mb-2 opacity-55" />
                    <p className="text-sm font-semibold text-slate-755 dark:text-slate-305">Tidak ada tugas utama sebagai dasar delegasi</p>
                    <p className="text-xs text-slate-400">Pastikan saringan Anda aktif atau tambahkan tugas baru terlebih dahulu.</p>
                  </div>
                );
              }

              return (
                <div className="space-y-8">
                  {rootTasks.map((rt) => {
                    const childrenCount = tasks.filter(x => x.parentTaskId === rt.id).length;
                    return (
                      <div 
                        key={rt.id} 
                        className="bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800/85 rounded-2xl p-6 shadow-xs space-y-4"
                      >
                        <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex flex-wrap items-center justify-between gap-3">
                          <div className="space-y-1">
                            <span className="font-mono text-[9px] font-black text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-955/20 px-2 py-0.5 rounded">
                              RANTAI DELEGASI #TKT-{String(tasks.indexOf(rt) + 1).padStart(4, "0")}
                            </span>
                            <h3 className="text-base font-black text-slate-900 dark:text-white mt-1 leading-tight">
                              {rt.task}
                            </h3>
                            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
                              Inisiator Tugas: {rt.createdBy || "System"} • PIC Utama: {rt.pic || "—"}
                            </p>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black ${getStatusStyle(rt.status)}`}>
                              {rt.status.toUpperCase()}
                            </span>
                            <span className="bg-slate-105 dark:bg-slate-805 px-2.5 py-1 rounded-full text-[10px] font-black text-slate-505 dark:text-slate-450 border border-slate-200 dark:border-slate-800">
                              {childrenCount} Delegasi Turunan
                            </span>
                          </div>
                        </div>

                        {/* Staggered Vertical Tree of Nodes for this Root */}
                        <div className="pl-2 pr-1 pt-1 text-xs">
                          {renderDelegationNode(rt, 0)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
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
                {selectedTask.assignerName ? (
                  <div>
                    <p className="text-[8px] text-purple-400 font-bold uppercase tracking-widest font-sans">Pemberi Tugas</p>
                    <p className="font-black text-purple-700 dark:text-purple-400 mt-1 flex items-center gap-1">
                      👑 {selectedTask.assignerName} <span className="text-[9px] bg-purple-55 dark:bg-purple-950 px-1 rounded font-normal text-purple-650">{selectedTask.assignerRole || "Manager"}</span>
                    </p>
                  </div>
                ) : selectedTask.createdBy ? (
                  <div>
                    <p className="text-[8px] text-indigo-400 font-bold uppercase tracking-widest font-sans">Dibuat Oleh</p>
                    <p className="font-bold text-indigo-600 dark:text-indigo-455 mt-1">
                      🧑‍💻 {selectedTask.createdBy}
                    </p>
                  </div>
                ) : null}
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
                    <p className="text-xs text-slate-455 italic">Belum ada checklist teknis tambahan.</p>
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
              {selectedTask.taskCategoryType && selectedTask.taskCategoryType !== "Project" && selectedTask.taskCategoryType !== "Mandiri" && (
                <div className="bg-amber-50 dark:bg-amber-955/20 border border-amber-200/55 p-3 rounded-xl text-xs space-y-1">
                  <p className="font-bold text-amber-700 dark:text-amber-450 uppercase text-[9px] tracking-wider">Detail Pelapor ({selectedTask.taskCategoryType})</p>
                  <p className="text-slate-855 dark:text-slate-200">
                    <span className="text-slate-400 font-bold">Nama Pelapor:</span> {selectedTask.reporterName || "—"}
                  </p>
                  <p className="text-slate-855 dark:text-slate-200">
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

              {/* Seksi Alur Delegasi Berjenjang (Direktur -> Manager -> Supervisor -> Staff) */}
              {selectedTask.assignerName && (
                <div className="bg-amber-50/50 dark:bg-amber-950/15 border border-amber-200/50 p-3.5 rounded-xl text-xs space-y-1">
                  <p className="font-extrabold text-amber-700 dark:text-amber-400 uppercase text-[9px] tracking-wider flex items-center gap-1 leading-none">
                    <Share2 className="w-3 h-3 text-amber-600" />
                    Pemberi Tugas / Konteks Delegasi
                  </p>
                  <p className="text-slate-800 dark:text-slate-200 font-bold text-xs">
                    {selectedTask.assignerName} <span className="text-[10px] text-slate-400 font-normal">({selectedTask.assignerRole || "Direktur"})</span>
                  </p>
                  {selectedTask.delegationNotes && (
                    <p className="text-slate-600 dark:text-slate-400 mt-1 italic pl-2 border-l-2 border-amber-300">
                      &ldquo;{selectedTask.delegationNotes}&rdquo;
                    </p>
                  )}
                </div>
              )}

              {(() => {
                const pTask = selectedTask.parentTaskId ? tasks.find(t => t.id === selectedTask.parentTaskId) : null;
                if (pTask) {
                  return (
                    <div className="bg-slate-50 dark:bg-slate-950 border border-slate-150/10 dark:border-slate-800/40 p-3 rounded-xl text-xs space-y-1.5 shadow-2xs">
                      <p className="font-extrabold text-slate-400 uppercase text-[9px] tracking-wider">
                        🔗 Terhubung ke Tugas Induk (Atasan)
                      </p>
                      <button
                        type="button"
                        onClick={() => setSelectedTask(pTask)}
                        className="text-blue-600 hover:text-blue-750 dark:text-blue-400 dark:hover:text-blue-300 font-bold hover:underline text-left text-xs"
                      >
                        {pTask.task} &rarr;
                      </button>
                    </div>
                  );
                }
                return null;
              })()}

              {(() => {
                const kids = tasks.filter(t => t.parentTaskId === selectedTask.id);
                if (kids.length > 0) {
                  return (
                    <div className="bg-indigo-50/30 dark:bg-indigo-950/10 border border-indigo-150/35 p-3.5 rounded-xl text-xs space-y-2 shadow-2xs">
                      <p className="font-extrabold text-indigo-700 dark:text-indigo-400 uppercase text-[9px] tracking-wider flex items-center gap-1 leading-none">
                        <Layers className="w-3 h-3" />
                        Daftar Delegasi Turunan ({kids.length} Tugas)
                      </p>
                      <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                        {kids.map(k => (
                          <div 
                            key={k.id} 
                            onClick={() => setSelectedTask(k)}
                            className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-500/40 cursor-pointer transition-all"
                          >
                            <div className="space-y-0.5 truncate max-w-[70%]">
                              <p className="font-bold text-slate-800 dark:text-slate-100 truncate text-[11px]">{k.task}</p>
                              <p className="text-[9px] text-slate-400 font-bold">PIC: {k.pic || "Unassigned"} | <span className="text-blue-600">{k.status}</span></p>
                            </div>
                            <div className="flex items-center gap-1.5 font-mono text-[10px] text-slate-500 shrink-0 select-none">
                              <span className="font-bold">{k.progress}%</span>
                              <div className="w-12 h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-600" style={{ width: `${k.progress}%` }} />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                }
                return null;
              })()}

              <div className="flex flex-wrap gap-2 justify-between items-center pt-3 border-t border-slate-100 dark:border-slate-800">
                <div className="flex gap-2">
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

                  {/* Delegasikan Button for Hierarchy (Direktur/Manager/Supervisor) */}
                  {currentUser?.role !== "Client" && (() => {
                    const isEligibleToDelegate = currentUser?.role === "Administrator" || 
                                                  currentUser?.role === "Direktur" || 
                                                  currentUser?.role === "Manager" || 
                                                  currentUser?.role === "Supervisor" ||
                                                  selectedTask.pic === (currentUser?.nickname || currentUser?.username);
                    if (isEligibleToDelegate) {
                      return (
                        <button
                          type="button"
                          onClick={() => {
                            setDelTaskName(`Delegasi: ${selectedTask.task}`);
                            setDelPic("");
                            setDelDueDate(selectedTask.dueDate || "");
                            setDelPriority(selectedTask.priority || "Medium");
                            setDelNotes("");
                            setDelegatingParentTask(selectedTask);
                            setSelectedTask(null); // safely close the details popup
                          }}
                          className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-400 dark:border-indigo-900 px-4 py-1.5 text-xs font-bold rounded-lg flex items-center gap-1 cursor-pointer transition-all"
                          title="Delegasikan tugas ini berjenjang ke supervisor / tim pelaksana"
                        >
                          <Share2 className="w-3 h-3 text-indigo-650" />
                          <span>Delegasikan</span>
                        </button>
                      );
                    }
                    return null;
                  })()}
                </div>

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

      {/* DIALOG MODAL: DELEGATE TASK TO LOWER LEVEL (Opsi B) */}
      <AnimatePresence>
        {delegatingParentTask && (
          <div id="task-delegation-modal" className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-[60] flex items-center justify-center p-4">
            
            {/* Dark glass backdrop overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDelegatingParentTask(null)}
              className="absolute inset-0 bg-slate-950/40"
            />

            {/* Modal Dialog Body Wrapper */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden font-sans z-10 p-6 space-y-4"
            >
              {/* Header */}
              <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Share2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <div>
                    <h3 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider">
                      Delegasikan Tugas Berjenjang
                    </h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                      Alur: {currentUser?.role} &rarr; Delegasi Baru
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setDelegatingParentTask(null)}
                  className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Form Content */}
              <form onSubmit={handleDelegationSubmit} className="space-y-4 text-xs">
                
                {/* Parent Task Context Highlight */}
                <div className="p-3 bg-blue-50/40 dark:bg-blue-950/15 border border-blue-100/35 rounded-xl space-y-1.5">
                  <div className="text-[9px] uppercase font-black text-blue-600 dark:text-blue-400 tracking-wider">
                    Tugas Induk (Pemberi Tugas: {delegatingParentTask.assignerName || "Sistem"})
                  </div>
                  <div className="font-bold text-slate-900 dark:text-slate-100 text-xs text-wrap">
                    {delegatingParentTask.task}
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                    <span>Target Akhir Induk: <strong>{delegatingParentTask.dueDate || "—"}</strong></span>
                    <span>Modul: {delegatingParentTask.modul || "—"}</span>
                  </div>
                </div>

                {/* New Delegated Task Name */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">NAMA TUGAS DELEGASI *</label>
                  <input
                    type="text"
                    required
                    value={delTaskName}
                    onChange={(e) => setDelTaskName(e.target.value)}
                    placeholder="Contoh: Realisasi Fitur Penagihan di Site RS..."
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-lg p-2.5 text-slate-800 dark:text-slate-100 font-semibold focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-xs"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Select Assignee PIC */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">PIC PENERIMA DELEGASI *</label>
                    <select
                      required
                      value={delPic}
                      onChange={(e) => setDelPic(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-lg p-2.5 text-slate-800 dark:text-slate-200 font-medium focus:ring-2 focus:ring-blue-500/10 transition-all cursor-pointer text-xs"
                    >
                      <option value="">-- Pilih PIC --</option>
                      {getDelegationPicsList(delegatingParentTask.project).map(p => {
                        const uInfo = users.find(u => u.nickname === p || u.username === p);
                        const roleTag = uInfo?.role ? ` [${uInfo.role}]` : "";
                        return (
                          <option key={p} value={p}>{p}{roleTag}</option>
                        );
                      })}
                    </select>
                  </div>

                  {/* Delegated Task Target Date (Due Date) */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center justify-between">
                      <span>JATUH TEMPO DELEGASI</span>
                      {delegatingParentTask.dueDate && (
                        <span className="text-[9px] text-amber-600 bg-amber-50 dark:bg-amber-950/20 px-1 py-0.2 rounded font-mono">Max: {delegatingParentTask.dueDate}</span>
                      )}
                    </label>
                    <input
                      type="date"
                      required
                      max={delegatingParentTask.dueDate || undefined}
                      value={delDueDate}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (delegatingParentTask.dueDate && val > delegatingParentTask.dueDate) {
                          setDelDueDate(delegatingParentTask.dueDate);
                        } else {
                          setDelDueDate(val);
                        }
                      }}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-lg p-2.5 text-slate-800 dark:text-slate-100 font-semibold focus:ring-2 focus:ring-blue-500/10 transition-all text-xs"
                    />
                  </div>
                </div>

                {/* Priority Selection */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">PRIORITAS DELEGASI *</label>
                  <div className="flex gap-2">
                    {["Urgent", "High", "Medium", "Low"].map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setDelPriority(p)}
                        className={`flex-1 py-1.5 text-center rounded-md font-bold text-[10px] transition-all cursor-pointer border ${
                          delPriority === p
                            ? "bg-blue-650 text-white border-blue-600 shadow-xs"
                            : "bg-slate-50 text-slate-600 dark:bg-slate-900 dark:text-slate-450 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-850"
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Catatan Instruksi Khusus */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">INSTRUKSI KHUSUS / CATATAN DELEGASI</label>
                  <textarea
                    rows={3}
                    value={delNotes}
                    onChange={(e) => setDelNotes(e.target.value)}
                    placeholder="Masukkan uraian detail instruksi pengerjaan, batasan fungsional dari Manager ke Supervisor / Supervisor ke Staff..."
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-lg p-2.5 text-slate-800 dark:text-slate-100 font-medium focus:ring-2 focus:ring-blue-500/10 transition-all text-xs placeholder:opacity-50"
                  />
                </div>

                {/* Success alert message */}
                {successMessage && (
                  <div className="p-2.5 bg-emerald-50 dark:bg-emerald-955/20 text-emerald-800 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900 rounded-lg font-bold text-center text-[10.5px]">
                    {successMessage}
                  </div>
                )}

                {/* Form submit/close operations bar */}
                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setDelegatingParentTask(null)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-150 dark:bg-slate-850 dark:hover:bg-slate-800 text-slate-705 dark:text-slate-300 font-bold rounded-lg transition-all cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-750 text-white font-bold rounded-lg transition-all shadow-xs uppercase tracking-wider cursor-pointer"
                  >
                    Simpan Delegasi
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Dynamic Deletion & Validator Dialog (Modal) */}
      <AnimatePresence>
        {taskToDelete && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.23, ease: "easeOut" }}
              className="bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-3xl p-6 shadow-2xl max-w-lg w-full overflow-hidden relative"
            >
              {(() => {
                const isTaskDeleted = taskToDelete.isDeleted === true || taskToDelete.isDeleted === "true";
                return (
                  <>
                    {/* Header */}
                    <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                      <div className={`p-2.5 rounded-2xl ${deleteErrorReason ? "bg-amber-100 dark:bg-amber-955/40 text-amber-650 dark:text-amber-450" : "bg-red-50 dark:bg-red-950/30 text-red-650 dark:text-red-400"}`}>
                        {deleteErrorReason ? <AlertCircle className="w-6 h-6" /> : <Trash2 className="w-6 h-6" />}
                      </div>
                      <div>
                        <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-[13px] uppercase tracking-wider font-sans">
                          {deleteErrorReason ? "⚠️ Validasi Sistem Gagal" : isTaskDeleted ? "🔥 Konfirmasi Hapus Permanen Selamanya" : "🗑️ Konfirmasi Tindakan Tugas"}
                        </h3>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                          ID Tugas: #{taskToDelete.id}
                        </p>
                      </div>
                    </div>

                    {/* Body Content */}
                    <div className="py-5 space-y-4">
                      <div className="space-y-1 bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-150/10 dark:border-slate-850">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Tugas yang Dipilih:</span>
                        <h4 className="font-extrabold text-slate-800 dark:text-slate-200 text-xs font-sans leading-snug">
                          {taskToDelete.task}
                        </h4>
                        <div className="flex gap-4 items-center mt-2 pt-2 border-t border-slate-200/55 dark:border-slate-800/40 text-[10px] text-slate-500 font-semibold">
                          <span>PIC: <b className="text-slate-700 dark:text-slate-300">{taskToDelete.pic || "Belum ada"}</b></span>
                          <span>Progress: <b className="text-slate-700 dark:text-slate-300">{taskToDelete.progress}%</b></span>
                          <span>Status: <b className="text-slate-700 dark:text-slate-300">{taskToDelete.status}</b></span>
                        </div>
                      </div>

                      {deleteErrorReason ? (
                        <div className="p-4 bg-amber-500/10 dark:bg-amber-500/5 border border-amber-505 text-amber-700 dark:text-amber-400 rounded-2xl text-[11px] font-medium leading-relaxed font-sans space-y-2">
                          <p>{deleteErrorReason}</p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 italic">
                            💡 Klik tombol "Batal / Cancel" untuk unchecklist subtask atau ubah status tugas agar syarat keamanan data terpenuhi.
                          </p>
                        </div>
                      ) : isTaskDeleted ? (
                        <div className="space-y-4">
                          <div className="p-3.5 bg-red-500/10 dark:bg-red-955 border border-red-500/20 text-red-700 dark:text-red-400 rounded-2xl text-[11px] font-medium leading-relaxed font-sans space-y-2">
                            <p className="font-extrabold">⚠️ PERINGATAN: Penghapusan ini bersifat PERMANEN!</p>
                            <p>Tugas Anda akan seutuhnya dihapus secara fisik dari database system dan tidak akan dapat dipulihkan atau dikembalikan lagi.</p>
                          </div>
                          
                          <p className="text-slate-600 dark:text-slate-300 text-xs font-medium leading-relaxed font-sans">
                            Apakah Anda yakin ingin menghapus tugas ini secara permanen dari database?
                          </p>

                          <div className="pt-2">
                            <button
                              type="button"
                              onClick={() => {
                                executePermanentDelete(taskToDelete);
                              }}
                              className="w-full flex items-center justify-center gap-2 p-3 bg-red-600 hover:bg-red-700 active:scale-99 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4 shrink-0" />
                              <span>Ya, Hapus Permanen Sekarang</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <p className="text-slate-600 dark:text-slate-300 text-xs font-medium leading-relaxed font-sans">
                            Di mana Anda ingin menyimpan / memproses tindakan penghapusan untuk tugas ini?
                          </p>
                          
                          <div className="grid grid-cols-1 gap-3 pt-1">
                            {/* Option 1: Soft Delete to Trash */}
                            <button
                              type="button"
                              onClick={() => executeSoftDelete(taskToDelete)}
                              className="flex items-start gap-3 p-3.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-850 rounded-2xl border border-slate-200/50 dark:border-slate-800 text-left transition-all group scale-99 cursor-pointer"
                            >
                              <span className="p-2 bg-blue-100 dark:bg-blue-950 text-blue-600 rounded-xl mt-0.5 group-hover:scale-105 transition-all">
                                <Trash2 className="w-4.5 h-4.5" />
                              </span>
                              <div>
                                <h5 className="font-extrabold text-slate-900 dark:text-slate-100 text-xs font-sans">🗑️ Pindahkan ke Tong Sampah (Direkomendasikan)</h5>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                                  Tugas tidak terhapus permanen dari sistem, melainkan dipindahkan ke folder Tong Sampah dan dapat Anda pulihkan kembali kapan saja.
                                </p>
                              </div>
                            </button>

                            {/* Option 2: Hard Delete permanently */}
                            <button
                              type="button"
                              onClick={() => {
                                if (confirm("⚠️ PERINGATAN KERAS: Penghapusan ini bersifat PERMANEN dan akan menghapus total data dari database. Tindakan ini tidak dapat dibatalkan! Lanjutkan?")) {
                                  executePermanentDelete(taskToDelete);
                                }
                              }}
                              className="flex items-start gap-3 p-3.5 bg-red-50/20 dark:bg-red-950/10 hover:bg-red-50/50 dark:hover:bg-red-950/20 rounded-2xl border border-red-200/30 text-left transition-all group scale-99 cursor-pointer"
                            >
                              <span className="p-2 bg-red-100 dark:bg-red-950 text-red-650 rounded-xl mt-0.5 group-hover:scale-105 transition-all">
                                <Trash2 className="w-4.5 h-4.5" />
                              </span>
                              <div>
                                <h5 className="font-extrabold text-red-650 dark:text-red-400 text-xs font-sans">🔥 Hapus Permanen Selamanya</h5>
                                <p className="text-[11px] text-slate-500 dark:text-slate-450 mt-0.5 leading-relaxed">
                                  Tugas Anda akan seutuhnya dihapus permanen secara fisik dari database system dan tidak dapat dipulihkan.
                                </p>
                              </div>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                );
              })()}

              {/* Action Footer Close */}
              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setTaskToDelete(null);
                    setDeleteErrorReason(null);
                  }}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-extrabold text-xs rounded-xl transition-all cursor-pointer font-sans"
                >
                  Batal / Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
