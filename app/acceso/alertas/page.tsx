"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  Bell, 
  Send, 
  Search, 
  Filter, 
  Plus, 
  X, 
  Info, 
  AlertTriangle, 
  CheckCircle2, 
  AlertCircle,
  Users as UsersIcon,
  Calendar,
  Clock,
  Eye,
  MoreVertical
} from "lucide-react";
import { useAdminAuthStore } from "@/store/acceso/useAdminAuthStore";
import { useUsersAdminStore } from "@/store/acceso/useUsersAdminStore";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";

type AlertType = "standard" | "expandable" | "modal" | "accordion";
type AlertVariant = "success" | "info" | "warning" | "error" | "default";
type AlertCategory = "pagos" | "eventos" | "networking" | "sistema" | "ventas" | "vouchers";

type PortalAlertItem = {
  id: string;
  title: string;
  description?: string | null;
  category: AlertCategory | string;
  variant?: AlertVariant | null;
  recipients: string[];
  createdAt: string;
};

export default function AlertasAdminPage() {
  const { selectedEvent } = useAdminAuthStore();
  const { selectedUsers, clearUsers } = useUsersAdminStore();
  
  const [alerts, setAlerts] = useState<PortalAlertItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    longDescription: "",
    type: "standard" as AlertType,
    variant: "info" as AlertVariant,
    category: "eventos" as AlertCategory,
    actionText: "",
    actionUrl: "",
    target: "_self", // _blank or _self
    imageUrl: "",
    targetAll: true
  });

  const fetchAlerts = useCallback(async () => {
    if (!selectedEvent) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/portal/alerts?event=${selectedEvent}`);
      const data = await res.json();
      if (data.success) {
        setAlerts(data.data);
      }
    } catch {
      toast.error("Error al cargar las alertas.");
    } finally {
      setIsLoading(false);
    }
  }, [selectedEvent]);

  useEffect(() => {
    // Data fetching updates state asynchronously; we intentionally do it from an effect.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchAlerts();
  }, [fetchAlerts]);

  useEffect(() => {
    if (selectedUsers.length > 0) {
      // This is a UI convenience derived from external selection.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFormData(prev => ({ ...prev, targetAll: false }));
    }
  }, [selectedUsers]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvent) return;
    
    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        event: selectedEvent,
        recipients: formData.targetAll ? [] : selectedUsers.map(u => u.id)
      };

      const res = await fetch("/api/admin/portal/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (data.success) {
        toast.success("Alerta enviada correctamente.");
        setShowCreateModal(false);
        setFormData({
          title: "",
          description: "",
          longDescription: "",
          type: "standard",
          variant: "info",
          category: "eventos",
          actionText: "",
          actionUrl: "",
          target: "_self",
          imageUrl: "",
          targetAll: true
        });
        if (!formData.targetAll) clearUsers();
        fetchAlerts();
      } else {
        toast.error(data.message || "Error al enviar la alerta.");
      }
    } catch {
      toast.error("Error de red al enviar la alerta.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getVariantIcon = (variant: AlertVariant) => {
    switch (variant) {
      case "success": return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
      case "warning": return <AlertTriangle className="w-5 h-5 text-amber-500" />;
      case "error": return <AlertCircle className="w-5 h-5 text-red-500" />;
      default: return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Alertas y Notificaciones</h1>
          <p className="text-slate-500 text-sm mt-1">Gestiona los avisos en tiempo real para los usuarios de {selectedEvent}.</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all border-none cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Nueva Alerta
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
            <Bell className="w-6 h-6 text-blue-500" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Enviadas</p>
            <p className="text-2xl font-bold text-slate-800">{alerts.length}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center">
            <Eye className="w-6 h-6 text-emerald-500" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Tasa de Apertura</p>
            <p className="text-2xl font-bold text-slate-800">--</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/5 flex items-center justify-center">
            <UsersIcon className="w-6 h-6 text-primary" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Usuarios Impactados</p>
            <p className="text-2xl font-bold text-slate-800">--</p>
          </div>
        </div>
      </div>

      {/* Main Content: List of Alerts */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
          <h2 className="font-bold text-slate-700 flex items-center gap-2">
            Historial de Alertas
            <span className="px-2 py-0.5 bg-slate-200 text-slate-600 rounded-full text-[10px] font-bold uppercase">{selectedEvent}</span>
          </h2>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text" 
                placeholder="Buscar alertas..."
                className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 w-64"
              />
            </div>
            <button className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-400">
              <Filter className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="divide-y divide-slate-50">
          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center text-slate-400">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-sm font-medium">Cargando alertas...</p>
            </div>
          ) : alerts.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center text-slate-400 opacity-60">
              <Bell className="w-16 h-16 mb-4 stroke-1" />
              <p className="text-lg font-bold">Sin alertas enviadas</p>
              <p className="text-sm">Empieza a comunicarte con tus usuarios creando una nueva alerta.</p>
            </div>
          ) : (
            alerts.map((alert) => (
              <div key={alert.id} className="p-6 hover:bg-slate-50 transition-colors group">
                <div className="flex gap-4">
                  <div className={`w-12 h-12 rounded-xl shrink-0 flex items-center justify-center shadow-sm ${
                    alert.variant === 'success' ? 'bg-emerald-50 text-emerald-500' :
                    alert.variant === 'warning' ? 'bg-amber-50 text-amber-500' :
                    alert.variant === 'error' ? 'bg-red-50 text-red-500' :
                    'bg-blue-50 text-blue-500'
                  }`}>
                    {getVariantIcon(alert.variant || 'default')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-bold text-slate-800 truncate">{alert.title}</h3>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(alert.createdAt), "dd MMM, yyyy", { locale: es })}
                        </span>
                        <button className="p-1 hover:bg-slate-200 rounded-lg text-slate-400 transition-colors">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <p className="text-slate-500 text-sm line-clamp-1 mb-2">{alert.description || "Sin descripción corta."}</p>
                    <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      <span className="flex items-center gap-1">
                        <UsersIcon className="w-3 h-3" />
                        {alert.recipients?.length > 0 ? `${alert.recipients.length} Usuarios` : "Todos"}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {format(new Date(alert.createdAt), "HH:mm")}
                      </span>
                      <span className="px-2 py-0.5 bg-slate-100 rounded text-slate-500">
                        {alert.category}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Create Alert Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-in slide-in-from-bottom-8 duration-500">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                  <Plus className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800">Nueva Alerta Directa</h2>
                  <p className="text-xs text-slate-400 uppercase tracking-widest font-bold">{selectedEvent}</p>
                </div>
              </div>
              <button 
                onClick={() => setShowCreateModal(false)}
                className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 transition-colors border-none bg-transparent cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
              <form id="create-alert-form" onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Category & Variant */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Categoría</label>
                    <select 
                      value={formData.category}
                      onChange={(e) => setFormData({...formData, category: e.target.value as AlertCategory})}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none cursor-pointer"
                    >
                      <option value="eventos">Eventos</option>
                      <option value="sistema">Sistema</option>
                      <option value="networking">Networking</option>
                      <option value="pagos">Pagos</option>
                      <option value="ventas">Ventas</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Variante (Color)</label>
                    <select 
                      value={formData.variant}
                      onChange={(e) => setFormData({...formData, variant: e.target.value as AlertVariant})}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none cursor-pointer"
                    >
                      <option value="info">Azul (Información)</option>
                      <option value="success">Verde (Éxito)</option>
                      <option value="warning">Amarillo (Aviso)</option>
                      <option value="error">Rojo (Error/Crítico)</option>
                      <option value="default">Gris (Neutral)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Título de la Alerta</label>
                  <input 
                    type="text" 
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    placeholder="Ej. ¡Ya estamos en vivo! - Inauguración PROEXPLO"
                    required
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Descripción Corta</label>
                  <textarea 
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Breve resumen para la notificación..."
                    rows={2}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tipo de Visualización</label>
                    <select 
                      value={formData.type}
                      onChange={(e) => setFormData({...formData, type: e.target.value as AlertType})}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none cursor-pointer"
                    >
                      <option value="standard">Estándar (Cápsula)</option>
                      <option value="expandable">Expandible (Con detalles)</option>
                      <option value="modal">Modal (Emergente central)</option>
                      <option value="accordion">Acordeón (Contenido oculto)</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Destinatarios</label>
                    <div className="flex gap-2">
                      <button 
                        type="button"
                        onClick={() => setFormData({...formData, targetAll: true})}
                        className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all border ${
                          formData.targetAll ? 'bg-primary text-white border-primary shadow-md shadow-primary/20' : 'bg-slate-50 text-slate-500 border-slate-200'
                        }`}
                      >
                        Todos
                      </button>
                      <button 
                        type="button"
                        onClick={() => {
                          setFormData({...formData, targetAll: false});
                          if (selectedUsers.length === 0) toast.info("Ve al módulo de Usuarios para seleccionar destinatarios específicos.");
                        }}
                        className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all border ${
                          !formData.targetAll ? 'bg-primary text-white border-primary shadow-md shadow-primary/20' : 'bg-slate-50 text-slate-500 border-slate-200'
                        }`}
                      >
                        {selectedUsers.length > 0 ? `${selectedUsers.length} Seleccionados` : "Específicos"}
                      </button>
                    </div>
                  </div>
                </div>

                {formData.type === 'expandable' || formData.type === 'modal' ? (
                  <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Contenido Extendido (Detalles)</label>
                    <textarea 
                      value={formData.longDescription}
                      onChange={(e) => setFormData({...formData, longDescription: e.target.value})}
                      placeholder="Escribe aquí el contenido que verá el usuario al abrir la alerta..."
                      rows={4}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                    />
                  </div>
                ) : null}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Texto de Acción (Botón)</label>
                    <input 
                      type="text" 
                      value={formData.actionText}
                      onChange={(e) => setFormData({...formData, actionText: e.target.value})}
                      placeholder="Ej. Ver detalles"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">URL de Acción</label>
                    <input 
                      type="text" 
                      value={formData.actionUrl}
                      onChange={(e) => setFormData({...formData, actionUrl: e.target.value})}
                      placeholder="Ej. /dashboard/streaming"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Destino del Enlace</label>
                  <div className="flex gap-2">
                    <button 
                      type="button"
                      onClick={() => setFormData({...formData, target: "_self"})}
                      className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all border ${
                        formData.target === '_self' ? 'bg-primary text-white border-primary' : 'bg-slate-50 text-slate-500 border-slate-200'
                      }`}
                    >
                      Misma Pestaña (Interno)
                    </button>
                    <button 
                      type="button"
                      onClick={() => setFormData({...formData, target: "_blank"})}
                      className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all border ${
                        formData.target === '_blank' ? 'bg-primary text-white border-primary' : 'bg-slate-50 text-slate-500 border-slate-200'
                      }`}
                    >
                      Nueva Pestaña (Externo)
                    </button>
                  </div>
                </div>
              </form>
            </div>

            <div className="p-8 border-t border-slate-100 bg-slate-50/50 flex gap-4">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="flex-1 py-4 bg-white border border-slate-200 text-slate-500 font-bold rounded-2xl hover:bg-slate-50 transition-all border-none cursor-pointer"
              >
                Descartar
              </button>
              <button
                form="create-alert-form"
                type="submit"
                disabled={isSubmitting}
                className="flex-[2] py-4 bg-primary text-white font-bold rounded-2xl shadow-xl shadow-primary/20 hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-3 border-none cursor-pointer transition-all"
              >
                {isSubmitting ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Send className="w-5 h-5" />}
                {isSubmitting ? "Enviando..." : "Emitir Alerta Ahora"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
