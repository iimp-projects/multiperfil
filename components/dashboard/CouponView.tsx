"use client";

import React, { useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Ticket,
  CheckCircle2,
  Clock,
  Info,
  Copy,
  Sparkles,
  Download,
  Printer,
  FileText,
  ExternalLink,
} from "lucide-react";
import { toPng } from "html-to-image";
import { useAuthStore } from "@/store/useAuthStore";
import { useVertical, Button } from "@nrivera-iimp/ui-kit-iimp";

// ─── Types ───────────────────────────────────────────────────────────────────



import { Cupon, User } from "@/types/auth";

interface CouponCardProps {
  cupon: Cupon;
  vertical: string;
  user: User;
}

function CouponCard({ cupon, user }: Omit<CouponCardProps, "vertical">) {
  const [copied, setCopied] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const captureCard = async (): Promise<string | null> => {
    if (!cardRef.current) return null;
    try {
      return await toPng(cardRef.current, {
        backgroundColor: "#ffffff",
        pixelRatio: 3,
        filter: (node) => !node.classList?.contains("exclude-from-download"),
      });
    } catch (err) {
      console.error("Error capturando cupón:", err);
      return null;
    }
  };

  const handlePrint = async () => {
    const dataUrl = await captureCard();
    if (!dataUrl) return;

    const iframe = document.createElement("iframe");
    iframe.style.cssText =
      "position:fixed;top:0;left:0;width:0;height:0;border:none;visibility:hidden;";
    document.body.appendChild(iframe);

    const doc = iframe.contentDocument ?? iframe.contentWindow?.document;
    if (!doc) {
      document.body.removeChild(iframe);
      return;
    }

    doc.open();
    doc.write(`<!DOCTYPE html>
<html>
  <head>
    <title>Cupón IIMP - ${user?.nombres ?? ""}</title>
    <style>
      @page { size: A5 portrait; margin: 0; }
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body {
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 100vh;
        background: #fff;
        print-color-adjust: exact;
        -webkit-print-color-adjust: exact;
      }
      img { width: 100%; max-width: 480px; height: auto; display: block; }
      @media print { body { min-height: unset; } }
    </style>
  </head>
  <body>
    <img src="${dataUrl}" />
  </body>
</html>`);
    doc.close();

    iframe.onload = () => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      iframe.contentWindow?.addEventListener("afterprint", () => {
        document.body.removeChild(iframe);
      });
      setTimeout(() => {
        if (document.body.contains(iframe)) document.body.removeChild(iframe);
      }, 60_000);
    };
  };

  const handleDownload = async () => {
    const dataUrl = await captureCard();
    if (!dataUrl) return;
    const link = document.createElement("a");
    link.download = `cupon-${cupon.codigo}.png`;
    link.href = dataUrl;
    link.click();
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(cupon.codigo).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const isActive = cupon.status === "A";

  return (
    <div className="space-y-4">
      <div
        ref={cardRef}
        className="relative bg-white rounded-4xl shadow-xl shadow-slate-200/80 !border !border-slate-100 overflow-hidden"
      >
        <div
          className="absolute top-3 right-3 z-20 flex gap-1.5 exclude-from-download print:hidden"
          data-html2canvas-ignore="true"
        >
          <Button
            variant="ghost"
            onClick={handleDownload}
            title="Descargar como imagen"
            className="p-2 rounded-xl bg-white/20 backdrop-blur-sm text-white hover:bg-white hover:text-primary transition-all shadow-sm cursor-pointer h-auto"
          >
            <Download size={16} />
          </Button>
          <Button
            variant="ghost"
            onClick={handlePrint}
            title="Imprimir"
            className="p-2 rounded-xl bg-white/20 backdrop-blur-sm text-white hover:bg-white hover:text-primary transition-all shadow-sm cursor-pointer h-auto"
          >
            <Printer size={16} />
          </Button>
        </div>

        <div
          className="coupon-gradient-header relative p-7 bg-linear-to-br from-primary via-primary to-primary/80 overflow-hidden"
          style={{
            background: `linear-gradient(135deg, var(--primary, #f97316), color-mix(in srgb, var(--primary, #f97316), transparent 15%))`,
          }}
        >
          <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/10 rounded-full" />
          <div className="absolute -bottom-6 left-4 w-20 h-20 bg-white/10 rounded-full" />

          <div className="relative">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles size={14} className="text-white/70" />
              <span className="text-white/70 text-xs font-bold uppercase tracking-widest">
                Cupón de beneficio
              </span>
            </div>
            <h2 className="text-white text-2xl font-black leading-tight mt-1">
              {cupon.vertical.toUpperCase()}
            </h2>
            <p className="text-white/70 text-xs mt-2 font-medium max-w-50 leading-relaxed">
              Presenta este código en el establecimiento afiliado para acceder
              al beneficio.
            </p>
          </div>
        </div>

        <div className="px-8 py-0 relative">
          <DashedDivider />
        </div>

        <div className="p-7 pt-6">
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-3">
            Tu código de canje
          </p>

          <div className="relative bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-5 group hover:border-primary/40 transition-all">
            <div className="flex items-center justify-between gap-3">
              <span className="font-mono text-2xl font-black text-slate-900 tracking-widest break-all">
                {cupon.codigo}
              </span>
              <Button
                variant="outline"
                onClick={handleCopy}
                title="Copiar código"
                className="exclude-from-download print:hidden shrink-0 p-2.5 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-primary hover:border-primary/40 hover:bg-primary/5 transition-all shadow-sm cursor-pointer h-auto"
              >
                {copied ? (
                  <CheckCircle2 size={18} className="text-emerald-500" />
                ) : (
                  <Copy size={18} />
                )}
              </Button>
            </div>
            {copied && (
              <motion.p
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xs text-emerald-600 font-semibold mt-2"
              >
                ¡Código copiado al portapapeles!
              </motion.p>
            )}
          </div>

          <div className="flex justify-center gap-0.75 mt-5 opacity-20">
            {Array.from({ length: 36 }).map((_, i) => (
              <div
                key={i}
                className="bg-slate-900 rounded-sm"
                style={{
                  width: i % 5 === 0 ? 3 : i % 3 === 0 ? 2 : 1,
                  height: i % 4 === 0 ? 28 : 22,
                }}
              />
            ))}
          </div>

          <div className="flex items-center justify-between mt-5 pt-5 border-t border-slate-100">
            <div className="w-px h-10 bg-slate-100" />
            <div className="text-center mx-auto">
              <p
                className={`text-2xl font-black ${isActive ? "text-emerald-500" : "text-red-500"}`}
              >
                {isActive ? "ACTIVO" : "INACTIVO"}
              </p>
              <p className="text-xs text-slate-400 font-medium">Estado</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}



// ─── Sub-components ───────────────────────────────────────────────────────────

function DashedDivider() {
  return (
    <div className="relative flex items-center my-0">
      <div className="absolute -left-8 w-7 h-7 rounded-full bg-slate-50 border border-slate-200 z-10" />
      <div className="flex-1 border-t-2 border-dashed border-slate-200" />
      <div className="absolute -right-8 w-7 h-7 rounded-full bg-slate-50 border border-slate-200 z-10" />
    </div>
  );
}



// ─── Main Component ───────────────────────────────────────────────────────────

export default function CouponView() {
  const { user } = useAuthStore();
  const { vertical } = useVertical();

  const yearSuffix = useMemo(() => new Date().getFullYear().toString().slice(-2), []);

  const currentLang = useMemo(() => {
    if (typeof document === "undefined") return "es";
    const match = document.cookie.match(/googtrans=\/es\/(\w+)/);
    return match ? match[1].toLowerCase() : "es";
  }, []);

  return (
    <div className="space-y-10">
      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4"
      >
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            Mis Cupones
          </h1>
          <p className="text-slate-500 mt-1">
            Usa tu código en cualquier establecimiento afiliado al evento.
          </p>
        </div>
      </motion.div>

      {/* ── T&C Alert ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-primary/5 border border-primary/20 rounded-3xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-primary shadow-sm border border-primary/10">
            <Info size={24} />
          </div>
          <div>
            <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider">
              Términos y Condiciones
            </h4>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              El uso de cupones aplica ciertos TyC. Descarga el documento para más información.
            </p>
          </div>
        </div>
        <a
          href={`/pdf/${vertical.toLowerCase()}-${currentLang}.pdf`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-6 py-3 bg-white border border-primary/20 text-primary hover:bg-primary hover:text-white transition-all rounded-2xl text-xs font-black uppercase tracking-widest shadow-sm group h-auto no-underline"
        >
          <FileText size={16} className="group-hover:scale-110 transition-transform" />
          Descargar TyC
        </a>
      </motion.div>

      {/* ── Content List ── */}
      <div className="space-y-12">
        {Array.isArray(user?.cupon) &&
        user.cupon.filter(
          (c) =>
            c.vertical.toUpperCase() === `${vertical.toUpperCase()}${yearSuffix}` ||
            c.vertical.toUpperCase().startsWith(vertical.toUpperCase()),
        ).length > 0 ? (
          user.cupon
            .filter(
              (c) =>
                c.vertical.toUpperCase() === `${vertical.toUpperCase()}${yearSuffix}` ||
                c.vertical.toUpperCase().startsWith(vertical.toUpperCase()),
            )
            .map((c, idx) => (
              <motion.div
                key={c.codigo}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch"
              >
                {/* ── LEFT: Coupon Card ── */}
                <div className="flex flex-col h-full">
                  <CouponCard cupon={c} user={user} />
                  
                  {/* Quick Tips under each coupon */}
                  <div className="flex items-start gap-3 mt-4 bg-amber-50 border border-amber-100 rounded-2xl px-4 py-3">
                    <Info size={16} className="text-amber-500 shrink-0 mt-0.5" />
                    <p className="text-[10px] text-amber-700 font-medium leading-relaxed">
                      El establecimiento validará y registrará el uso. El canje es único por tipo de establecimiento.
                    </p>
                  </div>
                </div>

                {/* ── RIGHT: Redemption History ── */}
                <div className="flex flex-col h-full bg-white rounded-4xl border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden">
                  <div className="bg-slate-50/80 px-7 py-5 border-b border-slate-100 flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-black text-slate-900 tracking-tight">
                        Seguimiento de Canje
                      </h3>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                        REGISTROS DE ACTIVIDAD
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${c.status === "A" ? "bg-emerald-500 animate-pulse" : "bg-red-500"}`} />
                      <span className={`text-[10px] font-black tracking-widest ${c.status === "A" ? "text-emerald-600" : "text-red-600"}`}>
                        {c.status === "A" ? "ACTIVO" : "INACTIVO"}
                      </span>
                    </div>
                  </div>

                  <div className="flex-1 relative overflow-hidden">
                    {c.obs && c.obs.length > 0 ? (
                      <div className="absolute inset-0 overflow-y-auto overscroll-contain custom-scrollbar p-6">
                        <div className="space-y-3 relative">
                          {/* Timeline Line */}
                          <div className="absolute left-2.5 top-2 bottom-2 w-0.5 bg-slate-100" />
                          
                          {c.obs.map((observation, oIdx) => (
                            <motion.div
                              key={oIdx}
                              initial={{ opacity: 0, x: 10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.2 + oIdx * 0.05 }}
                              className="relative pl-8 group"
                            >
                              {/* Dot */}
                              <div className="absolute left-0 top-3 w-5 h-5 rounded-full bg-white border-2 border-slate-200 flex items-center justify-center group-hover:border-primary group-hover:scale-110 transition-all z-10">
                                <div className="w-1.5 h-1.5 rounded-full bg-slate-300 group-hover:bg-primary transition-colors" />
                              </div>
                              
                              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 group-hover:border-primary/20 group-hover:bg-white group-hover:shadow-md group-hover:shadow-slate-200/50 transition-all">
                                <p className="text-sm text-slate-600 font-semibold leading-relaxed break-words">
                                  {observation}
                                </p>
                                <div className="flex items-center gap-1.5 mt-2 opacity-40">
                                  <Clock size={10} />
                                  <span className="text-[10px] font-bold">REGISTRO COMPLETADO</span>
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8">
                        <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mb-4">
                          <Clock size={32} className="text-slate-200" />
                        </div>
                        <p className="text-slate-400 font-bold text-sm">
                          Sin registros de canje aún
                        </p>
                        <p className="text-slate-300 text-[10px] mt-1 font-medium max-w-[180px]">
                          Tu actividad aparecerá aquí una vez que uses el cupón en un establecimiento.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-4xl border border-slate-100 shadow-sm">
            <div className="w-16 h-16 rounded-3xl bg-slate-50 flex items-center justify-center mb-4">
              <Ticket size={32} className="text-slate-300" />
            </div>
            <p className="text-slate-500 font-bold max-w-xs mx-auto">
              No tienes cupones disponibles para {vertical.toUpperCase()}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
