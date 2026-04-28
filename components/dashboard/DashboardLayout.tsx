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
  ChevronLeft,
  ChevronRight,
  Receipt,
  Users,
  ClipboardList,
  Radio,
  Sun,
  Moon,
  User,
  Ticket,
  Mail,
  LogOut,
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
import { getDynamicEventCode } from "@/lib/utils/event";
import { Capacitor } from "@capacitor/core";

interface SidebarItemProps {
  icon: React.ReactNode;
  label: React.ReactNode;
  href: string;
  active?: boolean;
  onClick?: () => void;
  target?: string;
  rel?: string;
}

type SidebarNavItem = SidebarItemProps & {
  hidden?: boolean;
};

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
  target?: string;
  logoUrl?: string;
  icon?: React.ReactNode;
  imageUrl?: string;
  htmlContent?: string;
}

import { usePortalStore } from "@/store/portal/usePortalStore";
import clsx from "clsx";

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

  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const _hasHydrated = useAuthStore((state) => state._hasHydrated);
  const {
    notifications,
    messages,
    fetchNotifications,
    fetchMessages,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification,
  } = usePortalStore();

  const prevIds = useRef<Set<string>>(new Set());
  const isFirstLoad = useRef(true);

  const [modalNotification, setModalNotification] =
    useState<AppNotification | null>(null);
  const [expandedNotifications, setExpandedNotifications] = useState<
    Set<string>
  >(new Set());

  const toggleExpand = (id: string) => {
    setExpandedNotifications((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const markAsRead = (id: string) => {
    if (user?.siecode) {
      markNotificationAsRead(id, user.siecode);
    }
  };

  const removeNotification = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (user?.siecode) {
      deleteNotification(id, user.siecode);
    }
  };

  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const notificationsByTab = {
    notifications: notifications.filter((n) => new Date(n.date) >= oneDayAgo),
    events: notifications.filter((n) => {
      const d = new Date(n.date);
      return d >= oneWeekAgo && d < oneDayAgo;
    }),
    documents: notifications.filter((n) => new Date(n.date) < oneWeekAgo),
  };

  useEffect(() => {
    if (!user?.siecode) return;

    const eventCode = getDynamicEventCode(vertical);

    const refreshData = () => {
      fetchNotifications(eventCode, user.siecode);
      fetchMessages(eventCode, user.siecode);
    };

    // Initial fetch
    refreshData();

    // Polling every 30 seconds
    const intervalId = setInterval(refreshData, 30000);

    return () => clearInterval(intervalId);
  }, [fetchNotifications, fetchMessages, user, vertical]);

  // Initial arming of the notification system
  useEffect(() => {
    const timer = setTimeout(() => {
      isFirstLoad.current = false;
    }, 2000); // 2 seconds delay to allow initial fetches to settle
    return () => clearTimeout(timer);
  }, []);

  // Sound logic for new notifications/messages
  useEffect(() => {
    const currentIds = new Set([
      ...notifications.map((n) => n.id),
      ...messages.map((m) => m.id),
    ]);

    // On first load or while system is warming up, we just populate the ref without playing sound
    if (isFirstLoad.current) {
      prevIds.current = currentIds;
      return;
    }

    // Check if there are any IDs in the current fetch that weren't there before
    const hasNewItems = Array.from(currentIds).some(
      (id) => !prevIds.current.has(id),
    );

    if (hasNewItems) {
      // Determine sound based on platform
      const platform = Capacitor.getPlatform();
      let soundPath = "/mp3/noti_android.mp3"; // Default for Android/Other

      if (platform === "ios") {
        soundPath = "/mp3/noti_iphone.mp3";
      } else if (platform === "web") {
        // Fallback detection for mobile browsers
        const ua = navigator.userAgent.toLowerCase();
        if (
          ua.includes("iphone") ||
          ua.includes("ipad") ||
          ua.includes("ipod")
        ) {
          soundPath = "/mp3/noti_iphone.mp3";
        }
      }

      const audio = new Audio(soundPath);
      audio
        .play()
        .catch((err) =>
          console.log("Audio play blocked by browser policy:", err),
        );
    }

    // Update the ref for next comparison
    prevIds.current = currentIds;
  }, [notifications, messages]);

  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timeout);
  }, []);

  const isDark = theme === "dark";
  const pathname = usePathname();
  const router = useRouter();
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

  const navItems: SidebarNavItem[] = [
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
    },
    {
      icon: <MapIcon size={20} />,
      label: "Mapa del evento",
      ...mapLink,
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
    },
  ];

  const networkingItems: SidebarNavItem[] = [
    {
      icon: <User size={20} />,
      label: "Mi perfil",
      href: "/dashboard/profile",
    },
    {
      icon: <Users size={20} />,
      label: "Networking",
      href: "/dashboard/networking",
    },
  ];

  const secondaryItems: SidebarNavItem[] = [
    {
      icon: <ClipboardList size={20} />,
      label: "Encuesta de satisfacción",
      href: "/dashboard/survey",
    },
    {
      icon: <Settings size={20} />,
      label: "Configuración",
      href: "/dashboard/settings",
    },
  ];

  return (
    <div className="min-h-[100dvh] bg-slate-50 flex">
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed  inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 w-72 bg-white border-r border-slate-200 z-50 transform transition-transform duration-300 lg:sticky lg:inset-y-auto lg:top-0 lg:h-[100dvh] lg:translate-x-0 ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
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
                <LogOut size={20} />
                Cerrar Sesión
              </button>
            </div>
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 min-h-[100dvh] overflow-x-hidden">
        {/* Header */}
        <header className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 py-4 flex items-center justify-between z-30">
          <div className="flex items-center gap-4 lg:gap-0">
            {pathname !== "/dashboard" && (
              <button
                className="p-2 -ml-2 text-slate-500 lg:hidden cursor-pointer h-auto bg-transparent border-none"
                onClick={() => {
                  if (
                    typeof window !== "undefined" &&
                    window.history.length > 1
                  ) {
                    router.back();
                    return;
                  }
                  router.push("/dashboard");
                }}
                aria-label="Volver"
                title="Volver"
              >
                <ChevronLeft size={24} className="block lg:hidden" />
              </button>
            )}
            <button
              className="p-2 -ml-2 text-slate-500 lg:hidden cursor-pointer h-auto bg-transparent border-none"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu size={24} className="block lg:hidden" />
            </button>

            {/* Mobile Title */}
            <div className="lg:hidden ml-1 !hidden">
              <span className="text-slate-900 font-black text-lg tracking-tight capitalize">
                {(() => {
                  const segments = pathname.split("/").filter(Boolean);
                  if (segments.length === 1 && segments[0] === "dashboard")
                    return "";
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
              onClick={() => {
                setIsNotificationsOpen(true);
                if (user?.siecode) {
                  const eventCode = getDynamicEventCode(vertical);
                  markAllNotificationsAsRead(eventCode, user.siecode);
                }
              }}
              className=" cursor-pointer relative p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors h-auto bg-transparent border-none"
            >
              <Bell size={20} />
              {notifications.some((n) => !n.isRead) && (
                <span className="absolute top-1 right-2 w-2 h-2 bg-green-400 rounded-full border-2 border-white animate-pulse-refined" />
              )}
            </button>
            <Link
              href="/dashboard/mailbox"
              className=" cursor-pointer relative p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors"
            >
              <Mail size={20} />
              {messages.some((m) => !m.isRead) && (
                <span className="absolute top-1 right-2 w-2 h-2 bg-green-400 rounded-full border-2 border-white animate-pulse-refined" />
              )}
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
        <main className="flex-1 p-4 sm:p-6 lg:p-10 mx-auto w-full l">
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
              {
                id: "notifications",
                label: "Hoy",
                count: notificationsByTab.notifications.length,
              },
              {
                id: "events",
                label: "Esta semana",
                count: notificationsByTab.events.length,
              },
              {
                id: "documents",
                label: "Anteriores",
                count: notificationsByTab.documents.length,
              },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as NotificationTab)}
                className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all h-auto border-none cursor-pointer flex items-center justify-center gap-2 ${
                  activeTab === tab.id
                    ? "bg-white text-slate-900 shadow-sm hover:bg-white"
                    : "bg-transparent text-slate-400 hover:text-slate-600"
                }`}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span
                    className={clsx(
                      "px-1.5 py-0.5 rounded-md text-[9px] font-black",
                      activeTab === tab.id
                        ? "bg-primary text-white"
                        : "bg-slate-200 text-slate-500",
                    )}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* List Content */}
          <div className="flex-1 overflow-y-auto scrollbar-hide overscroll-contain scroll-touch">
            <div className="space-y-4">
              {notificationsByTab[activeTab as keyof typeof notificationsByTab]
                .length === 0 ? (
                <div className="py-20 flex flex-col items-center justify-center text-slate-400 opacity-60">
                  <Bell className="w-12 h-12 mb-4 stroke-1" />
                  <p className="text-sm font-bold uppercase tracking-widest">
                    Sin novedades
                  </p>
                </div>
              ) : (
                notificationsByTab[
                  activeTab as keyof typeof notificationsByTab
                ].map((notif) => (
                  <motion.div
                    key={notif.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer group relative ${
                      notif.isRead
                        ? "bg-white border-slate-100 opacity-70"
                        : "bg-slate-50 border-primary/10 shadow-sm ring-1 ring-primary/5"
                    }`}
                    onClick={() => {
                      markAsRead(notif.id);
                      if (notif.type === "modal") {
                        setModalNotification(notif);
                      } else if (
                        notif.type === "expandable" ||
                        notif.type === "accordion"
                      ) {
                        toggleExpand(notif.id);
                      }
                    }}
                  >
                    {/* Delete button */}
                    <button
                      onClick={(e) => removeNotification(notif.id, e)}
                      className="absolute top-2 right-2 p-1 rounded-full bg-white/50 text-slate-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all z-10 border-none cursor-pointer"
                    >
                      <X size={14} />
                    </button>

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
                            {new Date(notif.date).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        <h4 className="font-bold text-slate-900 text-sm mb-1 leading-tight">
                          {notif.title}
                        </h4>
                        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed font-medium mb-2">
                          {notif.description}
                        </p>

                        {notif.actionUrl && notif.actionText && (
                          <div className="mt-2">
                            <Link
                              href={notif.actionUrl}
                              target={notif.target || "_self"}
                              className="inline-flex items-center text-[10px] font-bold text-primary hover:underline uppercase tracking-widest"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {notif.actionText} →
                            </Link>
                          </div>
                        )}

                        <AnimatePresence>
                          {expandedNotifications.has(notif.id) &&
                            notif.longDescription && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="mt-4 pt-4 border-t border-slate-100 overflow-hidden"
                              >
                                <div
                                  className="prose prose-sm prose-slate max-w-none text-slate-600 leading-relaxed"
                                  dangerouslySetInnerHTML={{
                                    __html: notif.longDescription,
                                  }}
                                />
                              </motion.div>
                            )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
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
                  className="text-slate-600 leading-relaxed font-medium text-lg prose prose-slate max-w-none"
                  dangerouslySetInnerHTML={{
                    __html:
                      modalNotification.longDescription ||
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
