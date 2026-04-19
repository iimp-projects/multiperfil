"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Download,
  Search,
  ChevronLeft,
  ChevronRight,
  Receipt,
} from "lucide-react";

// Types moved to types/auth.ts (imported below)
import { useAuthStore } from "@/store/useAuthStore";
import {
  VOUCHER_STATUS_CONFIG,
  VoucherStatus,
  VOUCHER_STATUS,
} from "@/types/auth";
import clsx from "clsx";
import {
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@nrivera-iimp/ui-kit-iimp";
import { getFullImageUrl } from "@/lib/s3-utils";
import { toast } from "sonner";

const ITEMS_PER_PAGE = 15;

export default function VouchersView() {
  const { user } = useAuthStore();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("TODOS");

  const handleDownloadPdf = (impreso?: string) => {
    if (!impreso) {
      toast.error("El archivo PDF no está disponible para este comprobante.");
      return;
    }

    // El nodo 'impreso' trae el nombre base, concatenamos la carpeta 'vouchers/' y la extensión '.pdf'
    const pdfPath = `vouchers/${impreso}.pdf`;
    const fullUrl = getFullImageUrl(pdfPath);

    if (fullUrl) {
      toast.info("Iniciando descarga del comprobante...");
      window.open(fullUrl, "_blank");
    }
  };

  // Logic: User comprobantes from store
  const vouchers = user?.comprobantes || [];

  // Filtering
  const filteredVouchers = vouchers.filter((v) => {
    const label = `${v.serie || "S"}-${v.numero || "N"} ${v.razonSocial || "Recibo"}`;
    const matchesSearch = label
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesStatus =
      filterStatus === "TODOS" ||
      (v.estado || VOUCHER_STATUS.PENDIENTE).toUpperCase() ===
        filterStatus.toUpperCase() ||
      (filterStatus === VOUCHER_STATUS.CANCELADO &&
        (v.estado || "").toUpperCase() === "PAGADO");

    return matchesSearch && matchesStatus;
  });

  // Pagination
  const totalPages = Math.ceil(filteredVouchers.length / ITEMS_PER_PAGE);
  const paginatedVouchers = filteredVouchers.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  const getStatusColor = (status?: string) => {
    const s = (
      status || VOUCHER_STATUS.PENDIENTE
    ).toUpperCase() as VoucherStatus;
    return (
      VOUCHER_STATUS_CONFIG[s]?.color ||
      VOUCHER_STATUS_CONFIG[VOUCHER_STATUS.PENDIENTE].color
    );
  };

  // Dynamic check: Unique statuses present in the data
  const availableStatuses = Array.from(
    new Set(vouchers.map((v) => (v.estado || "PENDIENTE").toUpperCase())),
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-black text-slate-900 tracking-tight">
            Comprobantes y Pagos
          </h1>
          <p className="text-slate-500 mt-1">
            Gestione su historial de facturación y recibos de pago.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={18}
            />
            <Input
              type="text"
              placeholder="Buscar recibo..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-10 h-12 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary w-full md:w-64"
            />
          </div>
          <div className="relative">
            <Select
              value={filterStatus}
              onValueChange={(value) => {
                setFilterStatus(value);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-full h-12 md:w-48 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all">
                <SelectValue placeholder="Todos los estados" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TODOS">Todos los estados</SelectItem>
                {availableStatuses.map((status) => (
                  <SelectItem key={status} value={status}>
                    {VOUCHER_STATUS_CONFIG[status as VoucherStatus]?.label ||
                      status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {/* Icon removed since SelectTrigger handle it or it was manual */}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden overscroll-contain">
        {paginatedVouchers.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {paginatedVouchers.map((item, i) => (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                key={`${item.serie || "S"}-${item.numero || "N"}-${i}`}
                className="flex cursor-pointer flex-col sm:flex-row sm:items-center justify-between p-5 hover:opacity-85 transition-colors gap-4"
              >
                <div className="flex items-start sm:items-center gap-4">
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-slate-400 shadow-sm border border-slate-200 shrink-0">
                    <Receipt size={20} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      {!item.serie ? (
                        <span className="hidden! text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-slate-100 px-2 py-0.5 rounded-md">
                          ---
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-slate-100 px-2 py-0.5 rounded-md">
                          {item.serie}-{item.numero}
                        </span>
                      )}
                    </div>
                    <p
                      className={clsx(
                        `text-base font-normal text-slate-900 break-words line-clamp-2`,
                        !item.razonSocial && `line-through`,
                      )}
                    >
                      {item.razonSocial || "Evento gratuito"}
                    </p>
                    <p className="text-xs font-semibold text-slate-500 mt-0.5">
                      {item.fechaEmision}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-6 sm:w-auto w-full border-t sm:border-t-0 border-slate-100 pt-4 sm:pt-0">
                  <div className="text-left sm:text-right">
                    <p className="text-lg font-black text-slate-900 font-mono">
                      {item.moneda || "$"} {item.monto || "0.00"}
                    </p>
                    <span
                      className={`text-xs font-bold px-2.5 py-1 rounded-full border inline-block mt-1 ${getStatusColor(item.estado)}`}
                    >
                      {VOUCHER_STATUS_CONFIG[
                        (
                          item.estado || VOUCHER_STATUS.PENDIENTE
                        ).toUpperCase() as VoucherStatus
                      ]?.label ||
                        item.estado ||
                        "Pendiente"}
                    </span>
                  </div>

                  {(item.estado || "").toUpperCase() !== "GRATUITO" ? (
                    <button
                      onClick={() => handleDownloadPdf(item.impreso)}
                      title="Descargar PDF"
                      className="p-3 bg-white border border-slate-200 text-slate-500 hover:text-primary hover:border-primary/30 hover:shadow-md transition-all rounded-xl shrink-0 cursor-pointer h-auto"
                    >
                      <Download size={18} />
                    </button>
                  ) : (
                    <div
                      className="p-3 bg-slate-50 border border-dashed border-slate-200 text-slate-300 rounded-xl shrink-0 cursor-not-allowed"
                      title="No disponible para gratuitos"
                    >
                      <Download size={18} />
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center text-slate-500">
            <Receipt className="w-12 h-12 mx-auto text-slate-300 mb-4" />
            <p className="font-medium text-lg text-slate-900">
              No se encontraron comprobantes
            </p>
            <p className="text-sm mt-1">
              Modifique los filtros de búsqueda para ver más resultados.
            </p>
          </div>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="text-sm text-slate-500 font-medium">
              Mostrando{" "}
              <span className="text-slate-900 font-bold">
                {(currentPage - 1) * ITEMS_PER_PAGE + 1}
              </span>{" "}
              a{" "}
              <span className="text-slate-900 font-bold">
                {Math.min(
                  currentPage * ITEMS_PER_PAGE,
                  filteredVouchers.length,
                )}
              </span>{" "}
              de{" "}
              <span className="text-slate-900 font-bold">
                {filteredVouchers.length}
              </span>{" "}
              resultados
            </span>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 border border-slate-200 rounded-lg bg-white text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors h-auto cursor-pointer"
              >
                <ChevronLeft size={18} />
              </button>

              {Array.from({ length: totalPages }).map((_, idx) => {
                // Show standard pagination, avoiding too many buttons if there are pages
                const pageNum = idx + 1;
                if (
                  pageNum === 1 ||
                  pageNum === totalPages ||
                  (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                ) {
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-9 h-9 flex items-center justify-center rounded-lg border text-sm font-bold transition-all cursor-pointer ${
                        currentPage === pageNum
                          ? "bg-primary border-primary text-white shadow-md shadow-primary/20"
                          : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                }

                // Show ellipsis
                if (
                  (pageNum === 2 && currentPage > 3) ||
                  (pageNum === totalPages - 1 && currentPage < totalPages - 2)
                ) {
                  return (
                    <span key={pageNum} className="px-1 text-slate-400">
                      ...
                    </span>
                  );
                }

                return null;
              })}

              <button
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
                className="p-2 border border-slate-200 rounded-lg bg-white text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors h-auto cursor-pointer"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
