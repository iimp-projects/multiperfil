"use client";

import { useState, useEffect } from "react";
import { useAdminAuthStore } from "@/store/acceso/useAdminAuthStore";
import { 
  Users, 
  Mail, 
  Bell, 
  Layers,
  TrendingUp,
  ArrowRight
} from "lucide-react";
import Link from "next/link";

interface DashboardStats {
  activeUsers: number;
  messages: number;
  alerts: number;
  groups: number;
}

export default function DashboardPage() {
  const { selectedEvent } = useAdminAuthStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      if (!selectedEvent) return;
      setIsLoading(true);
      try {
        const res = await fetch(`/api/admin/portal/stats?event=${selectedEvent}`);
        const json = await res.json();
        if (json.success) {
          setStats(json.data);
        }
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchStats();
    // Poll every minute
    const interval = setInterval(fetchStats, 60000);
    return () => clearInterval(interval);
  }, [selectedEvent]);

  const cards = [
    {
      title: "Usuarios Activos",
      value: stats?.activeUsers ?? 0,
      icon: <Users className="w-6 h-6 text-blue-500" />,
      bg: "bg-blue-50",
      link: "/acceso/usuarios",
      description: "Sesiones en los últimos 30 min"
    },
    {
      title: "Mensajes Enviados",
      value: stats?.messages ?? 0,
      icon: <Mail className="w-6 h-6 text-emerald-500" />,
      bg: "bg-emerald-50",
      link: "/acceso/mensajes",
      description: "Comunicados totales"
    },
    {
      title: "Alertas Vigentes",
      value: stats?.alerts ?? 0,
      icon: <Bell className="w-6 h-6 text-amber-500" />,
      bg: "bg-amber-50",
      link: "/acceso/alertas",
      description: "Notificaciones directas"
    },
    {
      title: "Grupos Creados",
      value: stats?.groups ?? 0,
      icon: <Layers className="w-6 h-6 text-purple-500" />,
      bg: "bg-purple-50",
      link: "/acceso/grupos",
      description: "Segmentos de usuarios"
    }
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Dashboard General</h1>
          <p className="text-slate-500 font-medium mt-1">Resumen en tiempo real del evento <span className="text-primary font-bold">{selectedEvent}</span></p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-2xl border border-slate-100 shadow-sm text-xs font-bold text-slate-500 uppercase tracking-widest">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          Monitoreo en vivo
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, idx) => (
          <Link 
            key={idx} 
            href={card.link}
            className="group bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 flex flex-col relative overflow-hidden"
          >
            <div className={`absolute top-0 right-0 w-24 h-24 ${card.bg} rounded-full -translate-y-1/2 translate-x-1/2 opacity-50 group-hover:scale-110 transition-transform`} />
            
            <div className="flex items-start justify-between mb-4 relative">
              <div className={`w-12 h-12 ${card.bg} rounded-2xl flex items-center justify-center transition-transform group-hover:rotate-6`}>
                {card.icon}
              </div>
              <div className="text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity translate-x-4 group-hover:translate-x-0 transition-transform">
                <ArrowRight className="w-5 h-5" />
              </div>
            </div>

            <div className="relative">
              <div className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">{card.title}</div>
              <div className="text-4xl font-black text-slate-800 tracking-tight">
                {isLoading ? (
                  <div className="h-10 w-16 bg-slate-100 animate-pulse rounded-lg" />
                ) : card.value}
              </div>
              <p className="text-[10px] text-slate-400 font-medium mt-2 flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-emerald-500" />
                {card.description}
              </p>
            </div>
          </Link>
        ))}
      </div>

      {/* Placeholder for Quick Actions or Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm min-h-[400px] flex flex-col items-center justify-center text-center">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
            <TrendingUp className="w-10 h-10 text-slate-300" />
          </div>
          <h3 className="text-xl font-bold text-slate-800">Gráficos de Actividad</h3>
          <p className="text-slate-500 max-w-sm mt-2 text-sm leading-relaxed">
            Estamos preparando visualizaciones detalladas de interacciones y alcance para que puedas medir el éxito de tus comunicaciones.
          </p>
        </div>

        <div className="bg-slate-900 p-8 rounded-[2.5rem] shadow-2xl text-white flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent opacity-50" />
          <div className="relative">
            <h3 className="text-2xl font-black tracking-tight leading-tight mb-4">¡Impulsa tu<br />Evento ahora!</h3>
            <p className="text-slate-400 text-sm font-medium leading-relaxed mb-8">
              Utiliza las herramientas de segmentación avanzada para llegar a las personas correctas en el momento justo.
            </p>
          </div>
          <Link 
            href="/acceso/mensajes?compose=true"
            className="relative w-full py-4 bg-primary text-white font-black text-sm uppercase tracking-widest rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3"
          >
            Crear Comunicado
            <Mail className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
