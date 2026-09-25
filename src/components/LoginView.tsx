import React, { useState } from "react";
import { api, saveSession } from "../lib/api";
import { User } from "../types";
import { ArrowRight, Mail, UserPlus, Lock, CircleCheck as CheckCircle2, CircleAlert as AlertCircle, Network, Sparkles, ShieldCheck, TrendingUp } from "lucide-react";
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
      setPassword("");
    } catch (err: any) {
      setError(err.message || "Gagal membuat user baru.");
    } finally {
      setLoading(false);
    }
  }

  const inputClass = "w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-4 text-[14px] text-slate-900 dark:text-white focus:outline-none focus:border-teal-500 dark:focus:border-teal-400 focus:ring-2 focus:ring-teal-500/10 transition-all";

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950">
      {/* Left hero panel — hidden on mobile */}
      <div className="hidden lg:flex lg:w-[45%] xl:w-[50%] gradient-teal relative overflow-hidden flex-col justify-between p-12 text-white">
        {/* Decorative orbs */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3 blur-2xl" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-white/5 rounded-full translate-y-1/3 -translate-x-1/4 blur-2xl" />
        <div className="absolute top-1/3 left-1/2 w-64 h-64 bg-amber-400/10 rounded-full blur-3xl" />

        {/* Brand */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 bg-white/15 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/20">
            <Network className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight">Synapsis</h1>
            <p className="text-[11px] text-teal-100/80 font-medium tracking-wide">Enterprise Management System</p>
          </div>
        </div>

        {/* Hero content */}
        <div className="relative z-10 space-y-8 max-w-md">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-full border border-white/15 mb-6">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span className="text-[12px] font-medium text-teal-50">Project Management Platform</span>
            </div>
            <h2 className="text-3xl xl:text-4xl font-bold tracking-tight leading-tight">
              Kelola proyek, tugas, dan tim dalam satu ruang kerja terpadu.
            </h2>
            <p className="text-teal-100/70 text-[15px] mt-4 leading-relaxed">
              Pantau progres secara real-time, berkolaborasi dengan tim teknis, dan pastikan setiap milestone terselesaikan tepat waktu.
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-white/10 rounded-lg flex items-center justify-center border border-white/15">
                <TrendingUp className="w-4 h-4 text-teal-100" />
              </div>
              <span className="text-[14px] text-teal-50/90">Dashboard analitik & visualisasi progres</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-white/10 rounded-lg flex items-center justify-center border border-white/15">
                <ShieldCheck className="w-4 h-4 text-teal-100" />
              </div>
              <span className="text-[14px] text-teal-50/90">Manajemen peran & akses berlapis</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-white/10 rounded-lg flex items-center justify-center border border-white/15">
                <Network className="w-4 h-4 text-teal-100" />
              </div>
              <span className="text-[14px] text-teal-50/90">Kolaborasi lintas site & dokumentasi terpusat</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 text-[12px] text-teal-200/50">
          Synapsis Enterprise Portal v2.0
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-sm relative z-10">
          {/* Mobile brand */}
          <div className="lg:hidden text-center mb-8">
            <div className="w-11 h-11 bg-teal-600 rounded-xl mx-auto flex items-center justify-center mb-3">
              <Network className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-lg font-semibold text-slate-900 dark:text-white tracking-tight">Synapsis</h1>
            <p className="text-[12px] text-slate-400 mt-0.5">Enterprise Management System</p>
          </div>

          {/* Heading */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              {isRegister ? "Buat Akun" : "Selamat Datang"}
            </h2>
            <p className="text-[14px] text-slate-500 dark:text-slate-400 mt-1.5">
              {isRegister ? "Daftar untuk mulai mengelola proyek Anda." : "Masuk untuk melanjutkan ke ruang kerja Anda."}
            </p>
          </div>

          {/* Card */}
          <motion.div layout className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">

            {/* Feedback */}
            <AnimatePresence mode="popLayout">
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="mb-4 p-3 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400 rounded-xl text-[13px] flex items-start gap-2"
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
                  className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl text-[13px] flex items-start gap-2"
                >
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{success}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={isRegister ? handleRegister : handleLogin} className="space-y-4">
              {isRegister && (
                <div>
                  <label className="block text-[12px] font-medium text-slate-600 dark:text-slate-400 mb-1.5">Nama Lengkap</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={inputClass}
                    placeholder="Nama lengkap Anda"
                  />
                </div>
              )}

              <div>
                <label className="block text-[12px] font-medium text-slate-600 dark:text-slate-400 mb-1.5">Username</label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className={inputClass}
                  placeholder="username"
                />
              </div>

              {isRegister && (
                <div>
                  <label className="block text-[12px] font-medium text-slate-600 dark:text-slate-400 mb-1.5">Email</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={inputClass}
                    placeholder="nama@perusahaan.com"
                  />
                </div>
              )}

              <div>
                <label className="block text-[12px] font-medium text-slate-600 dark:text-slate-400 mb-1.5">Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={inputClass}
                  placeholder="••••••••"
                />
              </div>

              {isRegister && (
                <div>
                  <label className="block text-[12px] font-medium text-slate-600 dark:text-slate-400 mb-1.5">Role</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as any)}
                    className={inputClass}
                  >
                    <option value="Administrator">Administrator</option>
                    <option value="Direktur">Direktur</option>
                    <option value="Manager">Manager</option>
                    <option value="Site Coordinator">Site Coordinator</option>
                    <option value="Staff">Staff</option>
                    <option value="System Support">System Support</option>
                    <option value="Technical Support">Technical Support</option>
                    <option value="Assistant Technical Support">Assistant Technical Support</option>
                  </select>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-teal-600 hover:bg-teal-700 text-white rounded-xl py-3 text-[14px] font-semibold transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
              >
                {loading ? (
                  <span>Memproses...</span>
                ) : isRegister ? (
                  <>
                    <UserPlus className="w-4 h-4" /> Daftar
                  </>
                ) : (
                  <>
                    Masuk <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-5 pt-5 border-t border-slate-100 dark:border-slate-800 text-center">
              <button
                onClick={() => {
                  setIsRegister(!isRegister);
                  setError(null);
                  setSuccess(null);
                }}
                className="text-[13px] text-slate-500 hover:text-teal-600 dark:text-slate-400 dark:hover:text-teal-400 font-medium transition-colors"
              >
                {isRegister ? "Sudah punya akun? Masuk" : "Belum punya akun? Buat akun"}
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
