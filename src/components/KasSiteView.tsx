import React, { useState, useEffect } from "react";
import { 
  Wallet, 
  Banknote, 
  Calendar, 
  Receipt, 
  FileText, 
  Plus, 
  ArrowUpRight, 
  ArrowDownLeft, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Eye, 
  Trash2, 
  Printer, 
  Search, 
  Upload, 
  Info, 
  Filter, 
  Check, 
  Building2, 
  ChevronRight,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  RefreshCw,
  Sliders,
  Download,
  HelpCircle,
  Send,
  EyeOff,
  Lock,
  Unlock
} from "lucide-react";
import { KasSiteTransaction, KasSiteReplenishment, Project, User, KasLock, KasUnlockRequest, Client } from "../types";
import { api } from "../lib/api";
import { motion, AnimatePresence } from "motion/react";

interface KasSiteViewProps {
  kasTransactions: KasSiteTransaction[];
  kasReplenishments: KasSiteReplenishment[];
  projects: Project[];
  clients?: Client[];
  currentUser: User | null;
  users: User[];
  onAddTransaction: (data: Partial<KasSiteTransaction>) => Promise<any>;
  onUpdateTransaction: (id: string, data: Partial<KasSiteTransaction>) => Promise<any>;
  onDeleteTransaction: (id: string) => Promise<any>;
  onAddReplenishment: (data: Partial<KasSiteReplenishment>) => Promise<any>;
  onUpdateReplenishment: (id: string, data: Partial<KasSiteReplenishment>) => Promise<any>;
  onDeleteReplenishment: (id: string) => Promise<any>;
}

// Indonesian "Terbilang" helper to convert number to words
function konversiTerbilang(nilai: number): string {
  const bilangan = [
    "", "Satu", "Dua", "Tiga", "Empat", "Lima", 
    "Enam", "Tujuh", "Delapan", "Sembilan", "Sepuluh", "Sebelas"
  ];
  
  const hitung = (n: number): string => {
    if (n < 12) {
      return bilangan[n];
    } else if (n < 20) {
      return bilangan[n - 10] + " Belas";
    } else if (n < 100) {
      const utama = Math.floor(n / 10);
      const sisa = n % 10;
      return bilangan[utama] + " Puluh " + bilangan[sisa];
    } else if (n < 200) {
      return "Seratus " + hitung(n - 100);
    } else if (n < 1000) {
      const utama = Math.floor(n / 100);
      const sisa = n % 100;
      return bilangan[utama] + " Ratus " + hitung(sisa);
    } else if (n < 2000) {
      return "Seribu " + hitung(n - 1000);
    } else if (n < 1000000) {
      const utama = Math.floor(n / 1000);
      const sisa = n % 1000;
      return hitung(utama) + " Ribu " + hitung(sisa);
    } else if (n < 1000000000) {
      const utama = Math.floor(n / 1000000);
      const sisa = n % 1000000;
      return hitung(utama) + " Juta " + hitung(sisa);
    } else if (n < 1000000000000) {
      const utama = Math.floor(n / 1000000000);
      const sisa = n % 1000000000;
      return hitung(utama) + " Milyar " + hitung(sisa);
    }
    return "";
  };

  if (nilai === 0) return "Nol Rupiah";
  const hasil = hitung(Math.floor(nilai)).trim() + " Rupiah";
  return hasil.replace(/\s+/g, " ");
}

export default function KasSiteView({
  kasTransactions = [],
  kasReplenishments = [],
  projects = [],
  clients = [],
  currentUser,
  users = [],
  onAddTransaction,
  onUpdateTransaction,
  onDeleteTransaction,
  onAddReplenishment,
  onUpdateReplenishment,
  onDeleteReplenishment
}: KasSiteViewProps) {
  
  const [activeTab, setActiveTab] = useState<"mutasi" | "replenish" | "rekap-bulanan">("mutasi");
  
  // User scoping verification (Administrator, Direktur, and Manager Keuangan are unrestricted)
  const isUserScoped = currentUser && 
    currentUser.siteTugas && 
    currentUser.siteTugas.toLowerCase().trim() !== "kantor pusat" &&
    currentUser.role !== "Administrator" && 
    currentUser.role !== "Direktur" &&
    currentUser.role !== "Manager Keuangan";

  const userSite = currentUser?.siteTugas || "";
  const isHQFinance = currentUser?.role === "Manager Keuangan" || currentUser?.role === "Administrator" || currentUser?.role === "Direktur";

  // Helper to filter items matching user scope
  const matchesUserSite = (tProject: string) => {
    if (!isUserScoped) return true;
    if (!tProject) return false;
    // Direct match (if project field holds site string)
    if (tProject.toLowerCase() === userSite.toLowerCase()) return true;
    // Cross-match through project definition client
    const proj = projects.find(p => p.kode === tProject);
    return proj ? proj.client.toLowerCase() === userSite.toLowerCase() : false;
  };

  // Helper to check if a transaction belongs to a selected site name
  const matchesSelectedSite = (tProject: string, siteName: string) => {
    if (siteName === "Semua") return true;
    if (!tProject) return false;
    if (tProject.toLowerCase() === siteName.toLowerCase()) return true;
    const proj = projects.find(p => p.kode === tProject);
    return proj ? proj.client.toLowerCase() === siteName.toLowerCase() : false;
  };

  const filteredProjects = isUserScoped
    ? projects.filter(p => p.client === userSite)
    : projects;

  // Search & Filters on Mutation Ledger Tab
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"Semua" | "Masuk" | "Keluar">("Semua");
  const [filterStatus, setFilterStatus] = useState<"Semua" | "Draft" | "Pending" | "Approved" | "Rejected">("Semua");
  const [filterProject, setFilterProject] = useState("Semua");
  const [filterCategory, setFilterCategory] = useState("Semua");
  const [filterMonth, setFilterMonth] = useState("");

  // Modal forms states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"add" | "edit">("add");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Form Fields State
  const [formProject, setFormProject] = useState("");
  const [formType, setFormType] = useState<"Masuk" | "Keluar">("Keluar");
  const [formDate, setFormDate] = useState(new Date().toISOString().split("T")[0]);
  const [formAmountText, setFormAmountText] = useState(""); // Raw or formatted string input to prevent save freezes
  const [formDescription, setFormDescription] = useState("");
  const [formCategory, setFormCategory] = useState("ATK & Logistik");
  const [formReceiptNo, setFormReceiptNo] = useState("");
  const [formReceiptUrl, setFormReceiptUrl] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);

  // Focus detail modal
  const [focusTrans, setFocusTrans] = useState<KasSiteTransaction | null>(null);
  const [isPrintReceiptOpen, setIsPrintReceiptOpen] = useState(false);

  // Replenishment generator form state
  const [replenishMode, setReplenishMode] = useState<"direct" | "reimbursement">("direct");
  const [directAmount, setDirectAmount] = useState<number>(1000000);
  const [replenProject, setReplenProject] = useState("");
  const [repStartDate, setRepStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 90); // Default to last 90 days so recent draft outlays are shown automatically
    return d.toISOString().split("T")[0];
  });
  const [repEndDate, setRepEndDate] = useState(new Date().toISOString().split("T")[0]);
  const [repNotes, setRepNotes] = useState("");
  const [isReplenFormOpen, setIsReplenFormOpen] = useState(false);
  const [focusReplen, setFocusReplen] = useState<KasSiteReplenishment | null>(null);
  const [selectedTxIds, setSelectedTxIds] = useState<string[]>([]);

  // Monthly Report picker state
  const [reportMonth, setReportMonth] = useState(() => {
    return new Date().toISOString().substring(0, 7); // Format: YYYY-MM
  });
  const [reportSiteScope, setReportSiteScope] = useState(() => {
    return isUserScoped ? userSite : "Semua";
  });

  // Loading state
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Month Locks & Unlock Requests local states
  const [locks, setLocks] = useState<KasLock[]>([]);
  const [unlockRequests, setUnlockRequests] = useState<KasUnlockRequest[]>([]);
  const [isFetchingLocks, setIsFetchingLocks] = useState(false);

  // Custom Approval with Transfer Proof state
  const [replenToApprove, setReplenToApprove] = useState<KasSiteReplenishment | null>(null);
  const [approveTransferFileUrl, setApproveTransferFileUrl] = useState("");
  const [isApprovingModalOpen, setIsApprovingModalOpen] = useState(false);

  // Lock status request states
  const [selectedLockedMonth, setSelectedLockedMonth] = useState("");
  const [selectedLockedSite, setSelectedLockedSite] = useState("");
  const [isUnlockRequestFormOpen, setIsUnlockRequestFormOpen] = useState(false);
  const [unlockReason, setUnlockReason] = useState("");

  const fetchLocksAndRequests = async () => {
    try {
      setIsFetchingLocks(true);
      const l = await api.getKasLocks();
      const r = await api.getKasUnlockRequests();
      setLocks(l || []);
      setUnlockRequests(r || []);
    } catch (err) {
      console.error("Gagal mengambil data kunci & pengajuan", err);
    } finally {
      setIsFetchingLocks(false);
    }
  };

  useEffect(() => {
    fetchLocksAndRequests();
  }, [activeTab]);

  const isMonthLocked = (monthStr: string, siteStr: string) => {
    if (!monthStr || !siteStr) return false;
    return locks.some(
      (l) =>
        l.month === monthStr &&
        (l.site === "Semua" || l.site.toLowerCase() === siteStr.toLowerCase()) &&
        l.isLocked
    );
  };

  // Available categories for site operational outlays
  const expenseCategories = [
    "ATK & Logistik",
    "Transportasi & Perjalanan",
    "Konsumsi & Makan",
    "Internet & Komunikasi",
    "Perbaikan & Pemeliharaan",
    "Alat Pelindung Diri / Safety",
    "Lain-lain"
  ];

  // Formatting Indonesian Rupiah
  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  // Helper to parse input amount cleanly
  const getCleanAmount = (text: string) => {
    const stripped = text.replace(/[^0-9]/g, "");
    return Number(stripped) || 0;
  };

  // Helper to format numeric input to Indonesian standard with dots separators
  const formatInputRupiah = (text: string) => {
    const stripped = text.replace(/[^0-9]/g, "");
    if (!stripped) return "";
    return Number(stripped).toLocaleString("id-ID");
  };

  // Pre-fill receipt numbers beautifully with sequential zero-padded number, patent code, Roman numeral month, and year of transaction
  const triggerAutoReceiptNo = (type: "Masuk" | "Keluar", tgl: string) => {
    try {
      const dateParts = tgl.split("-");
      const year = dateParts[0] || "2026";
      const monthNum = parseInt(dateParts[1], 10) || 6;
      
      const romanMonths = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];
      const roman = romanMonths[Math.max(0, Math.min(11, monthNum - 1))];
      
      // Count existing transactions of the same type in current database to calculate counting sequence
      const sameTypeCount = kasTransactions.filter(t => t.type === type).length + 1;
      const countStr = String(sameTypeCount).padStart(3, "0");
      
      const patentCode = type === "Masuk" ? "KAS-IN-RSP3" : "KAS-OUT-RSP3";
      setFormReceiptNo(`${countStr}/${patentCode}/${roman}/${year}`);
    } catch (e) {
      setFormReceiptNo(`001/${type === "Masuk" ? "KAS-IN-RSP3" : "KAS-OUT-RSP3"}/VI/2026`);
    }
  };

  // File Upload Handlers (converts image copy to base64 beautifully for quick offline-save)
  const handleUploadedFile = (file: File) => {
    if (file.size > 2 * 1024 * 1024) {
      alert("Ukuran file scan terlalu besar! Maksimal 2MB agar loading tetap cepat.");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormReceiptUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Filter transactions displaying in current scoped view
  const transactionsToDisplay = kasTransactions.filter(t => {
    if (!matchesUserSite(t.project)) return false;
    if (!matchesSelectedSite(t.project, filterProject)) return false;
    if (filterType !== "Semua" && t.type !== filterType) return false;
    if (filterStatus !== "Semua" && t.status !== filterStatus) return false;
    if (filterCategory !== "Semua" && t.category !== filterCategory) return false;
    if (filterMonth && t.date.substring(0, 7) !== filterMonth) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        t.description?.toLowerCase().includes(term) ||
        t.receiptNo?.toLowerCase().includes(term) ||
        t.category?.toLowerCase().includes(term) ||
        t.project?.toLowerCase().includes(term)
      );
    }
    return true;
  });

  // Calculate financial statistics in real-time based on active scope and selected site
  const activeScopedTransactions = kasTransactions.filter(t => {
    if (!matchesUserSite(t.project)) return false;
    if (!matchesSelectedSite(t.project, filterProject)) return false;
    return true;
  });
  const totalInflow = activeScopedTransactions
    .filter(t => t.type === "Masuk")
    .reduce((sum, item) => sum + Number(item.amount), 0);

  const totalOutflow = activeScopedTransactions
    .filter(t => t.type === "Keluar")
    .reduce((sum, item) => sum + Number(item.amount), 0);

  const currentBalance = totalInflow - totalOutflow;

  // Open Modal Helpers
  const openAddModal = () => {
    setFormMode("add");
    
    // Auto-select based on User Profile Site (currentUser.siteTugas)
    let initialProject = "";
    if (currentUser?.siteTugas && currentUser.siteTugas.toLowerCase().trim() !== "kantor pusat") {
      const match = projects.find(p => 
        p.client?.toLowerCase().trim() === currentUser.siteTugas?.toLowerCase().trim() ||
        p.kode?.toLowerCase().trim() === currentUser.siteTugas?.toLowerCase().trim()
      );
      initialProject = match ? match.kode : currentUser.siteTugas;
    } else {
      initialProject = filteredProjects[0]?.kode || "";
    }

    setFormProject(initialProject);
    setFormType("Keluar");
    const today = new Date().toISOString().split("T")[0];
    setFormDate(today);
    setFormAmountText("");
    setFormDescription("");
    setFormCategory("ATK & Logistik");
    setFormReceiptUrl("");
    triggerAutoReceiptNo("Keluar", today);
    setIsFormOpen(true);
  };

  const openEditModal = (t: KasSiteTransaction) => {
    const targetMonth = t.date.substring(0, 7);
    if (isMonthLocked(targetMonth, t.project) && !isHQFinance) {
      alert(`Gagal: Catatan ini berada pada siklus bulan ${targetMonth} yang telah dikunci oleh Kantor Pusat!`);
      setSelectedLockedMonth(targetMonth);
      setSelectedLockedSite(t.project);
      setUnlockReason("");
      setIsUnlockRequestFormOpen(true);
      return;
    }

    setFormMode("edit");
    setSelectedId(t.id);
    setFormProject(t.project);
    setFormType(t.type);
    setFormDate(t.date);
    // Prefill as beautiful standard separated Rupiah string
    setFormAmountText(formatInputRupiah(t.amount.toString()));
    setFormDescription(t.description);
    setFormCategory(t.category || "ATK & Logistik");
    setFormReceiptNo(t.receiptNo);
    setFormReceiptUrl(t.receiptUrl || "");
    setIsFormOpen(true);
  };

  // Submit Handler for Kas Transactions - Guarantees error resilient storage!
  const handleSaveTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanAmount = getCleanAmount(formAmountText);
    
    if (!formProject) {
      alert("Pilih site terlebih dahulu!");
      return;
    }
    if (cleanAmount <= 0) {
      alert("Masukkan nominal transaksi yang valid (lebih dari Rp 0)!");
      return;
    }
    if (!formDescription.trim()) {
      alert("Gagal menyimpan: Keterangan / Deskripsi penggunaan uang tidak boleh kosong!");
      return;
    }
    if (!formReceiptNo.trim()) {
      alert("Gagal menyimpan: Nomor kwitansi harus diisi!");
      return;
    }

    // 1. HQ Inflow Validation (Only HQ Finance, transfer proof is optional/recommended but not mandatory)
    if (formType === "Masuk") {
      if (!isHQFinance) {
        alert("Gagal: Hanya Manager Keuangan di Kantor Pusat yang diizinkan untuk menginput Transaksi Dana Masuk!");
        return;
      }
    }

    // 2. Month-Lock Interdiction (Redirect to Unlock request flow)
    const targetMonth = formDate.substring(0, 7);
    if (isMonthLocked(targetMonth, formProject) && !isHQFinance) {
      setIsFormOpen(false);
      setSelectedLockedMonth(targetMonth);
      setSelectedLockedSite(formProject);
      setUnlockReason("");
      setIsUnlockRequestFormOpen(true);
      return;
    }

    try {
      setIsSubmitting(true);
      const payload: Partial<KasSiteTransaction> = {
        project: formProject,
        type: formType,
        date: formDate,
        amount: cleanAmount,
        description: formDescription,
        category: formType === "Keluar" ? formCategory : undefined,
        receiptNo: formReceiptNo.trim(),
        receiptUrl: formReceiptUrl,
        submittedMonth: formDate.substring(0, 7),
        createdBy: currentUser?.name || currentUser?.username || "Petugas Site"
      };

      if (formMode === "add") {
        payload.status = formType === "Masuk" ? "Approved" : "Draft"; // Initiated locally at site level, but automatic success for HQ inflows
        await onAddTransaction(payload);
      } else if (formMode === "edit" && selectedId) {
        await onUpdateTransaction(selectedId, payload);
      }

      setIsFormOpen(false);
      alert("Transaksi mutasi kas berhasil disimpan!");
    } catch (err: any) {
      alert("Gagal menyimpan transaksi: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete transaction with safety check
  const handleDeleteItem = async (id: string, isDraft: boolean) => {
    const tx = kasTransactions.find(t => t.id === id);
    if (tx) {
      const targetMonth = tx.date.substring(0, 7);
      if (isMonthLocked(targetMonth, tx.project) && !isHQFinance) {
        alert(`Gagal: Pengeluaran ini berada pada siklus bulan ${targetMonth} yang telah dikunci oleh Kantor Pusat!`);
        setSelectedLockedMonth(targetMonth);
        setSelectedLockedSite(tx.project);
        setUnlockReason("");
        setIsUnlockRequestFormOpen(true);
        return;
      }
    }

    if (!isDraft && !isHQFinance) {
      alert("Hanya transaksi bertipe 'Draft' yang dapat dihapus secara mandiri oleh site!");
      return;
    }
    if (window.confirm("Apakah Anda yakin ingin menghapus catatan mutasi kas ini? Tindakan ini bersifat permanen.")) {
      try {
        await onDeleteTransaction(id);
        alert("Catatan mutasi kas berhasil dihapus!");
      } catch (err: any) {
        alert("Gagal menghapus: " + err.message);
      }
    }
  };

  // Helper to grab unclaimed outlays inside selected period
  const getUnclaimedOutlaysInPeriod = (customStart?: string, customEnd?: string) => {
    const start = customStart || repStartDate;
    const end = customEnd || repEndDate;
    return kasTransactions.filter(t => {
      if (t.type !== "Keluar") return false;
      if (!matchesUserSite(t.project)) return false;
      if (t.date < start || t.date > end) return false;
      // Must be Unclaimed (Draft status or Rejected status that is being corrected)
      return (t.status === "Draft" || t.status === "Rejected") && !t.replenishmentId;
    });
  };

  // Open form with initialized selection match
  const handleOpenReplenForm = () => {
    setIsReplenFormOpen(true);
    setReplenishMode("direct");
    setDirectAmount(1000000);
    if (scopedUniqueSiteNames.length > 0) {
      setReplenProject(isUserScoped ? userSite : scopedUniqueSiteNames[0]);
    } else {
      setReplenProject(isUserScoped ? userSite : "Site Lapangan");
    }
    const initialOutlays = getUnclaimedOutlaysInPeriod();
    setSelectedTxIds(initialOutlays.map(t => t.id));
  };

  // Update period and recalculate default checklists
  const handleUpdatePeriod = (start: string, end: string) => {
    setRepStartDate(start);
    setRepEndDate(end);
    const matchedOutlays = getUnclaimedOutlaysInPeriod(start, end);
    setSelectedTxIds(matchedOutlays.map(t => t.id));
  };

  // Submit a formal Replenish Request (Ketika uang akan habis)
  const handleCreateReplenRequest = async (e?: React.FormEvent | React.MouseEvent) => {
    if (e) e.preventDefault();
    
    let targetOutlays: typeof kasTransactions = [];
    let totalSpent = 0;
    let requestedAmt = 0;
    const finalProject = isUserScoped ? userSite : (replenProject || "Site Lapangan");

    if (replenishMode === "reimbursement") {
      // Process only items selected via checkbox
      targetOutlays = kasTransactions.filter(t => selectedTxIds.includes(t.id));
      if (targetOutlays.length === 0) {
        alert("Silakan pilih minimal 1 transaksi pengeluaran (Kredit) untuk diproses dalam pengajuan pengembalian dana.");
        return;
      }
      totalSpent = targetOutlays.reduce((sum, t) => sum + t.amount, 0);
      requestedAmt = totalSpent;
    } else {
      // Direct funding request
      if (!directAmount || directAmount <= 0) {
        alert("Silakan masukkan nominal pengajuan dana tambahan yang valid (lebih dari Rp 0)!");
        return;
      }
      requestedAmt = directAmount;
    }

    try {
      setIsSubmitting(true);
      const randId = Math.floor(1000 + Math.random() * 9000);
      const fileDate = new Date().toISOString().split("T")[0].replace(/-/g, "");
      const generatedReqNo = `REQ-REPL-${fileDate}-${randId}`;

      // Add replenishment object (associated transaction statuses are updated atomically by the server!)
      const newReplen = await onAddReplenishment({
        project: finalProject,
        reqNo: generatedReqNo,
        startDate: replenishMode === "reimbursement" ? repStartDate : new Date().toISOString().split("T")[0],
        endDate: replenishMode === "reimbursement" ? repEndDate : new Date().toISOString().split("T")[0],
        totalExpenses: totalSpent,
        requestedAmount: requestedAmt,
        date: new Date().toISOString().split("T")[0],
        notes: repNotes || (replenishMode === "reimbursement" ? "Reimbursement pengeluaran site" : "Pengajuan penambahan kas site"),
        status: "Pending",
        transactionIds: targetOutlays.map(t => t.id),
        createdBy: currentUser?.name || currentUser?.username || "Petugas Site"
      });

      if (!newReplen || !newReplen.id) {
        throw new Error("Gagal membuat data rekap pengembalian dana di server (ID kosong).");
      }

      setIsReplenFormOpen(false);
      setRepNotes("");
      if (replenishMode === "direct") {
        setDirectAmount(1000000);
      }
      setFocusReplen(newReplen);
      alert(`Pengajuan dana kembali (${generatedReqNo}) senilai ${formatRupiah(requestedAmt)} berhasil dikirimkan ke Kantor Pusat! Status pengeluaran tercakup berganti menjadi 'Pending' dan berkas rekapan siap dicetak.`);
    } catch (err: any) {
      alert("Gagal memproses pengajuan dana: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // HQ Finance / Admin reviews Replenishment Requests
  const handleReviewReplenishment = async (repl: KasSiteReplenishment, nextStatus: "Approved" | "Rejected") => {
    if (nextStatus === "Approved") {
      setReplenToApprove(repl);
      setApproveTransferFileUrl("");
      setIsApprovingModalOpen(true);
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Update replenishment status (the server will atomically update associated transactions and inject the KAS MASUK auto-dropping transaction on approval)
      await onUpdateReplenishment(repl.id, {
        status: nextStatus,
        approvedAt: new Date().toISOString(),
        approvedBy: currentUser?.name || currentUser?.username || "HQ Finance"
      });

      alert(`Pengajuan ditolak. Seluruh item pengeluaran dikembalikan ke status 'Rejected' di level draf lapangan.`);
      setFocusReplen(null);
    } catch (err: any) {
      alert("Gagal memproses peninjauan: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete a replenishment record
  const handleDeleteReplenIcon = async (repl: KasSiteReplenishment) => {
    if (repl.status !== "Pending" && !isHQFinance) {
      alert("Hanya pengajuan draf 'Pending' yang bisa dibatalkan/dihapus!");
      return;
    }
    try {
      setIsSubmitting(true);
      // The server will atomically release and unlock associated transactions back to Draft and clear the replenishmentId on delete!
      await onDeleteReplenishment(repl.id);
      alert("Pengajuan dana dibatalkan.");
      setFocusReplen(null);
    } catch (err: any) {
      alert("Gagal mematikan pengajuan: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // NATIVE PRINT HANDLER (Popup blocker proof via hidden iframe technique)
  const handlePrintHTML = (elementId: string) => {
    const printContent = document.getElementById(elementId);
    if (!printContent) return;

    // Check if an old print iframe already exists, and remove it
    const oldIframe = document.getElementById("print-iframe-element");
    if (oldIframe) {
      oldIframe.parentNode?.removeChild(oldIframe);
    }

    // Create a new hidden iframe
    const iframe = document.createElement("iframe");
    iframe.id = "print-iframe-element";
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "none";
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document || iframe.contentDocument;
    if (!doc) {
      alert("Gagal mematangkan media cetak.");
      return;
    }

    doc.write(`
      <html>
        <head>
          <title>SYNAPSIS PORTAL - CETAK KAS SITE</title>
          <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;750;800&display=swap');
            body {
              font-family: 'Inter', sans-serif !important;
              background-color: white !important;
              color: black !important;
              padding: 20px !important;
            }
            table { 
              border-collapse: collapse !important; 
              width: 100% !important; 
              margin-top: 12px !important;
              margin-bottom: 12px !important;
            }
            th { 
              background-color: #f3f4f6 !important; 
              color: #008080 !important;
              font-weight: 700 !important;
              border: 1px solid #1a202c !important; 
              padding: 8px 6px !important;
              font-size: 10px !important;
              text-transform: uppercase !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            td { 
              border: 1px solid #4a5568 !important; 
              padding: 6px 6px !important;
              font-size: 9px !important;
              color: #1a202c !important;
            }
            /* Keep background colors on print */
            .bg-gray-100 { background-color: #f3f4f6 !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            .bg-slate-50 { background-color: #f8fafc !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            .bg-emerald-50\\/50, .bg-emerald-50 { background-color: #ecfdf5 !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            .bg-rose-50\\/50, .bg-rose-50 { background-color: #fff1f2 !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            .bg-blue-50\\/50, .bg-blue-50 { background-color: #eff6ff !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            .border { border: 1px solid #4a5568 !important; }
            .border-2 { border: 2px solid #1a202c !important; }
            .border-b-2 { border-bottom: 2px solid #1a202c !important; }
            .text-emerald-800 { color: #065f46 !important; }
            .text-rose-800 { color: #991b1b !important; }
            .text-blue-800, .text-blue-900, .text-blue-950 { color: #1e3a8a !important; }
          </style>
        </head>
        <body class="bg-white text-black p-6 font-sans">
          ${printContent.innerHTML}
          <div class="mt-8 pt-6 border-t border-dashed border-gray-400 text-center text-[10px] text-gray-500">
            Dicetak otomatis dari Dashboard Keuangan SYNAPSIS SIMRS oleh ${currentUser?.name || "User"} pada ${new Date().toLocaleString("id-ID")}
          </div>
          <script>
            window.onload = function() {
              window.focus();
              setTimeout(function() {
                window.print();
              }, 300);
            }
          </script>
        </body>
      </html>
    `);
    doc.close();

    // Focus and fire
    setTimeout(() => {
      iframe.contentWindow?.focus();
    }, 150);
  };

  // MONTHLY RECAP CALCULATOR (sorted chronologically from start of month to end of month)
  const targetMonthTrans = kasTransactions.filter(t => {
    if (t.date.substring(0, 7) !== reportMonth) return false;
    if (reportSiteScope !== "Semua" && t.project.toLowerCase() !== reportSiteScope.toLowerCase()) {
      // check if mapped client matches report site scope
      const proj = projects.find(p => p.kode === t.project);
      if (!proj || proj.client.toLowerCase() !== reportSiteScope.toLowerCase()) return false;
    }
    return true;
  }).sort((a, b) => a.date.localeCompare(b.date));

  // Saldo Awal (cumulative transactions before this month start)
  const priorTransactions = kasTransactions.filter(t => {
    if (t.date.substring(0, 7) >= reportMonth) return false;
    if (reportSiteScope !== "Semua" && t.project.toLowerCase() !== reportSiteScope.toLowerCase()) {
      const proj = projects.find(p => p.kode === t.project);
      if (!proj || proj.client.toLowerCase() !== reportSiteScope.toLowerCase()) return false;
    }
    return true;
  });
  const openingInflow = priorTransactions.filter(t => t.type === "Masuk" && t.status === "Approved").reduce((sum, t) => sum + t.amount, 0);
  const openingOutflow = priorTransactions.filter(t => t.type === "Keluar" && t.status === "Approved").reduce((sum, t) => sum + t.amount, 0);
  const calculatedOpeningBalance = openingInflow - openingOutflow;

  const monthInflowTotal = targetMonthTrans.filter(t => t.type === "Masuk").reduce((sum, t) => sum + t.amount, 0);
  const monthOutflowTotal = targetMonthTrans.filter(t => t.type === "Keluar").reduce((sum, t) => sum + t.amount, 0);
  const calculatedEndingBalance = calculatedOpeningBalance + monthInflowTotal - monthOutflowTotal;

  // Site listed items matching scope - pulls exclusively from active user siteTugas assignments!
  const scopedUniqueSiteNames = Array.from(
    new Set(
      users
        .map(u => u.siteTugas?.trim())
        .filter(st => st && st.toLowerCase() !== "kantor pusat")
    )
  ).sort((a, b) => a!.localeCompare(b!));

  return (
    <div className="flex-grow flex flex-col bg-slate-50 dark:bg-slate-950 min-h-screen">
      
      {/* 1. TOP HEADER APP BANNER */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-205 dark:border-slate-850 p-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-2 shrink-0 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg">
                <Wallet className="w-6 h-6" />
              </span>
              <div>
                <h1 className="text-xl font-bold font-sans text-slate-900 dark:text-white tracking-tight">
                  Kas Site Lapangan - Petty Cash
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Sistem integrasi real-time Dropping Kantor Pusat, pengeluaran operasional lokal, dan auto-replenishment berbasis periode.
                </p>
              </div>
            </div>
            
            {isUserScoped && (
              <div className="inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 bg-blue-50 dark:bg-blue-950/50 border border-blue-200/50 dark:border-blue-900 rounded-md text-[11px] font-bold text-blue-700 dark:text-blue-400">
                <Building2 className="w-3.5 h-3.5" />
                Dinas Lapangan Terikat: <span className="underline">{userSite}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={openAddModal}
              className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-lg shadow-sm flex items-center gap-1.5 transition-all"
            >
              <Plus className="w-4 h-4" />
              Input Transaksi Kas
            </button>
          </div>
        </div>
      </div>

      {/* 2. STATS SUMMARIES BAR */}
      <div className="max-w-7xl mx-auto w-full px-6 py-6 grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* CARD A: PEMASUKAN DARI KANTOR PUSAT */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-3xs hover:shadow-2xs transition-all relative overflow-hidden">
          <div className="absolute right-0 top-0 translate-x-2 -translate-y-2 p-6 bg-emerald-500/10 rounded-full pointer-events-none" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Dropping HQ (Pemasukan)</span>
            <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/70">DEBIT</span>
          </div>
          <p className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">{formatRupiah(totalInflow)}</p>
          <div className="mt-2 flex items-center gap-1.5 text-[10px] text-slate-400 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            Terakumulasi dari pusat ke site
          </div>
        </div>

        {/* CARD B: PENGELUARAN OPERASIONAL SITE */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-3xs hover:shadow-2xs transition-all relative overflow-hidden">
          <div className="absolute right-0 top-0 translate-x-2 -translate-y-2 p-6 bg-rose-500/10 rounded-full pointer-events-none" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Biaya Operasional Lapangan</span>
            <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/70">KREDIT</span>
          </div>
          <p className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">{formatRupiah(totalOutflow)}</p>
          <div className="mt-2 flex items-center gap-1.5 text-[10px] text-slate-500 font-semibold dark:text-slate-400">
            <Receipt className="w-3.5 h-3.5 text-slate-400" />
            Total klaim belanja lapangan
          </div>
        </div>

        {/* CARD C: SALDO SISA KAS KECIL */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-3xs hover:shadow-2xs transition-all relative overflow-hidden">
          <div className="absolute right-0 top-0 translate-x-3 -translate-y-3 p-8 bg-blue-500/10 rounded-full pointer-events-none" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block font-sans">Sisa Saldo Kas Lapangan</span>
            <span className={`px-2 py-0.5 rounded text-[9px] font-black ${currentBalance < 500000 ? "bg-rose-500 text-white animate-pulse" : "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400"}`}>
              {currentBalance < 500000 ? "SALDO KRITIS" : "ACTIVE SALDO"}
            </span>
          </div>
          <p className={`text-2xl font-black tracking-tight ${currentBalance < 500000 ? "text-rose-600 dark:text-rose-400 animate-pulse" : "text-blue-600 dark:text-blue-400"}`}>
            {formatRupiah(currentBalance)}
          </p>
          
          {currentBalance < 500000 ? (
            <div className="mt-2 flex items-center gap-1 text-[10px] text-rose-600 dark:text-rose-400 font-bold">
              <AlertTriangle className="w-3.5 h-3.5 animate-bounce block shrink-0" />
              <span>Sisa saldo minim! Klik tab "Pengajuan Replenishment" untuk pengisian.</span>
            </div>
          ) : (
            <p className="mt-2 text-[10px] text-slate-400 font-semibold">Batas minim aman: Rp 500.000</p>
          )}
        </div>

      </div>

      {/* 3. MULTI-TAB NAVIGATION */}
      <div className="max-w-7xl mx-auto w-full px-6">
        <div className="flex border-b border-slate-200 dark:border-slate-800 gap-6">
          <button
            onClick={() => setActiveTab("mutasi")}
            className={`pb-3 font-semibold text-xs tracking-wide uppercase transition-colors relative flex items-center gap-2 ${activeTab === "mutasi" ? "text-blue-600 dark:text-blue-400 font-black border-b-2 border-blue-600 dark:border-blue-400" : "text-slate-550 dark:text-slate-450 hover:text-slate-800"}`}
          >
            <Receipt className="w-4 h-4" />
            1. Mutasi Kas Ledger
          </button>

          <button
            onClick={() => setActiveTab("replenish")}
            className={`pb-3 font-semibold text-xs tracking-wide uppercase transition-colors relative flex items-center gap-2 ${activeTab === "replenish" ? "text-blue-600 dark:text-blue-400 font-black border-b-2 border-blue-600 dark:border-blue-400" : "text-slate-550 dark:text-slate-450 hover:text-slate-800"}`}
          >
            <RefreshCw className="w-4 h-4" />
            2. Pengajuan Replenishment
            {kasReplenishments.filter(r => r.status === "Pending" && matchesUserSite(r.project)).length > 0 && (
              <span className="w-2 h-2 rounded-full bg-rose-500 inline-block animate-ping" />
            )}
          </button>

          <button
            onClick={() => setActiveTab("rekap-bulanan")}
            className={`pb-3 font-semibold text-xs tracking-wide uppercase transition-colors relative flex items-center gap-2 ${activeTab === "rekap-bulanan" ? "text-blue-600 dark:text-blue-400 font-black border-b-2 border-blue-600 dark:border-blue-400" : "text-slate-550 dark:text-slate-450 hover:text-slate-800"}`}
          >
            <FileText className="w-4 h-4" />
            3. Rekap & Laporan Bulanan
          </button>
        </div>
      </div>

      {/* 4. MAIN INNER SHEET SWITCHER */}
      <div className="max-w-7xl mx-auto w-full px-6 py-6 flex-grow">
        
        {/* ======================================= TAB 1: MUTASI KAS LEDGER ========================================= */}
        {activeTab === "mutasi" && (
          <div className="space-y-4">
            
            {/* Filter Drawer Card */}
            <div className="bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-850 p-4 rounded-xl shadow-3xs flex flex-wrap gap-4 items-center justify-between">
              <div className="flex flex-wrap items-center gap-3">
                
                {/* Search Text Entry */}
                <div className="relative w-full sm:w-56">
                  <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Cari deskripsi / kuitansi..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 border border-slate-200 dark:border-slate-800 rounded-lg text-xs bg-slate-50 dark:bg-slate-950 focus:outline-hidden focus:border-blue-500 font-semibold"
                  />
                </div>

                {/* Scope selection list (Visible solely to HQ Administrators) */}
                {!isUserScoped && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Site:</span>
                    <select
                      value={filterProject}
                      onChange={(e) => setFilterProject(e.target.value)}
                      className="border border-slate-250 dark:border-slate-800 rounded-lg text-xs bg-slate-50 dark:bg-slate-950 p-1.5 focus:outline-hidden font-bold"
                    >
                      <option value="Semua">Semua Site</option>
                      {scopedUniqueSiteNames.map((s, index) => (
                        <option key={index} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Inflow/Outflow Filter Switcher */}
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-955 rounded-lg p-1 text-xs">
                  <button
                    onClick={() => setFilterType("Semua")}
                    className={`px-3 py-1 rounded-md font-bold transition-all ${filterType === "Semua" ? "bg-white dark:bg-slate-800 text-slate-800 dark:text-white shadow-3xs" : "text-slate-500 hover:text-slate-850"}`}
                  >
                    Semua
                  </button>
                  <button
                    onClick={() => setFilterType("Masuk")}
                    className={`px-3 py-1 rounded-md font-bold transition-all ${filterType === "Masuk" ? "bg-emerald-50 dark:bg-emerald-955 text-emerald-800 dark:text-emerald-400 shadow-3xs" : "text-slate-500 hover:text-slate-850"}`}
                  >
                    Masuk
                  </button>
                  <button
                    onClick={() => setFilterType("Keluar")}
                    className={`px-3 py-1 rounded-md font-bold transition-all ${filterType === "Keluar" ? "bg-rose-50 dark:bg-rose-955 text-rose-800 dark:text-rose-400 shadow-3xs" : "text-slate-500 hover:text-slate-850"}`}
                  >
                    Keluar
                  </button>
                </div>

                {/* Filter Category */}
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-955 rounded-lg p-1 text-xs">
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="border-none bg-transparent focus:outline-hidden p-1 text-xs font-bold text-slate-600 dark:text-slate-400"
                  >
                    <option value="Semua">Semua Kategori</option>
                    {expenseCategories.map((cat, idx) => (
                      <option key={idx} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                {/* Filter Status */}
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-955 rounded-lg p-1 text-xs">
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value as any)}
                    className="border-none bg-transparent focus:outline-hidden p-1 text-xs font-bold text-slate-600 dark:text-slate-400"
                  >
                    <option value="Semua">Semua Status</option>
                    <option value="Draft">Draft (Site Lokal)</option>
                    <option value="Pending">Pending (Pengajuan HQ)</option>
                    <option value="Approved">Approved (Selesai)</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>

              </div>

              {/* Reset shortcut */}
              {(searchTerm || filterProject !== "Semua" || filterType !== "Semua" || filterCategory !== "Semua" || filterStatus !== "Semua") && (
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setFilterProject("Semua");
                    setFilterType("Semua");
                    setFilterCategory("Semua");
                    setFilterStatus("Semua");
                  }}
                  className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reset Filter
                </button>
              )}
            </div>

            {/* List Table Area */}
            {transactionsToDisplay.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-16 text-center text-slate-500">
                <Receipt className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                <p className="font-bold text-base text-slate-700 dark:text-slate-300">Transaksi Kas Tidak Ditemukan</p>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  Belum ada catatan mutasi kas masuk/keluar terdaftar dengan parameter filter pencarian tersebut.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* 1. Mutation card lists */}
                <div className="lg:col-span-2 space-y-3 max-h-[70vh] overflow-y-auto pr-1">
                  {transactionsToDisplay.map((t) => {
                    const isSelected = focusTrans?.id === t.id;
                    return (
                      <div
                        key={t.id}
                        onClick={() => setFocusTrans(t)}
                        className={`p-4 rounded-xl border transition-all cursor-pointer relative ${isSelected ? "bg-white dark:bg-slate-900 border-blue-500 dark:border-blue-400 ring-2 ring-blue-500/10 shadow-md" : "bg-white dark:bg-slate-900 border-slate-205 dark:border-slate-850 hover:bg-slate-100/40"}`}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex gap-3">
                            <span className={`p-2.5 shrink-0 rounded-lg ${t.type === "Masuk" ? "bg-emerald-50 dark:bg-emerald-950 text-emerald-600" : "bg-rose-50 dark:bg-rose-950 text-rose-600"}`}>
                              {t.type === "Masuk" ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                            </span>
                            <div>
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className="font-mono text-xs font-semibold text-slate-400">{t.receiptNo}</span>
                                
                                {t.status === "Draft" && (
                                  <span className="bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400 text-[9px] font-black px-1.5 py-0.5 rounded uppercase">DRAF LOCAL</span>
                                )}
                                {t.status === "Pending" && (
                                  <span className="bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-400 text-[9px] font-black px-1.5 py-0.5 rounded uppercase animate-pulse">PENDING HQ</span>
                                )}
                                {t.status === "Approved" && (
                                  <span className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400 text-[9px] font-black px-1.5 py-0.5 rounded uppercase">APPROVED</span>
                                )}
                                {t.status === "Rejected" && (
                                  <span className="bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-400 text-[9px] font-black px-1.5 py-0.5 rounded uppercase">DITOLAK</span>
                                )}
                              </div>

                              <p className="text-xs font-bold text-slate-800 dark:text-slate-250 mt-1 line-clamp-1">{t.description}</p>
                              
                              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-[10px] text-slate-400">
                                <span className="font-semibold block text-slate-500 font-sans">Site: {t.project}</span>
                                <span className="block italic">Tgl: {t.date}</span>
                                {t.category && <span className="bg-slate-100 dark:bg-slate-800 p-0.5 px-1.5 rounded">{t.category}</span>}
                              </div>
                            </div>
                          </div>

                          <div className="text-right">
                            <p className={`text-sm font-black ${t.type === "Masuk" ? "text-emerald-600" : "text-slate-800 dark:text-slate-200"}`}>
                              {t.type === "Masuk" ? "+" : "-"} {formatRupiah(t.amount)}
                            </p>
                            <span className="text-[9px] text-slate-400 italic font-medium mt-1 block">Oleh: {t.createdBy}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* 2. Side Focus Preview Column */}
                <div className="bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-850 rounded-xl p-5 shadow-3xs h-fit space-y-4">
                  {focusTrans ? (
                    <div className="space-y-4">
                      <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex justify-between items-center">
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-serif">DETAIL TRANSAKSI</p>
                          <span className="font-mono text-xs font-black text-slate-700 dark:text-slate-350">{focusTrans.receiptNo}</span>
                        </div>
                        <span className={`px-2 py-1 rounded text-2xs font-extrabold uppercase ${focusTrans.status === "Approved" ? "bg-emerald-50 text-emerald-800" : focusTrans.status === "Pending" ? "bg-amber-50 text-amber-800 animate-pulse" : "bg-slate-100 text-slate-700 font-bold"}`}>
                          {focusTrans.status}
                        </span>
                      </div>

                      <div className="space-y-3 text-xs font-medium">
                        
                        <div className="flex justify-between py-1 border-b border-slate-50 dark:border-slate-800">
                          <span className="text-slate-400">Project / Site:</span>
                          <span className="text-slate-700 dark:text-slate-300 font-bold">{focusTrans.project}</span>
                        </div>

                        <div className="flex justify-between py-1 border-b border-slate-50 dark:border-slate-800">
                          <span className="text-slate-400">Jenis Aliran Dana:</span>
                          <span className={`font-bold uppercase ${focusTrans.type === "Masuk" ? "text-emerald-600" : "text-rose-600"}`}>
                            {focusTrans.type === "Masuk" ? "Kas Masuk (Dropping HQ)" : "Kas Keluar (Operasional)"}
                          </span>
                        </div>

                        {focusTrans.category && (
                          <div className="flex justify-between py-1 border-b border-slate-50 dark:border-slate-800">
                            <span className="text-slate-400">Kategori Biaya:</span>
                            <span className="text-slate-700 dark:text-slate-300 font-semibold">{focusTrans.category}</span>
                          </div>
                        )}

                        <div className="flex justify-between py-1 border-b border-slate-50 dark:border-slate-800">
                          <span className="text-slate-400">Tanggal:</span>
                          <span className="text-slate-700 dark:text-slate-300 font-mono font-bold">{focusTrans.date}</span>
                        </div>

                        <div className="flex justify-between py-1 border-b border-slate-50 dark:border-slate-800">
                          <span className="text-slate-400">Nominal:</span>
                          <span className="text-slate-900 dark:text-white font-black text-sm">{formatRupiah(focusTrans.amount)}</span>
                        </div>

                        <div className="py-1">
                          <span className="text-slate-400 block mb-1">Terbilang :</span>
                          <p className="bg-amber-50 dark:bg-slate-950 p-2 border border-slate-200 dark:border-slate-800 rounded text-[11px] font-serif text-slate-700 dark:text-slate-400 italic">
                            "{konversiTerbilang(focusTrans.amount)}"
                          </p>
                        </div>

                        <div className="py-1">
                          <span className="text-slate-400 block mb-1">Keterangan / Tujuan :</span>
                          <p className="text-slate-800 dark:text-slate-350 bg-slate-50 dark:bg-slate-950/40 p-2.5 rounded border border-slate-100 dark:border-slate-800 leading-relaxed font-bold">
                            {focusTrans.description}
                          </p>
                        </div>

                        {/* Attach Copy Preview */}
                        {focusTrans.receiptUrl ? (
                          <div className="py-1 space-y-1">
                            <span className="text-slate-400 font-bold block text-2xs uppercase">Lampiran Scan Kwitansi:</span>
                            <div className="border border-slate-205 dark:border-slate-800 rounded-lg overflow-hidden max-h-32 shadow-3xs cursor-pointer relative group">
                              <img 
                                src={focusTrans.receiptUrl} 
                                alt="Receipt copy" 
                                className="w-full h-auto object-cover"
                                referrerPolicy="no-referrer"
                              />
                              <div 
                                onClick={() => {
                                  // Open raw preview popup window
                                  const popup = window.open();
                                  if (popup) popup.document.write(`<img src="${focusTrans.receiptUrl}" style="max-width:100%"/>`);
                                }}
                                className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                              >
                                <span className="text-white text-3xs font-extrabold uppercase">Klik untuk perbesar</span>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="p-3 bg-slate-50 dark:bg-slate-950/20 text-slate-400 italic text-[11px] rounded text-center">
                            Tidak ada lampiran scan kwitansi lapangan yang diunggah.
                          </div>
                        )}

                        <div className="flex items-center gap-1.5 pt-4">
                          <button
                            onClick={() => setIsPrintReceiptOpen(true)}
                            className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-3xs uppercase tracking-wider flex items-center justify-center gap-1 transition-all"
                          >
                            <Printer className="w-3.5 h-3.5" /> Cetak Kwitansi
                          </button>
                          
                          {(focusTrans.status === "Draft" || focusTrans.status === "Rejected") && (
                            <button
                              onClick={() => openEditModal(focusTrans)}
                              className="px-2.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 font-bold rounded-lg text-3xs uppercase"
                            >
                              Edit
                            </button>
                          )}

                          <button
                            onClick={() => handleDeleteItem(focusTrans.id, focusTrans.status === "Draft")}
                            className="px-2.5 py-2 hover:bg-rose-100 p-1.5 rounded-lg text-rose-500 hover:text-rose-700 transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12 text-slate-400 space-y-2">
                      <Info className="w-10 h-10 mx-auto text-slate-300" />
                      <p className="font-semibold text-xs">Pilih salah satu transaksi</p>
                      <p className="text-[10px] text-slate-400 leading-relaxed">
                        Klik pada salah satu baris riwayat mutasi kas di samping kiri untuk mengaudit log, melihat lampiran kwitansi scan, mencetak salinan bukti kas, atau melakukan penyuntingan data.
                      </p>
                    </div>
                  )}
                </div>

              </div>
            )}
          </div>
        )}

        {/* ======================================= TAB 2: PENGAJUAN REPLENISHMENT ========================================= */}
        {activeTab === "replenish" && (
          <div className="space-y-6">
            
            {/* Banner info */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-xl shadow-3xs flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <span className="p-2 bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 rounded-lg block">
                  <Sliders className="w-5 h-5" />
                </span>
                <div className="space-y-1">
                  <h3 className="font-bold text-sm text-slate-850 dark:text-white">Dropping & Pengembalian Dana Kas Site</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    Setiap site dapat mengajukan re-imbursement pengembalian kas kecil secara otomatis dengan meringkas seluruh pengeluaran site lokal yang telah disetorkan dalam kwitansi draf selama rentang periode tertentu.
                  </p>
                </div>
              </div>

              <div className="shrink-0">
                <button
                  onClick={handleOpenReplenForm}
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all shadow-sm"
                >
                  <Send className="w-4 h-4" />
                  Buat Rekap Pengajuan Dana
                </button>
              </div>
            </div>

            {/* HQ FINANCE CONSOLIDATED DASHBOARD FOR UNDERSTANDING SITES HEALTH */}
            {!isUserScoped && (
              <div className="bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-850 p-5 rounded-xl shadow-xs space-y-4">
                <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-2">
                  <h4 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-widest flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-emerald-500" />
                    REKAPITULASI PENGAJUAN DANA & MONITORING SALDO SITE
                  </h4>
                  <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-1 rounded font-mono font-bold">
                    Kantor Pusat Monitoring
                  </span>
                </div>

                <p className="text-xs text-slate-500 leading-relaxed">
                  Berikut adalah rekapitulasi real-time nilai saldo kas kecil dan total pengajuan dana masuk (replenishment) yang sedang diajukan oleh masing-masing unit site lapangan:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
                  {/* Total aggregate of all pending claims */}
                  {(() => {
                    const pendingReplens = kasReplenishments.filter(r => r.status === "Pending");
                    const totalPendingClaimsAmount = pendingReplens.reduce((sum, r) => sum + r.requestedAmount, 0);
                    return (
                      <>
                        <div className="bg-amber-50/50 dark:bg-slate-950 p-4 rounded-xl border border-amber-200 dark:border-slate-800">
                          <span className="block text-[9px] uppercase tracking-wider text-amber-600 font-extrabold mb-1">Total Klaim Pending (HQ)</span>
                          <strong className="text-lg font-mono text-amber-800 dark:text-amber-400 block leading-none">
                            {formatRupiah(totalPendingClaimsAmount)}
                          </strong>
                          <span className="text-[10px] text-slate-400 font-medium block mt-1">
                            Dari {pendingReplens.length} pengajuan site lapangan
                          </span>
                        </div>

                        <div className="bg-emerald-50/50 dark:bg-slate-950 p-4 rounded-xl border border-emerald-200 dark:border-slate-800">
                          <span className="block text-[9px] uppercase tracking-wider text-emerald-600 font-extrabold mb-1">Total Site Aktif</span>
                          <strong className="text-lg font-mono text-emerald-800 dark:text-emerald-400 block leading-none">
                            {scopedUniqueSiteNames.length} Unit
                          </strong>
                          <span className="text-[10px] text-slate-400 font-medium block mt-1">
                            Tugas lapangan terdaftar
                          </span>
                        </div>

                        <div className="bg-blue-50/50 dark:bg-slate-950 p-4 rounded-xl border border-blue-200 dark:border-slate-800">
                          <span className="block text-[9px] uppercase tracking-wider text-blue-600 font-extrabold mb-1">Total Kas Lapangan Terdistribusi</span>
                          <strong className="text-lg font-mono text-blue-800 dark:text-blue-400 block leading-none">
                            {(() => {
                              const totalLeft = scopedUniqueSiteNames.reduce((acc, siteName) => {
                                const siteTransactions = kasTransactions.filter(t => {
                                  const isMatch = t.project.toLowerCase() === siteName.toLowerCase();
                                  const p = projects.find(proj => proj.kode === t.project);
                                  const isClientMatch = p ? p.client.toLowerCase() === siteName.toLowerCase() : false;
                                  return (isMatch || isClientMatch) && t.status === "Approved";
                                });
                                const inflows = siteTransactions.filter(t => t.type === "Masuk").reduce((sum, item) => sum + item.amount, 0);
                                const outflows = siteTransactions.filter(t => t.type === "Keluar").reduce((sum, item) => sum + item.amount, 0);
                                return acc + (inflows - outflows);
                              }, 0);
                              return formatRupiah(totalLeft);
                            })()}
                          </strong>
                          <span className="text-[10px] text-slate-400 font-medium block mt-1">
                            Aggregate seluruh kas lapangan
                          </span>
                        </div>
                      </>
                    );
                  })()}
                </div>

                <div className="overflow-x-auto border border-slate-150 dark:border-slate-800 rounded-lg">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-950 font-bold border-b border-slate-150 dark:border-slate-800 text-slate-750 dark:text-slate-350">
                        <th className="p-3">Kode/Unit Site</th>
                        <th className="p-3">Sisa Saldo Lapangan</th>
                        <th className="p-3">Total Klaim Pending</th>
                        <th className="p-3">Status Saldo</th>
                        <th className="p-3">Status Pengajuan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-150 dark:divide-slate-800">
                      {scopedUniqueSiteNames.map((siteName) => {
                        // Compute sisa saldo for this site
                        const siteTransactions = kasTransactions.filter(t => {
                          const isMatch = t.project.toLowerCase() === siteName.toLowerCase();
                          const p = projects.find(proj => proj.kode === t.project);
                          const isClientMatch = p ? p.client.toLowerCase() === siteName.toLowerCase() : false;
                          return (isMatch || isClientMatch) && t.status === "Approved";
                        });

                        const inflows = siteTransactions.filter(t => t.type === "Masuk").reduce((sum, item) => sum + item.amount, 0);
                        const outflows = siteTransactions.filter(t => t.type === "Keluar").reduce((sum, item) => sum + item.amount, 0);
                        const bal = inflows - outflows;

                        const pendingClaims = kasReplenishments.filter(r => r.project.toLowerCase() === siteName.toLowerCase() && r.status === "Pending");
                        const totalPendingClaims = pendingClaims.reduce((sum, item) => sum + item.requestedAmount, 0);

                        return (
                          <tr key={siteName} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/20">
                            <td className="p-3 font-bold text-slate-850 dark:text-white">{siteName}</td>
                            <td className="p-3 font-mono font-bold text-slate-700 dark:text-slate-300">{formatRupiah(bal)}</td>
                            <td className="p-3 font-mono font-bold text-amber-700 dark:text-amber-400">
                              {totalPendingClaims > 0 ? formatRupiah(totalPendingClaims) : "-"}
                            </td>
                            <td className="p-3">
                              {bal < 500000 ? (
                                <span className="px-2 py-0.5 bg-rose-500 text-white rounded text-[9px] font-bold animate-pulse">
                                  SALDO KRITIS
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400 rounded text-[9px] font-bold">
                                  AMAN (CUKUP)
                                </span>
                              )}
                            </td>
                            <td className="p-3">
                              {pendingClaims.length > 0 ? (
                                <span className="px-2 py-0.5 bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-400 rounded text-[9px] font-bold">
                                  {pendingClaims.length} Claim Pending
                                </span>
                              ) : (
                                <span className="text-slate-400 text-3xs font-medium">Tidak ada</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* HQ FINANCE DEDICATED PENDING CLAIMS DASHBOARD REKAP DARI SEMUA SITE */}
            {!isUserScoped && (
              <div className="bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-850 p-5 rounded-xl shadow-xs space-y-4">
                <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-2">
                  <h4 className="text-xs font-black text-rose-600 dark:text-rose-450 uppercase tracking-widest flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping inline-block"></span>
                    ANTREAN REKAP PERSETUJUAN PERMINTAAN DANA (DIREKAP DARI SEMUA SITE)
                  </h4>
                  <span className="text-[10px] bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-400 px-2 py-1 rounded font-mono font-bold">
                    {kasReplenishments.filter(r => r.status === "Pending").length} Request Pending
                  </span>
                </div>

                {kasReplenishments.filter(r => r.status === "Pending").length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-2 text-center">
                    Tidak ada antrean permintaan dana (replenishment) baru dari site saat ini. Semua pengajuan telah diproses.
                  </p>
                ) : (
                  <div className="overflow-x-auto border border-slate-150 dark:border-slate-800 rounded-lg">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-955 font-bold border-b border-slate-150 dark:border-slate-800 text-slate-750 dark:text-slate-350">
                          <th className="p-3">Kode Req / Tgl</th>
                          <th className="p-3">Unit Site</th>
                          <th className="p-3">Rentang Siklus</th>
                          <th className="p-3">Jumlah Pengajuan</th>
                          <th className="p-3">Catatan</th>
                          <th className="p-3 text-right">Aksi Peninjauan</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-150 dark:divide-slate-800">
                        {kasReplenishments.filter(r => r.status === "Pending").map((repl) => (
                          <tr key={repl.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/20">
                            <td className="p-3">
                              <span className="font-mono font-bold text-slate-800 dark:text-white block">{repl.reqNo}</span>
                              <span className="text-[10px] text-slate-400">{repl.date}</span>
                            </td>
                            <td className="p-3 font-bold text-blue-600 dark:text-blue-400">{repl.project}</td>
                            <td className="p-3 text-slate-500 font-medium">
                              {repl.startDate} s/d {repl.endDate}
                            </td>
                            <td className="p-3 font-mono font-black text-rose-600 dark:text-rose-455">
                              {formatRupiah(repl.requestedAmount)}
                            </td>
                            <td className="p-3 text-slate-500 max-w-xs truncate" title={repl.notes}>
                              {repl.notes || "-"}
                            </td>
                            <td className="p-3 text-right space-x-1 whitespace-nowrap">
                              <button
                                type="button"
                                onClick={() => setFocusReplen(repl)}
                                className="px-2 py-1 border border-slate-205 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 rounded text-[10px] font-bold"
                              >
                                Detail
                              </button>
                              <button
                                type="button"
                                onClick={() => handleReviewReplenishment(repl, "Approved")}
                                className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black rounded"
                              >
                                Approve
                              </button>
                              <button
                                type="button"
                                onClick={() => handleReviewReplenishment(repl, "Rejected")}
                                className="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-black rounded"
                              >
                                Tolak
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}


            {/* FORM WIZARD: CREATE REPLENISHMENT CLAIM */}
            {isReplenFormOpen && (
              <div className="bg-amber-50/50 dark:bg-slate-900/60 border border-amber-200 dark:border-slate-800 p-5 rounded-xl space-y-4">
                <div className="flex justify-between items-center border-b border-amber-200 dark:border-slate-800 pb-3">
                  <h4 className="text-xs font-bold text-amber-800 dark:text-amber-400 uppercase tracking-widest flex items-center gap-1">
                    <Sparkles className="w-4 h-4 text-amber-600 animate-spin" />
                    LANGKAH: PENGERJAAN FORM PENGAJUAN DANA KAS
                  </h4>
                  <button 
                    onClick={() => setIsReplenFormOpen(false)}
                    className="text-slate-400 hover:text-slate-600 text-xs font-bold"
                  >
                    × Tutup Form
                  </button>
                </div>

                <form onSubmit={handleCreateReplenRequest} className="space-y-4 text-xs">
                  {/* Selector of Mode */}
                  <div className="space-y-2">
                    <label className="block text-[10px] uppercase tracking-wider font-extrabold text-slate-500">
                      PILIH METODE PENGAJUAN DANA
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setReplenishMode("direct")}
                        className={`p-3 rounded-lg border font-bold text-xs flex flex-col items-start gap-1 text-left transition-all ${
                          replenishMode === "direct"
                            ? "border-blue-500 bg-blue-50/50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400 ring-2 ring-blue-500/20"
                            : "border-slate-205 dark:border-slate-800 hover:bg-slate-50 text-slate-600 dark:text-slate-300"
                        }`}
                      >
                        <span className="font-bold flex items-center gap-1 text-slate-850 dark:text-slate-250">
                          <Send className="w-3.5 h-3.5 text-blue-500" />
                          1. Pengisian Dana Tambahan (Kapan Saja & Saldo Sisa Berapapun)
                        </span>
                        <span className="text-[10px] text-slate-400 font-normal leading-relaxed">
                          Ajukan nominal dana masuk baru kapan saja secara praktis tanpa harus melampirkan draf kwitansi pengeluaran. Sangat cocok jika saldo sisa tersisa Rp 100rb, Rp 500rb, dsb.
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setReplenishMode("reimbursement")}
                        className={`p-3 rounded-lg border font-bold text-xs flex flex-col items-start gap-1 text-left transition-all ${
                          replenishMode === "reimbursement"
                            ? "border-blue-500 bg-blue-50/50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400 ring-2 ring-blue-500/20"
                            : "border-slate-205 dark:border-slate-800 hover:bg-slate-50 text-slate-600 dark:text-slate-300"
                        }`}
                      >
                        <span className="font-bold flex items-center gap-1 text-slate-850 dark:text-slate-250">
                          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                          2. Reimbursement Pengeluaran (Merekap Draf Operasional)
                        </span>
                        <span className="text-[10px] text-slate-400 font-normal leading-relaxed">
                          Meringkas pengeluaran operasional draf kwitansi yang telah dibelanjakan selama rentang periode ini untuk diisi kembali oleh pusat sesuai nominal klaim.
                        </span>
                      </button>
                    </div>
                  </div>
                  {/* General / Shared input: Notes */}
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider font-extrabold text-slate-500 mb-1">
                      Catatan / Keterangan Pengajuan Dana
                    </label>
                    <input 
                      type="text"
                      placeholder={replenishMode === "direct" ? "Contoh: Pengisian kembali kas site karena sisa kas menipis / kebutuhan darurat" : "Contoh: Reimbursement petty cash operasional periode Mei/Juni"}
                      value={repNotes}
                      onChange={(e) => setRepNotes(e.target.value)}
                      className="w-full p-2.5 border border-slate-250 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-lg text-xs font-semibold"
                    />
                  </div>

                  {/* SECTION A: DIRECT FUNDING */}
                  {replenishMode === "direct" && (
                    <div className="bg-white dark:bg-slate-955 p-4 rounded-lg border border-slate-200 dark:border-slate-850 space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {!isUserScoped && (
                          <div>
                            <label className="block text-[10px] uppercase tracking-wider font-extrabold text-slate-500 mb-1">
                              PILIH UNIT SITE PENERIMA DANA
                            </label>
                            <select
                              value={replenProject}
                              onChange={(e) => setReplenProject(e.target.value)}
                              className="w-full p-2.5 border border-slate-250 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-lg text-xs font-bold"
                            >
                              {scopedUniqueSiteNames.map((site) => (
                                <option key={site} value={site}>
                                  {site}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}

                        <div className={isUserScoped ? "col-span-2" : ""}>
                          <label className="block text-[10px] uppercase tracking-wider font-extrabold text-slate-500 mb-1">
                            NOMINAL PENGAJUAN DANA MASUK (RP)
                          </label>
                          <div className="relative rounded-lg shadow-3xs">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                              <span className="text-slate-500 font-extrabold text-[11px]">Rp</span>
                            </div>
                            <input
                              type="number"
                              min="1"
                              value={directAmount || ""}
                              onChange={(e) => setDirectAmount(Number(e.target.value))}
                              className="block w-full rounded-lg border border-slate-250 dark:border-slate-800 pl-9 pr-3 py-2.5 text-xs font-black text-blue-600 focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-slate-950"
                              placeholder="Contoh: 1000000"
                            />
                          </div>
                          <p className="mt-1 text-[10px] text-slate-400 font-medium italic">
                            Masukkan nominal pengisian kas site yang ingin diajukan. Anda dapat mengajukan saldo berapapun meskipun sisa kas saat ini masih Rp 100.000 atau Rp 500.000 dsb.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* SECTION B: REIMBURSEMENT (REPLENISHMENT) PREVIEW & CHECKLISTS */}
                  {replenishMode === "reimbursement" && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {!isUserScoped && (
                          <div>
                            <label className="block text-[10px] uppercase tracking-wider font-extrabold text-slate-500 mb-1">
                              PILIH UNIT SITE PENERIMA DANA
                            </label>
                            <select
                              value={replenProject}
                              onChange={(e) => setReplenProject(e.target.value)}
                              className="w-full p-2.5 border border-slate-250 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-lg text-xs font-bold"
                            >
                              {scopedUniqueSiteNames.map((site) => (
                                <option key={site} value={site}>
                                  {site}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}

                        <div className={isUserScoped ? "col-span-2" : ""}>
                          <label className="block text-[10px] uppercase tracking-wider font-extrabold text-slate-500 mb-1">
                            Siklus Dari Tanggal (Mulai)
                          </label>
                          <input 
                            type="date"
                            value={repStartDate}
                            onChange={(e) => handleUpdatePeriod(e.target.value, repEndDate)}
                            className="w-full p-2.5 border border-slate-250 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-lg text-xs"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] uppercase tracking-wider font-extrabold text-slate-500 mb-1">
                            Siklus Hingga Tanggal (Berakhir)
                          </label>
                          <input 
                            type="date"
                            value={repEndDate}
                            onChange={(e) => handleUpdatePeriod(repStartDate, e.target.value)}
                            className="w-full p-2.5 border border-slate-250 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-lg text-xs"
                          />
                        </div>
                      </div>

                      <div className="bg-white dark:bg-slate-950 p-4 rounded-lg border border-slate-200 dark:border-slate-850 space-y-3">
                        <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
                          <span className="font-bold text-slate-700 dark:text-slate-400">
                            Rincian Item Draf Pengeluaran (Kredit) yang Tercakup pada Periode Terpilih ({repStartDate} s/d {repEndDate}) :
                          </span>
                          <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded font-mono font-bold">
                            {getUnclaimedOutlaysInPeriod().length} Transaksi Terdeteksi ({selectedTxIds.length} Terpilih)
                          </span>
                        </div>

                        {getUnclaimedOutlaysInPeriod().length === 0 ? (
                          <p className="text-center py-6 text-slate-400 italic">
                            Tidak ada draf pengeluaran kas site yang belum diklaim pada rentang tanggal terpilih ini. Silakan atur ulang tanggal atau ganti metode ke pengisian langsung.
                          </p>
                        ) : (
                          <div className="max-h-[25vh] overflow-y-auto space-y-2 divide-y divide-slate-100 dark:divide-slate-850">
                            {getUnclaimedOutlaysInPeriod().map((t) => {
                              const isChecked = selectedTxIds.includes(t.id);
                              return (
                                <div key={t.id} className="flex justify-between items-center text-[11px] py-1.5 hover:bg-slate-50 dark:hover:bg-slate-900/40 px-2 rounded">
                                  <div className="flex items-center gap-3">
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={() => {
                                        if (isChecked) {
                                          setSelectedTxIds(prev => prev.filter(id => id !== t.id));
                                        } else {
                                          setSelectedTxIds(prev => [...prev, t.id]);
                                        }
                                      }}
                                      className="w-3.5 h-3.5 text-blue-600 border-slate-350 dark:border-slate-850 rounded focus:ring-blue-500 cursor-pointer"
                                    />
                                    <span className="font-mono text-slate-400 font-bold block w-28 text-left">{t.receiptNo}</span>
                                    <span className="italic block w-16 text-slate-400">{t.date}</span>
                                    <span className="text-slate-700 dark:text-slate-300 block max-w-sm line-clamp-1 font-medium">{t.description}</span>
                                  </div>
                                  <span className="font-black text-slate-850 dark:text-white">{formatRupiah(t.amount)}</span>
                                </div>
                              );
                            })}

                            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center font-bold text-xs">
                              <span>TOTAL DEPOSIT REIMBURSEMENT YANG SELEKTIF DIAJUKAN :</span>
                              <span className="text-sm font-black text-blue-600 dark:text-blue-400">
                                {formatRupiah(kasTransactions.filter(t => selectedTxIds.includes(t.id)).reduce((sum, item) => sum + item.amount, 0))}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* FORM ACTIONS */}
                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsReplenFormOpen(false)}
                      className="px-4 py-2 border border-slate-200 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-900/40 rounded font-bold"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded flex items-center gap-1 shadow-sm transition-all text-xs"
                    >
                      <Send className="w-3.5 h-3.5" />
                      {isSubmitting ? "Sedang Mengirim..." : "Kirim Pengajuan Dana"}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* LIST HISTORY OF REPLENISHMENTS */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest block font-sans">RIWAYAT PENGAJUAN DANA REPLENISHMENT</h3>
              
              {kasReplenishments.filter(r => matchesUserSite(r.project)).length === 0 ? (
                <div className="bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-850 rounded-xl p-10 text-center text-slate-400">
                  <Clock className="w-10 h-10 mx-auto text-slate-300 mb-2 animate-pulse" />
                  <p className="font-bold text-xs">Belum Ada Riwayat Pengajuan</p>
                  <p className="text-[10px] mt-1">Gunakan tombol "Buat Rekap Pengajuan Dana" untuk merekap pengeluaran site lokal dan mengirim laporan penagihan dana kembali ke kantor pusat.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {kasReplenishments.filter(r => matchesUserSite(r.project)).map((repl) => {
                    const isFocus = focusReplen?.id === repl.id;
                    return (
                      <div 
                        key={repl.id} 
                        className={`p-4 bg-white dark:bg-slate-900 border rounded-xl space-y-4 hover:shadow-2xs transition-all relative ${isFocus ? "border-blue-500 ring-2 ring-blue-500/10" : "border-slate-205 dark:border-slate-850"}`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="font-mono text-xs font-black text-slate-700 dark:text-slate-300 block">{repl.reqNo}</span>
                            <span className="text-[10px] text-slate-400 italic block mt-0.5">Tanggal Request: {repl.date} | Site: {repl.project}</span>
                          </div>

                          <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase text-center ${repl.status === "Approved" ? "bg-emerald-100 text-emerald-850" : repl.status === "Rejected" ? "bg-rose-100 text-rose-850" : "bg-amber-100 text-amber-850"}`}>
                            {repl.status === "Approved" ? "CAIR (Approved)" : repl.status}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-3xs font-serif italic text-slate-500 bg-slate-50/50 dark:bg-slate-950/20 p-2.5 rounded border border-slate-100 dark:border-slate-800">
                          <div>
                            <span className="block text-[8px] font-sans font-bold text-slate-400 uppercase">Rentang Siklus :</span>
                            {repl.startDate} s/d {repl.endDate}
                          </div>
                          <div>
                            <span className="block text-[8px] font-sans font-bold text-slate-400 uppercase">Total Pengeluaran :</span>
                            <span className="not-italic font-bold text-slate-800 dark:text-slate-200">{formatRupiah(repl.requestedAmount)}</span>
                          </div>
                        </div>

                        {repl.notes && (
                          <p className="text-3xs text-slate-500 line-clamp-1 italic font-semibold font-sans">
                            Catatan: "{repl.notes}"
                          </p>
                        )}


                        <div className="flex items-center gap-2 select-none">
                          <button
                            onClick={() => setFocusReplen(repl)}
                            className="flex-1 px-2.5 py-1.5 border border-slate-200 dark:border-slate-850 text-[10px] font-bold rounded-lg hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-600 dark:text-slate-350 flex items-center justify-center gap-1 transition"
                          >
                            <Eye className="w-3.5 h-3.5" /> Detail & Cetak
                          </button>

                          {/* Approval Actions for HQ Finance & Admins */}
                          {isHQFinance && repl.status === "Pending" && (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleReviewReplenishment(repl, "Approved")}
                                className="px-2 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] rounded-lg transition"
                                title="Approve & Cairkan Dropping"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleReviewReplenishment(repl, "Rejected")}
                                className="px-2 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-black text-[10px] rounded-lg transition"
                                title="Tolak Berkas"
                              >
                                Tolak
                              </button>
                            </div>
                          )}

                          <button
                            onClick={() => handleDeleteReplenIcon(repl)}
                            className="px-2 py-1.5 hover:bg-rose-50 rounded-md text-slate-400 hover:text-rose-600 transition"
                            title="Batalkan / Hapus Pengajuan"
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

            {/* DETAIL REPLENISHMENT PREVIEW & OFFICAL PRINT GENERATOR */}
            {focusReplen && (
              <div className="bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-800 rounded-xl overflow-hidden shadow-xl mt-6">
                <div className="bg-slate-100 dark:bg-slate-850 p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                  <h4 className="font-bold text-xs text-slate-700 dark:text-slate-300 uppercase tracking-widest flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-slate-500" />
                    PRATINJAU DOKUMEN REKAPITULASI RESMI
                  </h4>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handlePrintHTML(`replen-print-${focusReplen.id}`)}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded flex items-center gap-1 transition"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      Cetak Berkas Form
                    </button>
                    <button
                      onClick={() => setFocusReplen(null)}
                      className="p-1 text-slate-400 hover:text-slate-600 font-bold"
                    >
                      × Tutup
                    </button>
                  </div>
                </div>

                <div className="p-6 bg-slate-50 dark:bg-slate-950/20 max-h-[85vh] overflow-y-auto">
                  
                  {/* PRINT CONTENT TARGET COMPLIANT WITH INDONESIAN OFFICE FORMATS */}
                  <div id={`replen-print-${focusReplen.id}`} className="bg-white border-2 border-slate-600 p-8 rounded shadow-sm text-black max-w-3xl mx-auto space-y-6">
                    
                    {/* DOC Cops */}
                    <div className="flex justify-between items-start border-b-2 border-black pb-3">
                      <div>
                        <h1 className="font-sans font-black text-sm tracking-widest text-black">PT. SYNAPSIS JASA SOLUSINDO</h1>
                        <p className="text-[9px] text-gray-500 font-sans font-semibold">Gedung Pusat Operasional Keuangan SIMRS | Divisi Audit Internal</p>
                      </div>
                      <div className="text-right">
                        <span className="border-2 border-black p-1 px-3 font-mono font-bold text-[9px] bg-white inline-block">
                          FORMULIR KLAIM PETTY CASH
                        </span>
                      </div>
                    </div>

                    {/* Header values */}
                    <div className="text-center">
                      <h2 className="text-xs font-black tracking-widest underline uppercase block">PENGAJUAN DANA PENGEMBALIAN (REPLENISHMENT) KAS SITE</h2>
                      <span className="font-mono text-[9px] font-bold text-gray-600 block mt-0.5 mt-1">No. Registrasi: {focusReplen.reqNo}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-[9px] leading-relaxed border border-black p-3.5 rounded bg-slate-50/50">
                      <div className="space-y-1">
                        <p><span className="font-bold w-24 block float-left">Project / Client Site</span> : {focusReplen.project}</p>
                        <p><span className="font-bold w-24 block float-left">Siklus Periode Rekap</span> : {focusReplen.startDate} s/d {focusReplen.endDate}</p>
                        <p><span className="font-bold w-24 block float-left">Tanggal Penyerahan</span> : {focusReplen.date}</p>
                      </div>
                      <div className="space-y-1 text-right">
                        <p><span className="font-bold w-24 inline-block">Total Mutasi Tercakup</span> : {(focusReplen.transactionIds || []).length} Baris Pengeluaran</p>
                        <p><span className="font-bold w-24 inline-block">Total Nominal Klaim</span> : Rp {Number(focusReplen.requestedAmount || 0).toLocaleString("id-ID")},-</p>
                        <p><span className="font-bold w-24 inline-block">Status Validasi</span> : {focusReplen.status}</p>
                      </div>
                    </div>

                    {/* INFLOW REGISTER */}
                    {(() => {
                      const incomingTransactionsInPeriod = kasTransactions.filter(t => {
                        if (t.type !== "Masuk") return false;
                        
                        const isProjectMatch = t.project.toLowerCase() === focusReplen.project.toLowerCase();
                        const proj = projects.find(p => p.kode === t.project);
                        const isClientMatch = proj ? proj.client.toLowerCase() === focusReplen.project.toLowerCase() : false;
                        const isSiteMatch = proj ? proj.client.toLowerCase() === userSite.toLowerCase() : false;
                        
                        if (!isProjectMatch && !isClientMatch && !(isUserScoped && isSiteMatch)) return false;
                        
                        return t.date >= focusReplen.startDate && t.date <= focusReplen.endDate;
                      });

                      const totalInflowPeriod = incomingTransactionsInPeriod.reduce((sum, item) => sum + item.amount, 0);

                      return (
                        <div className="space-y-2">
                          <h5 className="font-bold text-[10px] text-black uppercase tracking-wider">LAMPIRAN: RINCIAN REKAP DROPPING / PEMASUKAN (DEBIT)</h5>
                          {incomingTransactionsInPeriod.length === 0 ? (
                            <p className="border border-black p-3 text-[9px] text-gray-500 italic bg-gray-50 text-center">
                              Tidak ada dropping masuk / pemasukan kas yang tercatat dalam periode siklus ini.
                            </p>
                          ) : (
                            <table className="w-full border-collapse border border-black text-[8px]">
                              <thead>
                                <tr className="bg-gray-100 text-left font-bold">
                                  <th className="border border-black p-2 w-28">No Kwitansi</th>
                                  <th className="border border-black p-2 w-16">Tanggal</th>
                                  <th className="border border-black p-2">Keterangan Penerimaan Dropping</th>
                                  <th className="border border-black p-2 text-right w-24">Nominal (IDR)</th>
                                </tr>
                              </thead>
                              <tbody>
                                {incomingTransactionsInPeriod.map((item) => (
                                  <tr key={item.id} className="hover:bg-slate-50">
                                    <td className="border border-black p-2 font-mono font-bold text-gray-600">{item.receiptNo}</td>
                                    <td className="border border-black p-2">{item.date}</td>
                                    <td className="border border-black p-2 font-semibold">{item.description}</td>
                                    <td className="border border-black p-2 text-right font-bold">{formatRupiah(item.amount)}</td>
                                  </tr>
                                ))}
                                <tr className="bg-gray-100 font-bold">
                                  <td colSpan={3} className="border border-black p-2 text-right uppercase">TOTAL DROPPING MASUK (DEBIT) :</td>
                                  <td className="border border-black p-2 text-right text-[9px] font-black">{formatRupiah(totalInflowPeriod)}</td>
                                </tr>
                              </tbody>
                            </table>
                          )}
                          
                          {/* Financial recap summary block for the period */}
                          <div className="border border-black p-3 bg-slate-50 text-[9px] font-sans flex justify-between items-center font-bold">
                            <span>REKAP SALDO SISA: TOTAL PEMASUKAN ({formatRupiah(totalInflowPeriod)}) - TOTAL PENGELUARAN ({formatRupiah(focusReplen.requestedAmount)}) =</span>
                            <span className={totalInflowPeriod - focusReplen.requestedAmount >= 0 ? "text-emerald-800" : "text-rose-800"}>
                              {formatRupiah(totalInflowPeriod - focusReplen.requestedAmount)}
                            </span>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Ledger items list */}
                    <div className="space-y-2">
                      <h5 className="font-bold text-[10px] text-black">LAMPIRAN: RINCIAN ALOKASI BIAYA OPERASIONAL SITE</h5>
                      
                      <table className="w-full border-collapse border border-black text-[8px]">
                        <thead>
                          <tr className="bg-gray-100 text-left font-bold">
                            <th className="border border-black p-2 w-24">No Kworansi</th>
                            <th className="border border-black p-2 w-16">Tanggal</th>
                            <th className="border border-black p-2 w-24">Kategori Biaya</th>
                            <th className="border border-black p-2">Keterangan Pengeluaran</th>
                            <th className="border border-black p-2 text-right w-24">Nominal (IDR)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {kasTransactions.filter(t => (focusReplen.transactionIds || []).includes(t.id)).map((item) => (
                            <tr key={item.id} className="hover:bg-slate-50">
                              <td className="border border-black p-2 font-mono font-bold text-gray-600">{item.receiptNo}</td>
                              <td className="border border-black p-2">{item.date}</td>
                              <td className="border border-black p-2 uppercase">{item.category || "General"}</td>
                              <td className="border border-black p-2 font-semibold">{item.description}</td>
                              <td className="border border-black p-2 text-right font-bold">{formatRupiah(item.amount)}</td>
                            </tr>
                          ))}
                          <tr className="bg-gray-100 font-bold">
                            <td colSpan={4} className="border border-black p-2 text-right uppercase">AKUMULASI TOTAL PENGELUARAN :</td>
                            <td className="border border-black p-2 text-right text-[9px] font-black">{formatRupiah(focusReplen.requestedAmount)}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    <div className="text-[9px] italic border-b border-dotted border-gray-400 pb-3">
                      <strong>Terbilang</strong> : "{konversiTerbilang(focusReplen.requestedAmount)}"
                    </div>

                    {/* Signature sections */}
                    <div className="grid grid-cols-3 gap-4 text-center text-[9px] pt-8">
                      <div>
                        <p className="font-medium text-gray-500 mb-10">Dibuat & Diajukan Oleh,</p>
                        <div className="h-10" />
                        <p className="underline font-bold font-sans">{focusReplen.createdBy}</p>
                        <p className="text-[8px] text-gray-400 font-medium">Bendahara Site</p>
                      </div>

                      <div>
                        <p className="font-medium text-gray-500 mb-10">Diperiksa & Disetujui,</p>
                        <div className="h-10" />
                        <p className="underline font-bold font-sans">_______________________</p>
                        <p className="text-[8px] text-gray-400 font-medium">Site Coordinator</p>
                      </div>

                      <div>
                        <p className="font-medium text-gray-500 mb-10">Validasi Dropping Pusat,</p>
                        <div className="h-10" />
                        <p className="underline font-bold font-sans">{focusReplen.approvedBy || "Manager Keuangan"}</p>
                        <p className="text-[8px] text-gray-400 font-medium">HQ Financial Division</p>
                      </div>
                    </div>

                  </div>

                </div>
              </div>
            )}

          </div>
        )}

        {/* ======================================= TAB 3: REKAP BULANAN & LAPORAN BULANAN ========================================= */}
        {activeTab === "rekap-bulanan" && (
          <div className="space-y-6">
            
            {/* Pickers Card */}
            <div className="bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-850 p-5 rounded-xl shadow-3xs">
              <div className="flex flex-wrap items-center gap-4">
                
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Mulai Bulan Target Rekapitualasi :</span>
                  <input
                    type="month"
                    value={reportMonth}
                    onChange={(e) => setReportMonth(e.target.value)}
                    className="p-2 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-bold focus:outline-hidden"
                  />
                </div>

                {!isUserScoped && (
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Pilih Unit Site Tugas :</span>
                    <select
                      value={reportSiteScope}
                      onChange={(e) => setReportSiteScope(e.target.value)}
                      className="p-2 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-bold focus:outline-hidden"
                    >
                      <option value="Semua">Semua Unit Site</option>
                      {scopedUniqueSiteNames.map((s, idx) => (
                        <option key={idx} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="flex items-end self-end">
                  <button
                    onClick={() => handlePrintHTML("monthly-reconcile-printable-area")}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-3xs"
                  >
                    <Printer className="w-4 h-4" /> Cetak Laporan Keuangan Bulanan
                  </button>
                </div>

                {/* 🔒 Lock/Unlock HUD Control Block */}
                <div className="flex items-center gap-3 border border-slate-205 dark:border-slate-800 p-2.5 rounded-xl bg-slate-50/70 dark:bg-slate-950/40 ml-auto">
                  <div className="flex items-center gap-2">
                    {isMonthLocked(reportMonth, reportSiteScope) ? (
                      <>
                        <span className="p-1.5 px-2.5 bg-rose-500 text-white rounded-md text-[9px] font-black flex items-center gap-1.5 uppercase tracking-wider shadow-sm">
                          <Lock className="w-3.5 h-3.5 animate-pulse" /> Terkunci (Locked)
                        </span>
                        <div className="text-[10px] text-slate-500 font-semibold max-w-[150px] leading-tight">
                          Petugas Site diblokir dari menambah/edit/hapus kas.
                        </div>
                      </>
                    ) : (
                      <>
                        <span className="p-1.5 px-2.5 bg-emerald-500 text-white rounded-md text-[9px] font-black flex items-center gap-1.5 uppercase tracking-wider shadow-sm">
                          <Unlock className="w-3.5 h-3.5" /> Terbuka (Unlocked)
                        </span>
                        <div className="text-[10px] text-slate-500 font-semibold max-w-[150px] leading-tight">
                          Petugas Site bebas menginput pengeluaran mutasi.
                        </div>
                      </>
                    )}
                  </div>

                  {isHQFinance && (
                    <button
                      onClick={async () => {
                        const nextState = !isMonthLocked(reportMonth, reportSiteScope);
                        const confirmMsg = nextState 
                          ? `Apakah Anda yakin ingin MENGUNCI Laporan Keuangan Bulan ${reportMonth} untuk Site "${reportSiteScope}"?\n\nSetelah dikunci, petugas dari site yang bersangkutan tidak akan bisa menginput atau mengedit data pengeluaran lagi.`
                          : `Apakah Anda yakin ingin MEMBUKA KUNCI Laporan Keuangan Bulan ${reportMonth} untuk Site "${reportSiteScope}"?`;
                        if (window.confirm(confirmMsg)) {
                          try {
                            setIsSubmitting(true);
                            await api.toggleKasLock({
                              month: reportMonth,
                              site: reportSiteScope,
                              isLocked: nextState,
                              lockedBy: currentUser?.name || currentUser?.username || "HQ Finance"
                            });
                            alert(`Sukses: Laporan Bulan ${reportMonth} untuk Site ${reportSiteScope} berhasil ${nextState ? "DIKUNCI" : "DIBUKA"}.`);
                            await fetchLocksAndRequests();
                          } catch (err: any) {
                            alert("Gagal memperbarui status kunci: " + err.message);
                          } finally {
                            setIsSubmitting(false);
                          }
                        }
                      }}
                      className={`px-3 py-1.5 text-xs font-black rounded-lg border transition-all ${isMonthLocked(reportMonth, reportSiteScope) ? "bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-400 border-emerald-200 text-emerald-800" : "bg-rose-600 hover:bg-rose-700 text-white border-transparent shadow-sm"}`}
                    >
                      {isMonthLocked(reportMonth, reportSiteScope) ? "Buka Kunci Laporan" : "Kunci Laporan Site"}
                    </button>
                  )}
                </div>

              </div>
            </div>

            {/* LIST OF UNLOCK REQUESTS */}
            {(() => {
              const scopedRequests = unlockRequests.filter(r => isHQFinance ? true : matchesUserSite(r.site));
              if (scopedRequests.length === 0) return null;
              return (
                <div className="bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-850 p-5 rounded-xl space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-2">
                    <h4 className="text-xs font-extrabold text-slate-500 uppercase tracking-widest flex items-center gap-1.5 font-sans">
                      <Sliders className="w-4 h-4 text-amber-500 animate-pulse" />
                      Pengajuan Pembukaan Kunci Laporan Terkunci ({scopedRequests.length})
                    </h4>
                    <span className="text-[10px] text-slate-400 font-semibold font-mono">Daftar Log Pengajuan</span>
                  </div>

                  <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[25vh] overflow-y-auto space-y-2">
                    {scopedRequests.map((req) => (
                      <div key={req.id} className="pt-2 flex flex-col md:flex-row md:items-center justify-between text-xs gap-3">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-slate-800 dark:text-slate-200">
                              Bulan: <span className="font-mono">{req.month}</span> | Site Pelapor: <span className="text-blue-600 dark:text-blue-400">{req.site}</span>
                            </span>
                            <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${req.status === "Approved" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400" : req.status === "Rejected" ? "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-400" : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-400 animate-pulse"}`}>
                              {req.status === "Approved" ? "DISETUJUI (Unlocked)" : req.status === "Rejected" ? "DITOLAK" : "MENUNGGU (Pending HQ)"}
                            </span>
                          </div>
                          <p className="text-slate-400 text-[10px] mt-0.5">
                            Diajukan oleh: <span className="font-bold">{req.createdBy}</span> | Waktu: {new Date(req.createdAt).toLocaleString("id-ID")}
                          </p>
                          <p className="text-slate-700 dark:text-slate-350 mt-1.5 font-sans p-2 bg-slate-50 dark:bg-slate-950 rounded border border-slate-100 dark:border-slate-800 italic">
                            Alasan Butuh Akses: "{req.reason}"
                          </p>
                        </div>

                        {isHQFinance && req.status === "Pending" && (
                          <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
                            <button
                              onClick={async () => {
                                if (window.confirm(`Setujui permohonan buka kunci laporan bulan ${req.month} untuk site ${req.site}?`)) {
                                  try {
                                    setIsSubmitting(true);
                                    await api.updateKasUnlockRequest(req.id, {
                                      status: "Approved",
                                      approvedAt: new Date().toISOString(),
                                      approvedBy: currentUser?.name || currentUser?.username || "HQ Finance"
                                    });
                                    alert(`Pengajuan Buka Kunci Sukses Disetujui! Bulan ${req.month} untuk site ${req.site} telah dibuka sehingga draf operasional bisa diinput kembali.`);
                                    await fetchLocksAndRequests();
                                  } catch (err: any) {
                                    alert("Gagal menyetujui: " + err.message);
                                  } finally {
                                    setIsSubmitting(false);
                                  }
                                }
                              }}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] rounded-lg transition shadow-sm"
                            >
                              Setujui Buka Kunci
                            </button>
                            <button
                              onClick={async () => {
                                if (window.confirm("Tolak pengajuan buka kunci ini?")) {
                                  try {
                                    setIsSubmitting(true);
                                    await api.updateKasUnlockRequest(req.id, {
                                      status: "Rejected"
                                    });
                                    alert("Pengajuan ditolak.");
                                    await fetchLocksAndRequests();
                                  } catch (err: any) {
                                    alert("Gagal menolak: " + err.message);
                                  } finally {
                                    setIsSubmitting(false);
                                  }
                                }
                              }}
                              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-[10px] rounded-lg transition"
                            >
                              Tolak
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* PREVIEW CONTAINER FOR MONTH RECAP */}
            <div className="bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-850 p-6 rounded-xl shadow-2xs space-y-4">
              <h3 className="text-xs font-extrabold text-slate-500 uppercase tracking-widest flex items-center gap-1 font-sans">
                <FileText className="w-4 h-4 text-emerald-500" />
                Live Review: Lapaoran Mutasi Kas Bulanan
              </h3>

              {/* PRINT ELEMENT FOR LOCAL AND OFFICIAL EXPORT REPORTING */}
              <div id="monthly-reconcile-printable-area" className="bg-white text-black p-8 border border-gray-300 rounded space-y-6">
                
                {/* Official Corporate Logo Cops */}
                <div className="flex justify-between items-start border-b-2 border-slate-800 pb-3">
                  <div>
                    <h3 className="font-sans font-black text-sm tracking-wider">PT. SYNAPSIS JASA SOLUSINDO</h3>
                    <p className="text-[8px] text-gray-500 font-sans">Operational Site Petty-Cash Department | Monthly Financial Report</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[8px] font-mono text-gray-400">Printed: {new Date().toLocaleDateString("id-ID")}</p>
                  </div>
                </div>

                <div className="text-center space-y-1">
                  <h2 className="text-sm font-black tracking-widest underline uppercase">LAPORAN REKAPITULASI REGISTER MUTASI KAS BULANAN</h2>
                  <p className="text-[9px] font-bold text-gray-600 font-mono">Periode Bulan Laporan: {reportMonth} | Lokasi Site: {reportSiteScope}</p>
                </div>

                {/* Balance summaries bento grid */}
                <div className="grid grid-cols-4 gap-2 text-center text-[9px] leading-tight pb-2">
                  <div className="border border-black p-2 bg-gray-50">
                    <span className="block text-[8px] uppercase tracking-wider text-gray-400 mb-1">A. Saldo Awal Bulan (Opening)</span>
                    <strong className="text-[10px] block font-mono">{formatRupiah(calculatedOpeningBalance)}</strong>
                  </div>

                  <div className="border border-black p-2 bg-emerald-50/50">
                    <span className="block text-[8px] uppercase tracking-wider text-emerald-600 mb-1">B. Dropping Kantor Pusat (+)</span>
                    <strong className="text-[10px] block font-mono text-emerald-800">{formatRupiah(monthInflowTotal)}</strong>
                  </div>

                  <div className="border border-black p-2 bg-rose-50/50">
                    <span className="block text-[8px] uppercase tracking-wider text-rose-600 mb-1">C. Biaya Operasional Guna (-)</span>
                    <strong className="text-[10px] block font-mono text-rose-800">{formatRupiah(monthOutflowTotal)}</strong>
                  </div>

                  <div className="border border-black p-2 bg-blue-50/50">
                    <span className="block text-[8px] uppercase tracking-wider text-blue-600 mb-1">D. Saldo Sisa Akhir Bulan (Closing)</span>
                    <strong className="text-[10px] block font-mono text-blue-800">{formatRupiah(calculatedEndingBalance)}</strong>
                  </div>
                </div>

                {/* Ledger Listing */}
                <div className="space-y-2 pt-2">
                  <h4 className="text-[9px] font-bold uppercase tracking-wider text-slate-800">TATA BUKU UTAMA (CASH LEDGER REGISTER) - BULAN {reportMonth} :</h4>
                  
                  {targetMonthTrans.length === 0 ? (
                    <div className="text-center py-6 border border-dashed border-gray-300 text-gray-400 italic text-[9px]">
                      Belum ada transaki yang dicatatkan di site {reportSiteScope} pada bulan {reportMonth}.
                    </div>
                  ) : (
                    <table className="w-full border-collapse border border-black text-[8px]">
                      <thead>
                        <tr className="bg-gray-100 text-left font-bold border-b border-black">
                          <th className="border border-black p-2 w-28 font-semibold">No Kwitansi</th>
                          <th className="border border-black p-2 w-16">Tanggal</th>
                          <th className="border-t border-b border-black p-2 w-24">Site Terbit</th>
                          <th className="border border-black p-2 w-24">Klasifikasi / Alokasi</th>
                          <th className="border border-black p-2">Uraian / Deskripsi Melayani</th>
                          <th className="border border-black p-2 text-right w-20">Masuk / Debit</th>
                          <th className="border border-black p-2 text-right w-20">Keluar / Kredit</th>
                        </tr>
                      </thead>
                      <tbody>
                        {targetMonthTrans.map((item) => (
                          <tr key={item.id} className="hover:bg-gray-55 leading-tight">
                            <td className="border border-black p-2 font-mono font-bold text-gray-500">{item.receiptNo}</td>
                            <td className="border border-black p-2">{item.date}</td>
                            <td className="border-t border-b border-black p-2 font-bold text-gray-700">{item.project}</td>
                            <td className="border border-black p-2 uppercase text-gray-600 font-bold">{item.category || "Drop HQ"}</td>
                            <td className="border border-black p-2 font-semibold text-gray-800">{item.description}</td>
                            <td className="border border-black p-2 text-right text-emerald-800 font-semibold">{item.type === "Masuk" ? formatRupiah(item.amount) : "-"}</td>
                            <td className="border border-black p-2 text-right text-rose-800 font-semibold">{item.type === "Keluar" ? formatRupiah(item.amount) : "-"}</td>
                          </tr>
                        ))}
                        <tr className="bg-gray-100 font-bold border-t-2 border-black">
                          <td colSpan={5} className="border border-black p-2 text-right uppercase">TOTAL ALIRAN DANA BULANAN :</td>
                          <td className="border border-black p-2 text-right text-emerald-800 text-[9px] font-black">{formatRupiah(monthInflowTotal)}</td>
                          <td className="border border-black p-2 text-right text-rose-800 text-[9px] font-black">{formatRupiah(monthOutflowTotal)}</td>
                        </tr>
                        <tr className="bg-blue-50/80 font-bold">
                          <td colSpan={5} className="border border-black p-2 text-right uppercase text-blue-900">SALDO AKHIR TERTINGGAL (CASH REMAINING) :</td>
                          <td colSpan={2} className="border border-black p-2 text-center text-blue-950 font-black text-[10px]">{formatRupiah(calculatedEndingBalance)}</td>
                        </tr>
                      </tbody>
                    </table>
                  )}

                </div>

                {/* Sign-offs Cops */}
                <div className="grid grid-cols-3 gap-4 text-[9px] text-center pt-8 border-t border-dotted border-gray-400">
                  <div>
                    <span className="block text-gray-500 mb-8">Disusun Oleh (Bendahara Site),</span>
                    <div className="h-10" />
                    <p className="underline font-bold">_______________________</p>
                    <p className="text-[8px] text-gray-400">Bendahara Site</p>
                  </div>

                  <div>
                    <span className="block text-gray-500 mb-8">Diperiksa Oleh (Operational SC),</span>
                    <div className="h-10" />
                    <p className="underline font-bold">_______________________</p>
                    <p className="text-[8px] text-gray-400">Site Coordinator Regional</p>
                  </div>

                  <div>
                    <span className="block text-gray-500 mb-8">Disetujui Auditor Pusat (Manager Finance),</span>
                    <div className="h-10" />
                    <p className="underline font-bold">_______________________</p>
                    <p className="text-[8px] text-gray-400">HQ General Cashier Manager</p>
                  </div>
                </div>

              </div>
            </div>

          </div>
        )}

      </div>

      {/* ======================================= CENTERED DIALOG MODAL: INPUT / EDIT TRANSACTION ========================================= */}
      <AnimatePresence>
        {isFormOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Elegant transparent dark backdrop matching site implementation style */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsFormOpen(false)}
              className="absolute inset-0 bg-slate-950"
            />

            <motion.div
              initial={{ scale: 0.96, opacity: 0, y: 12 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.96, opacity: 0, y: 12 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="relative w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl rounded-2xl flex flex-col z-10 overflow-hidden max-h-[85vh]"
            >
              <form onSubmit={handleSaveTransaction} className="flex flex-col overflow-hidden">
                <div className="p-5 border-b border-slate-200/60 dark:border-slate-800/60 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
                  <div>
                    <h2 className="font-bold text-sm text-slate-800 dark:text-white flex items-center gap-1.5 font-sans">
                      <Banknote className="w-5 h-5 text-emerald-600" />
                      {formMode === "add" ? "Input Transaksi Kas Site Baru" : "Edit Khusus Transaksi Kas"}
                    </h2>
                    <p className="text-[11px] text-slate-550 mt-0.5">Silakan isi detail mutasi aliran dana kas operasional site.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsFormOpen(false)}
                    className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-600 text-lg transition-colors"
                  >
                    ×
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-5 space-y-5 font-sans text-xs">
              
              {/* Type toggle */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">Jenis Mutasi Aliran Dana</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setFormType("Masuk");
                      triggerAutoReceiptNo("Masuk", formDate);
                    }}
                    className={`p-3 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 transition-all ${formType === "Masuk" ? "bg-emerald-50 border-emerald-400 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400 ring-4 ring-emerald-500/10" : "bg-white dark:bg-slate-950 hover:bg-slate-50 text-slate-500 border-slate-200 dark:border-slate-800"}`}
                  >
                    <ArrowDownLeft className="w-4 h-4" />
                    Dropping Masuk ( HQ )
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setFormType("Keluar");
                      triggerAutoReceiptNo("Keluar", formDate);
                    }}
                    className={`p-3 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 transition-all ${formType === "Keluar" ? "bg-rose-50 border-rose-400 text-rose-800 dark:bg-rose-950 dark:text-rose-400 ring-4 ring-rose-500/10" : "bg-white dark:bg-slate-950 hover:bg-slate-50 text-slate-500 border-slate-200 dark:border-slate-800"}`}
                  >
                    <ArrowUpRight className="w-4 h-4" />
                    Belanja Keluar (Operasional)
                  </button>
                </div>
              </div>

              {/* Scope Site Project and Date */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                <div>
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block mb-1">Site</label>
                  {isUserScoped ? (
                    <div className="p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Building2 className="w-4 h-4 text-slate-400" />
                      {userSite}
                    </div>
                  ) : (
                    <select
                      value={formProject}
                      onChange={(e) => setFormProject(e.target.value)}
                      className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 rounded-lg font-bold text-slate-800 dark:text-slate-250 focus:outline-hidden"
                    >
                      <option value="">-- Pilih Site --</option>
                      {(() => {
                        const siteTugasOptions = Array.from(
                          new Set(
                            users
                              .map((u) => u.siteTugas?.trim())
                              .filter((st) => st && st.toLowerCase() !== "kantor pusat")
                          )
                        ).sort((a, b) => a!.localeCompare(b!));
                        return siteTugasOptions.map((st) => (
                          <option key={st} value={st}>{st}</option>
                        ));
                      })()}
                    </select>
                  )}
                </div>

                <div>
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block mb-1">Tanggal Transaksi Bukti</label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={(e) => {
                      setFormDate(e.target.value);
                      triggerAutoReceiptNo(formType, e.target.value);
                    }}
                    className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-hidden font-bold font-mono"
                  />
                </div>

              </div>

              {/* Receipt code and Amount */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">No. Kwitansi / Nota Berkas</label>
                    <button
                      type="button"
                      onClick={() => triggerAutoReceiptNo(formType, formDate)}
                      className="text-[9px] font-black text-blue-600 hover:underline uppercase"
                    >
                      Auto-Generate
                    </button>
                  </div>
                  <input
                    type="text"
                    value={formReceiptNo}
                    onChange={(e) => setFormReceiptNo(e.target.value)}
                    placeholder="Contoh: KAS-OUT-202606-001"
                    className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 rounded-lg font-mono tracking-tight text-slate-800 dark:text-slate-200 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block mb-1">Nominal Rupiah (IDR)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-3 text-xs font-bold text-slate-400">Rp</span>
                    <input
                      type="text"
                      value={formAmountText}
                      onChange={(e) => setFormAmountText(formatInputRupiah(e.target.value))}
                      placeholder="Contoh: 1.500.000"
                      className="w-full text-xs pl-8 pr-3 p-2.5 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 rounded-lg text-slate-800 dark:text-slate-200 font-bold focus:outline-hidden"
                    />
                  </div>
                  <span className="text-[9px] text-slate-400 italic block mt-0.5 line-clamp-1 truncate select-none">
                    Ekuivalen: {konversiTerbilang(getCleanAmount(formAmountText))}
                  </span>
                </div>

              </div>

              {/* operational category selector (Visible only on outlays) */}
              {formType === "Keluar" && (
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">Klasiﬁkasi Kategori Pengeluaran</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 rounded-lg font-semibold text-slate-800 dark:text-slate-250 focus:outline-hidden"
                  >
                    {expenseCategories.map((cat, idx) => (
                      <option key={idx} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Description */}
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">Uraian / Deskripsi Tujuan Belanja</label>
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Contoh: Pembelian tinta cartridge HP Smart Tank, penggantian kertas F4 3 rim untuk adm SIMRS site RS Mataram..."
                  rows={2}
                  className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 rounded-lg text-slate-850 dark:text-slate-200 focus:outline-hidden"
                />
              </div>

              {/* File Attachment Dropzone */}
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">Upload Scan Bukti Fisik Kwitansi (Maks 2MB)</label>
                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragOver(false);
                    const file = e.dataTransfer.files?.[0];
                    if (file) handleUploadedFile(file);
                  }}
                  className={`border-2 border-dashed rounded-lg p-5 text-center transition-all cursor-pointer ${isDragOver ? "bg-blue-50 border-blue-500 dark:bg-slate-950" : "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:bg-slate-100/50"}`}
                >
                  <div className="space-y-1 text-slate-400 flex flex-col items-center">
                    <Upload className="w-6 h-6 mx-auto text-slate-400 block" />
                    <p className="text-[10px] font-bold">
                      Seret & taruh file di sini, atau <span className="text-blue-600 hover:underline">pilih berkas gambar scan</span>
                    </p>
                    <p className="text-[9px] text-slate-400">Hanya format JPG, PNG, atau GIF diperbolehkan.</p>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleUploadedFile(file);
                    }}
                    className="hidden"
                    id="nota-uploader-trigger"
                  />
                  <label htmlFor="nota-uploader-trigger" className="mt-2 inline-block px-3 py-1 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-[10px] font-extrabold rounded-md text-slate-600 dark:text-slate-300">
                    Cari Gambar Nota
                  </label>
                </div>

                {/* Display Small Preview */}
                {formReceiptUrl && (
                  <div className="mt-2 flex items-center justify-between p-2 bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <img 
                        src={formReceiptUrl} 
                        alt="Kwitansi file preview" 
                        className="w-10 h-10 object-cover rounded"
                        referrerPolicy="no-referrer"
                      />
                      <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-400">Scan Kwitansi Terlampir (Siap Unggah)</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setFormReceiptUrl("")}
                      className="text-rose-600 text-xs font-black hover:underline justify-end"
                    >
                      Batal
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Actions Footer - Fixed at bottom */}
              <div className="p-4 bg-slate-50/30 dark:bg-slate-900/30 border-t border-slate-200/50 dark:border-slate-800/50 flex items-center justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-md hover:shadow-lg transition-all"
                >
                  {isSubmitting ? "Sedang Menyimpan..." : "Simpan Mutasi Kas"}
                </button>
              </div>

            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>

      {/* ======================================= COMPLIANT VIRTUAL SINGLE RECEIPT PRINT DIALOG ========================================= */}
      {isPrintReceiptOpen && focusTrans && (
        <div className="fixed inset-0 bg-slate-950/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-xl w-full max-w-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xl my-8">
            
            <div className="p-4 bg-slate-100 dark:bg-slate-850 border-b border-slate-200 flex justify-between items-center">
              <h3 className="font-bold text-xs text-slate-700 flex items-center gap-1.5 uppercase font-sans">
                <Printer className="w-4 h-4 text-slate-500" />
                Dinas Kwitansi Virtual Resmi - Generator Manual
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePrintHTML("single-receipt-manual-print-area")}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded flex items-center gap-1"
                >
                  Cetak Nota
                </button>
                <button
                  onClick={() => setIsPrintReceiptOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 font-bold"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="p-6 bg-slate-10/40 max-h-[70vh] overflow-y-auto border-t">
              
              <div id="single-receipt-manual-print-area" className="bg-amber-50/50 border-2 border-amber-900/40 p-8 rounded shadow-xs max-w-lg mx-auto font-serif text-[10px] space-y-4 text-black">
                
                <div className="flex justify-between items-start border-b border-black pb-2">
                  <div>
                    <h3 className="font-sans font-black text-xs tracking-wider">PT. SYNAPSIS JASA SOLUSINDO</h3>
                    <p className="font-sans text-[7px] text-gray-700 leading-tight">Operational & Site Deployment Central Office</p>
                  </div>
                  <div className="text-right">
                    <span className="border border-black p-1 px-2 font-mono font-bold text-[8px] bg-white inline-block">
                      No. Kuitansi: {focusTrans.receiptNo}
                    </span>
                  </div>
                </div>

                <div className="text-center">
                  <h2 className="text-xs font-bold tracking-widest underline uppercase block">KUITANSI PEMBARYARAN KAS</h2>
                </div>

                <div className="space-y-2 mt-4 leading-relaxed">
                  <div className="flex border-b border-dotted border-black pb-1">
                    <span className="w-24 font-bold italic block">Sudah terima dari :</span>
                    <span className="font-sans font-semibold text-[10px] block flex-1">
                      {focusTrans.type === "Masuk" ? "KANTOR PUSAT SYNAPSIS (Logistik / Keuangan)" : `Site Petty Cash - ${focusTrans.project}`}
                    </span>
                  </div>

                  <div className="flex border-b border-dotted border-black pb-1">
                    <span className="w-24 font-bold italic block">Uang Sejumlah :</span>
                    <span className="font-sans font-medium text-[9px] italic block flex-1 bg-white p-1 rounded border border-gray-200">
                      "{konversiTerbilang(focusTrans.amount)}"
                    </span>
                  </div>

                  <div className="flex border-b border-dotted border-black pb-1">
                    <span className="w-24 font-bold italic block">Untuk Keperluan :</span>
                    <span className="font-sans text-[9px] block flex-1 font-bold">
                      [{focusTrans.category || "General Operations"}] {focusTrans.description}
                    </span>
                  </div>
                </div>

                <div className="flex justify-between items-end pt-8">
                  <div className="bg-white border-2 border-black p-2 font-sans font-black text-xs">
                    Rp {Number(focusTrans.amount).toLocaleString("id-ID")},-
                  </div>
                  
                  <div className="text-center font-sans">
                    <p className="text-[7px]">Tgl Transaksi: {focusTrans.date}</p>
                    <p className="text-[7px] mb-8">Penerima / Pembuat,</p>
                    <div className="h-8" />
                    <p className="font-bold underline text-[8px]">{focusTrans.createdBy}</p>
                    <p className="text-[6px] text-gray-500 uppercase">Bendahara Site</p>
                  </div>
                </div>

              </div>
              
            </div>

          </div>
        </div>
      )}

      {/* ======================================= MODAL: AJUKAN UNLOCK BULAN TERKUNCI ========================================= */}
      {isUnlockRequestFormOpen && (
        <div className="fixed inset-0 bg-slate-950/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-xl w-full max-w-md border border-slate-205 dark:border-slate-800 overflow-hidden shadow-2xl my-8">
            <div className="bg-amber-50 dark:bg-amber-950 p-4 border-b border-amber-200 dark:border-amber-900 flex justify-between items-center">
              <h2 className="font-bold text-sm text-amber-800 dark:text-amber-400 flex items-center gap-1.5 font-sans">
                <Lock className="w-5 h-5 text-amber-600" />
                Siklus Terkunci: Ajukan Buka Kunci
              </h2>
              <button
                onClick={() => setIsUnlockRequestFormOpen(false)}
                className="text-amber-600 hover:text-amber-800 font-bold p-1 leading-none text-lg"
              >
                ×
              </button>
            </div>

            <div className="p-5 space-y-4 font-sans text-xs">
              <div className="bg-amber-50/50 dark:bg-slate-950 p-3 rounded-lg border border-amber-200 dark:border-slate-850 space-y-2 leading-relaxed">
                <p>
                  Siklus Keuangan Bulan <strong className="font-mono text-amber-900 dark:text-amber-400">{selectedLockedMonth}</strong> untuk Site <strong className="text-amber-900 dark:text-amber-400">"{selectedLockedSite}"</strong> telah dikunci oleh Kantor Pusat Audit PT. Synapsis Jasa Solusindo.
                </p>
                <p>
                  Silakan ajukan permohonan pembukaan kunci sementara di bawah ini dengan menyertakan alasan yang logis / detail agar dapat disetujui oleh Manager Keuangan.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-extrabold text-slate-400 tracking-widest block font-sans">Alasan Pengajuan Akses Buka Kunci :</label>
                <textarea
                  required
                  rows={4}
                  value={unlockReason}
                  onChange={(e) => setUnlockReason(e.target.value)}
                  placeholder="e.g. Perlu menginput 2 nota bensin dan logistik kegiatan site TPT draf bulan lalu yang terlambat di-input."
                  className="w-full p-3 border border-slate-200 dark:border-slate-800 rounded-lg text-xs dark:bg-slate-950 focus:outline-hidden font-medium"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsUnlockRequestFormOpen(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 dark:hover:bg-slate-850 rounded-lg font-bold"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    if (!unlockReason.trim()) {
                      alert("Silakan isi alasan pengajuan pembukaan kunci terlebih dahulu!");
                      return;
                    }
                    try {
                      setIsSubmitting(true);
                      await api.createKasUnlockRequest({
                        month: selectedLockedMonth,
                        site: selectedLockedSite,
                        reason: unlockReason.trim(),
                        createdBy: currentUser?.name || currentUser?.username || "Petugas Site"
                      });
                      alert(`Sukses: Permohonan buka kunci untuk siklus bulan ${selectedLockedMonth} site ${selectedLockedSite} telah dikirim ke Manager Keuangan.`);
                      setIsUnlockRequestFormOpen(false);
                      setUnlockReason("");
                      await fetchLocksAndRequests();
                    } catch (err: any) {
                      alert("Gagal mengirim permohonan: " + err.message);
                    } finally {
                      setIsSubmitting(false);
                    }
                  }}
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-black rounded-lg shadow-sm"
                >
                  {isSubmitting ? "Sedang Mengirim..." : "Kirim Pengajuan ke Pusat"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================= MODAL: HQ APPROVE REPLENISHMENT WITH TRANSFER SLIP ========================================= */}
      {isApprovingModalOpen && replenToApprove && (
        <div className="fixed inset-0 bg-slate-950/50 flex items-center justify-center p-4 z-50 overflow-y-auto font-sans">
          <div className="bg-white dark:bg-slate-900 rounded-xl w-full max-w-md border border-slate-205 dark:border-slate-800 overflow-hidden shadow-2xl my-8">
            <div className="bg-emerald-50 dark:bg-emerald-950 p-4 border-b border-emerald-200 dark:border-emerald-900 flex justify-between items-center">
              <h2 className="font-bold text-sm text-emerald-800 dark:text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                Persetujuan Dropping Dana Replenishment
              </h2>
              <button
                onClick={() => {
                  setIsApprovingModalOpen(false);
                  setReplenToApprove(null);
                  setApproveTransferFileUrl("");
                }}
                className="text-emerald-600 hover:text-emerald-800 font-bold p-1 leading-none text-lg"
              >
                ×
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-850 rounded-lg space-y-2.5 leading-relaxed">
                <div>
                  <span className="block text-[9px] uppercase tracking-wider font-extrabold text-slate-400">Kode Pengajuan (Claim REQ) :</span>
                  <span className="font-mono text-xs font-bold text-slate-850 dark:text-white">{replenToApprove.reqNo}</span>
                </div>
                <div>
                  <span className="block text-[9px] uppercase tracking-wider font-extrabold text-slate-400">Target Site Penerima :</span>
                  <span className="text-xs font-bold text-slate-850 dark:text-white">{replenToApprove.project}</span>
                </div>
                <div>
                  <span className="block text-[9px] uppercase tracking-wider font-extrabold text-slate-400">Total Nominal Dropping :</span>
                  <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">{formatRupiah(replenToApprove.requestedAmount)}</span>
                  <span className="block text-[9px] text-slate-450 italic font-semibold font-serif leading-none mt-1">
                    "{konversiTerbilang(replenToApprove.requestedAmount)}"
                  </span>
                </div>
              </div>

              {/* Upload Section with File and Drag-and-drop support */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-extrabold text-slate-400 tracking-widest block">Upload Bukti Transfer Bank (MANDATORI) :</label>
                
                {approveTransferFileUrl ? (
                  <div className="border border-emerald-300 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/30 p-3 rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-2 truncate">
                      <Receipt className="w-5 h-5 text-emerald-600 shrink-0" />
                      <div className="truncate text-left">
                        <p className="font-bold text-slate-800 dark:text-slate-200 truncate">Bukti_Transfer_{replenToApprove.reqNo}.jpg</p>
                        <p className="text-[9px] text-emerald-600 font-semibold">Berhasil Dilampirkan</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setApproveTransferFileUrl("")}
                      className="text-xs font-bold text-rose-600 hover:text-rose-800 pl-2 shrink-0"
                    >
                      Hapus
                    </button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-slate-250 dark:border-slate-800 rounded-xl p-6 text-center hover:border-emerald-400 transition-all bg-white dark:bg-slate-950">
                    <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2 animate-pulse" />
                    <p className="font-bold text-slate-700 dark:text-slate-350 mb-1">Unggah file bukti transfer bank</p>
                    <p className="text-slate-400 text-[10px] mb-3">Mendukung file JPG, PNG, PDF sampai dengan 5 MB</p>
                    
                    <input
                      type="file"
                      id="dropping-proof-uploader"
                      className="hidden"
                      accept="image/*,application/pdf"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const url = URL.createObjectURL(file);
                          setApproveTransferFileUrl(url || "https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?w=500&q=80");
                        }
                      }}
                    />
                    <label
                      htmlFor="dropping-proof-uploader"
                      className="px-3.5 py-1.5 bg-blue-50 text-blue-750 hover:bg-blue-100 rounded-md font-bold text-[10px] cursor-pointer inline-block transition"
                    >
                      Pilih Dokumen File
                    </label>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsApprovingModalOpen(false);
                    setReplenToApprove(null);
                    setApproveTransferFileUrl("");
                  }}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 dark:hover:bg-slate-850 rounded-lg font-bold"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    const finalProofUrl = approveTransferFileUrl || "https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?w=500&q=80";
                    try {
                      setIsSubmitting(true);
                      await onUpdateReplenishment(replenToApprove.id, {
                        status: "Approved",
                        approvedAt: new Date().toISOString(),
                        approvedBy: currentUser?.name || currentUser?.username || "HQ Finance",
                        transferProofUrl: finalProofUrl
                      });
                      
                      alert(`Persetujuan berhasil! Berkas pengajuan ${replenToApprove.reqNo} berhasil dicairkan dan Dropping Kas Masuk Dropped senilai ${formatRupiah(replenToApprove.requestedAmount)} (dengan Bukti Transfer) telah ditransfer ke Saldo Site.`);
                      
                      setIsApprovingModalOpen(false);
                      setReplenToApprove(null);
                      setApproveTransferFileUrl("");
                      setFocusReplen(null);
                    } catch (err: any) {
                      alert("Gagal memproses peninjauan: " + err.message);
                    } finally {
                      setIsSubmitting(false);
                    }
                  }}
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-lg shadow-sm"
                >
                  {isSubmitting ? "Memproses..." : "Konfirmasi & Drop Dana Masuk"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
