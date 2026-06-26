import React, { useState } from "react";
import { Client, AppModule, User, DirectorHistory, Asset, Ticket } from "../types";
import { 
  Building2, 
  Plus, 
  Trash2, 
  UserCheck2,
  Search,
  X,
  FileText,
  Clipboard,
  HeartPulse,
  Upload,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import ClientCard from "./ClientCard";

interface ClientsViewProps {
  clients: Client[];
  onAddClient: (data: Partial<Client>) => Promise<void>;
  onUpdateClient: (id: string, data: Partial<Client>) => Promise<void>;
  onDeleteClient: (id: string) => Promise<void>;
  tipeMedikaList?: string[];
  jenisModulList?: string[];
  statusImplementasiList?: string[];
  appModules?: AppModule[];
  currentUser?: User | null;
  assets?: Asset[];
  tickets?: Ticket[];
}

export default function ClientsView({
  clients = [],
  onAddClient,
  onUpdateClient,
  onDeleteClient,
  tipeMedikaList = ["Rumah Sakit", "Klinik Utama", "Klinik Pratama", "Puskesmas", "Laboratorium"],
  jenisModulList = ["Modul Utama", "Modul Integrasi", "Modul Penunjang", "Modul Pelaporan / Dashboard"],
  statusImplementasiList = ["Belum Mulai", "Analisis Fit & Gap", "Instalasi / Setting", "Pelatihan User", "Pendampingan UAT", "Selesai Implementasi"],
  appModules = [],
  currentUser = null,
  assets = [],
  tickets = []
}: ClientsViewProps) {
  
  const isUserScoped = !!(currentUser && 
    currentUser.siteTugas && 
    currentUser.siteTugas.toLowerCase().trim() !== "kantor pusat" &&
    currentUser.role !== "Administrator" && 
    currentUser.role !== "Direktur");

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [importPreview, setImportPreview] = useState<Partial<Client>[]>([]);
  const [importError, setImportError] = useState("");
  const [importSuccess, setImportSuccess] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [errorText, setErrorText] = useState("");

  // CSV Parsing function
  function parseCSV(text: string): Partial<Client>[] {
    const lines = text.split(/\r?\n/);
    if (lines.length < 2) return [];

    const splitCSVLine = (line: string) => {
      const result = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result;
    };

    const rawHeaders = splitCSVLine(lines[0]);
    const headers = rawHeaders.map(h => h.toLowerCase().replace(/[^a-z0-9]/g, ""));
    const clientsList: Partial<Client>[] = [];

    const findIndex = (aliases: string[]) => {
      return headers.findIndex(h => aliases.includes(h));
    };

    const idxNama = findIndex(["namars", "nama", "client", "namarsclient", "hospitalname", "name", "rs", "namarumahsakit", "rumahsakit"]);
    const idxKode = findIndex(["koders", "kode", "rs_code", "hospitalcode", "code", "koderumahsakit"]);
    const idxNoKSO = findIndex(["nokso", "nomorkso", "kso", "ksonumber", "nokersama", "nomorkerjasama"]);
    const idxDirektur = findIndex(["direkturrs", "direktur", "pic", "director", "dirut", "namadirektur"]);
    const idxTipe = findIndex(["tipemedika", "tipe", "type", "category", "jenis"]);
    const idxTglProj = findIndex(["tanggalproject", "startdate", "projectstart", "tglmulai", "mulai", "tanggalmulai"]);
    const idxTglCutoff = findIndex(["tanggalcutoff", "cutoffdate", "cutoff", "tglcutoff", "tanggalcutoff"]);
    const idxPersen = findIndex(["persentasekso", "persen", "percentage", "porsi", "kso_persen"]);
    const idxAktif = findIndex(["statusaktif", "aktif", "status", "active", "status_aktif", "keaktifan"]);

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line.trim()) continue;
      const cols = splitCSVLine(line);
      if (cols.length === 0) continue;

      const nama = idxNama !== -1 && cols[idxNama] ? cols[idxNama].replace(/^"|"$/g, '') : "";
      if (!nama) continue;

      const kodeRaw = idxKode !== -1 && cols[idxKode] ? cols[idxKode].replace(/^"|"$/g, '') : "";
      const kode = kodeRaw.substring(0, 5).toUpperCase();

      const noKSO = idxNoKSO !== -1 && cols[idxNoKSO] ? cols[idxNoKSO].replace(/^"|"$/g, '') : "";
      const direkturRS = idxDirektur !== -1 && cols[idxDirektur] ? cols[idxDirektur].replace(/^"|"$/g, '') : "";
      
      let tipeMedika = "Rumah Sakit";
      if (idxTipe !== -1 && cols[idxTipe]) {
        const val = cols[idxTipe].toLowerCase().replace(/^"|"$/g, '');
        if (val.includes("klinik utama")) tipeMedika = "Klinik Utama";
        else if (val.includes("klinik pratama")) tipeMedika = "Klinik Pratama";
        else if (val.includes("puskesmas")) tipeMedika = "Puskesmas";
        else if (val.includes("lab")) tipeMedika = "Laboratorium";
      }

      const tanggalProject = idxTglProj !== -1 && cols[idxTglProj] ? cols[idxTglProj].replace(/^"|"$/g, '') : "";
      const tanggalCutOff = idxTglCutoff !== -1 && cols[idxTglCutoff] ? cols[idxTglCutoff].replace(/^"|"$/g, '') : "";
      
      let persentaseKSO = 100;
      if (idxPersen !== -1 && cols[idxPersen]) {
        const pNum = parseFloat(cols[idxPersen].replace(/^"|"$/g, ''));
        if (!isNaN(pNum)) persentaseKSO = pNum;
      }

      let statusAktif = true;
      if (idxAktif !== -1 && cols[idxAktif]) {
        const val = cols[idxAktif].toLowerCase().replace(/^"|"$/g, '');
        if (val === "false" || val === "0" || val === "non-aktif" || val === "tidak aktif" || val === "nonaktif") {
          statusAktif = false;
        }
      }

      clientsList.push({
        id: "rs-" + Math.random().toString(36).substring(2, 9),
        namaRS: nama,
        kodeRS: kode,
        noKSO,
        direkturRS,
        tipeMedika,
        tanggalProject,
        tanggalCutOff,
        persentaseKSO,
        statusAktif,
        rooms: [],
        directors: direkturRS ? [{
          id: "dir-" + Math.random().toString(36).slice(2, 9),
          name: direkturRS,
          nip: "",
          startDate: "",
          endDate: "",
          isActive: true
        }] : []
      });
    }

    return clientsList;
  }

  // Handle file import
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImportError("");
    setImportSuccess("");
    const file = e.target.files?.[0];
    if (!file) return;
    readAndProcessFile(file);
  };

  const readAndProcessFile = (file: File) => {
    if (!file.name.endsWith(".csv")) {
      setImportError("Hanya file .csv yang diperbolehkan! Silakan simpan Excel Anda sebagai format CSV (Comma Separated Values) terlebih dahulu.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      try {
        const list = parseCSV(text);
        if (list.length === 0) {
          setImportError("Tidak ada baris data valid yang terbaca. Pastikan baris pertama berisi header nama kolom, minimal ada kolom 'Nama RS'.");
        } else {
          setImportPreview(list);
        }
      } catch (err) {
        setImportError("Terjadi kesalahan membaca file CSV: " + (err as Error).message);
      }
    };
    reader.readAsText(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      readAndProcessFile(e.dataTransfer.files[0]);
    }
  };

  const handleConfirmImport = async () => {
    setImportError("");
    setImportSuccess("");
    try {
      for (const item of importPreview) {
        await onAddClient(item);
      }
      setImportSuccess(`Berhasil mengimpor ${importPreview.length} data Client RS ke sistem!`);
      setImportPreview([]);
      setTimeout(() => {
        setIsImportOpen(false);
        setImportSuccess("");
      }, 3000);
    } catch (err) {
      setImportError("Gagal menyimpan beberapa data ke database: " + (err as Error).message);
    }
  };

  // Create Client State
  const [namaRS, setNamaRS] = useState("");
  const [kodeRS, setKodeRS] = useState("");
  const [noKSO, setNoKSO] = useState("");
  const [direkturRS, setDirekturRS] = useState("");
  const [modulSIMRS, setModulSIMRS] = useState("");
  const [tanggalProject, setTanggalProject] = useState("");
  const [tanggalCutOff, setTanggalCutOff] = useState("");
  const [tipeMedika, setTipeMedika] = useState<string>(tipeMedikaList[0] || "Rumah Sakit");
  const [persentaseKSO, setPersentaseKSO] = useState<number>(100);
  const [directors, setDirectors] = useState<DirectorHistory[]>([]);
  const [statusAktif, setStatusAktif] = useState(true);
  // Individual newly-added director sub-form fields
  const [newDirName, setNewDirName] = useState("");
  const [newDirNip, setNewDirNip] = useState("");
  const [newDirStart, setNewDirStart] = useState("");
  const [newDirEnd, setNewDirEnd] = useState("");
  const [newDirActive, setNewDirActive] = useState(true);

  // Director List Management helpers (for creation ONLY)
  const handleSetActiveDirInUnsaved = (id: string) => {
    setDirectors(prev => prev.map(d => ({
      ...d,
      isActive: d.id === id
    })));
  };

  const handleDeleteDirInUnsaved = (id: string) => {
    setDirectors(prev => prev.filter(d => d.id !== id));
  };

  // Submit new client RS registration
  async function handleCreateSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorText("");

    if (!namaRS.trim()) {
      setErrorText("Nama RS/Client wajib diisi!");
      return;
    }

    if (kodeRS.trim().length > 5) {
      setErrorText("Kode RS maksimal 5 karakter!");
      return;
    }

    const activeDir = directors.find(d => d.isActive);
    const finalDirekturRS = activeDir ? `${activeDir.name}${activeDir.nip ? ` (NIP. ${activeDir.nip})` : ""}` : (direkturRS || "-");

    await onAddClient({
      namaRS: namaRS.trim(),
      kodeRS: kodeRS.trim().substring(0, 5),
      noKSO: noKSO.trim(),
      direkturRS: finalDirekturRS,
      modulSIMRS: modulSIMRS.trim(),
      tanggalProject,
      tanggalCutOff,
      tipeMedika,
      persentaseKSO: persentaseKSO,
      directors: directors,
      statusAktif: statusAktif
    });

    // Reset Form
    setNamaRS("");
    setKodeRS("");
    setNoKSO("");
    setDirekturRS("");
    setModulSIMRS("");
    setTanggalProject("");
    setTanggalCutOff("");
    setTipeMedika(tipeMedikaList[0] || "Rumah Sakit");
    setPersentaseKSO(100);
    setDirectors([]);
    setStatusAktif(true);
    setNewDirName("");
    setNewDirNip("");
    setNewDirStart("");
    setNewDirEnd("");
    setNewDirActive(true);
    setIsFormOpen(false);
  }

  // Live clients listings filtering
  const filteredClients = clients.filter(cl => 
    cl.namaRS.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (cl.noKSO || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (cl.direkturRS || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (cl.modulSIMRS || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (cl.kodeRS || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Stats calculation
  const totalClientsCount = clients.length;
  const medikaBreakdown = clients.reduce((acc, curr) => {
    const type = curr.tipeMedika || "Belum Dikategorikan";
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div id="clients-view-root" className="space-y-6">
      
      {/* Visual Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm shadow-blue-500/5">
        <div>
          <div className="flex items-center gap-2 text-blue-500 dark:text-blue-400 font-bold uppercase tracking-wider text-xs">
            <Building2 className="w-4 h-4 text-blue-500" />
            <span>Katalog Lokasi & Akun Master</span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">Profile Client / RS</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Registrasikan data kemitraan RS, nomor kerjasama (KSO), Direktur Utama, modul tugas & penentuan tanggal cutoff project.
          </p>
        </div>
        {!isUserScoped && (
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={() => {
                setIsImportOpen(!isImportOpen);
                setIsFormOpen(false);
              }}
              className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 text-xs font-bold px-3 py-2 rounded-lg transition-all active:scale-95 cursor-pointer border border-slate-200 dark:border-slate-700"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />
              <span>Import Excel/CSV</span>
            </button>
            <button
              onClick={() => {
                setIsFormOpen(!isFormOpen);
                setIsImportOpen(false);
              }}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-3 py-2 rounded-lg transition-all shadow-md shadow-blue-600/20 active:scale-95 cursor-pointer"
            >
              {isFormOpen ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
              {isFormOpen ? "Batal" : "Tambah Client RS"}
            </button>
          </div>
        )}
      </div>

      {/* Visual Statistics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-xl p-4 flex items-center gap-3 shadow-xs">
          <div className="w-10 h-10 bg-blue-50 dark:bg-blue-950 border border-blue-100 dark:border-blue-900/30 rounded-lg flex items-center justify-center">
            <Building2 className="w-5 h-5 text-blue-500 dark:text-blue-400" />
          </div>
          <div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-widest font-black">Total Site Client</div>
            <div className="text-lg font-bold text-slate-900 dark:text-white">{totalClientsCount} RS</div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-xl p-4 flex items-center gap-3 shadow-xs">
          <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-950 border border-indigo-100 dark:border-indigo-900/30 rounded-lg flex items-center justify-center">
            <HeartPulse className="w-5 h-5 text-indigo-500 dark:text-indigo-405" />
          </div>
          <div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-widest font-black">Tipe RS Medika</div>
            <div className="text-lg font-bold text-slate-900 dark:text-white">
              {medikaBreakdown["Rumah Sakit"] || 0} Unit
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-xl p-4 flex items-center gap-3 shadow-xs">
          <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-950 border border-emerald-100 dark:border-emerald-900/30 rounded-lg flex items-center justify-center">
            <FileText className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
          </div>
          <div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-widest font-black">Puskesmas / Klinik</div>
            <div className="text-lg font-bold text-slate-900 dark:text-white">
              {(medikaBreakdown["Puskesmas"] || 0) + (medikaBreakdown["Klinik Utama"] || 0) + (medikaBreakdown["Klinik Pratama"] || 0)} Unit
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-xl p-4 flex items-center gap-3 shadow-xs">
          <div className="w-10 h-10 bg-amber-50 dark:bg-amber-950 border border-amber-100 dark:border-amber-900/30 rounded-lg flex items-center justify-center">
            <Clipboard className="w-5 h-5 text-amber-500 dark:text-amber-400" />
          </div>
          <div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-widest font-black">Tipe Laboratorium</div>
            <div className="text-lg font-bold text-slate-900 dark:text-white">
              {medikaBreakdown["Laboratorium"] || 0} Unit
            </div>
          </div>
        </div>
      </div>

      {/* Creation Collapsible Drawer Form */}
      <AnimatePresence>
        {isFormOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <form onSubmit={handleCreateSubmit} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4 shadow-md shadow-blue-500/5">
              <h3 className="text-sm font-extrabold text-blue-500 dark:text-blue-400 uppercase tracking-wider flex items-center gap-2">
                <Plus className="w-4 h-4 text-blue-500" />
                Registrasi Client RS KSO Baru
              </h3>

              {errorText && (
                <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/40 text-xs py-2 px-3 rounded-lg font-bold font-sans">
                  ⚠️ {errorText}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Nama RS / Client <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={namaRS}
                    onChange={(e) => setNamaRS(e.target.value)}
                    placeholder="Nama RS (e.g. RS Medika Utama)"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Kode RS (Maks 5 Karakter)</label>
                  <input
                    type="text"
                    maxLength={5}
                    value={kodeRS}
                    onChange={(e) => setKodeRS(e.target.value.substring(0, 5).toUpperCase())}
                    placeholder="e.g. RS001"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Tipe Medika</label>
                  <select
                    value={tipeMedika}
                    onChange={(e) => setTipeMedika(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-105 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-blue-500"
                  >
                    {tipeMedikaList.map((tm) => (
                      <option key={tm} value={tm}>{tm}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Nomor Kerjasama (NO KSO)</label>
                  <input
                    type="text"
                    value={noKSO}
                    onChange={(e) => setNoKSO(e.target.value)}
                    placeholder="e.g. KSO/2026/IX-33"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Persentase Sharing KSO (%) <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={persentaseKSO}
                    onChange={(e) => setPersentaseKSO(parseFloat(e.target.value) || 0)}
                    placeholder="e.g. 10.5"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Status Keaktifan RS</label>
                  <select
                    value={statusAktif ? "Aktif" : "Non-Aktif"}
                    onChange={(e) => setStatusAktif(e.target.value === "Aktif")}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-105 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-blue-500"
                  >
                    <option value="Aktif">Aktif</option>
                    <option value="Non-Aktif">Non-Aktif</option>
                  </select>
                </div>
              </div>

              {/* Riwayat Direktur RS Section */}
              <div className="bg-slate-50 dark:bg-slate-950/45 p-4 border border-slate-200 dark:border-slate-800 rounded-xl space-y-4">
                <div className="text-xs font-extrabold text-blue-600 dark:text-blue-400 uppercase tracking-wide flex items-center gap-1.5">
                  <UserCheck2 className="w-4 h-4" />
                  <span>Manajemen Riwayat Direktur Utama & NIP</span>
                </div>

                {directors.length === 0 ? (
                  <div className="text-center py-4 bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 rounded-lg">
                    <p className="text-[11px] text-slate-500 italic">Belum ada riwayat Direktur. Silakan tambahkan direktur baru di bawah.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {directors.map((dir) => (
                      <div key={dir.id} className={`flex flex-col justify-between p-3 rounded-lg border bg-white dark:bg-slate-900 transition-all ${dir.isActive ? "border-emerald-500 ring-1 ring-emerald-500/20" : "border-slate-200 dark:border-slate-800"}`}>
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-xs font-black text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                              {dir.name}
                              {dir.isActive && (
                                <span className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 text-[9px] font-black px-1.5 rounded-sm border border-emerald-250 dark:border-emerald-900/50 uppercase">
                                  Aktif
                                </span>
                              )}
                            </p>
                            {dir.nip && (
                              <p className="text-[10px] font-mono text-slate-500 dark:text-slate-400 mt-0.5">NIP: {dir.nip}</p>
                            )}
                            {(dir.startDate || dir.endDate) && (
                              <p className="text-[9px] text-slate-500 dark:text-slate-450 mt-1 bg-slate-50 dark:bg-slate-950 px-1.5 py-0.5 rounded border border-slate-100 dark:border-slate-850">
                                {dir.startDate || "?"} s.d {dir.endDate || "Sekarang"}
                              </p>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-1">
                            {!dir.isActive && (
                              <button
                                type="button"
                                onClick={() => handleSetActiveDirInUnsaved(dir.id)}
                                className="text-[9px] bg-slate-100 hover:bg-emerald-5 border border-slate-200 dark:border-slate-800 hover:text-emerald-600 dark:bg-slate-800 dark:hover:bg-emerald-950 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded cursor-pointer"
                              >
                                Set Aktif
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleDeleteDirInUnsaved(dir.id)}
                              className="text-red-500 hover:bg-red-50 p-1 rounded hover:text-red-700 dark:hover:bg-red-950/30 shrink-0"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Inline form to append director to list */}
                <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-850 rounded-lg p-3 space-y-3">
                  <div className="text-[10px] font-extrabold text-slate-505 dark:text-slate-400 uppercase tracking-widest pb-1 border-b border-slate-50 dark:border-slate-850">
                    ➕ Formulir Direktur RS Baru
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
                    <div>
                      <label className="block text-[9px] font-bold text-slate-500 uppercase mb-0.5">Nama Direktur</label>
                      <input
                        type="text"
                        value={newDirName}
                        onChange={(e) => setNewDirName(e.target.value)}
                        placeholder="e.g. dr. Bambang, Sp.B"
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-2 py-1 text-xs text-slate-850 dark:text-slate-100"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-slate-500 uppercase mb-0.5">NIP Direktur</label>
                      <input
                        type="text"
                        value={newDirNip}
                        onChange={(e) => setNewDirNip(e.target.value)}
                        placeholder="e.g. 197508..."
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-2 py-1 text-xs text-slate-850 dark:text-slate-100"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-slate-500 uppercase mb-0.5">Mulai Jabatan</label>
                      <input
                        type="date"
                        value={newDirStart}
                        onChange={(e) => setNewDirStart(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-2 py-0.5 text-xs text-slate-850"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-slate-550 uppercase mb-0.5">Selesai Jabatan</label>
                      <input
                        type="date"
                        value={newDirEnd}
                        onChange={(e) => setNewDirEnd(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-2 py-0.5 text-xs text-slate-850"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 border-t border-slate-50 dark:border-slate-850">
                    <label className="inline-flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-slate-600 dark:text-slate-400">
                      <input
                        type="checkbox"
                        checked={newDirActive}
                        onChange={(e) => setNewDirActive(e.target.checked)}
                        className="rounded border-slate-300 dark:border-slate-800 text-blue-600 focus:ring-blue-550 shrink-0 w-3.5 h-3.5"
                      />
                      <span>Set sebagai Direktur Aktif saat ini</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        if (!newDirName.trim()) {
                          alert("Nama Direktur wajib diisi!");
                          return;
                        }
                        const id = "dir-" + Math.random().toString(36).slice(2, 9);
                        const newDir: DirectorHistory = {
                          id,
                          name: newDirName.trim(),
                          nip: newDirNip.trim(),
                          startDate: newDirStart,
                          endDate: newDirEnd,
                          isActive: newDirActive
                        };
                        let list = [...directors];
                        if (newDirActive) {
                          list = list.map(d => ({ ...d, isActive: false }));
                        }
                        setDirectors([...list, newDir]);
                        setNewDirName("");
                        setNewDirNip("");
                        setNewDirStart("");
                        setNewDirEnd("");
                        setNewDirActive(false);
                      }}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-extrabold px-3 py-1 rounded transition-all cursor-pointer"
                    >
                      Tambahkan
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-550 uppercase tracking-wider mb-1">Tanggal Mulai Project</label>
                  <input
                    type="date"
                    value={tanggalProject}
                    onChange={(e) => setTanggalProject(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 text-slate-900 dark:text-slate-100 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-550 uppercase tracking-wider mb-1">Tanggal Cut-Off Sistem</label>
                  <input
                    type="date"
                    value={tanggalCutOff}
                    onChange={(e) => setTanggalCutOff(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 text-slate-900 dark:text-slate-100 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold px-4 py-2 rounded-lg transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 py-2 rounded-lg transition-all shadow-md shadow-blue-600/20 cursor-pointer"
                >
                  Simpan Entry Baru
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CSV / Excel Importer Drawer */}
      <AnimatePresence>
        {isImportOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4 shadow-md shadow-blue-500/5">
              <h3 className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
                Import Database Client dari File Excel/CSV
              </h3>

              {importSuccess && (
                <div className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-450 border border-emerald-200 dark:border-emerald-900/40 text-xs py-2 px-3 rounded-lg font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
                  <span>{importSuccess}</span>
                </div>
              )}

              {importError && (
                <div className="bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-450 border border-rose-200 dark:border-rose-900/40 text-xs py-2 px-3 rounded-lg font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                  <span>{importError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* Column guides */}
                <div className="lg:col-span-1 bg-slate-50 dark:bg-slate-950/50 p-4 border border-slate-100 dark:border-slate-850 rounded-lg space-y-3">
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">📋 Format Kolom yang Didukung</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Sistem dapat mendeteksi nama kolom secara otomatis. Pastikan file Excel Anda di-save as <strong>CSV (*.csv)</strong> dengan header baris pertama berupa:
                  </p>
                  <ul className="text-[10px] space-y-1.5 text-slate-600 dark:text-slate-400 list-disc list-inside">
                    <li><strong className="text-slate-700 dark:text-slate-200">Nama RS</strong> <span className="text-red-500">*</span> (e.g. RS Medika Utama)</li>
                    <li><strong>Kode RS</strong> (Maks 5 huruf, e.g. RSMU)</li>
                    <li><strong>Nomor KSO</strong> (e.g. 010/KSO/VI/2026)</li>
                    <li><strong>Nama Direktur</strong> (e.g. dr. Fajri, Sp.B)</li>
                    <li><strong>Tipe Medika</strong> (Rumah Sakit / Puskesmas / Klinik Utama / Klinik Pratama / Laboratorium)</li>
                    <li><strong>Tanggal Mulai</strong> (YYYY-MM-DD)</li>
                    <li><strong>Tanggal Cutoff</strong> (YYYY-MM-DD)</li>
                    <li><strong>Persentase KSO</strong> (Angka 0 s.d 100)</li>
                    <li><strong>Status Aktif</strong> (True / False)</li>
                  </ul>
                  <div className="pt-2">
                    <a
                      href="data:text/csv;charset=utf-8,Nama RS,Kode RS,Nomor KSO,Nama Direktur,Tipe Medika,Tanggal Mulai,Tanggal Cutoff,Persentase KSO,Status Aktif%0ARSIA Amanda,RSIAA,020/KSO-AM/V/2026,dr. Amanda Sp.A,Klinik Utama,2026-05-01,2026-06-30,100,True%0ARSUD Pratama Jaya,RSPJ,034/KSO-PJ/VI/2026,dr. Bambang Sp.B,Rumah Sakit,2026-06-01,,85,True"
                      download="template_client_rs.csv"
                      className="inline-flex items-center gap-1.5 text-[10px] bg-white hover:bg-slate-50 text-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded px-2.5 py-1 font-bold"
                    >
                      💾 Unduh Contoh Template CSV
                    </a>
                  </div>
                </div>

                {/* Drag-and-drop & Click selection container */}
                <div className="lg:col-span-2 space-y-4">
                  {importPreview.length === 0 ? (
                    <div
                      onDragEnter={handleDrag}
                      onDragOver={handleDrag}
                      onDragLeave={handleDrag}
                      onDrop={handleDrop}
                      className={`relative min-h-[180px] border-2 border-dashed rounded-xl flex flex-col items-center justify-center p-6 text-center transition-all ${
                        dragActive 
                          ? "border-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/10" 
                          : "border-slate-300 hover:border-slate-400 dark:border-slate-800 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-950/20"
                      }`}
                    >
                      <input
                        type="file"
                        id="csv-file-upload-input"
                        accept=".csv"
                        className="hidden"
                        onChange={handleFileChange}
                      />
                      <label 
                        htmlFor="csv-file-upload-input"
                        className="cursor-pointer flex flex-col items-center justify-center space-y-2 w-full h-full"
                      >
                        <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/30 rounded-full flex items-center justify-center text-emerald-500">
                          <Upload className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-xs font-extrabold text-slate-800 dark:text-slate-200">
                            Seret & Letakkan file .csv di sini, atau <span className="text-emerald-500 hover:underline">Pilih dari Komputer</span>
                          </p>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                            Hanya mendukung file CSV (*.csv) hasil ekspor Excel
                          </p>
                        </div>
                      </label>
                    </div>
                  ) : (
                    /* Import Preview Table */
                    <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-slate-50 dark:bg-slate-950/20">
                      <div className="p-3 bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">🔎 Preview Data yang Akan Diimpor ({importPreview.length} Baris)</span>
                        <button
                          onClick={() => setImportPreview([])}
                          className="text-[10px] text-rose-500 hover:underline font-bold"
                        >
                          Reset / Batal
                        </button>
                      </div>
                      <div className="max-h-[160px] overflow-y-auto overflow-x-auto text-[10px]">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-slate-50 dark:bg-slate-950 text-slate-500 uppercase tracking-wider font-bold border-b border-slate-250 dark:border-slate-800">
                              <th className="p-2">Nama RS</th>
                              <th className="p-2">Kode</th>
                              <th className="p-2">Nomor KSO</th>
                              <th className="p-2">Direktur</th>
                              <th className="p-2">Tipe</th>
                              <th className="p-2">Mulai</th>
                              <th className="p-2">Cutoff</th>
                              <th className="p-2">Persen</th>
                              <th className="p-2">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200/50 dark:divide-slate-850">
                            {importPreview.map((item, idx) => (
                              <tr key={idx} className="hover:bg-slate-100/30 dark:hover:bg-slate-900/20 text-slate-700 dark:text-slate-300">
                                <td className="p-2 font-bold">{item.namaRS}</td>
                                <td className="p-2 font-mono text-blue-500">{item.kodeRS || "-"}</td>
                                <td className="p-2">{item.noKSO || "-"}</td>
                                <td className="p-2">{item.direkturRS || "-"}</td>
                                <td className="p-2">{item.tipeMedika}</td>
                                <td className="p-2">{item.tanggalProject || "-"}</td>
                                <td className="p-2">{item.tanggalCutOff || "-"}</td>
                                <td className="p-2">{item.persentaseKSO}%</td>
                                <td className="p-2">
                                  <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${item.statusAktif ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400" : "bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-450"}`}>
                                    {item.statusAktif ? "Aktif" : "Non-Aktif"}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
                        <button
                          onClick={() => setImportPreview([])}
                          className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold px-3 py-1.5 rounded-lg transition-all"
                        >
                          Kembali
                        </button>
                        <button
                          onClick={handleConfirmImport}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-1.5 rounded-lg transition-all shadow-md shadow-emerald-600/20"
                        >
                          Confirm & Simpan Ke Database
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Listing & Editing Area */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
        
        {/* Filter Toolbar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4 mb-4">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-505 dark:text-slate-400">Database Record</h3>
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari RS, No KSO, modul, direktur..."
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg py-1.5 pl-9 pr-4 text-xs text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Clients list table / Cards */}
        {filteredClients.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <Building2 className="w-12 h-12 text-slate-300 dark:text-slate-705 mx-auto mb-2" />
            <p className="text-sm">Tidak ada data Client RS yang ditemukan.</p>
            <p className="text-xs text-slate-400 dark:text-slate-650 mt-1">Silakan kurangi pencarian atau tambahkan Client baru.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredClients.map((cl) => (
              <ClientCard 
                key={cl.id} 
                cl={cl}
                isUserScoped={isUserScoped}
                tipeMedikaList={tipeMedikaList}
                jenisModulList={jenisModulList}
                statusImplementasiList={statusImplementasiList}
                appModules={appModules}
                assets={assets}
                tickets={tickets}
                onUpdateClient={onUpdateClient}
                onDeleteClient={onDeleteClient}
              />
            ))}
          </div>
        )}

      </div>

    </div>
  );
}
