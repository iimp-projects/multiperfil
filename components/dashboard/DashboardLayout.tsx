"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import {
  LayoutDashboard,
  Map as MapIcon,
  Settings,
  Bell,
  Menu,
  X,
  ChevronRight,
  Receipt,
  Users,
  ClipboardList,
  Radio,
  Sun,
  Moon,
  Lightbulb,
  BarChart,
  User,
  Ticket,
  Mail,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "@/store/useAuthStore";
import { LanguageSwitcher } from "../ui/LanguageSwitcher";
import { toast } from "sonner";
import {
  useVertical,
  Dialog,
  DialogContent,
  DialogTitle,
} from "@nrivera-iimp/ui-kit-iimp";
import { VOUCHER_STATUS } from "@/types/auth";
import { getFullImageUrl } from "@/lib/s3-utils";

interface SidebarItemProps {
  icon: React.ReactNode;
  label: React.ReactNode;
  href: string;
  active?: boolean;
  onClick?: () => void;
  target?: string;
  rel?: string;
}

const SidebarItem = ({
  icon,
  label,
  href,
  active,
  onClick,
  target,
  rel,
}: SidebarItemProps) => (
  <Link
    href={href}
    onClick={onClick}
    target={target}
    rel={rel}
    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
      active
        ? "bg-primary text-white shadow-lg shadow-primary/20"
        : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
    }`}
  >
    <div
      className={`${active ? "text-white" : "text-slate-400 group-hover:text-primary"} transition-colors`}
    >
      {icon}
    </div>
    <span className="font-semibold text-sm break-words">{label}</span>
    {active && <ChevronRight className="ml-auto w-4 h-4 opacity-70 shrink-0" />}
  </Link>
);

export type NotificationType =
  | "standard"
  | "image_only"
  | "expandable"
  | "modal"
  | "accordion";
export type NotificationVariant =
  | "success"
  | "info"
  | "warning"
  | "error"
  | "default";
export type NotificationCategory =
  | "pagos"
  | "eventos"
  | "networking"
  | "sistema"
  | "ventas"
  | "vouchers";

export type NotificationTab = "notifications" | "events" | "documents";

export interface AppNotification {
  id: string;
  type: NotificationType;
  variant?: NotificationVariant;
  category: NotificationCategory;
  userName?: string;
  userAvatar?: string;
  actionText?: string;
  title: string;
  description?: string;
  longDescription?: string;
  date: string;
  isRead: boolean;
  actionUrl?: string;
  logoUrl?: string;
  icon?: React.ReactNode;
  imageUrl?: string;
  htmlContent?: string;
}

export interface DashboardEvent {
  id: string;
  title: string;
  time: string;
  location: string;
  variant: "primary" | "success" | "warning" | "error";
  participants: string[];
}

const mockNotifications: AppNotification[] = [
  {
    id: "notif-1",
    type: "standard",
    category: "sistema",
    title: "Tu IA se ha vuelto más inteligente",
    description:
      "La velocidad de aprendizaje adaptativo aumentó un 27%. Nueva función: previsión de tendencias impulsada por IA",
    date: "hace 1h",
    isRead: false,
    icon: <Lightbulb size={18} className="text-amber-500" />,
  },
  {
    id: "notif-2",
    type: "standard",
    category: "sistema",
    title: "Análisis de datos completado",
    description:
      "Tu IA ha procesado más de 10,000 registros e identificado tendencias clave.",
    date: "hace 3h",
    isRead: false,
    icon: <BarChart size={18} className="text-blue-500" />,
  },
  {
    id: "notif-3",
    type: "accordion",
    category: "sistema",
    title: "Mantenimiento del sistema",
    description:
      "Se aplicarán ajustes de rendimiento y actualizaciones de seguridad.",
    longDescription:
      "El mantenimiento comenzará a las 2:00 AM UTC. Se espera que dure aproximadamente 30 minutos.",
    date: "hace 5h",
    isRead: true,
    icon: <Settings size={18} className="text-slate-500" />,
  },
  {
    id: "notif-4",
    type: "image_only",
    category: "eventos",
    actionText: "Ver evento",
    title: "Evento especial",
    imageUrl:
      "https://images.unsplash.com/photo-1540575861501-7cf05a4b125a?q=80&w=800&auto=format&fit=crop",
    date: "Ayer",
    isRead: false,
  },
  {
    id: "notif-5",
    type: "modal",
    category: "ventas",
    title: "Reporte Mensual Disponible",
    description:
      "Haz clic para ver el resumen detallado de ventas de este mes.",
    htmlContent: `
      <div class="space-y-4">
        <h4 class="text-lg font-bold">Resumen Detallado</h4>
        <p>Este mes hemos tenido un crecimiento del <strong>15%</strong> en comparación con el mes anterior.</p>
        <ul class="list-disc pl-5 space-y-2">
          <li>Ventas totales: $45,000</li>
          <li>Nuevos clientes: 120</li>
          <li>Países alcanzados: 12</li>
        </ul>
        <p>Puedes descargar el PDF completo desde el panel de administración.</p>
      </div>
    `,
    date: "Ayer",
    isRead: false,
    icon: <Receipt size={18} className="text-emerald-500" />,
  },
];

const mockEvents: DashboardEvent[] = [
  {
    id: "event-1",
    title: "Design Review with Timeless",
    time: "10:00 - 11:00 AM",
    location: "Mumbai, Maharashtra",
    variant: "success",
    participants: [
      "https://i.pravatar.cc/150?u=1",
      "https://i.pravatar.cc/150?u=2",
      "https://i.pravatar.cc/150?u=3",
    ],
  },
  {
    id: "event-2",
    title: "Conference Meeting",
    time: "4:30 - 5:00 PM",
    location: "Mumbai, Maharashtra",
    variant: "primary",
    participants: [
      "https://i.pravatar.cc/150?u=4",
      "https://i.pravatar.cc/150?u=5",
    ],
  },
  {
    id: "event-3",
    title: "Frappe + Timeless Standup",
    time: "4:30 - 5:00 PM",
    location: "Mumbai, Maharashtra",
    variant: "error",
    participants: ["https://i.pravatar.cc/150?u=6"],
  },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { vertical } = useVertical();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [activeTab, setActiveTab] = useState<NotificationTab>("notifications");
  const [notifications, setNotifications] =
    useState<AppNotification[]>(mockNotifications);
  const [modalNotification, setModalNotification] =
    useState<AppNotification | null>(null);

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
    );
  };

  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timeout);
  }, []);

  const isDark = theme === "dark";
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const _hasHydrated = useAuthStore((state) => state._hasHydrated);
  const kickedRef = useRef(false);

  const endSession = useCallback(
    async (reason?: string) => {
      if (kickedRef.current) return;
      kickedRef.current = true;

      try {
        await fetch("/api/auth/logout", { method: "POST" });
      } catch {
        // ignore
      }

      logout();
      if (reason) {
        toast.error("Sesión finalizada", { description: reason });
      }
      router.push("/");
    },
    [logout, router],
  );

  useEffect(() => {
    if (!_hasHydrated) return;
    if (!isAuthenticated) return;

    let alive = true;

    const validate = async () => {
      if (!alive || kickedRef.current) return;

      try {
        const res = await fetch("/api/auth/validate", { cache: "no-store" });
        if (res.ok) return;

        const payload = (await res.json().catch(() => null)) as {
          code?: string;
          message?: string;
        } | null;

        if (payload?.code === "SESSION_REPLACED") {
          await endSession(
            "Tu cuenta inició sesión en otro dispositivo. Por seguridad cerramos esta sesión.",
          );
          return;
        }

        await endSession("Tu sesión ya no es válida. Vuelve a iniciar sesión.");
      } catch {
        // If the server is temporarily unreachable, avoid kicking immediately.
      }
    };

    void validate();
    const id = window.setInterval(validate, 20000);

    return () => {
      alive = false;
      window.clearInterval(id);
    };
  }, [_hasHydrated, isAuthenticated, endSession]);

  // Check if user is up to date with payments (no PENDIENTE vouchers)
  const isPaidUser = React.useMemo(() => {
    if (!user?.comprobantes || user.comprobantes.length === 0) return false;
    return !user.comprobantes.some(
      (c) => c.estado === VOUCHER_STATUS.PENDIENTE,
    );
  }, [user]);

  const getLogo = () => {
    switch (vertical) {
      case "gess":
        return "/logos/logo-gess.png";
      case "wmc":
        return "/logos/logo-wmc.png";
      case "perumin":
        return "/logos/logo-perumin.png";
      case "proexplo":
        return "/logos/logo-iimp.png";
      default:
        return "/logos/logo-iimp.png";
    }
  };

  const mapLink = React.useMemo(() => {
    switch (vertical) {
      case "proexplo":
        return {
          href: "https://secure2.iimp.org:8443/planoproexplo/",
          target: "_blank",
          rel: "noopener noreferrer",
        };
      case "wmc":
        return {
          href: "https://wmc2026.org/exhibition-map/",
          target: "_blank",
          rel: "noopener noreferrer",
        };
      case "gess":
        return { href: "#" };
      default:
        return { href: "/dashboard/map" };
    }
  }, [vertical]);

  const navItems = [
    {
      icon: <LayoutDashboard size={20} />,
      label: "Panel Principal",
      href: "/dashboard",
    },
    {
      icon: <Receipt size={20} />,
      label: "Comprobantes y pagos",
      href: "/dashboard/vouchers",
    },
    {
      icon: <Ticket size={20} />,
      label: "Mis Cupones",
      href: "/dashboard/coupons",
    },
    {
      icon: <Mail size={20} />,
      label: "Mi buzón",
      href: "/dashboard/mailbox",
      hidden: true,
    },
    {
      icon: <MapIcon size={20} />,
      label: "Mapa del evento",
      ...mapLink,
      hidden: true,
    },
    {
      icon: <Radio size={20} className="text-red-500" />,
      label: (
        <div className="flex items-center gap-2">
          <span>Streaming</span>
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
          </span>
        </div>
      ),
      href: "/dashboard/streaming",
      hidden: true,
    },
  ];

  const networkingItems = [
    {
      icon: <User size={20} />,
      label: "Mi perfil",
      href: "/dashboard/profile",
    },
    {
      icon: <Users size={20} />,
      label: "Networking",
      href: "/dashboard/networking",
      hidden: true,
    },
  ];

  const secondaryItems = [
    {
      icon: <ClipboardList size={20} />,
      label: "Encuesta de satisfacción",
      href: "/dashboard/survey",
      hidden: true,
    },
    {
      icon: <Settings size={20} />,
      label: "Configuración",
      href: "/dashboard/settings",
    },
  ];

  return (
    <div className="fixed inset-0 bg-slate-50 flex overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 w-72 bg-white border-r border-slate-200 z-50 transform transition-transform duration-300 lg:relative lg:translate-x-0 ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="h-full flex flex-col">
          {/* Logo - Fixed top part */}
          <div className="p-6 pb-2">
            <div className="flex items-center gap-3 px-2 mb-8">
              <Image
                src={getLogo()}
                alt="Logo"
                fill
                className={`object-contain !relative !max-w-[150px] mx-auto ${vertical === "wmc" ? "!max-w-[200px]" : ""}`}
                priority
                unoptimized
              />
            </div>
          </div>

          {/* Navigation - Scrollable part */}
          <nav className="flex-1 px-6 overflow-y-auto custom-scrollbar overscroll-contain scroll-touch space-y-1.5 font-medium">
            <div className="px-2 mb-4">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
                Menú Principal
              </span>
            </div>
            {navItems
              .filter((item) => !item.hidden)
              .map((item) => (
                <SidebarItem
                  key={item.href}
                  {...item}
                  active={pathname === item.href}
                  onClick={() => setIsSidebarOpen(false)}
                />
              ))}

            {/* Networking */}
            <div className="pt-8 px-2 mb-4">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
                Networking
              </span>
            </div>
            {networkingItems
              .filter((item) => !item.hidden)
              .map((item) => (
                <SidebarItem
                  key={item.href}
                  {...item}
                  active={pathname === item.href}
                  onClick={() => setIsSidebarOpen(false)}
                />
              ))}

            <div className="pt-8 px-2 mb-4">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
                Sistema
              </span>
            </div>
            {secondaryItems
              .filter((item) => !item.hidden)
              .map((item) => (
                <SidebarItem
                  key={item.href}
                  {...item}
                  active={pathname === item.href}
                  onClick={() => setIsSidebarOpen(false)}
                />
              ))}

            {/* Bottom items moved inside scroll to ensure visibility on small screens */}
            <div className="mt-8 pt-6 border-t border-slate-100 pb-6">
              {/* <Link
                href="/support"
                onClick={() => setIsSidebarOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-500 hover:bg-slate-50 transition-colors group"
              >
                <HelpCircle
                  size={20}
                  className="text-slate-400 group-hover:text-primary transition-colors"
                />
                <span className="text-sm font-semibold">Soporte 2026</span>
              </Link> */}

              <button
                onClick={() => {
                  setIsSidebarOpen(false);
                  void endSession();
                }}
                className="w-full mt-2 flex items-center justify-start gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 transition-colors font-semibold text-sm h-auto bg-transparent border-none cursor-pointer"
              >
                <X size={20} />
                Cerrar Sesión
              </button>
            </div>
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-y-auto overflow-x-hidden custom-scrollbar overscroll-contain scroll-touch">
        {/* Header */}
        <header className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 py-4 flex items-center justify-between z-30">
          <div className="flex items-center gap-4 lg:gap-0">
            <button
              className="p-2 -ml-2 text-slate-500 lg:hidden cursor-pointer h-auto bg-transparent border-none"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu size={24} className="block lg:hidden" />
            </button>

            {/* Mobile Title */}
            <div className="lg:hidden ml-1">
              <span className="text-slate-900 font-black text-lg tracking-tight capitalize">
                {(() => {
                  const segments = pathname.split("/").filter(Boolean);
                  if (segments.length === 1 && segments[0] === "dashboard")
                    return "Dashboard";
                  const lastSegment = segments[segments.length - 1];
                  const routeMap: Record<string, string> = {
                    vouchers: "Pagos",
                    coupons: "Cupones",
                    mailbox: "Buzón",
                    map: "Mapa",
                    streaming: "Live",
                    profile: "Perfil",
                    networking: "Networking",
                    survey: "Encuesta",
                    settings: "Ajustes",
                  };
                  return routeMap[lastSegment] || lastSegment;
                })()}
              </span>
            </div>

            {/* Breadcrumbs */}
            <nav className="hidden md:flex items-center text-sm font-medium">
              <Link
                href="/dashboard"
                className="text-slate-400 hover:text-primary transition-colors flex items-center gap-2"
              >
                Dashboard
              </Link>

              {pathname !== "/dashboard" && (
                <>
                  <ChevronRight size={14} className="mx-2 text-slate-300" />
                  <span className="text-slate-900 font-bold capitalize tracking-tight">
                    {(() => {
                      const segments = pathname.split("/").filter(Boolean);
                      const lastSegment = segments[segments.length - 1];
                      const routeMap: Record<string, string> = {
                        vouchers: "Comprobantes y pagos",
                        coupons: "Mis Cupones",
                        mailbox: "Mi buzón",
                        map: "Mapa del evento",
                        streaming: "Streaming Live",
                        profile: "Mi perfil",
                        networking: "Networking",
                        survey: "Encuesta de satisfacción",
                        settings: "Configuración",
                      };
                      return routeMap[lastSegment] || lastSegment;
                    })()}
                  </span>
                </>
              )}

              {pathname === "/dashboard" && (
                <>
                  <ChevronRight size={14} className="mx-2 text-slate-300" />
                  <span className="text-slate-900 font-bold capitalize tracking-tight">
                    Resumen
                  </span>
                </>
              )}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setTheme(isDark ? "light" : "dark")}
              className="!hidden p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer h-auto bg-transparent border-none"
              title={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
            >
              {mounted ? (
                isDark ? (
                  <Moon
                    size={20}
                    className="text-slate-700 dark:text-slate-300"
                  />
                ) : (
                  <Sun
                    size={20}
                    className="text-slate-500 dark:text-slate-400"
                  />
                )
              ) : (
                <div className="w-5 h-5" />
              )}
            </button>

            <div className="flex p-1 rounded-xl">
              <LanguageSwitcher />
            </div>

            <button
              onClick={() => setIsNotificationsOpen(true)}
              className="!hidden cursor-pointer relative p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors h-auto bg-transparent border-none"
            >
              <Bell size={20} />
              <span className="absolute top-1 right-2 w-2 h-2 bg-green-400 rounded-full border-2 border-white animate-pulse-refined" />
            </button>
            <Link
              href="/dashboard/mailbox"
              className="!hidden cursor-pointer relative p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors"
            >
              <Mail size={20} />
              <span className="absolute top-1 right-2 w-2 h-2 bg-green-400 rounded-full border-2 border-white animate-pulse-refined" />
            </Link>

            <div className="h-8 w-px bg-slate-200 mx-2 hidden sm:block" />

            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-base font-normal text-slate-900 leading-none">
                  {user?.nombres} {user?.apellidoPaterno}
                </p>
                <p className="text-[10px] font-medium text-slate-500 mt-1 uppercase tracking-wider">
                  {user?.cargo || "Inscrito"}
                </p>
              </div>
              <div
                key={user?.picture || "no-picture"}
                className="w-10 h-10 rounded-full bg-slate-100 border-2 border-white shadow-sm flex items-center justify-center text-slate-600 font-bold overflow-hidden ring-2 ring-primary/10"
              >
                {user?.picture ? (
                  <Image
                    src={getFullImageUrl(user.picture) || ""}
                    alt="User"
                    width={40}
                    height={40}
                    className="w-full h-full object-cover"
                    unoptimized
                  />
                ) : (
                  <>
                    {user?.nombres?.[0]}
                    {user?.apellidoPaterno?.[0]}
                  </>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-10 mx-auto w-full max-w-7xl">
          {/* Premium Streaming Alert */}
          <div className="!hidden">
            <AnimatePresence>
              {isPaidUser && pathname === "/dashboard" && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-8 relative overflow-hidden group"
                >
                  <Link href="/dashboard/streaming">
                    <div className="relative overflow-hidden rounded-3xl p-6 bg-slate-900 shadow-2xl shadow-slate-200 group-hover:scale-[1.01] transition-all duration-500">
                      {/* Decorative Background Elements */}
                      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl group-hover:bg-primary/30 transition-colors" />
                      <div className="absolute bottom-0 left-0 w-48 h-48 bg-violet-500/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl" />

                      <div className="relative flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex md:flex-row flex-col items-center gap-5">
                          <div className="min-w-14! h-14  backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 shadow-xl group-hover:rotate-6 transition-transform !bg-white">
                            <Radio
                              className="text-red-500 animate-pulse"
                              size={28}
                            />
                          </div>
                          <div className="space-y-1 text-center md:text-left">
                            <h3 className="text-lg font-black text-white tracking-tight uppercase">
                              ¡Acceso Anticipado Disponible!
                            </h3>
                            <p className="text-slate-300 text-sm font-medium leading-relaxed">
                              Felicitaciones, estás al día en tus pagos y puedes{" "}
                              <span className="text-white font-bold underline decoration-primary decoration-2 underline-offset-4">
                                ver el evento antes que muchos
                              </span>
                              .
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <span className="hidden md:block text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            Click para ingresar
                          </span>
                          <div className="px-6 py-3 bg-white text-slate-950 font-black rounded-xl text-xs uppercase tracking-widest shadow-lg group-hover:bg-primary group-hover:text-white transition-all">
                            Streaming Live
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {children}
        </main>
      </div>

      {/* Notifications Sidebar Overlay */}
      <AnimatePresence>
        {isNotificationsOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              setIsNotificationsOpen(false);
              setIsMaximized(false);
            }}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex justify-end"
          />
        )}
      </AnimatePresence>

      {/* Notifications Sidebar */}
      <aside
        className={`fixed top-0 bottom-0 z-60 bg-white shadow-2xl transition-all duration-500 ease-in-out flex flex-col right-0 ${
          isNotificationsOpen
            ? isMaximized
              ? "md:right-1/2 md:translate-x-1/2 w-full md:w-[700px] md:h-[90vh] md:my-[5vh] md:rounded-3xl translate-x-0"
              : "w-full sm:w-[500px] translate-x-0"
            : "w-full sm:w-[500px] translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full overflow-hidden p-6 gap-6">
          {/* AI Center Header */}
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-slate-800">
              Centro de Notificaciones
            </h3>
            <button
              onClick={() => setIsNotificationsOpen(false)}
              className="text-slate-500 hover:text-slate-600 transition-colors h-auto p-2 bg-transparent border-none cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>

          {/* Time Tabs */}
          <div className="bg-slate-50 p-1 rounded-2xl flex">
            {[
              { id: "notifications", label: "Hoy" },
              { id: "events", label: "Esta semana" },
              { id: "documents", label: "Anteriores" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as NotificationTab)}
                className={`flex-1 py-1.5 text-sm font-bold rounded-xl transition-all h-auto border-none cursor-pointer ${
                  activeTab === tab.id
                    ? "bg-white text-slate-900 shadow-sm hover:bg-white"
                    : "bg-transparent text-slate-400 hover:text-slate-600"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* List Content */}
          <div className="flex-1 overflow-y-auto scrollbar-hide overscroll-contain scroll-touch">
            {activeTab === "notifications" && (
              <div className="space-y-4">
                {notifications.map((notif) => (
                  <motion.div
                    key={notif.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer group ${
                      notif.isRead
                        ? "bg-white border-slate-100 opacity-70"
                        : "bg-slate-50 border-primary/10 shadow-sm ring-1 ring-primary/5"
                    }`}
                    onClick={() => {
                      markAsRead(notif.id);
                      if (notif.type === "modal") setModalNotification(notif);
                    }}
                  >
                    <div className="flex gap-4">
                      <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm border border-slate-100 shrink-0 group-hover:scale-110 transition-transform">
                        {notif.icon || (
                          <Bell size={18} className="text-primary" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-black text-primary uppercase tracking-widest">
                            {notif.category}
                          </span>
                          <span className="text-[10px] font-medium text-slate-400">
                            {notif.date}
                          </span>
                        </div>
                        <h4 className="font-bold text-slate-900 text-sm mb-1 leading-tight">
                          {notif.title}
                        </h4>
                        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed font-medium">
                          {notif.description}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {activeTab === "events" && (
              <div className="space-y-6">
                {mockEvents.map((event) => (
                  <div
                    key={event.id}
                    className="relative pl-6 border-l-2 border-slate-100"
                  >
                    <div
                      className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-4 border-white shadow-sm ${
                        event.variant === "success"
                          ? "bg-emerald-500"
                          : event.variant === "warning"
                            ? "bg-amber-500"
                            : event.variant === "error"
                              ? "bg-red-500"
                              : "bg-primary"
                      }`}
                    />
                    <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                      <h4 className="font-bold text-slate-900">
                        {event.title}
                      </h4>
                      <div className="flex items-center gap-4 mt-2">
                        <span className="text-xs text-slate-400 font-medium">
                          {event.time}
                        </span>
                        <span className="text-xs text-slate-400 font-medium">
                          {event.location}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </aside>

      <Dialog
        open={!!modalNotification}
        onOpenChange={() => setModalNotification(null)}
      >
        <DialogContent className="max-w-2xl rounded-[2.5rem] p-0 overflow-hidden border-none">
          <div className="relative p-10 space-y-6">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none" />

            {modalNotification && (
              <>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                    {modalNotification.icon || <Bell size={32} />}
                  </div>
                  <div>
                    <span className="text-xs font-black text-primary uppercase tracking-[0.2em] mb-1 block">
                      {modalNotification.category}
                    </span>
                    <DialogTitle className="text-3xl font-black text-slate-900 tracking-tight">
                      {modalNotification.title}
                    </DialogTitle>
                  </div>
                </div>

                <div
                  className="text-slate-600 leading-relaxed font-medium text-lg"
                  dangerouslySetInnerHTML={{
                    __html:
                      modalNotification.htmlContent ||
                      modalNotification.description ||
                      "",
                  }}
                />

                <div className="flex justify-end pt-4">
                  <button
                    onClick={() => setModalNotification(null)}
                    className="h-12 px-8 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-all border-none cursor-pointer"
                  >
                    Entendido
                  </button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
