"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  Users as UsersIcon, 
  Plus, 
  X, 
  User as UserIcon,
  MoreVertical,
  Layers,
  Save,
  CheckCircle2
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
  const [isSubmitting, setIsSubmitting] = useState(false);

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
                <button className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors">
                  <MoreVertical className="w-4 h-4" />
                </button>
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
                <button className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline bg-transparent border-none cursor-pointer">
                  Ver Detalles
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Group Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg animate-in slide-in-from-bottom-8 duration-500 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h2 className="text-lg font-bold text-slate-800">Crear Nuevo Grupo</h2>
              <button 
                onClick={() => setShowCreateModal(false)}
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
                  onClick={() => setShowCreateModal(false)}
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
    </div>
  );
}
