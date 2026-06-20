export interface User {
  id: string;
  username: string;
  name: string;
  nickname: string;
  password?: string;
  role: string;
  email: string;
  siteTugas?: string; // name of Client RS
  statusAktif?: boolean; // active status (default: true)
  divisi?: string; // department / division
  createdAt: string;
}

export interface ClientModuleStatus {
  id: string;
  modulName: string; // e.g. "Front Office", "Back Office" etc, chosen from Settings
  status: string; // e.g. "Instalasi / Setting", chosen from Settings statusImplementasi
  updatedAt: string;
  tanggalImplementasi?: string; // Tanggal Implementasi RS
}

export interface DirectorHistory {
  id: string;
  name: string;
  nip: string;
  startDate: string; // Tanggal Mulai Jabatan
  endDate: string;   // Tanggal Selesai Jabatan
  isActive: boolean; // Status Aktif
}

export interface ClientRoom {
  id: string;
  name: string;      // Nama Ruangan (e.g. Ruang UGD, Poli Anak)
  code?: string;      // Kode Ruangan (e.g. RU-01)
  floor?: string;     // Lantai (e.g. Lantai 1, Lantai 2)
  description?: string; // Keterangan tambahan
  createdAt: string;
}

export interface Client {
  id: string;
  namaRS: string;      // Nama RS
  noKSO: string;       // No KSO
  direkturRS: string;  // Direktur RS
  modulSIMRS: string;  // Modul SIMRS
  tanggalProject: string; // Tanggal Project
  tanggalCutOff: string;  // Tanggal Cut Off
  tipeMedika?: string; // Tipe Medika
  createdAt: string;
  moduleStatuses?: ClientModuleStatus[]; // Added in Phase 5 for dynamic module implementation status
  createdBy?: string;
  persentaseKSO?: number; // Persentase KSO (e.g. 10.5)
  directors?: DirectorHistory[]; // List of historical directors
  rooms?: ClientRoom[]; // Daftar Ruangan penempatan aset
}

export interface Project {
  id: string;
  kode: string;
  nama: string;
  modul: string;
  pic: string;
  client: string;
  asal: string;
  status: string;
  startDate: string;
  endDate: string;
  completionDate: string;
  prasyarat: string;
  notes: string;
  url: string;
  fiturModul?: string[];
  createdAt: string;
  createdBy?: string;
  linkedCommLogIds?: string[];
  linkedMeetingLogIds?: string[];
}

export interface SubTask {
  id: string;
  title: string;
  done: boolean;
}

export interface TaskComment {
  id: string;
  sender: string;
  role: string;
  text: string;
  createdAt: string;
  attachmentName?: string;
  attachmentData?: string;
}

export interface Task {
  id: string;
  project: string; // project code e.g. 'P01' or could be generic/empty if not Project-based
  modul: string;
  task: string;
  taskType: string;
  categoryProgress: string;
  pic: string;
  priority: string;
  status: string;
  startDate: string;
  dueDate: string;
  progress: number;
  notes: string;
  url: string;
  subtasks: SubTask[];
  createdAt: string;
  taskCategoryType?: 'Project' | 'Request' | 'Incident' | string;
  reporterName?: string;
  reporterDept?: string;
  glpiId?: string;
  mantisId?: string;
  gitlabId?: string;
  externalTicketStatus?: 'Open' | 'Closed' | '';
  createdBy?: string;
  assignerName?: string;
  assignerRole?: string;
  parentTaskId?: string;
  delegationNotes?: string;
  isDeleted?: boolean;
  deletedAt?: string;
  deletedBy?: string;
  linkedCommLogIds?: string[];
  linkedMeetingLogIds?: string[];
  comments?: TaskComment[];
  taskFileName?: string;
}

export interface CommLog {
  id: string;
  project: string;
  type: string;
  date: string;
  participants: string;
  summary: string;
  detail: string;
  createdBy?: string;
  noID?: string;
}

export interface MeetingLog {
  id: string;
  project: string;
  date: string;
  title: string;
  attendees: string;
  agenda: string;
  decisions: string;
  actions: string;
  createdBy?: string;
  noID?: string;
}

export interface Documentation {
  id: string;
  project: string;
  category: 'API Specs' | 'User Manual' | 'Desain' | 'Kontrak' | 'Lainnya';
  title: string;
  url: string;
  desc: string;
  date: string;
  createdBy?: string;
  noID?: string;
}

export interface LogEntry {
  id: string;
  projId: string;
  type: 'kendala' | 'solusi' | 'fokus';
  date: string;
  text: string;
  createdBy?: string;
}

export interface BALog {
  id: string;
  project: string; // Project code, e.g. "P01"
  noBA: string; // "No Berita Acara"
  title: string; // "Judul Rapat / Pelatihan"
  type: string; // e.g. "BA Serah Terima Alat", from Settings jenisBeritaAcara
  date: string;
  signatoryRS: string; // Penandatangan RS
  signatorySupport: string; // Penandatangan Pelaksana / Support
  notes: string; // Catatan Deskripsi
  fileUrl?: string; // Lampiran URL / Link Dokumen
  status: 'Draft' | 'Signed' | 'Approved' | string;
  createdBy?: string;
  noID?: string;
}

export interface Ticket {
  id: string;
  projectName: string; // Reference to Client RS (master data) or Project
  reporterName: string; // Nama User
  unit: string; // Unit
  reportType: 'Request' | 'Incident'; // Jenis Laporan (Request / Incident)
  title: string;
  description: string;
  status: 'Open' | 'In Progress' | 'Resolved' | string;
  priority: string; // Low, Medium, High, Urgent
  category?: string; // e.g. "Software/SIMRS", "Hardware/PC", "Network/Internet", etc.
  subCategory?: string; // Sub Kategori
  problemType?: string; // Jenis Masalah
  createdAt: string;
  createdBy?: string;
  ticketNumber?: string;
  fileUrl?: string;
  fileName?: string;
  picPelapor?: string;
  picTugas?: string;
  closedAt?: string;
  followUpLog?: string;
  dueDate?: string;
}

export interface SubModule {
  id: string;
  noFeature?: string; // No Fitur Modul (Otomatis 3-digit)
  name: string; // Nama Fitur Modul
  featureDesc: string; // Detail Keterangan Modul
  startDate?: string; // Rentang Implementasi Mulai (legacy)
  endDate?: string; // Rentang Implementasi Selesai (legacy)
  status: string; // Status Modul (Aktif, Non Aktif, Dalam Pengembangan)
  imageFileName?: string; // Gambar Modul (File name)
  imageFileData?: string; // Gambar Modul (File content base64 of img/pdf)
  releaseDate?: string; // Tanggal Realese Fitur
}

export interface AppModule {
  id: string;
  projectName: string; // Reference to Client RS or Project
  noModul?: string; // No Modul (Otomatis 3-digit)
  name: string; // Nama Modul
  type?: string; // Jenis Kelompok Modul (legacy)
  jenisModul?: string; // Jenis Modul (Front Office, Back Office, Bridging)
  jenisAplikasiModul?: string; // Jenis Aplikasi Modul (Web, Mobile)
  platformModul?: string; // Platform Modul (Desktop, Web)
  docFileName?: string; // Document filename
  docFileData?: string; // Document file data (Base64)
  pptFileName?: string; // PPT filename
  pptFileData?: string; // PPT file data (Base64)
  url?: string; // URL Modul
  releaseDate?: string; // Tanggal Realese Modul
  statusModul?: string; // Status Modul (Aktif, Non Aktif, Dalam Pengembangan)
  implementationStatus: string; // (legacy)
  implementationDate: string; // (legacy)
  pic: string; // PIC
  subModules: SubModule[]; // Fitur Modul anak
  createdAt: string;
  createdBy?: string;
}

export interface AssetSpecs {
  // Komputer specs
  processor?: string;
  ram?: string;
  storage?: string;
  os?: string;

  // Monitor specs
  screenSize?: string;
  resolution?: string;
  portType?: string;

  // Printer specs
  printerType?: string; // e.g. Laser, Inkjet, Thermal
  connectivity?: string; // e.g. USB, Wi-Fi, Ethernet
  printSpeed?: string;

  // Network Device specs
  deviceType?: string; // e.g. Router, Switch, Access Point, Firewall
  portCount?: string;
  bandwidth?: string;
}

export interface Asset {
  id: string;
  category: 'Komputer' | 'Monitor' | 'Printer' | 'Perangkat Jaringan' | string;
  serialNumber: string;
  deviceName: string;
  clientRS: string; // Deployment location (Master Data Client RS)
  roomId?: string;  // ID Ruangan penempatan
  roomName?: string; // Nama Ruangan penempatan
  pic: string;
  status: 'Aktif' | 'Rusak' | 'Maintenance' | string;
  specs: AssetSpecs;
  notes?: string;
  createdAt: string;
  createdBy?: string;
}

export interface SiteModuleImplementation {
  id: string;
  clientRS: string; // Master Client namaRS
  appModuleId: string; // AppModule ID
  appModuleName: string; // AppModule Name
  subModuleId?: string; // SubModule ID (Feature Modul)
  subModuleName?: string; // SubModule Name
  statusImplementasi: string; // e.g., Berjalan, Tidak Berjalan
  tanggalImplementasi: string; // e.g., 2026-05-24
  statusPenggunaan: string; // e.g., Optimal, Tidak Optimal
  kategoriImplementasi: string; // e.g., Request, Pengembangan
  picImplementasi: string; // e.g. User nickname/name assigned to this site
  keterangan: string; // Free text description
  createdAt: string;
  createdBy?: string;
}

export interface MonevLog {
  id: string;
  title: string;
  type: string; // e.g. "Mingguan" | "Bulanan" | "UAT" | "Isidental" | "Akhir Project"
  date: string;
  category: string; // e.g. "Kinerja" | "Kendala Teknis" | "Kehadiran" | "Komunikasi" | "Infrastruktur" | "Lainnya"
  findings: string;
  recommendations: string;
  status: string; // e.g. "Open" | "In Progress" | "Resolved"
  evaluatorPic: string; // Evaluator / PIC
  linkedProjectId?: string; // Optional Linked Project ID / Kode (can stand alone)
  linkedTaskId?: string; // Optional Linked Task ID (can stand alone)
  attachmentName?: string;
  attachmentData?: string; // Base64 encoding for attachment
  attachmentSize?: string;
  hasilEvaluasi?: string; // Phase additional field: secondary post-evaluation results input
  picAuditorRS?: string; // Additional field for Free Text Hospital Auditor / Evaluator PIC
  createdAt: string;
  createdBy?: string;
}

export interface BillingKSO {
  id: string;
  type: 'KSO' | 'ATK';
  clientRS: string; // Nama RS Client
  periodMonth: string; // Bulan pelayanan (bisa "YYYY-MM" atau deskriptif)
  serviceAmount: number; // Nilai Penagihan sebelum Pajak
  ppnPercent: number; // Persentasi PPN (e.g. 11%)
  ppnAmount: number; // Nilai PPN (Perhitungan: serviceAmount * ppnPercent / 100)
  totalAmount: number; // Nilai Total setelah PPN (serviceAmount + ppnAmount)
  description: string; // Uraian penagihan atau detail ATK yang dibeli
  status: 'Draft' | 'Submitted' | 'Verified' | 'Paid' | 'Cancelled'; // Status penagihan
  noRekap?: string; // No rekap tagihan otomatis + free text
  namaDirektur?: string; // Nama Direktur RS
  nipDirektur?: string; // NIP Direktur RS
  jabatanDirektur?: string; // Jabatan Direktur (default: Direktur)
  namaSiteCoordinator?: string; // Nama Site Coordinator
  jabatanSiteCoordinator?: string; // Jabatan Site Coordinator (default: Site Coordinator)
  namaPerusahaanSite?: string; // Nama perusahaan Site Coordinator (default: PT. Medika KSO Indonesia)
  tanggalKirim?: string; // Tanggal dikirimnya penagihan
  tanggalBayar?: string; // Tanggal pembayarannya
  attachmentBeritaAcara?: string; // Base64 content or url
  attachmentBeritaAcaraName?: string; // Filename for BA
  attachmentRekapTagihan?: string; // Base64 content or url
  attachmentRekapTagihanName?: string; // Filename for Rekap Tagihan
  submittedAt?: string;
  submittedBy?: string;
  verifiedAt?: string;
  verifiedBy?: string;
  revisionNotes?: string;
  createdAt: string;
  createdBy: string;
}

export interface AtkItem {
  id: string;
  name: string;
  unit: string; // e.g. "Box", "Pcs", "Rim"
  price: number; 
  stockQty?: number; // central logistics stock levels
  priceToday?: number;
  priceTomorrow?: number;
  createdAt: string;
  createdBy: string;
}

export interface AtkOrderItem {
  itemId: string;
  name: string;
  unit: string;
  qtyOrdered: number;
  qtyShipped: number;
  qtyReceived: number;
  price: number;
}

export interface AtkOrder {
  id: string;
  noPemesanan: string; // Auto generated e.g. "ORD-ATK-2026-0001"
  rekapId?: string; // Links multiple orders into a single consolidated procurement rekap batch
  clientRS: string; // Destination Site RS
  orderDate: string; // Tanggal Pemesanan
  status: 'Draft' | 'Diajukan' | 'Dikirim' | 'Diterima' | 'Diserahkan' | 'Billed';
  items: AtkOrderItem[];
  
  // Center dispatch details
  shippedDate?: string;
  shippedBy?: string;
  deliveryNotes?: string;
  
  // Site receipt details
  receivedDate?: string;
  receivedBy?: string;
  receiptNotes?: string;
  
  // RS delivery details
  deliveredToRSDate?: string;
  deliveredToRSBy?: string;
  fakturSementaraNo?: string; // Tanda Terima / Faktur sementara No
  
  // Link to final KSO ATK billing
  billingKsoId?: string;
  
  // Vendor procurement details
  vendorStatus?: 'Dipesan ke Vendor' | 'Barang Masuk Gudang Pusat' | string;
  vendorName?: string;
  vendorOrderNotes?: string;
  vendorNotes?: string;
  vendorArrivedDate?: string;
  vendorProcuredDate?: string;
  
  createdAt: string;
  createdBy: string;
}

export interface KasSiteTransaction {
  id: string;
  project: string; // Project code or Project id to link it "bisa diakses dari per site tugas"
  type: "Masuk" | "Keluar"; // "inputan uang kas masuk dari kantor pusat", dll.
  receiptNo: string; // "ada penomoran kwitansinya per pemasukan dan pengeluaran", "tanggal transaksinya, keterangan uang..."
  date: string;
  amount: number;
  description: string; // "keterangan uang tersebut buat apa"
  category?: string; // "kategori operasional e.g. Konsumsi, ATK, Transport, dll."
  receiptUrl?: string; // "ada upload kwitansi per transaksinya"
  status: "Draft" | "Pending" | "Approved" | "Rejected"; // "rekapan per bulan yang akan di cek dari site coordinator yang akan diajukan berkasnya ke kantor pusat"
  submittedMonth?: string; // Rekapan per bulan (e.g., "2026-06")
  replenishmentId?: string; // Link to KasSiteReplenishment
  createdAt: string;
  createdBy: string;
}

export interface KasSiteReplenishment {
  id: string;
  project: string; // Site name or code
  reqNo: string; // REQ-REPL-[DATE]-[RAND]
  startDate: string;
  endDate: string;
  totalExpenses: number;
  requestedAmount: number;
  date: string;
  notes?: string;
  status: "Pending" | "Approved" | "Rejected";
  transactionIds: string[]; // List of KasSiteTransaction IDs included in this period
  createdAt: string;
  createdBy: string;
  approvedAt?: string;
  approvedBy?: string;
  transferProofUrl?: string; // HQ transfer payment slip
}

export interface KasLock {
  id: string;
  month: string; // e.g. "2026-06"
  site: string;  // e.g. "Semua" or specific project code
  isLocked: boolean;
  lockedAt?: string;
  lockedBy?: string;
}

export interface KasUnlockRequest {
  id: string;
  month: string;
  site: string;
  reason: string;
  status: "Pending" | "Approved" | "Rejected";
  createdAt: string;
  createdBy: string;
  approvedAt?: string;
  approvedBy?: string;
}

export interface ChecklistItemSetting {
  id: string;
  category: string;
  name: string;
  okLabel: string;
  notOkLabel: string;
  active: boolean;
  order?: number;
}

export interface ChecklistSubmissionItem {
  id: string;
  category: string;
  name: string;
  status: "OK" | "NOT OK" | "";
  okLabel: string;
  notOkLabel: string;
  keterangan: string;
}

export interface ChecklistSubmission {
  id: string;
  site: string;       // RSUD / Client name
  tanggal: string;    // e.g. "Monday, 15 Jun 2026" or "2026-06-15"
  waktu: "Pagi" | "Sore";
  userCreator: string;
  roleCreator: string;
  items: ChecklistSubmissionItem[];
  photoName?: string;
  photoUrl?: string; // Base64 of JPEG/PNG or attachment
  createdAt: string;
  createdBy: string;
  isApproved?: boolean;
  approvedBy?: string;
  approvedAt?: string;
  approvedRole?: string;
}



