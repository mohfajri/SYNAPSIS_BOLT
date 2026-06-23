import React, { useState, useEffect, useRef } from "react";
import { 
  Building, 
  MapPin, 
  Phone, 
  Printer, 
  Globe, 
  Upload, 
  Save, 
  AlertTriangle, 
  CheckCircle, 
  FileText, 
  RefreshCw, 
  Image as ImageIcon,
  Users,
  Mail
} from "lucide-react";
import { CompanyProfile, User } from "../types";
import { api } from "../lib/api";

interface CompanyProfileViewProps {
  currentUser: User | null;
}

export default function CompanyProfileView({ currentUser }: CompanyProfileViewProps) {
  const [profile, setProfile] = useState<CompanyProfile>({
    id: "default",
    nama: "",
    alamat: "",
    telepon: "",
    fax: "",
    web: "",
    email: "",
    logoUrl: ""
  });
  
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState<boolean>(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch company profile on load
  useEffect(() => {
    fetchProfile();
  }, []);

  async function fetchProfile() {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const data = await api.getCompanyProfile();
      if (data) {
        setProfile(data);
      }
    } catch (err: any) {
      console.error("Gagal memuat profil perusahaan:", err);
      setErrorMsg("Gagal memuat data profil perusahaan dari server.");
    } finally {
      setIsLoading(false);
    }
  }

  // Handle value change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfile(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Process and validate logo upload
  const handleLogoFile = (file: File) => {
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith("image/")) {
      setErrorMsg("Berkas harus berupa gambar (PNG, JPG, atau WEBP).");
      return;
    }
    
    // Validate file size (max 800KB for Base64 storage)
    if (file.size > 800 * 1024) {
      setErrorMsg("Logo terlalu besar! Disarankan ukuran maksimal adalah 800 KB agar performa aplikasi tetap optimal.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setProfile(prev => ({
          ...prev,
          logoUrl: reader.result as string
        }));
        setErrorMsg(null);
      }
    };
    reader.onerror = () => {
      setErrorMsg("Gagal membaca berkas logo.");
    };
    reader.readAsDataURL(file);
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
      handleLogoFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleLogoFile(e.target.files[0]);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const removeLogo = () => {
    setProfile(prev => ({
      ...prev,
      logoUrl: ""
    }));
  };

  // Save changes
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    
    // Check authorizations (Hanya Administrator yang diperbolehkan mengupdate)
    const isAuthorized = currentUser?.role === "Administrator";
    if (!isAuthorized) {
      setErrorMsg("Akses Ditolak: Hanya Administrator yang diizinkan untuk mengubah profil perusahaan.");
      setIsSaving(false);
      return;
    }

    if (!profile.nama.trim()) {
      setErrorMsg("Nama Perusahaan wajib diisi.");
      setIsSaving(false);
      return;
    }

    try {
      const updated = await api.updateCompanyProfile(profile);
      if (updated) {
        setProfile(updated);
        setSuccessMsg("Profil Perusahaan berhasil disimpan secara permanen!");
        // Emit storage update for other open components to react instantly
        window.dispatchEvent(new Event("companyProfileUpdated"));
        setTimeout(() => setSuccessMsg(null), 5000);
      }
    } catch (err: any) {
      console.error("Gagal menyimpan profil perusahaan:", err);
      setErrorMsg(err.message || "Gagal menyimpan rincian profil perusahaan ke backend.");
    } finally {
      setIsSaving(false);
    }
  };

  const isAuthorized = currentUser?.role === "Administrator";

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-3 font-sans" id="company-profile-loading">
        <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
        <p className="text-sm text-slate-500 font-medium">Memuat data Profil Core Perusahaan...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans" id="company-profile-container">
      {/* Header View */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-200/60 dark:border-slate-800 pb-5 gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-2 tracking-tight">
            <Building className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            Profil Perusahaan
          </h1>
          <p className="text-xs md:text-sm text-slate-500 mt-1 dark:text-slate-400 leading-relaxed max-w-2xl">
            Kelola rincian identitas korporasi, logo resmi, alamat, telf, web, serta fax. Data ini akan disinkronisasikan 
            secara dinamis ke dalam penandatanganan dokumen Berita Acara (BA), invoice penagihan KSO, serta cetakan laporan lainnya.
          </p>
        </div>
        <div className="text-[10px] bg-indigo-50 dark:bg-indigo-950/40 text-indigo-650 dark:text-indigo-300 px-3 py-1.5 rounded-lg border border-indigo-100 dark:border-indigo-900/60 font-bold self-stretch md:self-auto flex items-center gap-1">
          <Building className="w-3.5 h-3.5 shrink-0" />
          KSO & Enterprise Partner
        </div>
      </div>

      {/* Main Grid Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Form Editor */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-150 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-emerald-500" /> Formulir Identitas Resmi
            </h3>
            {!isAuthorized && (
              <span className="text-[10px] bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-300 px-2 py-1 rounded font-bold border border-rose-100 dark:border-rose-900/30">
                Mode Membaca Saja
              </span>
            )}
          </div>

          <form onSubmit={handleSave} className="space-y-5">
            {errorMsg && (
              <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 rounded-xl flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-450 shrink-0 mt-0.5" />
                <p className="text-xs text-rose-700 dark:text-rose-300">{errorMsg}</p>
              </div>
            )}

            {successMsg && (
              <div className="p-3.5 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-900/30 rounded-xl flex items-start gap-2 animate-fade-in">
                <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-450 shrink-0 mt-0.5" />
                <p className="text-xs text-emerald-800 dark:text-emerald-300">{successMsg}</p>
              </div>
            )}

            {/* Logo Management */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest block">Logo Perusahaan (Aspek Kotak/Horizontal)</label>
              
              <div className="flex flex-col sm:flex-row gap-4 items-center">
                {/* Image preview box */}
                <div className="w-32 h-32 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-center overflow-hidden shrink-0 group relative shadow-inner">
                  {profile.logoUrl ? (
                    <>
                      <img 
                        src={profile.logoUrl} 
                        alt="Logo Preview" 
                        className="w-full h-full object-contain p-2"
                        referrerPolicy="no-referrer"
                      />
                      {isAuthorized && (
                        <button
                          type="button"
                          onClick={removeLogo}
                          className="absolute inset-0 bg-rose-600/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-150 cursor-pointer text-xs font-bold font-sans"
                        >
                          Hapus Logo
                        </button>
                      )}
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-slate-400 p-2 text-center text-[10px] gap-1">
                      <ImageIcon className="w-8 h-8 text-slate-300 dark:text-slate-700" />
                      <span>Belum Ada Logo</span>
                    </div>
                  )}
                </div>

                {isAuthorized ? (
                  /* Drag & Drop Area */
                  <div 
                    onDragEnter={handleDrag}
                    onDragOver={handleDrag}
                    onDragLeave={handleDrag}
                    onDrop={handleDrop}
                    onClick={triggerFileInput}
                    className={`flex-1 w-full h-32 border-2 border-dashed rounded-xl flex flex-col items-center justify-center p-4 text-center cursor-pointer transition-colors ${
                      dragActive 
                        ? "border-indigo-500 bg-indigo-50/20 dark:bg-indigo-950/10" 
                        : "border-slate-200 dark:border-slate-800 hover:border-slate-350 dark:hover:border-slate-755 hover:bg-slate-50/50 dark:hover:bg-slate-950/20"
                    }`}
                  >
                    <Upload className="w-5 h-5 text-slate-400 mb-1" />
                    <p className="text-[11.5px] font-bold text-slate-700 dark:text-slate-300">
                      Klik untuk unggah atau seret file ke sini
                    </p>
                    <p className="text-[10px] text-slate-450 mt-1 leading-relaxed">
                      Format PNG, JPG, atau WEBP (Maksimal 800 KB). Logo transparansi sangat direkomendasikan.
                    </p>
                    <input 
                      ref={fileInputRef}
                      type="file" 
                      accept="image/*"
                      onChange={handleFileInputChange}
                      className="hidden" 
                    />
                  </div>
                ) : (
                  <div className="flex-1 text-xs text-slate-500 dark:text-slate-400 italic">
                    Logo resmi di atas digunakan untuk kop surat penomoran dinas dan Berita Acara (BA). Hubungi Administrator untuk melakukan revisi gambar.
                  </div>
                )}
              </div>
            </div>

            {/* Inputs Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Nama Perusahaan */}
              <div className="md:col-span-2 space-y-1">
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest block">Nama Resmi Perusahaan *</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none !bg-transparent !border-none !shadow-none">
                    <Building className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                  </div>
                  <input
                    type="text"
                    name="nama"
                    value={profile.nama}
                    onChange={handleChange}
                    disabled={!isAuthorized}
                    placeholder="Contoh: PT. Medika KSO Syanapsis"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100/50 dark:hover:bg-slate-950/80 focus:bg-white dark:focus:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-100 transition-all outline-none"
                  />
                </div>
              </div>

              {/* Alamat (Colspan 2) */}
              <div className="md:col-span-2 space-y-1">
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest block">Alamat Kantor Pusat / Korespondensi</label>
                <div className="relative">
                  <div className="absolute top-2.5 left-3 pointer-events-none !bg-transparent !border-none !shadow-none">
                    <MapPin className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                  </div>
                  <textarea
                    rows={3}
                    name="alamat"
                    value={profile.alamat}
                    onChange={handleChange}
                    disabled={!isAuthorized}
                    placeholder="Alamat rincian kantor, nomor gedung, kelurahan, kecamatan, kota, kode pos."
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100/50 dark:hover:bg-slate-950/80 focus:bg-white dark:focus:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-100 transition-all outline-none resize-none leading-relaxed"
                  />
                </div>
              </div>

              {/* No Telepon */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest block">Nomor Telepon Kantor</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none !bg-transparent !border-none !shadow-none">
                    <Phone className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                  </div>
                  <input
                    type="text"
                    name="telepon"
                    value={profile.telepon}
                    onChange={handleChange}
                    disabled={!isAuthorized}
                    placeholder="Contoh: 021-5228585"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100/50 dark:hover:bg-slate-950/80 focus:bg-white dark:focus:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-100 transition-all outline-none"
                  />
                </div>
              </div>

              {/* No Fax */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest block">Nomor Fax</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none !bg-transparent !border-none !shadow-none">
                    <Printer className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                  </div>
                  <input
                    type="text"
                    name="fax"
                    value={profile.fax}
                    onChange={handleChange}
                    disabled={!isAuthorized}
                    placeholder="Contoh: 021-5228586"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100/50 dark:hover:bg-slate-950/80 focus:bg-white dark:focus:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-100 transition-all outline-none"
                  />
                </div>
              </div>

              {/* Website URL */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest block">Situs Resmi / Web Perusahaan</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none !bg-transparent !border-none !shadow-none">
                    <Globe className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                  </div>
                  <input
                    type="text"
                    name="web"
                    value={profile.web}
                    onChange={handleChange}
                    disabled={!isAuthorized}
                    placeholder="Contoh: https://medika-partner.co.id"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100/50 dark:hover:bg-slate-950/80 focus:bg-white dark:focus:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-100 transition-all outline-none"
                  />
                </div>
              </div>

              {/* Alamat Email Perusahaan */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest block">Alamat Email Perusahaan</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none !bg-transparent !border-none !shadow-none">
                    <Mail className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                  </div>
                  <input
                    type="email"
                    name="email"
                    value={profile.email || ""}
                    onChange={handleChange}
                    disabled={!isAuthorized}
                    placeholder="Contoh: info@syanapsis.taskhub.co.id"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100/50 dark:hover:bg-slate-950/80 focus:bg-white dark:focus:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-100 transition-all outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Actions Panel */}
            {isAuthorized && (
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-md shadow-indigo-500/10 hover:shadow-indigo-500/15 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Menyimpan Rincian...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Simpan Profil Perusahaan</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </form>
        </div>

        {/* Right Column: Visualizer Preview */}
        <div className="lg:col-span-5 flex flex-col space-y-6">
          
          {/* Box 1: Live Letterhead / Berita Acara header simulation */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-150 flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-800 pb-3 uppercase tracking-wide">
              👁️ Kop Surat & BA Live Preview
            </h3>
            
            <p className="text-[10.5px] text-slate-500 leading-relaxed">
              Berikut adalah visualisasi bagaimana data di sebelah kiri otomatis diatur sebagai identitas kop surat resmi Berita Acara & Dokumen Legal KSO:
            </p>

            {/* Simulated Envelope Letterhead paper */}
            <div className="border border-slate-300 dark:border-slate-700 p-4 rounded-xl bg-slate-50 dark:bg-slate-950 space-y-4 shadow-inner relative overflow-hidden font-sans">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 via-indigo-600 to-emerald-500" />
              
              {/* Document Header Section */}
              <div className="flex gap-3 items-center border-b-[2px] border-slate-800 dark:border-slate-650 pb-3">
                {/* Logo */}
                <div className="w-12 h-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center rounded-lg overflow-hidden p-1 shrink-0">
                  {profile.logoUrl ? (
                    <img 
                      src={profile.logoUrl} 
                      alt="Mini Logo" 
                      className="w-full h-full object-contain"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <Building className="w-6 h-6 text-slate-400" />
                  )}
                </div>

                {/* Meta details */}
                <div className="flex-1 space-y-0.5">
                  <h4 className="text-[11px] font-black text-slate-900 dark:text-slate-100 uppercase tracking-tight leading-none leading-relaxed">
                    {profile.nama || "PT. MEDIKA KSO SYANAPSIS"}
                  </h4>
                  <p className="text-[7.5px] text-slate-600 dark:text-slate-400 font-medium leading-normal">
                    {profile.alamat || "Gedung Cyber 2 Lantai 18, Jl. H.R. Rasuna Said Blok X-5 No. 13, Kuningan Timur, Jakarta Selatan"}
                  </p>
                  <div className="text-[7.5px] text-slate-500 dark:text-slate-450 font-medium leading-relaxed flex flex-wrap gap-x-3 gap-y-0.5 items-center mt-1">
                    {profile.telepon && (
                      <span className="flex items-center gap-1">
                        <Phone className="w-2.5 h-2.5 text-indigo-500 shrink-0" />
                        <span>Tlp. {profile.telepon}</span>
                      </span>
                    )}
                    {profile.fax && (
                      <span className="flex items-center gap-1">
                        <Printer className="w-2.5 h-2.5 text-emerald-500 shrink-0" />
                        <span>Fax. {profile.fax}</span>
                      </span>
                    )}
                    {profile.web && (
                      <span className="flex items-center gap-1">
                        <Globe className="w-2.5 h-2.5 text-blue-500 shrink-0" />
                        <span className="underline select-all">{profile.web}</span>
                      </span>
                    )}
                    {profile.email && (
                      <span className="flex items-center gap-1">
                        <Mail className="w-2.5 h-2.5 text-rose-500 shrink-0" />
                        <span className="underline select-all">{profile.email}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Doc Body Placeholder */}
              <div className="space-y-2 py-1 select-none">
                <div className="text-[9px] font-bold text-slate-700 dark:text-slate-350 text-center uppercase tracking-wider">
                  BERITA ACARA SERAH TERIMA & KELAYAKAN
                </div>
                <div className="text-[7px] text-slate-550 dark:text-slate-450 text-center font-mono">
                  No BA: BA/ST/SIMRS/2026/01229
                </div>
                
                {/* Simulated paragraphs */}
                <div className="space-y-1.5 mt-2">
                  <div className="h-1.5 bg-slate-200 dark:bg-slate-800 rounded w-full" />
                  <div className="h-1.5 bg-slate-200 dark:bg-slate-800 rounded w-5/6" />
                  <div className="h-1.5 bg-slate-200 dark:bg-slate-800 rounded w-4/5" />
                </div>
              </div>
            </div>
          </div>

          {/* Box 2: System Integration Guidelines */}
          <div className="bg-slate-50 dark:bg-slate-900/30 border border-slate-200/65 dark:border-slate-850 p-6 rounded-2xl space-y-3">
            <h4 className="font-bold text-xs text-indigo-750 dark:text-indigo-400 uppercase tracking-widest flex items-center gap-1">
              💼 Alur Integrasi Otomatis
            </h4>
            
            <ul className="space-y-2 text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed list-disc list-inside">
              <li>
                <strong className="text-slate-800 dark:text-slate-200">Invoice Tagihan KSO/ATK</strong>: Bidang Pihak Kedua secara otomatis dinamai dan disesuaikan dengan nama serta logo perusahaan resmi yang diketik di modul ini.
              </li>
              <li>
                <strong className="text-slate-800 dark:text-slate-200">Arsip Berita Acara (BA)</strong>: Pencetakan Berita Acara resmi (serah terima, UAT, progress) akan menyisipkan Kop Surat & rincian Pihak Kedua ini secara real-time.
              </li>
              <li>
                <strong className="text-slate-800 dark:text-slate-200">Laporan Bulanan</strong>: Integran logo digunakan untuk mencap dan menandatangani dokumen rekap penagihan.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
