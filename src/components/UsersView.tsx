import React, { useState } from "react";
import { User, Client } from "../types";
import { 
  Users, 
  Plus, 
  Trash2, 
  UserPlus, 
  ShieldAlert, 
  Key, 
  Eye, 
  EyeOff, 
  UserCheck2,
  Pencil,
  Building2
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface UsersViewProps {
  users: User[];
  currentUser: User | null;
  onAddUser: (data: Partial<User>) => Promise<void>;
  onDeleteUser: (id: string) => Promise<void>;
  onUpdateUser: (id: string, data: Partial<User>) => Promise<void>;
  rolesList?: { roleName: string; active: boolean }[];
  clientsList?: Client[];
  divisiList?: { value: string; active: boolean }[];
}

export default function UsersView({
  users,
  currentUser,
  onAddUser,
  onDeleteUser,
  onUpdateUser,
  rolesList = [],
  clientsList = [],
  divisiList = []
}: UsersViewProps) {
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [nickname, setNickname] = useState("");
  const [role, setRole] = useState<string>("Technical Support");
  const [siteTugas, setSiteTugas] = useState("");
  const [statusAktif, setStatusAktif] = useState(true);
  const [divisi, setDivisi] = useState("");
  const [showPasswordMap, setShowPasswordMap] = useState<Record<string, boolean>>({});
  const [errorText, setErrorText] = useState("");

  // Edit User State
  const [editUser, setEditUser] = useState<User | null>(null);
  const [editName, setEditName] = useState("");
  const [editNickname, setEditNickname] = useState("");
  const [editRole, setEditRole] = useState<string>("Technical Support");
  const [editSiteTugas, setEditSiteTugas] = useState("");
  const [editStatusAktif, setEditStatusAktif] = useState(true);
  const [editDivisi, setEditDivisi] = useState("");
  
  // Password Reset State
  const [resetPasswordUser, setResetPasswordUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [resetSuccessMessage, setResetSuccessMessage] = useState("");

  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault();
    setErrorText("");

    if (!username.trim() || !password.trim() || !name.trim() || !nickname.trim()) {
      setErrorText("Silakan isi seluruh kolom formulir!");
      return;
    }

    // Check pre-existing username
    const exists = users.find(u => u.username.toLowerCase() === username.trim().toLowerCase());
    if (exists) {
      setErrorText("Username sudah terdaftar!");
      return;
    }

    await onAddUser({
      username: username.trim(),
      password: password.trim(),
      name: name.trim(),
      nickname: nickname.trim(),
      role,
      siteTugas,
      statusAktif,
      divisi
    });

    // Reset Form
    setUsername("");
    setPassword("");
    setName("");
    setNickname("");
    setRole("Technical Support");
    setSiteTugas("");
    setStatusAktif(true);
    setDivisi("");
    setIsFormOpen(false);
  }

  async function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editUser) return;
    if (!editName.trim() || !editNickname.trim()) {
      alert("Nama Lengkap dan Nama Panggilan wajib diisi!");
      return;
    }
    await onUpdateUser(editUser.id, {
      name: editName.trim(),
      nickname: editNickname.trim(),
      role: editRole,
      siteTugas: editSiteTugas,
      statusAktif: editStatusAktif,
      divisi: editDivisi
    });
    setEditUser(null);
  }

  async function handleResetPasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!resetPasswordUser) return;
    if (!newPassword.trim()) {
      alert("Sandi baru wajib diisi!");
      return;
    }
    await onUpdateUser(resetPasswordUser.id, {
      password: newPassword.trim()
    });
    setResetSuccessMessage(`Sandi untuk @${resetPasswordUser.username} berhasil direset menjadi "${newPassword}"!`);
    setNewPassword("");
    setTimeout(() => {
      setResetSuccessMessage("");
      setResetPasswordUser(null);
    }, 2500);
  }

  function toggleReveal(userId: string) {
    setShowPasswordMap(p => ({
      ...p,
      [userId]: !p[userId]
    }));
  }

  function getInitials(name: string) {
    return name.slice(0, 2).toUpperCase();
  }

  const getRoleStyleClass = (roleName: string) => {
    const legacyStyles: Record<string, string> = {
      Administrator: "bg-red-50 border-red-200 text-red-750 dark:bg-red-950/40 dark:text-red-400",
      'Site Coordinator': "bg-teal-50 border-teal-200 text-teal-755 dark:bg-teal-950/40 dark:text-teal-400",
      'System Support': "bg-blue-50 border-blue-200 text-blue-755 dark:bg-blue-950/40 dark:text-blue-400",
      'Technical Support': "bg-indigo-50 border-indigo-200 text-indigo-755 dark:bg-indigo-950/40 dark:text-indigo-400",
      'Assistant Technical Support': "bg-purple-50 border-purple-200 text-purple-755 dark:bg-purple-950/40 dark:text-purple-400"
    };
    if (legacyStyles[roleName]) return legacyStyles[roleName];

    const listStyles = [
      "bg-amber-50 border-amber-200 text-amber-750 dark:bg-amber-950/45 dark:text-amber-400",
      "bg-orange-50 border-orange-200 text-orange-755 dark:bg-orange-950/45 dark:text-orange-400",
      "bg-emerald-50 border-emerald-200 text-emerald-755 dark:bg-emerald-950/45 dark:text-emerald-400",
      "bg-sky-50 border-sky-200 text-sky-755 dark:bg-sky-950/45 dark:text-sky-400",
      "bg-pink-50 border-pink-200 text-pink-755 dark:bg-pink-950/45 dark:text-pink-400",
      "bg-slate-50 border-slate-200 text-slate-755 dark:bg-slate-900/40 dark:text-slate-400"
    ];
    let sum = 0;
    for (let i = 0; i < roleName.length; i++) sum += roleName.charCodeAt(i);
    return listStyles[sum % listStyles.length];
  };

  return (
    <div className="space-y-6 fade-in font-sans pb-10">
      
      {/* Upper info banners */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Users className="w-5.5 h-5.5 text-blue-600" /> Manajemen Akun & Hak Akses
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">
            Sebagai Administrator, Anda berhak membuat kredensial login mandiri untuk user lain.
          </p>
        </div>
        
        {currentUser?.role === "Administrator" && (
          <button
            onClick={() => { setErrorText(""); setIsFormOpen(true); }}
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg flex items-center gap-1 shadow-sm transition-all"
          >
            <UserPlus className="w-4 h-4" /> Tambah Kredensial User
          </button>
        )}
      </div>

      {/* Account Matrix Directory */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-805 text-slate-500 font-bold">
              <tr>
                <th className="p-4">Avatar / Initials</th>
                <th className="p-4">Username Akun (Kunci Node)</th>
                <th className="p-4">Nama Lengkap</th>
                <th className="p-4">Nama Panggilan</th>
                <th className="p-4">Hak Akses / Role</th>
                <th className="p-4">Divisi</th>
                <th className="p-4">Site Tugas</th>
                <th className="p-4">Status</th>
                <th className="p-4 font-mono">Kata Sandi</th>
                <th className="p-4 text-right">Tindakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 leading-normal">
              {users.map((u) => {
                const isYou = u.id === currentUser?.id;
                const revealed = !!showPasswordMap[u.id];

                return (
                  <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-950/15 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <span className="w-8 h-8 rounded-full bg-blue-50 border border-blue-105/30 text-blue-600 font-bold text-xs flex items-center justify-center shrink-0">
                          {getInitials(u.nickname || u.username)}
                        </span>
                        {isYou && (
                          <span className="bg-emerald-50 text-emerald-600 border border-emerald-100 text-[9px] font-black px-1.5 py-0.5 rounded">
                            Anda Aktif
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-4 font-bold text-slate-800 dark:text-slate-100 text-sm">
                      {u.username}
                    </td>
                    <td className="p-4 text-slate-700 dark:text-slate-300 font-medium">
                      {u.name || "—"}
                    </td>
                    <td className="p-4 text-slate-700 dark:text-slate-300 font-mono text-[11px] font-bold">
                      {u.nickname || "—"}
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getRoleStyleClass(u.role)}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="p-4 font-semibold text-slate-700 dark:text-slate-300">
                      {u.divisi || <span className="text-slate-400 italic font-normal">—</span>}
                    </td>
                    <td className="p-4 text-slate-700 dark:text-slate-300 font-medium">
                      {u.siteTugas ? (
                        <div className="flex items-center gap-1">
                          <Building2 className="w-3.5 h-3.5 text-slate-400" />
                          <span className="font-semibold">{u.siteTugas}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Pusat / Kantor Pusat</span>
                      )}
                    </td>
                    <td className="p-4 text-slate-700 dark:text-slate-300 font-medium">
                      {u.statusAktif !== false ? (
                        <span className="bg-emerald-50 text-emerald-600 border border-emerald-100 text-[10px] font-black px-2 py-0.5 rounded-full">
                          Aktif
                        </span>
                      ) : (
                        <span className="bg-slate-100 text-slate-400 dark:bg-slate-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                          Tidak Aktif
                        </span>
                      )}
                    </td>
                    <td className="p-4 font-mono">
                      <div className="flex items-center gap-2">
                        <span>{revealed ? u.password : "••••••••••••"}</span>
                        <button 
                          onClick={() => toggleReveal(u.id)}
                          className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                          title="Tampilkan Sandi"
                        >
                          {revealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end items-center gap-2">
                        <button
                          onClick={() => {
                            setEditUser(u);
                            setEditName(u.name || "");
                            setEditNickname(u.nickname || "");
                            setEditRole(u.role);
                            setEditSiteTugas(u.siteTugas || "");
                            setEditStatusAktif(u.statusAktif !== false);
                            setEditDivisi(u.divisi || "");
                          }}
                          className="p-1 px-1.5 border border-slate-100 hover:border-blue-200 text-slate-400 hover:text-blue-600 hover:bg-blue-50/50 dark:border-slate-800 dark:hover:bg-blue-950/20 rounded transition-all"
                          title="Edit Pengguna (Nama & Role)"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => {
                            setResetPasswordUser(u);
                            setNewPassword("");
                          }}
                          className="p-1 px-1.5 border border-slate-100 hover:border-amber-200 text-slate-400 hover:text-amber-600 hover:bg-amber-50/50 dark:border-slate-800 dark:hover:bg-amber-950/20 rounded transition-all"
                          title="Reset Password Pengguna"
                        >
                          <Key className="w-3.5 h-3.5" />
                        </button>

                        {isYou ? (
                          <span className="text-[10px] bg-slate-50 border border-slate-100 text-slate-400 font-bold px-1.5 py-0.5 rounded italic">Self</span>
                        ) : (
                          <button
                            onClick={() => {
                              if (confirm(`Hapus kredensial login "${u.username}" ? Pengguna tidak akan bisa masuk aplikasi`)) {
                                onDeleteUser(u.id);
                              }
                            }}
                            className="p-1 px-1.5 border border-slate-100 hover:border-red-200 text-slate-400 hover:text-red-500 hover:bg-red-50/50 dark:border-slate-800 dark:hover:bg-red-950/20 rounded transition-all"
                            title="Hapus Pengguna"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-amber-50/50 dark:bg-amber-950/10 border border-amber-101 dark:border-amber-900/30 p-4 rounded-xl flex items-start gap-2 text-xs text-amber-700">
        <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
        <div className="space-y-1 font-medium">
          <p className="font-bold">Informasi Kebijakan Keamanan:</p>
          <p className="leading-relaxed">Setiap peran memiliki batasan otorisasi tersendiri. Role "Administrator" memiliki kuasa tak terbatas atas Project & User. Role "Staff" adalah pelaksana yang boleh memperbarui tugas serta checklist. Role "Client" terenkripsi hanya boleh membaca statistik fungsional.</p>
        </div>
      </div>

      {/* MODAL: CREATE USER CREDENTIALSF */}
      <AnimatePresence>
        {isFormOpen && (
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-800 rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4"
            >
              <div className="flex justify-between items-center border-b border-slate-150/80 pb-3">
                <div>
                  <h3 className="font-bold text-base text-slate-800 dark:text-slate-100">
                    Tambah Kredensial Login Baru
                  </h3>
                  <p className="text-xs text-slate-450 font-medium">Konektivitas CRUD User langsung pada model Postgres.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="text-slate-450 hover:text-slate-650 font-bold text-xl"
                >
                  &times;
                </button>
              </div>

              {errorText && (
                <div className="p-2.5 bg-red-50 text-red-700 text-[11px] font-bold rounded-lg border border-red-100 flex items-center gap-1.5 animate-pulse">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>{errorText}</span>
                </div>
              )}

              <form onSubmit={handleCreateUser} className="space-y-3.5 text-xs">
                
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Username Akun *</label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Contoh: fajar_pratama"
                    className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 py-2 px-3 rounded-lg text-slate-805 dark:text-slate-200 font-semibold lowercase"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Nama Lengkap *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Contoh: Fajar Pratama"
                    className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 py-2 px-3 rounded-lg text-slate-805 dark:text-slate-200 font-semibold"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Nama Panggilan *</label>
                  <input
                    type="text"
                    required
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    placeholder="Contoh: Fajar"
                    className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 py-2 px-3 rounded-lg text-slate-805 dark:text-slate-200 font-semibold"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Password Default *</label>
                  <input
                    type="text"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Contoh: pass123"
                    className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 py-2 px-3 rounded-lg text-slate-805 dark:text-slate-200"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Hak Akses (Role Power)</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 py-2 px-3 rounded-lg text-slate-800 dark:text-slate-250 font-medium cursor-pointer"
                  >
                    {rolesList.filter(r => r.active || r.roleName === role).map(r => (
                      <option key={r.roleName} value={r.roleName}>
                        {r.roleName === "Administrator" ? "👑 " : "👤 "} {r.roleName}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Divisi Pengguna</label>
                  <select
                    value={divisi}
                    onChange={(e) => setDivisi(e.target.value)}
                    className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 py-2 px-3 rounded-lg text-slate-800 dark:text-slate-250 font-medium cursor-pointer"
                  >
                    <option value="">-- Pilih Divisi (Opsional) --</option>
                    {divisiList.filter(d => d.active).map(d => (
                      <option key={d.value} value={d.value}>
                        🏢 {d.value}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Site Tugas / Lokasi RS</label>
                  <select
                    value={siteTugas}
                    onChange={(e) => setSiteTugas(e.target.value)}
                    className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 py-2 px-3 rounded-lg text-slate-800 dark:text-slate-250 font-medium cursor-pointer"
                  >
                    <option value="">Pusat / Kantor Pusat</option>
                    {clientsList.map(cl => (
                      <option key={cl.id} value={cl.namaRS}>
                        🏢 {cl.namaRS}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2 py-1">
                  <input
                    type="checkbox"
                    id="statusAktif"
                    checked={statusAktif}
                    onChange={(e) => setStatusAktif(e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500 cursor-pointer"
                  />
                  <label htmlFor="statusAktif" className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide cursor-pointer">
                    Akun Status Aktif
                  </label>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsFormOpen(false)}
                    className="px-4 py-2 border border-slate-250 text-slate-505 dark:text-slate-400 text-xs font-semibold rounded-lg hover:bg-slate-50"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg hover:shadow-lg transition-all"
                  >
                    Setup Kredensial
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}

        {/* MODAL: EDIT USER (Nama Lengkap, Nama Panggilan, Role) */}
        {editUser && (
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-800 rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4"
            >
              <div className="flex justify-between items-center border-b border-slate-150/80 pb-3">
                <div>
                  <h3 className="font-bold text-base text-slate-800 dark:text-slate-100">
                    Edit Kredensial User
                  </h3>
                  <p className="text-xs text-slate-450 font-medium">Username unik @{editUser.username} bersifat permanen.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setEditUser(null)}
                  className="text-slate-450 hover:text-slate-650 font-bold text-xl"
                >
                  &times;
                </button>
              </div>

              <form onSubmit={handleEditSubmit} className="space-y-3.5 text-xs">
                
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Nama Lengkap *</label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Contoh: Fajar Pratama"
                    className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 py-2 px-3 rounded-lg text-slate-805 dark:text-slate-200 font-semibold"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Nama Panggilan *</label>
                  <input
                    type="text"
                    required
                    value={editNickname}
                    onChange={(e) => setEditNickname(e.target.value)}
                    placeholder="Contoh: Fajar"
                    className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 py-2 px-3 rounded-lg text-slate-805 dark:text-slate-200 font-semibold"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Hak Akses / Role (Power Level)</label>
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value)}
                    className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 py-2 px-3 rounded-lg text-slate-800 dark:text-slate-250 font-medium cursor-pointer"
                  >
                    {rolesList.filter(r => r.active || r.roleName === editRole).map(r => (
                      <option key={r.roleName} value={r.roleName}>
                        {r.roleName === "Administrator" ? "👑 " : "👤 "} {r.roleName}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Divisi Pengguna</label>
                  <select
                    value={editDivisi}
                    onChange={(e) => setEditDivisi(e.target.value)}
                    className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 py-2 px-3 rounded-lg text-slate-800 dark:text-slate-250 font-medium cursor-pointer"
                  >
                    <option value="">-- Pilih Divisi (Opsional) --</option>
                    {divisiList.filter(d => d.active || d.value === editDivisi).map(d => (
                      <option key={d.value} value={d.value}>
                        🏢 {d.value}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Site Tugas / Lokasi RS</label>
                  <select
                    value={editSiteTugas}
                    onChange={(e) => setEditSiteTugas(e.target.value)}
                    className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 py-2 px-3 rounded-lg text-slate-800 dark:text-slate-250 font-medium cursor-pointer"
                  >
                    <option value="">Pusat / Kantor Pusat</option>
                    {clientsList.map(cl => (
                      <option key={cl.id} value={cl.namaRS}>
                        🏢 {cl.namaRS}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2 py-1">
                  <input
                    type="checkbox"
                    id="editStatusAktif"
                    checked={editStatusAktif}
                    onChange={(e) => setEditStatusAktif(e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500 cursor-pointer"
                  />
                  <label htmlFor="editStatusAktif" className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide cursor-pointer">
                    Akun Status Aktif
                  </label>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setEditUser(null)}
                    className="px-4 py-2 border border-slate-250 text-slate-505 dark:text-slate-400 text-xs font-semibold rounded-lg hover:bg-slate-50"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg hover:shadow-lg transition-all"
                  >
                    Simpan Perubahan
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}

        {/* MODAL: RESET PASSWORD */}
        {resetPasswordUser && (
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-800 rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4"
            >
              <div className="flex justify-between items-center border-b border-slate-150/80 pb-3">
                <div>
                  <h3 className="font-bold text-base text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                    <Key className="w-4 h-4 text-amber-500" /> Reset Password User
                  </h3>
                  <p className="text-xs text-slate-450 font-medium">Reset password untuk user @{resetPasswordUser.username}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setResetPasswordUser(null)}
                  className="text-slate-450 hover:text-slate-650 font-bold text-xl"
                >
                  &times;
                </button>
              </div>

              {resetSuccessMessage ? (
                <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-700 font-semibold text-xs rounded-xl text-center space-y-1">
                  <p className="font-bold">Sukses!</p>
                  <p className="text-[11px] leading-relaxed">{resetSuccessMessage}</p>
                </div>
              ) : (
                <form onSubmit={handleResetPasswordSubmit} className="space-y-3.5 text-xs">
                  
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Sandi Baru *</label>
                    <input
                      type="text"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Masukkan kata sandi baru..."
                      className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 py-2 px-3 rounded-lg text-slate-805 dark:text-slate-250 font-semibold outline-none focus:border-amber-500"
                    />
                    <span className="text-[10px] text-slate-400 italic">User harus login ulang dengan sandi baru ini.</span>
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => setResetPasswordUser(null)}
                      className="px-4 py-2 border border-slate-250 text-slate-505 dark:text-slate-400 text-xs font-semibold rounded-lg hover:bg-slate-50"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg hover:shadow-lg transition-all"
                    >
                      Reset Kata Sandi
                    </button>
                  </div>

                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
