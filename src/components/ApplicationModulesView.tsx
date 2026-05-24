import React, { useState, useEffect } from "react";
import { AppModule, SubModule, Client, Project, User } from "../types";
import { 
  Cpu, 
  Plus, 
  Trash2, 
  Layers, 
  Calendar, 
  ChevronDown, 
  ChevronUp, 
  CornerDownRight, 
  Code, 
  Edit, 
  CheckCircle2, 
  Hourglass,
  ListPlus,
  Search,
  Download,
  FileText,
  Presentation,
  Globe,
  Image as ImageIcon,
  ExternalLink,
  ChevronLeft,
  X,
  PlusCircle,
  FileCheck
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface ApplicationModulesViewProps {
  appModules: AppModule[];
  clients: Client[];
  projects: Project[];
  currentUser: User | null;
  settings?: any;
  onAddModule: (module: Partial<AppModule>) => Promise<void>;
  onUpdateModule: (id: string, module: Partial<AppModule>) => Promise<void>;
  onDeleteModule: (id: string) => Promise<void>;
}

export default function ApplicationModulesView({
  appModules = [],
  clients = [],
  projects = [],
  currentUser,
  settings,
  onAddModule,
  onUpdateModule,
  onDeleteModule
}: ApplicationModulesViewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterProject, setFilterProject] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [expandedModuleIds, setExpandedModuleIds] = useState<Record<string, boolean>>({});

  // Inline Form toggle & configuration
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState("");

  // AppModule form states
  const [projectName, setProjectName] = useState("");
  const [noModul, setNoModul] = useState("");
  const [name, setName] = useState("");
  const [jenisModul, setJenisModul] = useState("");
  const [jenisAplikasiModul, setJenisAplikasiModul] = useState("");
  const [platformModul, setPlatformModul] = useState("");
  const [docFileName, setDocFileName] = useState("");
  const [docFileData, setDocFileData] = useState("");
  const [pptFileName, setPptFileName] = useState("");
  const [pptFileData, setPptFileData] = useState("");
  const [url, setUrl] = useState("");
  const [releaseDate, setReleaseDate] = useState("");
  const [statusModul, setStatusModul] = useState("");
  const [pic, setPic] = useState("");

  // Fitur Modul (SubModules List in Form State)
  const [subModules, setSubModules] = useState<SubModule[]>([]);

  // Temp Fitur Modul creation/edit form states
  const [subNoFeature, setSubNoFeature] = useState("");
  const [subName, setSubName] = useState("");
  const [subDesc, setSubDesc] = useState("");
  const [subImageName, setSubImageName] = useState("");
  const [subImageData, setSubImageData] = useState("");
  const [subReleaseDate, setSubReleaseDate] = useState("");
  const [subStatus, setSubStatus] = useState("");

  // Direct Inline Fitur Modul addition states
  const [inlineAddId, setInlineAddId] = useState("");
  const [directFieldName, setDirectFieldName] = useState("");
  const [directFieldDesc, setDirectFieldDesc] = useState("");
  const [directFieldImageName, setDirectFieldImageName] = useState("");
  const [directFieldImageData, setDirectFieldImageData] = useState("");
  const [directFieldReleaseDate, setDirectFieldReleaseDate] = useState(new Date().toISOString().slice(0, 10));
  const [directFieldStatus, setDirectFieldStatus] = useState("Aktif");
  const [showInlineFormId, setShowInlineFormId] = useState<string | null>(null);

  // Image zoom lightbox
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);
  const [lightboxTitle, setLightboxTitle] = useState("");

  // Dynamic references
  const projectList = projects.map(p => p.nama);
  const hospitalList = clients.map(c => c.namaRS);
  const allRefs = Array.from(new Set([...projectList, ...hospitalList, "Global Module"]));

  // Load configuration options from System Settings with robust defaults
  const getJenisModulOptions = () => {
    const fromSettings = (settings?.jenisModul || [])
      .filter((x: any) => x.active)
      .map((x: any) => x.value);
    return fromSettings.length > 0 ? fromSettings : ["Front Office", "Back Office", "Bridging"];
  };

  const getJenisAplikasiModulOptions = () => {
    const fromSettings = (settings?.jenisAplikasiModul || [])
      .filter((x: any) => x.active)
      .map((x: any) => x.value);
    return fromSettings.length > 0 ? fromSettings : ["Web", "Mobile"];
  };

  const getPlatformModulOptions = () => {
    const fromSettings = (settings?.platformModul || [])
      .filter((x: any) => x.active)
      .map((x: any) => x.value);
    return fromSettings.length > 0 ? fromSettings : ["Desktop", "Web"];
  };

  const getStatusModulOptions = () => {
    const fromSettings = (settings?.statusModul || [])
      .filter((x: any) => x.active)
      .map((x: any) => x.value);
    return fromSettings.length > 0 ? fromSettings : ["Aktif", "Non Aktif", "Dalam Pengembangan"];
  };

  // Direct Inline Fitur Modul helpers
  const handleInlineFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setDirectFieldImageName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setDirectFieldImageData(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAddFeatureDirectly = async (moduleItem: AppModule) => {
    if (!directFieldName.trim()) {
      alert("Nama Fitur Modul wajib diisi!");
      return;
    }
    if (!directFieldDesc.trim()) {
      alert("Detail Keterangan Modul wajib diisi!");
      return;
    }

    const nextFeatureNo = String((moduleItem.subModules || []).length + 1).padStart(3, "0");
    const newSub: SubModule = {
      id: "feature-" + Math.random().toString(36).slice(2, 9),
      noFeature: nextFeatureNo,
      name: directFieldName.trim(),
      featureDesc: directFieldDesc.trim(),
      imageFileName: directFieldImageName,
      imageFileData: directFieldImageData,
      releaseDate: directFieldReleaseDate || new Date().toISOString().slice(0, 10),
      status: directFieldStatus || "Aktif"
    };

    const updatedSubModules = [...(moduleItem.subModules || []), newSub];
    try {
      await onUpdateModule(moduleItem.id, { subModules: updatedSubModules });
      // Reset inline addition state
      setDirectFieldName("");
      setDirectFieldDesc("");
      setDirectFieldImageName("");
      setDirectFieldImageData("");
      setDirectFieldReleaseDate(new Date().toISOString().slice(0, 10));
      setDirectFieldStatus("Aktif");
      setInlineAddId("");
      setShowInlineFormId(null);
    } catch (err: any) {
      alert(`Gagal mendaftarkan rilis fitur baru: ${err.message}`);
    }
  };

  const handleDeleteFeatureDirectly = async (moduleItem: AppModule, featureId: string) => {
    if (confirm("Apakah Anda yakin ingin menghapus rilis fitur modul ini?")) {
      const updatedSubModules = (moduleItem.subModules || []).filter(sub => sub.id !== featureId);
      try {
        await onUpdateModule(moduleItem.id, { subModules: updatedSubModules });
      } catch (err: any) {
        alert(`Gagal menghapus fitur rilis: ${err.message}`);
      }
    }
  };

  // Auto-generate 3-digit sequential number for No Modul
  const generateNextNoModul = () => {
    const numericList = appModules
      .map(m => parseInt(m.noModul || "0", 10))
      .filter(num => !isNaN(num) && num > 0);
    const maxNum = numericList.length > 0 ? Math.max(...numericList) : 0;
    return String(maxNum + 1).padStart(3, "0");
  };

  // Auto-generate 3-digit sequential number for No Fitur Modul
  const generateNextNoFeature = () => {
    const currentCount = subModules.length;
    return String(currentCount + 1).padStart(3, "0");
  };

  // Sync auto fit number whenever child modules size changes
  useEffect(() => {
    if (isFormOpen) {
      setSubNoFeature(generateNextNoFeature());
    }
  }, [subModules, isFormOpen]);

  const toggleExpand = (id: string) => {
    setExpandedModuleIds(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Handle open registration in inline block form
  const handleOpenNew = () => {
    const autoNo = generateNextNoModul();
    
    setProjectName("SIMRS Aset");
    setNoModul(autoNo);
    setName("");
    
    const jenisModVal = getJenisModulOptions();
    setJenisModul(jenisModVal[0] || "");

    const jenisAppVal = getJenisAplikasiModulOptions();
    setJenisAplikasiModul(jenisAppVal[0] || "");

    const platformVal = getPlatformModulOptions();
    setPlatformModul(platformVal[0] || "");

    setDocFileName("");
    setDocFileData("");
    setPptFileName("");
    setPptFileData("");
    setUrl("");
    setReleaseDate(new Date().toISOString().slice(0, 10));

    const statusVal = getStatusModulOptions();
    setStatusModul(statusVal[0] || "");

    setPic(currentUser?.name || currentUser?.username || "System");
    setSubModules([]);

    // Clear child temporary entries
    setSubName("");
    setSubDesc("");
    setSubImageName("");
    setSubImageData("");
    setSubReleaseDate(new Date().toISOString().slice(0, 10));
    setSubStatus(statusVal[0] || "");

    setIsEditing(false);
    setIsFormOpen(true);

    // Scroll smoothly to form view
    setTimeout(() => {
      document.getElementById("module-input-form-layout")?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  // Handle open edit module in inline block form
  const handleOpenEdit = (am: AppModule) => {
    setProjectName(am.projectName || "SIMRS Aset");
    setNoModul(am.noModul || String(appModules.indexOf(am) + 1).padStart(3, "0"));
    setName(am.name || "");
    
    const jenisModOpts = getJenisModulOptions();
    setJenisModul(am.jenisModul || am.type || jenisModOpts[0]);

    const jenisAppOpts = getJenisAplikasiModulOptions();
    setJenisAplikasiModul(am.jenisAplikasiModul || jenisAppOpts[0]);

    const platformOpts = getPlatformModulOptions();
    setPlatformModul(am.platformModul || platformOpts[0]);

    setDocFileName(am.docFileName || "");
    setDocFileData(am.docFileData || "");
    setPptFileName(am.pptFileName || "");
    setPptFileData(am.pptFileData || "");
    setUrl(am.url || "");
    setReleaseDate(am.releaseDate || am.implementationDate || new Date().toISOString().slice(0, 10));

    const statusModOpts = getStatusModulOptions();
    setStatusModul(am.statusModul || am.implementationStatus || statusModOpts[0]);

    setPic(am.pic || currentUser?.name || currentUser?.username || "System");
    setSubModules(am.subModules || []);
    setEditId(am.id);

    // Clear child temporary state
    setSubName("");
    setSubDesc("");
    setSubImageName("");
    setSubImageData("");
    setSubReleaseDate(new Date().toISOString().slice(0, 10));
    setSubStatus(statusModOpts[0] || "");

    setIsEditing(true);
    setIsFormOpen(true);

    // Scroll smoothly to form view
    setTimeout(() => {
      document.getElementById("module-input-form-layout")?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  // File Upload Helper to turn file entries into Base64 format
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, fileType: "doc" | "ppt" | "image") => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const base64String = reader.result as string;
      if (fileType === "doc") {
        setDocFileName(file.name);
        setDocFileData(base64String);
      } else if (fileType === "ppt") {
        setPptFileName(file.name);
        setPptFileData(base64String);
      } else if (fileType === "image") {
        setSubImageName(file.name);
        setSubImageData(base64String);
      }
    };
    reader.readAsDataURL(file);
  };

  // Add individual Fitur Modul to current form draft list
  const handleAddFeatureToForm = () => {
    if (!subName.trim()) {
      alert("Nama Fitur Modul wajib diisi rujukan!");
      return;
    }

    const featureNo = subNoFeature || String(subModules.length + 1).padStart(3, "0");
    const statusVal = getStatusModulOptions();

    const newFeature: SubModule = {
      id: "feature-" + Math.random().toString(36).slice(2, 9),
      noFeature: featureNo,
      name: subName.trim(),
      featureDesc: subDesc.trim(),
      imageFileName: subImageName,
      imageFileData: subImageData,
      releaseDate: subReleaseDate || new Date().toISOString().slice(0, 10),
      status: subStatus || statusVal[0] || "Aktif",
      // Legacy compatibility keys
      startDate: subReleaseDate,
      endDate: subReleaseDate
    };

    setSubModules(prev => [...prev, newFeature]);

    // Reset temporary child elements
    setSubName("");
    setSubDesc("");
    setSubImageName("");
    setSubImageData("");
    setSubReleaseDate(new Date().toISOString().slice(0, 10));
    setSubStatus(statusVal[0] || "");
  };

  const handleRemoveFeatureFromForm = (id: string) => {
    setSubModules(prev => prev.filter(f => f.id !== id));
  };

  // Handle Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert("Nama Modul Utama wajib diisi!");
      return;
    }

    const payload: Partial<AppModule> = {
      projectName: projectName || "SIMRS Aset",
      noModul: noModul || generateNextNoModul(),
      name: name.trim(),
      jenisModul,
      jenisAplikasiModul,
      platformModul,
      docFileName,
      docFileData,
      pptFileName,
      pptFileData,
      url: url.trim(),
      releaseDate,
      statusModul,
      pic: pic?.trim() || currentUser?.name || currentUser?.username || "System",
      subModules,
      // Legacy compatibility keys mapping
      type: `${jenisModul} (${platformModul})`,
      implementationStatus: statusModul,
      implementationDate: releaseDate
    };

    try {
      if (isEditing) {
        await onUpdateModule(editId, payload);
      } else {
        await onAddModule(payload);
      }
      setIsFormOpen(false);
    } catch (err: any) {
      alert("Gagal menyimpan pendaftaran modul: " + err.message);
    }
  };

  const handleDownload = (fileName: string, base64Data: string) => {
    if (!base64Data) return;
    try {
      const link = document.createElement("a");
      link.href = base64Data;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      alert("Gagal mengunduh berkas: Berkas data tidak valid.");
    }
  };

  // Custom filter logic
  const filteredModules = appModules.filter(am => {
    const matchesSearch = 
      am.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (am.jenisModul || am.type || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (am.noModul || "").includes(searchTerm) ||
      (am.pic || "").toLowerCase().includes(searchTerm.toLowerCase());
    
    const amStatus = am.statusModul || am.implementationStatus || "";
    const matchesStatus = !filterStatus || amStatus === filterStatus;

    return matchesSearch && matchesStatus;
  });

  // KPI math calculations
  const totalMod = appModules.length;
  const activeModCount = appModules.filter(m => {
    const st = m.statusModul || m.implementationStatus;
    return st === "Aktif" || st === "Go-Live" || st === "Go-Live / Stabil";
  }).length;
  const developmentModCount = appModules.filter(m => {
    const st = m.statusModul || m.implementationStatus;
    return st === "Dalam Pengembangan" || st === "In Progress";
  }).length;

  return (
    <div className="space-y-6 animate-fadeIn font-sans pb-16" id="appmodules-view-container">
      
      {/* Lightbox attachment preview */}
      <AnimatePresence>
        {lightboxImg && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex flex-col items-center justify-center p-4">
            <div className="max-w-4xl w-full bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl relative">
              <div className="p-4 border-b border-slate-800 flex justify-between items-center text-white bg-slate-950/80">
                <span className="text-sm font-black tracking-wide flex items-center gap-1.5 uppercase">
                  <ImageIcon className="w-4 h-4 text-emerald-500" /> Pratinjau Gambar: {lightboxTitle}
                </span>
                <button 
                  onClick={() => setLightboxImg(null)}
                  className="p-1 px-3 bg-red-600/30 hover:bg-red-650/80 text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
                >
                  Tutup [X]
                </button>
              </div>
              <div className="p-1 max-h-[75vh] min-h-[250px] overflow-auto flex items-center justify-center bg-slate-950/20">
                <img 
                  src={lightboxImg} 
                  alt={lightboxTitle} 
                  className="max-h-[70vh] object-contain mx-auto rounded-lg shadow-md"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Header section with Title */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Cpu className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            <h1 className="text-xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Regristrasi Modul SIMRS & Fitur Terintegrasi</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">Mengelola master modul pelayanan, platform operasional, data dokumen teknis modul, silabus presentasi, serta daftar rincian fitur.</p>
        </div>

        {currentUser?.role !== "Client" && !isFormOpen && (
          <button
            onClick={handleOpenNew}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-750 text-white text-xs font-black rounded-lg flex items-center gap-1.5 shadow-md hover:shadow-lg transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 animate-bounce" /> Registrasi Modul Baru
          </button>
        )}
      </div>

      {/* Brief Summary Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-slate-50 dark:bg-slate-800 text-emerald-500 flex items-center justify-center">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 uppercase font-black">Registrasi Modul SIMRS</p>
            <p className="text-xl font-black text-slate-800 dark:text-white">{totalMod} Modul Terpeta</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 uppercase font-black">Status Modul Aktif</p>
            <p className="text-xl font-black text-emerald-600 dark:text-emerald-400">{activeModCount} Modul</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-50 dark:bg-amber-950/20 text-amber-500 flex items-center justify-center">
            <Hourglass className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 uppercase font-black">Modul Dalam Pengembangan</p>
            <p className="text-xl font-black text-amber-600 dark:text-amber-400">{developmentModCount} Tahap R&D</p>
          </div>
        </div>
      </div>

      {/* Inline Form Block Replacement (No Dialog Backdrops) */}
      <AnimatePresence>
        {isFormOpen && (
          <motion.div
            id="module-input-form-layout"
            initial={{ height: 0, opacity: 0, scale: 0.98 }}
            animate={{ height: "auto", opacity: 1, scale: 1 }}
            exit={{ height: 0, opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.3 }}
            className="bg-white dark:bg-slate-900 border-2 border-emerald-550 dark:border-emerald-700/80 rounded-2xl p-6 shadow-xl space-y-4 overflow-hidden"
          >
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <span className="text-[9.5px] font-mono font-extrabold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/40 px-2 py-0.5 rounded-full uppercase tracking-widest block mb-1.5 w-max">
                  Mode Formulir Entri Modul Non-PopUp
                </span>
                <h3 className="font-extrabold text-base text-slate-800 dark:text-slate-200 flex items-center gap-1.5 tracking-tight">
                  <Cpu className="w-5 h-5 text-emerald-500 shrink-0" /> {isEditing ? `Perbarui Modul & Fitur, No: [${noModul}]` : "Registrasi Master Modul SIMRS Baru"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="p-1 px-3 bg-slate-100 text-slate-500 hover:bg-red-50 hover:text-red-500 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 rounded-lg text-xs font-black transition-all cursor-pointer"
              >
                Tutup Formulir [X]
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs font-semibold">
              
              {/* Modul Utama Grid */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-50 dark:bg-slate-950/40 p-4 border border-slate-100 dark:border-slate-800/80 rounded-xl">
                <div className="col-span-full text-[10.5px] font-black uppercase text-slate-450 tracking-wider">
                  Pengisian Master Modul Utama (Parent)
                </div>

                <div className="flex flex-col gap-1 col-span-1">
                  <label className="text-[10px] text-slate-500 uppercase tracking-widest">No Modul (Otomatis)</label>
                  <input
                    type="text"
                    required
                    readOnly
                    placeholder="Auto No"
                    value={noModul}
                    className="bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 py-2.5 px-3 rounded-lg text-slate-550 dark:text-slate-400 font-mono text-xs font-bold mt-1"
                  />
                  <span className="text-[9px] text-emerald-500 font-normal">Sistem mengunci sequential register.</span>
                </div>

                <div className="flex flex-col gap-1 col-span-3">
                  <label className="text-[10px] text-slate-500 uppercase tracking-widest">Nama Modul SIMRS Pelayanan *</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Modul Rekam Medis Elektronik (RME)"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 py-2.5 px-3 rounded-lg text-slate-850 dark:text-slate-150 font-bold mt-1 text-xs focus:ring-2 focus:ring-emerald-550/25"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-slate-450 uppercase tracking-widest">Jenis Modul (Database / Admin)</label>
                  <select
                    value={jenisModul}
                    onChange={(e) => setJenisModul(e.target.value)}
                    className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 py-2 px-3 rounded-lg text-slate-800 dark:text-slate-200 mt-1 cursor-pointer"
                  >
                    {getJenisModulOptions().map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-slate-450 uppercase tracking-widest">Jenis Aplikasi Modul</label>
                  <select
                    value={jenisAplikasiModul}
                    onChange={(e) => setJenisAplikasiModul(e.target.value)}
                    className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 py-2 px-3 rounded-lg text-slate-800 dark:text-slate-200 mt-1 cursor-pointer"
                  >
                    {getJenisAplikasiModulOptions().map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-slate-450 uppercase tracking-widest">Platform Modul</label>
                  <select
                    value={platformModul}
                    onChange={(e) => setPlatformModul(e.target.value)}
                    className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 py-2 px-3 rounded-lg text-slate-800 dark:text-slate-200 mt-1 cursor-pointer"
                  >
                    {getPlatformModulOptions().map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-slate-500 uppercase tracking-widest font-black text-emerald-600 dark:text-emerald-400">Status Modul Utama</label>
                  <select
                    value={statusModul}
                    onChange={(e) => setStatusModul(e.target.value)}
                    className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 py-2 px-3 rounded-lg text-slate-800 dark:text-slate-200 mt-1 cursor-pointer"
                  >
                    {getStatusModulOptions().map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>

                {/* File Uploads Row */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-slate-450 uppercase tracking-widest">Data Modul (Document Modul)</label>
                  <input
                    type="file"
                    onChange={(e) => handleFileChange(e, "doc")}
                    accept=".pdf,.doc,.docx,.xls,.xlsx"
                    className="hidden"
                    id="doc-selector-input"
                  />
                  <div className="flex items-center gap-1.5 mt-1">
                    <button
                      type="button"
                      onClick={() => document.getElementById("doc-selector-input")?.click()}
                      className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 rounded text-[9.5px] font-black tracking-wide cursor-pointer uppercase text-slate-700 dark:text-slate-350"
                    >
                      Pilih Dokumen
                    </button>
                    {docFileName && (
                      <span className="text-[10px] text-emerald-500 font-bold truncate max-w-xs" title={docFileName}>
                        ✓ {docFileName}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-slate-450 uppercase tracking-widest">PowerPoint (Presentasi Modul)</label>
                  <input
                    type="file"
                    onChange={(e) => handleFileChange(e, "ppt")}
                    accept=".ppt,.pptx,.pdf"
                    className="hidden"
                    id="ppt-selector-input"
                  />
                  <div className="flex items-center gap-1.5 mt-1">
                    <button
                      type="button"
                      onClick={() => document.getElementById("ppt-selector-input")?.click()}
                      className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 rounded text-[9.5px] font-black tracking-wide cursor-pointer uppercase text-slate-700 dark:text-slate-350"
                    >
                      Pilih PowerPoint
                    </button>
                    {pptFileName && (
                      <span className="text-[10px] text-emerald-500 font-bold truncate max-w-xs" title={pptFileName}>
                        ✓ {pptFileName}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-slate-500 uppercase tracking-widest">URL Modul Versi</label>
                  <input
                    type="url"
                    placeholder="URL internal rilis / demo"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 py-2 px-3 rounded-lg text-slate-800 dark:text-slate-100 mt-1 placeholder-slate-400"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-slate-500 uppercase tracking-widest font-black text-rose-600 dark:text-rose-455">Tanggal Release Modul</label>
                  <input
                    type="date"
                    required
                    value={releaseDate}
                    onChange={(e) => setReleaseDate(e.target.value)}
                    className="bg-white dark:bg-slate-955 border border-slate-200 dark:border-slate-805 py-2 px-3 rounded-lg text-slate-800 dark:text-slate-200 mt-1 cursor-pointer"
                  />
                </div>
              </div>

              {/* FITUR MODUL FORM REMOVED FROM MAIN MASTER FORM */}
              <div className="bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-150 dark:border-indigo-900/50 rounded-xl p-5 flex items-start gap-3.5 shadow-2xs">
                <Layers className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-extrabold text-xs uppercase tracking-wider text-indigo-700 dark:text-indigo-400">Penyusunan Rincian Fitur Modul ("Anak Rujukan")</h4>
                  <p className="text-[11px] mt-1 text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
                    Sesuai instruksi penyesuaian terbaru, penambahan dan penyusunan Fitur Modul (Anak Rujukan) dikelola langsung di luar form pendaftaran ini. Silakan simpan / perbarui <strong>Master Pendaftaran Modul</strong> di bawah terlebih dahulu, kemudian Anda dapat menggunakan tombol perluas detail modul card (Chevron <ChevronDown className="w-3.5 h-3.5 inline text-slate-500" />) di daftar modul untuk menambah atau menghapus list rincian rilis fitur secara praktis.
                  </p>
                </div>
              </div>

              {/* Submits */}
              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-5 py-2.5 border border-slate-350 dark:border-slate-800 text-slate-550 dark:text-slate-400 text-xs font-black rounded-lg hover:bg-slate-550 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-750 text-white text-xs font-black rounded-lg shadow-md hover:shadow-lg transition-all flex items-center gap-1 cursor-pointer font-bold"
                >
                  <CheckCircle2 className="w-4.5 h-4.5" /> {isEditing ? "Terapkan Perubahan Modul SIMRS" : "Simpan Master Pendaftaran Modul"}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filter panel */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-wrap gap-3 items-center justify-between">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Cari No Modul, nama, jenis modul, atau PIC..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 pr-4 py-1.5 w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        <div className="flex flex-wrap gap-2.5 items-center">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 py-1.5 px-3 rounded-lg text-xs font-semibold cursor-pointer"
          >
            <option value="">Semua Status Modul</option>
            {getStatusModulOptions().map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        </div>
      </div>

      {/* Module versioning Accordion List */}
      <div className="space-y-4">
        {filteredModules.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
            <Cpu className="w-12 h-12 text-slate-350 mx-auto mb-3 opacity-30" />
            <p className="text-sm font-black text-slate-700 dark:text-slate-350">Tidak ditemukan modul versi aplikasi</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">Daftarkan modul utama beserta fiturnya untuk merekam data realisasi implementasi.</p>
          </div>
        ) : (
          filteredModules.map(am => {
            const isExpanded = !!expandedModuleIds[am.id];
            const childrenCount = am.subModules?.length || 0;
            const amStatus = am.statusModul || am.implementationStatus || "Aktif";
            const amNo = am.noModul || "001";
            const isLegacy = !am.noModul;

            return (
              <div 
                key={am.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs transition-all hover:border-slate-350 dark:hover:border-slate-700"
              >
                {/* Accordion Trigger Header */}
                <div 
                  className={`p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer select-none transition-colors ${isExpanded ? "bg-slate-50 dark:bg-slate-950/40" : ""}`}
                  onClick={() => toggleExpand(am.id)}
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2 text-[9px] font-mono font-bold">
                      <span className="bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/40 px-2.5 py-0.5 rounded-full uppercase tracking-wider font-extrabold shadow-3xs">
                        Aset SIMRS
                      </span>
                      <span className="bg-slate-100 dark:bg-slate-850 text-slate-650 dark:text-slate-300 px-2 py-0.5 rounded border border-slate-200/50 dark:border-slate-800/50">
                        {am.jenisModul || am.type || "Front Office"}
                      </span>
                      <span className="bg-indigo-50 dark:bg-indigo-950/40 text-indigo-650 dark:text-indigo-400 px-2 px-2.5 py-0.5 rounded border border-indigo-150/40">
                        Jenis: {am.jenisAplikasiModul || "Web"}
                      </span>
                      <span className="bg-amber-50 dark:bg-amber-950/40 text-amber-650 dark:text-amber-400 px-2 py-0.5 rounded border border-amber-150/40">
                        Platform: {am.platformModul || "Web"}
                      </span>
                      <span className="text-slate-400 flex items-center gap-1 font-sans font-semibold">
                        <Calendar className="w-3.5 h-3.5" /> Rilis: {am.releaseDate || am.implementationDate || "-"}
                      </span>
                    </div>

                    <h3 className="text-base font-black text-slate-850 dark:text-slate-100 mt-2.5 tracking-tight flex flex-wrap items-center gap-2 leading-snug">
                      <span className="bg-emerald-600/10 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 px-1.5 py-0.5 rounded font-mono font-black border border-emerald-500/10 text-xs">
                        NO.{amNo}
                      </span>
                      <Code className="w-4 h-4 text-emerald-500" /> {am.name}
                    </h3>

                    {/* Render external url link or attachments if any */}
                    <div className="flex flex-wrap gap-2 pt-1">
                      {am.url && (
                        <a 
                          href={am.url} 
                          target="_blank" 
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-[10px] text-blue-500 hover:text-blue-700 flex items-center gap-1 font-mono font-bold"
                        >
                          <Globe className="w-3 h-3" /> URL Modul: <span className="underline truncate max-w-[200px]">{am.url}</span> <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      )}

                      {am.docFileName && am.docFileData && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownload(am.docFileName!, am.docFileData!);
                          }}
                          className="text-[10px] text-emerald-600 hover:text-emerald-700 bg-emerald-500/5 hover:bg-emerald-500/10 border border-emerald-500/15 py-0.5 px-2 rounded-md flex items-center gap-1 font-semibold cursor-pointer"
                        >
                          <FileText className="w-3 h-3 text-red-500" /> Dokumen: <span className="underline text-slate-700 dark:text-slate-350">{am.docFileName}</span> <Download className="w-2.5 h-2.5 shrink-0" />
                        </button>
                      )}

                      {am.pptFileName && am.pptFileData && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownload(am.pptFileName!, am.pptFileData!);
                          }}
                          className="text-[10px] text-indigo-600 hover:text-indigo-700 bg-indigo-500/5 hover:bg-indigo-500/10 border border-indigo-500/15 py-0.5 px-2 rounded-md flex items-center gap-1 font-semibold cursor-pointer"
                        >
                          <Presentation className="w-3 h-3 text-amber-500" /> PPT: <span className="underline text-slate-700 dark:text-slate-350">{am.pptFileName}</span> <Download className="w-2.5 h-2.5 shrink-0" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 md:self-center">
                    <div className="text-right text-xs">
                      <span className={`text-[10px] font-black px-2.5 py-1 rounded border uppercase tracking-wide ${
                        amStatus === "Aktif" || amStatus === "Go-Live" || amStatus === "Go-Live / Stabil"
                          ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/10" 
                          : amStatus === "Dalam Pengembangan" || amStatus === "In Progress"
                          ? "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/10"
                          : "bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/10"
                      }`}>
                        {amStatus}
                      </span>
                    </div>

                    <div className="border-l border-slate-200 dark:border-slate-800 pl-3 h-8 flex items-center gap-1 shrink-0 select-none">
                      <span className="text-[10px] text-slate-450 dark:text-slate-300 font-bold bg-slate-100 dark:bg-slate-800/80 px-2 py-1 rounded">
                        {childrenCount} Fitur Modul
                      </span>

                      {currentUser?.role !== "Client" && (() => {
                        const canModify = !am.createdBy || am.createdBy === currentUser?.username || currentUser?.role === "Administrator" || currentUser?.role === "Direktur";
                        return (
                          <div className="flex gap-0.5 ml-2 mr-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenEdit(am);
                              }}
                              disabled={!canModify}
                              className={`p-1 rounded cursor-pointer ${
                                canModify 
                                  ? "text-slate-400 hover:text-emerald-500 hover:bg-slate-100 dark:hover:bg-slate-850" 
                                  : "text-slate-200 dark:text-slate-850 cursor-not-allowed opacity-35"
                              }`}
                              title={canModify ? "Edit Modul & Rincian Fitur" : `Hanya penginput (${am.createdBy}) atau Admin yang boleh mengedit`}
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={async (e) => {
                                e.stopPropagation();
                                if (confirm(`Hapus registrasi master modul "${am.name}" berikut seluruh data fitur di dalamnya?`)) {
                                  await onDeleteModule(am.id);
                                }
                              }}
                              disabled={!canModify}
                              className={`p-1 rounded cursor-pointer ${
                                canModify 
                                  ? "text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-850" 
                                  : "text-slate-200 dark:text-slate-850 cursor-not-allowed opacity-35"
                              }`}
                              title={canModify ? "Hapus Modul" : `Hanya penginput (${am.createdBy}) atau Admin yang boleh menghapus`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        );
                      })()}

                      {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                    </div>
                  </div>
                </div>

                {/* Relational Columns child view */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="border-t border-slate-150 dark:border-slate-805 bg-slate-50/50 dark:bg-slate-950/20 p-5 space-y-4"
                    >
                      <div className="flex justify-between items-center text-xs font-bold text-slate-400 uppercase tracking-widest">
                        <span className="flex items-center gap-1.5 text-[9.5px]">
                          <CornerDownRight className="w-4 h-4 text-emerald-500 shrink-0" />
                          Rincian Fitur Modul & Parameter Gambar Lampiran
                        </span>
                        <span className="text-[9.5px] text-slate-405 px-2 py-0.5 border border-slate-200 dark:border-slate-800 rounded bg-white dark:bg-slate-900 font-semibold text-slate-500">
                          Registrator: <strong className="text-slate-700 dark:text-slate-350">{am.createdBy || am.pic || "System"}</strong>
                        </span>
                      </div>

                      {childrenCount === 0 ? (
                        <div className="text-center py-6 bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                          <p className="text-xs italic text-slate-400">Belum ada daftar detail rincian fitur yang dipetakan untuk modul utama ini.</p>
                        </div>
                      ) : (
                        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead>
                              <tr className="bg-slate-50 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800 text-[10px] font-black text-slate-500 uppercase tracking-wider select-none">
                                <th className="px-4 py-3 w-20">No Fitur</th>
                                <th className="px-4 py-3">Nama Fitur Modul</th>
                                <th className="px-4 py-3">Detail Keterangan Modul</th>
                                <th className="px-4 py-3 text-center w-36">Gambar Lampiran</th>
                                <th className="px-4 py-3 w-28">Tanggal Rilis</th>
                                <th className="px-4 py-3 text-center w-28">Status</th>
                                <th className="px-4 py-3 text-right w-16">Aksi</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-medium">
                              {am.subModules?.map((sub, idx) => {
                                const featureNumber = sub.noFeature || String(idx + 1).padStart(3, "0");
                                const subModStatus = sub.status || "Aktif";
                                return (
                                  <tr key={sub.id || idx} className="hover:bg-slate-50/55 dark:hover:bg-slate-850/20 text-slate-700 dark:text-slate-350">
                                    <td className="px-4 py-3 font-mono font-black text-slate-800 dark:text-slate-200">
                                      #{featureNumber}
                                    </td>
                                    <td className="px-4 py-3 font-extrabold text-slate-800 dark:text-slate-200">
                                      {sub.name}
                                    </td>
                                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400 max-w-xs leading-relaxed font-normal">
                                      {sub.featureDesc || "-"}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                      {sub.imageFileName && sub.imageFileData ? (
                                        <div className="flex flex-col items-center justify-center gap-1">
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setLightboxImg(sub.imageFileData!);
                                              setLightboxTitle(sub.imageFileName!);
                                            }}
                                            className="p-1 px-2.5 bg-blue-50 hover:bg-blue-100 text-blue-600 dark:bg-blue-950/40 dark:hover:bg-blue-950/80 dark:text-blue-400 text-[9.5px] font-bold rounded-md flex items-center gap-1 cursor-pointer mx-auto transition-all"
                                          >
                                            <ImageIcon className="w-3.5 h-3.5" /> Lihat Lampiran
                                          </button>
                                          <span className="text-[9px] text-slate-400 block truncate max-w-[120px] font-mono">
                                            {sub.imageFileName}
                                          </span>
                                        </div>
                                      ) : (
                                        <span className="text-[10px] text-slate-400 italic">Tanpa Lampiran</span>
                                      )}
                                    </td>
                                    <td className="px-4 py-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                                      {sub.releaseDate || sub.startDate || "-"}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                      <span className={`text-[9px] font-black px-2 py-0.5 rounded border uppercase tracking-wide ${
                                        subModStatus === "Aktif"
                                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/10"
                                          : subModStatus === "Dalam Pengembangan"
                                          ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/10"
                                          : "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/10"
                                      }`}>
                                        {subModStatus}
                                      </span>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                      {(() => {
                                        const isModuleOwner = currentUser?.role === "Administrator" || currentUser?.role === "Direktur" || (am.createdBy === currentUser?.username);
                                        return (
                                          <button
                                            type="button"
                                            disabled={!isModuleOwner}
                                            onClick={() => handleDeleteFeatureDirectly(am, sub.id!)}
                                            className={`p-1 rounded transition-all ${
                                              isModuleOwner 
                                                ? "text-rose-550 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/20 cursor-pointer" 
                                                : "text-slate-350 dark:text-slate-800 cursor-not-allowed opacity-30"
                                            }`}
                                            title="Hapus Rilis Fitur"
                                          >
                                            <Trash2 className="w-4 h-4 font-bold" />
                                          </button>
                                        );
                                      })()}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}

                      {/* Interactive inline form to add a feature directly outside registration dialog */}
                      {(() => {
                        const isModuleOwner = currentUser?.role === "Administrator" || currentUser?.role === "Direktur" || (am.createdBy === currentUser?.username);
                        if (!isModuleOwner) return null;

                        if (showInlineFormId !== am.id) {
                          return (
                            <div className="flex justify-end mt-4">
                              <button
                                type="button"
                                onClick={() => {
                                  setShowInlineFormId(am.id);
                                  setInlineAddId(am.id);
                                  // Clear states
                                  setDirectFieldName("");
                                  setDirectFieldDesc("");
                                  setDirectFieldImageName("");
                                  setDirectFieldImageData("");
                                  setDirectFieldReleaseDate(new Date().toISOString().slice(0, 10));
                                  setDirectFieldStatus("Aktif");
                                }}
                                className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/20 dark:hover:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/50 rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-3xs hover:shadow-2xs transition-all uppercase tracking-wider"
                              >
                                <PlusCircle className="w-4 h-4" /> Tambah Rincian Fitur Baru
                              </button>
                            </div>
                          );
                        }

                        return (
                          <div className="bg-white dark:bg-slate-905 border border-slate-200 dark:border-slate-800 p-4 rounded-xl space-y-3.5 mt-2.5">
                            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                              <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                <PlusCircle className="w-4 h-4 text-emerald-500" />
                                Registrasi Fitur Modul Baru Secara Langsung (Rujukan Aset)
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  setShowInlineFormId(null);
                                  setInlineAddId("");
                                }}
                                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs font-bold shrink-0"
                              >
                                Tutup Form ✕
                              </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-4 gap-3.5 bg-slate-50/40 dark:bg-slate-905/30 p-4 border border-slate-150 dark:border-slate-850 rounded-lg">
                              <div className="flex flex-col gap-1 md:col-span-1">
                                <label className="text-[9px] font-bold text-slate-500 uppercase">No Fitur (Otomatis)</label>
                                <input
                                  type="text"
                                  readOnly
                                  placeholder="Auto No"
                                  value={String((am.subModules || []).length + 1).padStart(3, "0")}
                                  className="bg-slate-100 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 py-1.5 px-3 rounded-md text-slate-500 text-xs font-mono font-bold mt-1"
                                />
                              </div>

                              <div className="flex flex-col gap-1 md:col-span-3">
                                <label className="text-[9px] font-bold text-slate-500 uppercase">Nama Fitur Modul Rujukan *</label>
                                <input
                                  type="text"
                                  placeholder="Contoh: Cetak Lembar Triase Gawat Darurat"
                                  value={inlineAddId === am.id ? directFieldName : ""}
                                  onChange={(e) => {
                                    setInlineAddId(am.id);
                                    setDirectFieldName(e.target.value);
                                  }}
                                  className="bg-white dark:bg-slate-950 border border-slate-250 dark:border-slate-800 py-1.5 px-3 rounded-md text-slate-850 dark:text-slate-100 text-xs mt-1"
                                />
                              </div>

                              <div className="flex flex-col gap-1 md:col-span-2">
                                <label className="text-[9px] font-bold text-slate-500 uppercase">Detail Keterangan Modul *</label>
                                <textarea
                                  placeholder="Tulis ringkasan cakupan rilis fitur rujukan..."
                                  value={inlineAddId === am.id ? directFieldDesc : ""}
                                  onChange={(e) => {
                                    setInlineAddId(am.id);
                                    setDirectFieldDesc(e.target.value);
                                  }}
                                  rows={2}
                                  className="bg-white dark:bg-slate-955 border border-slate-250 dark:border-slate-805 py-1.5 px-3 rounded-md text-slate-850 dark:text-slate-100 text-xs mt-1 font-semibold"
                                />
                              </div>

                              {/* Feature Image Upload */}
                              <div className="flex flex-col gap-1 col-span-1">
                                <label className="text-[9px] font-bold text-slate-500 uppercase">Gambar Modul / PDF Lampiran</label>
                                <input
                                  type="file"
                                  onChange={(e) => {
                                    setInlineAddId(am.id);
                                    handleInlineFileChange(e);
                                  }}
                                  accept="image/*,.pdf"
                                  className="hidden"
                                  id={`inline-image-${am.id}`}
                                />
                                <div className="flex items-center gap-1.5 mt-1.5">
                                  <button
                                    type="button"
                                    onClick={() => document.getElementById(`inline-image-${am.id}`)?.click()}
                                    className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 rounded text-[9.5px] font-bold cursor-pointer text-slate-700 dark:text-slate-300 transition-all uppercase"
                                  >
                                    Pilih File
                                  </button>
                                  {(inlineAddId === am.id && directFieldImageName) && (
                                    <span className="text-[9.5px] text-emerald-500 font-bold truncate max-w-[125px]" title={directFieldImageName}>
                                      ✓ {directFieldImageName}
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div className="flex flex-col gap-1 col-span-1">
                                <label className="text-[9px] font-semibold text-rose-550 uppercase">Tanggal Release Fitur</label>
                                <input
                                  type="date"
                                  value={inlineAddId === am.id ? directFieldReleaseDate : new Date().toISOString().slice(0, 10)}
                                  onChange={(e) => {
                                    setInlineAddId(am.id);
                                    setDirectFieldReleaseDate(e.target.value);
                                  }}
                                  className="bg-white dark:bg-slate-955 border border-slate-250 dark:border-slate-805 py-1 px-2 rounded-md text-slate-800 dark:text-slate-200 text-xs mt-1 cursor-pointer"
                                />
                              </div>

                              <div className="flex flex-col gap-1 md:col-span-2">
                                <label className="text-[9px] font-bold text-slate-500 uppercase">Status Modul / Fitur</label>
                                <select
                                  value={inlineAddId === am.id ? directFieldStatus : "Aktif"}
                                  onChange={(e) => {
                                    setInlineAddId(am.id);
                                    setDirectFieldStatus(e.target.value);
                                  }}
                                  className="bg-white dark:bg-slate-950 border border-slate-250 dark:border-slate-800 py-1.5 px-3 rounded-md text-slate-800 dark:text-slate-200 mt-1 cursor-pointer text-xs"
                                >
                                  {getStatusModulOptions().map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                </select>
                              </div>

                              <div className="md:col-span-2 flex items-end gap-2.5">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setShowInlineFormId(null);
                                    setInlineAddId("");
                                  }}
                                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-850 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-lg text-xs cursor-pointer shadow-xs transition-all uppercase w-1/3"
                                >
                                  Batal
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleAddFeatureDirectly(am)}
                                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg flex items-center justify-center gap-1 text-xs cursor-pointer shadow-sm hover:shadow-md transition-all uppercase w-2/3"
                                >
                                  <PlusCircle className="w-4 h-4 shrink-0" /> Daftarkan Rilis Fitur Baru
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
}
