"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  MapPin,
  Plus,
  Minus,
  Maximize2,
  X,
  CheckCircle2,
  Clock,
  AlertCircle,
} from "lucide-react";
import { Stand, StandStatus, STAND_TYPE_CONFIG } from "@/types/map";
import { QRCodeSVG } from "qrcode.react";
import { Button, Input } from "@nrivera-iimp/ui-kit-iimp";

// Sample data for prototype - En una app real esto vendría de una API
const SAMPLE_STANDS: Stand[] = [
  {
    id: "01",
    label: "01",
    name: "Stand Principal",
    company: "Sodexo Perú",
    type: "MAQUINARIA",
    status: "rented",
    x: 16.5,
    y: 56.5,
    description:
      "Servicios de alimentación y gestión de facilidades para el sector minero.",
  },
  {
    id: "04",
    label: "04",
    name: "Stand Innovación",
    company: "Huawei Mining",
    type: "MAQUINARIA",
    status: "reserved",
    x: 22.5,
    y: 52.5,
    description:
      "Soluciones de conectividad 5G y automatización para tajos abiertos.",
  },
  {
    id: "06",
    label: "06",
    company: "Metso Perú",
    type: "MAQUINARIA",
    status: "available",
    x: 27.5,
    y: 49.5,
    description: "Equipamiento de trituración y procesamiento de minerales.",
  },
  {
    id: "10",
    label: "10",
    company: "Antamina",
    type: "ISLA",
    status: "rented",
    x: 32.5,
    y: 44.5,
  },
  {
    id: "15",
    label: "15",
    type: "ISLA",
    status: "available",
    x: 50.5,
    y: 61.5,
  },
  {
    id: "50",
    label: "50",
    company: "ABB Perú",
    type: "PREFERENCIAL",
    status: "rented",
    x: 60.5,
    y: 33.5,
  },
  {
    id: "71",
    label: "71",
    company: "Atlas Copco",
    type: "ESTANDAR",
    status: "rented",
    x: 52.5,
    y: 49.5,
  },
  {
    id: "88",
    label: "88",
    type: "ESTANDAR",
    status: "available",
    x: 55.5,
    y: 53.5,
  },
  {
    id: "95",
    label: "95",
    company: "Minera Volcan",
    type: "INSTITUCIONAL",
    status: "rented",
    x: 56.5,
    y: 22.5,
  },
];

export default function MapPage() {
  const { isAuthenticated, _hasHydrated } = useAuthStore();
  const router = useRouter();

  const [scale, setScale] = useState(1);
  const [selectedStand, setSelectedStand] = useState<Stand | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (_hasHydrated && !isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, _hasHydrated, router]);

  const filteredStands = SAMPLE_STANDS.filter((s) => {
    const matchesSearch =
      s.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.id.includes(searchTerm);
    return matchesSearch;
  });

  const handleZoom = (delta: number) => {
    setScale((prev) => Math.min(Math.max(prev + delta, 0.5), 3));
  };

  const getStatusIcon = (status: StandStatus) => {
    switch (status) {
      case "available":
        return <CheckCircle2 className="text-emerald-500" size={14} />;
      case "rented":
        return <AlertCircle className="text-red-500" size={14} />;
      case "reserved":
        return <Clock className="text-amber-500" size={14} />;
      default:
        return null;
    }
  };

  const getStatusLabel = (status: StandStatus) => {
    switch (status) {
      case "available":
        return "Disponible";
      case "rented":
        return "Ocupado";
      case "reserved":
        return "Reservado";
      default:
        return "Bloqueado";
    }
  };

  if (!_hasHydrated || !isAuthenticated) return null;

  return (
    <DashboardLayout>
      <div className="flex flex-col h-[calc(100vh-180px)] space-y-4 animate-in fade-in duration-700">
        {/* Header Actions */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <MapPin className="text-primary" />
              Mapa Interactivo de Stands
            </h1>
            <p className="text-slate-500 text-sm">
              Navegue por el plano y seleccione los stands para ver detalles.
            </p>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                size={16}
              />
              <Input
                type="text"
                placeholder="Buscar stand o empresa..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 h-12 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium!"
              />
            </div>

            <div className="flex items-center bg-slate-100 p-1 rounded-xl">
              <Button
                variant="ghost"
                onClick={() => handleZoom(-0.2)}
                className="p-2 hover:bg-white rounded-lg transition-all text-slate-600 shadow-sm h-auto"
              >
                <Minus size={18} />
              </Button>
              <div className="px-3 text-xs font-bold text-slate-500 w-12 text-center">
                {Math.round(scale * 100)}%
              </div>
              <Button
                variant="ghost"
                onClick={() => handleZoom(0.2)}
                className="p-2 hover:bg-white rounded-lg transition-all text-slate-600 shadow-sm h-auto"
              >
                <Plus size={18} />
              </Button>
            </div>
          </div>
        </div>

        {/* Map Container */}
        <div className="relative flex-1 bg-slate-50 rounded-4xl border border-slate-200 overflow-hidden cursor-grab active:cursor-grabbing group">
          {/* Zoom Controls Overlay */}
          <div className="absolute bottom-6 right-6 z-40 bg-white/80 backdrop-blur-md p-2 rounded-2xl border border-white/50 shadow-xl space-y-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="outline"
              onClick={() => handleZoom(0.5)}
              className="w-10 h-10 flex items-center justify-center bg-white rounded-xl text-slate-600 hover:text-primary hover:shadow-md transition-all border-none"
            >
              <Plus size={20} />
            </Button>
            <Button
              variant="outline"
              onClick={() => handleZoom(-0.5)}
              className="w-10 h-10 flex items-center justify-center bg-white rounded-xl text-slate-600 hover:text-primary hover:shadow-md transition-all border-none"
            >
              <Minus size={20} />
            </Button>
            <Button
              variant="outline"
              onClick={() => setScale(1)}
              className="w-10 h-10 flex items-center justify-center bg-white rounded-xl text-slate-600 hover:text-primary hover:shadow-md transition-all border-none"
            >
              <Maximize2 size={20} />
            </Button>
          </div>

          <motion.div
            ref={containerRef}
            drag
            dragMomentum={false}
            style={{ scale }}
            className="w-full h-full relative flex items-center justify-center origin-center"
          >
            <div className="relative w-300 h-200 shrink-0">
              <Image
                src={`/plano_proexplo2026.png`}
                alt="Mapa del Evento"
                fill
                className="object-contain select-none pointer-events-none"
                priority
              />

              {/* Markers Overlay */}
              {filteredStands.map((stand) => (
                <StandMarker
                  key={stand.id}
                  stand={stand}
                  onSelect={setSelectedStand}
                  isActive={selectedStand?.id === stand.id}
                />
              ))}
            </div>
          </motion.div>

          {/* Legend Overlay */}
          <div className="absolute top-6 left-6 z-40 bg-white/80 backdrop-blur-md p-4 rounded-2xl border border-white/50 shadow-lg space-y-3 hidden sm:block">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-200/50 pb-2">
              Distribución de Stands
            </h4>
            <div className="grid grid-cols-2 gap-x-6 gap-y-2">
              {Object.entries(STAND_TYPE_CONFIG).map(([key, config]) => (
                <div key={key} className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: config.color }}
                  />
                  <span className="text-[10px] font-bold text-slate-600 truncate">
                    {config.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Selected Stand Detail Drawer */}
        <AnimatePresence>
          {selectedStand && (
            <motion.div
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 100 }}
              className="absolute top-0 right-0 h-full w-full sm:w-80 bg-white/95 backdrop-blur-xl border-l border-slate-200 shadow-2xl z-50 p-8 flex flex-col"
            >
              <Button
                variant="ghost"
                onClick={() => setSelectedStand(null)}
                className="absolute top-6 right-6 p-2 hover:bg-slate-100 rounded-full transition-colors border-none cursor-pointer h-auto"
              >
                <X size={20} className="text-slate-400" />
              </Button>

              <div className="space-y-6 mt-8 flex-1 overflow-y-auto">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="px-2 py-0.5 rounded-md text-[10px] font-black text-white uppercase tracking-widest"
                      style={{
                        backgroundColor:
                          STAND_TYPE_CONFIG[selectedStand.type].color,
                      }}
                    >
                      Stand {selectedStand.id}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 ${
                        selectedStand.status === "available"
                          ? "bg-emerald-50 text-emerald-600"
                          : selectedStand.status === "rented"
                            ? "bg-red-50 text-red-600"
                            : "bg-amber-50 text-amber-600"
                      }`}
                    >
                      {getStatusIcon(selectedStand.status)}
                      {getStatusLabel(selectedStand.status).toUpperCase()}
                    </span>
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 leading-tight">
                    {selectedStand.company || "Espacio Disponible"}
                  </h3>
                  <p className="text-sm font-bold text-primary uppercase tracking-wider">
                    {STAND_TYPE_CONFIG[selectedStand.type].label}
                  </p>
                </div>

                <div className="space-y-4 bg-slate-50 p-6 rounded-3xl border border-slate-100">
                  <p className="text-sm text-slate-600 leading-relaxed font-medium">
                    {selectedStand.description ||
                      "Este stand está disponible para exhibición corporativa. Ideal para presentar nuevas tecnologías y establecer contactos comerciales."}
                  </p>
                </div>

                <div className="space-y-3 pt-4 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Dimensiones
                    </span>
                    <span className="text-xs font-bold text-slate-700">
                      {selectedStand.size || "3.00m x 2.00m"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Pabellón
                    </span>
                    <span className="text-xs font-bold text-slate-700">
                      A - Sector Norte
                    </span>
                  </div>
                </div>

                {/* QR Code for Stand info if rented */}
                {selectedStand.status === "rented" && (
                  <div className="flex flex-col items-center gap-3 p-6 bg-white rounded-3xl border border-slate-100 shadow-sm mt-4">
                    <QRCodeSVG
                      value={`https://iimp.org.pe/stand/${selectedStand.id}`}
                      size={120}
                    />
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                      Escanear para perfil
                    </span>
                  </div>
                )}
              </div>

              <div className="pt-6 border-t border-slate-100">
                <Button
                  variant={selectedStand.status === "available" ? "default" : "ghost"}
                  className={`w-full h-12 rounded-xl flex items-center justify-center gap-2 font-black uppercase tracking-widest text-[10px] transition-all border-none ${
                    selectedStand.status === "available"
                      ? "bg-primary text-white shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 cursor-pointer"
                      : "bg-slate-100 text-slate-400 cursor-not-allowed"
                  }`}
                >
                  {selectedStand.status === "available"
                    ? "Contactar para Alquiler"
                    : "Espacio No Disponible"}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
}

function StandMarker({
  stand,
  onSelect,
  isActive,
}: {
  stand: Stand;
  onSelect: (s: Stand) => void;
  isActive: boolean;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const config = STAND_TYPE_CONFIG[stand.type];

  return (
    <div
      className="absolute z-20"
      style={{
        left: `${stand.x}%`,
        top: `${stand.y}%`,
        transform: "translate(-50%, -50%)",
      }}
    >
      <motion.button
        onClick={() => onSelect(stand)}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        whileHover={{ scale: 1.3, zIndex: 30 }}
        initial={{ scale: 0 }}
        animate={{ scale: isActive ? 1.4 : 1 }}
        className="relative flex items-center justify-center cursor-pointer border-none bg-transparent"
      >
        {/* Pulsing Aura for available stands */}
        {stand.status === "available" && (
          <motion.div
            animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0.1, 0.3] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute inset-0 rounded-full bg-emerald-400"
          />
        )}

        {/* Main Marker Circle */}
        <div
          className={`relative w-4 h-4 rounded-full border-2 border-white shadow-xl flex items-center justify-center transition-all duration-300 ${isActive ? "ring-4 ring-primary/30" : ""}`}
          style={{ backgroundColor: config.color }}
        >
          {/* Active indicator dot */}
          {isActive && (
            <div className="w-1 h-1 bg-white rounded-full animate-ping" />
          )}
        </div>

        {/* ID Label on top (Small) */}
        <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-white px-1 py-0.5 rounded-md text-[8px] font-black text-slate-800 shadow-sm border border-slate-200 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
          {stand.id}
        </div>
      </motion.button>

      {/* Modern Tooltip with Glassmorphism */}
      <AnimatePresence>
        {isHovered && !isActive && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 w-44 z-60 pointer-events-none"
          >
            <div className="bg-slate-900/90 backdrop-blur-md rounded-2xl p-4 shadow-2xl border border-white/10 text-left">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[8px] font-black text-white/50 uppercase tracking-widest">
                  {stand.id}
                </span>
                <span
                  className={`text-[8px] font-black px-1.5 py-0.5 rounded-md ${
                    stand.status === "available"
                      ? "bg-emerald-500/20 text-emerald-400"
                      : stand.status === "rented"
                        ? "bg-red-500/20 text-red-400"
                        : "bg-amber-500/20 text-amber-400"
                  }`}
                >
                  {(stand.status === "available"
                    ? "Disponible"
                    : stand.status === "rented"
                      ? "Ocupado"
                      : "Reservado"
                  ).toUpperCase()}
                </span>
              </div>
              <p className="text-xs font-black text-white leading-tight">
                {stand.company || "Disponible"}
              </p>
              <p className="text-[10px] font-bold text-white/40 mt-1 uppercase tracking-wider">
                {config.label}
              </p>

              {/* Tooltip Arrow */}
              <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-900/90" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
