"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Calendar,
  Layout,
  ChevronRight,
  Trash2,
  FileText,
  Pencil,
} from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@nrivera-iimp/ui-kit-iimp";
import { useAdminAuthStore } from "@/store/acceso/useAdminAuthStore";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { getFullImageUrl } from "@/lib/s3-utils";

type ProgramListItem = {
  id: string;
  title: string;
  description?: string | null;
  coverImage?: string | null;
  primaryColor: string;
  secondaryColor: string;
  tertiaryColor: string;
  order: number;
  _count: {
    tabs: number;
  };
};

export default function ProgramasAdminPage() {
  const { admin, selectedEvent } = useAdminAuthStore();
  const [programs, setPrograms] = useState<ProgramListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [programToDelete, setProgramToDelete] =
    useState<ProgramListItem | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const router = useRouter();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    primaryColor: "#1e293b",
    secondaryColor: "#ffffff",
    tertiaryColor: "#fbbf24",
    order: 0,
  });

  const fetchPrograms = useCallback(async () => {
    if (!selectedEvent) return;
    setIsLoading(true);
    try {
      const res = await fetch(
        `/api/admin/portal/programas?event=${selectedEvent}`,
      );
      const data = await res.json();
      if (data.success) {
        setPrograms(data.data);
      }
    } catch {
      toast.error("Error al cargar programas.");
    } finally {
      setIsLoading(false);
    }
  }, [selectedEvent]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchPrograms();
  }, [fetchPrograms]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvent) return;

    setIsSubmitting(true);
    try {
      const method = editingId ? "PATCH" : "POST";
      const res = await fetch("/api/admin/portal/programas", {
        method,
        headers: {
          "Content-Type": "application/json",
          "x-admin-id": admin?.id || "",
          "x-admin-email": admin?.email || "",
          "x-admin-name": admin?.name || "",
        },
        body: JSON.stringify({
          ...(editingId ? { id: editingId } : {}),
          ...formData,
          event: selectedEvent,
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(editingId ? "Programa actualizado." : "Programa creado.");
        setShowModal(false);
        setEditingId(null);
        setFormData({
          title: "",
          description: "",
          primaryColor: "#1e293b",
          secondaryColor: "#ffffff",
          tertiaryColor: "#fbbf24",
          order: 0,
        });
        fetchPrograms();
        if (!editingId) {
          // Redirigir al detalle para configurar pestañas solo si es nuevo
          router.push(`/acceso/programas/${data.data.id}`);
        }
      } else {
        toast.error(data.message || "Error al procesar.");
      }
    } catch {
      toast.error("Error de red.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditModal = (program: ProgramListItem) => {
    setEditingId(program.id);
    setFormData({
      title: program.title,
      description: program.description || "",
      primaryColor: program.primaryColor,
      secondaryColor: program.secondaryColor,
      tertiaryColor: program.tertiaryColor,
      order: program.order,
    });
    setShowModal(true);
  };

  const confirmDelete = async () => {
    if (!programToDelete) return;
    try {
      const res = await fetch(
        `/api/admin/portal/programas?id=${programToDelete.id}`,
        {
          method: "DELETE",
          headers: {
            "x-admin-id": admin?.id || "",
            "x-admin-email": admin?.email || "",
            "x-admin-name": admin?.name || "",
          },
        },
      );
      if ((await res.json()).success) {
        toast.success("Programa eliminado.");
        setProgramToDelete(null);
        fetchPrograms();
      }
    } catch {
      toast.error("Error al eliminar.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Programas de Conferencias
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Gestiona las agendas, cronogramas y documentos por programa.
          </p>
        </div>
        <button
          onClick={() => {
            setEditingId(null);
            setFormData({
              title: "",
              description: "",
              primaryColor: "#1e293b",
              secondaryColor: "#ffffff",
              tertiaryColor: "#fbbf24",
              order: 0,
            });
            setShowModal(true);
          }}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all border-none cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Nuevo Programa
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full py-20 flex flex-col items-center justify-center text-slate-400">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-sm font-medium">Cargando programas...</p>
          </div>
        ) : programs.length === 0 ? (
          <div className="col-span-full bg-white p-20 rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center text-slate-400">
            <Calendar className="w-16 h-16 mb-4 stroke-1" />
            <p className="text-lg font-bold">
              No hay programas para este evento
            </p>
            <p className="text-sm">
              Crea un nuevo programa para empezar a configurar las agendas.
            </p>
          </div>
        ) : (
          programs.map((program) => (
            <div
              key={program.id}
              className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-md transition-all group flex flex-col"
            >
              <div className="h-32 relative bg-slate-900 overflow-hidden">
                {program.coverImage ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={getFullImageUrl(program.coverImage) || ""}
                    alt={program.title}
                    className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center opacity-20">
                    <Layout className="w-12 h-12 text-white" />
                  </div>
                )}
                <div className="absolute top-4 right-4 flex gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openEditModal(program);
                    }}
                    className="p-2 bg-white/10 backdrop-blur-md rounded-lg text-white hover:bg-white hover:text-slate-800 transition-colors border-none cursor-pointer"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setProgramToDelete(program);
                    }}
                    className="p-2 bg-white/10 backdrop-blur-md rounded-lg text-white hover:bg-red-500 transition-colors border-none cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="absolute bottom-4 left-4 flex gap-1">
                  <div
                    className="w-4 h-4 rounded-full border border-white/20"
                    style={{ backgroundColor: program.primaryColor }}
                  />
                  <div
                    className="w-4 h-4 rounded-full border border-white/20"
                    style={{ backgroundColor: program.secondaryColor }}
                  />
                  <div
                    className="w-4 h-4 rounded-full border border-white/20"
                    style={{ backgroundColor: program.tertiaryColor }}
                  />
                </div>
              </div>

              <div className="p-6 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-slate-800 line-clamp-1">
                    {program.title}
                  </h3>
                </div>
                <p className="text-slate-500 text-xs line-clamp-2 mb-6">
                  {program.description || "Sin descripción."}
                </p>

                <div className="mt-auto flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase">
                      <FileText className="w-3 h-3" />
                      {program._count.tabs} Pestañas
                    </div>
                  </div>
                  <button
                    onClick={() =>
                      router.push(`/acceso/programas/${program.id}`)
                    }
                    className="flex items-center gap-2 px-4 py-2 bg-slate-50 text-slate-700 rounded-xl text-xs font-bold hover:bg-primary hover:text-white transition-all border-none cursor-pointer"
                  >
                    Gestionar
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* New Program Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-xl rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl">
          <div className="bg-white">
            <div className="p-6 border-b border-slate-100">
              <DialogTitle className="text-lg font-bold text-slate-800">
                {editingId ? "Editar Programa" : "Crear Nuevo Programa"}
              </DialogTitle>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Título del Programa
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  required
                  placeholder="Ej. Programa de Conferencias Proexplo"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Descripción
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={2}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center block">
                    Primario
                  </label>
                  <input
                    type="color"
                    value={formData.primaryColor}
                    onChange={(e) =>
                      setFormData({ ...formData, primaryColor: e.target.value })
                    }
                    className="w-full h-10 rounded-lg cursor-pointer border-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center block">
                    Secundario
                  </label>
                  <input
                    type="color"
                    value={formData.secondaryColor}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        secondaryColor: e.target.value,
                      })
                    }
                    className="w-full h-10 rounded-lg cursor-pointer border-none"
                  />
                </div>
                <div className="space-y-2">
                  <div
                    className="w-full h-10 rounded-xl shadow-inner border border-slate-100 relative overflow-hidden"
                    style={{ backgroundColor: formData.tertiaryColor }}
                  >
                    <input
                      type="color"
                      value={formData.tertiaryColor}
                      onChange={(e) =>
                        setFormData({ ...formData, tertiaryColor: e.target.value })
                      }
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                  </div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase block text-center">
                    Accent
                  </span>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingId(null);
                    setFormData({
                      title: "",
                      description: "",
                      primaryColor: "#1e293b",
                      secondaryColor: "#ffffff",
                      tertiaryColor: "#fbbf24",
                      order: 0,
                    });
                  }}
                  className="flex-1 py-4 bg-slate-50 text-slate-500 font-bold rounded-2xl border-none cursor-pointer"
                >
                  Descartar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-[2] py-4 bg-primary text-white font-bold rounded-2xl shadow-xl shadow-primary/20 hover:bg-primary/90 disabled:opacity-50 border-none cursor-pointer transition-all"
                >
                  {isSubmitting
                    ? editingId
                      ? "Actualizando..."
                      : "Creando..."
                    : editingId
                      ? "Actualizar Programa"
                      : "Crear Programa"}
                </button>
              </div>
            </form>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog
        open={!!programToDelete}
        onOpenChange={(open) => !open && setProgramToDelete(null)}
      >
        <DialogContent className="max-w-md rounded-[2.5rem] p-8 overflow-hidden border-none shadow-2xl">
          <div className="flex flex-col items-center text-center space-y-6">
            <div className="w-20 h-20 rounded-3xl bg-red-50 flex items-center justify-center text-red-500">
              <Trash2 size={40} />
            </div>
            <div className="space-y-2">
              <DialogTitle className="text-2xl font-black text-slate-900">
                ¿Eliminar programa?
              </DialogTitle>
              <p className="text-slate-500 font-medium">
                Se eliminarán todas las pestañas y sesiones asociadas. Esta
                acción no se puede deshacer.
              </p>
            </div>
            <div className="flex gap-4 w-full pt-4">
              <button
                onClick={() => setProgramToDelete(null)}
                className="flex-1 h-14 bg-slate-100 text-slate-600 font-bold rounded-2xl border-none cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 h-14 bg-red-500 text-white font-bold rounded-2xl shadow-lg shadow-red-200 border-none cursor-pointer"
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
