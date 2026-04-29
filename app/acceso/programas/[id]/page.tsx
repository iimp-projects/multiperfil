"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Plus,
  X,
  Trash2,
  ChevronLeft,
  Layout,
  Upload,
  Image as ImageIcon,
  Clock,
  FileText,
} from "lucide-react";
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [tabFormData, setTabFormData] = useState({
    title: "",
    order: 0,
    dateTitle: "",
    dateNumber: "",
    color: "",
  });
  const [sessionFormData, setSessionFormData] = useState({
    description: "",
    timeRange: "",
    color: "",
    image: "",
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

  const handleAddTab = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/admin/portal/programas/tabs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-id": admin?.id || "",
          "x-admin-email": admin?.email || "",
          "x-admin-name": admin?.name || "",
        },
        body: JSON.stringify({ ...tabFormData, programId: id }),
      });
      if ((await res.json()).success) {
        toast.success("Pestaña creada.");
        setShowTabModal(false);
        fetchDetail();
      }
    } catch {
      toast.error("Error.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTabId) return;
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/admin/portal/programas/sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-id": admin?.id || "",
          "x-admin-email": admin?.email || "",
          "x-admin-name": admin?.name || "",
        },
        body: JSON.stringify({ ...sessionFormData, tabId: activeTabId }),
      });
      if ((await res.json()).success) {
        toast.success("Sesión creada.");
        setShowSessionModal(false);
        setSessionFormData({
          description: "",
          timeRange: "",
          color: "",
          image: "",
          order: 0,
        });
        fetchDetail();
      }
    } catch {
      toast.error("Error.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteTab = async (tabId: string) => {
    if (!confirm("¿Eliminar esta pestaña y todas sus sesiones?")) return;
    try {
      const res = await fetch(`/api/admin/portal/programas/tabs?id=${tabId}`, {
        method: "DELETE",
        headers: {
          "x-admin-id": admin?.id || "",
          "x-admin-email": admin?.email || "",
          "x-admin-name": admin?.name || "",
        },
      });
      if ((await res.json()).success) {
        toast.success("Pestaña eliminada.");
        if (activeTabId === tabId) setActiveTabId(null);
        fetchDetail();
      }
    } catch {
      toast.error("Error.");
    }
  };

  const deleteSession = async (sessionId: string) => {
    try {
      const res = await fetch(
        `/api/admin/portal/programas/sessions?id=${sessionId}`,
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
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                  Título
                </label>
                <input
                  type="text"
                  defaultValue={program.title}
                  onBlur={(e) => handleProgramUpdate("title", e.target.value)}
                  className="w-full bg-transparent border-none text-xl font-black text-slate-800 focus:outline-none p-0"
                />
              </div>

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
                        onChange={(e) =>
                          handleProgramUpdate("primaryColor", e.target.value)
                        }
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
                        onChange={(e) =>
                          handleProgramUpdate("secondaryColor", e.target.value)
                        }
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
                        onChange={(e) =>
                          handleProgramUpdate("tertiaryColor", e.target.value)
                        }
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
                        onClick={() => handleProgramUpdate("brochureUrl", null)}
                        className="ml-auto p-1 hover:bg-indigo-100 rounded text-indigo-400 border-none bg-transparent cursor-pointer"
                      >
                        <X className="w-3 h-3" />
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
                onClick={() => setShowTabModal(true)}
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
                    onClick={() => deleteTab(tab.id)}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity border-none cursor-pointer"
                  >
                    <X className="w-3 h-3" />
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
                      onClick={() => setShowSessionModal(true)}
                      className="text-xs font-bold text-primary flex items-center gap-1 hover:underline bg-transparent border-none cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      Agregar Sesión
                    </button>
                  </div>

                  <div className="space-y-3">
                    {activeTab.sessions.length === 0 ? (
                      <div className="py-20 text-center text-slate-400 border-2 border-dashed border-slate-50 rounded-3xl">
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
                                onClick={() => deleteSession(session.id)}
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

      {/* Modals */}
      {showTabModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 animate-in slide-in-from-bottom-4">
            <h2 className="text-lg font-bold text-slate-800 mb-6">
              Nueva Pestaña
            </h2>
            <form onSubmit={handleAddTab} className="space-y-6">
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
                  Crear
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showSessionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg p-8 animate-in slide-in-from-bottom-4">
            <h2 className="text-lg font-bold text-slate-800 mb-6">
              Nueva Sesión
            </h2>
            <form onSubmit={handleAddSession} className="space-y-6">
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
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Descripción (Editor enriquecido)
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
              <div className="grid grid-cols-1 gap-4">
                <div className="!hidden space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Imagen (Opcional)
                  </label>
                  <div className="flex items-center gap-3">
                    {sessionFormData.image ? (
                      <div className="flex-1 flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-xl">
                        <ImageIcon className="w-4 h-4 text-slate-400" />
                        <span className="text-xs font-bold text-slate-600 truncate">
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
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <label className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-slate-100 rounded-xl text-slate-400 hover:border-primary/20 hover:text-primary transition-all cursor-pointer">
                        <Upload className="w-4 h-4" />
                        <span className="text-xs font-bold">Subir Imagen</span>
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
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Color Especial (Break, Almuerzo, etc)
                  </label>
                  <div className="flex items-center gap-3 mt-1">
                    <div
                      className="w-12 h-12 rounded-xl shadow-inner border border-slate-100 relative overflow-hidden"
                      style={{
                        backgroundColor: sessionFormData.color || "#F1F5F9",
                      }}
                    >
                      <input
                        type="color"
                        value={sessionFormData.color || "#F1F5F9"}
                        onChange={(e) =>
                          setSessionFormData({
                            ...sessionFormData,
                            color: e.target.value,
                          })
                        }
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setSessionFormData({ ...sessionFormData, color: "" })
                      }
                      className="text-[10px] font-bold text-slate-400 hover:text-red-500 bg-transparent border-none cursor-pointer"
                    >
                      Limpiar Color
                    </button>
                  </div>
                </div>
              </div>
              <div className="flex gap-4">
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
                  Crear Sesión
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
