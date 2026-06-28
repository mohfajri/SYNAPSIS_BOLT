import React, { useState } from "react";
import { api, saveSession } from "../lib/api";
import { User } from "../types";
import { ArrowRight, Mail, UserPlus, Lock, CircleCheck as CheckCircle2, CircleAlert as AlertCircle } from "lucide-react";
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

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm relative z-10">
        {/* Brand */}
        <div className="text-center mb-10">
          <div className="w-10 h-10 bg-neutral-900 dark:bg-white rounded-xl mx-auto flex items-center justify-center mb-4">
            <svg className="w-5 h-5 text-white dark:text-neutral-900" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M12 1v6m0 6v6m4.22-10.22l4.24-4.24M6.34 6.34L2.1 2.1m17.8 17.8l-4.24-4.24M6.34 17.66l-4.24 4.24M23 12h-6m-6 0H1m20.07-4.93l-4.24 4.24M6.34 6.34l-4.24-4.24" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-neutral-900 dark:text-white tracking-tight">Synapsis</h1>
          <p className="text-[13px] text-neutral-400 mt-1 font-normal">Enterprise Management System</p>
        </div>

        {/* Card */}
        <motion.div layout className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-base font-medium text-neutral-800 dark:text-neutral-200">
              {isRegister ? "Buat Akun" : "Masuk"}
            </h2>
            <button
              onClick={() => {
                setIsRegister(!isRegister);
                setError(null);
                setSuccess(null);
              }}
              className="text-[13px] text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white font-medium transition-colors"
            >
              {isRegister ? "Sudah punya akun?" : "Buat akun"}
            </button>
          </div>

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
                className="mb-4 p-3 bg-green-50 dark:bg-green-950/20 border border-green-100 dark:border-green-900/30 text-green-600 dark:text-green-400 rounded-xl text-[13px] flex items-start gap-2"
              >
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{success}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={isRegister ? handleRegister : handleLogin} className="space-y-4">
            {isRegister && (
              <div>
                <label className="block text-[12px] font-medium text-neutral-500 dark:text-neutral-400 mb-1.5">Nama Lengkap</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl py-2.5 px-4 text-[14px] text-neutral-900 dark:text-white focus:outline-none focus:border-neutral-400 dark:focus:border-neutral-600 transition-colors"
                  placeholder="Nama lengkap Anda"
                />
              </div>
            )}

            <div>
              <label className="block text-[12px] font-medium text-neutral-500 dark:text-neutral-400 mb-1.5">Username</label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl py-2.5 px-4 text-[14px] text-neutral-900 dark:text-white focus:outline-none focus:border-neutral-400 dark:focus:border-neutral-600 transition-colors"
                placeholder="username"
              />
            </div>

            {isRegister && (
              <div>
                <label className="block text-[12px] font-medium text-neutral-500 dark:text-neutral-400 mb-1.5">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl py-2.5 px-4 text-[14px] text-neutral-900 dark:text-white focus:outline-none focus:border-neutral-400 dark:focus:border-neutral-600 transition-colors"
                  placeholder="nama@perusahaan.com"
                />
              </div>
            )}

            <div>
              <label className="block text-[12px] font-medium text-neutral-500 dark:text-neutral-400 mb-1.5">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl py-2.5 px-4 text-[14px] text-neutral-900 dark:text-white focus:outline-none focus:border-neutral-400 dark:focus:border-neutral-600 transition-colors"
                placeholder="••••••••"
              />
            </div>

            {isRegister && (
              <div>
                <label className="block text-[12px] font-medium text-neutral-500 dark:text-neutral-400 mb-1.5">Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as any)}
                  className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl py-2.5 px-4 text-[14px] text-neutral-700 dark:text-neutral-300 focus:outline-none focus:border-neutral-400 dark:focus:border-neutral-600 transition-colors"
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
              className="w-full bg-neutral-900 dark:bg-white hover:bg-neutral-800 dark:hover:bg-neutral-100 text-white dark:text-neutral-900 rounded-xl py-3 text-[14px] font-medium transition-colors flex items-center justify-center gap-2 mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
        </motion.div>

        <p className="text-center text-[12px] text-neutral-400 mt-6">
          Synapsis Enterprise Portal v2.0
        </p>
      </div>
    </div>
  );
}
