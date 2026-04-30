"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Plus,
  X,
  Save,
  Trash2,
  ExternalLink,
  Image as ImageIcon,
  LayoutGrid,
  Pencil,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@nrivera-iimp/ui-kit-iimp";
import { useAdminAuthStore } from "@/store/acceso/useAdminAuthStore";
import { toast } from "sonner";
import { getFullImageUrl, getBucketName } from "@/lib/s3-utils";

type PortalSponsorItem = {
  id: string;
  name: string;
  logoUrl: string;
  category: string;
  url?: string | null;
  event: string;
  order: number;
  createdAt: string;
};
type SponsorCategory = {
  id: string;
  name: string;
  order: number;
};

export default function AuspiciadoresAdminPage() {
  const { admin, selectedEvent } = useAdminAuthStore();
  const [sponsors, setSponsors] = useState<PortalSponsorItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [sponsorToDelete, setSponsorToDelete] =
    useState<PortalSponsorItem | null>(null);

  // Image upload state
  const [uploading, setUploading] = useState(false);

  const [categories, setCategories] = useState<SponsorCategory[]>([]);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [isManagingCategories, setIsManagingCategories] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<SponsorCategory | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    category: "",
    url: "",
    logoUrl: "",
    order: 0,
  });

  const fetchCategories = useCallback(async () => {
    if (!selectedEvent) return;
    try {
      const res = await fetch(
        `/api/admin/portal/auspiciadores/categorias?event=${selectedEvent}`,
      );
      const data = await res.json();
      if (data.success) {
        setCategories(data.data);
        if (data.data.length > 0 && !formData.category) {
          setFormData((prev) => ({ ...prev, category: data.data[0].name }));
        }
      }
    } catch (error) {
      console.error("Error fetching categories", error);
    }
  }, [selectedEvent, formData.category]);

  const fetchSponsors = useCallback(async () => {
    if (!selectedEvent) return;
    setIsLoading(true);
    try {
      const res = await fetch(
        `/api/admin/portal/auspiciadores?event=${selectedEvent}`,
      );
      const data = await res.json();
      if (data.success) {
        setSponsors(data.data);
      }
    } catch {
      toast.error("Error al cargar auspiciadores.");
    } finally {
      setIsLoading(false);
    }
  }, [selectedEvent]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchSponsors();
    fetchCategories();
  }, [fetchSponsors, fetchCategories]);

  const handleAddCategory = async () => {
    if (!newCategoryName.trim() || !selectedEvent) return;
    setIsManagingCategories(true);
    try {
      const res = await fetch("/api/admin/portal/auspiciadores/categorias", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newCategoryName,
          event: selectedEvent,
          order: categories.length,
        }),
      });
      if ((await res.json()).success) {
        setNewCategoryName("");
        fetchCategories();
        toast.success("Categoría añadida");
      }
    } catch {
      toast.error("Error al añadir categoría");
    } finally {
      setIsManagingCategories(false);
    }
  };

  const handleDeleteCategory = (cat: SponsorCategory) => {
    setCategoryToDelete(cat);
  };

  const confirmDeleteCategory = async () => {
    if (!categoryToDelete) return;
    try {
      const res = await fetch(
        `/api/admin/portal/auspiciadores/categorias?id=${categoryToDelete.id}`,
        {
          method: "DELETE",
        },
      );
      if ((await res.json()).success) {
        fetchCategories();
        setCategoryToDelete(null);
        toast.success("Categoría eliminada");
      }
    } catch {
      toast.error("Error al eliminar categoría");
    }
  };

  const handleMoveCategory = async (idx: number, direction: "up" | "down") => {
    const newCategories = [...categories];
    const targetIdx = direction === "up" ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= newCategories.length) return;

    // Swap
    const temp = newCategories[idx];
    newCategories[idx] = newCategories[targetIdx];
    newCategories[targetIdx] = temp;

    // Update orders locally for immediate UI feedback
    const updatedWithOrder = newCategories.map((cat, i) => ({
      ...cat,
      order: i,
    }));
    setCategories(updatedWithOrder);

    // Save to DB
    try {
      await Promise.all([
        fetch("/api/admin/portal/auspiciadores/categorias", {
          method: "PATCH",
          body: JSON.stringify({
            id: updatedWithOrder[idx].id,
            order: updatedWithOrder[idx].order,
          }),
        }),
        fetch("/api/admin/portal/auspiciadores/categorias", {
          method: "PATCH",
          body: JSON.stringify({
            id: updatedWithOrder[targetIdx].id,
            order: updatedWithOrder[targetIdx].order,
          }),
        }),
      ]);
    } catch {
      toast.error("Error al guardar el orden");
      fetchCategories();
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      // 1. Get presigned URL
      const bucketName = getBucketName();
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: file.name,
          fileType: file.type,
          bucketName,
          folder: "auspiciadores",
        }),
      });

      const { uploadUrl, key } = await res.json();

      // 2. Upload to S3
      await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type,
        },
      });

      setFormData((prev) => ({ ...prev, logoUrl: key }));
      toast.success("Logo subido correctamente.");
    } catch (error) {
      console.error(error);
      toast.error("Error al subir el logo.");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvent) return;
    if (!formData.logoUrl) {
      toast.error("El logo es obligatorio.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/admin/portal/auspiciadores", {
        method: editingId ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-id": admin?.id || "",
          "x-admin-email": admin?.email || "",
          "x-admin-name": admin?.name || "",
        },
        body: JSON.stringify({
          ...formData,
          id: editingId,
          event: selectedEvent,
          order: Number(formData.order),
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(
          editingId ? "Actualizado correctamente" : "Creado correctamente",
        );
        setShowModal(false);
        fetchSponsors();
      } else {
        toast.error(data.message || "Error al guardar.");
      }
    } catch {
      toast.error("Error de red.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (item: PortalSponsorItem) => {
    setEditingId(item.id);
    setFormData({
      name: item.name,
      category: item.category,
      url: item.url || "",
      logoUrl: item.logoUrl,
      order: item.order,
    });
    setShowModal(true);
  };

  const confirmDelete = async () => {
    if (!sponsorToDelete) return;
    try {
      const res = await fetch(
        `/api/admin/portal/auspiciadores?id=${sponsorToDelete.id}`,
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
        toast.success("Eliminado correctamente");
        setSponsorToDelete(null);
        fetchSponsors();
      }
    } catch {
      toast.error("Error al eliminar.");
    }
  };

  // Group sponsors by category
  const groupedSponsors = useMemo(() => {
    const groups: Record<string, PortalSponsorItem[]> = {};

    categories.forEach((cat) => {
      const catSponsors = sponsors
        .filter((s) => s.category === cat.name)
        .sort((a, b) => a.order - b.order);
      if (catSponsors.length > 0) {
        groups[cat.name] = catSponsors;
      }
    });

    // Handle sponsors with categories not in the list
    const knownCats = new Set(categories.map((c) => c.name));
    sponsors.forEach((s) => {
      if (!knownCats.has(s.category)) {
        if (!groups[s.category]) groups[s.category] = [];
        groups[s.category].push(s);
      }
    });

    return groups;
  }, [categories, sponsors]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Auspiciadores</h1>
          <p className="text-slate-500 text-sm mt-1">
            Gestiona las empresas que confían en nosotros para el evento{" "}
            {selectedEvent}.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowCategoryModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-200 transition-all border-none cursor-pointer"
          >
            <LayoutGrid className="w-4 h-4" />
            Categorías
          </button>
          <button
            onClick={() => {
              setEditingId(null);
              setFormData({
                name: "",
                category: categories[0]?.name || "",
                url: "",
                logoUrl: "",
                order: 0,
              });
              setShowModal(true);
            }}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all border-none cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Nuevo Auspiciador
          </button>
        </div>
      </div>

      {/* Grid Content */}
      <div className="space-y-10">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-sm font-medium">Cargando auspiciadores...</p>
          </div>
        ) : sponsors.length === 0 ? (
          <div className="bg-white p-20 rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center text-slate-400">
            <LayoutGrid className="w-16 h-16 mb-4 stroke-1" />
            <p className="text-lg font-bold">
              No hay auspiciadores registrados
            </p>
            <p className="text-sm">
              Comienza agregando el primero para este evento.
            </p>
          </div>
        ) : (
          Object.entries(groupedSponsors).map(([category, items]) => (
            <div key={category} className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-slate-100" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                  {category}
                </span>
                <div className="h-px flex-1 bg-slate-100" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {items.map((sponsor) => (
                  <div
                    key={sponsor.id}
                    className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm hover:shadow-md transition-all group flex flex-col"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center overflow-hidden border border-slate-100">
                        {sponsor.logoUrl ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={getFullImageUrl(sponsor.logoUrl) || ""}
                            alt={sponsor.name}
                            className="w-full h-full object-contain p-1"
                          />
                        ) : (
                          <ImageIcon className="text-slate-300 w-6 h-6" />
                        )}
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleEdit(sponsor)}
                          title="Editar"
                          className="p-2 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-primary transition-colors border-none bg-transparent cursor-pointer"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setSponsorToDelete(sponsor)}
                          className="p-2 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-500 transition-colors border-none bg-transparent cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <h3 className="font-bold text-slate-800 text-sm mb-1">
                      {sponsor.name}
                    </h3>
                    {sponsor.url && (
                      <a
                        href={sponsor.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary text-[10px] font-bold flex items-center gap-1 hover:underline mb-3"
                      >
                        <ExternalLink className="w-3 h-3" />
                        Sitio Web
                      </a>
                    )}

                    <div className="mt-auto pt-3 border-t border-slate-50 flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      <span>Orden: {sponsor.order}</span>
                      <span className="bg-slate-50 px-2 py-0.5 rounded-md text-slate-500">
                        {category}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal CRUD */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-xl rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl z-50">
          <div className="bg-white max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <DialogTitle className="text-lg font-bold text-slate-800">
                {editingId ? "Editar Auspiciador" : "Nuevo Auspiciador"}
              </DialogTitle>
              <div className="hidden">
                <p>Formulario para gestionar la información de un auspiciador.</p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 transition-colors border-none bg-transparent cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
              <form
                id="sponsor-form"
                onSubmit={handleSubmit}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Nombre de la Empresa
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      required
                      placeholder="Ej. Empresa SAC"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Categoría
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) =>
                        setFormData({ ...formData, category: e.target.value })
                      }
                      required
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      <option value="">Seleccionar...</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.name}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Sitio Web (Opcional)
                  </label>
                  <input
                    type="url"
                    value={formData.url}
                    onChange={(e) =>
                      setFormData({ ...formData, url: e.target.value })
                    }
                    placeholder="https://empresa.com"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Logo / Imagen
                    </label>
                    <div className="relative group cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        disabled={uploading}
                      />
                      <div
                        className={`w-full px-4 py-3 bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl text-sm flex items-center justify-center gap-3 transition-all ${uploading ? "opacity-50" : "group-hover:border-primary group-hover:bg-primary/5"}`}
                      >
                        <Plus
                          className={`w-5 h-5 ${uploading ? "animate-spin" : "text-slate-400"}`}
                        />
                        <span className="font-bold text-slate-500">
                          {uploading ? "Subiendo..." : "Subir Logo"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Orden
                    </label>
                    <input
                      type="number"
                      value={formData.order}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          order: parseInt(e.target.value) || 0,
                        })
                      }
                      min="0"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>

                {formData.logoUrl && (
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={getFullImageUrl(formData.logoUrl) || ""}
                        alt="Preview"
                        className="w-12 h-12 object-contain bg-white rounded-lg border border-slate-200"
                      />
                      <span className="text-xs font-medium text-slate-500 truncate max-w-[200px]">
                        {formData.logoUrl}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setFormData({ ...formData, logoUrl: "" })
                      }
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors border-none bg-transparent cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </form>
            </div>

            <div className="p-6 border-t border-slate-100 flex gap-4">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="flex-1 py-4 bg-slate-50 text-slate-500 font-bold rounded-2xl border-none cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                form="sponsor-form"
                disabled={isSubmitting || uploading}
                className="flex-[2] py-4 bg-primary text-white font-bold rounded-2xl shadow-xl shadow-primary/20 hover:bg-primary/90 disabled:opacity-50 border-none cursor-pointer transition-all"
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Save className="w-5 h-5" />
                )}
                {isSubmitting ? "Guardando..." : "Guardar Auspiciador"}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog
        open={!!sponsorToDelete}
        onOpenChange={(open) => !open && setSponsorToDelete(null)}
      >
        <DialogContent className="max-w-md rounded-[2.5rem] p-8 overflow-hidden border-none shadow-2xl">
          <div className="flex flex-col items-center text-center space-y-6">
            <div className="w-20 h-20 rounded-3xl bg-red-50 flex items-center justify-center text-red-500">
              <Trash2 size={40} />
            </div>
            <div className="space-y-2">
              <DialogTitle className="text-2xl font-black text-slate-900">
                ¿Eliminar auspiciador?
              </DialogTitle>
              <div className="hidden">
                <p>Confirmación para eliminar permanentemente un auspiciador.</p>
              </div>
              <p className="text-slate-500 font-medium">
                Esta acción eliminará permanentemente a &quot;
                {sponsorToDelete?.name}&quot; del portal.
              </p>
            </div>
            <div className="flex gap-4 w-full pt-4">
              <button
                onClick={() => setSponsorToDelete(null)}
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
      {/* Category Manager Modal */}
      <Dialog
        open={showCategoryModal}
        onOpenChange={(open) => !open && setShowCategoryModal(false)}
      >
        <DialogContent className="max-w-md rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl z-[60]">
          <div className="bg-white">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <DialogTitle className="text-lg font-bold text-slate-800">
                Gestionar Categorías
              </DialogTitle>
              <div className="hidden">
                <p>Ventana para agregar, editar u ordenar categorías de auspiciadores.</p>
              </div>
              <button
                onClick={() => setShowCategoryModal(false)}
                className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 transition-colors border-none bg-transparent cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="Nombre de categoría (ej. DIAMANTE)"
                  className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                <button
                  onClick={handleAddCategory}
                  disabled={isManagingCategories || !newCategoryName.trim()}
                  className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold disabled:opacity-50 border-none cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                {categories.map((cat, idx) => (
                  <div
                    key={cat.id}
                    className="flex items-center justify-between p-3 bg-slate-50 rounded-xl group"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-slate-400 w-4">
                        {idx + 1}
                      </span>
                      <span className="text-sm font-bold text-slate-700">
                        {cat.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleMoveCategory(idx, "up")}
                        disabled={idx === 0}
                        className="p-1 text-slate-400 hover:text-primary transition-colors disabled:opacity-30 border-none bg-transparent cursor-pointer"
                      >
                        <ChevronUp className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleMoveCategory(idx, "down")}
                        disabled={idx === categories.length - 1}
                        className="p-1 text-slate-400 hover:text-primary transition-colors disabled:opacity-30 border-none bg-transparent cursor-pointer"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(cat)}
                        className="p-1.5 ml-1 text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors rounded-lg border-none bg-transparent cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
                {categories.length === 0 && (
                  <div className="text-center py-8 text-slate-400 text-sm">
                    No hay categorías configuradas.
                  </div>
                )}
              </div>

              <p className="text-[10px] text-slate-400 text-center uppercase tracking-widest font-bold">
                Las categorías se ordenan según su creación.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Category Deletion Confirmation Dialog */}
      <Dialog
        open={!!categoryToDelete}
        onOpenChange={(open) => !open && setCategoryToDelete(null)}
      >
        <DialogContent className="max-w-md rounded-[2.5rem] p-8 overflow-hidden border-none shadow-2xl z-[70]">
          <div className="flex flex-col items-center text-center space-y-6">
            <div className="w-20 h-20 rounded-3xl bg-red-50 flex items-center justify-center text-red-500">
              <Trash2 size={40} />
            </div>
            <div className="space-y-2">
              <DialogTitle className="text-2xl font-black text-slate-900">
                ¿Eliminar categoría?
              </DialogTitle>
              <div className="hidden">
                <p>Confirmación para eliminar una categoría de auspiciadores.</p>
              </div>
              <p className="text-slate-500 font-medium leading-relaxed">
                Esta acción eliminará la categoría &quot;
                {categoryToDelete?.name}&quot;. <br />
                <span className="text-red-500 font-bold">Nota:</span> Los
                auspiciadores asociados quedarán sin categoría asignada.
              </p>
            </div>
            <div className="flex gap-4 w-full pt-4">
              <button
                onClick={() => setCategoryToDelete(null)}
                className="flex-1 h-14 bg-slate-100 text-slate-600 font-bold rounded-2xl border-none cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDeleteCategory}
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
