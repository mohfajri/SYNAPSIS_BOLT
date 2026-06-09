import React, { useState, useEffect } from "react";
import { 
  User, 
  Project, 
  Task, 
  CommLog, 
  MeetingLog, 
  Documentation, 
  LogEntry,
  Client,
  BALog,
  Ticket,
  AppModule,
  Asset,
  SiteModuleImplementation,
  MonevLog,
  BillingKSO
} from "./types";
import { 
  api, 
  getSavedUser, 
  getSavedToken, 
  saveSession, 
  clearSession 
} from "./lib/api";

// Sub-views Imports
import LoginView from "./components/LoginView";
import DashboardView from "./components/DashboardView";
import ProjectsView from "./components/ProjectsView";
import TasksView from "./components/TasksView";
import KanbanView from "./components/KanbanView";
import GanttView from "./components/GanttView";
import CalendarView from "./components/CalendarView";
import CollaborationViews from "./components/CollaborationViews";
import UsersView from "./components/UsersView";
import SettingsView from "./components/SettingsView";
import ClientsView from "./components/ClientsView";
import TicketsView from "./components/TicketsView";
import ApplicationModulesView from "./components/ApplicationModulesView";
import AssetsView from "./components/AssetsView";
import SiteModulesView from "./components/SiteModulesView";
import MonevView from "./components/MonevView";
import BillingKSOView from "./components/BillingKSOView";
import AtkOrdersView from "./components/AtkOrdersView";

// Icons
import { 
  LayoutDashboard, 
  FolderLock, 
  CheckSquare, 
  Trello, 
  Hourglass, 
  Calendar, 
  MessageSquare, 
  Users, 
  LogOut, 
  Menu, 
  X, 
  Sun, 
  Moon, 
  Database,
  CloudLightning,
  Clock,
  Bell,
  Check,
  ChevronDown,
  ChevronRight,
  Network,
  Building2,
  LifeBuoy,
  Cpu,
  Laptop,
  ClipboardList,
  Activity,
  Receipt,
  Package
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function App() {
  
  // Authorization Session State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isSessionLoading, setIsSessionLoading] = useState<boolean>(true);

  // Common configuration lists
  const modulsList = ["Front Office", "Back Office", "Admin", "Reporting", "API Integration", "UAT System"];
  const tasktypesList = ["Setting", "Fit and Gap", "Instalasi", "Training", "Security Audit", "Database Tune"];
  const asalsList = ["Tender", "Hibah", "Internal", "Penunjukan Langsung"];
  const pstatusesList = ["On Track", "Completed", "Delayed", "On Hold", "Cancelled"];
  const catProgsList = ["Prasyarat", "Aplikasi", "Infrastruktur & Hardware", "Training"];
  const prioritiesList = ["Urgent", "High", "Medium", "Low", "Very Low"];
  const progressStatusesList = ["Not Started", "In Progress", "Done", "Pending", "Cancelled", "Backlog"];

  // Layout View Mode & Sidebar
  const [currentView, setCurrentView] = useState<string>("dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [isSidebarMini, setIsSidebarMini] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem("sidebar_mini");
      return saved === "true";
    } catch {
      return false;
    }
  });
  const [themeMode, setThemeMode] = useState<'light' | 'dark'>(() => {
    try {
      const saved = localStorage.getItem("theme");
      if (saved === "dark" || saved === "light") {
        if (saved === "dark") {
          document.documentElement.classList.add("dark");
        } else {
          document.documentElement.classList.remove("dark");
        }
        return saved;
      }
      return document.documentElement.classList.contains("dark") ? "dark" : "light";
    } catch {
      return "light";
    }
  });

  const toggleSidebarMini = () => {
    setIsSidebarMini(prev => {
      const next = !prev;
      localStorage.setItem("sidebar_mini", String(next));
      return next;
    });
  };
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem("sidebar_collapsed_categories");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const toggleCategory = (catName: string) => {
    setCollapsedCategories(prev => {
      const next = { ...prev, [catName]: !prev[catName] };
      localStorage.setItem("sidebar_collapsed_categories", JSON.stringify(next));
      return next;
    });
  };

  // Real-time Indonesian clock
  const [currentTime, setCurrentTime] = useState<string>("");

  // DB States
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [commLogs, setCommLogs] = useState<CommLog[]>([]);
  const [meetingLogs, setMeetingLogs] = useState<MeetingLog[]>([]);
  const [baLogs, setBaLogs] = useState<BALog[]>([]);
  const [docs, setDocs] = useState<Documentation[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [appModules, setAppModules] = useState<AppModule[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [siteImplementations, setSiteImplementations] = useState<SiteModuleImplementation[]>([]);
  const [monevLogs, setMonevLogs] = useState<MonevLog[]>([]);
  const [billings, setBillings] = useState<BillingKSO[]>([]);
  const [settings, setSettings] = useState<any>({
    roles: [
      { roleName: "Administrator", allowedViews: ["settings", "users", "clients", "tickets", "appmodules", "sitemodules", "assets", "monev", "billing"], active: true },
      { roleName: "Direktur", allowedViews: ["dashboard", "projects", "tasks", "kanban", "gantt", "calendar", "collab", "tickets", "appmodules", "sitemodules", "assets", "clients", "users", "monev", "billing"], active: true },
      { roleName: "Manager", allowedViews: ["dashboard", "projects", "tasks", "kanban", "gantt", "calendar", "collab", "tickets", "appmodules", "sitemodules", "assets", "clients", "users", "monev", "billing"], active: true },
      { roleName: "Manager Keuangan", allowedViews: ["dashboard", "projects", "tasks", "kanban", "gantt", "calendar", "collab", "tickets", "appmodules", "sitemodules", "assets", "clients", "users", "monev", "billing"], active: true },
      { roleName: "Supervisor", allowedViews: ["dashboard", "projects", "tasks", "kanban", "gantt", "calendar", "collab", "tickets", "appmodules", "sitemodules", "assets", "monev", "billing"], active: true },
      { roleName: "Staff", allowedViews: ["dashboard", "projects", "tasks", "kanban", "gantt", "tickets", "monev", "billing"], active: true },
      { roleName: "Site Coordinator", allowedViews: ["dashboard", "projects", "tasks", "kanban", "gantt", "calendar", "collab", "tickets", "appmodules", "sitemodules", "assets", "monev", "billing"], active: true },
      { roleName: "System Support", allowedViews: ["dashboard", "projects", "tasks", "kanban", "gantt", "calendar", "collab", "tickets", "appmodules", "sitemodules", "assets", "monev", "billing"], active: true },
      { roleName: "Technical Support", allowedViews: ["dashboard", "projects", "tasks", "kanban", "gantt", "calendar", "collab", "tickets", "appmodules", "sitemodules", "assets", "monev", "billing"], active: true },
      { roleName: "Assistant Technical Support", allowedViews: ["dashboard", "projects", "tasks", "kanban", "gantt", "calendar", "collab", "tickets", "appmodules", "sitemodules", "assets", "monev", "billing"], active: true },
      { roleName: "Client", allowedViews: ["dashboard", "projects", "tasks", "tickets", "monev", "billing"], active: true },
      { roleName: "Project Lead", allowedViews: ["dashboard", "projects", "tasks", "kanban", "gantt", "calendar", "collab", "tickets", "appmodules", "sitemodules", "assets", "monev", "billing"], active: true },
      { roleName: "Developer", allowedViews: ["dashboard", "projects", "tasks", "kanban", "gantt", "tickets", "appmodules", "sitemodules", "assets", "monev", "billing"], active: true }
    ],
    milestoneStatuses: [
      { value: "On Track", active: true },
      { value: "Completed", active: true },
      { value: "Delayed", active: true },
      { value: "On Hold", active: true },
      { value: "Cancelled", active: true }
    ],
    taskTypes: [
      { value: "Setting", active: true },
      { value: "Fit and Gap", active: true },
      { value: "Instalasi", active: true },
      { value: "Training", active: true },
      { value: "Security Audit", active: true },
      { value: "Database Tune", active: true }
    ],
    catProgresses: [
      { value: "Prasyarat", active: true },
      { value: "Aplikasi", active: true },
      { value: "Infrastruktur & Hardware", active: true },
      { value: "Training", active: true }
    ],
    priorities: [
      { value: "Urgent", active: true },
      { value: "High", active: true },
      { value: "Medium", active: true },
      { value: "Low", active: true },
      { value: "Very Low", active: true }
    ],
    progressStatuses: [
      { value: "Not Started", active: true },
      { value: "In Progress", active: true },
      { value: "Done", active: true },
      { value: "Pending", active: true },
      { value: "Cancelled", active: true },
      { value: "Backlog", active: true }
    ],
    jenisModul: [
      { value: "Front Office", active: true },
      { value: "Back Office", active: true },
      { value: "Bridging", active: true }
    ],
    jenisAplikasiModul: [
      { value: "Web", active: true },
      { value: "Mobile", active: true }
    ],
    platformModul: [
      { value: "Web", active: true },
      { value: "Desktop", active: true }
    ],
    statusModul: [
      { value: "Aktif", active: true },
      { value: "Non Aktif", active: true },
      { value: "Dalam Pengembangan", active: true }
    ],
    statusImplementasiSite: [
      { value: "Berjalan", active: true },
      { value: "Tidak Berjalan", active: true }
    ],
    statusPenggunaan: [
      { value: "Optimal", active: true },
      { value: "Tidak Optimal", active: true }
    ],
    kategoriImplementasi: [
      { value: "Request", active: true },
      { value: "Pengembangan", active: true }
    ],
    tipeMedika: [
      { value: "Rumah Sakit", active: true },
      { value: "Klinik Utama", active: true },
      { value: "Klinik Pratama", active: true },
      { value: "Puskesmas", active: true },
      { value: "Laboratorium", active: true }
    ],
    tipeMedia: [
      { value: "WhatsApp", active: true },
      { value: "Email", active: true },
      { value: "Rapat", active: true },
      { value: "Telepon", active: true }
    ],
    kategoriDokumen: [
      { value: "MOM Rapat", active: true },
      { value: "Berita Acara", active: true },
      { value: "User Manual", active: true },
      { value: "Desain UI/UX", active: true },
      { value: "Dokumen Kontrak", active: true },
      { value: "API Specs", active: true }
    ],
    jenisBeritaAcara: [
      { value: "BA Serah Terima Alat", active: true },
      { value: "BA Instalasi Aplikasi", active: true },
      { value: "BA Training / Sosialisasi", active: true },
      { value: "BA Go-Live", active: true },
      { value: "BA Penyelesaian Pekerjaan", active: true }
    ],
    statusImplementasi: [
      { value: "Belum Mulai", active: true },
      { value: "Analisis Fit & Gap", active: true },
      { value: "Instalasi / Setting", active: true },
      { value: "Pelatihan User", active: true },
      { value: "Pendampingan UAT", active: true },
      { value: "Selesai Implementasi", active: true }
    ]
  });

  // ── USER-BASED CLIENT/SITE SCOPING FILTER ──
  // Treat 'Kantor Pusat' as global (Option 1)
  const isUserScoped = currentUser && 
    currentUser.siteTugas && 
    currentUser.siteTugas.toLowerCase().trim() !== "kantor pusat" &&
    currentUser.role !== "Administrator" && 
    currentUser.role !== "Direktur";
  const userSite = currentUser?.siteTugas || "";

  // Derived configuration list from active users to satisfy PIC selection dynamically
  // Filter out inactive users (statusAktif === false) and use distinct user nicknames
  // Filter out users who are Administrators, and if scoped, filter to their matching site
  const picsList = users.length > 0
    ? users.filter(u => {
        if (u.statusAktif === false) return false;
        if (u.role === "Administrator" || u.username === "admin") return false;
        if (isUserScoped && u.siteTugas && u.siteTugas.toLowerCase() !== userSite.toLowerCase()) return false;
        return true;
      }).map(u => u.nickname || u.username)
    : ["Fajar", "Nanda"];

  // Filtered computed views
  const scopedClients = isUserScoped 
    ? clients.filter(c => c.namaRS === userSite) 
    : clients;

  const scopedProjects = isUserScoped 
    ? projects.filter(p => p.client === userSite || p.createdBy === currentUser?.username) 
    : projects;

  const scopedTasks = isUserScoped 
    ? tasks.filter(t => {
        if (t.createdBy === currentUser?.username || (currentUser?.nickname && t.pic === currentUser.nickname)) {
          return true;
        }
        const proj = projects.find(p => p.kode === t.project);
        return proj ? proj.client === userSite : false;
      }) 
    : tasks;

  const scopedLogs = isUserScoped 
    ? logs.filter(l => {
        if (l.createdBy === currentUser?.username) return true;
        const proj = projects.find(p => p.id === l.projId || p.kode === l.projId);
        return proj ? proj.client === userSite : false;
      }) 
    : logs;

  const scopedCommLogs = isUserScoped 
    ? commLogs.filter(cl => {
        if (cl.createdBy === currentUser?.username) return true;
        const proj = projects.find(p => p.kode === cl.project);
        return proj ? proj.client === userSite : false;
      }) 
    : commLogs;

  // Collaboration: Meeting Logs
  const scopedMeetingLogs = isUserScoped 
    ? meetingLogs.filter(ml => {
        if (ml.createdBy === currentUser?.username) return true;
        const proj = projects.find(p => p.kode === ml.project);
        return proj ? proj.client === userSite : false;
      }) 
    : meetingLogs;

  const scopedBaLogs = isUserScoped 
    ? baLogs.filter(ba => {
        if (ba.createdBy === currentUser?.username) return true;
        const proj = projects.find(p => p.kode === ba.project);
        return proj ? proj.client === userSite : false;
      }) 
    : baLogs;

  const scopedDocs = isUserScoped 
    ? docs.filter(d => {
        if (d.createdBy === currentUser?.username) return true;
        const proj = projects.find(p => p.kode === d.project);
        return proj ? proj.client === userSite : false;
      }) 
    : docs;

  const scopedTickets = isUserScoped 
    ? tickets.filter(ti => ti.projectName === userSite || ti.createdBy === currentUser?.username) 
    : tickets;

  const scopedAppModules = appModules;

  const scopedAssets = isUserScoped 
    ? assets.filter(as => as.clientRS === userSite || as.createdBy === currentUser?.username) 
    : assets;

  const scopedSiteImplementations = isUserScoped 
    ? siteImplementations.filter(impl => impl.clientRS === userSite) 
    : siteImplementations;

  // Task shortcut modal link
  const [quickTaskStatusLink, setQuickTaskStatusLink] = useState<any>(null);
  const [directFocusedTaskId, setDirectFocusedTaskId] = useState<string | null>(null);

  // Profile Editor Modal states
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState<boolean>(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);
  const [profileName, setProfileName] = useState<string>("");
  const [profileNickname, setProfileNickname] = useState<string>("");
  const [profileEmail, setProfileEmail] = useState<string>("");
  const [profilePassword, setProfilePassword] = useState<string>("");
  const [profileError, setProfileError] = useState<string>("");
  const [profileSuccess, setProfileSuccess] = useState<string>("");

  function handleOpenProfileModal() {
    if (!currentUser) return;
    setProfileName(currentUser.name || "");
    setProfileNickname(currentUser.nickname || "");
    setProfileEmail(currentUser.email || "");
    setProfilePassword("");
    setProfileError("");
    setProfileSuccess("");
    setIsProfileModalOpen(true);
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!currentUser) return;
    setProfileError("");
    setProfileSuccess("");

    if (!profileName.trim() || !profileNickname.trim() || !profileEmail.trim()) {
      setProfileError("Semua kolom (kecuali sandi baru) wajib diisi!");
      return;
    }

    const payload: Partial<User> = {
      name: profileName.trim(),
      nickname: profileNickname.trim(),
      email: profileEmail.trim(),
    };

    if (profilePassword.trim()) {
      payload.password = profilePassword.trim();
    }

    try {
      const res = await api.updateUser(currentUser.id, payload);
      const nextUser = { ...currentUser, ...res };
      setCurrentUser(nextUser);
      localStorage.setItem("taskhub_user", JSON.stringify(nextUser));
      
      // Update users list state
      setUsers(prev => prev.map(u => u.id === currentUser.id ? { ...u, ...res } : u));
      
      setProfileSuccess("Profil Anda berhasil diperbarui!");
      setTimeout(() => {
        setIsProfileModalOpen(false);
      }, 1500);
    } catch (err: any) {
      setProfileError("Gagal memperbarui profil: " + err.message);
    }
  }

  // Notification center state
  const [isNotifOpen, setIsNotifOpen] = useState<boolean>(false);
  const [dismissedNotifIds, setDismissedNotifIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("dismissed_notifications");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const dismissNotification = (id: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    const next = [...dismissedNotifIds, id];
    setDismissedNotifIds(next);
    localStorage.setItem("dismissed_notifications", JSON.stringify(next));
  };

  const activeNotifications = React.useMemo(() => {
    if (!currentUser) return [];
    
    const userNickname = currentUser.nickname || currentUser.username;
    const items: any[] = [];

    // Check Projects
    projects.forEach(p => {
      if (p.pic && p.pic.toLowerCase() === userNickname.toLowerCase()) {
        const notifId = `proj-${p.id}`;
        if (!dismissedNotifIds.includes(notifId)) {
          items.push({
            id: notifId,
            type: "Project",
            title: "Penunjukan PIC Project",
            message: `Anda ditunjuk sebagai PIC utama untuk Project "${p.nama}" (${p.kode}).`,
            meta: p.status,
            viewTarget: "projects"
          });
        }
      }
    });

    // Check Tasks
    tasks.forEach(t => {
      if (t.pic && t.pic.toLowerCase() === userNickname.toLowerCase() && t.status !== "Done") {
        const notifId = `task-${t.id}`;
        if (!dismissedNotifIds.includes(notifId)) {
          items.push({
            id: notifId,
            type: "Tugas",
            title: "Tugaskan PIC Baru",
            message: `Tugas "${t.task}" ditugaskan ke Anda (${t.project}).`,
            meta: `Progress: ${t.progress}%`,
            viewTarget: "tasks"
          });
        }
      }
    });

    return items;
  }, [projects, tasks, currentUser, dismissedNotifIds]);

  // Load session security keys on mount
  useEffect(() => {
    const user = getSavedUser();
    const token = getSavedToken();
    if (user && token) {
      setCurrentUser(user);
      setIsAuthenticated(true);
      if (user.role === "Administrator") {
        setCurrentView("settings");
      }
    }
    setIsSessionLoading(false);

    // Initial theme check and sync
    try {
      const saved = localStorage.getItem("theme");
      if (saved === "dark") {
        document.documentElement.classList.add("dark");
        setThemeMode("dark");
      } else if (saved === "light") {
        document.documentElement.classList.remove("dark");
        setThemeMode("light");
      } else {
        const isDark = document.documentElement.classList.contains("dark");
        setThemeMode(isDark ? "dark" : "light");
      }
    } catch {
      // ignore
    }

    // Dynamic Clock
    const timer = setInterval(() => {
      const live = new Intl.DateTimeFormat("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hourCycle: "h23"
      }).format(new Date());
      setCurrentTime(live);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Sync state data on successful authentication
  useEffect(() => {
    if (isAuthenticated) {
      syncDatabase();
    }
  }, [isAuthenticated]);

  async function syncDatabase() {
    try {
      const [projD, taskD, logD, commD, meetD, docD, userD, settingsD, clientD, baD, ticketsD, appModulesD, assetsD, siteImplD, monevD, billingD] = await Promise.all([
        api.getProjects(),
        api.getTasks(),
        api.getLogs(),
        api.getCommLogs(),
        api.getMeetingLogs(),
        api.getDocs(),
        api.getUsers(),
        api.getSettings().catch(() => null),
        api.getClients().catch(() => []),
        api.getBALogs().catch(() => []),
        api.getTickets().catch(() => []),
        api.getAppModules().catch(() => []),
        api.getAssets().catch(() => []),
        api.getSiteImplementations().catch(() => []),
        api.getMonevLogs().catch(() => []),
        api.getBillings().catch(() => [])
      ]);
      setProjects(projD);
      setTasks(taskD);
      setLogs(logD);
      setCommLogs(commD);
      setMeetingLogs(meetD);
      setDocs(docD);
      setUsers(userD);
      setClients(clientD || []);
      setBaLogs(baD || []);
      setTickets(ticketsD || []);
      setAppModules(appModulesD || []);
      setAssets(assetsD || []);
      setSiteImplementations(siteImplD || []);
      setMonevLogs(monevD || []);
      setBillings(billingD || []);
      if (settingsD) {
        setSettings((prev: any) => ({
          ...prev,
          ...settingsD,
          jenisModul: settingsD.jenisModul || prev.jenisModul || [
            { value: "Front Office", active: true },
            { value: "Back Office", active: true },
            { value: "Bridging", active: true }
          ],
          jenisAplikasiModul: settingsD.jenisAplikasiModul || prev.jenisAplikasiModul || [
            { value: "Web", active: true },
            { value: "Mobile", active: true }
          ],
          platformModul: settingsD.platformModul || prev.platformModul || [
            { value: "Web", active: true },
            { value: "Desktop", active: true }
          ],
          statusModul: settingsD.statusModul || prev.statusModul || [
            { value: "Aktif", active: true },
            { value: "Non Aktif", active: true },
            { value: "Dalam Pengembangan", active: true }
          ],
          statusImplementasiSite: settingsD.statusImplementasiSite || prev.statusImplementasiSite || [
            { value: "Berjalan", active: true },
            { value: "Tidak Berjalan", active: true }
          ],
          statusPenggunaan: settingsD.statusPenggunaan || prev.statusPenggunaan || [
            { value: "Optimal", active: true },
            { value: "Tidak Optimal", active: true }
          ],
          kategoriImplementasi: settingsD.kategoriImplementasi || prev.kategoriImplementasi || [
            { value: "Request", active: true },
            { value: "Pengembangan", active: true }
          ],
          tipeMedika: settingsD.tipeMedika || prev.tipeMedika || [
            { value: "Rumah Sakit", active: true },
            { value: "Klinik Utama", active: true },
            { value: "Klinik Pratama", active: true },
            { value: "Puskesmas", active: true },
            { value: "Laboratorium", active: true }
          ],
          tipeMedia: settingsD.tipeMedia || prev.tipeMedia || [
            { value: "WhatsApp", active: true },
            { value: "Email", active: true },
            { value: "Rapat", active: true },
            { value: "Telepon", active: true }
          ],
          kategoriDokumen: settingsD.kategoriDokumen || prev.kategoriDokumen || [
            { value: "MOM Rapat", active: true },
            { value: "Berita Acara", active: true },
            { value: "User Manual", active: true },
            { value: "Desain UI/UX", active: true },
            { value: "Dokumen Kontrak", active: true },
            { value: "API Specs", active: true }
          ],
          jenisBeritaAcara: settingsD.jenisBeritaAcara || prev.jenisBeritaAcara || [
            { value: "BA Serah Terima Alat", active: true },
            { value: "BA Instalasi Aplikasi", active: true },
            { value: "BA Training / Sosialisasi", active: true },
            { value: "BA Go-Live", active: true },
            { value: "BA Penyelesaian Pekerjaan", active: true }
          ],
          statusImplementasi: settingsD.statusImplementasi || prev.statusImplementasi || [
            { value: "Belum Mulai", active: true },
            { value: "Analisis Fit & Gap", active: true },
            { value: "Instalasi / Setting", active: true },
            { value: "Pelatihan User", active: true },
            { value: "Pendampingan UAT", active: true },
            { value: "Selesai Implementasi", active: true }
          ]
        }));
      }
    } catch (err) {
      console.warn("[DB] Error syncing backend databases, running in offline-ready state:", err);
    }
  }

  // Handle Authentication Callbacks
  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
    if (user.role === "Administrator") {
      setCurrentView("settings");
    } else {
      setCurrentView("dashboard");
    }
  };

  const handleLogout = () => {
    clearSession();
    setCurrentUser(null);
    setIsAuthenticated(false);
  };

  // Toggle dark/light theme classes manually
  function toggleThemeMode() {
    const next = themeMode === "light" ? "dark" : "light";
    setThemeMode(next);
    try {
      localStorage.setItem("theme", next);
    } catch {
      // ignore
    }
    if (next === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }

  // ── OPERATIONS WRAPPER (POSTGRES / EXPREES API SINKERS) ──

  // Project CRUD
  async function handleAddProject(data: Partial<Project>) {
    try {
      let finalClient = data.client;
      if (isUserScoped) {
        finalClient = userSite;
      }
      const payload = { ...data, client: finalClient, createdBy: currentUser?.username || "System" };
      const res = await api.createProject(payload);
      setProjects(prev => [...prev, res]);
    } catch (err) {
      alert("Gagal menyimpan project baru: " + err);
    }
  }

  async function handleUpdateProject(id: string, data: Partial<Project>) {
    try {
      let finalData = { ...data };
      if (isUserScoped) {
        finalData.client = userSite;
      }
      const res = await api.updateProject(id, finalData);
      setProjects(prev => prev.map(p => p.id === id ? res : p));
    } catch (err) {
      alert("Gagal memperbarui project: " + err);
    }
  }

  async function handleDeleteProject(id: string) {
    try {
      await api.deleteProject(id);
      setProjects(prev => prev.filter(p => p.id !== id));
      // CASCADE delete local tasks linked to this code
      const p = projects.find(x => x.id === id);
      if (p) {
        setTasks(prev => prev.filter(t => t.project !== p.kode));
      }
    } catch (err) {
      alert("Gagal menghapus project: " + err);
    }
  }

  // Task CRUD
  async function handleAddTask(data: Partial<Task>) {
    try {
      const payload = { ...data, createdBy: currentUser?.username || "System" };
      const res = await api.createTask(payload);
      setTasks(prev => [res, ...prev]);
    } catch (err) {
      alert("Gagal menyimpan tugas baru: " + err);
    }
  }

  async function handleUpdateTask(id: string, data: Partial<Task>) {
    try {
      const res = await api.updateTask(id, data);
      setTasks(prev => prev.map(t => t.id === id ? res : t));
    } catch (err) {
      alert("Gagal merubah tugas: " + err);
    }
  }

  async function handleDeleteTask(id: string) {
    try {
      await api.deleteTask(id);
      setTasks(prev => prev.filter(t => t.id !== id));
    } catch (err) {
      alert("Gagal menghapus tugas: " + err);
    }
  }

  // Diagnostic Logs Creators
  async function handleAddDiagnosticLog(projId: string, type: 'kendala' | 'solusi' | 'fokus', text: string, date: string) {
    try {
      const res = await api.createLog({ projId, type, text, date, createdBy: currentUser?.username || "System" });
      setLogs(prev => [...prev, res]);
    } catch (err) {
      alert("Gagal menambah catatan diagnostik: " + err);
    }
  }

  async function handleDeleteDiagnosticLog(id: string) {
    try {
      await api.deleteLog(id);
      setLogs(prev => prev.filter(l => l.id !== id));
    } catch (err) {
      alert("Gagal menghapus catatan diagnostik: " + err);
    }
  }

  // Collaboration: Comm Logs
  async function handleAddCommLog(data: Partial<CommLog>) {
    try {
      const payload = { ...data, createdBy: currentUser?.username || "System" };
      const res = await api.createCommLog(payload);
      setCommLogs(prev => [res, ...prev]);
    } catch (err) {
      alert("Gagal menambah log komunikasi: " + err);
    }
  }

  async function handleDeleteCommLog(id: string) {
    try {
      await api.deleteCommLog(id);
      setCommLogs(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      alert("Gagal menghapus log komunikasi: " + err);
    }
  }

  async function handleUpdateCommLog(id: string, data: Partial<CommLog>) {
    try {
      const res = await api.updateCommLog(id, data);
      setCommLogs(prev => prev.map(c => c.id === id ? res : c));
    } catch (err) {
      alert("Gagal memperbarui log komunikasi: " + err);
    }
  }

  // Collaboration: Meeting Logs
  async function handleAddMeetingLog(data: Partial<MeetingLog>) {
    try {
      const payload = { ...data, createdBy: currentUser?.username || "System" };
      const res = await api.createMeetingLog(payload);
      setMeetingLogs(prev => [res, ...prev]);
    } catch (err) {
      alert("Gagal menambah Minutes of Meeting (MoM): " + err);
    }
  }

  async function handleDeleteMeetingLog(id: string) {
    try {
      await api.deleteMeetingLog(id);
      setMeetingLogs(prev => prev.filter(m => m.id !== id));
    } catch (err) {
      alert("Gagal menghapus MoM: " + err);
    }
  }

  async function handleUpdateMeetingLog(id: string, data: Partial<MeetingLog>) {
    try {
      const res = await api.updateMeetingLog(id, data);
      setMeetingLogs(prev => prev.map(m => m.id === id ? res : m));
    } catch (err) {
      alert("Gagal memperbarui MoM: " + err);
    }
  }

  // Collaboration: Docs repositories
  async function handleAddDoc(data: Partial<Documentation>) {
    try {
      const payload = { ...data, createdBy: currentUser?.username || "System" };
      const res = await api.createDoc(payload);
      setDocs(prev => [res, ...prev]);
    } catch (err) {
      alert("Gagal menyimpan dokumen baru: " + err);
    }
  }

  async function handleDeleteDoc(id: string) {
    try {
      await api.deleteDoc(id);
      setDocs(prev => prev.filter(d => d.id !== id));
    } catch (err) {
      alert("Gagal menghapus dokumen: " + err);
    }
  }

  async function handleUpdateDoc(id: string, data: Partial<Documentation>) {
    try {
      const res = await api.updateDoc(id, data);
      setDocs(prev => prev.map(d => d.id === id ? res : d));
    } catch (err) {
      alert("Gagal memperbarui dokumen: " + err);
    }
  }

  // Collaboration: Berita Acara (BA) Logs
  async function handleAddBALog(data: Partial<BALog>) {
    try {
      const payload = { ...data, createdBy: currentUser?.username || "System" };
      const res = await api.createBALog(payload);
      setBaLogs(prev => [res, ...prev]);
    } catch (err) {
      alert("Gagal menambah Berita Acara (BA): " + err);
    }
  }

  async function handleDeleteBALog(id: string) {
    try {
      await api.deleteBALog(id);
      setBaLogs(prev => prev.filter(ba => ba.id !== id));
    } catch (err) {
      alert("Gagal menghapus Berita Acara (BA): " + err);
    }
  }

  async function handleUpdateBALog(id: string, data: Partial<BALog>) {
    try {
      const res = await api.updateBALog(id, data);
      setBaLogs(prev => prev.map(ba => ba.id === id ? res : ba));
    } catch (err) {
      alert("Gagal memperbarui Berita Acara (BA): " + err);
    }
  }

  // Administrator User Account Creation
  async function handleAddUser(data: Partial<User>) {
    try {
      const payload = {
        username: data.username,
        password: data.password,
        role: data.role,
        name: data.name || (data.username ? data.username.charAt(0).toUpperCase() + data.username.slice(1) : "User Pelaksana"),
        nickname: data.nickname || (data.username || "Nick"),
        email: data.email || `${data.username || "user"}@taskhub.com`,
        siteTugas: data.siteTugas || "",
        statusAktif: data.statusAktif !== undefined ? data.statusAktif : true
      };
      const res = await api.createUser(payload);
      setUsers(prev => [...prev, res]);
    } catch (err) {
      alert("Gagal membuat kredensial user baru: " + err);
    }
  }

  async function handleDeleteUser(id: string) {
    try {
      await api.deleteUser(id);
      setUsers(prev => prev.filter(u => u.id !== id));
    } catch (err) {
      alert("Gagal menghapus user: " + err);
    }
  }

  async function handleUpdateUser(id: string, data: Partial<User>) {
    try {
      const res = await api.updateUser(id, data);
      setUsers(prev => prev.map(u => u.id === id ? { ...u, ...res } : u));
      if (currentUser && currentUser.id === id) {
        const nextUser = { ...currentUser, ...res };
        setCurrentUser(nextUser);
        localStorage.setItem("taskhub_user", JSON.stringify(nextUser));
      }
    } catch (err) {
      alert("Gagal memperbarui data user: " + err);
    }
  }

  // Clients CRUD Handlers
  async function handleAddClient(data: Partial<Client>) {
    try {
      const payload = { ...data, createdBy: currentUser?.username || "System" };
      const res = await api.createClient(payload);
      setClients(prev => [...prev, res]);
    } catch (err: any) {
      alert(`Gagal menambah data Client: ${err.message}`);
    }
  }

  async function handleUpdateClient(id: string, data: Partial<Client>) {
    try {
      const res = await api.updateClient(id, data);
      setClients(prev => prev.map(cl => cl.id === id ? { ...cl, ...res } : cl));
    } catch (err: any) {
      alert(`Gagal mengubah data Client: ${err.message}`);
    }
  }

  async function handleDeleteClient(id: string) {
    try {
      await api.deleteClient(id);
      setClients(prev => prev.filter(cl => cl.id !== id));
    } catch (err: any) {
      alert(`Gagal menghapus data Client: ${err.message}`);
    }
  }

  // Ticket / Helpdesk operations
  async function handleAddTicket(data: Partial<Ticket>) {
    try {
      let finalProjectName = data.projectName;
      if (isUserScoped) {
         finalProjectName = userSite;
      }
      const payload = { ...data, projectName: finalProjectName, createdBy: currentUser?.username || "System" };
      const res = await api.createTicket(payload);
      setTickets(prev => [res, ...prev]);
    } catch (err: any) {
      alert(`Gagal menambah tiket helpdesk: ${err.message}`);
    }
  }

  async function handleUpdateTicket(id: string, data: Partial<Ticket>) {
    try {
      let finalData = { ...data };
      if (isUserScoped) {
        finalData.projectName = userSite;
      }
      const res = await api.updateTicket(id, finalData);
      setTickets(prev => prev.map(tk => tk.id === id ? { ...tk, ...res } : tk));
    } catch (err: any) {
      alert(`Gagal memperbarui tiket helpdesk: ${err.message}`);
    }
  }

  async function handleDeleteTicket(id: string) {
    try {
      await api.deleteTicket(id);
      setTickets(prev => prev.filter(tk => tk.id !== id));
    } catch (err: any) {
      alert(`Gagal menghapus tiket helpdesk: ${err.message}`);
    }
  }

  // App Modules operations
  async function handleAddAppModule(data: Partial<AppModule>) {
    try {
      let finalProjectName = data.projectName;
      if (isUserScoped) {
         finalProjectName = userSite;
      }
      const payload = { ...data, projectName: finalProjectName, createdBy: currentUser?.username || "System" };
      const res = await api.createAppModule(payload);
      setAppModules(prev => [res, ...prev]);
    } catch (err: any) {
      alert(`Gagal menambah modul utama: ${err.message}`);
    }
  }

  async function handleUpdateAppModule(id: string, data: Partial<AppModule>) {
    try {
      let finalData = { ...data };
      if (isUserScoped) {
        finalData.projectName = userSite;
      }
      const res = await api.updateAppModule(id, finalData);
      setAppModules(prev => prev.map(am => am.id === id ? { ...am, ...res } : am));
    } catch (err: any) {
      alert(`Gagal memperbarui modul utama: ${err.message}`);
    }
  }

  async function handleDeleteAppModule(id: string) {
    try {
      await api.deleteAppModule(id);
      setAppModules(prev => prev.filter(am => am.id !== id));
    } catch (err: any) {
      alert(`Gagal menghapus modul utama: ${err.message}`);
    }
  }

  // Assets operations
  async function handleAddAsset(data: Partial<Asset>) {
    try {
      let finalClientRS = data.clientRS;
      if (isUserScoped) {
         finalClientRS = userSite;
      }
      const payload = { ...data, clientRS: finalClientRS, createdBy: currentUser?.username || "System" };
      const res = await api.createAsset(payload);
      setAssets(prev => [res, ...prev]);
    } catch (err: any) {
      alert(`Gagal menambah data aset: ${err.message}`);
    }
  }

  async function handleUpdateAsset(id: string, data: Partial<Asset>) {
    try {
      let finalData = { ...data };
      if (isUserScoped) {
        finalData.clientRS = userSite;
      }
      const res = await api.updateAsset(id, finalData);
      setAssets(prev => prev.map(as => as.id === id ? { ...as, ...res } : as));
    } catch (err: any) {
      alert(`Gagal memperbarui data aset: ${err.message}`);
    }
  }

  async function handleDeleteAsset(id: string) {
    try {
      await api.deleteAsset(id);
      setAssets(prev => prev.filter(as => as.id !== id));
    } catch (err: any) {
      alert(`Gagal menghapus data aset: ${err.message}`);
    }
  }

  async function handleAddSiteImplementation(data: Partial<SiteModuleImplementation>) {
    try {
      const res = await api.createSiteImplementation(data);
      setSiteImplementations(prev => [res, ...prev]);
      return res;
    } catch (err: any) {
      alert(`Gagal mendaftarkan implementasi: ${err.message}`);
      throw err;
    }
  }

  async function handleUpdateSiteImplementation(id: string, data: Partial<SiteModuleImplementation>) {
    try {
      const res = await api.updateSiteImplementation(id, data);
      setSiteImplementations(prev => prev.map(impl => impl.id === id ? { ...impl, ...res } : impl));
      return res;
    } catch (err: any) {
      alert(`Gagal mengubah rincian implementasi: ${err.message}`);
      throw err;
    }
  }

  async function handleDeleteSiteImplementation(id: string) {
    try {
      await api.deleteSiteImplementation(id);
      setSiteImplementations(prev => prev.filter(impl => impl.id !== id));
    } catch (err: any) {
      alert(`Gagal menghapus implementasi: ${err.message}`);
      throw err;
    }
  }

  // Administrator Settings operations
  async function handleUpdateSettings(newSettings: any) {
    try {
      const res = await api.updateSettings(newSettings);
      setSettings(res);
    } catch (err: any) {
      alert("Gagal menyimpan konfigurasi sistem: " + err.message);
    }
  }

  async function handleCascadeRename(category: string, oldValue: string, newValue: string) {
    try {
      if (category === "milestoneStatuses") {
        const targetProjects = projects.filter(p => p.status === oldValue);
        for (const p of targetProjects) {
          await api.updateProject(p.id, { status: newValue });
        }
        setProjects(prev => prev.map(p => p.status === oldValue ? { ...p, status: newValue } : p));
      } else if (category === "taskTypes") {
        const targetTasks = tasks.filter(t => t.taskType === oldValue);
        for (const t of targetTasks) {
          await api.updateTask(t.id, { taskType: newValue });
        }
        setTasks(prev => prev.map(t => t.taskType === oldValue ? { ...t, taskType: newValue } : t));
      } else if (category === "catProgresses") {
        const targetTasks = tasks.filter(t => t.categoryProgress === oldValue);
        for (const t of targetTasks) {
          await api.updateTask(t.id, { categoryProgress: newValue });
        }
        setTasks(prev => prev.map(t => t.categoryProgress === oldValue ? { ...t, categoryProgress: newValue } : t));
      } else if (category === "priorities") {
        const targetTasks = tasks.filter(t => t.priority === oldValue);
        for (const t of targetTasks) {
          await api.updateTask(t.id, { priority: newValue });
        }
        setTasks(prev => prev.map(t => t.priority === oldValue ? { ...t, priority: newValue } : t));
      } else if (category === "progressStatuses") {
        const targetTasks = tasks.filter(t => t.status === oldValue);
        for (const t of targetTasks) {
          await api.updateTask(t.id, { status: newValue });
        }
        setTasks(prev => prev.map(t => t.status === oldValue ? { ...t, status: newValue } : t));
      } else if (category === "roles") {
        const targetUsers = users.filter(u => u.role === oldValue);
        for (const u of targetUsers) {
          await api.updateUser(u.id, { role: newValue });
        }
        setUsers(prev => prev.map(u => u.role === oldValue ? { ...u, role: newValue } : u));
      }
    } catch (err: any) {
      console.warn("[Cascade Sync Error] Gagal merespons rename rujukan:", err);
    }
  }

  // Custom persistent pic coloring helper
  const picThemeColors = (picName: string) => {
    const list = [
      "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400 border border-amber-200/50",
      "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400 border border-blue-200/50",
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 border border-emerald-250/50",
      "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-400 border border-purple-200/50",
      "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-400 border border-indigo-200/50",
      "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400 border border-rose-250/50"
    ];
    let sum = 0;
    const nameStr = picName || "Unassigned";
    for (let i = 0; i < nameStr.length; i++) sum += nameStr.charCodeAt(i);
    return list[sum % list.length];
  };

  // Quick addition channel on Kanban Board
  function handleAddTaskQuickOnKanban(status: any) {
    setQuickTaskStatusLink(status);
    setCurrentView("tasks");
  }

  // Bubble details triggers
  function handleOpenTaskDetailDirectly(id: string) {
    setDirectFocusedTaskId(id);
    setCurrentView("tasks");
  }

  // Monitoring & Evaluasi (Monev) CRUD Operations
  async function handleAddMonevLog(data: Partial<MonevLog>) {
    try {
      const payload = { ...data, createdBy: currentUser?.username || "System" };
      const res = await api.createMonevLog(payload);
      setMonevLogs(prev => [res, ...prev]);
    } catch (err) {
      alert("Gagal menambahkan catatan evaluasi baru: " + err);
    }
  }

  async function handleUpdateMonevLog(id: string, data: Partial<MonevLog>) {
    try {
      const res = await api.updateMonevLog(id, data);
      setMonevLogs(prev => prev.map(m => m.id === id ? res : m));
    } catch (err) {
      alert("Gagal memperbarui catatan evaluasi: " + err);
    }
  }

  async function handleDeleteMonevLog(id: string) {
    try {
      await api.deleteMonevLog(id);
      setMonevLogs(prev => prev.filter(m => m.id !== id));
    } catch (err) {
      alert("Gagal menghapus catatan evaluasi: " + err);
    }
  }

  // Billing KSO Handlers
  async function handleAddBilling(data: Partial<BillingKSO>) {
    try {
      const res = await api.createBilling(data);
      setBillings(prev => [res, ...prev]);
    } catch (err) {
      alert("Gagal menambahkan data billing: " + err);
    }
  }

  async function handleUpdateBilling(id: string, data: Partial<BillingKSO>) {
    try {
      const res = await api.updateBilling(id, data);
      setBillings(prev => prev.map(b => b.id === id ? res : b));
    } catch (err) {
      alert("Gagal memperbarui data billing: " + err);
    }
  }

  async function handleDeleteBilling(id: string) {
    try {
      await api.deleteBilling(id);
      setBillings(prev => prev.filter(b => b.id !== id));
    } catch (err) {
      alert("Gagal menghapus data billing: " + err);
    }
  }

  // Pre-authenticator render check
  if (isSessionLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center font-sans select-none">
        <div className="text-center space-y-3">
          <CloudLightning className="w-12 h-12 text-blue-500 animate-bounce mx-auto" />
          <p className="text-slate-300 font-bold text-sm tracking-wider">MENGHUBUNGKAN POSTGRESQL SECURE ENGINE...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginView onLoginSuccess={handleLoginSuccess} />;
  }

  // Categorized template of layout groupings
  const categoriesDef = [
    {
      name: "Dashboard",
      items: [
        { id: "dashboard", label: "Dashboard Portal", icon: LayoutDashboard }
      ]
    },
    {
      name: "Task Master",
      items: [
        { id: "projects", label: "Project Master", icon: FolderLock },
        { id: "tasks", label: "Tugas & Progress", icon: CheckSquare },
        { id: "monev", label: "Monitoring & Evaluasi", icon: Activity }
      ]
    },
    {
      name: "Visualisasi",
      items: [
        { id: "kanban", label: "Kanban Timeline", icon: Trello },
        { id: "gantt", label: "Gantt Timeline", icon: Hourglass },
        { id: "calendar", label: "Kalender Deadline", icon: Calendar }
      ]
    },
    {
      name: "Dokumentation",
      items: [
        { id: "collab", label: "Arsip Kolaborasi", icon: MessageSquare }
      ]
    },
    {
      name: "Operasional & Aset",
      items: [
        { id: "tickets", label: "Helpdesk & Troubleshoot", icon: LifeBuoy },
        { id: "appmodules", label: "Registrasi Modul SIMRS", icon: Cpu },
        { id: "sitemodules", label: "Implementasi Modul per Site", icon: ClipboardList },
        { id: "assets", label: "Aset & Alat Tambahan", icon: Laptop },
        { id: "atk", label: "Pemesanan ATK (Logistik)", icon: Package },
        { id: "billing", label: "Billing KSO & ATK", icon: Receipt }
      ]
    },
    {
      name: "Administration",
      items: [
        { id: "clients", label: "Profile Client / RS", icon: Building2 },
        { id: "users", label: "Penyusunan Akun (CRUD)", icon: Users },
        { id: "settings", label: "Setting Sistem", icon: Database }
      ]
    }
  ];

  const userRoleConfig = settings?.roles?.find((r: any) => r.roleName === currentUser?.role);
  
  // Default values based on specifications
  let allowedViewIds = ["dashboard", "projects", "tasks", "kanban", "gantt", "calendar", "collab", "tickets", "appmodules", "assets"];
  if (currentUser?.role === "Administrator") {
    allowedViewIds = ["settings", "users", "clients", "tickets", "appmodules", "assets"];
  }

  if (userRoleConfig && userRoleConfig.active) {
    allowedViewIds = userRoleConfig.allowedViews;
  }

  const isKantorPusat = currentUser?.siteTugas?.toLowerCase().trim() === "kantor pusat";
  if ((isUserScoped || isKantorPusat) && !allowedViewIds.includes("clients")) {
    allowedViewIds = [...allowedViewIds, "clients"];
  }

  // Grant 'atk' view automatically for admin, dev, billing, site coordinator, or Logistik Kantor Pusat
  if ((currentUser?.role === "Administrator" || currentUser?.role === "Developer" || currentUser?.role === "Logistik Kantor Pusat" || allowedViewIds.includes("billing")) && !allowedViewIds.includes("atk")) {
    allowedViewIds = [...allowedViewIds, "atk"];
  }

  // Filter allowed visible system sidebar objects, grouped by category
  const activeCategories = categoriesDef
    .map(category => ({
      ...category,
      items: category.items.filter(item => allowedViewIds.includes(item.id))
    }))
    .filter(category => category.items.length > 0);

  return (
    <div className="h-screen w-screen overflow-hidden font-sans bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 transition-colors flex">
      
      {/* SIDEBAR NAVIGATION COLUMN */}
      <aside 
        className={`fixed inset-y-0 left-0 z-40 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 py-4 flex flex-col justify-between transform transition-all duration-300 md:translate-x-0 md:static md:h-screen shrink-0 overflow-hidden ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} ${isSidebarMini ? "w-64 px-4 md:w-16 md:px-2" : "w-64 px-4"}`}
      >
        {/* Brand header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div 
            className={`flex items-center gap-2 ${isSidebarMini ? "md:justify-center md:w-full" : ""}`}
            title="System for Networked Analytics, Project Synchronization and Integrated Services"
          >
            <Network className="w-6 h-6 text-blue-600 dark:text-blue-500 animate-pulse shrink-0" />
            <div className={isSidebarMini ? "md:hidden" : ""}>
              <h1 className="text-sm font-black text-slate-800 dark:text-white tracking-widest uppercase">SYNAPSIS</h1>
              <p className="text-[10px] text-blue-600 dark:text-blue-450 font-bold tracking-widest">ENTERPRISE PORTAL</p>
            </div>
          </div>
          <button 
            onClick={() => setIsSidebarOpen(false)} 
            className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white md:hidden cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* MIDDLE SCROLLABLE WRAPPER */}
        <div className="flex-1 overflow-y-auto py-3 space-y-4 pr-0.5 scrollbar-thin select-none">
          {/* User Account Quick Details Card */}
          <div 
            className={`bg-slate-50 dark:bg-slate-850 rounded-xl p-3 border border-slate-200 dark:border-slate-800 flex items-center gap-2 ${isSidebarMini ? "md:justify-center md:p-1.5" : ""}`}
            title={isSidebarMini ? `${currentUser?.name || currentUser?.username} (${currentUser?.role})` : undefined}
          >
            <span className="w-8 h-8 rounded-full bg-blue-650 font-black text-xs text-white flex items-center justify-center shrink-0">
              {currentUser?.username.slice(0, 2).toUpperCase()}
            </span>
            <div className={`min-w-0 flex-1 ${isSidebarMini ? "md:hidden" : ""}`}>
              <p className="text-xs font-black text-slate-800 dark:text-white truncate leading-tight">{currentUser?.name || currentUser?.username}</p>
              <p className="text-[9px] text-slate-500 dark:text-slate-400 font-bold mt-1 uppercase tracking-wider">{currentUser?.role}</p>
            </div>
          </div>

          {/* Menus Map items */}
          <div className="space-y-4">
            {activeCategories.map((cat, catIdx) => {
              const isCollapsed = !!collapsedCategories[cat.name];
              
              return (
                <div key={cat.name} className="space-y-1">
                  {/* Category Header */}
                  {isSidebarMini ? (
                    catIdx > 0 && <div className="border-t border-slate-100 dark:border-slate-800 my-2 hidden md:block" />
                  ) : (
                    <button
                      onClick={() => toggleCategory(cat.name)}
                      className="w-full text-left flex items-center justify-between text-[10px] font-black tracking-widest text-slate-400 dark:text-slate-500 uppercase py-1.5 select-none hover:text-slate-600 dark:hover:text-slate-350 transition-colors group cursor-pointer"
                    >
                      <span>{cat.name}</span>
                      <span className="p-0.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors">
                        {isCollapsed ? (
                          <ChevronRight className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5" />
                        )}
                      </span>
                    </button>
                  )}

                  {/* Mobile header (always normal list on mobile) */}
                  {isSidebarMini && (
                    <button
                      onClick={() => toggleCategory(cat.name)}
                      className="w-full text-left flex items-center justify-between text-[10px] font-black tracking-widest text-slate-400 dark:text-slate-500 uppercase py-1.5 select-none hover:text-slate-600 dark:hover:text-slate-350 transition-colors group cursor-pointer md:hidden"
                    >
                      <span>{cat.name}</span>
                      <span className="p-0.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors">
                        {isCollapsed ? (
                          <ChevronRight className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5" />
                        )}
                      </span>
                    </button>
                  )}

                  {/* Items List */}
                  {(!isCollapsed || isSidebarMini) && (
                    <div className={`space-y-1 ${isSidebarMini ? "md:ml-0 md:pl-0 md:border-l-0" : "pl-1 border-l border-slate-100 dark:border-slate-800 ml-1"}`}>
                      {cat.items.map((item) => {
                        const Icon = item.icon;
                        const isActive = currentView === item.id;
                        
                        return (
                          <button
                            key={item.id}
                            title={item.label}
                            onClick={() => {
                              setCurrentView(item.id);
                              // On mobile, auto collapse sidebar
                              if (window.innerWidth < 768) {
                                setIsSidebarOpen(false);
                              }
                            }}
                            className={`w-full flex items-center gap-2.5 rounded-lg text-xs font-bold transition-all transition-colors cursor-pointer ${
                              isSidebarMini 
                                ? "px-3 py-1.5 md:px-0 md:py-2 md:justify-center" 
                                : "px-3 py-1.5"
                            } ${
                              isActive 
                                ? "bg-blue-600 text-white shadow-xs" 
                                : "text-slate-750 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                            }`}
                          >
                            <Icon className="w-4 h-4 opacity-90 shrink-0" />
                            <span className={`truncate ${isSidebarMini ? "md:hidden" : ""}`}>{item.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Dynamic Indonesia Time, server host indicator & Logout Row */}
        <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-slate-800 shrink-0">
          <div 
            className={`flex items-center gap-2 bg-slate-55 mb-0.5 dark:bg-slate-850 px-3 py-1.5 rounded-lg text-[10px] font-bold border border-slate-200 dark:border-slate-800 ${isSidebarMini ? "md:justify-center md:px-0.5 md:py-1.5" : ""}`}
            title={`WITA TIME COORD: ${currentTime || "—"}`}
          >
            <Clock className="w-3.5 h-3.5 text-blue-600 dark:text-blue-550 shrink-0" />
            <div className={`flex-1 min-w-0 ${isSidebarMini ? "md:hidden" : ""}`}>
              <div className="text-slate-500 dark:text-slate-400 leading-none text-[9px]">WITA TIME COORD</div>
              <p className="text-slate-850 dark:text-white font-mono text-xs mt-0.5 font-bold leading-none">{currentTime || "—"}</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            title="Log out Session"
            className={`w-full flex items-center gap-2 px-3 py-1.5 border border-slate-200 dark:border-slate-800 hover:bg-red-500/10 hover:border-red-500/20 text-red-655 dark:text-red-400 hover:text-red-700 text-xs font-bold rounded-lg transition-colors bg-white dark:bg-transparent cursor-pointer ${isSidebarMini ? "md:justify-center md:px-0 md:py-1.5" : "justify-center"}`}
          >
            <LogOut className="w-3.5 h-3.5 shrink-0" /> 
            <span className={isSidebarMini ? "md:hidden" : ""}>Log out Session</span>
          </button>
        </div>
      </aside>

      {/* CORE CONTENT WORKSPACE FRAME */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        
        {/* TOP STATUS HEADER BAR */}
        <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-805 h-14 px-6 flex items-center justify-between shrink-0 shadow-xs">
          
          {/* Mobile hamburger menu toggle */}
          <div className="flex items-center gap-3">
            <button 
              onClick={() => {
                if (window.innerWidth < 768) {
                  setIsSidebarOpen(prev => !prev);
                } else {
                  toggleSidebarMini();
                }
              }}
              className="p-1.5 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg shrink-0 cursor-pointer"
              title="Toggle Sidebar Width"
            >
              <Menu className="w-5 h-5" />
            </button>
            
            <span className="text-xs font-black text-slate-400 dark:text-slate-500 hidden sm:inline-block tracking-widest uppercase">
              SUITE &bull; {currentView.toUpperCase()}
            </span>

            {currentUser?.siteTugas && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-extrabold text-[#2563eb] dark:text-[#60a5fa] bg-[#eff6ff] dark:bg-slate-900 border border-[#dbeafe] dark:border-slate-800 rounded-lg shrink-0">
                <Building2 className="w-3.5 h-3.5 shrink-0" />
                <span>Client Site: <span className="font-extrabold text-[#1d4ed8] dark:text-[#93c5fd]">{currentUser.siteTugas}</span></span>
              </div>
            )}
          </div>

          {/* Action triggers: Theme Mode Sun/Moon, PostgreSQL sync */}
          <div className="flex items-center gap-3 text-xs">
            <div className="items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/30 px-2.5 py-1 rounded hidden sm:flex">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>PostgreSQL Connected</span>
            </div>

            {/* Bell Notification Trigger & Popover */}
            <div className="relative">
              <button 
                onClick={() => setIsNotifOpen(prev => !prev)}
                className="p-1.5 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors relative"
                title={`${activeNotifications.length} Notifikasi baru`}
              >
                <Bell className={`w-4 h-4 ${activeNotifications.length > 0 ? "animate-bounce" : ""}`} />
                {activeNotifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[9px] font-black text-white flex items-center justify-center border border-white dark:border-slate-900 shadow-sm">
                    {activeNotifications.length}
                  </span>
                )}
              </button>

              {isNotifOpen && (
                <>
                  {/* Invisible backdrop to click away */}
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setIsNotifOpen(false)} 
                  />
                  
                  {/* Floating card list */}
                  <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 text-xs py-3 overflow-hidden">
                    <div className="px-4 pb-2 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                      <span className="font-extrabold text-slate-800 dark:text-white tracking-wide">Pemberitahuan PIC</span>
                      {activeNotifications.length > 0 && (
                        <span className="bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400 text-[9px] px-1.5 py-0.5 rounded-full font-bold">
                          {activeNotifications.length} Baru
                        </span>
                      )}
                    </div>

                    <div className="max-h-64 overflow-y-auto divide-y divide-slate-50 dark:divide-slate-800/50">
                      {activeNotifications.length === 0 ? (
                        <div className="py-8 text-center text-slate-400 font-medium">
                          <Bell className="w-8 h-8 mx-auto opacity-20 mb-1.5" />
                          Tidak ada notifikasi tugas baru.
                        </div>
                      ) : (
                        activeNotifications.map(n => (
                          <div 
                            key={n.id} 
                            onClick={() => {
                              setCurrentView(n.viewTarget);
                              setIsNotifOpen(false);
                            }}
                            className="p-3 hover:bg-slate-50 dark:hover:bg-slate-850 cursor-pointer transition-colors space-y-1"
                          >
                            <div className="flex justify-between items-start gap-2">
                              <span className="font-extrabold text-slate-800 dark:text-slate-150 line-clamp-1">{n.title}</span>
                              <span className="bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 text-[8px] px-1.5 py-0.5 rounded-full font-bold shrink-0 uppercase tracking-widest">{n.type}</span>
                            </div>
                            <p className="text-slate-500 dark:text-slate-450 font-medium leading-relaxed">{n.message}</p>
                            <div className="flex justify-between items-center pt-1">
                              <span className="text-[10px] text-slate-450 dark:text-slate-500 font-semibold">{n.meta}</span>
                              <button
                                onClick={(e) => dismissNotification(n.id, e)}
                                className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 text-emerald-600 rounded flex items-center gap-1 font-bold text-[10px]"
                                title="Tandai Sudah Dibaca"
                              >
                                <Check className="w-3.5 h-3.5" /> Tandai Selesai
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            <button 
              onClick={toggleThemeMode}
              className="p-1.5 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              title={themeMode === 'light' ? 'Mode Gelap' : 'Mode Terang'}
            >
              {themeMode === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsProfileMenuOpen(prev => !prev)}
                className="flex items-center gap-2 p-1.5 px-2.5 border border-slate-200 dark:border-slate-800 text-slate-755 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-850 rounded-lg transition-colors font-extrabold text-xs shrink-0 select-none cursor-pointer"
                title="Sistem Profile & Password"
              >
                <div className="w-5 h-5 rounded-full bg-blue-600 text-white font-black text-[10px] flex items-center justify-center shrink-0">
                  {currentUser?.nickname?.slice(0, 2).toUpperCase() || currentUser?.username?.slice(0, 2).toUpperCase()}
                </div>
                <span className="max-w-[70px] truncate hidden sm:inline text-[11px] select-none font-bold">
                  {currentUser?.nickname || currentUser?.username}
                </span>
              </button>

              {isProfileMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsProfileMenuOpen(false)} />
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 py-1.5 text-xs animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-805">
                      <p className="font-extrabold text-slate-800 dark:text-white truncate">{currentUser?.name}</p>
                      <p className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider mt-0.5">{currentUser?.role}</p>
                    </div>
                    <button
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        handleOpenProfileModal();
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-300 font-semibold flex items-center gap-2"
                    >
                      <span>👤 Edit Profil & Password</span>
                    </button>
                    <button
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        handleLogout();
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-red-50 dark:hover:bg-red-950/25 text-red-650 font-semibold border-t border-slate-100 dark:border-slate-850 flex items-center gap-2"
                    >
                      <span>🚪 Keluar Sesi</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* CONTAINER CONTENT WRAPPER WITH SCROLL-Y */}
        <main className="flex-1 overflow-y-auto p-6 transition-all">
          
          {currentView === "dashboard" && (
            <DashboardView 
              projects={scopedProjects}
              tasks={scopedTasks}
              onNavigateToView={(v) => setCurrentView(v)}
              onViewTaskDetail={handleOpenTaskDetailDirectly}
              picThemeColors={picThemeColors}
            />
          )}

          {currentView === "projects" && (
            <ProjectsView 
              projects={scopedProjects}
              tasks={scopedTasks}
              logs={scopedLogs}
              currentUser={currentUser}
              picsList={picsList}
              users={users}
              clients={scopedClients}
              modulsList={modulsList}
              asalsList={asalsList}
              pstatusesList={settings?.milestoneStatuses ? settings.milestoneStatuses.filter((x: any) => x.active).map((x: any) => x.value) : pstatusesList}
              catProgsList={settings?.catProgresses ? settings.catProgresses.filter((x: any) => x.active).map((x: any) => x.value) : catProgsList}
              picThemeColors={picThemeColors}
              onAddProject={handleAddProject}
              onUpdateProject={handleUpdateProject}
              onDeleteProject={handleDeleteProject}
              onAddDiagnosticLog={handleAddDiagnosticLog}
              onDeleteDiagnosticLog={handleDeleteDiagnosticLog}
              appModules={appModules}
              siteImplementations={siteImplementations}
              commLogs={scopedCommLogs}
              meetingLogs={scopedMeetingLogs}
            />
          )}

          {currentView === "tasks" && (
            <TasksView 
              tasks={scopedTasks}
              projects={scopedProjects}
              currentUser={currentUser}
              picsList={picsList}
              users={users}
              modulsList={modulsList}
              tasktypesList={settings?.taskTypes ? settings.taskTypes.filter((x: any) => x.active).map((x: any) => x.value) : tasktypesList}
              catProgsList={settings?.catProgresses ? settings.catProgresses.filter((x: any) => x.active).map((x: any) => x.value) : catProgsList}
              prioritiesList={settings?.priorities ? settings.priorities.filter((x: any) => x.active).map((x: any) => x.value) : prioritiesList}
              progressStatusesList={settings?.progressStatuses ? settings.progressStatuses.filter((x: any) => x.active).map((x: any) => x.value) : progressStatusesList}
              picThemeColors={picThemeColors}
              onAddTask={handleAddTask}
              onUpdateTask={handleUpdateTask}
              onDeleteTask={handleDeleteTask}
              initialOpenWithStatus={quickTaskStatusLink}
              onClearInitialStatus={() => setQuickTaskStatusLink(null)}
              commLogs={scopedCommLogs}
              meetingLogs={scopedMeetingLogs}
            />
          )}

          {currentView === "kanban" && (
            <KanbanView 
              tasks={scopedTasks}
              projects={scopedProjects}
              picsList={picsList}
              users={users}
              pstatusesList={settings?.milestoneStatuses ? settings.milestoneStatuses.filter((x: any) => x.active).map((x: any) => x.value) : pstatusesList}
              progressStatusesList={settings?.progressStatuses ? settings.progressStatuses.filter((x: any) => x.active).map((x: any) => x.value) : progressStatusesList}
              picThemeColors={picThemeColors}
              onUpdateTask={handleUpdateTask}
              onViewTaskDetail={handleOpenTaskDetailDirectly}
              onAddTaskQuick={handleAddTaskQuickOnKanban}
            />
          )}

          {currentView === "gantt" && (
            <GanttView 
              tasks={scopedTasks}
              projects={scopedProjects}
              picsList={picsList}
              users={users}
              pstatusesList={settings?.milestoneStatuses ? settings.milestoneStatuses.filter((x: any) => x.active).map((x: any) => x.value) : pstatusesList}
              picThemeColors={picThemeColors}
              onViewTaskDetail={handleOpenTaskDetailDirectly}
            />
          )}

          {currentView === "calendar" && (
            <CalendarView 
              tasks={scopedTasks}
              projects={scopedProjects}
              onViewTaskDetail={handleOpenTaskDetailDirectly}
            />
          )}

          {currentView === "collab" && (
            <CollaborationViews 
              commLogs={scopedCommLogs}
              meetingLogs={scopedMeetingLogs}
              baLogs={scopedBaLogs}
              docs={scopedDocs}
              projects={scopedProjects}
              currentUser={currentUser}
              onAddCommLog={handleAddCommLog}
              onUpdateCommLog={handleUpdateCommLog}
              onDeleteCommLog={handleDeleteCommLog}
              onAddMeetingLog={handleAddMeetingLog}
              onUpdateMeetingLog={handleUpdateMeetingLog}
              onDeleteMeetingLog={handleDeleteMeetingLog}
              onAddBALog={handleAddBALog}
              onUpdateBALog={handleUpdateBALog}
              onDeleteBALog={handleDeleteBALog}
              onAddDoc={handleAddDoc}
              onUpdateDoc={handleUpdateDoc}
              onDeleteDoc={handleDeleteDoc}
              tipeMediaList={settings?.tipeMedia ? settings.tipeMedia.filter((x: any) => x.active).map((x: any) => x.value) : undefined}
              jenisBeritaAcaraList={settings?.jenisBeritaAcara ? settings.jenisBeritaAcara.filter((x: any) => x.active).map((x: any) => x.value) : undefined}
            />
          )}

          {currentView === "tickets" && (
            <TicketsView 
              tickets={scopedTickets}
              clients={scopedClients}
              projects={scopedProjects}
              currentUser={currentUser}
              settings={settings}
              onAddTicket={handleAddTicket}
              onUpdateTicket={handleUpdateTicket}
              onDeleteTicket={handleDeleteTicket}
            />
          )}

          {currentView === "appmodules" && (
            <ApplicationModulesView 
              appModules={scopedAppModules}
              clients={scopedClients}
              projects={scopedProjects}
              currentUser={currentUser}
              settings={settings}
              onAddModule={handleAddAppModule}
              onUpdateModule={handleUpdateAppModule}
              onDeleteModule={handleDeleteAppModule}
            />
          )}

          {currentView === "sitemodules" && (
            <SiteModulesView 
              siteImplementations={scopedSiteImplementations}
              clients={scopedClients}
              appModules={scopedAppModules}
              users={users}
              currentUser={currentUser}
              settings={settings}
              onAddImplementation={handleAddSiteImplementation}
              onUpdateImplementation={handleUpdateSiteImplementation}
              onDeleteImplementation={handleDeleteSiteImplementation}
            />
          )}

          {currentView === "monev" && (
            <MonevView 
              monevLogs={monevLogs}
              projects={scopedProjects}
              tasks={scopedTasks}
              currentUser={currentUser}
              picsList={picsList}
              users={users}
              onAddMonevLog={handleAddMonevLog}
              onUpdateMonevLog={handleUpdateMonevLog}
              onDeleteMonevLog={handleDeleteMonevLog}
            />
          )}

          {currentView === "billing" && (
            <BillingKSOView 
              billings={billings}
              clients={scopedClients}
              currentUser={currentUser}
              onAddBilling={handleAddBilling}
              onUpdateBilling={handleUpdateBilling}
              onDeleteBilling={handleDeleteBilling}
            />
          )}

          {currentView === "atk" && (
            <AtkOrdersView 
              currentUser={currentUser}
              clients={scopedClients}
              onBillingAdded={() => {
                api.getBillings()
                  .then(data => setBillings(data))
                  .catch(err => console.error("Error refreshing billing list:", err));
              }}
            />
          )}

          {currentView === "assets" && (
            <AssetsView 
              assets={scopedAssets}
              clients={scopedClients}
              currentUser={currentUser}
              onAddAsset={handleAddAsset}
              onUpdateAsset={handleUpdateAsset}
              onDeleteAsset={handleDeleteAsset}
            />
          )}

          {currentView === "clients" && (currentUser?.role === "Administrator" || currentUser?.role === "Direktur" || isUserScoped || isKantorPusat) && (
            <ClientsView 
              clients={scopedClients}
              onAddClient={handleAddClient}
              onUpdateClient={handleUpdateClient}
              onDeleteClient={handleDeleteClient}
              tipeMedikaList={settings?.tipeMedika ? settings.tipeMedika.filter((x: any) => x.active).map((x: any) => x.value) : undefined}
              jenisModulList={settings?.jenisModul ? settings.jenisModul.filter((x: any) => x.active).map((x: any) => x.value) : undefined}
              statusImplementasiList={settings?.statusImplementasi ? settings.statusImplementasi.filter((x: any) => x.active).map((x: any) => x.value) : undefined}
              appModules={scopedAppModules}
              currentUser={currentUser}
            />
          )}

          {currentView === "users" && (currentUser?.role === "Administrator" || currentUser?.role === "Direktur") && (
            <UsersView 
              users={users}
              currentUser={currentUser}
              onAddUser={handleAddUser}
              onDeleteUser={handleDeleteUser}
              onUpdateUser={handleUpdateUser}
              rolesList={settings.roles || []}
              clientsList={clients}
            />
          )}

          {currentView === "settings" && currentUser?.role === "Administrator" && (
            <SettingsView 
              settings={settings}
              onUpdateSettings={handleUpdateSettings}
              users={users}
              projects={projects}
              tasks={tasks}
              clients={clients}
              onCascadeRename={handleCascadeRename}
            />
          )}

        </main>
      </div>

      {/* MODAL: EDIT MAIN CURRENT USER PROFILE & PASSWORD */}
      <AnimatePresence>
        {isProfileModalOpen && currentUser && (
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4"
            >
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
                <div>
                  <h3 className="font-extrabold text-base text-slate-800 dark:text-slate-100">
                    Pengaturan Profil Saya
                  </h3>
                  <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">Perbarui info personal dan kata sandi Anda.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsProfileModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 font-bold text-xl cursor-pointer"
                >
                  &times;
                </button>
              </div>

              {profileError && (
                <div className="p-2.5 bg-red-50 dark:bg-red-950/20 text-red-750 dark:text-red-400 text-[11px] font-extrabold rounded-lg border border-red-100 dark:border-red-900/30 flex items-center gap-1.5 animate-pulse">
                  <span>⚠️ {profileError}</span>
                </div>
              )}

              {profileSuccess && (
                <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-750 dark:text-emerald-400 text-[11px] font-extrabold rounded-lg border border-emerald-100 dark:border-emerald-900/30 text-center animate-bounce">
                  <span>✅ {profileSuccess}</span>
                </div>
              )}

              <form onSubmit={handleSaveProfile} className="space-y-3.5 text-xs">
                
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Username Akun</label>
                  <input
                    type="text"
                    disabled
                    value={currentUser.username}
                    className="bg-slate-100 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800/80 py-2 px-3 rounded-lg text-slate-400 dark:text-slate-600 font-semibold cursor-not-allowed uppercase text-[10px] tracking-widest"
                  />
                  <span className="text-[9px] text-slate-400 italic">Akun login unik bersifat statis.</span>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Hak Akses / Role</label>
                  <input
                    type="text"
                    disabled
                    value={currentUser.role}
                    className="bg-slate-100 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800/80 py-2 px-3 rounded-lg text-slate-400 dark:text-slate-600 font-semibold cursor-not-allowed text-[10px]"
                  />
                  <span className="text-[9px] text-slate-400 italic">Hak akses hanya bisa diubah oleh Administrator utama.</span>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Nama Lengkap *</label>
                  <input
                    type="text"
                    required
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    placeholder="Nama Lengkap Anda..."
                    className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-805 py-2 px-3 rounded-lg text-slate-800 dark:text-slate-100 font-semibold"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Nama Panggilan *</label>
                  <input
                    type="text"
                    required
                    value={profileNickname}
                    onChange={(e) => setProfileNickname(e.target.value)}
                    placeholder="Nama Panggilan Anda..."
                    className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-805 py-2 px-3 rounded-lg text-slate-800 dark:text-slate-100 font-semibold"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Alamat Email *</label>
                  <input
                    type="email"
                    required
                    value={profileEmail}
                    onChange={(e) => setProfileEmail(e.target.value)}
                    placeholder="Contoh: user@domain.com"
                    className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-805 py-2 px-3 rounded-lg text-slate-800 dark:text-slate-100 font-semibold"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Ganti Sandi / Password Baru</label>
                  <input
                    type="text"
                    value={profilePassword}
                    onChange={(e) => setProfilePassword(e.target.value)}
                    placeholder="Kosongkan jika tidak ingin diubah"
                    className="bg-slate-50 dark:bg-slate-950 border border-slate-205 py-2 px-3 rounded-lg text-slate-800 dark:text-slate-100 font-mono"
                  />
                  <span className="text-[9px] text-slate-400 italic">Wajib diingat untuk sesi login berikutnya!</span>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsProfileModalOpen(false)}
                    className="px-4 py-2 border border-slate-255 text-slate-505 dark:text-slate-400 text-xs font-semibold rounded-lg hover:bg-slate-50"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg hover:shadow-lg transition-all"
                  >
                    Simpan Perubahan
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
