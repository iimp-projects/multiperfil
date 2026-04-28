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
  Activity
} from "lucide-react";
import { useAdminAuthStore } from "@/store/acceso/useAdminAuthStore";
import { useUsersAdminStore } from "@/store/acceso/useUsersAdminStore";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";

type PortalStreamingItem = {
  id: string;
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

  // Form State
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    vimeoId: "",
    url: "",
    status: "active",
    startsAt: "",
    expiresAt: "",
    targetAll: true
  });

  const fetchStreams = useCallback(async () => {
    if (!selectedEvent) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/portal/streaming?event=${selectedEvent}`);
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
        event: selectedEvent,
        recipients: formData.targetAll ? [] : selectedUsers.map(u => u.id)
      };

      const res = await fetch("/api/admin/portal/streaming", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (data.success) {
        toast.success("Streaming configurado correctamente.");
        setShowCreateModal(false);
        setFormData({
          title: "",
          description: "",
          vimeoId: "",
          url: "",
          status: "active",
          startsAt: "",
          expiresAt: "",
          targetAll: true
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Control de Streaming</h1>
          <p className="text-slate-500 text-sm mt-1">Configura las transmisiones en vivo y videos para los asistentes.</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all border-none cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Nuevo Streaming
        </button>
      </div>

      {/* Streams List */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
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
                  <div className="absolute top-3 left-3 px-2 py-0.5 bg-red-500 text-white text-[10px] font-black rounded uppercase flex items-center gap-1 animate-pulse">
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
                    <button className="px-3 py-1.5 bg-slate-50 text-slate-500 hover:text-primary hover:bg-primary/5 rounded-lg text-[10px] font-bold uppercase transition-all border-none cursor-pointer">
                      Editar
                    </button>
                    <button className="px-3 py-1.5 bg-slate-50 text-slate-500 hover:text-red-500 hover:bg-red-50 rounded-lg text-[10px] font-bold uppercase transition-all border-none cursor-pointer">
                      Eliminar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
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
                  <h2 className="text-lg font-bold text-slate-800">Configurar Transmisión</h2>
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
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Título del Streaming / Sala</label>
                  <input 
                    type="text" 
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    placeholder="Ej. Sala Plenaria - Día 1"
                    required
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Descripción</label>
                  <textarea 
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
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
                      onChange={(e) => setFormData({...formData, vimeoId: e.target.value})}
                      placeholder="Ej. 123456789"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 font-mono"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Estado</label>
                    <select 
                      value={formData.status}
                      onChange={(e) => setFormData({...formData, status: e.target.value})}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none cursor-pointer"
                    >
                      <option value="active">Activo (En Vivo Ahora)</option>
                      <option value="scheduled">Programado</option>
                      <option value="inactive">Inactivo / Oculto</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Acceso Directo (Restricción)</label>
                  <div className="flex gap-2">
                    <button 
                      type="button"
                      onClick={() => setFormData({...formData, targetAll: true})}
                      className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all border ${
                        formData.targetAll ? 'bg-primary text-white border-primary shadow-md shadow-primary/20' : 'bg-slate-50 text-slate-500 border-slate-200'
                      }`}
                    >
                      Público (Todo el evento)
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
                      {selectedUsers.length > 0 ? `${selectedUsers.length} Seleccionados` : "Privado (Segmentado)"}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fecha Inicio (Opcional)</label>
                    <input 
                      type="datetime-local" 
                      value={formData.startsAt}
                      onChange={(e) => setFormData({...formData, startsAt: e.target.value})}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fecha Expiración (Opcional)</label>
                    <input 
                      type="datetime-local" 
                      value={formData.expiresAt}
                      onChange={(e) => setFormData({...formData, expiresAt: e.target.value})}
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
                {isSubmitting ? "Guardando..." : "Publicar Streaming"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
