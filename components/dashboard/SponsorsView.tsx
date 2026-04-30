"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Handshake,
  ExternalLink,
  Search,
  LayoutGrid,
  ShieldCheck,
} from "lucide-react";
import { motion } from "framer-motion";
import { useVertical } from "@nrivera-iimp/ui-kit-iimp";
import { getDynamicEventCode } from "@/lib/utils/event";
import { getFullImageUrl } from "@/lib/s3-utils";
import { toast } from "sonner";
import clsx from "clsx";

type SponsorCategory = {
  id: string;
  name: string;
  order: number;
};

type Sponsor = {
  id: string;
  name: string;
  logoUrl: string;
  category: string;
  url?: string | null;
  order: number;
};

export default function SponsorsView() {
  const { vertical } = useVertical();
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [categories, setCategories] = useState<SponsorCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("TODOS");

  const fetchSponsors = useCallback(async () => {
    setIsLoading(true);
    try {
      const eventCode = getDynamicEventCode(vertical);
      const res = await fetch(`/api/portal/sponsors?event=${eventCode}`);
      const data = await res.json();
      if (data.success) {
        setSponsors(data.data);
        setCategories(data.categories || []);
      }
    } catch (error) {
      console.error("Error fetching sponsors:", error);
      toast.error("No se pudieron cargar los auspiciadores.");
    } finally {
      setIsLoading(false);
    }
  }, [vertical]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchSponsors();
  }, [fetchSponsors]);

  const displayCategories = useMemo(() => {
    return ["TODOS", ...categories.map((c) => c.name)];
  }, [categories]);

  const filteredSponsors = sponsors.filter((s) => {
    const matchesSearch = s.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesCategory =
      activeCategory === "TODOS" || s.category.toUpperCase() === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const groupedSponsors = useMemo(() => {
    const groups: { category: string; items: Sponsor[] }[] = [];

    // Sort sponsors within each category by their order field
    const sortedSponsors = [...filteredSponsors].sort(
      (a, b) => a.order - b.order,
    );

    categories.forEach((cat) => {
      const items = sortedSponsors.filter(
        (s) => s.category.toUpperCase() === cat.name.toUpperCase(),
      );
      if (items.length > 0) {
        groups.push({ category: cat.name, items });
      }
    });

    // Fallback for sponsors with categories not in the categories list
    const knownCatNames = new Set(categories.map((c) => c.name.toUpperCase()));
    const orphans = sortedSponsors.filter(
      (s) => !knownCatNames.has(s.category.toUpperCase()),
    );
    if (orphans.length > 0) {
      // Group orphans by category name
      const orphanGroups: Record<string, Sponsor[]> = {};
      orphans.forEach((s) => {
        const c = s.category.toUpperCase();
        if (!orphanGroups[c]) orphanGroups[c] = [];
        orphanGroups[c].push(s);
      });
      Object.entries(orphanGroups).forEach(([name, items]) => {
        groups.push({ category: name, items });
      });
    }

    return groups;
  }, [filteredSponsors, categories]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-400">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
        <p className="font-medium animate-pulse uppercase tracking-widest text-xs">
          Cargando Auspiciadores...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-20 animate-in fade-in duration-700">
      {/* Hero Header */}
      <header className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-slate-900 via-slate-800 to-primary p-8 md:p-16 flex flex-col items-center text-center shadow-2xl">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-64 h-64 bg-white blur-[120px] rounded-full" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-primary blur-[150px] rounded-full" />
        </div>

        <div className="relative z-10 space-y-6 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-[10px] font-black text-white uppercase tracking-[0.3em] mx-auto">
            <Handshake className="w-4 h-4" />
            Confían en nosotros
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight leading-tight">
            Empresas Líderes <br className="hidden md:block" /> del Sector
          </h1>
          <p className="text-slate-300 text-sm md:text-lg font-medium leading-relaxed max-w-xl mx-auto">
            Agradecemos el valioso apoyo de nuestros auspiciadores, pilares
            fundamentales en la realización de este prestigioso evento.
          </p>
        </div>
      </header>

      {/* Filter & Search Toolbar */}
      <div className="sticky top-24 z-20 flex flex-col md:flex-row gap-4 items-center bg-white/80 backdrop-blur-xl p-4 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar empresa..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border-none rounded-2xl pl-12 pr-4 py-3 text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all outline-none"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 no-scrollbar">
          {displayCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={clsx(
                "px-5 py-2.5 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all shrink-0 border-none cursor-pointer",
                activeCategory === cat
                  ? "bg-slate-900 text-white shadow-lg"
                  : "bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-900",
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Sponsors Grid */}
      <div className="space-y-16">
        {groupedSponsors.map(({ category, items }) => {
          const isGold = category.toUpperCase() === "ORO";
          const isSilver = category.toUpperCase() === "PLATA";
          
          return (
            <section
              key={category}
              className="space-y-8 animate-in slide-in-from-bottom-4 duration-500"
            >
              <div className="flex items-center gap-6">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
                <div className="flex items-center gap-3">
                  <ShieldCheck 
                    className={clsx(
                      "w-5 h-5",
                      isGold ? "text-amber-500" : isSilver ? "text-slate-400" : "text-primary"
                    )} 
                  />
                  <h2 className={clsx(
                    "text-sm font-bold uppercase tracking-[0.4em]",
                    isGold ? "text-amber-600" : "text-slate-900"
                  )}>
                    Auspiciadores {category}
                  </h2>
                </div>
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
              </div>

              <div className={clsx(
                "grid gap-6",
                isGold 
                  ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" 
                  : "grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
              )}>
                {items.map((sponsor) => (
                  <motion.a
                    key={sponsor.id}
                    href={sponsor.url || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ y: -8, scale: 1.02 }}
                    className={clsx(
                      "group relative bg-white aspect-video rounded-[2rem] p-6 flex flex-col items-center justify-center border transition-all duration-500",
                      isGold 
                        ? "border-amber-100 bg-gradient-to-br from-white to-amber-50/30 shadow-amber-200/20" 
                        : "border-slate-100 shadow-sm",
                      sponsor.url
                        ? "cursor-pointer hover:shadow-2xl hover:border-primary/20"
                        : "cursor-default",
                    )}
                  >
                    <div className="relative w-full h-full">
                      {sponsor.logoUrl ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={getFullImageUrl(sponsor.logoUrl) ?? undefined}
                          alt={sponsor.name}
                          className={clsx(
                            "w-full h-full object-contain transition-all duration-500",
                            isGold ? "opacity-100" : "opacity-70 group-hover:opacity-100"
                          )}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-slate-50 rounded-xl">
                          <Handshake className="w-8 h-8 text-slate-200" />
                        </div>
                      )}
                    </div>

                    {sponsor.url && (
                      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                        <div className={clsx(
                          "w-8 h-8 rounded-full text-white flex items-center justify-center shadow-lg",
                          isGold ? "bg-amber-500" : "bg-primary"
                        )}>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </div>
                      </div>
                    )}

                    <div className="absolute inset-x-0 bottom-4 text-center opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                        {sponsor.name}
                      </span>
                    </div>
                  </motion.a>
                ))}
              </div>
            </section>
          );
        })}

        {filteredSponsors.length === 0 && (
          <div className="py-32 text-center">
            <LayoutGrid className="w-16 h-16 text-slate-100 mx-auto mb-4" />
            <p className="text-slate-400 font-medium">
              No se encontraron auspiciadores con esos criterios.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
