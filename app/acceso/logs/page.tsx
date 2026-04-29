"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ScrollText,
  Loader2,
  Search,
  User as UserIcon,
  Activity,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useAdminAuthStore } from "@/store/acceso/useAdminAuthStore";

interface AuditLogItem {
  id: string;
  userId?: string;
  userEmail?: string;
  userName?: string;
  action: string;
  module: string;
  details?: string;
  ip?: string;
  userAgent?: string;
  createdAt: string;
}

export default function LogsPage() {
  const router = useRouter();
  const { admin: currentAdmin } = useAdminAuthStore();
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (currentAdmin && currentAdmin.role.toLowerCase() === "moderador") {
      router.replace("/acceso/dashboard");
    }
  }, [currentAdmin, router]);

  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/logs");
      const json = await res.json();
      if (json.success) setLogs(json.data);
    } catch (error) {
      console.error("Error fetching logs:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchLogs();
  }, [fetchLogs]);

  const filteredLogs = logs.filter((log) => {
    const searchStr = `${log.userName} ${log.userEmail} ${log.action} ${log.module} ${log.details}`.toLowerCase();
    return searchStr.includes(searchTerm.toLowerCase());
  });

  const getActionBadge = (action: string) => {
    const colors: Record<string, string> = {
      CREATE_USER: "bg-emerald-100 text-emerald-700",
      DELETE_USER: "bg-red-100 text-red-700",
      UPDATE_USER: "bg-blue-100 text-blue-700",
      LOGIN: "bg-amber-100 text-amber-700",
      SEND_EMAIL: "bg-purple-100 text-purple-700",
      // Streaming
      CREATE_STREAMING: "bg-emerald-50 text-emerald-600",
      UPDATE_STREAMING: "bg-blue-50 text-blue-600",
      DELETE_STREAMING: "bg-red-50 text-red-600",
      // Sponsors
      CREATE_SPONSOR: "bg-emerald-50 text-emerald-600",
      UPDATE_SPONSOR: "bg-blue-50 text-blue-600",
      DELETE_SPONSOR: "bg-red-50 text-red-600",
      // Programs
      CREATE_PROGRAM: "bg-indigo-50 text-indigo-600",
      UPDATE_PROGRAM: "bg-indigo-50 text-indigo-600",
      DELETE_PROGRAM: "bg-rose-50 text-rose-600",
    };
    return colors[action] || "bg-slate-100 text-slate-700";
  };

  return (
    <div className="space-y-6 max-w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
            <ScrollText className="w-6 h-6 text-primary" />
            Logs de Auditoría
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Registro histórico de todas las acciones realizadas en el panel administrativo.
          </p>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar en logs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:w-80 h-11 pl-10 pr-4 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all shadow-sm"
          />
        </div>
      </div>

      {/* List */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-500">Fecha y Hora</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-500">Usuario</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-500">Acción</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-500">Módulo</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-500">Detalles</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-500">IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto" />
                    <p className="text-slate-400 text-sm mt-2">Cargando registros...</p>
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <Activity className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                    <p className="text-slate-500 font-medium">No se encontraron registros</p>
                    <p className="text-slate-400 text-xs mt-1">Prueba con otros términos de búsqueda.</p>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-slate-700">
                          {new Date(log.createdAt).toLocaleDateString("es-PE", { day: '2-digit', month: '2-digit', year: 'numeric' })}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">
                          {new Date(log.createdAt).toLocaleTimeString("es-PE", { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-black text-xs shrink-0">
                          {log.userName?.charAt(0).toUpperCase() || <UserIcon className="w-3 h-3" />}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-sm font-bold text-slate-800 truncate max-w-[150px]">
                            {log.userName || "Sistema"}
                          </span>
                          <span className="text-[10px] text-slate-400 truncate max-w-[150px]">
                            {log.userEmail || "Auto-Log"}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider ${getActionBadge(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg uppercase tracking-wider">
                        {log.module}
                      </span>
                    </td>
                    <td className="px-6 py-4 min-w-[200px]">
                      <p className="text-sm text-slate-600 line-clamp-2">
                        {log.details || "-"}
                      </p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-xs font-mono text-slate-400 bg-slate-50 px-2 py-1 rounded border border-slate-100">
                        {log.ip || "unknown"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {!isLoading && filteredLogs.length > 0 && (
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 text-center">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
              Mostrando los últimos {filteredLogs.length} eventos registrados
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
