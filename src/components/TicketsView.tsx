import React, { useState, useRef } from "react";
import { Ticket, Client, Project, User } from "../types";
import { 
  LifeBuoy, 
  Plus, 
  Trash2, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Search, 
  Building, 
  User as UserIcon, 
  SlidersHorizontal,
  X,
  Edit,
  Activity,
  FileCheck2,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Highlighter,
  List,
  ListOrdered,
  Quote,
  Table,
  FileText,
  Image as ImageIcon,
  Paperclip,
  ArrowLeft,
  Calendar,
  UploadCloud,
  ChevronDown,
  ChevronUp,
  CheckSquare
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface TicketsViewProps {
  tickets: Ticket[];
  clients: Client[];
  projects: Project[];
  currentUser: User | null;
  settings?: any;
  onAddTicket: (ticket: Partial<Ticket>) => Promise<void>;
  onUpdateTicket: (id: string, ticket: Partial<Ticket>) => Promise<void>;
  onDeleteTicket: (id: string) => Promise<void>;
}

export default function TicketsView({
  tickets,
  clients,
  projects,
  currentUser,
  settings,
  onAddTicket,
  onUpdateTicket,
  onDeleteTicket
}: TicketsViewProps) {
  const isUserScoped = !!(currentUser && 
    currentUser.siteTugas && 
    currentUser.siteTugas.toLowerCase().trim() !== "kantor pusat" &&
    currentUser.role !== "Administrator" && 
    currentUser.role !== "Direktur");
  const userSite = currentUser?.siteTugas || "";

  const [searchTerm, setSearchTerm] = useState("");
  const [filterProject, setFilterProject] = useState(isUserScoped ? userSite : "");
  const [filterType, setFilterType] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterCategory, setFilterCategory] = useState("");

  // Table row expand-collapse state manager
  const [expandedTicketId, setExpandedTicketId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedTicketId(prev => prev === id ? null : id);
  };

  // Form View Control (replaces pop-up completely)
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState("");

  // Form states (note: projectName selection is removed from inputs but saved in background)
  const [projectName, setProjectName] = useState("");
  const [reporterName, setReporterName] = useState("");
  const [unit, setUnit] = useState("");
  const [reportType, setReportType] = useState<string>("");
  const [category, setCategory] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");

  // Follow-up & Penyelesaian States
  const [isFollowUpOpen, setIsFollowUpOpen] = useState(false);
  const [followUpTicket, setFollowUpTicket] = useState<Ticket | null>(null);
  const [followUpStatus, setFollowUpStatus] = useState<string>("In Progress");
  const [followUpNotes, setFollowUpNotes] = useState("");

  // New customization fields:
  const [ticketNumber, setTicketNumber] = useState("");
  const [customCreatedAt, setCustomCreatedAt] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [fileName, setFileName] = useState("");
  const [activeEditorTab, setActiveEditorTab] = useState<"write" | "preview">("write");

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Conversions for date pickers
  const toLocalDatetimeString = (dateObj: Date) => {
    const pad = (num: number) => String(num).padStart(2, "0");
    const year = dateObj.getFullYear();
    const month = pad(dateObj.getMonth() + 1);
    const day = pad(dateObj.getDate());
    const hours = pad(dateObj.getHours());
    const minutes = pad(dateObj.getMinutes());
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const generateTicketNumber = (dateTimeStr: string) => {
    const d = dateTimeStr ? new Date(dateTimeStr) : new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const prefix = `HDT-${year}${month}${day}-`;
    
    // Count how many current tickets have the same date prefix
    const existingOnSameDay = tickets.filter(t => t.ticketNumber && t.ticketNumber.startsWith(prefix));
    const nextSeq = existingOnSameDay.length + 1;
    const seqStr = String(nextSeq).padStart(4, "0");
    return `${prefix}${seqStr}`;
  };

  const formatTicketDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      const pad = (num: number) => String(num).padStart(2, "0");
      const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agt", "Sep", "Okt", "Nov", "Des"];
      const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
      const dayName = days[d.getDay()];
      return `${dayName}, ${pad(d.getDate())} ${months[d.getMonth()]} ${d.getFullYear()} pkl ${pad(d.getHours())}:${pad(d.getMinutes())}`;
    } catch (err) {
      return dateStr;
    }
  };

  // Pre-fill initial form values (Resetting all defaults per user instruction to avoid pre-population errors)
  const handleOpenNew = () => {
    const nowStr = toLocalDatetimeString(new Date());
    setProjectName(isUserScoped ? (currentUser?.siteTugas || "") : "");
    setReporterName("");
    setUnit("");
    setReportType("");
    setCategory("");
    setTitle("");
    setDescription("");
    setStatus("Open");
    setPriority("");
    
    // Auto-generations & reset
    setCustomCreatedAt(nowStr);
    setTicketNumber(generateTicketNumber(nowStr));
    setFileUrl("");
    setFileName("");
    setActiveEditorTab("write");
    setIsEditing(false);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (tk: Ticket) => {
    const tkDate = tk.createdAt ? new Date(tk.createdAt) : new Date();
    const localDt = toLocalDatetimeString(tkDate);

    setProjectName(tk.projectName || "");
    setReporterName(tk.reporterName || "");
    setUnit(tk.unit || "");
    setReportType(tk.reportType || "");
    setCategory(tk.category || "");
    setTitle(tk.title || "");
    setDescription(tk.description || "");
    setStatus(tk.status || "");
    setPriority(tk.priority || "");
    setEditId(tk.id);

    // Form assignments
    setCustomCreatedAt(localDt);
    setTicketNumber(tk.ticketNumber || generateTicketNumber(localDt));
    setFileUrl(tk.fileUrl || "");
    setFileName(tk.fileName || "");
    setActiveEditorTab("write");
    setIsEditing(true);
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName) {
      alert("Silakan pilih Lokasi Site / Rumah Sakit terlebih dahulu!");
      return;
    }
    if (!customCreatedAt) {
      alert("Tanggal Buka Tiket wajib diisi!");
      return;
    }
    if (!reportType) {
      alert("Silakan pilih Jenis Laporan terlebih dahulu!");
      return;
    }
    if (!category) {
      alert("Silakan pilih Kategori Laporan terlebih dahulu!");
      return;
    }
    if (!reporterName.trim()) {
      alert("Nama Pelapor RS / User wajib diisi!");
      return;
    }
    if (!unit.trim()) {
      alert("Unit / Bagian Pelapor wajib diisi!");
      return;
    }
    if (!status) {
      alert("Silakan pilih Status terlebih dahulu!");
      return;
    }
    if (!priority) {
      alert("Silakan pilih Prioritas terlebih dahulu!");
      return;
    }
    if (!title.trim()) {
      alert("Judul Laporan Singkat wajib diisi!");
      return;
    }

    const finalCreatedAt = customCreatedAt ? new Date(customCreatedAt).toISOString() : new Date().toISOString();

    const payload: Partial<Ticket> = {
      projectName,
      reporterName,
      unit,
      reportType: reportType as any,
      category,
      title,
      description,
      status,
      priority,
      ticketNumber,
      createdAt: finalCreatedAt,
      fileUrl,
      fileName
    };

    if (isEditing) {
      await onUpdateTicket(editId, payload);
    } else {
      await onAddTicket(payload);
    }
    setIsFormOpen(false);
  };

  // Follow up/Penyelesaian Button actions
  const handleOpenFollowUp = (tk: Ticket) => {
    setFollowUpTicket(tk);
    if (tk.status === "Open" || !tk.status) {
      setFollowUpStatus("In Progress");
    } else {
      setFollowUpStatus("Solved");
    }
    setFollowUpNotes("");
    setIsFollowUpOpen(true);
  };

  const handleSubmitFollowUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!followUpTicket) return;
    if (!followUpStatus) {
      alert("Silakan pilih Status Baru!");
      return;
    }
    if (!followUpNotes.trim()) {
      alert("Catatan follow up / penyelesaian wajib diisi!");
      return;
    }

    const now = new Date();
    const timestampStr = formatTicketDate(now.toISOString());
    const operatorName = currentUser?.name || currentUser?.username || "Petugas";

    const statusLabel = followUpStatus === "Solved" ? "Solved (Selesai)" : followUpStatus === "Closed" ? "Closed (Terkunci Selesai)" : "In Progress (Dalam Penindakan)";
    const followUpBlock = `\n\n---\n**[Follow Up / Penyelesaian]**\n* **Status Baru**: \`${statusLabel}\`\n* **Oleh**: ${operatorName} (${timestampStr})\n* **Catat Tindakan**: ${followUpNotes.trim()}`;

    const updatedDescription = (followUpTicket.description || "") + followUpBlock;
    const updatedStatus = followUpStatus;

    try {
      await onUpdateTicket(followUpTicket.id, {
        status: updatedStatus,
        description: updatedDescription
      });
      setIsFollowUpOpen(false);
      setFollowUpTicket(null);
      // Auto-expand this ticket to let user view the appended action immediately
      setExpandedTicketId(followUpTicket.id);
    } catch (err: any) {
      alert(`Gagal menyimpan follow up tiket: ${err.message}`);
    }
  };

  const handleTransitionStatus = async (tk: Ticket, newStatus: string) => {
    const now = new Date();
    const timestampStr = formatTicketDate(now.toISOString());
    const operatorName = currentUser?.name || currentUser?.username || "Petugas";

    let followUpBlock = "";
    if (newStatus === "Closed") {
      followUpBlock = `\n\n---\n**[Closed Ticket]**\n* **Status Berubah**: \`Closed (Terkunci Selesai)\`\n* **Oleh**: ${operatorName} (${timestampStr})`;
    } else if (newStatus === "Open" || newStatus === "In Progress") {
      followUpBlock = `\n\n---\n**[Reopen Ticket]**\n* **Status Berubah**: \`Reopened -> ${newStatus}\`\n* **Oleh**: ${operatorName} (${timestampStr})`;
    }

    const updatedDescription = (tk.description || "") + followUpBlock;

    try {
      await onUpdateTicket(tk.id, {
        status: newStatus,
        description: updatedDescription
      });
      // Keep expanded
      setExpandedTicketId(tk.id);
    } catch (err: any) {
      alert(`Gagal mengubah status tiket: ${err.message}`);
    }
  };

  // File drag & drop or click uploads
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert("Ukuran file lampiran terlalu besar (Maks 10MB)!");
      return;
    }

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setFileUrl(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveFile = () => {
    setFileName("");
    setFileUrl("");
  };

  // Rich formatted tools insertion
  const insertFormat = (prefix: string, suffix: string = "") => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selectedText = text.substring(start, end);
    const replacement = prefix + selectedText + suffix;

    setDescription(text.substring(0, start) + replacement + text.substring(end));

    setTimeout(() => {
      textarea.focus();
      const newPos = start + prefix.length + selectedText.length + suffix.length;
      textarea.setSelectionRange(newPos, newPos);
    }, 10);
  };

  const insertTableTemplate = () => {
    const template = `\n| No | Keterangan Masalah | Investigasi Lapangan |\n|---|---|---|\n| 1 | Kendala blank screen saat loading | Server web butuh restart service |\n| 2 | Resep elektronik lambat dimuat | Indeks tabel basis data perlu ditambah |\n`;
    insertFormat(template);
  };

  // Markdown Custom Compiler
  const parseMarkdownToHtml = (markdown: string): string => {
    if (!markdown) return "";
    let html = markdown
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    // Bold **text**
    html = html.replace(/\*\*(.*?)\*\*/g, "<strong class='font-black text-slate-900 border-b border-indigo-200/50 dark:text-white dark:border-slate-800'>$1</strong>");

    // Italic *text*
    html = html.replace(/\*(.*?)\*/g, "<em class='italic text-slate-850 dark:text-indigo-200'>$1</em>");

    // Underline __text__ or <u>text</u>
    html = html.replace(/__(.*?)__/g, "<span class='underline decoration-indigo-500 font-bold'>$1</span>");
    html = html.replace(/&lt;u&gt;(.*?)&lt;\/u&gt;/g, "<span class='underline decoration-indigo-500 font-bold'>$1</span>");

    // Strikethrough ~~text~~
    html = html.replace(/~~(.*?)~~/g, "<span class='line-through text-slate-400'>$1</span>");

    // Highlight ==text==
    html = html.replace(/==(.*?)==/g, "<mark class='bg-amber-100 dark:bg-amber-950/70 border border-amber-350 dark:border-amber-900 text-amber-900 dark:text-amber-300 px-1 rounded font-bold'>$1</mark>");

    // Inline code `code`
    html = html.replace(/`(.*?)`/g, "<code class='bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-rose-500 font-mono text-[11px] font-semibold border border-slate-200 dark:border-slate-700'>$1</code>");

    // Bullet / Number/ Quote block lists
    const lines = html.split("\n");
    let inList = false;
    let inOrderedList = false;
    const processedLines = lines.map(line => {
      const trimmed = line.trim();
      
      // Quotes start with &gt;
      if (trimmed.startsWith("&gt; ") || trimmed.startsWith("> ")) {
        const content = trimmed.replace(/^(&gt;|>)\s?/, "");
        return `<div class="bg-indigo-50/50 dark:bg-indigo-950/15 border-l-4 border-indigo-500 p-2.5 my-2 rounded-r-lg font-semibold text-slate-650 dark:text-slate-300">${content}</div>`;
      }

      // Bullet List
      if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
        const content = trimmed.slice(2);
        let prefix = "";
        if (!inList) {
          inList = true;
          prefix = "<ul class='list-disc pl-5 my-2 space-y-1 bg-slate-50 dark:bg-slate-950/40 p-2.5 rounded-lg border border-slate-100 dark:border-slate-850'>";
        }
        return prefix + `<li class="text-slate-700 dark:text-slate-300">${content}</li>`;
      } else {
        let suffix = "";
        if (inList) {
          inList = false;
          suffix = "</ul>";
        }

        // Ordered List (1. , 2. )
        if (/^\d+\.\s(.*)/.test(trimmed)) {
          const content = trimmed.replace(/^\d+\.\s/, "");
          let oprefix = "";
          if (!inOrderedList) {
            inOrderedList = true;
            oprefix = "<ol class='list-decimal pl-5 my-2 space-y-1 bg-slate-50 dark:bg-slate-950/40 p-2.5 rounded-lg border border-slate-100 dark:border-slate-850'>";
          }
          return oprefix + `<li class="text-slate-700 dark:text-slate-300">${content}</li>`;
        } else {
          let osuffix = "";
          if (inOrderedList) {
            inOrderedList = false;
            osuffix = "</ol>";
          }
          return suffix + osuffix + line;
        }
      }
    });

    if (inList) {
      processedLines[processedLines.length - 1] += "</ul>";
    }
    if (inOrderedList) {
      processedLines[processedLines.length - 1] += "</ol>";
    }
    html = processedLines.join("\n");

    // Simple markdown table parser
    const linesForTable = html.split("\n");
    let inTable = false;
    let tableHeaders: string[] = [];
    let tableRows: string[][] = [];
    const processedLinesTable = linesForTable.map(line => {
      const trimmed = line.trim();
      if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
        const cells = trimmed.split("|").slice(1, -1).map(c => c.trim());
        if (cells.every(c => /^:-*|-*:-*|-*:$/.test(c) || c === "---" || c === "--" || c === "-")) {
          return "";
        }
        if (!inTable) {
          inTable = true;
          tableHeaders = cells;
          return "TABLE_HEADER_PLACEHOLDER";
        } else {
          tableRows.push(cells);
          return "";
        }
      } else {
        if (inTable) {
          inTable = false;
          const headerHtml = `<thead class='bg-indigo-55/70 dark:bg-slate-800 text-indigo-950 dark:text-slate-100 font-bold text-[10px] uppercase tracking-wider'><tr>${tableHeaders.map(h => `<th class='border border-slate-250 dark:border-slate-700 px-3 py-2 text-left'>${h}</th>`).join("")}</tr></thead>`;
          const bodyHtml = `<tbody class='divide-y divide-slate-100 dark:divide-slate-850 text-slate-700 dark:text-slate-300'>${tableRows.map((row, rIdx) => `<tr class='${rIdx % 2 === 0 ? "bg-white dark:bg-slate-900/30" : "bg-slate-50/50 dark:bg-slate-900/60"}'>${row.map(c => `<td class='border border-slate-200 dark:border-slate-850 px-3 py-1.5'>${c}</td>`).join("")}</tr>`).join("")}</tbody>`;
          tableHeaders = [];
          tableRows = [];
          return `<div class='overflow-x-auto my-3 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs'><table class='min-w-full border-collapse text-[11px]'>${headerHtml}${bodyHtml}</table></div>` + line;
        }
        return line;
      }
    });

    if (inTable) {
      const headerHtml = `<thead class='bg-indigo-55/70 dark:bg-slate-800 text-indigo-950 dark:text-slate-100 font-bold text-[10px] uppercase tracking-wider'><tr>${tableHeaders.map(h => `<th class='border border-slate-250 dark:border-slate-700 px-3 py-2 text-left'>${h}</th>`).join("")}</tr></thead>`;
      const bodyHtml = `<tbody class='divide-y divide-slate-100 dark:divide-slate-850 text-slate-700 dark:text-slate-300'>${tableRows.map((row, rIdx) => `<tr class='${rIdx % 2 === 0 ? "bg-white dark:bg-slate-900/30" : "bg-slate-50/50 dark:bg-slate-900/60"}'>${row.map(c => `<td class='border border-slate-200 dark:border-slate-850 px-3 py-1.5'>${c}</td>`).join("")}</tr>`).join("")}</tbody>`;
      processedLinesTable[processedLinesTable.length - 1] += `<div class='overflow-x-auto my-3 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs'><table class='min-w-full border-collapse text-[11px]'>${headerHtml}${bodyHtml}</table></div>`;
    }

    html = processedLinesTable.filter(l => l !== "TABLE_HEADER_PLACEHOLDER").join("\n");
    return html.replace(/\n/g, "<br />");
  };

  const ticketCategories = settings?.kategoriLaporan
    ? settings.kategoriLaporan.filter((x: any) => x.active).map((x: any) => x.value)
    : [
        "Software/SIMRS",
        "Hardware/PC",
        "Network/Internet",
        "Peripheral/Printer",
        "Access/Account"
      ];

  const reportTypes = settings?.jenisLaporan
    ? settings.jenisLaporan.filter((x: any) => x.active).map((x: any) => x.value)
    : [
        "Incident",
        "Request"
      ];

  // Metric Calculation helper
  const total = tickets.length;
  const openCount = tickets.filter(t => t.status === "Open").length;
  const progressCount = tickets.filter(t => t.status === "In Progress").length;
  const solvedCount = tickets.filter(t => t.status === "Resolved" || t.status === "Solved").length;
  const incidentCount = tickets.filter(t => t.reportType === "Incident").length;
  const requestCount = tickets.filter(t => t.reportType === "Request").length;

  const siteList = clients.map(c => c.namaRS);
  const allRefs = Array.from(new Set([...siteList, "Global / Umum"]));

  // Global search filters
  const filteredTickets = tickets.filter(t => {
    const matchesSearch = 
      t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.reporterName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.unit.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.category && t.category.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (t.ticketNumber && t.ticketNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (t.description && t.description.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesProject = !filterProject || t.projectName === filterProject;
    const matchesType = !filterType || t.reportType === filterType;
    const matchesStatus = !filterStatus || 
      t.status === filterStatus || 
      (filterStatus === "Solved" && t.status === "Resolved") ||
      (filterStatus === "Resolved" && t.status === "Solved");
    const matchesCategory = !filterCategory || t.category === filterCategory;

    return matchesSearch && matchesProject && matchesType && matchesStatus && matchesCategory;
  });

  return (
    <div className="space-y-6 animate-fadeIn font-sans pb-10" id="tickets-view-container">
      
      {/* Tab/Flow conditional rendering */}
      {!isFormOpen ? (
        <>
          {/* Header section */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center gap-2">
                <LifeBuoy className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                <h1 className="text-xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Troubleshoot & Helpdesk Center</h1>
              </div>
              <p className="text-xs text-slate-500 mt-1">Pencatatan masalah harian, insiden, atau permintaan operasional langsung dari representatif RS & client.</p>
            </div>

            {currentUser?.role !== "Client" && (
              <button
                onClick={handleOpenNew}
                className="px-4.5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold rounded-xl flex items-center gap-1.5 shadow-md hover:shadow-lg hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Buka Tiket Troubleshoot
              </button>
            )}
          </div>

          {/* Metrics Panel */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-500 flex items-center justify-center shrink-0">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-black">Total Kasus</p>
                <p className="text-lg font-black text-slate-800 dark:text-white">{total}</p>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-amber-50 dark:bg-amber-950/20 text-amber-500 flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-black">Open</p>
                <p className="text-lg font-black text-amber-600 dark:text-amber-400">{openCount}</p>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/20 text-blue-500 flex items-center justify-center shrink-0">
                <SlidersHorizontal className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-black">In Progress</p>
                <p className="text-lg font-black text-blue-600 dark:text-blue-400">{progressCount}</p>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500 flex items-center justify-center shrink-0">
                <CheckCircle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-black">Solved</p>
                <p className="text-lg font-black text-emerald-600 dark:text-emerald-400">{solvedCount}</p>
              </div>
            </div>

            <div className="col-span-2 lg:col-span-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-[10px] text-slate-400 uppercase font-black">Kategori Kasus</p>
                <div className="flex gap-3 text-xs">
                  <span className="text-rose-500 font-bold font-mono">Incident: {incidentCount}</span>
                  <span className="text-indigo-500 font-bold font-mono">Request: {requestCount}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Filtering Panel */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-wrap gap-3 items-center justify-between">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Cari No Tiket, Isu, Pelapor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-1.5 w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-semibold text-slate-800 dark:text-slate-100"
              />
            </div>

            <div className="flex flex-wrap gap-2.5 items-center text-xs">
              {isUserScoped ? (
                <div className="bg-slate-100 dark:bg-slate-800 border border-slate-205 dark:border-slate-700 py-1.5 px-3 rounded-lg text-slate-500 dark:text-slate-400 font-bold flex items-center gap-1 opacity-90 select-none">
                  <span className="text-[10px] uppercase font-black tracking-wider text-slate-400">Lokasi:</span>
                  <span>{userSite}</span>
                </div>
              ) : (
                <select
                  value={filterProject}
                  onChange={(e) => setFilterProject(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 py-1.5 px-3 rounded-lg text-slate-700 dark:text-slate-200 font-bold focus:border-indigo-550 focus:outline-none"
                >
                  <option value="">Semua Lokasi Site</option>
                  {allRefs.map(ref => <option key={ref} value={ref}>{ref}</option>)}
                </select>
              )}

              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 py-1.5 px-3 rounded-lg text-slate-700 dark:text-slate-200 font-bold"
              >
                <option value="">Semua Jenis Laporan</option>
                {reportTypes.map((t: string) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>

              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 py-1.5 px-3 rounded-lg text-slate-700 dark:text-slate-200 font-bold"
              >
                <option value="">Semua Kategori</option>
                {ticketCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 py-1.5 px-3 rounded-lg text-slate-700 dark:text-slate-200 font-bold"
              >
                <option value="">Semua Status</option>
                <option value="Open">Open</option>
                <option value="In Progress">In Progress</option>
                <option value="Solved">Solved</option>
              </select>
            </div>
          </div>

          {/* List Table View (Detail Ticket style) */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm animate-fadeIn">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs text-slate-705 dark:text-slate-300">
                <thead className="bg-slate-50 dark:bg-slate-950 font-extrabold border-b border-slate-200 dark:border-slate-850 text-slate-500 uppercase tracking-wider select-none text-[10px]">
                  <tr>
                    <th scope="col" className="px-5 py-3.5">No. Tiket / Tanggal</th>
                    <th scope="col" className="px-5 py-3.5">Lokasi / Unit</th>
                    <th scope="col" className="px-5 py-3.5">Pelapor & Kategori</th>
                    <th scope="col" className="px-5 py-3.5">Isu & Detail Laporan</th>
                    <th scope="col" className="px-5 py-3.5">Status / Prioritas</th>
                    <th scope="col" className="px-5 py-3.5 text-right">Detail & Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150 dark:divide-slate-850 font-medium">
                  {filteredTickets.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-20 text-slate-405 bg-white dark:bg-slate-900">
                        <LifeBuoy className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3 animate-spin md:mx-auto" />
                        <p className="text-sm font-black text-slate-705 dark:text-slate-250">Tidak ada tiket ditemukan</p>
                        <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">Coba sesuaikan kata kunci pencarian Anda atau pilih lokasi site lain.</p>
                      </td>
                    </tr>
                  ) : (
              filteredTickets.map(tk => {
                const isExpanded = expandedTicketId === tk.id;
                const isClosed = tk.status === "Closed";
                const isSolved = tk.status === "Solved" || tk.status === "Resolved";
                const canModify = (!tk.createdBy || tk.createdBy === currentUser?.username || currentUser?.role === "Administrator") && !isClosed;
                return (
                  <React.Fragment key={tk.id}>
                    {/* Main Row */}
                    <tr 
                      className={`hover:bg-slate-50/75 dark:hover:bg-slate-800/40 transition-all duration-150 cursor-pointer ${
                        isExpanded ? "bg-indigo-50/10 dark:bg-slate-850/20" : ""
                      }`}
                      onClick={() => toggleExpand(tk.id)}
                    >
                      {/* Ticket Number & Date */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                          {tk.ticketNumber ? (
                            <span className="bg-indigo-600 text-white font-extrabold text-[10px] font-mono px-2.5 py-0.5 rounded shadow-xs w-fit">
                              {tk.ticketNumber}
                            </span>
                          ) : (
                            <span className="bg-slate-100 dark:bg-slate-800 text-slate-550 px-2 py-0.5 rounded text-[10px]">
                              NO CODE
                            </span>
                          )}
                          <span className="text-[10px] text-slate-405 font-mono flex items-center gap-1 mt-0.5 font-bold">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            <span>{formatTicketDate(tk.createdAt)}</span>
                          </span>
                        </div>
                      </td>

                      {/* Location & Unit */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                          <span className="font-extrabold text-slate-900 dark:text-slate-100 max-w-[160px] truncate" title={tk.projectName}>
                            {tk.projectName}
                          </span>
                          <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5 text-[10.5px]">
                            <Building className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                            <span>{tk.unit || "-"}</span>
                          </span>
                        </div>
                      </td>

                      {/* Reporter & Category */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex flex-col gap-1.5">
                          <span className="text-slate-800 dark:text-slate-200 font-extrabold flex items-center gap-1.5">
                            <UserIcon className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                            <span>{tk.reporterName}</span>
                          </span>
                          {tk.category && (
                            <span className="bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded border border-indigo-150/40 dark:border-indigo-900/30 text-[9px] w-fit font-bold">
                              {tk.category}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Title & Report Type */}
                      <td className="px-5 py-4 max-w-[300px]">
                        <div className="flex flex-col gap-1.5">
                          <span className="font-extrabold text-slate-850 dark:text-slate-100 leading-snug line-clamp-2">
                            {tk.title}
                          </span>
                          <span className={`px-2 py-0.5 text-[9px] w-fit rounded border font-mono font-black tracking-wide ${
                            tk.reportType === "Incident" 
                              ? "bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-100/60 dark:border-rose-900/30" 
                              : "bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border-purple-100/60 dark:border-purple-900/30"
                          }`}>
                            {tk.reportType}
                          </span>
                        </div>
                      </td>

                      {/* Status & Priority */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex flex-col gap-1.5">
                          <span className={`text-[10px] font-black px-2.5 py-0.5 rounded border text-center w-fit ${
                            tk.status === "Resolved" || tk.status === "Solved" ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" :
                            tk.status === "In Progress" ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20" :
                            "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                          }`}>
                            {tk.status === "Resolved" ? "Solved" : tk.status}
                          </span>
                          <span className={`px-2 py-0.5 text-[9px] w-fit rounded border font-bold ${
                            tk.priority === "Urgent" || tk.priority === "High"
                              ? "bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/30 font-extrabold antialiased"
                              : "bg-slate-50 dark:bg-slate-850 text-slate-500 border-slate-100 dark:border-slate-800"
                          }`}>
                            {tk.priority} Priority
                          </span>
                        </div>
                      </td>

                      {/* Actions & Expand Chevron */}
                      <td className="px-5 py-4 whitespace-nowrap text-right" onClick={(e) => e.stopPropagation() /* prevent row toggle expansion triggers */}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => toggleExpand(tk.id)}
                            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-850 rounded-xl text-slate-450 hover:text-indigo-600 transition-colors cursor-pointer flex items-center justify-center border border-slate-100 dark:border-slate-800"
                            title="Lihat Detail & Deskripsi"
                          >
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4 text-indigo-600" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </button>

                          {currentUser?.role !== "Client" && (
                            <>
                              <button
                                onClick={() => handleOpenFollowUp(tk)}
                                disabled={isClosed}
                                className={`p-2 rounded-xl border border-slate-100 dark:border-slate-800 transition-colors ${
                                  isClosed
                                    ? "text-slate-200 dark:text-slate-800 cursor-not-allowed opacity-35"
                                    : "text-slate-400 hover:text-emerald-500 hover:bg-slate-150 dark:hover:bg-slate-800 cursor-pointer"
                                }`}
                                title={isClosed ? "Tiket sudah Closed (Selesai) dan terkunci" : "Tambahkan Follow up / Solusi Penyelesaian (Open -> In Progress / Solved)"}
                              >
                                <CheckSquare className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleOpenEdit(tk)}
                                disabled={!canModify}
                                className={`p-2 rounded-xl border border-slate-100 dark:border-slate-800 transition-colors ${
                                  canModify 
                                    ? "text-slate-400 hover:text-indigo-650 hover:bg-slate-150 dark:hover:bg-slate-800 cursor-pointer"
                                    : "text-slate-200 dark:text-slate-800 cursor-not-allowed opacity-35"
                                }`}
                                title={isClosed ? "Tiket sudah Closed (Selesai) dan terkunci" : (canModify ? "Edit rincian tiket" : `Hanya penginput (${tk.createdBy || "-"}) yang boleh mengedit`)}
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={async () => {
                                  if (confirm(`Hapus tiket Troubleshoot "${tk.title}" (${tk.ticketNumber || ""})?`)) {
                                    await onDeleteTicket(tk.id);
                                  }
                                }}
                                disabled={!canModify}
                                className={`p-2 rounded-xl border border-slate-100 dark:border-slate-800 transition-colors ${
                                  canModify 
                                    ? "text-slate-400 hover:text-red-500 hover:bg-slate-150 dark:hover:bg-slate-800 cursor-pointer"
                                    : "text-slate-200 dark:text-slate-800 cursor-not-allowed opacity-35"
                                }`}
                                title={isClosed ? "Tiket sudah Closed (Selesai) dan terkunci" : (canModify ? "Hapus Tiket" : `Hanya penginput (${tk.createdBy || "-"}) yang boleh menghapus`)}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>

                    {/* Expanded detail display (analogy of detail_ticket.html) */}
                    <AnimatePresence>
                      {isExpanded && (
                        <tr className="bg-slate-50/50 dark:bg-slate-950/20 border-b border-slate-200/60 dark:border-slate-850">
                          <td colSpan={6} className="p-5.5 md:p-7 text-slate-800 dark:text-slate-200">
                            <motion.div 
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              className="grid grid-cols-1 lg:grid-cols-12 gap-6"
                            >
                              {/* Left Area: Subject & Markdown description */}
                              <div className="lg:col-span-8 space-y-4">
                                <div className="flex items-center gap-2 border-b border-slate-200/60 dark:border-slate-800 pb-2">
                                  <FileText className="w-4 h-4 text-indigo-500" />
                                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Detail Rincian Deskripsi Masalah</span>
                                </div>

                                <div className="space-y-2">
                                  <h4 className="text-sm font-black text-slate-850 dark:text-slate-100 leading-snug">
                                    {tk.title}
                                  </h4>
                                  <div className="bg-white dark:bg-slate-950 p-5 rounded-2xl border border-slate-200 dark:border-slate-850 shadow-xs min-h-[120px] font-semibold leading-relaxed text-xs text-slate-705 dark:text-slate-350 prose dark:prose-invert max-w-full overflow-x-auto">
                                    {tk.description ? (
                                      <div 
                                        dangerouslySetInnerHTML={{ __html: parseMarkdownToHtml(tk.description) }}
                                        className="space-y-1.5 break-words outline-none"
                                      />
                                    ) : (
                                      <p className="text-slate-400 italic font-medium">Tidak ada deskripsi detail tambahan.</p>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Right Area: Attachment download / viewer & audit details */}
                              <div className="lg:col-span-4 space-y-4">
                                <div className="flex items-center gap-2 border-b border-slate-200/60 dark:border-slate-800 pb-2">
                                  <Paperclip className="w-4 h-4 text-emerald-500" />
                                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Bukti Screenshot / Lampiran File</span>
                                </div>

                                {tk.fileUrl ? (
                                  <div className="bg-white dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-850 shadow-xs">
                                    {tk.fileUrl.startsWith("data:image/") ? (
                                      <div className="space-y-2.5">
                                        <div className="rounded-xl overflow-hidden border border-slate-150 dark:border-slate-850 bg-slate-50 dark:bg-slate-900">
                                          <img 
                                            src={tk.fileUrl} 
                                            alt={tk.fileName || "Screenshot Lampiran"} 
                                            className="max-h-44 w-full object-contain cursor-pointer hover:opacity-95 transition-opacity"
                                            onClick={() => {
                                              const windowOpen = window.open("");
                                              if (windowOpen) windowOpen.document.write(`<img src="${tk.fileUrl}" style="max-width:100%; border-radius:8px;" />`);
                                            }}
                                          />
                                        </div>
                                        <div className="flex items-center justify-between text-[11px] font-extrabold text-slate-500">
                                          <span className="truncate max-w-[150px] font-mono">{tk.fileName || "attachment.png"}</span>
                                          <a 
                                            href={tk.fileUrl} 
                                            download={tk.fileName || "attachment.png"} 
                                            className="text-indigo-650 dark:text-indigo-400 hover:underline inline-flex items-center"
                                          >
                                            Download File
                                          </a>
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="flex items-center justify-between gap-3 p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-150 dark:border-slate-800 text-xs">
                                        <div className="flex items-center gap-2 truncate">
                                          <FileText className="w-4 h-4 text-emerald-500 shrink-0" />
                                          <span className="text-slate-700 dark:text-slate-300 truncate font-semibold">{tk.fileName || "dokumen_bukti.pdf"}</span>
                                        </div>
                                        <a 
                                          href={tk.fileUrl} 
                                          download={tk.fileName || "dokumen_bukti.pdf"} 
                                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] rounded-lg font-black transition-colors whitespace-nowrap shadow-xs"
                                        >
                                          Unduh
                                        </a>
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <div className="bg-white dark:bg-slate-950 p-5 rounded-2xl border border-slate-200 dark:border-slate-850 text-center text-slate-400 text-[11px] italic font-semibold">
                                    Tidak ada file bukti terlampir.
                                  </div>
                                )}

                                {/* Submitter & Admin info */}
                                <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-200/60 dark:border-slate-800/80 text-[11px] space-y-2.5 font-semibold text-slate-500 dark:text-slate-400 shadow-xs">
                                  <div className="flex items-center justify-between">
                                    <span>Status Pengerjaan:</span>
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                                      tk.status === "Closed" ? "bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400" :
                                      tk.status === "Resolved" || tk.status === "Solved" ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400" :
                                      tk.status === "In Progress" ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400" :
                                      "bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400"
                                    }`}>{tk.status}</span>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <span>Skala Prioritas:</span>
                                    <span className="text-slate-800 dark:text-slate-200 font-bold">{tk.priority}</span>
                                  </div>
                                  <div className="flex items-center justify-between border-t border-slate-200/50 dark:border-slate-800 pt-2 pb-1">
                                    <span>Disubmit Oleh:</span>
                                    <span className="text-indigo-600 dark:text-indigo-400 font-black">{tk.createdBy || "System/Anonim"}</span>
                                  </div>
                                  {currentUser?.role !== "Client" && (
                                    <div className="space-y-2 mt-2 pt-2 border-t border-slate-200/50 dark:border-slate-800">
                                      {!isClosed && (
                                        <button
                                          type="button"
                                          onClick={() => handleOpenFollowUp(tk)}
                                          className="w-full py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white text-[10.5px] font-black rounded-lg transition-all shadow-xs flex items-center justify-center gap-1 cursor-pointer"
                                        >
                                          <CheckSquare className="w-3.5 h-3.5" />
                                          Tulis Follow Up / Penyelesaian
                                        </button>
                                      )}

                                      {isSolved && !isClosed && (
                                        <div className="grid grid-cols-2 gap-2">
                                          <button
                                            type="button"
                                            onClick={() => handleTransitionStatus(tk, "Closed")}
                                            className="py-1.5 px-3 bg-red-600 hover:bg-red-700 text-white text-[10px] font-black rounded-lg transition-all shadow-xs flex items-center justify-center gap-1 cursor-pointer font-mono uppercase tracking-tight"
                                            title="Tandai tiket ini sebagai Closed (Terkunci Selesai)"
                                          >
                                            Close Ticket
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => handleTransitionStatus(tk, "Open")}
                                            className="py-1.5 px-3 bg-amber-500 hover:bg-amber-600 text-white text-[10px] font-black rounded-lg transition-all shadow-xs flex items-center justify-center gap-1 cursor-pointer font-mono uppercase tracking-tight"
                                            title="Buka kembali tiket ini ke status Open"
                                          >
                                            Reopen Ticket
                                          </button>
                                        </div>
                                      )}

                                      {isClosed && (
                                        <div className="space-y-2">
                                          <div className="py-2 px-3 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 text-center text-[10px] font-black rounded-lg border border-red-200/50 dark:border-red-900/30">
                                            🔒 TIKET CLOSED (TERKUNCI)
                                          </div>
                                          <button
                                            type="button"
                                            onClick={() => handleTransitionStatus(tk, "Open")}
                                            className="w-full py-1.5 px-3 bg-amber-500 hover:bg-amber-600 text-white text-[10px] font-black rounded-lg transition-all shadow-xs flex items-center justify-center gap-1 cursor-pointer font-mono uppercase tracking-tight"
                                            title="Buka kembali tiket ini ke status Open"
                                          >
                                            Reopen Ticket
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </motion.div>
                          </td>
                        </tr>
                      )}
                    </AnimatePresence>
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  </>
      ) : (
        /* =================== DEDICATED INLINE FORM MODULE =================== */
        <motion.div 
          initial={{ opacity: 0, y: 15 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 md:p-8 space-y-6 shadow-md"
        >
          {/* Header & Back Button */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-850 pb-4">
            <div className="flex items-center gap-3">
              <button 
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="p-2 border border-slate-250 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-300 transition-colors cursor-pointer flex items-center justify-center"
                title="Kembali ke daftar tiket"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <h2 className="text-lg font-black text-slate-850 dark:text-white leading-tight">
                  {isEditing ? "Edit Rincian Tiket Troubleshoot" : "Buka Tiket Troubleshoot Baru"}
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">Catat isu, kendala teknis atau rekap rekam medis langsung ke sistem helpdesk.</p>
              </div>
            </div>

            {/* Generated ticket code card display */}
            <div className="bg-slate-50 dark:bg-slate-950 p-2.5 px-4 border border-slate-150 dark:border-slate-850 rounded-xl flex items-center gap-2.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nomor Tiket Tergenerate:</span>
              <span className="text-xs font-black font-mono text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-1 rounded-md border border-indigo-100 dark:border-indigo-900/30">
                {ticketNumber}
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 text-xs font-semibold text-slate-700 dark:text-slate-300">
            {/* Split screen content structure */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
              
              {/* Left Column (Metadata Inputs) */}
              <div className="lg:col-span-5 space-y-4">
                <h3 className="text-[11px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-850 pb-1.5 flex items-center gap-1.5">
                  <UserIcon className="w-3.5 h-3.5" />
                  <span>Informasi Pelapor & Tiket</span>
                </h3>

                {/* Site selector in Form based on scoped flag */}
                {isUserScoped ? (
                  <div className="bg-slate-50 dark:bg-slate-950/40 p-3 border border-slate-150 dark:border-slate-850 rounded-xl text-[11px] text-slate-500 leading-normal font-medium">
                    Site Otomatis Terhubung: <span className="font-extrabold text-slate-800 dark:text-indigo-300">{projectName || userSite}</span>
                  </div>
                ) : (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-555 uppercase tracking-widest">Lokasi Site / Rumah Sakit *</label>
                    <select
                      value={projectName}
                      onChange={(e) => setProjectName(e.target.value)}
                      className="bg-slate-50 dark:bg-slate-950 border border-slate-205 dark:border-slate-800 py-2.5 px-3 rounded-xl text-slate-850 dark:text-slate-100 placeholder-slate-400 font-bold focus:border-indigo-500"
                    >
                      <option value="">-- Pilih Lokasi Site --</option>
                      {clients.map(cl => (
                        <option key={cl.id} value={cl.namaRS}>{cl.namaRS}</option>
                      ))}
                      <option value="Global / Umum">Global / Umum</option>
                    </select>
                  </div>
                )}

                {/* Custom Datetime Input - Level of hours & minutes (Requirement 6) */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Tanggal Buka Tiket (Jam & Menit) *</label>
                  <div className="relative">
                    <input
                      type="datetime-local"
                      required
                      value={customCreatedAt}
                      onChange={(e) => {
                        setCustomCreatedAt(e.target.value);
                        // Re-generate ticket number prefix matching date selected if not editing
                        if (!isEditing) {
                          setTicketNumber(generateTicketNumber(e.target.value));
                        }
                      }}
                      className="bg-slate-50 dark:bg-slate-950 border border-slate-205 dark:border-slate-800 w-full py-2.5 px-3 rounded-xl text-slate-850 dark:text-slate-100 focus:border-indigo-500 transition-all font-bold"
                    />
                  </div>
                </div>

                {/* Report Type selector */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-550 uppercase tracking-widest">Jenis Laporan *</label>
                  <select
                    value={reportType}
                    onChange={(e) => setReportType(e.target.value)}
                    className="bg-slate-50 dark:bg-slate-950 border border-slate-205 dark:border-slate-800 py-2.5 px-3 rounded-xl text-slate-850 dark:text-slate-200 focus:border-indigo-500 transition-all font-bold"
                  >
                    <option value="">-- Pilih Jenis Laporan --</option>
                    {reportTypes.map((t: string) => (
                      <option key={t} value={t}>{t === "Incident" ? "Incident (Isu/Error/Kendala)" : t === "Request" ? "Request (Permintaan Fitur/Data)" : t}</option>
                    ))}
                  </select>
                </div>

                {/* Category selector */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-550 uppercase tracking-widest">Kategori Laporan *</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="bg-slate-50 dark:bg-slate-950 border border-slate-205 dark:border-slate-800 py-2.5 px-3 rounded-xl text-slate-850 dark:text-slate-200 focus:border-indigo-500 transition-all font-bold"
                  >
                    <option value="">-- Pilih Kategori Laporan --</option>
                    {ticketCategories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                {/* Reporter Name (Indonesian prompt) */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-550 uppercase tracking-widest">Nama Pelapor RS / User *</label>
                  <input
                    type="text"
                    required
                    value={reporterName}
                    onChange={(e) => setReporterName(e.target.value)}
                    placeholder="Contoh: dr. Setiawan / Pak Budi PIC RS"
                    className="bg-slate-50 dark:bg-slate-950 border border-slate-205 dark:border-slate-800 py-2.5 px-3 rounded-xl text-slate-850 dark:text-slate-100 placeholder-slate-400 font-bold focus:border-indigo-500"
                  />
                </div>

                {/* Reporter Unit */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-550 uppercase tracking-widest">Unit / Bagian Pelapor *</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Rekam Medis / Poli Anak / UGD"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="bg-slate-50 dark:bg-slate-950 border border-slate-205 dark:border-slate-800 py-2.5 px-3 rounded-xl text-slate-850 dark:text-slate-100 placeholder-slate-400 font-bold focus:border-indigo-500"
                  />
                </div>

                {/* Split grid for Status & Priority */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-550 uppercase tracking-widest">Status *</label>
                    <select
                      value={status === "Resolved" ? "Solved" : status}
                      disabled={!isEditing}
                      onChange={(e) => setStatus(e.target.value)}
                      className="bg-slate-50 dark:bg-slate-950 border border-slate-205 dark:border-slate-800 py-2 px-2.5 rounded-xl text-slate-850 dark:text-slate-200 font-bold disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      <option value="">-- Pilih Status --</option>
                      <option value="Open">Open</option>
                      {isEditing && (
                        <>
                          <option value="In Progress">In Progress</option>
                          <option value="Solved">Solved</option>
                          <option value="Closed">Closed</option>
                        </>
                      )}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-550 uppercase tracking-widest">Prioritas *</label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value)}
                      className="bg-slate-50 dark:bg-slate-950 border border-slate-205 dark:border-slate-800 py-2 px-2.5 rounded-xl text-slate-850 dark:text-slate-200 font-bold"
                    >
                      <option value="">-- Pilih Prioritas --</option>
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Urgent">Urgent</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Right Column (Desc, Rich Toolbar, File Upload) */}
              <div className="lg:col-span-7 space-y-4">
                <h3 className="text-[11px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-850 pb-1.5 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" />
                  <span>Isi & Detail Masalah</span>
                </h3>

                {/* Brief Title */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-550 uppercase tracking-widest">Judul Laporan Singkat *</label>
                  <input
                    type="text"
                    required
                    placeholder="Sebutkan ringkasan isu, contoh: Gagal simpan rujukan BPJS"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="bg-slate-50 dark:bg-slate-950 border border-slate-205 dark:border-slate-800 py-2.5 px-3.5 rounded-xl text-slate-850 dark:text-slate-100 placeholder-slate-400 font-extrabold focus:border-indigo-500"
                  />
                </div>

                {/* Interactive rich editor section (Requirement 5) */}
                <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-950 shadow-xs">
                  
                  {/* Toolbar & tab controls combined */}
                  <div className="bg-slate-50 dark:bg-slate-900 px-3 py-2 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
                    {/* Rich text formatting tools */}
                    <div className="flex flex-wrap items-center gap-1">
                      <button
                        type="button"
                        onClick={() => insertFormat("**", "**")}
                        className="p-1 px-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded text-slate-700 dark:text-slate-300 transition-colors font-bold flex items-center gap-0.5 text-[11px] cursor-pointer"
                        title="Tebalkan Tulisan (Bold)"
                      >
                        <Bold className="w-3.5 h-3.5" />
                        <span className="sr-only">Bold</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => insertFormat("*", "*")}
                        className="p-1 px-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded text-slate-700 dark:text-slate-300 transition-colors italic flex items-center gap-0.5 text-[11px] cursor-pointer"
                        title="Miringkan Tulisan (Italic)"
                      >
                        <Italic className="w-3.5 h-3.5" />
                        <span className="sr-only">Italic</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => insertFormat("__", "__")}
                        className="p-1 px-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded text-slate-700 dark:text-slate-300 transition-colors flex items-center gap-0.5 text-[11px] cursor-pointer"
                        title="Garis Bawah (Underline)"
                      >
                        <Underline className="w-3.5 h-3.5 text-zinc-800 dark:text-zinc-200" />
                        <span className="sr-only">Underline</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => insertFormat("~~", "~~")}
                        className="p-1 px-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded text-slate-700 dark:text-slate-300 transition-colors flex items-center gap-0.5 text-[11px] cursor-pointer"
                        title="Coret Tulisan (Strikethrough)"
                      >
                        <Strikethrough className="w-3.5 h-3.5" />
                        <span className="sr-only">Strikethrough</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => insertFormat("==", "==")}
                        className="p-1 px-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded text-amber-600 transition-colors flex items-center gap-0.5 text-[11px] cursor-pointer font-bold"
                        title="Tandai Tulisan (Highlight)"
                      >
                        <Highlighter className="w-3.5 h-3.5" />
                        <span className="sr-only">Highlight</span>
                      </button>
                      <span className="text-slate-300 dark:text-slate-700 mx-0.5">|</span>
                      <button
                        type="button"
                        onClick={() => insertFormat("- ")}
                        className="p-1 px-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded text-slate-700 dark:text-slate-300 transition-colors flex items-center gap-0.5 text-[11px] cursor-pointer"
                        title="Daftar Bulatan (Bullet List)"
                      >
                        <List className="w-3.5 h-3.5" />
                        <span className="sr-only">Bullet</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => insertFormat("1. ")}
                        className="p-1 px-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded text-slate-700 dark:text-slate-300 transition-colors flex items-center gap-0.5 text-[11px] cursor-pointer"
                        title="Daftar Angka (Ordered List)"
                      >
                        <ListOrdered className="w-3.5 h-3.5" />
                        <span className="sr-only">Ordered List</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => insertFormat("> ")}
                        className="p-1 px-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded text-slate-700 dark:text-slate-300 transition-colors flex items-center gap-0.5 text-[11px] cursor-pointer"
                        title="Kutipan (Blockquote)"
                      >
                        <Quote className="w-3.5 h-3.5" />
                        <span className="sr-only">Blockquote</span>
                      </button>
                      <button
                        type="button"
                        onClick={insertTableTemplate}
                        className="p-1 px-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded text-indigo-600 transition-colors flex items-center gap-1.5 text-[11.5px] cursor-pointer font-extrabold"
                        title="Sisipkan Format Tabel"
                      >
                        <Table className="w-3.5 h-3.5" />
                        <span>Tabel</span>
                      </button>
                      <span className="text-slate-300 dark:text-slate-700 mx-0.5">|</span>
                      <button
                        type="button"
                        onClick={() => insertFormat("`", "`")}
                        className="p-1 px-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded text-slate-600 dark:text-slate-400 transition-colors text-[10px] font-mono font-bold cursor-pointer"
                        title="Kode Inline"
                      >
                        &lt;/&gt;
                      </button>
                    </div>

                    {/* Editor / Preview Tabs */}
                    <div className="flex bg-slate-200 dark:bg-slate-800 rounded-lg p-0.5 text-[10px]">
                      <button
                        type="button"
                        onClick={() => setActiveEditorTab("write")}
                        className={`px-2.5 py-1 rounded-md font-bold transition-all ${
                          activeEditorTab === "write" 
                            ? "bg-white dark:bg-slate-900 text-indigo-650 dark:text-white shadow-xs" 
                            : "text-slate-500 hover:text-slate-700 dark:text-slate-450"
                        }`}
                      >
                        Tulis
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveEditorTab("preview")}
                        className={`px-2.5 py-1 rounded-md font-bold transition-all ${
                          activeEditorTab === "preview" 
                            ? "bg-white dark:bg-slate-900 text-indigo-650 dark:text-white shadow-xs" 
                            : "text-slate-500 hover:text-slate-700 dark:text-slate-450"
                        }`}
                      >
                        Pratinjau Format
                      </button>
                    </div>
                  </div>

                  {/* Input canvas vs Preview pane */}
                  {activeEditorTab === "write" ? (
                    <textarea
                      ref={textareaRef}
                      rows={5}
                      required
                      placeholder="Gunakan toolbar di atas untuk format teks tebal, miring, list poin, atau tabel audit. Tuliskan rincian langkah reproduksi isu di sini..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full bg-transparent focus:outline-none p-3.5 text-xs text-slate-800 dark:text-slate-100 min-h-[140px] resize-y placeholder-slate-400 leading-relaxed font-semibold"
                    />
                  ) : (
                    <div className="p-4 bg-slate-50/50 dark:bg-slate-950/40 text-xs text-slate-755 dark:text-slate-200 min-h-[140px] max-h-[300px] overflow-y-auto leading-relaxed border-t border-slate-50 dark:border-slate-900 font-semibold break-words">
                      {description.trim() ? (
                        <div dangerouslySetInnerHTML={{ __html: parseMarkdownToHtml(description) }} />
                      ) : (
                        <p className="italic text-slate-400">Silakan tulis deskripsi terlebih dahulu untuk melihat pratinjau format secara real-time.</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Upload Dokumen atau Gambar (Requirement 3) */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Upload Dokumen / Gambar Lampiran</label>
                  
                  {fileUrl ? (
                    /* Display File attached currently */
                    <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-2.5 truncate">
                        {fileUrl.startsWith("data:image/") ? (
                          <div className="w-12 h-12 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 shrink-0 bg-white dark:bg-slate-900">
                            <img src={fileUrl} alt="Upload Thumbnail" className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-500 flex items-center justify-center rounded-lg border border-indigo-100 dark:border-indigo-900/10 shrink-0">
                            <FileText className="w-6 h-6" />
                          </div>
                        )}
                        <div className="truncate">
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">{fileName || "lampiran_audit.pdf"}</p>
                          <p className="text-[9px] font-mono text-slate-400">File Base64 siap diunggah ke server</p>
                        </div>
                      </div>
                      
                      <button
                        type="button"
                        onClick={handleRemoveFile}
                        className="p-1 px-2.5 bg-red-50 hover:bg-red-100 dark:bg-red-950/30 text-red-600 dark:text-red-400 rounded-lg text-[10px] font-bold transition-all cursor-pointer whitespace-nowrap"
                      >
                        Hapus Lampiran
                      </button>
                    </div>
                  ) : (
                    /* Drag & click file input */
                    <div className="relative group border-2 border-dashed border-slate-250 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-400 rounded-2xl bg-slate-50/50 dark:bg-slate-950/20 p-5 transition-all text-center">
                      <input
                        type="file"
                        accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                        onChange={handleFileChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      />
                      <div className="flex flex-col items-center justify-center gap-1.5">
                        <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl group-hover:scale-105 transition-transform text-slate-500 shadow-xs">
                          <UploadCloud className="w-6 h-6 text-indigo-500" />
                        </div>
                        <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
                          Klik untuk Unggah atau Seret File ke sini
                        </p>
                        <p className="text-[10px] text-slate-450 font-medium">
                          Mendukung Gambar (PNG/JPG), PDF, atau Excel (Maks 10MB)
                        </p>
                      </div>
                    </div>
                  )}
                </div>

              </div>
            </div>

            {/* Submit Action Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-850">
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="px-5 py-2.5 border border-slate-250 dark:border-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer"
              >
                Batalkan & Kembali
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-750 text-white text-xs font-extrabold rounded-xl shadow-md hover:shadow-lg hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <FileCheck2 className="w-4 h-4" /> {isEditing ? "Simpan Perubahan Tiket" : "Terbitkan Tiket Troubleshoot"}
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* =================== FOLLOW-UP & RESOLUTION MODAL =================== */}
      <AnimatePresence>
        {isFollowUpOpen && followUpTicket && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs select-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl relative space-y-6 text-xs text-slate-700 dark:text-slate-300 font-semibold"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-850 pb-3">
                <div className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-emerald-500" />
                  <h3 className="text-sm font-black text-slate-850 dark:text-white tracking-tight">
                    Follow Up & Solusi Penyelesaian Tiket
                  </h3>
                </div>
                <button
                  onClick={() => setIsFollowUpOpen(false)}
                  className="p-1 px-1.5 hover:bg-slate-100 dark:hover:bg-slate-850 rounded text-slate-400 hover:text-slate-650 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Informational Header cards */}
              <div className="bg-slate-50 dark:bg-slate-950 p-4 border border-slate-150 dark:border-slate-850 rounded-2xl space-y-2 text-[11px] font-medium leading-relaxed">
                <div>
                  <span className="text-slate-405 font-bold uppercase tracking-widest text-[9px] block">No. Tiket / Judul Kasus</span>
                  <p className="text-slate-850 dark:text-white font-black text-xs font-mono">{followUpTicket.ticketNumber || "TCK-..."}</p>
                  <p className="text-slate-600 dark:text-slate-350 font-bold mt-1 line-clamp-1">{followUpTicket.title}</p>
                </div>
                <div className="grid grid-cols-2 gap-2 border-t border-slate-100 dark:border-slate-800 pt-2 text-[10px]">
                  <div>
                    <span className="text-slate-405 block font-bold uppercase tracking-widest text-[9px]">Nama Pelapor</span>
                    <span className="text-slate-700 dark:text-slate-300 font-bold">{followUpTicket.reporterName} ({followUpTicket.unit})</span>
                  </div>
                  <div>
                    <span className="text-slate-405 block font-bold uppercase tracking-widest text-[9px]">Status Saat Ini</span>
                    <span className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded text-[9.5px] font-black w-fit block mt-0.5">{followUpTicket.status}</span>
                  </div>
                </div>
              </div>

              {/* Follow-up Form */}
              <form onSubmit={handleSubmitFollowUp} className="space-y-4">
                {/* Updated Status Dropdown */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-550 uppercase tracking-widest">Update Status Tiket Menjadi *</label>
                  <select
                    required
                    value={followUpStatus}
                    onChange={(e) => setFollowUpStatus(e.target.value)}
                    className="bg-slate-50 dark:bg-slate-950 border border-slate-205 dark:border-slate-800 py-2.5 px-3 rounded-xl text-slate-850 dark:text-slate-100 font-bold focus:border-indigo-500"
                  >
                    <option value="">-- Pilih Status Baru --</option>
                    <option value="In Progress">In Progress (Sedang Dikerjakan/Follow Up)</option>
                    <option value="Solved">Solved (Kasus Selesai / Teratasi)</option>
                  </select>
                </div>

                {/* Follow-up Notes textarea */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-550 uppercase tracking-widest">Catatan Tindakan / Deskripsi Solusi *</label>
                  <textarea
                    rows={4}
                    required
                    value={followUpNotes}
                    onChange={(e) => setFollowUpNotes(e.target.value)}
                    placeholder="Contoh: Sudah dilakukan restart service apache pada web server, SIMRS kembali normal diakses oleh rekam medis."
                    className="bg-slate-50 dark:bg-slate-950 border border-slate-205 dark:border-slate-800 w-full py-2.5 px-3 rounded-xl text-slate-850 dark:text-slate-100 focus:border-indigo-500 transition-all font-bold placeholder-slate-400"
                  />
                </div>

                {/* Action controls */}
                <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-850">
                  <button
                    type="button"
                    onClick={() => setIsFollowUpOpen(false)}
                    className="px-4 py-2 border border-slate-250 dark:border-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl transition-all shadow-md hover:shadow-lg hover:scale-[1.01] active:scale-[0.99] cursor-pointer flex items-center gap-1.5"
                  >
                    <FileCheck2 className="w-4 h-4" /> Simpan Tindakan
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
