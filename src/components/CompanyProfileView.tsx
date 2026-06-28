import React, { useState, useEffect, useRef } from "react";
import { Building, MapPin, Phone, Printer, Globe, Upload, Save, TriangleAlert as AlertTriangle, CircleCheck as CheckCircle, FileText, RefreshCw, Image as ImageIcon, Mail } from "lucide-react";
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

  useEffect(() => {
    fetchProfile();
  }, []);

  async function fetchProfile() {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const data = await api.getCompanyProfile();
      if (data) setProfile(data);
    } catch (err: any) {
      setErrorMsg("Gagal memuat data profil perusahaan.");
    } finally {
      setIsLoading(false);
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  const handleLogoFile = (file: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setErrorMsg("Berkas harus berupa gambar.");
      return;
    }
    if (file.size > 800 * 1024) {
      setErrorMsg("Logo terlalu besar! Maksimal 800 KB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setProfile(prev => ({ ...prev, logoUrl: reader.result }));
        setErrorMsg(null);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) handleLogoFile(e.dataTransfer.files[0]);
  };

  const triggerFileInput = () => fileInputRef.current?.click();
  const removeLogo = () => setProfile(prev => ({ ...prev, logoUrl: "" }));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    
    const isAuthorized = currentUser?.role === "Administrator";
    if (!isAuthorized) {
      setErrorMsg("Hanya Administrator yang dapat mengubah profil.");
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
        setSuccessMsg("Profil berhasil disimpan!");
        window.dispatchEvent(new Event("companyProfileUpdated"));
        setTimeout(() => setSuccessMsg(null), 5000);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Gagal menyimpan profil.");
    } finally {
      setIsSaving(false);
    }
  };

  const isAuthorized = currentUser?.role === "Administrator";

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-3">
        <RefreshCw className="w-6 h-6 text-neutral-500 animate-spin" />
        <p className="text-sm text-neutral-400">Memuat data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-neutral-200 dark:border-neutral-800 pb-4 gap-4">
        <div>
          <h1 className="text-xl font-medium text-neutral-900 dark:text-white flex items-center gap-2">
            <Building className="w-5 h-5 text-neutral-500" />
            Profil Perusahaan
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
            Kelola identitas korporasi untuk kop surat dan dokumen resmi.
          </p>
        </div>
        {!isAuthorized && (
          <span className="text-[11px] bg-neutral-100 dark:bg-neutral-800 text-neutral-500 px-3 py-1 rounded-lg">
            Mode Baca Saja
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Form */}
        <div className="lg:col-span-7 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-6 rounded-xl space-y-5">
          <form onSubmit={handleSave} className="space-y-5">
            {errorMsg && (
              <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 rounded-xl flex items-start gap-2 text-red-600 text-sm">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 rounded-xl flex items-start gap-2 text-emerald-600 text-sm">
                <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Logo */}
            <div className="space-y-2">
              <label className="text-[11px] font-medium text-neutral-500 block">Logo Perusahaan</label>
              <div className="flex flex-col sm:flex-row gap-4 items-center">
                <div className="w-28 h-28 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center overflow-hidden shrink-0 group relative">
                  {profile.logoUrl ? (
                    <>
                      <img src={profile.logoUrl} alt="Logo" className="w-full h-full object-contain p-2" referrerPolicy="no-referrer" />
                      {isAuthorized && (
                        <button type="button" onClick={removeLogo} className="absolute inset-0 bg-neutral-900/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs font-medium">
                          Hapus
                        </button>
                      )}
                    </>
                  ) : (
                    <ImageIcon className="w-8 h-8 text-neutral-300" />
                  )}
                </div>

                {isAuthorized ? (
                  <div 
                    onDragEnter={handleDrag}
                    onDragOver={handleDrag}
                    onDragLeave={handleDrag}
                    onDrop={handleDrop}
                    onClick={triggerFileInput}
                    className={`flex-1 w-full h-28 border-2 border-dashed rounded-xl flex flex-col items-center justify-center p-4 text-center cursor-pointer transition-colors ${
                      dragActive ? "border-neutral-900 bg-neutral-50" : "border-neutral-200 dark:border-neutral-800 hover:border-neutral-400"
                    }`}
                  >
                    <Upload className="w-5 h-5 text-neutral-400 mb-1" />
                    <p className="text-sm text-neutral-600 dark:text-neutral-300 font-medium">Klik atau seret file</p>
                    <p className="text-[11px] text-neutral-400">PNG, JPG, WEBP (max 800KB)</p>
                    <input ref={fileInputRef} type="file" accept="image/*" onChange={(e) => e.target.files && handleLogoFile(e.target.files[0])} className="hidden" />
                  </div>
                ) : (
                  <div className="flex-1 text-sm text-neutral-400">
                    Hubungi Administrator untuk mengubah logo.
                  </div>
                )}
              </div>
            </div>

            {/* Inputs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="text-[11px] font-medium text-neutral-500 block mb-1">Nama Perusahaan *</label>
                <input
                  type="text" name="nama" value={profile.nama}
                  onChange={handleChange} disabled={!isAuthorized}
                  placeholder="PT. ..."
                  className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-sm text-neutral-800 dark:text-neutral-200 focus:outline-none focus:border-neutral-400 transition-colors"
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-[11px] font-medium text-neutral-500 block mb-1">Alamat</label>
                <textarea
                  rows={3} name="alamat" value={profile.alamat}
                  onChange={handleChange} disabled={!isAuthorized}
                  placeholder="Alamat lengkap..."
                  className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-sm text-neutral-800 dark:text-neutral-200 focus:outline-none focus:border-neutral-400 transition-colors resize-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-neutral-500 block mb-1">Telepon</label>
                <input
                  type="text" name="telepon" value={profile.telepon}
                  onChange={handleChange} disabled={!isAuthorized}
                  placeholder="021-..."
                  className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-sm text-neutral-800 dark:text-neutral-200 focus:outline-none focus:border-neutral-400 transition-colors"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-neutral-500 block mb-1">Fax</label>
                <input
                  type="text" name="fax" value={profile.fax}
                  onChange={handleChange} disabled={!isAuthorized}
                  placeholder="021-..."
                  className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-sm text-neutral-800 dark:text-neutral-200 focus:outline-none focus:border-neutral-400 transition-colors"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-neutral-500 block mb-1">Website</label>
                <input
                  type="text" name="web" value={profile.web}
                  onChange={handleChange} disabled={!isAuthorized}
                  placeholder="https://..."
                  className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-sm text-neutral-800 dark:text-neutral-200 focus:outline-none focus:border-neutral-400 transition-colors"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-neutral-500 block mb-1">Email</label>
                <input
                  type="email" name="email" value={profile.email || ""}
                  onChange={handleChange} disabled={!isAuthorized}
                  placeholder="info@..."
                  className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-sm text-neutral-800 dark:text-neutral-200 focus:outline-none focus:border-neutral-400 transition-colors"
                />
              </div>
            </div>

            {isAuthorized && (
              <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800 flex justify-end">
                <button
                  type="submit" disabled={isSaving}
                  className="px-5 py-2.5 bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-neutral-900 font-medium rounded-xl text-sm flex items-center gap-2 transition-colors disabled:opacity-50"
                >
                  {isSaving ? (
                    <><RefreshCw className="w-4 h-4 animate-spin" /> Menyimpan...</>
                  ) : (
                    <><Save className="w-4 h-4" /> Simpan Profil</>
                  )}
                </button>
              </div>
            )}
          </form>
        </div>

        {/* Preview */}
        <div className="lg:col-span-5 flex flex-col space-y-5">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-5 rounded-xl space-y-4">
            <h3 className="font-medium text-sm text-neutral-800 dark:text-white pb-3 border-b border-neutral-100 dark:border-neutral-800">
              Preview Kop Surat
            </h3>
            
            <div className="border border-neutral-200 dark:border-neutral-800 p-4 rounded-xl bg-neutral-50 dark:bg-neutral-950 space-y-4 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-neutral-900 dark:bg-white" />
              
              <div className="flex gap-3 items-center border-b-2 border-neutral-800 dark:border-neutral-600 pb-3">
                <div className="w-10 h-10 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 flex items-center justify-center rounded-lg overflow-hidden p-1 shrink-0">
                  {profile.logoUrl ? (
                    <img src={profile.logoUrl} alt="Logo" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                  ) : (
                    <Building className="w-5 h-5 text-neutral-400" />
                  )}
                </div>

                <div className="flex-1 space-y-0.5">
                  <h4 className="text-[11px] font-semibold text-neutral-900 dark:text-white uppercase">
                    {profile.nama || "PT. MEDIKA KSO"}
                  </h4>
                  <p className="text-[10px] text-neutral-500 dark:text-neutral-400">
                    {profile.alamat || "Alamat belum diisi"}
                  </p>
                  <div className="text-[10px] text-neutral-400 flex flex-wrap gap-x-2 gap-y-0.5">
                    {profile.telepon && <span>Tlp. {profile.telepon}</span>}
                    {profile.fax && <span>Fax. {profile.fax}</span>}
                    {profile.web && <span className="underline">{profile.web}</span>}
                    {profile.email && <span className="underline">{profile.email}</span>}
                  </div>
                </div>
              </div>

              <div className="space-y-1.5 py-1 select-none">
                <div className="text-[9px] font-medium text-neutral-700 dark:text-neutral-300 text-center uppercase">
                  BERITA ACARA SERAH TERIMA
                </div>
                <div className="text-[7px] text-neutral-400 text-center font-mono">
                  No BA: BA/ST/2026/001
                </div>
                <div className="space-y-1 mt-2">
                  <div className="h-1 bg-neutral-200 dark:bg-neutral-800 rounded w-full" />
                  <div className="h-1 bg-neutral-200 dark:bg-neutral-800 rounded w-5/6" />
                  <div className="h-1 bg-neutral-200 dark:bg-neutral-800 rounded w-4/5" />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-neutral-50 dark:bg-neutral-900/30 border border-neutral-200 dark:border-neutral-800 p-5 rounded-xl space-y-2">
            <h4 className="font-medium text-xs text-neutral-700 dark:text-neutral-300">
              Integrasi Otomatis
            </h4>
            <ul className="space-y-1.5 text-[12px] text-neutral-500 dark:text-neutral-400 leading-relaxed list-disc list-inside">
              <li>Invoice dan penagihan KSO</li>
              <li>Arsip Berita Acara (BA)</li>
              <li>Laporan bulanan</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
