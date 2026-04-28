"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { 
  Users as UsersIcon, 
  Plus, 
  X, 
  User as UserIcon,
  Layers,
  Save,
  Loader2,
  CheckCircle2,
  Trash2,
} from "lucide-react";
import { useAdminAuthStore } from "@/store/acceso/useAdminAuthStore";
import { useUsersAdminStore } from "@/store/acceso/useUsersAdminStore";
import { toast } from "sonner";

type RecipientGroupItem = {
  id: string;
  name: string;
  description?: string | null;
  userKeys: string[];
  createdAt: string;
};

export default function GruposAdminPage() {
  const { selectedEvent } = useAdminAuthStore();
  const { selectedUsers, clearUsers } = useUsersAdminStore();
  
  const [groups, setGroups] = useState<RecipientGroupItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [dismissAutoCreate, setDismissAutoCreate] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<RecipientGroupItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  
  const searchParams = useSearchParams();
  const autoCreateParam = searchParams.get("create") === "true";
  const shouldAutoOpenCreate = autoCreateParam && selectedUsers.length > 0 && !dismissAutoCreate;
  
  useEffect(() => {
    if (autoCreateParam && selectedUsers.length === 0) {
      toast.info("Primero selecciona usuarios en el módulo de Búsqueda.");
    }
  }, [autoCreateParam, selectedUsers.length]);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    description: ""
  });

  const fetchGroups = useCallback(async () => {
    if (!selectedEvent) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/portal/groups?event=${selectedEvent}`);
      const data = await res.json();
      if (data.success) {
        setGroups(data.data);
      }
    } catch {
      toast.error("Error al cargar los grupos.");
    } finally {
      setIsLoading(false);
    }
  }, [selectedEvent]);

  useEffect(() => {
    // Data fetching updates state; this is the intended integration point.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchGroups();
  }, [fetchGroups]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvent) return;
    
    if (selectedUsers.length === 0) {
      toast.error("Debes seleccionar al menos un usuario para crear un grupo.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        event: selectedEvent,
        userKeys: selectedUsers.map(u => u.id)
      };

      const res = await fetch("/api/admin/portal/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (data.success) {
        toast.success("Grupo creado correctamente.");
        setShowCreateModal(false);
        setFormData({ name: "", description: "" });
        clearUsers();
        fetchGroups();
      } else {
        toast.error(data.message || "Error al crear el grupo.");
      }
    } catch {
      toast.error("Error de red.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    if (!confirm("¿Estás seguro de que deseas eliminar este grupo?")) return;
    
    setIsDeleting(groupId);
    try {
      const res = await fetch(`/api/admin/portal/groups?id=${groupId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Grupo eliminado.");
        fetchGroups();
      } else {
        toast.error(data.message || "Error al eliminar.");
      }
    } catch {
      toast.error("Error de red.");
    } finally {
      setIsDeleting(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Grupos de Destinatarios</h1>
          <p className="text-slate-500 text-sm mt-1">Organiza a tus asistentes en segmentos para envíos masivos eficientes.</p>
        </div>
        <button
          onClick={() => {
            if (selectedUsers.length === 0) {
              toast.info("Primero selecciona usuarios en el módulo de Búsqueda.");
            } else {
              setShowCreateModal(true);
            }
          }}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all border-none cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Crear Grupo
        </button>
      </div>

      {/* Stats */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-6">
        <div className="flex items-center gap-3 pr-6 border-r border-slate-100">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
            <Layers className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase">Grupos</p>
            <p className="text-xl font-bold text-slate-800">{groups.length}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
            <UsersIcon className="w-5 h-5 text-emerald-500" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase">Usuarios Seleccionados</p>
            <p className="text-xl font-bold text-slate-800">{selectedUsers.length}</p>
          </div>
        </div>
        {selectedUsers.length > 0 && (
          <button 
            onClick={clearUsers}
            className="ml-auto text-xs font-bold text-slate-400 hover:text-red-500 transition-colors uppercase tracking-widest bg-transparent border-none cursor-pointer"
          >
            Limpiar Selección
          </button>
        )}
      </div>

      {/* Groups List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full py-20 flex flex-col items-center justify-center text-slate-400">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-sm font-medium">Cargando grupos...</p>
          </div>
        ) : groups.length === 0 ? (
          <div className="col-span-full bg-white p-20 rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center text-slate-400 opacity-60">
            <UsersIcon className="w-16 h-16 mb-4 stroke-1" />
            <p className="text-lg font-bold">No hay grupos creados</p>
            <p className="text-sm">Selecciona usuarios en el buscador y agrégalos a un nuevo grupo.</p>
          </div>
        ) : (
          groups.map((group) => (
            <div key={group.id} className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 hover:shadow-md transition-all group">
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center group-hover:bg-primary/5 transition-colors">
                  <UsersIcon className="w-6 h-6 text-slate-400 group-hover:text-primary transition-colors" />
                </div>
                <div className="relative">
                  <button 
                    onClick={() => handleDeleteGroup(group.id)}
                    disabled={isDeleting === group.id}
                    className="p-2 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-500 transition-colors border-none bg-transparent cursor-pointer"
                    title="Eliminar grupo"
                  >
                    {isDeleting === group.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <h3 className="font-bold text-slate-800 text-lg mb-1">{group.name}</h3>
              <p className="text-slate-500 text-xs line-clamp-2 mb-6 h-8">{group.description || "Sin descripción."}</p>
              
              <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="w-6 h-6 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-[8px] font-bold text-slate-500">
                        <UserIcon className="w-3 h-3" />
                      </div>
                    ))}
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">
                    {group.userKeys.length} Miembros
                  </span>
                </div>
                <button 
                  onClick={() => setSelectedGroup(group)}
                  className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline bg-transparent border-none cursor-pointer"
                >
                  Ver Detalles
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Group Modal */}
      {(showCreateModal || shouldAutoOpenCreate) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg animate-in slide-in-from-bottom-8 duration-500 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h2 className="text-lg font-bold text-slate-800">Crear Nuevo Grupo</h2>
              <button 
                onClick={() => {
                  setDismissAutoCreate(true);
                  setShowCreateModal(false);
                }}
                className="p-2 hover:bg-slate-200 rounded-xl text-slate-400 transition-colors border-none bg-transparent cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Nombre del Grupo</label>
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Ej. Conferencistas VIP"
                  required
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Descripción (Opcional)</label>
                <textarea 
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Breve detalle sobre este grupo..."
                  rows={3}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                />
              </div>
              
              <div className="p-4 bg-primary/5 rounded-2xl flex items-center gap-4">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-700">{selectedUsers.length} Usuarios seleccionados</p>
                  <p className="text-[10px] text-slate-500 uppercase">Listos para ser agrupados</p>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setDismissAutoCreate(true);
                    setShowCreateModal(false);
                  }}
                  className="flex-1 py-4 bg-white border border-slate-200 text-slate-500 font-bold rounded-2xl hover:bg-slate-50 transition-all border-none cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-[2] py-4 bg-primary text-white font-bold rounded-2xl shadow-xl shadow-primary/20 hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-3 border-none cursor-pointer transition-all"
                >
                  {isSubmitting ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save className="w-5 h-5" />}
                  Confirmar Grupo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Details Modal */}
      {selectedGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md animate-in zoom-in-95 duration-300 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h2 className="text-lg font-bold text-slate-800">{selectedGroup.name}</h2>
                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mt-0.5">Detalles del Grupo</p>
              </div>
              <button 
                onClick={() => setSelectedGroup(null)}
                className="p-2 hover:bg-slate-200 rounded-xl text-slate-400 transition-colors border-none bg-transparent cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Descripción</label>
                <p className="text-sm text-slate-600 bg-slate-50 p-4 rounded-2xl border border-slate-100 italic">
                  {selectedGroup.description || "Sin descripción proporcionada."}
                </p>
              </div>
              
              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 flex justify-between items-center">
                  Miembros ({selectedGroup.userKeys.length})
                </label>
                <div className="max-h-60 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                  {selectedGroup.userKeys.map((key, idx) => (
                    <div key={`${key}-${idx}`} className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-100 rounded-xl">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                        <UserIcon className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold text-slate-700 tracking-tight">{key}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="p-6 bg-slate-50 border-t border-slate-100">
              <button
                onClick={() => setSelectedGroup(null)}
                className="w-full py-4 bg-white border border-slate-200 text-slate-800 font-bold rounded-2xl hover:bg-slate-100 transition-all cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
