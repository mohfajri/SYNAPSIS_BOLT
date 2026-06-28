import React, { useState } from "react";
import { User, Client } from "../types";
import { Users, Trash2, UserPlus, Key, Eye, EyeOff, Pencil, Building2 } from "lucide-react";
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

  const [editUser, setEditUser] = useState<User | null>(null);
  const [editName, setEditName] = useState("");
  const [editNickname, setEditNickname] = useState("");
  const [editRole, setEditRole] = useState<string>("Technical Support");
  const [editSiteTugas, setEditSiteTugas] = useState("");
  const [editStatusAktif, setEditStatusAktif] = useState(true);
  const [editDivisi, setEditDivisi] = useState("");
  
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
    await onUpdateUser(resetPasswordUser.id, { password: newPassword.trim() });
    setResetSuccessMessage(`Sandi untuk @${resetPasswordUser.username} berhasil direset!`);
    setNewPassword("");
    setTimeout(() => {
      setResetSuccessMessage("");
      setResetPasswordUser(null);
    }, 2500);
  }

  function toggleReveal(userId: string) {
    setShowPasswordMap(p => ({ ...p, [userId]: !p[userId] }));
  }

  function getInitials(name: string) {
    return name.slice(0, 2).toUpperCase();
  }

  const getRoleStyleClass = (roleName: string) => {
    const styles: Record<string, string> = {
      Administrator: "bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200",
      'Site Coordinator': "bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200",
      'System Support': "bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200",
      'Technical Support': "bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200",
      'Assistant Technical Support': "bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200"
    };
    return styles[roleName] || "bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200";
  };

  return (
    <div className="space-y-5 fade-in pb-10">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-medium text-neutral-900 dark:text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-neutral-500" /> Manajemen Akun
          </h2>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
            Kelola kredensial login dan hak akses pengguna.
          </p>
        </div>
        
        {currentUser?.role === "Administrator" && (
          <button
            onClick={() => { setErrorText(""); setIsFormOpen(true); }}
            className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-neutral-900 text-sm font-medium rounded-lg flex items-center gap-2 transition-colors"
          >
            <UserPlus className="w-4 h-4" /> Tambah User
          </button>
        )}
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-50 dark:bg-neutral-950 border-b border-neutral-200 dark:border-neutral-800 text-neutral-500 font-medium text-xs">
              <tr>
                <th className="p-4">User</th>
                <th className="p-4">Username</th>
                <th className="p-4">Nama</th>
                <th className="p-4">Role</th>
                <th className="p-4">Divisi</th>
                <th className="p-4">Site</th>
                <th className="p-4">Status</th>
                <th className="p-4">Password</th>
                <th className="p-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/50">
              {users.map((u) => {
                const isYou = u.id === currentUser?.id;
                const revealed = !!showPasswordMap[u.id];

                return (
                  <tr key={u.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-semibold text-[11px] flex items-center justify-center shrink-0 overflow-hidden">
                          {u.photoUrl ? (
                            <img src={u.photoUrl} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            getInitials(u.nickname || u.username)
                          )}
                        </div>
                        {isYou && (
                          <span className="bg-emerald-50 text-emerald-600 text-[10px] font-medium px-1.5 py-0.5 rounded">
                            Anda
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-4 font-medium text-neutral-800 dark:text-neutral-200">
                      {u.username}
                    </td>
                    <td className="p-4 text-neutral-600 dark:text-neutral-400">
                      <div>{u.name || "—"}</div>
                      <div className="text-[11px] text-neutral-400 font-mono">{u.nickname || "—"}</div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-md text-[11px] font-medium ${getRoleStyleClass(u.role)}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="p-4 text-neutral-600 dark:text-neutral-400">
                      {u.divisi || <span className="text-neutral-400">—</span>}
                    </td>
                    <td className="p-4 text-neutral-600 dark:text-neutral-400">
                      {u.siteTugas ? (
                        <div className="flex items-center gap-1">
                          <Building2 className="w-3.5 h-3.5 text-neutral-400" />
                          <span>{u.siteTugas}</span>
                        </div>
                      ) : (
                        <span className="text-neutral-400">Pusat</span>
                      )}
                    </td>
                    <td className="p-4">
                      {u.statusAktif !== false ? (
                        <span className="bg-emerald-50 text-emerald-600 text-[11px] font-medium px-2 py-0.5 rounded-full">
                          Aktif
                        </span>
                      ) : (
                        <span className="bg-neutral-100 text-neutral-400 text-[11px] font-medium px-2 py-0.5 rounded-full">
                          Nonaktif
                        </span>
                      )}
                    </td>
                    <td className="p-4 font-mono text-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-neutral-500">{revealed ? u.password : "••••••"}</span>
                        <button onClick={() => toggleReveal(u.id)} className="p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors">
                          {revealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end items-center gap-1">
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
                          className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => { setResetPasswordUser(u); setNewPassword(""); }}
                          className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
                          title="Reset Password"
                        >
                          <Key className="w-3.5 h-3.5" />
                        </button>

                        {!isYou && (
                          <button
                            onClick={() => {
                              if (confirm(`Hapus user "${u.username}"?`)) {
                                onDeleteUser(u.id);
                              }
                            }}
                            className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors"
                            title="Hapus"
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

      {/* MODALS */}
      <AnimatePresence>
        {isFormOpen && (
          <div className="fixed inset-0 bg-neutral-950/50 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4"
            >
              <div className="flex justify-between items-center border-b border-neutral-100 dark:border-neutral-800 pb-3">
                <h3 className="font-medium text-base text-neutral-800 dark:text-white">Tambah User Baru</h3>
                <button type="button" onClick={() => setIsFormOpen(false)} className="text-neutral-400 hover:text-neutral-700 text-xl">&times;</button>
              </div>

              {errorText && (
                <div className="p-2.5 bg-red-50 text-red-600 text-xs font-medium rounded-lg border border-red-100 flex items-center gap-1.5">
                  <span>{errorText}</span>
                </div>
              )}

              <form onSubmit={handleCreateUser} className="space-y-3 text-xs">
                <div>
                  <label className="block text-[11px] font-medium text-neutral-500 mb-1">Username *</label>
                  <input type="text" required value={username} onChange={(e) => setUsername(e.target.value)} className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 py-2 px-3 rounded-lg text-neutral-800 dark:text-neutral-200 text-sm" />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-neutral-500 mb-1">Nama Lengkap *</label>
                  <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 py-2 px-3 rounded-lg text-neutral-800 dark:text-neutral-200 text-sm" />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-neutral-500 mb-1">Nama Panggilan *</label>
                  <input type="text" required value={nickname} onChange={(e) => setNickname(e.target.value)} className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 py-2 px-3 rounded-lg text-neutral-800 dark:text-neutral-200 text-sm" />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-neutral-500 mb-1">Password *</label>
                  <input type="text" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 py-2 px-3 rounded-lg text-neutral-800 dark:text-neutral-200 text-sm" />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-neutral-500 mb-1">Role</label>
                  <select value={role} onChange={(e) => setRole(e.target.value)} className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 py-2 px-3 rounded-lg text-neutral-800 dark:text-neutral-200 text-sm">
                    {rolesList.filter(r => r.active || r.roleName === role).map(r => (
                      <option key={r.roleName} value={r.roleName}>{r.roleName}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-neutral-500 mb-1">Divisi</label>
                  <select value={divisi} onChange={(e) => setDivisi(e.target.value)} className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 py-2 px-3 rounded-lg text-neutral-800 dark:text-neutral-200 text-sm">
                    <option value="">— Pilih Divisi —</option>
                    {divisiList.filter(d => d.active).map(d => (
                      <option key={d.value} value={d.value}>{d.value}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-neutral-500 mb-1">Site Tugas</label>
                  <select value={siteTugas} onChange={(e) => setSiteTugas(e.target.value)} className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 py-2 px-3 rounded-lg text-neutral-800 dark:text-neutral-200 text-sm">
                    <option value="">Kantor Pusat</option>
                    {clientsList.map(cl => (
                      <option key={cl.id} value={cl.namaRS}>{cl.namaRS}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-2 py-1">
                  <input type="checkbox" id="statusAktif" checked={statusAktif} onChange={(e) => setStatusAktif(e.target.checked)} className="w-4 h-4 rounded border-neutral-300" />
                  <label htmlFor="statusAktif" className="text-xs text-neutral-600 dark:text-neutral-400">Akun Aktif</label>
                </div>
                <div className="flex justify-end gap-2 pt-3 border-t border-neutral-100 dark:border-neutral-800">
                  <button type="button" onClick={() => setIsFormOpen(false)} className="px-4 py-2 border border-neutral-200 text-neutral-600 text-xs font-medium rounded-lg hover:bg-neutral-50 transition-colors">Batal</button>
                  <button type="submit" className="px-4 py-2 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-xs font-medium rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors">Simpan</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {editUser && (
          <div className="fixed inset-0 bg-neutral-950/50 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4"
            >
              <div className="flex justify-between items-center border-b border-neutral-100 dark:border-neutral-800 pb-3">
                <h3 className="font-medium text-base text-neutral-800 dark:text-white">Edit User</h3>
                <button type="button" onClick={() => setEditUser(null)} className="text-neutral-400 hover:text-neutral-700 text-xl">&times;</button>
              </div>

              <form onSubmit={handleEditSubmit} className="space-y-3 text-xs">
                <div>
                  <label className="block text-[11px] font-medium text-neutral-500 mb-1">Nama Lengkap *</label>
                  <input type="text" required value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 py-2 px-3 rounded-lg text-neutral-800 dark:text-neutral-200 text-sm" />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-neutral-500 mb-1">Nama Panggilan *</label>
                  <input type="text" required value={editNickname} onChange={(e) => setEditNickname(e.target.value)} className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 py-2 px-3 rounded-lg text-neutral-800 dark:text-neutral-200 text-sm" />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-neutral-500 mb-1">Role</label>
                  <select value={editRole} onChange={(e) => setEditRole(e.target.value)} className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 py-2 px-3 rounded-lg text-neutral-800 dark:text-neutral-200 text-sm">
                    {rolesList.filter(r => r.active || r.roleName === editRole).map(r => (
                      <option key={r.roleName} value={r.roleName}>{r.roleName}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-neutral-500 mb-1">Divisi</label>
                  <select value={editDivisi} onChange={(e) => setEditDivisi(e.target.value)} className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 py-2 px-3 rounded-lg text-neutral-800 dark:text-neutral-200 text-sm">
                    <option value="">— Pilih Divisi —</option>
                    {divisiList.filter(d => d.active || d.value === editDivisi).map(d => (
                      <option key={d.value} value={d.value}>{d.value}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-neutral-500 mb-1">Site Tugas</label>
                  <select value={editSiteTugas} onChange={(e) => setEditSiteTugas(e.target.value)} className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 py-2 px-3 rounded-lg text-neutral-800 dark:text-neutral-200 text-sm">
                    <option value="">Kantor Pusat</option>
                    {clientsList.map(cl => (
                      <option key={cl.id} value={cl.namaRS}>{cl.namaRS}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-2 py-1">
                  <input type="checkbox" id="editStatusAktif" checked={editStatusAktif} onChange={(e) => setEditStatusAktif(e.target.checked)} className="w-4 h-4 rounded border-neutral-300" />
                  <label htmlFor="editStatusAktif" className="text-xs text-neutral-600 dark:text-neutral-400">Akun Aktif</label>
                </div>
                <div className="flex justify-end gap-2 pt-3 border-t border-neutral-100 dark:border-neutral-800">
                  <button type="button" onClick={() => setEditUser(null)} className="px-4 py-2 border border-neutral-200 text-neutral-600 text-xs font-medium rounded-lg hover:bg-neutral-50 transition-colors">Batal</button>
                  <button type="submit" className="px-4 py-2 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-xs font-medium rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors">Simpan</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {resetPasswordUser && (
          <div className="fixed inset-0 bg-neutral-950/50 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4"
            >
              <div className="flex justify-between items-center border-b border-neutral-100 dark:border-neutral-800 pb-3">
                <h3 className="font-medium text-base text-neutral-800 dark:text-white">Reset Password</h3>
                <button type="button" onClick={() => setResetPasswordUser(null)} className="text-neutral-400 hover:text-neutral-700 text-xl">&times;</button>
              </div>

              {resetSuccessMessage ? (
                <div className="p-3 bg-emerald-50 text-emerald-600 text-sm rounded-xl text-center">
                  <p className="font-medium">{resetSuccessMessage}</p>
                </div>
              ) : (
                <form onSubmit={handleResetPasswordSubmit} className="space-y-3 text-xs">
                  <div>
                    <label className="block text-[11px] font-medium text-neutral-500 mb-1">Sandi Baru *</label>
                    <input type="text" required value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Password baru..." className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 py-2 px-3 rounded-lg text-neutral-800 dark:text-neutral-200 text-sm outline-none focus:border-neutral-400" />
                  </div>
                  <div className="flex justify-end gap-2 pt-3 border-t border-neutral-100 dark:border-neutral-800">
                    <button type="button" onClick={() => setResetPasswordUser(null)} className="px-4 py-2 border border-neutral-200 text-neutral-600 text-xs font-medium rounded-lg hover:bg-neutral-50 transition-colors">Batal</button>
                    <button type="submit" className="px-4 py-2 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-xs font-medium rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors">Reset</button>
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
