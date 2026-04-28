"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useVertical } from "@nrivera-iimp/ui-kit-iimp";
import type { Vertical } from "@nrivera-iimp/ui-kit-iimp";
import {
  HiOutlineEye,
  HiOutlineEyeOff,
  HiOutlineLockClosed,
  HiArrowSmLeft,
  HiOutlineMail,
} from "react-icons/hi";
import { toast } from "sonner";
import { useAdminAuthStore } from "@/store/acceso/useAdminAuthStore";
import { authService } from "@/services/auth.service";
import { PulseWaves } from "../ui/PulseWaves";

// ── types ─────────────────────────────────────────────────────────────────────
interface EventOption {
  slug: Vertical;
  label: string;
  logo: string;
  originalName: string;
}

// ── event selector overlay ─────────────────────────────────────────────────────
function EventSelectorOverlay({
  events,
  onSelect,
}: {
  events: EventOption[];
  onSelect: (option: EventOption) => void;
}) {
  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-lg w-full animate-in fade-in zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-center mb-2">
          <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mb-3">
            <Image src="/logos/favicon-iimp.png" alt="IIMP" width={28} height={28} className="object-contain" unoptimized />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-center text-slate-800 mb-1">
          Panel Administrativo
        </h2>
        <p className="text-slate-500 text-center text-sm mb-6">
          Selecciona el evento que deseas administrar
        </p>
        {events.length === 0 ? (
          <div className="py-10 text-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-400 text-sm">Cargando eventos...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {events.map((item, idx) => (
              <button
                type="button"
                key={`${item.originalName}-${idx}`}
                onClick={() => onSelect(item)}
                className="flex flex-row items-center gap-3 p-4 rounded-2xl border border-slate-100 bg-slate-50 hover:bg-primary/5 hover:border-primary/20 transition-all duration-200 group cursor-pointer"
              >
                <div className="w-14 h-14 rounded-xl bg-white flex items-center justify-center shadow-sm p-2 group-hover:scale-110 transition-transform shrink-0">
                  <Image
                    src={item.logo}
                    alt={item.label}
                    width={36}
                    height={36}
                    className="object-contain w-full h-full"
                    unoptimized
                  />
                </div>
                <span className="flex-1 text-left font-semibold text-sm text-slate-700 group-hover:text-primary uppercase">
                  {item.label}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── main component ─────────────────────────────────────────────────────────────
export default function AdminLoginForm() {
  const router = useRouter();
  const { setVertical } = useVertical();
  const { setAdminAuth, isAuthenticated, _hasHydrated } = useAdminAuthStore();

  const [events, setEvents] = useState<EventOption[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<EventOption | null>(null);
  const [hasSelectedEvent, setHasSelectedEvent] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // redirect if already logged in as admin
  useEffect(() => {
    if (_hasHydrated && isAuthenticated) {
      router.replace("/acceso/dashboard");
    }
  }, [_hasHydrated, isAuthenticated, router]);

  // fetch event list (reuses existing endpoint)
  useEffect(() => {
    const fetchEvents = async () => {
      const data = await authService.getEventList();
      if (data?.Eventos) {
        const mapped: EventOption[] = data.Eventos.map((evt) => {
          const name = evt.Evento.toUpperCase();
          let slug: Vertical = "proexplo";
          let logo = "/logos/favicon-iimp.png";

          if (name.includes("PROEXPLO")) { slug = "proexplo"; logo = "/logos/favicon-iimp.png"; }
          else if (name.includes("WMC")) { slug = "wmc"; logo = "/logos/favicon-wmc.png"; }
          else if (name.includes("GESS")) { slug = "gess"; logo = "/logos/favicon-gess.png"; }
          else if (name.includes("PERUMIN")) { slug = "perumin"; logo = "/logos/favicon-perumin.png"; }

          return { slug, label: evt.Evento, logo, originalName: evt.Evento };
        });
        setEvents(mapped);
      }
    };
    fetchEvents();
  }, []);

  const handleEventSelect = (option: EventOption) => {
    setSelectedEvent(option);
    setVertical(option.slug);
    setHasSelectedEvent(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvent) {
      toast.error("Debes seleccionar un evento primero.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (data.success) {
        setAdminAuth(data.data, selectedEvent.originalName, selectedEvent.slug);
        toast.success(`¡Bienvenido, ${data.data.name}!`);
        router.push("/acceso/dashboard");
      } else {
        toast.error(data.message || "Error de autenticación.");
      }
    } catch {
      toast.error("Error de red. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Event Selector Overlay */}
      {!hasSelectedEvent && (
        <EventSelectorOverlay events={events} onSelect={handleEventSelect} />
      )}

      {/* Login Card */}
      <div className="relative flex flex-col lg:flex-row w-full max-w-5xl min-h-[620px] bg-white rounded-[3rem] overflow-hidden shadow-[0_40px_100px_-20px_rgba(0,0,0,0.15)] animate-in fade-in zoom-in-95 duration-700">
        {/* Left brand panel */}
        <div className="relative w-full lg:w-[42%] bg-gradient-to-br from-slate-900 via-primary/90 to-primary flex flex-col items-center justify-center p-12 overflow-hidden">
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-10 left-10 w-40 h-40 rounded-full bg-white blur-3xl" />
            <div className="absolute bottom-10 right-10 w-56 h-56 rounded-full bg-white blur-3xl" />
          </div>

          <div className="relative z-10 text-center text-white space-y-6">
            <div className="w-20 h-20 bg-white/10 backdrop-blur-sm rounded-3xl flex items-center justify-center mx-auto border border-white/20">
              <Image
                src="/logos/favicon-iimp.png"
                alt="IIMP"
                width={44}
                height={44}
                className="object-contain"
                unoptimized
              />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight">Panel Admin</h1>
              <p className="text-white/60 text-sm mt-2 font-medium">Sistema Multiperfil V2</p>
            </div>
            <div className="flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 w-fit mx-auto">
              <PulseWaves color="bg-green-400" />
              <span className="text-xs font-semibold text-white/80 uppercase tracking-widest ml-1">
                ACCESO RESTRINGIDO
              </span>
            </div>
            {selectedEvent && (
              <div className="mt-4 px-4 py-3 rounded-2xl bg-white/10 border border-white/20">
                <p className="text-xs text-white/50 uppercase tracking-wider mb-1">Evento activo</p>
                <p className="font-bold text-white text-sm">{selectedEvent.originalName}</p>
              </div>
            )}
          </div>
        </div>

        {/* Right form panel */}
        <div className="relative w-full lg:w-[58%] flex flex-col p-10 lg:p-16 bg-white">
          {/* Change event button */}
          {hasSelectedEvent && (
            <div className="absolute top-8 right-10">
              <button
                type="button"
                onClick={() => setHasSelectedEvent(false)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-slate-200 hover:border-primary/30 hover:bg-slate-50 text-slate-500 hover:text-primary transition-all text-[10px] font-bold uppercase tracking-wider shadow-sm cursor-pointer"
              >
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                Cambiar Evento
              </button>
            </div>
          )}

          <div className="max-w-sm w-full mx-auto flex-1 flex flex-col justify-center space-y-8 mt-8">
            <header className="space-y-2">
              <h2 className="text-3xl font-bold text-slate-900 tracking-tight">
                Acceso Administrativo
              </h2>
              <p className="text-slate-400 text-sm">
                Ingresa tus credenciales de administrador para continuar.
              </p>
            </header>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2 px-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                  CORREO ELECTRÓNICO
                </label>
                <div className="relative">
                  <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                    <HiOutlineMail className="text-xl" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    placeholder="admin@iimp.org"
                    className="w-full bg-white border border-slate-200 hover:border-slate-300 text-slate-900 h-14 rounded-xl pl-12 pr-4 focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all placeholder:text-slate-300 text-sm font-normal shadow-sm outline-none"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2 px-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                  CONTRASEÑA
                </label>
                <div className="relative">
                  <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                    <HiOutlineLockClosed className="text-xl" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    placeholder="••••••••••••"
                    className="w-full bg-white border border-slate-200 hover:border-slate-300 text-slate-900 h-14 rounded-xl pl-12 pr-12 focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all placeholder:text-slate-300 text-sm font-normal shadow-sm outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1 bg-transparent border-none cursor-pointer"
                  >
                    {showPassword ? <HiOutlineEyeOff className="text-xl" /> : <HiOutlineEye className="text-xl" />}
                  </button>
                </div>
                <div className="flex justify-end pt-1">
                  <Link
                    href="/acceso/recovery"
                    className="text-xs font-semibold text-slate-400 hover:text-primary transition-colors uppercase tracking-wider"
                  >
                    ¿Olvidaste tu contraseña?
                  </Link>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !hasSelectedEvent}
                className="w-full h-14 bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black rounded-xl text-sm shadow-xl shadow-primary/20 transition-all transform hover:-translate-y-0.5 active:scale-[0.98] border-none flex items-center justify-center gap-2 uppercase tracking-widest cursor-pointer"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    INGRESAR AL PANEL
                    <HiArrowSmLeft className="text-xl rotate-180" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
