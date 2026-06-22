import React, { useState, useEffect } from "react";
import { CommLog, MeetingLog, Documentation, Project, User, BALog } from "../types";
import { api } from "../lib/api";
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
  FileCheck,
  FileText,
  X,
  Printer,
  Edit
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface CollaborationViewsProps {
  commLogs: CommLog[];
  meetingLogs: MeetingLog[];
  baLogs?: BALog[];
  docs: Documentation[];
  projects: Project[];
  currentUser: User | null;
  onAddCommLog: (data: Partial<CommLog>) => Promise<void>;
  onUpdateCommLog?: (id: string, data: Partial<CommLog>) => Promise<void>;
  onDeleteCommLog: (id: string) => Promise<void>;
  onAddMeetingLog: (data: Partial<MeetingLog>) => Promise<void>;
  onUpdateMeetingLog?: (id: string, data: Partial<MeetingLog>) => Promise<void>;
  onDeleteMeetingLog: (id: string) => Promise<void>;
  onAddBALog?: (data: Partial<BALog>) => Promise<void>;
  onUpdateBALog?: (id: string, data: Partial<BALog>) => Promise<void>;
  onDeleteBALog?: (id: string) => Promise<void>;
  onAddDoc: (data: Partial<Documentation>) => Promise<void>;
  onUpdateDoc?: (id: string, data: Partial<Documentation>) => Promise<void>;
  onDeleteDoc: (id: string) => Promise<void>;
  tipeMediaList?: string[];
  jenisBeritaAcaraList?: string[];
}

export default function CollaborationViews({
  commLogs,
  meetingLogs,
  baLogs = [],
  docs,
  projects,
  currentUser,
  onAddCommLog,
  onUpdateCommLog,
  onDeleteCommLog,
  onAddMeetingLog,
  onUpdateMeetingLog,
  onDeleteMeetingLog,
  onAddBALog,
  onUpdateBALog,
  onDeleteBALog,
  onAddDoc,
  onUpdateDoc,
  onDeleteDoc,
  tipeMediaList = ["WhatsApp", "Email", "Rapat", "Telepon"],
  jenisBeritaAcaraList = ["BA Serah Terima Alat", "BA Instalasi Aplikasi", "BA Training / Sosialisasi", "BA Go-Live", "BA Penyelesaian Pekerjaan"]
}: CollaborationViewsProps) {
  
  const [activeSubTab, setActiveSubTab] = useState<'comm' | 'mom' | 'ba' | 'docs'>('comm');
  const [filterProject, setFilterProject] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    id: string;
    type: 'comm' | 'mom' | 'ba' | 'docs';
    title: string;
  } | null>(null);

  const [companyProfile, setCompanyProfile] = useState<any>(null);

  useEffect(() => {
    fetchCompany();
    const handleCPUpdate = () => fetchCompany();
    window.addEventListener("companyProfileUpdated", handleCPUpdate);
    return () => {
      window.removeEventListener("companyProfileUpdated", handleCPUpdate);
    };
  }, []);

  const fetchCompany = async () => {
    try {
      const data = await api.getCompanyProfile();
      if (data) setCompanyProfile(data);
    } catch (err) {
      console.error("Gagal mengambil data profil perusahaan:", err);
    }
  };

  const handlePrint = (item: any, type: 'comm' | 'mom' | 'ba' | 'docs') => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Popup blocker menghalangi pencetakan. Harap izinkan popup di browser Anda.");
      return;
    }

    const hasLogo = companyProfile && companyProfile.logoUrl;
    const logoHtml = hasLogo 
      ? `<img src="${companyProfile.logoUrl}" style="max-height: 55px; max-width: 130px; object-fit: contain;" />` 
      : `<span style="font-size: 32px;">📑</span>`;

    const compName = companyProfile && companyProfile.nama ? companyProfile.nama : "PT. Medika KSO Syanapsis";
    const compAlamat = companyProfile && companyProfile.alamat ? companyProfile.alamat : "Gedung Cyber 2 Lantai 18, Jl. H.R. Rasuna Said Blok X-5 No. 13, Kuningan Timur, Jakarta Selatan 12950";
    const compTelf = companyProfile && companyProfile.telepon ? companyProfile.telepon : "021-5228585";
    const compFax = companyProfile && companyProfile.fax ? companyProfile.fax : "021-5228586";
    const compWeb = companyProfile && companyProfile.web ? companyProfile.web : "https://syanapsis.taskhub.co.id";
    const compEmail = companyProfile && companyProfile.email ? companyProfile.email : "info@syanapsis.taskhub.co.id";

    let titleText = "";
    let contentHtml = "";

    if (type === 'comm') {
      titleText = `Log Koordinasi - ${item.summary}`;
      contentHtml = `
        <div class="doc-header" style="display: flex; align-items: center; border-bottom: 3px double #1e293b; padding-bottom: 12px; margin-bottom: 15px; font-family: 'Inter', system-ui, sans-serif;">
          <div class="logo-space" style="shrink: 0; display: flex; align-items: center; justify-content: center;">${logoHtml}</div>
          <div class="meta-title" style="flex: 1; margin-left: 15px;">
            <h2 style="margin: 0; font-size: 15px; color: #0f172a; font-weight: 900; text-transform: uppercase;">${compName}</h2>
            <p style="margin: 3px 0 0 0; font-size: 9px; color: #475569; line-height: 1.4; font-weight: 500;">${compAlamat}</p>
            <p style="margin: 2px 0 0 0; font-size: 8.5px; color: #64748b; font-weight: 400;">
              ${compTelf ? `Tlp: ${compTelf}` : ""} 
              ${compFax ? `&nbsp;|&nbsp; Fax: ${compFax}` : ""} 
              ${compWeb ? `&nbsp;|&nbsp; Web: <a href="${compWeb}" target="_blank" style="color: #2563eb; text-decoration: none; font-weight: 600;">${compWeb.replace(/https?:\/\//, "")}</a>` : ""}
              ${compEmail ? `&nbsp;|&nbsp; Email: <a href="mailto:${compEmail}" style="color: #2563eb; text-decoration: none; font-weight: 600;">${compEmail}</a>` : ""}
            </p>
          </div>
        </div>
        <div class="meta-title" style="margin-top: 10px; font-family: sans-serif;">
          <h2 style="font-size: 12px; font-weight: 800; color: #0f172a; margin: 0 0 5px 0; text-transform: uppercase;">LOG KOORDINASI RESMI & ARSIP KORESPONDENSI</h2>
          <p style="font-size: 9px; color: #64748b; margin: 0;">Sistem Informasi Manajemen Rumah Sakit (SIMRS) - Partnership & Collaboration Suite</p>
        </div>

        <div class="divider"></div>

        <table class="meta-table">
          <tr>
            <td class="label">Nomor ID Catatan</td>
            <td class="value"><strong>${item.noID || "—"}</strong></td>
            <td class="label">Tanggal Catatan</td>
            <td class="value">${new Date(item.date).toLocaleDateString("id-ID", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</td>
          </tr>
          <tr>
            <td class="label">Proyek Terkait</td>
            <td class="value">${item.project ? `<strong>${item.project}</strong>` : '<span class="italic text-slate-400">Umum / Tidak Terhubung Proyek</span>'}</td>
            <td class="label font-bold">Media Korespondensi</td>
            <td class="value"><span class="badge">${item.type}</span></td>
          </tr>
          <tr>
            <td class="label">Daftar PIC Terlibat</td>
            <td class="value" colspan="3">${item.participants || "—"}</td>
          </tr>
          <tr>
            <td class="label">Pembuat Dokumen</td>
            <td class="value" colspan="3">👦 ${item.createdBy || "System / Administrator"}</td>
          </tr>
        </table>

        <div class="content-section">
          <h3>1. Pokok Permasalahan / Ringkasan Koordinasi</h3>
          <p class="summary-text">${item.summary}</p>
        </div>

        <div class="content-section">
          <h3>2. Transkrip & Detail Kesepakatan</h3>
          <div class="detail-text">${item.detail ? item.detail.replace(/\\n/g, '<br/>') : "—"}</div>
        </div>

        <div class="footer-sign">
          <table style="width: 100%; border: none; margin-top: 50px;">
            <tr>
              <td style="width: 50%; text-align: center; border: none;">
                <p>Penginput Catatan,</p>
                <div style="height: 70px;"></div>
                <p><strong>( ${item.createdBy || "Staff Korporat"} )</strong></p>
                <p style="font-size: 10px; color: #64748b;">Staff SIMRS Collaboration</p>
              </td>
              <td style="width: 50%; text-align: center; border: none;">
                <p>Mengetahui / Menyetujui,</p>
                <div style="height: 70px;"></div>
                <p><strong>( ____________________ )</strong></p>
                <p style="font-size: 10px; color: #64748b;">Pihak Rumah Sakit / Mitra</p>
              </td>
            </tr>
          </table>
        </div>
      `;
    } else if (type === 'mom') {
      titleText = `Minutes of Meeting - ${item.title}`;
      contentHtml = `
        <div class="doc-header" style="display: flex; align-items: center; border-bottom: 3px double #1e293b; padding-bottom: 12px; margin-bottom: 15px; font-family: 'Inter', system-ui, sans-serif;">
          <div class="logo-space" style="shrink: 0; display: flex; align-items: center; justify-content: center;">${logoHtml}</div>
          <div class="meta-title" style="flex: 1; margin-left: 15px;">
            <h2 style="margin: 0; font-size: 15px; color: #0f172a; font-weight: 900; text-transform: uppercase;">${compName}</h2>
            <p style="margin: 3px 0 0 0; font-size: 9px; color: #475569; line-height: 1.4; font-weight: 500;">${compAlamat}</p>
            <p style="margin: 2px 0 0 0; font-size: 8.5px; color: #64748b; font-weight: 400;">
              ${compTelf ? `Tlp: ${compTelf}` : ""} 
              ${compFax ? `&nbsp;|&nbsp; Fax: ${compFax}` : ""} 
              ${compWeb ? `&nbsp;|&nbsp; Web: <a href="${compWeb}" target="_blank" style="color: #2563eb; text-decoration: none; font-weight: 600;">${compWeb.replace(/https?:\/\//, "")}</a>` : ""}
              ${compEmail ? `&nbsp;|&nbsp; Email: <a href="mailto:${compEmail}" style="color: #2563eb; text-decoration: none; font-weight: 600;">${compEmail}</a>` : ""}
            </p>
          </div>
        </div>
        <div class="meta-title" style="margin-top: 10px; font-family: sans-serif;">
          <h2 style="font-size: 12px; font-weight: 800; color: #0f172a; margin: 0 0 5px 0; text-transform: uppercase;">MINUTES OF MEETING (MoM) / NOTULA RAPAT RESMI</h2>
          <p style="font-size: 9px; color: #64748b; margin: 0;">Sistem Informasi Manajemen Rumah Sakit (SIMRS) - Partnership & Collaboration Suite</p>
        </div>

        <div class="divider"></div>

        <table class="meta-table">
          <tr>
            <td class="label">ID Dokumen MoM</td>
            <td class="value"><strong>${item.noID || "—"}</strong></td>
            <td class="label">Tanggal Rapat</td>
            <td class="value">${new Date(item.date).toLocaleDateString("id-ID", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</td>
          </tr>
          <tr>
            <td class="label">Proyek Terkait</td>
            <td class="value">${item.project ? `<strong>${item.project}</strong>` : '<span class="italic text-slate-400">Umum / Tidak Terhubung Proyek</span>'}</td>
            <td class="label">Metode / Media</td>
            <td class="value"><span class="badge">Tatap Muka / Konferensi Video</span></td>
          </tr>
          <tr>
            <td class="label">Daftar Hadir Peserta</td>
            <td class="value" colspan="3">${item.attendees || "—"}</td>
          </tr>
          <tr>
            <td class="label">Pembuat Notula</td>
            <td class="value" colspan="3">👦 ${item.createdBy || "System / Administrator"}</td>
          </tr>
        </table>

        <div class="content-section">
          <h3 class="highlight-title">📌 Judul Pembahasan Rapat</h3>
          <p class="summary-text" style="font-size: 15px; font-weight: bold; color: #1e3a8a;">${item.title}</p>
        </div>

        <div class="grid-layout">
          <div class="grid-box bg-blue">
            <h4>📋 1. Agenda Pembahasan</h4>
            <p>${item.agenda ? item.agenda.replace(/\\n/g, '<br/>') : "—"}</p>
          </div>
          <div class="grid-box bg-green">
            <h4>✅ 2. Simpulan / Keputusan Rapat</h4>
            <p>${item.decisions ? item.decisions.replace(/\\n/g, '<br/>') : "—"}</p>
          </div>
        </div>

        <div class="content-section" style="margin-top: 15px;">
          <h4>⚡ 3. Tindakan Lanjutan (Action Items)</h4>
          <div class="detail-text" style="background: #f1f5f9; padding: 12px; border-radius: 6px;">
            ${item.actions ? item.actions.replace(/\\n/g, '<br/>') : "—"}
          </div>
        </div>

        <div class="footer-sign">
          <table style="width: 100%; border: none; margin-top: 55px;">
            <tr>
              <td style="width: 50%; text-align: center; border: none;">
                <p>Notulis Rapat,</p>
                <div style="height: 70px;"></div>
                <p><strong>( ${item.createdBy || "Notulis"} )</strong></p>
                <p style="font-size: 10px; color: #64748b;">SIMRS Team Facilitator</p>
              </td>
              <td style="width: 50%; text-align: center; border: none;">
                <p>Perwakilan Peserta Rapat,</p>
                <div style="height: 70px;"></div>
                <p><strong>( ____________________ )</strong></p>
                <p style="font-size: 10px; color: #64748b;">Mitra / Komite RS</p>
              </td>
            </tr>
          </table>
        </div>
      `;
    } else if (type === 'ba') {
      titleText = `Berita Acara - ${item.title}`;
      contentHtml = `
        <div class="doc-header" style="display: flex; align-items: center; border-bottom: 3px double #1e293b; padding-bottom: 12px; margin-bottom: 15px; font-family: 'Inter', system-ui, sans-serif;">
          <div class="logo-space" style="shrink: 0; display: flex; align-items: center; justify-content: center;">${logoHtml}</div>
          <div class="meta-title" style="flex: 1; margin-left: 15px;">
            <h2 style="margin: 0; font-size: 15px; color: #0f172a; font-weight: 900; text-transform: uppercase;">${compName}</h2>
            <p style="margin: 3px 0 0 0; font-size: 9px; color: #475569; line-height: 1.4; font-weight: 500;">${compAlamat}</p>
            <p style="margin: 2px 0 0 0; font-size: 8.5px; color: #64748b; font-weight: 400;">
              ${compTelf ? `Tlp: ${compTelf}` : ""} 
              ${compFax ? `&nbsp;|&nbsp; Fax: ${compFax}` : ""} 
              ${compWeb ? `&nbsp;|&nbsp; Web: <a href="${compWeb}" target="_blank" style="color: #2563eb; text-decoration: none; font-weight: 600;">${compWeb.replace(/https?:\/\//, "")}</a>` : ""}
              ${compEmail ? `&nbsp;|&nbsp; Email: <a href="mailto:${compEmail}" style="color: #2563eb; text-decoration: none; font-weight: 600;">${compEmail}</a>` : ""}
            </p>
          </div>
        </div>
        <div class="meta-title" style="margin-top: 10px; font-family: sans-serif;">
          <h2 style="font-size: 12px; font-weight: 850; color: #1e3a8a; margin: 0 0 5px 0; text-transform: uppercase;">BERITA ACARA RESMI KELAYAKAN & SERAH TERIMA</h2>
          <p style="font-size: 9px; color: #64748b; margin: 0;">Sistem Informasi Manajemen Rumah Sakit (SIMRS) - Partnership & Collaboration Suite</p>
        </div>

        <div class="divider"></div>

        <table class="meta-table">
          <tr>
            <td class="label">Nomor Berita Acara</td>
            <td class="value" colspan="3"><strong style="font-size: 13px; color: #1e3a8a;">${item.noBA || "—"}</strong></td>
          </tr>
          <tr>
            <td class="label">ID Sistem BA</td>
            <td class="value"><strong>${item.noID || "—"}</strong></td>
            <td class="label">Tanggal Pelaksanaan</td>
            <td class="value">${new Date(item.date).toLocaleDateString("id-ID", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</td>
          </tr>
          <tr>
            <td class="label">Proyek Terkait</td>
            <td class="value"><strong>${item.project || "—"}</strong></td>
            <td class="label">Jenis Berita Acara</td>
            <td class="value"><span class="badge" style="background-color: #fca5a5; color: #7f1d1d;">${item.type}</span></td>
          </tr>
          <tr>
            <td class="label">Status Kelayakan</td>
            <td class="value"><span class="badge" style="background-color: #86efac; color: #14532d; font-weight: 800;">${item.status || "Draft"}</span></td>
            <td class="label">Tautan Lampiran</td>
            <td class="value">${item.fileUrl ? `<a href="${item.fileUrl}" target="_blank" style="color: #2563eb; font-weight: bold;">Buka Tautan Lampiran</a>` : '<span class="italic text-slate-400">Tidak Ada Lampiran</span>'}</td>
          </tr>
        </table>

        <div class="content-section">
          <h3 class="highlight-title">📌 Nama Kegiatan & Ruang Lingkup Pekerjaan</h3>
          <p class="summary-text" style="font-size: 15px; font-weight: bold; color: #1e3a8a;">${item.title}</p>
        </div>

        <div class="content-section">
          <h3>📝 Catatan Deskripsi Detail Pekerjaan / Implementasi</h3>
          <div class="detail-text" style="line-height: 1.6; background-color: #fafafa; border: 1px solid #e2e8f0; border-radius: 8px;">
            ${item.notes ? item.notes.replace(/\\n/g, '<br/>') : "—"}
          </div>
        </div>

        <div class="footer-sign">
          <p style="text-align: left; margin-bottom: 20px; font-size: 12px; font-weight: bold; color: #475569;">Demikian Berita Acara ini dibuat dengan sebenar-benarnya untuk digunakan sebagaimana mestinya.</p>
          <table style="width: 100%; border: none; margin-top: 30px;">
            <tr>
              <td style="width: 50%; text-align: center; border: none;">
                <p><strong>PIHAK PERTAMA (RS)</strong></p>
                <p>Perwakilan Rumah Sakit</p>
                <div style="height: 70px;"></div>
                <p><strong>( ${item.signatoryRS || "____________________"} )</strong></p>
                <p style="font-size: 10px; color: #64748b;">Penandatangan / Penguji RS</p>
              </td>
              <td style="width: 50%; text-align: center; border: none;">
                <p><strong>PIHAK KEDUA (PELAKSANA)</strong></p>
                <p>Staff Pelaksana & Support SIMRS</p>
                <div style="height: 70px;"></div>
                <p><strong>( ${item.signatorySupport || "____________________"} )</strong></p>
                <p style="font-size: 10px; color: #64748b;">Implementator / ${compName}</p>
              </td>
            </tr>
          </table>
        </div>
      `;
    } else if (type === 'docs') {
      titleText = `Dokumen Arsitektur - ${item.title}`;
      contentHtml = `
        <div class="doc-header" style="display: flex; align-items: center; border-bottom: 3px double #1e293b; padding-bottom: 12px; margin-bottom: 15px; font-family: 'Inter', system-ui, sans-serif;">
          <div class="logo-space" style="shrink: 0; display: flex; align-items: center; justify-content: center;">${logoHtml}</div>
          <div class="meta-title" style="flex: 1; margin-left: 15px;">
            <h2 style="margin: 0; font-size: 15px; color: #0f172a; font-weight: 900; text-transform: uppercase;">${compName}</h2>
            <p style="margin: 3px 0 0 0; font-size: 9px; color: #475569; line-height: 1.4; font-weight: 500;">${compAlamat}</p>
            <p style="margin: 2px 0 0 0; font-size: 8.5px; color: #64748b; font-weight: 400;">
              ${compTelf ? `Tlp: ${compTelf}` : ""} 
              ${compFax ? `&nbsp;|&nbsp; Fax: ${compFax}` : ""} 
              ${compWeb ? `&nbsp;|&nbsp; Web: <a href="${compWeb}" target="_blank" style="color: #2563eb; text-decoration: none; font-weight: 600;">${compWeb.replace(/https?:\/\//, "")}</a>` : ""}
              ${compEmail ? `&nbsp;|&nbsp; Email: <a href="mailto:${compEmail}" style="color: #2563eb; text-decoration: none; font-weight: 600;">${compEmail}</a>` : ""}
            </p>
          </div>
        </div>
        <div class="meta-title" style="margin-top: 10px; font-family: sans-serif;">
          <h2 style="font-size: 12px; font-weight: 800; color: #0f172a; margin: 0 0 5px 0; text-transform: uppercase;">ARSIP REPOSITORI DOKUMEN & SPESIFIKASI TEKNIS</h2>
          <p style="font-size: 9px; color: #64748b; margin: 0;">Sistem Informasi Manajemen Rumah Sakit (SIMRS) - Partnership & Collaboration Suite</p>
        </div>

        <div class="divider"></div>

        <table class="meta-table">
          <tr>
            <td class="label">ID Dokumen Arsip</td>
            <td class="value"><strong>${item.noID || "—"}</strong></td>
            <td class="label">Tanggal Pengarsipan</td>
            <td class="value">${item.date ? new Date(item.date).toLocaleDateString("id-ID", { year: 'numeric', month: 'long', day: 'numeric' }) : "—"}</td>
          </tr>
          <tr>
            <td class="label">Kategori Dokumen</td>
            <td class="value"><span class="badge" style="background-color: #bfdbfe; color: #1e3a8a;">${item.category}</span></td>
            <td class="label">Sistem / Project</td>
            <td class="value"><strong>${item.project || "—"}</strong></td>
          </tr>
          <tr>
            <td class="label">Tautan URL Berkas</td>
            <td class="value" colspan="3" style="font-family: monospace; font-size: 11px; word-break: break-all; color: #2563eb; font-weight: bold;">
              <a href="${item.url}" target="_blank">${item.url}</a>
            </td>
          </tr>
          <tr>
            <td class="label">Pengarsip / Upload Oleh</td>
            <td class="value" colspan="3">👦 ${item.createdBy || "System / Administrator"}</td>
          </tr>
        </table>

        <div class="content-section">
          <h3>📌 Judul / Klasifikasi Dokumen Resmi</h3>
          <p class="summary-text" style="font-size: 16px; font-weight: 800; color: #0f172a;">${item.title}</p>
        </div>

        <div class="content-section">
          <h3>🔍 Uraian Ringkas, Panduan Akses, atau Deskripsi Berkas</h3>
          <div class="detail-text" style="line-height: 1.6; background-color: #fdfdfd; padding: 15px; border-radius: 8px;">
            ${item.desc ? item.desc.replace(/\\n/g, '<br/>') : "—"}
          </div>
        </div>

        <div class="footer-sign">
          <p style="text-align: left; font-size: 11px; color: #64748b;">* Dokumen ini diarsipkan secara digital di Repositori Integrasi SIMRS Suite. Pastikan tautan berkas di atas tetap aktif agar tim teknis dan rumah sakit dapat mengunduhnya sewaktu-waktu.</p>
          <table style="width: 100%; border: none; margin-top: 40px;">
            <tr>
              <td style="text-align: right; border: none; padding-right: 50px;">
                <p>Dokumen Diarsipkan secara Valid oleh,</p>
                <div style="height: 60px;"></div>
                <p><strong>( ${item.createdBy || "Staff IT"} )</strong></p>
                <p style="font-size: 10px; color: #64748b;">SIMRS Integration Officer</p>
              </td>
            </tr>
          </table>
        </div>
      `;
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>${titleText}</title>
          <style>
            body {
              font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
              color: #0f172a;
              margin: 40px;
              background-color: #ffffff;
              font-size: 13px;
              line-height: 1.5;
            }
            .doc-header {
              display: flex;
              align-items: center;
              gap: 15px;
              margin-bottom: 10px;
            }
            .logo-space {
              font-size: 32px;
              background: #f1f5f9;
              padding: 10px;
              border-radius: 12px;
              border: 1px solid #e2e8f0;
              width: 40px;
              height: 40px;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            .meta-title h2 {
              font-size: 18px;
              margin: 0;
              font-weight: 850;
              letter-spacing: -0.5px;
              color: #1e3a8a;
            }
            .meta-title p {
              font-size: 11px;
              color: #64748b;
              margin: 4px 0 0 0;
              font-weight: 500;
            }
            .divider {
              border-top: 3px double #cbd5e1;
              margin: 15px 0 20px 0;
            }
            .meta-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 25px;
            }
            .meta-table td {
              border: 1px solid #e2e8f0;
              padding: 10px 12px;
              vertical-align: top;
            }
            .meta-table td.label {
              background-color: #f8fafc;
              font-weight: 700;
              color: #475569;
              width: 20%;
              font-size: 11px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .meta-table td.value {
              font-size: 12px;
              color: #1e293b;
            }
            .badge {
              display: inline-block;
              padding: 2px 8px;
              border-radius: 4px;
              font-size: 10px;
              font-weight: 800;
              background-color: #e0f2fe;
              color: #0369a1;
            }
            .content-section {
              margin-bottom: 20px;
            }
            .content-section h3, .content-section h4 {
              margin: 0 0 8px 0;
              font-size: 12px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              color: #475569;
              font-weight: 800;
            }
            .summary-text {
              font-size: 14px;
              color: #0f172a;
              margin: 0;
              line-height: 1.5;
            }
            .detail-text {
              font-size: 12.5px;
              color: #334155;
              padding: 12px;
              border: 1px solid #f1f5f9;
              border-radius: 6px;
              white-space: pre-wrap;
              background-color: #f8fafc;
            }
            .grid-layout {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 15px;
              margin-bottom: 20px;
            }
            .grid-box {
              padding: 15px;
              border-radius: 8px;
              border: 1px solid #e2e8f0;
            }
            .grid-box h4 {
              color: #1e293b;
              font-size: 11px;
              margin-top: 0;
              margin-bottom: 8px;
            }
            .grid-box.bg-blue {
              background-color: #eff6ff;
              border-color: #bfdbfe;
            }
            .grid-box.bg-green {
              background-color: #f0fdf4;
              border-color: #bbf7d0;
            }
            .footer-sign {
              margin-top: 40px;
              font-size: 12px;
            }
            @media print {
              body {
                margin: 20px;
                font-size: 12px;
              }
              .no-print {
                display: none;
              }
            }
          </style>
        </head>
        <body>
          <div class="no-print" style="margin-bottom: 20px; text-align: right;">
            <button onclick="window.print()" style="background-color: #2563eb; color: white; border: none; padding: 8px 16px; border-radius: 6px; font-weight: bold; cursor: pointer; font-size: 12px; display: inline-flex; align-items: center; gap: 6px;">
              🖨️ Cetak Dokumen via Printer / PDF
            </button>
            <button onclick="window.close()" style="background-color: #64748b; color: white; border: none; padding: 8px 16px; border-radius: 6px; font-weight: bold; cursor: pointer; font-size: 12px; margin-left: 8px;">
              Tutup Jendela
            </button>
          </div>
          ${contentHtml}
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 405);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const [commType, setCommType] = useState<string>("WhatsApp");
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

  // ── BERITA ACARA (BA) FORM STATES ──
  const [baProj, setBaProj] = useState("");
  const [baNo, setBaNo] = useState("");
  const [baTitle, setBaTitle] = useState("");
  const [baType, setBaType] = useState(jenisBeritaAcaraList[0] || "");
  const [baDate, setBaDate] = useState("");
  const [baSignatoryRS, setBaSignatoryRS] = useState("");
  const [baSignatorySupport, setBaSignatorySupport] = useState("");
  const [baNotes, setBaNotes] = useState("");
  const [baFileUrl, setBaFileUrl] = useState("");
  const [baStatus, setBaStatus] = useState("Draft");

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
  const filteredBa = baLogs.filter(ba => !filterProject || ba.project === filterProject);
  const filteredDocs = docs.filter(d => !filterProject || d.project === filterProject);

  const todayStr = new Date().toISOString().slice(0, 10);

  function handleOpenForm() {
    setEditingId(null);
    setCommProj("");
    setCommDate(todayStr);
    setCommParts("");
    setCommSummary("");
    setCommDetail("");
    setCommType(tipeMediaList[0] || "WhatsApp");

    setMomTitle("");
    setMomProj("");
    setMomDate(todayStr);
    setMomAttendees("");
    setMomAgenda("");
    setMomDecisions("");
    setMomActions("");

    setBaProj(projects[0]?.kode || "");
    setBaNo("");
    setBaTitle("");
    setBaType(jenisBeritaAcaraList[0] || "");
    setBaDate(todayStr);
    setBaSignatoryRS("");
    setBaSignatorySupport("");
    setBaNotes("");
    setBaFileUrl("");
    setBaStatus("Draft");

    setDocTitle("");
    setDocProj(projects[0]?.kode || "");
    setDocCat("API Specs");
    setDocUrl("");
    setDocDesc("");
    setDocDate(todayStr);

    setIsFormOpen(true);
  }

  function handleEditCommClick(item: CommLog) {
    setEditingId(item.id);
    setCommProj(item.project || "");
    setCommType(item.type || "WhatsApp");
    setCommDate(item.date || todayStr);
    setCommParts(item.participants || "");
    setCommSummary(item.summary || "");
    setCommDetail(item.detail || "");
    setIsFormOpen(true);
  }

  function handleEditMomClick(item: MeetingLog) {
    setEditingId(item.id);
    setMomTitle(item.title || "");
    setMomProj(item.project || "");
    setMomDate(item.date || todayStr);
    setMomAttendees(item.attendees || "");
    setMomAgenda(item.agenda || "");
    setMomDecisions(item.decisions || "");
    setMomActions(item.actions || "");
    setIsFormOpen(true);
  }

  function handleEditBAClick(item: BALog) {
    setEditingId(item.id);
    setBaProj(item.project || "");
    setBaNo(item.noBA || "");
    setBaTitle(item.title || "");
    setBaType(item.type || jenisBeritaAcaraList[0] || "");
    setBaDate(item.date || todayStr);
    setBaSignatoryRS(item.signatoryRS || "");
    setBaSignatorySupport(item.signatorySupport || "");
    setBaNotes(item.notes || "");
    setBaFileUrl(item.fileUrl || "");
    setBaStatus(item.status || "Draft");
    setIsFormOpen(true);
  }

  function handleEditDocClick(item: Documentation) {
    setEditingId(item.id);
    setDocTitle(item.title || "");
    setDocProj(item.project || "");
    setDocCat(item.category || "API Specs");
    setDocUrl(item.url || "");
    setDocDesc(item.desc || "");
    setDocDate(item.date || todayStr);
    setIsFormOpen(true);
  }

  async function handleAddCommSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!commParts.trim() || !commSummary.trim() || !commDetail.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      if (editingId) {
        if (onUpdateCommLog) {
          await onUpdateCommLog(editingId, {
            project: commProj,
            type: commType,
            date: commDate,
            participants: commParts,
            summary: commSummary,
            detail: commDetail
          });
        }
      } else {
        await onAddCommLog({
          project: commProj,
          type: commType,
          date: commDate,
          participants: commParts,
          summary: commSummary,
          detail: commDetail
        });
      }
      setEditingId(null);
      setIsFormOpen(false);
    } catch (err: any) {
      alert("Gagal menyimpan log koordinasi: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleAddMomSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!momTitle.trim() || !momAttendees.trim() || !momAgenda.trim() || !momDecisions.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      if (editingId) {
        if (onUpdateMeetingLog) {
          await onUpdateMeetingLog(editingId, {
            project: momProj,
            date: momDate,
            title: momTitle,
            attendees: momAttendees,
            agenda: momAgenda,
            decisions: momDecisions,
            actions: momActions
          });
        }
      } else {
        await onAddMeetingLog({
          project: momProj,
          date: momDate,
          title: momTitle,
          attendees: momAttendees,
          agenda: momAgenda,
          decisions: momDecisions,
          actions: momActions
        });
      }
      setEditingId(null);
      setIsFormOpen(false);
    } catch (err: any) {
      alert("Gagal menyimpan MoM: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleAddBASubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!baNo.trim() || !baTitle.trim() || isSubmitting) {
      if (!isSubmitting) alert("Nomor Berita Acara dan Judul wajib diisi!");
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingId) {
        if (onUpdateBALog) {
          await onUpdateBALog(editingId, {
            project: baProj,
            noBA: baNo,
            title: baTitle,
            type: baType,
            date: baDate,
            signatoryRS: baSignatoryRS,
            signatorySupport: baSignatorySupport,
            notes: baNotes,
            fileUrl: baFileUrl,
            status: baStatus
          });
        }
      } else if (onAddBALog) {
        await onAddBALog({
          project: baProj,
          noBA: baNo,
          title: baTitle,
          type: baType,
          date: baDate,
          signatoryRS: baSignatoryRS,
          signatorySupport: baSignatorySupport,
          notes: baNotes,
          fileUrl: baFileUrl,
          status: baStatus
        });
      }
      setEditingId(null);
      setIsFormOpen(false);
    } catch (err: any) {
      alert("Gagal menyimpan Berita Acara: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleAddDocSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!docTitle.trim() || !docUrl.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      if (editingId) {
        if (onUpdateDoc) {
          await onUpdateDoc(editingId, {
            project: docProj,
            category: docCat,
            title: docTitle,
            url: docUrl,
            desc: docDesc,
            date: docDate
          });
        }
      } else {
        await onAddDoc({
          project: docProj,
          category: docCat,
          title: docTitle,
          url: docUrl,
          desc: docDesc,
          date: docDate
        });
      }
      setEditingId(null);
      setIsFormOpen(false);
    } catch (err: any) {
      alert("Gagal menyimpan dokumen: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6 fade-in font-sans pb-10">
      
      {/* Sub menu controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-2">
        
        {/* Sub controllers */}
        <div className="flex flex-wrap gap-1 bg-slate-100 dark:bg-slate-950 p-1 border border-slate-200 dark:border-slate-800 rounded-lg text-xs">
          <button
            onClick={() => { setActiveSubTab('comm'); }}
            className={`px-3.5 py-1.5 rounded-md font-bold transition-all flex items-center gap-1.5 ${activeSubTab === 'comm' ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 font-extrabold shadow-sm' : 'text-slate-500 hover:text-slate-200'}`}
          >
            <MessageSquare className="w-4 h-4" /> Log Koordinasi
          </button>
          
          <button
            onClick={() => { setActiveSubTab('mom'); }}
            className={`px-3.5 py-1.5 rounded-md font-bold transition-all flex items-center gap-1.5 ${activeSubTab === 'mom' ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 font-extrabold shadow-sm' : 'text-slate-500 hover:text-slate-200'}`}
          >
            <Users className="w-4 h-4" /> Minutes of Meeting (MoM)
          </button>

          <button
            onClick={() => { setActiveSubTab('ba'); }}
            className={`px-3.5 py-1.5 rounded-md font-bold transition-all flex items-center gap-1.5 ${activeSubTab === 'ba' ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 font-extrabold shadow-sm' : 'text-slate-500 hover:text-slate-200'}`}
          >
            <FileText className="w-4 h-4" /> Berita Acara (BA)
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
          {isFormOpen ? (
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-lg flex items-center gap-1 border border-slate-250 dark:border-slate-700 shadow-xs transition-all whitespace-nowrap cursor-pointer"
            >
              &larr; Kembali ke Daftar
            </button>
          ) : (
            <>
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
                  type="button"
                  onClick={handleOpenForm}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1 shadow-sm transition-all whitespace-nowrap"
                >
                  <Plus className="w-4 h-4" /> {activeSubTab === 'comm' ? "Catat Koordinasi" : activeSubTab === 'mom' ? "Tulis MoM" : activeSubTab === 'ba' ? "Buat BA Baru" : "Tambah Dokumen"}
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* RENDER ACTIVE TAB WORKSPACE */}
      <div className="space-y-4">
        {isFormOpen ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-805 p-6 rounded-2xl space-y-4 shadow-sm"
          >
            <div>
              <span className="text-[10px] uppercase font-mono font-black tracking-widest text-indigo-600 dark:text-indigo-400">
                {editingId ? "Pembaruan Data (Isian Edit Tanpa Pop-up)" : "Pencatatan Baru (Isian Baru Tanpa Pop-up)"}
              </span>
              <h3 className="text-base font-black text-slate-800 dark:text-slate-100 tracking-tight">
                {editingId 
                  ? (activeSubTab === 'comm' ? "Form Edit Log Koordinasi" : activeSubTab === 'mom' ? "Form Edit Notula & Keputusan Rapat (MoM)" : activeSubTab === 'ba' ? "Form Edit Berita Acara (BA)" : "Form Edit Tautan Dokumen")
                  : (activeSubTab === 'comm' ? "Form Catat Log Koordinasi Baru" : activeSubTab === 'mom' ? "Form Notula & Keputusan Rapat (MoM) Baru" : activeSubTab === 'ba' ? "Form Berita Acara (BA) Baru" : "Form Unggah Tautan Dokumen Baru")
                }
              </h3>
              <p className="text-xs text-slate-405 dark:text-slate-500 mt-0.5">Sistem memproses isian data secara langsung terintegrasi dengan database SIMRS.</p>
            </div>

            <div className="border-t border-slate-100 dark:border-slate-800/80 pt-4">
              
              {/* ─ RENDER FORM: COMMUNICATION LOG ─ */}
              {activeSubTab === 'comm' && (
                <form onSubmit={commLogs ? handleAddCommSubmit : undefined} className="space-y-3.5 text-xs">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Tipe Media</label>
                      <select
                        value={commType}
                        onChange={(e) => setCommType(e.target.value)}
                        className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 py-2 px-3 rounded-lg text-slate-800 dark:text-slate-150"
                      >
                        {tipeMediaList.map((tm) => (
                          <option key={tm} value={tm}>{tm}</option>
                        ))}
                      </select>
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Project (Opsional)</label>
                      <select
                        value={commProj}
                        onChange={(e) => setCommProj(e.target.value)}
                        className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 py-2 px-3 rounded-lg text-slate-800 dark:text-slate-150"
                      >
                        <option value="">-- Tanpa Project (Opsional & Tidak Langsung Tampil) --</option>
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
                        className="bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 py-2 px-3 rounded-lg text-slate-800 dark:text-slate-205"
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Peserta / PIC Terkait *</label>
                      <input
                        type="text"
                        required
                        value={commParts}
                        onChange={(e) => setCommParts(e.target.value)}
                        placeholder="Contoh: Fajar (SIMRS Support) <-> Kepala IT RS"
                        className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 py-2 px-3 rounded-lg text-slate-805 dark:text-slate-200"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Ringkasan Info / Pokok Hasil *</label>
                    <input
                      type="text"
                      required
                      value={commSummary}
                      onChange={(e) => setCommSummary(e.target.value)}
                      placeholder="Contoh: Diskusi koordinasi backup rutin SIMRS..."
                      className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 py-2 px-3 rounded-lg text-slate-800 dark:text-slate-200"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Detail Pertukaran Informasi / Catatan Chat *</label>
                    <textarea
                      rows={4}
                      required
                      value={commDetail}
                      onChange={(e) => setCommDetail(e.target.value)}
                      placeholder="Masukkan percakapan, tanggapan, kendala utama yang didiskusikan..."
                      className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 py-2 px-3 rounded-lg text-slate-800 dark:text-slate-200 font-mono text-[11px]"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-850">
                    <button
                      type="button"
                      onClick={() => setIsFormOpen(false)}
                      className="px-4 py-2 border border-slate-250 dark:border-slate-705 text-slate-505 dark:text-slate-400 text-xs font-semibold rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white text-xs font-bold rounded-lg hover:shadow-lg transition-all flex items-center justify-center gap-1.5"
                    >
                      {isSubmitting ? "Memproses..." : (editingId ? "Update Log Koordinasi" : "Simpan Log Koordinasi")}
                    </button>
                  </div>
                </form>
              )}

              {/* ─ RENDER FORM: MINUTES OF MEETING ─ */}
              {activeSubTab === 'mom' && (
                <form onSubmit={meetingLogs ? handleAddMomSubmit : undefined} className="space-y-3.5 text-xs">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    <div className="flex flex-col gap-1 md:col-span-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Judul Pembahasan Rapat *</label>
                      <input
                        type="text"
                        required
                        value={momTitle}
                        onChange={(e) => setMomTitle(e.target.value)}
                        placeholder="Contoh: Rapat Evaluasi Implementasi Modul Farmasi Rawat Jalan"
                        className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 py-2 px-3 rounded-lg text-slate-805 dark:text-slate-200"
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Project (Opsional)</label>
                      <select
                        value={momProj}
                        onChange={(e) => setMomProj(e.target.value)}
                        className="bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 py-2 px-3 rounded-lg text-slate-800 dark:text-slate-150"
                      >
                        <option value="">-- Tanpa Project (Opsional & Tidak Langsung Tampil) --</option>
                        {projects.map(p => <option key={p.kode} value={p.kode}>{p.kode} – {p.nama}</option>)}
                      </select>
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Tanggal Pertemuan</label>
                      <input
                        type="date"
                        required
                        value={momDate}
                        onChange={(e) => setMomDate(e.target.value)}
                        className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 py-2 px-3 rounded-lg text-slate-800 dark:text-slate-200"
                      />
                    </div>

                    <div className="flex flex-col gap-1 md:col-span-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Daftar Hadir Peserta *</label>
                      <input
                        type="text"
                        required
                        value={momAttendees}
                        onChange={(e) => setMomAttendees(e.target.value)}
                        placeholder="Contoh: dr. Setiawan (RS), Budi (IT), fajar (SIMRS Support)"
                        className="bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 py-2 px-3 rounded-lg text-slate-850 dark:text-slate-200"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Agenda Bahasan Rapat *</label>
                    <textarea
                      rows={2}
                      required
                      value={momAgenda}
                      onChange={(e) => setMomAgenda(e.target.value)}
                      placeholder="Uraikan agenda pokok yang dibicarakan dalam rapat..."
                      className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 py-2 px-3 rounded-lg text-slate-850 dark:text-slate-200"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Keputusan Rapat & Simpulan *</label>
                    <textarea
                      rows={3}
                      required
                      value={momDecisions}
                      onChange={(e) => setMomDecisions(e.target.value)}
                      placeholder="Ketik keputusan mutlak hasil musyawarah rapat kedua belah pihak..."
                      className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 py-2 px-3 rounded-lg text-slate-850 dark:text-slate-200 font-mono text-[11px]"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Tindakan Lanjutan (Action Items)</label>
                    <textarea
                      rows={2}
                      value={momActions}
                      onChange={(e) => setMomActions(e.target.value)}
                      placeholder="Daftar PIC pelaksana, pembagian tugas dan batas pengerjaannya..."
                      className="bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 py-2 px-3 rounded-lg text-slate-850 dark:text-slate-205"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-850">
                    <button
                      type="button"
                      onClick={() => setIsFormOpen(false)}
                      className="px-4 py-2 border border-slate-250 dark:border-slate-705 text-slate-550 dark:text-slate-400 text-xs font-semibold rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white text-xs font-bold rounded-lg hover:shadow-lg transition-all flex items-center justify-center gap-1.5"
                    >
                      {isSubmitting ? "Memproses..." : (editingId ? "Update Arsip MoM" : "Simpan Arsip MoM")}
                    </button>
                  </div>
                </form>
              )}

              {/* ─ RENDER FORM: BERITA ACARA (BA) ─ */}
              {activeSubTab === 'ba' && (
                <form onSubmit={baLogs && onAddBALog ? handleAddBASubmit : undefined} className="space-y-3.5 text-xs">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 text-xs">
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Project Terkait *</label>
                      <select
                        value={baProj}
                        onChange={(e) => setBaProj(e.target.value)}
                        className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 py-2 px-3 rounded-lg text-slate-800 dark:text-slate-150"
                      >
                        {projects.map(p => <option key={p.kode} value={p.kode}>{p.kode} – {p.nama}</option>)}
                      </select>
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Nomor Surat Berita Acara *</label>
                      <input
                        type="text"
                        required
                        value={baNo}
                        onChange={(e) => setBaNo(e.target.value)}
                        placeholder="Contoh: 024/BA-SMR/VI/2026"
                        className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 py-2 px-3 rounded-lg text-slate-850 dark:text-slate-200"
                      />
                    </div>

                    <div className="flex flex-col gap-1 md:col-span-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Nama / Judul Kegiatan *</label>
                      <input
                        type="text"
                        required
                        value={baTitle}
                        onChange={(e) => setBaTitle(e.target.value)}
                        placeholder="Contoh: Serah Terima Modul Farmasi & Kasir RSID"
                        className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 py-2 px-3 rounded-lg text-slate-850 dark:text-slate-200"
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Jenis Acara Berita Acara</label>
                      <select
                        value={baType}
                        onChange={(e) => setBaType(e.target.value)}
                        className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 py-2 px-3 rounded-lg text-slate-800 dark:text-slate-150"
                      >
                        {jenisBeritaAcaraList.map((j) => (
                          <option key={j} value={j}>{j}</option>
                        ))}
                      </select>
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Tanggal Kejadian / Serah Terima</label>
                      <input
                        type="date"
                        required
                        value={baDate}
                        onChange={(e) => setBaDate(e.target.value)}
                        className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 py-2 px-3 rounded-lg text-slate-800 dark:text-slate-200"
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Penanggung Jawab RS (Pihak 1) *</label>
                      <input
                        type="text"
                        required
                        value={baSignatoryRS}
                        onChange={(e) => setBaSignatoryRS(e.target.value)}
                        placeholder="dr. H. Ahmad Fauzi, M.Kes"
                        className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 py-2 px-3 rounded-lg text-slate-850 dark:text-slate-200"
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Implementator SIMRS (Pihak 2) *</label>
                      <input
                        type="text"
                        required
                        value={baSignatorySupport}
                        onChange={(e) => setBaSignatorySupport(e.target.value)}
                        placeholder="Muhammad Fajar, S.Kom"
                        className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 py-2 px-3 rounded-lg text-slate-850 dark:text-slate-200"
                      />
                    </div>

                    <div className="flex flex-col gap-1 md:col-span-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Tautan Lampiran Dokumen UAT (Drive/PDF) *</label>
                      <input
                        type="url"
                        required
                        value={baFileUrl}
                        onChange={(e) => setBaFileUrl(e.target.value)}
                        placeholder="https://drive.google.com/..."
                        className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 py-2 px-3 rounded-lg text-slate-810 dark:text-slate-205 text-xs text-blue-500 font-mono"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Catatan / Rincian Pekerjaan Berita Acara</label>
                    <textarea
                      rows={3}
                      required
                      value={baNotes}
                      onChange={(e) => setBaNotes(e.target.value)}
                      placeholder="Tulis rincian kelayakan, uji coba fungsional, dan hal penting lainnya..."
                      className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 py-2 px-3 rounded-lg text-slate-800 dark:text-slate-200"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-850">
                    <button
                      type="button"
                      onClick={() => setIsFormOpen(false)}
                      className="px-4 py-2 border border-slate-250 dark:border-slate-705 text-slate-505 dark:text-slate-400 text-xs font-semibold rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white text-xs font-bold rounded-lg hover:shadow-lg transition-all flex items-center justify-center gap-1.5"
                    >
                      {isSubmitting ? "Memproses..." : (editingId ? "Update Berita Acara" : "Simpan Berita Acara")}
                    </button>
                  </div>
                </form>
              )}

              {/* ─ RENDER FORM: REPOSITORI DOKUMEN ─ */}
              {activeSubTab === 'docs' && (
                <form onSubmit={docs ? handleAddDocSubmit : undefined} className="space-y-3.5 text-xs">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 text-xs">
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
                        className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 py-2 px-3 rounded-lg text-slate-800 dark:text-slate-150"
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
                        placeholder="Contoh: Spek API BPJS v2.1"
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
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Keterangan / Informasi Deskripsi</label>
                    <textarea
                      rows={3}
                      value={docDesc}
                      onChange={(e) => setDocDesc(e.target.value)}
                      placeholder="Tulis ringkasan isi dokumen, tim PIC, dsb..."
                      className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 py-2 px-3 rounded-lg text-slate-850 dark:text-slate-200 font-mono text-[11px]"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-850">
                    <button
                      type="button"
                      onClick={() => setIsFormOpen(false)}
                      className="px-4 py-2 border border-slate-250 dark:border-slate-700 text-slate-505 dark:text-slate-400 text-xs font-semibold rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white text-xs font-bold rounded-lg hover:shadow-lg transition-all flex items-center justify-center gap-1.5"
                    >
                      {isSubmitting ? "Memproses..." : (editingId ? "Update Tautan Dokumen" : "Arsipkan Tautan Dokumen")}
                    </button>
                  </div>
                </form>
              )}

            </div>
          </motion.div>
        ) : (
          <>
        {activeSubTab === 'comm' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredComm.length === 0 ? (
              <div className="col-span-2 text-center py-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
                <MessageSquare className="w-10 h-10 text-slate-300 mx-auto mb-2 opacity-45" />
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Belum ada log koordinasi</p>
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
                            {c.project ? (
                              <span className="bg-blue-50 dark:bg-blue-950 border border-blue-100 dark:border-blue-900/30 text-blue-600 dark:text-blue-450 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded">
                                {c.project}
                              </span>
                            ) : (
                              <span className="bg-slate-100 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 text-slate-500 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded">
                                Non-Project
                              </span>
                            )}
                            {c.noID && (
                              <span className="bg-indigo-50 dark:bg-indigo-950 border border-indigo-100 dark:border-indigo-900/40 text-indigo-600 dark:text-indigo-400 text-[9px] font-mono font-extrabold px-1.5 py-0.5 rounded ml-1.5">
                                {c.noID}
                              </span>
                            )}
                            <span className="text-slate-400 dark:text-slate-500 text-[9px] font-bold font-mono ml-2">
                              {new Date(c.date).toLocaleDateString("id-ID")}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => handlePrint(c, 'comm')}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 transition-all rounded hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                            title="Cetak Log Koordinasi / Print"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                          {(() => {
                            const canEdit = !c.createdBy || c.createdBy === currentUser?.username || currentUser?.role === "Administrator" || currentUser?.role === "Technical Support" || currentUser?.role === "Direktur";
                            return (
                              <button
                                onClick={() => handleEditCommClick(c)}
                                disabled={!canEdit}
                                className={`p-1.5 transition-all rounded hover:bg-slate-50 dark:hover:bg-slate-800 ${
                                  canEdit
                                    ? "text-slate-400 hover:text-blue-500 cursor-pointer"
                                    : "text-slate-200 dark:text-slate-805 cursor-not-allowed opacity-40"
                                }`}
                                title={canEdit ? "Edit log koordinasi" : `Hanya penginput (${c.createdBy || "—"}) atau Administrator/Support yang boleh mengedit`}
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                            );
                          })()}
                          {(() => {
                            const canDelete = !c.createdBy || c.createdBy === currentUser?.username || currentUser?.role === "Administrator" || currentUser?.role === "Technical Support" || currentUser?.role === "Direktur";
                            return (
                              <button
                                onClick={() => {
                                  setDeleteConfirmation({
                                    id: c.id,
                                    type: 'comm',
                                    title: c.summary || 'Log koordinasi ini'
                                  });
                                }}
                                disabled={!canDelete}
                                className={`p-1.5 transition-all rounded hover:bg-slate-50 dark:hover:bg-slate-800 ${
                                  canDelete
                                    ? "text-slate-400 hover:text-red-500 cursor-pointer"
                                    : "text-slate-200 dark:text-slate-805 cursor-not-allowed opacity-40"
                                }`}
                                title={canDelete ? "Hapus log koordinasi" : `Hanya penginput (${c.createdBy || "—"}) atau Administrator/Support yang boleh menghapus`}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            );
                          })()}
                        </div>
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
                      {c.createdBy && (
                        <div className="mt-2.5 text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded-md border border-indigo-150/10 w-fit">
                          🧑‍💻 Penginput: <strong className="font-extrabold">{c.createdBy}</strong>
                        </div>
                      )}
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
                  <div className="flex justify-between items-start gap-4 border-b border-slate-101 dark:border-slate-800 pb-3">
                    <div>
                      <div className="flex items-center flex-wrap gap-2 text-[10px] text-slate-400 font-mono font-bold">
                        {m.project ? (
                          <span className="bg-blue-50 dark:bg-blue-950 border border-blue-101 dark:border-blue-900/40 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded">
                            {m.project}
                          </span>
                        ) : (
                          <span className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 px-2 py-0.5 rounded font-bold">
                            Non-Project
                          </span>
                        )}
                        {m.noID && (
                          <span className="bg-indigo-50 dark:bg-indigo-950 border border-indigo-100 dark:border-indigo-900/40 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded font-extrabold">
                            ID: {m.noID}
                          </span>
                        )}
                        <span className="flex items-center gap-1 text-slate-400">
                          <Clock className="w-3.5 h-3.5 text-slate-400" /> Rapat: {new Date(m.date).toLocaleDateString("id-ID", { year: "numeric", month: "long", day: "numeric" })}
                        </span>
                      </div>
                      <h4 className="text-base font-black text-slate-800 dark:text-slate-100 mt-2 tracking-tight">
                        {m.title}
                      </h4>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 font-semibold">
                        Peserta Rapat: {m.attendees}
                      </p>
                      {m.createdBy && (
                        <div className="mt-2 text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded-md border border-indigo-150/10 w-fit">
                          🧑‍💻 Penginput: <strong className="font-extrabold">{m.createdBy}</strong>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handlePrint(m, 'mom')}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 transition-all rounded hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                        title="Cetak Minutes of Meeting / Print"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>
                      {(() => {
                        const canEdit = !m.createdBy || m.createdBy === currentUser?.username || currentUser?.role === "Administrator" || currentUser?.role === "Technical Support" || currentUser?.role === "Direktur";
                        return (
                          <button
                            onClick={() => handleEditMomClick(m)}
                            disabled={!canEdit}
                            className={`shrink-0 transition-all p-1.5 rounded-lg ${
                              canEdit 
                                ? "text-slate-400 hover:text-blue-500 cursor-pointer" 
                                : "text-slate-200 dark:text-slate-800 cursor-not-allowed opacity-40"
                            }`}
                            title={canEdit ? "Edit MoM" : `Hanya penginput (${m.createdBy || "—"}) atau Administrator/Support yang boleh mengedit`}
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        );
                      })()}
                      {(() => {
                        const canDelete = !m.createdBy || m.createdBy === currentUser?.username || currentUser?.role === "Administrator" || currentUser?.role === "Technical Support" || currentUser?.role === "Direktur";
                        return (
                          <button
                            onClick={() => {
                              setDeleteConfirmation({
                                id: m.id,
                                type: 'mom',
                                title: m.title || 'MoM ini'
                              });
                            }}
                            disabled={!canDelete}
                            className={`shrink-0 transition-all p-1.5 rounded-lg ${
                              canDelete 
                                ? "text-slate-400 hover:text-red-500 cursor-pointer" 
                                : "text-slate-200 dark:text-slate-800 cursor-not-allowed opacity-40"
                            }`}
                            title={canDelete ? "Hapus MoM" : `Hanya penginput (${m.createdBy || "—"}) atau Administrator/Support yang boleh menghapus`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        );
                      })()}
                    </div>
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

        {/* TAB: BERITA ACARA (BA) LOGS */}
        {activeSubTab === 'ba' && (
          <div className="space-y-4">
            {filteredBa.length === 0 ? (
              <div className="text-center py-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
                <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2 opacity-45" />
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Belum ada Berita Acara (BA) dibuat</p>
                <p className="text-xs text-slate-400">Buat Berita Acara serah terima alat, instalasi aplikasi, training, atau UAT untuk project ini.</p>
              </div>
            ) : (
              filteredBa.map((ba) => (
                <div 
                  key={ba.id} 
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 hover:border-blue-500/25 transition-all space-y-4"
                >
                  <div className="flex justify-between items-start gap-4 border-b border-slate-101 dark:border-slate-800 pb-3">
                    <div>
                      <div className="flex items-center flex-wrap gap-2 text-[10px] text-slate-500 dark:text-slate-400 font-mono font-bold">
                        <span className="bg-blue-50 dark:bg-blue-950 border border-blue-100 dark:border-blue-900/40 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded">
                          {ba.project}
                        </span>
                        {ba.noID && (
                          <span className="bg-indigo-50 dark:bg-indigo-950 border border-indigo-100 dark:border-indigo-900/40 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded font-bold">
                            ID: {ba.noID}
                          </span>
                        )}
                        <span className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-705 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded">
                          {ba.type}
                        </span>
                        <span className="flex items-center gap-1 text-slate-400">
                          <Calendar className="w-3.5 h-3.5" /> {new Date(ba.date).toLocaleDateString("id-ID", { year: "numeric", month: "long", day: "numeric" })}
                        </span>
                      </div>
                      <h4 className="text-base font-black text-slate-800 dark:text-slate-100 mt-2 tracking-tight">
                        {ba.title}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-mono font-semibold">
                        No. BA: <span className="text-slate-705 dark:text-slate-205">{ba.noBA}</span>
                      </p>
                      {ba.createdBy && (
                        <div className="mt-2 text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded-md border border-indigo-150/10 w-fit">
                          🧑‍💻 Penginput: <strong className="font-extrabold">{ba.createdBy}</strong>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-[10px] font-bold px-2 py-1 rounded border ${
                        ba.status === "Approved" ? "bg-emerald-950/20 text-emerald-400 border-emerald-900/50" :
                        ba.status === "Signed" ? "bg-blue-950/20 text-blue-300 border-blue-900/50" :
                        "bg-amber-950/20 text-amber-400 border-amber-900/30"
                      }`}>
                        {ba.status}
                      </span>
                      <button
                        onClick={() => handlePrint(ba, 'ba')}
                        className="p-1 text-slate-400 hover:text-indigo-600 transition-all rounded hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                        title="Cetak Berita Acara / Print"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                      {(() => {
                        const canEdit = !ba.createdBy || ba.createdBy === currentUser?.username || currentUser?.role === "Administrator" || currentUser?.role === "Technical Support" || currentUser?.role === "Direktur";
                        return (
                          <button
                            onClick={() => handleEditBAClick(ba)}
                            disabled={!canEdit}
                            className={`p-1 rounded shrink-0 transition-all ${
                              canEdit 
                                ? "text-slate-400 hover:text-blue-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer" 
                                : "text-slate-200 dark:text-slate-805 cursor-not-allowed opacity-40"
                            }`}
                            title={canEdit ? "Edit BA" : `Hanya penginput (${ba.createdBy || "—"}) atau Administrator/Support yang boleh mengedit`}
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        );
                      })()}
                      {onDeleteBALog && (() => {
                        const canDelete = !ba.createdBy || ba.createdBy === currentUser?.username || currentUser?.role === "Administrator" || currentUser?.role === "Technical Support" || currentUser?.role === "Direktur";
                        return (
                          <button
                            onClick={() => {
                              setDeleteConfirmation({
                                id: ba.id,
                                type: 'ba',
                                title: ba.title || 'Berita Acara ini'
                              });
                            }}
                            disabled={!canDelete}
                            className={`p-1 rounded shrink-0 transition-all ${
                              canDelete 
                                ? "text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer" 
                                : "text-slate-200 dark:text-slate-805 cursor-not-allowed opacity-40"
                            }`}
                            title={canDelete ? "Hapus BA" : `Hanya penginput (${ba.createdBy || "—"}) atau Administrator/Support yang boleh menghapus`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        );
                      })()}
                    </div>
                  </div>

                  {/* BA Content Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    {/* Signatures Panel */}
                    <div className="bg-slate-50 dark:bg-slate-950/40 p-3.5 rounded-xl border border-slate-100 dark:border-slate-850 space-y-2">
                      <p className="font-extrabold text-[10px] text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                        <FileCheck className="w-4 h-4 text-emerald-500" /> Penandatangan Berita Acara
                      </p>
                      <div className="grid grid-cols-2 gap-2 pt-1 font-medium">
                        <div>
                          <p className="text-[9px] text-slate-500 uppercase font-bold">Penandatangan RS</p>
                          <p className="text-slate-700 dark:text-slate-200 truncate">{ba.signatoryRS || "-"}</p>
                        </div>
                        <div>
                          <p className="text-[9px] text-slate-500 uppercase font-bold">Pelaksana/Support</p>
                          <p className="text-slate-700 dark:text-slate-200 truncate">{ba.signatorySupport || "-"}</p>
                        </div>
                      </div>
                    </div>

                    {/* Attachment & Notes */}
                    <div className="bg-slate-50 dark:bg-slate-950/40 p-3.5 rounded-xl border border-slate-101 dark:border-slate-850 flex flex-col justify-between">
                      <div>
                        <p className="font-extrabold text-[10px] text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                          <Files className="w-4 h-4 text-blue-500" /> Tautan Dokumen Lampiran
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-1.5 font-medium">
                          {ba.fileUrl ? (
                            <a 
                              href={ba.fileUrl} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="text-blue-500 dark:text-blue-400 underline font-semibold flex items-center gap-1 hover:text-blue-300"
                            >
                              <Link2 className="w-3.5 h-3.5 inline shrink-0" />
                              <span className="truncate">{ba.fileUrl}</span>
                            </a>
                          ) : (
                            <span className="italic">Tidak ada dokumen terlampir</span>
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Description Notes full-width */}
                    <div className="md:col-span-2 bg-slate-50 dark:bg-slate-950/20 p-3.5 rounded-xl space-y-1.5">
                      <p className="font-extrabold text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Catatan Deskripsi Kegiatan / Deskripsi Singkat Pekerjaan:
                      </p>
                      <p className="text-slate-700 dark:text-slate-300 leading-relaxed font-normal whitespace-pre-wrap">
                        {ba.notes || "-"}
                      </p>
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
                        {d.noID && (
                          <span className="bg-indigo-50 dark:bg-indigo-950 border border-indigo-100 dark:border-indigo-900/40 text-indigo-600 dark:text-indigo-400 text-[9px] font-mono font-extrabold px-2 py-0.5 rounded">
                            ID: {d.noID}
                          </span>
                        )}
                        <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-[9px] font-bold text-slate-650 dark:text-slate-350">
                          {d.category}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => handlePrint(d, 'docs')}
                          className="p-1 text-slate-400 hover:text-indigo-600 transition-all rounded hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                          title="Cetak Arsip Dokumen / Print"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                        {(() => {
                          const canEdit = !d.createdBy || d.createdBy === currentUser?.username || currentUser?.role === "Administrator" || currentUser?.role === "Technical Support" || currentUser?.role === "Direktur";
                          return (
                            <button
                              onClick={() => handleEditDocClick(d)}
                              disabled={!canEdit}
                              className={`p-1 rounded shrink-0 transition-all ${
                                canEdit 
                                  ? "text-slate-400 hover:text-blue-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer" 
                                  : "text-slate-200 dark:text-slate-805 cursor-not-allowed opacity-40"
                              }`}
                              title={canEdit ? "Edit dokumen" : `Hanya penginput (${d.createdBy || "—"}) atau Administrator/Support yang boleh mengedit`}
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          );
                        })()}
                        {(() => {
                          const canDelete = !d.createdBy || d.createdBy === currentUser?.username || currentUser?.role === "Administrator" || currentUser?.role === "Technical Support" || currentUser?.role === "Direktur";
                          return (
                            <button
                              onClick={() => {
                                setDeleteConfirmation({
                                  id: d.id,
                                  type: 'docs',
                                  title: d.title || 'Tautan dokumen ini'
                                });
                              }}
                              disabled={!canDelete}
                              className={`p-1 rounded shrink-0 transition-all ${
                                canDelete 
                                  ? "text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer" 
                                  : "text-slate-200 dark:text-slate-805 cursor-not-allowed opacity-40"
                              }`}
                              title={canDelete ? "Hapus dokumen" : `Hanya penginput (${d.createdBy || "—"}) atau Administrator/Support yang boleh menghapus`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          );
                        })()}
                      </div>
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
                    {d.createdBy && (
                      <div className="mt-2.5 text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded-md border border-indigo-150/10 w-fit">
                        🧑‍💻 Penginput: <strong className="font-extrabold">{d.createdBy}</strong>
                      </div>
                    )}
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
      </>
    )}
  </div>

      {/* MODAL REMOVED: FORM RENDERED INLINE INSTEAD AS REQUESTED */}
      <AnimatePresence>
        {false && isFormOpen && (
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
                    {activeSubTab === 'comm' ? "Buat Log Koordinasi" : activeSubTab === 'mom' ? "Tulis Arsip Notula Rapat (MoM)" : activeSubTab === 'ba' ? "Buat Berita Acara (BA) Baru" : "Arsipkan Tautan Dokumen Baru"}
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
                        onChange={(e) => setCommType(e.target.value)}
                        className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 py-2 px-3 rounded-lg"
                      >
                        {tipeMediaList.map((tm) => (
                          <option key={tm} value={tm}>{tm}</option>
                        ))}
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

              {/* ─ RENDER FORM: BERITA ACARA (BA) LOG ─ */}
              {activeSubTab === 'ba' && (
                <form onSubmit={handleAddBASubmit} className="space-y-3.5 text-xs">
                  <div className="grid grid-cols-2 gap-3.5 text-xs animate-fadeIn">
                    <div className="flex flex-col gap-1 md:col-span-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Judul BA / Nama Kegiatan *</label>
                      <input
                        type="text"
                        required
                        value={baTitle}
                        onChange={(e) => setBaTitle(e.target.value)}
                        placeholder="Contoh: Berita Acara Training Modul Keuangan RS"
                        className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 py-2 px-3 rounded-lg text-slate-800 dark:text-slate-200"
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Nomor Berita Acara (No. BA) *</label>
                      <input
                        type="text"
                        required
                        value={baNo}
                        onChange={(e) => setBaNo(e.target.value)}
                        placeholder="Contoh: 002/BA-KOM/V/2026"
                        className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 py-2 px-3 rounded-lg text-slate-800 dark:text-slate-200"
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Project Terkait</label>
                      <select
                        value={baProj}
                        onChange={(e) => setBaProj(e.target.value)}
                        className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 py-2 px-3 rounded-lg text-slate-800 dark:text-slate-200"
                      >
                        {projects.map(p => <option key={p.kode} value={p.kode}>{p.kode} – {p.nama}</option>)}
                      </select>
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Jenis Berita Acara</label>
                      <select
                        value={baType}
                        onChange={(e) => setBaType(e.target.value)}
                        className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 py-2 px-3 rounded-lg text-slate-800 dark:text-slate-200"
                      >
                        {jenisBeritaAcaraList.map(item => (
                          <option key={item} value={item}>{item}</option>
                        ))}
                      </select>
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Tanggal Kegiatan</label>
                      <input
                        type="date"
                        required
                        value={baDate}
                        onChange={(e) => setBaDate(e.target.value)}
                        className="bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 py-2 px-3 rounded-lg text-slate-800 dark:text-slate-200"
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Penandatangan RS (Pihak 1)</label>
                      <input
                        type="text"
                        value={baSignatoryRS}
                        onChange={(e) => setBaSignatoryRS(e.target.value)}
                        placeholder="Nama & Jabatan representatif RS"
                        className="bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 py-2 px-3 rounded-lg text-slate-800 dark:text-slate-200"
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-slate-505 uppercase tracking-widest">Penandatangan Pelaksana (Pihak 2)</label>
                      <input
                        type="text"
                        value={baSignatorySupport}
                        onChange={(e) => setBaSignatorySupport(e.target.value)}
                        placeholder="Nama staff pelaksana/Support"
                        className="bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 py-2 px-3 rounded-lg text-slate-800 dark:text-slate-200"
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-slate-505 uppercase tracking-widest">Link Attachment Dokumen</label>
                      <input
                        type="url"
                        value={baFileUrl}
                        onChange={(e) => setBaFileUrl(e.target.value)}
                        placeholder="https://drive.google.com/file/d/..."
                        className="bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 py-2 px-3 rounded-lg text-slate-800 dark:text-slate-205"
                      />
                    </div>

                    <div className="flex flex-col gap-1 font-semibold">
                      <label className="text-[10px] font-bold text-slate-505 uppercase tracking-widest">Status Berita Acara</label>
                      <select
                        value={baStatus}
                        onChange={(e) => setBaStatus(e.target.value)}
                        className="bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 py-2 px-3 rounded-lg text-slate-800 dark:text-slate-205"
                      >
                        <option value="Draft">Draft</option>
                        <option value="Signed">Signed (Telah Ditandatangani)</option>
                        <option value="Approved">Approved (Disetujui Pimpinan)</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Catatan / Deskripsi Singkat Berita Acara</label>
                    <textarea
                      rows={3}
                      value={baNotes}
                      onChange={(e) => setBaNotes(e.target.value)}
                      placeholder="Uraian ringkas implementasi, kendala, atau poin tambahan serah terima..."
                      className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 py-2 px-3 rounded-lg text-slate-800 dark:text-slate-200"
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
                      Simpan Berita Acara
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

      <AnimatePresence>
        {deleteConfirmation && (
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4"
            >
              <div className="flex items-center gap-3 text-red-500">
                <div className="p-2 bg-red-50 dark:bg-red-950/30 rounded-lg">
                  <Trash2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                    Konfirmasi Hapus Data
                  </h3>
                  <p className="text-xs text-slate-400">Tindakan ini tidak dapat dibatalkan.</p>
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-950/50 p-3.5 rounded-xl border border-slate-100 dark:border-slate-850">
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Arsip yang akan dihapus:</p>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-1 line-clamp-2">
                  {deleteConfirmation.title}
                </p>
                <p className="text-[10px] font-mono text-slate-500 mt-1 mt-2 block">
                  Kategori: {deleteConfirmation.type === 'comm' ? 'Log Koordinasi' : deleteConfirmation.type === 'mom' ? 'Minutes of Meeting (MoM)' : deleteConfirmation.type === 'ba' ? 'Berita Acara (BA)' : 'Dokumen Repositori'}
                </p>
              </div>

              <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-850 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setDeleteConfirmation(null)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-all font-bold"
                >
                  Batal / Kembali
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    const { id, type } = deleteConfirmation;
                    try {
                      if (type === 'comm') {
                        await onDeleteCommLog(id);
                      } else if (type === 'mom') {
                        await onDeleteMeetingLog(id);
                      } else if (type === 'ba') {
                        if (onDeleteBALog) await onDeleteBALog(id);
                      } else if (type === 'docs') {
                        await onDeleteDoc(id);
                      }
                    } catch (err: any) {
                      alert("Gagal menghapus data: " + err.message);
                    } finally {
                      setDeleteConfirmation(null);
                    }
                  }}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg hover:shadow-lg transition-all font-bold"
                >
                  Ya, Hapus Permanen
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
