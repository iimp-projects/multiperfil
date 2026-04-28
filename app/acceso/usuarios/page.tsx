"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, Loader2, UserPlus, X, User as UserIcon } from "lucide-react";
import { PortalRecipientUser, UsersSearchResponse } from "@/types/acceso/users";
import { useUsersAdminStore } from "@/store/acceso/useUsersAdminStore";
import { useAdminAuthStore } from "@/store/acceso/useAdminAuthStore";

export default function UsuariosAdminPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const { selectedEvent } = useAdminAuthStore();
  const eventCode = selectedEvent ?? "";
  const [results, setResults] = useState<PortalRecipientUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { selectedUsers, addUser, removeUser } = useUsersAdminStore();

  const searchUsers = useCallback(async (searchQuery: string, evCode: string) => {
    if (searchQuery.length < 3) {
      setResults([]);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/acceso/users/search?q=${encodeURIComponent(searchQuery)}&event=${encodeURIComponent(evCode)}`);
      const data = (await res.json()) as UsersSearchResponse;
      
      if (data.success) {
        setResults(data.items);
      } else {
        setError(data.message || "Error desconocido");
        setResults([]);
      }
    } catch {
      setError("Error de red al buscar usuarios.");
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      searchUsers(query, eventCode);
    }, 500);

    return () => clearTimeout(timer);
  }, [query, eventCode, searchUsers]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800">Gestión de Usuarios</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Búsqueda */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h2 className="text-lg font-semibold text-slate-700 mb-4">Buscar en Base de Datos</h2>
            <div className="flex gap-4 mb-4">
              {eventCode && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/5 border border-primary/20 rounded-xl">
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  <span className="text-xs font-bold text-primary uppercase tracking-wider">{eventCode}</span>
                </div>
              )}
              {!eventCode && (
                <div className="text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2 font-medium">
                  ⚠ No hay evento seleccionado. Vuelve a iniciar sesión.
                </div>
              )}
              <div className="flex-1">
                <label className="block text-xs font-medium text-slate-500 mb-1">Nombre o SieCode</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    {isLoading ? <Loader2 className="h-5 w-5 text-slate-400 animate-spin" /> : <Search className="h-5 w-5 text-slate-400" />}
                  </div>
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    placeholder="Buscar por nombre o P00..."
                  />
                </div>
              </div>
            </div>

            {error && <div className="text-sm text-red-500 bg-red-50 p-3 rounded-lg mb-4">{error}</div>}
            
            {query.length > 0 && query.length < 3 && !isLoading && (
              <div className="text-sm text-slate-500 text-center py-8">
                Escribe al menos 3 caracteres para buscar...
              </div>
            )}

            {results.length > 0 && (
              <div className="space-y-2 mt-4">
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Resultados ({results.length})</p>
                {results.map((user) => {
                  const isSelected = selectedUsers.some((u) => u.id === user.id);
                  return (
                    <div key={user.id} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-xl hover:border-primary/30 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                          <UserIcon className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-medium text-sm text-slate-700">{user.fullName}</p>
                          <p className="text-xs text-slate-500">SieCode: {user.siecod} | Doc: {user.documentNumber}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => addUser(user)}
                        disabled={isSelected}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
                          isSelected 
                            ? "bg-slate-200 text-slate-500 cursor-not-allowed" 
                            : "bg-primary text-white hover:bg-primary/90"
                        }`}
                      >
                        {isSelected ? "Seleccionado" : <><UserPlus className="w-3.5 h-3.5" /> Agregar</>}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {query.length >= 3 && !isLoading && results.length === 0 && !error && (
              <div className="text-sm text-slate-500 text-center py-8">
                No se encontraron usuarios para &quot;{query}&quot;
              </div>
            )}
          </div>
        </div>

        {/* Usuarios Seleccionados */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 sticky top-8">
            <h2 className="text-lg font-semibold text-slate-700 mb-4 flex items-center justify-between">
              Seleccionados
              <span className="bg-primary/10 text-primary px-2.5 py-0.5 rounded-full text-xs font-bold">
                {selectedUsers.length}
              </span>
            </h2>
            
            {selectedUsers.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-sm border-2 border-dashed border-slate-100 rounded-xl">
                No has seleccionado ningún usuario aún.
              </div>
            ) : (
              <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2 no-scrollbar">
                {selectedUsers.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl group hover:border-red-200 transition-colors">
                    <div className="overflow-hidden">
                      <p className="font-medium text-sm text-slate-700 truncate">{user.fullName}</p>
                      <p className="text-xs text-slate-500">{user.siecod}</p>
                    </div>
                    <button
                      onClick={() => removeUser(user.id)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors flex-shrink-0"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {selectedUsers.length > 0 && (
              <div className="mt-6 pt-4 border-t border-slate-100 space-y-2">
                <button 
                  onClick={() => router.push("/acceso/grupos?create=true")}
                  className="w-full py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors border-none cursor-pointer"
                >
                  Crear Grupo
                </button>
                <button 
                  onClick={() => router.push("/acceso/mensajes?compose=true")}
                  className="w-full py-2 bg-slate-100 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors border-none cursor-pointer"
                >
                  Enviar Mensaje Directo
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
