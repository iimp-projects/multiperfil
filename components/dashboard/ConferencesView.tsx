"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  MapPin,
  Search,
  Download,
  Info,
  ChevronRight,
  ArrowLeft,
  Radio,
  CalendarIcon,
  Layout,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useVertical } from "@nrivera-iimp/ui-kit-iimp";
import { getDynamicEventCode } from "@/lib/utils/event";
import { useAuthStore } from "@/store/useAuthStore";
import { VimeoPlayer } from "./VimeoPlayer";
import { getFullImageUrl } from "@/lib/s3-utils";
import clsx from "clsx";

type Session = {
  id: string;
  title?: string | null;
  description?: string | null;
  timeRange?: string | null;
  location?: string | null;
  image?: string | null;
  color?: string | null;
  isSpecial?: boolean;
  backgroundColor?: string | null;
  textColor?: string | null;
  timeColor?: string | null;
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

type Program = {
  id: string;
  title: string;
  description?: string | null;
  coverImage?: string | null;
  brochureUrl?: string | null;
  primaryColor: string;
  secondaryColor: string;
  tertiaryColor: string;
  tabs: Tab[];
};

export default function ConferencesView({ initialId }: { initialId?: string }) {
  const { vertical } = useVertical();
  const { hasStreamingAccess } = useAuthStore();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [activeStream, setActiveStream] = useState<{
    vimeoId: string;
    title: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "detail">(
    initialId ? "detail" : "grid",
  );
  const router = useRouter();

  useEffect(() => {
    const fetchPrograms = async () => {
      try {
        const eventCode = getDynamicEventCode(vertical);
        const res = await fetch(`/api/portal/programas?event=${eventCode}`);
        const data = await res.json();
        if (data.success) {
          setPrograms(data.data);
          if (data.data.length > 0 && !selectedProgram) {
            const firstProgram = data.data[0];
            setSelectedProgram(firstProgram);
            if (firstProgram.tabs.length > 0) {
              setActiveTabId(firstProgram.tabs[0].id);
            }
          }
        }
      } catch (error) {
        console.error("Error fetching programs:", error);
      } finally {
        setIsLoading(false);
      }
    };

    const fetchActiveStream = async () => {
      try {
        const eventCode = getDynamicEventCode(vertical);
        const res = await fetch(`/api/portal/streaming?event=${eventCode}`);
        const data = await res.json();
        if (data.success && data.data.length > 0) {
          const stream = data.data[0];
          if (stream.vimeoId) {
            setActiveStream({
              vimeoId: stream.vimeoId,
              title: stream.title,
            });
          }
        }
      } catch (error) {
        console.error("Error fetching streaming:", error);
      }
    };

    fetchPrograms();
    fetchActiveStream();
    // selectedProgram is intentionally omitted:
    // initial selection should happen once after fetch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vertical]);

  const activeTab = selectedProgram?.tabs.find((t) => t.id === activeTabId);

  const filteredSessions = activeTab?.sessions.filter(
    (s) =>
      (s.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.location?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // Dynamic styles based on tab color or program fallback
  const themeStyles = {
    "--theme-primary":
      activeTab?.color || selectedProgram?.primaryColor || "#3b82f6",
    "--theme-secondary": selectedProgram?.secondaryColor || "#1e293b",
    "--theme-accent":
      activeTab?.color || selectedProgram?.tertiaryColor || "#64748b",
    "--theme-bg-10": activeTab?.color
      ? `${activeTab.color}1a`
      : "rgba(15, 23, 42, 0.05)", // 10%
    "--theme-bg-20": activeTab?.color
      ? `${activeTab.color}33`
      : "rgba(15, 23, 42, 0.1)", // 20%
    "--theme-bg-50": activeTab?.color
      ? `${activeTab.color}80`
      : "rgba(15, 23, 42, 0.2)", // 50%
    "--theme-bg-80": activeTab?.color
      ? `${activeTab.color}cc`
      : "rgba(15, 23, 42, 0.4)", // 80%
  } as React.CSSProperties;

  const handleSelectProgram = (program: Program) => {
    setSelectedProgram(program);
    setViewMode("detail");
    if (program.tabs.length > 0) {
      setActiveTabId(program.tabs[0].id);
    }
    router.push(`/dashboard/conferences/${program.id}`);
  };

  const handleBackToGrid = () => {
    setSelectedProgram(null);
    setViewMode("grid");
    router.push("/dashboard/conferences");
  };

  // Sync with initialId or fetch
  useEffect(() => {
    if (initialId && programs.length > 0) {
      const program = programs.find((p) => p.id === initialId);
      if (program) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setSelectedProgram(program);
        setViewMode("detail");
        // Only set active tab if not already set or if switching programs
        if (
          program.tabs.length > 0 &&
          (!activeTabId || !program.tabs.find((t) => t.id === activeTabId))
        ) {
          setActiveTabId(program.tabs[0].id);
        }
      }
    } else if (!initialId) {
      setSelectedProgram(null);
      setViewMode("grid");
      setActiveTabId(null);
    }
    // activeTabId is intentionally omitted: this effect only reacts
    // to URL/program list changes and may set activeTabId.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialId, programs]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-400">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
        <p className="font-medium animate-pulse uppercase tracking-widest text-xs">
          Cargando Agenda...
        </p>
      </div>
    );
  }

  if (programs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-400 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-12 text-center">
        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
          <CalendarIcon className="w-10 h-10 opacity-20" />
        </div>
        <h3 className="text-xl font-bold text-slate-800 mb-2">
          No hay programas disponibles
        </h3>
        <p className="text-sm max-w-xs mx-auto">
          La agenda para este evento aún no ha sido publicada. Vuelve pronto.
        </p>
      </div>
    );
  }

  if (viewMode === "grid") {
    return (
      <div className="space-y-8 pb-20 animate-in fade-in duration-700">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">
              Agenda de Conferencias
            </h1>
            <p className="text-slate-500 mt-1">
              Explora las charlas y actividades de todos nuestros programas.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {programs.map((program) => (
            <motion.div
              key={program.id}
              whileHover={{ y: -8 }}
              className="group bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden shadow-sm hover:shadow-2xl transition-all cursor-pointer flex flex-col"
              onClick={() => handleSelectProgram(program)}
            >
              <div className="h-48 relative bg-slate-900 overflow-hidden">
                {program.coverImage ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={getFullImageUrl(program.coverImage) ?? undefined}
                    alt={program.title}
                    className="w-full h-full object-cover opacity-60 group-hover:scale-110 transition-transform duration-700"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center opacity-20">
                    <CalendarIcon className="w-16 h-16 text-white" />
                  </div>
                )}
                <div className="absolute bottom-4 left-4 flex gap-1">
                  <div
                    className="w-3 h-3 rounded-full border border-white/20"
                    style={{ backgroundColor: program.primaryColor }}
                  />
                  <div
                    className="w-3 h-3 rounded-full border border-white/20"
                    style={{ backgroundColor: program.tertiaryColor }}
                  />
                </div>
              </div>
              <div className="p-8 space-y-4 flex-1 flex flex-col">
                <h3 className="text-xl font-bold text-slate-800 line-clamp-2">
                  {program.title}
                </h3>
                <p className="text-slate-500 text-sm font-medium line-clamp-2 mb-4">
                  {program.description || "Sin descripción disponible."}
                </p>
                <div className="mt-auto flex items-center justify-between pt-4 border-t border-slate-50">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    {program.tabs.length} Días
                  </span>
                  <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-primary group-hover:text-white transition-all">
                    <ChevronRight className="w-5 h-5" />
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      className="space-y-8 pb-20 animate-in fade-in duration-700"
      style={themeStyles}
    >
      {/* Header Section */}
      <header
        className="relative overflow-hidden rounded-[2.5rem] bg-slate-900 min-h-[280px] flex flex-col justify-end p-8 md:p-12 shadow-2xl transition-all duration-500"
        style={{ backgroundColor: selectedProgram?.primaryColor }}
      >
        {selectedProgram?.coverImage && (
          <div className="absolute inset-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={getFullImageUrl(selectedProgram.coverImage) ?? undefined}
              alt="Cover"
              className="w-full h-full object-cover opacity-40"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          </div>
        )}

        <div className="relative z-10 space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div className="space-y-4 text-left">
              <button
                onClick={handleBackToGrid}
                className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-[10px] font-black text-white uppercase tracking-[0.2em] hover:bg-white/20 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3 h-3" />
                Volver a programas
              </button>
              <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight">
                {selectedProgram?.title}
              </h1>
              {selectedProgram?.description && (
                <p className="text-slate-200 text-sm md:text-base max-w-2xl font-medium leading-relaxed">
                  {selectedProgram.description}
                </p>
              )}
            </div>

            {selectedProgram?.brochureUrl && (
              <a
                href={getFullImageUrl(selectedProgram.brochureUrl) ?? undefined}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 px-6 py-4 bg-primary hover:bg-secondary text-white hover:text-black rounded-3xl text-sm font-black uppercase tracking-widest shadow-xl hover:scale-105 transition-all no-underline shrink-0"
              >
                <Download className="w-5 h-5" />
                Descargar Brochure
              </a>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        {/* Sidebar / Tabs Selector */}
        <aside className="xl:col-span-3 space-y-6">
          <div className="sticky top-24 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-8 space-y-8">
            <div className=" border-slate-50 space-y-4">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-2 text-left">
                Cronograma
              </h3>
              <div className="space-y-1">
                {selectedProgram?.tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTabId(tab.id)}
                    className={clsx(
                      "w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all border-none cursor-pointer text-left",
                      activeTabId === tab.id
                        ? "text-white shadow-lg"
                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-900",
                    )}
                    style={
                      activeTabId === tab.id
                        ? {
                            backgroundColor:
                              tab.color ||
                              selectedProgram?.primaryColor ||
                              "var(--theme-primary)",
                          }
                        : {}
                    }
                  >
                    <div
                      className={clsx(
                        "w-2 h-2 rounded-full",
                        activeTabId === tab.id ? "bg-white" : "bg-slate-200",
                      )}
                      style={
                        activeTabId === tab.id
                          ? {}
                          : {
                              backgroundColor:
                                tab.color ||
                                selectedProgram?.primaryColor ||
                                "var(--theme-accent)",
                            }
                      }
                    />
                    {tab.title}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* Sessions List */}
        <main className="xl:col-span-9 space-y-6">
          {/* Streaming Section */}
          {activeStream && hasStreamingAccess && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden"
            >
              <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center shadow-inner">
                    <Radio className="w-6 h-6 animate-pulse" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black text-red-500 uppercase tracking-widest">
                        En Vivo Ahora
                      </span>
                      <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-ping" />
                    </div>
                    <h3 className="text-xl font-black text-slate-900 tracking-tight">
                      {activeStream.title}
                    </h3>
                  </div>
                </div>
              </div>
              <div className="p-2">
                <VimeoPlayer
                  vimeoId={activeStream.vimeoId}
                  title={activeStream.title}
                />
              </div>
            </motion.div>
          )}

          {/* Search Bar */}
          <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-4 flex flex-col md:flex-row items-center gap-4">
            <div className="relative flex-1 w-full text-left">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por charla, conferencista o sala..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border-none rounded-3xl pl-14 pr-6 py-4 text-sm font-medium focus:ring-2 focus:ring-primary/20 transition-all outline-none"
              />
            </div>
            <div
              className="flex items-center gap-2 px-5 py-4 bg-slate-50 rounded-3xl text-slate-400"
              style={{
                color: selectedProgram?.primaryColor || "var(--theme-primary)",
                backgroundColor: `${selectedProgram?.primaryColor || "#000000"}10`,
              }}
            >
              <Info className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase tracking-widest whitespace-nowrap">
                {filteredSessions?.length || 0} Sesiones
              </span>
            </div>
          </div>

          {/* Sessions Feed */}
          <div className="space-y-4">
            <AnimatePresence mode="wait">
              {filteredSessions && filteredSessions.length > 0 ? (
                <motion.div
                  key={`${activeTabId ?? "none"}-${selectedProgram?.id ?? "none"}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6"
                >
                  {/* Timeline Title style LUNES 04 - SALA MAGNA */}
                  {activeTab && (
                    <div className="flex items-center gap-4 px-4 py-2">
                      <div className="h-px flex-1 bg-slate-100" />
                      <div className="flex flex-col items-center text-center">
                        <div
                          className="flex items-center gap-2 font-black uppercase"
                          style={{
                            color:
                              selectedProgram?.secondaryColor ||
                              "var(--theme-header)",
                          }}
                        >
                          {activeTab.dateTitle && (
                            <span className="text-6xl tracking-tight">
                              {activeTab.dateTitle}
                            </span>
                          )}
                          {activeTab.dateNumber && (
                            <span className="text-4xl">
                              {activeTab.dateNumber}
                            </span>
                          )}
                        </div>
                        {activeTab.title && (
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">
                            {activeTab.title}
                          </span>
                        )}
                      </div>
                      <div className="h-px flex-1 bg-slate-100" />
                    </div>
                  )}

                  {filteredSessions.map((session) => (
                    <div
                      key={session.id}
                      className={clsx(
                        "group bg-white rounded-[2.5rem] p-8 border-none shadow-sm hover:shadow-2xl transition-all duration-700 text-left relative overflow-hidden",
                        session.color && "border-l-[12px]",
                      )}
                      style={{
                        backgroundColor: session.isSpecial
                          ? session.backgroundColor ||
                            selectedProgram?.secondaryColor ||
                            "#f37021"
                          : "white",
                      }}
                    >
                      {/* Subtitle/Accent line if special */}
                      {session.isSpecial && (
                        <div
                          className="absolute top-0 left-0 w-full h-1.5 opacity-40"
                          style={{
                            backgroundColor: session.textColor || "#ffffff",
                          }}
                        />
                      )}

                      <div className="flex flex-col md:flex-row gap-8 md:items-center">
                        {/* Time Column */}
                        <div
                          className="md:w-28 flex flex-col items-center justify-center gap-1 shrink-0 rounded-2xl py-5 px-4 shadow-sm h-fit mt-1"
                          style={{
                            backgroundColor:
                              selectedProgram?.tertiaryColor || "#ffffff",
                          }}
                        >
                          <div className="flex flex-col items-center">
                            <span 
                              className="font-black text-black/40 tracking-widest uppercase text-[9px] mb-1"
                              style={session.timeColor ? { color: session.timeColor, opacity: 0.7 } : {}}
                            >
                              comienza
                            </span>
                            <span 
                              className="text-xl font-black text-black tracking-tight leading-none"
                              style={session.timeColor ? { color: session.timeColor } : {}}
                            >
                              {session.timeRange?.split("-")[0].trim()}
                            </span>
                          </div>
                          <div 
                            className="w-8 h-px bg-black/10 my-3"
                            style={session.timeColor ? { backgroundColor: session.timeColor, opacity: 0.2 } : {}}
                          />
                          <div className="flex flex-col items-center">
                            <span 
                              className="font-black text-black/40 tracking-widest uppercase text-[9px] mb-1"
                              style={session.timeColor ? { color: session.timeColor, opacity: 0.7 } : {}}
                            >
                              hasta
                            </span>
                            <span 
                              className="text-xl font-black text-black tracking-tight leading-none"
                              style={session.timeColor ? { color: session.timeColor } : {}}
                            >
                              {session.timeRange?.split("-")[1]?.trim() || "Termina"}
                            </span>
                          </div>
                        </div>

                        {/* Info Column */}
                        <div className="flex-1 space-y-4">
                          {session.image && (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img
                              src={getFullImageUrl(session.image) ?? undefined}
                              alt={session.title || "Imagen de sesión"}
                              className="w-full h-full object-cover"
                            />
                          )}
                          {session.title && (
                            <h4
                              className={clsx(
                                "text-xl md:text-2xl font-bold leading-tight !text-center",
                                !session.isSpecial && "text-slate-800",
                              )}
                              style={{
                                color: session.isSpecial
                                  ? session.textColor || "#ffffff"
                                  : undefined,
                              }}
                            >
                              {session.title}
                            </h4>
                          )}
                          {session.description && (
                            <div
                              className={clsx(
                                "text-sm md:text-base font-normal leading-relaxed [&_p]:m-0 [&_ul]:my-2 [&_ol]:my-2 [&_li]:my-1",
                                !session.isSpecial && "text-slate-500",
                              )}
                              style={{
                                color: session.isSpecial
                                  ? session.textColor || "#ffffff"
                                  : undefined,
                              }}
                              dangerouslySetInnerHTML={{
                                __html: session.description,
                              }}
                            />
                          )}
                          <div className="flex flex-wrap items-center gap-4 pt-2 !hidden">
                            <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-2xl text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                              <MapPin className="w-3.5 h-3.5 text-slate-400" />
                              {session.location || "Por confirmar"}
                            </div>
                          </div>
                        </div>

                        {/* Action Column */}
                        <div className="flex items-center justify-end shrink-0 !hidden">
                          <div
                            className="w-14 h-14 rounded-3xl flex items-center justify-center transition-all duration-500"
                            style={{
                              color: session.color || "var(--theme-primary)",
                              backgroundColor: session.color
                                ? `${session.color}1a`
                                : "var(--theme-bg-10)",
                            }}
                          >
                            <Layout className="w-6 h-6" />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </motion.div>
              ) : (
                <div className="py-20 text-center bg-white rounded-[2.5rem] border border-slate-100 shadow-sm">
                  <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Search className="w-10 h-10 opacity-10" />
                  </div>
                  <p className="text-slate-400 font-medium">
                    No encontramos sesiones que coincidan con tu búsqueda.
                  </p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
}
