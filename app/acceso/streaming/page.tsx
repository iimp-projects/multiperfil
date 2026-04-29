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
  Info as InfoIcon
} from "lucide-react";
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
};

export default function StreamingAdminPage() {
  const { selectedEvent } = useAdminAuthStore();
  const { selectedUsers, clearUsers } = useUsersAdminStore();

  const [streams, setStreams] = useState<PortalStreamingItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const resetFormData = () => ({
    title: "",
    description: "",
    vimeoId: "",
    url: "",
    status: "active",
    startsAt: "",
    expiresAt: "",
    targetAll: true,
    event: ""
  });

  const [formData, setFormData] = useState(resetFormData());

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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (data.success) {
        toast.success(editingId ? "Streaming actualizado correctamente." : "Streaming configurado correctamente.");
        setShowCreateModal(false);
        setEditingId(null);
        setFormData({
          title: "",
          description: "",
          vimeoId: "",
          url: "",
          status: "active",
          startsAt: "",
          expiresAt: "",
          targetAll: true,
          event: selectedEvent || ""
        });
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
    setEditingId(stream.id);
    setFormData({
      title: stream.title,
      description: stream.description || "",
      vimeoId: stream.vimeoId || "",
      url: "",
      status: stream.status,
      startsAt: "", // Need to format dates if present
      expiresAt: "",
      targetAll: stream.recipients?.length === 0,
      event: stream.event
    });
    setShowCreateModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar esta transmisión?")) return;

    try {
      const res = await fetch(`/api/admin/portal/streaming?id=${id}`, {
        method: "DELETE"
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Streaming eliminado correctamente.");
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
            setFormData({
              title: "",
              description: "",
              vimeoId: "",
              url: "",
              status: "active",
              startsAt: "",
              expiresAt: "",
              targetAll: true,
              event: selectedEvent || ""
            });
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
            {isLoading ? (
              <div className="col-span-full py-20 flex flex-col items-center justify-center text-slate-400">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-sm font-medium">Cargando transmisiones...</p>
              </div>
            ) : streams.length === 0 ? (
              <div className="col-span-full bg-white p-20 rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center text-slate-400 opacity-60">
                <Radio className="w-16 h-16 mb-4 stroke-1" />
                <p className="text-lg font-bold">No hay transmisiones configuradas</p>
                <p className="text-sm">Configura tu primer ID de Vimeo para comenzar.</p>
              </div>
            ) : (
              streams.map((stream) => (
                <div key={stream.id} className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col md:flex-row h-full group hover:shadow-md transition-all">
                  {/* Preview Thumbnail (Vimeo style) */}
                  <div className="md:w-48 bg-slate-900 relative flex items-center justify-center group-hover:bg-slate-800 transition-colors">
                    <Video className="w-10 h-10 text-slate-700" />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white shadow-lg">
                        <Play className="w-5 h-5 fill-current ml-1" />
                      </div>
                    </div>
                    {stream.status === 'active' && (
                      <div className="absolute top-3 left-3 px-2 py-0.5 bg-red-500 text-white text-[10px] font-black rounded uppercase flex items-center gap-1 ">
                        <Activity className="w-3 h-3" />
                        En Vivo
                      </div>
                    )}
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
              ))
            )}
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
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Parámetros requeridos</p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <div className="mt-1"><div className="w-1 h-1 bg-indigo-400 rounded-full" /></div>
                    <div>
                      <span className="text-[10px] font-mono font-black text-indigo-500 block">event</span>
                      <span className="text-[11px] text-slate-500 font-medium">Código del evento (Ej: PROEXPLO26)</span>
                    </div>
                  </li>
                  <li className="flex items-start gap-2 opacity-50">
                    <div className="mt-1"><div className="w-1 h-1 bg-slate-400 rounded-full" /></div>
                    <div>
                      <span className="text-[10px] font-mono font-black text-slate-400 block line-through">userKey</span>
                      <span className="text-[11px] text-slate-400 font-medium italic">Ya no es necesario</span>
                    </div>
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
      "vimeoId": "123456",
      "status": "active"
    }
  ]
}`}
                  </pre>
                </div>
              </div>

              <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100">
                <p className="text-[10px] font-bold text-amber-700 flex items-center gap-2">
                  <Activity className="w-3 h-3" />
                  NOTA DE ACCESO
                </p>
                <p className="text-[11px] text-amber-600/80 mt-1 leading-relaxed font-medium">
                  El API filtra automáticamente los contenidos según el estado de pago del usuario.
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
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fecha Inicio (Opcional)</label>
                    <input
                      type="datetime-local"
                      value={formData.startsAt}
                      onChange={(e) => setFormData({ ...formData, startsAt: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fecha Expiración (Opcional)</label>
                    <input
                      type="datetime-local"
                      value={formData.expiresAt}
                      onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
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
    </div>
  );
}
