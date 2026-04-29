"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Clock, MapPin, ChevronLeft, Search, Layout } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getFullImageUrl } from "@/lib/s3-utils";
import { toast } from "sonner";
import clsx from "clsx";

type Session = {
  id: string;
  title?: string | null;
  description?: string | null;
  timeRange?: string | null;
  location?: string | null;
  image?: string | null;
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
  primaryColor: string;
  secondaryColor: string;
  tertiaryColor: string;
  tabs: Tab[];
};

export default function ConferenceDetailPage() {
  const { id } = useParams();
  const { isAuthenticated, _hasHydrated } = useAuthStore();
  const router = useRouter();

  const [program, setProgram] = useState<Program | null>(null);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (_hasHydrated && !isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, _hasHydrated, router]);

  const fetchProgram = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/portal/programas/${id}`);
      const data = await res.json();
      if (data.success) {
        setProgram(data.data);
        if (data.data.tabs.length > 0) {
          setActiveTabId(data.data.tabs[0].id);
        }
      }
    } catch (error) {
      console.error("Error fetching program detail:", error);
      toast.error("No se pudo cargar el detalle del programa.");
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (!isAuthenticated) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchProgram();
  }, [isAuthenticated, fetchProgram]);

  if (!_hasHydrated || !isAuthenticated) return null;

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-400">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
          <p className="font-medium animate-pulse uppercase tracking-widest text-xs">
            Cargando Detalle...
          </p>
        </div>
      </DashboardLayout>
    );
  }

  if (!program) {
    return (
      <DashboardLayout>
        <div className="py-20 text-center">
          <h2 className="text-2xl font-bold text-slate-800">
            Programa no encontrado
          </h2>
          <button
            onClick={() => router.back()}
            className="mt-4 text-primary font-bold"
          >
            Volver
          </button>
        </div>
      </DashboardLayout>
    );
  }

  const activeTab = program.tabs.find((t) => t.id === activeTabId);
  const filteredSessions = activeTab?.sessions.filter(
    (s) =>
      (s.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.location?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <DashboardLayout>
      <div className="space-y-8 pb-20 animate-in fade-in duration-700">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors font-bold text-sm bg-transparent border-none cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
          Volver a Conferencias
        </button>

        <header
          className="relative overflow-hidden rounded-[2.5rem] bg-slate-900 min-h-[240px] flex flex-col justify-end p-8 md:p-12 shadow-2xl transition-colors duration-500"
          style={{ backgroundColor: program.primaryColor }}
        >
          {program.coverImage && (
            <div className="absolute inset-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={getFullImageUrl(program.coverImage) ?? undefined}
                alt="Cover"
                className="w-full h-full object-cover opacity-40 scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            </div>
          )}
          <div className="relative z-10 space-y-4 text-left">
            <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight">
              {program.title}
            </h1>
            {program.description && (
              <p className="text-slate-200 text-sm md:text-base max-w-2xl font-medium leading-relaxed">
                {program.description}
              </p>
            )}
          </div>
        </header>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
          <aside className="xl:col-span-3">
            <div className="sticky top-24 bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6 space-y-4">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-2 text-left">
                Cronograma
              </h3>
              <div className="space-y-1">
                {program.tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTabId(tab.id)}
                    className={clsx(
                      "w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all border-none cursor-pointer text-left",
                      activeTabId === tab.id
                        ? "bg-slate-900 text-white shadow-lg"
                        : "text-slate-500 hover:bg-slate-50",
                    )}
                  >
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{
                        backgroundColor:
                          activeTabId === tab.id
                            ? "white"
                            : program.tertiaryColor,
                      }}
                    />
                    {tab.title}
                  </button>
                ))}
              </div>
            </div>
          </aside>

          <main className="xl:col-span-9 space-y-6">
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-4 flex items-center gap-4">
              <div className="relative flex-1 text-left">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar en este programa..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border-none rounded-2xl pl-12 pr-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            <div className="space-y-4">
              <AnimatePresence mode="wait">
                {filteredSessions && filteredSessions.length > 0 ? (
                  <motion.div
                    key={activeTabId}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-4"
                  >
                    {activeTab &&
                      (activeTab.dateTitle || activeTab.dateNumber) && (
                        <div className="flex items-center gap-4 px-4 py-2">
                          <div className="h-px flex-1 bg-slate-100" />
                          <div className="flex items-center gap-2 text-slate-900 font-black uppercase">
                            <span className="text-lg tracking-tight">
                              {activeTab.dateTitle}
                            </span>
                            <span
                              className="text-3xl"
                              style={{ color: program.primaryColor }}
                            >
                              {activeTab.dateNumber}
                            </span>
                          </div>
                          <div className="h-px flex-1 bg-slate-100" />
                        </div>
                      )}
                    {filteredSessions.map((session, idx) => (
                      <div
                        key={session.id}
                        className="group bg-white rounded-[2rem] p-6 md:p-8 border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-500 text-left"
                      >
                        <div className="flex flex-col md:flex-row gap-6 md:items-center">
                          <div
                            className="md:w-32 flex flex-col items-start md:items-center gap-2 border-l-4 pl-4 md:pl-0 md:border-l-0 md:border-r md:border-slate-100"
                            style={{ borderColor: program.primaryColor }}
                          >
                            <div
                              className="flex items-center gap-2"
                              style={{ color: program.primaryColor }}
                            >
                              <Clock className="w-4 h-4" />
                              <span className="text-sm font-black tracking-tight">
                                {session.timeRange?.split("-")[0].trim()}
                              </span>
                            </div>
                            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
                              {session.timeRange?.split("-")[1]?.trim() ||
                                "Termina"}
                            </span>
                          </div>
                          <div className="flex-1 space-y-3">
                            {session.image && (
                              /* eslint-disable-next-line @next/next/no-img-element */
                              <img
                                src={
                                  getFullImageUrl(session.image) ?? undefined
                                }
                                alt={session.title || "Imagen de sesión"}
                                className="w-full h-full "
                              />
                            )}
                            {session.title && (
                              <h4
                                className="text-xl font-bold text-slate-800"
                                style={{
                                  color:
                                    idx % 2 === 0
                                      ? "inherit"
                                      : program.primaryColor,
                                }}
                              >
                                {session.title}
                              </h4>
                            )}
                            {session.description && (
                              <div
                                className="text-slate-500 text-sm font-medium leading-relaxed [&_p]:m-0 [&_ul]:my-2 [&_ol]:my-2 [&_li]:my-1"
                                dangerouslySetInnerHTML={{
                                  __html: session.description,
                                }}
                              />
                            )}
                            {session.location && (
                              <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-xl text-[10px] font-bold text-slate-500 uppercase tracking-wider w-fit">
                                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                                {session.location}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center justify-end">
                            <div
                              className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-300"
                              style={{ color: program.tertiaryColor }}
                            >
                              <Layout className="w-5 h-5" />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </motion.div>
                ) : (
                  <div className="py-20 text-center bg-white rounded-[2rem] border border-slate-100">
                    <p className="text-slate-400 text-sm font-medium">
                      No se encontraron sesiones.
                    </p>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </main>
        </div>
      </div>
    </DashboardLayout>
  );
}
