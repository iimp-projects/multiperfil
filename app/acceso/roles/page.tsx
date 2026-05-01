"use client";

import { useCallback, useEffect, useState } from "react";
import { Shield, Plus, Trash2, Edit2, Check, X } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";

interface Role {
  id: string;
  name: string;
  permissions: string[];
}

const PERMISSION_OPTIONS = [
  { key: "dashboard", label: "Dashboard" },
  { key: "usuarios", label: "Usuarios" },
  { key: "grupos", label: "Grupos" },
  { key: "mensajes", label: "Mensajes" },
  { key: "alertas", label: "Alertas" },
  { key: "streaming", label: "Streaming" },
  { key: "programas", label: "Conferencias" },
  { key: "auspiciadores", label: "Auspiciadores" },
  { key: "sistema_admins", label: "Administradores" },
  { key: "sistema_logs", label: "Logs" },
];

export default function RolesView() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [currentRole, setCurrentRole] = useState<Partial<Role>>({
    name: "",
    permissions: [],
  });

  const fetchRoles = useCallback(async () => {
    try {
      const { data } = await axios.get("/api/admin/roles");
      setRoles(data);
    } catch {
      toast.error("Error al cargar roles");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Data fetching updates state; this is the intended integration point.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchRoles();
  }, [fetchRoles]);

   const handleSave = async () => {
     if (!currentRole.name) return toast.error("El nombre es requerido");

     try {
       if (currentRole.id) {
         await axios.put(`/api/admin/roles/${currentRole.id}`, currentRole);
         toast.success("Rol actualizado correctamente");
       } else {
         await axios.post("/api/admin/roles", currentRole);
         toast.success("Rol creado correctamente");
       }
       setIsEditing(false);
       setCurrentRole({ name: "", permissions: [] });
       fetchRoles();
     } catch (error: unknown) {
       if (axios.isAxiosError(error)) {
         toast.error(error.response?.data?.error || "Error al guardar rol");
       } else {
         toast.error("Error inesperado");
       }
     }
   };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar este rol?")) return;
    try {
      await axios.delete(`/api/admin/roles/${id}`);
      toast.success("Rol eliminado");
      fetchRoles();
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.error || "Error al eliminar rol");
      } else {
        toast.error("Error inesperado");
      }
    }
  };

  const togglePermission = (key: string) => {
    const current = currentRole.permissions || [];
    if (current.includes(key)) {
      setCurrentRole({ ...currentRole, permissions: current.filter((p) => p !== key) });
    } else {
      setCurrentRole({ ...currentRole, permissions: [...current, key] });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Gestión de Roles</h1>
          <p className="text-slate-500 text-sm">Configura qué módulos puede ver cada tipo de usuario.</p>
        </div>
        <button
          onClick={() => {
            setCurrentRole({ name: "", permissions: [] });
            setIsEditing(true);
          }}
          className="bg-primary text-white px-4 py-2 rounded-xl flex items-center gap-2 font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-transform"
        >
          <Plus className="w-4 h-4" />
          Nuevo Rol
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-20 flex justify-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          roles.map((role) => (
            <div key={role.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                <button 
                  onClick={() => {
                    setCurrentRole(role);
                    setIsEditing(true);
                  }}
                  className="p-2 bg-slate-50 text-slate-400 hover:text-primary rounded-lg transition-colors border-none cursor-pointer"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => handleDelete(role.id)}
                  className="p-2 bg-slate-50 text-slate-400 hover:text-red-500 rounded-lg transition-colors border-none cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">{role.name}</h3>
                  <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                    {role.permissions.length} módulos asignados
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-4">
                {role.permissions.map((p) => (
                  <span key={p} className="px-2 py-1 bg-slate-50 text-slate-500 rounded-md text-[10px] font-bold uppercase">
                    {PERMISSION_OPTIONS.find((opt) => opt.key === p)?.label || p}
                  </span>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {isEditing && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-xl font-black text-slate-900">Configurar Rol</h2>
              <button onClick={() => setIsEditing(false)} className="text-slate-400 hover:bg-slate-50 p-2 rounded-xl transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Nombre del Rol</label>
                <input
                  type="text"
                  value={currentRole.name}
                  onChange={(e) => setCurrentRole({ ...currentRole, name: e.target.value })}
                  placeholder="Ej: Marketing, Auditor..."
                  className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Módulos Permitidos</label>
                <div className="grid grid-cols-2 gap-3">
                  {PERMISSION_OPTIONS.map((opt) => (
                    <button
                      key={opt.key}
                      onClick={() => togglePermission(opt.key)}
                      className={`flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                        currentRole.permissions?.includes(opt.key)
                          ? "bg-primary/5 border-primary text-primary font-bold"
                          : "bg-white border-slate-100 text-slate-500 hover:border-slate-300"
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-md flex items-center justify-center border ${
                        currentRole.permissions?.includes(opt.key) ? "bg-primary border-primary text-white" : "border-slate-300"
                      }`}>
                        {currentRole.permissions?.includes(opt.key) && <Check className="w-3 h-3" />}
                      </div>
                      <span className="text-xs">{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="p-6 bg-slate-50 flex gap-3">
              <button
                onClick={() => setIsEditing(false)}
                className="flex-1 px-4 py-3 rounded-2xl font-bold text-slate-500 hover:bg-slate-100 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                className="flex-1 px-4 py-3 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-transform"
              >
                Guardar Rol
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
