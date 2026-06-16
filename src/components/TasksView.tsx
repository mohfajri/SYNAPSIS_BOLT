import React, { useState, useEffect, useRef } from "react";
import { Task, Project, User, SubTask, CommLog, MeetingLog, TaskComment } from "../types";
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
  Layers,
  MessageSquare,
  Send,
  Check,
  ChevronDown,
  Columns,
  Sidebar,
  CheckCircle2
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface SearchOption {
  value: string;
  label: string;
}

interface SearchableSelectProps {
  label: string;
  placeholder: string;
  options: SearchOption[];
  value: string;
  onChange: (val: string) => void;
  optionalText?: string;
  className?: string;
}

function SearchableSelect({
  label,
  placeholder,
  options,
  value,
  onChange,
  optionalText
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const selectedOption = options.find(o => o.value === value);

  // Filter options based on search terms
  // opsian data tidak ditampilkan dahulu, wait until search is filled
  const filteredOptions = searchTerm.trim() === "" 
    ? [] 
    : options.filter(o => 
        o.label.toLowerCase().includes(searchTerm.toLowerCase()) || 
        o.value.toLowerCase().includes(searchTerm.toLowerCase())
      );

  return (
    <div ref={containerRef} className="flex flex-col gap-1.5 relative w-full">
      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none">
        {label}
      </label>
      
      <div className="relative">
        <div 
          onClick={() => setIsOpen(true)}
          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-lg p-3 pr-10 text-slate-800 dark:text-slate-200 font-semibold focus-within:ring-2 focus-within:ring-blue-500/25 transition-all flex items-center justify-between cursor-pointer text-left"
        >
          {isOpen ? (
            <input
              type="text"
              autoFocus
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Ketik untuk mencari..."
              className="w-full bg-transparent border-0 p-0 text-slate-800 dark:text-slate-200 font-semibold focus:ring-0 focus:outline-none placeholder:font-normal placeholder:opacity-55"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span className={selectedOption ? "text-slate-800 dark:text-slate-100" : "text-slate-450 font-normal opacity-70"}>
              {selectedOption ? selectedOption.label : optionalText || placeholder}
            </span>
          )}
          
          <div className="absolute right-3 flex items-center gap-1.5 text-slate-400">
            {isOpen && searchTerm ? (
              <button 
                type="button" 
                onClick={(e) => {
                  e.stopPropagation();
                  setSearchTerm("");
                }}
                className="hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : (
              <ChevronDown className="w-4 h-4 shrink-0" />
            )}
          </div>
        </div>

        {isOpen && (
          <div className="absolute z-50 w-full mt-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-880 rounded-xl shadow-lg max-h-56 overflow-y-auto select-none p-1 shrink-0">
            {optionalText && (
              <div 
                onClick={() => {
                  onChange("");
                  setIsOpen(false);
                  setSearchTerm("");
                }}
                className={`flex items-center justify-between p-2.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                  value === "" 
                    ? "bg-blue-50 dark:bg-blue-955/40 text-blue-600 dark:text-blue-400" 
                    : "text-slate-705 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/65"
                }`}
              >
                <span>{optionalText}</span>
                {value === "" && <Check className="w-3.5 h-3.5" />}
              </div>
            )}
            
            {searchTerm.trim() === "" ? (
              <div className="p-3 text-center text-[11px] font-bold text-slate-450 dark:text-slate-500">
                🔍 Silakan ketik kata kunci untuk mencari...
              </div>
            ) : filteredOptions.length === 0 ? (
              <div className="p-3 text-center text-[11px] font-bold text-slate-450 dark:text-slate-500">
                ⚠️ Tidak menemukan data pencarian
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = value === opt.value;
                return (
                  <div
                    key={opt.value}
                    onClick={() => {
                      onChange(opt.value);
                      setIsOpen(false);
                      setSearchTerm("");
                    }}
                    className={`flex items-center justify-between p-2.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                      isSelected
                        ? "bg-blue-50 dark:bg-blue-800/30 text-blue-600 dark:text-blue-400"
                        : "text-slate-705 dark:text-slate-350 hover:bg-slate-100 dark:hover:bg-slate-800/65"
                    }`}
                  >
                    <span>{opt.label}</span>
                    {isSelected && <Check className="w-3.5 h-3.5" />}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}

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
  commLogs?: CommLog[];
  meetingLogs?: MeetingLog[];
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
  onClearInitialStatus,
  commLogs = [],
  meetingLogs = []
}: TasksViewProps) {
  
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterPriority, setFilterPriority] = useState("");
  const [filterPic, setFilterPic] = useState("");
  const [filterProject, setFilterProject] = useState("");
  const [filterTaskType, setFilterTaskType] = useState("");
  const [filterCatProgress, setFilterCatProgress] = useState("");
  
  // View mode State: 'ticket' (interactive grid cards), 'table' (rows) or 'delegation' (hierarchical trees)
  const [viewMode, setViewMode] = useState<'ticket' | 'table' | 'delegation'>('table');

  // Custom states matching impeccable layout
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [inlineNote, setInlineNote] = useState<string>("");
  const [selectedCategoryTab, setSelectedCategoryTab] = useState<string>("Semua Kategori");
  const [savingNoteId, setSavingNoteId] = useState<string | null>(null);
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});

  // Detail Modal State
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [activeDetailTab, setActiveDetailTab] = useState<"detail" | "chat">("detail");

  // User layout style preference for task details (either split columns or spacious overlay side drawer)
  const [detailLayout, setDetailLayout] = useState<'split' | 'drawer'>('drawer');

  // Chat Room Discussion and scroll states
  const [chatInput, setChatInput] = useState("");
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // Automatically select the detail tab when a new task is selected
  useEffect(() => {
    if (selectedTask) {
      setActiveDetailTab("detail");
      setDraftStatus(selectedTask.status || "Not Started");
      setDraftProgress(selectedTask.progress || 0);
    } else {
      setDraftStatus("");
      setDraftProgress(0);
    }
  }, [selectedTask?.id]);

  // Auto-scroll chat room when comments update
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [selectedTask?.comments, selectedTask?.id]);

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
  const [inputFileName, setInputFileName] = useState("");

  // Local state drafts for detailing status/progress save flow
  const [draftStatus, setDraftStatus] = useState<string>("");
  const [draftProgress, setDraftProgress] = useState<number>(0);

  // Local state for comment attachments
  const [commentAttachmentName, setCommentAttachmentName] = useState("");
  const [commentAttachmentData, setCommentAttachmentData] = useState("");

  const [tempSubTasks, setTempSubTasks] = useState<SubTask[]>([]);
  const [newSubTitle, setNewSubTitle] = useState("");
  const [linkedCommLogIds, setLinkedCommLogIds] = useState<string[]>([]);
  const [linkedMeetingLogIds, setLinkedMeetingLogIds] = useState<string[]>([]);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

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

  const [collabModalTaskId, setCollabModalTaskId] = useState<string | null>(null);
  const [collabModalType, setCollabModalType] = useState<'comm' | 'meeting' | null>(null);
  const [tempCheckedCollabIds, setTempCheckedCollabIds] = useState<string[]>([]);
  const [collabSearch, setCollabSearch] = useState("");

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

  const handleSaveTaskCollab = async () => {
    if (!collabModalTaskId || !collabModalType) return;
    try {
      const field = collabModalType === 'comm' ? 'linkedCommLogIds' : 'linkedMeetingLogIds';
      await onUpdateTask(collabModalTaskId, {
        [field]: tempCheckedCollabIds
      });
      if (selectedTask && selectedTask.id === collabModalTaskId) {
        setSelectedTask({
          ...selectedTask,
          [field]: tempCheckedCollabIds
        });
      }
      setCollabModalTaskId(null);
      setCollabModalType(null);
    } catch (err: any) {
      alert("Gagal memperbarui koneksi arsip kolaborasi tugas: " + err.message);
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

    // Filter by our exquisite top categorical tabs
    let matchesCategoryTab = true;
    if (selectedCategoryTab === "Mandiri") {
      matchesCategoryTab = t.taskCategoryType === "Mandiri";
    } else if (selectedCategoryTab === "Incident") {
      matchesCategoryTab = t.taskCategoryType === "Incident";
    } else if (selectedCategoryTab === "Request") {
      matchesCategoryTab = t.taskCategoryType === "Request";
    } else if (selectedCategoryTab === "Tugas Proyek") {
      matchesCategoryTab = !["Mandiri", "Incident", "Request"].includes(t.taskCategoryType || "");
    }

    return (
      matchesTrash &&
      matchesSearch &&
      matchesStatus &&
      matchesPriority &&
      matchesPic &&
      matchesProject &&
      matchesTaskType &&
      matchesCatProgress &&
      matchesCategoryTab
    );
  });

  // Helper for inserting formatting tags in rich textarea field
  const handleInsertFormat = (
    textareaId: string, 
    value: string, 
    setValue: (val: string) => void, 
    type: 'bold' | 'italic' | 'underline' | 'bullet' | 'number'
  ) => {
    const textarea = document.getElementById(textareaId) as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);

    let replacement = "";
    if (type === "bold") {
      replacement = `**${selectedText || "teks_tebal"}**`;
    } else if (type === "italic") {
      replacement = `*${selectedText || "teks_miring"}*`;
    } else if (type === "underline") {
      replacement = `__${selectedText || "teks_garisbawah"}__`;
    } else if (type === "bullet") {
      replacement = `\n- ${selectedText || "butir_item"}`;
    } else if (type === "number") {
      replacement = `\n1. ${selectedText || "butir_item"}`;
    }

    const newText = value.substring(0, start) + replacement + value.substring(end);
    setValue(newText);

    // Focus and select the text
    setTimeout(() => {
      textarea.focus();
      const cursorOffset = start + replacement.length;
      textarea.setSelectionRange(cursorOffset, cursorOffset);
    }, 50);
  };

  // Utility to parse inline styling markers: **bold**, *italic*, __underline__
  const parseFormattingInline = (text: string): React.ReactNode[] => {
    if (!text) return [];
    
    let parts: { text: string; bold?: boolean; italic?: boolean; underline?: boolean }[] = [{ text }];

    // 1. __Underline__
    let tempArr: typeof parts = [];
    parts.forEach(part => {
      if (part.bold || part.italic || part.underline) {
        tempArr.push(part);
        return;
      }
      const splitRegex = /(__.*?__)/g;
      const splitParts = part.text.split(splitRegex);
      splitParts.forEach(sp => {
        if (sp.startsWith("__") && sp.endsWith("__")) {
          tempArr.push({
            text: sp.slice(2, -2),
            underline: true
          });
        } else if (sp) {
          tempArr.push({ text: sp });
        }
      });
    });
    parts = tempArr;

    // 2. **Bold**
    tempArr = [];
    parts.forEach(part => {
      if (part.bold || part.italic || part.underline) {
        tempArr.push(part);
        return;
      }
      const splitRegex = /(\*\*.*?\*\*)/g;
      const splitParts = part.text.split(splitRegex);
      splitParts.forEach(sp => {
        if (sp.startsWith("**") && sp.endsWith("**")) {
          tempArr.push({
            text: sp.slice(2, -2),
            bold: true
          });
        } else if (sp) {
          tempArr.push({ text: sp });
        }
      });
    });
    parts = tempArr;

    // 3. *Italic*
    tempArr = [];
    parts.forEach(part => {
      if (part.bold || part.italic || part.underline) {
        tempArr.push(part);
        return;
      }
      const splitRegex = /(\*.*?\*)/g;
      const splitParts = part.text.split(splitRegex);
      splitParts.forEach(sp => {
        if (sp.startsWith("*") && sp.endsWith("*") && !sp.startsWith("**")) {
          tempArr.push({
            text: sp.slice(1, -1),
            italic: true
          });
        } else if (sp) {
          tempArr.push({ text: sp });
        }
      });
    });
    parts = tempArr;

    return parts.map((part, i) => {
      let classes = "";
      if (part.bold) classes += " font-black font-semibold text-slate-900 dark:text-white";
      if (part.italic) classes += " italic text-slate-800 dark:text-slate-200";
      if (part.underline) classes += " underline";
      
      if (classes) {
        return (
          <span key={i} className={classes.trim()}>
            {part.text}
          </span>
        );
      }
      return <React.Fragment key={i}>{part.text}</React.Fragment>;
    });
  };

  // Convert raw text lines with bullet and number formatting to structured rich visual layout
  const renderFormattedText = (rawText: string) => {
    if (!rawText) return null;
    const lines = rawText.split('\n');
    return (
      <div className="space-y-1 font-sans">
        {lines.map((line, index) => {
          // Bullet line
          if (line.match(/^[-*]\s+/)) {
            const content = line.replace(/^[-*]\s+/, "");
            return (
              <div key={index} className="flex items-start gap-2 pl-3 py-0.5">
                <span className="text-blue-500 font-bold">•</span>
                <span className="flex-1">{parseFormattingInline(content)}</span>
              </div>
            );
          }
          // Number line
          if (line.match(/^\d+\.\s+/)) {
            const numberMatch = line.match(/^(\d+)\.\s+/);
            const prefix = numberMatch ? numberMatch[1] : "1";
            const content = line.replace(/^\d+\.\s+/, "");
            return (
              <div key={index} className="flex items-start gap-2 pl-3 py-0.5">
                <span className="text-blue-550 font-mono font-bold">{prefix}.</span>
                <span className="flex-1">{parseFormattingInline(content)}</span>
              </div>
            );
          }
          // Default empty line check
          if (!line.trim()) {
            return <div key={index} className="h-2" />;
          }
          // Regular text paragraph
          return (
            <p key={index} className="min-h-[1em] leading-relaxed">
              {parseFormattingInline(line)}
            </p>
          );
        })}
      </div>
    );
  };

  // Export CSV Helper
  function handleExportCSV() {
    const headers = [
      "ID Tugas", "Kode Project", "Nama Project", "Judul", "Modul", 
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
    setInputFileName("");
    setTempSubTasks([]);
    setTaskCategoryType("Project");
    setIsBroadcast(false);
    setReporterName("");
    setReporterDept("");
    setGlpiId("");
    setMantisId("");
    setGitlabId("");
    setExternalTicketStatus("");
    setLinkedCommLogIds([]);
    setLinkedMeetingLogIds([]);
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
    if (t.isDeleted) {
      alert("⚠️ Tugas ini berada di Tong Sampah dan tidak bisa diedit. Silakan pulihkan tugas terlebih dahulu!");
      return;
    }
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
    setInputFileName(t.taskFileName || "");
    setTempSubTasks(t.subtasks || []);
    setTaskCategoryType(t.taskCategoryType || "Project");
    setIsBroadcast(false);
    setReporterName(t.reporterName || "");
    setReporterDept(t.reporterDept || "");
    setGlpiId(t.glpiId || "");
    setMantisId(t.mantisId || "");
    setGitlabId(t.gitlabId || "");
    setExternalTicketStatus(t.externalTicketStatus || "");
    setLinkedCommLogIds(t.linkedCommLogIds || []);
    setLinkedMeetingLogIds(t.linkedMeetingLogIds || []);
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

    // Dismiss the Add/Edit form overlay immediately so the options show up cleanly
    setIsFormOpen(false);
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
      delegationNotes: editingTask ? (editingTask.delegationNotes || "") : "",
      linkedCommLogIds,
      linkedMeetingLogIds,
      taskFileName: inputFileName || undefined
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
    if (t.isDeleted) {
      alert("⚠️ Tugas ini berada di Tong Sampah dan tidak bisa diubah checklist subtasknya!");
      return;
    }
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

  // Live progress value updater from details panel
  async function handleLiveProgressChange(prog: number) {
    if (!selectedTask) return;
    if (selectedTask.isDeleted) {
      alert("⚠️ Tugas ini berada di Tong Sampah dan tidak bisa diubah!");
      return;
    }
    let nextStatus = selectedTask.status;
    if (prog === 100) nextStatus = "Done";
    else if (prog === 0) nextStatus = "Not Started";
    else if (selectedTask.status === "Not Started" || selectedTask.status === "Done") nextStatus = "In Progress";

    const updated = {
      ...selectedTask,
      progress: prog,
      status: nextStatus
    };
    await onUpdateTask(selectedTask.id, { progress: prog, status: nextStatus });
    setSelectedTask(updated);
  }

  // Live status updater from details panel
  async function handleLiveStatusChange(nextStatus: string) {
    if (!selectedTask) return;
    if (selectedTask.isDeleted) {
      alert("⚠️ Tugas ini berada di Tong Sampah dan tidak bisa diubah!");
      return;
    }
    let prog = selectedTask.progress;
    if (nextStatus === "Done") prog = 100;
    else if (nextStatus === "Not Started" || nextStatus === "Open") prog = 0;

    const updated = {
      ...selectedTask,
      progress: prog,
      status: nextStatus
    };
    await onUpdateTask(selectedTask.id, { status: nextStatus, progress: prog });
    setSelectedTask(updated);
  }

  // Draft-based state managers for non-auto-saving status/progress updates
  const onDraftStatusChange = (statusVal: string) => {
    setDraftStatus(statusVal);
    if (statusVal === "Done") {
      setDraftProgress(100);
    } else if (statusVal === "Not Started" || statusVal === "Open") {
      setDraftProgress(0);
    } else if (draftProgress === 100) {
      setDraftProgress(75);
    }
  };

  const onDraftProgressChange = (progVal: number) => {
    setDraftProgress(progVal);
    if (progVal === 100) {
      setDraftStatus("Done");
    } else if (progVal === 0) {
      setDraftStatus("Not Started");
    } else if (draftStatus === "Not Started" || draftStatus === "Done") {
      setDraftStatus("In Progress");
    }
  };

  const handleSaveStatusProgress = async () => {
    if (!selectedTask) return;
    if (selectedTask.isDeleted) {
      alert("⚠️ Tugas ini berada di Tong Sampah dan tidak bisa diperbarui. Silakan pulihkan tugas terlebih dahulu!");
      return;
    }
    try {
      const updated = {
        ...selectedTask,
        status: draftStatus,
        progress: draftProgress
      };
      await onUpdateTask(selectedTask.id, { status: draftStatus, progress: draftProgress });
      setSelectedTask(updated);
      alert("✅ Status & Progress berhasil disimpan secara resmi!");
    } catch (err: any) {
      alert("⚠️ Gagal memperbarui status & progress: " + err.message);
    }
  };

  // Add Comment/Message into Chat room for the task
  async function handleAddComment() {
    if (!selectedTask) return;
    if (selectedTask.isDeleted) {
      alert("⚠️ Tugas ini berada di Tong Sampah dan tidak bisa diinput diskusi/koordinasi!");
      return;
    }
    if (!chatInput.trim()) return;
    
    // Auto populate custom role text for display
    let roleName = currentUser?.role || "Staff";
    if (currentUser?.username === "admin" || currentUser?.role === "Administrator") {
      roleName = "Kantor Pusat / Owner";
    } else if (currentUser?.role === "Manager") {
      roleName = "Kantor Pusat / Manager";
    } else if (currentUser?.role === "Supervisor") {
      roleName = "Supervisor Site";
    }

    const newComment: TaskComment = {
      id: "comment-" + Math.random().toString(36).substring(2, 11),
      sender: currentUser?.name || currentUser?.username || "Pengguna",
      role: roleName,
      text: chatInput.trim(),
      createdAt: new Date().toISOString(),
      attachmentName: commentAttachmentName || undefined,
      attachmentData: commentAttachmentData || undefined
    };

    const nextComments = [...(selectedTask.comments || []), newComment];
    const updated = {
      ...selectedTask,
      comments: nextComments
    };

    await onUpdateTask(selectedTask.id, { comments: nextComments });
    setSelectedTask(updated);
    setChatInput("");
    setCommentAttachmentName("");
    setCommentAttachmentData("");
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
              <div className="text-slate-550 dark:text-slate-405 text-[11px] bg-white/50 dark:bg-slate-950/60 p-2.5 rounded-lg border border-slate-150/40 dark:border-slate-900/60 mt-1.5 leading-relaxed">
                {renderFormattedText(task.delegationNotes)}
              </div>
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
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">JUDUL TUGAS *</label>
                <input
                  type="text"
                  required
                  value={taskName}
                  onChange={(e) => setTaskName(e.target.value)}
                  placeholder="Masukkan judul tugas. Contoh: Implementasi Form Pendaftaran Pasien Baru"
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
                  <SearchableSelect
                    label={taskCategoryType === "Mandiri" ? "PROYEK TERKAIT (OPSIONAL)" : "PROJECT SELECTION"}
                    placeholder="Cari & pilih project..."
                    options={projects.map(p => ({ value: p.kode, label: `${p.kode} – ${p.nama}` }))}
                    value={projectCode}
                    onChange={(val) => setProjectCode(val)}
                    optionalText={taskCategoryType === "Mandiri" ? "-- Tidak Terkait Proyek (Umum / Mandiri Umum) --" : undefined}
                  />

                  <SearchableSelect
                    label={taskCategoryType === "Mandiri" ? "MODUL TERKAIT (OPSIONAL)" : "MODULE / MODUL TERKAIT"}
                    placeholder="Cari & pilih modul..."
                    options={modulsList.map(m => ({ value: m, label: m }))}
                    value={modulName}
                    onChange={(val) => setModulName(val)}
                    optionalText={taskCategoryType === "Mandiri" ? "-- Tidak Terkait Modul --" : undefined}
                  />
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
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">DESKRIPSI TUGAS</label>
                <div className="border border-slate-205 dark:border-slate-800/80 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500/20 transition-all bg-slate-50 dark:bg-slate-950">
                  {/* Visual Formatting Toolbar */}
                  <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-850 border-b border-slate-205 dark:border-slate-800 p-2">
                    <button
                      type="button"
                      onClick={() => handleInsertFormat('task-notes-textarea', notes, setNotes, 'bold')}
                      className="p-1 px-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-750 rounded font-bold transition-all flex items-center justify-center min-w-[24px] cursor-pointer"
                      title="Tebalkan (Bold) - **teks**"
                    >
                      B
                    </button>
                    <button
                      type="button"
                      onClick={() => handleInsertFormat('task-notes-textarea', notes, setNotes, 'italic')}
                      className="p-1 px-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-750 rounded italic transition-all flex items-center justify-center min-w-[24px] cursor-pointer"
                      title="Miringkan (Italic) - *teks*"
                    >
                      I
                    </button>
                    <button
                      type="button"
                      onClick={() => handleInsertFormat('task-notes-textarea', notes, setNotes, 'underline')}
                      className="p-1 px-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-750 rounded underline transition-all flex items-center justify-center min-w-[24px] cursor-pointer"
                      title="Garis Bawah (Underline) - __teks__"
                    >
                      U
                    </button>
                    <div className="w-[1px] h-4 bg-slate-250 dark:bg-slate-800 mx-1" />
                    <button
                      type="button"
                      onClick={() => handleInsertFormat('task-notes-textarea', notes, setNotes, 'bullet')}
                      className="p-1 px-2 text-[11px] text-slate-750 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-755 rounded transition-all flex items-center gap-1 cursor-pointer"
                      title="Daftar Butir (Bullet List) - - item"
                    >
                      • List
                    </button>
                    <button
                      type="button"
                      onClick={() => handleInsertFormat('task-notes-textarea', notes, setNotes, 'number')}
                      className="p-1 px-2 text-[11px] text-slate-750 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-755 rounded transition-all flex items-center gap-1 cursor-pointer"
                      title="Daftar Angka (Numbered List) - 1. item"
                    >
                      1. List
                    </button>
                  </div>
                  <textarea
                    id="task-notes-textarea"
                    rows={5}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Berikan deskripsi detail tugas, rincian fungsional, atau petunjuk teknis di sini... Klik tombol toolbar di atas untuk memasukkan format tebal (bold), miring (italic), atau butir daftar."
                    className="w-full bg-transparent border-0 p-3 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-0 transition-all leading-relaxed text-xs font-sans rounded-b-lg"
                  />
                </div>
              </div>

              {/* Fitur Upload Data File Lampiran */}
              <div className="flex flex-col gap-1.5 bg-slate-50/50 dark:bg-slate-950/20 p-3.5 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">UPLOAD DATA / FILE LAMPIRAN</label>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold rounded-lg cursor-pointer transition-all select-none">
                    <Paperclip className="w-4 h-4 shrink-0" />
                    <span>{inputFileName ? "Ganti File Lampiran" : "Pilih & Upload File"}</span>
                    <input
                      type="file"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        if (file.size > 10 * 1024 * 1024) {
                          alert("⚠️ Ukuran file maksimal 10MB!");
                          return;
                        }
                        const reader = new FileReader();
                        reader.onload = (event) => {
                          if (event.target?.result) {
                            setUrl(event.target.result as string);
                            setInputFileName(file.name);
                          }
                        };
                        reader.readAsDataURL(file);
                      }}
                    />
                  </label>
                  {inputFileName ? (
                    <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-emerald-500/35 px-2.5 py-1 rounded-lg">
                      <span className="text-emerald-600 dark:text-emerald-400 font-extrabold text-[11px]">✓</span>
                      <span className="text-[11px] font-black font-sans text-slate-800 dark:text-slate-100 truncate max-w-[200px]" title={inputFileName}>{inputFileName}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setUrl("");
                          setInputFileName("");
                        }}
                        className="text-red-500 hover:text-red-700 font-extrabold text-sm ml-1 cursor-pointer"
                        title="Hapus Lampiran"
                      >
                        &times;
                      </button>
                    </div>
                  ) : (
                    <span className="text-[11px] font-medium text-slate-400 italic">Belum ada file terlampir</span>
                  )}
                </div>
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
                    className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-255 dark:border-slate-800 py-2.5 pl-9 pr-3 rounded-lg text-slate-800 dark:text-slate-105 font-mono text-[11px] focus:ring-2 focus:ring-blue-500/20"
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
            placeholder="Cari judul..."
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

        {/* Detail Layout Toggle */}
        <div className="flex bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-1 items-center gap-0.5">
          <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400 dark:text-slate-500 px-1 select-none font-mono">Modul Detail:</span>
          <button
            onClick={() => setDetailLayout('drawer')}
            className={`p-1.5 rounded-md transition-all flex items-center gap-1 text-[11px] font-bold ${detailLayout === 'drawer' ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs' : 'text-slate-450 dark:text-slate-500'} cursor-pointer`}
            title="Tampilan Laci Samping (Spacious & Elegant - Direkomendasikan)"
          >
            <Sidebar className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Laci Lebar</span>
          </button>
          <button
            onClick={() => setDetailLayout('split')}
            className={`p-1.5 rounded-md transition-all flex items-center gap-1 text-[11px] font-bold ${detailLayout === 'split' ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs' : 'text-slate-450 dark:text-slate-500'} cursor-pointer`}
            title="Tampilan Pisah Samping (Sempit)"
          >
            <Columns className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Pisah Kolom</span>
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

      {/* Dual Column Workspace layout (strictly no popup models!) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Side: Task List View Section (collapses columns/density when task selected in split column mode) */}
        <div className={`transition-all duration-350 space-y-4 ${(selectedTask && detailLayout === 'split') ? "lg:col-span-7 xl:col-span-8" : "lg:col-span-12"}`}>
         {/* Category Selector Tabs - Rendered permanently & beautifully above the list/cards */}
         <div className="flex flex-wrap items-end space-x-1 border-b border-slate-200 dark:border-slate-800/80 mb-0 select-none px-2 pt-2 bg-slate-50/50 dark:bg-slate-900/30 rounded-t-2xl">
           {["Semua Kategori", "Mandiri", "Request", "Incident", "Tugas Proyek"].map((tab) => {
             const isActive = selectedCategoryTab === tab;
             return (
               <button
                 key={tab}
                 onClick={() => {
                   setSelectedCategoryTab(tab);
                   setExpandedTaskId(null);
                 }}
                 className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 rounded-t-xl cursor-pointer ${
                   isActive
                     ? "bg-white dark:bg-slate-900 border-blue-600 dark:border-blue-400 text-blue-605 dark:text-blue-400 font-extrabold shadow-xs -mb-[1px]"
                     : "border-transparent text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                 }`}
               >
                 {tab}
               </button>
             );
           })}
         </div>

         {filtered.length === 0 ? (
           <div className="text-center py-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-b-2xl">
             <CheckSquare className="w-10 h-10 text-slate-300 mx-auto opacity-44 mb-2 animate-pulse" />
             <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Tidak ada tugas ditemukan</p>
             <p className="text-xs text-slate-400">Pilih kategori lain di atas, atau sesuaikan saringan pencarian Anda di form atas.</p>
           </div>
         ) : viewMode === 'ticket' ? (
          
          /* VIEW MODE: TICKET/CARDS GRID */
          <div className={`grid gap-5 font-sans ${(selectedTask && detailLayout === 'split') ? "grid-cols-1 md:grid-cols-1 xl:grid-cols-2" : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"}`}>
            {filtered.map((t) => {
              const overdue = t.status !== "Done" && t.status !== "Cancelled" && t.dueDate && t.dueDate < todayStr;
              const subTotal = t.subtasks?.length || 0;
              const subDone = t.subtasks?.filter(s => s.done).length || 0;
              const childCount = tasks.filter(x => x.parentTaskId === t.id).length;

              // Left accent strip or clean custom coloring theme
              let categoryCardStyles = "border-t-blue-500 hover:border-t-blue-600";
              if (t.taskCategoryType === "Mandiri") {
                categoryCardStyles = "border-t-amber-500 hover:border-t-amber-650";
              } else if (t.taskCategoryType === "Incident") {
                categoryCardStyles = "border-t-rose-500 hover:border-t-rose-650";
              } else if (t.taskCategoryType === "Request") {
                categoryCardStyles = "border-t-sky-500 hover:border-t-sky-600";
              }

              return (
                <div 
                  key={t.id}
                  onClick={() => setSelectedTask(t)}
                  className={`bg-white dark:bg-slate-900 border-t-[3.5px] border-x border-b border-x-slate-205 border-b-slate-205 dark:border-x-slate-800/80 dark:border-b-slate-800/80 rounded-2xl p-5 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)] hover:shadow-[0_12px_32px_rgba(0,0,0,0.06)] dark:hover:shadow-[0_12px_32px_rgba(0,0,0,0.35)] hover:-translate-y-1 hover:border-blue-500/20 dark:hover:border-blue-500/35 transition-all duration-300 cursor-pointer flex flex-col justify-between space-y-4 group relative ${categoryCardStyles} ${selectedTask?.id === t.id ? "ring-2 ring-blue-500/30 dark:ring-blue-500/40 border-slate-300 dark:border-slate-700" : ""}`}
                >
                  {/* Glassmorphic accent inside container cards */}
                  <div className="absolute top-0 inset-x-0 h-14 bg-gradient-to-b from-slate-50/40 dark:from-slate-950/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none rounded-t-2xl" />

                  <div className="space-y-3 relative z-10 select-none">
                    <div className="flex justify-between items-center text-[10px] font-mono">
                      <span className="text-slate-400 dark:text-slate-500 font-extrabold bg-slate-50 dark:bg-slate-950 px-2 py-0.5 rounded-md border border-slate-100 dark:border-slate-850/30">
                        TKT-{String(tasks.indexOf(t) + 1).padStart(4, "0")}
                      </span>
                      <span className={`${getPriorityStyle(t.priority)} scale-90 origin-right`} />
                    </div>
                    
                    <div className="space-y-1">
                      <h4 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-snug line-clamp-2" title={t.task}>
                        {t.task}
                      </h4>
                      <p className="text-[11px] text-slate-400 dark:text-slate-450 font-bold truncate flex items-center gap-1 mt-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-705 inline-block" />
                        {projects.find(p => p.kode === t.project)?.nama || t.project || "Umum / Non-Proyek"}
                      </p>
                    </div>

                    {/* Integrated tags flow */}
                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                      <span className={`px-2 py-0.5 rounded-md text-[9px] font-black tracking-wide uppercase shrink-0 ${getStatusStyle(t.status)}`}>
                        {t.status}
                      </span>
                      {t.taskCategoryType && (
                        <span className={`px-2 py-0.5 rounded-md text-[9px] font-black tracking-wide select-none uppercase shrink-0 ${
                          t.taskCategoryType === "Mandiri"
                            ? "bg-amber-50 text-amber-700 dark:bg-amber-955/20 dark:text-amber-400 border border-amber-205/10"
                            : t.taskCategoryType === "Incident"
                            ? "bg-rose-50 text-rose-700 dark:bg-rose-955/20 dark:text-rose-450 border border-rose-205/10"
                            : t.taskCategoryType === "Request"
                            ? "bg-sky-50 text-sky-750 dark:bg-sky-955/10 dark:text-sky-450 border border-sky-205/10"
                            : "bg-blue-50 text-blue-800 dark:bg-blue-955/20 dark:text-blue-400 border border-blue-205/10"
                        }`}>
                          🏷️ {t.taskCategoryType}
                        </span>
                      )}

                      {t.categoryProgress && (
                        <span className="bg-slate-50 dark:bg-slate-950 border border-slate-105 dark:border-slate-850/55 text-slate-500 dark:text-slate-400 text-[9px] font-black uppercase px-2 py-0.5 rounded-md">
                          {t.categoryProgress}
                        </span>
                      )}

                      {subTotal > 0 && (
                        <span className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100/30 text-emerald-600 dark:text-emerald-400 text-[9px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-1 select-none">
                          <CheckCircle2 className="w-2.5 h-2.5 shrink-0 text-emerald-555" />
                          <span>Check {subDone}/{subTotal}</span>
                        </span>
                      )}
                      {t.assignerName ? (
                        <span className="bg-purple-50 text-purple-700 dark:bg-purple-950/20 dark:text-purple-400 text-[9px] font-black px-1.5 py-0.5 rounded-md" title={`Ditugaskan oleh ${t.assignerName}`}>
                          👑 {t.assignerName}
                        </span>
                      ) : t.createdBy ? (
                        <span className="bg-indigo-50/70 dark:bg-indigo-950/20 border border-indigo-100/10 text-indigo-600 dark:text-indigo-400 text-[9px] font-extrabold px-1.5 py-0.5 rounded-md">
                          🧑‍💻 {t.createdBy}
                        </span>
                      ) : null}
                      {t.parentTaskId && (
                        <span 
                          className="bg-amber-50/80 border border-amber-200/10 text-amber-700 dark:bg-amber-950/15 dark:text-amber-400 text-[9px] font-black px-1.5 py-0.5 rounded-md flex items-center gap-1 select-none"
                          title={t.assignerName ? `Didelegasikan oleh ${t.assignerName} (${t.assignerRole})` : "Tugas Delegasi"}
                        >
                          <Share2 className="w-2.5 h-2.5 shrink-0 text-amber-600" />
                          <span>Delegasi Atasan</span>
                        </span>
                      )}
                      {childCount > 0 && (
                        <span className="bg-indigo-50 border border-indigo-200/10 text-indigo-700 dark:bg-indigo-950/25 dark:text-indigo-400 text-[9px] font-black px-1.5 py-0.5 rounded-md flex items-center gap-1 select-none">
                          <Layers className="w-2.5 h-2.5 shrink-0 text-indigo-600" />
                          <span>Delegasi Turunan ({childCount})</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Footer stats metadata */}
                  <div className="border-t border-slate-100 dark:border-slate-800/80 pt-3.5 space-y-3 relative z-10 select-none">
                    <div className="flex justify-between items-center text-xs">
                      <div className="flex items-center gap-2 shrink-0 max-w-[55%]">
                        <span className={`w-6 h-6 rounded-full text-[9px] font-black flex items-center justify-center border border-white dark:border-slate-800 shadow-xs ring-2 ring-slate-100/30 ${picThemeColors(t.pic || "")}`}>
                          {t.pic ? t.pic.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() : "?"}
                        </span>
                        <span className="text-slate-700 dark:text-slate-350 font-bold truncate text-[11px] hover:text-blue-500 transition-colors">
                          {t.pic || "Belum Ditugaskan"}
                        </span>
                      </div>
                      <div className="text-right">
                        <p className="text-[8px] text-slate-400 font-extrabold uppercase tracking-widest leading-none">Jatuh Tempo</p>
                        <p className={`font-mono text-[11px] font-black mt-0.5 ${overdue ? "text-rose-500 font-black animate-pulse" : "text-slate-600 dark:text-slate-400"}`}>
                          {t.dueDate ? new Date(t.dueDate).toLocaleDateString("id-ID") : "—"}
                        </p>
                      </div>
                    </div>

                    {/* Progress with adaptive coloring schemas */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[8px] text-slate-400 uppercase tracking-widest font-black leading-none">
                        <span>Penyelesaian</span>
                        <span className="font-mono text-[10px] font-bold text-slate-700 dark:text-slate-350">{t.progress}%</span>
                      </div>
                      <div className="h-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-full overflow-hidden p-[1px]">
                        <div 
                          className={`h-full rounded-full transition-all duration-300 ${
                            t.status === "Done"
                              ? "bg-gradient-to-r from-emerald-500 to-teal-400"
                              : t.status === "In Progress"
                              ? "bg-gradient-to-r from-blue-500 to-indigo-400"
                              : t.status === "Pending"
                              ? "bg-gradient-to-r from-purple-500 to-pink-400"
                              : "bg-slate-300 dark:bg-slate-700"
                          }`} 
                          style={{ width: `${t.progress}%` }} 
                        />
                      </div>
                    </div>

                    {t.isDeleted && (
                      <div className="flex gap-2 pt-2 border-t border-red-200/10 dark:border-red-950/10">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            executeRestoreTask(t);
                          }}
                          className="flex-1 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-black text-[9px] rounded-lg cursor-pointer text-center uppercase tracking-wider border border-emerald-500/10 transition-all select-none"
                        >
                          🌟 Pulihkan Tugas
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            initiateDeleteTask(t);
                          }}
                          className="px-2.5 py-1.5 bg-red-500/10 hover:bg-red-500/15 text-red-650 dark:text-red-405 font-black text-[9px] rounded-lg cursor-pointer text-center uppercase tracking-wider border border-red-500/10 transition-all select-none"
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
          /* IMPECCABLE STYLE: RECONFIGURED HIGHER FLUID EXPANDABLE TABLE */
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-b-2xl overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-850 dark:text-slate-200 border-collapse select-none">
                  <thead className="bg-slate-50/40 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800/80 text-[10px] text-slate-400 dark:text-slate-550 font-bold tracking-widest uppercase">
                    <tr>
                      <th className="p-4 pl-5">Jatuh Tempo (Date)</th>
                      <th className="p-4">Project / RS</th>
                      <th className="p-4">PIC / Penerima</th>
                      <th className="p-4">Uraian / Judul Tugas</th>
                      <th className="p-4 text-center">Kategori</th>
                      <th className="p-4">Prioritas</th>
                      <th className="p-4">Status Pekerjaan</th>
                      <th className="p-4">Progress</th>
                      <th className="p-4 pr-5 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40 leading-normal">
                    {filtered.map((t) => {
                      const overdue = t.status !== "Done" && t.status !== "Cancelled" && t.dueDate && t.dueDate < todayStr;
                      const isExpanded = expandedTaskId === t.id;
                      const hasSubtasks = t.subtasks && t.subtasks.length > 0;
                      const countSubDone = t.subtasks?.filter(x => x.done)?.length || 0;
                      const countSubTotal = t.subtasks?.length || 0;

                      // Dynamic styling inspired by table status
                      let statusBadgeStyles = "bg-slate-50 text-slate-600 dark:bg-slate-950/40 dark:text-slate-400";
                      if (t.status === "Done") {
                        statusBadgeStyles = "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-500/10";
                      } else if (t.status === "In Progress") {
                        statusBadgeStyles = "bg-blue-50 text-blue-700 dark:bg-blue-955/10 dark:text-blue-400 border border-blue-500/10";
                      } else if (t.status === "Pending") {
                        statusBadgeStyles = "bg-purple-50 text-purple-700 dark:bg-purple-955/10 dark:text-purple-400 border border-purple-500/10";
                      } else if (t.status === "Cancelled") {
                        statusBadgeStyles = "bg-rose-50 text-rose-700 dark:bg-rose-955/15 dark:text-rose-400 border border-rose-500/10";
                      }

                      return (
                        <React.Fragment key={t.id}>
                          {/* PRIMARY TABLE ROW */}
                          <tr 
                            onClick={() => setExpandedTaskId(isExpanded ? null : t.id)}
                            className={`hover:bg-slate-50/80 dark:hover:bg-slate-950/40 transition-all cursor-pointer ${
                              isExpanded 
                                ? "bg-slate-50/80 dark:bg-slate-950/30 border-l-[3.5px] border-l-blue-600 dark:border-l-blue-400" 
                                : "border-l-4 border-l-transparent"
                            }`}
                          >
                            {/* DATE COLUMN */}
                            <td className="p-4 pl-5 font-mono text-slate-500 dark:text-slate-400">
                              <div className="flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5 opacity-40 shrink-0" />
                                <span className={overdue ? "text-rose-500 font-extrabold" : "font-semibold"}>
                                  {t.dueDate ? new Date(t.dueDate).toLocaleDateString("id-ID", { day: 'numeric', month: 'short' }) : "—"}
                                </span>
                              </div>
                            </td>

                            {/* PROJECT COLUMN */}
                            <td className="p-4 whitespace-nowrap">
                              <span className="bg-blue-50/65 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border border-blue-100/50 dark:border-blue-900/10 px-2 py-0.5 rounded-md text-[10.5px] font-mono font-extrabold">
                                {t.project || "Umum"}
                              </span>
                            </td>

                            {/* PIC COLUMN */}
                            <td className="p-4 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <span className={`w-5 h-5 rounded-full text-[8px] font-extrabold flex items-center justify-center shrink-0 border border-white dark:border-slate-800 shadow-xs ${picThemeColors(t.pic || "")}`}>
                                  {t.pic ? t.pic.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() : "?"}
                                </span>
                                <span className="font-extrabold text-slate-700 dark:text-slate-300 text-[11px] truncate max-w-[80px]">
                                  {t.pic || "—"}
                                </span>
                              </div>
                            </td>

                            {/* TASK TITLE */}
                            <td className="p-4 max-w-xs">
                              <p className="font-extrabold text-slate-905 dark:text-slate-100 truncate text-[12px] hover:text-blue-605 dark:hover:text-blue-450 transition-colors" title={t.task}>
                                {t.task}
                              </p>
                            </td>

                            {/* CATEGORY (TAG PILLS) */}
                            <td className="p-4 text-center">
                              {t.taskCategoryType ? (
                                <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wide inline-block ${
                                  t.taskCategoryType === "Mandiri"
                                    ? "bg-amber-50 text-amber-700 dark:bg-amber-955/20 dark:text-amber-400"
                                    : t.taskCategoryType === "Incident"
                                    ? "bg-rose-50 text-rose-700 dark:bg-rose-955/20 dark:text-rose-450"
                                    : t.taskCategoryType === "Request"
                                    ? "bg-sky-50 text-sky-700 dark:bg-sky-955/10 dark:text-sky-400"
                                    : "bg-blue-50 text-blue-850 dark:bg-blue-955/10"
                                }`}>
                                  {t.taskCategoryType}
                                </span>
                              ) : <span className="text-slate-350">—</span>}
                            </td>

                            {/* PRIORITY CARD */}
                            <td className="p-4 whitespace-nowrap">
                              <span className={`${getPriorityStyle(t.priority)} scale-90 inline-block`} />
                            </td>

                            {/* STATUS COL */}
                            <td className="p-4">
                              <span className={`px-2.5 py-0.5 rounded-md text-[9px] font-black tracking-wide uppercase inline-block ${statusBadgeStyles}`}>
                                {t.status}
                              </span>
                            </td>

                            {/* PROGRESS BAR */}
                            <td className="p-4 font-mono font-bold text-slate-700 dark:text-slate-300 text-[11px]">
                              <div className="flex items-center gap-1.5">
                                <span className="w-7 text-right shrink-0">{t.progress}%</span>
                                <div className="w-12 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-[0.5px] hidden sm:block">
                                  <div 
                                    className="h-full bg-blue-600 dark:bg-blue-400 rounded-full" 
                                    style={{ width: `${t.progress}%` }} 
                                  />
                                </div>
                              </div>
                            </td>

                            {/* ACTIONS TRIGGERS */}
                            <td className="p-4 pr-5 text-right" onClick={(e) => e.stopPropagation()}>
                              <div className="flex justify-end items-center gap-1">
                                <button 
                                  onClick={() => setSelectedTask(t)}
                                  className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-blue-500 rounded-md transition-colors cursor-pointer"
                                  title="Tampilkan Detail Laci"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>

                                {t.isDeleted && (
                                  <>
                                    <button
                                      onClick={() => executeRestoreTask(t)}
                                      className="p-1.5 hover:bg-emerald-50 text-emerald-600 dark:hover:bg-emerald-950/40 dark:text-emerald-400 rounded-md transition-colors cursor-pointer"
                                      title="🌟 Pulihkan Tugas"
                                    >
                                      <RefreshCw className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => initiateDeleteTask(t)}
                                      className="p-1.5 hover:bg-red-50 text-red-650 dark:hover:bg-red-950/40 dark:text-red-400 rounded-md transition-colors cursor-pointer"
                                      title="🔥 Hapus Permanen"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>

                          {/* EXPANDABLE MULTI-MODULE PANEL */}
                          {isExpanded && (
                            <tr className="bg-slate-50/40 dark:bg-slate-950/20">
                              <td colSpan={9} className="p-0 border-t-0 pl-1">
                                <div className="p-6 bg-slate-50/70 dark:bg-slate-955 border-x border-b border-slate-205 dark:border-slate-805/40 text-left space-y-6 animate-in slide-in-from-top-2 duration-200">
                                  
                                  {/* GRID DETAILS PANEL */}
                                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                                    
                                    {/* Column 1: Services Required & Task attributes */}
                                    <div className="lg:col-span-5 space-y-4">
                                      <div>
                                        <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest mb-1.5">Uraian / Judul Tugas</p>
                                        <h5 className="text-sm font-extrabold text-slate-900 dark:text-white leading-relaxed">
                                          {t.task}
                                        </h5>
                                      </div>

                                      <div className="grid grid-cols-2 gap-4 pt-1.5">
                                        <div>
                                          <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest mb-1">Pemberi Tugas</p>
                                          <p className="text-xs font-bold text-slate-750 dark:text-slate-350">
                                            👑 {t.assignerName || t.createdBy || "System"}
                                          </p>
                                          {t.assignerRole && (
                                            <span className="text-[9px] font-semibold text-slate-400 tracking-wider uppercase mt-1 block">
                                              ({t.assignerRole})
                                            </span>
                                          )}
                                        </div>
                                        <div>
                                          <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest mb-1">Target Penyelesaian</p>
                                          <p className={`text-xs font-mono font-bold ${overdue ? "text-rose-500" : "text-slate-700 dark:text-slate-300"}`}>
                                            ⏰ {t.dueDate ? new Date(t.dueDate).toLocaleDateString("id-ID", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : "Tanpa Target"}
                                          </p>
                                        </div>
                                      </div>

                                      <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800/60">
                                        <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest mb-1">Kategori Progress & Modul</p>
                                        <div className="flex flex-wrap gap-1.5">
                                          {t.modul && (
                                            <span className="bg-slate-100 dark:bg-slate-850 text-slate-700 dark:text-slate-300 text-[11px] font-bold px-2 py-0.5 rounded-md">
                                              🖥️ Modul {t.modul}
                                            </span>
                                          )}
                                          {t.categoryProgress && (
                                            <span className="bg-slate-100 dark:bg-slate-850 text-slate-600 dark:text-slate-300 text-[11px] font-bold px-2 py-0.5 rounded-md">
                                              📈 Kategori: {t.categoryProgress}
                                            </span>
                                          )}
                                        </div>
                                      </div>

                                      {hasSubtasks && (
                                        <div className="pt-2 border-t border-slate-100 dark:border-slate-800/60">
                                          <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest mb-1.5">Checklist / Sub-Tugas ({countSubDone}/{countSubTotal})</p>
                                          <div className="max-h-28 overflow-y-auto space-y-1.5 pr-1 text-[11.5px]">
                                            {t.subtasks?.map((sb: SubTask) => (
                                              <div key={sb.id} className="flex items-center gap-2 text-slate-705 dark:text-slate-305">
                                                <input 
                                                  type="checkbox" 
                                                  checked={sb.done} 
                                                  readOnly 
                                                  className="rounded text-blue-500 w-3.5 h-3.5 border-slate-300 dark:border-slate-750 focus:ring-0 cursor-default pointer-events-none"
                                                />
                                                <span className={sb.done ? "line-through text-slate-400" : "font-semibold"}>
                                                  {sb.title}
                                                </span>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                    </div>

                                    {/* Column 2: Interactive Notes System */}
                                    <div className="lg:col-span-4 space-y-3">
                                      <div className="flex justify-between items-center">
                                        <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest flex items-center gap-1">
                                          <span>✍️ Catatan & Aktivitas Terbaru</span>
                                          {(t.notes || noteDrafts[t.id]) && (
                                            <span className="text-[8.5px] text-blue-500 font-black tracking-wider uppercase ml-1.5">Catatan Tersedia</span>
                                          )}
                                        </p>
                                      </div>
                                      <textarea
                                        value={noteDrafts[t.id] !== undefined ? noteDrafts[t.id] : (t.notes || "")}
                                        onChange={(e) => {
                                          setNoteDrafts({
                                            ...noteDrafts,
                                            [t.id]: e.target.value
                                          });
                                        }}
                                        placeholder="Tulis rincian aktivitas, kendala teknis lapangan, atau info terbaru terkait progress tugas ini di sini..."
                                        className="w-full h-32 p-3 text-xs bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500/30 text-slate-800 dark:text-slate-200 shadow-inner resize-none font-sans leading-relaxed"
                                      />
                                      <div className="flex justify-end">
                                        <button
                                          onClick={async () => {
                                            const val = noteDrafts[t.id] !== undefined ? noteDrafts[t.id] : (t.notes || "");
                                            setSavingNoteId(t.id);
                                            await onUpdateTask(t.id, { notes: val });
                                            setSavingNoteId(null);
                                          }}
                                          disabled={savingNoteId === t.id}
                                          className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-650 disabled:bg-blue-400 text-white font-extrabold text-[10.5px] rounded-lg tracking-wide uppercase transition-colors shrink-0 flex items-center gap-1.5 shadow-sm cursor-pointer"
                                        >
                                          {savingNoteId === t.id ? (
                                            <>
                                              <RefreshCw className="w-3 h-3 animate-spin" />
                                              <span>Menyimpan...</span>
                                            </>
                                          ) : (
                                            <>
                                              <Check className="w-3.5 h-3.5" />
                                              <span>Simpan Catatan</span>
                                            </>
                                          )}
                                        </button>
                                      </div>
                                    </div>

                                    {/* Column 3: Radial custom progress circle */}
                                    <div className="lg:col-span-3 flex flex-col items-center justify-center p-3">
                                      <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-3 text-center">Rasio Penyelesaian</p>
                                      
                                      <div className="relative flex flex-col items-center justify-center shrink-0 w-32 h-32 select-none mx-auto group">
                                        {/* Outer glowing border */}
                                        <div className="absolute inset-0 rounded-full border border-slate-100 dark:border-slate-800/40 pointer-events-none scale-105" />

                                        {/* SVG Radial Meter */}
                                        <svg className="w-full h-full transform -rotate-90">
                                          {/* Background path */}
                                          <circle
                                            cx="64"
                                            cy="64"
                                            r="45"
                                            className="stroke-slate-100/80 dark:stroke-slate-805/40"
                                            strokeWidth="7"
                                            fill="transparent"
                                          />
                                          {/* Colorful filling path */}
                                          <circle
                                            cx="64"
                                            cy="64"
                                            r="45"
                                            className="stroke-blue-600 dark:stroke-blue-400 transition-all duration-500"
                                            strokeWidth="7"
                                            fill="transparent"
                                            strokeDasharray={2 * Math.PI * 45}
                                            strokeDashoffset={2 * Math.PI * 45 * (1 - t.progress / 100)}
                                            strokeLinecap="round"
                                          />
                                        </svg>
                                        
                                        {/* Center Percentage Display */}
                                        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                                          <span className="text-2xl font-black text-slate-850 dark:text-slate-100 tracking-tighter leading-none">{t.progress}%</span>
                                          <span className="text-[7.5px] text-slate-400 font-extrabold uppercase tracking-widest mt-1">Progress</span>
                                        </div>
                                      </div>
                                    </div>

                                  </div>

                                  {/* BOTTOM ACTION BUTTONS BAR */}
                                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800/65 flex flex-wrap gap-2.5 justify-between items-center">
                                    <div className="flex flex-wrap gap-2">
                                      <button
                                        onClick={() => setSelectedTask(t)}
                                        className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-650 hover:from-blue-650 hover:to-indigo-700 text-white font-black text-[10.5px] rounded-xl uppercase tracking-wider shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 cursor-pointer inline-flex items-center gap-1.5"
                                      >
                                        <span>Tampilkan Detail Lengkap ↗</span>
                                      </button>

                                      <button
                                        onClick={() => {
                                          setEditingTask(t);
                                          setIsFormOpen(true);
                                        }}
                                        className="px-3.5 py-2 bg-white dark:bg-slate-905 border border-slate-250 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-300 font-black text-[10.5px] rounded-xl uppercase tracking-wider transition-all cursor-pointer inline-flex items-center gap-1.5"
                                      >
                                        <UserCheck className="w-3.5 h-3.5 text-slate-500" />
                                        <span>Re-Orientasi & Edit PIC</span>
                                      </button>
                                    </div>

                                    <div>
                                      <button
                                        onClick={() => {
                                          if (confirm(`Yakin ingin menyembunyikan/arsip tugas "${t.task}"?`)) {
                                            initiateDeleteTask(t);
                                          }
                                        }}
                                        className="px-3.5 py-2 bg-red-50 hover:bg-red-105/30 border border-red-200/40 text-red-650 dark:bg-red-955/10 dark:text-red-400 dark:border-red-900/10 font-bold text-[10.5px] rounded-xl uppercase tracking-wider transition-all cursor-pointer inline-flex items-center gap-1"
                                      >
                                        <Trash2 className="w-3.5 h-3.5 text-red-555" />
                                        <span>Arsipkan Tugas</span>
                                      </button>
                                    </div>
                                  </div>

                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
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

      {/* Right Side: Task Details inline workspace panel */}
      <AnimatePresence mode="wait">
        {selectedTask && detailLayout === 'split' && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="lg:col-span-5 xl:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-5 sticky top-6 max-h-[calc(100vh-120px)] overflow-y-auto"
          >
            {/* Header / Navigation bar */}
            <div className="flex justify-between items-start gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <span className="text-[10px] bg-slate-100 dark:bg-slate-805 text-slate-550 dark:text-slate-400 font-bold px-2.5 py-0.5 rounded font-mono select-none">
                  #TKT-{String(tasks.indexOf(selectedTask) + 1).padStart(4, "0")}
                </span>
                <h3 className="font-black text-sm text-slate-900 dark:text-white leading-tight mt-1">
                  {selectedTask.task}
                </h3>
                <p className="text-xs text-blue-600 dark:text-blue-400 font-bold mt-1">
                  {projects.find(p => p.kode === selectedTask.project)?.nama || selectedTask.project}
                </p>
              </div>
              <button
                onClick={() => setSelectedTask(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-250 p-1 bg-slate-50 dark:bg-slate-850 rounded-lg hover:rotate-90 transition-all cursor-pointer"
                title="Tutup Panel Detail"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Tab navigation buttons */}
            <div className="flex border-b border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setActiveDetailTab("detail")}
                className={`flex-1 pb-2.5 text-center text-xs font-bold border-b-2 transition-all cursor-pointer ${
                  activeDetailTab === "detail"
                    ? "border-blue-600 text-blue-600 dark:text-blue-400 font-extrabold"
                    : "border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                }`}
              >
                📋 Rincian Tugas
              </button>
              <button
                type="button"
                onClick={() => setActiveDetailTab("chat")}
                className={`flex-1 pb-2.5 text-center text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeDetailTab === "chat"
                    ? "border-blue-600 text-blue-600 dark:text-blue-400 font-extrabold"
                    : "border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                }`}
              >
                💬 Diskusi Tim ({selectedTask.comments?.length || 0})
                {selectedTask.comments && selectedTask.comments.length > 0 && (
                  <span className="w-2 h-2 rounded-full bg-emerald-500 ring-4 ring-emerald-500/10 animate-pulse" />
                )}
              </button>
            </div>

            {activeDetailTab === "detail" ? (
              <div className="space-y-4">
                {/* 1. Status & Progress Live Updates */}
                <div className="space-y-2.5 bg-slate-50/50 dark:bg-slate-950/20 p-3 rounded-2xl border border-slate-100 dark:border-slate-850/50">
                  <div className="space-y-1">
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Status Pekerjaan</span>
                    <select
                      value={draftStatus}
                      onChange={(e) => onDraftStatusChange(e.target.value)}
                      disabled={!!selectedTask.isDeleted}
                      className={`w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 ${selectedTask.isDeleted ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
                    >
                      {progressStatusesList.map(st => (
                        <option key={st} value={st}>{st}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Target Penyelesaian</span>
                    <div className="flex items-center gap-3 bg-white dark:bg-slate-900 p-2.5 border border-slate-200/60 dark:border-slate-800 rounded-xl">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="5"
                        value={draftProgress}
                        onChange={(e) => onDraftProgressChange(parseInt(e.target.value, 10))}
                        disabled={!!selectedTask.isDeleted}
                        className={`flex-grow h-1 bg-slate-200 dark:bg-slate-800 rounded-full ${selectedTask.isDeleted ? "opacity-40 cursor-not-allowed" : "accent-blue-600 cursor-pointer"}`}
                      />
                      <span className="font-mono text-xs font-black min-w-[32px] text-right text-slate-850 dark:text-slate-200">
                        {draftProgress}%
                      </span>
                    </div>
                  </div>

                  {/* Explicit Simpan Button or Trash recovery option */}
                  <div className="pt-1.5 border-t border-slate-200/50 dark:border-slate-800/60 mt-2">
                    {selectedTask.isDeleted ? (
                      <div className="space-y-2">
                        <div className="p-2.5 bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-405 text-[10.5px] font-bold rounded-xl border border-amber-200/30 dark:border-amber-900/30 leading-normal text-center">
                          ⚠️ Tugas ada di Tong Sampah. Pulihkan terlebih dahulu untuk mengubah status & progress.
                        </div>
                        <button
                          type="button"
                          onClick={() => executeRestoreTask(selectedTask)}
                          className="w-full py-2 px-3 text-[10.5px] font-black text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          <RefreshCw className="w-3.5 h-3.5 shrink-0" />
                          <span>Pulihkan Sekarang</span>
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={handleSaveStatusProgress}
                        className={`w-full py-2 px-3 text-[10.5px] font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                          draftStatus !== selectedTask.status || draftProgress !== selectedTask.progress
                            ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs font-extrabold focus:ring-2 focus:ring-emerald-500/20"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed"
                        }`}
                        disabled={draftStatus === selectedTask.status && draftProgress === selectedTask.progress}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        <span>{draftStatus !== selectedTask.status || draftProgress !== selectedTask.progress ? "Simpan Perubahan" : "Status Sudah Sinkron"}</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* 2. Key Metadata list */}
                <div className="grid grid-cols-2 gap-3.5 text-[11px] font-sans pb-1">
                  <div className="bg-slate-50/50 dark:bg-slate-950/20 p-2.5 rounded-xl border border-slate-100 dark:border-slate-850/40">
                    <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest leading-none mb-1">Prioritas No.</p>
                    <span className={getPriorityStyle(selectedTask.priority)}>
                      {selectedTask.priority}
                    </span>
                  </div>
                  <div className="bg-slate-50/50 dark:bg-slate-950/20 p-2.5 rounded-xl border border-slate-100 dark:border-slate-850/40">
                    <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest leading-none mb-1">PIC Pelaksana</p>
                    <div className="flex items-center gap-1.5 select-none">
                      <span className={`w-4.5 h-4.5 rounded-full text-[8.5px] font-black flex items-center justify-center shrink-0 ${picThemeColors(selectedTask.pic || "")}`}>
                        {selectedTask.pic ? selectedTask.pic.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() : "?"}
                      </span>
                      <span className="font-bold text-slate-700 dark:text-slate-300 truncate">{selectedTask.pic || "Belum ada"}</span>
                    </div>
                  </div>
                  <div className="bg-slate-50/50 dark:bg-slate-950/20 p-2.5 rounded-xl border border-slate-100 dark:border-slate-850/40">
                    <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest leading-none mb-1">Tanggal Mulai</p>
                    <p className="font-bold text-slate-800 dark:text-slate-200 font-mono">
                      {selectedTask.startDate ? new Date(selectedTask.startDate).toLocaleDateString("id-ID") : "—"}
                    </p>
                  </div>
                  <div className="bg-slate-50/50 dark:bg-slate-950/20 p-2.5 rounded-xl border border-slate-100 dark:border-slate-850/40">
                    <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest leading-none mb-1">Jatuh Tempo</p>
                    <p className="font-bold text-slate-800 dark:text-slate-200 font-mono">
                      {selectedTask.dueDate ? new Date(selectedTask.dueDate).toLocaleDateString("id-ID") : "—"}
                    </p>
                  </div>
                  <div className="bg-slate-50/50 dark:bg-slate-950/20 p-2.5 rounded-xl border border-slate-100 dark:border-slate-850/40">
                    <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest leading-none mb-1">Tipe / Kategori</p>
                    <p className="font-bold text-slate-850 dark:text-slate-200 truncate">{selectedTask.taskType || "—"}</p>
                  </div>
                  <div className="bg-slate-50/50 dark:bg-slate-950/20 p-2.5 rounded-xl border border-slate-100 dark:border-slate-850/40">
                    <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest leading-none mb-1">Modul Terkait</p>
                    <p className="font-bold text-slate-850 dark:text-slate-200 truncate">{selectedTask.modul || "—"}</p>
                  </div>
                </div>

                {/* 3. Deskripsi / Notes */}
                {selectedTask.notes && (
                  <div className="bg-slate-50/40 dark:bg-slate-950/30 border border-slate-150/15 dark:border-slate-850 p-3 rounded-xl text-xs">
                    <p className="font-bold text-slate-400 uppercase text-[9px] tracking-wider mb-1.5">Deskripsi Tugas</p>
                    <div className="text-slate-700 dark:text-slate-350 leading-relaxed font-sans max-h-40 overflow-y-auto pr-1">
                      {renderFormattedText(selectedTask.notes)}
                    </div>
                  </div>
                )}

                {/* Info Pelapor */}
                {selectedTask.taskCategoryType && selectedTask.taskCategoryType !== "Project" && selectedTask.taskCategoryType !== "Mandiri" && (
                  <div className="bg-amber-500/5 dark:bg-amber-955/20 border border-amber-500/10 p-3 rounded-xl text-xs space-y-1">
                    <p className="font-bold text-amber-700 dark:text-amber-450 uppercase text-[9px] tracking-wider leading-none mb-1">Info Pelapor ({selectedTask.taskCategoryType})</p>
                    <p className="text-slate-700 dark:text-slate-300">
                      <span className="text-slate-400 font-bold">Nama:</span> {selectedTask.reporterName || "—"}
                    </p>
                    <p className="text-slate-700 dark:text-slate-300">
                      <span className="text-slate-400 font-bold">Unit/Dept:</span> {selectedTask.reporterDept || "—"}
                    </p>
                  </div>
                )}

                {/* Attachments link */}
                {selectedTask.url && (
                  <div className="bg-slate-50/40 dark:bg-slate-950/30 border border-slate-150/15 dark:border-slate-850 p-2.5 rounded-xl text-xs flex items-center justify-between">
                    <span className="text-slate-405 font-bold uppercase text-[9px] tracking-wider">Lampiran Tautan</span>
                    <a 
                      href={selectedTask.url} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="text-xs text-blue-600 dark:text-blue-400 font-bold hover:underline"
                    >
                      Buka Tautan Lampiran ↗
                    </a>
                  </div>
                )}

                {/* 4. Subtasks Lists Checkbox inline */}
                <div className="border-t border-slate-100 dark:border-slate-800 pt-3.5 space-y-2">
                  <div className="flex justify-between items-center text-xs font-bold text-slate-455 font-mono">
                    <span className="uppercase text-[9px] tracking-wider">Subtask Checklist ({selectedTask.subtasks?.filter(s => s.done).length || 0}/{selectedTask.subtasks?.length || 0})</span>
                  </div>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                    {!selectedTask.subtasks || selectedTask.subtasks.length === 0 ? (
                      <p className="text-[10px] text-slate-400 italic font-medium p-2 text-center bg-slate-50/50 dark:bg-slate-950/10 border border-dashed border-slate-200 dark:border-slate-800/60 rounded-xl">Belum ada checklist teknis pekerjaan.</p>
                    ) : (
                      selectedTask.subtasks.map((sub) => (
                        <div 
                          key={sub.id} 
                          className="flex items-center gap-2 p-2 rounded-lg bg-slate-50/60 dark:bg-slate-950/40 border border-slate-150/10 dark:border-slate-800/40"
                        >
                          <input
                            type="checkbox"
                            checked={sub.done}
                            onChange={() => handleLiveSubToggle(selectedTask, sub.id)}
                            className="w-3.5 h-3.5 rounded text-blue-600 focus:outline-none cursor-pointer"
                          />
                          <span className={`text-xs ${sub.done ? "line-through text-slate-400" : "text-slate-700 dark:text-slate-300 font-medium"}`}>
                            {sub.title}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* 5. External ticket indicators */}
                {(selectedTask.glpiId || selectedTask.mantisId || selectedTask.gitlabId) && (
                  <div className="bg-slate-50/40 dark:bg-slate-950/30 border border-slate-150/15 dark:border-slate-850 p-3 rounded-xl text-xs space-y-1.5 font-sans">
                    <span className="font-bold text-slate-400 uppercase text-[9px] tracking-wider block">Tiket Eksternal Terhubung</span>
                    <div className="flex flex-wrap gap-x-3 gap-y-1">
                      {selectedTask.glpiId && <p><span className="text-slate-400 font-bold">GLPI:</span> <span className="font-mono bg-slate-100 dark:bg-slate-900 px-1 rounded">{selectedTask.glpiId}</span></p>}
                      {selectedTask.mantisId && <p><span className="text-slate-400 font-bold">Mantis:</span> <span className="font-mono bg-slate-100 dark:bg-slate-900 px-1 rounded">{selectedTask.mantisId}</span></p>}
                      {selectedTask.gitlabId && <p><span className="text-slate-400 font-bold">GitLab:</span> <span className="font-mono bg-slate-100 dark:bg-slate-900 px-1 rounded">{selectedTask.gitlabId}</span></p>}
                    </div>
                  </div>
                )}

                {/* 6. Context Hubungan Tugas / Hierarchy */}
                {(selectedTask.parentTaskId || tasks.some(t => t.parentTaskId === selectedTask.id)) && (
                  <div className="border-t border-slate-100 dark:border-slate-800 pt-3.5 space-y-2">
                    <span className="font-bold text-slate-400 uppercase text-[9px] tracking-wider block font-mono">Hubungan Tugas Berjenjang</span>
                    <div className="space-y-1.5">
                      {selectedTask.parentTaskId && (() => {
                        const pt = tasks.find(x => x.id === selectedTask.parentTaskId);
                        return pt ? (
                          <div className="p-2 border border-slate-150 dark:border-slate-800 rounded-lg bg-slate-50/40 text-left">
                            <span className="text-[8px] font-bold text-slate-400 block uppercase">Tugas Atasan Induk</span>
                            <button
                              type="button"
                              onClick={() => setSelectedTask(pt)}
                              className="text-xs text-blue-600 hover:underline font-bold text-left block"
                            >
                              &larr; {pt.task}
                            </button>
                          </div>
                        ) : null;
                      })()}
                      {(() => {
                        const kids = tasks.filter(x => x.parentTaskId === selectedTask.id);
                        if (kids.length > 0) {
                          return (
                            <div className="p-2.5 border border-indigo-150/40 dark:border-indigo-950/40 bg-indigo-55/5 dark:bg-indigo-955/5 rounded-lg">
                              <span className="text-[8px] font-bold text-indigo-500 block uppercase mb-1">Tugas Delegasi Turunan ({kids.length})</span>
                              <div className="space-y-1 max-h-24 overflow-y-auto pr-1">
                                {kids.map(k => (
                                  <button
                                    key={k.id}
                                    type="button"
                                    onClick={() => setSelectedTask(k)}
                                    className="text-[11px] font-semibold text-slate-700 dark:text-slate-350 hover:text-indigo-650 block text-left truncate w-full hover:underline"
                                  >
                                    &bull; {k.task} ({k.progress}%)
                                  </button>
                                ))}
                              </div>
                            </div>
                          );
                        }
                      })()}
                    </div>
                  </div>
                )}

                {/* 7. Collaboration Connections */}
                <div className="border-t border-slate-100 dark:border-slate-800 pt-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono uppercase text-[9px] tracking-wider text-slate-455">Koneksi Arsip Kolaborasi</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                    <button
                      type="button"
                      onClick={() => {
                        setCollabModalTaskId(selectedTask.id);
                        setCollabModalType('comm');
                        setTempCheckedCollabIds(selectedTask.linkedCommLogIds || []);
                        setCollabSearch("");
                      }}
                      className="p-2 rounded-lg bg-teal-50/40 border border-teal-200/50 hover:bg-teal-50 dark:bg-teal-955/10 dark:border-teal-900/40 text-teal-700 dark:text-teal-400 font-bold transition-all text-left truncate cursor-pointer"
                    >
                      💬 WA & Log ({selectedTask.linkedCommLogIds?.length || 0})
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setCollabModalTaskId(selectedTask.id);
                        setCollabModalType('meeting');
                        setTempCheckedCollabIds(selectedTask.linkedMeetingLogIds || []);
                        setCollabSearch("");
                      }}
                      className="p-2 rounded-lg bg-indigo-50/40 border border-indigo-200/50 hover:bg-indigo-50 dark:bg-indigo-955/10 dark:border-indigo-900/40 text-indigo-700 dark:text-indigo-400 font-bold transition-all text-left truncate cursor-pointer"
                    >
                      👥 MoM Rapat ({selectedTask.linkedMeetingLogIds?.length || 0})
                    </button>
                  </div>
                </div>

                {/* 8. Action Panel Controls */}
                <div className="flex border-t border-slate-100 dark:border-slate-800 pt-3.5 gap-2 select-none">
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedTask.isDeleted) {
                        alert("⚠️ Tugas ini berada di Tong Sampah dan tidak bisa diedit. Silakan pulihkan tugas terlebih dahulu!");
                        return;
                      }
                      const canModify = !selectedTask.createdBy || selectedTask.createdBy === currentUser?.username || currentUser?.role === "Administrator";
                      if (canModify) {
                        setSelectedTask(null);
                        openEdit(selectedTask);
                      } else {
                        alert(`Hanya pembuat tugas (${selectedTask.createdBy}) yang dapat mengubah rincian`);
                      }
                    }}
                    disabled={!!selectedTask.isDeleted}
                    className={`flex-grow py-2 text-xs font-bold rounded-xl transition-all text-center ${
                      selectedTask.isDeleted
                        ? "bg-slate-100 dark:bg-slate-805 text-slate-400 dark:text-slate-600 cursor-not-allowed"
                        : "bg-slate-105 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-755 dark:text-slate-350 cursor-pointer"
                    }`}
                  >
                    Edit Tugas
                  </button>

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
                          }}
                          className="flex-grow py-2 bg-indigo-650 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1"
                        >
                          <Share2 className="w-3.5 h-3.5 shrink-0" />
                          <span>Delegasikan</span>
                        </button>
                      );
                    }
                    return null;
                  })()}
                </div>
              </div>
            ) : (
              /* Chat Discussion Panel view */
              <div className="space-y-3 font-sans">
                {/* 1. Comments list room */}
                <div 
                  ref={chatScrollRef}
                  className="space-y-4 max-h-[380px] overflow-y-auto pr-1 pb-1 border border-slate-150/15 dark:border-slate-800/40 rounded-xl p-3 bg-slate-50/40 dark:bg-slate-950/20"
                >
                  {!selectedTask.comments || selectedTask.comments.length === 0 ? (
                    <div className="text-center py-12 space-y-2 select-none">
                      <MessageSquare className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto opacity-75" />
                      <p className="text-xs font-semibold text-slate-505">Belum Ada Catatan Koordinasi</p>
                      <p className="text-[10px] text-slate-400">Gunakan form di bawah untuk mengirim pesan real-time ke tim.</p>
                    </div>
                  ) : (
                    selectedTask.comments.map((msg) => {
                      const isOwner = msg.role.includes("Owner") || msg.role.includes("Pusat") || msg.role.includes("Direktur");
                      const isMe = msg.sender === (currentUser?.name || currentUser?.username);
                      return (
                        <div 
                          key={msg.id} 
                          className={`flex flex-col gap-1 max-w-[90%] text-left ${isMe ? "ml-auto" : "mr-auto"}`}
                        >
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10.5px] font-black text-slate-800 dark:text-slate-100">{msg.sender}</span>
                            <span className={`text-[8px] font-extrabold px-1.5 py-0.2 rounded-full leading-none border uppercase tracking-wider select-none ${
                              isOwner 
                                ? "bg-amber-50 text-amber-700 dark:bg-amber-955/20 dark:text-amber-405 border-amber-250" 
                                : "bg-blue-50 text-blue-700 dark:bg-blue-955/20 dark:text-blue-405 border-blue-200"
                            }`}>
                              {msg.role}
                            </span>
                          </div>
                          
                          <div className={`p-2.5 rounded-2xl text-xs font-medium leading-relaxed font-sans ${
                            isMe 
                              ? "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-750/80 rounded-tr-none shadow-3xs" 
                              : "bg-slate-50/80 dark:bg-slate-900/60 text-slate-705 dark:text-slate-250 border border-slate-200/40 dark:border-slate-850 rounded-tl-none shadow-3xs"
                          }`}>
                            <div>
                              {renderFormattedText(msg.text)}
                            </div>
                            {msg.attachmentName && msg.attachmentData && (
                              <div className="mt-2 pt-2 border-t border-slate-200/40 dark:border-slate-700/60">
                                <a
                                  href={msg.attachmentData}
                                  download={msg.attachmentName}
                                  className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline break-all"
                                  title="Klik untuk mengunduh lampiran diskusi"
                                >
                                  <Paperclip className="w-3 h-3 shrink-0" />
                                  <span>{msg.attachmentName}</span>
                                </a>
                              </div>
                            )}
                          </div>
                          <span className="text-[8px] text-slate-400 font-mono font-bold mt-0.5 self-end">
                            {new Date(msg.createdAt).toLocaleTimeString("id-ID", {hour: '2-digit', minute: '2-digit'})}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* 2. Text message send box */}
                {selectedTask.isDeleted ? (
                  <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-400 text-xs font-bold rounded-xl text-center leading-relaxed">
                    ⚠️ Fitur Diskusi Dinonaktifkan karena tugas berada di Tong Sampah.
                  </div>
                ) : (
                  <form 
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleAddComment();
                    }}
                    className="space-y-2 border-t border-slate-100 dark:border-slate-800 pt-3"
                  >
                    <div className="border border-slate-250 dark:border-slate-800 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-blue-500/10 bg-slate-50 dark:bg-slate-950">
                      <div className="flex items-center justify-between bg-slate-105/55 dark:bg-slate-900/60 p-1.5 border-b border-slate-205 dark:border-slate-850 select-none">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleInsertFormat('chat-comment-textarea', chatInput, setChatInput, 'bold')}
                            className="p-1 px-2 text-[10px] text-slate-650 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 rounded font-bold cursor-pointer"
                            title="Tebal"
                          >
                            B
                          </button>
                          <button
                            type="button"
                            onClick={() => handleInsertFormat('chat-comment-textarea', chatInput, setChatInput, 'italic')}
                            className="p-1 px-2 text-[10px] text-slate-650 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 rounded italic cursor-pointer"
                            title="Miring"
                          >
                            I
                          </button>
                        </div>

                        {/* Attachment uploader inside Chat panel */}
                        <div className="flex items-center">
                          <label className="flex items-center gap-1 text-[10px] font-extrabold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 cursor-pointer bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded-lg border border-blue-150 dark:border-blue-900/40 transition-all select-none">
                            <Paperclip className="w-2.8 h-2.8 shrink-0" />
                            <span>{commentAttachmentName ? "Ganti" : "Lampirkan"}</span>
                            <input
                              type="file"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                if (file.size > 5 * 1024 * 1024) {
                                  alert("⚠️ Ukuran file terlalu besar! (Maks 5MB)");
                                  return;
                                }
                                const reader = new FileReader();
                                reader.onload = (event) => {
                                  if (event.target?.result) {
                                    setCommentAttachmentName(file.name);
                                    setCommentAttachmentData(event.target.result as string);
                                  }
                                };
                                reader.readAsDataURL(file);
                              }}
                            />
                          </label>
                        </div>
                      </div>

                      {/* Pending comments attachment block */}
                      {commentAttachmentName && (
                        <div className="px-2.5 py-1.5 bg-blue-50/50 dark:bg-blue-950/20 border-b border-blue-105/30 dark:border-blue-900/20 flex items-center justify-between text-[10px] text-slate-705 dark:text-slate-350 select-none">
                          <span className="truncate flex items-center gap-1 font-bold">
                            📎 Lampiran siap kirim: <strong className="text-blue-600 dark:text-blue-400 break-all">{commentAttachmentName}</strong>
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setCommentAttachmentName("");
                              setCommentAttachmentData("");
                            }}
                            className="text-red-500 hover:text-red-700 font-extrabold ml-2 shrink-0 cursor-pointer text-[9px]"
                          >
                            Hapus
                          </button>
                        </div>
                      )}

                      <div className="flex items-end p-2 gap-2">
                        <textarea
                          id="chat-comment-textarea"
                          rows={2}
                          value={chatInput}
                          onChange={(e) => setChatInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault();
                              handleAddComment();
                            }
                          }}
                          placeholder="Tulis pesan diskusi koordinasi..."
                          className="flex-grow bg-transparent border-0 text-slate-855 dark:text-slate-100 text-xs font-semibold focus:outline-none focus:ring-0 resize-none max-h-20"
                        />
                        <button
                          type="submit"
                          disabled={!chatInput.trim() && !commentAttachmentName}
                          className={`p-2.5 rounded-xl transition-all shrink-0 cursor-pointer ${
                            chatInput.trim() || commentAttachmentName
                              ? "bg-blue-600 hover:bg-blue-700 text-white shadow-xs hover:scale-103" 
                              : "bg-slate-200 text-slate-400 dark:bg-slate-800 dark:text-slate-600 cursor-not-allowed"
                          }`}
                        >
                          <Send className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </form>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

    </div>

      {/* Spacious Side-over Context Drawer Overlay for Modern, Wide & Elegant Detail View */}
      <AnimatePresence>
        {selectedTask && detailLayout === 'drawer' && (
          <>
            {/* Dark glass backdrop overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedTask(null)}
              className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-50 transition-opacity"
            />

            {/* Sliding Panel */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 220 }}
              className="fixed inset-y-0 right-0 w-full sm:max-w-xl md:max-w-2xl lg:max-w-3xl xl:max-w-4xl bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-800 z-50 flex flex-col h-full overflow-hidden font-sans text-left"
            >
              {/* Drawer Title Header */}
              <div className="flex justify-between items-start p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-5:55 dark:bg-slate-950/20 select-none">
                <div className="space-y-1.5 flex-grow pr-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] bg-slate-150 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-extrabold px-2.5 py-0.5 rounded-full font-mono">
                      #TKT-{String(tasks.indexOf(selectedTask) + 1).padStart(4, "0")}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${getStatusStyle(selectedTask.status)}`}>
                      {selectedTask.status}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${getPriorityStyle(selectedTask.priority)}`}>
                      {selectedTask.priority} Priority
                    </span>
                  </div>

                  <h3 className="font-extrabold text-base sm:text-lg lg:text-xl text-slate-900 dark:text-white leading-tight tracking-tight mt-1">
                    {selectedTask.task}
                  </h3>

                  <p className="text-xs text-blue-600 dark:text-blue-400 font-bold flex items-center gap-1.5">
                    📁 Project: {projects.find(p => p.kode === selectedTask.project)?.nama || selectedTask.project || "Umum"}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setSelectedTask(null)}
                    className="p-2 text-slate-455 hover:text-slate-650 dark:hover:text-slate-200 hover:rotate-90 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
                    title="Tutup Detil"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Detail Navigation Tabs inside Drawer */}
              <div className="flex border-b border-slate-100 dark:border-slate-800 px-5 bg-white dark:bg-slate-900 z-10 shrink-0 select-none">
                <button
                  type="button"
                  onClick={() => setActiveDetailTab("detail")}
                  className={`py-3 text-xs sm:text-sm font-bold border-b-2 mr-6 transition-all cursor-pointer flex items-center gap-2 ${
                    activeDetailTab === "detail"
                      ? "border-blue-600 text-blue-600 dark:text-blue-400 font-extrabold"
                      : "border-transparent text-slate-400 hover:text-slate-655 dark:hover:text-slate-300"
                  }`}
                >
                  📋 Informasi Detail Pekerjaan
                </button>
                <button
                  type="button"
                  onClick={() => setActiveDetailTab("chat")}
                  className={`py-3 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
                    activeDetailTab === "chat"
                      ? "border-blue-600 text-blue-600 dark:text-blue-400 font-extrabold"
                      : "border-transparent text-slate-400 hover:text-slate-655 dark:hover:text-slate-300"
                  }`}
                >
                  💬 Diskusi Tim & Koordinasi ({selectedTask.comments?.length || 0})
                  {selectedTask.comments && selectedTask.comments.length > 0 && (
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-500/15 animate-pulse" />
                  )}
                </button>
              </div>

              {/* Scrollable Content Outer Area */}
              <div className="flex-grow overflow-y-auto p-5 space-y-6">
                {activeDetailTab === "detail" ? (
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                    
                    {/* Left Column in Drawer Content: Primary Description & Checklists */}
                    <div className="md:col-span-7 space-y-6">
                      
                      {/* Deskripsi Tugas */}
                      <div className="bg-slate-50/50 dark:bg-slate-950/20 border border-slate-150/15 dark:border-slate-850 p-4 rounded-xl space-y-2.5 text-left">
                        <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block font-mono">Deskripsi Lengkap</span>
                        <div className="text-slate-800 dark:text-slate-200 text-xs font-semibold leading-relaxed whitespace-pre-wrap font-sans">
                          {selectedTask.notes ? renderFormattedText(selectedTask.notes) : <span className="italic text-slate-400">Tidak ada deskripsi tambahan untuk tugas ini.</span>}
                        </div>
                      </div>

                      {/* Subtask Section */}
                      <div className="border border-slate-150/10 dark:border-slate-800 rounded-xl p-4 space-y-3.5 text-left bg-white dark:bg-slate-900">
                        <div className="flex justify-between items-center text-xs font-bold text-slate-455 font-mono">
                          <span className="uppercase text-[10px] tracking-wider">Subtask Checklist ({selectedTask.subtasks?.filter(s => s.done).length || 0}/{selectedTask.subtasks?.length || 0})</span>
                        </div>
                        
                        <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                          {!selectedTask.subtasks || selectedTask.subtasks.length === 0 ? (
                            <p className="text-xs text-slate-400 italic p-4 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-950/10">Belum ada checklist teknis pekerjaan.</p>
                          ) : (
                            selectedTask.subtasks.map((sub) => (
                              <div 
                                key={sub.id} 
                                className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50/80 dark:bg-slate-950/40 border border-slate-150/10 dark:border-slate-800/20 hover:border-slate-200/50 transition-all"
                              >
                                <input
                                  type="checkbox"
                                  checked={sub.done}
                                  onChange={() => handleLiveSubToggle(selectedTask, sub.id)}
                                  className="w-4 h-4 rounded text-blue-600 focus:outline-none cursor-pointer scale-110"
                                />
                                <span className={`text-xs ${sub.done ? "line-through text-slate-400" : "text-slate-700 dark:text-slate-300 font-bold"}`}>
                                  {sub.title}
                                </span>
                              </div>
                            ))
                          )}
                        </div>
                      </div>

                      {/* External Connections Section */}
                      {(selectedTask.glpiId || selectedTask.mantisId || selectedTask.gitlabId) && (
                        <div className="bg-slate-50/50 dark:bg-slate-950/20 border border-slate-150/15 dark:border-slate-850 p-4 rounded-xl text-xs space-y-2 text-left font-sans">
                          <span className="font-bold text-slate-400 uppercase text-[9px] tracking-wider block">Tiket Eksternal Terhubung</span>
                          <div className="grid grid-cols-3 gap-2.5">
                            {selectedTask.glpiId && (
                              <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 p-2 rounded-lg text-center">
                                <span className="text-slate-400 font-bold block text-[8px] uppercase">GLPI ID</span>
                                <span className="font-mono text-slate-755 dark:text-slate-200 font-black text-xs">{selectedTask.glpiId}</span>
                              </div>
                            )}
                            {selectedTask.mantisId && (
                              <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 p-2 rounded-lg text-center">
                                <span className="text-slate-400 font-bold block text-[8px] uppercase">Mantis ID</span>
                                <span className="font-mono text-slate-755 dark:text-slate-200 font-black text-xs">{selectedTask.mantisId}</span>
                              </div>
                            )}
                            {selectedTask.gitlabId && (
                              <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 p-2 rounded-lg text-center">
                                <span className="text-slate-400 font-bold block text-[8px] uppercase">GitLab ID</span>
                                <span className="font-mono text-slate-755 dark:text-slate-200 font-black text-xs">{selectedTask.gitlabId}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Right Column in Drawer Content: Progress Updates & Key Metadata Fields */}
                    <div className="md:col-span-5 space-y-5">
                      
                      {/* Live Status and Progress */}
                      <div className="space-y-4 bg-slate-50/70 dark:bg-slate-955/20 p-4 rounded-xl border border-slate-150/15 dark:border-slate-850/40 text-left">
                        <div className="space-y-1.5">
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block font-mono">Status Pekerjaan</span>
                          <select
                            value={draftStatus}
                            onChange={(e) => onDraftStatusChange(e.target.value)}
                            disabled={!!selectedTask.isDeleted}
                            className={`w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 ${selectedTask.isDeleted ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
                          >
                            {progressStatusesList.map(st => (
                              <option key={st} value={st}>{st}</option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-1.5">
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block font-mono">Progress Penyelesaian</span>
                            <span className="font-mono text-xs font-black text-blue-600 dark:text-blue-400">
                              {draftProgress}%
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-3 bg-white dark:bg-slate-900 p-2.5 border border-slate-200 dark:border-slate-800 rounded-xl">
                            <input
                              type="range"
                              min="0"
                              max="100"
                              step="5"
                              value={draftProgress}
                              onChange={(e) => onDraftProgressChange(parseInt(e.target.value, 10))}
                              disabled={!!selectedTask.isDeleted}
                              className={`flex-grow h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full ${selectedTask.isDeleted ? "opacity-40 cursor-not-allowed" : "accent-blue-600 cursor-pointer cursor-ew-resize"}`}
                            />
                          </div>
                        </div>

                        {/* Explicit Save Action or Trash recovery option */}
                        <div className="pt-2 border-t border-slate-200/50 dark:border-slate-800/60">
                          {selectedTask.isDeleted ? (
                            <div className="space-y-2 text-center md:text-left">
                              <div className="p-2.5 bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-405 text-[10.5px] font-bold rounded-lg border border-amber-200/30 dark:border-amber-900/30 leading-normal">
                                ⚠️ Tugas ada di Tong Sampah. Pulihkan terlebih dahulu untuk mengubah status & progress.
                              </div>
                              <button
                                type="button"
                                onClick={() => executeRestoreTask(selectedTask)}
                                className="w-full py-2.5 px-3.5 text-xs font-black text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                              >
                                <RefreshCw className="w-3.5 h-3.5 shrink-0" />
                                <span>Pulihkan Sekarang</span>
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={handleSaveStatusProgress}
                              className={`w-full py-2.5 px-3.5 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                                draftStatus !== selectedTask.status || draftProgress !== selectedTask.progress
                                  ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs font-extrabold focus:ring-2 focus:ring-emerald-500/20"
                                  : "bg-slate-150/70 dark:bg-slate-800/80 text-slate-400 dark:text-slate-500 cursor-not-allowed"
                              }`}
                              disabled={draftStatus === selectedTask.status && draftProgress === selectedTask.progress}
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                              <span>{draftStatus !== selectedTask.status || draftProgress !== selectedTask.progress ? "Simpan Perubahan" : "Status Sudah Sinkron"}</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Grid Metadata */}
                      <div className="grid grid-cols-1 gap-2.5 text-[11px] font-sans pb-1 text-left">
                        
                        <div className="bg-slate-50/50 dark:bg-slate-950/20 p-3 rounded-xl border border-slate-150/5 dark:border-slate-850/40">
                          <p className="text-[8px] text-slate-400 font-extrabold uppercase tracking-widest leading-none mb-1.5">PIC Pelaksana Utama</p>
                          <div className="flex items-center gap-2 select-none">
                            <span className={`w-5.5 h-5.5 rounded-full text-[10px] font-black flex items-center justify-center shrink-0 ${picThemeColors(selectedTask.pic || "")}`}>
                              {selectedTask.pic ? selectedTask.pic.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() : "?"}
                            </span>
                            <span className="font-bold text-slate-855 dark:text-slate-200 text-xs">{selectedTask.pic || "Belum ditentukan"}</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2.5">
                          <div className="bg-slate-50/50 dark:bg-slate-950/20 p-3 rounded-xl border border-slate-150/5 dark:border-slate-850/40">
                            <p className="text-[8px] text-slate-400 font-extrabold uppercase tracking-widest leading-none mb-1">Tanggal Mulai</p>
                            <p className="font-bold text-slate-805 dark:text-slate-200 font-mono text-xs">
                              {selectedTask.startDate ? new Date(selectedTask.startDate).toLocaleDateString("id-ID", { day: 'numeric', month: 'short', year: 'numeric' }) : "—"}
                            </p>
                          </div>
                          
                          <div className="bg-slate-50/50 dark:bg-slate-950/20 p-3 rounded-xl border border-slate-150/5 dark:border-slate-850/40">
                            <p className="text-[8px] text-slate-400 font-extrabold uppercase tracking-widest leading-none mb-1">Jatuh Tempo</p>
                            <p className="font-extrabold text-slate-805 dark:text-slate-200 font-mono text-xs">
                              {selectedTask.dueDate ? new Date(selectedTask.dueDate).toLocaleDateString("id-ID", { day: 'numeric', month: 'short', year: 'numeric' }) : "—"}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2.5">
                          <div className="bg-slate-50/50 dark:bg-slate-950/20 p-3 rounded-xl border border-slate-150/5 dark:border-slate-850/40">
                            <p className="text-[8px] text-slate-400 font-extrabold uppercase tracking-widest leading-none mb-1">Tipe / Kategori</p>
                            <span className="font-bold text-slate-855 dark:text-slate-200 text-xs">{selectedTask.taskType || "—"}</span>
                          </div>

                          <div className="bg-slate-50/50 dark:bg-slate-950/20 p-3 rounded-xl border border-slate-150/5 dark:border-slate-850/40">
                            <p className="text-[8px] text-slate-400 font-extrabold uppercase tracking-widest leading-none mb-1">Modul Terkait</p>
                            <span className="font-bold text-slate-855 dark:text-slate-200 text-xs truncate block">{selectedTask.modul || "—"}</span>
                          </div>
                        </div>

                        {selectedTask.assignerName && (
                          <div className="bg-amber-500/5 dark:bg-amber-955/20 border border-amber-500/10 p-3 rounded-xl text-xs space-y-1">
                            <p className="font-extrabold text-amber-700 dark:text-amber-450 uppercase text-[9px] tracking-wider leading-none mb-1">Delegasi Atasan</p>
                            <p className="text-slate-805 dark:text-slate-200 font-bold">👑 {selectedTask.assignerName}</p>
                            <p className="text-slate-500 text-[10px]">{selectedTask.assignerRole || "Direktur"}</p>
                            {selectedTask.delegationNotes && (
                              <div className="text-slate-650 dark:text-slate-405 text-[10.5px] mt-1 pl-1.5 border-l-2 border-amber-400/80 italic whitespace-pre-wrap leading-relaxed">
                                {renderFormattedText(selectedTask.delegationNotes)}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Attachments */}
                      {selectedTask.url && (
                        <div className="bg-slate-50/50 dark:bg-slate-950/20 border border-slate-150/10 dark:border-slate-850 p-3 rounded-xl flex items-center justify-between text-left">
                          <div className="space-y-0.5">
                            <span className="text-[8px] text-slate-400 font-extrabold uppercase block tracking-wider">Lampiran Tautan Eksternal</span>
                            <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">File Pelengkap</span>
                          </div>
                          <a 
                            href={selectedTask.url} 
                            target="_blank" 
                            rel="noreferrer" 
                            className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-1 px-3 text-[10px] rounded-lg transition-all shadow-2xs"
                          >
                            Buka Tautan ↗
                          </a>
                        </div>
                      )}

                      {/* Collaboration logs connections inside detail layout */}
                      <div className="bg-slate-50/50 dark:bg-slate-950/20 p-4 border border-slate-150/15 dark:border-slate-850 rounded-xl space-y-3 text-left">
                        <span className="font-mono uppercase text-[9px] tracking-wider text-slate-455 font-black block">Koneksi Kolaborasi</span>
                        
                        <div className="grid grid-cols-2 gap-2 text-[10px]">
                          <button
                            type="button"
                            onClick={() => {
                              setCollabModalTaskId(selectedTask.id);
                              setCollabModalType('comm');
                              setTempCheckedCollabIds(selectedTask.linkedCommLogIds || []);
                              setCollabSearch("");
                            }}
                            className="p-2.5 rounded-xl bg-teal-50 hover:bg-teal-100 border border-teal-200/50 dark:bg-teal-955/15 dark:border-teal-900/40 text-teal-800 dark:text-teal-400 font-extrabold transition-all text-left truncate cursor-pointer flex flex-col gap-0.5"
                          >
                            <span className="block text-[8px] text-teal-555 dark:text-teal-500 uppercase leading-none">Log WA</span>
                            <span>{selectedTask.linkedCommLogIds?.length || 0} Log Terhubung</span>
                          </button>
                          
                          <button
                            type="button"
                            onClick={() => {
                              setCollabModalTaskId(selectedTask.id);
                              setCollabModalType('meeting');
                              setTempCheckedCollabIds(selectedTask.linkedMeetingLogIds || []);
                              setCollabSearch("");
                            }}
                            className="p-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/50 dark:bg-indigo-955/15 dark:border-indigo-900/40 text-indigo-805 dark:text-indigo-405 font-extrabold transition-all text-left truncate cursor-pointer flex flex-col gap-0.5"
                          >
                            <span className="block text-[8px] text-indigo-555 dark:text-indigo-500 uppercase leading-none">MoM Rapat</span>
                            <span>{selectedTask.linkedMeetingLogIds?.length || 0} MoM Terhubung</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Chat tab Inside Drawer */
                  <div className="space-y-4 max-w-3xl mx-auto text-left h-full flex flex-col justify-between">
                    {/* Comments list room */}
                    <div 
                      ref={chatScrollRef}
                      className="space-y-4 overflow-y-auto pr-1 pb-1 border border-slate-150/15 dark:border-slate-800/40 rounded-xl p-4 bg-slate-50/40 dark:bg-slate-950/20 max-h-[calc(100vh-340px)] min-h-[300px]"
                    >
                      {!selectedTask.comments || selectedTask.comments.length === 0 ? (
                        <div className="text-center py-20 space-y-2 select-none">
                          <MessageSquare className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto opacity-75" />
                          <p className="text-sm font-bold text-slate-505 dark:text-slate-400">Belum Ada Catatan Koordinasi</p>
                          <p className="text-xs text-slate-400 max-w-sm mx-auto">Gunakan formulir di bawah ini untuk mengirim pesan real-time ke rekan tim untuk melakukan koordinasi pemenuhan tugas ini.</p>
                        </div>
                      ) : (
                        selectedTask.comments.map((msg) => {
                          const isOwner = msg.role.includes("Owner") || msg.role.includes("Pusat") || msg.role.includes("Direktur");
                          const isMe = msg.sender === (currentUser?.name || currentUser?.username);
                          return (
                            <div 
                              key={msg.id} 
                              className={`flex flex-col gap-1 max-w-[85%] text-left ${isMe ? "ml-auto" : "mr-auto"}`}
                            >
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-xs font-black text-slate-800 dark:text-slate-100">{msg.sender}</span>
                                <span className={`text-[8px] font-extrabold px-1.5 py-0.2 rounded-full leading-none border uppercase tracking-wider select-none ${
                                  isMe
                                    ? "bg-blue-50 text-blue-700 dark:bg-blue-955/20 dark:text-blue-405 border-blue-200"
                                    : isOwner
                                    ? "bg-amber-50 text-amber-700 dark:bg-amber-955/20 dark:text-amber-405 border-amber-250" 
                                    : "bg-slate-50 text-slate-700 dark:text-slate-350 dark:bg-slate-800 border-slate-205"
                                }`}>
                                  {msg.role}
                                </span>
                              </div>
                              
                              <div className={`p-3 rounded-2xl text-xs font-medium leading-relaxed font-sans ${
                                isMe 
                                  ? "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-750/85 rounded-tr-none shadow-3xs" 
                                  : "bg-slate-5/80 dark:bg-slate-900/60 text-slate-705 dark:text-slate-250 border border-slate-200/40 dark:border-slate-850 rounded-tl-none shadow-3xs"
                              }`}>
                                <div>
                                  {renderFormattedText(msg.text)}
                                </div>
                                {msg.attachmentName && msg.attachmentData && (
                                  <div className="mt-2 pt-2 border-t border-slate-200/40 dark:border-slate-700/60 text-left">
                                    <a
                                      href={msg.attachmentData}
                                      download={msg.attachmentName}
                                      className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-605 dark:text-blue-400 hover:underline break-all"
                                      title="Klik untuk mengunduh lampiran diskusi"
                                    >
                                      <Paperclip className="w-3 h-3 shrink-0" />
                                      <span>{msg.attachmentName}</span>
                                    </a>
                                  </div>
                                )}
                              </div>
                              <span className="text-[8.5px] text-slate-400 font-mono font-bold mt-0.5 self-end">
                                {new Date(msg.createdAt).toLocaleTimeString("id-ID", {hour: '2-digit', minute: '2-digit'})} | {new Date(msg.createdAt).toLocaleDateString("id-ID", {day: 'numeric', month: 'short'})}
                              </span>
                            </div>
                          );
                        })
                      )}
                    </div>

                    {/* Chat messaging keyboard */}
                    {selectedTask.isDeleted ? (
                      <div className="p-3 my-2 bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-400 text-xs font-bold rounded-xl text-center leading-relaxed">
                        ⚠️ Fitur Diskusi Dinonaktifkan karena tugas berada di Tong Sampah.
                      </div>
                    ) : (
                      <form 
                        onSubmit={(e) => {
                          e.preventDefault();
                          handleAddComment();
                        }}
                        className="space-y-2 border-t border-slate-100 dark:border-slate-800 pt-3"
                      >
                        <div className="border border-slate-250 dark:border-slate-800 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-blue-500/10 bg-slate-50 dark:bg-slate-950">
                          <div className="flex items-center justify-between bg-slate-105/55 dark:bg-slate-900/60 p-1.5 border-b border-slate-205 dark:border-slate-850 select-none">
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleInsertFormat('chat-comment-textarea-drawer', chatInput, setChatInput, 'bold')}
                                className="p-1 px-2 text-[10px] text-slate-650 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 rounded font-bold cursor-pointer"
                                title="Tebal"
                              >
                                B
                              </button>
                              <button
                                type="button"
                                onClick={() => handleInsertFormat('chat-comment-textarea-drawer', chatInput, setChatInput, 'italic')}
                                className="p-1 px-2 text-[10px] text-slate-650 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 rounded italic cursor-pointer"
                                title="Miring"
                              >
                                I
                              </button>
                            </div>

                            {/* Attachment button trigger for Drawer Chat */}
                            <div className="flex items-center">
                              <label className="flex items-center gap-1 text-[10px] font-extrabold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 cursor-pointer bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded-lg border border-blue-150 dark:border-blue-900/40 transition-all select-none">
                                <Paperclip className="w-2.8 h-2.8 shrink-0" />
                                <span>{commentAttachmentName ? "Ganti" : "Lampirkan"}</span>
                                <input
                                  type="file"
                                  className="hidden"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (!file) return;
                                    if (file.size > 5 * 1024 * 1024) {
                                      alert("⚠️ Ukuran file terlalu besar! (Maks 5MB)");
                                      return;
                                    }
                                    const reader = new FileReader();
                                    reader.onload = (event) => {
                                      if (event.target?.result) {
                                        setCommentAttachmentName(file.name);
                                        setCommentAttachmentData(event.target.result as string);
                                      }
                                    };
                                    reader.readAsDataURL(file);
                                  }}
                                />
                              </label>
                            </div>
                          </div>

                          {/* Pending comment attachment display */}
                          {commentAttachmentName && (
                            <div className="px-2.5 py-1.5 bg-blue-50/50 dark:bg-blue-950/20 border-b border-blue-105/30 dark:border-blue-900/20 flex items-center justify-between text-[10px] text-slate-705 dark:text-slate-350 select-none">
                              <span className="truncate flex items-center gap-1 font-bold">
                                📎 Lampiran siap kirim: <strong className="text-blue-600 dark:text-blue-400 break-all">{commentAttachmentName}</strong>
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  setCommentAttachmentName("");
                                  setCommentAttachmentData("");
                                }}
                                className="text-red-500 hover:text-red-700 font-extrabold ml-2 shrink-0 cursor-pointer text-[9px]"
                              >
                                Hapus
                              </button>
                            </div>
                          )}

                          <div className="flex items-end p-2 gap-2">
                            <textarea
                              id="chat-comment-textarea-drawer"
                              rows={2}
                              value={chatInput}
                              onChange={(e) => setChatInput(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                  e.preventDefault();
                                  handleAddComment();
                                }
                              }}
                              placeholder="Tulis pesan diskusi koordinasi..."
                              className="flex-grow bg-transparent border-0 text-slate-855 dark:text-slate-100 text-xs font-semibold focus:outline-none focus:ring-0 resize-none max-h-20"
                            />
                            <button
                              type="submit"
                              disabled={!chatInput.trim() && !commentAttachmentName}
                              className={`p-2.5 rounded-xl transition-all shrink-0 cursor-pointer ${
                                chatInput.trim() || commentAttachmentName
                                  ? "bg-blue-600 hover:bg-blue-700 text-white shadow-xs hover:scale-103" 
                                  : "bg-slate-200 text-slate-400 dark:bg-slate-800 dark:text-slate-600 cursor-not-allowed"
                              }`}
                            >
                              <Send className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </form>
                    )}
                  </div>
                )}
              </div>

              {/* Bottom footer button panel */}
              <div className="border-t border-slate-100 dark:border-slate-800 p-4 px-5 bg-slate-50 dark:bg-slate-900/60 flex items-center justify-between select-none shrink-0 text-left">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedTask.isDeleted) {
                        alert("⚠️ Tugas ini berada di Tong Sampah dan tidak bisa diedit. Silakan pulihkan tugas terlebih dahulu!");
                        return;
                      }
                      const canModify = !selectedTask.createdBy || selectedTask.createdBy === currentUser?.username || currentUser?.role === "Administrator";
                      if (canModify) {
                        setSelectedTask(null);
                        openEdit(selectedTask);
                      } else {
                        alert(`Hanya pembuat tugas (${selectedTask.createdBy}) yang dapat mengubah rincian`);
                      }
                    }}
                    disabled={!!selectedTask.isDeleted}
                    className={`px-4 py-2 text-xs font-extrabold rounded-xl transition-all ${
                      selectedTask.isDeleted
                        ? "bg-slate-100 dark:bg-slate-805 text-slate-400 dark:text-slate-600 cursor-not-allowed"
                        : "bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-805 dark:text-slate-200 cursor-pointer"
                    }`}
                  >
                    {selectedTask.isDeleted ? "Detail Hanya Lihat (Tong Sampah)" : "Edit Detail Lengkap"}
                  </button>

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
                          }}
                          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                        >
                          <Share2 className="w-3.5 h-3.5 shrink-0" />
                          <span>Delegasikan Tugas</span>
                        </button>
                      );
                    }
                  })()}
                </div>

                <div className="text-[10px] text-slate-400 font-bold font-mono">
                  Terakhir Diubah: {selectedTask.updatedAt ? new Date(selectedTask.updatedAt).toLocaleDateString("id-ID") : "—"}
                </div>
              </div>
            </motion.div>
          </>
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
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">JUDUL TUGAS DELEGASI *</label>
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
                            ? "bg-blue-600 text-white border-blue-600 shadow-xs"
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
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">INSTRUKSI KHUSUS / CATATAN DELEGASI</label>
                  <div className="border border-slate-250 dark:border-slate-800 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500/10 transition-all bg-slate-50 dark:bg-slate-950">
                    {/* Visual Formatting Toolbar */}
                    <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-850 border-b border-slate-205 dark:border-slate-800 p-2">
                      <button
                        type="button"
                        onClick={() => handleInsertFormat('del-notes-textarea', delNotes, setDelNotes, 'bold')}
                        className="p-1 px-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-750 rounded font-bold transition-all flex items-center justify-center min-w-[24px] cursor-pointer"
                        title="Tebalkan (Bold) - **teks**"
                      >
                        B
                      </button>
                      <button
                        type="button"
                        onClick={() => handleInsertFormat('del-notes-textarea', delNotes, setDelNotes, 'italic')}
                        className="p-1 px-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-750 rounded italic transition-all flex items-center justify-center min-w-[24px] cursor-pointer"
                        title="Miringkan (Italic) - *teks*"
                      >
                        I
                      </button>
                      <button
                        type="button"
                        onClick={() => handleInsertFormat('del-notes-textarea', delNotes, setDelNotes, 'underline')}
                        className="p-1 px-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-750 rounded underline transition-all flex items-center justify-center min-w-[24px] cursor-pointer"
                        title="Garis Bawah (Underline) - __teks__"
                      >
                        U
                      </button>
                      <div className="w-[1px] h-4 bg-slate-250 dark:bg-slate-800 mx-1" />
                      <button
                        type="button"
                        onClick={() => handleInsertFormat('del-notes-textarea', delNotes, setDelNotes, 'bullet')}
                        className="p-1 px-2 text-[11px] text-slate-750 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-755 rounded transition-all flex items-center gap-1 cursor-pointer"
                        title="Daftar Butir (Bullet List) - - item"
                      >
                        • List
                      </button>
                      <button
                        type="button"
                        onClick={() => handleInsertFormat('del-notes-textarea', delNotes, setDelNotes, 'number')}
                        className="p-1 px-2 text-[11px] text-slate-750 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-755 rounded transition-all flex items-center gap-1 cursor-pointer"
                        title="Daftar Angka (Numbered List) - 1. item"
                      >
                        1. List
                      </button>
                    </div>
                    <textarea
                      id="del-notes-textarea"
                      rows={3}
                      value={delNotes}
                      onChange={(e) => setDelNotes(e.target.value)}
                      placeholder="Masukkan rincian detail instruksi pengerjaan, batas fungsional, atau petunjuk penyelesaian bagi PIC penerima delegasi. Gunakan tombol toolbar format di atas."
                      className="w-full bg-transparent border-0 p-2.5 text-slate-805 dark:text-slate-100 font-medium focus:outline-none focus:ring-0 transition-all text-xs placeholder:opacity-50 rounded-b-lg"
                    />
                  </div>
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
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-all shadow-xs uppercase tracking-wider cursor-pointer"
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
                const isTaskDeleted = !!taskToDelete.isDeleted;
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

      {/* MODAL: MANAGE TASK COLLABORATION LOGS CONNECTION */}
      <AnimatePresence>
        {collabModalTaskId && collabModalType && (
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-[70] flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-800 rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4 font-sans"
            >
              <div>
                <h3 className="font-bold text-base text-slate-800 dark:text-slate-200">
                  Hubungkan {collabModalType === 'comm' ? "Log Koordinasi" : "Minutes of Meeting (MoM)"}
                </h3>
                <p className="text-xs text-slate-400 font-medium">Pilih catatan kolaborasi yang ingin dipautkan to tugas ini.</p>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <input
                  type="text"
                  value={collabSearch}
                  onChange={(e) => setCollabSearch(e.target.value)}
                  placeholder="Cari berdasarkan kata kunci..."
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg py-1.5 px-3 text-xs text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              {/* List of items with checkboxes */}
              <div className="max-h-60 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-lg p-2 space-y-1.5 bg-slate-50/50 dark:bg-slate-950/20">
                {(() => {
                  const filteredLogs = (collabModalType === 'comm' ? commLogs : meetingLogs).filter(log => {
                    const text = collabModalType === 'comm' 
                      ? `${(log as any).noID || ""} ${(log as any).summary || ""} ${(log as any).detail || ""}`
                      : `${(log as any).noID || ""} ${(log as any).title || ""} ${(log as any).agenda || ""}`;
                    return text.toLowerCase().includes(collabSearch.toLowerCase());
                  });

                  if (filteredLogs.length === 0) {
                    return <span className="text-[10px] text-slate-405 block p-2 italic text-center">Tidak ada data ditemukan</span>;
                  }

                  return filteredLogs.map((log) => {
                    const isChecked = tempCheckedCollabIds.includes(log.id);
                    return (
                      <label
                        key={log.id}
                        className={`flex items-start gap-2.5 p-2 rounded-lg border transition-all text-xs cursor-pointer ${
                          isChecked
                            ? "bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-800/60 text-indigo-900 dark:text-indigo-300 font-semibold"
                            : "border-transparent text-slate-650 dark:text-slate-400 hover:bg-slate-100/55 dark:hover:bg-slate-850/55"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setTempCheckedCollabIds([...tempCheckedCollabIds, log.id]);
                            } else {
                              setTempCheckedCollabIds(tempCheckedCollabIds.filter(id => id !== log.id));
                            }
                          }}
                          className="mt-0.5 accent-indigo-600 rounded"
                        />
                        <div className="flex flex-col gap-0.5 max-w-[90%] font-sans text-left">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {log.noID && (
                              <span className="text-[9px] font-mono font-black text-indigo-600 bg-indigo-50 dark:bg-indigo-900/10 px-1 py-0.2 rounded">
                                {log.noID}
                              </span>
                            )}
                            <span className="text-[9px] font-bold text-slate-455 font-mono">
                              {new Date(log.date).toLocaleDateString("id-ID")}
                            </span>
                            {log.project && (
                              <span className="text-[9px] font-semibold text-blue-500 bg-blue-50 dark:bg-blue-900/10 px-1 py-0.2 rounded">
                                {log.project}
                              </span>
                            )}
                          </div>
                          <span className="font-bold text-[11px] line-clamp-1">
                            {collabModalType === 'comm' ? (log as any).summary : (log as any).title}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium line-clamp-1">
                            {collabModalType === 'comm' ? (log as any).detail : (log as any).agenda}
                          </span>
                        </div>
                      </label>
                    );
                  });
                })()}
              </div>

              {/* Footer action buttons */}
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 font-sans">
                <button
                  type="button"
                  onClick={() => { setCollabModalTaskId(null); setCollabModalType(null); }}
                  className="px-4 py-1.5 border border-slate-250 text-slate-500 dark:text-slate-400 text-xs font-semibold rounded-lg hover:bg-slate-100 transition-all font-sans"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSaveTaskCollab}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg hover:shadow-lg transition-all font-sans"
                >
                  Simpan Koneksi
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
