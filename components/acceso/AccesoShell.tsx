"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  Users,
  LayoutDashboard,
  MessageSquare,
  Bell,
  Video,
  UsersRound,
  LogOut,
  ChevronRight,
  Shield,
} from "lucide-react";
import { useAdminAuthStore } from "@/store/acceso/useAdminAuthStore";
import { toast } from "sonner";

const NAV_ITEMS = [
  { href: "/acceso/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/acceso/usuarios", label: "Usuarios", icon: Users },
  { href: "/acceso/grupos", label: "Grupos", icon: UsersRound },
  { href: "/acceso/mensajes", label: "Mensajes", icon: MessageSquare },
  { href: "/acceso/alertas", label: "Alertas", icon: Bell },
  { href: "/acceso/streaming", label: "Streaming", icon: Video },
  { href: "/acceso/administradores", label: "Administradores", icon: Shield },
];

export default function AccesoShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { admin, selectedEvent, isAuthenticated, _hasHydrated, logoutAdmin } = useAdminAuthStore();

  useEffect(() => {
    if (!_hasHydrated) return;
    // Allow access to login page without auth
    if (pathname.startsWith("/acceso/login") || pathname.startsWith("/acceso/recovery")) return;
    if (!isAuthenticated) {
      router.replace("/acceso/login");
    }
  }, [_hasHydrated, isAuthenticated, pathname, router]);

  const handleLogout = () => {
    logoutAdmin();
    toast.success("Sesión cerrada correctamente.");
    router.push("/acceso/login");
  };

  // Show plain layout for login / recovery pages
  const isPublicRoute = pathname.startsWith("/acceso/login") || pathname.startsWith("/acceso/recovery");
  if (isPublicRoute) {
    return <>{children}</>;
  }

  // Guard: don't render content until hydrated and authenticated
  if (!_hasHydrated || !isAuthenticated) {
    return (
      <div className="h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-100 flex flex-col shadow-sm">
        {/* Logo area */}
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-sm font-black text-slate-900 tracking-tight leading-none">Admin IIMP</h1>
              <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">Gestión V2</p>
            </div>
          </div>
          {selectedEvent && (
            <div className="mt-4 px-3 py-2 bg-primary/5 border border-primary/10 rounded-xl">
              <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Evento activo</p>
              <p className="text-xs font-bold text-primary truncate mt-0.5">{selectedEvent}</p>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group ${
                  isActive
                    ? "bg-primary text-white shadow-lg shadow-primary/20"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-white" : "text-slate-400 group-hover:text-primary"} transition-colors`} />
                <span className="font-semibold text-sm flex-1">{item.label}</span>
                {isActive && <ChevronRight className="w-3 h-3 opacity-70" />}
              </Link>
            );
          })}
        </nav>

        {/* User info + logout */}
        <div className="p-4 border-t border-slate-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-black text-sm shrink-0">
              {admin?.name?.charAt(0)?.toUpperCase() ?? "A"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-800 truncate">{admin?.name ?? "Administrador"}</p>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">{admin?.role ?? "admin"}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold text-slate-500 hover:bg-red-50 hover:text-red-500 transition-colors border-none bg-transparent cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-100 flex items-center px-8 justify-between shadow-sm z-10">
          <div className="font-semibold text-slate-700">Panel Administrativo</div>
          <div className="flex items-center gap-3">
            {selectedEvent && (
              <span className="text-xs font-bold text-primary bg-primary/10 px-3 py-1.5 rounded-full uppercase tracking-wider">
                {selectedEvent}
              </span>
            )}
            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-black text-sm">
              {admin?.name?.charAt(0)?.toUpperCase() ?? "A"}
            </div>
          </div>
        </header>
        <div className="flex-1 overflow-auto p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
