import React, { useState } from "react";
import { CommLog, MeetingLog, Documentation, Project, User } from "../types";
import { 
  MessageSquare, 
  Users, 
  Files, 
  Plus, 
  Trash2, 
  Mail, 
  PhoneCall, 
  Calendar, 
  FolderLock, 
  Link2, 
  Clock, 
  FileSpreadsheet, 
  CheckCircle2, 
  BookOpen,
  X 
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface CollaborationViewsProps {
  commLogs: CommLog[];
  meetingLogs: MeetingLog[];
  docs: Documentation[];
  projects: Project[];
  currentUser: User | null;
  onAddCommLog: (data: Partial<CommLog>) => Promise<void>;
  onDeleteCommLog: (id: string) => Promise<void>;
  onAddMeetingLog: (data: Partial<MeetingLog>) => Promise<void>;
  onDeleteMeetingLog: (id: string) => Promise<void>;
  onAddDoc: (data: Partial<Documentation>) => Promise<void>;
  onDeleteDoc: (id: string) => Promise<void>;
}

export default function CollaborationViews({
  commLogs,
  meetingLogs,
  docs,
  projects,
  currentUser,
  onAddCommLog,
  onDeleteCommLog,
  onAddMeetingLog,
  onDeleteMeetingLog,
  onAddDoc,
  onDeleteDoc
}: CollaborationViewsProps) {
  
  const [activeSubTab, setActiveSubTab] = useState<'comm' | 'mom' | 'docs'>('comm');
  const [filterProject, setFilterProject] = useState("");

  // Modal control triggers
  const [isFormOpen, setIsFormOpen] = useState(false);

  // ── COMM FORM STATES ──
  const [commType, setCommType] = useState<'Email' | 'WhatsApp' | 'Rapat' | 'Telepon'>("Email");
  const [commProj, setCommProj] = useState("");
  const [commDate, setCommDate] = useState("");
  const [commParts, setCommParts] = useState("");
  const [commSummary, setCommSummary] = useState("");
  const [commDetail, setCommDetail] = useState("");

  // ── MOM FORM STATES ──
  const [momTitle, setMomTitle] = useState("");
  const [momProj, setMomProj] = useState("");
  const [momDate, setMomDate] = useState("");
  const [momAttendees, setMomAttendees] = useState("");
  const [momAgenda, setMomAgenda] = useState("");
  const [momDecisions, setMomDecisions] = useState("");
  const [momActions, setMomActions] = useState("");

  // ── DOCS FORM STATES ──
  const [docTitle, setDocTitle] = useState("");
  const [docProj, setDocProj] = useState("");
  const [docCat, setDocCat] = useState<'API Specs' | 'User Manual' | 'Desain' | 'Kontrak' | 'Lainnya'>("API Specs");
  const [docUrl, setDocUrl] = useState("");
  const [docDesc, setDocDesc] = useState("");
  const [docDate, setDocDate] = useState("");

  // Filter processes
  const filteredComm = commLogs.filter(c => !filterProject || c.project === filterProject);
  const filteredMeet = meetingLogs.filter(m => !filterProject || m.project === filterProject);
  const filteredDocs = docs.filter(d => !filterProject || d.project === filterProject);

  const todayStr = new Date().toISOString().slice(0, 10);

  function handleOpenForm() {
    setCommProj(projects[0]?.kode || "");
    setCommDate(todayStr);
    setCommParts("");
    setCommSummary("");
    setCommDetail("");

    setMomTitle("");
    setMomProj(projects[0]?.kode || "");
    setMomDate(todayStr);
    setMomAttendees("");
    setMomAgenda("");
    setMomDecisions("");
    setMomActions("");

    setDocTitle("");
    setDocProj(projects[0]?.kode || "");
    setDocCat("API Specs");
    setDocUrl("");
    setDocDesc("");
    setDocDate(todayStr);

    setIsFormOpen(true);
  }

  async function handleAddCommSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!commParts.trim() || !commSummary.trim() || !commDetail.trim()) return;

    await onAddCommLog({
      project: commProj,
      type: commType,
      date: commDate,
      participants: commParts,
      summary: commSummary,
      detail: commDetail
    });
    setIsFormOpen(false);
  }

  async function handleAddMomSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!momTitle.trim() || !momAttendees.trim() || !momAgenda.trim() || !momDecisions.trim()) return;

    await onAddMeetingLog({
      project: momProj,
      date: momDate,
      title: momTitle,
      attendees: momAttendees,
      agenda: momAgenda,
      decisions: momDecisions,
      actions: momActions
    });
    setIsFormOpen(false);
  }

  async function handleAddDocSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!docTitle.trim() || !docUrl.trim()) return;

    await onAddDoc({
      project: docProj,
      category: docCat,
      title: docTitle,
      url: docUrl,
      desc: docDesc,
      date: docDate
    });
    setIsFormOpen(false);
  }

  return (
    <div className="space-y-6 fade-in font-sans pb-10">
      
      {/* Sub menu controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-2">
        
        {/* Sub controllers */}
        <div className="flex gap-1 bg-slate-100 dark:bg-slate-950 p-1 border border-slate-200 dark:border-slate-800 rounded-lg text-xs">
          <button
            onClick={() => { setActiveSubTab('comm'); }}
            className={`px-3.5 py-1.5 rounded-md font-bold transition-all flex items-center gap-1.5 ${activeSubTab === 'comm' ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 font-extrabold shadow-sm' : 'text-slate-500 hover:text-slate-200'}`}
          >
            <MessageSquare className="w-4 h-4" /> Log WhatsApp/Email
          </button>
          
          <button
            onClick={() => { setActiveSubTab('mom'); }}
            className={`px-3.5 py-1.5 rounded-md font-bold transition-all flex items-center gap-1.5 ${activeSubTab === 'mom' ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 font-extrabold shadow-sm' : 'text-slate-500 hover:text-slate-200'}`}
          >
            <Users className="w-4 h-4" /> Minutes of Meeting (MoM)
          </button>
          
          <button
            onClick={() => { setActiveSubTab('docs'); }}
            className={`px-3.5 py-1.5 rounded-md font-bold transition-all flex items-center gap-1.5 ${activeSubTab === 'docs' ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 font-extrabold shadow-sm' : 'text-slate-500 hover:text-slate-200'}`}
          >
            <Files className="w-4 h-4" /> Repositori Dokumen
          </button>
        </div>

        {/* Filters and trigger combo */}
        <div className="flex items-center gap-2">
          
          <select
            value={filterProject}
            onChange={(e) => setFilterProject(e.target.value)}
            className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs py-1.5 px-3 rounded-lg text-slate-700 dark:text-slate-300 focus:outline-none shadow-xs"
          >
            <option value="">Semua Project</option>
            {projects.map(p => <option key={p.kode} value={p.kode}>{p.kode} – {p.nama}</option>)}
          </select>

          {currentUser?.role !== "Client" && (
            <button
              onClick={handleOpenForm}
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1 shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" /> {activeSubTab === 'comm' ? "Catat Korelasi" : activeSubTab === 'mom' ? "Tulis MoM" : "Tambah Dokumen"}
            </button>
          )}

        </div>
      </div>

      {/* RENDER ACTIVE TAB WORKSPACE */}
      <div className="space-y-4">
        
        {/* TAB 1: COMMUNICATION LOGS */}
        {activeSubTab === 'comm' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredComm.length === 0 ? (
              <div className="col-span-2 text-center py-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
                <MessageSquare className="w-10 h-10 text-slate-300 mx-auto mb-2 opacity-45" />
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Belum ada log korespondensi</p>
                <p className="text-xs text-slate-400">Pilah project lain atau catat pertukaran chat WA maupun info surat Email Anda.</p>
              </div>
            ) : (
              filteredComm.map((c) => {
                const isEmail = c.type === "Email";
                const isWA = c.type === "WhatsApp";
                const iconStyle = isEmail ? "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400" : isWA ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400" : "bg-blue-105 text-blue-700";

                return (
                  <div 
                    key={c.id} 
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 hover:border-blue-500/25 transition-all flex flex-col justify-between space-y-3"
                  >
                    <div>
                      <div className="flex justify-between items-start gap-3">
                        <div className="flex items-center gap-2">
                          <span className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${iconStyle}`}>
                            {isEmail ? <Mail className="w-4 h-4" /> : isWA ? <MessageSquare className="w-4 h-4" /> : <PhoneCall className="w-4 h-4" />}
                          </span>
                          <div>
                            <span className="bg-blue-50 dark:bg-blue-950 border border-blue-100 dark:border-blue-900/30 text-blue-600 dark:text-blue-450 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded">
                              {c.project}
                            </span>
                            <span className="text-slate-400 dark:text-slate-500 text-[9px] font-bold font-mono ml-2">
                              {new Date(c.date).toLocaleDateString("id-ID")}
                            </span>
                          </div>
                        </div>

                        {currentUser?.role === "Administrator" && (
                          <button
                            onClick={() => {
                              if (confirm("Hapus log korespondensi ini?")) onDeleteCommLog(c.id);
                            }}
                            className="text-slate-400 hover:text-red-500"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      <h5 className="text-sm font-black text-slate-800 dark:text-slate-100 mt-2 tracking-tight">
                        {c.summary}
                      </h5>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-semibold">
                        Grup PIC: {c.participants}
                      </p>
                      <p className="text-xs text-slate-650 dark:text-slate-300 mt-2 leading-relaxed whitespace-pre-wrap">
                        {c.detail}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* TAB 2: MINUTES OF MEETING (MoM) */}
        {activeSubTab === 'mom' && (
          <div className="space-y-4">
            {filteredMeet.length === 0 ? (
              <div className="text-center py-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
                <Users className="w-10 h-10 text-slate-300 mx-auto mb-2 opacity-45" />
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Belum ada notula rapat (MoM) terarsip</p>
                <p className="text-xs text-slate-400">Catat simpulan keputusan rapat bersama dinas atau RS untuk menjaga prasyarat baseline.</p>
              </div>
            ) : (
              filteredMeet.map((m) => (
                <div 
                  key={m.id} 
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 hover:border-blue-500/25 transition-all space-y-4"
                >
                  <div className="flex justify-between items-start gap-4 border-b border-slate-100 dark:border-slate-800/80 pb-3">
                    <div>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono font-bold">
                        <span className="bg-blue-50 dark:bg-blue-950 border border-blue-101 dark:border-blue-900/40 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded">
                          {m.project}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" /> Rapat: {new Date(m.date).toLocaleDateString("id-ID", { year: "numeric", month: "long", day: "numeric" })}
                        </span>
                      </div>
                      <h4 className="text-base font-black text-slate-800 dark:text-slate-100 mt-2 tracking-tight">
                        {m.title}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-semibold">
                        Peserta Rapat: {m.attendees}
                      </p>
                    </div>

                    {currentUser?.role === "Administrator" && (
                      <button
                        onClick={() => {
                          if (confirm("Hapus arsip MoM rapat ini dari server?")) onDeleteMeetingLog(m.id);
                        }}
                        className="text-slate-400 hover:text-red-500 shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                    
                    <div className="bg-slate-50 dark:bg-slate-950/40 p-3.5 rounded-xl space-y-1">
                      <p className="font-extrabold text-[10px] text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                        <BookOpen className="w-4 h-4 text-indigo-500" /> Agenda Pembahasan
                      </p>
                      <p className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">{m.agenda}</p>
                    </div>

                    <div className="bg-emerald-50/40 dark:bg-emerald-950/10 border border-emerald-100/50 dark:border-emerald-900/30 p-3.5 rounded-xl space-y-1">
                      <p className="font-extrabold text-[10px] text-emerald-700 dark:text-emerald-500 uppercase tracking-wider flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" /> Simpulan & Keputusan
                      </p>
                      <p className="text-slate-705 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">{m.decisions}</p>
                    </div>

                    <div className="bg-blue-50/40 dark:bg-blue-950/10 border border-blue-101/60 dark:border-blue-900/30 p-3.5 rounded-xl space-y-1">
                      <p className="font-extrabold text-[10px] text-blue-700 dark:text-blue-550 uppercase tracking-wider flex items-center gap-1.5">
                        <FileSpreadsheet className="w-4 h-4" /> Tindakan Lanjutan
                      </p>
                      <p className="text-slate-705 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">{m.actions}</p>
                    </div>
                  </div>

                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 3: DOCUMENTATION LINKS */}
        {activeSubTab === 'docs' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredDocs.length === 0 ? (
              <div className="col-span-2 text-center py-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
                <Files className="w-10 h-10 text-slate-300 mx-auto mb-2 opacity-45" />
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Belum ada dokumen/API Specs disimpan</p>
                <p className="text-xs text-slate-400">Hubungkan file panduan integrasi, figma mockup, atau manual book di sini.</p>
              </div>
            ) : (
              filteredDocs.map((d) => (
                <div 
                  key={d.id} 
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 hover:border-blue-500/25 transition-all flex flex-col justify-between space-y-4"
                >
                  <div>
                    <div className="flex justify-between items-start gap-3">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="bg-blue-50 dark:bg-blue-950 border border-blue-100 dark:border-blue-900/30 text-blue-600 dark:text-blue-450 text-[9px] font-mono font-bold px-2 py-0.5 rounded">
                          {d.project}
                        </span>
                        <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-[9px] font-bold text-slate-650 dark:text-slate-350">
                          {d.category}
                        </span>
                      </div>

                      {currentUser?.role === "Administrator" && (
                        <button
                          onClick={() => {
                            if (confirm("Hapus tautan dokumen ini?")) onDeleteDoc(d.id);
                          }}
                          className="text-slate-400 hover:text-red-500"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <h5 className="text-sm font-black text-slate-850 dark:text-slate-100 mt-2.5 tracking-tight">
                      {d.title}
                    </h5>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 pb-1">
                      Diarsipkan: {d.date ? new Date(d.date).toLocaleDateString("id-ID") : "—"}
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 lines-2-clamp">
                      {d.desc || "Tidak ada rincian keterangan tambahan."}
                    </p>
                  </div>

                  <div>
                    <a 
                      href={d.url} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-750 dark:text-blue-400 font-extrabold hover:underline"
                    >
                      <Link2 className="w-3.5 h-3.5" /> Buka Berkas Tautan Eksternal &rarr;
                    </a>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

      </div>

      {/* MODAL: INTEGRATED COLLABORATIVE FORM CREATOR */}
      <AnimatePresence>
        {isFormOpen && (
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-800 rounded-2xl shadow-xl w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center border-b border-slate-150/80 pb-3">
                <div>
                  <h3 className="font-bold text-base text-slate-800 dark:text-slate-200">
                    {activeSubTab === 'comm' ? "Buat Log Korespondensi" : activeSubTab === 'mom' ? "Tulis Arsip Notula Rapat (MoM)" : "Arsipkan Tautan Dokumen Baru"}
                  </h3>
                  <p className="text-xs text-slate-450 font-medium">Data akan langsung tersimpan & sinkron dengan server.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="text-slate-400 hover:text-slate-650 text-xl font-bold"
                >
                  &times;
                </button>
              </div>

              {/* ─ RENDER FORM: COMMUNICATION LOG ─ */}
              {activeSubTab === 'comm' && (
                <form onSubmit={commLogs ? handleAddCommSubmit : undefined} className="space-y-3.5 text-xs">
                  <div className="grid grid-cols-2 gap-3.5">
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Tipe Media</label>
                      <select
                        value={commType}
                        onChange={(e) => setCommType(e.target.value as any)}
                        className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 py-2 px-3 rounded-lg"
                      >
                        <option value="WhatsApp">💬 WhatsApp Chat</option>
                        <option value="Email">✉️ Surat Elektronik (Email)</option>
                        <option value="Rapat">🤝 Diskusi Rapat Tatap Muka</option>
                        <option value="Telepon">📞 Telepon Langsung</option>
                      </select>
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Project</label>
                      <select
                        value={commProj}
                        onChange={(e) => setCommProj(e.target.value)}
                        className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 py-2 px-3 rounded-lg"
                      >
                        {projects.map(p => <option key={p.kode} value={p.kode}>{p.kode} – {p.nama}</option>)}
                      </select>
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Tanggal Komunikasi</label>
                      <input
                        type="date"
                        required
                        value={commDate}
                        onChange={(e) => setCommDate(e.target.value)}
                        className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 py-2 px-3 rounded-lg text-slate-800 dark:text-slate-200"
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Peserta / PIC Terkait *</label>
                      <input
                        type="text"
                        required
                        value={commParts}
                        onChange={(e) => setCommParts(e.target.value)}
                        placeholder="Contoh: Fajar (Lead) <-> RS IT Team"
                        className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 py-2 px-3 rounded-lg text-slate-805 dark:text-slate-200"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Pokok Ringkasan *</label>
                    <input
                      type="text"
                      required
                      value={commSummary}
                      onChange={(e) => setCommSummary(e.target.value)}
                      placeholder="Contoh: Diskusi setup API BPJS versi bridging v2"
                      className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 py-2 px-3 rounded-lg text-slate-805 dark:text-slate-200"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Uraian Transkrip Log Detail *</label>
                    <textarea
                      rows={4}
                      required
                      value={commDetail}
                      onChange={(e) => setCommDetail(e.target.value)}
                      placeholder="Poin penting atau kesepakatan informal, e.g. tombol cetak disetujui warna biru..."
                      className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 py-2 px-3 rounded-lg text-slate-805 dark:text-slate-200"
                    />
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
                      Simpan Log Korespondensi
                    </button>
                  </div>
                </form>
              )}

              {/* ─ RENDER FORM: MEETING RECORD MoM ─ */}
              {activeSubTab === 'mom' && (
                <form onSubmit={meetingLogs ? handleAddMomSubmit : undefined} className="space-y-3.5 text-xs">
                  <div className="grid grid-cols-2 gap-3.5 text-xs">
                    <div className="flex flex-col gap-1 md:col-span-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Judul Rapat *</label>
                      <input
                        type="text"
                        required
                        value={momTitle}
                        onChange={(e) => setMomTitle(e.target.value)}
                        placeholder="Contoh: Sinkronisasi Skema Pajak & Kontrak BPKAD"
                        className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 py-2 px-3 rounded-lg text-slate-805 dark:text-slate-200"
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Project</label>
                      <select
                        value={momProj}
                        onChange={(e) => setMomProj(e.target.value)}
                        className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 py-2 px-3 rounded-lg"
                      >
                        {projects.map(p => <option key={p.kode} value={p.kode}>{p.kode} – {p.nama}</option>)}
                      </select>
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Tanggal Rapat</label>
                      <input
                        type="date"
                        required
                        value={momDate}
                        onChange={(e) => setMomDate(e.target.value)}
                        className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 py-2 px-3 rounded-lg text-slate-800 dark:text-slate-200"
                      />
                    </div>

                    <div className="flex flex-col gap-1 md:col-span-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Daftar Hadir Terlampir *</label>
                      <input
                        type="text"
                        required
                        value={momAttendees}
                        onChange={(e) => setMomAttendees(e.target.value)}
                        placeholder="Contoh: Fajar Pratama, BPKAD IT, Perwakilan Diskominfo"
                        className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 py-2 px-3 rounded-lg text-slate-805 dark:text-slate-200"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">1. Agenda Pembahasan *</label>
                    <textarea
                      rows={2}
                      required
                      value={momAgenda}
                      onChange={(e) => setMomAgenda(e.target.value)}
                      placeholder="e.g. Pembahasan migrasi dari database legacy..."
                      className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 py-2 px-3 rounded-lg text-slate-805 dark:text-slate-200"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">2. Hasil Keputusan *</label>
                    <textarea
                      rows={2}
                      required
                      value={momDecisions}
                      onChange={(e) => setMomDecisions(e.target.value)}
                      placeholder="e.g. Format output sepakati JSON, kickoff tgl 12..."
                      className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 py-2 px-3 rounded-lg text-slate-805 dark:text-slate-200"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">3. Tindakan Lanjut (Action Items)</label>
                    <textarea
                      rows={2}
                      value={momActions}
                      onChange={(e) => setMomActions(e.target.value)}
                      placeholder="e.g. Fajar: Selesaikan draf manual book admin"
                      className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 py-2 px-3 rounded-lg text-slate-805 dark:text-slate-200"
                    />
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
                      Arsipkan MoM Rapat
                    </button>
                  </div>
                </form>
              )}

              {/* ─ RENDER FORM: EXTERN DOCUMENTS LINK ─ */}
              {activeSubTab === 'docs' && (
                <form onSubmit={docs ? handleAddDocSubmit : undefined} className="space-y-3.5 text-xs">
                  <div className="grid grid-cols-2 gap-3.5 text-xs">
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Kategori Dokumen</label>
                      <select
                        value={docCat}
                        onChange={(e) => setDocCat(e.target.value as any)}
                        className="bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 py-2 px-3 rounded-lg"
                      >
                        <option value="API Specs">📚 Spesifikasi API (JSON/YAML)</option>
                        <option value="User Manual">📘 Panduan / Manual Penggunaan</option>
                        <option value="Desain">🎨 Figma Mockup / Asset UI</option>
                        <option value="Kontrak">📃 Dokumen Kontrak & Berkas UAT</option>
                        <option value="Lainnya">📎 Lain-lain</option>
                      </select>
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Project</label>
                      <select
                        value={docProj}
                        onChange={(e) => setDocProj(e.target.value)}
                        className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 py-2 px-3 rounded-lg"
                      >
                        {projects.map(p => <option key={p.kode} value={p.kode}>{p.kode} – {p.nama}</option>)}
                      </select>
                    </div>

                    <div className="flex flex-col gap-1 md:col-span-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Nama / Judul Dokumen *</label>
                      <input
                        type="text"
                        required
                        value={docTitle}
                        onChange={(e) => setDocTitle(e.target.value)}
                        placeholder="Contoh: Swagger API RS Mataram v1.2"
                        className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 py-2 px-3 rounded-lg text-slate-805 dark:text-slate-200"
                      />
                    </div>

                    <div className="flex flex-col gap-1 md:col-span-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Tautan URL Berkas *</label>
                      <input
                        type="url"
                        required
                        value={docUrl}
                        onChange={(e) => setDocUrl(e.target.value)}
                        placeholder="https://drive.google.com/..."
                        className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 py-2 px-3 rounded-lg text-slate-850 dark:text-slate-200 font-mono"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Uraian Ringkas Dokumen</label>
                    <textarea
                      rows={3}
                      value={docDesc}
                      onChange={(e) => setDocDesc(e.target.value)}
                      placeholder="Jelaskan versi, fungsi, atau cara akses berkas..."
                      className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 py-2 px-3 rounded-lg text-slate-850 dark:text-slate-200"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-850">
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
                      Simpan Dokumen
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
