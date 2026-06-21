import React, { useState, useRef } from "react";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
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
  CheckSquare,
  FileSpreadsheet,
  Flag,
  Filter,
  MessageSquare,
  MoreHorizontal,
  Grid,
  Check
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface TicketsViewProps {
  tickets: Ticket[];
  clients: Client[];
  projects: Project[];
  currentUser: User | null;
  settings?: any;
  users?: User[];
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
  users = [],
  onAddTicket,
  onUpdateTicket,
  onDeleteTicket
}: TicketsViewProps) {
  const ticketCategories = settings?.kategoriLaporan
    ? settings.kategoriLaporan.filter((x: any) => x.active).map((x: any) => x.value)
    : [
         "Software/SIMRS",
         "Hardware/PC",
         "Network/Internet",
         "Peripheral/Printer",
         "Access/Account"
      ];

  const ticketSubCategories = settings?.subKategori
    ? settings.subKategori.filter((x: any) => x.active).map((x: any) => x.value)
    : [
        "Software/SIMRS: EMR",
        "Software/SIMRS: Pendaftaran",
        "Software/SIMRS: Poli",
        "Software/SIMRS: Apotek",
        "Software/SIMRS: Laboratorium",
        "Software/SIMRS: Kasir",
        "Hardware/PC: PC Desktop",
        "Hardware/PC: Laptop",
        "Hardware/PC: Monitor",
        "Hardware/PC: RAM/Harddisk",
        "Network/Internet: Koneksi Wifi",
        "Network/Internet: LAN Cable",
        "Network/Internet: Switch/Hub",
        "Network/Internet: Mikrotik Router",
        "Peripheral/Printer: Printer Thermal",
        "Peripheral/Printer: Printer Inkjet",
        "Peripheral/Printer: Barcode Scanner",
        "Access/Account: Akun SIMRS",
        "Access/Account: Email RS",
        "Access/Account: Hak Akses Menu"
      ];

  const ticketProblemTypes = settings?.jenisMasalah
    ? settings.jenisMasalah.filter((x: any) => x.active).map((x: any) => x.value)
    : [
        "EMR: Buka Berkas Pasien",
        "EMR: Input Diagnosa Gagal",
        "EMR: Cari Berkas Pasien",
        "EMR: Resep EMR tidak tampil",
        "Pendaftaran: Gagal Cetak Tracer",
        "Pendaftaran: No RM Ganda",
        "Pendaftaran: Pasien BPJS tidak valid",
        "Apotek: Stok Obat Minus",
        "Apotek: Resep Elektronik pending",
        "Printer Thermal: Kertas printer macet",
        "Printer Thermal: Cetak struk pudar / tidak jelas"
      ];

  const reportTypes = settings?.jenisLaporan
    ? settings.jenisLaporan.filter((x: any) => x.active).map((x: any) => x.value)
    : [
        "Incident",
        "Request"
      ];

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
  const [filterPicTugas, setFilterPicTugas] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Reset page to 1 whenever filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterProject, filterType, filterStatus, filterCategory, filterPicTugas]);

  // Table row expand-collapse state manager
  const [expandedTicketId, setExpandedTicketId] = useState<string | null>(null);
  const [activeStatusTab, setActiveStatusTab] = useState("All");
  const [activeStatusDropdownId, setActiveStatusDropdownId] = useState<string | null>(null);
  const [activeAssigneeDropdownId, setActiveAssigneeDropdownId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");

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
  const [customUnit, setCustomUnit] = useState("");
  const [reportType, setReportType] = useState<string>("");
  const [category, setCategory] = useState("");
  const [subCategory, setSubCategory] = useState("");
  const [customSubCategory, setCustomSubCategory] = useState("");
  const [problemType, setProblemType] = useState("");
  const [customProblemType, setCustomProblemType] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [picPelapor, setPicPelapor] = useState("");
  const [picTugas, setPicTugas] = useState("");

  // Follow-up & Penyelesaian States
  const [isFollowUpOpen, setIsFollowUpOpen] = useState(false);
  const [followUpTicket, setFollowUpTicket] = useState<Ticket | null>(null);
  const [followUpStatus, setFollowUpStatus] = useState<string>("In Progress");
  const [followUpNotes, setFollowUpNotes] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");
  const [followUpTime, setFollowUpTime] = useState("");

  // New customization fields:
  const [ticketNumber, setTicketNumber] = useState("");
  const [customCreatedAt, setCustomCreatedAt] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [fileName, setFileName] = useState("");
  const [activeEditorTab, setActiveEditorTab] = useState<"write" | "preview">("write");
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportRangeType, setExportRangeType] = useState<"today" | "week" | "month" | "range" | "all" | "filtered">("today");
  const [exportStartDate, setExportStartDate] = useState(() => {
    const today = new Date();
    const pad = (num: number) => String(num).padStart(2, "0");
    return `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;
  });
  const [exportEndDate, setExportEndDate] = useState(() => {
    const today = new Date();
    const pad = (num: number) => String(num).padStart(2, "0");
    return `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;
  });
  const [exportMonth, setExportMonth] = useState(() => {
    const today = new Date();
    const pad = (num: number) => String(num).padStart(2, "0");
    return `${today.getFullYear()}-${pad(today.getMonth() + 1)}`;
  });

  const formatDateTimeFull = (dateStr?: string | null) => {
    if (!dateStr) return "-";
    try {
      const dt = new Date(dateStr);
      if (isNaN(dt.getTime())) return dateStr;
      const dStr = dt.getDate().toString().padStart(2, "0");
      const mStr = (dt.getMonth() + 1).toString().padStart(2, "0");
      const yr = dt.getFullYear();
      const hr = dt.getHours().toString().padStart(2, "0");
      const mn = dt.getMinutes().toString().padStart(2, "0");
      return `${dStr}-${mStr}-${yr} ${hr}:${mn}`;
    } catch (_) {
      return dateStr;
    }
  };

  const getTicketClosedAt = (t: Ticket) => {
    if (t.closedAt) return formatDateTimeFull(t.closedAt);
    
    // Parse from description fallback if available
    if (t.description && (t.status === "Resolved" || t.status === "Solved" || t.status === "Closed")) {
      const match = t.description.match(/\((\d{2}-\d{2}-\d{4} \d{2}:\d{2})\)/);
      if (match && match[1]) {
        return match[1];
      }
    }
    return "-";
  };

  const getInitialDescription = (desc?: string | null) => {
    if (!desc) return "-";
    const patterns = [
      "\n\n---\n**[",
      "\r\n\r\n---\r\n**[",
      "\n---\n**[",
      "\r\n---\r\n**[",
      "\n\n---",
      "\r\n\r\n---",
      "\n---"
    ];
    for (const pat of patterns) {
      const idx = desc.indexOf(pat);
      if (idx !== -1) {
        return desc.substring(0, idx).trim();
      }
    }
    return desc.trim();
  };

  const getLegacyFollowUpsOnly = (desc?: string | null) => {
    if (!desc) return "";
    const patterns = [
      "\n\n---\n**[",
      "\r\n\r\n---\r\n**[",
      "\n---\n**[",
      "\r\n---\r\n**[",
      "\n\n---",
      "\r\n\r\n---",
      "\n---"
    ];
    for (const pat of patterns) {
      const idx = desc.indexOf(pat);
      if (idx !== -1) {
        return desc.substring(idx).trim();
      }
    }
    return "";
  };

  const getCombinedFollowUpText = (t: Ticket) => {
    const legacy = getLegacyFollowUpsOnly(t.description);
    const modern = t.followUpLog || "";
    if (legacy && modern) {
      if (modern.includes(legacy.trim())) {
        return modern.trim();
      }
      return `${legacy}\n\n${modern}`.trim();
    }
    return (modern || legacy || "").trim();
  };

  const handleExportExcel = () => {
    try {
      let ticketsToExport = [...tickets];
      const now = new Date();
      
      const getStartOfDay = (d: Date) => {
        const nd = new Date(d);
        nd.setHours(0, 0, 0, 0);
        return nd;
      };

      const getEndOfDay = (d: Date) => {
        const nd = new Date(d);
        nd.setHours(23, 59, 59, 999);
        return nd;
      };

      if (exportRangeType === "today") {
        const todayStart = getStartOfDay(now);
        const todayEnd = getEndOfDay(now);
        ticketsToExport = tickets.filter(t => {
          const tDate = new Date(t.createdAt);
          return tDate >= todayStart && tDate <= todayEnd;
        });
      } else if (exportRangeType === "week") {
        const currentDay = now.getDay();
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - currentDay);
        const weekStart = getStartOfDay(startOfWeek);
        
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        const weekEnd = getEndOfDay(endOfWeek);

        ticketsToExport = tickets.filter(t => {
          const tDate = new Date(t.createdAt);
          return tDate >= weekStart && tDate <= weekEnd;
        });
      } else if (exportRangeType === "month") {
        if (!exportMonth) {
          alert("Silakan pilih bulan ekspor terlebih dahulu!");
          return;
        }
        const [yearStr, monthStr] = exportMonth.split("-");
        const year = parseInt(yearStr, 10);
        const monthIndex = parseInt(monthStr, 10) - 1;

        const monthStart = new Date(year, monthIndex, 1, 0, 0, 0, 0);
        const monthEnd = new Date(year, monthIndex + 1, 0, 23, 59, 59, 999);

        ticketsToExport = tickets.filter(t => {
          const tDate = new Date(t.createdAt);
          return tDate >= monthStart && tDate <= monthEnd;
        });
      } else if (exportRangeType === "range") {
        if (!exportStartDate || !exportEndDate) {
          alert("Silakan tentukan Rentang Tanggal Mulai dan Selesai!");
          return;
        }
        const customStart = getStartOfDay(new Date(exportStartDate));
        const customEnd = getEndOfDay(new Date(exportEndDate));

        ticketsToExport = tickets.filter(t => {
          const tDate = new Date(t.createdAt);
          return tDate >= customStart && tDate <= customEnd;
        });
      } else if (exportRangeType === "filtered") {
        ticketsToExport = [...filteredTickets];
      }

      if (ticketsToExport.length === 0) {
        alert("Tidak ada data tiket yang ditemukan pada rentang waktu tersebut untuk diekspor.");
        return;
      }

      const data = ticketsToExport.map((t, idx) => {
        const openDate = formatDateTimeFull(t.createdAt);
        const closeDate = getTicketClosedAt(t);

        return {
          "No": idx + 1,
          "No Tiket": t.ticketNumber || "-",
          "Tanggal Open Tiket": openDate,
          "Judul Laporan": t.title || "-",
          "Deskripsi": getInitialDescription(t.description),
          "Jenis Laporan": t.reportType || "-",
          "Kategori": t.category || "-",
          "Sub Kategori": t.subCategory || "-",
          "Ruangan": t.unit || "-",
          "Prioritas": t.priority || "-",
          "PIC Tugas": t.picTugas || "Belum Ditugaskan",
          "Status": t.status || "-",
          "Tanggal Close Tiket": closeDate,
          "Log Tindakan Follow Up": getCombinedFollowUpText(t) || "-"
        };
      });

      const worksheet = XLSX.utils.json_to_sheet(data);
      
      const maxLens = Object.keys(data[0] || {}).map(key => {
        let maxLen = key.length;
        data.forEach(row => {
          const val = (row as any)[key];
          const len = val ? String(val).length : 0;
          if (len > maxLen) maxLen = len;
        });
        return { wch: Math.min(Math.max(maxLen + 3, 10), 50) };
      });
      worksheet["!cols"] = maxLens;

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Helpdesk_Tickets");

      let rangeLabel = "Semua";
      if (exportRangeType === "today") rangeLabel = "Hari_Ini";
      else if (exportRangeType === "week") rangeLabel = "Minggu_Ini";
      else if (exportRangeType === "month") rangeLabel = `Bulan_${exportMonth}`;
      else if (exportRangeType === "range") rangeLabel = `${exportStartDate}_sd_${exportEndDate}`;
      else if (exportRangeType === "filtered") rangeLabel = "Filtered_View";

      const filename = `Data_Tiket_Helpdesk_${rangeLabel}_${new Date().toISOString().split("T")[0]}.xlsx`;
      XLSX.writeFile(workbook, filename);

      setIsExportModalOpen(false);
    } catch (err: any) {
      console.error("Export failed", err);
      alert("Gagal melakukan ekspor data ke Excel: " + err.message);
    }
  };

  const handleExportPDF = () => {
    try {
      let ticketsToExport = [...tickets];
      const now = new Date();
      
      const getStartOfDay = (d: Date) => {
        const nd = new Date(d);
        nd.setHours(0, 0, 0, 0);
        return nd;
      };

      const getEndOfDay = (d: Date) => {
        const nd = new Date(d);
        nd.setHours(23, 59, 59, 999);
        return nd;
      };

      if (exportRangeType === "today") {
        const todayStart = getStartOfDay(now);
        const todayEnd = getEndOfDay(now);
        ticketsToExport = tickets.filter(t => {
          const tDate = new Date(t.createdAt);
          return tDate >= todayStart && tDate <= todayEnd;
        });
      } else if (exportRangeType === "week") {
        const currentDay = now.getDay();
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - currentDay);
        const weekStart = getStartOfDay(startOfWeek);
        
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        const weekEnd = getEndOfDay(endOfWeek);

        ticketsToExport = tickets.filter(t => {
          const tDate = new Date(t.createdAt);
          return tDate >= weekStart && tDate <= weekEnd;
        });
      } else if (exportRangeType === "month") {
        if (!exportMonth) {
          alert("Silakan pilih bulan ekspor terlebih dahulu!");
          return;
        }
        const [yearStr, monthStr] = exportMonth.split("-");
        const year = parseInt(yearStr, 10);
        const monthIndex = parseInt(monthStr, 10) - 1;

        const monthStart = new Date(year, monthIndex, 1, 0, 0, 0, 0);
        const monthEnd = new Date(year, monthIndex + 1, 0, 23, 59, 59, 999);

        ticketsToExport = tickets.filter(t => {
          const tDate = new Date(t.createdAt);
          return tDate >= monthStart && tDate <= monthEnd;
        });
      } else if (exportRangeType === "range") {
        if (!exportStartDate || !exportEndDate) {
          alert("Silakan tentukan Rentang Tanggal Mulai dan Selesai!");
          return;
        }
        const customStart = getStartOfDay(new Date(exportStartDate));
        const customEnd = getEndOfDay(new Date(exportEndDate));

        ticketsToExport = tickets.filter(t => {
          const tDate = new Date(t.createdAt);
          return tDate >= customStart && tDate <= customEnd;
        });
      } else if (exportRangeType === "filtered") {
        ticketsToExport = [...filteredTickets];
      }

      if (ticketsToExport.length === 0) {
        alert("Tidak ada data tiket yang ditemukan pada rentang waktu tersebut untuk diekspor ke PDF.");
        return;
      }

      // Initialize jsPDF (Landscape, mm, Custom size: F4 is 330 x 215 mm)
      const doc = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: [330, 215]
      });

      // Drawing clear elegant header with white background (as requested: header putih saja)
      doc.setFillColor(255, 255, 255);
      doc.rect(0, 0, 330, 44, "F");

      // Draw horizontal separator line in slate-200
      doc.setDrawColor(218, 224, 233);
      doc.setLineWidth(0.6);
      doc.line(15, 41, 315, 41);

      // Title & Header Text (slate-900 look)
      doc.setTextColor(15, 23, 42); 
      doc.setFont("helvetica", "bold");
      doc.setFontSize(15);
      doc.text("LAPORAN WORK TICKETS & HELPDESK", 15, 13);
      
      // Selected Lokasi/Site Highlight
      const selectedSite = filterProject || "Semua Lokasi / Site";
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(79, 70, 229); // Indigo-600
      doc.text(`LOKASI SITE: ${selectedSite.toUpperCase()}`, 15, 21);

      // Metadata info (slate-600)
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(71, 85, 105);
      const formattedNow = now.toLocaleDateString("id-ID", {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
      });
      doc.text(`Dicetak Pada: ${formattedNow}  |  Oleh: ${currentUser?.name || currentUser?.username || "Sistem"}`, 15, 28);

      // Filter Information Highlight
      let rangeText = "Semua Tiket";
      if (exportRangeType === "today") rangeText = "Hari Ini (Today)";
      else if (exportRangeType === "week") rangeText = "Minggu Ini (This Week)";
      else if (exportRangeType === "month") {
        const [yearStr, monthStr] = exportMonth.split("-");
        const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
        rangeText = `Bulan ${months[parseInt(monthStr, 10) - 1]} ${yearStr}`;
      } else if (exportRangeType === "range") {
        const fm = (ds: string) => {
          try {
            const parts = ds.split("-");
            return `${parts[2]}-${parts[1]}-${parts[0]}`;
          } catch (_) { return ds; }
        };
        rangeText = `Rentang ${fm(exportStartDate)} s/d ${fm(exportEndDate)}`;
      } else if (exportRangeType === "filtered") {
        rangeText = "Filtered View (Sesuai Filter di Tabel halaman utama)";
      }

      // Add Range text badge below (slate-500)
      doc.setFont("helvetica", "semibold");
      doc.setTextColor(100, 116, 139);
      doc.text(`Kriteria Rentang Waktu: ${rangeText}`, 15, 34);

      // Prepare table columns and rows in exact specified order:
      // 1. No, 2. No Tiket, 3. Tanggal Open Tiket, 4. Judul Laporan, 5. Deskripsi, 6. Jenis Laporan, 7. Kategori, 8. Sub Kategori, 9. Ruangan, 10. Prioritas, 11. PIC Tugas, 12. Status, 13. Tanggal Close Tiket, 14. Log Follow-Up
      const tableHeaders = [
        [
          "No", 
          "No Tiket", 
          "Tgl Open Tiket", 
          "Judul Laporan", 
          "Deskripsi", 
          "Jenis Laporan", 
          "Kategori", 
          "Sub Kategori", 
          "Ruangan", 
          "Prioritas", 
          "PIC Tugas", 
          "Status", 
          "Tgl Close Tiket",
          "Log Follow-Up"
        ]
      ];
 
      const tableRows = ticketsToExport.map((t, idx) => {
        const openDate = formatDateTimeFull(t.createdAt);
        const closeDate = getTicketClosedAt(t);
 
        return [
          idx + 1,
          t.ticketNumber || "-",
          openDate,
          t.title || "-",
          getInitialDescription(t.description),
          t.reportType || "-",
          t.category || "-",
          t.subCategory || "-",
          t.unit || "-",
          t.priority || "-",
          t.picTugas || "Belum Ditugaskan",
          t.status || "-",
          closeDate,
          getCombinedFollowUpText(t) || "-"
        ];
      });
 
      // Draw autoTable starting at y = 46 (below divider line at 41)
      autoTable(doc, {
        head: tableHeaders,
        body: tableRows,
        startY: 46,
        theme: "striped",
        headStyles: {
          fillColor: [79, 70, 229], // Indigo 600
          textColor: 255,
          fontStyle: "bold",
          fontSize: 7.5,
          halign: "left"
        },
        styles: {
          fontSize: 7,
          cellPadding: 1.8,
          font: "helvetica",
          overflow: "linebreak"
        },
        columnStyles: {
          0: { cellWidth: 8 },    // No
          1: { cellWidth: 20 },   // No Tiket
          2: { cellWidth: 24 },   // Tgl Open Tiket
          3: { cellWidth: 25 },   // Judul Laporan
          4: { cellWidth: 35 },   // Deskripsi
          5: { cellWidth: 15 },   // Jenis Laporan
          6: { cellWidth: 16 },   // Kategori
          7: { cellWidth: 16 },   // Sub Kategori
          8: { cellWidth: 18 },   // Ruangan
          9: { cellWidth: 14 },   // Prioritas
          10: { cellWidth: 20 },  // PIC Tugas
          11: { cellWidth: 14 },  // Status
          12: { cellWidth: 24 },  // Tgl Close Tiket
          13: { cellWidth: 51 },  // Log Follow-Up
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252]
        },
        didDrawPage: (data) => {
          // Footer at bottom of F4 page
          doc.setFont("helvetica", "normal");
          doc.setFontSize(8);
          doc.setTextColor(148, 163, 184); // slate-400
          doc.text(
            `Halaman ${data.pageNumber}`,
            330 - 15 - 15,
            215 - 10
          );
          doc.text(
            "Sistem Informasi Manajemen Pelayanan RS - Helpdesk & Troubleshoot Module",
            15,
            215 - 10
          );
        },
        margin: { top: 46, bottom: 15, left: 15, right: 15 }
      });

      let rangeLabel = "Semua";
      if (exportRangeType === "today") rangeLabel = "Hari_Ini";
      else if (exportRangeType === "week") rangeLabel = "Minggu_Ini";
      else if (exportRangeType === "month") rangeLabel = `Bulan_${exportMonth}`;
      else if (exportRangeType === "range") rangeLabel = `${exportStartDate}_sd_${exportEndDate}`;
      else if (exportRangeType === "filtered") rangeLabel = "Filtered_View";

      const filename = `Data_Tiket_Helpdesk_${rangeLabel}_${new Date().toISOString().split("T")[0]}.pdf`;
      doc.save(filename);

      setIsExportModalOpen(false);
    } catch (err: any) {
      console.error("Export PDF failed", err);
      alert("Gagal melakukan ekspor data ke PDF: " + err.message);
    }
  };

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
    setCustomUnit("");
    setReportType("");
    setCategory("");
    setSubCategory("");
    setCustomSubCategory("");
    setProblemType("");
    setCustomProblemType("");
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
    setPicPelapor(currentUser?.name || currentUser?.username || "");
    setPicTugas("");
    setIsEditing(false);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (tk: Ticket) => {
    const tkDate = tk.createdAt ? new Date(tk.createdAt) : new Date();
    const localDt = toLocalDatetimeString(tkDate);

    setProjectName(tk.projectName || "");
    setReporterName(tk.reporterName || "");
    setReportType(tk.reportType || "");
    
    const tCategory = tk.category || "";
    setCategory(tCategory);

    // Dynamic resolution of subCategory and problemType
    const isStdSub = ticketSubCategories
      .filter((val: string) => {
        const parts = val.split(":");
        return parts[0].trim() === tCategory.trim();
      })
      .map((val: string) => {
        const parts = val.split(":");
        return parts.slice(1).join(":").trim();
      })
      .includes(tk.subCategory || "");

    if (tk.subCategory) {
      if (isStdSub) {
        setSubCategory(tk.subCategory);
        setCustomSubCategory("");
      } else {
        setSubCategory("Lainnya");
        setCustomSubCategory(tk.subCategory);
      }
    } else {
      setSubCategory("");
      setCustomSubCategory("");
    }

    const tSub = tk.subCategory || "";
    const isActiveSub = isStdSub ? tSub : "Lainnya";
    const isStdProb = ticketProblemTypes
      .filter((val: string) => {
        const parts = val.split(":");
        return parts[0].trim() === isActiveSub.trim();
      })
      .map((val: string) => {
        const parts = val.split(":");
        return parts.slice(1).join(":").trim();
      })
      .includes(tk.problemType || "");

    if (tk.problemType) {
      if (isStdProb) {
        setProblemType(tk.problemType);
        setCustomProblemType("");
      } else {
        setProblemType("Lainnya");
        setCustomProblemType(tk.problemType);
      }
    } else {
      setProblemType("");
      setCustomProblemType("");
    }

    // Handing unit / ruangan
    const selectedClientObj = clients.find(cl => cl.namaRS === tk.projectName);
    const clientRooms = selectedClientObj?.rooms || [];
    const isStdUnit = clientRooms.some(rm => rm.name === tk.unit);
    if (tk.unit) {
      if (clientRooms.length > 0 && isStdUnit) {
        setUnit(tk.unit);
        setCustomUnit("");
      } else if (clientRooms.length > 0) {
        setUnit("Lainnya");
        setCustomUnit(tk.unit);
      } else {
        setUnit(tk.unit);
        setCustomUnit("");
      }
    } else {
      setUnit("");
      setCustomUnit("");
    }

    setTitle(tk.title || "");
    setDescription(getInitialDescription(tk.description));
    setStatus(tk.status || "");
    setPriority(tk.priority || "");
    setPicPelapor(tk.picPelapor || "");
    setPicTugas(tk.picTugas || "");
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

    const finalUnit = unit === "Lainnya" ? customUnit.trim() : unit.trim();
    if (!finalUnit) {
      alert("Unit / Ruangan pelapor wajib diisi!");
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

    const finalSubCategory = subCategory === "Lainnya" ? customSubCategory.trim() : subCategory.trim();
    const finalProblemType = problemType === "Lainnya" ? customProblemType.trim() : problemType.trim();

    const finalCreatedAt = customCreatedAt ? new Date(customCreatedAt).toISOString() : new Date().toISOString();

    const payload: Partial<Ticket> = {
      projectName,
      reporterName,
      unit: finalUnit,
      reportType: reportType as any,
      category,
      subCategory: finalSubCategory || undefined,
      problemType: finalProblemType || undefined,
      title,
      description,
      status,
      priority,
      ticketNumber,
      createdAt: finalCreatedAt,
      fileUrl,
      fileName,
      picPelapor: picPelapor || (currentUser?.name || currentUser?.username || ""),
      picTugas: picTugas || undefined
    };

    if (isEditing) {
      const oldTicket = tickets.find(t => t.id === editId);
      if (oldTicket) {
        const legacyFollowUps = getLegacyFollowUpsOnly(oldTicket.description);
        const oldLog = oldTicket.followUpLog || "";
        let combinedLog = oldLog.trim();
        if (legacyFollowUps) {
          if (combinedLog) {
            if (!combinedLog.includes(legacyFollowUps.trim())) {
              combinedLog = legacyFollowUps.trim() + "\n\n" + combinedLog;
            }
          } else {
            combinedLog = legacyFollowUps.trim();
          }
        }
        if (combinedLog) {
          payload.followUpLog = combinedLog;
        }
      }
      await onUpdateTicket(editId, payload);
    } else {
      await onAddTicket(payload);
    }
    setIsFormOpen(false);
  };

  // Follow up/Penyelesaian Button actions
  const handleOpenFollowUp = (tk: Ticket) => {
    if (tk.status === "Solved" || tk.status === "Resolved" || tk.status === "Closed") {
      alert("Tiket sudah diselesaikan (Solved) dan tidak dapat ditindaklanjuti lagi.");
      return;
    }
    setFollowUpTicket(tk);
    if (tk.status === "Open" || !tk.status) {
      setFollowUpStatus("In Progress");
    } else {
      setFollowUpStatus("Solved");
    }
    setFollowUpNotes("");

    // Initialize date and time to current localized time
    const now = new Date();
    const pad = (num: number) => String(num).padStart(2, "0");
    const dateStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
    const timeStr = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
    setFollowUpDate(dateStr);
    setFollowUpTime(timeStr);

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

    let timestampStr = "";
    try {
      // Use custom user-selected date & time for the action timestamp if valid
      const customDateTime = new Date(`${followUpDate}T${followUpTime}`);
      if (!isNaN(customDateTime.getTime())) {
        timestampStr = formatTicketDate(customDateTime.toISOString());
      } else {
        timestampStr = formatTicketDate(new Date().toISOString());
      }
    } catch (err) {
      timestampStr = formatTicketDate(new Date().toISOString());
    }

    const operatorName = currentUser?.name || currentUser?.username || "Petugas";

    const statusLabel = followUpStatus === "Solved" ? "Solved (Selesai)" : followUpStatus === "Closed" ? "Closed (Terkunci Selesai)" : "In Progress (Dalam Penindakan)";
    const followUpBlock = `\n\n---\n**[Follow Up / Penyelesaian]**\n* **Status Baru**: \`${statusLabel}\`\n* **Oleh**: ${operatorName} (${timestampStr})\n* **Catat Tindakan**: ${followUpNotes.trim()}`;

    const oldLog = followUpTicket.followUpLog || "";
    const legacyFollowUps = getLegacyFollowUpsOnly(followUpTicket.description);
    let baseLog = oldLog.trim();
    if (!baseLog && legacyFollowUps) {
      baseLog = legacyFollowUps.trim();
    }
    const updatedFollowUpLog = baseLog ? `${baseLog}\n\n${followUpBlock.trim()}` : followUpBlock.trim();

    const cleanDescription = getInitialDescription(followUpTicket.description);
    const updatedStatus = followUpStatus;
    const isNowClosed = updatedStatus === "Solved" || updatedStatus === "Resolved" || updatedStatus === "Closed";

    try {
      await onUpdateTicket(followUpTicket.id, {
        status: updatedStatus,
        description: cleanDescription,
        followUpLog: updatedFollowUpLog,
        ...(isNowClosed ? { closedAt: new Date().toISOString() } : {})
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

    const oldLog = tk.followUpLog || "";
    const legacyFollowUps = getLegacyFollowUpsOnly(tk.description);
    let baseLog = oldLog.trim();
    if (!baseLog && legacyFollowUps) {
      baseLog = legacyFollowUps.trim();
    }
    const updatedFollowUpLog = followUpBlock 
      ? (baseLog ? `${baseLog}\n\n${followUpBlock.trim()}` : followUpBlock.trim())
      : baseLog;

    const cleanDescription = getInitialDescription(tk.description);
    const isNowClosed = newStatus === "Closed" || newStatus === "Resolved" || newStatus === "Solved";

    try {
      await onUpdateTicket(tk.id, {
        status: newStatus,
        description: cleanDescription,
        followUpLog: updatedFollowUpLog,
        closedAt: isNowClosed ? new Date().toISOString() : ""
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

  // Metric Calculation helper
  const total = tickets.length;
  const openCount = tickets.filter(t => t.status === "Open" || t.status === "To Do" || t.status === "To do" || !t.status).length;
  const progressCount = tickets.filter(t => t.status === "In Progress" || t.status === "Doing").length;
  const solvedCount = tickets.filter(t => t.status === "Resolved" || t.status === "Solved" || t.status === "Closed" || t.status === "Completed").length;
  const incidentCount = tickets.filter(t => t.reportType === "Incident").length;
  const requestCount = tickets.filter(t => t.reportType === "Request").length;

  const metricLowPriority = tickets.filter(t => t.priority === "Low" || !t.priority).length;
  const metricMediumPriority = tickets.filter(t => t.priority === "Medium").length;
  const metricHighPriority = tickets.filter(t => t.priority === "High" || t.priority === "Urgent").length;
  const metricOverdue = tickets.filter(t => t.status === "Overdue" || (t.dueDate && new Date(t.dueDate) < new Date() && t.status !== "Completed" && t.status !== "Solved" && t.status !== "Resolved" && t.status !== "Closed")).length;

  const siteList = clients.map(c => c.namaRS);
  const allRefs = Array.from(new Set([...siteList, "Global / Umum"]));

  const uniquePicTugasList = Array.from(
    new Set([
      ...users.filter(u => u.statusAktif !== false).map(u => u.name),
      ...tickets.map(t => t.picTugas).filter((pic): pic is string => !!pic)
    ])
  ).filter(Boolean).sort();

  // Counts for each Tab pill based on other filters (excluding activeStatusTab and filterStatus filters)
  const unfilteredForStatusTickets = tickets.filter(t => {
    const matchesSearch = 
      t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.reporterName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.unit.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.category && t.category.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (t.ticketNumber && t.ticketNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (t.description && t.description.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesProject = !filterProject || t.projectName === filterProject;
    const matchesType = !filterType || t.reportType === filterType;
    const matchesCategory = !filterCategory || t.category === filterCategory;
    const matchesPicTugas = !filterPicTugas || (t.picTugas && t.picTugas.toLowerCase().trim() === filterPicTugas.toLowerCase().trim());

    return matchesSearch && matchesProject && matchesType && matchesCategory && matchesPicTugas;
  });

  const tabCountAll = unfilteredForStatusTickets.length;
  const tabCountTodo = unfilteredForStatusTickets.filter(t => t.status === "Open" || t.status === "To Do" || t.status === "To do" || !t.status).length;
  const tabCountInprogress = unfilteredForStatusTickets.filter(t => t.status === "In Progress" || t.status === "Doing").length;
  const tabCountCompleted = unfilteredForStatusTickets.filter(t => t.status === "Resolved" || t.status === "Solved" || t.status === "Closed" || t.status === "Completed").length;
  const tabCountOverdue = unfilteredForStatusTickets.filter(t => t.status === "Overdue" || (t.dueDate && new Date(t.dueDate) < new Date() && t.status !== "Completed" && t.status !== "Solved" && t.status !== "Resolved" && t.status !== "Closed")).length;

  // Global search filters
  const filteredTickets = unfilteredForStatusTickets.filter(t => {
    const matchesStatus = !filterStatus || 
      t.status === filterStatus || 
      (filterStatus === "Solved" && t.status === "Resolved") ||
      (filterStatus === "Resolved" && t.status === "Solved") ||
      (filterStatus === "Open" && (t.status === "To Do" || t.status === "To do" || !t.status)) ||
      (filterStatus === "In Progress" && t.status === "Doing");

    const matchesStatusTab =
      activeStatusTab === "All" ||
      (activeStatusTab === "To Do" && (t.status === "Open" || t.status === "To Do" || t.status === "To do" || !t.status)) ||
      (activeStatusTab === "Inprogress" && (t.status === "In Progress" || t.status === "Doing")) ||
      (activeStatusTab === "Completed" && (t.status === "Solved" || t.status === "Resolved" || t.status === "Closed" || t.status === "Completed")) ||
      (activeStatusTab === "Overdue" && (t.status === "Overdue" || (t.dueDate && new Date(t.dueDate) < new Date() && t.status !== "Completed" && t.status !== "Solved" && t.status !== "Resolved" && t.status !== "Closed")));

    return matchesStatus && matchesStatusTab;
  });

  const totalItems = filteredTickets.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const activePage = Math.min(currentPage, totalPages);
  const startIndex = (activePage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedTickets = filteredTickets.slice(startIndex, endIndex);

  const getUserInitials = (name: string) => {
    if (!name) return "U";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const getUserColorBg = (name: string) => {
    if (!name) return "bg-slate-400";
    const colors = [
      "bg-teal-500",
      "bg-rose-550",
      "bg-amber-500",
      "bg-emerald-500",
      "bg-sky-500",
      "bg-indigo-500",
      "bg-purple-500",
      "bg-cyan-500",
      "bg-orange-500"
    ];
    let sum = 0;
    for (let i = 0; i < name.length; i++) {
      sum += name.charCodeAt(i);
    }
    return colors[sum % colors.length];
  };

  const formatDueDate = (dateStr?: string) => {
    if (!dateStr) return "";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      return `${d.getDate()} ${months[d.getMonth()]}, ${d.getFullYear()}`;
    } catch (_) {
      return dateStr;
    }
  };

  const getTicketDueDate = (tk: Ticket) => {
    if (tk.dueDate) return formatDueDate(tk.dueDate);
    const baseDate = new Date(tk.createdAt);
    baseDate.setDate(baseDate.getDate() + 4);
    return formatDueDate(baseDate.toISOString());
  };

  // State to manage general checkbox selections
  const [selectedTaskIds, setSelectedTaskIds] = useState<Record<string, boolean>>({});
  const [activeRowMenuId, setActiveRowMenuId] = useState<string | null>(null);

  const toggleSelectAll = () => {
    const allSelected = paginatedTickets.every(tk => selectedTaskIds[tk.id]);
    const nextState: Record<string, boolean> = { ...selectedTaskIds };
    paginatedTickets.forEach(tk => {
      nextState[tk.id] = !allSelected;
    });
    setSelectedTaskIds(nextState);
  };

  const renderWorkspaceDashboard = () => {
    return (
      <div className="space-y-6">
        {/* Search and Profile Top Navigation Row */}
        <div className="flex flex-col sm:flex-row justify-between items-center bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-805 rounded-2xl p-4.5 gap-4 shadow-xs">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="w-10 h-10 rounded-xl bg-violet-50 dark:bg-violet-950/30 flex items-center justify-center text-violet-600 dark:text-violet-400">
              <LifeBuoy className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-sm font-black text-slate-850 dark:text-slate-100 tracking-tight">Helpdesk Tasks & Troubleshoot</h1>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Workspace Management</p>
            </div>
          </div>

          {/* Global Search Bar */}
          <div className="relative w-full sm:w-72 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
            <input
              type="text"
              placeholder="Search tasks, tickets, categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9.5 pr-4 py-2 w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-full text-xs font-semibold text-slate-700 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-violet-500/25 transition-all shadow-inner"
            />
          </div>

          {/* Action Widgets - Upgrade, Notifications & Profile Avatar */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => alert("Enterprise Workspace enabled.")}
              className="px-3 py-1.5 bg-gradient-to-r from-amber-400 via-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-white text-[10.5px] font-black rounded-lg flex items-center gap-1.5 shadow-xs hover:shadow active:scale-95 transition-all cursor-pointer"
            >
              <span className="text-xs">⭐</span>
              <span>Upgrade</span>
            </button>

            {/* Bell Icon */}
            <div className="relative">
              <button className="p-2 border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 rounded-xl text-slate-450 hover:text-slate-705 dark:hover:text-amber-400 cursor-pointer relative transition-colors">
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </button>
            </div>

            {/* Profile Circle Initial 'V' */}
            <div className="w-8 h-8 rounded-lg bg-violet-600 text-white font-extrabold flex items-center justify-center text-xs shadow-md border-2 border-white dark:border-slate-850 cursor-pointer hover:opacity-90 active:scale-95 transition-all overflow-hidden" title={currentUser?.name || "User Profile"}>
              {currentUser?.photoUrl ? (
                <img 
                  src={currentUser.photoUrl} 
                  alt="Avatar" 
                  className="w-full h-full object-cover" 
                  referrerPolicy="no-referrer"
                />
              ) : (
                currentUser?.name ? getUserInitials(currentUser.name) : "V"
              )}
            </div>
          </div>
        </div>

        {/* Filters Controls Panel */}
        <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-850 rounded-2xl p-5 shadow-xs space-y-4">
          {/* Row 1: SearchView, Layout toggles and Status pills tabs list */}
          <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
            <div className="flex items-center gap-3.5 w-full xl:w-auto">
              <div className="relative flex-1 min-w-[200px] max-w-sm">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Filter in view..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8.5 pr-4 py-1.5 w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-semibold text-slate-800 dark:text-slate-100"
                />
              </div>

              {/* Grid & List switchers */}
              <div className="flex items-center border border-slate-150 dark:border-slate-850 rounded-xl p-1 bg-slate-50 dark:bg-slate-950/20 shrink-0 select-none">
                <button
                  type="button"
                  onClick={() => setViewMode("list")}
                  className={`p-1.5 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                    viewMode === "list"
                      ? "bg-white dark:bg-slate-850 text-slate-850 dark:text-white shadow-xs border border-slate-200/50 dark:border-slate-750"
                      : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-350"
                  }`}
                  title="List View"
                >
                  <List className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("grid")}
                  className={`p-1.5 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                    viewMode === "grid"
                      ? "bg-white dark:bg-slate-850 text-slate-855 dark:text-white shadow-xs border border-slate-200/50 dark:border-slate-750"
                      : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-350"
                  }`}
                  title="Grid/Kanban View"
                >
                  <Grid className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Status pills tabs */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs font-bold w-full xl:w-auto overflow-x-auto pb-1 xl:pb-0 select-none">
              <button
                type="button"
                onClick={() => {
                  setActiveStatusTab("To Do");
                  setFilterStatus("");
                }}
                className={`px-3 py-1.5 rounded-full flex items-center gap-1.5 transition-all text-[11px] cursor-pointer ${
                  activeStatusTab === "To Do"
                    ? "bg-slate-850 dark:bg-slate-100 text-white dark:text-slate-950 font-black"
                    : "text-slate-500 hover:text-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 dark:text-slate-400"
                }`}
              >
                <span>To Do</span>
                <span className={`px-1.5 py-0.5 text-[9px] font-black rounded-full ${
                  activeStatusTab === "To Do" ? "bg-violet-605 text-white bg-violet-600" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                }`}>
                  {tabCountTodo}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveStatusTab("Inprogress");
                  setFilterStatus("");
                }}
                className={`px-3 py-1.5 rounded-full flex items-center gap-1.5 transition-all text-[11px] cursor-pointer ${
                  activeStatusTab === "Inprogress"
                    ? "bg-slate-850 dark:bg-slate-100 text-white dark:text-slate-950 font-black"
                    : "text-slate-500 hover:text-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 dark:text-slate-400"
                }`}
              >
                <span>Inprogress</span>
                <span className={`px-1.5 py-0.5 text-[9px] font-black rounded-full ${
                  activeStatusTab === "Inprogress" ? "bg-violet-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                }`}>
                  {tabCountInprogress}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveStatusTab("Overdue");
                  setFilterStatus("");
                }}
                className={`px-3 py-1.5 rounded-full flex items-center gap-1.5 transition-all text-[11px] cursor-pointer ${
                  activeStatusTab === "Overdue"
                    ? "bg-slate-850 dark:bg-slate-100 text-white dark:text-slate-950 font-black"
                    : "text-slate-500 hover:text-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800 dark:text-slate-400"
                }`}
              >
                <span>Overdue</span>
                <span className={`px-1.5 py-0.5 text-[9px] font-black rounded-full ${
                  activeStatusTab === "Overdue" ? "bg-rose-500 text-white" : "bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400"
                }`}>
                  {tabCountOverdue}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveStatusTab("Completed");
                  setFilterStatus("");
                }}
                className={`px-3 py-1.5 rounded-full flex items-center gap-1.5 transition-all text-[11px] cursor-pointer ${
                  activeStatusTab === "Completed"
                    ? "bg-slate-850 dark:bg-slate-100 text-white dark:text-slate-950 font-black"
                    : "text-slate-500 hover:text-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 dark:text-slate-400"
                }`}
              >
                <span>Completed</span>
                <span className={`px-1.5 py-0.5 text-[9px] font-black rounded-full ${
                  activeStatusTab === "Completed" ? "bg-emerald-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                }`}>
                  {tabCountCompleted}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveStatusTab("All");
                  setFilterStatus("");
                }}
                className={`px-3 py-1.5 rounded-full flex items-center gap-1.5 transition-all text-[11px] cursor-pointer ${
                  activeStatusTab === "All"
                    ? "bg-slate-850 dark:bg-slate-100 text-white dark:text-slate-950 font-black"
                    : "text-slate-500 hover:text-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 dark:text-slate-400"
                }`}
              >
                <span>All</span>
                <span className={`px-1.5 py-0.5 text-[9px] font-black rounded-full ${
                  activeStatusTab === "All" ? "bg-amber-500 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                }`}>
                  {tabCountAll}
                </span>
              </button>
            </div>
          </div>

          {/* Row 2: Secondary selectors & Filters dropdown trigger and create task trigger */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-slate-100 dark:border-slate-800/60">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              {/* Site selector */}
              {isUserScoped ? (
                <div className="bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-800 py-1.5 px-3 rounded-lg text-slate-500 dark:text-slate-400 font-bold flex items-center gap-1 opacity-90 select-none">
                  <span className="text-[10px] uppercase font-black tracking-wider text-slate-400">Site:</span>
                  <span>{userSite}</span>
                </div>
              ) : (
                <select
                  value={filterProject}
                  onChange={(e) => setFilterProject(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 py-1.5 px-3 rounded-lg text-slate-700 dark:text-slate-200 font-bold cursor-pointer hover:bg-slate-100 transition-colors"
                >
                  <option value="">All Locations / Site</option>
                  {allRefs.map(ref => <option key={ref} value={ref}>{ref}</option>)}
                </select>
              )}

              {/* Assignee selector */}
              <select
                value={filterPicTugas}
                onChange={(e) => setFilterPicTugas(e.target.value)}
                className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 py-1.5 px-3 rounded-lg text-slate-700 dark:text-slate-200 font-bold cursor-pointer hover:bg-slate-100 transition-colors"
              >
                <option value="">Assignee</option>
                {uniquePicTugasList.map((pic) => (
                  <option key={pic} value={pic}>{pic}</option>
                ))}
              </select>

              {/* Category / Priority Selector */}
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 py-1.5 px-3 rounded-lg text-slate-700 dark:text-slate-200 font-bold cursor-pointer hover:bg-slate-100 transition-colors"
              >
                <option value="">Category / Priority</option>
                {ticketCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>

              {/* Report Type selector */}
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 py-1.5 px-3 rounded-lg text-slate-700 dark:text-slate-200 font-bold cursor-pointer hover:bg-slate-100 transition-colors"
              >
                <option value="">All Types</option>
                {reportTypes.map((t: string) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>

              {/* Reset filter */}
              {(searchTerm || filterProject || filterType || filterStatus || filterCategory || filterPicTugas || activeStatusTab !== "All") && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm("");
                    setFilterProject(isUserScoped ? userSite : "");
                    setFilterType("");
                    setFilterStatus("");
                    setFilterCategory("");
                    setFilterPicTugas("");
                    setActiveStatusTab("All");
                  }}
                  className="px-2.5 py-1.5 bg-rose-500 hover:bg-rose-600 text-white text-[11px] font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                  title="Reset filters"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Reset</span>
                </button>
              )}

              {/* Export Button */}
              <button
                type="button"
                onClick={() => setIsExportModalOpen(true)}
                className="px-3 py-1.5 border border-slate-250 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-600 hover:text-slate-850 dark:hover:text-white rounded-lg transition-all flex items-center gap-1.5 font-bold cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />
                <span>Export</span>
              </button>
            </div>

            {/* + Create Task button exactly matching screenshot */}
            {currentUser?.role !== "Client" && (
              <button
                type="button"
                onClick={handleOpenNew}
                className="px-3.5 py-2 bg-gradient-to-r from-violet-605 to-indigo-600 bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-black rounded-lg flex items-center gap-1 select-none shadow-xs hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Task</span>
              </button>
            )}
          </div>
        </div>

        {/* High-Level Metrics Badges Horizontal Panel */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5 select-none">
          {/* Low Priority */}
          <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl p-4 flex items-center gap-3.5 shadow-xs">
            <div className="w-9 h-9 rounded-full bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500 flex items-center justify-center shrink-0">
              <Flag className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Low Priority</p>
              <p className="text-lg font-black text-slate-850 dark:text-white leading-none mt-1">{metricLowPriority}</p>
            </div>
          </div>

          {/* Medium Priority */}
          <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl p-4 flex items-center gap-3.5 shadow-xs">
            <div className="w-9 h-9 rounded-full bg-amber-50 dark:bg-amber-950/20 text-amber-500 flex items-center justify-center shrink-0">
              <Flag className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Medium Priority</p>
              <p className="text-lg font-black text-slate-850 dark:text-white leading-none mt-1">{metricMediumPriority}</p>
            </div>
          </div>

          {/* High Priority */}
          <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl p-4 flex items-center gap-3.5 shadow-xs">
            <div className="w-9 h-9 rounded-full bg-rose-50 dark:bg-rose-950/20 text-rose-500 flex items-center justify-center shrink-0">
              <Flag className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">High Priority</p>
              <p className="text-lg font-black text-slate-850 dark:text-white leading-none mt-1">{metricHighPriority}</p>
            </div>
          </div>

          {/* Total Task */}
          <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl p-4 flex items-center gap-3.5 shadow-xs">
            <div className="w-9 h-9 rounded-full bg-blue-50 dark:bg-blue-950/20 text-blue-500 flex items-center justify-center shrink-0">
              <CheckSquare className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Total Task</p>
              <p className="text-lg font-black text-slate-850 dark:text-white leading-none mt-1">{total}</p>
            </div>
          </div>

          {/* Total Task Done */}
          <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl p-4 flex items-center gap-3.5 shadow-xs">
            <div className="w-9 h-9 rounded-full bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 flex items-center justify-center shrink-0">
              <CheckCircle className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Task Done</p>
              <p className="text-lg font-black text-slate-850 dark:text-white leading-none mt-1">{solvedCount}</p>
            </div>
          </div>

          {/* Overdue */}
          <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl p-4 flex items-center gap-3.5 shadow-xs">
            <div className="w-9 h-9 rounded-full bg-rose-50 dark:bg-rose-950/25 text-rose-600 flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Overdue</p>
              <p className="text-lg font-black text-slate-850 dark:text-white leading-none mt-1">{metricOverdue}</p>
            </div>
          </div>
        </div>

        {/* Content displays (Grid View vs List Table View) */}
        {viewMode === "grid" ? (
          /* ==================== GRID KANBAN LAYOUT ==================== */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 animate-fadeIn">
            {filteredTickets.length === 0 ? (
              <div className="col-span-full bg-white dark:bg-slate-900 rounded-2xl border border-slate-150 dark:border-slate-850 p-16 text-center text-slate-400">
                <LifeBuoy className="w-10 h-10 text-slate-350 mx-auto mb-3" />
                <h3 className="font-extrabold text-slate-700 dark:text-slate-300">No tasks found in grid</h3>
                <p className="text-xs text-slate-400 mt-1">Coba sesuaikan kata kunci pencarian atau bersihkan filter.</p>
              </div>
            ) : (
              paginatedTickets.map(tk => {
                const isClosed = tk.status === "Closed";
                const isSolved = tk.status === "Solved" || tk.status === "Resolved" || tk.status === "Completed";
                return (
                  <div 
                    key={tk.id}
                    className="bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 hover:border-violet-300 dark:hover:border-violet-850 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all duration-250 flex flex-col gap-4 relative overflow-hidden group cursor-pointer"
                    onClick={() => toggleExpand(tk.id)}
                  >
                    {/* Top priority line */}
                    <div className={`absolute top-0 left-0 right-0 h-1 ${
                      tk.priority === "Urgent" || tk.priority === "High" ? "bg-rose-500" :
                      tk.priority === "Medium" ? "bg-amber-500" :
                      "bg-emerald-500"
                    }`} />

                    <div className="flex justify-between items-start gap-2">
                      <span className="font-mono text-[9px] font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-100/40">
                        {tk.ticketNumber || "TICKET"}
                      </span>
                      
                      {/* Grid card status changer */}
                      <div onClick={(e) => e.stopPropagation()} className="relative">
                        <button
                          onClick={() => setActiveStatusDropdownId(activeStatusDropdownId === tk.id ? null : tk.id)}
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-[10px] font-bold rounded-full border cursor-pointer ${
                            tk.status === "Overdue" ? "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/20 dark:text-rose-450 dark:border-rose-900" :
                            isSolved ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-450 dark:border-emerald-950" :
                            (tk.status === "In Progress" || tk.status === "Doing") ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/20 dark:text-blue-450 dark:border-blue-955" :
                            "bg-slate-50 text-slate-650 border-slate-150"
                          }`}
                        >
                          <span>{tk.status === "Resolved" ? "Solved" : (tk.status || "To Do")}</span>
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1.5 flex-1 select-text">
                      <h4 className="text-[12.5px] font-extrabold text-slate-850 dark:text-slate-100 group-hover:text-violet-650 tracking-tight transition-colors line-clamp-2">
                        {tk.title}
                      </h4>
                      <p className="text-[11px] text-slate-450 dark:text-slate-400 font-semibold line-clamp-2">
                        {getInitialDescription(tk.description) || "No description provided."}
                      </p>
                    </div>

                    {/* Site tags metadata */}
                    <div className="flex flex-wrap gap-1 text-[9.5px] select-none font-bold">
                      <span className="bg-slate-50 dark:bg-slate-950 text-slate-550 dark:text-slate-400 px-2.5 py-0.5 rounded border border-slate-150">
                        📍 {tk.projectName}
                      </span>
                      {tk.unit && (
                        <span className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-450 px-2 py-0.5 rounded">
                          🏢 {tk.unit}
                        </span>
                      )}
                    </div>

                    {/* Footer elements */}
                    <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-850 pt-3 mt-1 select-none">
                      <div onClick={(e) => e.stopPropagation()} className="relative">
                        <button
                          onClick={() => setActiveAssigneeDropdownId(activeAssigneeDropdownId === tk.id ? null : tk.id)}
                          className="flex items-center gap-2 text-left cursor-pointer"
                        >
                          <div className={`w-6.5 h-6.5 rounded-full flex items-center justify-center text-[10px] font-black text-white shrink-0 ${getUserColorBg(tk.picTugas || "")}`}>
                            {getUserInitials(tk.picTugas || "")}
                          </div>
                          <span className="text-[10.5px] font-extrabold text-slate-700 max-w-[90px] truncate">
                            {tk.picTugas || "Unassigned"}
                          </span>
                        </button>
                      </div>

                      <div className="text-[10.5px] font-semibold text-slate-450 font-mono inline-flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{getTicketDueDate(tk)}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        ) : (
          /* ==================== PREMIUM TASK LIST TABLE LAYOUT ==================== */
          <div className="overflow-hidden rounded-2xl border border-slate-150 dark:border-slate-850 bg-white dark:bg-slate-900 shadow-xs animate-fadeIn">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs text-slate-705 dark:text-slate-300">
                <thead className="bg-[#FAFBFD] dark:bg-slate-950 font-black border-b border-slate-150 dark:border-slate-850 text-slate-400 dark:text-slate-500 uppercase tracking-widest select-none text-[9.5px]">
                  <tr>
                    <th scope="col" className="px-5 py-4 w-12 text-center">
                      <input
                        type="checkbox"
                        checked={paginatedTickets.every(tk => selectedTaskIds[tk.id]) && paginatedTickets.length > 0}
                        onChange={toggleSelectAll}
                        className="w-4 h-4 rounded border-slate-300 text-violet-650 focus:ring-violet-500/35 cursor-pointer"
                      />
                    </th>
                    <th scope="col" className="px-5 py-4">Task</th>
                    <th scope="col" className="px-5 py-4">Assigned to</th>
                    <th scope="col" className="px-5 py-4">Priority</th>
                    <th scope="col" className="px-5 py-4">Status</th>
                    <th scope="col" className="px-5 py-4">Due Date</th>
                    <th scope="col" className="px-5 py-4 w-12 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150 dark:divide-slate-850 font-medium">
                  {filteredTickets.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-20 text-slate-400 bg-white dark:bg-slate-900">
                        <LifeBuoy className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                        <p className="text-sm font-black text-slate-750">Tidak ada tugas / kasus ditemukan</p>
                        <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">Coba bersihkan filter pencarian di atas.</p>
                      </td>
                    </tr>
                  ) : (
                    paginatedTickets.map(tk => {
                      const isExpanded = expandedTicketId === tk.id;
                      const isClosed = tk.status === "Closed";
                      const isSolved = tk.status === "Solved" || tk.status === "Resolved" || tk.status === "Completed";
                      const canModify = (!tk.createdBy || tk.createdBy === currentUser?.username || currentUser?.role === "Administrator" || currentUser?.role === "Koordinator") && !isClosed;
                      const isTaskSelected = !!selectedTaskIds[tk.id];

                      return (
                        <React.Fragment key={tk.id}>
                          {/* Main Row */}
                          <tr
                            onClick={() => toggleExpand(tk.id)}
                            className={`hover:bg-[#F9FAFC] dark:hover:bg-slate-850/40 transition-colors cursor-pointer select-none ${
                              isExpanded ? "bg-[#F7F8FC] dark:bg-slate-850/30" : ""
                            } ${isTaskSelected ? "bg-violet-50/10 dark:bg-violet-950/15" : ""}`}
                          >
                            <td className="px-5 py-4 whitespace-nowrap text-center" onClick={(e) => e.stopPropagation()}>
                              <input
                                type="checkbox"
                                checked={isTaskSelected}
                                onChange={() => {
                                  setSelectedTaskIds(prev => ({
                                    ...prev,
                                    [tk.id]: !prev[tk.id]
                                  }));
                                }}
                                className="w-4 h-4 rounded border-slate-300 text-violet-605 focus:ring-violet-500/35 cursor-pointer"
                              />
                            </td>

                            <td className="px-5 py-4">
                              <div className="flex items-center gap-3">
                                <div className="flex flex-col gap-1 max-w-[320px] md:max-w-[400px]">
                                  <span className={`text-[12.5px] font-semibold leading-snug tracking-tight text-slate-850 dark:text-slate-100 ${
                                    isSolved ? "line-through text-slate-400 dark:text-slate-500" : ""
                                  }`}>
                                    {tk.title}
                                  </span>
                                  
                                  <div className="flex items-center gap-2 mt-1 select-none">
                                    <span className="font-mono text-[9px] text-slate-400 font-extrabold">
                                      {tk.ticketNumber || ""}
                                    </span>
                                    
                                    <span className="text-[9px] text-emerald-600 dark:text-emerald-450 bg-emerald-50 dark:bg-emerald-950/30 px-1.5 py-0.5 rounded font-black">
                                      📍 {tk.projectName}
                                    </span>

                                    <span className="text-[9px] text-slate-400 font-bold inline-flex items-center gap-0.5">
                                      <MessageSquare className="w-3 h-3" />
                                      <span>{tk.followUpLog ? tk.followUpLog.split("\n\n").length : 1}</span>
                                    </span>

                                    {tk.fileUrl && (
                                      <span className="text-[9px] text-indigo-500 font-bold inline-flex items-center gap-0.5" title="Ada Lampiran File">
                                        <Paperclip className="w-3 h-3 text-indigo-500" />
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* Assigned To with selection dropdown */}
                            <td className="px-5 py-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                              <div className="relative">
                                <button
                                  type="button"
                                  onClick={() => setActiveAssigneeDropdownId(activeAssigneeDropdownId === tk.id ? null : tk.id)}
                                  className="inline-flex items-center gap-2 px-2 py-1.5 border border-slate-100 hover:border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-900 rounded-lg transition-all font-bold text-slate-850 dark:text-slate-200 text-[11px] cursor-pointer shadow-xs focus:outline-none"
                                >
                                  <div className={`w-5.5 h-5.5 rounded-full flex items-center justify-center text-[9px] font-black text-white shrink-0 shadow-xs ${getUserColorBg(tk.picTugas || "")}`}>
                                    {getUserInitials(tk.picTugas || "")}
                                  </div>
                                  <span className="truncate max-w-[85px]">{tk.picTugas || "Unassigned"}</span>
                                  <ChevronDown className="w-3 h-3 text-slate-400 ml-0.5" />
                                </button>

                                {activeAssigneeDropdownId === tk.id && (
                                  <>
                                    <div className="fixed inset-0 z-10" onClick={() => setActiveAssigneeDropdownId(null)} />
                                    <div className="absolute left-0 mt-1.5 w-44 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl py-1.5 z-20 max-h-52 overflow-y-auto text-[11px] font-bold text-slate-700 dark:text-slate-300">
                                      <div className="px-3 py-1 border-b border-slate-100 dark:border-slate-850 text-[9px] text-slate-400 uppercase tracking-wider">Tugaskan PIC</div>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          onUpdateTicket(tk.id, { picTugas: "" });
                                          setActiveAssigneeDropdownId(null);
                                        }}
                                        className="w-full text-left px-3 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-850 flex items-center gap-2 text-slate-400 cursor-pointer"
                                      >
                                        <div className="w-4 h-4 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-[8px] font-black">?</div>
                                        Kosongkan PIC
                                      </button>
                                      {uniquePicTugasList.map(pic => (
                                        <button
                                          key={pic}
                                          type="button"
                                          onClick={() => {
                                            onUpdateTicket(tk.id, { picTugas: pic });
                                            setActiveAssigneeDropdownId(null);
                                          }}
                                          className="w-full text-left px-3 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-850 flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300"
                                        >
                                          <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-black text-white shrink-0 ${getUserColorBg(pic)}`}>
                                            {getUserInitials(pic)}
                                          </div>
                                          <span className="truncate">{pic}</span>
                                        </button>
                                      ))}
                                    </div>
                                  </>
                                )}
                              </div>
                            </td>

                            {/* Priority Row */}
                            <td className="px-5 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                {tk.priority === "Urgent" || tk.priority === "High" ? (
                                  <span className="bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 px-2.5 py-1 rounded-lg border border-rose-100 dark:border-rose-900 inline-flex items-center gap-1.5 text-[10px] font-extrabold font-mono uppercase tracking-tight">
                                    <Flag className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                                    <span>High</span>
                                  </span>
                                ) : tk.priority === "Medium" ? (
                                  <span className="bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-450 px-2.5 py-1 rounded-lg border border-amber-100 dark:border-amber-900 inline-flex items-center gap-1.5 text-[10px] font-extrabold font-mono uppercase tracking-tight">
                                    <Flag className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                    <span>Medium</span>
                                  </span>
                                ) : (
                                  <span className="bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-450 px-2.5 py-1 rounded-lg border border-emerald-100 dark:border-emerald-900 inline-flex items-center gap-1.5 text-[10px] font-extrabold font-mono uppercase tracking-tight">
                                    <Flag className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                    <span>Low</span>
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Status with on fly updater */}
                            <td className="px-5 py-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                              <div className="relative">
                                <button
                                  type="button"
                                  onClick={() => setActiveStatusDropdownId(activeStatusDropdownId === tk.id ? null : tk.id)}
                                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-black rounded-full border transition-all cursor-pointer focus:outline-none ${
                                    tk.status === "Overdue" ? "bg-rose-50 text-rose-700 border-rose-200/60 dark:bg-rose-950/25 dark:text-rose-400 dark:border-rose-900/40" :
                                    isSolved ? "bg-emerald-50 text-emerald-700 border-emerald-200/60 dark:bg-emerald-950/25 dark:text-emerald-400 dark:border-emerald-900/40" :
                                    (tk.status === "In Progress" || tk.status === "Doing") ? "bg-blue-50 text-blue-700 border-blue-200/60 dark:bg-blue-950/25 dark:text-blue-400 dark:border-blue-900/40" :
                                    "bg-slate-100 text-slate-700 border-slate-200/60 dark:bg-slate-800/60 dark:text-slate-350 dark:border-slate-700"
                                  }`}
                                >
                                  <span className={`w-1.5 h-1.5 rounded-full ${
                                    tk.status === "Overdue" ? "bg-rose-500 animate-pulse" :
                                    isSolved ? "bg-emerald-500" :
                                    (tk.status === "In Progress" || tk.status === "Doing") ? "bg-blue-500 animate-pulse" :
                                    "bg-slate-400"
                                  }`} />
                                  <span>{tk.status === "Resolved" ? "Solved" : (tk.status || "To Do")}</span>
                                  <ChevronDown className="w-3 h-3 text-slate-400 ml-0.5 shrink-0" />
                                </button>

                                {activeStatusDropdownId === tk.id && (
                                  <>
                                    <div className="fixed inset-0 z-10" onClick={() => setActiveStatusDropdownId(null)} />
                                    <div className="absolute left-0 mt-1.5 w-36 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl py-1.5 z-20 text-[11px] font-bold text-slate-750 dark:text-slate-300">
                                      <div className="px-3 py-1 border-b border-slate-150 dark:border-slate-850 text-[9px] text-slate-450 uppercase tracking-widest">Pilih Status</div>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          onUpdateTicket(tk.id, { status: "To Do" });
                                          setActiveStatusDropdownId(null);
                                        }}
                                        className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-850 flex items-center gap-2 cursor-pointer"
                                      >
                                        <span className="w-1.5 h-1.5 rounded-full bg-slate-450" />
                                        To Do
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          onUpdateTicket(tk.id, { status: "Doing" });
                                          setActiveStatusDropdownId(null);
                                        }}
                                        className="w-full text-left px-3 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-850 flex items-center gap-2 cursor-pointer"
                                      >
                                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                                        Doing
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          onUpdateTicket(tk.id, { status: "Overdue" });
                                          setActiveStatusDropdownId(null);
                                        }}
                                        className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-850 flex items-center gap-2 cursor-pointer"
                                      >
                                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                                        Overdue
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          onUpdateTicket(tk.id, { status: "Completed" });
                                          setActiveStatusDropdownId(null);
                                        }}
                                        className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-850 flex items-center gap-2 cursor-pointer"
                                      >
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                        Completed
                                      </button>
                                    </div>
                                  </>
                                )}
                              </div>
                            </td>

                            <td className="px-5 py-4 whitespace-nowrap text-slate-500 dark:text-slate-400 font-bold font-mono">
                              <div className="flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <span>{getTicketDueDate(tk)}</span>
                              </div>
                            </td>

                            <td className="px-5 py-4 whitespace-nowrap text-right" onClick={(e) => e.stopPropagation()}>
                              <div className="relative inline-block">
                                <button
                                  type="button"
                                  onClick={() => setActiveRowMenuId(activeRowMenuId === tk.id ? null : tk.id)}
                                  className="p-1.5 hover:bg-slate-50 dark:hover:bg-slate-850 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer border border-slate-100 dark:border-slate-800"
                                >
                                  <MoreHorizontal className="w-4 h-4" />
                                </button>

                                {activeRowMenuId === tk.id && (
                                  <>
                                    <div className="fixed inset-0 z-10" onClick={() => setActiveRowMenuId(null)} />
                                    <div className="absolute right-0 mt-1 w-40 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl py-1.5 z-20 text-[11px] font-bold text-slate-700 dark:text-slate-300">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          toggleExpand(tk.id);
                                          setActiveRowMenuId(null);
                                        }}
                                        className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-850 flex items-center gap-2 cursor-pointer"
                                      >
                                        <FileText className="w-3.5 h-3.5 text-blue-500" />
                                        Lihat Detail Logs
                                      </button>
                                      
                                      {currentUser?.role !== "Client" && (
                                        <>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              handleOpenFollowUp(tk);
                                              setActiveRowMenuId(null);
                                            }}
                                            disabled={isClosed || isSolved}
                                            className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-850 flex items-center gap-2 cursor-pointer disabled:opacity-35 disabled:cursor-not-allowed"
                                          >
                                            <CheckSquare className="w-3.5 h-3.5 text-emerald-500" />
                                            Tindakan Solusi
                                          </button>
                                          
                                          <button
                                            type="button"
                                            onClick={() => {
                                              handleOpenEdit(tk);
                                              setActiveRowMenuId(null);
                                            }}
                                            disabled={!canModify}
                                            className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-850 flex items-center gap-2 cursor-pointer disabled:opacity-35 disabled:cursor-not-allowed"
                                          >
                                            <Edit className="w-3.5 h-3.5 text-indigo-550" />
                                            Edit Rincian
                                          </button>
                                          
                                          <div className="border-t border-slate-100 dark:border-slate-850 my-1" />
                                          
                                          <button
                                            type="button"
                                            onClick={async () => {
                                              setActiveRowMenuId(null);
                                              if (confirm(`Hapus tiket Troubleshoot "${tk.title}" (${tk.ticketNumber || ""})?`)) {
                                                await onDeleteTicket(tk.id);
                                              }
                                            }}
                                            disabled={!canModify}
                                            className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-850 flex items-center gap-2 cursor-pointer text-rose-600 disabled:opacity-35 disabled:cursor-not-allowed"
                                          >
                                            <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                                            Hapus Tiket
                                          </button>
                                        </>
                                      )}
                                    </div>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>

                          {/* Expanded section */}
                          <AnimatePresence>
                            {isExpanded && (
                              <tr className="bg-slate-50/50 dark:bg-slate-950/20 border-b border-slate-200/60 dark:border-slate-850">
                                <td colSpan={7} className="p-5 md:p-7 text-slate-800 dark:text-slate-200">
                                  <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="grid grid-cols-1 lg:grid-cols-12 gap-6 select-text"
                                  >
                                    <div className="lg:col-span-8 space-y-4">
                                      <div className="flex items-center gap-2 border-b border-slate-200/60 dark:border-slate-800 pb-2">
                                        <FileText className="w-4 h-4 text-indigo-500" />
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Detail Rincian Deskripsi Masalah</span>
                                      </div>

                                      <div className="space-y-2">
                                        <h4 className="text-sm font-black text-slate-850 dark:text-slate-100 leading-snug">
                                          {tk.title}
                                        </h4>
                                        <div className="bg-white dark:bg-slate-950 p-5 rounded-2xl border border-slate-200 dark:border-slate-850 shadow-xs min-h-[125px] font-semibold leading-relaxed text-xs text-slate-705 dark:text-slate-350 prose dark:prose-invert max-w-full overflow-x-auto">
                                          {getInitialDescription(tk.description) ? (
                                            <div
                                              dangerouslySetInnerHTML={{ __html: parseMarkdownToHtml(getInitialDescription(tk.description)) }}
                                              className="space-y-1.5 break-words outline-none"
                                            />
                                          ) : (
                                            <p className="text-slate-400 italic font-medium">Tidak ada deskripsi detail tambahan.</p>
                                          )}
                                        </div>
                                      </div>

                                      {/* Solusi logs */}
                                      <div className="space-y-2 pt-2">
                                        <div className="flex items-center gap-2 border-b border-slate-200/60 dark:border-slate-800 pb-2">
                                          <Activity className="w-4 h-4 text-emerald-500" />
                                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Catatan & Log Tindakan Follow-Up</span>
                                        </div>
                                        <div className="bg-emerald-50/10 dark:bg-emerald-950/5 p-5 rounded-2xl border border-emerald-100/50 dark:border-emerald-950 shadow-xs min-h-[85px] font-semibold leading-relaxed text-xs text-slate-705 dark:text-slate-350 prose dark:prose-invert max-w-full overflow-x-auto">
                                          {getCombinedFollowUpText(tk) ? (
                                            <div
                                              dangerouslySetInnerHTML={{ __html: parseMarkdownToHtml(getCombinedFollowUpText(tk)) }}
                                              className="space-y-1.5 break-words outline-none"
                                            />
                                          ) : (
                                            <p className="text-slate-400 italic font-medium">Belum ada catatan atau tindakan follow-up pada tiket ini.</p>
                                          )}
                                        </div>
                                      </div>
                                    </div>

                                    {/* Right Area: Attachment */}
                                    <div className="lg:col-span-4 space-y-4">
                                      <div className="flex items-center gap-2 border-b border-slate-200/60 dark:border-slate-850 pb-2">
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
                                          <span className="text-slate-850 dark:text-slate-200 font-bold">{tk.status}</span>
                                        </div>
                                        <div className="flex items-center justify-between font-bold">
                                          <span>PIC Tugas:</span>
                                          <span className="text-indigo-600 dark:text-indigo-400 font-extrabold">{tk.picTugas || "Belum Ditugaskan"}</span>
                                        </div>
                                        {currentUser?.role !== "Client" && (
                                          <div className="space-y-2 mt-2 pt-2 border-t border-slate-200/50 dark:border-slate-800">
                                            {!isClosed && !isSolved && (
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
                                              <button
                                                type="button"
                                                onClick={() => handleTransitionStatus(tk, "Closed")}
                                                className="w-full py-2 px-3 bg-red-650 hover:bg-red-750 text-white text-[10.5px] font-black rounded-lg transition-all shadow-xs flex items-center justify-center gap-1 cursor-pointer font-mono uppercase tracking-tight"
                                              >
                                                Close Ticket
                                              </button>
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

            {/* Pagination block */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t border-slate-100 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-950/10 rounded-b-2xl select-none">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                  Menampilkan <span className="font-extrabold text-slate-800 dark:text-slate-200">{startIndex + 1}</span> - <span className="font-extrabold text-slate-800 dark:text-slate-300">{Math.min(endIndex, totalItems)}</span> dari <span className="font-extrabold text-indigo-600 dark:text-indigo-400">{totalItems}</span> tiket
                </span>
                
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    disabled={activePage === 1}
                    onClick={() => setCurrentPage(1)}
                    className="px-2.5 py-1 border border-slate-200 dark:border-slate-800 rounded-lg text-[10px] font-bold bg-white dark:bg-slate-900 transition-colors disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-600 dark:text-slate-300 cursor-pointer"
                  >
                    First
                  </button>

                  <button
                    type="button"
                    disabled={activePage === 1}
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    className="px-3 py-1 border border-slate-200 dark:border-slate-800 rounded-lg text-[10px] font-bold bg-white dark:bg-slate-900 transition-colors disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-600 dark:text-slate-300 cursor-pointer"
                  >
                    Prev
                  </button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }).map((_, idx) => {
                      const pageNum = idx + 1;
                      const shouldShow = totalPages <= 5 || Math.abs(pageNum - activePage) <= 2 || pageNum === 1 || pageNum === totalPages;
                      
                      if (!shouldShow) {
                        if (pageNum === 2 || pageNum === totalPages - 1) {
                          return <span key={pageNum} className="text-slate-400 px-1 text-[11px]">...</span>;
                        }
                        return null;
                      }

                      return (
                        <button
                          key={pageNum}
                          type="button"
                          onClick={() => setCurrentPage(pageNum)}
                          className={`w-7 h-7 flex items-center justify-center rounded-lg text-[10.5px] font-black transition-all cursor-pointer ${
                            activePage === pageNum
                              ? "bg-indigo-600 text-white shadow-xs"
                              : "border border-slate-100 dark:border-slate-850 hover:bg-slate-100 dark:hover:bg-slate-850 text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900"
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    type="button"
                    disabled={activePage === totalPages}
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    className="px-3 py-1 border border-slate-200 dark:border-slate-800 rounded-lg text-[10px] font-bold bg-white dark:bg-slate-900 transition-colors disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-600 dark:text-slate-300 cursor-pointer"
                  >
                    Next
                  </button>

                  <button
                    type="button"
                    disabled={activePage === totalPages}
                    onClick={() => setCurrentPage(totalPages)}
                    className="px-2.5 py-1 border border-slate-200 dark:border-slate-800 rounded-lg text-[10px] font-bold bg-white dark:bg-slate-900 transition-colors disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-600 dark:text-slate-300 cursor-pointer"
                  >
                    Last
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Floating purple button */}
        <div className="fixed bottom-6 right-6 z-50">
          <button
            type="button"
            onClick={handleOpenNew}
            className="w-13 h-13 rounded-full bg-violet-650 bg-violet-600 hover:bg-violet-700 text-white shadow-2xl flex items-center justify-center hover:scale-105 active:scale-95 duration-150 transition-all cursor-pointer border-3 border-white dark:border-slate-850 group relative"
          >
            <MessageSquare className="w-5.5 h-5.5 text-white group-hover:rotate-6 transition-transform" />
            <div className="absolute right-15 bottom-2 bg-slate-900 text-white text-[10px] py-1.5 px-2.5 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-md font-bold select-none">
              💬 Buka Tiket Troubleshoot
            </div>
          </button>
        </div>
      </div>
    );
  };

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

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setIsExportModalOpen(true)}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-750 text-white text-xs font-extrabold rounded-xl flex items-center gap-1.5 shadow-md hover:shadow-lg hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4" /> Ekspor ke Excel
              </button>

              {currentUser?.role !== "Client" && (
                <button
                  onClick={handleOpenNew}
                  className="px-4.5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold rounded-xl flex items-center gap-1.5 shadow-md hover:shadow-lg hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Buka Tiket Troubleshoot
                </button>
              )}
            </div>
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
                className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 py-1.5 px-3 rounded-lg text-slate-700 dark:text-slate-200 font-bold cursor-pointer"
              >
                <option value="">Semua Status</option>
                <option value="Open">Open</option>
                <option value="In Progress">In Progress</option>
                <option value="Solved">Solved</option>
                <option value="Closed">Closed</option>
              </select>

              <select
                value={filterPicTugas}
                onChange={(e) => setFilterPicTugas(e.target.value)}
                className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 py-1.5 px-3 rounded-lg text-slate-700 dark:text-slate-200 font-bold cursor-pointer"
              >
                <option value="">Semua PIC Tugas</option>
                {uniquePicTugasList.map((pic) => (
                  <option key={pic} value={pic}>
                    {pic}
                  </option>
                ))}
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
              paginatedTickets.map(tk => {
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
                          <div className="flex flex-wrap gap-1">
                            {tk.category && (
                              <span className="bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded border border-indigo-150/40 dark:border-indigo-900/30 text-[9px] font-bold">
                                {tk.category}
                              </span>
                            )}
                            {tk.subCategory && (
                              <span className="bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded border border-blue-150/40 dark:border-blue-900/30 text-[9px] font-bold" title="Sub Kategori">
                                {tk.subCategory}
                              </span>
                            )}
                            {tk.problemType && (
                              <span className="bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded border border-amber-150/40 dark:border-amber-900/30 text-[9px] font-bold" title="Jenis Masalah">
                                {tk.problemType}
                              </span>
                            )}
                          </div>
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
                            tk.status === "Resolved" || tk.status === "Solved" || tk.status === "Closed" ? "bg-emerald-550/10 text-emerald-600 dark:text-emerald-400 border-emerald-505/20" :
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
                                disabled={isClosed || isSolved}
                                className={`p-2 rounded-xl border border-slate-100 dark:border-slate-800 transition-colors ${
                                  isClosed || isSolved
                                    ? "text-slate-200 dark:text-slate-800 cursor-not-allowed opacity-35"
                                    : "text-slate-400 hover:text-emerald-500 hover:bg-slate-150 dark:hover:bg-slate-800 cursor-pointer"
                                }`}
                                title={isClosed ? "Tiket sudah Closed (Selesai) dan terkunci" : isSolved ? "Tiket sudah Solved (Selesai), tidak perlu follow up" : "Tambahkan Follow up / Solusi Penyelesaian (Open -> In Progress / Solved)"}
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
                                    {getInitialDescription(tk.description) ? (
                                      <div 
                                        dangerouslySetInnerHTML={{ __html: parseMarkdownToHtml(getInitialDescription(tk.description)) }}
                                        className="space-y-1.5 break-words outline-none"
                                      />
                                    ) : (
                                      <p className="text-slate-400 italic font-medium">Tidak ada deskripsi detail tambahan.</p>
                                    )}
                                  </div>
                                </div>

                                {/* Separated Log Tindakan / History Follow Up Section */}
                                <div className="space-y-2 pt-2">
                                  <div className="flex items-center gap-2 border-b border-slate-200/60 dark:border-slate-800 pb-2">
                                    <Activity className="w-4 h-4 text-emerald-500" />
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Catatan & Log Tindakan Follow-Up</span>
                                  </div>
                                  <div className="bg-emerald-50/10 dark:bg-emerald-950/5 p-5 rounded-2xl border border-emerald-100/50 dark:border-emerald-950 shadow-xs min-h-[85px] font-semibold leading-relaxed text-xs text-slate-705 dark:text-slate-350 prose dark:prose-invert max-w-full overflow-x-auto">
                                    {getCombinedFollowUpText(tk) ? (
                                      <div 
                                        dangerouslySetInnerHTML={{ __html: parseMarkdownToHtml(getCombinedFollowUpText(tk)) }}
                                        className="space-y-1.5 break-words outline-none"
                                      />
                                    ) : (
                                      <p className="text-slate-400 italic font-medium">Belum ada catatan atau tindakan follow-up pada tiket ini.</p>
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
                                      tk.status === "Closed" || tk.status === "Resolved" || tk.status === "Solved" ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400" :
                                      tk.status === "In Progress" ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400" :
                                      "bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400"
                                    }`}>{tk.status}</span>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <span>Skala Prioritas:</span>
                                    <span className="text-slate-800 dark:text-slate-200 font-bold">{tk.priority}</span>
                                  </div>
                                  <div className="flex items-center justify-between border-t border-slate-200/50 dark:border-slate-800 pt-2 pb-1">
                                    <span>PIC Pelapor (User):</span>
                                    <span className="text-slate-800 dark:text-slate-200 font-bold">{tk.picPelapor || tk.createdBy || "System/Anonim"}</span>
                                  </div>
                                  <div className="flex items-center justify-between font-bold">
                                    <span>PIC Tugas:</span>
                                    <span className="text-indigo-600 dark:text-indigo-400 font-extrabold">{tk.picTugas || "Belum Ditugaskan"}</span>
                                  </div>
                                  <div className="flex items-center justify-between border-t border-slate-200/50 dark:border-slate-800 pt-2 pb-1 text-[10px]">
                                    <span>Disubmit Oleh:</span>
                                    <span className="text-slate-500 dark:text-slate-400 font-bold">{tk.createdBy || "System/Anonim"}</span>
                                  </div>
                                  {currentUser?.role !== "Client" && (
                                    <div className="space-y-2 mt-2 pt-2 border-t border-slate-200/50 dark:border-slate-800">
                                      {!isClosed && !isSolved && (
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

      {/* Pagination controls (Requirement 5) */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t border-slate-100 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-950/10 rounded-b-2xl select-none">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
            Menampilkan <span className="font-extrabold text-slate-800 dark:text-slate-200">{startIndex + 1}</span> - <span className="font-extrabold text-slate-800 dark:text-slate-200">{Math.min(endIndex, totalItems)}</span> dari <span className="font-extrabold text-indigo-600 dark:text-indigo-400">{totalItems}</span> tiket
          </span>
          
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              disabled={activePage === 1}
              onClick={() => setCurrentPage(1)}
              className="px-2.5 py-1.5 border border-slate-200 dark:border-slate-800 rounded-lg text-[10px] font-bold tracking-tight bg-white dark:bg-slate-900 transition-colors disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 cursor-pointer"
              title="Halaman Pertama"
            >
              First
            </button>

            <button
              disabled={activePage === 1}
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              className="px-3 py-1.5 border border-slate-200 dark:border-slate-800 rounded-lg text-[10px] font-bold tracking-tight bg-white dark:bg-slate-900 transition-colors disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 cursor-pointer"
              title="Sebelumnya"
            >
              Prev
            </button>

            {/* Pages indicator list */}
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }).map((_, idx) => {
                const pageNum = idx + 1;
                // Only show up to 5 page indicators centered around the active page, or all if totalPages <= 5
                const shouldShow = totalPages <= 5 || Math.abs(pageNum - activePage) <= 2 || pageNum === 1 || pageNum === totalPages;
                
                if (!shouldShow) {
                  // Ellipsis check
                  if (pageNum === 2 || pageNum === totalPages - 1) {
                    return <span key={pageNum} className="text-slate-400 px-1 text-[11px]">...</span>;
                  }
                  return null;
                }

                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-7 h-7 flex items-center justify-center rounded-lg text-[10.5px] font-black transition-all cursor-pointer ${
                      activePage === pageNum
                        ? "bg-indigo-600 text-white shadow-xs"
                        : "border border-slate-100 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button
              disabled={activePage === totalPages}
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              className="px-3 py-1.5 border border-slate-200 dark:border-slate-800 rounded-lg text-[10px] font-bold tracking-tight bg-white dark:bg-slate-900 transition-colors disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 cursor-pointer"
              title="Selanjutnya"
            >
              Next
            </button>

            <button
              disabled={activePage === totalPages}
              onClick={() => setCurrentPage(totalPages)}
              className="px-2.5 py-1.5 border border-slate-200 dark:border-slate-800 rounded-lg text-[10px] font-bold tracking-tight bg-white dark:bg-slate-900 transition-colors disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 cursor-pointer"
              title="Halaman Terakhir"
            >
              Last
            </button>
          </div>
        </div>
      )}
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
                    onChange={(e) => {
                      setCategory(e.target.value);
                      setSubCategory("");
                      setCustomSubCategory("");
                      setProblemType("");
                      setCustomProblemType("");
                    }}
                    className="bg-slate-50 dark:bg-slate-950 border border-slate-205 dark:border-slate-800 py-2.5 px-3 rounded-xl text-slate-850 dark:text-slate-200 focus:border-indigo-500 transition-all font-bold"
                  >
                    <option value="">-- Pilih Kategori Laporan --</option>
                    {ticketCategories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                {/* Dynamic Sub Kategori Selector */}
                {category && (
                  <div className="flex flex-col gap-1.5 antialiased animate-fadeIn">
                    <label className="text-[10px] font-bold text-slate-555 uppercase tracking-widest">Sub Kategori Laporan *</label>
                    <select
                      value={subCategory}
                      onChange={(e) => {
                        setSubCategory(e.target.value);
                        setCustomSubCategory("");
                        setProblemType("");
                        setCustomProblemType("");
                      }}
                      className="bg-slate-50 dark:bg-slate-950 border border-slate-205 dark:border-slate-800 py-2.5 px-3 rounded-xl text-slate-850 dark:text-slate-205 focus:border-indigo-500 transition-all font-bold"
                    >
                      <option value="">-- Pilih Sub Kategori --</option>
                      {ticketSubCategories
                        .filter((val: string) => {
                          const parts = val.split(":");
                          return parts[0].trim() === category.trim();
                        })
                        .map((val: string) => {
                          const parts = val.split(":");
                          const cleanVal = parts.slice(1).join(":").trim();
                          return (
                            <option key={val} value={cleanVal}>{cleanVal}</option>
                          );
                        })
                      }
                      <option value="Lainnya">Lainnya (Tulis Manual)</option>
                    </select>

                    {subCategory === "Lainnya" && (
                      <input
                        type="text"
                        required
                        placeholder="Ketik Sub Kategori Lainnya..."
                        value={customSubCategory}
                        onChange={(e) => setCustomSubCategory(e.target.value)}
                        className="bg-slate-50 dark:bg-slate-950 border border-slate-205 dark:border-slate-800 mt-1 py-2 px-3 rounded-xl text-slate-855 dark:text-slate-100 placeholder-slate-400 font-bold focus:border-indigo-500"
                      />
                    )}
                  </div>
                )}

                {/* Dynamic Jenis Masalah Selector */}
                {category && (subCategory || customSubCategory) && (
                  <div className="flex flex-col gap-1.5 antialiased animate-fadeIn">
                    <label className="text-[10px] font-bold text-slate-555 uppercase tracking-widest">Jenis Masalah *</label>
                    <select
                      value={problemType}
                      onChange={(e) => {
                        setProblemType(e.target.value);
                        setCustomProblemType("");
                      }}
                      className="bg-slate-50 dark:bg-slate-950 border border-slate-205 dark:border-slate-800 py-2.5 px-3 rounded-xl text-slate-850 dark:text-slate-205 focus:border-indigo-500 transition-all font-bold"
                    >
                      <option value="">-- Pilih Jenis Masalah --</option>
                      {ticketProblemTypes
                        .filter((val: string) => {
                          const parts = val.split(":");
                          const subPart = parts[0].trim();
                          const activeSubVal = subCategory === "Lainnya" ? customSubCategory.trim() : subCategory.trim();
                          return subPart.toLowerCase() === activeSubVal.toLowerCase();
                        })
                        .map((val: string) => {
                          const parts = val.split(":");
                          const cleanVal = parts.slice(1).join(":").trim();
                          return (
                            <option key={val} value={cleanVal}>{cleanVal}</option>
                          );
                        })
                      }
                      <option value="Lainnya">Lainnya (Tulis Manual)</option>
                    </select>

                    {problemType === "Lainnya" && (
                      <input
                        type="text"
                        required
                        placeholder="Ketik Jenis Masalah Lainnya..."
                        value={customProblemType}
                        onChange={(e) => setCustomProblemType(e.target.value)}
                        className="bg-slate-50 dark:bg-slate-950 border border-slate-205 dark:border-slate-800 mt-1 py-2 px-3 rounded-xl text-slate-850 dark:text-slate-100 placeholder-slate-400 font-bold focus:border-indigo-500"
                      />
                    )}
                  </div>
                )}

                {/* Reporter Name (Indonesian prompt) */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-550 uppercase tracking-widest">Nama Pelapor RS / User *</label>
                  <input
                    type="text"
                    required
                    value={reporterName}
                    onChange={(e) => setReporterName(e.target.value)}
                    placeholder="Contoh: dr. Setiawan / Pak Budi PIC RS"
                    className="bg-slate-50 dark:bg-slate-950 border border-slate-205 dark:border-slate-800 py-2.5 px-3 rounded-xl text-slate-855 dark:text-slate-100 placeholder-slate-400 font-bold focus:border-indigo-500"
                  />
                </div>

                {/* Reporter Unit Selector (Sourced from Hospital Profile Rooms) */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-550 uppercase tracking-widest font-sans">Ruangan / Unit Pelapor *</label>
                  {(() => {
                    const currentSiteName = projectName || userSite || "";
                    const selectedClientObj = clients.find(cl => 
                      cl.namaRS && currentSiteName && cl.namaRS.toLowerCase().trim() === currentSiteName.toLowerCase().trim()
                    );
                    const clientRooms = selectedClientObj?.rooms || [];
                    if (clientRooms.length > 0) {
                      return (
                        <>
                          <select
                            value={unit}
                            onChange={(e) => {
                              setUnit(e.target.value);
                              setCustomUnit("");
                            }}
                            className="bg-slate-50 dark:bg-slate-950 border border-slate-205 dark:border-slate-800 py-2.5 px-3 rounded-xl text-slate-850 dark:text-slate-200 focus:border-indigo-500 transition-all font-bold text-xs cursor-pointer"
                          >
                            <option value="">-- Pilih Ruangan / Unit --</option>
                            {clientRooms.map((rm) => (
                              <option key={rm.id || rm.name} value={rm.name}>{rm.name}</option>
                            ))}
                            <option value="Lainnya">Lainnya (Ketik Manual)</option>
                          </select>
                          {unit === "Lainnya" && (
                            <input
                              type="text"
                              required
                              placeholder="Ketik Ruangan / Unit Baru..."
                              value={customUnit}
                              onChange={(e) => setCustomUnit(e.target.value)}
                              className="bg-slate-50 dark:bg-slate-950 border border-slate-205 dark:border-slate-800 mt-1.5 py-2.5 px-3 rounded-xl text-slate-850 dark:text-slate-100 placeholder-slate-400 font-bold focus:border-indigo-500 text-xs"
                            />
                          )}
                        </>
                      );
                    } else {
                      return (
                        <div className="space-y-1.5">
                          {!currentSiteName && (
                            <div className="text-[10px] font-bold text-amber-500 dark:text-amber-400">
                              ⚠️ Pilih Lokasi Site terlebih dahulu untuk memuat data Ruangan
                            </div>
                          )}
                          <input
                            type="text"
                            required
                            placeholder="Contoh: Rekam Medis / Poli Anak / UGD"
                            value={unit}
                            onChange={(e) => setUnit(e.target.value)}
                            className="bg-slate-50 dark:bg-slate-950 border border-slate-205 dark:border-slate-800 py-2.5 px-3 rounded-xl text-slate-855 dark:text-slate-100 placeholder-slate-400 font-bold focus:border-indigo-500 text-xs"
                          />
                        </div>
                      );
                    }
                  })()}
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

                {/* PIC Pelapor & PIC Tugas (Requirement 1 & 2) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  <div className="flex flex-col gap-1.5 border-indigo-100 dark:border-indigo-950/20">
                    <label className="text-[10px] font-bold text-slate-550 uppercase tracking-widest font-sans text-indigo-600 dark:text-indigo-400">PIC Pelapor (Otomatis) *</label>
                    <input
                      type="text"
                      required
                      readOnly
                      disabled
                      value={picPelapor}
                      className="bg-slate-100/60 dark:bg-slate-950/65 border border-slate-205 dark:border-slate-805 py-2.5 px-3 rounded-xl text-slate-500 dark:text-slate-400 font-bold select-none cursor-not-allowed text-xs"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-550 uppercase tracking-widest font-sans text-indigo-600 dark:text-indigo-400">PIC Tugas (Opsional)</label>
                    <select
                      value={picTugas}
                      onChange={(e) => setPicTugas(e.target.value)}
                      className="bg-slate-50 dark:bg-slate-950 border border-slate-205 dark:border-slate-800 py-2.5 px-3 rounded-xl text-slate-850 dark:text-slate-200 font-bold focus:border-indigo-500 transition-all cursor-pointer text-xs"
                    >
                      <option value="">-- Pilih PIC Tugas (Opsional) --</option>
                      {(() => {
                        const currentSiteName = projectName || userSite || "";
                        if (!currentSiteName) {
                          return <option disabled value="">⚠️ Pilih Lokasi Site terlebih dahulu</option>;
                        }

                        const siteTugasClean = currentSiteName.toLowerCase().trim();
                        // Filter active users whose site matches the ticket's site
                        let eligiblePicTugas = users.filter(u => {
                          if (u.statusAktif === false) return false;
                          const uSiteClean = (u.siteTugas || "").toLowerCase().trim();
                          return uSiteClean === siteTugasClean;
                        });

                        // Fall back to include Kantor Pusat/Support users if no users are registered to this site
                        if (eligiblePicTugas.length === 0) {
                          eligiblePicTugas = users.filter(u => {
                            if (u.statusAktif === false) return false;
                            const uSiteClean = (u.siteTugas || "").toLowerCase().trim();
                            return !uSiteClean || uSiteClean === "kantor pusat";
                          });
                        }

                        // Ensure the current assigned picTugas value is ALWAYS present in the options list so it never disappears on editing
                        const namesSet = new Set(eligiblePicTugas.map(u => u.name));
                        if (picTugas && !namesSet.has(picTugas)) {
                          const existingUser = users.find(u => u.name === picTugas);
                          if (existingUser) {
                            eligiblePicTugas.push(existingUser);
                          } else {
                            eligiblePicTugas.push({
                              id: "existing-pic-tugas",
                              name: picTugas,
                              username: picTugas,
                              statusAktif: true
                            } as any);
                          }
                        }

                        if (eligiblePicTugas.length === 0) {
                          return <option disabled value="">Tidak ada petugas aktif</option>;
                        }

                        return eligiblePicTugas.map(u => (
                          <option key={u.id} value={u.name}>
                            {u.name}
                          </option>
                        ));
                      })()}
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
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 md:p-6 max-w-xl w-full shadow-2xl relative space-y-4 text-xs text-slate-700 dark:text-slate-300 font-semibold"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-850 pb-2.5">
                <div className="flex items-center gap-2">
                  <Activity className="w-4.5 h-4.5 text-emerald-500 animate-pulse" />
                  <h3 className="text-sm font-black text-slate-850 dark:text-white tracking-tight">
                    Follow Up & Solusi Penyelesaian Tiket
                  </h3>
                </div>
                <button
                  onClick={() => setIsFollowUpOpen(false)}
                  className="p-1 px-1.5 hover:bg-slate-100 dark:hover:bg-slate-850 rounded text-slate-400 hover:text-slate-650 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Informational Header cards - Extremely compact & sleek design */}
              <div className="bg-slate-50/80 dark:bg-slate-950/40 p-3.5 border border-slate-150/65 dark:border-slate-850/80 rounded-2xl text-[10.5px] font-medium leading-relaxed">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="col-span-2">
                    <span className="text-slate-400 dark:text-slate-500 font-extrabold uppercase tracking-widest text-[8.5px] block">No. Tiket & Judul Kasus</span>
                    <p className="font-extrabold mt-0.5">
                      <span className="text-indigo-600 dark:text-indigo-400 font-mono text-[11px] font-black mr-1.5">{followUpTicket.ticketNumber || "TCK-..."}</span> 
                      <span className="text-slate-700 dark:text-slate-300 line-clamp-1 inline">{followUpTicket.title}</span>
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-400 dark:text-slate-500 font-extrabold uppercase tracking-widest text-[8.5px] block">Pelapor / Unit</span>
                    <span className="text-slate-700 dark:text-slate-300 font-bold mt-0.5 block truncate" title={`${followUpTicket.reporterName} (${followUpTicket.unit})`}>
                      {followUpTicket.reporterName} ({followUpTicket.unit})
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 dark:text-slate-500 font-extrabold uppercase tracking-widest text-[8.5px] block">Status Saat Ini</span>
                    <span className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-100/60 dark:border-indigo-950/60 rounded text-[9px] font-black w-fit block mt-0.5">
                      {followUpTicket.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Follow-up Form */}
              <form onSubmit={handleSubmitFollowUp} className="space-y-4">
                
                {/* 3 Columns segment for Status, Date & Time Inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Updated Status Dropdown */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Update Status *</label>
                    <select
                      required
                      value={followUpStatus}
                      onChange={(e) => setFollowUpStatus(e.target.value)}
                      className="bg-slate-50 dark:bg-slate-950 border border-slate-205 dark:border-slate-800 py-2.5 px-3 rounded-xl text-slate-850 dark:text-slate-100 font-bold focus:border-indigo-500 text-xs transition-colors cursor-pointer"
                    >
                      <option value="">-- Pilih Status --</option>
                      <option value="In Progress">In Progress (Follow Up)</option>
                      <option value="Solved">Solved (Selesai)</option>
                    </select>
                  </div>

                  {/* Action Date Picker */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Tanggal Tindakan *</label>
                    <input
                      type="date"
                      required
                      value={followUpDate}
                      onChange={(e) => setFollowUpDate(e.target.value)}
                      className="bg-slate-50 dark:bg-slate-950 border border-slate-205 dark:border-slate-800 py-2.5 px-3 rounded-xl text-slate-850 dark:text-slate-100 font-bold focus:border-indigo-500 text-xs transition-colors cursor-pointer"
                    />
                  </div>

                  {/* Action Time Picker / Clock Input (Requirement 2) */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Jam / Waktu Tindakan *</label>
                    <input
                      type="time"
                      required
                      value={followUpTime}
                      onChange={(e) => setFollowUpTime(e.target.value)}
                      className="bg-slate-50 dark:bg-slate-950 border border-slate-205 dark:border-slate-800 py-2.5 px-3 rounded-xl text-slate-850 dark:text-slate-100 font-bold focus:border-indigo-500 text-xs transition-colors cursor-pointer"
                    />
                  </div>
                </div>

                {/* Follow-up Notes textarea */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-550 dark:text-slate-400 uppercase tracking-widest">Catatan Tindakan / Deskripsi Solusi *</label>
                  <textarea
                    rows={3}
                    required
                    value={followUpNotes}
                    onChange={(e) => setFollowUpNotes(e.target.value)}
                    placeholder="Contoh: Sudah dilakukan restart service apache pada web server, SIMRS kembali normal diakses oleh rekam medis."
                    className="bg-slate-50 dark:bg-slate-950 border border-slate-205 dark:border-slate-800 w-full py-2.5 px-3 rounded-xl text-slate-850 dark:text-slate-100 focus:border-indigo-500 transition-all font-bold placeholder-slate-400"
                  />
                </div>

                {/* Action controls */}
                <div className="flex justify-end gap-2.5 pt-3.5 border-t border-slate-100 dark:border-slate-850">
                  <button
                    type="button"
                    onClick={() => setIsFollowUpOpen(false)}
                    className="px-4 py-2 border border-slate-250 dark:border-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold rounded-xl hover:bg-slate-55 dark:hover:bg-slate-850 transition-all cursor-pointer"
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

        {/* =================== EXPORT DATA EXCEL & PDF MODAL =================== */}
        {isExportModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs select-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 md:p-6 max-w-md w-full shadow-2xl relative space-y-4 text-xs text-slate-700 dark:text-slate-300 font-semibold cursor-default"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-850 pb-2.5">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-emerald-500" />
                  <h3 className="text-sm font-black text-slate-850 dark:text-white tracking-tight">
                    Ekspor Tiket Helpdesk (Excel / PDF)
                  </h3>
                </div>
                <button
                  onClick={() => setIsExportModalOpen(false)}
                  className="p-1 px-1.5 hover:bg-slate-100 dark:hover:bg-slate-855 rounded text-slate-400 hover:text-slate-650 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Range Type Selector */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                  Pilih Rentang Waktu Ekspor *
                </label>
                <select
                  value={exportRangeType}
                  onChange={(e) => setExportRangeType(e.target.value as any)}
                  className="bg-slate-50 dark:bg-slate-950 border border-slate-205 dark:border-slate-800 py-2.5 px-3 rounded-xl text-slate-855 dark:text-slate-100 font-bold focus:border-indigo-500 text-xs transition-colors cursor-pointer"
                >
                  <option value="today">Hari Ini (Today)</option>
                  <option value="week">Minggu Ini (This Week)</option>
                  <option value="month">Pilih Bulan Tertentu</option>
                  <option value="range">Kustom Rentang Tanggal</option>
                  <option value="filtered">Sesuai Filter Aktif di Tabel</option>
                  <option value="all">Semua Tiket (Tanpa Filter)</option>
                </select>
              </div>

              {/* Conditional Inputs */}
              {exportRangeType === "month" && (
                <div className="flex flex-col gap-1.5 animate-fadeIn">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                    Pilih Bulan & Tahun *
                  </label>
                  <input
                    type="month"
                    required
                    value={exportMonth}
                    onChange={(e) => setExportMonth(e.target.value)}
                    className="bg-slate-50 dark:bg-slate-950 border border-slate-205 dark:border-slate-800 py-2.5 px-3 rounded-xl text-slate-855 dark:text-slate-100 font-bold focus:border-indigo-500 text-xs transition-colors cursor-pointer"
                  />
                </div>
              )}

              {exportRangeType === "range" && (
                <div className="grid grid-cols-2 gap-3.5 animate-fadeIn">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                      Tanggal Mulai *
                    </label>
                    <input
                      type="date"
                      required
                      value={exportStartDate}
                      onChange={(e) => setExportStartDate(e.target.value)}
                      className="bg-slate-50 dark:bg-slate-950 border border-slate-205 dark:border-slate-800 py-2.5 px-3 rounded-xl text-slate-855 dark:text-slate-100 font-bold focus:border-indigo-500 text-xs transition-colors cursor-pointer"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                      Tanggal Selesai *
                    </label>
                    <input
                      type="date"
                      required
                      value={exportEndDate}
                      onChange={(e) => setExportEndDate(e.target.value)}
                      className="bg-slate-50 dark:bg-slate-950 border border-slate-205 dark:border-slate-800 py-2.5 px-3 rounded-xl text-slate-855 dark:text-slate-100 font-bold focus:border-indigo-500 text-xs transition-colors cursor-pointer"
                    />
                  </div>
                </div>
              )}

              {/* Dynamic Count Preview Indicator */}
              {(() => {
                let list = [...tickets];
                const now = new Date();
                
                const getStartOfDay = (d: Date) => {
                  const nd = new Date(d);
                  nd.setHours(0, 0, 0, 0);
                  return nd;
                };

                const getEndOfDay = (d: Date) => {
                  const nd = new Date(d);
                  nd.setHours(23, 59, 59, 999);
                  return nd;
                };

                if (exportRangeType === "today") {
                  const todayStart = getStartOfDay(now);
                  const todayEnd = getEndOfDay(now);
                  list = tickets.filter(t => {
                    const tDate = new Date(t.createdAt);
                    return tDate >= todayStart && tDate <= todayEnd;
                  });
                } else if (exportRangeType === "week") {
                  const currentDay = now.getDay();
                  const startOfWeek = new Date(now);
                  startOfWeek.setDate(now.getDate() - currentDay);
                  const weekStart = getStartOfDay(startOfWeek);
                  
                  const endOfWeek = new Date(startOfWeek);
                  endOfWeek.setDate(startOfWeek.getDate() + 6);
                  const weekEnd = getEndOfDay(endOfWeek);

                  list = tickets.filter(t => {
                    const tDate = new Date(t.createdAt);
                    return tDate >= weekStart && tDate <= weekEnd;
                  });
                } else if (exportRangeType === "month") {
                  if (exportMonth) {
                    const [yearStr, monthStr] = exportMonth.split("-");
                    const year = parseInt(yearStr, 10);
                    const monthIndex = parseInt(monthStr, 10) - 1;

                    const monthStart = new Date(year, monthIndex, 1, 0, 0, 0, 0);
                    const monthEnd = new Date(year, monthIndex + 1, 0, 23, 59, 59, 999);

                    list = tickets.filter(t => {
                      const tDate = new Date(t.createdAt);
                      return tDate >= monthStart && tDate <= monthEnd;
                    });
                  } else {
                    list = [];
                  }
                } else if (exportRangeType === "range") {
                  if (exportStartDate && exportEndDate) {
                    const customStart = getStartOfDay(new Date(exportStartDate));
                    const customEnd = getEndOfDay(new Date(exportEndDate));

                    list = tickets.filter(t => {
                      const tDate = new Date(t.createdAt);
                      return tDate >= customStart && tDate <= customEnd;
                    });
                  } else {
                    list = [];
                  }
                } else if (exportRangeType === "filtered") {
                  list = [...filteredTickets];
                }

                const count = list.length;

                return (
                  <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl border border-slate-150 dark:border-slate-850 flex items-center justify-between text-xs transition-all">
                    <span className="text-slate-450 dark:text-slate-400 font-bold">Total estimasi baris hasil ekspor:</span>
                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-black ${
                      count > 0 
                        ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900" 
                        : "bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900"
                    }`}>
                      {count} Tiket
                    </span>
                  </div>
                );
              })()}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row justify-end gap-2 pt-3.5 border-t border-slate-100 dark:border-slate-850">
                <button
                  type="button"
                  onClick={() => setIsExportModalOpen(false)}
                  className="order-last sm:order-first px-4.5 py-2.5 border border-slate-250 dark:border-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold rounded-xl hover:bg-slate-55 dark:hover:bg-slate-855 transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  onClick={handleExportExcel}
                  type="button"
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl transition-all shadow-md hover:shadow-lg hover:scale-[1.01] active:scale-[0.99] cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <FileSpreadsheet className="w-4 h-4" /> Download Excel
                </button>
                <button
                  onClick={handleExportPDF}
                  type="button"
                  className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-black rounded-xl transition-all shadow-md hover:shadow-lg hover:scale-[1.01] active:scale-[0.99] cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <FileText className="w-4 h-4" /> Download PDF
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
