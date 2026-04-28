"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  Mail, 
  Send, 
  Search, 
  Plus, 
  X, 
  Inbox,
  ArrowRight
} from "lucide-react";
import { useAdminAuthStore } from "@/store/acceso/useAdminAuthStore";
import { useUsersAdminStore } from "@/store/acceso/useUsersAdminStore";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import TiptapEditor from "@/components/acceso/TiptapEditor";

type PortalMessageItem = {
  id: string;
  subject: string;
  preview: string;
  createdAt: string;
  recipients: string[];
};

export default function MensajesAdminPage() {
  const { admin, selectedEvent } = useAdminAuthStore();
  const { selectedUsers, clearUsers } = useUsersAdminStore();
  
  const [messages, setMessages] = useState<PortalMessageItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCompose, setShowCompose] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    subject: "",
    content: "",
    targetAll: true
  });

  const fetchMessages = useCallback(async () => {
    if (!selectedEvent) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/portal/messages?event=${selectedEvent}`);
      const data = await res.json();
      if (data.success) {
        setMessages(data.data);
      }
    } catch {
      toast.error("Error al cargar los mensajes.");
    } finally {
      setIsLoading(false);
    }
  }, [selectedEvent]);

  useEffect(() => {
    // Data fetching updates state; this is the intended integration point.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchMessages();
  }, [fetchMessages]);

  useEffect(() => {
    if (selectedUsers.length > 0) {
      // This is a UI convenience derived from external selection.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFormData(prev => ({ ...prev, targetAll: false }));
    }
  }, [selectedUsers]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvent || !admin) return;
    
    if (!formData.content || formData.content === "<p></p>") {
      toast.error("El contenido del mensaje no puede estar vacío.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        event: selectedEvent,
        senderName: admin.name,
        senderRole: admin.role,
        recipients: formData.targetAll ? [] : selectedUsers.map(u => u.id)
      };

      const res = await fetch("/api/admin/portal/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (data.success) {
        toast.success("Mensaje enviado correctamente.");
        setShowCompose(false);
        setFormData({
          subject: "",
          content: "",
          targetAll: true
        });
        if (!formData.targetAll) clearUsers();
        fetchMessages();
      } else {
        toast.error(data.message || "Error al enviar el mensaje.");
      }
    } catch {
      toast.error("Error de red al enviar el mensaje.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Centro de Mensajes</h1>
          <p className="text-slate-500 text-sm mt-1">Envía comunicados y mensajes institucionales a {selectedEvent}.</p>
        </div>
        {!showCompose && (
          <button
            onClick={() => setShowCompose(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all border-none cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Redactar Mensaje
          </button>
        )}
      </div>

      <div className="flex-1 flex gap-6 overflow-hidden">
        {showCompose ? (
          <div className="flex-1 bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden flex flex-col animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                  <Mail className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-lg font-bold text-slate-800">Redactar Comunicado</h2>
              </div>
              <button 
                onClick={() => setShowCompose(false)}
                className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 transition-colors border-none bg-transparent cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
              <form id="compose-form" onSubmit={handleSubmit} className="space-y-6 max-w-3xl mx-auto">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Asunto</label>
                  <input 
                    type="text" 
                    value={formData.subject}
                    onChange={(e) => setFormData({...formData, subject: e.target.value})}
                    placeholder="Ej. Información importante sobre los certificados de asistencia"
                    required
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-base font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Remitente</label>
                    <div className="px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                        {admin?.name?.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-700 truncate">{admin?.name}</p>
                        <p className="text-[10px] text-slate-400 uppercase">{admin?.role}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Contenido del Mensaje</label>
                  <TiptapEditor 
                    content={formData.content} 
                    onChange={(html) => setFormData({...formData, content: html})} 
                  />
                </div>
              </form>
            </div>

            <div className="p-8 border-t border-slate-100 bg-slate-50/50 flex gap-4">
              <button
                type="button"
                onClick={() => setShowCompose(false)}
                className="px-8 py-4 bg-white border border-slate-200 text-slate-500 font-bold rounded-2xl hover:bg-slate-50 transition-all border-none cursor-pointer"
              >
                Cancelar
              </button>
              <button
                form="compose-form"
                type="submit"
                disabled={isSubmitting}
                className="flex-1 py-4 bg-primary text-white font-bold rounded-2xl shadow-xl shadow-primary/20 hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-3 border-none cursor-pointer transition-all"
              >
                {isSubmitting ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Send className="w-5 h-5" />}
                {isSubmitting ? "Enviando..." : "Enviar Comunicado"}
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Sidebar with message list */}
            <div className="w-96 bg-white rounded-3xl border border-slate-100 shadow-sm flex flex-col overflow-hidden">
              <div className="p-4 border-b border-slate-50">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input 
                    type="text" 
                    placeholder="Buscar mensajes..."
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto divide-y divide-slate-50 custom-scrollbar">
                {isLoading ? (
                  <div className="py-20 flex flex-col items-center justify-center text-slate-400">
                    <div className="w-6 h-6 border-3 border-primary border-t-transparent rounded-full animate-spin mb-3" />
                    <p className="text-xs font-medium">Cargando...</p>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="py-20 px-6 text-center text-slate-400 opacity-60">
                    <Inbox className="w-12 h-12 mx-auto mb-3 stroke-1" />
                    <p className="text-sm font-bold">No hay mensajes</p>
                    <p className="text-[10px] mt-1">Los comunicados enviados aparecerán aquí.</p>
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div 
                      key={msg.id} 
                      className="p-4 hover:bg-slate-50 transition-colors cursor-pointer group"
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          {format(new Date(msg.createdAt), "dd MMM", { locale: es })}
                        </span>
                        <span className="text-[10px] font-bold text-primary bg-primary/5 px-2 py-0.5 rounded uppercase">
                          {msg.recipients?.length > 0 ? "Específico" : "Global"}
                        </span>
                      </div>
                      <h3 className="font-bold text-slate-800 text-sm truncate group-hover:text-primary transition-colors">{msg.subject}</h3>
                      <p className="text-slate-500 text-[11px] line-clamp-1 mt-1">{msg.preview}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Empty state for main area */}
            <div className="flex-1 bg-white rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center p-12">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                <Mail className="w-10 h-10 text-slate-300" />
              </div>
              <h2 className="text-xl font-bold text-slate-800 mb-2">Bandeja de Salida</h2>
              <p className="text-slate-500 text-sm max-w-xs mx-auto mb-8">
                Selecciona un mensaje del historial para ver sus detalles o redacta uno nuevo.
              </p>
              <button
                onClick={() => setShowCompose(true)}
                className="flex items-center gap-2 px-8 py-3 bg-primary text-white rounded-2xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all border-none cursor-pointer"
              >
                Comenzar a escribir
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
