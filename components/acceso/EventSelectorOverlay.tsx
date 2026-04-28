"use client";

import Image from "next/image";
import type { Vertical } from "@nrivera-iimp/ui-kit-iimp";
import { X } from "lucide-react";

export interface EventOption {
  slug: Vertical;
  label: string;
  logo: string;
  originalName: string;
}

interface EventSelectorOverlayProps {
  events: EventOption[];
  onSelect: (option: EventOption) => void;
  onClose?: () => void;
  showClose?: boolean;
}

export function EventSelectorOverlay({
  events,
  onSelect,
  onClose,
  showClose = false,
}: EventSelectorOverlayProps) {
  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-lg w-full animate-in fade-in zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto relative">
        {showClose && onClose && (
          <button
            onClick={onClose}
            className="absolute top-6 right-6 p-2 hover:bg-slate-100 rounded-xl text-slate-400 transition-colors border-none bg-transparent cursor-pointer"
          >
            <X size={24} />
          </button>
        )}
        
        <div className="flex items-center justify-center mb-2">
          <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mb-3">
            <Image src="/logos/favicon-iimp.png" alt="IIMP" width={28} height={28} className="object-contain" unoptimized />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-center text-slate-800 mb-1">
          Panel Administrativo
        </h2>
        <p className="text-slate-500 text-center text-sm mb-6">
          Selecciona el evento que deseas administrar
        </p>
        
        {events.length === 0 ? (
          <div className="py-10 text-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-400 text-sm">Cargando eventos...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {events.map((item, idx) => (
              <button
                type="button"
                key={`${item.originalName}-${idx}`}
                onClick={() => onSelect(item)}
                className="flex flex-row items-center gap-3 p-4 rounded-2xl border border-slate-100 bg-slate-50 hover:bg-primary/5 hover:border-primary/20 transition-all duration-200 group cursor-pointer"
              >
                <div className="w-14 h-14 rounded-xl bg-white flex items-center justify-center shadow-sm p-2 group-hover:scale-110 transition-transform shrink-0">
                  <Image
                    src={item.logo}
                    alt={item.label}
                    width={36}
                    height={36}
                    className="object-contain w-full h-full"
                    unoptimized
                  />
                </div>
                <span className="flex-1 text-left font-semibold text-sm text-slate-700 group-hover:text-primary uppercase leading-tight">
                  {item.label}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
