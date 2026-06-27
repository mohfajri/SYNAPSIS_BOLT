import React, { useState, useEffect } from "react";
import { MonevLog, Project, Task, User } from "../types";
import { 
  ClipboardList, 
  Plus, 
  Search, 
  Trash2, 
  Edit, 
  X, 
  ChevronLeft, 
  Paperclip, 
  UploadCloud, 
  CheckCircle2, 
  AlertCircle, 
  Calendar, 
  ChevronRight, 
  User2, 
  Download, 
  FileCheck,
  FolderLock,
  CheckSquare,
  RefreshCw,
  Clock,
  Briefcase,
  Layers,
  HelpCircle,
  Printer
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface MonevViewProps {
  monevLogs: MonevLog[];
  projects: Project[];
  tasks: Task[];
  currentUser: User | null;
  picsList: string[];
  users?: User[];
  picThemeColors?: Record<string, string>;
  onAddMonevLog: (log: Partial<MonevLog>) => Promise<void>;
  onUpdateMonevLog: (id: string, log: Partial<MonevLog>) => Promise<void>;
  onDeleteMonevLog: (id: string) => Promise<void>;
  subRouteParam?: string | null;
  onSubRouteUpdate?: (param: string | null) => void;
}

export default function MonevView({
  monevLogs = [],
  projects = [],
  tasks = [],
  currentUser,
  picsList = [],
  users = [],
  picThemeColors = {},
  onAddMonevLog,
  onUpdateMonevLog,
  onDeleteMonevLog,
  subRouteParam,
  onSubRouteUpdate
}: MonevViewProps) {
  // Query Filters & Search
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTypeFilter, setSelectedTypeFilter] = useState("All");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState("All");
  const [selectedProjectFilter, setSelectedProjectFilter] = useState("All");

  // Selection view and Editor states (No Popups!)
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null);

  // Sync subRouteParam with selectedLogId
  useEffect(() => {
    if (subRouteParam) {
      if (selectedLogId !== subRouteParam) {
        setSelectedLogId(subRouteParam);
      }
    } else {
      if (selectedLogId) {
        setSelectedLogId(null);
      }
    }
  }, [subRouteParam]);

  useEffect(() => {
    if (onSubRouteUpdate && subRouteParam !== selectedLogId) {
      onSubRouteUpdate(selectedLogId);
    }
  }, [selectedLogId]);
  const [isEditing, setIsEditing] = useState(false);
  const [isAddNew, setIsAddNew] = useState(false);

  // Form Field States
  const [title, setTitle] = useState("");
  const [evalType, setEvalType] = useState("Mingguan");
  const [evalDate, setEvalDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [category, setCategory] = useState("Kendala Teknis");
  const [findings, setFindings] = useState("");
  const [recommendations, setRecommendations] = useState("");
  const [status, setStatus] = useState("Open");
  const [evaluatorPic, setEvaluatorPic] = useState("");
  const [picAuditorRS, setPicAuditorRS] = useState("");

  // Linkage source configuration settings
  const [linkageMode, setLinkageMode] = useState<"standalone" | "project" | "task">("standalone");
  const [linkedProjectId, setLinkedProjectId] = useState("");
  const [linkedTaskId, setLinkedTaskId] = useState("");

  // Attachment States
  const [attachmentName, setAttachmentName] = useState("");
  const [attachmentData, setAttachmentData] = useState("");
  const [attachmentSize, setAttachmentSize] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  
  // Loading & error feedbacks
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Post-Add Hasil Evaluasi inline input states
  const [evalResultText, setEvalResultText] = useState("");
  const [isEditingResult, setIsEditingResult] = useState(false);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Populate PIC lists and defaults
  useEffect(() => {
    if (currentUser && !evaluatorPic) {
      setEvaluatorPic(currentUser.nickname || currentUser.username);
    }
  }, [currentUser]);

  // Set selected item on detail load
  const selectedLog = monevLogs.find(log => log.id === selectedLogId) || null;

  // Filter evaluations list
  const filteredMonevLogs = monevLogs.filter(log => {
    const matchesSearch = 
      log.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.findings.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.recommendations.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.evaluatorPic && log.evaluatorPic.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesType = selectedTypeFilter === "All" || log.type === selectedTypeFilter;
    const matchesStatus = selectedStatusFilter === "All" || log.status === selectedStatusFilter;
    
    let matchesProject = true;
    if (selectedProjectFilter !== "All") {
      if (selectedProjectFilter === "standalone") {
        matchesProject = !log.linkedProjectId;
      } else {
        matchesProject = log.linkedProjectId === selectedProjectFilter;
      }
    }

    return matchesSearch && matchesType && matchesStatus && matchesProject;
  });

  // Synchronize inline Hasil Evaluasi state to selected item changes
  useEffect(() => {
    if (selectedLog) {
      setEvalResultText(selectedLog.hasilEvaluasi || "");
      setIsEditingResult(false);
    } else {
      setEvalResultText("");
      setIsEditingResult(false);
    }
  }, [selectedLogId, selectedLog]);

  // Reset page when search/filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedTypeFilter, selectedStatusFilter, selectedProjectFilter]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredMonevLogs.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedMonevLogs = filteredMonevLogs.slice(startIndex, startIndex + itemsPerPage);

  // Active Site for PIC filtering (checks chosen project RS, fallback to current user site)
  const activeSelectedSite = (linkedProjectId && projects.find(p => p.kode === linkedProjectId)?.client) || currentUser?.siteTugas || "";

  // Filtered PIC list according to site bertugas
  const filteredPics = picsList.filter(pic => {
    if (!users || users.length === 0) return true;
    const picUser = users.find(u => (u.nickname || u.username) === pic);
    if (!picUser) return true;
    if (!activeSelectedSite || activeSelectedSite.toLowerCase() === "kantor pusat") return true;
    // Match site bertugas or allow Central office auditors
    return !picUser.siteTugas || picUser.siteTugas.toLowerCase() === "kantor pusat" || picUser.siteTugas.toLowerCase() === activeSelectedSite.toLowerCase();
  });

  // Printer engines
  const handlePrintSingle = (log: MonevLog) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Popup blocker menghalangi pembukaan jendela cetak. Silakan ijinkan popup.");
      return;
    }

    const linkedProj = log.linkedProjectId ? projects.find(p => p.kode === log.linkedProjectId) : null;
    const linkedT = log.linkedTaskId ? tasks.find(t => t.id === log.linkedTaskId) : null;

    printWindow.document.write(`
      <html>
        <head>
          <title>Cetak Hasil Evaluasi - ${log.title}</title>
          <style>
            body {
              font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
              color: #1e293b;
              margin: 40px;
              line-height: 1.5;
            }
            .header {
              text-align: center;
              border-bottom: 3px double #cbd5e1;
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            .header h1 {
              font-size: 24px;
              margin: 0;
              text-transform: uppercase;
              letter-spacing: 1px;
            }
            .header p {
              font-size: 13px;
              color: #64748b;
              margin: 5px 0 0 0;
            }
            .title-box {
              background-color: #f8fafc;
              border: 1px solid #e2e8f0;
              padding: 15px;
              border-radius: 8px;
              margin-bottom: 25px;
            }
            .title-box h2 {
              font-size: 16px;
              margin: 0 0 5px 0;
              color: #4f46e5;
            }
            .title-box .meta {
              font-size: 11px;
              color: #64748b;
            }
            .grid-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 25px;
            }
            .grid-table td {
              padding: 10px;
              border: 1px solid #e2e8f0;
              vertical-align: top;
              font-size: 12px;
            }
            .grid-table td.label {
              font-weight: bold;
              background-color: #f1f5f9;
              width: 25%;
            }
            .section-title {
              font-size: 13px;
              font-weight: bold;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              margin-top: 25px;
              margin-bottom: 10px;
              border-left: 4px solid #4f46e5;
              padding-left: 8px;
              color: #1e1b4b;
            }
            .content-box {
              border: 1px solid #e2e8f0;
              padding: 15px;
              border-radius: 8px;
              background-color: #fff;
              font-size: 12px;
              white-space: pre-wrap;
              min-height: 80px;
              margin-bottom: 20px;
            }
            .footer-signature {
              margin-top: 50px;
              width: 100%;
              display: flex;
              justify-content: space-between;
              font-size: 12px;
            }
            .signature-col {
              width: 40%;
              text-align: center;
            }
            .signature-space {
              height: 70px;
            }
            @media print {
              .no-print { display: none; }
              body { margin: 20px; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Laporan Hasil Monitoring & Evaluasi (Monev)</h1>
            <p>Sistem Pengawasan Berkala & Audit Implementasi Modul SIMRS</p>
          </div>

          <div class="title-box">
            <h2>${log.title}</h2>
            <div class="meta">
              Kategori: <strong>${log.category}</strong> | Tipe: <strong>${log.type}</strong>
            </div>
          </div>

          <table class="grid-table">
            <tr>
              <td class="label">Tanggal Pelaksanaan</td>
              <td>${log.date}</td>
              <td class="label">PIC Auditor (Internal)</td>
              <td>${log.evaluatorPic}</td>
            </tr>
            <tr>
              <td class="label">PIC Auditor RS (Eksternal)</td>
              <td>${log.picAuditorRS || "-"}</td>
              <td class="label">Status Evaluasi</td>
              <td><strong>${log.status}</strong></td>
            </tr>
            <tr>
              <td class="label">Koneksi Sumber</td>
              <td colspan="3">
                ${log.linkedProjectId ? `Project: ${log.linkedProjectId}` : ""}
                ${log.linkedProjectId && linkedT ? ` | ` : ""}
                ${linkedT ? `Tugas: ${linkedT.task}` : ""}
                ${!log.linkedProjectId && !linkedT ? "Mandiri (Tanpa Project & Tugas)" : ""}
              </td>
            </tr>
          </table>

          <div class="section-title">1. Temuan & Detail Kendala Lapangan</div>
          <div class="content-box">${log.findings || "-"}</div>

          <div class="section-title">2. Rencana Tindak Lanjut (RTL) / Rekomendasi Solusi</div>
          <div class="content-box">${log.recommendations || "-"}</div>

          <div class="section-title">3. Catatan Hasil Evaluasi (Penyelesaian / Tindak Lanjut Pasca-Audit)</div>
          <div class="content-box">${log.hasilEvaluasi || "- Belum ada catatan hasil evaluasi pasca-audit -"}</div>

          <div class="footer-signature">
            <div class="signature-col">
              <p>Mengetahui / Menyetujui,</p>
              <p><strong>Pihak Site RS Terkait</strong></p>
              <div class="signature-space"></div>
              <p><strong>${log.picAuditorRS || "_______________________"}</strong></p>
              <p>Ttd & Cap RS</p>
            </div>
            <div class="signature-col">
              <p>Dilaporkan Oleh,</p>
              <p><strong>PIC Evaluator / Auditor</strong></p>
              <div class="signature-space"></div>
              <p><strong>${log.evaluatorPic}</strong></p>
              <p>Tim Pengawas SIMRS</p>
            </div>
          </div>

          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handlePrintSummary = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Popup blocker menghalangi pembukaan jendela cetak. Silakan ijinkan popup.");
      return;
    }

    const rowsHTML = filteredMonevLogs.map((log, index) => {
      const badgeClass = log.status === "Resolved" ? "badge-resolved" : (log.status === "In Progress" ? "badge-progress" : "badge-open");
      const linkedT = log.linkedTaskId ? tasks.find(t => t.id === log.linkedTaskId) : null;
      const projectRow = log.linkedProjectId ? `<br/><span style="color: #2563eb; font-size:9px">Project: ${log.linkedProjectId}</span>` : "";
      const taskRow = linkedT ? `<br/><span style="color: #059669; font-size:9px">Tugas: ${linkedT.task}</span>` : "";
      const hasilRow = log.hasilEvaluasi || "<span style='color:#94a3b8; font-style:italic'>- Belum ada -</span>";
      const findingsPreview = log.findings.slice(0, 150) + (log.findings.length > 150 ? "..." : "");
      const recommendationsPreview = log.recommendations.slice(0, 150) + (log.recommendations.length > 150 ? "..." : "");

      const auditorCell = `
        <div style="font-size: 10px; line-height: 1.3">
          <strong>Int:</strong> ${log.evaluatorPic}<br/>
          ${log.picAuditorRS ? `<strong>RS:</strong> ${log.picAuditorRS}` : "<span style='color:#94a3b8; font-style:italic'>RS: -</span>"}
        </div>
      `;

      return `
        <tr>
          <td>${index + 1}</td>
          <td>
            <strong>${log.date}</strong><br/>
            <span style="color:#64748b; font-size:9.5px">${log.type}</span>
          </td>
          <td>
            <strong>${log.title}</strong><br/>
            <span style="color:#b45309; font-size:9.5px">${log.category}</span>
            ${projectRow}
            ${taskRow}
          </td>
          <td>${auditorCell}</td>
          <td>
            <strong>Temuan:</strong> ${findingsPreview}<br/>
            <strong style="display:inline-block; margin-top:4px">Rekomendasi:</strong> ${recommendationsPreview}
          </td>
          <td>${hasilRow}</td>
          <td><span class="badge ${badgeClass}">${log.status}</span></td>
        </tr>
      `;
    }).join("");

    printWindow.document.write(`
      <html>
        <head>
          <title>Laporan Ringkasan Monitoring & Evaluasi</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              color: #1e293b;
              margin: 30px;
              font-size: 11px;
            }
            .header-report {
              text-align: center;
              border-bottom: 2px solid #334155;
              padding-bottom: 15px;
              margin-bottom: 20px;
            }
            .header-report h1 {
              font-size: 18px;
              margin: 0;
            }
            .header-report p {
              font-size: 10px;
              color: #64748b;
              margin: 5px 0 0 0;
            }
            table {
              width: 100%;
              border-collapse: collapse;
            }
            th, td {
              border: 1px solid #cbd5e1;
              padding: 8px;
              text-align: left;
              vertical-align: top;
            }
            th {
              background-color: #f1f5f9;
              font-weight: bold;
              text-transform: uppercase;
              font-size: 9px;
            }
            .badge {
              display: inline-block;
              padding: 2px 5px;
              font-size: 8px;
              font-weight: bold;
              border-radius: 4px;
            }
            .badge-open { background-color: #ffe4e6; color: #b91c1c; }
            .badge-progress { background-color: #fef3c7; color: #b45309; }
            .badge-resolved { background-color: #d1fae5; color: #047857; }
            .totals-row {
              margin-top: 15px;
              font-size: 10px;
              font-weight: bold;
              color: #475569;
            }
            @media print {
              body { margin: 15px; }
            }
          </style>
        </head>
        <body>
          <div class="header-report">
            <h1>RINGKASAN LAPORAN MONITORING & EVALUASI (MONEV)</h1>
            <p>Dicetak pada: ${new Date().toLocaleString("id-ID")} | Total Terfilter: ${filteredMonevLogs.length} hasil</p>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 5%">No</th>
                <th style="width: 13%">Tanggal / Tipe</th>
                <th style="width: 25%">Topik / Judul</th>
                <th style="width: 12%">Auditor</th>
                <th style="width: 25%">Temuan & Rekomendasi</th>
                <th style="width: 12%">Hasil Akhir (Tindak Lanjut)</th>
                <th style="width: 8%">Status</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHTML}
            </tbody>
          </table>

          <div class="totals-row">
            Menampilkan ${filteredMonevLogs.length} hasil evaluasi dari total keseluruhan ${monevLogs.length} catatan dalam database.
          </div>

          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Get tasks filtered by the currently selected project in Form, or show all tasks if no project is selected
  const formProjectTasks = linkedProjectId
    ? tasks.filter(t => t.project === linkedProjectId)
    : tasks;

  // Trigger form reset for adding new record
  const handleInitAddNew = () => {
    setIsAddNew(true);
    setIsEditing(false);
    setSelectedLogId(null);
    setErrorMessage("");

    // Reset default inputs
    setTitle("");
    setEvalType("Mingguan");
    setEvalDate(new Date().toISOString().slice(0, 10));
    setCategory("Kendala Teknis");
    setFindings("");
    setRecommendations("");
    setStatus("Open");
    setEvaluatorPic(currentUser?.nickname || currentUser?.username || "");
    setPicAuditorRS("");
    setLinkageMode("standalone");
    setLinkedProjectId("");
    setLinkedTaskId("");
    setAttachmentName("");
    setAttachmentData("");
    setAttachmentSize("");
  };

  // Trigger form edit mode with currently loaded log details
  const handleInitEdit = () => {
    if (!selectedLog) return;
    setIsEditing(true);
    setIsAddNew(false);
    setErrorMessage("");

    setTitle(selectedLog.title);
    setEvalType(selectedLog.type);
    setEvalDate(selectedLog.date);
    setCategory(selectedLog.category);
    setFindings(selectedLog.findings);
    setRecommendations(selectedLog.recommendations);
    setStatus(selectedLog.status);
    setEvaluatorPic(selectedLog.evaluatorPic || "");
    setPicAuditorRS(selectedLog.picAuditorRS || "");
    
    // Reverse evaluate linkage state
    if (selectedLog.linkedTaskId) {
      setLinkageMode("task");
      setLinkedProjectId(selectedLog.linkedProjectId || "");
      setLinkedTaskId(selectedLog.linkedTaskId);
    } else if (selectedLog.linkedProjectId) {
      setLinkageMode("project");
      setLinkedProjectId(selectedLog.linkedProjectId);
      setLinkedTaskId("");
    } else {
      setLinkageMode("standalone");
      setLinkedProjectId("");
      setLinkedTaskId("");
    }

    setAttachmentName(selectedLog.attachmentName || "");
    setAttachmentData(selectedLog.attachmentData || "");
    setAttachmentSize(selectedLog.attachmentSize || "");
  };

  // Drag and Drop Attachment functions
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    
    processFile(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    processFile(file);
  };

  const processFile = (file: File) => {
    // Alert limit if file size exceeds 5MB for storage stability reasons
    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage("Ukuran berkas maksimal adalah 5MB!");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setAttachmentData(reader.result as string);
      setAttachmentName(file.name);
      
      const sizeInKB = file.size / 1024;
      if (sizeInKB > 1024) {
        setAttachmentSize(`${(sizeInKB / 1024).toFixed(1)} MB`);
      } else {
        setAttachmentSize(`${sizeInKB.toFixed(1)} KB`);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleClearAttachment = () => {
    setAttachmentName("");
    setAttachmentData("");
    setAttachmentSize("");
  };

  // Submit handler (Asynchronous saving)
  const handleSaveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!title.trim()) {
      setErrorMessage("Judul Evaluasi wajib diisi!");
      return;
    }

    if (!findings.trim()) {
      setErrorMessage("Temuan & Kendala wajib diisi!");
      return;
    }

    if (!recommendations.trim()) {
      setErrorMessage("Rencana Tindak Lanjut (RTL) atau Rekomendasi wajib diisi!");
      return;
    }

    if (!evaluatorPic) {
      setErrorMessage("PIC Evaluator wajib dipilih!");
      return;
    }

    const payload: Partial<MonevLog> = {
      title: title.trim(),
      type: evalType,
      date: evalDate,
      category,
      findings: findings.trim(),
      recommendations: recommendations.trim(),
      status,
      evaluatorPic,
      picAuditorRS: picAuditorRS.trim() || undefined,
      linkedProjectId: linkageMode !== "standalone" ? linkedProjectId : "",
      linkedTaskId: linkageMode === "task" ? linkedTaskId : "",
      attachmentName: attachmentName || undefined,
      attachmentData: attachmentData || undefined,
      attachmentSize: attachmentSize || undefined,
    };

    setIsSaving(true);
    try {
      if (isAddNew) {
        await onAddMonevLog(payload);
        setIsAddNew(false);
        // Automatically select the newly created log if available (sort order is newest first)
        setSelectedLogId(null);
      } else if (isEditing && selectedLogId) {
        await onUpdateMonevLog(selectedLogId, payload);
        setIsEditing(false);
      }
    } catch (err: any) {
      setErrorMessage("Gagal menyimpan data: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Download Trigger Handler
  const handleDownloadAttachment = (name: string, dataUrl: string) => {
    if (!dataUrl) return;
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = name || "lampiran_evaluasi";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Delete Action handler
  const handleDeleteLog = async (id: string) => {
    if (confirm("Apakah Anda yakin ingin menghapus catatan Monitoring Evaluasi ini?")) {
      try {
        await onDeleteMonevLog(id);
        if (selectedLogId === id) {
          setSelectedLogId(null);
        }
      } catch (err: any) {
        alert("Gagal menghapus catatan: " + err.message);
      }
    }
  };

  // Helper values
  const totalMonevCount = monevLogs.length;
  const openCount = monevLogs.filter(log => log.status === "Open").length;
  const inProgressCount = monevLogs.filter(log => log.status === "In Progress").length;
  const resolvedCount = monevLogs.filter(log => log.status === "Resolved").length;

  return (
    <div className="space-y-6">
      
      {/* SECTION HEADER BLOCK */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <span className="p-2 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <ClipboardList className="w-5 h-5 animate-pulse" />
            </span>
            <h1 className="text-xl font-black text-slate-800 dark:text-white tracking-tight">Monitoring & Evaluasi (Monev)</h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Sistem pengawasan berkala dan audit internal bagi seluruh implementasi modul dan tugas per site.
          </p>
        </div>

        {/* STATS COUNT GRID */}
        <div className="grid grid-cols-3 gap-3 md:w-auto w-full">
          <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-850 text-center">
            <span className="block text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">Open</span>
            <span className="text-sm font-black text-rose-500">{openCount}</span>
          </div>
          <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-850 text-center">
            <span className="block text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">Progress</span>
            <span className="text-sm font-black text-amber-500">{inProgressCount}</span>
          </div>
          <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-850 text-center">
            <span className="block text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">Resolved</span>
            <span className="text-sm font-black text-emerald-500">{resolvedCount}</span>
          </div>
        </div>
      </div>

      {/* SEARCH AND CONTROL ROW */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800 flex flex-wrap gap-3 items-center justify-between">
        <div className="flex flex-1 min-w-[280px] gap-2">
          {/* Search box */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 w-4.5 h-4.5 text-slate-450 dark:text-slate-500" />
            <input
              type="text"
              placeholder="Cari evaluasi, temuan, atau evaluator..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9.5 pr-4 py-2 bg-slate-50 hover:bg-slate-100/75 focus:bg-white dark:bg-slate-950 dark:hover:bg-slate-900/50 dark:focus:bg-slate-950 border border-slate-200/50 dark:border-slate-800 focus:border-blue-500/50 dark:focus:border-blue-500/55 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-100 outline-none transition-all placeholder:text-slate-400"
            />
          </div>

          {/* Quick Clear filters */}
          {(searchTerm || selectedTypeFilter !== "All" || selectedStatusFilter !== "All" || selectedProjectFilter !== "All") && (
            <button
              onClick={() => {
                setSearchTerm("");
                setSelectedTypeFilter("All");
                setSelectedStatusFilter("All");
                setSelectedProjectFilter("All");
              }}
              title="Reset Semua Filter"
              className="px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 rounded-xl text-xs font-bold transition-all flex items-center gap-1 shrink-0 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Reset</span>
            </button>
          )}
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Filter Project */}
          <select
            value={selectedProjectFilter}
            onChange={(e) => setSelectedProjectFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-950 text-slate-705 dark:text-slate-200 border border-slate-200/50 dark:border-slate-800 rounded-xl text-xs font-bold outline-none cursor-pointer"
          >
            <option value="All">Semua Sumber Project</option>
            <option value="standalone">Berdiri Sendiri (Standalone)</option>
            {projects.map(p => (
              <option key={p.id} value={p.kode}>{p.kode} - {p.nama}</option>
            ))}
          </select>

          {/* Filter Type */}
          <select
            value={selectedTypeFilter}
            onChange={(e) => setSelectedTypeFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-950 text-slate-705 dark:text-slate-200 border border-slate-200/50 dark:border-slate-800 rounded-xl text-xs font-bold outline-none cursor-pointer"
          >
            <option value="All">Semua Tipe</option>
            <option value="Mingguan">Mingguan</option>
            <option value="Bulanan">Bulanan</option>
            <option value="UAT">Evaluasi UAT</option>
            <option value="Isidental">Isidental (Mengetahui Kendala)</option>
            <option value="Akhir Project">Audit Akhir Project</option>
          </select>

          {/* Filter Status */}
          <select
            value={selectedStatusFilter}
            onChange={(e) => setSelectedStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-950 text-slate-705 dark:text-slate-200 border border-slate-200/50 dark:border-slate-800 rounded-xl text-xs font-bold outline-none cursor-pointer"
          >
            <option value="All">Semua Status</option>
            <option value="Open">Status Open</option>
            <option value="In Progress">Status In Progress</option>
            <option value="Resolved">Status Resolved (Selesai)</option>
          </select>

          {/* PRINT SUMMARY REPORT */}
          <button
            type="button"
            onClick={handlePrintSummary}
            disabled={filteredMonevLogs.length === 0}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-205 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-705 dark:text-slate-300 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 border border-slate-200/50 dark:border-slate-750 active:scale-98"
            title="Cetak Ringkasan Laporan Laporan MONEV"
          >
            <Printer className="w-4 h-4 shrink-0 text-slate-550 dark:text-slate-400" />
            <span>Cetak Hasil MONEV</span>
          </button>

          {/* ADD BUTTON */}
          <button
            onClick={handleInitAddNew}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-98"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Evaluasi</span>
          </button>
        </div>
      </div>

      {/* FULL WIDTH DYNAMIC SECTION (Optimized Full Page View) */}
      <div className="w-full">
        
        {/* LEFT COLUMN: LIST OF AUDITS (Expands to full grid width dynamically) */}
        <div className={`${(isAddNew || isEditing || selectedLogId) ? "hidden" : "block"} space-y-4`}>
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
              Daftar Hasil Evaluasi ({filteredMonevLogs.length} hasil)
            </h3>
            {filteredMonevLogs.length < totalMonevCount && (
              <span className="text-[10px] text-slate-400 font-bold bg-slate-100 dark:bg-slate-900 px-2 py-0.5 rounded-full">
                Terfilter
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {paginatedMonevLogs.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-8 text-center col-span-full">
                <ClipboardList className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
                <p className="text-xs text-slate-500 dark:text-slate-400 font-bold">Tidak ada data evaluasi ditemukan.</p>
                <p className="text-[10px] text-slate-400 mt-1">Coba sesuaikan kata pencarian atau parameter filter Anda, atau tambah catatan baru.</p>
              </div>
            ) : (
              paginatedMonevLogs.map((log) => {
                const isSelected = selectedLogId === log.id && !isAddNew;
                
                // Colors definition mapped based on status
                let statusColor = "bg-rose-50 border-rose-200 dark:bg-rose-950/40 dark:border-rose-900/50 text-rose-600 dark:text-rose-450";
                if (log.status === "In Progress") {
                  statusColor = "bg-amber-50 border-amber-200 dark:bg-amber-950/40 dark:border-amber-900/55 text-amber-600 dark:text-amber-450";
                } else if (log.status === "Resolved") {
                  statusColor = "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-900/50 text-emerald-600 dark:text-emerald-450";
                }

                // Match linked project if any
                const linkedProj = log.linkedProjectId ? projects.find(p => p.kode === log.linkedProjectId) : null;

                // Match category icons & borders for beautiful detailing
                let categoryAccent = "border-l-4 border-l-blue-550";
                if (log.category === "Kendala Teknis") categoryAccent = "border-l-4 border-l-rose-500";
                else if (log.category === "Kinerja SIMRS") categoryAccent = "border-l-4 border-l-amber-500";
                else if (log.category === "Kehadiran / Disiplin") categoryAccent = "border-l-4 border-l-indigo-500";
                else if (log.category === "Komunikasi / KSO") categoryAccent = "border-l-4 border-l-emerald-500";
                else if (log.category === "Infrastruktur & Hardware") categoryAccent = "border-l-4 border-l-purple-500";

                return (
                  <motion.div
                    key={log.id}
                    layoutId={`monev-card-${log.id}`}
                    onClick={() => {
                      setSelectedLogId(log.id);
                      setIsAddNew(false);
                      setIsEditing(false);
                    }}
                    className={`p-4 bg-white dark:bg-slate-900 rounded-xl border transition-all text-left group hover:shadow-xs cursor-pointer flex flex-col justify-between hover:scale-[1.01] active:scale-99 ${categoryAccent} ${
                      isSelected 
                        ? "border-indigo-600 dark:border-indigo-500 ring-2 ring-indigo-500/10 dark:ring-indigo-500/5 bg-indigo-50/5 dark:bg-indigo-950/5" 
                        : "border-slate-200/60 dark:border-slate-800"
                    }`}
                  >
                    <div>
                      {/* Card meta header */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-[9px] font-extrabold tracking-wider text-slate-450 dark:text-slate-500 uppercase bg-slate-50 dark:bg-slate-950 px-1.5 py-0.5 rounded">
                          {log.type}
                        </span>
                        
                        {/* Status badge */}
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-md border ${statusColor} shrink-0`}>
                          {log.status}
                        </span>
                      </div>

                      {/* Category Label */}
                      <span className="block text-[10px] font-extrabold text-indigo-600 dark:text-indigo-400 mb-1">
                        {log.category}
                      </span>

                      {/* Title */}
                      <h4 className="text-xs font-black text-slate-850 dark:text-white mb-2 leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {log.title}
                      </h4>

                      {/* Project/Task linking info */}
                      {log.linkedProjectId ? (
                        <div className="flex items-center gap-1.5 text-[9.5px] text-slate-400 dark:text-slate-405 mb-2 bg-slate-50 dark:bg-slate-950 px-2 py-1 rounded-md border border-slate-200/30 dark:border-slate-850 truncate">
                          <Briefcase className="w-3 h-3 text-slate-400 dark:text-slate-500 shrink-0" />
                          <span className="font-extrabold text-slate-600 dark:text-slate-350 shrink-0">{log.linkedProjectId}</span>
                          <span className="text-slate-300 dark:text-slate-700">|</span>
                          <span className="truncate">{linkedProj ? linkedProj.nama : "Project linked"}</span>
                        </div>
                      ) : (
                        <div className="text-[9.5px] text-slate-400 dark:text-slate-500 mb-2 font-bold italic bg-slate-55/40 dark:bg-slate-950/50 px-2 py-0.5 rounded">
                          Mandiri / Standalone Evaluasi
                        </div>
                      )}

                      {/* Preview of findings text */}
                      <p className="text-[11.5px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed mb-3">
                        {log.findings}
                      </p>

                      {/* Post-add Hasil Evaluasi tag indicator */}
                      {log.hasilEvaluasi ? (
                        <div className="mb-3 px-2 py-1 bg-emerald-50 dark:bg-emerald-950/25 text-emerald-600 dark:text-emerald-400 border border-emerald-100/50 dark:border-emerald-900/50 rounded-lg text-[10px] font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          <span className="truncate">Hasil Evaluasi: {log.hasilEvaluasi}</span>
                        </div>
                      ) : (
                        <div className="mb-3 px-2 py-1 bg-amber-50 dark:bg-amber-950/10 text-amber-600 dark:text-amber-400 border border-amber-100/50 dark:border-amber-900/40 rounded-lg text-[10px] font-bold flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0 select-none animate-pulse" />
                          <span>Belum ada hasil tindak lanjut</span>
                        </div>
                      )}
                    </div>

                    {/* Footer bottom meta */}
                    <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-850 pt-2 text-[10px] text-slate-450 dark:text-slate-500 font-bold">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                        <span>{log.date}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        {log.attachmentName && (
                          <span className="p-1 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded-md" title={`Berkas terlampir: ${log.attachmentName}`}>
                            <Paperclip className="w-3 h-3" />
                          </span>
                        )}
                        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full text-slate-600 dark:text-slate-400 shrink-0 font-extrabold max-w-[100px]">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />
                          <span className="truncate">{log.evaluatorPic}</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between border-t border-slate-100 dark:border-slate-850 pt-4 px-1 gap-3">
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold">
                Menampilkan {startIndex + 1} - {Math.min(startIndex + itemsPerPage, filteredMonevLogs.length)} dari {filteredMonevLogs.length} catatan evaluasi
              </span>
              
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 bg-slate-50 border border-slate-200/50 dark:bg-slate-950 dark:border-slate-800 rounded-lg text-slate-500 dark:text-slate-450 disabled:opacity-40 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-850 transition-all duration-150"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
                  <button
                    key={pageNum}
                    type="button"
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-7.5 h-7.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                      currentPage === pageNum
                        ? "bg-indigo-600 text-white shadow-xs"
                        : "bg-slate-50 border border-slate-200/50 text-slate-650 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-850"
                    }`}
                  >
                    {pageNum}
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="p-1.5 bg-slate-50 border border-slate-200/50 dark:bg-slate-950 dark:border-slate-800 rounded-lg text-slate-500 dark:text-slate-450 disabled:opacity-40 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-850 transition-all duration-150"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: INTEGRATED DETAIL VIEW / FORM INPUT EDITOR (Expands to full page dynamically) */}
        <div className={`${(isAddNew || isEditing || selectedLogId) ? "block" : "hidden"} w-full`}>
          <AnimatePresence mode="wait">
            
            {/* ADD NEW LOG OR EDIT MODE FORM COMPONENT */}
            {(isAddNew || isEditing) ? (
              <motion.div
                key="monev-form"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 p-6 rounded-2xl shadow-xs space-y-5"
              >
                {/* Form header */}
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-850 pb-3">
                  <div>
                    <h2 className="text-sm font-black text-slate-800 dark:text-white flex items-center gap-2">
                      <span className="p-1 px-2 text-[10px] bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-450 rounded-md font-black">
                        FORMULA
                      </span>
                      {isAddNew ? "Penyusunan Evaluasi Baru" : `Edit Evaluasi: ${selectedLog?.title}`}
                    </h2>
                    <p className="text-[10px] text-slate-400 mt-1 font-medium">Input detil evaluasi secara komprehensif tanpa pop-up modal.</p>
                  </div>
                  
                  <button
                    onClick={() => {
                      setIsAddNew(false);
                      setIsEditing(false);
                      setErrorMessage("");
                    }}
                    className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors cursor-pointer"
                  >
                    <X className="w-4.5 h-4.5" />
                  </button>
                </div>

                {/* Form Body layout */}
                <form onSubmit={handleSaveSubmit} className="space-y-4 text-left">
                  {errorMessage && (
                    <div className="p-3.5 bg-rose-50 dark:bg-rose-950/30 border border-rose-200/50 dark:border-rose-900/50 rounded-xl text-rose-500 dark:text-rose-450 text-xs font-bold flex items-start gap-2">
                      <AlertCircle className="w-4.5 h-4.5 shrink-0 text-rose-500" />
                      <span>{errorMessage}</span>
                    </div>
                  )}

                  {/* Judul Evaluasi */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-450 dark:text-slate-500 uppercase tracking-wider block">
                      Judul / Topik Evaluasi <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Audit Kecepatan Response Billing Kasir"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 hover:bg-slate-100/50 focus:bg-white dark:bg-slate-950 dark:hover:bg-slate-900 border border-slate-200/60 dark:border-slate-800 focus:border-blue-500/50 dark:focus:border-blue-500/50 rounded-xl text-xs font-semibold text-slate-800 dark:text-white outline-none transition-all placeholder:text-slate-400"
                      maxLength={150}
                    />
                  </div>

                  {/* Grid 1: PIC & Date */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-450 dark:text-slate-500 uppercase tracking-wider block">
                        PIC Auditor / Evaluator <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={evaluatorPic}
                        onChange={(e) => setEvaluatorPic(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-800 dark:text-white outline-none cursor-pointer"
                      >
                        <option value="">-- Pilih PIC Evaluator --</option>
                        {filteredPics.map(pic => {
                          const picUser = users?.find(u => (u.nickname || u.username) === pic);
                          const siteLabel = picUser?.siteTugas ? ` (${picUser.siteTugas})` : " (Kantor Pusat)";
                          return (
                            <option key={pic} value={pic}>
                              {pic}{siteLabel}
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-450 dark:text-slate-500 uppercase tracking-wider block">
                        PIC Auditor RS <span className="text-[9px] text-slate-400 font-extrabold">(Free Text)</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Dr. Jane Smith / Kabid Yanmed"
                        value={picAuditorRS}
                        onChange={(e) => setPicAuditorRS(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 hover:bg-slate-100/50 focus:bg-white dark:bg-slate-950 dark:hover:bg-slate-900 border border-slate-200/60 dark:border-slate-800 focus:border-blue-500/50 dark:focus:border-blue-500/50 rounded-xl text-xs font-bold text-slate-800 dark:text-white outline-none transition-all placeholder:text-slate-400"
                        maxLength={100}
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-450 dark:text-slate-500 uppercase tracking-wider block">
                        Tanggal Pelaksanaan <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        value={evalDate}
                        onChange={(e) => setEvalDate(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-800 dark:text-white outline-none"
                      />
                    </div>
                  </div>

                  {/* Grid 2: Audit Type & Category */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-450 dark:text-slate-500 uppercase tracking-wider block">
                        Tipe Audit Evaluasi
                      </label>
                      <select
                        value={evalType}
                        onChange={(e) => setEvalType(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-800 dark:text-white outline-none cursor-pointer"
                      >
                        <option value="Mingguan">Mingguan</option>
                        <option value="Bulanan">Bulanan</option>
                        <option value="UAT">Evaluasi UAT</option>
                        <option value="Isidental">Isidental (Mengetahui Kendala)</option>
                        <option value="Akhir Project">Audit Akhir Project</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-450 dark:text-slate-500 uppercase tracking-wider block">
                        Kategori Evaluasi
                      </label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-800 dark:text-white outline-none cursor-pointer"
                      >
                        <option value="Kinerja SIMRS">Kinerja SIMRS</option>
                        <option value="Kendala Teknis">Kendala Teknis</option>
                        <option value="Kehadiran / Disiplin">Kehadiran / Disiplin</option>
                        <option value="Komunikasi / KSO">Komunikasi / KSO</option>
                        <option value="Infrastruktur & Hardware">Infrastruktur & Hardware</option>
                        <option value="Lainnya">Lainnya / Umum</option>
                      </select>
                    </div>
                  </div>

                  {/* LINKAGE CONTROLLER ENGINE (Stand-alone or Connected to Project/Tasks) */}
                  <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200/60 dark:border-slate-850 space-y-3">
                    <label className="text-[10px] font-black text-slate-450 dark:text-slate-500 uppercase tracking-wider block">
                      Sumber Koneksi Evaluasi (Linkage Source)
                    </label>

                    {/* Radio Options */}
                    <div className="flex flex-col sm:flex-row gap-3">
                      <label className="flex items-center gap-2 text-xs font-bold text-slate-705 dark:text-slate-200 cursor-pointer">
                        <input
                          type="radio"
                          name="linkageMode"
                          checked={linkageMode === "standalone"}
                          onChange={() => {
                            setLinkageMode("standalone");
                            setLinkedProjectId("");
                            setLinkedTaskId("");
                          }}
                          className="text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                        />
                        <span>Berdiri Sendiri (Monev Mandiri)</span>
                      </label>

                      <label className="flex items-center gap-2 text-xs font-bold text-slate-705 dark:text-slate-200 cursor-pointer">
                        <input
                          type="radio"
                          name="linkageMode"
                          checked={linkageMode === "project"}
                          onChange={() => {
                            setLinkageMode("project");
                            setLinkedTaskId("");
                          }}
                          className="text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                        />
                        <span>Link ke Project Master</span>
                      </label>

                      <label className="flex items-center gap-2 text-xs font-bold text-slate-705 dark:text-slate-200 cursor-pointer">
                        <input
                          type="radio"
                          name="linkageMode"
                          checked={linkageMode === "task"}
                          onChange={() => {
                            setLinkageMode("task");
                          }}
                          className="text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                        />
                        <span>Link ke Tugas & Progress</span>
                      </label>
                    </div>

                    {/* Conditional drop zones */}
                    {linkageMode !== "standalone" && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                        {/* Project selector */}
                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase">
                            Pilih Project Master {linkageMode === "project" ? (
                              <span className="text-red-500">*</span>
                            ) : (
                              <span className="text-slate-400 normal-case">(Opsional)</span>
                            )}
                          </label>
                          <select
                            value={linkedProjectId}
                            onChange={(e) => {
                              setLinkedProjectId(e.target.value);
                              setLinkedTaskId(""); // Reset selected task if project shifts
                            }}
                            className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-bold text-slate-800 dark:text-white outline-none cursor-pointer"
                          >
                            <option value="">{linkageMode === "task" ? "-- Tanpa Project (Tugas Mandiri) --" : "-- Pilih Project --"}</option>
                            {projects.map(p => (
                              <option key={p.id} value={p.kode}>{p.kode} - {p.nama}</option>
                            ))}
                          </select>
                        </div>

                        {/* Task selector - show only if linkageMode is task */}
                        {linkageMode === "task" && (
                          <div className="space-y-1">
                            <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase">
                              Pilih Tugas Untuk Dievaluasi <span className="text-red-500">*</span>
                            </label>
                            <select
                              value={linkedTaskId}
                              onChange={(e) => setLinkedTaskId(e.target.value)}
                              className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-bold text-slate-800 dark:text-white outline-none cursor-pointer"
                            >
                              <option value="">-- Pilih Tugas --</option>
                              {formProjectTasks.map(t => {
                                const projTag = t.project ? t.project : "Mandiri";
                                return (
                                  <option key={t.id} value={t.id}>
                                    [{projTag}] {t.task} (PIC: {t.pic} - {t.progress}%)
                                  </option>
                                );
                              })}
                            </select>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Dynamic Indicator of pulling details */}
                    {linkageMode === "task" && linkedTaskId && (
                      (() => {
                        const tObj = tasks.find(x => x.id === linkedTaskId);
                        if (!tObj) return null;
                        return (
                          <div className="mt-2 text-[10px] bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 px-3 py-2 rounded-lg border border-blue-200/50 dark:border-blue-900/50 flex flex-col gap-1.5 font-bold">
                            <div className="flex justify-between items-center">
                              <span>Tugas: {tObj.task}</span>
                              <span>Target PIC Pelaksana: {tObj.pic}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span>Progress tugas saat ini:</span>
                              <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-500 transition-all duration-300" style={{ width: `${tObj.progress}%` }} />
                              </div>
                              <span className="shrink-0">{tObj.progress}%</span>
                            </div>
                          </div>
                        );
                      })()
                    )}
                  </div>

                  {/* Findings / Temuan & Kendala */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-450 dark:text-slate-500 uppercase tracking-wider block">
                      Temuan & Deskripsi Kendala Lapangan <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Uraikan temuan, kendala teknis, gap fitur, atau hasil audit operasional secara detail..."
                      value={findings}
                      onChange={(e) => setFindings(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 hover:bg-slate-100/50 focus:bg-white dark:bg-slate-950 dark:hover:bg-slate-900 border border-slate-200/60 dark:border-slate-800 focus:border-blue-500/50 dark:focus:border-blue-500/50 rounded-xl text-xs font-semibold text-slate-800 dark:text-white outline-none transition-all placeholder:text-slate-400"
                    />
                  </div>

                  {/* Recommendations / RTL */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center mb-0.5">
                      <label className="text-[10px] font-black text-slate-450 dark:text-slate-500 uppercase tracking-wider block">
                        Rencana Tindak Lanjut (RTL) atau Rekomendasi Solusi <span className="text-red-500">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          const templates: Record<string, string> = {
                            "Kinerja SIMRS": "1. Optimalkan konfigurasi database pooling.\n2. Lakukan profiling query lambat (slow queries).\n3. Jadwalkan monitoring CPU server secara berkala.",
                            "Kendala Teknis": "1. Lakukan instalasi hotfix atau pembaharuan patch aplikasi terbaru.\n2. Hambatan sinkronisasi service bridging BPJS diatasi dengan refresh token.\n3. Periksa kecocokan file log error lokal di server.",
                            "Kehadiran / Disiplin": "1. Berikan pengingat absensi harian via WAG tim.\n2. Evaluasi jam kerja lembur pendampingan On-Site.\n3. Lakukan rotasi piket penanggung jawab harian.",
                            "Komunikasi / KSO": "1. Susun jadwal rapat koordinasi rutin mingguan dengan Komite Medis/Manajemen RS.\n2. Buat berita acara resmi penyesuaian tarif KSO.\n3. Kirimkan laporan statistik kinerja operasional berkala.",
                            "Infrastruktur & Hardware": "1. Periksa stabilitas bandwidth jaringan LAN & VPN BPJS.\n2. Rekomendasikan penggantian RAM klien minimal 8GB.\n3. Lakukan pembersihan (cleaning) printer thermal berkala."
                          };
                          const selectedTpl = templates[category] || "1. Buat catatan detail kronologi kejadian.\n2. Koordinasikan dengan ketua tim teknis.\n3. Lakukan verifikasi hasil tindak lanjut bersama user.";
                          setRecommendations(selectedTpl);
                        }}
                        className="text-[9px] text-blue-650 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-extrabold flex items-center gap-1 hover:underline cursor-pointer tracking-normal lowercase"
                      >
                        ⚡ muat template ({category})
                      </button>
                    </div>
                    <textarea
                      rows={3}
                      placeholder="Langkah antisipatif, instruksi ke tim support, tenggat perbaikan, atau perubahan alur program..."
                      value={recommendations}
                      onChange={(e) => setRecommendations(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 hover:bg-slate-100/50 focus:bg-white dark:bg-slate-950 dark:hover:bg-slate-900 border border-slate-200/60 dark:border-slate-800 focus:border-blue-550 dark:focus:border-blue-500 rounded-xl text-xs font-semibold text-slate-800 dark:text-white outline-none transition-all placeholder:text-slate-400"
                    />
                  </div>

                  {/* Attachment zone & Status select in a same grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    
                    {/* Status select */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-450 dark:text-slate-500 uppercase tracking-wider block">
                        Status Evaluasi Saat Ini
                      </label>
                      <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-800 dark:text-white outline-none cursor-pointer"
                      >
                        <option value="Open">Open (Masih Berlangsung)</option>
                        <option value="In Progress">In Progress (Tindak Lanjut Dimulai)</option>
                        <option value="Resolved">Resolved (Masalah Terselesaikan)</option>
                      </select>
                    </div>

                    {/* Dummy padding space */}
                    <div className="space-y-1 hidden md:block">
                      <span className="text-[10px] text-transparent select-none">-</span>
                    </div>
                  </div>

                  {/* FILE ATTACHMENT WITH DRAG-AND-DROP AND BUTTON FALLBACK */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-450 dark:text-slate-500 uppercase tracking-wider block">
                      Unggah File Pendukung / Lampiran Evaluasi (Maks 5MB)
                    </label>

                    {/* Drag and Drop Container */}
                    {!attachmentName ? (
                      <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        className={`border-2 border-dashed rounded-xl p-5 text-center flex flex-col items-center justify-center gap-2 transition-all ${
                          isDragging
                            ? "bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-500 scale-[0.99]"
                            : "bg-slate-50 hover:bg-slate-100/50 dark:bg-slate-950 dark:hover:bg-slate-900 border-slate-200 dark:border-slate-800"
                        }`}
                      >
                        <UploadCloud className="w-8 h-8 text-slate-400 dark:text-slate-600 shrink-0" />
                        <div>
                          <p className="text-xs font-bold text-slate-700 dark:text-slate-350">
                            Seret & jatuhkan berkas ke sini, atau
                          </p>
                          <label className="text-[11px] text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-extrabold cursor-pointer mt-1 inline-block">
                            pilih file dari direktori Anda
                            <input
                              type="file"
                              className="hidden"
                              onChange={handleFileInputChange}
                              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.png,.jpg,.jpeg,.txt,.csv"
                            />
                          </label>
                        </div>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500">
                          Menerima format dokumen PDF, Excel, Word, PowerPoint, Gambar PNG/JPG (Maks. 5MB)
                        </p>
                      </div>
                    ) : (
                      <div className="p-3 bg-indigo-50/50 dark:bg-indigo-950/20 rounded-xl border border-indigo-200/50 dark:border-indigo-900/50 flex items-center justify-between gap-3 text-left">
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="p-2 bg-indigo-100 dark:bg-indigo-950 text-indigo-600 rounded-xl shrink-0">
                            <FileCheck className="w-5 h-5" />
                          </span>
                          <div className="min-w-0">
                            <p className="text-xs font-black text-slate-850 dark:text-slate-100 truncate leading-tight">
                              {attachmentName}
                            </p>
                            <p className="text-[10px] text-slate-450 dark:text-slate-450 mt-1 font-bold">
                              Ukuran Berkas: {attachmentSize}
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={handleClearAttachment}
                          className="p-1 px-2.5 bg-slate-100 dark:bg-slate-800 text-[10px] font-black text-rose-600 hover:bg-rose-50 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer"
                        >
                          Batalkan Lampiran
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Form Footer Action Buttons */}
                  <div className="flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-850 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddNew(false);
                        setIsEditing(false);
                        setErrorMessage("");
                      }}
                      className="px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-xs font-bold text-slate-650 dark:text-slate-300 transition-colors cursor-pointer"
                    >
                      Batal
                    </button>
                    
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                    >
                      {isSaving ? "Sedang Menyimpan..." : "Simpan Evaluasi"}
                    </button>
                  </div>
                </form>
              </motion.div>
            ) : selectedLog ? (
              
              /* DETAILED VIEW MODE OF HIGHLIGHTED CARD */
              <motion.div
                key="monev-detail"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 p-6 rounded-2xl shadow-xs space-y-5 text-left"
              >
                {/* Header detail */}
                <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-850 pb-4">
                  <div>
                    {/* Badge group */}
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className="text-[10px] font-black px-2.5 py-0.5 bg-indigo-50 dark:bg-indigo-950 border border-indigo-200/30 dark:border-indigo-850 text-indigo-600 dark:text-indigo-400 rounded-md uppercase">
                        {selectedLog.type}
                      </span>
                      <span className="text-[10px] font-black px-2.5 py-0.5 bg-slate-50 dark:bg-slate-950 border border-slate-200/50 dark:border-slate-800 text-slate-600 dark:text-slate-400 rounded-md">
                        {selectedLog.category}
                      </span>
                    </div>

                    <h2 className="text-sm md:text-base font-black text-slate-850 dark:text-white leading-normal">
                      {selectedLog.title}
                    </h2>
                  </div>                  {/* Actions buttons */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => setSelectedLogId(null)}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-705 dark:text-slate-300 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 border border-slate-200/50 dark:border-slate-750"
                      title="Kembali ke Daftar"
                    >
                      <ChevronLeft className="w-4 h-4 shrink-0" />
                      <span>Kembali</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handlePrintSingle(selectedLog)}
                      className="p-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-850 border border-slate-200/50 dark:border-slate-800 rounded-xl text-slate-550 hover:text-indigo-650 dark:text-slate-400 dark:hover:text-white transition-all cursor-pointer"
                      title="Cetak Laporan Evaluasi Tunggal"
                    >
                      <Printer className="w-4 h-4" />
                    </button>

                    <button
                      onClick={handleInitEdit}
                      className="p-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-850 border border-slate-200/50 dark:border-slate-800 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-all cursor-pointer"
                      title="Edit Audit Evaluasi Ini"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    
                    <button
                      onClick={() => handleDeleteLog(selectedLog.id)}
                      className="p-2 bg-rose-50/50 hover:bg-rose-50 dark:bg-rose-950/20 dark:hover:bg-rose-900/10 border border-rose-100 dark:border-rose-900 rounded-xl text-rose-600 hover:text-rose-700 transition-all cursor-pointer"
                      title="Hapus Audit Evaluasi Ini"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Info block: Owner & Connection */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 border border-slate-100 dark:border-slate-850 p-4 rounded-xl bg-slate-50/50 dark:bg-slate-950/50">
                  <div className="space-y-1">
                    <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none block">Auditor / PIC</span>
                    <div className="flex items-center gap-1.5">
                      <span className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-800 text-[10px] font-extrabold flex items-center justify-center text-slate-700 dark:text-slate-300">
                        {selectedLog.evaluatorPic?.slice(0, 2).toUpperCase()}
                      </span>
                      <span className="text-xs font-black text-slate-800 dark:text-slate-200 leading-none">
                        {selectedLog.evaluatorPic}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none block">PIC Auditor RS</span>
                    <div className="flex items-center gap-1.5 min-h-[24px]">
                      <span className="text-xs font-black text-slate-800 dark:text-slate-200 leading-tight">
                        {selectedLog.picAuditorRS || <span className="text-slate-400 font-bold italic">-</span>}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none block">Tanggal Pelaksanaan</span>
                    <div className="flex items-center gap-1.5 text-xs font-extrabold text-slate-700 dark:text-slate-300">
                      <Calendar className="w-4 h-4 text-slate-450 shrink-0" />
                      <span>{selectedLog.date}</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none block">Status Perkembangan</span>
                    <div>
                      {(() => {
                        let statusColor = "bg-rose-50 border-rose-200 text-rose-600 dark:bg-rose-950/30 dark:border-rose-900/60 dark:text-rose-450";
                        if (selectedLog.status === "In Progress") {
                          statusColor = "bg-amber-50 border-amber-200 text-amber-600 dark:bg-amber-950/30 dark:border-amber-900/60 dark:text-amber-450";
                        } else if (selectedLog.status === "Resolved") {
                          statusColor = "bg-emerald-50 border-emerald-200 text-emerald-600 dark:bg-emerald-950/30 dark:border-emerald-900/60 dark:text-emerald-450";
                        }
                        return (
                          <span className={`inline-block text-[10px] font-black px-2.5 py-0.5 rounded-full border ${statusColor}`}>
                            {selectedLog.status}
                          </span>
                        );
                      })()}
                    </div>
                  </div>
                </div>

                {/* Show Linkage details */}
                {(selectedLog.linkedProjectId || selectedLog.linkedTaskId) && (
                  (() => {
                    const lProj = selectedLog.linkedProjectId ? projects.find(p => p.kode === selectedLog.linkedProjectId) : null;
                    const lTask = selectedLog.linkedTaskId ? tasks.find(t => t.id === selectedLog.linkedTaskId) : null;
                    return (
                      <div className="p-4 bg-blue-50/40 dark:bg-blue-950/10 border border-blue-200/50 dark:border-blue-900/40 rounded-xl space-y-3.5">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4.5 h-4.5 text-blue-500 shrink-0" />
                          <h4 className="text-xs font-black text-blue-700 dark:text-blue-400 uppercase tracking-wide">
                            Koneksi Target Evaluasi (Pihak Yang Dievaluasi)
                          </h4>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-bold text-slate-700 dark:text-slate-300">
                          <div className="space-y-1">
                            <span className="block text-[9px] font-black uppercase text-slate-400 tracking-wider">Project Master Terkait</span>
                            {selectedLog.linkedProjectId ? (
                              <span className="font-extrabold text-slate-800 dark:text-white block leading-tight">
                                [{selectedLog.linkedProjectId}] {lProj ? lProj.nama : "Informasi Project Tidak Tersedia"}
                              </span>
                            ) : (
                              <span className="text-amber-600 dark:text-amber-400 font-extrabold block leading-tight">
                                Tugas Mandiri (Tanpa Project Master)
                              </span>
                            )}
                          </div>

                          {lTask && (
                            <div className="space-y-1">
                              <span className="block text-[9px] font-black uppercase text-slate-400 tracking-wider">Tugas & Progress Terkait</span>
                              <span className="font-extrabold text-slate-800 dark:text-white block leading-tight">
                                {lTask.task} (PIC: {lTask.pic})
                              </span>
                              <div className="flex items-center gap-1.5 mt-1.5">
                                <div className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                                  <div className="h-full bg-blue-500" style={{ width: `${lTask.progress}%` }} />
                                </div>
                                <span className="text-[10px] text-slate-450 font-black shrink-0">{lTask.progress}%</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()
                )}

                {/* Temuan - Body text */}
                <div className="space-y-1.5">
                  <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                    Temuan & Detail Kendala Lapangan
                  </h3>
                  <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-850 text-xs font-semibold leading-relaxed whitespace-pre-wrap text-slate-755 dark:text-slate-200">
                    {selectedLog.findings}
                  </div>
                </div>

                {/* RecommendationsSolusi - Body text */}
                <div className="space-y-1.5">
                  <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                    Rencana Tindak Lanjut (RTL) / Rekomendasi Solusi
                  </h3>
                  <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-850 text-xs font-semibold leading-relaxed whitespace-pre-wrap text-slate-755 dark:text-slate-200">
                    {selectedLog.recommendations}
                  </div>
                </div>

                {/* File Attachment download block */}
                {selectedLog.attachmentName && selectedLog.attachmentData && (
                  <div className="space-y-1.5">
                    <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                      Lampiran Dokumen Tambahan
                    </h3>
                    <div className="p-3.5 bg-emerald-50/30 dark:bg-emerald-950/10 border border-emerald-200/40 dark:border-emerald-900/40 rounded-xl flex items-center justify-between gap-3 text-left">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="p-2 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-450 rounded-xl">
                          <Paperclip className="w-5 h-5 shrink-0" />
                        </span>
                        <div className="min-w-0 font-bold">
                          <p className="text-xs text-slate-800 dark:text-white truncate">
                            {selectedLog.attachmentName}
                          </p>
                          <p className="text-[10px] text-slate-450 dark:text-slate-500 mt-0.5">
                            Ukuran Berkas: {selectedLog.attachmentSize || "Unknown"}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleDownloadAttachment(selectedLog.attachmentName || "lampiran_evaluasi", selectedLog.attachmentData || "")}
                        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-black tracking-normal transition-all hover:shadow-xs cursor-pointer inline-flex items-center gap-1 shrink-0"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Unduh Lampiran</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Hasil Evaluasi Progress - Post-Add Specific Interaction */}
                <div className="space-y-3 flex flex-col border-t border-slate-100 dark:border-slate-850 pt-4 mt-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="p-1 px-2 text-[9px] font-black bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-450 rounded border border-emerald-200/30 dark:border-emerald-850 uppercase tracking-wider">
                        Hasil Akhir & Tindak Lanjut Pasca MONEV
                      </span>
                    </div>

                    {!isEditingResult && (
                      <button
                        type="button"
                        onClick={() => {
                          setEvalResultText(selectedLog.hasilEvaluasi || "");
                          setIsEditingResult(true);
                        }}
                        className="px-2.5 py-1 bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-850 text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white rounded-lg text-[10px] font-semibold tracking-tight transition-all cursor-pointer flex items-center gap-1 border border-slate-200/60 dark:border-slate-800"
                      >
                        <Edit className="w-3 h-3 text-slate-400" />
                        <span>{selectedLog.hasilEvaluasi ? "Perbaiki Catatan" : "Ketik Hasil Evaluasi"}</span>
                      </button>
                    )}
                  </div>

                  {isEditingResult ? (
                    <div className="space-y-3 p-4 bg-slate-50/50 dark:bg-slate-950/25 rounded-xl border border-slate-100 dark:border-slate-850">
                      <p className="text-[10px] text-slate-400 font-bold leading-relaxed mb-0.5">
                        Tuliskan rincian penyelesaian tindak lanjut nyata pasca-audit secara detail:
                      </p>
                      <textarea
                        rows={3}
                        value={evalResultText}
                        onChange={(e) => setEvalResultText(e.target.value)}
                        placeholder="Contoh: Telah dilakukan koreksi parameter tarif billing SIMRS di site RS Hermina. Transaksi billing kasir lancar di bawah 2 detik, kendala selesai dan status dipindahkan ke Resolved."
                        className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-800 focus:border-indigo-500 rounded-lg text-xs font-semibold text-slate-805 dark:text-white outline-none placeholder:text-slate-400"
                      />
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setIsEditingResult(false)}
                          className="px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-[10px] rounded-lg text-slate-550 dark:text-slate-400 font-bold cursor-pointer"
                        >
                          Batal
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              await onUpdateMonevLog(selectedLog.id, {
                                hasilEvaluasi: evalResultText
                              });
                              setIsEditingResult(false);
                            } catch (err: any) {
                              alert("Gagal memperbarui hasil evaluasi: " + err.message);
                            }
                          }}
                          className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] rounded-lg font-black tracking-normal transition-all hover:shadow-xs cursor-pointer inline-flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Simpan Hasil</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-850">
                      {selectedLog.hasilEvaluasi ? (
                        <p className="text-xs font-semibold leading-relaxed whitespace-pre-wrap text-slate-755 dark:text-slate-205">
                          {selectedLog.hasilEvaluasi}
                        </p>
                      ) : (
                        <div className="text-center py-2 space-y-1.5">
                          <HelpCircle className="w-6 h-6 text-slate-300 dark:text-slate-700 mx-auto" />
                          <p className="text-[11px] text-slate-400 dark:text-slate-500 font-bold italic">
                            Belum ada hasil tindak lanjut pasca-audit yang didaftarkan.
                          </p>
                          <button
                            type="button"
                            onClick={() => setIsEditingResult(true)}
                            className="mt-1 text-[10px] text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 font-extrabold focus:outline-none"
                          >
                            Isi Hasil Evaluasi Sekarang &rarr;
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Created status */}
                <p className="text-[9px] text-slate-400 text-right font-extrabold italic pt-2">
                  Didaftarkan oleh {selectedLog.createdBy || "System"} pada {new Date(selectedLog.createdAt).toLocaleString("id-ID")}
                </p>
              </motion.div>
            ) : (
              
              /* WELCOME / NO LOG SELECTED STATE */
              <motion.div
                key="monev-blank"
                className="bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 p-12 rounded-2xl flex flex-col items-center justify-center text-center space-y-4 min-h-[460px] cursor-pointer"
                onClick={handleInitAddNew}
              >
                <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-100 dark:border-indigo-900 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <ClipboardList className="w-8 h-8 animate-bounce" />
                </div>
                <div className="max-w-md">
                  <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider">Lembar Detail Evaluasi</h3>
                  <p className="text-xs text-slate-550 dark:text-slate-400 mt-2 font-medium leading-relaxed">
                    Pilih salah satu catatan di samping kiri untuk mengulas isi audit, mengunduh file lampiran, atau klik tombol di bawah untuk mengisi formulir temuan evaluasi baru secara mandiri.
                  </p>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleInitAddNew();
                  }}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                >
                  <Plus className="w-4.5 h-4.5" />
                  <span>Isi Formulir Evaluasi Baru</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      
    </div>
  );
}
