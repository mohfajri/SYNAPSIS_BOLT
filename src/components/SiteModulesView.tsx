import React, { useState, useMemo } from "react";
import { 
  Cpu, 
  Layers, 
  Calendar, 
  User as UserIcon, 
  Plus, 
  Search, 
  Trash2, 
  Edit3, 
  AlertTriangle, 
  Check, 
  X, 
  Filter, 
  Clock, 
  Building2, 
  ClipboardList, 
  CheckSquare, 
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  CheckCircle2
} from "lucide-react";
import { SiteModuleImplementation, Client, AppModule, User } from "../types";
import { motion, AnimatePresence } from "motion/react";

interface SiteModulesViewProps {
  siteImplementations: SiteModuleImplementation[];
  clients: Client[];
  appModules: AppModule[];
  users: User[];
  currentUser: User | null;
  settings: any;
  onAddImplementation: (data: Partial<SiteModuleImplementation>) => Promise<any>;
  onUpdateImplementation: (id: string, data: Partial<SiteModuleImplementation>) => Promise<any>;
  onDeleteImplementation: (id: string) => Promise<any>;
}

export default function SiteModulesView({
  siteImplementations,
  clients,
  appModules,
  users,
  currentUser,
  settings,
  onAddImplementation,
  onUpdateImplementation,
  onDeleteImplementation
}: SiteModulesViewProps) {
  // Filters and search states
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClientFilter, setSelectedClientFilter] = useState("all");
  const [selectedModuleFilter, setSelectedModuleFilter] = useState("all");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState("all");

  // Accordion Toggle States to track which card is expanded
  const [expandedImplIds, setExpandedImplIds] = useState<Record<string, boolean>>({});

  // Inline edit state tracker for features: key is combo "implId-subId"
  const [inlineEditingFeature, setInlineEditingFeature] = useState<Record<string, {
    statusImplementasi?: string;
    tanggalImplementasi?: string;
    statusPenggunaan?: string;
    kategoriImplementasi?: string;
    picImplementasi?: string;
    keterangan?: string;
  }>>({});

  const toggleExpand = (id: string) => {
    setExpandedImplIds(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const updateInlineField = (comboKey: string, field: string, value: any) => {
    setInlineEditingFeature(prev => ({
      ...prev,
      [comboKey]: {
        ...(prev[comboKey] || {}),
        [field]: value
      }
    }));
  };

  // Modal Open State
  const [isOpen, setIsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  // Form Field States
  const [clientRS, setClientRS] = useState("");
  const [appModuleId, setAppModuleId] = useState("");
  const [subModuleId, setSubModuleId] = useState("");
  const [statusImplementasi, setStatusImplementasi] = useState("");
  const [tanggalImplementasi, setTanggalImplementasi] = useState("");
  const [statusPenggunaan, setStatusPenggunaan] = useState("");
  const [kategoriImplementasi, setKategoriImplementasi] = useState("");
  const [picImplementasi, setPicImplementasi] = useState("");
  const [keterangan, setKeterangan] = useState("");

  // Sub-module feature detail modal states
  const [featureModalData, setFeatureModalData] = useState<{
    parentImpl: any;
    subModuleId: string;
    subModuleName: string;
    subModuleDesc?: string;
    savedState?: any;
  } | null>(null);

  const [fStatusImplementasi, setFStatusImplementasi] = useState("");
  const [fTanggalImplementasi, setFTanggalImplementasi] = useState("");
  const [fStatusPenggunaan, setFStatusPenggunaan] = useState("");
  const [fKategoriImplementasi, setFKategoriImplementasi] = useState("");
  const [fPicImplementasi, setFPicImplementasi] = useState("");
  const [fKeterangan, setFKeterangan] = useState("");

  // Notification States
  const [alertMsg, setAlertMsg] = useState<{ text: string; isError: boolean } | null>(null);

  // Helper arrays from settings (with robust fallbacks)
  const statusImplementasiList = useMemo(() => {
    if (settings?.statusImplementasiSite) {
      return settings.statusImplementasiSite.filter((x: any) => x.active).map((x: any) => x.value) as string[];
    }
    return ["Berjalan", "Tidak Berjalan"];
  }, [settings]);

  const statusPenggunaanList = useMemo(() => {
    if (settings?.statusPenggunaan) {
      return settings.statusPenggunaan.filter((x: any) => x.active).map((x: any) => x.value) as string[];
    }
    return ["Optimal", "Tidak Optimal"];
  }, [settings]);

  const kategoriImplementasiList = useMemo(() => {
    if (settings?.kategoriImplementasi) {
      return settings.kategoriImplementasi.filter((x: any) => x.active).map((x: any) => x.value) as string[];
    }
    return ["Request", "Pengembangan"];
  }, [settings]);

  // Is user scoped to a single Site/Hospital? Updated for general non-admin siteTugas members
  // Treat 'Kantor Pusat' as global (Option 1)
  const isUserScoped = currentUser && 
    currentUser.siteTugas && 
    currentUser.siteTugas.toLowerCase().trim() !== "kantor pusat" &&
    currentUser.role !== "Administrator" && 
    currentUser.role !== "Direktur";
  const userSite = currentUser?.siteTugas || "";

  // Filtered clients list
  const allowedClients = useMemo(() => {
    if (isUserScoped) {
      return clients.filter(c => c.namaRS === userSite);
    }
    return clients;
  }, [clients, isUserScoped, userSite]);

  // Sub-module individual inputs state
  interface SubModuleImplState {
    subModuleId: string;
    subModuleName: string;
    statusImplementasi: string;
    tanggalImplementasi: string;
    statusPenggunaan: string;
    kategoriImplementasi: string;
    keterangan: string;
    active: boolean;
  }
  const [subModuleImplStates, setSubModuleImplStates] = useState<SubModuleImplState[]>([]);

  // Filter out modules that are already registered for the selected clientRS
  const availableAppModules = useMemo(() => {
    if (!clientRS) return appModules;
    // Find all app module IDs already implemented for this site/clientRS
    // (excluding the current one we are editing if we are in edit mode)
    const implementedModuleIds = siteImplementations
      .filter(impl => impl.clientRS === clientRS && (!isEditing || impl.id !== editId))
      .map(impl => impl.appModuleId);
    
    // Filter out the ones already registered
    return appModules.filter(m => !implementedModuleIds.includes(m.id));
  }, [appModules, siteImplementations, clientRS, isEditing, editId]);

  // Dynamic PIC list based on siteTugas per user
  const dynamicPICList = useMemo(() => {
    // If no site is selected, return an empty list or fall back
    const targetSite = clientRS;
    if (!targetSite) return users.filter(u => u.statusAktif !== false);

    // Filter users whose siteTugas matches the selected clientRS
    const filtered = users.filter(u => u.siteTugas === targetSite && u.statusAktif !== false);
    
    // Fallback path: If there are no users officially restricted to this site, show general active users
    if (filtered.length === 0) {
      return users.filter(u => u.statusAktif !== false);
    }
    return filtered;
  }, [users, clientRS]);

  // Is this site assignment using the fallback active list?
  const isPicListUsingFallback = useMemo(() => {
    if (!clientRS) return false;
    const filtered = users.filter(u => u.siteTugas === clientRS && u.statusAktif !== false);
    return filtered.length === 0;
  }, [users, clientRS]);

  // Dynamic PIC list for the active submodule modal form based on the parent implementation's clientRS
  const modalSubModulePICList = useMemo(() => {
    if (!featureModalData?.parentImpl?.clientRS) return users.filter(u => u.statusAktif !== false);
    const targetSite = featureModalData.parentImpl.clientRS;
    const filtered = users.filter(u => u.siteTugas === targetSite && u.statusAktif !== false);
    if (filtered.length === 0) {
      return users.filter(u => u.statusAktif !== false);
    }
    return filtered;
  }, [users, featureModalData?.parentImpl?.clientRS]);

  // Selected module item
  const selectedModuleObj = useMemo(() => {
    return appModules.find(m => m.id === appModuleId);
  }, [appModules, appModuleId]);

  // Populates features/submodules list based on AppModule ID
  const populateSubmodules = (moduleId: string, status?: string, tgl?: string, useStat?: string, kat?: string) => {
    const m = appModules.find(x => x.id === moduleId);
    if (m && m.subModules) {
      setSubModuleImplStates(
        m.subModules.map(s => ({
          subModuleId: s.id,
          subModuleName: s.name,
          statusImplementasi: status || statusImplementasi || "Berjalan",
          tanggalImplementasi: tgl || tanggalImplementasi || new Date().toISOString().split("T")[0],
          statusPenggunaan: useStat || statusPenggunaan || "Optimal",
          kategoriImplementasi: kat || kategoriImplementasi || "Request",
          keterangan: "",
          active: true
        }))
      );
    } else {
      setSubModuleImplStates([]);
    }
  };

  // Adjust module id if current selection becomes unavailable when changing site/clientRS
  React.useEffect(() => {
    if (!isOpen) return;
    if (availableAppModules.length > 0) {
      const exists = availableAppModules.some(m => m.id === appModuleId);
      if (!exists) {
        setAppModuleId(availableAppModules[0].id);
        populateSubmodules(availableAppModules[0].id, statusImplementasi, tanggalImplementasi, statusPenggunaan, kategoriImplementasi);
      }
    } else if (!isEditing) {
      setAppModuleId("");
      setSubModuleImplStates([]);
    }
  }, [availableAppModules, isOpen, isEditing]);

  // Handle module selections changes
  const handleModuleChange = (newModuleId: string) => {
    setAppModuleId(newModuleId);
    populateSubmodules(newModuleId, statusImplementasi, tanggalImplementasi, statusPenggunaan, kategoriImplementasi);
  };

  // Synchronizers to sync main module settings changes down to each submodule
  const handleMainStatusChange = (val: string) => {
    setStatusImplementasi(val);
    setSubModuleImplStates(prev => prev.map(s => ({ ...s, statusImplementasi: val })));
  };

  const handleMainTanggalChange = (val: string) => {
    setTanggalImplementasi(val);
    setSubModuleImplStates(prev => prev.map(s => ({ ...s, tanggalImplementasi: val })));
  };

  const handleMainPenggunaanChange = (val: string) => {
    setStatusPenggunaan(val);
    setSubModuleImplStates(prev => prev.map(s => ({ ...s, statusPenggunaan: val })));
  };

  const handleMainKategoriChange = (val: string) => {
    setKategoriImplementasi(val);
    setSubModuleImplStates(prev => prev.map(s => ({ ...s, kategoriImplementasi: val })));
  };

  // Handle open additions
  const handleOpenNew = () => {
    const defaultSite = isUserScoped ? userSite : (allowedClients[0]?.namaRS || "");
    setClientRS(defaultSite);

    // Calculate PIC
    const sitePics = users.filter(u => u.siteTugas === defaultSite && u.statusAktif !== false);
    const initialPic = sitePics[0]?.name || users.filter(u => u.statusAktif !== false)[0]?.name || "";
    setPicImplementasi(initialPic);

    const initStatus = statusImplementasiList[0] || "Berjalan";
    const initTanggal = new Date().toISOString().split("T")[0];
    const initPenggunaan = statusPenggunaanList[0] || "Optimal";
    const initKategori = kategoriImplementasiList[0] || "Request";

    setStatusImplementasi(initStatus);
    setTanggalImplementasi(initTanggal);
    setStatusPenggunaan(initPenggunaan);
    setKategoriImplementasi(initKategori);

    // Filter available modules for this defaultSite specifically
    const currentAvailable = appModules.filter(m => {
      const implemented = siteImplementations.some(impl => impl.clientRS === defaultSite && impl.appModuleId === m.id);
      return !implemented;
    });

    const initModuleId = currentAvailable[0]?.id || "";
    setAppModuleId(initModuleId);
    setSubModuleId("");
    setKeterangan("");
    setIsEditing(false);
    setEditId(null);
    setIsOpen(true);

    if (initModuleId) {
      populateSubmodules(initModuleId, initStatus, initTanggal, initPenggunaan, initKategori);
    } else {
      setSubModuleImplStates([]);
    }
  };

  // Open edit form
  const handleOpenEdit = (impl: SiteModuleImplementation) => {
    setClientRS(impl.clientRS);
    setAppModuleId(impl.appModuleId);
    setSubModuleId(impl.subModuleId || "");
    setStatusImplementasi(impl.statusImplementasi);
    setTanggalImplementasi(impl.tanggalImplementasi || new Date().toISOString().split("T")[0]);
    setStatusPenggunaan(impl.statusPenggunaan);
    setKategoriImplementasi(impl.kategoriImplementasi);
    setPicImplementasi(impl.picImplementasi);
    setKeterangan(impl.keterangan || "");

    setEditId(impl.id);
    setIsEditing(true);
    setIsOpen(true);
    setSubModuleImplStates([]); // Submodules are edited as independent records
  };

  // Dynamic adjust PIC when clientRS changes in the form
  React.useEffect(() => {
    if (!isOpen) return;
    const targetSite = clientRS;
    const sitePics = users.filter(u => u.siteTugas === targetSite && u.statusAktif !== false);
    
    if (sitePics.length > 0) {
      const picExists = sitePics.some(u => u.name === picImplementasi);
      if (!picExists) {
        setPicImplementasi(sitePics[0].name);
      }
    } else {
      // General fallbacks
      const activeGeneral = users.filter(u => u.statusAktif !== false);
      const picExists = activeGeneral.some(u => u.name === picImplementasi);
      if (!picExists && activeGeneral.length > 0) {
        setPicImplementasi(activeGeneral[0].name);
      }
    }
  }, [clientRS, isOpen, users]);

  // Adjust subModuleId selection validity when main module selection switches
  React.useEffect(() => {
    if (!isOpen) return;
    if (selectedModuleObj) {
      const subs = selectedModuleObj.subModules || [];
      const subExists = subs.some(s => s.id === subModuleId);
      if (!subExists && subModuleId !== "") {
        setSubModuleId(""); // default back to entire module
      }
    }
  }, [appModuleId, isOpen, selectedModuleObj]);

  // Trigger temporary notification
  const triggerAlert = (text: string, isError: boolean = false) => {
    setAlertMsg({ text, isError });
    setTimeout(() => {
      setAlertMsg(null);
    }, 4500);
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientRS) {
      triggerAlert("Nama Client / Rumah Sakit wajib diisi!", true);
      return;
    }
    if (!appModuleId) {
      triggerAlert("Modul Utama wajib dipilih!", true);
      return;
    }

    const linkedModule = appModules.find(m => m.id === appModuleId);
    if (!linkedModule) {
      triggerAlert("Modul Utama tidak valid di database!", true);
      return;
    }

    const payload: Partial<SiteModuleImplementation> = {
      clientRS,
      appModuleId,
      appModuleName: linkedModule.name,
      subModuleId: undefined, // Always register parent only in modal form
      subModuleName: undefined,
      statusImplementasi,
      tanggalImplementasi,
      statusPenggunaan,
      kategoriImplementasi,
      picImplementasi,
      keterangan,
      createdBy: currentUser?.name || currentUser?.username || "System"
    };

    try {
      if (isEditing && editId) {
        await onUpdateImplementation(editId, payload);
        triggerAlert("Berhasil memperbarui data implementasi modul site!");
      } else {
        await onAddImplementation(payload);
        triggerAlert("Berhasil mendaftarkan rujukan implementasi modul utama!");
      }
      setIsOpen(false);
    } catch (err: any) {
      triggerAlert(err.message || "Gagal menyimpan rincian implementasi!", true);
    }
  };

  // Delete Action
  const handleDelete = async (id: string) => {
    if (window.confirm("Apakah anda yakin ingin menghapus catatan implementasi ini? Seluruh data rilis fitur yang terasosiasi per site ini juga akan dibersihkan.")) {
      try {
        const mainImpl = siteImplementations.find(i => i.id === id);
        if (mainImpl && !mainImpl.subModuleId) {
          // Find and clean up matching child/feature implementation entries
          const childImpls = siteImplementations.filter(
            item => item.clientRS === mainImpl.clientRS && item.appModuleId === mainImpl.appModuleId && item.subModuleId
          );
          for (const child of childImpls) {
            await onDeleteImplementation(child.id);
          }
        }

        await onDeleteImplementation(id);
        triggerAlert("Catatan implementasi beserta rincian fiturnya berhasil dihapus.");
      } catch (err: any) {
        triggerAlert(err.message || "Gagal menghapus implementasi!", true);
      }
    }
  };

  const handleOpenFeatureModal = (parentImpl: any, sub: any, saved: any) => {
    setFeatureModalData({
      parentImpl,
      subModuleId: sub.id,
      subModuleName: sub.name,
      subModuleDesc: sub.featureDesc,
      savedState: saved
    });
    setFStatusImplementasi(saved?.statusImplementasi || "Berjalan");
    setFTanggalImplementasi(saved?.tanggalImplementasi || new Date().toISOString().split("T")[0]);
    setFStatusPenggunaan(saved?.statusPenggunaan || "Optimal");
    setFKategoriImplementasi(saved?.kategoriImplementasi || "Request");
    setFPicImplementasi(saved?.picImplementasi || parentImpl.picImplementasi || currentUser?.name || "System");
    setFKeterangan(saved?.keterangan || "");
  };

  const handleSaveFeatureModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!featureModalData) return;

    const { parentImpl, subModuleId, subModuleName, savedState } = featureModalData;

    const payload: Partial<SiteModuleImplementation> = {
      clientRS: parentImpl.clientRS,
      appModuleId: parentImpl.appModuleId,
      appModuleName: parentImpl.appModuleName,
      subModuleId: subModuleId,
      subModuleName: subModuleName,
      statusImplementasi: fStatusImplementasi,
      tanggalImplementasi: fTanggalImplementasi,
      statusPenggunaan: fStatusPenggunaan,
      kategoriImplementasi: fKategoriImplementasi,
      picImplementasi: fPicImplementasi,
      keterangan: fKeterangan || `Fitur dari modul ${parentImpl.appModuleName}`,
      createdBy: currentUser?.name || currentUser?.username || "System"
    };

    try {
      if (savedState) {
        await onUpdateImplementation(savedState.id, payload);
        triggerAlert(`Detail rincian fitur "${subModuleName}" berhasil diperbarui!`);
      } else {
        await onAddImplementation(payload);
        triggerAlert(`Detail rincian fitur "${subModuleName}" berhasil disimpan!`);
      }
      setFeatureModalData(null);
    } catch (err: any) {
      triggerAlert(`Gagal memproses detail fitur: ${err.message}`, true);
    }
  };

  const handleResetFeatureDetail = async (subName: string, savedId?: string) => {
    if (!savedId) return;
    if (window.confirm(`Apakah Anda yakin ingin menghapus data detail rincian implementasi untuk fitur "${subName}"? Status rilis akan di-reset.`)) {
      try {
        await onDeleteImplementation(savedId);
        triggerAlert(`Detail implementasi fitur "${subName}" berhasil di-reset.`);
        setFeatureModalData(null);
      } catch (err: any) {
        triggerAlert(`Gagal mereset rincian: ${err.message}`, true);
      }
    }
  };

  // Filter list results for rendering (Return main module rows only; child features rendered on-demand)
  const mainModuleImplementations = useMemo(() => {
    return siteImplementations.filter(impl => {
      // 1. Only display parents (where subModuleId is null or undefined)
      if (impl.subModuleId) return false;

      // 2. Client Site Scopes (restricted users)
      if (isUserScoped && impl.clientRS !== userSite) return false;

      // 3. Client Filter Selector
      if (selectedClientFilter !== "all" && impl.clientRS !== selectedClientFilter) return false;

      // 4. Module Filter Selector
      if (selectedModuleFilter !== "all" && impl.appModuleId !== selectedModuleFilter) return false;

      // 5. Status Filter Selector
      if (selectedStatusFilter !== "all" && impl.statusImplementasi !== selectedStatusFilter) return false;

      // 6. Query Search Match
      if (searchTerm.trim() !== "") {
        const query = searchTerm.toLowerCase();
        const matchesClient = impl.clientRS.toLowerCase().includes(query);
        const matchesModule = impl.appModuleName.toLowerCase().includes(query);
        const matchesPic = impl.picImplementasi.toLowerCase().includes(query);
        const matchesKet = impl.keterangan?.toLowerCase().includes(query) || false;

        // Check if query matches child features
        const linkedModule = appModules.find(m => m.id === impl.appModuleId);
        const matchesChildFeature = linkedModule?.subModules?.some(
          s => s.name.toLowerCase().includes(query) || s.featureDesc.toLowerCase().includes(query)
        ) || false;

        return matchesClient || matchesModule || matchesPic || matchesKet || matchesChildFeature;
      }

      return true;
    });
  }, [siteImplementations, appModules, isUserScoped, userSite, selectedClientFilter, selectedModuleFilter, selectedStatusFilter, searchTerm]);

  // Computes Stats Cards numbers
  const stats = useMemo(() => {
    // We base stats on main module implementations to reflect absolute service count
    const list = siteImplementations.filter(impl => !impl.subModuleId && (!isUserScoped || impl.clientRS === userSite));
    const total = list.length;
    const berjalan = list.filter(i => i.statusImplementasi === "Berjalan").length;
    const optimal = list.filter(i => i.statusPenggunaan === "Optimal").length;
    const request = list.filter(i => i.kategoriImplementasi === "Request").length;
    
    return { total, berjalan, optimal, request };
  }, [siteImplementations, isUserScoped, userSite]);

  return (
    <div id="site-modules-view-container" className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
      
      {/* Action Notification banner */}
      <AnimatePresence>
        {alertMsg && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-4 right-4 z-50 p-4 rounded-xl shadow-lg border text-xs font-semibold flex items-center gap-2 ${
              alertMsg.isError 
                ? "bg-red-50 text-red-650 border-red-200 dark:bg-red-950/80 dark:text-red-300 dark:border-red-900" 
                : "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/80 dark:text-emerald-300 dark:border-emerald-900"
            }`}
          >
            {alertMsg.isError ? <AlertTriangle className="w-4.5 h-4.5 shrink-0 text-red-500" /> : <Check className="w-4.5 h-4.5 shrink-0 text-emerald-500" />}
            <span>{alertMsg.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HEADER PAGE SECTION */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-450 rounded-xl">
              <ClipboardList className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">
                Implementasi Modul per Site / RS
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Sistem rujukan implementasi fitur, modul utama, status operasional, PIC penanggungjawab, dan performa penggunaan RS.
              </p>
            </div>
          </div>
          {isUserScoped && (
            <div className="mt-2 text-xs bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-400 px-3 py-1.5 rounded-lg border border-amber-200 dark:border-amber-900 inline-flex items-center gap-1.5 font-bold">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Akses Terbatas: Menampilkan data khusus untuk site tugas Anda ({userSite})</span>
            </div>
          )}
        </div>

        {/* Create Input Button (Guarded: Client cannot add unless permitted or any other non-Client user) */}
        {currentUser?.role !== "Client" && (
          <button
            id="add-site-module-implementation-btn"
            type="button"
            onClick={handleOpenNew}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-750 text-white text-xs font-black rounded-xl transition-all shadow-xs hover:shadow-md flex items-center gap-1.5 cursor-pointer self-start md:self-auto uppercase tracking-wider"
          >
            <Plus className="w-4.5 h-4.5" /> Registrasi Implementasi
          </button>
        )}
      </div>

      {/* 4 BENTO ANALYTIC STATS CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-850 p-4 rounded-2xl shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-black tracking-wider text-slate-400">Total Modul Site</span>
            <Building2 className="w-4.5 h-4.5 text-blue-500" />
          </div>
          <p className="text-2xl font-black text-slate-800 dark:text-white mt-1.5">{stats.total}</p>
          <p className="text-[10px] text-slate-400 mt-1 font-semibold">Tercatat di sistem</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-850 p-4 rounded-2xl shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-black tracking-wider text-slate-400">Berjalan Aktif</span>
            <Clock className="w-4.5 h-4.5 text-emerald-500 animate-pulse" />
          </div>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1.5">{stats.berjalan}</p>
          <p className="text-[10px] text-slate-400 mt-1 font-semibold">
            {stats.total > 0 ? `${Math.round((stats.berjalan / stats.total) * 100)}%` : "0%"} dari keseluruhan
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-850 p-4 rounded-2xl shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-black tracking-wider text-slate-400">Utilisasi Optimal</span>
            <CheckSquare className="w-4.5 h-4.5 text-indigo-500" />
          </div>
          <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1.5">{stats.optimal}</p>
          <p className="text-[10px] text-slate-400 mt-1 font-semibold">Pemanfaatan maksimal user RS</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-850 p-4 rounded-2xl shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-black tracking-wider text-slate-400">Pengembangan (Kategori)</span>
            <Cpu className="w-4.5 h-4.5 text-amber-500" />
          </div>
          <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1.5">{stats.total - stats.request}</p>
          <p className="text-[10px] text-slate-400 mt-1 font-semibold">{stats.request} dari rujukan Request</p>
        </div>
      </div>

      {/* FILTER CONTROLS BAR */}
      <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-850 rounded-2xl p-4 flex flex-col md:flex-row gap-3 shadow-2xs">
        
        {/* Search Search input field */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            id="site-modules-search"
            type="text"
            placeholder="Cari site, nama modul, sub-fitur, PIC atau catatan..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-205 dark:border-slate-800 text-slate-800 dark:text-slate-100 pl-10 pr-4 py-2.5 rounded-xl font-bold text-xs focus:ring-2 focus:ring-blue-500/10 focus:outline-none transition-all placeholder:text-slate-400"
          />
        </div>

        {/* Dynamic site filters (only if user is not scoped) */}
        {!isUserScoped && (
          <div className="relative min-w-[160px]">
            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5 pointer-events-none" />
            <select
              value={selectedClientFilter}
              onChange={(e) => setSelectedClientFilter(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-205 dark:border-slate-800 text-slate-800 dark:text-slate-100 pl-8.5 pr-3 py-2.5 rounded-xl font-bold text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/10 cursor-pointer appearance-none"
            >
              <option value="all">🏥 Semua Client / RS</option>
              {clients.map(c => (
                <option key={c.id} value={c.namaRS}>{c.namaRS}</option>
              ))}
            </select>
          </div>
        )}

        {/* Registered Module filtering dropdown */}
        <div className="relative min-w-[160px]">
          <Cpu className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5 pointer-events-none" />
          <select
            value={selectedModuleFilter}
            onChange={(e) => setSelectedModuleFilter(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-205 dark:border-slate-800 text-slate-800 dark:text-slate-100 pl-8.5 pr-3 py-2.5 rounded-xl font-bold text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/10 cursor-pointer appearance-none"
          >
            <option value="all">💻 Semua Modul Utama</option>
            {appModules.map(m => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </div>

        {/* Status filtering dropdown */}
        <div className="relative min-w-[150px]">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5 pointer-events-none" />
          <select
            value={selectedStatusFilter}
            onChange={(e) => setSelectedStatusFilter(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-205 dark:border-slate-800 text-slate-800 dark:text-slate-100 pl-8.5 pr-3 py-2.5 rounded-xl font-bold text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/10 cursor-pointer appearance-none"
          >
            <option value="all">⚡ Semua Status</option>
            {statusImplementasiList.map(st => (
              <option key={st} value={st}>{st}</option>
            ))}
          </select>
        </div>
      </div>

      {/* CORE IMPLEMENTATIONS TABLE CARD */}
      <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-850 rounded-2xl overflow-hidden shadow-2xs">
        <div className="p-4 bg-slate-50/50 dark:bg-slate-850/50 border-b border-slate-150 dark:border-slate-850 flex justify-between items-center">
          <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
            List Implementasi Terpilih ({mainModuleImplementations.length})
          </span>
          <span className="text-[10px] text-slate-400 font-bold">
            Total tercatat: {siteImplementations.filter(i => !i.subModuleId).length} Modul Utama di semua Site
          </span>
        </div>

        {mainModuleImplementations.length === 0 ? (
          <div className="p-12 text-center">
            <SlidersHorizontal className="w-10 h-10 text-slate-350 dark:text-slate-700 mx-auto stroke-1 mb-3" />
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">Catatan Implementasi Tidak Ditemukan</p>
            <p className="text-[10.5px] text-slate-400 mt-1 max-w-md mx-auto">
              Silakan atur ulang kata kunci penelusuran atau buat catatan baru dengan menekan tombol <strong>Registrasi Implementasi</strong> di pojok kanan atas.
            </p>
          </div>
        ) : (
          <div className="p-4 space-y-4">
            {mainModuleImplementations.map((impl) => {
              const isExpanded = !!expandedImplIds[impl.id];
              const linkedModule = appModules.find(m => m.id === impl.appModuleId);
              const subModulesCount = linkedModule?.subModules?.length || 0;

              // Find how many of those features actually have saved siteImplementations right now
              const registeredFeaturesCount = siteImplementations.filter(
                item => item.clientRS === impl.clientRS && item.appModuleId === impl.appModuleId && item.subModuleId
              ).length;

              return (
                <div 
                  key={impl.id}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs transition-all hover:border-slate-350 dark:hover:border-slate-700"
                >
                  {/* Accordion Trigger Header */}
                  <div 
                    className={`p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer select-none transition-colors ${
                      isExpanded ? "bg-slate-50/70 dark:bg-slate-950/20" : ""
                    }`}
                    onClick={() => toggleExpand(impl.id)}
                  >
                    <div className="flex items-start gap-3.5">
                      {/* Left icon wrapper */}
                      <div className="p-2.5 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-xl border border-blue-100 dark:border-blue-900/40 shrink-0">
                        <Cpu className="w-5 h-5" />
                      </div>

                      {/* Title information */}
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-[9px] font-black uppercase text-blue-600 bg-blue-50 dark:bg-blue-950/60 dark:text-blue-400 px-2 py-0.5 rounded border border-blue-100/50 dark:border-blue-900/40">
                            MODUL UTAMA
                          </span>
                          <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded bg-amber-50 text-amber-850 dark:bg-amber-950/20 dark:text-amber-400 border border-amber-200/50 dark:border-amber-900/30">
                            <Building2 className="w-3 h-3" />
                            {impl.clientRS}
                          </span>
                          {impl.kategoriImplementasi && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded">
                              {impl.kategoriImplementasi}
                            </span>
                          )}
                        </div>
                        <h3 className="text-sm font-black text-slate-900 dark:text-white tracking-tight">
                          {impl.appModuleName}
                        </h3>
                        {/* Modules count tracker */}
                        <div className="flex items-center gap-2.5 text-[10.5px] text-slate-500 font-bold">
                          <span className="flex items-center gap-1">
                            <Layers className="w-3.5 h-3.5 text-slate-400" />
                            Rincian Fitur: {registeredFeaturesCount} dari {subModulesCount} Terkoneksi
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right side information & Action details */}
                    <div className="flex items-center gap-3 self-end md:self-center shrink-0">
                      <div className="text-right hidden md:block space-y-1">
                        {/* Status Implementasi Badge */}
                        <div className="flex justify-end">
                          <span className={`inline-flex items-center gap-1 text-[10px] font-black px-2.5 py-1 rounded-full border ${
                            impl.statusImplementasi === "Berjalan"
                              ? "bg-emerald-50 text-emerald-800 border-emerald-250 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900"
                              : "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/25 dark:text-red-400 dark:border-red-950"
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${impl.statusImplementasi === "Berjalan" ? "bg-emerald-500 animate-pulse" : "bg-red-500"}`}></span>
                            {impl.statusImplementasi}
                          </span>
                        </div>
                        {/* PIC and Date badges */}
                        <div className="flex items-center gap-2 text-[10.5px] text-slate-400">
                          <span className="flex items-center gap-1 font-semibold">
                            <UserIcon className="w-3.5 h-3.5" />
                            PIC: {impl.picImplementasi || "Belum ada PIC"}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1 font-semibold">
                            <Calendar className="w-3.5 h-3.5" />
                            {impl.tanggalImplementasi || "Belum ada tanggal"}
                          </span>
                        </div>
                      </div>

                      {/* Expanded Chevron indicator and general buttons */}
                      <div className="flex items-center gap-2 border-l border-slate-150 dark:border-slate-800 pl-3">
                        {currentUser?.role !== "Client" && (
                          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(impl)}
                              className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/30 rounded-lg transition-all cursor-pointer"
                              title="Ubah rincian implementasi modul utama"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(impl.id)}
                              className="p-1.5 text-red-650 hover:text-red-800 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30 rounded-lg transition-all cursor-pointer"
                              title="Hapus rincian modul utama beserta fiturnya"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                        <div className="p-1.5 text-slate-450 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all">
                          {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Operational Notes Summary under card */}
                  {impl.keterangan && (
                    <div className="px-5 pb-3 pt-0 text-[11px] text-slate-500 border-b border-transparent dark:text-slate-400 font-medium leading-relaxed bg-slate-50/10 dark:bg-slate-950/5">
                      <strong className="text-slate-700 dark:text-slate-300">Catatan Operasional Modul:</strong> {impl.keterangan || "-"}
                    </div>
                  )}

                  {/* Expanded Custom Submodules Detail */}
                  {isExpanded && (
                    <div className="border-t border-slate-150 dark:border-slate-800 p-5 bg-slate-50/30 dark:bg-slate-900/40 space-y-4">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 pb-2 border-b border-slate-200/60 dark:border-slate-800/80">
                        <div>
                          <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                            <Layers className="w-4 h-4 text-emerald-555" />
                            <span>Rincian Realisasi Fitur Terintegrasi ({subModulesCount} Fitur Terdaftar)</span>
                          </h4>
                          <p className="text-[10.5px] text-slate-500 mt-1">
                            Fitur-fitur r rujukan master modul otomatis ter sedia di bawah. Anda dapat melakukan update tanggal, kategori, PIC, dan rincian catatan implementasi per fitur secara mandiri di bawah ini.
                          </p>
                        </div>
                      </div>

                      {!linkedModule || !linkedModule.subModules || linkedModule.subModules.length === 0 ? (
                        <div className="text-center py-6 text-slate-400 dark:text-slate-550 font-medium text-xs">
                          Belum ada data fitur rilis yang didaftarkan pada Modul Utama ini di "Registrasi Modul SIMRS".
                        </div>
                      ) : (
                        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 shadow-3xs bg-white dark:bg-slate-950">
                          <table className="w-full text-left text-xs border-collapse font-medium">
                            <thead>
                              <tr className="bg-slate-50/80 dark:bg-slate-900 text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800/85">
                                <th className="py-2.5 px-3 w-16 text-center">No Fitur</th>
                                <th className="py-2.5 px-3 w-1/5">Nama Fitur</th>
                                <th className="py-2.5 px-3 w-1/4">Keterangan Master</th>
                                <th className="py-2.5 px-2">Status Rilis</th>
                                <th className="py-2.5 px-2 w-32">Status Implementasi</th>
                                <th className="py-2.5 px-2">Tanggal Imp.</th>
                                <th className="py-2.5 px-2 w-24">Utilisasi</th>
                                <th className="py-2.5 px-2 w-24">Kategori</th>
                                <th className="py-2.5 px-3">Catatan Khusus Site ({impl.clientRS})</th>
                                <th className="py-2.5 px-3 text-center">Aksi</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium text-slate-700 dark:text-slate-300">
                              {linkedModule.subModules.map((sub, sIdx) => {
                                const comboKey = `${impl.id}-${sub.id}`;
                                const subNo = sub.noFeature || String(sIdx + 1).padStart(3, "0");
                                
                                const savedState = siteImplementations.find(
                                  item => item.clientRS === impl.clientRS && item.appModuleId === impl.appModuleId && item.subModuleId === sub.id
                                );

                                const hasRealSavedRecord = !!savedState;

                                // Colors and text for Status Implementasi badge
                                const displayStatus = savedState?.statusImplementasi || "Belum Diatur";
                                let statusBadgeStyle = "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400";
                                if (displayStatus === "Berjalan") {
                                  statusBadgeStyle = "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/40";
                                } else if (displayStatus === "Tidak Berjalan") {
                                  statusBadgeStyle = "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200/40";
                                } else if (displayStatus === "Uji Coba") {
                                  statusBadgeStyle = "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-250/40";
                                }

                                // Colors and text for Utilisasi
                                const displayUtil = savedState?.statusPenggunaan || "-";
                                let utilBadgeStyle = "text-slate-500 dark:text-slate-400";
                                if (displayUtil === "Optimal") {
                                  utilBadgeStyle = "bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 px-1.5 py-0.5 rounded-md font-bold text-[10.5px]";
                                } else if (displayUtil === "Tidak Optimal") {
                                  utilBadgeStyle = "bg-orange-50 dark:bg-orange-950/35 text-orange-700 dark:text-orange-400 px-1.5 py-0.5 rounded-md font-bold text-[10.5px]";
                                } else if (displayUtil !== "-") {
                                  utilBadgeStyle = "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-1.5 py-0.5 rounded-md font-bold text-[10.5px]";
                                }

                                const displayDate = savedState?.tanggalImplementasi || "-";
                                const displayKat = savedState?.kategoriImplementasi || "-";
                                const displayRawKet = savedState?.keterangan || "";
                                const displayKet = displayRawKet ? (displayRawKet.length > 32 ? `${displayRawKet.substring(0, 32)}...` : displayRawKet) : "-";

                                return (
                                  <tr 
                                    key={sub.id} 
                                    className={`hover:bg-slate-50/50 dark:hover:bg-slate-900/40 text-xs transition-colors ${
                                      hasRealSavedRecord ? "bg-emerald-550/[0.015] dark:bg-emerald-400/[0.01]" : "bg-transparent"
                                    }`}
                                  >
                                    <td className="py-2.5 px-3 text-center font-mono font-black text-slate-400 text-[10.5px]">
                                      {subNo}
                                    </td>
                                    <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-slate-100">
                                      <div className="flex items-center gap-1.5">
                                        <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 ${
                                          hasRealSavedRecord ? "text-emerald-550" : "text-slate-300"
                                        }`} />
                                        <span>{sub.name}</span>
                                      </div>
                                    </td>
                                    <td className="py-2.5 px-3 text-[11px] text-slate-500 dark:text-slate-400 font-normal leading-relaxed truncate max-w-[180px]" title={sub.featureDesc}>
                                      {sub.featureDesc || "-"}
                                    </td>
                                    <td className="py-2.5 px-2 font-bold text-[10px]">
                                      <span className="bg-slate-105 dark:bg-slate-800 text-slate-650 dark:text-slate-400 px-1.5 py-0.5 rounded border border-slate-200">
                                        {sub.status || "Aktif"}
                                      </span>
                                    </td>
                                    <td className="py-2 px-2 font-bold text-[11px]">
                                      <span className={`px-2 py-0.5 rounded-full text-[10.5px] font-extrabold ${statusBadgeStyle}`}>
                                        {displayStatus}
                                      </span>
                                    </td>
                                    <td className="py-2 px-2 font-semibold text-slate-600 dark:text-slate-300">
                                      {displayDate}
                                    </td>
                                    <td className="py-2 px-2 font-bold text-[11px]">
                                      <span className={utilBadgeStyle}>
                                        {displayUtil}
                                      </span>
                                    </td>
                                    <td className="py-2 px-2 font-bold text-[11px] text-slate-600 dark:text-slate-350">
                                      {displayKat !== "-" ? (
                                        <span className="bg-blue-50/70 dark:bg-blue-950/25 text-blue-700 dark:text-blue-400 px-1.5 py-0.5 rounded border border-blue-100/30">
                                          {displayKat}
                                        </span>
                                      ) : "-"}
                                    </td>
                                    <td 
                                      className="py-2 px-3 text-slate-550 dark:text-slate-400 truncate max-w-[170px] font-medium" 
                                      title={displayRawKet}
                                    >
                                      {displayKet}
                                    </td>
                                    <td className="py-2 px-2 text-center">
                                      <div className="flex items-center justify-center gap-1.5">
                                        <button
                                          onClick={() => handleOpenFeatureModal(impl, sub, savedState)}
                                          className={`py-1 px-3.5 rounded-lg flex items-center gap-1.5 text-[11px] font-black cursor-pointer transition-all border ${
                                            hasRealSavedRecord 
                                              ? "bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-250 dark:bg-amber-950/30 dark:text-amber-400 dark:hover:bg-amber-900/30" 
                                              : "bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:hover:bg-blue-900/30"
                                          }`}
                                          title={hasRealSavedRecord ? "Lihat / Ubah Rincian Fitur" : "Atur Detail Realisasi"}
                                        >
                                          <Edit3 className="w-3.5 h-3.5" />
                                          <span>{hasRealSavedRecord ? "Atur" : "Daftar"}</span>
                                        </button>
                                        
                                        {hasRealSavedRecord && (
                                          <button
                                            onClick={() => handleResetFeatureDetail(sub.name, savedState.id)}
                                            className="p-1 px-1.5 text-red-650 hover:text-red-850 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/20 rounded-md border border-transparent hover:border-red-200/30 transition-all cursor-pointer"
                                            title="Hapus / Reset detail fitur ini"
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
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* DIALOG MODAL: ADD / EDIT INTEGRATED IMPLEMENTATION FORM */}
      <AnimatePresence>
        {isOpen && (
          <div id="site-implementation-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4">
            
            {/* Dark glass backdrop overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 bg-slate-950"
            />

            {/* Modal Dialog Body wrapper */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden font-sans transition-all"
            >
              {/* Card Header title banner */}
              <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-850 p-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-1.5">
                  <ClipboardList className="w-4.5 h-4.5 text-blue-600 dark:text-blue-450" />
                  <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider">
                    {isEditing ? "Perbarui Catatan Implementasi" : "Daftarkan Implementasi Baru"}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:text-slate-300 rounded-lg cursor-pointer transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Form content submission */}
              <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[78vh] overflow-y-auto">
                
                {/* Hospital / Site Client RS selection */}
                <div>
                  <label className="block text-[10px] uppercase font-black text-slate-400 tracking-wider mb-1">
                    Nama Client / Rumah Sakit <span className="text-red-500">*</span>
                  </label>
                  
                  {isUserScoped ? (
                    <div className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                      <Building2 className="w-4 h-4 text-slate-400" />
                      <span>{userSite}</span>
                    </div>
                  ) : (
                    <select
                      value={clientRS}
                      onChange={(e) => setClientRS(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-205 dark:border-slate-800 text-slate-800 dark:text-slate-100 px-3 py-2.5 rounded-xl font-bold text-xs focus:ring-2 focus:ring-blue-500/10 focus:outline-none cursor-pointer"
                    >
                      {allowedClients.map(c => (
                        <option key={c.id} value={c.namaRS}>{c.namaRS}</option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Modul Utama selection */}
                <div>
                  <label className="block text-[10px] uppercase font-black text-slate-400 tracking-wider mb-1">
                    Modul Utama <span className="text-red-500">*</span>
                  </label>
                  <select
                    disabled={isEditing}
                    value={appModuleId}
                    onChange={(e) => handleModuleChange(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-205 dark:border-slate-800 text-slate-800 dark:text-slate-100 px-3 py-2.5 rounded-xl font-bold text-xs focus:ring-2 focus:ring-blue-500/10 focus:outline-none cursor-pointer disabled:bg-slate-100 dark:disabled:bg-slate-900 disabled:text-slate-400"
                  >
                    {availableAppModules.map(m => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                    {availableAppModules.length === 0 && (
                      <option value="">-- Semua modul sudah terdaftar --</option>
                    )}
                  </select>
                  {availableAppModules.length === 0 && !isEditing && (
                    <span className="text-[9px] text-red-500 font-bold mt-1 block">
                      ⚠️ Semua modul SIMRS sudah diimplementasikan di RS ini!
                    </span>
                  )}
                </div>

                {/* Sub row - Status, Kategori, and Date */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  
                  {/* Status Implementasi */}
                  <div>
                    <label className="block text-[10px] uppercase font-black text-slate-400 tracking-wider mb-1">
                      Status Implementasi
                    </label>
                    <select
                      value={statusImplementasi}
                      onChange={(e) => handleMainStatusChange(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-205 dark:border-slate-800 text-slate-800 dark:text-slate-100 px-3 py-2.5 rounded-xl font-bold text-xs focus:ring-2 focus:ring-blue-500/10 focus:outline-none cursor-pointer"
                    >
                      {statusImplementasiList.map(item => (
                        <option key={item} value={item}>{item}</option>
                      ))}
                    </select>
                  </div>

                  {/* Status Penggunaan */}
                  <div>
                    <label className="block text-[10px] uppercase font-black text-slate-400 tracking-wider mb-1">
                      Status Utilisasi
                    </label>
                    <select
                      value={statusPenggunaan}
                      onChange={(e) => handleMainPenggunaanChange(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-205 dark:border-slate-800 text-slate-800 dark:text-slate-100 px-3 py-2.5 rounded-xl font-bold text-xs focus:ring-2 focus:ring-blue-500/10 focus:outline-none cursor-pointer"
                    >
                      {statusPenggunaanList.map(item => (
                        <option key={item} value={item}>{item}</option>
                      ))}
                    </select>
                  </div>

                  {/* Kategori Implementasi */}
                  <div>
                    <label className="block text-[10px] uppercase font-black text-slate-400 tracking-wider mb-1">
                      Kategori
                    </label>
                    <select
                      value={kategoriImplementasi}
                      onChange={(e) => handleMainKategoriChange(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-205 dark:border-slate-800 text-slate-800 dark:text-slate-100 px-3 py-2.5 rounded-xl font-bold text-xs focus:ring-2 focus:ring-blue-500/10 focus:outline-none cursor-pointer"
                    >
                      {kategoriImplementasiList.map(item => (
                        <option key={item} value={item}>{item}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Date input block and PIC Penanggungjawab assignment dropdown */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Tanggal Implementasi input */}
                  <div>
                    <label className="block text-[10px] uppercase font-black text-slate-400 tracking-wider mb-1">
                      Tanggal Implementasi
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5 pointer-events-none" />
                      <input
                        type="date"
                        value={tanggalImplementasi}
                        onChange={(e) => handleMainTanggalChange(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-205 dark:border-slate-800 text-slate-800 dark:text-slate-100 pl-10 pr-3 py-2.5 rounded-xl font-bold text-xs focus:ring-2 focus:ring-blue-500/10 focus:outline-none cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* PIC Implementasi (Site tugas match) */}
                  <div>
                    <label className="block text-[10px] uppercase font-black text-slate-400 tracking-wider mb-1">
                      PIC Penanggung Jawab
                    </label>
                    <div className="relative">
                      <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5 pointer-events-none" />
                      <select
                        value={picImplementasi}
                        onChange={(e) => setPicImplementasi(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-205 dark:border-slate-800 text-slate-800 dark:text-slate-100 pl-10 pr-3 py-2.5 rounded-xl font-bold text-xs focus:ring-2 focus:ring-blue-500/10 focus:outline-none cursor-pointer appearance-none"
                      >
                        {dynamicPICList.map(u => (
                          <option key={u.id} value={u.name}>
                            {u.name} {u.siteTugas ? `(${u.siteTugas})` : "(Global PIC)"}
                          </option>
                        ))}
                      </select>
                    </div>
                    {isPicListUsingFallback ? (
                      <span className="text-[9px] text-amber-500 font-bold mt-1 block">
                        ⚠️ Tidak ada staff bersite tugas di RS ini. Menampilkan PIC Global.
                      </span>
                    ) : (
                      <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold mt-1 block">
                        ✓ Disaring otomatis sesuai Site Tugas user.
                      </span>
                    )}
                  </div>
                </div>

                {/* Keterangan free text textarea input field */}
                <div>
                  <label className="block text-[10px] uppercase font-black text-slate-400 tracking-wider mb-1">
                    Keterangan Penjelasan / Catatan Tambahan (Modul Utama)
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Deskripsikan penyesuaian khusus, kondisi modul saat digunakan rujukan di lapangan, keluhan user RS, dll..."
                    value={keterangan}
                    onChange={(e) => setKeterangan(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-205 dark:border-slate-800 text-slate-800 dark:text-slate-100 p-3.5 rounded-xl font-semibold text-xs focus:ring-2 focus:ring-blue-500/10 focus:outline-none placeholder:text-slate-400"
                  />
                </div>

                {/* Form submit/close operations bar */}
                <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-805">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="px-4 py-2 bg-slate-105 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition-all cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={!appModuleId}
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-750 disabled:bg-slate-200 dark:disabled:bg-slate-800 text-white disabled:text-slate-400 text-xs font-black rounded-xl transition-all shadow-xs uppercase tracking-wider cursor-pointer"
                  >
                    {isEditing ? "Simpan Perubahan" : "Simpan Implementasi"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DIALOG MODAL: EDIT SUB-MODULE DETAIL POPUP */}
      <AnimatePresence>
        {featureModalData && (
          <div id="submodule-feature-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4">
            
            {/* Dark glass backdrop overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setFeatureModalData(null)}
              className="absolute inset-0 bg-slate-950/70"
            />

            {/* Modal Dialog Body wrapper */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden font-sans transition-all z-10"
            >
              {/* Card Header title banner */}
              <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-850 p-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Layers className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <div>
                    <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider">
                      Detail Rincian Realisasi Fitur
                    </h3>
                    <p className="text-[10px] text-slate-500 font-semibold mt-0.5">
                      Site: {featureModalData.parentImpl?.clientRS} • Modul: {featureModalData.parentImpl?.appModuleName}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setFeatureModalData(null)}
                  className="p-1 px-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:text-slate-300 rounded-lg cursor-pointer transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Form content submission */}
              <form onSubmit={handleSaveFeatureModal} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
                
                {/* Feature Identity Highlight */}
                <div className="p-3 bg-blue-50/50 dark:bg-blue-950/15 border border-blue-100/30 rounded-xl">
                  <div className="text-[10px] uppercase font-black text-blue-600 dark:text-blue-400 mb-1">
                    Nama Utama Fitur Rilis Master
                  </div>
                  <div className="text-xs font-black text-slate-900 dark:text-slate-50">
                    {featureModalData.subModuleName}
                  </div>
                  {featureModalData.subModuleDesc && (
                    <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                      {featureModalData.subModuleDesc}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Status Implementasi Fitur */}
                  <div>
                    <label className="block text-[10px] uppercase font-black text-slate-400 tracking-wider mb-1">
                      Status Implementasi Fitur <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={fStatusImplementasi}
                      onChange={(e) => setFStatusImplementasi(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-205 dark:border-slate-800 text-slate-800 dark:text-slate-100 px-3 py-2.5 rounded-xl font-bold text-xs focus:ring-2 focus:ring-blue-500/10 focus:outline-none cursor-pointer"
                    >
                      {statusImplementasiList.map(item => (
                        <option key={item} value={item}>{item}</option>
                      ))}
                    </select>
                  </div>

                  {/* Tanggal Implementasi Fitur */}
                  <div>
                    <label className="block text-[10px] uppercase font-black text-slate-400 tracking-wider mb-1">
                      Tanggal Implementasi Fitur <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={fTanggalImplementasi}
                      onChange={(e) => setFTanggalImplementasi(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-205 dark:border-slate-800 text-slate-800 dark:text-slate-100 px-3 py-2.5 rounded-xl font-bold text-xs focus:ring-2 focus:ring-blue-500/10 focus:outline-none cursor-pointer"
                    />
                  </div>

                  {/* Status Utilisasi Fitur */}
                  <div>
                    <label className="block text-[10px] uppercase font-black text-slate-400 tracking-wider mb-1">
                      Status Utilisasi / Penggunaan <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={fStatusPenggunaan}
                      onChange={(e) => setFStatusPenggunaan(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-205 dark:border-slate-800 text-slate-800 dark:text-slate-100 px-3 py-2.5 rounded-xl font-bold text-xs focus:ring-2 focus:ring-blue-500/10 focus:outline-none cursor-pointer"
                    >
                      {statusPenggunaanList.map(item => (
                        <option key={item} value={item}>{item}</option>
                      ))}
                    </select>
                  </div>

                  {/* Kategori Implementasi Fitur */}
                  <div>
                    <label className="block text-[10px] uppercase font-black text-slate-400 tracking-wider mb-1">
                      Kategori Implementasi <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={fKategoriImplementasi}
                      onChange={(e) => setFKategoriImplementasi(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-205 dark:border-slate-800 text-slate-800 dark:text-slate-100 px-3 py-2.5 rounded-xl font-bold text-xs focus:ring-2 focus:ring-blue-500/10 focus:outline-none cursor-pointer"
                    >
                      {kategoriImplementasiList.map(item => (
                        <option key={item} value={item}>{item}</option>
                      ))}
                    </select>
                  </div>

                </div>

                {/* PIC Implementasi Fitur */}
                <div>
                  <label className="block text-[10px] uppercase font-black text-slate-400 tracking-wider mb-1">
                    PIC Penanggungjawab Fitur <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={fPicImplementasi}
                    onChange={(e) => setFPicImplementasi(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-205 dark:border-slate-800 text-slate-800 dark:text-slate-100 px-3 py-2.5 rounded-xl font-bold text-xs focus:ring-2 focus:ring-blue-500/10 focus:outline-none cursor-pointer"
                  >
                    {modalSubModulePICList.map(u => (
                      <option key={u.id} value={u.name}>
                        {u.name} {u.siteTugas ? `(${u.siteTugas})` : "(Global PIC)"}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Catatan Khusus Fitur */}
                <div>
                  <label className="block text-[10px] uppercase font-black text-slate-400 tracking-wider mb-1">
                    Catatan Khusus Fitur ({featureModalData.parentImpl?.clientRS})
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Masukkan kendala lapangan, rencana tanyajawab lapangan, request kustomisasi fungsional, dll..."
                    value={fKeterangan}
                    onChange={(e) => setFKeterangan(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-205 dark:border-slate-800 text-slate-800 dark:text-slate-100 p-3.5 rounded-xl font-semibold text-xs focus:ring-2 focus:ring-blue-500/10 focus:outline-none placeholder:text-slate-400"
                  />
                </div>

                {/* Form submit/close operations bar */}
                <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-105 dark:border-slate-805">
                  <button
                    type="button"
                    onClick={() => setFeatureModalData(null)}
                    className="px-4 py-2 bg-slate-105 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition-all cursor-pointer"
                  >
                    Tutup
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-750 text-white text-xs font-black rounded-xl transition-all shadow-xs uppercase tracking-wider cursor-pointer"
                  >
                    Simpan Detail Fitur
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
