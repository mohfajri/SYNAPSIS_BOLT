import React, { useState } from "react";
import { Client, DirectorHistory, Asset, Ticket, ClientRoom, AppModule } from "../types";
import { 
  Building2, 
  Trash2, 
  FileCheck, 
  UserCheck2,
  Calendar, 
  Pencil,
  X,
  Percent,
  Home,
  Plus
} from "lucide-react";

interface ClientCardProps {
  key?: string;
  cl: Client;
  isUserScoped: boolean;
  tipeMedikaList: string[];
  jenisModulList: string[];
  statusImplementasiList: string[];
  appModules: AppModule[];
  assets: Asset[];
  tickets: Ticket[];
  onUpdateClient: (id: string, data: Partial<Client>) => Promise<void>;
  onDeleteClient: (id: string) => Promise<void>;
}

export default function ClientCard({
  cl,
  isUserScoped,
  tipeMedikaList,
  jenisModulList,
  statusImplementasiList,
  appModules,
  assets,
  tickets,
  onUpdateClient,
  onDeleteClient
}: ClientCardProps) {
  // Mode states
  const [isEditing, setIsEditing] = useState(false);
  const [isRoomsExpanded, setIsRoomsExpanded] = useState(false);
  const [isModulesExpanded, setIsModulesExpanded] = useState(false);
  const [editStatusAktif, setEditStatusAktif] = useState(true);

  // Edit RS Profile states (prefilled from cl on entry)
  const [editNamaRS, setEditNamaRS] = useState("");
  const [editKodeRS, setEditKodeRS] = useState("");
  const [editTipeMedika, setEditTipeMedika] = useState("");
  const [editNoKSO, setEditNoKSO] = useState("");
  const [editPersentaseKSO, setEditPersentaseKSO] = useState<number>(100);
  const [editDirekturRS, setEditDirekturRS] = useState("");
  const [editTanggalProject, setEditTanggalProject] = useState("");
  const [editTanggalCutOff, setEditTanggalCutOff] = useState("");
  const [editDirectors, setEditDirectors] = useState<DirectorHistory[]>([]);

  // Sub director input states in edit RS profile
  const [subDirName, setSubDirName] = useState("");
  const [subDirNip, setSubDirNip] = useState("");
  const [subDirStart, setSubDirStart] = useState("");
  const [subDirEnd, setSubDirEnd] = useState("");
  const [subDirActive, setSubDirActive] = useState(true);

  // Manage Rooms Drawer states
  const [addRoomBuilding, setAddRoomBuilding] = useState("");
  const [addRoomName, setAddRoomName] = useState("");
  const [addRoomCode, setAddRoomCode] = useState("");
  const [addRoomFloor, setAddRoomFloor] = useState("");
  const [addRoomDesc, setAddRoomDesc] = useState("");
  const [addRoomSubRoom, setAddRoomSubRoom] = useState("");
  const [addRoomStatusAktif, setAddRoomStatusAktif] = useState(true);
  const [editingRoomId, setEditingRoomId] = useState<string | null>(null);
  const [editRoomBuilding, setEditRoomBuilding] = useState("");
  const [editRoomName, setEditRoomName] = useState("");
  const [editRoomCode, setEditRoomCode] = useState("");
  const [editRoomFloor, setEditRoomFloor] = useState("");
  const [editRoomDesc, setEditRoomDesc] = useState("");
  const [editRoomSubRoom, setEditRoomSubRoom] = useState("");
  const [editRoomStatusAktif, setEditRoomStatusAktif] = useState(true);

  // Manage Module Statuses Drawer states
  const [addModulName, setAddModulName] = useState("");
  const [addModulStatus, setAddModulStatus] = useState("");
  const [addModulTanggal, setAddModulTanggal] = useState(new Date().toISOString().slice(0, 10));
  const [editingModuleStatusId, setEditingModuleStatusId] = useState<string | null>(null);
  const [tempStatus, setTempStatus] = useState("");
  const [tempTanggal, setTempTanggal] = useState("");

  // Scoped calculation inputs
  const clientAssets = assets.filter(a => a.clientRS === cl.namaRS);
  const clientTickets = tickets.filter(t => t.projectName === cl.namaRS);
  const registeredModuleNames = Array.from(new Set(appModules.map(m => m.name).filter(Boolean)));

  // Setup Initial Edit form state on enter
  const handleStartEdit = () => {
    setEditNamaRS(cl.namaRS || "");
    setEditKodeRS(cl.kodeRS || "");
    setEditTipeMedika(cl.tipeMedika || tipeMedikaList[0] || "Rumah Sakit");
    setEditNoKSO(cl.noKSO || "");
    setEditPersentaseKSO(cl.persentaseKSO !== undefined ? cl.persentaseKSO : 100);
    setEditDirekturRS(cl.direkturRS || "");
    setEditTanggalProject(cl.tanggalProject || "");
    setEditTanggalCutOff(cl.tanggalCutOff || "");
    setEditDirectors(cl.directors || []);
    setEditStatusAktif(cl.statusAktif !== false);
    setIsEditing(true);
  };

  const handleSetActiveDirInEditing = (id: string) => {
    setEditDirectors(prev => prev.map(d => ({
      ...d,
      isActive: d.id === id
    })));
  };

  const handleDeleteDirInEditing = (id: string) => {
    setEditDirectors(prev => prev.filter(d => d.id !== id));
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editNamaRS.trim()) {
      alert("Nama RS/Client wajib diisi!");
      return;
    }
    if (editKodeRS.trim().length > 5) {
      alert("Kode RS maksimal 5 karakter!");
      return;
    }
    const activeDir = editDirectors.find(d => d.isActive);
    const finalDirekturRS = activeDir ? `${activeDir.name}${activeDir.nip ? ` (NIP. ${activeDir.nip})` : ""}` : (editDirekturRS || "-");

    await onUpdateClient(cl.id, {
      namaRS: editNamaRS.trim(),
      kodeRS: editKodeRS.trim().substring(0, 5),
      noKSO: editNoKSO.trim(),
      direkturRS: finalDirekturRS,
      tanggalProject: editTanggalProject,
      tanggalCutOff: editTanggalCutOff,
      tipeMedika: editTipeMedika,
      persentaseKSO: editPersentaseKSO,
      directors: editDirectors,
      statusAktif: editStatusAktif
    });
    setIsEditing(false);
  };

  // --- Manage Rooms Methods ---
  const handleAddRoom = async () => {
    if (!addRoomName.trim()) {
      alert("Nama ruangan wajib diisi!");
      return;
    }
    const currentRooms = cl.rooms || [];
    if (currentRooms.some(r => r.name.toLowerCase().trim() === addRoomName.toLowerCase().trim())) {
      alert(`Ruangan "${addRoomName}" sudah terdaftar untuk RS ini!`);
      return;
    }
    const newRoom: ClientRoom = {
      id: "room-" + Math.random().toString(36).slice(2, 9),
      name: addRoomName.trim(),
      building: addRoomBuilding.trim() || undefined,
      code: addRoomCode.trim() || undefined,
      floor: addRoomFloor.trim() || undefined,
      description: addRoomDesc.trim() || undefined,
      subRoomName: addRoomSubRoom.trim() || undefined,
      statusAktif: addRoomStatusAktif,
      createdAt: new Date().toISOString()
    };
    await onUpdateClient(cl.id, { rooms: [...currentRooms, newRoom] });
    setAddRoomBuilding("");
    setAddRoomName("");
    setAddRoomCode("");
    setAddRoomFloor("");
    setAddRoomDesc("");
    setAddRoomSubRoom("");
    setAddRoomStatusAktif(true);
  };

  const handleUpdateRoom = async (rId: string) => {
    if (!editRoomName.trim()) {
      alert("Nama ruangan wajib diisi!");
      return;
    }
    const currentRooms = cl.rooms || [];
    const updated = currentRooms.map(r => {
      if (r.id === rId) {
        return {
          ...r,
          name: editRoomName.trim(),
          building: editRoomBuilding.trim() || undefined,
          code: editRoomCode.trim() || undefined,
          floor: editRoomFloor.trim() || undefined,
          description: editRoomDesc.trim() || undefined,
          subRoomName: editRoomSubRoom.trim() || undefined,
          statusAktif: editRoomStatusAktif,
        };
      }
      return r;
    });
    await onUpdateClient(cl.id, { rooms: updated });
    setEditingRoomId(null);
  };

  const handleDeleteRoom = async (rId: string, roomName: string) => {
    // 2. Jika sudah ada data aset pada ruangan, validasi supaya tidak bisa di hapus
    const roomAssets = clientAssets.filter(as => as.roomId === rId || as.roomName === roomName);
    if (roomAssets.length > 0) {
      alert(`Ruangan "${roomName}" tidak dapat dihapus karena masih terdapat ${roomAssets.length} aset terpasang di dalamnya! Silakan pindahkan atau hapus aset terlebih dahulu.`);
      return;
    }

    if (confirm(`Apakah anda yakin ingin menghapus ruangan "${roomName}" dari profil RS?`)) {
      const currentRooms = cl.rooms || [];
      const updated = currentRooms.filter(r => r.id !== rId);
      await onUpdateClient(cl.id, { rooms: updated });
    }
  };

  // --- Manage Modules Methods ---
  const handleAddModuleStatus = async () => {
    const activeMod = addModulName || registeredModuleNames.filter(name => !(cl.moduleStatuses || []).some(m => m.modulName === name))[0];
    if (!activeMod) {
      alert("Tidak ada modul baru yang tersedia untuk dipantau.");
      return;
    }
    const currentStatuses = cl.moduleStatuses || [];
    if (currentStatuses.some(m => m.modulName === activeMod)) {
      alert(`Modul "${activeMod}" sudah dipantau untuk RS ini!`);
      return;
    }
    const newItem = {
      id: "ms-" + Math.random().toString(36).slice(2, 9),
      modulName: activeMod,
      status: addModulStatus || statusImplementasiList[0] || "Belum Mulai",
      tanggalImplementasi: addModulTanggal || new Date().toISOString().slice(0, 10),
      updatedAt: new Date().toISOString()
    };
    const updated = [...currentStatuses, newItem];
    await onUpdateClient(cl.id, { moduleStatuses: updated });

    // Auto update selection fallback
    const clientImplemented = updated.map(m => m.modulName);
    const nextAvail = registeredModuleNames.filter(name => !clientImplemented.includes(name));
    setAddModulName(nextAvail[0] || "");
  };

  const handleUpdateModuleStatusValue = async (id: string, nextStatus?: string, nextTanggal?: string) => {
    const currentStatuses = cl.moduleStatuses || [];
    const updated = currentStatuses.map(m => {
      if (m.id === id) {
        return {
          ...m,
          status: nextStatus !== undefined ? nextStatus : m.status,
          tanggalImplementasi: nextTanggal !== undefined ? nextTanggal : m.tanggalImplementasi,
          updatedAt: new Date().toISOString()
        };
      }
      return m;
    });
    await onUpdateClient(cl.id, { moduleStatuses: updated });
  };

  const handleDeleteModuleStatus = async (id: string) => {
    const currentStatuses = cl.moduleStatuses || [];
    const updated = currentStatuses.filter(m => m.id !== id);
    await onUpdateClient(cl.id, { moduleStatuses: updated });

    const clientImplemented = updated.map(m => m.modulName);
    const nextAvail = registeredModuleNames.filter(name => !clientImplemented.includes(name));
    setAddModulName(nextAvail[0] || "");
  };

  return (
    <div className={`border rounded-xl p-5 transition-all ${isEditing ? "bg-slate-50 dark:bg-slate-950 border-blue-500 ring-1 ring-blue-500/30" : "bg-slate-50/50 dark:bg-slate-900/40 hover:bg-slate-100/50 dark:hover:bg-slate-800/40 border-slate-200 dark:border-slate-800"}`}>
      {isEditing ? (
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2 mb-2">
            <span className="text-xs font-bold text-blue-600 dark:text-blue-400">📝 Mengedit Data Client: {cl.namaRS}</span>
            <button type="button" onClick={() => setIsEditing(false)} className="text-slate-400 hover:text-slate-900 dark:text-slate-500 dark:hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-550 uppercase mb-1">Nama RS / Client</label>
              <input
                type="text"
                required
                value={editNamaRS}
                onChange={(e) => setEditNamaRS(e.target.value)}
                disabled={isUserScoped}
                className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-blue-500 disabled:opacity-60"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-550 uppercase mb-1">Kode RS (Maks 5 Karakter)</label>
              <input
                type="text"
                maxLength={5}
                value={editKodeRS}
                onChange={(e) => setEditKodeRS(e.target.value.substring(0, 5).toUpperCase())}
                disabled={isUserScoped}
                className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-blue-500 disabled:opacity-60"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-550 uppercase mb-1">Tipe Medika</label>
              <select
                value={editTipeMedika}
                onChange={(e) => setEditTipeMedika(e.target.value)}
                disabled={isUserScoped}
                className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-950 dark:text-white rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-blue-500 disabled:opacity-60"
              >
                {tipeMedikaList.map((tm) => (
                  <option key={tm} value={tm}>{tm}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-550 uppercase mb-1">NO KSO</label>
              <input
                type="text"
                value={editNoKSO}
                onChange={(e) => setEditNoKSO(e.target.value)}
                disabled={isUserScoped}
                className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-blue-500 disabled:opacity-60"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-550 uppercase mb-1">Sharing KSO (%)</label>
              <input
                type="number"
                step="any"
                required
                value={editPersentaseKSO}
                onChange={(e) => setEditPersentaseKSO(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-550 uppercase mb-1">Status Keaktifan RS</label>
              <select
                value={editStatusAktif ? "Aktif" : "Non-Aktif"}
                onChange={(e) => setEditStatusAktif(e.target.value === "Aktif")}
                className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-950 dark:text-white rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-blue-500"
              >
                <option value="Aktif">Aktif</option>
                <option value="Non-Aktif">Non-Aktif</option>
              </select>
            </div>
          </div>

          {/* Directors Management Section */}
          <div className="bg-slate-50 dark:bg-slate-950/45 p-4 border border-slate-200 dark:border-slate-800 rounded-xl space-y-4">
            <div className="text-xs font-extrabold text-blue-600 dark:text-blue-400 uppercase tracking-wide flex items-center gap-1.5">
              <UserCheck2 className="w-4 h-4" />
              <span>Manajemen Riwayat Direktur Utama & NIP</span>
            </div>

            {editDirectors.length === 0 ? (
              <div className="text-center py-4 bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 rounded-lg">
                <p className="text-[11px] text-slate-500 italic">Belum ada riwayat Direktur. Silakan tambahkan direktur baru di bawah.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {editDirectors.map((dir) => (
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
                          <p className="text-[9px] text-slate-500 dark:text-slate-405 mt-1 bg-slate-50 dark:bg-slate-950 px-1.5 py-0.5 rounded border border-slate-100 dark:border-slate-850">
                            {dir.startDate || "?"} s.d {dir.endDate || "Sekarang"}
                          </p>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-1">
                        {!dir.isActive && (
                          <button
                            type="button"
                            onClick={() => handleSetActiveDirInEditing(dir.id)}
                            className="text-[9px] bg-slate-100 hover:bg-emerald-5 border border-slate-200 dark:border-slate-800 hover:text-emerald-600 dark:bg-slate-800 dark:hover:bg-emerald-950 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded cursor-pointer"
                          >
                            Set Aktif
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDeleteDirInEditing(dir.id)}
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

            {/* Sub director entry form */}
            <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-850 rounded-lg p-3 space-y-3">
              <div className="text-[10px] font-extrabold text-slate-550 dark:text-slate-400 uppercase tracking-widest pb-1 border-b border-slate-50 dark:border-slate-850">
                ➕ Formulir Direktur RS Baru
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 uppercase mb-0.5">Nama Direktur</label>
                  <input
                    type="text"
                    value={subDirName}
                    onChange={(e) => setSubDirName(e.target.value)}
                    placeholder="dr. Bambang, Sp.B"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-2 py-1 text-xs text-slate-850 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 uppercase mb-0.5">NIP Direktur</label>
                  <input
                    type="text"
                    value={subDirNip}
                    onChange={(e) => setSubDirNip(e.target.value)}
                    placeholder="197508..."
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-2 py-1 text-xs text-slate-850 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 uppercase mb-0.5">Mulai Jabatan</label>
                  <input
                    type="date"
                    value={subDirStart}
                    onChange={(e) => setSubDirStart(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-2 py-0.5 text-xs text-slate-850 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 uppercase mb-0.5">Selesai Jabatan</label>
                  <input
                    type="date"
                    value={subDirEnd}
                    onChange={(e) => setSubDirEnd(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-2 py-0.5 text-xs text-slate-850 text-slate-900 dark:text-white"
                  />
                </div>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 border-t border-slate-50 dark:border-slate-850">
                <label className="inline-flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-slate-600 dark:text-slate-400">
                  <input
                    type="checkbox"
                    checked={subDirActive}
                    onChange={(e) => setSubDirActive(e.target.checked)}
                    className="rounded border-slate-300 dark:border-slate-800 text-blue-600 focus:ring-blue-500 shrink-0 w-3.5 h-3.5"
                  />
                  <span>Set sebagai Direktur Aktif saat ini</span>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    if (!subDirName.trim()) {
                      alert("Nama Direktur wajib diisi!");
                      return;
                    }
                    const id = "dir-" + Math.random().toString(36).slice(2, 9);
                    const newDir: DirectorHistory = {
                      id,
                      name: subDirName.trim(),
                      nip: subDirNip.trim(),
                      startDate: subDirStart,
                      endDate: subDirEnd,
                      isActive: subDirActive
                    };
                    let list = [...editDirectors];
                    if (subDirActive) {
                      list = list.map(d => ({ ...d, isActive: false }));
                    }
                    setEditDirectors([...list, newDir]);
                    setSubDirName("");
                    setSubDirNip("");
                    setSubDirStart("");
                    setSubDirEnd("");
                    setSubDirActive(false);
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
              <label className="block text-[10px] font-bold text-slate-550 uppercase mb-1">Tanggal Project</label>
              <input
                type="date"
                value={editTanggalProject}
                onChange={(e) => setEditTanggalProject(e.target.value)}
                disabled={isUserScoped}
                className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-blue-500 disabled:opacity-60"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-550 uppercase mb-1">Tanggal Cut-Off</label>
              <input
                type="date"
                value={editTanggalCutOff}
                onChange={(e) => setEditTanggalCutOff(e.target.value)}
                disabled={isUserScoped}
                className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-blue-500 disabled:opacity-60"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-850">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-850 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold px-3 py-1.5 rounded-lg transition-all cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-all cursor-pointer"
            >
              Terapkan Perubahan
            </button>
          </div>
        </form>
      ) : (
        <div>
          {/* Card View Mode */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-extrabold text-slate-900 dark:text-white">{cl.namaRS}</span>
                {cl.kodeRS && (
                  <span className="text-[10px] bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/40 rounded px-1.5 py-0.5 font-bold font-mono uppercase">
                    KODE: {cl.kodeRS}
                  </span>
                )}
                <span className="text-[10px] bg-blue-50 dark:bg-slate-800 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-slate-700 rounded px-1.5 py-0.5 font-bold uppercase tracking-wide">
                  {cl.tipeMedika || "Rumah Sakit"}
                </span>
                <span className={`text-[10px] border rounded px-1.5 py-0.5 font-black uppercase tracking-wider ${cl.statusAktif !== false ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/40" : "bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 border-rose-200 dark:border-rose-900/40"}`}>
                  {cl.statusAktif !== false ? "● Aktif" : "○ Non-Aktif"}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1.5 mt-3 text-xs text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-1.5">
                  <FileCheck className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                  <span className="font-semibold text-slate-650 dark:text-slate-300">No KSO:</span>
                  <span className="font-mono text-slate-700 dark:text-slate-405">{cl.noKSO || "-"}</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <Percent className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                  <span className="font-semibold text-slate-650 dark:text-slate-300">Nilai Persentase KSO:</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-205">{cl.persentaseKSO !== undefined ? `${cl.persentaseKSO}%` : "100%"}</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <UserCheck2 className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                  <span className="font-semibold text-slate-650 dark:text-slate-300">Direktur RS (Terbaru):</span>
                  <span className="text-slate-800 dark:text-slate-205 font-bold">{cl.direkturRS || "-"}</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                  <span className="font-semibold text-slate-650 dark:text-slate-300">Tanggal Project:</span>
                  <span className="text-slate-850 dark:text-slate-300">{cl.tanggalProject || "-"}</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0" />
                  <span className="font-semibold text-slate-650 dark:text-slate-300">Cut Off Sistem:</span>
                  <span className="text-orange-600 dark:text-orange-400 font-bold">{cl.tanggalCutOff || "-"}</span>
                </div>
              </div>

              {/* Historical Directors Section */}
              {cl.directors && cl.directors.length > 0 && (
                <div className="mt-3 bg-slate-100/50 dark:bg-slate-950/20 p-2.5 rounded-lg border border-slate-200/50 dark:border-slate-800">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1 mb-1.5">📚 Daftar Riwayat Direktur Utama ({cl.directors.length})</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {cl.directors.map(dir => (
                      <div key={dir.id} className="text-[11px] px-2 py-1 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-850 rounded flex items-center justify-between">
                        <div>
                          <span className="font-bold text-slate-700 dark:text-slate-300">{dir.name}</span>
                          {dir.nip && <span className="text-slate-400 block text-[9px] font-mono mt-0.5">NIP. {dir.nip}</span>}
                          {(dir.startDate || dir.endDate) && (
                            <span className="text-slate-450 block text-[9px] font-sans mt-0.5">🗓️ {dir.startDate || "?"} s/d {dir.endDate || "Sekarang"}</span>
                          )}
                        </div>
                        <span className={`text-[9px] px-1.5 py-0.5 font-bold rounded ${dir.isActive ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50 uppercase" : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"}`}>
                          {dir.isActive ? "Aktif" : "Selesai"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Quick Stats & Badges */}
            <div className="flex flex-row md:flex-col items-center md:items-end gap-2 shrink-0 bg-slate-100/20 dark:bg-slate-950/10 p-3 rounded-xl border border-slate-200/40 dark:border-slate-800/40">
              <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 text-left md:text-right w-full hidden md:block">📋 Ringkasan RS</div>
              <div className="flex items-center gap-1.5 text-xs text-slate-750 dark:text-slate-400">
                <span className="font-bold text-slate-800 dark:text-slate-200">{clientAssets.length}</span>
                <span className="text-slate-450">Perangkat Aset</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-750 dark:text-slate-400 mt-0.5">
                <span className={`font-bold px-1.5 rounded-sm ${clientTickets.some(t => t.status !== "Closed") ? "text-amber-600 bg-amber-50 dark:bg-amber-950/20" : "text-slate-400 bg-slate-100 dark:bg-slate-900"}`}>{clientTickets.filter(t => t.status !== "Closed").length}</span>
                <span className="text-slate-450">Tiket Terbuka</span>
              </div>
            </div>
          </div>

          {/* Module list pills preview */}
          {cl.moduleStatuses && cl.moduleStatuses.length > 0 && (
            <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-slate-900/40">
              <span className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-505 block mb-1.5 tracking-wider">🛠️ Status Modul SIMRS ({cl.moduleStatuses.length})</span>
              <div className="flex flex-wrap gap-2">
                {cl.moduleStatuses.map(m => (
                  <div key={m.id} className="text-[11px] bg-slate-100/40 hover:bg-slate-100 dark:bg-slate-900/20 dark:hover:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 px-2.5 py-1 rounded-lg flex items-center gap-2">
                    <span className="font-bold text-slate-700 dark:text-slate-300">{m.modulName}:</span>
                    <span className={`font-semibold px-2 py-0.5 rounded text-[10px] ${
                      m.status === "Selesai Implementasi" ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50" :
                      m.status.includes("UAT") || m.status.includes("Pending") || m.status.includes("Pelatihan") ? "bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900/50" :
                      m.status.includes("Setting") || m.status.includes("Analisis") ? "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900/35" :
                      "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                    }`}>
                      {m.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action buttons bar */}
          <div className="flex items-center gap-2 self-end md:self-center border-t border-slate-100 dark:border-slate-900 md:border-none pt-3 md:pt-0 mt-4 justify-end">
            <button
              type="button"
              onClick={() => {
                setIsModulesExpanded(!isModulesExpanded);
                setIsRoomsExpanded(false);
                const clientImplemented = cl.moduleStatuses?.map(ms => ms.modulName) || [];
                const available = registeredModuleNames.filter(name => !clientImplemented.includes(name));
                setAddModulName(available[0] || "");
                setAddModulStatus(statusImplementasiList[0] || "Belum Mulai");
                setAddModulTanggal(new Date().toISOString().slice(0, 10));
              }}
              className={`p-2 h-8.5 rounded-lg border transition-all text-xs font-bold flex items-center gap-1.5 cursor-pointer ${
                isModulesExpanded 
                  ? "bg-blue-600 border-blue-500 text-white shadow-md shadow-blue-600/30" 
                  : "bg-slate-100 border-slate-200 dark:bg-slate-900 dark:border-slate-850 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
              }`}
              title="Kelola Modul & Status Implementasi"
            >
              <FileCheck className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Kelola Status Modul</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setIsRoomsExpanded(!isRoomsExpanded);
                setIsModulesExpanded(false);
                setAddRoomName("");
                setAddRoomCode("");
                setAddRoomFloor("");
                setAddRoomDesc("");
                setEditingRoomId(null);
              }}
              className={`p-2 h-8.5 rounded-lg border transition-all text-xs font-bold flex items-center gap-1.5 cursor-pointer ${
                isRoomsExpanded 
                  ? "bg-emerald-600 border-emerald-500 text-white shadow-md shadow-emerald-600/30" 
                  : "bg-slate-100 border-slate-200 dark:bg-slate-900 dark:border-slate-850 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
              }`}
              title="Kelola Ruangan/Unit Penempatan Aset"
            >
              <Home className="w-3.5 h-3.5 text-emerald-505" />
              <span className="hidden sm:inline">Kelola Ruangan RS</span>
              {cl.rooms && cl.rooms.length > 0 && (
                <span className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 px-1.5 py-0.5 rounded-full text-[10px] font-black shrink-0">
                  {cl.rooms.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={handleStartEdit}
              className="bg-slate-105 border border-slate-200 hover:bg-slate-200 dark:bg-slate-900 dark:border-slate-850 dark:hover:bg-slate-800 p-2 rounded-lg text-slate-700 dark:text-slate-300 transition-all hover:text-slate-900 dark:hover:text-white cursor-pointer"
              title="Edit"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>

            {!isUserScoped && (
              <button
                type="button"
                onClick={async () => {
                  if (confirm(`Apakah Anda yakin ingin menghapus data Client ${cl.namaRS}?`)) {
                    await onDeleteClient(cl.id);
                  }
                }}
                className="bg-red-950/20 hover:bg-red-900/30 border border-red-900/40 p-2 rounded-lg text-red-400 transition-all active:scale-95 cursor-pointer"
                title="Hapus"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* --- MODULES DRAWER --- */}
          {isModulesExpanded && (
            <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-850 rounded-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                <div className="flex items-center gap-1.5 text-xs font-black text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                  <Building2 className="w-4 h-4 text-blue-500" />
                  <span>Kelola Status Implementasi Modul</span>
                </div>
                <button 
                  type="button"
                  onClick={() => setIsModulesExpanded(false)} 
                  className="text-slate-400 dark:text-slate-500 hover:text-slate-950 dark:hover:text-white text-xs font-bold cursor-pointer"
                >
                  Tutup
                </button>
              </div>

              <div className="space-y-3">
                {!cl.moduleStatuses || cl.moduleStatuses.length === 0 ? (
                  <p className="text-xs text-slate-500 italic font-medium">Belum ada modul yang dipantau. Silakan tambahkan laporan modul di bawah.</p>
                ) : (
                  <div className="flex flex-col gap-4 pb-2">
                    {cl.moduleStatuses.map((m) => {
                      const isEditingThisModule = editingModuleStatusId === m.id;
                      return (
                        <div key={m.id} className="p-3 bg-white dark:bg-slate-950 rounded-xl border border-slate-200/50 dark:border-slate-850 shadow-sm flex flex-col gap-2">
                          <div className="flex flex-wrap items-center gap-2 text-[9px] font-mono font-bold">
                            <span className="text-blue-650 bg-blue-50 dark:bg-blue-950/30 px-2 py-0.5 rounded border border-blue-100 dark:border-blue-900/40 uppercase">🏢 {m.modulName}</span>
                            <span className="text-slate-400 dark:text-slate-500">Update Terakhir: {m.updatedAt ? new Intl.DateTimeFormat("id-ID", { dateStyle: "short", timeStyle: "short" }).format(new Date(m.updatedAt)) : "-"}</span>
                          </div>

                          <div className="flex items-start justify-between gap-2">
                            {isEditingThisModule ? (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-100 dark:border-slate-850 w-full">
                                <div>
                                  <label className="block text-[9px] font-bold text-slate-500 uppercase mb-0.5">Ubah Status Implementasi</label>
                                  <select
                                    value={tempStatus}
                                    onChange={(e) => setTempStatus(e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-250 dark:border-slate-800 rounded px-2.5 py-1 text-xs text-slate-950 dark:text-white"
                                  >
                                    {statusImplementasiList.map(st => (
                                      <option key={st} value={st}>{st}</option>
                                    ))}
                                  </select>
                                </div>
                                <div className="flex items-end gap-2">
                                  <div className="flex-1">
                                    <label className="block text-[9px] font-bold text-slate-500 uppercase mb-0.5">Ubah Tanggal Implementasi</label>
                                    <input
                                      type="date"
                                      value={tempTanggal}
                                      onChange={(e) => setTempTanggal(e.target.value)}
                                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-250 dark:border-slate-800 rounded px-2.5 py-0.5 text-xs text-slate-950 dark:text-white"
                                    />
                                  </div>
                                  <div className="flex gap-1.5 shrink-0">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        handleUpdateModuleStatusValue(m.id, tempStatus, tempTanggal);
                                        setEditingModuleStatusId(null);
                                      }}
                                      className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-[10px] px-2.5 py-1 rounded transition-all active:scale-95"
                                    >
                                      Simpan
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setEditingModuleStatusId(null)}
                                      className="bg-slate-100 hover:bg-slate-150 text-slate-600 font-bold text-[10px] px-2.5 py-1 rounded transition-all active:scale-95"
                                    >
                                      Batal
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                                    m.status === "Selesai Implementasi" ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400" : "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400"
                                  }`}>
                                    {m.status}
                                  </span>
                                  <span className="text-[10px] text-slate-450 font-medium">🗓️ Target/Tanggal: {m.tanggalImplementasi || "-"}</span>
                                </div>
                              </div>
                            )}

                            {!isEditingThisModule && (
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingModuleStatusId(m.id);
                                    setTempStatus(m.status);
                                    setTempTanggal(m.tanggalImplementasi || "");
                                  }}
                                  className="text-slate-400 hover:text-blue-500 p-1 rounded hover:bg-blue-50 dark:hover:bg-blue-950/20"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (confirm("Apakah anda yakin ingin menghapus status implementasi modul ini?")) {
                                      handleDeleteModuleStatus(m.id);
                                    }
                                  }}
                                  className="text-slate-400 hover:text-red-500 p-1 rounded hover:bg-red-50 dark:hover:bg-red-950/20"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Add module status item form */}
              <div className="bg-white dark:bg-slate-950 p-4 rounded-lg border border-slate-200 dark:border-slate-850 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                  <div>
                    <label className="block text-[9px] font-extrabold text-slate-455 mb-1.5 uppercase">Pilih Modul Baru</label>
                    <select
                      value={addModulName}
                      onChange={(e) => setAddModulName(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-950 dark:text-white rounded px-2.5 py-1 text-xs focus:outline-none focus:border-blue-500"
                    >
                      {registeredModuleNames.filter(name => !(cl.moduleStatuses || []).some(m => m.modulName === name)).map(mName => (
                        <option key={mName} value={mName}>{mName}</option>
                      ))}
                      {registeredModuleNames.filter(name => !(cl.moduleStatuses || []).some(m => m.modulName === name)).length === 0 && (
                        <option value="">Semua modul telah didaftarkan</option>
                      )}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[9px] font-extrabold text-slate-455 mb-1.5 uppercase">Status Implementasi Saat Ini</label>
                    <select
                      value={addModulStatus}
                      onChange={(e) => setAddModulStatus(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-950 dark:text-white rounded px-2.5 py-1 text-xs focus:outline-none focus:border-blue-500"
                    >
                      {statusImplementasiList.map(st => (
                        <option key={st} value={st}>{st}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[9px] font-extrabold text-slate-455 mb-1.5 uppercase">Tanggal Implementasi</label>
                    <input
                      type="date"
                      value={addModulTanggal}
                      onChange={(e) => setAddModulTanggal(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-950 dark:text-white rounded px-2.5 py-0.5 text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={handleAddModuleStatus}
                    className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 py-1.5 rounded-md transition-all shadow-md shadow-blue-500/10 cursor-pointer active:scale-95"
                  >
                    Tambah Status Modul
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* --- ROOMS DRAWER --- */}
          {isRoomsExpanded && (
            <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                <div className="flex items-center gap-1.5 text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                  <Home className="w-4 h-4 text-emerald-500" />
                  <span>Kelola Ruangan & Penempatan Aset RS</span>
                </div>
                <button 
                  type="button"
                  onClick={() => setIsRoomsExpanded(false)} 
                  className="text-slate-400 dark:text-slate-500 hover:text-slate-950 dark:hover:text-white text-xs font-bold cursor-pointer"
                >
                  Tutup
                </button>
              </div>

              <div className="space-y-3">
                {!cl.rooms || cl.rooms.length === 0 ? (
                  <p className="text-xs text-slate-500 italic font-medium">Belum ada ruangan yang didaftarkan. Silakan tambahkan ruangan untuk menaruh aset.</p>
                ) : (
                  <div className="grid grid-cols-1 gap-3 pb-2">
                    {cl.rooms.map((room) => {
                      const isEditingThisRoom = editingRoomId === room.id;
                      const roomAssets = clientAssets.filter(as => as.roomId === room.id || as.roomName === room.name);
                      return (
                        <div key={room.id} className="p-3 bg-white dark:bg-slate-950 rounded-xl border border-slate-200/50 dark:border-slate-850 shadow-sm flex flex-col justify-between gap-1.5">
                          {isEditingThisRoom ? (
                            <div className="space-y-3">
                              <div className="grid grid-cols-3 gap-2">
                                <div>
                                  <label className="block text-[8px] font-bold text-slate-500 uppercase mb-0.5">Gedung</label>
                                  <input
                                    type="text"
                                    value={editRoomBuilding}
                                    onChange={(e) => setEditRoomBuilding(e.target.value)}
                                    placeholder="e.g. Gedung A"
                                    className="w-full bg-slate-50 dark:bg-slate-905 border border-slate-250 dark:border-slate-800 rounded px-2 py-0.5 text-xs text-slate-950 dark:text-white"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[8px] font-bold text-slate-500 uppercase mb-0.5">Nama Ruangan RS *</label>
                                  <input
                                    type="text"
                                    value={editRoomName}
                                    onChange={(e) => setEditRoomName(e.target.value)}
                                    placeholder="e.g. Ruang UGD"
                                    className="w-full bg-slate-50 dark:bg-slate-905 border border-slate-250 dark:border-slate-800 rounded px-2 py-0.5 text-xs text-slate-950 dark:text-white"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[8px] font-bold text-slate-500 uppercase mb-0.5">Sub Ruangan</label>
                                  <input
                                    type="text"
                                    value={editRoomSubRoom}
                                    onChange={(e) => setEditRoomSubRoom(e.target.value)}
                                    placeholder="e.g. Bed 1 / Ruang Tindakan"
                                    className="w-full bg-slate-50 dark:bg-slate-905 border border-slate-250 dark:border-slate-800 rounded px-2 py-0.5 text-xs text-slate-950 dark:text-white"
                                  />
                                </div>
                              </div>
                              <div className="grid grid-cols-3 gap-2">
                                <div>
                                  <label className="block text-[8px] font-bold text-slate-500 uppercase mb-0.5">Kode Singkatan</label>
                                  <input
                                    type="text"
                                    value={editRoomCode}
                                    onChange={(e) => setEditRoomCode(e.target.value)}
                                    placeholder="e.g. UGD-01"
                                    className="w-full bg-slate-50 dark:bg-slate-905 border border-slate-250 dark:border-slate-800 rounded px-2 py-0.5 text-xs text-slate-950 dark:text-white"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[8px] font-bold text-slate-500 uppercase mb-0.5">Lantai RS</label>
                                  <input
                                    type="text"
                                    value={editRoomFloor}
                                    onChange={(e) => setEditRoomFloor(e.target.value)}
                                    placeholder="e.g. 1"
                                    className="w-full bg-slate-50 dark:bg-slate-905 border border-slate-250 dark:border-slate-800 rounded px-2 py-0.5 text-xs text-slate-950 dark:text-white"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[8px] font-bold text-slate-500 uppercase mb-0.5">Keterangan / Fungsi</label>
                                  <input
                                    type="text"
                                    value={editRoomDesc}
                                    onChange={(e) => setEditRoomDesc(e.target.value)}
                                    placeholder="Keterangan / Fungsi"
                                    className="w-full bg-slate-50 dark:bg-slate-905 border border-slate-250 dark:border-slate-800 rounded px-2 py-0.5 text-xs text-slate-950 dark:text-white"
                                  />
                                </div>
                              </div>
                              <div className="flex items-center gap-2 pt-1">
                                <input
                                  type="checkbox"
                                  id={`edit-room-status-${room.id}`}
                                  checked={editRoomStatusAktif}
                                  onChange={(e) => setEditRoomStatusAktif(e.target.checked)}
                                  className="rounded border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-blue-500 h-3.5 w-3.5 cursor-pointer"
                                />
                                <label htmlFor={`edit-room-status-${room.id}`} className="text-[10px] font-bold text-slate-750 dark:text-slate-300 cursor-pointer select-none">
                                  Ruangan Aktif
                                </label>
                              </div>
                              <div className="flex gap-2 justify-end pt-1">
                                <button
                                  type="button"
                                  onClick={() => handleUpdateRoom(room.id)}
                                  className="bg-emerald-600 text-white font-bold text-[9px] px-2.5 py-1 rounded cursor-pointer"
                                >
                                  Simpan
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingRoomId(null)}
                                  className="bg-slate-100 text-slate-600 font-bold text-[9px] px-2.5 py-1 rounded cursor-pointer"
                                >
                                  Batal
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div>
                              <div className="flex items-center justify-between pb-1 border-b border-slate-100 dark:border-slate-900/40">
                                <div className="flex flex-wrap items-center gap-1.5">
                                  {room.building && <span className="bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 text-[8.5px] font-black px-1.5 py-0.5 rounded uppercase border border-amber-200 dark:border-amber-900/45">🏢 {room.building}</span>}
                                  <span className="font-bold text-xs text-slate-850 dark:text-slate-105 flex items-center gap-1">🚪 {room.name}</span>
                                  {room.subRoomName && <span className="bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400 text-[8.5px] font-black px-1.5 py-0.5 rounded border border-indigo-200 dark:border-indigo-900/45">🔑 Sub: {room.subRoomName}</span>}
                                  {room.code && <span className="bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 text-[8.5px] font-bold px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-900/45">{room.code}</span>}
                                  {room.floor && <span className="bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 text-[8.5px] font-medium px-1.5 py-0.5 rounded border border-blue-200 dark:border-blue-900/45">Lt.{room.floor}</span>}
                                  <span className={`text-[8.5px] font-bold px-1.5 py-0.5 rounded border ${room.statusAktif !== false ? "bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/45" : "bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-950/40 dark:text-rose-450 dark:border-rose-900/45"}`}>
                                    {room.statusAktif !== false ? "Aktif" : "Non-Aktif"}
                                  </span>
                                </div>
                                <div className="flex gap-2">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingRoomId(room.id);
                                      setEditRoomName(room.name);
                                      setEditRoomBuilding(room.building || "");
                                      setEditRoomCode(room.code || "");
                                      setEditRoomFloor(room.floor || "");
                                      setEditRoomDesc(room.description || "");
                                      setEditRoomSubRoom(room.subRoomName || "");
                                      setEditRoomStatusAktif(room.statusAktif !== false);
                                    }}
                                    className="text-slate-400 hover:text-emerald-600 p-0.5 rounded cursor-pointer"
                                  >
                                    <Pencil className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteRoom(room.id, room.name)}
                                    className="text-slate-400 hover:text-red-500 p-0.5 rounded cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>

                              <div className="space-y-1">
                                {room.description && <p className="text-[10px] text-slate-500 mt-1 italic leading-tight">💬 Fungsi/Keterangan: {room.description}</p>}
                              </div>

                              {/* Nested penempatan aset list */}
                              <div className="bg-slate-105/50 dark:bg-slate-950 p-2.5 rounded-lg border border-slate-200/50 dark:border-slate-850 space-y-1.5 mt-2">
                                <span className="text-[8.5px] font-black uppercase text-slate-405 block tracking-wider">📦 Daftar Penempatan Aset ({roomAssets.length})</span>
                                {roomAssets.length === 0 ? (
                                  <p className="text-[10px] text-slate-500 italic font-medium">Tidak ada perangkat terpasang saat ini.</p>
                                ) : (
                                  <div className="max-h-32 overflow-y-auto divide-y divide-slate-200/60 dark:divide-slate-800 text-[10px] scrollbar-thin">
                                    {roomAssets.map((dev, idx) => (
                                      <div key={dev.id} className="py-1.5 flex items-center justify-between gap-2">
                                        <div className="flex items-start gap-1.5">
                                          <span className="text-slate-400 dark:text-slate-500 font-mono text-[9px] mt-0.5">{idx + 1}.</span>
                                          <div>
                                            <span className="font-semibold text-slate-800 dark:text-slate-200">{dev.deviceName}</span>
                                            <span className="text-slate-400 dark:text-slate-500 text-[8.5px] font-mono ml-1.5">
                                              (SN: {dev.serialNumber || "-"} | Kat: {dev.category})
                                            </span>
                                          </div>
                                        </div>
                                        <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${dev.status === "Aktif" ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20" : "bg-rose-50 text-rose-600"}`}>
                                          {dev.status}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Add room form inside expanded drawer */}
              <div className="bg-white dark:bg-slate-950 p-4 rounded-lg border border-slate-200 dark:border-slate-850 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end">
                  <div>
                    <label className="block text-[9px] font-extrabold text-slate-455 mb-1.5 uppercase">Gedung RS</label>
                    <input
                      type="text"
                      value={addRoomBuilding}
                      onChange={(e) => setAddRoomBuilding(e.target.value)}
                      placeholder="e.g. Gedung A / Barat"
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-950 dark:text-white rounded px-2.5 py-1 text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-extrabold text-slate-455 mb-1.5 uppercase">Nama Ruangan RS *</label>
                    <input
                      type="text"
                      value={addRoomName}
                      onChange={(e) => setAddRoomName(e.target.value)}
                      placeholder="e.g. Unit Gawat Darurat (UGD)"
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-950 dark:text-white rounded px-2.5 py-1 text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-extrabold text-slate-455 mb-1.5 uppercase">Sub Ruangan</label>
                    <input
                      type="text"
                      value={addRoomSubRoom}
                      onChange={(e) => setAddRoomSubRoom(e.target.value)}
                      placeholder="e.g. Bed 1 / Tindakan"
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-950 dark:text-white rounded px-2.5 py-1 text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-extrabold text-slate-455 mb-1.5 uppercase">Kode Singkatan</label>
                    <input
                      type="text"
                      value={addRoomCode}
                      onChange={(e) => setAddRoomCode(e.target.value)}
                      placeholder="e.g. UGD-01"
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-950 dark:text-white rounded px-2.5 py-1 text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-extrabold text-slate-455 mb-1.5 uppercase">Lantai RS</label>
                    <input
                      type="text"
                      value={addRoomFloor}
                      onChange={(e) => setAddRoomFloor(e.target.value)}
                      placeholder="e.g. 1"
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-950 dark:text-white rounded px-2.5 py-1 text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-extrabold text-slate-455 mb-1.5 uppercase">Keterangan / Fungsi</label>
                    <input
                      type="text"
                      value={addRoomDesc}
                      onChange={(e) => setAddRoomDesc(e.target.value)}
                      placeholder="e.g. Area darurat lantai dasar"
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-950 dark:text-white rounded px-2.5 py-1 text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="add-room-status"
                    checked={addRoomStatusAktif}
                    onChange={(e) => setAddRoomStatusAktif(e.target.checked)}
                    className="rounded border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-blue-500 h-3.5 w-3.5 cursor-pointer"
                  />
                  <label htmlFor="add-room-status" className="text-xs font-bold text-slate-755 dark:text-slate-300 cursor-pointer select-none">
                    Ruangan Aktif
                  </label>
                </div>
                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={handleAddRoom}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-1.5 rounded-md transition-all shadow-md shadow-emerald-500/10 cursor-pointer active:scale-95"
                  >
                    Tambah Ruangan Baru
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
