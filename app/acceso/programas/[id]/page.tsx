"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Pencil,
  Plus,
  Trash2,
  Clock,
  Layout,
  ImageIcon,
  Upload,
  FileText,
  ChevronLeft,
} from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@nrivera-iimp/ui-kit-iimp";
import { useAdminAuthStore } from "@/store/acceso/useAdminAuthStore";
import { toast } from "sonner";
import { useParams, useRouter } from "next/navigation";
import { getFullImageUrl, getBucketName } from "@/lib/s3-utils";
import TiptapEditor from "@/components/acceso/TiptapEditor";
import clsx from "clsx";

type Session = {
  id: string;
  title?: string | null;
  description?: string | null;
  timeRange?: string | null;
  location?: string | null;
  image?: string | null;
  color?: string | null;
  isSpecial: boolean;
  backgroundColor?: string | null;
  textColor?: string | null;
  order: number;
};

type Tab = {
  id: string;
  title: string;
  dateTitle?: string | null;
  dateNumber?: string | null;
  color?: string | null;
  order: number;
  sessions: Session[];
};

type ProgramDetail = {
  id: string;
  title: string;
  description?: string | null;
  coverImage?: string | null;
  primaryColor: string;
  secondaryColor: string;
  tertiaryColor: string;
  event: string;
  brochureUrl?: string | null;
  tabs: Tab[];
};

type ProgramUpdatableField =
  | "title"
  | "coverImage"
  | "brochureUrl"
  | "primaryColor"
  | "secondaryColor"
  | "tertiaryColor";

type UploadTarget =
  | { kind: "program"; folder: string; field: "coverImage" | "brochureUrl" }
  | { kind: "session"; folder: string; field: "image" };

export default function ProgramDetailAdminPage() {
  const { id } = useParams();
  const { admin } = useAdminAuthStore();
  const router = useRouter();

  const [program, setProgram] = useState<ProgramDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);

  // Modals
  const [showTabModal, setShowTabModal] = useState(false);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [showProgramModal, setShowProgramModal] = useState(false);
  const [editingTabId, setEditingTabId] = useState<string | null>(null);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);
  const [tabToDelete, setTabToDelete] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showBrochureConfirm, setShowBrochureConfirm] = useState(false);

  const [tabFormData, setTabFormData] = useState({
    title: "",
    order: 0,
    dateTitle: "",
    dateNumber: "",
    color: "",
  });
  const [sessionFormData, setSessionFormData] = useState({
    title: "",
    description: "",
    timeRange: "",
    color: "",
    image: "",
    order: 0,
    isSpecial: false,
    backgroundColor: "",
    textColor: "",
  });
  const [programFormData, setProgramFormData] = useState({
    title: "",
    description: "",
    primaryColor: "#1e293b",
    secondaryColor: "#ffffff",
    tertiaryColor: "#fbbf24",
    order: 0,
  });

  const stripHtml = (html: string) =>
    html
      .replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
      .trim();

  const fetchDetail = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/portal/programas/${id}`);
      const data = await res.json();
      if (data.success) {
        setProgram(data.data);
        if (data.data.tabs.length > 0 && !activeTabId) {
          setActiveTabId(data.data.tabs[0].id);
        }
      }
    } catch {
      toast.error("Error al cargar detalles.");
    } finally {
      setIsLoading(false);
    }
  }, [id, activeTabId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchDetail();
  }, [fetchDetail]);

  const handleProgramUpdate = async (
    field: ProgramUpdatableField,
    value: string | null,
  ) => {
    if (!program) return;
    try {
      const res = await fetch("/api/admin/portal/programas", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-admin-id": admin?.id || "",
          "x-admin-email": admin?.email || "",
          "x-admin-name": admin?.name || "",
        },
        body: JSON.stringify({ id: program.id, [field]: value }),
      });
      if ((await res.json()).success) {
        setProgram((prev) =>
          prev ? ({ ...prev, [field]: value } as ProgramDetail) : prev,
        );
        toast.success("Cambio guardado.");
      }
    } catch {
      toast.error("Error al guardar.");
    }
  };

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    target: UploadTarget,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const bucketName = getBucketName();
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: file.name,
          fileType: file.type,
          bucketName,
          folder: target.folder,
        }),
      });
      const { uploadUrl, key } = await res.json();
      await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type,
        },
      });
      if (target.kind === "program") {
        handleProgramUpdate(target.field, key);
      } else {
        setSessionFormData((prev) => ({ ...prev, image: key }));
        toast.success("Imagen de sesión subida.");
      }
    } catch {
      toast.error("Error al subir archivo.");
    } finally {
      setUploading(false);
    }
  };

  const handleAddOrUpdateTab = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const method = editingTabId ? "PATCH" : "POST";
      const payload = editingTabId
        ? { ...tabFormData, id: editingTabId }
        : { ...tabFormData, programId: id };

      const res = await fetch("/api/admin/portal/programas/tabs", {
        method,
        headers: {
          "Content-Type": "application/json",
          "x-admin-id": admin?.id || "",
          "x-admin-email": admin?.email || "",
          "x-admin-name": admin?.name || "",
        },
        body: JSON.stringify(payload),
      });
      if ((await res.json()).success) {
        toast.success(
          editingTabId ? "Pestaña actualizada." : "Pestaña creada.",
        );
        setShowTabModal(false);
        setEditingTabId(null);
        setTabFormData({
          title: "",
          order: 0,
          dateTitle: "",
          dateNumber: "",
          color: "",
        });
        fetchDetail();
      }
    } catch {
      toast.error("Error.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddOrUpdateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTabId && !editingSessionId) return;
    setIsSubmitting(true);
    try {
      const method = editingSessionId ? "PATCH" : "POST";
      const payload = editingSessionId
        ? { ...sessionFormData, id: editingSessionId }
        : { ...sessionFormData, tabId: activeTabId };

      const res = await fetch("/api/admin/portal/programas/sessions", {
        method,
        headers: {
          "Content-Type": "application/json",
          "x-admin-id": admin?.id || "",
          "x-admin-email": admin?.email || "",
          "x-admin-name": admin?.name || "",
        },
        body: JSON.stringify(payload),
      });
      if ((await res.json()).success) {
        toast.success(
          editingSessionId ? "Sesión actualizada." : "Sesión creada.",
        );
        setShowSessionModal(false);
        setEditingSessionId(null);
        setSessionFormData({
          title: "",
          description: "",
          timeRange: "",
          color: "",
          image: "",
          order: 0,
          isSpecial: false,
          backgroundColor: "",
          textColor: "",
        });
        fetchDetail();
      }
    } catch {
      toast.error("Error.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateProgramModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!program) return;
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/admin/portal/programas", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-admin-id": admin?.id || "",
          "x-admin-email": admin?.email || "",
          "x-admin-name": admin?.name || "",
        },
        body: JSON.stringify({ id: program.id, ...programFormData }),
      });
      if ((await res.json()).success) {
        toast.success("Programa actualizado.");
        setShowProgramModal(false);
        fetchDetail();
      }
    } catch {
      toast.error("Error al actualizar.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditProgram = () => {
    if (!program) return;
    setProgramFormData({
      title: program.title,
      description: program.description || "",
      primaryColor: program.primaryColor,
      secondaryColor: program.secondaryColor,
      tertiaryColor: program.tertiaryColor,
      order: 0,
    });
    setShowProgramModal(true);
  };

  const openEditTab = (tab: Tab) => {
    setTabFormData({
      title: tab.title,
      order: tab.order,
      dateTitle: tab.dateTitle || "",
      dateNumber: tab.dateNumber || "",
      color: tab.color || "",
    });
    setEditingTabId(tab.id);
    setShowTabModal(true);
  };

  const openEditSession = (session: Session) => {
    setSessionFormData({
      title: session.title || "",
      description: session.description || "",
      timeRange: session.timeRange || "",
      color: session.color || "",
      image: session.image || "",
      order: session.order || 0,
      isSpecial: !!session.isSpecial,
      backgroundColor: session.backgroundColor || "",
      textColor: session.textColor || "",
    });
    setEditingSessionId(session.id);
    setShowSessionModal(true);
  };

  const deleteTab = async () => {
    if (!tabToDelete) return;
    try {
      const res = await fetch(`/api/admin/portal/programas/tabs?id=${tabToDelete}`, {
        method: "DELETE",
        headers: {
          "x-admin-id": admin?.id || "",
          "x-admin-email": admin?.email || "",
          "x-admin-name": admin?.name || "",
        },
      });
      if ((await res.json()).success) {
        toast.success("Pestaña eliminada.");
        if (activeTabId === tabToDelete) setActiveTabId(null);
        setTabToDelete(null);
        fetchDetail();
      }
    } catch {
      toast.error("Error.");
    }
  };

  const deleteSession = async () => {
    if (!sessionToDelete) return;
    try {
      const res = await fetch(
        `/api/admin/portal/programas/sessions?id=${sessionToDelete}`,
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
        toast.success("Sesión eliminada.");
        setSessionToDelete(null);
        fetchDetail();
      }
    } catch {
      toast.error("Error.");
    }
  };

  if (isLoading && !program) {
    return (
      <div className="py-20 flex flex-col items-center justify-center text-slate-400">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-medium">Cargando detalles del programa...</p>
      </div>
    );
  }

  if (!program) return <div>No encontrado</div>;

  const activeTab = program.tabs.find((t) => t.id === activeTabId);

  return (
    <div className="space-y-8 pb-20">
      {/* Header Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.push("/acceso/programas")}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors font-bold text-sm bg-transparent border-none cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
          Volver a Programas
        </button>
        <div className="px-4 py-1.5 bg-indigo-50 rounded-full text-[10px] font-black text-indigo-600 uppercase tracking-widest">
          {program.event}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sidebar Settings */}
        <aside className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="h-40 relative bg-slate-900 flex items-center justify-center">
              {program.coverImage ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={getFullImageUrl(program.coverImage) || ""}
                  alt="Cover"
                  className="w-full h-full object-cover opacity-50"
                />
              ) : (
                <ImageIcon className="w-12 h-12 text-white/20" />
              )}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black/40">
                <label className="cursor-pointer bg-white text-slate-800 px-4 py-2 rounded-xl text-xs font-bold shadow-lg">
                  {uploading ? "Subiendo..." : "Cambiar Portada"}
                  <input
                    type="file"
                    className="hidden"
                    onChange={(e) =>
                      handleFileUpload(e, {
                        kind: "program",
                        folder: "programas",
                        field: "coverImage",
                      })
                    }
                    disabled={uploading}
                  />
                </label>
              </div>
            </div>

            <div className="p-8 space-y-6">
              <div className="flex items-center justify-between gap-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                  Título
                </label>
                <button
                  onClick={openEditProgram}
                  className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-primary transition-all border-none bg-transparent cursor-pointer"
                  title="Editar detalles del programa"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              </div>
              <input
                type="text"
                defaultValue={program.title}
                onBlur={(e) => handleProgramUpdate("title", e.target.value)}
                className="w-full bg-transparent border-none text-xl font-black text-slate-800 focus:outline-none p-0"
              />

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                  Colores de Marca
                </label>
                <div className="grid grid-cols-3 gap-3 pt-2">
                  <div className="space-y-2">
                    <div
                      className="w-full h-10 rounded-xl shadow-inner border border-slate-100 relative overflow-hidden"
                      style={{ backgroundColor: program.primaryColor }}
                    >
                        <input
                          type="color"
                          value={program.primaryColor}
                          onChange={(e) => {
                            const val = e.target.value;
                            setProgram((prev) =>
                              prev ? { ...prev, primaryColor: val } : null,
                            );
                          }}
                          onBlur={(e) => handleProgramUpdate("primaryColor", e.target.value)}
                          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                        />
                    </div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase block text-center">
                      Base
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div
                      className="w-full h-10 rounded-xl shadow-inner border border-slate-100 relative overflow-hidden"
                      style={{ backgroundColor: program.secondaryColor }}
                    >
                        <input
                          type="color"
                          value={program.secondaryColor}
                          onChange={(e) => {
                            const val = e.target.value;
                            setProgram((prev) =>
                              prev ? { ...prev, secondaryColor: val } : null,
                            );
                          }}
                          onBlur={(e) => handleProgramUpdate("secondaryColor", e.target.value)}
                          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                        />
                    </div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase block text-center">
                      Header
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div
                      className="w-full h-10 rounded-xl shadow-inner border border-slate-100 relative overflow-hidden"
                      style={{ backgroundColor: program.tertiaryColor }}
                    >
                        <input
                          type="color"
                          value={program.tertiaryColor}
                          onChange={(e) => {
                            const val = e.target.value;
                            setProgram((prev) =>
                              prev ? { ...prev, tertiaryColor: val } : null,
                            );
                          }}
                          onBlur={(e) => handleProgramUpdate("tertiaryColor", e.target.value)}
                          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                        />
                    </div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase block text-center">
                      Accent
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                  Brochure (PDF)
                </label>
                <div className="flex items-center gap-3">
                  {program.brochureUrl ? (
                    <div className="flex-1 flex items-center gap-2 px-4 py-3 bg-indigo-50 rounded-xl">
                      <FileText className="w-4 h-4 text-indigo-500" />
                      <span className="text-xs font-bold text-indigo-700 truncate max-w-[120px]">
                        Archivo subido
                      </span>
                      <button
                        onClick={() => setShowBrochureConfirm(true)}
                        className="ml-auto p-1 hover:bg-indigo-100 rounded text-indigo-400 border-none bg-transparent cursor-pointer"
                        title="Eliminar brochure"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-slate-100 rounded-xl text-slate-400 hover:border-primary/20 hover:text-primary transition-all cursor-pointer">
                      <Upload className="w-4 h-4" />
                      <span className="text-xs font-bold">Subir Brochure</span>
                      <input
                        type="file"
                        className="hidden"
                        accept=".pdf"
                        onChange={(e) =>
                          handleFileUpload(e, {
                            kind: "program",
                            folder: "programas/brochures",
                            field: "brochureUrl",
                          })
                        }
                        disabled={uploading}
                      />
                    </label>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-50">
                <p className="text-[11px] text-slate-500 italic">
                  Los colores y archivos se aplicarán automáticamente a la vista
                  pública.
                </p>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Tabs/Agenda Section */}
        <main className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8 min-h-[600px] flex flex-col">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
              <h2 className="text-xl font-bold text-slate-800">Cronograma</h2>
              <button
                onClick={() => {
                  setEditingTabId(null);
                  setTabFormData({
                    title: "",
                    order: 0,
                    dateTitle: "",
                    dateNumber: "",
                    color: "",
                  });
                  setShowTabModal(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-bold hover:bg-indigo-600 hover:text-white transition-all border-none cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Nueva Pestaña
              </button>
            </div>

            {/* Tabs Selector */}
            <div className="flex gap-2 mb-8 overflow-x-auto pb-4 custom-scrollbar">
              {program.tabs.map((tab) => (
                <div key={tab.id} className="relative group shrink-0">
                  <button
                    onClick={() => setActiveTabId(tab.id)}
                    className={clsx(
                      "px-6 py-2.5 rounded-full text-xs font-bold transition-all border-none cursor-pointer flex items-center gap-2",
                      activeTabId === tab.id
                        ? "text-white shadow-lg"
                        : "bg-slate-50 text-slate-500 hover:bg-slate-100",
                    )}
                    style={
                      activeTabId === tab.id
                        ? { backgroundColor: tab.color || "#0f172a" }
                        : {}
                    }
                  >
                    {tab.color && (
                      <div className="w-1.5 h-1.5 rounded-full bg-white" />
                    )}
                    {tab.title}
                  </button>
                  <button
                    onClick={() => openEditTab(tab)}
                    className="absolute -top-1 right-4 w-5 h-5 bg-indigo-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity border-none cursor-pointer z-10"
                  >
                    <Pencil className="w-2.5 h-2.5" />
                  </button>
                  <button
                    onClick={() => setTabToDelete(tab.id)}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity border-none cursor-pointer shadow-lg"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>

            {/* Sessions List */}
            <div className="flex-1 space-y-4">
              {activeTab ? (
                <>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Sesiones de {activeTab.title}
                    </span>
                    <button
                      onClick={() => {
                        setEditingSessionId(null);
                        setSessionFormData({
                          title: "",
                          description: "",
                          timeRange: "",
                          color: "",
                          image: "",
                          order: 0,
                          isSpecial: false,
                          backgroundColor: "",
                          textColor: "",
                        });
                        setShowSessionModal(true);
                      }}
                      className="text-xs font-bold text-primary flex items-center gap-1 hover:underline bg-transparent border-none cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      Agregar Sesión
                    </button>
                  </div>

                  <div className="space-y-3">
                    {/* Header for current tab sessions */}
                    {(activeTab.dateTitle || activeTab.dateNumber) && (
                      <div className="flex items-center gap-3 mb-6 px-1">
                        <span className="text-sm font-black text-slate-800 uppercase tracking-tight">
                          {activeTab.dateTitle}
                        </span>
                        <span className="text-2xl font-black text-primary">
                          {activeTab.dateNumber}
                        </span>
                        {activeTab.title && (
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-auto">
                            {activeTab.title}
                          </span>
                        )}
                      </div>
                    )}

                    {activeTab.sessions.length === 0 ? (
                      <div className="flex-1 flex flex-col items-center justify-center text-slate-300 py-20 border-2 border-dashed border-slate-50 rounded-3xl">
                        <Clock className="w-10 h-10 mx-auto mb-4 opacity-20" />
                        <p className="text-sm">
                          No hay sesiones en esta pestaña.
                        </p>
                      </div>
                    ) : (
                      activeTab.sessions.map((session) => (
                        <div
                          key={session.id}
                          className="bg-slate-50/50 rounded-2xl p-5 border border-slate-100 hover:border-slate-200 transition-all group relative"
                        >
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center gap-3">
                                <span className="bg-white px-2 py-0.5 rounded text-[10px] font-bold  border border-slate-100">
                                  {session.timeRange || "00:00 - 00:00"}
                                </span>
                                {(session.title || session.description) && (
                                  <h4 className="font-normal text-slate-800 text-sm flex items-center gap-2">
                                    {session.title ||
                                      stripHtml(session.description || "") ||
                                      "Sesión"}
                                    {session.color && (
                                      <div
                                        className="w-2 h-2 rounded-full"
                                        style={{
                                          backgroundColor: session.color,
                                        }}
                                        title="Color especial aplicado"
                                      />
                                    )}
                                    {session.image && (
                                      <span className="ml-2 text-[9px] font-black uppercase tracking-widest text-slate-300">
                                        Imagen
                                      </span>
                                    )}
                                  </h4>
                                )}
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => openEditSession(session)}
                                className="p-2 text-slate-300 hover:text-indigo-500 hover:bg-indigo-50 rounded-xl transition-all border-none bg-transparent cursor-pointer"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setSessionToDelete(session.id)}
                                className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all border-none bg-transparent cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                  <Layout className="w-12 h-12 mb-4 opacity-10" />
                  <p className="text-sm">
                    Selecciona una pestaña para ver sus sesiones.
                  </p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Tab Modal */}
      <Dialog open={showTabModal} onOpenChange={setShowTabModal}>
        <DialogContent className="max-w-md rounded-[2.5rem] p-8 border-none shadow-2xl z-[60]">
          <DialogTitle className="text-lg font-bold text-slate-800 mb-6">
            {editingTabId ? "Editar Pestaña" : "Nueva Pestaña"}
          </DialogTitle>

          <form onSubmit={handleAddOrUpdateTab} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Título (Día, Sala, etc)
              </label>
              <input
                type="text"
                value={tabFormData.title}
                onChange={(e) =>
                  setTabFormData({ ...tabFormData, title: e.target.value })
                }
                required
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Título Superior (Ej. LUNES)
                </label>
                <input
                  type="text"
                  value={tabFormData.dateTitle}
                  onChange={(e) =>
                    setTabFormData({
                      ...tabFormData,
                      dateTitle: e.target.value,
                    })
                  }
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Número (Ej. 04)
                </label>
                <input
                  type="text"
                  value={tabFormData.dateNumber}
                  onChange={(e) =>
                    setTabFormData({
                      ...tabFormData,
                      dateNumber: e.target.value,
                    })
                  }
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Color de Pestaña (Opcional)
              </label>
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-xl shadow-inner border border-slate-100 relative overflow-hidden"
                  style={{ backgroundColor: tabFormData.color || "#F1F5F9" }}
                >
                  <input
                    type="color"
                    value={tabFormData.color || "#F1F5F9"}
                    onChange={(e) =>
                      setTabFormData({
                        ...tabFormData,
                        color: e.target.value,
                      })
                    }
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                </div>
                <span className="text-xs font-bold text-slate-500">
                  Preview:{" "}
                  {`${(tabFormData.dateTitle || "").trim()}${(tabFormData.dateNumber || "").trim()}` ||
                    "(vacío)"}
                </span>

                {tabFormData.color && (
                  <button
                    type="button"
                    onClick={() => setTabFormData({ ...tabFormData, color: "" })}
                    className="flex items-center gap-2 px-3 py-2 bg-slate-50 text-red-500 rounded-xl text-[10px] font-black uppercase tracking-widest border border-slate-100 hover:bg-red-50 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                    Restablecer
                  </button>
                )}
              </div>
            </div>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setShowTabModal(false)}
                className="flex-1 py-3 font-bold text-slate-500 border-none bg-transparent cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 py-3 bg-primary text-white font-bold rounded-xl border-none cursor-pointer"
              >
                {editingTabId ? "Actualizar" : "Crear"}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Session Modal */}
      <Dialog open={showSessionModal} onOpenChange={setShowSessionModal}>
        <DialogContent className="max-w-lg rounded-[2.5rem] p-8 border-none shadow-2xl z-[60] overflow-y-auto max-h-[90vh]">
          <DialogTitle className="text-lg font-bold text-slate-800 mb-6">
            {editingSessionId ? "Editar Sesión" : "Nueva Sesión"}
          </DialogTitle>

          <form onSubmit={handleAddOrUpdateSession} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Horario (Ej. 09:00 - 10:00)
              </label>
              <input
                type="text"
                value={sessionFormData.timeRange}
                onChange={(e) =>
                  setSessionFormData({
                    ...sessionFormData,
                    timeRange: e.target.value,
                  })
                }
                required
                placeholder="09:00 - 10:00"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Título (Opcional)
              </label>
              <input
                type="text"
                value={sessionFormData.title || ""}
                onChange={(e) =>
                  setSessionFormData({
                    ...sessionFormData,
                    title: e.target.value,
                  })
                }
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Descripción
              </label>
              <TiptapEditor
                content={sessionFormData.description}
                onChange={(html) =>
                  setSessionFormData({
                    ...sessionFormData,
                    description: html,
                  })
                }
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
              <div className="space-y-2 !hidden">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Imagen (Opcional)
                </label>
                <div className="flex items-center gap-3">
                  {sessionFormData.image ? (
                    <div className="flex-1 flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-xl overflow-hidden">
                      <ImageIcon className="w-4 h-4 text-slate-400 shrink-0" />
                      <span className="text-[10px] font-bold text-slate-600 truncate">
                        Imagen subida
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setSessionFormData({
                            ...sessionFormData,
                            image: "",
                          })
                        }
                        className="ml-auto text-red-500 hover:text-red-700 border-none bg-transparent cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border-2 border-dashed border-slate-100 rounded-xl text-slate-400 hover:border-primary/20 hover:text-primary transition-all cursor-pointer">
                      <Upload className="w-4 h-4" />
                      <span className="text-[10px] font-bold">Subir</span>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={(e) =>
                          handleFileUpload(e, {
                            kind: "session",
                            folder: "programas",
                            field: "image",
                          })
                        }
                        disabled={uploading}
                      />
                    </label>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 space-y-4">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative flex items-center justify-center">
                    <input
                      type="checkbox"
                      checked={sessionFormData.isSpecial}
                      onChange={(e) =>
                        setSessionFormData({
                          ...sessionFormData,
                          isSpecial: e.target.checked,
                          // Default colors if checking
                          backgroundColor: e.target.checked
                            ? sessionFormData.backgroundColor ||
                              program?.secondaryColor ||
                              "#f37021"
                            : "",
                          textColor: e.target.checked
                            ? sessionFormData.textColor || "#ffffff"
                            : "",
                        })
                      }
                      className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border border-slate-200 transition-all checked:border-primary checked:bg-primary"
                    />
                    <span className="absolute text-white opacity-0 peer-checked:opacity-100 pointer-events-none text-[10px]">
                      ✓
                    </span>
                  </div>
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                    ¿Es una Sesión Especial?
                  </span>
                </label>

                {sessionFormData.isSpecial && (
                  <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Color de Fondo
                      </label>
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-xl shadow-inner border border-slate-100 relative overflow-hidden"
                          style={{
                            backgroundColor:
                              sessionFormData.backgroundColor ||
                              program?.secondaryColor ||
                              "#f37021",
                          }}
                        >
                          <input
                            type="color"
                            value={
                              sessionFormData.backgroundColor ||
                              program?.secondaryColor ||
                              "#f37021"
                            }
                            onChange={(e) =>
                              setSessionFormData({
                                ...sessionFormData,
                                backgroundColor: e.target.value,
                              })
                            }
                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                          />
                        </div>
                        {sessionFormData.isSpecial && (
                          <button
                            type="button"
                            onClick={() =>
                              setSessionFormData({
                                ...sessionFormData,
                                backgroundColor: "",
                              })
                            }
                            className="p-2 bg-slate-50 text-red-500 rounded-xl border border-slate-100 hover:bg-red-50 transition-colors cursor-pointer"
                            title="Restablecer al color del sistema"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Color de Texto
                      </label>
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-xl shadow-inner border border-slate-100 relative overflow-hidden"
                          style={{
                            backgroundColor:
                              sessionFormData.textColor || "#ffffff",
                          }}
                        >
                          <input
                            type="color"
                            value={sessionFormData.textColor || "#ffffff"}
                            onChange={(e) =>
                              setSessionFormData({
                                ...sessionFormData,
                                textColor: e.target.value,
                              })
                            }
                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                          />
                        </div>
                        {sessionFormData.isSpecial && (
                          <button
                            type="button"
                            onClick={() =>
                              setSessionFormData({
                                ...sessionFormData,
                                textColor: "",
                              })
                            }
                            className="p-2 bg-slate-50 text-red-500 rounded-xl border border-slate-100 hover:bg-red-50 transition-colors cursor-pointer"
                            title="Restablecer al color del sistema"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={() => setShowSessionModal(false)}
                className="flex-1 py-3 font-bold text-slate-500 border-none bg-transparent cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 py-3 bg-primary text-white font-bold rounded-xl border-none cursor-pointer"
              >
                {editingSessionId ? "Actualizar" : "Crear"}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Program Detail Modal */}
      <Dialog open={showProgramModal} onOpenChange={setShowProgramModal}>
        <DialogContent className="max-w-lg rounded-[2.5rem] p-0 border-none shadow-2xl z-[60] overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <DialogTitle className="text-lg font-bold text-slate-800">
              Editar Programa
            </DialogTitle>
          </div>

          <form onSubmit={handleUpdateProgramModal} className="p-8 space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Título del Programa
              </label>
              <input
                type="text"
                value={programFormData.title}
                onChange={(e) =>
                  setProgramFormData({ ...programFormData, title: e.target.value })
                }
                required
                className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-slate-800 font-medium focus:ring-2 focus:ring-primary/20 outline-none transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Descripción
              </label>
              <textarea
                value={programFormData.description}
                onChange={(e) =>
                  setProgramFormData({
                    ...programFormData,
                    description: e.target.value,
                  })
                }
                className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-slate-800 font-medium focus:ring-2 focus:ring-primary/20 outline-none transition-all min-h-[100px] resize-none"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Principal
                </label>
                <div className="relative group">
                  <div
                    className="w-full h-14 rounded-2xl shadow-inner border border-slate-100 relative overflow-hidden"
                    style={{ backgroundColor: programFormData.primaryColor }}
                  >
                    <input
                      type="color"
                      value={programFormData.primaryColor}
                      onChange={(e) =>
                        setProgramFormData({
                          ...programFormData,
                          primaryColor: e.target.value,
                        })
                      }
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Secundario
                </label>
                <div
                  className="w-full h-14 rounded-2xl shadow-inner border border-slate-100 relative overflow-hidden"
                  style={{ backgroundColor: programFormData.secondaryColor }}
                >
                  <input
                    type="color"
                    value={programFormData.secondaryColor}
                    onChange={(e) =>
                      setProgramFormData({
                        ...programFormData,
                        secondaryColor: e.target.value,
                      })
                    }
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Resalte
                </label>
                <div
                  className="w-full h-14 rounded-2xl shadow-inner border border-slate-100 relative overflow-hidden"
                  style={{ backgroundColor: programFormData.tertiaryColor }}
                >
                  <input
                    type="color"
                    value={programFormData.tertiaryColor}
                    onChange={(e) =>
                      setProgramFormData({
                        ...programFormData,
                        tertiaryColor: e.target.value,
                      })
                    }
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={() => setShowProgramModal(false)}
                className="flex-1 py-4 font-bold text-slate-400 border-none bg-transparent cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 py-4 bg-primary text-white font-bold rounded-2xl border-none cursor-pointer shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform"
              >
                {isSubmitting ? "Guardando..." : "Guardar Cambios"}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={!!sessionToDelete} onOpenChange={() => setSessionToDelete(null)}>
        <DialogContent className="max-w-md rounded-[2.5rem] p-8 border-none shadow-2xl z-[70]">
          <DialogTitle className="text-xl font-bold text-slate-800 mb-2">
            ¿Eliminar sesión?
          </DialogTitle>
          <p className="text-slate-500 text-sm mb-8">
            Esta acción no se puede deshacer. Se eliminará permanentemente la sesión del cronograma.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setSessionToDelete(null)}
              className="flex-1 py-3 font-bold text-slate-500 border-none bg-slate-100 rounded-xl cursor-pointer hover:bg-slate-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={deleteSession}
              className="flex-1 py-3 bg-red-500 text-white font-bold rounded-xl border-none cursor-pointer hover:bg-red-600 transition-colors"
            >
              Eliminar
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Tab Delete Confirmation Modal */}
      <Dialog open={!!tabToDelete} onOpenChange={() => setTabToDelete(null)}>
        <DialogContent className="max-w-md rounded-[2.5rem] p-8 border-none shadow-2xl z-[70]">
          <DialogTitle className="text-xl font-bold text-slate-800 mb-2">
            ¿Eliminar pestaña?
          </DialogTitle>
          <p className="text-slate-500 text-sm mb-8">
            Esta acción eliminará la pestaña y <b>todas las sesiones</b> vinculadas a ella. Esta acción no se puede deshacer.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setTabToDelete(null)}
              className="flex-1 py-3 font-bold text-slate-500 border-none bg-slate-100 rounded-xl cursor-pointer hover:bg-slate-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={deleteTab}
              className="flex-1 py-3 bg-red-500 text-white font-bold rounded-xl border-none cursor-pointer hover:bg-red-600 transition-colors"
            >
              Eliminar Todo
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Brochure Delete Confirmation Modal */}
      <Dialog open={showBrochureConfirm} onOpenChange={setShowBrochureConfirm}>
        <DialogContent className="max-w-md rounded-[2.5rem] p-8 border-none shadow-2xl z-[70]">
          <DialogTitle className="text-xl font-bold text-slate-800 mb-2">
            ¿Eliminar brochure?
          </DialogTitle>
          <p className="text-slate-500 text-sm mb-8">
            Se eliminará el archivo PDF vinculado a este programa. Esta acción no se puede deshacer.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setShowBrochureConfirm(false)}
              className="flex-1 py-3 font-bold text-slate-500 border-none bg-slate-100 rounded-xl cursor-pointer hover:bg-slate-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={() => {
                handleProgramUpdate("brochureUrl", null);
                setShowBrochureConfirm(false);
              }}
              className="flex-1 py-3 bg-red-500 text-white font-bold rounded-xl border-none cursor-pointer hover:bg-red-600 transition-colors"
            >
              Eliminar Brochure
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
