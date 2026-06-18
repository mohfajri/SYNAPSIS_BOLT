import React, { useState, useEffect } from "react";
import { User, Client, ChecklistItemSetting, ChecklistSubmission, ChecklistSubmissionItem } from "../types";
import { api } from "../lib/api";
import { 
  ClipboardCheck, 
  Settings, 
  History, 
  Plus, 
  Minus, 
  Trash2, 
  Edit2, 
  Save, 
  X, 
  Check, 
  AlertTriangle, 
  Search, 
  Calendar, 
  UploadCloud, 
  FileCheck, 
  FileText, 
  Download, 
  Printer, 
  Filter, 
  RotateCcw,
  Clock,
  Briefcase,
  Layers,
  ChevronRight,
  ChevronDown,
  Building,
  Image as ImageIcon,
  MessageSquare,
  Copy,
  ExternalLink
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

interface ChecklistViewProps {
  currentUser: User | null;
  clients: Client[];
  triggerRefresh?: () => void;
}

export default function ChecklistView({ currentUser, clients = [] }: ChecklistViewProps) {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<"isi" | "riwayat" | "settings">("isi");

  // Load Status / Errors
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Data State
  const [settingsItems, setSettingsItems] = useState<ChecklistItemSetting[]>([]);
  const [submissions, setSubmissions] = useState<ChecklistSubmission[]>([]);

  // Filtering State for History
  const [filterSite, setFilterSite] = useState("All");
  const [filterWaktu, setFilterWaktu] = useState("All");
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");
  const [filterStatus, setFilterStatus] = useState("All"); // All | Clear (All OK) | Issues (Has NOT OK)

  // Selection view for Detail Row
  const [selectedSubmission, setSelectedSubmission] = useState<ChecklistSubmission | null>(null);

  // Form Submission Form State
  const [formSite, setFormSite] = useState("");
  const [formTanggal, setFormTanggal] = useState("");
  const [formWaktu, setFormWaktu] = useState<"Pagi" | "Sore">("Pagi");
  const [formItems, setFormItems] = useState<ChecklistSubmissionItem[]>([]);
  const [attachmentData, setAttachmentData] = useState<string>("");
  const [attachmentName, setAttachmentName] = useState<string>("");
  const [isDragging, setIsDragging] = useState(false);

  // WhatsApp Resume Share State
  const [showWAPreview, setShowWAPreview] = useState(false);
  const [waPreviewText, setWaPreviewText] = useState("");

  // Settings Panel Form State
  const [isEditingItem, setIsEditingItem] = useState<string | null>(null);
  const [newItemName, setNewItemName] = useState("");
  const [newItemCategory, setNewItemCategory] = useState("NETWORKING");
  const [newItemOkLabel, setNewItemOkLabel] = useState("ON");
  const [newItemNotOkLabel, setNewItemNotOkLabel] = useState("OFF");

  // Filter & Search setting items
  const [settingsSearch, setSettingsSearch] = useState("");

  // User scoping verification
  const isUserScoped = currentUser && 
    currentUser.siteTugas && 
    currentUser.siteTugas.toLowerCase().trim() !== "kantor pusat" &&
    currentUser.role !== "Administrator" && 
    currentUser.role !== "Direktur";

  const getDefaultSite = () => {
    if (currentUser?.siteTugas && currentUser.siteTugas.toLowerCase().trim() !== "kantor pusat") {
      return currentUser.siteTugas;
    }
    if (clients.length > 0) {
      return clients[0].namaRS;
    }
    return "";
  };

  const isInitialized = React.useRef(false);

  // Populate Default values
  useEffect(() => {
    if (!isInitialized.current && clients.length > 0) {
      const today = new Date().toISOString().split("T")[0];
      setFormTanggal(today);
      setFormSite(getDefaultSite());
      fetchChecklistSettings();
      fetchSubmissions();
      isInitialized.current = true;
    } else {
      fetchSubmissions();
    }
  }, [currentUser, clients]);

  // Fetch Checklist Settings Items
  const fetchChecklistSettings = async () => {
    try {
      setLoading(true);
      const data = await api.getChecklistSettings();
      // Sort by order
      const sorted = (data || []).sort((a, b) => (a.order || 0) - (b.order || 0));
      setSettingsItems(sorted);
      
      // Initialize form items based on active settings
      initFormItems(sorted);
    } catch (err: any) {
      console.error(err);
      setErrorMsg("Gagal memuat konfigurasi item checklist: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch History Checklist Submissions
  const fetchSubmissions = async () => {
    try {
      const data = await api.getChecklistSubmissions();
      setSubmissions(data || []);
    } catch (err: any) {
      console.error(err);
    }
  };

  // Initialize the Fill-out checklist state
  const initFormItems = (items: ChecklistItemSetting[]) => {
    const activeItems = items.filter(it => it.active !== false);
    const mapped: ChecklistSubmissionItem[] = activeItems.map(it => ({
      id: it.id,
      category: it.category || "GENERAL",
      name: it.name,
      status: "", // Not checked yet
      okLabel: it.okLabel || "OK",
      notOkLabel: it.notOkLabel || "NOT OK",
      keterangan: ""
    }));
    setFormItems(mapped);
  };

  // Handle Drag & Drop photo files
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Format file harus berupa gambar (JPEG, PNG, GIF, BMP, WebP)!");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert("Ukuran berkas maksimal adalah 5MB!");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setAttachmentData(reader.result as string);
      setAttachmentName(file.name);
    };
    reader.readAsDataURL(file);
  };

  // Reset Fill checklist Form
  const handleResetForm = () => {
    const today = new Date().toISOString().split("T")[0];
    setFormTanggal(today);
    setFormWaktu("Pagi");
    setAttachmentData("");
    setAttachmentName("");
    setFormSite(getDefaultSite());
    initFormItems(settingsItems);
    setSuccessMsg("");
    setErrorMsg("");
  };

  // Submit Checklist
  const handleSubmitChecklist = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!formSite) {
      setErrorMsg("Silakan pilih Rumah Sakit / Site Tugas!");
      return;
    }
    if (!formTanggal) {
      setErrorMsg("Silakan tentukan tanggal checklist!");
      return;
    }

    // Check if there are unchecked items
    const unchecked = formItems.filter(item => !item.status);
    if (unchecked.length > 0) {
      if (!confirm(`Terdapat ${unchecked.length} item yang belum di-checklist statusnya. Apakah Anda yakin ingin menyimpannya?`)) {
        return;
      }
    }

    try {
      setLoading(true);
      const submissionPayload = {
        site: formSite,
        tanggal: formTanggal,
        waktu: formWaktu,
        userCreator: currentUser?.name || currentUser?.username || "Staff",
        roleCreator: currentUser?.role || "Technical Support",
        items: formItems,
        photoName: attachmentName || undefined,
        photoUrl: attachmentData || undefined,
        createdBy: currentUser?.username || "system"
      };

      await api.createChecklistSubmission(submissionPayload);
      setSuccessMsg(`Berhasil mengirimkan checklist ${formWaktu} untuk site ${formSite}!`);
      fetchSubmissions();
      
      // Auto switch tabs to history or reset form
      setTimeout(() => {
        handleResetForm();
        setActiveTab("riwayat");
      }, 1500);

    } catch (err: any) {
      setErrorMsg("Gagal menyimpan checklist: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Edit Submission (Keterangan/Status update inline)
  const handleUpdateSubmissionItem = async (submissionId: string, itemId: string, status: "OK" | "NOT OK" | "", keterangan: string) => {
    const sub = submissions.find(s => s.id === submissionId);
    if (!sub) return;

    const updatedItems = sub.items.map(it => {
      if (it.id === itemId) {
        return { ...it, status, keterangan };
      }
      return it;
    });

    try {
      const updated = await api.updateChecklistSubmission(submissionId, { items: updatedItems });
      setSubmissions(submissions.map(s => s.id === submissionId ? updated : s));
      if (selectedSubmission?.id === submissionId) {
        setSelectedSubmission(updated);
      }
    } catch (err: any) {
      alert("Gagal merubah item harian: " + err.message);
    }
  };

  // Delete Submission History Record
  const handleDeleteSubmission = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Apakah Anda yakin ingin menghapus arsip riwayat checklist ini?")) return;

    try {
      await api.deleteChecklistSubmission(id);
      setSubmissions(submissions.filter(s => s.id !== id));
      if (selectedSubmission?.id === id) {
        setSelectedSubmission(null);
      }
    } catch (err: any) {
      alert("Gagal menghapus: " + err.message);
    }
  };

  // Create Checklist Item (System Settings)
  const handleAddNewSettingItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;

    try {
      setLoading(true);
      const payload = {
        name: newItemName.trim(),
        category: newItemCategory,
        okLabel: newItemOkLabel.trim() || "ON",
        notOkLabel: newItemNotOkLabel.trim() || "OFF",
        active: true
      };

      const newItem = await api.createChecklistItemSetting(payload);
      const updatedList = [...settingsItems, newItem].sort((a, b) => (a.order || 0) - (b.order || 0));
      setSettingsItems(updatedList);
      initFormItems(updatedList);

      setNewItemName("");
      setNewItemOkLabel("ON");
      setNewItemNotOkLabel("OFF");
    } catch (err: any) {
      alert("Gagal menambahkan item: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Toggle checklist item active status
  const handleToggleSettingActive = async (item: ChecklistItemSetting) => {
    try {
      const updated = await api.updateChecklistItemSetting(item.id, { active: !item.active });
      const updatedList = settingsItems.map(it => it.id === item.id ? updated : it);
      setSettingsItems(updatedList);
      initFormItems(updatedList);
    } catch (err: any) {
      alert("Gagal merubah status: " + err.message);
    }
  };

  // Update complete checklist item options
  const handleSaveSettingItemEdit = async (id: string, name: string, category: string, okLabel: string, notOkLabel: string) => {
    try {
      const updated = await api.updateChecklistItemSetting(id, { name, category, okLabel, notOkLabel });
      const updatedList = settingsItems.map(it => it.id === id ? updated : it);
      setSettingsItems(updatedList);
      initFormItems(updatedList);
      setIsEditingItem(null);
    } catch (err: any) {
      alert("Gagal menyimpan perubahan: " + err.message);
    }
  };

  // Delete checklist item reference
  const handleDeleteSettingItem = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus item ini dari master setting checklist? Submisi lama akan tetap merekam data tersebut.")) return;
    try {
      await api.deleteChecklistItemSetting(id);
      const updatedList = settingsItems.filter(it => it.id !== id);
      setSettingsItems(updatedList);
      initFormItems(updatedList);
    } catch (err: any) {
      alert("Gagal menghapus: " + err.message);
    }
  };

  // Filters Submissions
  const getFilteredSubmissions = () => {
    return submissions.filter(sub => {
      if (isUserScoped && sub.site !== currentUser?.siteTugas) {
        return false;
      }
      const matchesSite = filterSite === "All" || sub.site === filterSite;
      const matchesWaktu = filterWaktu === "All" || sub.waktu === filterWaktu;
      
      const subDate = new Date(sub.tanggal);
      let matchesStart = true;
      if (filterStartDate) {
        const start = new Date(filterStartDate);
        start.setHours(0,0,0,0);
        matchesStart = subDate >= start;
      }
      let matchesEnd = true;
      if (filterEndDate) {
        const end = new Date(filterEndDate);
        end.setHours(23,59,59,999);
        matchesEnd = subDate <= end;
      }

      let matchesStatus = true;
      if (filterStatus === "Issues") {
        matchesStatus = sub.items.some(it => it.status === "NOT OK");
      } else if (filterStatus === "Clear") {
        matchesStatus = !sub.items.some(it => it.status === "NOT OK");
      }

      return matchesSite && matchesWaktu && matchesStart && matchesEnd && matchesStatus;
    });
  };

  const filteredSubmissions = getFilteredSubmissions();

  // Helper formats Indonesian Date 
  const formatDateIndo = (dateStr: string) => {
    if (!dateStr) return "-";
    try {
      const dates = new Date(dateStr);
      if (isNaN(dates.getTime())) return dateStr;
      return dates.toLocaleDateString("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "short",
        year: "numeric"
      });
    } catch (e) {
      return dateStr;
    }
  };

  // Checklist Categories List Helper
  const categoriesList = [
    "NETWORKING",
    "ANTRIAN PENDAFTARAN MANDIRI",
    "LOKET PENDAFTARAN",
    "FARMASI",
    "PELAYANAN",
    "BED MONITORING & JADWAL OPERASI",
    "BI DIREKSI",
    "BRIDGING",
    "GENERAL"
  ];

  // Group Submission Items by Category
  const groupItemsByCategory = (items: any[]) => {
    const groups: Record<string, any[]> = {};
    items.forEach(it => {
      const cat = it.category || "GENERAL";
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(it);
    });
    return groups;
  };

  // ================= EXPORT TO EXCEL =================
  const handleExportHistoryToExcel = () => {
    try {
      if (filteredSubmissions.length === 0) {
        alert("Tidak ada data checklist untuk diekspor!");
        return;
      }

      // We will export a structured sheet showing all submissions
      // with count of OK, NOT OK and missing, and details
      const excelData = filteredSubmissions.map((sub, idx) => {
        const totalItems = sub.items.length;
        const totalOk = sub.items.filter(it => it.status === "OK").length;
        const totalNotOk = sub.items.filter(it => it.status === "NOT OK").length;
        const totalUncheck = sub.items.filter(it => !it.status).length;
        
        let issueNotes = sub.items
          .filter(it => it.status === "NOT OK")
          .map(it => `[${it.category}] ${it.name}: ${it.keterangan || "Tanpa Keterangan"}`)
          .join(" | ");

        return {
          "No": idx + 1,
          "Nama Rumah Sakit (Site)": sub.site,
          "Tanggal Checklist": sub.tanggal,
          "Waktu Shift": sub.waktu,
          "Pemeriksa (SDM)": sub.userCreator,
          "Role Jabatan": sub.roleCreator,
          "Total Item Diperiksa": totalItems,
          "Total OK": totalOk,
          "Total NOT OK": totalNotOk,
          "Belum Diisi": totalUncheck,
          "Ringkasan Masalah (NOT OK)": issueNotes || "Semua Berfungsi Normal"
        };
      });

      const worksheet = XLSX.utils.json_to_sheet(excelData);
      
      // Auto width columns
      const maxLens = Object.keys(excelData[0] || {}).map(key => {
        let maxLen = key.length;
        excelData.forEach(row => {
          const val = (row as any)[key];
          const len = val ? String(val).length : 0;
          if (len > maxLen) maxLen = len;
        });
        return { wch: Math.min(Math.max(maxLen + 3, 10), 60) };
      });
      worksheet["!cols"] = maxLens;

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Laporan_Checklist_Harian");

      const filename = `Laporan_Checklist_Harian_Ekspor_${new Date().toISOString().split("T")[0]}.xlsx`;
      XLSX.writeFile(workbook, filename);
    } catch (err: any) {
      alert("Gagal ekspor ke Excel: " + err.message);
    }
  };

  // ================= PREPARE WHATSAPP TEXT RESUME =================
  const handlePrepareWAPreview = (sub: ChecklistSubmission) => {
    try {
      const formattedDate = formatDateIndo(sub.tanggal);
      let timeStr = "";
      if (sub.createdAt) {
        try {
          const dt = new Date(sub.createdAt);
          const hours = String(dt.getHours()).padStart(2, '0');
          const minutes = String(dt.getMinutes()).padStart(2, '0');
          timeStr = `${hours}.${minutes} WITA`;
        } catch {
          timeStr = "08.00 WITA";
        }
      } else {
        timeStr = "08.00 WITA";
      }

      let text = `Berikut Resume ${sub.waktu === "Pagi" ? "Morning" : "Afternoon"} Checklist ${sub.site}\n\n`;
      text += `Hari/Tanggal : ${formattedDate}\n`;
      text += `Pukul : ${timeStr}\n\n`;

      const grouped = groupItemsByCategory(sub.items);
      let catIndex = 1;

      Object.entries(grouped).forEach(([category, items]) => {
        text += `*${catIndex}. ${category.toUpperCase()}*\n`;
        items.forEach((it) => {
          const statusText = it.status ? it.status : "Belum Dicek";
          const ketText = it.keterangan ? ` (Update : ${it.keterangan})` : "";
          
          let cleanerName = it.name || "";
          cleanerName = cleanerName.replace(/^\s*[a-zA-Z0-9]+[\.\)]+\s*/, "");

          text += `- ${cleanerName} : ${statusText}${ketText}\n`;
        });
        text += `\n`;
        catIndex++;
      });

      setWaPreviewText(text.trim());
      setShowWAPreview(true);
    } catch (err: any) {
      alert("Gagal menyiapkan resume WhatsApp: " + err.message);
    }
  };

  // ================= EXPORT INDIVIDUAL SUBMISSION TO PDF ON F4 =================
  const handleExportIndividualPDF = (sub: ChecklistSubmission) => {
    try {
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "pt",
        format: [612.0, 936.5] // F4 standard dimensions in points: 8.5 x 13.0 inches (approx 612 x 936 pt)
      });

      // PDF Title / Header
      doc.setFillColor(255, 255, 255); // Plain White Header base
      doc.rect(0, 0, 612, 100, "F");

      // Grid line border on top
      doc.setDrawColor(220, 225, 230);
      doc.setLineWidth(1);
      doc.line(30, 90, 582, 90);

      // Title 
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.setTextColor(24, 30, 40);
      doc.text("LAPORAN CHECKLIST PEMELIHARAAN SISTEM SIMRS", 30, 45);

      // Subtitle with Meta
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(80, 90, 100);
      doc.text(`Kategori Checklist: Harian (Pagi & Sore) - Kertas Ukuran F4`, 30, 62);
      doc.text(`Lokasi Site Tugas: ${sub.site}`, 30, 77);

      // Metadata Info Blocks
      doc.setFont("helvetica", "bold");
      doc.text("Tanggal Checklist:", 30, 115);
      doc.setFont("helvetica", "normal");
      doc.text(formatDateIndo(sub.tanggal), 140, 115);

      doc.setFont("helvetica", "bold");
      doc.text("Waktu Shift:", 30, 130);
      doc.setFont("helvetica", "normal");
      doc.text(sub.waktu, 140, 130);

      doc.setFont("helvetica", "bold");
      doc.text("Pemeriksa (SDM Site):", 30, 145);
      doc.setFont("helvetica", "normal");
      doc.text(`${sub.userCreator} (${sub.roleCreator})`, 140, 145);

      // Stats Summary
      const totalCount = sub.items.length;
      const okCount = sub.items.filter(it => it.status === "OK").length;
      const notOkCount = sub.items.filter(it => it.status === "NOT OK").length;
      const uncheckCount = sub.items.filter(it => !it.status).length;

      doc.setFont("helvetica", "bold");
      doc.text("Kondisi Perangkat:", 30, 160);
      doc.setFont("helvetica", "normal");
      doc.text(`Total: ${totalCount} Item | OK: ${okCount} | NOT OK: ${notOkCount} | Belum Terisi: ${uncheckCount}`, 140, 160);

      doc.line(30, 170, 582, 170);

      // Table mapping items
      const tableHeaders = [["No", "Nama Komponen", "Kondisi", "Temuan & Keterangan / Tindak Lanjut"]];
      
      const grouped: { [category: string]: typeof sub.items } = {};
      sub.items.forEach(it => {
        const cat = (it.category || "GENERAL").toUpperCase();
        if (!grouped[cat]) {
          grouped[cat] = [];
        }
        grouped[cat].push(it);
      });

      const tableRows: any[] = [];
      let globalIndex = 1;

      Object.keys(grouped).forEach(cat => {
        // Insert category header row with colSpan
        tableRows.push([
          { 
            content: `KATEGORI: ${cat}`, 
            colSpan: 4, 
            styles: { 
              fillColor: [230, 237, 245], 
              textColor: [30, 41, 59], 
              fontStyle: "bold", 
              fontSize: 9,
              halign: "left"
            } 
          }
        ]);

        grouped[cat].forEach(it => {
          const displayStatus = it.status ? (it.status === "OK" ? `${it.status} (${it.okLabel})` : `${it.status} (${it.notOkLabel})`) : "Belum Dicek";
          tableRows.push([
            globalIndex++,
            it.name,
            displayStatus,
            it.keterangan || "-"
          ]);
        });
      });

      autoTable(doc, {
        head: tableHeaders,
        body: tableRows,
        startY: 185,
        margin: { left: 30, right: 30, bottom: 40 },
        theme: "grid",
        styles: {
          fontSize: 8,
          cellPadding: 4,
          overflow: "linebreak",
          halign: "left",
          valign: "middle",
          font: "helvetica"
        },
        headStyles: {
          fillColor: [50, 70, 100],
          textColor: [255, 255, 255],
          fontStyle: "bold",
          fontSize: 9
        },
        alternateRowStyles: {
          fillColor: [247, 249, 251]
        },
        columnStyles: {
          0: { cellWidth: 30, halign: "center" }, // No
          1: { cellWidth: 220 },                  // Nama Komponen
          2: { cellWidth: 90, fontStyle: "bold" },// Kondisi
          3: { cellWidth: 212 }                   // Temuan & Keterangan / Tindak Lanjut
        },
        didParseCell: (data) => {
          if (data.cell.raw && typeof data.cell.raw === "object" && "colSpan" in data.cell.raw) {
            return;
          }
          if (data.column.index === 2 && data.cell.text[0]) {
            if (data.cell.text[0].startsWith("OK")) {
              data.cell.styles.textColor = [16, 124, 65]; // Green color
            } else if (data.cell.text[0].startsWith("NOT OK")) {
              data.cell.styles.textColor = [168, 0, 0]; // Red color
            }
          }
        }
      });

      // Photo attachment if exists
      if (sub.photoUrl) {
        let finalY = (doc as any).lastAutoTable.finalY || 400;
        
        // Check page overflow for image
        if (finalY + 160 > 900) {
          doc.addPage();
          doc.setFont("helvetica", "bold");
          doc.setFontSize(10);
          doc.setTextColor(40, 50, 60);
          doc.text("DOKUMENTASI FOTO ATTACHMENT / PROOF OF DATA ATTACHED", 30, 40);
          doc.setDrawColor(200, 205, 210);
          doc.line(30, 45, 582, 45);
          
          try {
            doc.addImage(sub.photoUrl, "JPEG", 30, 60, 250, 180);
            doc.text(`Nama berkas: ${sub.photoName || "checklist_evidence.jpg"}`, 30, 255);
          } catch (e) {
            doc.text("[Gagal memuat gambar lampiran ke PDF - Format base64 tidak cocok]", 30, 60);
          }
        } else {
          doc.setFont("helvetica", "bold");
          doc.setFontSize(10);
          doc.setTextColor(40, 50, 60);
          doc.text("DOKUMENTASI FOTO ATTACHMENT / PROOF OF DATA ATTACHED", 30, finalY + 20);
          doc.setDrawColor(200, 205, 210);
          doc.line(30, finalY + 25, 582, finalY + 25);
          
          try {
            doc.addImage(sub.photoUrl, "JPEG", 30, finalY + 35, 250, 180);
            doc.setFont("helvetica", "normal");
            doc.text(`Nama berkas: ${sub.photoName || "checklist_evidence.jpg"}`, 30, finalY + 230);
          } catch (e) {
            doc.setFont("helvetica", "normal");
            doc.text("[Gagal memuat gambar lampiran ke PDF - Format base64 tidak cocok]", 30, finalY + 35);
          }
        }
      }

      // Render beautiful Signatures block
      let currentY = (doc as any).lastAutoTable.finalY || 250;
      if (sub.photoUrl) {
        if (currentY + 160 > 900) {
          currentY = 270; // after photo on new page
        } else {
          currentY = currentY + 245; // after photo on same page
        }
      } else {
        currentY = currentY + 30; // after table
      }

      // Check if signature block fits in current page
      if (currentY + 120 > 880) {
        doc.addPage();
        currentY = 50;
      }

      doc.setDrawColor(220, 225, 230);
      doc.line(30, currentY - 5, 582, currentY - 5);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(50, 60, 75);

      const sigY = currentY + 15;
      doc.text("Petugas Pelaksana SIMRS,", 60, sigY);
      doc.text("Supervisor / Site Coordinator,", 380, sigY);

      doc.setFont("helvetica", "italic");
      doc.setFontSize(8);
      doc.setTextColor(160, 170, 180);
      doc.text("[ Tanda Tangan / E-Sign ]", 80, sigY + 50);
      doc.text("[ Tanda Tangan / E-Sign ]", 410, sigY + 50);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(50, 60, 75);
      
      doc.text(`( ${sub.userCreator} )`, 50, sigY + 75);
      doc.text("(                                                 )", 370, sigY + 75);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(110, 120, 130);
      doc.text(`Role: ${sub.roleCreator}`, 50, sigY + 88);
      doc.text("Role: SPV / Site Coordinator", 370, sigY + 88);

      // Safe page counting and footers
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFont("helvetica", "italic");
        doc.setFontSize(8);
        doc.setTextColor(140, 145, 150);
        doc.text(`Sistem Monitoring SIMRS - Halaman ${i} dari ${pageCount} (F4 Layout - 215mm x 330mm)`, 30, 915);
        doc.text(`Tercetak tanggal: ${new Date().toLocaleString("id-ID")}`, 400, 915);
      }

      doc.save(`Checklist_${sub.site}_${sub.waktu}_${sub.tanggal}.pdf`);
    } catch (err: any) {
      alert("Gagal mencetak dokumen PDF: " + err.message);
      console.error(err);
    }
  };

  // Check if role is allowed to configure setting items
  const isAllowedToConfigure = 
    currentUser?.role === "Administrator" || 
    currentUser?.role === "Developer" || 
    currentUser?.role === "Site Coordinator" || 
    currentUser?.role === "System Support";

  // Filter setting items on search
  const filteredSettingItems = settingsItems.filter(item => {
    return (
      item.name.toLowerCase().includes(settingsSearch.toLowerCase()) ||
      item.category.toLowerCase().includes(settingsSearch.toLowerCase())
    );
  });

  return (
    <div id="checklist-view-wrapper" className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
      
      {/* Upper header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <h1 className="text-xl font-bold font-sans text-slate-900 dark:text-white flex items-center gap-2">
            <ClipboardCheck className="w-6 h-6 text-green-600 animate-pulse" />
            Checklist Pemeliharaan Harian
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Formulir pemantauan berkala layanan SIMRS di site operasional setiap Pagi & Sore beserta pencatatan kondisi perangkat integrasi.
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800 self-start md:self-auto">
          <button
            onClick={() => setActiveTab("isi")}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${activeTab === "isi" ? "bg-white dark:bg-slate-900 shadow-sm text-green-700 dark:text-green-400" : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"}`}
          >
            <Plus className="w-3.5 h-3.5" />
            Isi Checklist
          </button>
          
          <button
            onClick={() => setActiveTab("riwayat")}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${activeTab === "riwayat" ? "bg-white dark:bg-slate-900 shadow-sm text-blue-700 dark:text-blue-400" : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"}`}
          >
            <History className="w-3.5 h-3.5" />
            Riwayat & Arsip
          </button>

          <button
            onClick={() => setActiveTab("settings")}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${activeTab === "settings" ? "bg-white dark:bg-slate-900 shadow-sm text-purple-700 dark:text-purple-400" : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"}`}
          >
            <Settings className="w-3.5 h-3.5" />
            Custom Item Setting
          </button>
        </div>
      </div>

      {/* Main Container Views */}
      <AnimatePresence mode="wait">
        
        {/* TAB 1: ISI CHECKLIST FORM */}
        {activeTab === "isi" && (
          <motion.div
            key="isi-checklist-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
            {/* Form Left Side: Meta input details */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 pb-2 border-b border-slate-100 dark:border-slate-800">
                  INFORMASI KUNJUNGAN TIM SDM
                </h3>

                {successMsg && (
                  <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/30 p-3 rounded-xl text-xs text-emerald-800 dark:text-emerald-400 flex items-start gap-2 animate-fade-in">
                    <Check className="w-4 h-4 shrink-0 mt-0.5" />
                    <div>{successMsg}</div>
                  </div>
                )}

                {errorMsg && (
                  <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800/20 p-3 rounded-xl text-xs text-rose-800 dark:text-rose-400 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <div>{errorMsg}</div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-black uppercase text-slate-600 dark:text-slate-400 tracking-wider mb-2">
                    Rumah Sakit / Lokasi Site <span className="text-red-550 font-bold">*</span>
                  </label>
                  <select
                    value={formSite}
                    onChange={(e) => setFormSite(e.target.value)}
                    disabled={!!isUserScoped}
                    className="w-full text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-green-600 transition-all font-semibold disabled:opacity-80 disabled:cursor-not-allowed disabled:bg-slate-100/50"
                  >
                    <option value="">-- Pilih Site Tugas --</option>
                    {clients.map(cl => (
                      <option key={cl.id} value={cl.namaRS}>{cl.namaRS}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black uppercase text-slate-600 dark:text-slate-400 tracking-wider mb-2">
                      Tanggal Kerja <span className="text-red-550 font-bold">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="date"
                        value={formTanggal}
                        onChange={(e) => setFormTanggal(e.target.value)}
                        className="w-full text-xs p-3 pl-8 rounded-xl border border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-green-600 font-medium"
                      />
                      <Calendar className="absolute left-2.5 top-3.5 text-slate-400 w-4 h-4 pointer-events-none" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase text-slate-600 dark:text-slate-400 tracking-wider mb-2">
                      Waktu Shift <span className="text-red-550 font-bold">*</span>
                    </label>
                    <div className="grid grid-cols-2 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
                      <button
                        type="button"
                        onClick={() => setFormWaktu("Pagi")}
                        className={`text-xs font-bold py-2 rounded-lg transition-all ${formWaktu === "Pagi" ? "bg-white dark:bg-slate-900 text-green-700 shadow-xs" : "text-slate-500"}`}
                      >
                        Pagi 🌅
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormWaktu("Sore")}
                        className={`text-xs font-bold py-2 rounded-lg transition-all ${formWaktu === "Sore" ? "bg-white dark:bg-slate-900 text-amber-700 shadow-xs" : "text-slate-500"}`}
                      >
                        Sore 🌇
                      </button>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                    Petugas Checklist (SDM):
                  </span>
                  <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800 p-3 rounded-lg">
                    <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-950 flex items-center justify-center text-xs text-green-700 font-black uppercase">
                      {(currentUser?.name || "S").slice(0, 2)}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{currentUser?.name || "Guest SDM"}</p>
                      <p className="text-[10px] text-slate-400 font-semibold uppercase">{currentUser?.role || "Staff"}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Upload evidence images */}
              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                  FILE LAMPIRAN / SCREENSHOT DATA
                </h3>
                
                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all ${isDragging ? "border-green-500 bg-green-50/10" : "border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-700 bg-slate-50/30"}`}
                >
                  {attachmentData ? (
                    <div className="space-y-3">
                      <div className="relative w-full max-h-48 overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                        <img 
                          src={attachmentData} 
                          alt="Evidence Attachment" 
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-contain mx-auto"
                        />
                        <button
                          type="button"
                          onClick={() => { setAttachmentData(""); setAttachmentName(""); }}
                          className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white p-1 rounded-full shadow-lg transition-all"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-[10px] text-slate-500 font-semibold truncate bg-slate-100 dark:bg-slate-950 p-2 rounded-lg">
                        {attachmentName}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex justify-center">
                        <UploadCloud className="w-10 h-10 text-slate-350 dark:text-slate-650" />
                      </div>
                      <div className="text-[11px] text-slate-500 font-medium">
                        Seret & jatuhkan foto bukti audit di sini, atau
                      </div>
                      <label className="text-xs text-green-600 dark:text-green-400 font-bold hover:underline cursor-pointer">
                        pilih file dari galeri Anda
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleFileInputChange}
                        />
                      </label>
                    </div>
                  )}
                </div>
              </div>

              {/* Form Action Buttons */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleResetForm}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-950 dark:hover:bg-slate-850 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-350 text-xs py-3 px-4 rounded-xl font-bold transition-all transition-duration-300 active:scale-95"
                >
                  Reset Form
                </button>
                <button
                  type="button"
                  onClick={handleSubmitChecklist}
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold text-xs py-3 px-4 rounded-xl shadow-lg shadow-green-600/10 hover:shadow-green-600/20 hover:brightness-105 active:scale-95 transition-all text-center flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Kirim Checklist
                </button>
              </div>
            </div>

            {/* Form Right Side: Checklist Accordions or Items list */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-5 gap-3">
                  <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider">
                    BUTIR-BUTIR EVALUASI SISTEM & KONDISI PERANGKAT
                  </h3>
                  <div className="flex items-center gap-2">
                    {formItems.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setFormItems(prev => prev.map(p => ({ ...p, status: "OK" })));
                        }}
                        className="text-[10px] sm:text-xs bg-green-50 hover:bg-green-100 dark:bg-green-950/20 dark:hover:bg-green-950/40 border border-green-200 dark:border-green-800/60 px-3 py-1.5 rounded-lg font-bold text-green-700 dark:text-green-400 transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                        Set Semua ON / Reply
                      </button>
                    )}
                    <span className="text-xs bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-full font-bold text-slate-600 dark:text-slate-300 shrink-0">
                      {formItems.filter(it => it.status).length} / {formItems.length} Selesai
                    </span>
                  </div>
                </div>

                {formItems.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 space-y-2">
                    <ClipboardCheck className="w-12 h-12 mx-auto text-slate-300" />
                    <p className="text-xs font-bold">Tidak ada item checklist yang terdaftar atau aktif.</p>
                    <p className="text-[10px] text-slate-500">Anda dapat mendefinisikan item-item checklist baru di tab "Custom Item Setting".</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Render Grouped Categories */}
                    {Object.entries(groupItemsByCategory(formItems)).map(([category, items]) => (
                      <div key={category} className="border border-slate-100 dark:border-slate-850 rounded-xl overflow-hidden bg-slate-50/50 dark:bg-slate-950/20">
                        <div className="bg-slate-100/60 dark:bg-slate-950 px-4 py-3 border-b border-slate-100 dark:border-slate-850 flex items-center justify-between">
                          <span className="text-xs font-black text-slate-700 dark:text-slate-200 tracking-wider">
                            📂 {category}
                          </span>
                          <span className="text-[10px] bg-slate-200/60 dark:bg-slate-800 px-2 py-0.5 rounded-full font-bold text-slate-600 dark:text-slate-400">
                            {items.length} Item
                          </span>
                        </div>

                        <div className="divide-y divide-slate-150 dark:divide-slate-850">
                          {items.map((it: ChecklistSubmissionItem) => {
                            return (
                              <div key={it.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900">
                                <div className="space-y-1 flex-1">
                                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-snug">
                                    {it.name}
                                  </p>
                                </div>

                                {/* Custom Selection OK vs NOT OK to keep state safe */}
                                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                                  <div className="flex bg-slate-100/80 dark:bg-slate-950 p-1 rounded-lg border border-slate-200/60 dark:border-slate-800/60">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setFormItems(prev => prev.map(p => p.id === it.id ? { ...p, status: "OK" } : p));
                                      }}
                                      className={`text-[11px] px-3 py-1.5 font-bold uppercase rounded-md transition-all ${it.status === "OK" ? "bg-emerald-600 text-white shadow-xs" : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"}`}
                                    >
                                      {it.okLabel || "OK"}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setFormItems(prev => prev.map(p => p.id === it.id ? { ...p, status: "NOT OK" } : p));
                                      }}
                                      className={`text-[11px] px-3 py-1.5 font-bold uppercase rounded-md transition-all ${it.status === "NOT OK" ? "bg-rose-600 text-white shadow-xs" : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"}`}
                                    >
                                      {it.notOkLabel || "NOT OK"}
                                    </button>
                                  </div>

                                  <input
                                    type="text"
                                    value={it.keterangan}
                                    onChange={(e) => {
                                      const text = e.target.value;
                                      setFormItems(prev => prev.map(p => p.id === it.id ? { ...p, keterangan: text } : p));
                                    }}
                                    placeholder="Temuan, tindak lanjut, keterangan..."
                                    className="text-[11px] font-medium p-2 rounded-lg border border-slate-200/80 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-1 focus:ring-green-600 w-full md:w-56"
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* TAB 2: RIWAYAT & ARSIP CHECKLIST */}
        {activeTab === "riwayat" && (
          <motion.div
            key="riwayat-checklist-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Filter Panel Submissions */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                <Filter className="w-4 h-4 text-blue-600" />
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-350">
                  Saringan Filter Data & Integrasi Ekspor
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1.5 font-mono">SITE RUMAH SAKIT</label>
                  <select
                    value={isUserScoped ? (currentUser?.siteTugas || "") : filterSite}
                    onChange={(e) => setFilterSite(e.target.value)}
                    disabled={!!isUserScoped}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none font-semibold disabled:opacity-80 disabled:cursor-not-allowed disabled:bg-slate-100/50"
                  >
                    {isUserScoped ? (
                      <option value={currentUser?.siteTugas}>{currentUser?.siteTugas}</option>
                    ) : (
                      <>
                        <option value="All">-- Semua Site/Klien --</option>
                        {clients.map(cl => (
                          <option key={cl.id} value={cl.namaRS}>{cl.namaRS}</option>
                        ))}
                      </>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1.5 font-mono">WAKTU SHIFT</label>
                  <select
                    value={filterWaktu}
                    onChange={(e) => setFilterWaktu(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none font-semibold"
                  >
                    <option value="All">-- Semua Shift --</option>
                    <option value="Pagi">Pagi 🌅</option>
                    <option value="Sore">Sore 🌇</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1.5 font-mono">TANGGAL MULAI</label>
                  <input
                    type="date"
                    value={filterStartDate}
                    onChange={(e) => setFilterStartDate(e.target.value)}
                    className="w-full text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1.5 font-mono">TANGGAL SELESAI</label>
                  <input
                    type="date"
                    value={filterEndDate}
                    onChange={(e) => setFilterEndDate(e.target.value)}
                    className="w-full text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1.5 font-mono">KONDISI LAYANAN</label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none font-semibold"
                  >
                    <option value="All">Semua Kondisi</option>
                    <option value="Clear">Semua OK (Lancar) ✅</option>
                    <option value="Issues">Ada Temuan NOT OK ⚠️</option>
                  </select>
                </div>
              </div>

              {/* Action Tools */}
              <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                <button
                  onClick={() => {
                    setFilterSite("All");
                    setFilterWaktu("All");
                    setFilterStartDate("");
                    setFilterEndDate("");
                    setFilterStatus("All");
                  }}
                  className="flex items-center gap-1.5 text-[11px] text-slate-500 hover:text-slate-800 font-bold uppercase"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reset Filter
                </button>

                <div className="flex gap-2">
                  <button
                    onClick={handleExportHistoryToExcel}
                    className="flex items-center gap-1.5 px-4 py-2 bg-emerald-700/10 hover:bg-emerald-700/20 text-emerald-800 dark:text-emerald-400 rounded-lg text-xs font-bold transition-all"
                  >
                    <Download className="w-4 h-4" />
                    Ekspor Excel
                  </button>
                </div>
              </div>
            </div>

            {/* Submissions Split Table / Details */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* History list */}
              <div className="lg:col-span-1 space-y-4">
                <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                  <h3 className="text-xs font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider pb-2 border-b border-slate-100 dark:border-slate-850 mb-3">
                    HASIL FILTER ({filteredSubmissions.length} DATA)
                  </h3>

                  {filteredSubmissions.length === 0 ? (
                    <div className="text-center py-12 text-slate-400">
                      <p className="text-xs font-bold">Tidak ada riwayat checklist.</p>
                      <p className="text-[10px] text-slate-500 mt-1">Silakan sesuaikan saringan atau parameter filter Anda.</p>
                    </div>
                  ) : (
                    <div className="max-h-[600px] overflow-y-auto space-y-2.5 pr-1">
                      {filteredSubmissions.map(sub => {
                        const hasNotOk = sub.items.some(it => it.status === "NOT OK");
                        const okCount = sub.items.filter(it => it.status === "OK").length;
                        const notOkCount = sub.items.filter(it => it.status === "NOT OK").length;
                        const uncheckCount = sub.items.filter(it => !it.status).length;
                        const isChosen = selectedSubmission?.id === sub.id;

                        return (
                          <div
                            key={sub.id}
                            onClick={() => setSelectedSubmission(sub)}
                            className={`p-3.5 rounded-xl border transition-all cursor-pointer relative overflow-hidden group ${isChosen ? "bg-blue-50/20 dark:bg-blue-950/20 border-blue-500 shadow-sm" : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-350 dark:hover:border-slate-700"}`}
                          >
                            <div className="flex items-start justify-between gap-1">
                              <div>
                                <h4 className="text-xs font-black text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                  {sub.site}
                                </h4>
                                <p className="text-[11px] text-slate-550 dark:text-slate-450 mt-1 font-medium flex items-center gap-1">
                                  <span>{sub.waktu === "Pagi" ? "🌅 Pagi" : "🌇 Sore"}</span>
                                  <span className="text-slate-300">|</span>
                                  <span>{sub.tanggal}</span>
                                </p>
                              </div>

                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase shrink-0 ${hasNotOk ? "bg-rose-100/70 text-rose-800 dark:bg-rose-955/20 dark:text-rose-400" : "bg-emerald-100/70 text-emerald-800 dark:bg-emerald-955/20 dark:text-emerald-400"}`}>
                                {hasNotOk ? "Temuan ⚠️" : "Normal ✅"}
                              </span>
                            </div>

                            {/* stats mini counter */}
                            <div className="mt-3 flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-100 dark:border-slate-800/80 pt-2 font-mono">
                              <div>
                                OK: <span className="font-bold text-green-600">{okCount}</span>
                              </div>
                              <div>
                                NOT OK: <span className={`font-bold ${notOkCount > 0 ? "text-red-600" : "text-slate-400"}`}>{notOkCount}</span>
                              </div>
                              <div>
                                Kosong: <span className="font-bold text-slate-555">{uncheckCount}</span>
                              </div>
                              <button
                                onClick={(e) => handleDeleteSubmission(sub.id, e)}
                                className="text-slate-350 hover:text-red-600 p-1 rounded-md ml-2 transition-all"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Detail view of checklist */}
              <div className="lg:col-span-2">
                {selectedSubmission ? (
                  <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800/80">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                            Rincian Pemantauan: {selectedSubmission.site}
                          </h3>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1 font-mono">
                          ID: {selectedSubmission.id} • Dibuat oleh: {selectedSubmission.userCreator} ({selectedSubmission.roleCreator})
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => handlePrepareWAPreview(selectedSubmission)}
                          className="flex items-center gap-1.5 px-3.5 py-2 bg-green-50 hover:bg-green-100 dark:bg-green-950/20 dark:hover:bg-green-950/40 text-green-700 dark:text-green-400 rounded-xl border border-green-200 dark:border-green-800/60 text-xs font-bold transition-all cursor-pointer"
                        >
                          <MessageSquare className="w-4 h-4 text-green-600 dark:text-green-400" />
                          Resume WA
                        </button>
                        <button
                          onClick={() => handleExportIndividualPDF(selectedSubmission)}
                          className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-250 dark:bg-slate-950 dark:hover:bg-slate-850 hover:text-slate-900 dark:hover:text-slate-200 text-slate-700 dark:text-slate-350 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold transition-all"
                        >
                          <Printer className="w-4 h-4 text-rose-600" />
                          Cetak PDF F4
                        </button>
                      </div>
                    </div>

                    {/* Stats summary of chosen */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-100 dark:border-slate-850">
                        <span className="block text-[10px] text-slate-400 uppercase font-bold">TOTAL ITEM</span>
                        <span className="text-lg font-black text-slate-800 dark:text-slate-200">{selectedSubmission.items.length} Component</span>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-100 dark:border-slate-850">
                        <span className="block text-[10px] text-slate-400 uppercase font-bold">OK STATUS LOG</span>
                        <span className="text-lg font-black text-emerald-600">{selectedSubmission.items.filter(it => it.status === "OK").length}</span>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-100 dark:border-slate-850">
                        <span className="block text-[10px] text-slate-400 uppercase font-bold">NOT OK STATUS LOG</span>
                        <span className={`text-lg font-black ${selectedSubmission.items.some(it => it.status === "NOT OK") ? "text-red-600 animate-pulse" : "text-slate-500"}`}>
                          {selectedSubmission.items.filter(it => it.status === "NOT OK").length}
                        </span>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-100 dark:border-slate-850">
                        <span className="block text-[10px] text-slate-400 uppercase font-bold">BELUM DIISI</span>
                        <span className="text-lg font-black text-slate-555">
                          {selectedSubmission.items.filter(it => !it.status).length}
                        </span>
                      </div>
                    </div>

                    {/* Items table list */}
                    <div className="space-y-4">
                      <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest">
                        Rincian Ulasan per Bidang Infrastruktur
                      </h4>

                      <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
                        {Object.entries(groupItemsByCategory(selectedSubmission.items)).map(([category, items]) => (
                          <div key={category} className="border border-slate-150 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
                            <div className="bg-slate-100/80 dark:bg-slate-950 px-3 py-2 border-b border-slate-155 dark:border-slate-800 text-xs font-black text-slate-700 dark:text-slate-300">
                              📂 {category}
                            </div>
                            
                            <table className="w-full text-xs">
                              <thead>
                                <tr className="bg-slate-50 dark:bg-slate-950 text-slate-450 uppercase text-[9px] border-b border-slate-150 dark:border-slate-850">
                                  <th className="px-3 py-2 text-left w-1/2">Komponen Sistem</th>
                                  <th className="px-3 py-2 text-center w-24">Kondisi</th>
                                  <th className="px-3 py-2 text-left">Temuan & Catatan Tindak Lanjut</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-150 dark:divide-slate-850">
                                {items.map((it: any) => (
                                  <tr key={it.id} className="hover:bg-slate-100/10 transition-colors">
                                    <td className="px-3 py-2.5 font-medium text-slate-800 dark:text-slate-200">
                                      {it.name}
                                    </td>
                                    <td className="px-3 py-2.5 text-center">
                                      {it.status ? (
                                        <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${it.status === "OK" ? "bg-emerald-100/50 text-emerald-700 dark:bg-emerald-950/20" : "bg-red-100/50 text-red-700 dark:bg-red-955/20 animate-pulse"}`}>
                                          {it.status === "OK" ? it.okLabel : it.notOkLabel}
                                        </span>
                                      ) : (
                                        <span className="text-slate-400 italic text-[10px]">Belum Diisi</span>
                                      )}
                                    </td>
                                    <td className="px-3 py-2.5">
                                      {/* Inline update field - allows quick corrections */}
                                      <input
                                        type="text"
                                        defaultValue={it.keterangan || ""}
                                        onBlur={(e) => {
                                          if (e.target.value !== (it.keterangan || "")) {
                                            handleUpdateSubmissionItem(selectedSubmission.id, it.id, it.status, e.target.value);
                                          }
                                        }}
                                        placeholder="Tambahkan catatan temuan..."
                                        className="bg-transparent hover:bg-slate-50 dark:hover:bg-slate-950 focus:bg-white dark:focus:bg-slate-950 text-[11px] p-1 rounded-md w-full border border-transparent focus:border-slate-300 dark:focus:border-slate-700"
                                      />
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Image proof showcase */}
                    {selectedSubmission.photoUrl && (
                      <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-4 bg-slate-50/50 dark:bg-slate-950/20 space-y-2">
                        <div className="flex items-center gap-2">
                          <ImageIcon className="w-4 h-4 text-blue-500" />
                          <h4 className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                            LAMPIRAN BUKTI DOKUMENTASI (SCREENSHOT / FOTO)
                          </h4>
                        </div>
                        <div className="max-w-md overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-black">
                          <img 
                            src={selectedSubmission.photoUrl} 
                            alt="Screenshot Bukti" 
                            referrerPolicy="no-referrer"
                            className="w-full h-auto max-h-72 object-contain hover:scale-105 transition-all cursor-zoom-in"
                            onClick={() => window.open(selectedSubmission.photoUrl, "_blank")}
                          />
                        </div>
                        <p className="text-[10px] text-slate-450 italic">
                          File: {selectedSubmission.photoName || "bukti_cek.jpg"} (Klik gambar untuk membuka di tab baru)
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 border-dashed dark:border-slate-800 rounded-2xl py-24 text-center text-slate-400 space-y-3">
                    <ClipboardCheck className="w-12 h-12 text-slate-300 mx-auto" />
                    <div>
                      <h3 className="text-xs font-black uppercase text-slate-800 dark:text-slate-200">Arsip Lembar Hasil Cek</h3>
                      <p className="text-xs mt-1.5 max-w-sm mx-auto text-slate-500">
                        Silakan pilih salah satu data di sebelah kiri untuk melihat rincian pemantauan, status kelayakan modem / bridging, atau mengekspor hasil ke format cetak F4.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* TAB 3: CUSTOM ITEM SETTINGS (SYSTEM SETTING) */}
        {activeTab === "settings" && (
          <motion.div
            key="settings-checklist-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
            {/* Master Add form: Left side */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
                <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Definisikan Komponen Baru
                  </h3>
                  <p className="text-[11px] text-slate-450 mt-1">
                    Tambahkan item sistem, jalur VPN, bridging BPJS, atau display antrian loket yang wajib masuk ke format checklist harian.
                  </p>
                </div>

                {!isAllowedToConfigure ? (
                  <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/20 p-3.5 rounded-xl text-xs text-amber-800 dark:text-amber-400">
                    Akun Anda tidak berwenang merubah data setting master. Hanya Administrator, Site Coordinator, Developer dan System Support yang diizinkan mengedit.
                  </div>
                ) : (
                  <form onSubmit={handleAddNewSettingItem} className="space-y-4">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                        KATEGORI INFRASTRUKTUR / BIDANG SISTEM
                      </label>
                      <select
                        value={newItemCategory}
                        onChange={(e) => setNewItemCategory(e.target.value)}
                        className="w-full text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-bold focus:outline-none focus:ring-1 focus:ring-purple-500"
                      >
                        {categoriesList.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                        NAMA ALAT / JALUR SISTEM / INTERFACES
                      </label>
                      <input
                        type="text"
                        required
                        value={newItemName}
                        onChange={(e) => setNewItemName(e.target.value)}
                        placeholder="Contoh: Display Antrian Loket TV 42"
                        className="w-full text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-medium focus:outline-none focus:ring-1 focus:ring-purple-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                          LABEL STATUS OK
                        </label>
                        <input
                          type="text"
                          value={newItemOkLabel}
                          onChange={(e) => setNewItemOkLabel(e.target.value)}
                          placeholder="Contoh: ON / Reply"
                          className="w-full text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-semibold text-green-700"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                          LABEL STATUS NOT OK
                        </label>
                        <input
                          type="text"
                          value={newItemNotOkLabel}
                          onChange={(e) => setNewItemNotOkLabel(e.target.value)}
                          placeholder="Contoh: OFF / RTO"
                          className="w-full text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-semibold text-red-700"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-xs py-3 rounded-xl shadow-lg shadow-purple-600/10 hover:brightness-105 active:scale-95 transition-all text-center"
                    >
                      Daftarkan Ke Master Checklist
                    </button>
                  </form>
                )}
              </div>
            </div>

            {/* Config list table: Right & middle */}
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-100 dark:border-slate-800/85">
                  <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider">
                    Daftar Master Item Terdaftar ({filteredSettingItems.length} Item)
                  </h3>

                  {/* Settings Local Search */}
                  <div className="relative w-full sm:w-64">
                    <input
                      type="text"
                      value={settingsSearch}
                      onChange={(e) => setSettingsSearch(e.target.value)}
                      placeholder="Cari item master..."
                      className="w-full text-xs pl-8 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none"
                    />
                    <Search className="absolute left-2.5 top-2.5 text-slate-400 w-3.5 h-3.5" />
                  </div>
                </div>

                <div className="max-h-[600px] overflow-y-auto pr-1">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-950 text-slate-450 uppercase text-[9px] border-b border-slate-250 dark:border-slate-850">
                        <th className="px-3 py-2 text-left">Kategori Bidang</th>
                        <th className="px-3 py-2 text-left">Nama Komponen Master</th>
                        <th className="px-3 py-2 text-center w-28">Label Kondisi</th>
                        <th className="px-3 py-2 text-center w-20">Aktif</th>
                        <th className="px-3 py-2 text-center w-24">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-150 dark:divide-slate-850">
                      {filteredSettingItems.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="text-center py-12 text-slate-400">
                            Tidak ada item master yang sesuai saringan / pencarian.
                          </td>
                        </tr>
                      ) : (
                        filteredSettingItems.map(item => {
                          const isEditingIdx = isEditingItem === item.id;

                          return (
                            <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/10 transition-colors">
                              {isEditingIdx ? (
                                // Editing Form values
                                <td colSpan={5} className="p-3 bg-purple-50/10">
                                  <div className="space-y-3 font-semibold text-xs text-slate-700">
                                    <div className="grid grid-cols-2 gap-3">
                                      <div>
                                        <label className="block text-[9px] text-slate-400 uppercase">KATEGORI</label>
                                        <select
                                          id={`edit-cat-${item.id}`}
                                          defaultValue={item.category}
                                          className="w-full p-2 border rounded-lg bg-slate-50 dark:bg-slate-950 dark:border-slate-800"
                                        >
                                          {categoriesList.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                      </div>
                                      <div>
                                        <label className="block text-[9px] text-slate-400 uppercase">NAMA KOMPONEN</label>
                                        <input
                                          id={`edit-name-${item.id}`}
                                          type="text"
                                          defaultValue={item.name}
                                          className="w-full p-2 border rounded-lg bg-slate-50 dark:bg-slate-950 dark:border-slate-800"
                                        />
                                      </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                      <div>
                                        <label className="block text-[9px] text-slate-400 uppercase">LABEL OK</label>
                                        <input
                                          id={`edit-ok-${item.id}`}
                                          type="text"
                                          defaultValue={item.okLabel}
                                          className="w-full p-2 border rounded-lg bg-slate-50 dark:bg-slate-950 dark:border-slate-800"
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-[9px] text-slate-400 uppercase">LABEL NOT OK</label>
                                        <input
                                          id={`edit-notok-${item.id}`}
                                          type="text"
                                          defaultValue={item.notOkLabel}
                                          className="w-full p-2 border rounded-lg bg-slate-50 dark:bg-slate-950 dark:border-slate-800"
                                        />
                                      </div>
                                    </div>

                                    <div className="flex gap-2 justify-end pt-1">
                                      <button
                                        type="button"
                                        onClick={() => setIsEditingItem(null)}
                                        className="px-3 py-1 bg-slate-100 dark:bg-slate-900 rounded-md font-bold text-[11px]"
                                      >
                                        Batal
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const cat = (document.getElementById(`edit-cat-${item.id}`) as HTMLSelectElement).value;
                                          const name = (document.getElementById(`edit-name-${item.id}`) as HTMLInputElement).value;
                                          const ok = (document.getElementById(`edit-ok-${item.id}`) as HTMLInputElement).value;
                                          const notok = (document.getElementById(`edit-notok-${item.id}`) as HTMLInputElement).value;
                                          handleSaveSettingItemEdit(item.id, name, cat, ok, notok);
                                        }}
                                        className="px-3 py-1 bg-purple-600 text-white rounded-md font-bold text-[11px]"
                                      >
                                        Simpan
                                      </button>
                                    </div>
                                  </div>
                                </td>
                              ) : (
                                <>
                                  <td className="px-3 py-2.5 font-bold text-slate-500">
                                    {item.category}
                                  </td>
                                  <td className="px-3 py-2.5 font-semibold text-slate-750 dark:text-slate-200">
                                    {item.name}
                                  </td>
                                  <td className="px-3 py-2.5 text-center">
                                    <div className="flex items-center justify-center gap-1.5 font-mono">
                                      <span className="text-[10px] text-green-700 bg-green-50/80 dark:bg-green-950/20 px-1.5 py-0.5 rounded-md">{item.okLabel || "OK"}</span>
                                      <span className="text-slate-300">/</span>
                                      <span className="text-[10px] text-red-700 bg-red-50/80 dark:bg-red-950/20 px-1.5 py-0.5 rounded-md">{item.notOkLabel || "NOT OK"}</span>
                                    </div>
                                  </td>
                                  <td className="px-3 py-2.5 text-center">
                                    <button
                                      type="button"
                                      disabled={!isAllowedToConfigure}
                                      onClick={() => handleToggleSettingActive(item)}
                                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${item.active !== false ? "bg-green-150/40 text-green-700 dark:bg-green-950" : "bg-slate-200 text-slate-500"}`}
                                    >
                                      {item.active !== false ? "Aktif" : "Non-aktif"}
                                    </button>
                                  </td>
                                  <td className="px-3 py-2.5 text-center">
                                    {isAllowedToConfigure && (
                                      <div className="flex items-center justify-center gap-1">
                                        <button
                                          onClick={() => setIsEditingItem(item.id)}
                                          className="text-slate-400 hover:text-purple-600 p-1 rounded-md transition-all"
                                          title="Edit Item"
                                        >
                                          <Edit2 className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                          onClick={() => handleDeleteSettingItem(item.id)}
                                          className="text-slate-400 hover:text-red-650 p-1 rounded-md transition-all"
                                          title="Hapus Item"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    )}
                                  </td>
                                </>
                              )}
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </motion.div>
        )}

      </AnimatePresence>

      {/* WhatsApp Resume Share Modal */}
      {showWAPreview && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-lg w-full overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-[#f8fafc] dark:bg-slate-950/20 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-[#25d366]/10 text-[#25d366] rounded-xl font-bold">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider">
                    Resume Checklist WhatsApp
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Siap disalin dan dibagikan ke grup WhatsApp koordinasi Anda
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowWAPreview(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-850 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Text Preview Area */}
            <div className="p-5 space-y-4 flex-1 overflow-y-auto max-h-[450px]">
              <p className="text-xs font-bold text-slate-600 dark:text-slate-350">
                Pratinjau Teks WhatsApp:
              </p>
              <div className="relative">
                <textarea
                  readOnly
                  value={waPreviewText}
                  className="w-full h-80 text-xs font-mono p-4 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-150 rounded-xl border border-slate-200 dark:border-slate-800 focus:outline-none whitespace-pre-wrap resize-none"
                />
                <div className="absolute right-3 bottom-3 flex gap-2">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(waPreviewText);
                      alert("Berhasil disalin ke clipboard!");
                    }}
                    className="p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 hover:text-blue-600 rounded-lg shadow-sm transition-all active:scale-95 text-slate-500 cursor-pointer"
                    title="Salin ke Clipboard"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-[#f8fafc] dark:bg-slate-950/20 flex gap-3">
              <button
                type="button"
                onClick={() => setShowWAPreview(false)}
                className="flex-1 px-4 py-2.5 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-350 border border-slate-200 dark:border-slate-800 font-bold rounded-xl text-xs hover:bg-slate-100 dark:hover:bg-slate-850 transition-all text-center cursor-pointer"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(waPreviewText);
                  window.open("https://web.whatsapp.com/", "_blank");
                }}
                className="flex-1 px-4 py-2.5 bg-[#25d366] hover:bg-[#20ba56] text-white font-bold rounded-xl text-xs shadow-md shadow-[#25d366]/10 flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
              >
                <Copy className="w-4 h-4" />
                Salin & Buka WA Web
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
