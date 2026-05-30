import React, { useState, useEffect } from "react";
import { BillingKSO, Client, User } from "../types";
import { 
  Plus, 
  Search, 
  Trash2, 
  Edit, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Calendar, 
  Receipt, 
  Building2, 
  RefreshCw,
  FileText,
  TrendingDown,
  ChevronRight,
  TrendingUp,
  Inbox,
  Clock,
  Check,
  UploadCloud,
  Download,
  Eye,
  Paperclip,
  CheckCircle,
  FileSpreadsheet,
  Printer,
  ChevronLeft,
  CalendarDays,
  FileCheck2,
  AlertTriangle,
  History,
  ShieldCheck,
  RotateCcw,
  Info
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

// Spell numbers in Indonesian language helper (e.g. 15000000 -> Lima Belas Juta Rupiah)
function terbilang(nominal: number): string {
  const bilangan = [
    "", "Satu", "Dua", "Tiga", "Empat", "Lima", "Enam", "Tujuh", "Delapan", "Sembilan", "Sepuluh", "Sebelas"
  ];
  let hasil = "";
  if (nominal < 12) {
    hasil = bilangan[nominal];
  } else if (nominal < 20) {
    hasil = terbilang(nominal - 10) + " Belas";
  } else if (nominal < 100) {
    hasil = terbilang(Math.floor(nominal / 10)) + " Puluh " + terbilang(nominal % 10);
  } else if (nominal < 200) {
    hasil = "Seratus " + terbilang(nominal - 100);
  } else if (nominal < 1000) {
    hasil = terbilang(Math.floor(nominal / 100)) + " Ratus " + terbilang(nominal % 100);
  } else if (nominal < 2000) {
    hasil = "Seribu " + terbilang(nominal - 1000);
  } else if (nominal < 1000000) {
    hasil = terbilang(Math.floor(nominal / 1000)) + " Ribu " + terbilang(nominal % 1000);
  } else if (nominal < 1000000000) {
    hasil = terbilang(Math.floor(nominal / 1000000)) + " Juta " + terbilang(nominal % 1000000);
  } else if (nominal < 1000000000000) {
    hasil = terbilang(Math.floor(nominal / 1000000000)) + " Milyar " + terbilang(nominal % 1000000000);
  }
  return hasil.trim();
}

interface BillingKSOViewProps {
  billings: BillingKSO[];
  clients: Client[];
  currentUser: User | null;
  onAddBilling: (billing: Partial<BillingKSO>) => Promise<void>;
  onUpdateBilling: (id: string, billing: Partial<BillingKSO>) => Promise<void>;
  onDeleteBilling: (id: string) => Promise<void>;
}

export default function BillingKSOView({
  billings = [],
  clients = [],
  currentUser,
  onAddBilling,
  onUpdateBilling,
  onDeleteBilling
}: BillingKSOViewProps) {
  // Navigation tabs: "all" or "verification" (for Manager)
  const [activeTab, setActiveTab] = useState<"all" | "verification">("all");

  // Query Filters & Search
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<"All" | "KSO" | "ATK">("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [clientFilter, setClientFilter] = useState("All");

  // Selection view and Editor states
  const [selectedBillId, setSelectedBillId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isAddNew, setIsAddNew] = useState(false);
  const [revisionNotes, setRevisionNotes] = useState("");

  // Form Field States
  const [type, setType] = useState<"KSO" | "ATK">("KSO");
  const [clientRS, setClientRS] = useState("");
  const [periodMonth, setPeriodMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
  const [serviceAmount, setServiceAmount] = useState<number>(0);
  const [ppnPercent, setPpnPercent] = useState<number>(11); // Standard PPN is 11% in Indonesia
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<"Draft" | "Submitted" | "Verified" | "Paid" | "Cancelled">("Draft");
  const [tanggalKirim, setTanggalKirim] = useState("");
  const [tanggalBayar, setTanggalBayar] = useState("");

  // Base64 file attachments states
  const [attachmentBeritaAcara, setAttachmentBeritaAcara] = useState<string>("");
  const [attachmentBeritaAcaraName, setAttachmentBeritaAcaraName] = useState<string>("");
  const [attachmentRekapTagihan, setAttachmentRekapTagihan] = useState<string>("");
  const [attachmentRekapTagihanName, setAttachmentRekapTagihanName] = useState<string>("");

  // Print invoice overlay state
  const [printBill, setPrintBill] = useState<BillingKSO | null>(null);

  // Loading & error feedback
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Calculate user scoping rules
  const isHQ = currentUser?.role === "Administrator" || 
               currentUser?.role === "Developer" || 
               currentUser?.role === "Project Lead" ||
               currentUser?.role === "Manager" ||
               currentUser?.role === "Manager Keuangan" ||
               currentUser?.role === "Direktur";

  // Site restrict: non-HQ roles are locked into their assigned siteTugas.
  const hasSiteRestriction = !isHQ && currentUser && currentUser.siteTugas && currentUser.siteTugas.trim() !== "";
  const userSite = currentUser?.siteTugas || "";
  
  // Supervisors, Managers, and Admins can create and submit data
  const canCreate = currentUser?.role === "Administrator" || 
                    currentUser?.role === "Developer" || 
                    currentUser?.role === "Manager" ||
                    currentUser?.role === "Manager Keuangan" ||
                    currentUser?.role === "Supervisor" || 
                    currentUser?.role === "Site Coordinator";

  // Managers and Admins can verify
  const canVerify = currentUser?.role === "Administrator" || 
                    currentUser?.role === "Developer" || 
                    currentUser?.role === "Manager";

  // Only Finance Manager, Admin, and Developer can input/confirm payments ("Tanggal Bayar")
  const canInputPaymentDate = currentUser?.role === "Administrator" || 
                              currentUser?.role === "Developer" || 
                              currentUser?.role === "Manager Keuangan";

  // Check if current user has edit permission on a specific bill
  const canEditBill = (bill: BillingKSO): boolean => {
    if (!currentUser) return false;
    // Admins and Devs can always override and edit everything
    if (currentUser.role === "Administrator" || currentUser.role === "Developer") {
      return true;
    }
    // Other users, including Managers, Supervisors, and Site Co’s,
    // can ONLY edit billing entries they set up themselves.
    const creator = bill.createdBy || "Supervisor";
    const userNickname = currentUser.nickname || "";
    const userUsername = currentUser.username || "";
    return creator === userNickname || creator === userUsername;
  };

  // Check if current user has delete permission on a specific bill
  const canDeleteBill = (bill: BillingKSO): boolean => {
    if (!currentUser) return false;
    // Admins and Devs can always delete everything
    if (currentUser.role === "Administrator" || currentUser.role === "Developer") {
      return true;
    }
    // Other users, including Managers, Supervisors, and Site Co’s,
    // can ONLY delete entries they set up themselves.
    const creator = bill.createdBy || "Supervisor";
    const userNickname = currentUser.nickname || "";
    const userUsername = currentUser.username || "";
    return creator === userNickname || creator === userUsername;
  };

  // Custom non-blocking interactive confirmation and action modal state
  const [workflowModal, setWorkflowModal] = useState<{
    isOpen: boolean;
    type: "submit" | "approve" | "reject" | "delete" | "pay" | null;
    bill: BillingKSO | null;
    rejectReason: string;
    paymentDate: string;
  }>({
    isOpen: false,
    type: null,
    bill: null,
    rejectReason: "",
    paymentDate: new Date().toISOString().slice(0, 10)
  });

  // Pre-fill or pre-select clients based on site restrictions
  useEffect(() => {
    if (hasSiteRestriction) {
      setClientRS(userSite);
    } else if (clients.length > 0 && !clientRS) {
      setClientRS(clients[0].namaRS);
    }
  }, [hasSiteRestriction, userSite, clients]);

  // Handle Detail Load
  const selectedBill = billings.find(b => b.id === selectedBillId) || null;

  // Format Currency Helper
  const formatIDR = (num: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0
    }).format(num);
  };

  // Human Readable Month Helper (e.g. 2026-05 -> Mei 2026)
  const formatPeriod = (period: string) => {
    if (!period) return "-";
    const parts = period.split("-");
    if (parts.length !== 2) return period;
    const year = parts[0];
    const monthIndex = parseInt(parts[1], 10) - 1;
    const months = [
      "Januari", "Februari", "Maret", "April", "Mei", "Juni",
      "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ];
    return `${months[monthIndex]} ${year}`;
  };

  // Convert Base64 back to Blob and Download instantly
  const downloadAttachmentFile = (base64Data: string, fileName: string) => {
    try {
      const link = document.createElement("a");
      link.href = base64Data;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      alert("Gagal mendownload berkas lampiran!");
    }
  };

  // Handle actual file reads to Base64
  const processFileToAttachment = (e: React.ChangeEvent<HTMLInputElement>, fileType: "BA" | "Rekap") => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      alert("Ukuran berkas terlalu besar! Batas maksimal ukuran file adalah 15MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        if (fileType === "BA") {
          setAttachmentBeritaAcara(reader.result);
          setAttachmentBeritaAcaraName(file.name);
        } else {
          setAttachmentRekapTagihan(reader.result);
          setAttachmentRekapTagihanName(file.name);
        }
      }
    };
    reader.readAsDataURL(file);
  };

  // Filter Billings based on access level & search query
  const filteredBillings = billings.filter(b => {
    // 1. Site Isolation Filter
    if (hasSiteRestriction) {
      if (b.clientRS.toLowerCase() !== userSite.toLowerCase()) {
        return false;
      }
    }

    // 2. Tab Navigation Filter: If inside manager's verification tab, show only "Submitted"
    if (activeTab === "verification") {
      if (b.status !== "Submitted") return false;
    }

    // 3. Client Filter (Head Office dropdown filter)
    if (!hasSiteRestriction && clientFilter !== "All") {
      if (b.clientRS !== clientFilter) return false;
    }

    // 4. Type Filter
    if (typeFilter !== "All" && b.type !== typeFilter) return false;

    // 5. Status Filter
    if (statusFilter !== "All" && activeTab !== "verification" && b.status !== statusFilter) return false;

    // 6. Search Text
    if (searchTerm.trim() !== "") {
      const q = searchTerm.toLowerCase();
      const matchClient = b.clientRS.toLowerCase().includes(q);
      const matchDesc = b.description.toLowerCase().includes(q);
      const matchPeriod = formatPeriod(b.periodMonth).toLowerCase().includes(q);
      return matchClient || matchDesc || matchPeriod;
    }

    return true;
  });

  // Submitted items count for verification counts badge (Manager alert)
  const submittedCount = billings.filter(b => b.status === "Submitted").length;

  // Calculating statistics for stats cards (based on accessible scoped records)
  const accessibleBillings = hasSiteRestriction 
    ? billings.filter(b => b.clientRS.toLowerCase() === userSite.toLowerCase())
    : billings;

  const statsKSOBillings = accessibleBillings.filter(b => b.type === "KSO");
  const statsATKBillings = accessibleBillings.filter(b => b.type === "ATK");

  const totalKSONominal = statsKSOBillings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
  const totalATKNominal = statsATKBillings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
  const totalPaid = accessibleBillings.filter(b => b.status === "Paid").reduce((sum, b) => sum + b.totalAmount, 0);
  const totalVerified = accessibleBillings.filter(b => b.status === "Verified").reduce((sum, b) => sum + b.totalAmount, 0);

  // Form Handlers
  const handleAddNewClick = () => {
    setErrorMessage("");
    setType("KSO");
    if (hasSiteRestriction) {
      setClientRS(userSite);
    } else if (clients.length > 0) {
      setClientRS(clients[0].namaRS);
    } else {
      setClientRS("");
    }
    const d = new Date();
    setPeriodMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
    setServiceAmount(0);
    setPpnPercent(11); // Standard 11% Indonesia
    setDescription("");
    setStatus("Draft");
    setTanggalKirim("");
    setTanggalBayar("");
    setAttachmentBeritaAcara("");
    setAttachmentBeritaAcaraName("");
    setAttachmentRekapTagihan("");
    setAttachmentRekapTagihanName("");
    setIsAddNew(true);
    setIsEditing(false);
  };

  const handleEditClick = (bill: BillingKSO) => {
    // Check if the user is authorized to edit this bill
    if (!canEditBill(bill)) {
      alert("⚠️ Hak Edit Ditolak: Anda tidak dapat mengedit data inputan yang dibuat oleh user lain.");
      return;
    }

    // Lock modification if status is not Draft and user is site level
    if (bill.status !== "Draft" && !isHQ) {
      alert("⚠️ Tagihan ini telah diajukan/diverifikasi dan tidak dapat dimodifikasi oleh Supervisor.");
      return;
    }

    setSelectedBillId(bill.id);
    setErrorMessage("");
    setType(bill.type);
    setClientRS(bill.clientRS);
    setPeriodMonth(bill.periodMonth || "");
    setServiceAmount(bill.serviceAmount || 0);
    setPpnPercent(bill.ppnPercent !== undefined ? bill.ppnPercent : 11);
    setDescription(bill.description || "");
    setStatus(bill.status || "Draft");
    setTanggalKirim(bill.tanggalKirim || "");
    setTanggalBayar(bill.tanggalBayar || "");
    setAttachmentBeritaAcara(bill.attachmentBeritaAcara || "");
    setAttachmentBeritaAcaraName(bill.attachmentBeritaAcaraName || "");
    setAttachmentRekapTagihan(bill.attachmentRekapTagihan || "");
    setAttachmentRekapTagihanName(bill.attachmentRekapTagihanName || "");
    setIsAddNew(false);
    setIsEditing(true);
  };

  const handleSave = async (e: React.FormEvent, forceSubmit: boolean = false) => {
    if (e) e.preventDefault();
    setErrorMessage("");

    if (!clientRS) {
      setErrorMessage("⚠️ Harap pilih Site / Client RS terlebih dahulu.");
      return;
    }
    if (!periodMonth) {
      setErrorMessage("⚠️ Periode bulan pelayanan wajib diisi.");
      return;
    }
    if (serviceAmount <= 0) {
      setErrorMessage("⚠️ Nilai pokok penagihan harus di atas Rp 0 !");
      return;
    }

    setIsSaving(true);
    try {
      const computedPpnAmount = Math.round((serviceAmount * ppnPercent) / 100);
      const computedTotalAmount = serviceAmount + computedPpnAmount;

      const finalStatus = forceSubmit ? "Submitted" : (isHQ ? status : "Draft");

      const payload: Partial<BillingKSO> = {
        type,
        clientRS,
        periodMonth,
        serviceAmount,
        ppnPercent,
        ppnAmount: computedPpnAmount,
        totalAmount: computedTotalAmount,
        description,
        status: finalStatus,
        tanggalKirim: finalStatus === "Paid" || finalStatus === "Verified" ? (tanggalKirim || new Date().toISOString().slice(0, 10)) : "",
        tanggalBayar: finalStatus === "Paid" ? (tanggalBayar || new Date().toISOString().slice(0, 10)) : "",
        attachmentBeritaAcara,
        attachmentBeritaAcaraName,
        attachmentRekapTagihan,
        attachmentRekapTagihanName,
        createdBy: isEditing && selectedBill ? (selectedBill.createdBy || currentUser?.nickname || "Admin") : (currentUser?.nickname || "Supervisor"),
        submittedBy: finalStatus === "Submitted" ? (currentUser?.nickname || currentUser?.username || "Supervisor") : undefined,
        submittedAt: finalStatus === "Submitted" ? new Date().toISOString() : undefined,
        revisionNotes: finalStatus === "Submitted" ? "" : (isEditing && selectedBill ? selectedBill.revisionNotes : "")
      };

      if (isEditing && selectedBillId) {
        await onUpdateBilling(selectedBillId, payload);
      } else {
        await onAddBilling(payload);
      }

      setIsAddNew(false);
      setIsEditing(false);
      setSelectedBillId(null);
    } catch (err: any) {
      setErrorMessage(err.message || "Gagal menyimpan data billing KSO.");
    } finally {
      setIsSaving(false);
    }
  };

  // Submit to Manager direct trigger from the Detailed view panel (Non-blocking Custom Modal)
  const handleDirectSubmitToManager = (bill: BillingKSO) => {
    setWorkflowModal({
      isOpen: true,
      type: "submit",
      bill,
      rejectReason: "",
      paymentDate: new Date().toISOString().slice(0, 10)
    });
  };

  // Manager Actions: Verify Approve (Non-blocking Custom Modal)
  const handleManagerApprove = (bill: BillingKSO) => {
    setWorkflowModal({
      isOpen: true,
      type: "approve",
      bill,
      rejectReason: "",
      paymentDate: new Date().toISOString().slice(0, 10)
    });
  };

  // Manager Actions: Reject send back to Draft with Reason (Non-blocking Custom Modal)
  const handleManagerReject = (bill: BillingKSO) => {
    setWorkflowModal({
      isOpen: true,
      type: "reject",
      bill,
      rejectReason: "",
      paymentDate: new Date().toISOString().slice(0, 10)
    });
  };

  // Finance Manager Action: Record Payment / Lunas (Non-blocking Custom Modal)
  const handleRecordPayment = (bill: BillingKSO) => {
    setWorkflowModal({
      isOpen: true,
      type: "pay",
      bill,
      rejectReason: "",
      paymentDate: new Date().toISOString().slice(0, 10)
    });
  };

  // Delete billing entry (Non-blocking Custom Modal)
  const handleDelete = (id: string) => {
    const target = billings.find(b => b.id === id);
    if (!target) return;

    // Enforce that only authorized users (creator or Admins/Devs) can trigger delete
    if (!canDeleteBill(target)) {
      alert("⚠️ Hak Hapus Ditolak: Anda tidak dapat menghapus data inputan yang dibuat oleh user lain.");
      return;
    }

    if (target.status !== "Draft" && !isHQ) {
      alert("⚠️ Hanya tagihan berstatus 'Draft' yang dapat dihapus oleh Supervisor.");
      return;
    }

    setWorkflowModal({
      isOpen: true,
      type: "delete",
      bill: target,
      rejectReason: "",
      paymentDate: new Date().toISOString().slice(0, 10)
    });
  };

  // The actual processor for our confirmed workflow actions
  const handleConfirmWorkflow = async () => {
    const { type, bill, rejectReason, paymentDate } = workflowModal;
    if (!bill) return;

    setIsSaving(true);
    try {
      if (type === "submit") {
        const payload: Partial<BillingKSO> = {
          status: "Submitted",
          submittedAt: new Date().toISOString(),
          submittedBy: currentUser?.nickname || currentUser?.username || "Supervisor",
          revisionNotes: ""
        };
        await onUpdateBilling(bill.id, payload);
        alert("🎉 Tagihan berhasil diajukan! Menunggu peninjauan Manager kantor pusat.");
      } else if (type === "approve") {
        const payload: Partial<BillingKSO> = {
          status: "Verified",
          verifiedAt: new Date().toISOString(),
          verifiedBy: currentUser?.nickname || currentUser?.username || "Manager",
          tanggalKirim: new Date().toISOString().slice(0, 10)
        };
        await onUpdateBilling(bill.id, payload);
        alert("🎉 Tagihan berhasil di-verify! Status kini resmi terverifikasi & siap dicetak.");
      } else if (type === "reject") {
        if (!rejectReason || rejectReason.trim() === "") {
          alert("⚠️ Alasan revisi harus diisi!");
          setIsSaving(false);
          return;
        }
        const payload: Partial<BillingKSO> = {
          status: "Draft",
          revisionNotes: rejectReason.trim()
        };
        await onUpdateBilling(bill.id, payload);
        alert("↩️ Tagihan dikembalikan ke Draft dengan catatan instruksi.");
      } else if (type === "pay") {
        const payload: Partial<BillingKSO> = {
          status: "Paid",
          tanggalBayar: paymentDate || new Date().toISOString().slice(0, 10),
          revisionNotes: `Lunas terbayar ditandai oleh ${currentUser?.name || currentUser?.username} (${currentUser?.role})`
        };
        await onUpdateBilling(bill.id, payload);
        alert("🎉 Status lunas (" + (paymentDate || "hari ini") + ") berhasil disimpan oleh " + (currentUser?.role || "Manager Keuangan") + "!");
      } else if (type === "delete") {
        await onDeleteBilling(bill.id);
        alert("✨ Catatan tagihan berhasil dihapus dari database.");
        if (selectedBillId === bill.id) {
          setSelectedBillId(null);
        }
      }
    } catch (err: any) {
      alert("Gagal melakukan aksi: " + err.message);
    } finally {
      setIsSaving(false);
      setWorkflowModal({ isOpen: false, type: null, bill: null, rejectReason: "", paymentDate: new Date().toISOString().slice(0, 10) });
    }
  };

  // Helper values for current dynamic tax updates
  const currentCalculatedPpn = Math.round((serviceAmount * ppnPercent) / 100);
  const currentCalculatedTotal = serviceAmount + currentCalculatedPpn;

  return (
    <div className="space-y-6" id="billing-kso-comp">
      
      {/* Printable Invoice Modal (A4 Stylized) */}
      <AnimatePresence>
        {printBill && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex justify-center items-start overflow-y-auto p-4 md:p-10"
            id="invoice-print-overlay"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-white text-slate-800 w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden print:shadow-none print:my-0 print:mx-0 print:p-0 my-4"
            >
              {/* Modal Action Controls in header */}
              <div className="flex items-center justify-between px-6 py-4 bg-slate-100 border-b border-slate-200 print:hidden">
                <div className="flex items-center gap-2">
                  <Printer className="w-5 h-5 text-indigo-600" />
                  <span className="font-extrabold text-sm text-slate-700">Preview Cetak Tagihan Resmi</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => window.print()}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-extrabold rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Cetak Sekarang (Print)</span>
                  </button>
                  <button
                    onClick={() => setPrintBill(null)}
                    className="p-2 bg-white hover:bg-slate-200 border border-slate-200 rounded-xl transition-all cursor-pointer"
                  >
                    <X className="w-4 h-4 text-slate-500" />
                  </button>
                </div>
              </div>

              {/* Invoice Layout Area (Highly styled like real paper) */}
              <div className="p-8 md:p-12 space-y-8 bg-white print:p-0 print:border-none" id="invoice-paper" style={{ fontFamily: "Inter, sans-serif" }}>
                
                {/* Header Kop Surat */}
                <div className="flex flex-col md:flex-row justify-between items-start border-b-4 border-double border-slate-350 pb-6">
                  <div>
                    <div className="flex items-center gap-2">
                      <Receipt className="w-7 h-7 text-indigo-600 print:text-black" />
                      <span className="text-xl font-black tracking-tight text-slate-900 font-sans">
                        MEDIKA KSO INDONESIA
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 max-w-sm mt-1 leading-relaxed">
                      Lantai 4 Gedung Pusat KSO Nusantara, Jl. RE Martadinata No. 129, Bandung, Jawa Barat. Telp: (022) 412490
                    </p>
                  </div>
                  <div className="text-right mt-4 md:mt-0 font-sans">
                    <h2 className="text-xl font-extrabold tracking-tight text-indigo-700 print:text-black uppercase">
                      INVOICE TAGIHAN {printBill.type}
                    </h2>
                    <p className="text-[11px] text-slate-450 mt-0.5 font-mono">Invoice ID: #{printBill.id}</p>
                    <p className="text-[11px] text-slate-500 mt-1">Tanggal: <b>{printBill.tanggalKirim || printBill.createdAt.slice(0, 10)}</b></p>
                  </div>
                </div>

                {/* Billing Addresses Target */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                  <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 print:bg-transparent print:border-none print:p-0">
                    <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wide">Penerima Tagihan (Client):</span>
                    <h4 className="text-sm font-extrabold text-slate-900 mt-1 flex items-center gap-1.5">
                      <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
                      {printBill.clientRS}
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">
                      Instalasi SIMRS & Layanan Pendukung Kerja KSO Teknis.<br />
                      Sistem bridging pelayanan dinas setempat.
                    </p>
                  </div>

                  <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 print:bg-transparent print:border-none print:p-0 md:text-right">
                    <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wide">Periode Pelayanan:</span>
                    <h4 className="text-sm font-extrabold text-indigo-700 print:text-black mt-1">
                      {formatPeriod(printBill.periodMonth)}
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-1.5">
                      Tipe Pelayanan: Penagihan {printBill.type === "KSO" ? "Sewa SIMRS (KSO)" : "Alat Tulis Kantor (ATK)"}<br />
                      Status Dokumen: <b>Resmi / Terverifikasi</b>
                    </p>
                  </div>
                </div>

                {/* Items & Amount breakdown table */}
                <div className="mt-4">
                  <table className="w-full text-left border-collapse border border-slate-200">
                    <thead>
                      <tr className="bg-slate-100 text-[10px] text-slate-650 font-bold uppercase tracking-wider border-b border-slate-200 print:bg-slate-200">
                        <th className="px-5 py-3 border-r border-slate-200">Uraian Deskripsi Pekerjaan / Belanja</th>
                        <th className="px-5 py-3 text-right border-r border-slate-200 w-1/4">Nilai Pokok / DPP</th>
                        <th className="px-5 py-3 text-right w-1/4">Kalkulasi PPN ({printBill.ppnPercent}%)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      <tr>
                        <td className="px-5 py-8 border-r border-slate-200 space-y-1.5">
                          <p className="font-extrabold text-slate-900">{printBill.type === "KSO" ? "Layanan Penagihan KSO Bulanan" : "Pengadaan Belanja ATK Kantor RS"}</p>
                          <p className="text-slate-550 italic leading-relaxed whitespace-pre-wrap">{printBill.description || "Uraian klaim tagihan berdasarkan Berita Acara (BA) Pelayanan yang disetujui."}</p>
                        </td>
                        <td className="px-5 py-8 text-right border-r border-slate-200 font-mono font-medium text-slate-700">
                          {formatIDR(printBill.serviceAmount)}
                        </td>
                        <td className="px-5 py-8 text-right font-mono font-medium text-slate-700">
                          {formatIDR(printBill.ppnAmount)}
                        </td>
                      </tr>
                      
                      {/* Subtotal calculations */}
                      <tr className="bg-slate-50/50 print:bg-transparent font-sans">
                        <td colSpan={2} className="px-5 py-3 text-right font-bold text-slate-500 border-r border-slate-200 uppercase text-[10px]">Nilai Pokok sebelum Pajak (DPP):</td>
                        <td className="px-5 py-3 text-right font-mono font-bold text-slate-700">{formatIDR(printBill.serviceAmount)}</td>
                      </tr>
                      <tr className="bg-slate-50/50 print:bg-transparent">
                        <td colSpan={2} className="px-5 py-3 text-right font-bold text-slate-500 border-r border-slate-200 uppercase text-[10px]">Total Pajak PPN ({printBill.ppnPercent}%):</td>
                        <td className="px-5 py-3 text-right font-mono font-bold text-slate-700">+{formatIDR(printBill.ppnAmount)}</td>
                      </tr>
                      <tr className="bg-indigo-50/30 print:bg-slate-100 border-t border-slate-200 select-none">
                        <td colSpan={2} className="px-5 py-4 text-right font-black text-slate-900 border-r border-slate-200 uppercase text-[11px] tracking-wider">TOTAL TAGIHAN BERSIH (NET):</td>
                        <td className="px-5 py-4 text-right font-mono font-black text-indigo-700 print:text-black text-sm">{formatIDR(printBill.totalAmount)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Terbilang Translation */}
                <div className="p-4 bg-slate-50/65 rounded-xl border border-dashed border-slate-200 font-sans italic text-xs leading-relaxed text-slate-600 print:bg-transparent">
                  <span className="font-extrabold text-slate-900">Terbilang: </span>
                  "{terbilang(printBill.totalAmount)} Rupiah"
                </div>

                {/* Signature Block */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6 pt-8 text-center text-xs">
                  <div>
                    <span className="text-slate-400 block font-bold text-[10px] uppercase">Dibuat Oleh (Site):</span>
                    <div className="h-16 flex items-end justify-center">
                      <span className="font-extrabold border-b border-slate-400 pb-0.5 text-slate-800">
                        {printBill.createdBy || "Supervisor Site"}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-450 block mt-1">Supervisor RS / Site</span>
                  </div>

                  <div className="hidden md:block">
                    <span className="text-slate-400 block font-bold text-[10px] uppercase">Ditinjau oleh (HQ):</span>
                    <div className="h-16 flex items-end justify-center">
                      <span className="font-extrabold border-b border-slate-400 pb-0.5 text-slate-800">
                        {printBill.verifiedBy || "Manager HQ"}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 block mt-1">Manager Verifikasi Kantor Pusat</span>
                  </div>

                  <div>
                    <span className="text-slate-400 block font-bold text-[10px] uppercase">Mengetahui (Penerima RS):</span>
                    <div className="h-16 flex items-end justify-center">
                      <div className="w-1/2 border-b border-dashed border-slate-400 h-1" />
                    </div>
                    <span className="text-[10px] text-slate-450 block mt-1">Direktur / Keuangan RS Client</span>
                  </div>
                </div>

                {/* Legal and Disclaimer footer */}
                <div className="pt-8 border-t border-slate-150 text-[10px] text-slate-400 leading-relaxed font-sans flex flex-col md:flex-row md:items-center justify-between gap-2">
                  <span>* Invoice cetak ini sah diterbitkan secara elektronik oleh Medika KSO Sistem Nusantara.</span>
                  <span className="font-mono">IP: system_verification_key_{printBill.id}</span>
                </div>

              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Header / Top Card */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl shadow-xs">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-2xl">
            <Receipt className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 font-sans tracking-tight">
              📄 Billing KSO & ATK
            </h1>
            <p className="text-xs text-slate-500 max-w-xl mt-0.5 leading-relaxed">
              {hasSiteRestriction ? (
                <span>Memantau pencatatan penagihan KSO dan pembelian logistik ATK eksklusif untuk site <b>{userSite}</b></span>
              ) : (
                <span>Pusat rekap biaya penagihan KSO, logs belanja ATK, verifikasi manajerial, dan pencetakan invoice per Site RS</span>
              )}
            </p>
          </div>
        </div>

        {/* Action Controls for supervisor creation */}
        <div className="flex items-center gap-2">
          {canCreate && (
            <button
              type="button"
              onClick={handleAddNewClick}
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white text-xs font-extrabold rounded-2xl shadow-sm cursor-pointer transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Buat Penagihan Baru</span>
            </button>
          )}
        </div>
      </div>

      {/* Roles Navigation Tabs (Explicit Manager Verification queue list) */}
      <div className="flex border-b border-slate-100 dark:border-slate-800/80">
        <button
          onClick={() => setActiveTab("all")}
          className={`px-5 py-3.5 text-xs font-extrabold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === "all"
              ? "border-indigo-600 text-indigo-600 dark:text-indigo-400 font-black"
              : "border-transparent text-slate-450 hover:text-slate-700 dark:hover:text-slate-350"
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Semua Catatan Tagihan</span>
          <span className="px-2 py-0.5 text-[10px] rounded-full bg-slate-100 dark:bg-slate-950 text-slate-500 font-bold">
            {accessibleBillings.length}
          </span>
        </button>

        {isHQ && (
          <button
            onClick={() => setActiveTab("verification")}
            className={`px-5 py-3.5 text-xs font-extrabold border-b-2 transition-all flex items-center gap-2 cursor-pointer relative ${
              activeTab === "verification"
                ? "border-indigo-600 text-indigo-600 dark:text-indigo-400 font-black"
                : "border-transparent text-slate-450 hover:text-slate-750 dark:hover:text-slate-350"
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>📥 Antrean Verifikasi Manager</span>
            {submittedCount > 0 && (
              <span className="px-2 py-0.5 text-[10px] rounded-full bg-indigo-600 text-white font-extrabold animate-bounce">
                {submittedCount}
              </span>
            )}
          </button>
        )}
      </div>

      {/* Main Stats Panel */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* TOTAL TAGIHAN KSO */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-xs relative overflow-hidden group">
          <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Receipt className="w-20 h-20 text-indigo-500" />
          </div>
          <span className="text-[10px] text-indigo-600 dark:text-indigo-450 font-bold uppercase tracking-wider">KSO Services Billing</span>
          <h3 className="text-lg font-extrabold text-slate-800 dark:text-slate-100 font-sans leading-snug mt-1">
            {formatIDR(totalKSONominal)}
          </h3>
          <p className="text-[10px] text-slate-450 mt-2 font-medium">Berdasarkan total tagihan + PPN</p>
        </div>

        {/* TOTAL BELANJA ATK */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-xs relative overflow-hidden group">
          <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <FileSpreadsheet className="w-20 h-20 text-emerald-500" />
          </div>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-450 font-bold uppercase tracking-wider">ATK Purchases (Office)</span>
          <h3 className="text-lg font-extrabold text-slate-800 dark:text-slate-100 font-sans leading-snug mt-1">
            {formatIDR(totalATKNominal)}
          </h3>
          <p className="text-[10px] text-slate-450 mt-2 font-medium">Kertas, printer ink, logistik tulis</p>
        </div>

        {/* TOTAL TERVERIFIKASI */}
        <div className="bg-gradient-to-br from-indigo-500/5 to-blue-500/5 dark:from-indigo-950/10 dark:to-blue-950/10 border border-indigo-500/10 rounded-2xl p-5 shadow-xs relative overflow-hidden">
          <span className="text-[10px] text-indigo-700 dark:text-indigo-400 font-bold uppercase tracking-wider">Siap Cetak (Verified)</span>
          <h3 className="text-lg font-extrabold text-indigo-800 dark:text-indigo-400 font-sans leading-snug mt-1">
            {formatIDR(totalVerified)}
          </h3>
          <p className="text-[10px] text-indigo-600 dark:text-indigo-500/80 font-semibold mt-2 flex items-center gap-1">
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Telah di-verify Manager</span>
          </p>
        </div>

        {/* TOTAL TERBAYAR / LUNAS */}
        <div className="bg-gradient-to-br from-emerald-500/5 to-teal-500/5 dark:from-emerald-950/10 dark:to-teal-950/10 border border-emerald-500/10 rounded-2xl p-5 shadow-xs relative overflow-hidden">
          <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold uppercase tracking-wider">Billing Terbayar (Lunas)</span>
          <h3 className="text-lg font-extrabold text-emerald-800 dark:text-emerald-400 font-sans leading-snug mt-1">
            {formatIDR(totalPaid)}
          </h3>
          <p className="text-[10px] text-emerald-600 dark:text-emerald-500/80 font-semibold mt-2 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Aliran dana masuk terealisasi</span>
          </p>
        </div>
      </div>

      {/* Main Dynamic Container */}
      <div className="w-full">
        
        {/* Left Side: Records filters and table list */}
        <div className={`${(isAddNew || isEditing || selectedBillId) ? "hidden" : "block"} space-y-4 w-full`}>
          
          {/* Filters card */}
          <div className="bg-white dark:bg-slate-900 p-4 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-xs space-y-3">
            <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
              
              {/* Type toggle */}
              <div className="flex bg-slate-100 dark:bg-slate-950 p-1 rounded-xl w-full md:w-auto">
                {(["All", "KSO", "ATK"] as const).map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTypeFilter(t)}
                    className={`flex-1 md:flex-initial px-4 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      typeFilter === t
                        ? "bg-white dark:bg-slate-850 text-slate-900 dark:text-slate-100 shadow-xs"
                        : "text-slate-450 hover:text-slate-700 dark:hover:text-slate-350"
                    }`}
                  >
                    {t === "All" ? "Semua" : t === "KSO" ? "Penagihan KSO" : "Belanja ATK"}
                  </button>
                ))}
              </div>

              {/* Search input */}
              <div className="relative w-full md:max-w-xs">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 pointer-events-none">
                  <Search className="w-3.5 h-3.5" />
                </span>
                <input
                  type="text"
                  placeholder="Cari deskripsi, RS, periode..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl text-xs placeholder-slate-400 dark:text-slate-100 focus:outline-none focus:border-indigo-500 transition-all"
                />
              </div>

            </div>

            {/* Sub-selectors (Advanced filters row) */}
            <div className="flex flex-wrap gap-3 items-center text-xs text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-850">
              <span className="font-semibold">Filter Lanjutan:</span>
              
              {/* Site Dropdown (Locked for supervisors) */}
              {!hasSiteRestriction && (
                <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-950 px-2.5 py-1.5 rounded-lg border border-slate-200/50 dark:border-slate-850">
                  <Building2 className="w-3 h-3 text-slate-400" />
                  <select
                    value={clientFilter}
                    onChange={e => setClientFilter(e.target.value)}
                    className="bg-transparent border-none text-[11px] font-bold text-slate-600 dark:text-slate-300 focus:outline-none cursor-pointer"
                  >
                    <option value="All">Semua Site RS</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.namaRS}>{c.namaRS}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Status filter dropdown (Don't show inside manager's verification queue) */}
              {activeTab !== "verification" && (
                <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-950 px-2.5 py-1.5 rounded-lg border border-slate-200/50 dark:border-slate-850">
                  <Clock className="w-3 h-3 text-slate-400" />
                  <select
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value)}
                    className="bg-transparent border-none text-[11px] font-bold text-slate-600 dark:text-slate-300 focus:outline-none cursor-pointer"
                  >
                    <option value="All">Semua Status</option>
                    <option value="Draft">Draft (Supervisor)</option>
                    <option value="Submitted">Pengajuan ke Manager (Submitted)</option>
                    <option value="Verified">Disetujui (Verified)</option>
                    <option value="Paid">Lunas (Paid)</option>
                    <option value="Cancelled">Batal</option>
                  </select>
                </div>
              )}

              {/* Reset button */}
              {(statusFilter !== "All" || clientFilter !== "All" || searchTerm !== "") && (
                <button
                  type="button"
                  onClick={() => {
                    setStatusFilter("All");
                    setClientFilter("All");
                    setSearchTerm("");
                  }}
                  className="text-xs text-indigo-600 hover:underline font-bold cursor-pointer"
                >
                  Reset Filter
                </button>
              )}

              <span className="ml-auto text-[10px] text-slate-400 font-bold">
                Ditemukan {filteredBillings.length} data
              </span>
            </div>
          </div>

          {/* Billings Tables Container */}
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-950/50 text-[10px] text-slate-400 font-bold uppercase tracking-wider border-b border-slate-100 dark:border-slate-850">
                    <th className="px-5 py-4">Tipe & Periode</th>
                    <th className="px-5 py-4">Site / RS Client</th>
                    <th className="px-5 py-4">Uraian / Deskripsi</th>
                    <th className="px-5 py-4">Dokumen Pendukung</th>
                    <th className="px-5 py-4 text-right">Nilai Pokok</th>
                    <th className="px-5 py-4 text-right">Total (+PPN)</th>
                    <th className="px-5 py-4 text-center">Status</th>
                    <th className="px-5 py-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-850 text-xs">
                  {filteredBillings.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-5 py-12 text-center text-slate-400">
                        <Inbox className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-705 mb-2" />
                        <p className="font-bold">Tidak ada data penagihan yang cocok.</p>
                        <p className="text-[10px] text-slate-450 mt-0.5">Silakan pilih filter lain atau tambahkan catatan baru.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredBillings.map(bill => (
                      <tr 
                        key={bill.id}
                        onClick={() => {
                          setSelectedBillId(bill.id);
                          setIsAddNew(false);
                          setIsEditing(false);
                        }}
                        className={`hover:bg-slate-50/75 dark:hover:bg-slate-850/40 cursor-pointer transition-all ${
                          selectedBillId === bill.id ? "bg-indigo-50/40 dark:bg-indigo-950/20 font-medium" : ""
                        }`}
                      >
                        {/* Type & Month */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <span className={`p-1.5 rounded-lg shrink-0 ${
                              bill.type === "KSO"
                                ? "bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400"
                                : "bg-emerald-50 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400"
                            }`}>
                              {bill.type === "KSO" ? <Receipt className="w-3.5 h-3.5" /> : <FileText className="w-3.5 h-3.5" />}
                            </span>
                            <div>
                              <div className="font-extrabold text-slate-850 dark:text-slate-200">
                                {bill.type}
                              </div>
                              <div className="text-[10px] text-slate-400 font-bold tracking-wide">
                                {formatPeriod(bill.periodMonth)}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Client RS */}
                        <td className="px-5 py-4">
                          <div className="font-extrabold text-slate-750 dark:text-slate-300">
                            {bill.clientRS}
                          </div>
                          <div className="text-[10px] text-slate-400 font-medium">
                            Created by: {bill.createdBy || "Supervisor"}
                          </div>
                        </td>

                        {/* Description */}
                        <td className="px-5 py-4">
                          <div className="max-w-xs truncate text-slate-600 dark:text-slate-350" title={bill.description}>
                            {bill.description || "-"}
                          </div>
                        </td>

                        {/* Document Attachment Indicators */}
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-1.5">
                            {bill.attachmentBeritaAcara ? (
                              <span 
                                title={`BA: ${bill.attachmentBeritaAcaraName}`}
                                className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900 text-[10px] rounded-sm font-bold text-blue-700 dark:text-blue-400"
                              >
                                <Paperclip className="w-2.5 h-2.5" />
                                <span>BA</span>
                              </span>
                            ) : (
                              <span className="text-[9px] text-slate-400 italic">No BA</span>
                            )}

                            {bill.attachmentRekapTagihan ? (
                              <span 
                                title={`Rekap: ${bill.attachmentRekapTagihanName}`}
                                className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900 text-[10px] rounded-sm font-bold text-emerald-750 dark:text-emerald-400"
                              >
                                <FileSpreadsheet className="w-2.5 h-2.5" />
                                <span>Rekap</span>
                              </span>
                            ) : (
                              <span className="text-[9px] text-slate-400 italic">No Rekap</span>
                            )}
                          </div>
                        </td>

                        {/* Net Amount */}
                        <td className="px-5 py-4 text-right">
                          <span className="font-mono text-[11px] text-slate-600 dark:text-slate-400">
                            {formatIDR(bill.serviceAmount)}
                          </span>
                        </td>

                        {/* Total with PPN */}
                        <td className="px-5 py-4 text-right">
                          <div className="font-mono font-extrabold text-[11.5px] text-slate-900 dark:text-slate-100">
                            {formatIDR(bill.totalAmount)}
                          </div>
                          <div className="text-[9px] text-slate-400 font-semibold">
                            Incl PPN {bill.ppnPercent}%
                          </div>
                        </td>

                        {/* Status Badge */}
                        <td className="px-5 py-4 text-center">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                            bill.status === "Paid"
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                              : bill.status === "Verified"
                              ? "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
                              : bill.status === "Submitted"
                              ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 animate-pulse"
                              : bill.status === "Cancelled"
                              ? "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                              : "bg-slate-500/10 text-slate-500 dark:text-slate-400"
                          }`}>
                            <span>
                              {bill.status === "Paid" ? "Lunas" : bill.status === "Verified" ? "Verified" : bill.status === "Submitted" ? "Pengajuan ke Manager" : bill.status === "Cancelled" ? "Batal" : "Draft"}
                            </span>
                          </span>
                        </td>

                        {/* Action buttons */}
                        <td className="px-5 py-4 text-center" onClick={e => e.stopPropagation()}>
                          <div className="flex items-center justify-center gap-1">
                            {/* Edit/Delete allowed only if Draft (or HQ) AND has access */}
                            {(bill.status === "Draft" || isHQ) && canEditBill(bill) && (
                              <button
                                type="button"
                                onClick={() => handleEditClick(bill)}
                                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg text-slate-400 cursor-pointer transition-all"
                                title="Edit"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                            )}
                            
                            {(bill.status === "Draft" || isHQ) && canDeleteBill(bill) && (
                              <button
                                type="button"
                                onClick={() => handleDelete(bill.id)}
                                className="p-1 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-600 dark:hover:text-red-400 rounded-lg text-slate-400 cursor-pointer transition-all"
                                title="Hapus"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {/* Print preview directly reachable */}
                            {(bill.status === "Verified" || bill.status === "Paid") && (
                              <button
                                type="button"
                                onClick={() => setPrintBill(bill)}
                                className="p-1 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 hover:text-indigo-600 text-indigo-500 rounded-lg cursor-pointer transition-all"
                                title="Cetak Tagihan / Print Invoice"
                              >
                                <Printer className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Side: Detail / Form Component Pane (Full Page on detail/input modes) */}
        <div className={`${(isAddNew || isEditing || selectedBillId) ? "block" : "hidden"} w-full bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 md:p-8 shadow-xs`}>
          <AnimatePresence mode="wait">
            
            {/* 1. Editor Form (Adding / Updating Records) */}
            {(isAddNew || isEditing) ? (
              <motion.div
                key="billing-form"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm font-sans tracking-tight flex items-center gap-1.5">
                    {isEditing ? <Edit className="w-4 h-4 text-indigo-600" /> : <Plus className="w-4 h-4 text-indigo-600" />}
                    <span>{isEditing ? "✏️ Edit Catatan Billing" : "✨ Tambah Billing Baru"}</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddNew(false);
                      setIsEditing(false);
                    }}
                    className="px-3 py-1.5 bg-slate-105 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-705 dark:text-slate-300 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 border border-slate-205/50 dark:border-slate-750"
                    title="Kembali ke Daftar"
                  >
                    <ChevronLeft className="w-4 h-4 shrink-0" />
                    <span>Kembali</span>
                  </button>
                </div>

                {errorMessage && (
                  <div className="p-3 bg-red-100 border border-red-200 text-red-850 text-xs rounded-xl flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {isEditing && selectedBill?.revisionNotes && (
                  <div className="p-3.5 bg-rose-50 dark:bg-rose-950/20 border border-rose-200/50 dark:border-rose-900/40 text-rose-800 dark:text-rose-450 text-xs rounded-xl flex items-start gap-2.5">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
                    <div>
                      <p className="font-extrabold text-[11px] uppercase tracking-wide">📢 PERLU REVISI DARI MANAGER HQ</p>
                      <p className="mt-1 leading-relaxed text-slate-705 dark:text-slate-350 bg-white/70 dark:bg-slate-950/45 p-2 rounded-lg border border-rose-100/40 font-medium">
                        "{selectedBill.revisionNotes}"
                      </p>
                    </div>
                  </div>
                )}

                <form onSubmit={(e) => handleSave(e, false)} className="space-y-4">
                  {/* Select Type toggle */}
                  <div>
                    <label className="block text-[10px] text-slate-400 font-extrabold uppercase tracking-wider mb-1.5">Jenis Penagihan</label>
                    <div className="grid grid-cols-2 gap-2 bg-slate-50 dark:bg-slate-950 p-1 rounded-xl">
                      <button
                        type="button"
                        onClick={() => setType("KSO")}
                        className={`py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                          type === "KSO" 
                            ? "bg-indigo-600 text-white shadow" 
                            : "text-slate-500 hover:text-slate-705 dark:hover:text-slate-300"
                        }`}
                      >
                        Penagihan KSO
                      </button>
                      <button
                        type="button"
                        onClick={() => setType("ATK")}
                        className={`py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                          type === "ATK" 
                            ? "bg-emerald-650 text-white shadow" 
                            : "text-slate-500 hover:text-slate-705 dark:hover:text-slate-300"
                        }`}
                      >
                        Pengadaan ATK
                      </button>
                    </div>
                  </div>

                  {/* Client RS selection */}
                  <div>
                    <label className="block text-[10px] text-slate-400 font-extrabold uppercase tracking-wider mb-1">Site / Client RS</label>
                    {hasSiteRestriction ? (
                      <div className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-950 border border-slate-200/50 dark:border-slate-850 text-slate-600 dark:text-slate-400 text-xs font-bold rounded-xl flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        <span>{userSite} (Terkunci untuk site tugas Anda)</span>
                      </div>
                    ) : (
                      <select
                        value={clientRS}
                        onChange={e => setClientRS(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
                      >
                        <option value="">-- Pilih Client / Site --</option>
                        {clients.map(c => (
                          <option key={c.id} value={c.namaRS}>{c.namaRS}</option>
                        ))}
                      </select>
                    )}
                  </div>

                  {/* Period selection */}
                  <div>
                    <label className="block text-[10px] text-slate-400 font-extrabold uppercase tracking-wider mb-1">Bulan Pelayanan</label>
                    <input
                      type="month"
                      value={periodMonth}
                      onChange={e => setPeriodMonth(e.target.value)}
                      required
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl text-xs font-semibold focus:outline-none focus:border-indigo-500 dark:text-slate-100"
                    />
                  </div>

                  {/* Net Service amount */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Nilai Pokok / DPP (Sebelum PPN)</label>
                      <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-extrabold font-mono">
                        {formatIDR(serviceAmount)}
                      </span>
                    </div>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-xs text-slate-400 font-bold pointer-events-none">Rp</span>
                      <input
                        type="number"
                        placeholder="e.g. 15000000"
                        value={serviceAmount || ""}
                        onChange={e => setServiceAmount(Math.max(0, parseInt(e.target.value, 10)) || 0)}
                        required
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl text-xs font-mono font-bold focus:outline-none focus:border-indigo-500 dark:text-slate-100"
                      />
                    </div>
                  </div>

                  {/* Live PPN details and calculations */}
                  <div className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-2xl border border-slate-200/50 dark:border-slate-850 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-550 dark:text-slate-450 font-extrabold uppercase">Persentase PPN (%)</span>
                      <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 px-2 py-1 border border-slate-200/70 dark:border-slate-800 rounded-lg">
                        <input
                          type="number"
                          value={ppnPercent}
                          onChange={e => setPpnPercent(Math.max(0, parseInt(e.target.value, 10)) || 0)}
                          className="w-8 text-center text-xs font-extrabold focus:outline-none bg-transparent dark:text-slate-100 font-mono"
                        />
                        <span className="text-xs text-slate-400 font-bold">%</span>
                      </div>
                    </div>

                    <div className="space-y-1.5 text-[11px] pt-2 border-t border-slate-210 dark:border-slate-800/60 font-medium text-slate-600 dark:text-slate-400">
                      <div className="flex justify-between">
                        <span>Nilai DPP (Pokok):</span>
                        <span className="font-mono">{formatIDR(serviceAmount)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Nilai PPN ({ppnPercent}%):</span>
                        <span className="font-mono text-indigo-600 dark:text-indigo-400">+{formatIDR(currentCalculatedPpn)}</span>
                      </div>
                      <div className="flex justify-between text-slate-900 dark:text-slate-200 font-extrabold text-xs pt-2 border-t border-dashed border-slate-200 dark:border-slate-800">
                        <span>Total Penagihan:</span>
                        <span className="font-mono text-indigo-600 dark:text-indigo-300">{formatIDR(currentCalculatedTotal)}</span>
                      </div>
                    </div>
                  </div>

                  {/* NEW FILE UPLOAD: Attachment Berita Acara (BA) */}
                  <div className="space-y-1.5">
                    <label className="block text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">
                      {type === "KSO" ? "📎 Lampiran Berita Acara (BA) KSO" : "🧾 Lampiran Kuitansi / Bukti Pembelian ATK"}
                    </label>
                    {attachmentBeritaAcaraName ? (
                      <div className="flex items-center justify-between p-3 bg-indigo-50/45 dark:bg-indigo-950/20 border border-indigo-150/45 dark:border-indigo-900/40 rounded-xl">
                        <div className="flex items-center gap-2 truncate text-xs font-semibold">
                          <Paperclip className="w-3.5 h-3.5 text-indigo-505 shrink-0" />
                          <span className="text-slate-800 dark:text-slate-300 truncate" title={attachmentBeritaAcaraName}>{attachmentBeritaAcaraName}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setAttachmentBeritaAcara("");
                            setAttachmentBeritaAcaraName("");
                          }}
                          className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-650 hover:text-rose-700 text-[10px] font-black rounded-lg transition-all cursor-pointer border border-rose-100"
                        >
                          Hapus
                        </button>
                      </div>
                    ) : (
                      <div className="relative border border-dashed border-slate-250 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 p-3 rounded-xl hover:bg-slate-100/50 dark:hover:bg-slate-950/80 transition-all flex flex-col items-center justify-center text-center cursor-pointer">
                        <input
                          type="file"
                          accept=".pdf,.png,.jpg,.jpeg,.xlsx,.docx"
                          onChange={(e) => processFileToAttachment(e, "BA")}
                          className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                        />
                        <UploadCloud className="w-6 h-6 text-indigo-500 mb-1" />
                        <span className="text-[10px] text-slate-550 font-bold max-w-xs leading-normal">
                          {type === "KSO" ? "Unduh atau seret file PDF / Berita Acara di sini (Maks 15MB)" : "Pilih foto kuitansi atau bukti pengadaan ATK (Maks 15MB)"}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* NEW FILE UPLOAD: Rekap Tagihan */}
                  <div className="space-y-1.5">
                    <label className="block text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">
                      {type === "KSO" ? "📊 Rekap Tagihan (Rincian Klaim SIMRS)" : "📋 Rincian Belanja Ritel Barang ATK"}
                    </label>
                    {attachmentRekapTagihanName ? (
                      <div className="flex items-center justify-between p-3 bg-emerald-50/45 dark:bg-emerald-950/20 border border-emerald-150/45 dark:border-emerald-900/40 rounded-xl">
                        <div className="flex items-center gap-2 truncate text-xs font-semibold">
                          <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-505 shrink-0" />
                          <span className="text-slate-800 dark:text-slate-300 truncate" title={attachmentRekapTagihanName}>{attachmentRekapTagihanName}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setAttachmentRekapTagihan("");
                            setAttachmentRekapTagihanName("");
                          }}
                          className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-650 hover:text-rose-700 text-[10px] font-black rounded-lg transition-all cursor-pointer border border-rose-100"
                        >
                          Hapus
                        </button>
                      </div>
                    ) : (
                      <div className="relative border border-dashed border-slate-250 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 p-3 rounded-xl hover:bg-slate-100/50 dark:hover:bg-slate-950/80 transition-all flex flex-col items-center justify-center text-center cursor-pointer">
                        <input
                          type="file"
                          accept=".pdf,.png,.jpg,.jpeg,.xlsx,.docx"
                          onChange={(e) => processFileToAttachment(e, "Rekap")}
                          className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                        />
                        <FileSpreadsheet className="w-6 h-6 text-emerald-500 mb-1" />
                        <span className="text-[10px] text-slate-550 font-bold max-w-xs leading-normal">
                          {type === "KSO" ? "Pilih rincian rekapitulasi klaim Excel / PDF (Maks 15MB)" : "Pilih file rincian / daftar belanja ATK (Maks 15MB)"}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Description input */}
                  <div>
                    <label className="block text-[10px] text-slate-400 font-extrabold uppercase tracking-wider mb-1">
                      Uraian Pelayanan / Keterangan Belanja ATK
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Masuk ulasan ringkas mengenai klaim bridgign, sewa bulanan atau jenis logistik tulis..."
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl text-xs placeholder-slate-400 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  {/* Form Status selection (If Admin/HQ, they can choose directly; Supervisors see read-only badge to prevent dropdown lockups) */}
                  <div>
                    <label className="block text-[10px] text-slate-400 font-extrabold uppercase tracking-wider mb-1">Status Penagihan</label>
                    {isHQ ? (
                      <select
                        value={status}
                        onChange={e => setStatus(e.target.value as any)}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none"
                      >
                        <option value="Draft">Draft (Dalam Penyuntingan)</option>
                        <option value="Submitted">Submitted (Pengajuan ke Manager)</option>
                        <option value="Verified">Verified (Telah Terverifikasi Manager)</option>
                        {(canInputPaymentDate || status === "Paid") && (
                          <option value="Paid">Paid (Lunas Terbayar)</option>
                        )}
                        <option value="Cancelled">Cancelled (Dibatalkan)</option>
                      </select>
                    ) : (
                      <div className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-950 border border-slate-200/50 dark:border-slate-850 text-slate-650 dark:text-slate-400 text-xs font-bold rounded-xl">
                        {status === "Draft" ? "📝 Draft (Penyuntingan / Belum Diajukan)" : `⏳ ${status === "Submitted" ? "Pengajuan ke Manager" : status} (Menunggu Verifikasi)`}
                      </div>
                    )}
                  </div>

                  {/* Kirim / Bayar Date Pickers (HQ Only or Paid Status) */}
                  {isHQ && status !== "Draft" && (
                    <div className="grid grid-cols-2 gap-3 p-3 bg-indigo-50/20 dark:bg-indigo-950/10 border border-indigo-100/30 dark:border-indigo-900/40 rounded-xl">
                      <div>
                        <label className="block text-[9px] text-slate-400 font-bold uppercase mb-1">Tgl Dikirim</label>
                        <input
                          type="date"
                          value={tanggalKirim}
                          onChange={e => setTanggalKirim(e.target.value)}
                          className="w-full p-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs dark:text-slate-100"
                        />
                      </div>
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <label className="block text-[9px] text-slate-400 font-bold uppercase">Tgl Bayar</label>
                          {!canInputPaymentDate && (
                            <span className="text-[8px] text-red-500 font-bold lowercase tracking-normal">🔒 khusus finance</span>
                          )}
                        </div>
                        <input
                          type="date"
                          value={tanggalBayar}
                          disabled={status !== "Paid" || !canInputPaymentDate}
                          onChange={e => setTanggalBayar(e.target.value)}
                          className="w-full p-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs dark:text-slate-100 disabled:opacity-45"
                        />
                      </div>
                    </div>
                  )}

                  {/* Actions Bar inside Form */}
                  <div className="pt-2 flex flex-col gap-2">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setIsAddNew(false);
                          setIsEditing(false);
                        }}
                        className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl transition-all cursor-pointer text-center"
                      >
                        Batal
                      </button>
                      
                      <button
                        type="submit"
                        disabled={isSaving}
                        className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold rounded-xl transition-all shadow-sm focus:outline-none cursor-pointer"
                      >
                        {isSaving ? "Menyimpan..." : (isHQ ? "Simpan Perubahan" : "Simpan Draft")}
                      </button>
                    </div>

                    {/* Quick submit trigger for Supervisor */}
                    {!isHQ && (isAddNew || (isEditing && status === "Draft")) && (
                      <button
                        type="button"
                        disabled={isSaving}
                        onClick={(e) => handleSave(e, true)}
                        className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <span>🚀 Simpan & Ajukan ke Manager</span>
                      </button>
                    )}
                  </div>
                </form>
              </motion.div>
            ) : selectedBill ? (
              
              /* 2. Record Detailed View Mode (Right-hand Column panel) */
              <motion.div
                key="billing-detail"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="space-y-5 animate-in fade-in"
              >
                {/* Header */}
                <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className={`p-1.5 rounded-lg ${
                      selectedBill.type === "KSO"
                        ? "bg-blue-100 text-blue-600 dark:bg-blue-950/40"
                        : "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40"
                    }`}>
                      {selectedBill.type === "KSO" ? <Receipt className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                    </span>
                    <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-xs font-sans uppercase tracking-wider">
                      Detail Tagihan {selectedBill.type}
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedBillId(null)}
                    className="px-3 py-1.5 bg-slate-105 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-705 dark:text-slate-300 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 border border-slate-205/50 dark:border-slate-750"
                    title="Kembali ke Daftar"
                  >
                    <ChevronLeft className="w-4 h-4 shrink-0" />
                    <span>Kembali</span>
                  </button>
                </div>

                {/* 🛡️ REVISION COMMENT ALERT IN DETAILED VIEW */}
                {selectedBill.status === "Draft" && selectedBill.revisionNotes && (
                  <div className="p-3.5 bg-rose-50 dark:bg-rose-950/20 border border-rose-200/50 dark:border-rose-900/40 text-rose-800 dark:text-rose-450 text-xs rounded-xl flex items-start gap-2.5 animate-pulse-once">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
                    <div>
                      <p className="font-extrabold text-[11px] uppercase tracking-wide">📢 TANGGAPAN PERBAIKAN MANAGER</p>
                      <p className="mt-1 leading-relaxed text-slate-705 dark:text-slate-350 bg-white/70 dark:bg-slate-950/45 p-2.5 rounded-lg border border-rose-100/40 font-semibold italic">
                        "{selectedBill.revisionNotes}"
                      </p>
                    </div>
                  </div>
                )}

                {/* ℹ️ WORKFLOW GUIDE FOR DRAFT STATUS */}
                {selectedBill.status === "Draft" && (
                  <div className="p-3 bg-amber-50 dark:bg-amber-955/20 border border-amber-200/50 dark:border-amber-900/40 text-[11px] rounded-xl flex items-start gap-2.5 text-slate-700 dark:text-slate-300">
                    <Info className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-extrabold uppercase tracking-wider text-amber-800 dark:text-amber-400">📢 LANGKAH WORKFLOW PENAGIHAN</p>
                      <p className="mt-1 leading-relaxed">
                        Data ini masih berstatus <strong>Draft</strong>. 
                        {currentUser?.role === "Manager" || currentUser?.role === "Administrator" ? (
                          <span> Sebagai <strong>Manager/Admin</strong>, Anda dapat mengeklik tombol <strong>Edit Catatan</strong> di bawah untuk langsung mengubah statusnya, atau minta Supervisor mengajukannya agar masuk ke antrean verifikasi Anda.</span>
                        ) : (
                          <span> Silakan cek data lalu klik tombol <strong>🚀 Ajukan ke Manager untuk Verifikasi</strong> di bawah agar dapat diverifikasi oleh Manager Kantor Pusat.</span>
                        )}
                      </p>
                    </div>
                  </div>
                )}

                {/* ℹ️ WORKFLOW GUIDE FOR SUBMITTED STATUS */}
                {selectedBill.status === "Submitted" && (
                  <div className="p-3 bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-200/50 dark:border-indigo-900/40 text-[11px] rounded-xl flex items-start gap-2.5 text-slate-700 dark:text-slate-300 animate-pulse-once">
                    <Info className="w-4 h-4 text-indigo-505 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-extrabold uppercase tracking-wider text-indigo-800 dark:text-indigo-400">📥 ANTRIAN VERIFIKASI MANAGER</p>
                      <p className="mt-1 leading-relaxed">
                        Tagihan ini telah diajukan ke Kantor Pusat. 
                        {canVerify ? (
                          <span> Klik tombol <strong>Verifikasi (Approve)</strong> untuk menyetujui, atau <strong>Revisi (Tolak)</strong> untuk mengembalikan ke Draft disertai catatan instruksi.</span>
                        ) : (
                          <span> Sedang menunggu peninjauan dan verifikasi dari <strong>Manager Kantor Pusat</strong>.</span>
                        )}
                      </p>
                    </div>
                  </div>
                )}

                {/* Main Interactive Status Bar */}
                <div className={`p-3.5 rounded-xl border flex flex-col gap-2.5 ${
                  selectedBill.status === "Paid"
                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-900 dark:text-emerald-400"
                    : selectedBill.status === "Verified"
                    ? "bg-indigo-500/10 border-indigo-500/20 text-indigo-900 dark:text-indigo-400"
                    : selectedBill.status === "Submitted"
                    ? "bg-blue-500/10 border-blue-500/20 text-blue-900 dark:text-blue-400"
                    : selectedBill.status === "Cancelled"
                    ? "bg-rose-500/10 border-rose-500/20 text-rose-800 dark:text-rose-450"
                    : "bg-slate-100 border-slate-200 text-slate-700 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-400"
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-extrabold">
                      <span className={`w-2.5 h-2.5 rounded-full ${
                        selectedBill.status === "Paid"
                          ? "bg-emerald-500"
                          : selectedBill.status === "Verified"
                          ? "bg-indigo-500"
                          : selectedBill.status === "Submitted"
                          ? "bg-blue-500"
                          : selectedBill.status === "Cancelled"
                          ? "bg-rose-500"
                          : "bg-slate-400"
                      }`} />
                      <span>
                        STATUS: {selectedBill.status === "Paid" ? "LUNAS (PAID)" : selectedBill.status === "Verified" ? "TERVERIFIKASI (VERIFIED)" : selectedBill.status === "Submitted" ? "PENGAJUAN KE MANAGER" : selectedBill.status === "Cancelled" ? "BATAL" : "DRAFT"}
                      </span>
                    </div>
                    {selectedBill.status === "Verified" && <ShieldCheck className="w-5 h-5 text-indigo-500 shrink-0" />}
                    {selectedBill.status === "Paid" && <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />}
                  </div>

                  {/* Submission Audit logger detail */}
                  {selectedBill.submittedBy && (
                    <div className="text-[10px] text-slate-500 border-t border-slate-100 dark:border-slate-850 pt-1.5 font-medium flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <History className="w-3.5 h-3.5" />
                        <span>Diajukan oleh {selectedBill.submittedBy}</span>
                      </span>
                      <span>{selectedBill.submittedAt ? new Date(selectedBill.submittedAt).toLocaleDateString("id-ID") : "-"}</span>
                    </div>
                  )}

                  {selectedBill.verifiedBy && (
                    <div className="text-[10px] text-slate-500 pt-1 font-medium flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Diverifikasi oleh {selectedBill.verifiedBy}</span>
                      </span>
                      <span>{selectedBill.verifiedAt ? new Date(selectedBill.verifiedAt).toLocaleDateString("id-ID") : "-"}</span>
                    </div>
                  )}
                </div>

                {/* 💼 ALUR KERJA VISUAL / STEPPED FLOW TIMELINE */}
                <div className="bg-slate-50/65 dark:bg-slate-950 border border-slate-150/15 dark:border-slate-850 rounded-2xl p-4.5 space-y-3.5">
                  <span className="block text-[10px] text-slate-400 font-extrabold uppercase tracking-widest">📋 ALUR PROSES VERIFIKASI</span>
                  <div className="relative pl-6.5 space-y-4">
                    {/* Running Line background */}
                    <div className="absolute left-2.5 top-1.5 bottom-1.5 w-[1.5px] bg-slate-200 dark:bg-slate-800" />

                    {/* Step 1: Draft */}
                    <div className="relative">
                      <div className={`absolute -left-[23px] top-0.5 w-[13px] h-[13px] rounded-full border border-white dark:border-slate-900 flex items-center justify-center ${
                        selectedBill.status === "Draft" 
                          ? "bg-amber-500 ring-4 ring-amber-500/15 scale-110" 
                          : "bg-emerald-500"
                      }`} />
                      <div>
                        <p className="text-[11px] font-extrabold text-slate-800 dark:text-slate-200 leading-none">Draft Penagihan</p>
                        <p className="text-[9px] text-slate-450 mt-0.5">Dibuat oleh {selectedBill.createdBy || "Supervisor"} • {new Date(selectedBill.createdAt).toLocaleDateString("id-ID")}</p>
                      </div>
                    </div>

                    {/* Step 2: Submitted */}
                    <div className="relative">
                      <div className={`absolute -left-[23px] top-0.5 w-[13px] h-[13px] rounded-full border border-white dark:border-slate-900 flex items-center justify-center ${
                        selectedBill.status === "Submitted"
                          ? "bg-indigo-500 ring-4 ring-indigo-500/15 scale-110"
                          : selectedBill.status === "Verified" || selectedBill.status === "Paid"
                          ? "bg-emerald-500"
                          : "bg-slate-300 dark:bg-slate-800"
                      }`} />
                      <div>
                        <p className="text-[11px] font-extrabold text-slate-800 dark:text-slate-200 leading-none">Pengajuan Manager</p>
                        {selectedBill.submittedBy ? (
                          <p className="text-[9px] text-slate-455 mt-0.5">Diajukan oleh {selectedBill.submittedBy} • {selectedBill.submittedAt ? new Date(selectedBill.submittedAt).toLocaleDateString("id-ID") : "-"}</p>
                        ) : (
                          <p className="text-[9px] text-slate-400 mt-0.5">Menunggu pengajuan dari site</p>
                        )}
                      </div>
                    </div>

                    {/* Step 3: Verified */}
                    <div className="relative">
                      <div className={`absolute -left-[23px] top-0.5 w-[13px] h-[13px] rounded-full border border-white dark:border-slate-900 flex items-center justify-center ${
                        selectedBill.status === "Verified"
                          ? "bg-indigo-605 ring-4 ring-indigo-605/15 scale-110"
                          : selectedBill.status === "Paid"
                          ? "bg-emerald-500"
                          : "bg-slate-300 dark:bg-slate-800"
                      }`} />
                      <div>
                        <p className="text-[11px] font-extrabold text-slate-800 dark:text-slate-200 leading-none">Diverifikasi & Approve</p>
                        {selectedBill.verifiedBy ? (
                          <p className="text-[9px] text-slate-455 mt-0.5">Disetujui oleh {selectedBill.verifiedBy} • {selectedBill.verifiedAt ? new Date(selectedBill.verifiedAt).toLocaleDateString("id-ID") : "-"}</p>
                        ) : (
                          <p className="text-[9px] text-slate-440 mt-0.5">Menunggu verifikasi Manager HQ</p>
                        )}
                      </div>
                    </div>

                    {/* Step 4: Paid */}
                    <div className="relative">
                      <div className={`absolute -left-[23px] top-0.5 w-[13px] h-[13px] rounded-full border border-white dark:border-slate-900 flex items-center justify-center ${
                        selectedBill.status === "Paid"
                          ? "bg-emerald-500 ring-4 ring-emerald-500/15 scale-110"
                          : "bg-slate-300 dark:bg-slate-800"
                      }`} />
                      <div>
                        <p className="text-[11px] font-extrabold text-slate-800 dark:text-slate-200 leading-none">Pembayaran Lunas (Paid)</p>
                        {selectedBill.status === "Paid" ? (
                          <p className="text-[9px] text-emerald-600 dark:text-emerald-400 mt-0.5 font-bold">Diterima bayar tanggal: {selectedBill.tanggalBayar ? new Date(selectedBill.tanggalBayar).toLocaleDateString("id-ID") : "-"}</p>
                        ) : (
                          <p className="text-[9px] text-slate-400 mt-0.5">Menunggu konfirmasi pelunasan</p>
                        )}
                      </div>
                    </div>

                  </div>
                </div>

                {/* Amount Summary List */}
                <div className="bg-slate-50 dark:bg-slate-950 rounded-2xl p-4 border border-slate-150/15 dark:border-slate-850 space-y-2 font-sans">
                  <div className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider mb-1">Rincian Perhitungan DPP & PPN</div>
                  
                  <div className="flex justify-between items-center text-xs text-slate-500">
                    <span>Nilai Pokok / DPP:</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-350">{formatIDR(selectedBill.serviceAmount)}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs text-slate-500">
                    <span>Pajak PPN ({selectedBill.ppnPercent}%):</span>
                    <span className="font-mono font-bold text-rose-500">+{formatIDR(selectedBill.ppnAmount)}</span>
                  </div>
                  
                  <div className="flex justify-between items-center text-sm font-extrabold text-slate-900 dark:text-slate-100 pt-2 border-t border-slate-200/50 dark:border-slate-800">
                    <span>Total Tagihan:</span>
                    <span className="font-mono text-indigo-600 dark:text-indigo-400">{formatIDR(selectedBill.totalAmount)}</span>
                  </div>
                </div>

                {/* Metadata details list */}
                <div className="space-y-3.5 text-xs text-slate-600 dark:text-slate-350">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="block text-[10px] text-slate-400 font-extrabold uppercase tracking-wide">🏥 Site Client RS</span>
                      <span className="font-extrabold text-slate-805 dark:text-slate-200 mt-1 block">{selectedBill.clientRS}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-slate-400 font-extrabold uppercase tracking-wide">🗓️ Bulan Pelayanan</span>
                      <span className="font-extrabold text-slate-805 dark:text-slate-200 mt-1 block">{formatPeriod(selectedBill.periodMonth)}</span>
                    </div>
                  </div>

                  {selectedBill.tanggalKirim ? (
                    <div className="grid grid-cols-2 gap-4 pt-1 border-t border-slate-50 dark:border-slate-850">
                      <div>
                        <span className="block text-[10px] text-slate-400 font-extrabold uppercase tracking-wide">📅 Tanggal Kirim</span>
                        <span className="font-semibold block text-slate-705 dark:text-slate-300">{selectedBill.tanggalKirim}</span>
                      </div>
                      {selectedBill.status === "Paid" ? (
                        <div>
                          <span className="block text-[10px] text-slate-400 font-extrabold uppercase tracking-wide">💸 Tanggal Bayar</span>
                          <span className="font-extrabold text-emerald-600 dark:text-emerald-450 block">{selectedBill.tanggalBayar || "-"}</span>
                        </div>
                      ) : (
                        <div>
                          <span className="block text-[10px] text-slate-400 font-extrabold uppercase tracking-wide">💸 Tanggal Bayar</span>
                          <span className="font-normal text-slate-400 dark:text-slate-500 italic block">Menunggu Lunas</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    selectedBill.status === "Draft" && (
                      <div className="text-[11px] text-slate-500 dark:text-slate-450 bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                        📌 <b>Info Penginputan:</b> Tanggal kirim & tanggal bayar akan diinput oleh <b>Manager / Kantor Pusat (HQ)</b> saat status diubah menjadi <b>Lunas (Paid)</b>.
                      </div>
                    )
                  )}

                  {/* ACTIVE VIEWABLE ATTACHMENTS (Berita Acara & Rekap) */}
                  <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-850">
                    <span className="block text-[10px] text-slate-400 font-extrabold uppercase tracking-wide">📂 Berkas Lampiran Terunggah</span>
                    <div className="grid grid-cols-1 gap-2">
                      
                      {/* Berita Acara (BA) Card */}
                      {selectedBill.attachmentBeritaAcara ? (
                        <div className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
                          <div className="flex items-center gap-2 truncate pr-2">
                            <FileText className="w-4 h-4 text-blue-500 shrink-0" />
                            <div className="truncate">
                              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider leading-none">Berita Acara (BA)</p>
                              <p className="text-[11px] font-extrabold text-slate-700 dark:text-slate-200 truncate mt-0.5" title={selectedBill.attachmentBeritaAcaraName}>
                                {selectedBill.attachmentBeritaAcaraName || "ba_dokumen.pdf"}
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => downloadAttachmentFile(selectedBill.attachmentBeritaAcara!, selectedBill.attachmentBeritaAcaraName || "ba_dokumen.pdf")}
                            className="p-1.5 bg-white hover:bg-blue-50 hover:text-blue-600 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 rounded-lg cursor-pointer transition-all shrink-0"
                            title="Download BA file"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="p-2.5 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-center gap-1.5 text-[11px] text-slate-400 italic">
                          <AlertTriangle className="w-3.5 h-3.5 text-slate-400" />
                          <span>Berita Acara belum dilampirkan.</span>
                        </div>
                      )}

                      {/* Rekap Tagihan Card */}
                      {selectedBill.attachmentRekapTagihan ? (
                        <div className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
                          <div className="flex items-center gap-2 truncate pr-2">
                            <FileSpreadsheet className="w-4 h-4 text-emerald-500 shrink-0" />
                            <div className="truncate">
                              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider leading-none">Rekap Tagihan</p>
                              <p className="text-[11px] font-extrabold text-slate-700 dark:text-slate-200 truncate mt-0.5" title={selectedBill.attachmentRekapTagihanName}>
                                {selectedBill.attachmentRekapTagihanName || "rekap_tagihan.xlsx"}
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => downloadAttachmentFile(selectedBill.attachmentRekapTagihan!, selectedBill.attachmentRekapTagihanName || "rekap_tagihan.xlsx")}
                            className="p-1.5 bg-white hover:bg-emerald-50 hover:text-emerald-600 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 rounded-lg cursor-pointer transition-all shrink-0"
                            title="Download rekap tagihan"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="p-2.5 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-center gap-1.5 text-[11px] text-slate-400 italic font-medium">
                          <AlertTriangle className="w-3.5 h-3.5 text-slate-400" />
                          <span>Rekapitulasi tagihan belum dilampirkan.</span>
                        </div>
                      )}

                    </div>
                  </div>

                  {/* Description segment */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                    <span className="block text-[10px] text-slate-400 font-extrabold uppercase tracking-wide">📝 Deskripsi / Uraian Rincian</span>
                    <p className="mt-1.5 p-3 bg-slate-50/65 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-850 leading-relaxed text-slate-750 dark:text-slate-300 font-sans whitespace-pre-wrap">
                      {selectedBill.description || "Tidak ada deskripsi tambahan."}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-810 flex items-center justify-between text-[10px] text-slate-400 font-bold">
                    <span>Invoice ID: #{selectedBill.id}</span>
                    <span>Input: {selectedBill.createdBy || "Supervisor"}</span>
                  </div>
                </div>

                {/* 
                  INTERACTIVE WORKFLOW CONTROLS: Submit, Verify Reject, Or Print 
                */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                  
                  {/* Supervisor: Draft -> Submit (Diajukan) Action */}
                  {selectedBill.status === "Draft" && canCreate && (
                    <button
                      type="button"
                      onClick={() => handleDirectSubmitToManager(selectedBill)}
                      className="w-full flex items-center justify-center gap-2 p-3 bg-indigo-600 hover:bg-indigo-700 active:scale-97 text-white text-xs font-extrabold rounded-xl shadow-xs cursor-pointer transition-all"
                    >
                      <span>🚀 Ajukan ke Manager untuk Verifikasi</span>
                    </button>
                  )}

                  {/* Manager: Submitted -> Verified / Reject Revision Actions */}
                  {selectedBill.status === "Submitted" && canVerify && (
                    <div className="grid grid-cols-2 gap-2.5">
                      <button
                        type="button"
                        onClick={() => handleManagerApprove(selectedBill)}
                        className="flex items-center justify-center gap-1.5 p-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold rounded-xl cursor-pointer transition-all shadow-sm"
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>Verifikasi (Approve)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleManagerReject(selectedBill)}
                        className="flex items-center justify-center gap-1.5 p-3 bg-red-100 hover:bg-red-200 text-red-700 text-xs font-extrabold rounded-xl cursor-pointer transition-all"
                      >
                        <RotateCcw className="w-4 h-4" />
                        <span>Revisi (Tolak)</span>
                      </button>
                    </div>
                  )}

                  {/* Print Invoice Button (Render if Verified or Paid) */}
                  {(selectedBill.status === "Verified" || selectedBill.status === "Paid") && (
                    <button
                      type="button"
                      onClick={() => setPrintBill(selectedBill)}
                      className="w-full flex items-center justify-center gap-2 p-3 bg-teal-600 hover:bg-teal-700 active:scale-97 text-white text-xs font-extrabold rounded-xl transition-all shadow-xs cursor-pointer"
                    >
                      <Printer className="w-4 h-4" />
                      <span>🖨️ Cetak Invoice & BA Kantor Pusat</span>
                    </button>
                  )}

                  {/* Finance Manager: Verified -> Paid Action */}
                  {selectedBill.status === "Verified" && canInputPaymentDate && (
                    <button
                      type="button"
                      onClick={() => handleRecordPayment(selectedBill)}
                      className="w-full flex items-center justify-center gap-2 p-3 bg-emerald-600 hover:bg-emerald-700 active:scale-97 text-white text-xs font-extrabold rounded-xl shadow-md cursor-pointer transition-all"
                    >
                      <Receipt className="w-4 h-4" />
                      <span>💸 Tandai Lunas & Input Tgl Bayar</span>
                    </button>
                  )}

                  {/* Informational state when waiting for Finance Manager */}
                  {selectedBill.status === "Verified" && !canInputPaymentDate && (
                    <div className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center gap-2.5 text-[11px] text-slate-500 font-medium">
                      <Clock className="w-4 h-4 text-amber-500 animate-pulse shrink-0" />
                      <span>Menunggu pencatatan tanggal bayar (Lunas) oleh <strong>Manager Keuangan</strong>.</span>
                    </div>
                  )}

                  {/* Edit Draft Actions for Creators */}
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    {((selectedBill.status === "Draft" || isHQ) && canEditBill(selectedBill)) && (
                      <button
                        type="button"
                        onClick={() => handleEditClick(selectedBill)}
                        className="flex items-center justify-center gap-2 p-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs font-bold rounded-xl transition-all cursor-pointer"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        <span>Edit Catatan</span>
                      </button>
                    )}
                    {((selectedBill.status === "Draft" || isHQ) && canDeleteBill(selectedBill)) && (
                      <button
                        type="button"
                        onClick={() => handleDelete(selectedBill.id)}
                        className="flex items-center justify-center gap-2 p-2.5 bg-red-50 hover:bg-red-100 dark:bg-red-955/30 text-red-650 dark:text-red-400 text-xs font-bold rounded-xl transition-all cursor-pointer col-start-2"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Hapus Catatan</span>
                      </button>
                    )}
                  </div>

                </div>

              </motion.div>
            ) : (
              
              /* 3. Empty Selection display guidelines */
              <motion.div
                key="billing-empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-10 space-y-3"
              >
                <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-950/25 text-indigo-500 rounded-full flex items-center justify-center mx-auto">
                  <Receipt className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-800 dark:text-slate-200 text-xs font-sans uppercase tracking-wider">
                    Detail Catatan Tagihan
                  </h4>
                  <p className="text-[11px] text-slate-450 dark:text-slate-500 mt-1 max-w-[200px] mx-auto leading-relaxed">
                    Klik salah satu baris di tabel sebelah kiri untuk memunculkan detail penagihan, status pengajuan, lampiran Berita Acara dan rekap spreadsheet.
                  </p>
                </div>
                
                {canCreate && (
                  <button
                    type="button"
                    onClick={handleAddNewClick}
                    className="inline-flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-extrabold cursor-pointer pt-2"
                  >
                    <span>Buat penagihan baru sekarang</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                )}
              </motion.div>
            )}

          </AnimatePresence>
        </div>

      </div>

      {/* ========================================================= */}
      {/* CUSTOM NON-BLOCKING WORKFLOW MODAL DIALOG (No-Iframe-bug) */}
      {/* ========================================================= */}
      <AnimatePresence>
        {workflowModal.isOpen && workflowModal.bill && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md shadow-2xl p-6 relative overflow-hidden"
            >
              {/* Header Icon */}
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-full shrink-0 ${
                  workflowModal.type === "reject"
                    ? "bg-red-50 dark:bg-red-950/45 text-red-650 dark:text-red-400"
                    : workflowModal.type === "delete"
                    ? "bg-rose-50 dark:bg-rose-950/45 text-rose-600"
                    : workflowModal.type === "pay"
                    ? "bg-emerald-50 dark:bg-emerald-950/45 text-emerald-600"
                    : "bg-indigo-50 dark:bg-indigo-950/45 text-indigo-600 dark:text-indigo-400"
                }`}>
                  {workflowModal.type === "reject" ? (
                    <RotateCcw className="w-6 h-6" />
                  ) : workflowModal.type === "delete" ? (
                    <Trash2 className="w-6 h-6" />
                  ) : workflowModal.type === "submit" ? (
                    <UploadCloud className="w-6 h-6" />
                  ) : workflowModal.type === "pay" ? (
                    <Receipt className="w-6 h-6" />
                  ) : (
                    <CheckCircle className="w-6 h-6" />
                  )}
                </div>

                <div className="space-y-1.5 flex-1">
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 uppercase tracking-wide">
                    {workflowModal.type === "submit" && "🚀 AJUKAN DATA PENAGIHAN"}
                    {workflowModal.type === "approve" && "✅ VERIFIKASI & SETUJUI TAGIHAN"}
                    {workflowModal.type === "reject" && "📝 REVISI / TOLAK TAGIHAN"}
                    {workflowModal.type === "pay" && "💸 CATAT PELUNASAN (PAID)"}
                    {workflowModal.type === "delete" && "🔥 HAPUS CATATAN TAGIHAN"}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    {workflowModal.type === "submit" && "Apakah Anda yakin ingin memajukan data tagihan ini ke Manager Kantor Pusat untuk diverifikasi? Status akan terkunci dan siap direview."}
                    {workflowModal.type === "approve" && "Apakah Anda yakin ingin melakukan approval / verifikasi pada data tagihan ini? Status akan berganti menjadi Verified & siap cetak invoice resmi."}
                    {workflowModal.type === "reject" && "Silakan berikan catatan instruksi revisi sejelas-jelasnya agar personil terkait dapat segera merespon dan meralat draft ini."}
                    {workflowModal.type === "pay" && "Sebagai Manager Keuangan Kantor Pusat, silakan input tanggal bayar pembayaran yang diterima dari rumah sakit untuk menyelesaikan siklus billing."}
                    {workflowModal.type === "delete" && "Aksi ini bersifat permanen dan data tagihan terpilih akan dihapus sepenuhnya dari database. Lanjutkan?"}
                  </p>
                </div>
              </div>

              {/* Specific Content for Rejections (Instruction Textarea) */}
              {workflowModal.type === "reject" && (
                <div className="mt-4 space-y-1.5">
                  <label className="block text-[10px] uppercase font-extrabold tracking-wider text-slate-400">
                    Instruksi Catatan Revisi *
                  </label>
                  <textarea
                    rows={4}
                    value={workflowModal.rejectReason}
                    onChange={(e) => setWorkflowModal(p => ({ ...p, rejectReason: e.target.value }))}
                    placeholder="Contoh: Ralat lampiran Berita Acara karena rincian DPP kurang sinkron dengan BA..."
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs dark:text-slate-100 focus:outline-hidden focus:border-red-400 leading-relaxed font-sans"
                  />
                </div>
              )}

              {/* Specific Content for Payment Date Input (Finance Manager Only) */}
              {workflowModal.type === "pay" && (
                <div className="mt-4 space-y-2 p-3.5 bg-emerald-50/40 dark:bg-emerald-950/15 border border-emerald-100/30 rounded-xl">
                  <label className="block text-[10px] uppercase font-extrabold tracking-wider text-emerald-800 dark:text-emerald-400">
                    Tanggal Bayar (Tanggal Pelunasan) *
                  </label>
                  <input
                    type="date"
                    required
                    value={workflowModal.paymentDate}
                    onChange={(e) => setWorkflowModal(p => ({ ...p, paymentDate: e.target.value }))}
                    className="w-full p-2.5 bg-white dark:bg-slate-950 border border-emerald-200 dark:border-emerald-800 rounded-lg text-xs dark:text-slate-100 focus:outline-hidden focus:border-emerald-500 font-sans font-bold"
                  />
                  <p className="text-[9.5px] text-slate-550 leading-normal">
                    Pemberitahuan: Status penagihan akan berubah menjadi <span className="text-emerald-600 font-extrabold uppercase">PAID (LUNAS)</span> dan Tanggal Pembayaran akan tercatat secara resmi.
                  </p>
                </div>
              )}

              {/* Bill brief overview */}
              <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-955/40 rounded-xl border border-slate-100 dark:border-slate-850 text-[11px] text-slate-600 dark:text-slate-400 space-y-1">
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-400">Site RS:</span>
                  <span className="font-extrabold text-slate-700 dark:text-slate-300">{workflowModal.bill.clientRS}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-400">Total Tagihan:</span>
                  <span className="font-mono font-extrabold text-indigo-600 dark:text-indigo-400">{formatIDR(workflowModal.bill.totalAmount)}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-5 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setWorkflowModal({ isOpen: false, type: null, bill: null, rejectReason: "", paymentDate: new Date().toISOString().slice(0, 10) })}
                  className="px-4 py-2 text-xs font-extrabold text-slate-500 hover:text-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl cursor-pointer transition-all border border-slate-200 dark:border-slate-800"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={handleConfirmWorkflow}
                  className={`px-4 py-2 text-xs font-black text-white rounded-xl transition-all shadow-sm cursor-pointer flex items-center gap-1.5 ${
                    workflowModal.type === "reject"
                      ? "bg-red-600 hover:bg-red-700"
                      : workflowModal.type === "delete"
                      ? "bg-rose-600 hover:bg-rose-700"
                      : workflowModal.type === "pay"
                      ? "bg-emerald-600 hover:bg-emerald-700"
                      : "bg-indigo-600 hover:bg-indigo-700"
                  }`}
                >
                  {isSaving ? "Memproses..." : "Ya, Lanjutkan"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
