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
  createdAt: string;
}

export interface ClientModuleStatus {
  id: string;
  modulName: string; // e.g. "Front Office", "Back Office" etc, chosen from Settings
  status: string; // e.g. "Instalasi / Setting", chosen from Settings statusImplementasi
  updatedAt: string;
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
  createdAt: string;
  createdBy?: string;
}

export interface SubTask {
  id: string;
  title: string;
  done: boolean;
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
  createdAt: string;
  createdBy?: string;
}

export interface SubModule {
  id: string;
  name: string; // Nama Sub Modul
  featureDesc: string; // Keterangan Fitur
  startDate: string; // Rentang Implementasi Mulai
  endDate: string; // Rentang Implementasi Selesai
  status: string; // Status Implementasi sub-modul
}

export interface AppModule {
  id: string;
  projectName: string; // Reference to Client RS or Project
  name: string; // Nama Modul
  type: string; // Jenis Modul
  implementationStatus: string; // Status Implementasi
  implementationDate: string; // Tanggal Implementasi
  pic: string; // PIC
  subModules: SubModule[]; // Relasional anak
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
  pic: string;
  status: 'Aktif' | 'Rusak' | 'Maintenance' | string;
  specs: AssetSpecs;
  notes?: string;
  createdAt: string;
  createdBy?: string;
}
