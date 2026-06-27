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
  Upload,
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
import { api } from "../lib/api";

// Spell numbers in Indonesian language helper (e.g. 15000000 -> Lima Belas Juta Rupiah)
function terbilang(nominal: number): string {
  const num = Math.floor(Number(nominal || 0));
  if (isNaN(num) || num <= 0) return "Nol";

  const bilangan = [
    "", "Satu", "Dua", "Tiga", "Empat", "Lima", "Enam", "Tujuh", "Delapan", "Sembilan", "Sepuluh", "Sebelas"
  ];
  let hasil = "";
  if (num < 12) {
    hasil = bilangan[num] || "";
  } else if (num < 20) {
    hasil = terbilang(num - 10) + " Belas";
  } else if (num < 100) {
    hasil = terbilang(Math.floor(num / 10)) + " Puluh " + terbilang(num % 10);
  } else if (num < 200) {
    hasil = "Seratus " + terbilang(num - 100);
  } else if (num < 1000) {
    hasil = terbilang(Math.floor(num / 100)) + " Ratus " + terbilang(num % 100);
  } else if (num < 2000) {
    hasil = "Seribu " + terbilang(num - 1000);
  } else if (num < 1000000) {
    hasil = terbilang(Math.floor(num / 1000)) + " Ribu " + terbilang(num % 1000);
  } else if (num < 1000000000) {
    hasil = terbilang(Math.floor(num / 1000000)) + " Juta " + terbilang(num % 1000000);
  } else if (num < 1000000000000) {
    hasil = terbilang(Math.floor(num / 1000000000)) + " Milyar " + terbilang(num % 1000000000);
  } else {
    return "Jumlah Sangat Besar";
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
  subRouteParam?: string | null;
  onSubRouteUpdate?: (param: string | null) => void;
}

export default function BillingKSOView({
  billings = [],
  clients = [],
  currentUser,
  onAddBilling,
  onUpdateBilling,
  onDeleteBilling,
  subRouteParam,
  onSubRouteUpdate
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

  // Sync subRouteParam with selectedBillId
  useEffect(() => {
    if (subRouteParam) {
      if (selectedBillId !== subRouteParam) {
        setSelectedBillId(subRouteParam);
      }
    } else {
      if (selectedBillId) {
        setSelectedBillId(null);
      }
    }
  }, [subRouteParam]);

  useEffect(() => {
    if (onSubRouteUpdate && subRouteParam !== selectedBillId) {
      onSubRouteUpdate(selectedBillId);
    }
  }, [selectedBillId]);
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
  const [rekapCounter, setRekapCounter] = useState<string>("");
  const [rekapSuffix, setRekapSuffix] = useState<string>("");
  const [namaPengurang, setNamaPengurang] = useState<string>("");

  // Signature field states
  const [namaDirektur, setNamaDirektur] = useState<string>("");
  const [nipDirektur, setNipDirektur] = useState<string>("");
  const [jabatanDirektur, setJabatanDirektur] = useState<string>("Direktur");
  const [namaSiteCoordinator, setNamaSiteCoordinator] = useState<string>("");
  const [jabatanSiteCoordinator, setJabatanSiteCoordinator] = useState<string>("Site Coordinator");
  const [namaPerusahaanSite, setNamaPerusahaanSite] = useState<string>("PT. Medika KSO Indonesia");
  const [companyProfile, setCompanyProfile] = useState<any>(null);

  // Helper to count / calculate next auto increment 3-character rekap code
  const getNextAutoCounter = () => {
    let maxVal = 0;
    billings.forEach(b => {
      if (b.noRekap) {
        const match = b.noRekap.match(/^(\d{3})/);
        if (match) {
          const num = parseInt(match[1], 10);
          if (num > maxVal) {
            maxVal = num;
          }
        }
      }
    });
    return (maxVal + 1).toString().padStart(3, '0');
  };

  // Detailed KSO states
  const [isDetailedKSO, setIsDetailedKSO] = useState(false);
  const [tunaiItems, setTunaiItems] = useState<{ id: string; name: string; value: number; admin?: number }[]>([]);
  const [bpjsItems, setBpjsItems] = useState<{ id: string; name: string; value: number; admin?: number }[]>([]);
  const [asuransiItems, setAsuransiItems] = useState<{ id: string; name: string; value: number; admin?: number }[]>([]);
  const [pengurang, setPengurang] = useState<number>(0);
  const [pengurangItems, setPengurangItems] = useState<{ id: string; name: string; value: number }[]>([]);
  const [sharePercent, setSharePercent] = useState<number>(100);
  const [taxTreatment, setTaxTreatment] = useState<"inklusif" | "eksklusif">("inklusif");

  const addTunaiItem = () => {
    setTunaiItems([...tunaiItems, { id: `t-${Date.now()}`, name: "", value: 0, admin: 0 }]);
  };
  const addBpjsItem = () => {
    setBpjsItems([...bpjsItems, { id: `b-${Date.now()}`, name: "", value: 0, admin: 0 }]);
  };
  const addAsuransiItem = () => {
    setAsuransiItems([...asuransiItems, { id: `a-${Date.now()}`, name: "", value: 0, admin: 0 }]);
  };
  const addPengurangItem = () => {
    setPengurangItems([...pengurangItems, { id: `p-${Date.now()}`, name: "", value: 0 }]);
  };

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
  const [printLayout, setPrintLayout] = useState<"invoice" | "rekap">("invoice");

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
  
  // Site Coordinators, Managers, and Admins can create and submit data
  const canCreate = currentUser?.role === "Administrator" || 
                    currentUser?.role === "Developer" || 
                    currentUser?.role === "Manager" ||
                    currentUser?.role === "Manager Keuangan" ||
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
    // Other users, including Managers and Site Coordinators,
    // can ONLY edit billing entries they set up themselves.
    const creator = bill.createdBy || "Site Coordinator";
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
    // Other users, including Managers and Site Coordinators,
    // can ONLY delete entries they set up themselves.
    const creator = bill.createdBy || "Site Coordinator";
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

  // Load company profile dynamically
  useEffect(() => {
    const loadCompany = async () => {
      try {
        const cp = await api.getCompanyProfile();
        if (cp) {
          setCompanyProfile(cp);
          if (cp.nama) {
            setNamaPerusahaanSite(cp.nama);
          }
        }
      } catch (err) {
        console.error("Gagal memuat profil perusahaan di billing:", err);
      }
    };
    loadCompany();
    window.addEventListener("companyProfileUpdated", loadCompany);
    return () => {
      window.removeEventListener("companyProfileUpdated", loadCompany);
    };
  }, []);

  // Pre-fill or pre-select clients based on site restrictions
  useEffect(() => {
    if (hasSiteRestriction) {
      setClientRS(userSite);
    } else if (clients.length > 0 && !clientRS) {
      setClientRS(clients[0].namaRS);
    }
  }, [hasSiteRestriction, userSite, clients]);

  // Synchronize dynamic client parameters (Persentase KSO, active director details) when adding a brand new bill
  useEffect(() => {
    if (!selectedBillId && clientRS) {
      const foundClient = clients.find(c => c.namaRS === clientRS);
      if (foundClient) {
        // Set persentaseKSO
        if (foundClient.persentaseKSO !== undefined) {
          setSharePercent(foundClient.persentaseKSO);
        } else {
          setSharePercent(100);
        }
        
        // Find active director in the list if available, else fallback to standard client field
        const activeDir = foundClient.directors?.find(d => d.isActive);
        if (activeDir) {
          setNamaDirektur(activeDir.name);
          setNipDirektur(activeDir.nip || "");
        } else {
          const nipMatch = (foundClient.direkturRS || "").match(/(.*?)\s*\(NIP\.\s*(.*?)\)/i);
          if (nipMatch) {
            setNamaDirektur(nipMatch[1].trim());
            setNipDirektur(nipMatch[2].trim());
          } else {
            setNamaDirektur(foundClient.direkturRS || "");
            setNipDirektur(foundClient.nipDirektur || "");
          }
        }
      }
    }
  }, [clientRS, selectedBillId, clients]);

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

  const [isUploadingDetailFile, setIsUploadingDetailFile] = useState(false);

  const handleUploadDetailFileDirectly = async (e: React.ChangeEvent<HTMLInputElement>, fileType: "BA" | "Rekap") => {
    const file = e.target.files?.[0];
    if (!file || !selectedBill) return;

    if (file.size > 15 * 1024 * 1024) {
      alert("⚠️ Ukuran berkas terlalu besar! Maksimal 15MB.");
      return;
    }

    setIsUploadingDetailFile(true);
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        if (typeof reader.result === "string") {
          const payload: Partial<BillingKSO> = fileType === "BA" 
            ? { attachmentBeritaAcara: reader.result, attachmentBeritaAcaraName: file.name }
            : { attachmentRekapTagihan: reader.result, attachmentRekapTagihanName: file.name };
          
          await onUpdateBilling(selectedBill.id, payload);
          alert(`🎉 Berkas ${fileType === "BA" ? "Berita Acara / Lampiran TTD Basah" : "Rekap Tagihan"} berhasil diunggah & disimpan!`);
        }
      } catch (err: any) {
        alert("Gagal mengunggah berkas: " + err.message);
      } finally {
        setIsUploadingDetailFile(false);
      }
    };
    reader.readAsDataURL(file);
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

    // Hide Draft bills from HQ/Managers (Drafts are only visible to Site Coordinators/Creators)
    if (isHQ && b.status === "Draft") {
      return false;
    }

    // Hide Draft & Submitted bills from Finance Manager (Manager Keuangan)
    if ((currentUser?.role === "Manager Keuangan" || currentUser?.role?.toLowerCase().includes("keuangan")) && (b.status === "Submitted" || b.status === "Draft")) {
      return false;
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
      
      let textToSearch = b.description || "";
      if (textToSearch.trim().startsWith("{")) {
        try {
          const parsed = JSON.parse(textToSearch);
          if (parsed && parsed.isDetailed) {
            textToSearch = parsed.originalDescription || "Rincian Penerimaan KSO";
          }
        } catch (e) {
          // ignore
        }
      }
      const matchDesc = textToSearch.toLowerCase().includes(q);
      const matchPeriod = formatPeriod(b.periodMonth).toLowerCase().includes(q);
      return matchClient || matchDesc || matchPeriod;
    }

    return true;
  });

  // Submitted items count for verification counts badge (Manager alert)
  const submittedCount = billings.filter(b => b.status === "Submitted").length;

  // Calculating statistics for stats cards (based on accessible scoped records, hiding drafts from Managers)
  const accessibleBillings = (hasSiteRestriction 
    ? billings.filter(b => b.clientRS.toLowerCase() === userSite.toLowerCase())
    : billings)
    .filter(b => !(isHQ && b.status === "Draft"))
    .filter(b => {
      // For Manager Keuangan, exclude Draft and Submitted records from charts/metrics
      if (currentUser?.role === "Manager Keuangan" || currentUser?.role?.toLowerCase().includes("keuangan")) {
        return b.status !== "Draft" && b.status !== "Submitted";
      }
      return true;
    });

  const statsKSOBillings = accessibleBillings.filter(b => b.type === "KSO");
  const statsATKBillings = accessibleBillings.filter(b => b.type === "ATK");

  const totalKSONominal = statsKSOBillings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
  const totalATKNominal = statsATKBillings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
  const totalPaid = accessibleBillings.filter(b => b.status === "Paid").reduce((sum, b) => sum + b.totalAmount, 0);
  const totalVerified = accessibleBillings.filter(b => b.status === "Verified").reduce((sum, b) => sum + b.totalAmount, 0);

  // CALCULATIONS FOR DETAILED KSO
  const tunaiSubtotal = tunaiItems.reduce((sum, item) => sum + (item.value || 0) - (item.admin || 0), 0);
  const bpjsSubtotal = bpjsItems.reduce((sum, item) => sum + (item.value || 0) - (item.admin || 0), 0);
  const asuransiSubtotal = asuransiItems.reduce((sum, item) => sum + (item.value || 0) - (item.admin || 0), 0);
  const overallReceiptTotal = tunaiSubtotal + bpjsSubtotal + asuransiSubtotal;
  const pengurangSubtotal = pengurangItems.reduce((sum, item) => sum + (item.value || 0), 0);
  const totalPengurang = pengurangItems.length > 0 ? pengurangSubtotal : (pengurang || 0);
  const nilaiPokokFinal = Math.max(0, overallReceiptTotal - totalPengurang);
  const dasarPenagihan = (nilaiPokokFinal * (sharePercent || 0)) / 100;

  let calculatedServiceAmount = serviceAmount;
  let calculatedPpnAmount = Math.round((serviceAmount * ppnPercent) / 100);
  let calculatedTotalAmount = serviceAmount + calculatedPpnAmount;

  if (isDetailedKSO && type === "KSO") {
    if (taxTreatment === "inklusif") {
      calculatedServiceAmount = Math.round(dasarPenagihan / (1 + (ppnPercent || 0) / 100));
      calculatedPpnAmount = dasarPenagihan - calculatedServiceAmount;
      calculatedTotalAmount = dasarPenagihan;
    } else {
      calculatedServiceAmount = Math.round(dasarPenagihan);
      calculatedPpnAmount = Math.round((calculatedServiceAmount * (ppnPercent || 0)) / 100);
      calculatedTotalAmount = calculatedServiceAmount + calculatedPpnAmount;
    }
  }

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
    
    // Set custom states
    setRekapCounter(getNextAutoCounter());
    setRekapSuffix("");
    setNamaPengurang("");

    let defaultDirektur = "";
    let defaultNip = "";
    const activeSite = hasSiteRestriction ? userSite : (clients.length > 0 ? clients[0].namaRS : "");
    const foundC = clients.find(item => item.namaRS === activeSite);
    if (foundC) {
      const activeDir = foundC.directors?.find(d => d.isActive);
      if (activeDir) {
        defaultDirektur = activeDir.name;
        defaultNip = activeDir.nip || "";
      } else {
        const nipMatch = (foundC.direkturRS || "").match(/(.*?)\s*\(NIP\.\s*(.*?)\)/i);
        if (nipMatch) {
          defaultDirektur = nipMatch[1].trim();
          defaultNip = nipMatch[2].trim();
        } else {
          defaultDirektur = foundC.direkturRS || "";
          defaultNip = foundC.nipDirektur || "";
        }
      }
    }
    setNamaDirektur(defaultDirektur);
    setNipDirektur(defaultNip);
    setJabatanDirektur("Direktur");
    setNamaSiteCoordinator("");
    setJabatanSiteCoordinator("Site Coordinator");
    setNamaPerusahaanSite("PT. Medika KSO Indonesia");

    setIsAddNew(true);
    setIsEditing(false);

    // Reset detailed states & keep them empty by default when adding a new billing
    setIsDetailedKSO(true);
    setTunaiItems([]);
    setBpjsItems([]);
    setAsuransiItems([]);
    setPengurang(0);
    setPengurangItems([]);
    setSharePercent(100);
    setTaxTreatment("inklusif");
  };

  const handleEditClick = (bill: BillingKSO) => {
    // Check if the user is authorized to edit this bill
    if (!canEditBill(bill)) {
      alert("⚠️ Hak Edit Ditolak: Anda tidak dapat mengedit data inputan yang dibuat oleh user lain.");
      return;
    }

    // Lock modification if status is not Draft and user is site level
    if (bill.status !== "Draft" && !isHQ) {
      alert("⚠️ Tagihan ini telah diajukan/diverifikasi dan tidak dapat dimodifikasi oleh Site Coordinator.");
      return;
    }

    setSelectedBillId(bill.id);
    setErrorMessage("");
    setType(bill.type);
    setClientRS(bill.clientRS);
    setPeriodMonth(bill.periodMonth || "");
    setServiceAmount(bill.serviceAmount || 0);
    setPpnPercent(bill.ppnPercent !== undefined ? bill.ppnPercent : 11);

    // Try to parse detailed JSON from description
    let isDetailed = false;
    try {
      if (bill.description) {
        if (bill.type === "KSO" && bill.description.trim().startsWith("{")) {
          const parsed = JSON.parse(bill.description);
          if (parsed && parsed.isDetailed) {
            isDetailed = true;
            setIsDetailedKSO(true);
            setTunaiItems(parsed.tunaiItems || []);
            setBpjsItems(parsed.bpjsItems || []);
            setAsuransiItems(parsed.asuransiItems || []);
            setNamaPengurang(parsed.namaPengurang || "");
            setPengurang(parsed.pengurang || 0);
            if (parsed.pengurangItems) {
              setPengurangItems(parsed.pengurangItems);
            } else if (parsed.pengurang || parsed.namaPengurang) {
              setPengurangItems([
                { id: `p-legacy-${Date.now()}`, name: parsed.namaPengurang || "Potongan Pokok", value: parsed.pengurang || 0 }
              ]);
            } else {
              setPengurangItems([]);
            }
            setSharePercent(parsed.sharePercent !== undefined ? parsed.sharePercent : 100);
            setTaxTreatment(parsed.taxTreatment || "inklusif");
            setDescription(parsed.originalDescription || "");
          }
        } else if (bill.type === "ATK" && bill.description.trim().startsWith("{")) {
          const parsed = JSON.parse(bill.description);
          if (parsed && (parsed.isAtkDetailed || parsed.isDetailedAtk)) {
            setDescription(parsed.originalDescription || "");
          }
        }
      }
    } catch (e) {
      // not JSON
    }

    if (!isDetailed) {
      setIsDetailedKSO(false);
      setTunaiItems([]);
      setBpjsItems([]);
      setAsuransiItems([]);
      setNamaPengurang("");
      setPengurang(0);
      setPengurangItems([]);
      setSharePercent(100);
      setTaxTreatment("inklusif");
      setDescription(bill.description || "");
    }

    // Populate No Rekap Tagihan
    if (bill.noRekap) {
      const match = bill.noRekap.match(/^(\d{3})(.*)$/);
      if (match) {
        setRekapCounter(match[1]);
        setRekapSuffix(match[2]);
      } else {
        setRekapCounter("001");
        setRekapSuffix(bill.noRekap);
      }
    } else {
      setRekapCounter(getNextAutoCounter());
      setRekapSuffix("");
    }

    setNamaDirektur(bill.namaDirektur || "");
    setNipDirektur(bill.nipDirektur || "");
    setJabatanDirektur(bill.jabatanDirektur || "Direktur");
    setNamaSiteCoordinator(bill.namaSiteCoordinator || "");
    setJabatanSiteCoordinator(bill.jabatanSiteCoordinator || "Site Coordinator");
    setNamaPerusahaanSite(bill.namaPerusahaanSite || "PT. Medika KSO Indonesia");

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

    const activeServiceAmount = (isDetailedKSO && type === "KSO") ? calculatedServiceAmount : serviceAmount;

    if (activeServiceAmount <= 0) {
      setErrorMessage("⚠️ Nilai pokok penagihan harus di atas Rp 0 !");
      return;
    }

    setIsSaving(true);
    try {
      const computedPpnAmount = (isDetailedKSO && type === "KSO") ? calculatedPpnAmount : Math.round((activeServiceAmount * ppnPercent) / 100);
      const computedTotalAmount = (isDetailedKSO && type === "KSO") ? calculatedTotalAmount : activeServiceAmount + computedPpnAmount;

      const finalStatus = forceSubmit ? "Submitted" : (isHQ ? status : "Draft");

      let serializedDescription = description;
      if (isDetailedKSO && type === "KSO") {
        serializedDescription = JSON.stringify({
          isDetailed: true,
          originalDescription: description,
          tunaiItems,
          bpjsItems,
          asuransiItems,
          namaPengurang,
          pengurang: totalPengurang,
          pengurangItems,
          sharePercent,
          taxTreatment
        });
      } else if (type === "ATK") {
        let prevJson: any = null;
        if (selectedBillId) {
          const prevBill = billings.find(b => b.id === selectedBillId);
          if (prevBill && prevBill.description && prevBill.description.trim().startsWith("{")) {
            try {
              prevJson = JSON.parse(prevBill.description);
            } catch (e) {
              // ignore
            }
          }
        }
        if (prevJson && (prevJson.isAtkDetailed || prevJson.isDetailedAtk)) {
          serializedDescription = JSON.stringify({
            ...prevJson,
            originalDescription: description
          });
        }
      }

      const padDigits = (val: string) => {
        if (/^\d+$/.test(val)) {
          return val.padStart(3, '0');
        }
        return val;
      };
      const fullNoRekap = `${padDigits(rekapCounter)}${rekapSuffix}`;

      const payload: Partial<BillingKSO> = {
        type,
        clientRS,
        periodMonth,
        noRekap: fullNoRekap,
        namaDirektur,
        nipDirektur,
        jabatanDirektur,
        namaSiteCoordinator,
        jabatanSiteCoordinator,
        namaPerusahaanSite,
        serviceAmount: activeServiceAmount,
        ppnPercent,
        ppnAmount: computedPpnAmount,
        totalAmount: computedTotalAmount,
        description: serializedDescription,
        status: finalStatus,
        tanggalKirim: finalStatus === "Paid" || finalStatus === "Verified" ? (tanggalKirim || new Date().toISOString().slice(0, 10)) : "",
        tanggalBayar: finalStatus === "Paid" ? (tanggalBayar || new Date().toISOString().slice(0, 10)) : "",
        attachmentBeritaAcara,
        attachmentBeritaAcaraName,
        attachmentRekapTagihan,
        attachmentRekapTagihanName,
        createdBy: isEditing && selectedBill ? (selectedBill.createdBy || currentUser?.nickname || "Admin") : (currentUser?.nickname || "Site Coordinator"),
        submittedBy: finalStatus === "Submitted" ? (currentUser?.nickname || currentUser?.username || "Site Coordinator") : undefined,
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
      alert("⚠️ Hanya tagihan berstatus 'Draft' yang dapat dihapus oleh Site Coordinator.");
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
          submittedBy: currentUser?.nickname || currentUser?.username || "Site Coordinator",
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
  const currentCalculatedPpn = (isDetailedKSO && type === "KSO") ? calculatedPpnAmount : Math.round((serviceAmount * ppnPercent) / 100);
  const currentCalculatedTotal = (isDetailedKSO && type === "KSO") ? calculatedTotalAmount : serviceAmount + currentCalculatedPpn;

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
              <div className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-4 bg-slate-100 border-b border-slate-200 gap-3 print:hidden">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Printer className="w-5 h-5 text-indigo-600" />
                    <span className="font-extrabold text-sm text-slate-700">Preview Cetak Tagihan</span>
                  </div>
                  
                  {/* Segment controller */}
                  <div className="bg-slate-200/80 p-0.5 rounded-lg flex text-[10px] font-bold">
                    <button
                      onClick={() => setPrintLayout("invoice")}
                      className={`px-3 py-1 rounded-md transition-all ${printLayout === "invoice" ? "bg-white text-indigo-650 shadow-xs font-extrabold" : "text-slate-600 hover:text-slate-800"}`}
                    >
                      Invoice & BA
                    </button>
                    <button
                      onClick={() => setPrintLayout("rekap")}
                      className={`px-3 py-1 rounded-md transition-all ${printLayout === "rekap" ? "bg-white text-indigo-650 shadow-xs font-extrabold" : "text-slate-600 hover:text-slate-800"}`}
                    >
                      Rekap Tagihan
                    </button>
                  </div>
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

              {/* Layout Content Selector */}
              {(() => {
                if (printBill.type === "ATK") {
                  // Try to parse detailed ATK JSON from printBill.description
                  let printAtkObj: any = null;
                  if (printBill.description) {
                    try {
                      const parsed = JSON.parse(printBill.description);
                      if (parsed && (parsed.isDetailedAtk || parsed.isAtkDetailed)) {
                        printAtkObj = parsed;
                      }
                    } catch (e) {
                      // ignore
                    }
                  }

                  // Default mock or parsed items list
                  const itemsList = printAtkObj?.items || [
                    {
                      itemId: "legacy",
                      name: printAtkObj?.originalDescription || printBill.description || "Pengadaan Belanja Logistik ATK Kantor & Printer SIMRS",
                      unit: "Paket",
                      qtyReceived: 1,
                      price: printBill.serviceAmount
                    }
                  ];

                  const formatPeriodLong = (period: string) => {
                    return formatPeriod(period).toUpperCase();
                  };

                  if (printLayout === "rekap") {
                    // ATK REKAPITULASI LAYOUT - Matches Faktur Sementara style
                    return (
                      <div className="p-8 md:p-12 space-y-6 bg-white print:p-0 print:border-none text-slate-900" style={{ fontFamily: "Inter, sans-serif" }}>
                        
                        {/* Kop Surat / Header */}
                        <div className="flex justify-between items-start border-b-2 border-emerald-600 pb-4 text-slate-900">
                          <div>
                            <h1 className="text-sm font-black tracking-widest uppercase font-serif">PT. MEDIKA KSO INDONESIA</h1>
                            <p className="text-[10px] font-sans text-emerald-605 uppercase font-black tracking-wide leading-tight mt-0.5">DIVISI LOGISTIK & SUPPLY CHAIN MANAGEMENT (ATK)</p>
                            <p className="text-[9px] font-sans text-slate-500 mt-1">Penyedia Khusus Kertas Thermal, Ribbon Printer, & Alat Tulis Kantor Terintegrasi SIMRS</p>
                            <p className="text-[8px] font-sans text-slate-400">Head Office: Grand Synapsis Tower, Floor 12A, Jakarta | Email: logistik@medika-kso.co.id</p>
                          </div>
                          <div className="text-right font-sans shrink-0">
                            <span className="border-2 border-emerald-600 text-emerald-605 bg-emerald-50 text-[9px] font-black px-2 py-1 rounded uppercase tracking-wider block">
                              REKAP REALISASI LOGISTIK ATK
                            </span>
                            <div className="text-[8px] font-mono text-slate-400 mt-1">Sistem Ref ID: {printBill.id}</div>
                          </div>
                        </div>

                        {/* Title block */}
                        <div className="text-center space-y-1 py-1 text-slate-900">
                          <h3 className="font-serif font-black uppercase text-xs tracking-wider border-b border-dashed border-emerald-500 pb-1 w-fit mx-auto">
                            REKAPITULASI LAPORAN REALISASI & PENERIMAAN BARANG ATK
                          </h3>
                          <p className="text-xs font-sans font-extrabold text-indigo-700">PERIODE BULAN: {formatPeriodLong(printBill.periodMonth)}</p>
                          {printBill.noRekap && (
                            <p className="text-[10px] font-mono tracking-wider font-bold text-slate-600">No. Rekap Dokumen: &nbsp;{printBill.noRekap}</p>
                          )}
                        </div>

                        {/* Metadata Details */}
                        <div className="grid grid-cols-2 gap-4 text-[11px] font-sans border border-slate-200 p-3 rounded-xl bg-slate-50/50 text-slate-800">
                          <div className="space-y-1">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">PENGIRIM / LOGISTIK:</p>
                            <p className="text-slate-804 font-bold">PT. Medika KSO Indonesia (Gudang Central SCM)</p>
                            <p className="text-slate-600">Diserahkan Melalui: <b>{printBill.namaSiteCoordinator || "Site Coordinator"}</b></p>
                            <p className="text-slate-600">No. Ref Pemesanan: <span className="font-mono font-bold text-slate-800 bg-slate-100 px-1 rounded">{printAtkObj?.noPemesanan || "Legacy/Manual"}</span></p>
                          </div>
                          <div className="space-y-1 border-l border-slate-205 pl-4">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider font-sans">UNIT PENERIMA:</p>
                            <p className="text-emerald-700 font-black uppercase font-sans">{printBill.clientRS}</p>
                            <p className="text-slate-600">PIC Penerima RS: <b>{printBill.namaDirektur || "Tim Logistik Rumah Sakit"}</b></p>
                            <p className="text-slate-600">No. Faktur Sementara: <span className="font-sans font-bold text-slate-800">{printAtkObj?.fakturSementaraNo || "Sesuai Berita Acara"}</span></p>
                          </div>
                        </div>

                        {/* Table */}
                        <table className="w-full border-collapse border border-slate-300 text-[11px] font-serif text-slate-900 bg-white">
                          <thead>
                            <tr className="bg-slate-50 font-bold border-b border-slate-300 text-slate-804">
                              <th className="border border-slate-300 p-2 text-center w-8">No</th>
                              <th className="border border-slate-300 p-2 text-left">Deskripsi Barang (Atribut Kertas & ATK SIMRS)</th>
                              <th className="border border-slate-300 p-2 text-center w-14">Satuan</th>
                              <th className="border border-slate-300 p-2 text-center w-12">Qty</th>
                              <th className="border border-slate-300 p-2 text-right w-24">Harga (Rp)</th>
                              <th className="border border-slate-300 p-2 text-right w-24">Subtotal (Rp)</th>
                            </tr>
                          </thead>
                          <tbody>
                            {itemsList.map((it: any, idx: number) => {
                              const qty = it.qtyReceived !== undefined ? it.qtyReceived : (it.qtyShipped !== undefined ? it.qtyShipped : (it.qtyOrdered || 1));
                              return (
                                <tr key={idx} className="hover:bg-slate-50/50">
                                  <td className="border border-slate-300 p-2 text-center font-sans text-slate-600">{idx + 1}</td>
                                  <td className="border border-slate-300 p-2 font-serif font-semibold text-slate-800">{it.name}</td>
                                  <td className="border border-slate-300 p-2 text-center font-sans uppercase text-[10px] text-slate-500">{it.unit}</td>
                                  <td className="border border-slate-300 p-2 text-center font-sans font-bold text-slate-900">{qty}</td>
                                  <td className="border border-slate-300 p-2 text-right font-sans text-slate-600">{it.price.toLocaleString("id-ID")}</td>
                                  <td className="border border-slate-300 p-2 text-right font-sans font-bold text-slate-950">{(it.price * qty).toLocaleString("id-ID")}</td>
                                </tr>
                              );
                            })}
                            
                            <tr className="border-t border-slate-400 font-bold bg-slate-50/30">
                              <td colSpan={5} className="border border-slate-300 p-2 text-right uppercase tracking-wider text-[10px] text-slate-500 font-sans">Total Belanja Bruto:</td>
                              <td className="border border-slate-300 p-2 text-right font-sans font-black text-slate-900">
                                {printBill.serviceAmount.toLocaleString("id-ID")}
                              </td>
                            </tr>
                            <tr>
                              <td colSpan={5} className="border border-slate-300 p-2 text-right text-[10px] text-slate-500 font-sans">Estimasi PPN (Pajak Pertambahan Nilai {printBill.ppnPercent}%):</td>
                              <td className="border border-slate-300 p-2 text-right font-sans text-slate-700">
                                {printBill.ppnAmount.toLocaleString("id-ID")}
                              </td>
                            </tr>
                            <tr className="font-bold underline text-xs bg-emerald-50/20 text-emerald-900">
                              <td colSpan={5} className="border border-slate-300 p-2 text-right uppercase tracking-wider text-[10px] text-emerald-800 font-sans font-black">Total Akhir Penagihan Logistik ATK:</td>
                              <td className="border border-slate-300 p-2 text-right font-sans font-black text-emerald-900">
                                {printBill.totalAmount.toLocaleString("id-ID")}
                              </td>
                            </tr>
                          </tbody>
                        </table>

                        {/* Terbilang Translation */}
                        <div className="p-3 bg-slate-50 rounded-xl border border-dashed border-slate-200 font-sans italic text-xs leading-relaxed text-slate-600">
                          <span className="font-extrabold text-slate-900">Terbilang: </span>
                          "{terbilang(printBill.totalAmount)} Rupiah"
                        </div>

                        {/* Signatures Footer Column */}
                        <div className="pt-4 font-sans text-slate-800">
                          <div className="grid grid-cols-2 text-center text-xs">
                            <div className="space-y-12">
                              <p className="text-slate-600">PIHAK PERTAMA (YANG MENYERAHKAN)<br /><span className="font-bold text-slate-800">PT. Medika KSO Indonesia (SCM Site)</span></p>
                              <div className="space-y-0.5">
                                <p className="font-bold underline text-slate-900">(&nbsp;{printBill.namaSiteCoordinator || printBill.createdBy || "......................................."}&nbsp;)</p>
                                <p className="text-[10px] text-slate-500 leading-none">{printBill.jabatanSiteCoordinator || "Site Coordinator"}</p>
                              </div>
                            </div>
                            <div className="space-y-12">
                              <p className="text-slate-600">PIHAK KEDUA (YANG MENERIMA)<br /><span className="font-bold text-slate-800">Logistik & Manajemen RS Client</span></p>
                              <div className="space-y-0.5">
                                <p className="font-bold underline text-slate-900">(&nbsp;{printBill.namaDirektur || "......................................."}&nbsp;)</p>
                                <p className="text-[10px] text-slate-500 leading-none">{printBill.nipDirektur ? `NIP. ${printBill.nipDirektur}` : "Perwakilan Rumah Sakit"}</p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Catatan Khusus */}
                        <div className="border-t border-emerald-300 pt-3 text-[10px] text-slate-500 font-sans italic space-y-1">
                          <p><b>Catatan Khusus KSO ATK:</b></p>
                          <p>* Bukti rekap penyerahan logistik ini sah apabila ditandatangani serta dicap resmi.</p>
                          <p>** Laporan realisasi real riil logistik ATK ini diverifikasi oleh coordinator dan disinkronisasikan ke sistem Penagihan Pusat Medika.</p>
                        </div>

                      </div>
                    );
                  } else {
                    // ATK INVOICE & BA LAYOUT - Matches professional invoice format
                    return (
                      <div className="p-8 md:p-12 space-y-8 bg-white print:p-0 print:border-none text-slate-900" style={{ fontFamily: "Inter, sans-serif" }}>
                        
                        {/* Header Kop Surat */}
                        <div className="flex flex-col md:flex-row justify-between items-start border-b-4 border-double border-slate-350 pb-6 text-slate-800">
                          <div>
                            <div className="flex items-center gap-2">
                              <Receipt className="w-7 h-7 text-emerald-600 print:text-black" />
                              <span className="text-xl font-black tracking-tight text-slate-900 font-sans">
                                MEDIKA KSO INDONESIA
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-500 max-w-sm mt-1 leading-relaxed">
                              Lantai 4 Gedung Pusat KSO Nusantara, Jl. RE Martadinata No. 129, Bandung, Jawa Barat. Telp: (022) 412490
                            </p>
                          </div>
                          <div className="text-right mt-4 md:mt-0 font-sans select-none shrink-0">
                            <h2 className="text-xl font-extrabold tracking-tight text-emerald-750 print:text-black uppercase">
                              INVOICE TAGIHAN DISTRIBUSI ATK
                            </h2>
                            <p className="text-[11px] text-slate-500 mt-0.5 font-mono">Invoice ID: #{printBill.id}</p>
                            {printBill.noRekap && (
                              <p className="text-[11.5px] text-emerald-700 print:text-black font-extrabold font-mono mt-0.5">
                                No Rekap: {printBill.noRekap}
                              </p>
                            )}
                            <p className="text-[11px] text-slate-500 mt-1">Tanggal: <b>{printBill.tanggalKirim || printBill.createdAt.slice(0, 10)}</b></p>
                          </div>
                        </div>

                        {/* Billing Addresses Target */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 text-slate-800">
                          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 print:bg-transparent print:border-none print:p-0">
                            <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wide">Penerima Tagihan (Client RS):</span>
                            <h4 className="text-sm font-extrabold text-slate-900 mt-1 flex items-center gap-1.5">
                              <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
                              {printBill.clientRS}
                            </h4>
                            <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed font-sans">
                              Bagian Logistik & Rumah Tangga Rumah Sakit.<br />
                              Pengadaan alat tulis kantor & kertas thermal pendukung SIMRS Medika.
                            </p>
                          </div>

                          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 print:bg-transparent print:border-none print:p-0 md:text-right font-sans">
                            <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wide">Periode Pelayanan Logistik:</span>
                            <h4 className="text-sm font-extrabold text-emerald-700 print:text-black mt-1">
                              {formatPeriod(printBill.periodMonth)}
                            </h4>
                            <p className="text-[11px] text-slate-500 mt-1.5 font-sans">
                              Tipe Penagihan: Pengadaan ATK & Kertas Printer SIMRS<br />
                              Status Tagihan: <b>Resmi / Terverifikasi</b>
                            </p>
                          </div>
                        </div>

                        {/* Items Table */}
                        <div className="mt-4">
                          <table className="w-full text-left border-collapse border border-slate-200 text-slate-900">
                            <thead>
                              <tr className="bg-slate-100 text-[10px] text-slate-650 font-bold uppercase tracking-wider border-b border-slate-200 print:bg-slate-200">
                                <th className="px-5 py-3 border-r border-slate-200">Uraian / Realisasi Barang Logistik ATK</th>
                                <th className="px-5 py-3 text-center border-r border-slate-200 w-20">Satuan</th>
                                <th className="px-5 py-3 text-center border-r border-slate-200 w-20">Qty</th>
                                <th className="px-5 py-3 text-right border-r border-slate-200 w-28">Harga Pokok (Rp)</th>
                                <th className="px-5 py-3 text-right w-28">Subtotal (Rp)</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-xs font-sans">
                              {itemsList.map((it: any, idx: number) => {
                                const qty = it.qtyReceived !== undefined ? it.qtyReceived : (it.qtyShipped !== undefined ? it.qtyShipped : (it.qtyOrdered || 1));
                                return (
                                  <tr key={idx} className="hover:bg-slate-50/50">
                                    <td className="px-5 py-2.5 border-r border-slate-200 font-serif font-semibold text-slate-800">{it.name}</td>
                                    <td className="px-5 py-2.5 border-r border-slate-200 text-center uppercase text-[10px] text-slate-500">{it.unit || "Pcs"}</td>
                                    <td className="px-5 py-2.5 border-r border-slate-200 text-center font-bold text-slate-900">{qty}</td>
                                    <td className="px-5 py-2.5 border-r border-slate-200 text-right font-mono text-slate-600">{it.price.toLocaleString("id-ID")}</td>
                                    <td className="px-5 py-2.5 text-right font-mono font-bold text-slate-950">{(it.price * qty).toLocaleString("id-ID")}</td>
                                  </tr>
                                );
                              })}

                              {/* Summary Rows */}
                              <tr className="bg-slate-50/50 font-sans">
                                <td colSpan={4} className="px-5 py-2 text-right font-bold text-slate-505 border-r border-slate-200 uppercase text-[10px]">Nilai DPP Belanja ATK:</td>
                                <td className="px-5 py-2 text-right font-mono font-bold text-slate-705">{formatIDR(printBill.serviceAmount)}</td>
                              </tr>
                              <tr className="bg-slate-50/50 font-sans">
                                <td colSpan={4} className="px-5 py-2 text-right font-bold text-slate-505 border-r border-slate-200 uppercase text-[10px]">Pajak PPN ({printBill.ppnPercent}%):</td>
                                <td className="px-5 py-2 text-right font-mono font-bold text-slate-705">+{formatIDR(printBill.ppnAmount)}</td>
                              </tr>
                              <tr className="bg-emerald-50/10 text-emerald-955 font-sans border-t border-slate-200">
                                <td colSpan={4} className="px-5 py-3 text-right font-black text-emerald-900 border-r border-slate-200 uppercase text-[11px] tracking-wider">TOTAL TAGIHAN LOGISTIK (NET):</td>
                                <td className="px-5 py-3 text-right font-mono font-black text-emerald-900 text-sm">{formatIDR(printBill.totalAmount)}</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>

                        {/* Terbilang Translation */}
                        <div className="p-4 bg-slate-50/65 border border-dashed border-slate-200 font-sans italic text-xs leading-relaxed text-slate-600">
                          <span className="font-extrabold text-slate-900">Terbilang: </span>
                          "{terbilang(printBill.totalAmount)} Rupiah"
                        </div>

                        {/* Signature Block */}
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-6 pt-8 text-center text-xs text-slate-800">
                          <div>
                            <span className="text-slate-400 block font-bold text-[10px] uppercase">
                              Yang Menyerahkan (SCM):
                            </span>
                            <div className="h-16 flex items-end justify-center">
                              <span className="font-extrabold border-b border-slate-400 pb-0.5 text-slate-800">
                                {printBill.namaSiteCoordinator || printBill.createdBy || "Site Coordinator"}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-450 block mt-1">
                              {printBill.namaPerusahaanSite || "PT. Medika KSO Indonesia"}
                            </span>
                          </div>

                          <div className="hidden md:block">
                            <span className="text-slate-400 block font-bold text-[10px] uppercase">Ditinjau oleh (HQ):</span>
                            <div className="h-16 flex items-end justify-center">
                              <span className="font-extrabold border-b border-slate-400 pb-0.5 text-slate-800 font-sans">
                                {printBill.verifiedBy || "Manager HQ"}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-450 block mt-1 font-sans">Logistik Manager Kantor Pusat</span>
                          </div>

                          <div>
                            <span className="text-slate-400 block font-bold text-[10px] uppercase">
                              {printBill.jabatanDirektur || "Mengetahui (Penerima RS)"}:
                            </span>
                            <div className="h-16 flex items-end justify-center">
                              <span className="font-extrabold border-b border-slate-400 pb-0.5 text-slate-800">
                                {printBill.namaDirektur || "Tim Logistik & Keuangan RS"}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-450 block mt-1 font-mono">
                              {printBill.nipDirektur ? `NIP: ${printBill.nipDirektur}` : "RS Client"}
                            </span>
                          </div>
                        </div>

                        {/* Legal Footnote */}
                        <div className="pt-8 border-t border-slate-150 text-[10px] text-slate-400 leading-relaxed font-sans flex flex-col md:flex-row md:items-center justify-between gap-2">
                          <span>* Invoice cetak logistik ini sah diterbitkan secara elektronik oleh Medika KSO Sistem Nusantara.</span>
                          <span className="font-mono text-slate-400">IP: system_verification_key_atk_{printBill.id}</span>
                        </div>

                      </div>
                    );
                  }
                }

                // If KSO, proceed with the original logic
                let printDetailObj: any = null;
                if (printBill.type === "KSO" && printBill.description) {
                  try {
                    const parsed = JSON.parse(printBill.description);
                    if (parsed && parsed.isDetailed) {
                      printDetailObj = parsed;
                    }
                  } catch (e) {
                    // ignore
                  }
                }

                // Detailed collections fallback
                const pTunaiItems = printDetailObj?.tunaiItems || [];
                const pBpjsItems = printDetailObj?.bpjsItems || [];
                const pAsuransiItems = printDetailObj?.asuransiItems || [];
                const pPengurangItems = printDetailObj?.pengurangItems || [];
                const pLegacyPengurang = printDetailObj?.pengurang || 0;
                const pLegacyPengurangNama = printDetailObj?.namaPengurang || "";

                const totalTunaiGross = pTunaiItems.reduce((s: number, i: any) => s + (i.value || 0), 0);
                const totalTunaiNet = pTunaiItems.reduce((s: number, i: any) => s + (i.value || 0) - (i.admin || 0), 0);

                const totalBpjsGross = pBpjsItems.reduce((s: number, i: any) => s + (i.value || 0), 0);
                const totalBpjsNet = pBpjsItems.reduce((s: number, i: any) => s + (i.value || 0) - (i.admin || 0), 0);

                const totalAsuransiGross = pAsuransiItems.reduce((s: number, i: any) => s + (i.value || 0), 0);
                const totalAsuransiNet = pAsuransiItems.reduce((s: number, i: any) => s + (i.value || 0) - (i.admin || 0), 0);

                const rekapTotalDeductions = pPengurangItems.length > 0 
                  ? pPengurangItems.reduce((s: number, i: any) => s + (i.value || 0), 0)
                  : pLegacyPengurang;

                const overallTotalGross = totalTunaiGross + totalBpjsGross + totalAsuransiGross;
                const totalRevenueNet = totalTunaiNet + totalBpjsNet + totalAsuransiNet - rekapTotalDeductions;

                if (printLayout === "rekap") {
                  return (
                    <div className="p-8 md:p-12 space-y-8 bg-white print:p-0 print:border-none" id="invoice-paper" style={{ fontFamily: "Inter, sans-serif" }}>
                      
                      {/* Header Kop Surat & Document Info */}
                      <div className="text-center border-b-4 border-double border-slate-350 pb-6 space-y-2">
                        <div className="flex justify-center items-center gap-2">
                          <FileSpreadsheet className="w-8 h-8 text-indigo-600 print:text-black shrink-0" />
                          <h2 className="text-lg font-black tracking-tight text-slate-900 font-sans uppercase">
                            REKAPITULASI LAPORAN PENDAPATAN DAN PENERIMAAN
                          </h2>
                        </div>
                        <p className="text-sm font-semibold text-indigo-705 print:text-black uppercase tracking-wide">
                          {printBill.clientRS}
                        </p>
                        <div className="text-xs text-slate-550 space-y-0.5">
                          <p className="font-extrabold text-xs text-slate-800">PERIODE {formatPeriod(printBill.periodMonth).toUpperCase()}</p>
                          {printBill.noRekap && (
                            <p className="font-mono text-xs font-bold text-slate-850">
                              <b>Nomor Dokumen:</b> {printBill.noRekap}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Detailed Data Blocks */}
                      <div className="space-y-6">
                        
                        {/* Tunai Data Card */}
                        <div className="border border-slate-200 rounded-2xl p-4.5 space-y-2.5">
                          <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                            <span className="text-xs font-black text-slate-800 uppercase flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                              🟢 Penerimaan Tunai
                            </span>
                          </div>
                          <div className="space-y-1.5 pl-3.5">
                            {pTunaiItems.length > 0 ? (
                              pTunaiItems.map((item: any, idx: number) => (
                                <div key={idx} className="flex justify-between text-xs text-slate-655">
                                  <span>{idx + 1}. {item.name || "Penerimaan Tunai"}</span>
                                  <span className="font-mono font-medium">{formatIDR(item.value)}</span>
                                </div>
                              ))
                            ) : (
                              <p className="text-xs text-slate-400 italic">Tidak ada data penerimaan tunai.</p>
                            )}
                            <div className="flex justify-between items-center font-bold text-xs text-emerald-750 pt-2 border-t border-slate-100 mt-2">
                              <span>TOTAL PENERIMAAN TUNAI:</span>
                              <span className="font-mono">{formatIDR(totalTunaiGross)}</span>
                            </div>
                          </div>
                        </div>

                        {/* BPJS Data Card */}
                        <div className="border border-slate-200 rounded-2xl p-4.5 space-y-2.5">
                          <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                            <span className="text-xs font-black text-slate-800 uppercase flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0"></span>
                              🔵 Penerimaan BPJS
                            </span>
                          </div>
                          <div className="space-y-1.5 pl-3.5">
                            {pBpjsItems.length > 0 ? (
                              pBpjsItems.map((item: any, idx: number) => (
                                <div key={idx} className="flex justify-between text-xs text-slate-655">
                                  <span>{idx + 1}. {item.name || "Klaim BPJS"}</span>
                                  <span className="font-mono font-medium">{formatIDR(item.value)}</span>
                                </div>
                              ))
                            ) : (
                              <p className="text-xs text-slate-400 italic">Tidak ada data penerimaan BPJS.</p>
                            )}
                            <div className="flex justify-between items-center font-bold text-xs text-blue-750 pt-2 border-t border-slate-100 mt-2">
                              <span>TOTAL PENERIMAAN BPJS:</span>
                              <span className="font-mono">{formatIDR(totalBpjsGross)}</span>
                            </div>
                          </div>
                        </div>

                        {/* Asuransi Lain Data Card */}
                        <div className="border border-slate-200 rounded-2xl p-4.5 space-y-2.5">
                          <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                            <span className="text-xs font-black text-slate-800 uppercase flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-purple-500 shrink-0"></span>
                              🟣 Penerimaan Asuransi Lain
                            </span>
                          </div>
                          <div className="space-y-1.5 pl-3.5">
                            {pAsuransiItems.length > 0 ? (
                              pAsuransiItems.map((item: any, idx: number) => (
                                <div key={idx} className="flex justify-between text-xs text-slate-655">
                                  <span>{idx + 1}. {item.name || "Asuransi"}</span>
                                  <span className="font-mono font-medium">{formatIDR(item.value)}</span>
                                </div>
                              ))
                            ) : (
                              <p className="text-xs text-slate-400 italic">Tidak ada data penerimaan asuransi.</p>
                            )}
                            <div className="flex justify-between items-center font-bold text-xs text-purple-750 pt-2 border-t border-slate-100 mt-2">
                              <span>TOTAL PENERIMAAN ASURANSI LAIN:</span>
                              <span className="font-mono">{formatIDR(totalAsuransiGross)}</span>
                            </div>
                          </div>
                        </div>

                        {/* Deductions of KSO */}
                        {rekapTotalDeductions > 0 && (
                          <div className="border border-red-200 bg-red-50/10 rounded-2xl p-4.5 space-y-2">
                            <span className="block text-xs font-black text-red-650 uppercase">🔴 Daftar Pengurang Pokok</span>
                            <div className="space-y-1 pl-3.5 text-xs text-slate-650">
                              {pPengurangItems.length > 0 ? (
                                pPengurangItems.map((item: any, idx: number) => (
                                  <div key={idx} className="flex justify-between">
                                    <span>{idx + 1}. {item.name}</span>
                                    <span className="font-mono font-medium">-{formatIDR(item.value)}</span>
                                  </div>
                                ))
                              ) : (
                                <div className="flex justify-between">
                                  <span>1. {pLegacyPengurangNama || "Potongan Pokok"}</span>
                                  <span className="font-mono font-medium">-{formatIDR(pLegacyPengurang)}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Calculations summary block */}
                        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3.5">
                          <span className="block text-[10px] text-indigo-750 font-extrabold uppercase tracking-wide">📐 RINGKASAN REKAPITULASI BAGI HASIL</span>
                          
                          <div className="space-y-2.5">
                            <div className="flex justify-between items-center text-xs text-slate-700 font-sans">
                              <span>💵 Total Keseluruhan Penerimaan Bruto (Gross):</span>
                              <span className="font-mono font-bold text-slate-900">{formatIDR(overallTotalGross)}</span>
                            </div>
                            
                            <div className="flex justify-between items-center text-xs text-slate-700 font-sans">
                              <span>💼 Total Penerimaan / Pendapatan Bersih (Net Base):</span>
                              <span className="font-mono font-bold text-indigo-700">{formatIDR(totalRevenueNet)}</span>
                            </div>

                            <div className="flex justify-between items-center text-xs text-slate-705 pt-2 border-t border-slate-250 font-black font-sans">
                              <span>📊 TOTAL PENAGIHAN KSO {printDetailObj?.sharePercent !== undefined ? `(${printDetailObj.sharePercent}% Share + Pajak)` : ""}:</span>
                              <span className="font-mono text-sm text-indigo-850">{formatIDR(printBill.totalAmount)}</span>
                            </div>
                          </div>
                        </div>

                      </div>

                      {/* Terbilang Translation */}
                      <div className="p-4 bg-slate-50/60 rounded-xl border border-dashed border-slate-200 font-sans italic text-xs leading-relaxed text-slate-650 print:bg-transparent">
                        <span className="font-extrabold text-slate-900">Terbilang: </span>
                        "{terbilang(printBill.totalAmount)} Rupiah"
                      </div>

                      {/* Signatures Footer columns */}
                      <div className="grid grid-cols-2 gap-8 pt-12 text-center text-xs">
                        {/* Left Side: RS Client */}
                        <div className="space-y-1">
                          <p className="font-bold text-slate-700 uppercase tracking-wide">{printBill.clientRS}</p>
                          <p className="text-[11px] text-slate-500 italic mb-2">Pihak Pertama ({printBill.jabatanDirektur || "Direktur"})</p>
                          <div className="h-20" />
                          <p className="font-black border-b border-slate-350 pb-0.5 text-slate-900 mx-auto max-w-xs inline-block">
                            {printBill.namaDirektur || "(Nama Direktur)"}
                          </p>
                          <p className="text-[10px] text-slate-450 mt-1 font-mono">
                            {printBill.nipDirektur ? `NIP: ${printBill.nipDirektur}` : "RS Client"}
                          </p>
                        </div>

                        {/* Right Side: Site Coordinator */}
                        <div className="space-y-1">
                          <p className="font-bold text-indigo-700 uppercase tracking-wide">{printBill.jabatanSiteCoordinator || "Site Coordinator"}</p>
                          <p className="text-[11px] text-indigo-500 italic mb-2">Pihak Kedua ({printBill.namaPerusahaanSite || "PT. Medika KSO Indonesia"})</p>
                          <div className="h-20" />
                          <p className="font-black border-b border-slate-350 pb-0.5 text-slate-900 mx-auto max-w-xs inline-block">
                            {printBill.namaSiteCoordinator || printBill.createdBy || "Site Coordinator"}
                          </p>
                          <p className="text-[10px] text-slate-450 mt-1">
                            {printBill.namaPerusahaanSite || "PT. Medika KSO Indonesia"}
                          </p>
                        </div>
                      </div>

                      {/* Footer Info */}
                      <div className="pt-8 border-t border-slate-150 text-[10px] text-slate-400 leading-relaxed font-sans flex justify-between select-none">
                        <span>* Rekap cetak ini sah diterbitkan secara elektronik oleh Medika KSO Sistem Nusantara.</span>
                        <span className="font-mono">ID: {printBill.id}</span>
                      </div>

                    </div>
                  );
                }

                return (
                  <div className="p-8 md:p-12 space-y-8 bg-white print:p-0 print:border-none" id="invoice-paper" style={{ fontFamily: "Inter, sans-serif" }}>
                
                {/* Header Kop Surat */}
                <div className="flex flex-col md:flex-row justify-between items-start border-b-4 border-double border-slate-350 pb-6">
                  <div className="flex items-start gap-3">
                    {companyProfile?.logoUrl ? (
                      <img 
                        src={companyProfile.logoUrl} 
                        alt="Logo" 
                        className="h-12 max-w-[130px] object-contain print:max-h-12 shrink-0 rounded"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <Receipt className="w-8 h-8 text-indigo-600 print:text-black shrink-0 mt-1" />
                    )}
                    <div>
                      <h1 className="text-base font-black tracking-tight text-slate-900 font-sans uppercase">
                        {companyProfile?.nama || "MEDIKA KSO INDONESIA"}
                      </h1>
                      <p className="text-[10px] text-slate-500 max-w-sm mt-1 leading-relaxed">
                        {companyProfile?.alamat || "Lantai 4 Gedung Pusat KSO Nusantara, Jl. RE Martadinata No. 129, Bandung, Jawa Barat."}
                        {companyProfile?.telepon && ` Telp: ${companyProfile.telepon}`}
                        {companyProfile?.fax && ` | Fax: ${companyProfile.fax}`}
                        {companyProfile?.web && ` | Web: ${companyProfile.web}`}
                        {companyProfile?.email && ` | Email: ${companyProfile.email}`}
                      </p>
                    </div>
                  </div>
                  <div className="text-right mt-4 md:mt-0 font-sans">
                    <h2 className="text-xl font-extrabold tracking-tight text-indigo-700 print:text-black uppercase">
                      INVOICE TAGIHAN {printBill.type}
                    </h2>
                    <p className="text-[11px] text-slate-450 mt-0.5 font-mono">Invoice ID: #{printBill.id}</p>
                    {printBill.noRekap && (
                      <p className="text-[11.5px] text-indigo-700 print:text-black font-extrabold font-mono mt-0.5">
                        No Rekap: {printBill.noRekap}
                      </p>
                    )}
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
                      {(() => {
                        let printDetailObj: any = null;
                        let isAtkDetailedObj = false;
                        if (printBill.type === "KSO" && printBill.description) {
                          try {
                            const parsed = JSON.parse(printBill.description);
                            if (parsed && parsed.isDetailed) {
                              printDetailObj = parsed;
                            }
                          } catch (e) {
                            // ignore
                          }
                        } else if (printBill.type === "ATK" && printBill.description) {
                          try {
                            const parsed = JSON.parse(printBill.description);
                            if (parsed && parsed.isAtkDetailed) {
                              printDetailObj = parsed;
                              isAtkDetailedObj = true;
                            }
                          } catch (e) {
                            // ignore
                          }
                        }

                        if (printDetailObj) {
                          if (isAtkDetailedObj) {
                            return (
                              <>
                                <tr>
                                  <td colSpan={3} className="px-5 py-3 bg-slate-50 font-bold text-[10px] uppercase text-emerald-700 tracking-wider">
                                    📂 Rincian Penyerahan Alat Tulis Kantor (ATK) - No Faktur: {printDetailObj.noFakturSementara || printBill.noRekap || printBill.id}
                                  </td>
                                </tr>
                                {printDetailObj.items && printDetailObj.items.map((item: any, idx: number) => {
                                  const qty = item.qtyReceived > 0 ? item.qtyReceived : (item.qtyShipped > 0 ? item.qtyShipped : item.qtyOrdered);
                                  return (
                                    <tr key={`atk-print-${idx}`} className="hover:bg-slate-50/50">
                                      <td className="px-5 py-2.5 border-r border-slate-200 font-medium">
                                        <div className="font-semibold text-[11.5px] text-slate-800">{idx + 1}. {item.name}</div>
                                        <div className="text-[9px] text-slate-500 font-medium italic pl-3 leading-none mt-1">
                                          Satuan: {item.unit} • Jumlah: {qty} unit • Harga: {formatIDR(item.price)}
                                        </div>
                                      </td>
                                      <td className="px-5 py-2.5 text-right border-r border-slate-200 font-mono text-slate-700 font-bold">
                                        {formatIDR(item.price * qty)}
                                      </td>
                                      <td className="px-5 py-2.5 text-right font-mono text-slate-400">
                                        -
                                      </td>
                                    </tr>
                                  );
                                })}
                                {printDetailObj.originalDescription && (
                                  <tr>
                                    <td colSpan={3} className="px-5 py-4 border-t border-slate-200 text-[10.5px] text-slate-500 italic max-w-lg whitespace-pre-wrap leading-relaxed">
                                      <b>Catatan Pengadaan ATK:</b> {printDetailObj.originalDescription}
                                    </td>
                                  </tr>
                                )}
                              </>
                            );
                          }

                          return (
                            <>
                              <tr>
                                <td colSpan={3} className="px-5 py-3 bg-slate-50 font-bold text-[10px] uppercase text-indigo-700 tracking-wider">
                                  📂 Rincian Item Pekerjaan & Penerimaan KSO
                                </td>
                              </tr>
                              
                              {/* Tunai items */}
                              {printDetailObj.tunaiItems && printDetailObj.tunaiItems.map((item: any, idx: number) => (
                                <tr key={`pt-${idx}`}>
                                  <td className="px-5 py-2 border-r border-slate-200 font-medium">
                                    <div className="font-semibold text-slate-800">🟢 Penerimaan Tunai: {item.name || "Item Tunai"}</div>
                                    {item.admin > 0 && (
                                      <div className="text-[9px] text-slate-500 font-medium italic pl-2 leading-none mt-0.5">
                                        (Nilai Kotor: {formatIDR(item.value)} • Potongan Admin: -{formatIDR(item.admin)})
                                      </div>
                                    )}
                                  </td>
                                  <td className="px-5 py-2 text-right border-r border-slate-200 font-mono text-slate-700 font-medium">
                                    {formatIDR(item.value - (item.admin || 0))}
                                  </td>
                                  <td className="px-5 py-2 text-right font-mono text-slate-400">
                                    -
                                  </td>
                                </tr>
                              ))}

                              {/* BPJS items */}
                              {printDetailObj.bpjsItems && printDetailObj.bpjsItems.map((item: any, idx: number) => (
                                <tr key={`bpjs-${idx}`}>
                                  <td className="px-5 py-2 border-r border-slate-200 font-medium">
                                    <div className="font-semibold text-slate-800">🔵 Penerimaan BPJS: {item.name || "BPJS Item"}</div>
                                    {item.admin > 0 && (
                                      <div className="text-[9px] text-slate-500 font-medium italic pl-2 leading-none mt-0.5">
                                        (Nilai Kotor: {formatIDR(item.value)} • Potongan Admin: -{formatIDR(item.admin)})
                                      </div>
                                    )}
                                  </td>
                                  <td className="px-5 py-2 text-right border-r border-slate-200 font-mono text-slate-700 font-medium">
                                    {formatIDR(item.value - (item.admin || 0))}
                                  </td>
                                  <td className="px-5 py-2 text-right font-mono text-slate-400">
                                    -
                                  </td>
                                </tr>
                              ))}

                              {/* Asuransi items */}
                              {printDetailObj.asuransiItems && printDetailObj.asuransiItems.map((item: any, idx: number) => (
                                <tr key={`asuransi-${idx}`}>
                                  <td className="px-5 py-2 border-r border-slate-200 font-medium font-sans">
                                    <div className="font-semibold text-slate-800">🟣 Penerimaan Asuransi Lain: {item.name || "Asuransi Item"}</div>
                                    {item.admin > 0 && (
                                      <div className="text-[9px] text-slate-500 font-medium italic pl-2 leading-none mt-0.5">
                                        (Nilai Kotor: {formatIDR(item.value)} • Potongan Admin: -{formatIDR(item.admin)})
                                      </div>
                                    )}
                                  </td>
                                  <td className="px-5 py-2 text-right border-r border-slate-200 font-mono text-slate-700 font-medium">
                                    {formatIDR(item.value - (item.admin || 0))}
                                  </td>
                                  <td className="px-5 py-2 text-right font-mono text-slate-400">
                                    -
                                  </td>
                                </tr>
                              ))}

                              {/* Deductions & share percent summaries */}
                              {printDetailObj.pengurangItems && printDetailObj.pengurangItems.length > 0 ? (
                                printDetailObj.pengurangItems.map((item: any, idx: number) => (
                                  <tr key={`pengurang-${idx}`} className="bg-rose-50/10">
                                    <td className="px-5 py-2 border-r border-slate-200 font-bold text-red-650">
                                      🔴 Pengurang: {item.name || "(Potongan Pokok)"}
                                    </td>
                                    <td className="px-5 py-2 text-right border-r border-slate-200 font-mono font-bold text-red-600">
                                      -{formatIDR(item.value)}
                                    </td>
                                    <td className="px-5 py-2 text-right font-mono text-slate-400">
                                      -
                                    </td>
                                  </tr>
                                ))
                              ) : (
                                printDetailObj.pengurang > 0 && (
                                  <tr className="bg-rose-50/10">
                                    <td className="px-5 py-2 border-r border-slate-200 font-bold text-red-600">
                                      🔴 Pengurang: {printDetailObj.namaPengurang ? `"${printDetailObj.namaPengurang}"` : "(Potongan Pokok)"}
                                    </td>
                                    <td className="px-5 py-2 text-right border-r border-slate-200 font-mono font-bold text-red-600">
                                      -{formatIDR(printDetailObj.pengurang)}
                                    </td>
                                    <td className="px-5 py-2 text-right font-mono text-slate-400">
                                      -
                                    </td>
                                  </tr>
                                )
                              )}

                              <tr className="bg-indigo-50/10 print:bg-slate-50">
                                <td className="px-5 py-3 border-r border-slate-200 font-extrabold text-slate-700">
                                  ⚖️ Dasar Penagihan KSO (Rasio Sharing {printDetailObj.sharePercent}%)
                                </td>
                                <td className="px-5 py-3 text-right border-r border-slate-200 font-mono font-bold text-slate-900">
                                  {formatIDR(printBill.serviceAmount)}
                                </td>
                                <td className="px-5 py-3 text-right font-mono font-bold text-slate-900">
                                  {formatIDR(printBill.ppnAmount)}
                                </td>
                              </tr>
                              
                              {printDetailObj.originalDescription && (
                                <tr>
                                  <td colSpan={3} className="px-5 py-4 border-t border-slate-200 text-[10px] text-slate-500 italic max-w-lg whitespace-pre-wrap leading-relaxed">
                                    <b>Catatan Tambahan Pekerjaan:</b> {printDetailObj.originalDescription}
                                  </td>
                                </tr>
                              )}
                            </>
                          );
                        }

                        return (
                          <tr>
                            <td className="px-5 py-8 border-r border-slate-200 space-y-1.5">
                              <p className="font-extrabold text-slate-900">{printBill.type === "KSO" ? "Layanan Penagihan KSO Bulanan" : "Pengadaan Belanja ATK Kantor RS"}</p>
                              <p className="text-slate-550 italic leading-relaxed whitespace-pre-wrap">
                                {(() => {
                                  if (printBill.description && printBill.description.startsWith("{")) {
                                    try {
                                      const parsed = JSON.parse(printBill.description);
                                      return parsed.originalDescription || "Uraian klaim tagihan logistik ATK.";
                                    } catch (e) {
                                      return printBill.description;
                                    }
                                  }
                                  return printBill.description || "Uraian klaim tagihan berdasarkan Berita Acara (BA) Pelayanan yang disetujui.";
                                })()}
                              </p>
                            </td>
                            <td className="px-5 py-8 text-right border-r border-slate-200 font-mono font-medium text-slate-700">
                              {formatIDR(printBill.serviceAmount)}
                            </td>
                            <td className="px-5 py-8 text-right font-mono font-medium text-slate-700">
                              {formatIDR(printBill.ppnAmount)}
                            </td>
                          </tr>
                        );
                      })()}
                      
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
                    <span className="text-slate-400 block font-bold text-[10px] uppercase">
                      {printBill.jabatanSiteCoordinator || "Dibuat Oleh (Site)"}:
                    </span>
                    <div className="h-16 flex items-end justify-center">
                      <span className="font-extrabold border-b border-slate-400 pb-0.5 text-slate-800">
                        {printBill.namaSiteCoordinator || printBill.createdBy || "Site Coordinator"}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-450 block mt-1">
                      {printBill.namaPerusahaanSite || "Site Coordinator"}
                    </span>
                  </div>

                  <div className="hidden md:block">
                    <span className="text-slate-400 block font-bold text-[10px] uppercase">Ditinjau oleh (HQ):</span>
                    <div className="h-16 flex items-end justify-center">
                      <span className="font-extrabold border-b border-slate-400 pb-0.5 text-slate-800 font-sans">
                        {printBill.verifiedBy || "Manager HQ"}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-450 block mt-1">Manager Verifikasi Kantor Pusat</span>
                  </div>

                  <div>
                    <span className="text-slate-400 block font-bold text-[10px] uppercase">
                      {printBill.jabatanDirektur || "Mengetahui (Penerima RS)"}:
                    </span>
                    <div className="h-16 flex items-end justify-center">
                      <span className="font-extrabold border-b border-slate-400 pb-0.5 text-slate-800">
                        {printBill.namaDirektur || "Direktur / Keuangan RS Client"}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-450 block mt-1 font-mono">
                      {printBill.nipDirektur ? `NIP: ${printBill.nipDirektur}` : "RS Client"}
                    </span>
                  </div>
                </div>

                {/* Legal and Disclaimer footer */}
                <div className="pt-8 border-t border-slate-150 text-[10px] text-slate-400 leading-relaxed font-sans flex flex-col md:flex-row md:items-center justify-between gap-2">
                  <span>* Invoice cetak ini sah diterbitkan secara elektronik oleh Medika KSO Sistem Nusantara.</span>
                  <span className="font-mono">IP: system_verification_key_{printBill.id}</span>
                </div>

              </div>
                );
              })()}
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

        {/* Action Controls for site coordinator creation */}
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

        {isHQ && currentUser?.role !== "Manager Keuangan" && (
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
              
              {/* Site Dropdown (Locked for Site Coordinators) */}
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
                    <option value="Draft">Draft (Site Co.)</option>
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
                            Created by: {bill.createdBy || "Site Coordinator"}
                          </div>
                        </td>

                        {/* Description */}
                        <td className="px-5 py-4">
                          {(() => {
                            let displayDesc = bill.description || "-";
                            if (bill.description && bill.description.trim().startsWith("{")) {
                              try {
                                const parsed = JSON.parse(bill.description);
                                if (parsed && parsed.isDetailed) {
                                  displayDesc = parsed.originalDescription || "Rincian Penerimaan KSO";
                                } else if (parsed && (parsed.isAtkDetailed || parsed.isDetailedAtk)) {
                                  displayDesc = parsed.originalDescription || "Rincian Penerimaan ATK";
                                }
                              } catch (e) {
                                // ignore
                              }
                            }
                            return (
                              <div className="max-w-xs truncate text-slate-600 dark:text-slate-350" title={displayDesc}>
                                {displayDesc}
                              </div>
                            );
                          })()}
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
                            ? "bg-blue-600 text-white shadow" 
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
                    <label className="block text-[10px] text-slate-400 font-extrabold uppercase tracking-wider mb-1">Bulan Penerimaan</label>
                    <input
                      type="month"
                      value={periodMonth}
                      onChange={e => setPeriodMonth(e.target.value)}
                      required
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl text-xs font-semibold focus:outline-none focus:border-indigo-500 dark:text-slate-100"
                    />
                  </div>

                  {/* No Rekap Tagihan */}
                  <div className="bg-slate-50/50 dark:bg-slate-950/20 p-3.5 border border-slate-200/50 dark:border-slate-850 rounded-2xl">
                    <span className="block text-[10px] text-indigo-700 dark:text-indigo-400 font-extrabold uppercase tracking-wider mb-2.5">📋 No Rekap Tagihan</span>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="col-span-1">
                        <label className="block text-[9px] text-slate-400 font-extrabold uppercase tracking-wide mb-1">
                          Auto Count (3 Digit)
                        </label>
                        <div className="flex items-center gap-1.5 bg-white dark:bg-slate-905 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-1.5 shadow-2xs">
                          <input
                            type="text"
                            maxLength={3}
                            placeholder="001"
                            value={rekapCounter}
                            onChange={e => {
                              const val = e.target.value.replace(/\D/g, "");
                              setRekapCounter(val);
                            }}
                            className="w-full bg-transparent border-0 p-0 text-center text-xs font-mono font-black text-indigo-600 dark:text-indigo-400 focus:outline-none focus:ring-0"
                          />
                        </div>
                      </div>
                      <div className="col-span-2">
                        <label className="block text-[9px] text-slate-400 font-extrabold uppercase tracking-wide mb-1">
                          Format Suffix (Free Text)
                        </label>
                        <div className="flex items-center gap-1.5 bg-white dark:bg-slate-905 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 shadow-2xs">
                          <input
                            type="text"
                            placeholder="e.g. /BA-KSO/VI/2026"
                            value={rekapSuffix}
                            onChange={e => setRekapSuffix(e.target.value)}
                            className="w-full bg-transparent border-0 p-0 text-left text-xs font-semibold focus:outline-none focus:ring-0 dark:text-slate-100"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Pengaturan Kolom Tanda Tangan Cetakan */}
                  <div className="bg-slate-50/50 dark:bg-slate-950/20 p-4 border border-slate-200/50 dark:border-slate-850 rounded-2xl space-y-4">
                    <span className="block text-[10px] text-indigo-700 dark:text-indigo-400 font-extrabold uppercase tracking-wide">✍️ Pengaturan Kolom Tanda Tangan Cetakan</span>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Left: RS Sign-off (Direktur) */}
                      <div className="space-y-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-3.5 shadow-3xs rounded-xl">
                        <span className="block text-[9.5px] font-black text-rose-600 dark:text-red-400 uppercase tracking-wide">Direktur RS Client (Kiri Bawah)</span>
                        <div>
                          <label className="block text-[9px] text-slate-400 font-extrabold uppercase mb-1">Nama Direktur</label>
                          <input
                            type="text"
                            placeholder="Contoh: dr. Fauzi, Sp.A"
                            value={namaDirektur}
                            onChange={(e) => setNamaDirektur(e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-semibold focus:outline-none focus:border-indigo-500 dark:text-slate-100 placeholder:opacity-50"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[9px] text-slate-400 font-extrabold uppercase mb-1">NIP (Optional)</label>
                            <input
                              type="text"
                              placeholder="NIP"
                              value={nipDirektur}
                              onChange={(e) => setNipDirektur(e.target.value)}
                              className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-mono font-semibold focus:outline-none focus:border-indigo-500 dark:text-slate-100 placeholder:opacity-50"
                            />
                          </div>
                          <div>
                            <label className="block text-[9px] text-slate-400 font-extrabold uppercase mb-1">Jabatan</label>
                            <input
                              type="text"
                              placeholder="Direktur"
                              value={jabatanDirektur}
                              onChange={(e) => setJabatanDirektur(e.target.value)}
                              className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-semibold focus:outline-none focus:border-indigo-500 dark:text-slate-100 placeholder:opacity-50"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Right: Site Coordinator Medika (Kanan Bawah) */}
                      <div className="space-y-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-3.5 shadow-3xs rounded-xl">
                        <span className="block text-[9.5px] font-black text-indigo-650 dark:text-indigo-400 uppercase tracking-wide">Site Coordinator KSO (Kanan Bawah)</span>
                        <div>
                          <label className="block text-[9px] text-slate-400 font-extrabold uppercase mb-1">Nama Site Coordinator</label>
                          <input
                            type="text"
                            placeholder="Contoh: Fajri Fanani"
                            value={namaSiteCoordinator}
                            onChange={(e) => setNamaSiteCoordinator(e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-semibold focus:outline-none focus:border-indigo-500 dark:text-slate-100 placeholder:opacity-50"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[9px] text-slate-400 font-extrabold uppercase mb-1">Nama Perusahaan</label>
                            <input
                              type="text"
                              placeholder="PT. Medika KSO Indonesia"
                              value={namaPerusahaanSite}
                              onChange={(e) => setNamaPerusahaanSite(e.target.value)}
                              className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-semibold focus:outline-none focus:border-indigo-500 dark:text-slate-100 placeholder:opacity-50"
                            />
                          </div>
                          <div>
                            <label className="block text-[9px] text-slate-400 font-extrabold uppercase mb-1">Jabatan</label>
                            <input
                              type="text"
                              placeholder="Site Coordinator"
                              value={jabatanSiteCoordinator}
                              onChange={(e) => setJabatanSiteCoordinator(e.target.value)}
                              className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-semibold focus:outline-none focus:border-indigo-500 dark:text-slate-100 placeholder:opacity-50"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Net Service amount & PPN calculations */}
                  {type === "KSO" && (
                    <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-3xl p-4 sm:p-5 space-y-5 shadow-xs">
                      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/70 pb-3">
                        <div className="flex items-center gap-2">
                          <Receipt className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                          <span className="text-xs font-black text-slate-800 dark:text-slate-200">Perhitungan Rincian Nilai Pokok (DPP)</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setIsDetailedKSO(!isDetailedKSO)}
                          className="text-[10px] bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-indigo-600 dark:text-indigo-400 font-extrabold px-3 py-1.5 rounded-lg transition-all"
                        >
                          {isDetailedKSO ? "🔄 Ganti ke Input Manual" : "📊 Ganti ke Rincian Item"}
                        </button>
                      </div>

                      {isDetailedKSO ? (
                        <div className="space-y-5">
                          {/* Category 1: Penerimaan Tunai */}
                          <div className="border border-slate-100 dark:border-slate-800 rounded-2xl p-4 bg-slate-50/50 dark:bg-slate-950/20 space-y-3">
                            <div className="flex items-center justify-between border-b border-slate-105 dark:border-slate-800/80 pb-2">
                              <span className="text-[10.5px] text-emerald-600 dark:text-emerald-400 font-black uppercase tracking-wider flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                Penerimaan Tunai
                              </span>
                              <span className="text-xs font-mono font-extrabold text-slate-700 dark:text-slate-350">{formatIDR(tunaiSubtotal)}</span>
                            </div>
                            
                            <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                              {tunaiItems.map((item, idx) => (
                                <div key={item.id} className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-100 dark:border-slate-800 shadow-2xs space-y-2">
                                  <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-mono text-slate-400 font-extrabold shrink-0">{idx + 1}.</span>
                                    <input
                                      type="text"
                                      placeholder="Nama Penerimaan Tunai"
                                      value={item.name}
                                      onChange={(e) => {
                                        const next = [...tunaiItems];
                                        next[idx].name = e.target.value;
                                        setTunaiItems(next);
                                      }}
                                      className="w-full bg-transparent border-none p-0 text-xs font-semibold focus:ring-0 text-slate-800 dark:text-slate-100 placeholder:font-normal placeholder:opacity-55"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => setTunaiItems(tunaiItems.filter(t => t.id !== item.id))}
                                      className="text-red-500 hover:text-red-700 p-1 rounded-md hover:bg-red-50 dark:hover:bg-red-950/20 shrink-0 transition-all"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                  
                                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-dashed border-slate-100 dark:border-slate-800/50">
                                    <div>
                                      <label className="text-[9px] text-slate-400 font-extrabold block mb-0.5">NILAI KOTOR</label>
                                      <div className="flex items-center gap-1 bg-slate-50/50 dark:bg-slate-950 px-2 py-0.5 rounded-lg border border-slate-100 dark:border-slate-850">
                                        <span className="text-[9px] text-slate-400 font-mono">Rp</span>
                                        <input
                                          type="number"
                                          placeholder="Nilai Tunai"
                                          value={item.value || ""}
                                          onChange={(e) => {
                                            const next = [...tunaiItems];
                                            next[idx].value = Math.max(0, parseInt(e.target.value, 10)) || 0;
                                            setTunaiItems(next);
                                          }}
                                          className="w-full bg-transparent border-none p-0.5 text-xs font-mono font-bold focus:ring-0 text-slate-800 dark:text-slate-100"
                                        />
                                      </div>
                                    </div>
                                    <div>
                                      <label className="text-[9px] text-slate-400 font-extrabold block mb-0.5">POTONGAN ADMIN (OPTIONAL)</label>
                                      <div className="flex items-center gap-1 bg-slate-50/50 dark:bg-slate-950 px-2 py-0.5 rounded-lg border border-slate-100 dark:border-slate-850">
                                        <span className="text-[9px] text-red-400 font-mono">-Rp</span>
                                        <input
                                          type="number"
                                          placeholder="Admin"
                                          value={item.admin || ""}
                                          onChange={(e) => {
                                            const next = [...tunaiItems];
                                            next[idx].admin = Math.max(0, parseInt(e.target.value, 10)) || 0;
                                            setTunaiItems(next);
                                          }}
                                          className="w-full bg-transparent border-none p-0.5 text-xs font-mono font-bold focus:ring-0 text-red-550"
                                        />
                                      </div>
                                    </div>
                                  </div>
                                  
                                  <div className="flex justify-end text-[9px] font-bold text-slate-400 pt-1 border-t border-slate-50 dark:border-slate-850">
                                    Total item Tunai: <span className="font-mono text-emerald-600 dark:text-emerald-450 ml-1.5">{formatIDR(item.value - (item.admin || 0))}</span>
                                  </div>
                                </div>
                              ))}
                              
                              {tunaiItems.length === 0 && (
                                <p className="text-[10px] italic text-slate-400 text-center font-medium my-2 py-1">Belum ada item penerimaan tunai.</p>
                              )}
                            </div>
                            
                            <button
                              type="button"
                              onClick={addTunaiItem}
                              className="w-full py-2 text-[10px] font-extrabold text-emerald-600 dark:text-emerald-450 bg-emerald-50/40 hover:bg-emerald-50 dark:bg-emerald-950/20 dark:hover:bg-emerald-950/40 border border-dashed border-emerald-250 dark:border-emerald-900/40 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                            >
                              ➕ Tambah Penerimaan Tunai
                            </button>
                          </div>

                          {/* Category 2: Penerimaan BPJS */}
                          <div className="border border-slate-100 dark:border-slate-800 rounded-2xl p-4 bg-slate-50/50 dark:bg-slate-950/20 space-y-3">
                            <div className="flex items-center justify-between border-b border-slate-105 dark:border-slate-800/80 pb-2">
                              <span className="text-[10.5px] text-blue-600 dark:text-blue-400 font-black uppercase tracking-wider flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                                Penerimaan BPJS
                              </span>
                              <span className="text-xs font-mono font-extrabold text-slate-700 dark:text-slate-350">{formatIDR(bpjsSubtotal)}</span>
                            </div>
                            
                            <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                              {bpjsItems.map((item, idx) => (
                                <div key={item.id} className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-100 dark:border-slate-800 shadow-2xs space-y-2">
                                  <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-mono text-slate-400 font-extrabold shrink-0">{idx + 1}.</span>
                                    <input
                                      type="text"
                                      placeholder="Nama Penerimaan BPJS"
                                      value={item.name}
                                      onChange={(e) => {
                                        const next = [...bpjsItems];
                                        next[idx].name = e.target.value;
                                        setBpjsItems(next);
                                      }}
                                      className="w-full bg-transparent border-none p-0 text-xs font-semibold focus:ring-0 text-slate-800 dark:text-slate-100 placeholder:font-normal placeholder:opacity-55"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => setBpjsItems(bpjsItems.filter(b => b.id !== item.id))}
                                      className="text-red-500 hover:text-red-700 p-1 rounded-md hover:bg-red-50 dark:hover:bg-red-950/20 shrink-0 transition-all"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                  
                                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-dashed border-slate-100 dark:border-slate-800/50">
                                    <div>
                                      <label className="text-[9px] text-slate-400 font-extrabold block mb-0.5">NILAI KOTOR</label>
                                      <div className="flex items-center gap-1 bg-slate-50/50 dark:bg-slate-950 px-2 py-0.5 rounded-lg border border-slate-100 dark:border-slate-850">
                                        <span className="text-[9px] text-slate-400 font-mono">Rp</span>
                                        <input
                                          type="number"
                                          placeholder="Nilai BPJS"
                                          value={item.value || ""}
                                          onChange={(e) => {
                                            const next = [...bpjsItems];
                                            next[idx].value = Math.max(0, parseInt(e.target.value, 10)) || 0;
                                            setBpjsItems(next);
                                          }}
                                          className="w-full bg-transparent border-none p-0.5 text-xs font-mono font-bold focus:ring-0 text-slate-800 dark:text-slate-100"
                                        />
                                      </div>
                                    </div>
                                    <div>
                                      <label className="text-[9px] text-slate-400 font-extrabold block mb-0.5">POTONGAN ADMIN (OPTIONAL)</label>
                                      <div className="flex items-center gap-1 bg-slate-50/50 dark:bg-slate-950 px-2 py-0.5 rounded-lg border border-slate-100 dark:border-slate-850">
                                        <span className="text-[9px] text-red-400 font-mono">-Rp</span>
                                        <input
                                          type="number"
                                          placeholder="Admin"
                                          value={item.admin || ""}
                                          onChange={(e) => {
                                            const next = [...bpjsItems];
                                            next[idx].admin = Math.max(0, parseInt(e.target.value, 10)) || 0;
                                            setBpjsItems(next);
                                          }}
                                          className="w-full bg-transparent border-none p-0.5 text-xs font-mono font-bold focus:ring-0 text-red-500"
                                        />
                                      </div>
                                    </div>
                                  </div>
                                  
                                  <div className="flex justify-end text-[9px] font-bold text-slate-400 pt-1 border-t border-slate-50 dark:border-slate-850">
                                    Total item BPJS: <span className="font-mono text-blue-600 dark:text-blue-400 ml-1.5">{formatIDR(item.value - (item.admin || 0))}</span>
                                  </div>
                                </div>
                              ))}
                              
                              {bpjsItems.length === 0 && (
                                <p className="text-[10px] italic text-slate-400 text-center font-medium my-2 py-1">Belum ada item penerimaan BPJS.</p>
                              )}
                            </div>
                            
                            <button
                              type="button"
                              onClick={addBpjsItem}
                              className="w-full py-2 text-[10px] font-extrabold text-blue-600 dark:text-blue-450 bg-blue-50/40 hover:bg-blue-50 dark:bg-blue-950/20 dark:hover:bg-blue-950/40 border border-dashed border-blue-250 dark:border-blue-900/40 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                            >
                              ➕ Tambah Penerimaan BPJS
                            </button>
                          </div>

                          {/* Category 3: Penerimaan Asuransi Lain */}
                          <div className="border border-slate-100 dark:border-slate-800 rounded-2xl p-4 bg-slate-50/50 dark:bg-slate-950/20 space-y-3">
                            <div className="flex items-center justify-between border-b border-slate-105 dark:border-slate-800/80 pb-2">
                              <span className="text-[10.5px] text-indigo-600 dark:text-indigo-400 font-black uppercase tracking-wider flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
                                Penerimaan Asuransi Lain
                              </span>
                              <span className="text-xs font-mono font-extrabold text-slate-700 dark:text-slate-350">{formatIDR(asuransiSubtotal)}</span>
                            </div>
                            
                            <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                              {asuransiItems.map((item, idx) => (
                                <div key={item.id} className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-100 dark:border-slate-800 shadow-2xs space-y-2">
                                  <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-mono text-slate-400 font-extrabold shrink-0">{idx + 1}.</span>
                                    <input
                                      type="text"
                                      placeholder="Nama Asuransi Lain"
                                      value={item.name}
                                      onChange={(e) => {
                                        const next = [...asuransiItems];
                                        next[idx].name = e.target.value;
                                        setAsuransiItems(next);
                                      }}
                                      className="w-full bg-transparent border-none p-0 text-xs font-semibold focus:ring-0 text-slate-800 dark:text-slate-100 placeholder:font-normal placeholder:opacity-55"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => setAsuransiItems(asuransiItems.filter(a => a.id !== item.id))}
                                      className="text-red-500 hover:text-red-700 p-1 rounded-md hover:bg-red-50 dark:hover:bg-red-950/20 shrink-0 transition-all"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                  
                                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-dashed border-slate-100 dark:border-slate-800/50">
                                    <div>
                                      <label className="text-[9px] text-slate-400 font-extrabold block mb-0.5">NILAI KOTOR</label>
                                      <div className="flex items-center gap-1 bg-slate-50/50 dark:bg-slate-950 px-2 py-0.5 rounded-lg border border-slate-100 dark:border-slate-850">
                                        <span className="text-[9px] text-slate-400 font-mono">Rp</span>
                                        <input
                                          type="number"
                                          placeholder="Nilai Asuransi"
                                          value={item.value || ""}
                                          onChange={(e) => {
                                            const next = [...asuransiItems];
                                            next[idx].value = Math.max(0, parseInt(e.target.value, 10)) || 0;
                                            setAsuransiItems(next);
                                          }}
                                          className="w-full bg-transparent border-none p-0.5 text-xs font-mono font-bold focus:ring-0 text-slate-800 dark:text-slate-100"
                                        />
                                      </div>
                                    </div>
                                    <div>
                                      <label className="text-[9px] text-slate-400 font-extrabold block mb-0.5">POTONGAN ADMIN (OPTIONAL)</label>
                                      <div className="flex items-center gap-1 bg-slate-50/50 dark:bg-slate-950 px-2 py-0.5 rounded-lg border border-slate-100 dark:border-slate-850">
                                        <span className="text-[9px] text-red-400 font-mono">-Rp</span>
                                        <input
                                          type="number"
                                          placeholder="Admin"
                                          value={item.admin || ""}
                                          onChange={(e) => {
                                            const next = [...asuransiItems];
                                            next[idx].admin = Math.max(0, parseInt(e.target.value, 10)) || 0;
                                            setAsuransiItems(next);
                                          }}
                                          className="w-full bg-transparent border-none p-0.5 text-xs font-mono font-bold focus:ring-0 text-red-550"
                                        />
                                      </div>
                                    </div>
                                  </div>
                                  
                                  <div className="flex justify-end text-[9px] font-bold text-slate-400 pt-1 border-t border-slate-50 dark:border-slate-850">
                                    Total item Asuransi: <span className="font-mono text-indigo-600 dark:text-indigo-400 ml-1.5">{formatIDR(item.value - (item.admin || 0))}</span>
                                  </div>
                                </div>
                              ))}
                              
                              {asuransiItems.length === 0 && (
                                <p className="text-[10px] italic text-slate-400 text-center font-medium my-2 py-1">Belum ada item penerimaan asuransian.</p>
                              )}
                            </div>
                            
                            <button
                              type="button"
                              onClick={addAsuransiItem}
                              className="w-full py-2 text-[10px] font-extrabold text-indigo-600 dark:text-indigo-450 bg-indigo-50/40 hover:bg-indigo-50 dark:bg-indigo-950/20 dark:hover:bg-indigo-950/40 border border-dashed border-indigo-250 dark:border-indigo-900/40 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                            >
                              ➕ Tambah Penerimaan Asuransi Lain
                            </button>
                          </div>

                          {/* Category 4: Pengurang Pokok (Deductions) */}
                          <div className="border border-slate-100 dark:border-slate-800 rounded-2xl p-4 bg-slate-50/50 dark:bg-slate-950/20 space-y-3">
                            <div className="flex items-center justify-between border-b border-slate-105 dark:border-slate-800/80 pb-2">
                              <span className="text-[10.5px] text-rose-600 dark:text-rose-450 font-black uppercase tracking-wider flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                                🔴 Daftar Pengurang Pokok (Optional)
                              </span>
                              <span className="text-xs font-mono font-extrabold text-rose-650 dark:text-rose-455">-{formatIDR(pengurangSubtotal)}</span>
                            </div>
                            
                            <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                              {pengurangItems.map((item, idx) => (
                                <div key={item.id} className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-100 dark:border-slate-800 shadow-2xs space-y-2">
                                  <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-mono text-slate-400 font-extrabold shrink-0">{idx + 1}.</span>
                                    <input
                                      type="text"
                                      placeholder="Nama pengurang (contoh: Audit BPJS)"
                                      value={item.name}
                                      onChange={(e) => {
                                        const next = [...pengurangItems];
                                        next[idx].name = e.target.value;
                                        setPengurangItems(next);
                                      }}
                                      className="w-full bg-transparent border-none p-0 text-xs font-semibold focus:ring-0 text-slate-800 dark:text-slate-100 placeholder:font-normal placeholder:opacity-55"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => setPengurangItems(pengurangItems.filter(p => p.id !== item.id))}
                                      className="text-red-500 hover:text-red-700 p-1 rounded-md hover:bg-red-50 dark:hover:bg-red-950/20 shrink-0 transition-all"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                  
                                  <div className="grid grid-cols-1 pt-2 border-t border-dashed border-slate-100 dark:border-slate-800/50">
                                    <div>
                                      <label className="text-[9px] text-slate-400 font-extrabold block mb-0.5">NILAI POTONGAN PENGURANG</label>
                                      <div className="flex items-center gap-1 bg-slate-50/50 dark:bg-slate-950 px-2 py-0.5 rounded-lg border border-slate-100 dark:border-slate-850">
                                        <span className="text-[9px] text-red-500 font-bold">-Rp</span>
                                        <input
                                          type="number"
                                          placeholder="Nilai Pengurang"
                                          value={item.value || ""}
                                          onChange={(e) => {
                                            const next = [...pengurangItems];
                                            next[idx].value = Math.max(0, parseInt(e.target.value, 10)) || 0;
                                            setPengurangItems(next);
                                          }}
                                          className="w-full bg-transparent border-none p-0.5 text-xs font-mono font-bold focus:ring-0 text-red-550 focus:outline-none"
                                        />
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                              
                              {pengurangItems.length === 0 && (
                                <p className="text-[10px] italic text-slate-400 text-center font-medium my-2 py-1">Belum ada item pengurang pokok.</p>
                              )}
                            </div>
                            
                            <button
                              type="button"
                              onClick={addPengurangItem}
                              className="w-full py-2 text-[10px] font-extrabold text-rose-600 dark:text-rose-455 bg-rose-50/40 hover:bg-rose-50 dark:bg-rose-950/20 dark:hover:bg-rose-950/40 border border-dashed border-rose-250 dark:border-rose-900/40 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                            >
                              ➕ Tambah Item Pengurang Pokok
                            </button>
                          </div>

                          {/* Calculations summaries */}
                          <div className="border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 bg-indigo-50/10 dark:bg-indigo-950/5 space-y-3">
                            <h4 className="text-[10px] font-black uppercase text-indigo-700 dark:text-indigo-400 tracking-wider">📊 Ringkasan Kalkulasi Akumulasi</h4>
                            
                            <div className="text-xs space-y-1.5 pl-1">
                              <div className="flex justify-between text-slate-650 dark:text-slate-400">
                                <span>🟢 Subtotal Penerimaan Tunai (Net):</span>
                                <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-450">{formatIDR(tunaiSubtotal)}</span>
                              </div>
                              <div className="flex justify-between text-slate-650 dark:text-slate-400">
                                <span>🔵 Subtotal Penerimaan BPJS (Net):</span>
                                <span className="font-mono font-semibold text-blue-600 dark:text-blue-450">{formatIDR(bpjsSubtotal)}</span>
                              </div>
                              <div className="flex justify-between text-slate-650 dark:text-slate-400">
                                <span>🟣 Subtotal Penerimaan Asuransi (Net):</span>
                                <span className="font-mono font-semibold text-indigo-650 dark:text-indigo-400">{formatIDR(asuransiSubtotal)}</span>
                              </div>
                            </div>

                            <div className="flex justify-between items-center text-xs font-bold text-slate-700 dark:text-slate-300 pt-2 border-t border-slate-200/60 dark:border-slate-800">
                              <span>Total Penerimaan Keseluruhan:</span>
                              <span className="font-mono font-extrabold text-slate-900 dark:text-slate-100">{formatIDR(overallReceiptTotal)}</span>
                            </div>

                            {/* Aggregated Pengurang display */}
                            <div className="flex items-center justify-between gap-4 pt-1.5 border-t border-dashed border-slate-200/50 dark:border-slate-800 text-xs font-semibold text-rose-600 dark:text-rose-400">
                              <span>🔴 Total Potongan Pengurang Pokok ({pengurangItems.length} Item):</span>
                              <span className="font-mono font-extrabold text-rose-600 dark:text-rose-400">-{formatIDR(totalPengurang)}</span>
                            </div>

                            <div className="flex justify-between items-center text-xs font-extrabold text-slate-850 dark:text-slate-200 pt-2 border-t border-slate-200/50 dark:border-slate-800">
                              <span>⚖️ Nilai Pokok Final (Net):</span>
                              <span className="font-mono text-slate-950 dark:text-slate-50">{formatIDR(nilaiPokokFinal)}</span>
                            </div>

                            {/* KSO share percent input */}
                            <div className="flex items-center justify-between gap-4 pt-2 border-t border-dashed border-slate-200/50 dark:border-slate-800">
                              <span className="text-xs font-semibold text-slate-650 dark:text-slate-400">📈 Persentase Sharing KSO (%):</span>
                              <div className="flex items-center gap-1 bg-white dark:bg-slate-900 px-2 py-1 border border-slate-200 dark:border-slate-800 rounded-xl transition-all">
                                <input
                                  type="number"
                                  step="any"
                                  value={sharePercent}
                                  onChange={e => setSharePercent(Math.max(0, parseFloat(e.target.value)) || 0)}
                                  className="w-16 text-center text-xs font-black focus:outline-none bg-transparent dark:text-slate-100 font-mono"
                                />
                                <span className="text-xs text-slate-400 font-bold">%</span>
                              </div>
                            </div>

                            <div className="flex justify-between items-center text-xs font-extrabold text-slate-850 dark:text-slate-200">
                              <span>💼 Dasar Penagihan (Sharing KSO):</span>
                              <span className="font-mono text-indigo-700 dark:text-indigo-400 font-extrabold">{formatIDR(dasarPenagihan)}</span>
                            </div>

                            {/* Tax treatment options */}
                            <div className="flex items-center justify-between text-xs font-semibold text-slate-650 dark:text-slate-400 pt-1.5 border-t border-dashed border-slate-200/50 dark:border-slate-800">
                              <span>Metode Perlakuan PPN:</span>
                              <div className="flex gap-1 bg-slate-100 dark:bg-slate-900 p-0.5 rounded-xl border border-slate-105 dark:border-slate-800">
                                <button
                                  type="button"
                                  onClick={() => setTaxTreatment("inklusif")}
                                  className={`px-3 py-1 text-[10px] font-black rounded-lg transition-all ${
                                    taxTreatment === "inklusif"
                                      ? "bg-indigo-600 text-white shadow"
                                      : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                                  }`}
                                >
                                  Inklusif
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setTaxTreatment("eksklusif")}
                                  className={`px-3 py-1 text-[10px] font-black rounded-lg transition-all ${
                                    taxTreatment === "eksklusif"
                                      ? "bg-indigo-600 text-white shadow"
                                      : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                                  }`}
                                >
                                  Eksklusif
                                </button>
                              </div>
                            </div>

                            {/* Persentase PPN (%) */}
                            <div className="flex items-center justify-between pt-1 border-t border-dashed border-slate-200/50 dark:border-slate-800">
                              <span className="text-xs font-semibold text-slate-650 dark:text-slate-400">Persentase Tarip PPN (%):</span>
                              <div className="flex items-center gap-1 bg-white dark:bg-slate-900 px-2 py-1 border border-slate-200 dark:border-slate-800 rounded-xl transition-all">
                                <input
                                  type="number"
                                  value={ppnPercent}
                                  onChange={e => setPpnPercent(Math.max(0, parseInt(e.target.value, 10)) || 0)}
                                  className="w-10 text-center text-xs font-extrabold focus:outline-none bg-transparent dark:text-slate-100 font-mono"
                                />
                                <span className="text-xs text-slate-400 font-bold">%</span>
                              </div>
                            </div>

                            {/* Calculated Result Box */}
                            <div className="bg-white dark:bg-slate-900 rounded-xl p-3 border border-indigo-100/55 dark:border-slate-850 text-xs font-semibold space-y-1 text-slate-650 dark:text-slate-400 shadow-3xs">
                              <div className="flex justify-between">
                                  <span>Hasil Nilai Penagihan (DPP):</span>
                                  <span className="font-mono text-slate-800 dark:text-slate-250 font-bold">{formatIDR(calculatedServiceAmount)}</span>
                              </div>
                              <div className="flex justify-between">
                                  <span>Tarif Pajak PPN ({ppnPercent}%):</span>
                                  <span className="font-mono text-indigo-500">+{formatIDR(calculatedPpnAmount)}</span>
                              </div>
                              <div className="flex justify-between text-xs font-black text-slate-900 dark:text-slate-100 pt-1.5 border-t border-slate-100 dark:border-slate-800/80">
                                  <span>Total Tagihan Akhir (Net):</span>
                                  <span className="font-mono text-indigo-650 dark:text-indigo-400 text-sm font-extrabold">{formatIDR(calculatedTotalAmount)}</span>
                              </div>
                            </div>

                          </div>
                        </div>
                      ) : (
                        /* Simple mode input if toggled off */
                        <div className="space-y-4">
                          <div>
                            <div className="flex justify-between items-center mb-1">
                              <label className="block text-[10px] text-slate-400 font-extrabold uppercase tracking-wider font-bold">Nilai Pokok / DPP (Sebelum PPN)</label>
                              <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-mono font-black">
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
                                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-205 dark:border-slate-850 rounded-xl text-xs font-mono font-extrabold focus:outline-none focus:border-indigo-500 dark:text-slate-105"
                              />
                            </div>
                          </div>

                          <div className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-2xl border border-slate-200/50 dark:border-slate-850 space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] text-slate-550 dark:text-slate-450 font-extrabold uppercase">Persentase PPN (%)</span>
                              <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 px-2 py-1 border border-slate-205 dark:border-slate-800 rounded-lg">
                                <input
                                  type="number"
                                  value={ppnPercent}
                                  onChange={e => setPpnPercent(Math.max(0, parseInt(e.target.value, 10)) || 0)}
                                  className="w-8 text-center text-xs font-extrabold focus:outline-none bg-transparent dark:text-slate-100 font-mono"
                                />
                                <span className="text-xs text-slate-400 font-bold">%</span>
                              </div>
                            </div>
                            <div className="space-y-1.5 text-[11px] pt-2 border-t border-slate-200 dark:border-slate-800/60 font-medium text-slate-600 dark:text-slate-400">
                              <div className="flex justify-between">
                                <span>Nilai DPP (Pokok):</span>
                                <span className="font-mono">{formatIDR(serviceAmount)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Nilai PPN ({ppnPercent}%):</span>
                                <span className="font-mono text-indigo-600 dark:text-indigo-400">+{formatIDR(currentCalculatedPpn)}</span>
                              </div>
                              <div className="flex justify-between text-slate-900 dark:text-slate-100 font-extrabold text-xs pt-2 border-t border-dashed border-slate-200 dark:border-slate-800">
                                <span>Total Penagihan:</span>
                                <span className="font-mono text-indigo-600 dark:text-indigo-400">{formatIDR(currentCalculatedTotal)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {type === "ATK" && (
                    <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-3xl p-4 sm:p-5 space-y-4 shadow-xs">
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <label className="block text-[10px] text-slate-400 font-extrabold uppercase tracking-wider font-bold">Nilai Pokok / DPP (Sebelum PPN)</label>
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-450 font-mono font-black">
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
                            className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-205 dark:border-slate-850 rounded-xl text-xs font-mono font-extrabold focus:outline-none focus:border-indigo-500 dark:text-slate-105"
                          />
                        </div>
                      </div>

                      <div className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-2xl border border-slate-200/50 dark:border-slate-850 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-slate-550 dark:text-slate-450 font-extrabold uppercase">Persentase PPN (%)</span>
                          <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 px-2 py-1 border border-slate-205 dark:border-slate-800 rounded-lg">
                            <input
                              type="number"
                              value={ppnPercent}
                              onChange={e => setPpnPercent(Math.max(0, parseInt(e.target.value, 10)) || 0)}
                              className="w-8 text-center text-xs font-extrabold focus:outline-none bg-transparent dark:text-slate-100 font-mono"
                            />
                            <span className="text-xs text-slate-400 font-bold">%</span>
                          </div>
                        </div>
                        <div className="space-y-1.5 text-[11px] pt-2 border-t border-slate-200 dark:border-slate-800/60 font-medium text-slate-600 dark:text-slate-400">
                          <div className="flex justify-between">
                            <span>Nilai DPP (Pokok):</span>
                            <span className="font-mono">{formatIDR(serviceAmount)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Nilai PPN ({ppnPercent}%):</span>
                            <span className="font-mono text-emerald-600 dark:text-emerald-400">+{formatIDR(currentCalculatedPpn)}</span>
                          </div>
                          <div className="flex justify-between text-slate-900 dark:text-slate-100 font-extrabold text-xs pt-2 border-t border-dashed border-slate-200 dark:border-slate-800">
                            <span>Total Tagihan ATK:</span>
                            <span className="font-mono text-emerald-600 dark:text-emerald-450">{formatIDR(currentCalculatedTotal)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

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

                  {/* Form Status selection (If Admin/HQ, they can choose directly; Site Coordinators see read-only badge to prevent dropdown lockups) */}
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

                    {/* Quick submit trigger for Site Coordinator */}
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
                          <span> Sebagai <strong>Manager/Admin</strong>, Anda dapat mengeklik tombol <strong>Edit Catatan</strong> di bawah untuk langsung mengubah statusnya, atau minta Site Coordinator mengajukannya agar masuk ke antrean verifikasi Anda.</span>
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
                        <p className="text-[9px] text-slate-450 mt-0.5">Dibuat oleh {selectedBill.createdBy || "Site Coordinator"} • {new Date(selectedBill.createdAt).toLocaleDateString("id-ID")}</p>
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
                      <span className="block text-[10px] text-slate-400 font-extrabold uppercase tracking-wide">🗓️ Bulan Penerimaan</span>
                      <span className="font-extrabold text-slate-805 dark:text-slate-200 mt-1 block">{formatPeriod(selectedBill.periodMonth)}</span>
                    </div>
                  </div>

                  {selectedBill.noRekap && (
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-850">
                      <span className="block text-[10px] text-slate-400 font-extrabold uppercase tracking-wide">📋 No Rekap Tagihan</span>
                      <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 mt-1 block text-xs">
                        {selectedBill.noRekap}
                      </span>
                    </div>
                  )}

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
                          <div className="flex items-center gap-1.5 shrink-0">
                            <label
                              htmlFor="direct-ba-upload"
                              className="p-1.5 bg-white hover:bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-650 dark:text-slate-400 rounded-lg cursor-pointer transition-all hover:text-indigo-650 block"
                              title="Unggah / Ganti Berkas"
                            >
                              <Upload className="w-3.5 h-3.5" />
                            </label>
                            <input
                              type="file"
                              id="direct-ba-upload"
                              accept="application/pdf,image/*,.docx,.xlsx"
                              className="hidden"
                              onChange={(e) => handleUploadDetailFileDirectly(e, "BA")}
                              disabled={isUploadingDetailFile}
                            />
                            <button
                              type="button"
                              onClick={() => downloadAttachmentFile(selectedBill.attachmentBeritaAcara!, selectedBill.attachmentBeritaAcaraName || "ba_dokumen.pdf")}
                              className="p-1.5 bg-white hover:bg-blue-50 hover:text-blue-600 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 rounded-lg cursor-pointer transition-all shrink-0"
                              title="Download BA file"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="p-2.5 bg-slate-50 dark:bg-slate-950 rounded-xl border border-dashed border-slate-300 dark:border-slate-805 flex flex-col items-center justify-center gap-1.5 text-center">
                          <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 italic">
                            <AlertTriangle className="w-3.5 h-3.5 text-slate-400" />
                            <span>Berita Acara belum dilampirkan.</span>
                          </div>
                          <label
                            htmlFor="direct-ba-upload-empty"
                            className="px-2.5 py-1 text-[10px] font-bold bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 border border-slate-205 dark:border-slate-800 rounded-lg hover:bg-indigo-50/50 dark:hover:bg-slate-800 transition-all cursor-pointer flex items-center gap-1 leading-none shadow-sm"
                          >
                            <Upload className="w-3 h-3" />
                            <span>Unggah BA (Tanda Tangan Basah)</span>
                          </label>
                          {(selectedBill.status === "Submitted" || selectedBill.status === "Verified") && (
                            <p className="text-[9px] text-indigo-600 dark:text-indigo-400 font-medium px-2 max-w-xs mt-1 leading-relaxed">
                              💡 Silakan unggah cetakan Berita Acara / Invoice yang sudah ditandatangani basah oleh kedua pihak di sini sebagai pelengkap tagihan.
                            </p>
                          )}
                          <input
                            type="file"
                            id="direct-ba-upload-empty"
                            accept="application/pdf,image/*,.docx,.xlsx"
                            className="hidden"
                            onChange={(e) => handleUploadDetailFileDirectly(e, "BA")}
                            disabled={isUploadingDetailFile}
                          />
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
                          <div className="flex items-center gap-1.5 shrink-0">
                            <label
                              htmlFor="direct-rekap-upload"
                              className="p-1.5 bg-white hover:bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-650 dark:text-slate-400 rounded-lg cursor-pointer transition-all hover:text-emerald-600 block"
                              title="Unggah / Rekam Rekap Tagihan"
                            >
                              <Upload className="w-3.5 h-3.5" />
                            </label>
                            <input
                              type="file"
                              id="direct-rekap-upload"
                              accept="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv"
                              className="hidden"
                              onChange={(e) => handleUploadDetailFileDirectly(e, "Rekap")}
                              disabled={isUploadingDetailFile}
                            />
                            <button
                              type="button"
                              onClick={() => downloadAttachmentFile(selectedBill.attachmentRekapTagihan!, selectedBill.attachmentRekapTagihanName || "rekap_tagihan.xlsx")}
                              className="p-1.5 bg-white hover:bg-emerald-50 hover:text-emerald-600 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 rounded-lg cursor-pointer transition-all shrink-0"
                              title="Download rekap tagihan"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="p-2.5 bg-slate-50 dark:bg-slate-950 rounded-xl border border-dashed border-slate-300 dark:border-slate-805 flex flex-col items-center justify-center gap-1.5 text-center">
                          <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 italic">
                            <AlertTriangle className="w-3.5 h-3.5 text-slate-400" />
                            <span>Rekapitulasi tagihan belum dilampirkan.</span>
                          </div>
                          <label
                            htmlFor="direct-rekap-upload-empty"
                            className="px-2.5 py-1 text-[10px] font-bold bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 border border-slate-205 dark:border-slate-800 rounded-lg hover:bg-emerald-50/50 dark:hover:bg-slate-800 transition-all cursor-pointer flex items-center gap-1 leading-none shadow-sm"
                          >
                            <Upload className="w-3 h-3" />
                            <span>Unggah Rekap Tagihan</span>
                          </label>
                          <input
                            type="file"
                            id="direct-rekap-upload-empty"
                            accept="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv"
                            className="hidden"
                            onChange={(e) => handleUploadDetailFileDirectly(e, "Rekap")}
                            disabled={isUploadingDetailFile}
                          />
                        </div>
                      )}

                    </div>
                  </div>

                  {/* Description segment */}
                  {(() => {
                    let selectedDetailedObj: any = null;
                    if (selectedBill && selectedBill.type === "KSO" && selectedBill.description) {
                      try {
                        const parsed = JSON.parse(selectedBill.description);
                        if (parsed && parsed.isDetailed) {
                          selectedDetailedObj = parsed;
                        }
                      } catch (e) {
                        // ignore
                      }
                    }

                    if (selectedDetailedObj) {
                      return (
                        <div className="space-y-4 pt-2.5 border-t border-slate-100 dark:border-slate-800">
                          <div>
                            <span className="block text-[10px] text-indigo-650 dark:text-indigo-400 font-extrabold uppercase tracking-wider mb-2">📊 Rincian Penerimaan KSO</span>
                            <div className="text-[11px] border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800/60">
                              
                              {/* Tunai items */}
                              {selectedDetailedObj.tunaiItems && selectedDetailedObj.tunaiItems.length > 0 && (
                                <div className="p-3 bg-slate-50/30 dark:bg-slate-950/20 space-y-1.5 font-sans">
                                  <div className="flex justify-between text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">
                                    <span>🟢 Penerimaan Tunai</span>
                                    <span className="font-mono">{formatIDR(selectedDetailedObj.tunaiItems.reduce((sum: number, i: any) => sum + (i.value || 0) - (i.admin || 0), 0))}</span>
                                  </div>
                                  <div className="space-y-1 pl-1.5 border-l-2 border-emerald-100 dark:border-emerald-900/60">
                                    {selectedDetailedObj.tunaiItems.map((item: any, idx: number) => (
                                      <div key={idx} className="text-slate-600 dark:text-slate-355 text-[10px]">
                                        <div className="flex justify-between font-semibold font-sans">
                                          <span className="truncate">{idx + 1}. {item.name || "Item Tunai"}</span>
                                          <span className="font-mono font-bold shrink-0">{formatIDR(item.value - (item.admin || 0))}</span>
                                        </div>
                                        {item.admin > 0 && (
                                          <div className="flex justify-between text-[8px] text-slate-400 font-mono">
                                            <span>&nbsp;&nbsp;- Nilai Kotor: {formatIDR(item.value)}</span>
                                            <span className="text-red-400">- Pot. Admin: {formatIDR(item.admin)}</span>
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* BPJS items */}
                              {selectedDetailedObj.bpjsItems && selectedDetailedObj.bpjsItems.length > 0 && (
                                <div className="p-3 bg-slate-50/30 dark:bg-slate-950/20 space-y-1.5 font-sans">
                                  <div className="flex justify-between text-[10px] font-extrabold text-blue-600 dark:text-blue-400 uppercase tracking-wide">
                                    <span>🔵 Penerimaan BPJS</span>
                                    <span className="font-mono">{formatIDR(selectedDetailedObj.bpjsItems.reduce((sum: number, i: any) => sum + (i.value || 0) - (i.admin || 0), 0))}</span>
                                  </div>
                                  <div className="space-y-1 pl-1.5 border-l-2 border-blue-105 dark:border-blue-900/60">
                                    {selectedDetailedObj.bpjsItems.map((item: any, idx: number) => (
                                      <div key={idx} className="text-slate-600 dark:text-slate-355 text-[10px]">
                                        <div className="flex justify-between font-semibold font-sans">
                                          <span className="truncate">{idx + 1}. {item.name || "BPJS Item"}</span>
                                          <span className="font-mono font-bold shrink-0">{formatIDR(item.value - (item.admin || 0))}</span>
                                        </div>
                                        {item.admin > 0 && (
                                          <div className="flex justify-between text-[8px] text-slate-400 font-mono">
                                            <span>&nbsp;&nbsp;- Nilai Kotor: {formatIDR(item.value)}</span>
                                            <span className="text-red-400">- Pot. Admin: {formatIDR(item.admin)}</span>
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Asuransi items */}
                              {selectedDetailedObj.asuransiItems && selectedDetailedObj.asuransiItems.length > 0 && (
                                <div className="p-3 bg-slate-50/30 dark:bg-slate-950/20 space-y-1.5 font-sans">
                                  <div className="flex justify-between text-[10px] font-extrabold text-indigo-650 dark:text-indigo-400 uppercase tracking-wide">
                                    <span>🟣 Penerimaan Asuransi Lain</span>
                                    <span className="font-mono">{formatIDR(selectedDetailedObj.asuransiItems.reduce((sum: number, i: any) => sum + (i.value || 0) - (i.admin || 0), 0))}</span>
                                  </div>
                                  <div className="space-y-1 pl-1.5 border-l-2 border-indigo-105 dark:border-indigo-900/60">
                                    {selectedDetailedObj.asuransiItems.map((item: any, idx: number) => (
                                      <div key={idx} className="text-slate-600 dark:text-slate-355 text-[10px]">
                                        <div className="flex justify-between font-semibold font-sans">
                                          <span className="truncate">{idx + 1}. {item.name || "Asuransi Item"}</span>
                                          <span className="font-mono font-bold shrink-0">{formatIDR(item.value - (item.admin || 0))}</span>
                                        </div>
                                        {item.admin > 0 && (
                                          <div className="flex justify-between text-[8px] text-slate-400 font-mono">
                                            <span>&nbsp;&nbsp;- Nilai Kotor: {formatIDR(item.value)}</span>
                                            <span className="text-red-400">- Pot. Admin: {formatIDR(item.admin)}</span>
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Pengurang items detail list */}
                              {((selectedDetailedObj.pengurangItems && selectedDetailedObj.pengurangItems.length > 0) || (selectedDetailedObj.pengurang > 0)) && (
                                <div className="p-3 bg-red-50/10 dark:bg-slate-950/20 space-y-1.5 font-sans">
                                  <div className="flex justify-between text-[10px] font-extrabold text-red-650 dark:text-red-400 uppercase tracking-wide">
                                    <span>🔴 Daftar Pengurang Pokok</span>
                                    <span className="font-mono">-{formatIDR(selectedDetailedObj.pengurangItems ? selectedDetailedObj.pengurangItems.reduce((sum: number, i: any) => sum + (i.value || 0), 0) : selectedDetailedObj.pengurang)}</span>
                                  </div>
                                  <div className="space-y-1 pl-1.5 border-l-2 border-red-200 dark:border-red-900/60">
                                    {selectedDetailedObj.pengurangItems && selectedDetailedObj.pengurangItems.length > 0 ? (
                                      selectedDetailedObj.pengurangItems.map((item: any, idx: number) => (
                                        <div key={idx} className="text-slate-600 dark:text-slate-355 text-[10px]">
                                          <div className="flex justify-between font-semibold font-sans">
                                            <span className="truncate">{idx + 1}. {item.name || "Item Pengurang"}</span>
                                            <span className="font-mono font-bold shrink-0">-{formatIDR(item.value)}</span>
                                          </div>
                                        </div>
                                      ))
                                    ) : (
                                      <div className="text-slate-600 dark:text-slate-355 text-[10px]">
                                        <div className="flex justify-between font-semibold font-sans">
                                          <span className="truncate">1. {selectedDetailedObj.namaPengurang || "Potongan Pokok"}</span>
                                          <span className="font-mono font-bold shrink-0">-{formatIDR(selectedDetailedObj.pengurang)}</span>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* Calculations */}
                              <div className="p-3 bg-indigo-50/10 dark:bg-slate-950/45 text-[10.5px] space-y-1 text-slate-600 dark:text-slate-400 font-sans">
                                <div className="flex justify-between font-black text-slate-800 dark:text-slate-100">
                                  <span>Total Nilai Pokok Final:</span>
                                  <span className="font-mono">
                                    {formatIDR(
                                      (selectedDetailedObj.tunaiItems || []).reduce((sum: number, i: any) => sum + (i.value || 0) - (i.admin || 0), 0) +
                                      (selectedDetailedObj.bpjsItems || []).reduce((sum: number, i: any) => sum + (i.value || 0) - (i.admin || 0), 0) +
                                      (selectedDetailedObj.asuransiItems || []).reduce((sum: number, i: any) => sum + (i.value || 0) - (i.admin || 0), 0) -
                                      (selectedDetailedObj.pengurangItems ? selectedDetailedObj.pengurangItems.reduce((sum: number, i: any) => sum + (i.value || 0), 0) : (selectedDetailedObj.pengurang || 0))
                                    )}
                                  </span>
                                </div>
                                <div className="flex justify-between font-semibold">
                                  <span>Rasio Sharing KSO:</span>
                                  <span className="font-mono">{selectedDetailedObj.sharePercent}%</span>
                                </div>
                                <div className="flex justify-between font-black text-indigo-650 dark:text-indigo-400 border-t border-slate-150/50 dark:border-slate-850 pt-1 mt-1">
                                  <span>Dasar Penagihan (Sharing):</span>
                                  <span className="font-mono">
                                    {formatIDR(
                                      (((selectedDetailedObj.tunaiItems || []).reduce((sum: number, i: any) => sum + (i.value || 0) - (i.admin || 0), 0) +
                                        (selectedDetailedObj.bpjsItems || []).reduce((sum: number, i: any) => sum + (i.value || 0) - (i.admin || 0), 0) +
                                        (selectedDetailedObj.asuransiItems || []).reduce((sum: number, i: any) => sum + (i.value || 0) - (i.admin || 0), 0) -
                                        (selectedDetailedObj.pengurangItems ? selectedDetailedObj.pengurangItems.reduce((sum: number, i: any) => sum + (i.value || 0), 0) : (selectedDetailedObj.pengurang || 0))) * (selectedDetailedObj.sharePercent || 0)) / 100
                                    )}
                                  </span>
                                </div>
                                <div className="flex justify-between text-[9px] text-slate-400 font-medium">
                                  <span>Metode Pajak PPN:</span>
                                  <span className="font-black uppercase">{selectedDetailedObj.taxTreatment === "inklusif" ? "Inklusif (Dalam)" : "Eksklusif (Luar)"}</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {selectedDetailedObj.originalDescription && (
                            <div>
                              <span className="block text-[10px] text-slate-400 font-extrabold uppercase tracking-wide">📝 Catatan Tambahan</span>
                              <p className="mt-1.5 p-3 bg-slate-50/65 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-850 leading-relaxed text-slate-755 dark:text-slate-300 font-sans whitespace-pre-wrap">
                                {selectedDetailedObj.originalDescription}
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    }

                    let displayDesc = selectedBill.description || "Tidak ada deskripsi tambahan.";
                    if (selectedBill.description && selectedBill.description.trim().startsWith("{")) {
                      try {
                        const parsed = JSON.parse(selectedBill.description);
                        if (parsed && (parsed.isDetailed || parsed.isAtkDetailed || parsed.isDetailedAtk)) {
                          displayDesc = parsed.originalDescription || "Rincian Penerimaan";
                        }
                      } catch (e) {
                        // ignore
                      }
                    }

                    return (
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3">
                        <div>
                          <span className="block text-[10px] text-slate-400 font-extrabold uppercase tracking-wide">
                            {selectedBill.type === "ATK" ? "📝 Deskripsi Belanja ATK" : "📝 Deskripsi / Uraian Rincian"}
                          </span>
                          <p className="mt-1.5 p-3 bg-slate-50/65 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-850 leading-relaxed text-slate-755 dark:text-slate-300 font-sans whitespace-pre-wrap">
                            {displayDesc}
                          </p>
                        </div>

                        {selectedBill.type === "ATK" && selectedBill.description && selectedBill.description.trim().startsWith("{") && (() => {
                          try {
                            const parsed = JSON.parse(selectedBill.description);
                            if (parsed && parsed.items && parsed.items.length > 0) {
                              return (
                                <div className="space-y-1.5 pt-1">
                                  <span className="block text-[9px] text-emerald-600 dark:text-emerald-400 font-extrabold uppercase tracking-wider">📦 Rincian Item Barang Belanja ({parsed.items.length})</span>
                                  <div className="max-h-48 overflow-y-auto border border-slate-150 dark:border-slate-800 rounded-xl divide-y divide-slate-100 dark:divide-slate-850 text-[10.5px]">
                                    {parsed.items.map((it: any, idx: number) => {
                                      const qty = it.qtyReceived !== undefined && it.qtyReceived > 0 
                                        ? it.qtyReceived 
                                        : (it.qtyShipped !== undefined && it.qtyShipped > 0 ? it.qtyShipped : it.qtyOrdered || 0);
                                      return (
                                        <div key={idx} className="p-2 flex justify-between gap-2.5 bg-slate-50/20 dark:bg-slate-900/20">
                                          <span className="font-semibold text-slate-700 dark:text-slate-300 truncate">{it.name}</span>
                                          <span className="font-bold text-slate-900 dark:text-slate-100 shrink-0 font-mono text-[10px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-md">{qty} {it.unit}</span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              );
                            }
                          } catch (e) {
                            // ignore
                          }
                          return null;
                        })()}
                      </div>
                    );
                  })()}

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-810 flex items-center justify-between text-[10px] text-slate-400 font-bold">
                    <span>Invoice ID: #{selectedBill.id}</span>
                    <span>Input: {selectedBill.createdBy || "Site Coordinator"}</span>
                  </div>
                </div>

                {/* 
                  INTERACTIVE WORKFLOW CONTROLS: Submit, Verify Reject, Or Print 
                */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                  
                  {/* Site Coordinator: Draft -> Submit (Diajukan) Action */}
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
