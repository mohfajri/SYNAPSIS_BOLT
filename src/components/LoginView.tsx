import React, { useState } from "react";
import { api, saveSession } from "../lib/api";
import { User } from "../types";
import { Shield, KeyRound, Mail, UserPlus, Fingerprint, Lock, CheckCircle2, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface LoginViewProps {
  onLoginSuccess: (user: User) => void;
}

export default function LoginView({ onLoginSuccess }: LoginViewProps) {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<'Administrator' | 'Site Coordinator' | 'System Support' | 'Technical Support' | 'Assistant Technical Support'>("Technical Support");
  
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await api.login(username, password);
      saveSession(res.token, res.user);
      onLoginSuccess(res.user);
    } catch (err: any) {
      setError(err.message || "Gagal masuk. Periksa kembali kredensial Anda.");
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      await api.register({
        username,
        name,
        nickname: name.split(" ")[0] || username,
        password,
        email,
        role
      });
      setSuccess("Pendaftaran user berhasil! Silakan masuk dengan kredensial baru Anda.");
      setIsRegister(false);
      // Reset input fields except username
      setPassword("");
    } catch (err: any) {
      setError(err.message || "Gagal membuat user baru.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      {/* Dynamic Background Effect */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(59,130,246,0.08),transparent_50%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(99,102,241,0.08),transparent_50%)] pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Title Brand */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-blue-600 rounded-xl mx-auto flex items-center justify-center font-bold text-white shadow-lg shadow-blue-500/20 mb-3">
            <Shield className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">SYNAPSIS</h1>
          <p className="text-[10px] text-blue-400 font-black tracking-widest uppercase mt-1 leading-normal max-w-sm mx-auto">System for Networked Analytics, Project Synchronization & Integrated Services</p>
        </div>

        {/* Card Body */}
        <motion.div 
          layout 
          className="bg-slate-950/80 backdrop-blur-md rounded-2xl border border-slate-800 p-8 shadow-2xl shadow-black/40"
        >
          <div className="flex justify-between items-center mb-6 border-b border-slate-800/60 pb-4">
            <h2 className="text-lg font-bold text-slate-200">
              {isRegister ? "Registrasi Akun Baru" : "Masuk Sistem"}
            </h2>
            <button
              onClick={() => {
                setIsRegister(!isRegister);
                setError(null);
                setSuccess(null);
              }}
              className="text-xs text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1 transition-colors"
            >
              {isRegister ? (
                <>
                  <KeyRound className="w-3.5 h-3.5" /> Sudah punya akun?
                </>
              ) : (
                <>
                  <UserPlus className="w-3.5 h-3.5" /> Buat akun baru
                </>
              )}
            </button>
          </div>

          {/* Feedback banners */}
          <AnimatePresence mode="popLayout">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="mb-4 p-3 bg-red-950/40 border border-red-900/40 text-red-400 rounded-lg text-xs font-semibold flex items-start gap-2"
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </motion.div>
            )}

            {success && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="mb-4 p-3 bg-green-950/40 border border-green-900/40 text-green-400 rounded-lg text-xs font-semibold flex items-start gap-2"
              >
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{success}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={isRegister ? handleRegister : handleLogin} className="space-y-4">
            {/* Full Name (For Register) */}
            {isRegister && (
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Nama Lengkap</label>
                <div className="relative">
                  <Fingerprint className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg py-2 pl-9 pr-4 text-sm text-slate-250 focus:outline-none focus:border-blue-500 text-white"
                    placeholder="e.g. Fajri Fanani"
                  />
                </div>
              </div>
            )}

            {/* Username */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Username</label>
              <div className="relative">
                <Shield className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg py-2 pl-9 pr-4 text-sm text-slate-250 focus:outline-none focus:border-blue-500 text-white"
                  placeholder="Username Anda"
                />
              </div>
            </div>

            {/* Email (For Register) */}
            {isRegister && (
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Alamat Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg py-2 pl-9 pr-4 text-sm text-slate-250 focus:outline-none focus:border-blue-500 text-white"
                    placeholder="nama@perusahaan.com"
                  />
                </div>
              </div>
            )}

            {/* Password */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg py-2 pl-9 pr-4 text-sm text-slate-250 focus:outline-none focus:border-blue-500 text-white"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {/* Role (For Register) */}
            {isRegister && (
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Wewenang / Hak Akses</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as any)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg py-2 px-3 text-sm text-slate-300 focus:outline-none focus:border-blue-500"
                >
                  <option value="Administrator">Administrator (Main Control)</option>
                  <option value="Direktur">Direktur (Managerial Utama)</option>
                  <option value="Manager">Manager (Supervisory Hub)</option>
                  <option value="Supervisor">Supervisor (tim Teknis Lapangan)</option>
                  <option value="Staff">Staff (Pelaksana Teknis)</option>
                  <option value="Site Coordinator">Site Coordinator</option>
                  <option value="System Support">System Support</option>
                  <option value="Technical Support">Technical Support</option>
                  <option value="Assistant Technical Support">Assistant Technical Support</option>
                </select>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2.5 text-sm font-bold shadow-lg shadow-blue-500/10 hover:shadow-blue-500/20 transition-all font-sans flex items-center justify-center gap-2 mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span>Memproses...</span>
              ) : isRegister ? (
                <>
                  <UserPlus className="w-4 h-4" /> Daftar Akun Baru
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" /> Masuk ke Panel
                </>
              )}
            </button>
          </form>


        </motion.div>
      </div>
    </div>
  );
}
