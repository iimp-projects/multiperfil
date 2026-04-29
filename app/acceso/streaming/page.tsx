"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Radio,
  Plus,
  X,
  Play,
  Video,
  Calendar,
  Users as UsersIcon,
  Save,
  MoreVertical,
  Activity,
  Code,
  Terminal,
  Info as InfoIcon,
  Trash2,
  RefreshCw
} from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogTitle 
} from "@nrivera-iimp/ui-kit-iimp";
import { useAdminAuthStore } from "@/store/acceso/useAdminAuthStore";
import { useUsersAdminStore } from "@/store/acceso/useUsersAdminStore";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";

type PortalStreamingItem = {
  id: string;
  event: string;
  title: string;
  description?: string | null;
  vimeoId?: string | null;
  status: string;
  recipients: string[];
  createdAt: string;
  startsAt: string;
  expiresAt: string;
  targetAll: boolean;
  isRecurring: boolean;
  recurrenceType: "daily" | "weekly" | "none";
  recurrenceInterval: number;
};

interface StreamingFormData {
  title: string;
  description: string;
  vimeoId: string;
  url: string;
  status: string;
  startsAt: string;
  expiresAt: string;
  targetAll: boolean;
  event: string;
  isRecurring: boolean;
  recurrenceType: "daily" | "weekly" | "none";
  recurrenceInterval: number;
}

export default function StreamingAdminPage() {
  const { admin, selectedEvent } = useAdminAuthStore();
  const { selectedUsers, clearUsers } = useUsersAdminStore();

  const [streams, setStreams] = useState<PortalStreamingItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [streamToDelete, setStreamToDelete] = useState<PortalStreamingItem | null>(null);

  // Form State
  const resetFormData = (): StreamingFormData => ({
    title: "",
    description: "",
    vimeoId: "",
    url: "",
    status: "active",
    startsAt: "",
    expiresAt: "",
    targetAll: true,
    event: "",
    isRecurring: false,
    recurrenceType: "none",
    recurrenceInterval: 1
  });

  const [formData, setFormData] = useState<StreamingFormData>(resetFormData());

  // Force reset form when event changes or modal opens
  useEffect(() => {
    if (showCreateModal && !editingId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFormData(resetFormData());
    }
  }, [showCreateModal, editingId]);

  const fetchStreams = useCallback(async () => {
    if (!selectedEvent) return;
    setIsLoading(true);
    setStreams([]); // Limpiar lista anterior para evitar mezcla visual
    try {
      const res = await fetch(`/api/admin/portal/streaming?event=${selectedEvent}`, {
        cache: 'no-store', // Evitar cache para asegurar datos frescos del evento seleccionado
      });
      const data = await res.json();
      if (data.success) {
        setStreams(data.data);
      }
    } catch {
      toast.error("Error al cargar la lista de streaming.");
    } finally {
      setIsLoading(false);
    }
  }, [selectedEvent]);

  useEffect(() => {
    // Data fetching updates state; this is the intended integration point.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchStreams();
  }, [fetchStreams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvent) return;

    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        event: selectedEvent, // Siempre usar el evento activo del store
        id: editingId,
        recipients: formData.targetAll ? [] : selectedUsers.map(u => u.id)
      };

      const res = await fetch("/api/admin/portal/streaming", {
        method: editingId ? "PATCH" : "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-admin-id": admin?.id || "",
          "x-admin-email": admin?.email || "",
          "x-admin-name": admin?.name || "",
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (data.success) {
        toast.success(editingId ? "Streaming actualizado correctamente." : "Streaming configurado correctamente.");
        setShowCreateModal(false);
        setEditingId(null);
        setFormData(resetFormData());
        if (!formData.targetAll) clearUsers();
        fetchStreams();
      } else {
        toast.error(data.message || "Error al configurar el streaming.");
      }
    } catch {
      toast.error("Error de red.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (stream: PortalStreamingItem) => {
    const formatDateForInput = (dateStr: string | null | undefined) => {
      if (!dateStr) return "";
      const date = new Date(dateStr);
      // Format as YYYY-MM-DDTHH:mm for datetime-local input
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    };

    setEditingId(stream.id);
    setFormData({
      title: stream.title,
      description: stream.description || "",
      vimeoId: stream.vimeoId || "",
      url: "",
      status: stream.status,
      startsAt: formatDateForInput(stream.startsAt),
      expiresAt: formatDateForInput(stream.expiresAt),
      targetAll: stream.recipients?.length === 0,
      event: stream.event,
      isRecurring: stream.isRecurring || false,
      recurrenceType: stream.recurrenceType || "none",
      recurrenceInterval: stream.recurrenceInterval || 1
    });
    setShowCreateModal(true);
  };

  const handleDelete = async (id: string) => {
    const stream = streams.find(s => s.id === id);
    if (stream) {
      setStreamToDelete(stream);
    }
  };

  const confirmDelete = async () => {
    if (!streamToDelete) return;
    const id = streamToDelete.id;

    try {
      const res = await fetch(`/api/admin/portal/streaming?id=${id}`, {
        method: "DELETE",
        headers: {
          "x-admin-id": admin?.id || "",
          "x-admin-email": admin?.email || "",
          "x-admin-name": admin?.name || "",
        },
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Streaming eliminado correctamente.");
        setStreamToDelete(null);
        fetchStreams();
      } else {
        toast.error(data.message || "Error al eliminar.");
      }
    } catch {
      toast.error("Error de red al eliminar.");
    }
  };

  return (
    <div key={selectedEvent || "none"} className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Control de Streaming</h1>
          <p className="text-slate-500 text-sm mt-1">Configura las transmisiones en vivo y videos para los asistentes.</p>
        </div>
        <button
          onClick={() => {
            setEditingId(null);
            setFormData(resetFormData());
            setShowCreateModal(true);
          }}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all border-none cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Nuevo Streaming
        </button>
      </div>

      {/* Main Content Layout */}
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Streams List Container */}
        <div className="flex-1 space-y-6">
          <div className="grid grid-cols-1 xl:grid-cols-1 gap-6">
            {isLoading ?
              <div className="col-span-full py-20 flex flex-col items-center justify-center text-slate-400">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-sm font-medium">Cargando transmisiones...</p>
              </div>
            : streams.length === 0 ?
              <div className="col-span-full bg-white p-20 rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center text-slate-400 opacity-60">
                <Radio className="w-16 h-16 mb-4 stroke-1" />
                <p className="text-lg font-bold">No hay transmisiones configuradas</p>
                <p className="text-sm">Configura tu primer ID de Vimeo para comenzar.</p>
              </div>
            :
              streams.map((stream) => {
                const now = new Date();
                const startsAt = stream.startsAt ? new Date(stream.startsAt) : null;
                const expiresAt = stream.expiresAt ? new Date(stream.expiresAt) : null;
                
                let streamStatus = { label: "Inactivo", color: "bg-slate-100 text-slate-500", pulse: false };
                
                if (stream.status === 'active') {
                  if (stream.isRecurring) {
                    const currentMinutes = now.getHours() * 60 + now.getMinutes();
                    const startMinutes = startsAt ? startsAt.getHours() * 60 + startsAt.getMinutes() : 0;
                    const endMinutes = expiresAt ? expiresAt.getHours() * 60 + expiresAt.getMinutes() : 1440;
                    
                    const isWithinWindow = currentMinutes >= startMinutes && currentMinutes <= endMinutes;
                    const isWithinGlobalRange = (!startsAt || startsAt.getTime() <= now.getTime()) && 
                                               (!expiresAt || expiresAt.getTime() >= now.getTime());

                    if (isWithinGlobalRange && isWithinWindow) {
                      streamStatus = { label: "En Vivo", color: "bg-red-500 text-white", pulse: true };
                    } else if (isWithinGlobalRange && !isWithinWindow) {
                      streamStatus = { label: "Programado (Recurrente)", color: "bg-indigo-500 text-white", pulse: false };
                    } else if (!isWithinGlobalRange && startsAt && startsAt > now) {
                      streamStatus = { label: "Próximamente", color: "bg-blue-400 text-white", pulse: false };
                    } else {
                      streamStatus = { label: "Finalizado", color: "bg-slate-400 text-white", pulse: false };
                    }
                  } else {
                    if (startsAt && startsAt > now) {
                      streamStatus = { label: "Programado", color: "bg-blue-500 text-white", pulse: false };
                    } else if (expiresAt && expiresAt < now) {
                      streamStatus = { label: "Finalizado", color: "bg-slate-400 text-white", pulse: false };
                    } else {
                      streamStatus = { label: "En Vivo", color: "bg-red-500 text-white", pulse: true };
                    }
                  }
                } else if (stream.status === 'scheduled') {
                  streamStatus = { label: "Pendiente", color: "bg-amber-500 text-white", pulse: false };
                }

                return (
                  <div key={stream.id} className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col md:flex-row h-full group hover:shadow-md transition-all">
                    {/* Preview Thumbnail (Vimeo style) */}
                    <div className="md:w-48 bg-slate-900 relative flex items-center justify-center group-hover:bg-slate-800 transition-colors">
                      <Video className="w-10 h-10 text-slate-700" />
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white shadow-lg">
                          <Play className="w-5 h-5 fill-current ml-1" />
                        </div>
                      </div>
                      <div className={`absolute top-3 left-3 px-2 py-0.5 text-[10px] font-black rounded uppercase flex items-center gap-1 shadow-sm ${streamStatus.color}`}>
                        {streamStatus.pulse && <Activity className="w-3 h-3 animate-pulse" />}
                        {streamStatus.label}
                      </div>
                    </div>

                    <div className="flex-1 p-6 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-bold text-slate-800 line-clamp-1">{stream.title}</h3>
                          <button className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors">
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </div>
                        <p className="text-slate-500 text-xs line-clamp-2 mb-4">{stream.description || "Sin descripción."}</p>

                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            <div className="w-5 flex justify-center"><Video className="w-3 h-3" /></div>
                            Vimeo ID: <span className="text-slate-700">{stream.vimeoId || "N/A"}</span>
                          </div>
                          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            <div className="w-5 flex justify-center"><UsersIcon className="w-3 h-3" /></div>
                            Acceso: <span className="text-slate-700">{stream.recipients?.length > 0 ? `${stream.recipients.length} Usuarios` : "Público General"}</span>
                          </div>
                          {startsAt && (
                            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                              <div className="w-5 flex justify-center"><Calendar className="w-3 h-3" /></div>
                              Inicia: <span className={startsAt > now ? "text-blue-600" : "text-slate-700"}>
                                {format(startsAt, "PPPp", { locale: es })}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="mt-6 pt-4 border-t border-slate-50 flex items-center justify-between">
                        <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(stream.createdAt), "dd MMM, yyyy", { locale: es })}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(stream)}
                            className="px-3 py-1.5 bg-slate-50 text-slate-500 hover:text-primary hover:bg-primary/5 rounded-lg text-[10px] font-bold uppercase transition-all border-none cursor-pointer"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => handleDelete(stream.id)}
                            className="px-3 py-1.5 bg-slate-50 text-slate-500 hover:text-red-500 hover:bg-red-50 rounded-lg text-[10px] font-bold uppercase transition-all border-none cursor-pointer"
                          >
                            Eliminar
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            }
          </div>
        </div>

        {/* API Instructions Panel */}
        <aside className="w-full lg:w-80 xl:w-96 shrink-0">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8 space-y-6 sticky top-24">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
                <Code className="w-5 h-5 text-indigo-600" />
              </div>
              <h3 className="font-bold text-slate-800">Guía de Integración API</h3>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Endpoint de Consulta</p>
                <div className="flex items-center gap-2 text-indigo-600">
                  <Terminal className="w-3 h-3" />
                  <code className="text-xs font-mono break-all font-bold">GET /api/portal/streaming</code>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Lógica de Visibilidad</p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <div className="mt-1"><div className="w-1 h-1 bg-indigo-400 rounded-full" /></div>
                    <p className="text-[11px] text-slate-600">
                      <span className="font-bold">Una vez:</span> Basado estrictamente en <span className="text-indigo-500 font-mono">startsAt</span> y <span className="text-indigo-500 font-mono">expiresAt</span>.
                    </p>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="mt-1"><div className="w-1 h-1 bg-indigo-400 rounded-full" /></div>
                    <p className="text-[11px] text-slate-600">
                      <span className="font-bold">Recurrente:</span> Activo solo durante las <span className="text-indigo-500">horas</span> definidas en las fechas, repitiéndose diariamente o semanalmente.
                    </p>
                  </li>
                </ul>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <div className="flex items-center gap-2 mb-3">
                  <InfoIcon className="w-3 h-3 text-slate-400" />
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Estructura de Retorno (JSON)</p>
                </div>
                <div className="bg-slate-900 rounded-2xl p-5 overflow-x-auto shadow-inner">
                  <pre className="text-[10px] text-indigo-300 font-mono leading-relaxed">
                    {`{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "Sala 1",
      "status": "active",
      "isRecurring": true,
      "startsAt": "2024-05-01T08:00:00Z",
      "expiresAt": "2024-05-01T10:00:00Z"
    }
  ]
}`}
                  </pre>
                </div>
              </div>

              <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                <p className="text-[10px] font-bold text-indigo-700 flex items-center gap-2">
                  <Activity className="w-3 h-3" />
                  FILTRADO INTELIGENTE
                </p>
                <p className="text-[11px] text-indigo-600/80 mt-1 leading-relaxed font-medium">
                  El API ya no devuelve contenidos expirados o fuera de su horario recurrente. El frontend solo recibe lo que debe mostrar.
                </p>
              </div>
            </div>
          </div>
        </aside>
      </div>


      {/* Create Streaming Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-in slide-in-from-bottom-8 duration-500">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                  <Radio className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800">
                    {editingId ? "Editar Transmisión" : "Configurar Transmisión"}
                  </h2>
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
              <form id="create-stream-form" onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Evento / Vertical</label>
                  <div className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-primary flex items-center gap-2">
                    <Activity className="w-4 h-4" />
                    {selectedEvent}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Título del Streaming / Sala</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Ej. Sala Plenaria - Día 1"
                    required
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Descripción</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Detalles sobre la transmisión..."
                    rows={2}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Vimeo Video ID</label>
                    <input
                      type="text"
                      value={formData.vimeoId}
                      onChange={(e) => setFormData({ ...formData, vimeoId: e.target.value })}
                      placeholder="Ej. 123456789"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 font-mono"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Estado</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none cursor-pointer"
                    >
                      <option value="active">Activo (En Vivo Ahora)</option>
                      <option value="scheduled">Programado</option>
                      <option value="inactive">Inactivo / Oculto</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Fecha Inicio (Opcional)</label>
                    <div className="relative group">
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                      <input
                        type="datetime-local"
                        value={formData.startsAt}
                        onChange={(e) => setFormData({ ...formData, startsAt: e.target.value })}
                        className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Fecha Expiración (Opcional)</label>
                    <div className="relative group">
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                      <input
                        type="datetime-local"
                        value={formData.expiresAt}
                        onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                        className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Recurrence Section */}
                <div className="p-6 bg-indigo-50/50 rounded-3xl border border-indigo-100 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                        <RefreshCw className={`w-5 h-5 text-indigo-600 ${formData.isRecurring ? "animate-spin" : ""}`} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800">Tarea Recurrente</p>
                        <p className="text-[10px] text-slate-500">Repite este evento automáticamente</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, isRecurring: !formData.isRecurring })}
                      className={`w-12 h-6 rounded-full transition-all relative ${formData.isRecurring ? "bg-indigo-600" : "bg-slate-200"}`}
                    >
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${formData.isRecurring ? "left-7" : "left-1"}`} />
                    </button>
                  </div>

                  {formData.isRecurring && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 animate-in fade-in slide-in-from-top-2 duration-300">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Frecuencia</label>
                         <select
                           value={formData.recurrenceType}
                           onChange={(e) => {
                             const next =
                               e.target.value === "daily" ? "daily" : "weekly";
                             setFormData({ ...formData, recurrenceType: next });
                           }}
                           className="w-full px-4 py-3 bg-white border border-indigo-100 rounded-xl text-sm focus:border-indigo-600 transition-all outline-none"
                         >
                          <option value="daily">Diario</option>
                          <option value="weekly">Semanal</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Cada (Intervalo)</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="1"
                            value={formData.recurrenceInterval}
                            onChange={(e) => setFormData({ ...formData, recurrenceInterval: parseInt(e.target.value) || 1 })}
                            className="w-full px-4 py-3 bg-white border border-indigo-100 rounded-xl text-sm focus:border-indigo-600 transition-all outline-none"
                          />
                          <span className="text-xs font-bold text-slate-500 whitespace-nowrap">
                            {formData.recurrenceType === "daily" ? "días" : "semanas"}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
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
                form="create-stream-form"
                type="submit"
                disabled={isSubmitting}
                className="flex-[2] py-4 bg-primary text-white font-bold rounded-2xl shadow-xl shadow-primary/20 hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-3 border-none cursor-pointer transition-all"
              >
                {isSubmitting ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save className="w-5 h-5" />}
                {isSubmitting ? "Guardando..." : editingId ? "Actualizar Streaming" : "Publicar Streaming"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Dialog
        open={!!streamToDelete}
        onOpenChange={(open) => !open && setStreamToDelete(null)}
      >
        <DialogContent className="max-w-md rounded-[2.5rem] p-8 overflow-hidden border-none shadow-2xl">
          <div className="flex flex-col items-center text-center space-y-6">
            <div className="w-20 h-20 rounded-3xl bg-red-50 flex items-center justify-center text-red-500 shadow-inner">
              <Trash2 size={40} />
            </div>
            
            <div className="space-y-2">
              <DialogTitle className="text-2xl font-black text-slate-900 tracking-tight">
                ¿Eliminar transmisión?
              </DialogTitle>
              <p className="text-slate-500 font-medium leading-relaxed">
                Esta acción no se puede deshacer. La transmisión &quot;{streamToDelete?.title}&quot; desaparecerá del portal de los usuarios.
              </p>
            </div>

            <div className="flex gap-4 w-full pt-4">
              <button
                onClick={() => setStreamToDelete(null)}
                className="flex-1 h-14 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition-all border-none cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 h-14 bg-red-500 text-white font-bold rounded-2xl hover:bg-red-600 shadow-lg shadow-red-200 transition-all border-none cursor-pointer"
              >
                Eliminar
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
