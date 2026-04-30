"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Radio, Play, Info, Calendar } from "lucide-react";
import { useVertical } from "@nrivera-iimp/ui-kit-iimp";
import { getDynamicEventCode } from "@/lib/utils/event";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";

type PortalStreamingItem = {
  id: string;
  title: string;
  description?: string | null;
  vimeoId?: string | null;
};

export default function StreamingPage() {
  const { user, isAuthenticated, hasStreamingAccess, _hasHydrated } =
    useAuthStore();
  const { vertical } = useVertical();
  const router = useRouter();

  const [streams, setStreams] = useState<PortalStreamingItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (_hasHydrated && !isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, _hasHydrated, router]);

  useEffect(() => {
    if (_hasHydrated && isAuthenticated && !hasStreamingAccess) {
      toast.error("Acceso restringido", {
        description:
          "Debes estar al día en tus pagos para acceder al contenido en vivo.",
      });
      router.push("/dashboard");
    }
  }, [_hasHydrated, isAuthenticated, hasStreamingAccess, router]);

  useEffect(() => {
    const fetchStreaming = async () => {
      if (!user?.siecode) return;
      const eventCode = getDynamicEventCode(vertical);

      try {
        const res = await fetch(`/api/portal/streaming?event=${eventCode}`);
        const data = await res.json();
        if (data.success) {
          setStreams(data.data);
        }
      } catch (error) {
        console.error("Error fetching streaming", error);
      } finally {
        setLoading(false);
      }
    };

    if (_hasHydrated && isAuthenticated) {
      fetchStreaming();
    }
  }, [_hasHydrated, isAuthenticated, user, vertical]);

  if (!_hasHydrated || !isAuthenticated) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-in fade-in duration-700">
        <header>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            Streaming Live
          </h1>
          <p className="text-slate-500 mt-1">
            Disfruta de las transmisiones en vivo y contenido exclusivo del
            evento.
          </p>
        </header>

        {loading ? (
          <div className="flex flex-col items-center justify-center p-20 bg-white rounded-3xl border border-slate-100 shadow-sm min-h-[400px]">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-slate-400 font-medium">
              Buscando transmisiones activas...
            </p>
          </div>
        ) : streams.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 bg-white rounded-3xl shadow-sm border border-slate-100 min-h-[50vh]">
            <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-6 shadow-sm border border-red-100">
              <Radio size={40} className="animate-pulse" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight text-center">
              No hay transmisiones activas
            </h2>
            <p className="text-slate-500 mt-3 text-center max-w-md mx-auto text-lg leading-relaxed">
              La transmisión en vivo estará disponible pronto. Vuelve más tarde
              para disfrutar del evento.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8">
            {streams.map((stream) => (
              <div
                key={stream.id}
                className="bg-white rounded-md overflow-hidden shadow-xl border border-slate-100 flex flex-col xl:flex-row"
              >
                {/* Video Player Area */}
                <div className="flex-1 aspect-video bg-black relative overflow-hidden group">
                  {stream.vimeoId ? (
                    <VimeoObfuscatedPlayer
                      vimeoId={stream.vimeoId}
                      title={stream.title}
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-white/20">
                      <Play size={80} />
                    </div>
                  )}

                  {/* Subtle Protective Overlay (makes it slightly harder to right click directly on player) */}
                  <div className="absolute inset-0 pointer-events-none z-10 border-[10px] border-black/10" />
                </div>

                {/* Info Panel */}
                <div className="xl:w-96 p-8 xl:p-10 flex flex-col justify-between bg-slate-50/50">
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <span className="px-3 py-1 bg-red-500 text-white text-[10px] font-black rounded-full uppercase tracking-widest ">
                        EN VIVO
                      </span>
                      <span className="px-3 py-1 bg-white text-slate-400 text-[10px] font-bold rounded-full border border-slate-100 uppercase tracking-widest">
                        SALA {vertical.toUpperCase()}
                      </span>
                    </div>

                    <h2 className="text-2xl font-black text-slate-900 leading-tight mb-4">
                      {stream.title}
                    </h2>

                    <p className="text-slate-500 text-sm leading-relaxed mb-6">
                      {stream.description ||
                        "Bienvenidos a la transmisión oficial del evento."}
                    </p>

                    <div className="space-y-3">
                      <div className="flex items-center gap-3 text-slate-400">
                        <Calendar size={16} />
                        <span className="text-xs font-bold uppercase tracking-wider">
                          {format(new Date(), "EEEE, dd MMMM", { locale: es })}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-slate-400">
                        <Info size={16} />
                        <span className="text-xs font-bold uppercase tracking-wider">
                          Transmisión en alta definición
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-10 pt-8 border-t border-slate-200">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">
                      Integrado por IIMP
                    </p>
                    <div className="flex items-center gap-4 transition-all duration-200 ease-in-out hover:grayscale ">
                      <Image
                        src="/logos/favicon-iimp.png"
                        alt="IIMP"
                        width={24}
                        height={24}
                        className="h-6 w-auto object-contain"
                        unoptimized
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

/**
 * COMPONENTE DE OFUSCACIÓN DE VIDEO
 * Este componente ayuda a ocultar el ID de Vimeo del código fuente estático (View Source).
 * Además, inyecta el iframe dinámicamente solo en el cliente.
 */
function VimeoObfuscatedPlayer({
  vimeoId,
  title,
}: {
  vimeoId: string;
  title: string;
}) {
  const [playerUrl, setPlayerUrl] = useState<string | null>(null);

  useEffect(() => {
    // Generamos la URL dinámicamente en el cliente
    // Esto evita que aparezca en el HTML inicial (SSR)
    const base = "https://player.vimeo.com/video/";
    const params = "?h=0&badge=0&autopause=0&player_id=0&app_id=58479";

    // Pequeño retardo para asegurar que el DOM esté listo y dificultar bots
    const timer = setTimeout(() => {
      setPlayerUrl(`${base}${vimeoId}${params}`);
    }, 100);

    return () => clearTimeout(timer);
  }, [vimeoId]);

  if (!playerUrl) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <iframe
      src={playerUrl}
      frameBorder="0"
      allow="autoplay; fullscreen; picture-in-picture"
      allowFullScreen
      className="absolute inset-0 w-full h-full animate-in fade-in duration-700"
      title={title}
    />
  );
}
