import React, { useState } from "react";
import { Asset, AssetSpecs, Client, User } from "../types";
import { 
  Monitor, 
  Cpu, 
  Printer, 
  Network as NetIcon, 
  Plus, 
  Trash2, 
  Edit, 
  Search, 
  Activity, 
  Wrench, 
  X, 
  CheckCircle, 
  ShieldAlert, 
  Settings,
  HardDrive,
  Cpu as CpuIcon
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface AssetsViewProps {
  assets: Asset[];
  clients: Client[];
  users: User[];
  currentUser: User | null;
  onAddAsset: (asset: Partial<Asset>) => Promise<void>;
  onUpdateAsset: (id: string, asset: Partial<Asset>) => Promise<void>;
  onDeleteAsset: (id: string) => Promise<void>;
}

export default function AssetsView({
  assets,
  clients,
  users,
  currentUser,
  onAddAsset,
  onUpdateAsset,
  onDeleteAsset
}: AssetsViewProps) {
  const [activeCategory, setActiveCategory] = useState<"Komputer" | "Monitor" | "Printer" | "Perangkat Jaringan">("Komputer");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRS, setFilterRS] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  // Modal Control
  const [isOpen, setIsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState("");

  // Asset Form States
  const [category, setCategory] = useState<"Komputer" | "Monitor" | "Printer" | "Perangkat Jaringan">("Komputer");
  const [serialNumber, setSerialNumber] = useState("");
  const [deviceName, setDeviceName] = useState("");
  const [clientRS, setClientRS] = useState("");
  const [roomId, setRoomId] = useState("");
  const [pic, setPic] = useState("");
  const [status, setStatus] = useState<"Aktif" | "Rusak" | "Maintenance">("Aktif");
  const [notes, setNotes] = useState("");
  const [tanggalDatang, setTanggalDatang] = useState("");
  const [statusKepemilikan, setStatusKepemilikan] = useState("Perusahaan");

  // Spec Form States
  const [pro, setPro] = useState("");
  const [ram, setRam] = useState("");
  const [sto, setSto] = useState("");
  const [os, setOs] = useState("");

  const [sz, setSz] = useState("");
  const [res, setRes] = useState("");
  const [pt, setPt] = useState("");

  const [prType, setPrType] = useState("Laser");
  const [conn, setConn] = useState("USB");
  const [speed, setSpeed] = useState("");

  const [netType, setNetType] = useState("Switch");
  const [ports, setPorts] = useState("");
  const [band, setBand] = useState("");

  // Hospital List Reference
  const rsNames = clients.map(c => c.namaRS);
  
  const hasSiteRestriction = !!(currentUser?.siteTugas && currentUser.siteTugas.toLowerCase().trim() !== "kantor pusat" && currentUser.siteTugas.trim() !== "");
  const userSite = currentUser?.siteTugas || "";

  // Active client's rooms
  const selectedClient = clients.find(c => c.namaRS.toLowerCase().trim() === clientRS.toLowerCase().trim());
  const clientRooms = selectedClient?.rooms || [];

  const handleOpenNew = () => {
    setCategory(activeCategory);
    setSerialNumber("");
    setDeviceName("");
    
    // 2. Lokasi Penerima otomatis sesuai dengan user tugas di site tersebut
    const initialClientRS = hasSiteRestriction ? userSite : (rsNames[0] || "Kantor Pusat / Umum");
    setClientRS(initialClientRS);
    
    setRoomId("");
    
    // 4. PIC Penanggung Jawab data diambil dari data karyawan di site tugas
    const siteEmployees = users.filter(u => 
      u.siteTugas && 
      initialClientRS && 
      u.siteTugas.toLowerCase().trim() === initialClientRS.toLowerCase().trim()
    );
    if (siteEmployees.length > 0) {
      const matchMe = siteEmployees.find(u => u.name === currentUser?.name);
      setPic(matchMe ? matchMe.name : siteEmployees[0].name);
    } else {
      setPic(currentUser?.name || "");
    }
    
    setStatus("Aktif");
    setNotes("");

    // 1. Tambahkan tanggal barang datang (default ke hari ini)
    setTanggalDatang(new Date().toISOString().substring(0, 10));
    // 3. Status Kepemilikan (default Perusahaan)
    setStatusKepemilikan("Perusahaan");

    // Specs reset
    setPro(""); setRam(""); setSto(""); setOs("");
    setSz(""); setRes(""); setPt("");
    setPrType("Laser"); setConn("USB"); setSpeed("");
    setNetType("Switch"); setPorts(""); setBand("");

    setIsEditing(false);
    setIsOpen(true);
  };

  const handleOpenEdit = (as: Asset) => {
    setCategory(as.category as any);
    setSerialNumber(as.serialNumber || "");
    setDeviceName(as.deviceName || "");
    setClientRS(as.clientRS || rsNames[0] || "Kantor Pusat / Umum");
    setRoomId(as.roomId || "");
    setPic(as.pic || "");
    setStatus(as.status as any);
    setNotes(as.notes || "");
    setTanggalDatang(as.tanggalDatang ? as.tanggalDatang.substring(0, 10) : "");
    setStatusKepemilikan(as.statusKepemilikan || "Perusahaan");

    // Populate specs accordingly
    const s = as.specs || {};
    setPro(s.processor || "");
    setRam(s.ram || "");
    setSto(s.storage || "");
    setOs(s.os || "");

    setSz(s.screenSize || "");
    setRes(s.resolution || "");
    setPt(s.portType || "");

    setPrType(s.printerType || "Laser");
    setConn(s.connectivity || "USB");
    setSpeed(s.printSpeed || "");

    setNetType(s.deviceType || "Switch");
    setPorts(s.portCount || "");
    setBand(s.bandwidth || "");

    setEditId(as.id);
    setIsEditing(true);
    setIsOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serialNumber.trim() || !deviceName.trim()) {
      alert("Serial Number (S/N) dan Nama Perangkat wajib diisi!");
      return;
    }

    const compsSpecs: AssetSpecs = {
      processor: pro,
      ram: ram,
      storage: sto,
      os: os,
      screenSize: sz,
      resolution: res,
      portType: pt,
      printerType: prType,
      connectivity: conn,
      printSpeed: speed,
      deviceType: netType,
      portCount: ports,
      bandwidth: band
    };

    const selectedRoom = clientRooms.find(r => r.id === roomId);

    const payload: Partial<Asset> = {
      category,
      serialNumber,
      deviceName,
      clientRS,
      roomId,
      roomName: selectedRoom ? selectedRoom.name : "",
      pic,
      status,
      notes,
      tanggalDatang,
      statusKepemilikan,
      specs: compsSpecs
    };

    if (isEditing) {
      await onUpdateAsset(editId, payload);
    } else {
      await onAddAsset(payload);
    }
    setIsOpen(false);
  };

  // Stats Counters
  const total = assets.length;
  const kompCount = assets.filter(a => a.category === "Komputer").length;
  const monCount = assets.filter(a => a.category === "Monitor").length;
  const printCount = assets.filter(a => a.category === "Printer").length;
  const netCount = assets.filter(a => a.category === "Perangkat Jaringan").length;

  const activeCount = assets.filter(a => a.status === "Aktif").length;
  const brokenCount = assets.filter(a => a.status === "Rusak").length;
  const maintCount = assets.filter(a => a.status === "Maintenance").length;

  // Filter Assets matching selections
  const filteredAssets = assets.filter(a => {
    const isCat = a.category === activeCategory;
    const matchesSearch = 
      a.deviceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.pic.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRS = !filterRS || a.clientRS === filterRS;
    const matchesStat = !filterStatus || a.status === filterStatus;

    return isCat && matchesSearch && matchesRS && matchesStat;
  });

  if (isOpen) {
    return (
      <div className="space-y-6 animate-fadeIn font-sans pb-10" id="assets-form-container">
        {/* Navigation / Page Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200/80 dark:border-slate-800/80 pb-5">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-3.5 py-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-800 dark:text-slate-300 font-extrabold text-xs transition-all cursor-pointer flex items-center gap-1.5 self-start shadow-xs active:scale-95"
            >
              ← Kembali ke Daftar Aset
            </button>
            <div className="hidden sm:block h-6 w-[1px] bg-slate-200 dark:bg-slate-800" />
            <div>
              <h1 className="text-xl font-black text-slate-800 dark:text-slate-100 tracking-tight flex items-center gap-1.5">
                <Settings className="w-5 h-5 text-indigo-500" />
                {isEditing ? "Modifikasi Rincian Aset Perangkat" : `Daftarkan Perangkat ${category}`}
              </h1>
              <p className="text-[11px] text-slate-500 mt-0.5">Lengkapi formulir di bawah untuk memperbarui inventori KSO secara terintegrasi.</p>
            </div>
          </div>
        </div>

        {/* Dynamic Compact Form Component */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl overflow-hidden p-6">
          <form onSubmit={handleSubmit} className="space-y-6 text-xs font-semibold">
            {/* Split layout compartments: General details and KSO details */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* Box 1: General Info */}
              <div className="space-y-4 bg-slate-50/40 dark:bg-slate-950/20 p-5 rounded-2xl border border-slate-100 dark:border-slate-850">
                <h3 className="text-xs uppercase tracking-wider text-indigo-600 dark:text-indigo-400 font-black border-b border-slate-150 dark:border-slate-800 pb-2 flex items-center gap-1.5 font-sans">
                  📁 1. Klasifikasi & Identitas Perangkat
                </h3>

                <div className="space-y-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-slate-500 uppercase tracking-widest font-sans">Kategori Perangkat</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as any)}
                      disabled={isEditing}
                      className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 py-2.5 px-3 rounded-lg text-slate-800 dark:text-slate-200 font-extrabold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="Komputer">Komputer / Server</option>
                      <option value="Monitor">Monitor / Layar</option>
                      <option value="Printer">Printer</option>
                      <option value="Perangkat Jaringan">Perangkat Jaringan</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-slate-500 uppercase tracking-widest font-sans">Nama / Brand & Tipe Perangkat *</label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Server ASUS TS100 / Printer EPSON LX310"
                      value={deviceName}
                      onChange={(e) => setDeviceName(e.target.value)}
                      className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 py-2.5 px-3 rounded-lg text-slate-800 dark:text-slate-100 placeholder:opacity-50 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] text-slate-500 uppercase tracking-widest font-sans">Serial Number (S/N) *</label>
                      <input
                        type="text"
                        required
                        placeholder="Contoh: SN-8239AJD921"
                        value={serialNumber}
                        onChange={(e) => setSerialNumber(e.target.value)}
                        className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 py-2.5 px-3 rounded-lg text-slate-800 dark:text-slate-100 placeholder:opacity-50 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] text-slate-500 uppercase tracking-widest font-sans">Status Kondisi</label>
                      <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value as any)}
                        className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 py-2.5 px-3 rounded-lg text-slate-800 dark:text-slate-200 font-extrabold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      >
                        <option value="Aktif">Aktif / Normal</option>
                        <option value="Rusak">Rusak</option>
                        <option value="Maintenance">Maintenance / Perbaikan</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Box 2: Location/PIC */}
              <div className="space-y-4 bg-slate-50/40 dark:bg-slate-950/20 p-5 rounded-2xl border border-slate-100 dark:border-slate-850">
                <h3 className="text-xs uppercase tracking-wider text-indigo-600 dark:text-indigo-400 font-black border-b border-slate-150 dark:border-slate-800 pb-2 flex items-center gap-1.5 font-sans">
                  📍 2. Lokasi KSO & Penanggung Jawab
                </h3>

                <div className="space-y-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-slate-500 uppercase tracking-widest font-sans">Lokasi RS Penerima</label>
                    <select
                      value={clientRS}
                      onChange={(e) => {
                        setClientRS(e.target.value);
                        setRoomId("");
                      }}
                      disabled={hasSiteRestriction}
                      className={`bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 py-2.5 px-3 rounded-lg text-slate-800 dark:text-slate-200 font-extrabold focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                        hasSiteRestriction ? "opacity-75 cursor-not-allowed bg-slate-100 dark:bg-slate-900" : ""
                      }`}
                    >
                      {hasSiteRestriction ? (
                        <option value={userSite}>{userSite}</option>
                      ) : (
                        <>
                          {rsNames.map(name => <option key={name} value={name}>{name}</option>)}
                          <option value="Kantor Pusat / Umum">Kantor Pusat / Umum</option>
                        </>
                      )}
                    </select>
                  </div>

                  {clientRS !== "Kantor Pusat / Umum" && (
                    <div className="flex flex-col gap-1 animate-fadeIn">
                      <label className="text-[10px] text-slate-500 uppercase tracking-widest font-sans">Ruangan / Unit RS ({clientRooms.length})</label>
                      <select
                        value={roomId}
                        onChange={(e) => setRoomId(e.target.value)}
                        className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 py-2.5 px-3 rounded-lg text-slate-800 dark:text-slate-200 font-extrabold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      >
                        <option value="">— Pilih Ruangan (Opsional) —</option>
                        {clientRooms.map(room => (
                          <option key={room.id} value={room.id}>
                            {room.name} {room.floor ? `(Lantai ${room.floor})` : ""}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-slate-500 uppercase tracking-widest font-sans">PIC Penanggung Jawab / Staff</label>
                    <input
                      type="text"
                      list="pic-employees-list-standalone"
                      placeholder="Nama PIC penanggung jawab"
                      value={pic}
                      onChange={(e) => setPic(e.target.value)}
                      className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 py-2.5 px-3 rounded-lg text-slate-800 dark:text-slate-100 placeholder:opacity-50 font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs"
                    />
                    <datalist id="pic-employees-list-standalone">
                      {users
                        .filter(u => u.siteTugas && clientRS && u.siteTugas.toLowerCase().trim() === clientRS.toLowerCase().trim())
                        .map(u => (
                          <option key={u.id} value={u.name}>
                            {u.name} ({u.divisi || u.role || "Staf"})
                          </option>
                        ))
                      }
                    </datalist>
                    {users.filter(u => u.siteTugas && clientRS && u.siteTugas.toLowerCase().trim() === clientRS.toLowerCase().trim()).length > 0 && (
                      <p className="text-[9px] text-indigo-500 font-semibold mt-0.5">
                        * Terdeteksi {users.filter(u => u.siteTugas && clientRS && u.siteTugas.toLowerCase().trim() === clientRS.toLowerCase().trim()).length} karyawan terdaftar di site {clientRS}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Specifications Component Box */}
            <div className="bg-slate-50 dark:bg-slate-950 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 space-y-4">
              <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wide flex items-center gap-1.5 border-b border-slate-200 dark:border-slate-850 pb-2">
                ⚙️ Spesifikasi Teknis Perangkat ({category})
              </h4>

              {category === "Komputer" && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="text-[9px] uppercase font-bold text-slate-500">Prosesor / CPU</label>
                    <input
                      type="text"
                      placeholder="Intel i5-12400 / AMD Ryzen 5"
                      value={pro}
                      onChange={(e) => setPro(e.target.value)}
                      className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 py-2 px-3 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] uppercase font-bold text-slate-500">Kapasitas RAM</label>
                    <input
                      type="text"
                      placeholder="e.g. 8 GB / 16 GB DDR4"
                      value={ram}
                      onChange={(e) => setRam(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 py-2 px-3 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] uppercase font-bold text-slate-500">Penyimpanan (Storage)</label>
                    <input
                      type="text"
                      placeholder="e.g. SSD 512 GB NVMe"
                      value={sto}
                      onChange={(e) => setSto(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 py-2 px-3 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] uppercase font-bold text-slate-500">Sistem Operasi</label>
                    <input
                      type="text"
                      placeholder="Windows 11 / Ubuntu Server"
                      value={os}
                      onChange={(e) => setOs(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 py-2 px-3 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              )}

              {category === "Monitor" && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-[9px] uppercase font-bold text-slate-500">Ukuran Layar (Inchi)</label>
                    <input
                      type="text"
                      placeholder='e.g. 21.5" atau 24"'
                      value={sz}
                      onChange={(e) => setSz(e.target.value)}
                      className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 py-2 px-3 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] uppercase font-bold text-slate-500">Resolusi Display</label>
                    <input
                      type="text"
                      placeholder="e.g. Full HD 1920x1080"
                      value={res}
                      onChange={(e) => setRes(e.target.value)}
                      className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 py-2 px-3 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] uppercase font-bold text-slate-500">Tipe Input Port</label>
                    <input
                      type="text"
                      placeholder="HDMI / VGA / DisplayPort"
                      value={pt}
                      onChange={(e) => setPt(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 py-2 px-3 rounded-lg text-slate-800 dark:text-slate-202 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              )}

              {category === "Printer" && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-[9px] uppercase font-bold text-slate-500">Tipe Printer</label>
                    <select
                      value={prType}
                      onChange={(e) => setPrType(e.target.value)}
                      className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 py-2 px-3 rounded-lg text-slate-800 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="Laser">LaserJet</option>
                      <option value="Inkjet">InkJet / Infus</option>
                      <option value="DotMatrix">DotMatrix (Kasir)</option>
                      <option value="Thermal">Thermal (Antrean/Label)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[9px] uppercase font-bold text-slate-500">Konektivitas</label>
                    <input
                      type="text"
                      placeholder="e.g. USB / Wi-Fi / LAN"
                      value={conn}
                      onChange={(e) => setConn(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 py-2 px-3 rounded-lg text-slate-800 dark:text-slate-202 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] uppercase font-bold text-slate-500">Kecepatan Cetak (PPM)</label>
                    <input
                      type="text"
                      placeholder="e.g. 15 ppm / 30 ppm"
                      value={speed}
                      onChange={(e) => setSpeed(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 py-2 px-3 rounded-lg text-slate-800 dark:text-slate-202 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              )}

              {category === "Perangkat Jaringan" && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-[9px] uppercase font-bold text-slate-500">Jenis Perangkat</label>
                    <select
                      value={netType}
                      onChange={(e) => setNetType(e.target.value)}
                      className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 py-2 px-3 rounded-lg text-slate-800 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="Switch">Switch Hub</option>
                      <option value="Managed Switch">Managed Switch</option>
                      <option value="Router">Router Board</option>
                      <option value="Access Point">Access Point</option>
                      <option value="Firewall">Firewall / Gate</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[9px] uppercase font-bold text-slate-500">Jumlah Port</label>
                    <input
                      type="text"
                      placeholder="e.g. 8 / 24 / 48 Ports"
                      value={ports}
                      onChange={(e) => setPorts(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 py-2 px-3 rounded-lg text-slate-800 dark:text-slate-202 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] uppercase font-bold text-slate-500">Bandwidth / Cap</label>
                    <input
                      type="text"
                      placeholder="e.g. 1 Gbps / 10 Gbps"
                      value={band}
                      onChange={(e) => setBand(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 py-2 px-3 rounded-lg text-slate-800 dark:text-slate-202 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Extra Metadata (tanggal, status kepemilikan, catatan) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 border-t border-slate-100 dark:border-slate-800 pt-5">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-slate-500 uppercase tracking-widest font-sans">Tanggal Barang Datang</label>
                <input
                  type="date"
                  value={tanggalDatang}
                  onChange={(e) => setTanggalDatang(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 py-2.5 px-3 rounded-lg text-slate-800 dark:text-slate-100 font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-slate-500 uppercase tracking-widest font-sans">Status Kepemilikan</label>
                <select
                  value={statusKepemilikan}
                  onChange={(e) => setStatusKepemilikan(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 py-2.5 px-3 rounded-lg text-slate-800 dark:text-slate-202 font-extrabold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="Perusahaan">Perusahaan</option>
                  <option value="Rumah Sakit">Rumah Sakit</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-slate-500 uppercase tracking-widest font-sans">Catatan Tambahan Alokasi / Rusak</label>
                <input
                  type="text"
                  placeholder="Keterangan kondisi fisik perangkat, serah terima..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 py-2.5 px-3 rounded-lg text-slate-800 dark:text-slate-100 placeholder:opacity-50 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
                />
              </div>
            </div>

            {/* Submit Action Controls */}
            <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-5 py-2.5 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 text-xs font-semibold rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer active:scale-95"
              >
                Batal & Kembali
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-lg shadow-md hover:shadow-lg transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <CheckCircle className="w-4 h-4" /> {isEditing ? "Simpan Perubahan Aset" : "Daftarkan Inventori Aset"}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn font-sans pb-10" id="assets-view-container">
      {/* Header section with Stats block */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <HardDrive className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            <h1 className="text-xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Manajemen Aset Perangkat SIMRS</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">Sistem pencatatan terpusat untuk Komputer, Monitor, Printer, dan Perangkat Jaringan di rumah sakit KSO.</p>
        </div>

        {currentUser?.role !== "Client" && (
          <button
            onClick={handleOpenNew}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-md hover:shadow-lg transition-all"
          >
            <Plus className="w-4 h-4" /> Tambah Aset {activeCategory}
          </button>
        )}
      </div>

      {/* Numerical widgets block */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-450 flex items-center justify-center shrink-0">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 uppercase font-bold">Aset Aktif / Normal</p>
            <p className="text-lg font-black text-slate-800 dark:text-white">{activeCount} Unit</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-red-500/10 text-red-450 flex items-center justify-center shrink-0">
            <ShieldAlert className="w-5 h-5 text-red-500 animate-bounce" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 uppercase font-bold">Aset Rusak</p>
            <p className="text-lg font-black text-red-600 dark:text-red-450">{brokenCount} Unit</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
            <Wrench className="w-5 h-5 text-amber-500 animate-pulse" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 uppercase font-bold">Maintenance / Perbaikan</p>
            <p className="text-lg font-black text-amber-600 dark:text-amber-400">{maintCount} Unit</p>
          </div>
        </div>

        {/* Categories Breakdown */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
          <p className="text-[9px] text-slate-400 uppercase font-black tracking-wider mb-1">Populasi Kategori Aset</p>
          <div className="grid grid-cols-4 gap-1.5 text-center text-[11px] font-mono font-bold leading-normal">
            <div className="bg-slate-100 dark:bg-slate-850 p-1 rounded">
              <p className="text-slate-500 text-[8px] text-[8px] uppercase">Komp</p>
              <p className="text-slate-800 dark:text-slate-200">{kompCount}</p>
            </div>
            <div className="bg-slate-100 dark:bg-slate-850 p-1 rounded">
              <p className="text-slate-500 text-[8px] uppercase">Mon</p>
              <p className="text-slate-800 dark:text-slate-200">{monCount}</p>
            </div>
            <div className="bg-slate-100 dark:bg-slate-850 p-1 rounded">
              <p className="text-slate-500 text-[8px] uppercase">Prnt</p>
              <p className="text-slate-800 dark:text-slate-200">{printCount}</p>
            </div>
            <div className="bg-slate-100 dark:bg-slate-850 p-1 rounded">
              <p className="text-slate-500 text-[8px] uppercase">Net</p>
              <p className="text-slate-800 dark:text-slate-200">{netCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigations for asset classes */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-2">
        <div className="flex flex-wrap gap-1 p-1 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs w-full sm:w-auto">
          <button
            onClick={() => setActiveCategory("Komputer")}
            className={`px-4 py-2 font-bold rounded-md flex items-center gap-1.5 transition-all ${activeCategory === "Komputer" ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 font-extrabold shadow-sm" : "text-slate-500 hover:text-slate-350"}`}
          >
            <CpuIcon className="w-4 h-4 text-indigo-500" /> Komputer / Server
          </button>

          <button
            onClick={() => setActiveCategory("Monitor")}
            className={`px-4 py-2 font-bold rounded-md flex items-center gap-1.5 transition-all ${activeCategory === "Monitor" ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 font-extrabold shadow-sm" : "text-slate-500 hover:text-slate-350"}`}
          >
            <Monitor className="w-4 h-4 text-orange-500" /> Monitor / Layar
          </button>

          <button
            onClick={() => setActiveCategory("Printer")}
            className={`px-4 py-2 font-bold rounded-md flex items-center gap-1.5 transition-all ${activeCategory === "Printer" ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 font-extrabold shadow-sm" : "text-slate-500 hover:text-slate-350"}`}
          >
            <Printer className="w-4 h-4 text-purple-500" /> Printer Kasir / Label
          </button>

          <button
            onClick={() => setActiveCategory("Perangkat Jaringan")}
            className={`px-4 py-2 font-bold rounded-md flex items-center gap-1.5 transition-all ${activeCategory === "Perangkat Jaringan" ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 font-extrabold shadow-sm" : "text-slate-500 hover:text-slate-350"}`}
          >
            <NetIcon className="w-4 h-4 text-emerald-500" /> Perangkat Jaringan
          </button>
        </div>
      </div>

      {/* Filter Options */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-wrap gap-3 items-center justify-between">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder={`Cari nama perangkat, serial number (S/N), atau PIC...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 pr-4 py-1.5 w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs"
          />
        </div>

        <div className="flex flex-wrap gap-2.5 items-center">
          <select
            value={filterRS}
            onChange={(e) => setFilterRS(e.target.value)}
            className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 py-1.5 px-3 rounded-lg text-xs font-bold"
          >
            <option value="">Semua Lokasi Rumah Sakit</option>
            {rsNames.map(name => <option key={name} value={name}>{name}</option>)}
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 py-1.5 px-3 rounded-lg text-xs font-bold"
          >
            <option value="">Semua Status Operasional</option>
            <option value="Aktif">Aktif / Normal</option>
            <option value="Rusak">Rusak</option>
            <option value="Maintenance">Maintenance</option>
          </select>
        </div>
      </div>

      {/* Assets Listing Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
        {filteredAssets.length === 0 ? (
          <div className="text-center py-16">
            <HardDrive className="w-12 h-12 text-slate-350 mx-auto mb-3 opacity-30" />
            <p className="text-sm font-black text-slate-700 dark:text-slate-350">Tidak ada perangkat terdaftar</p>
            <p className="text-xs text-slate-400 mt-1">Ubah kata kunci pencarian Anda atau rekam inventaris aset baru pada sub-kategori "{activeCategory}".</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-[10px] font-black text-slate-500 uppercase tracking-wider">
                  <th className="px-5 py-3">Nama Perangkat & S/N</th>
                  <th className="px-5 py-3">Lokasi / RS Penerima</th>
                  <th className="px-5 py-3">Spesifikasi Kustom Teknis</th>
                  <th className="px-5 py-3">Pelaksana / PIC</th>
                  <th className="px-5 py-3">Status</th>
                  {currentUser?.role !== "Client" && <th className="px-5 py-3 text-right">Aksi</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                {filteredAssets.map(as => {
                  const s = as.specs || {};
                  return (
                    <tr key={as.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/15">
                      <td className="px-5 py-3.5">
                        <div className="font-extrabold text-slate-800 dark:text-slate-150 text-sm">
                          {as.deviceName}
                        </div>
                        <div className="text-[10px] font-mono text-slate-500 font-bold mt-0.5">
                          S/N: <strong className="text-slate-700 dark:text-slate-300">{as.serialNumber}</strong>
                        </div>
                        {as.tanggalDatang && (
                          <div className="text-[10px] font-medium text-slate-500 mt-1 flex items-center gap-1">
                            📅 Datang: <strong className="text-slate-705 dark:text-slate-300">{new Date(as.tanggalDatang).toLocaleDateString("id-ID", {day: "numeric", month: "short", year: "numeric"})}</strong>
                          </div>
                        )}
                        {as.statusKepemilikan && (
                          <div className="mt-1.5 flex items-center gap-1.5">
                            <span className={`text-[9px] font-black px-1.5 py-0.5 rounded border uppercase tracking-wider ${
                              as.statusKepemilikan === "Perusahaan" 
                                ? "bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800/40" 
                                : "bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 border-teal-200 dark:border-teal-800/40"
                            }`}>
                              🏛️ Kepemilikan: {as.statusKepemilikan}
                            </span>
                          </div>
                        )}
                        {as.createdBy && (
                          <div className="text-[9px] text-indigo-500 dark:text-indigo-400 font-bold mt-1.5 bg-indigo-50/50 dark:bg-indigo-950/30 px-1.5 py-0.5 rounded w-fit border border-indigo-100/10 font-sans">
                            🧑‍💻 Input: {as.createdBy}
                          </div>
                        )}
                      </td>

                      <td className="px-5 py-3.5">
                        <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                          <Activity className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                          {as.clientRS}
                        </span>
                        {as.roomName && (
                          <div className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold px-2 py-0.5 rounded w-fit mt-1.5 flex items-center gap-1 border border-slate-200 dark:border-slate-700">
                            🏢 Ruangan: {as.roomName}
                          </div>
                        )}
                        {as.notes && <p className="text-[10.5px] italic font-normal text-slate-450 mt-1 line-clamp-1">{as.notes}</p>}
                      </td>

                      <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400 font-mono text-[10.5px] leading-relaxed">
                        {/* Categorized specs layout render */}
                        {as.category === "Komputer" && (
                          <div className="space-y-0.5">
                            <p>💾 CPU: <span className="font-semibold text-slate-700 dark:text-slate-300">{s.processor || "-"}</span></p>
                            <p>⚙️ RAM: <span className="font-semibold text-slate-700 dark:text-slate-300">{s.ram || "-"}</span> | Storage: <span className="font-semibold text-slate-700 dark:text-slate-300">{s.storage || "-"}</span></p>
                            <p>🐧 OS: <span className="font-semibold text-slate-700 dark:text-slate-300">{s.os || "-"}</span></p>
                          </div>
                        )}
                        {as.category === "Monitor" && (
                          <div className="space-y-0.5">
                            <p>🖥️ Ukuran: <span className="font-semibold text-slate-700 dark:text-slate-300">{s.screenSize || "-"} Inches</span></p>
                            <p>📐 Resolusi: <span className="font-semibold text-slate-700 dark:text-slate-300">{s.resolution || "-"}</span></p>
                            <p>🔌 Port: <span className="font-semibold text-slate-700 dark:text-slate-300">{s.portType || "-"}</span></p>
                          </div>
                        )}
                        {as.category === "Printer" && (
                          <div className="space-y-0.5">
                            <p>🖨️ Tipe: <span className="font-semibold text-slate-700 dark:text-slate-300">{s.printerType || "-"}</span></p>
                            <p>🔗 Konektor: <span className="font-semibold text-slate-700 dark:text-slate-300">{s.connectivity || "-"}</span></p>
                            <p>⚡ Kecepatan: <span className="font-semibold text-slate-700 dark:text-slate-300">{s.printSpeed || "-"}</span></p>
                          </div>
                        )}
                        {as.category === "Perangkat Jaringan" && (
                          <div className="space-y-0.5">
                            <p>🌐 Jenis: <span className="font-semibold text-slate-700 dark:text-slate-300">{s.deviceType || "-"}</span></p>
                            <p>🔌 Port: <span className="font-semibold text-slate-700 dark:text-slate-300">{s.portCount || "-"} Ports</span></p>
                            <p>🚀 Bandwidth: <span className="font-semibold text-slate-700 dark:text-slate-300">{s.bandwidth || "-"}</span></p>
                          </div>
                        )}
                      </td>

                      <td className="px-5 py-3.5 font-semibold text-slate-650 dark:text-slate-300">
                        {as.pic || "-"}
                      </td>

                      <td className="px-5 py-3.5">
                        <span className={`text-[10px] font-black px-2 py-1 rounded-md border ${
                          as.status === "Aktif" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                          as.status === "Maintenance" ? "bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse" :
                          "bg-red-500/10 text-red-400 border-red-500/20"
                        }`}>
                          {as.status}
                        </span>
                      </td>

                      {currentUser?.role !== "Client" && (() => {
                        const canModify = !as.createdBy || as.createdBy === currentUser?.username || currentUser?.role === "Administrator";
                        return (
                          <td className="px-5 py-3.5 text-right font-bold whitespace-nowrap">
                            <button
                              onClick={() => handleOpenEdit(as)}
                              disabled={!canModify}
                              className={`p-1 rounded bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-all ${
                                canModify 
                                  ? "text-slate-400 hover:text-indigo-500 cursor-pointer" 
                                  : "text-slate-200 dark:text-slate-850 cursor-not-allowed opacity-35"
                              }`}
                              title={canModify ? "Edit details" : `Hanya penginput (${as.createdBy}) yang boleh mengedit`}
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={async () => {
                                if (confirm(`Hapus pencatatan inventori perangkat "${as.deviceName}"?`)) {
                                  await onDeleteAsset(as.id);
                                }
                              }}
                              disabled={!canModify}
                              className={`p-1 rounded bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 ml-1.5 transition-all ${
                                canModify 
                                  ? "text-slate-400 hover:text-red-500 cursor-pointer" 
                                  : "text-slate-200 dark:text-slate-850 cursor-not-allowed opacity-35"
                              }`}
                              title={canModify ? "Hapus Alat" : `Hanya penginput (${as.createdBy}) yang boleh menghapus`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        );
                      })()}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
