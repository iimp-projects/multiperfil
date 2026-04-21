"use client";

import React from "react";
import { useRef } from "react";
import Image from "next/image";

import { motion } from "framer-motion";
import { toPng } from "html-to-image";
import { useReactToPrint } from "react-to-print";
import Link from "next/link";
import {
  Download,
  Printer,
  Share2,
  Edit3,
  User,
  Mail,
  Phone,
  MapPin,
  BadgeCheck,
  CreditCard,
  ChevronRight,
  Receipt,
  Ticket,
  Settings,
  Clock,
  Lock,
  ExternalLink,
} from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import {
  useVertical,
  Input,
  FieldLabel,
  Textarea,
} from "@nrivera-iimp/ui-kit-iimp";
import {
  VOUCHER_STATUS_CONFIG,
  VoucherStatus,
  VOUCHER_STATUS,
} from "@/types/auth";
import clsx from "clsx";
import { getFullImageUrl } from "@/lib/s3-utils";

const Card = React.forwardRef<
  HTMLDivElement,
  { children: React.ReactNode; className?: string; id?: string }
>(({ children, className = "", id }, ref) => (
  <motion.div
    ref={ref}
    id={id}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className={`bg-white rounded-3xl shadow-sm !border !border-slate-100 p-6 ${className}`}
  >
    {children}
  </motion.div>
));
Card.displayName = "Card";

const SectionTitle = ({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) => (
  <div className="mb-0">
    <h3 className="text-lg font-bold text-slate-900 tracking-tight">{title}</h3>
    {subtitle && (
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mt-1">
        {subtitle}
      </p>
    )}
  </div>
);

export default function ProfileView() {
  const { user } = useAuthStore();
  const { vertical } = useVertical();

  // Helper to strip HTML and truncate for preview
  const getCleanBio = (html: string | undefined) => {
    if (!html) return "Sin biografía profesional.";
    // Strip HTML tags using regex for SSR compatibility
    const text = html.replace(/<[^>]*>?/gm, "").trim();
    // Truncate to a reasonable length for 2 lines (~140 chars)
    if (text.length <= 140) return text;
    return text.substring(0, 140) + "...";
  };

  const vouchers = Array.isArray(user?.comprobantes) ? user.comprobantes : [];

  // Logic: Find the correct QR for the current vertical (e.g. "PROEXPLO26")
  const suffix = new Date().getFullYear().toString().slice(-2);
  const currentVerticalKey = `${vertical.toUpperCase()}${suffix}`;

  const qrArray = Array.isArray(user?.qr) ? user.qr : [];
  const qrEntry =
    qrArray.find((q) => q.vertical.toUpperCase() === currentVerticalKey) ||
    qrArray.find((q) =>
      q.vertical.toUpperCase().startsWith(vertical.toUpperCase()),
    );

  const qrValue = qrEntry?.codigo;

  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Pase Evento - ${user?.nombres || "Usuario"}`,
    pageStyle: `
      @page {
        size: A4 portrait;
        margin: 20mm;
      }
      @media print {
        body {
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
          display: flex;
          justify-content: center;
          align-items: flex-start;
          padding-top: 2rem;
        }
      }
    `,
  });

  const handleDownload = async () => {
    const element = document.getElementById("qr-pass-card");
    if (!element) return;

    try {
      const dataUrl = await toPng(element, {
        backgroundColor: "#ffffff",
        pixelRatio: 2,
        skipFonts: true,
        filter: (node) => {
          return !(
            node instanceof HTMLElement &&
            node.classList?.contains("exclude-from-download")
          );
        },
      });
      const downloadLink = document.createElement("a");
      downloadLink.download = `pase-evento-${user?.nu_documento || "qr"}.png`;
      downloadLink.href = dataUrl;
      downloadLink.click();
    } catch (error) {
      console.error("Error generating image:", error);
    }
  };

  return (
    <div className="flex flex-col">
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        {/* Left Column: QR and Profile Card */}
        <div className="xl:col-span-4 space-y-8">
          {/* QR Pass Card */}
          <Card
            id="qr-pass-card"
            ref={printRef}
            className="relative overflow-hidden group print:w-95 print:h-fit print:mx-auto print:border-2 print:border-slate-200 print:shadow-none print:rounded-3xl print:p-8 print:my-8 bg-white"
          >
            <div className="absolute top-0 right-0 p-4 flex gap-2 print:hidden exclude-from-download">
              <button
                onClick={handleDownload}
                className="p-2 bg-slate-50 text-slate-400 hover:text-primary hover:bg-white hover:shadow-md transition-all rounded-xl cursor-pointer h-auto border border-slate-200"
              >
                <Download size={18} />
              </button>
              <button
                onClick={() => handlePrint()}
                className="!hidden p-2 bg-slate-50 text-slate-400 hover:text-primary hover:bg-white hover:shadow-md transition-all rounded-xl cursor-pointer h-auto border border-slate-200"
              >
                <Printer size={18} />
              </button>
            </div>

            <SectionTitle
              title="Pase de Evento Digital"
              subtitle="Código QR de Entrada"
            />
            <div className="flex flex-col items-center py-6">
              {qrValue ? (
                <div className="p-4 sm:p-6 bg-slate-50 rounded-[2rem] sm:rounded-[2.5rem] border-2 border-dashed border-slate-200 group-hover:border-primary/30 transition-colors duration-500 print:border-slate-300">
                  <div className="bg-white p-3 sm:p-4 rounded-2xl sm:rounded-3xl shadow-inner">
                    <Image
                      src={`https://secure2.iimp.org:8443/QRGeneratorApp/qrgenerator?text=${encodeURIComponent(qrValue || "")}`}
                      alt="QR Code"
                      width={180}
                      height={180}
                      className="w-32 h-32 sm:w-44 sm:h-44 object-contain"
                      unoptimized
                    />
                  </div>
                </div>
              ) : (
                <div className="w-full h-48 flex flex-col items-center justify-center p-6 bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
                    <Ticket size={24} className="text-slate-300" />
                  </div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest max-w-[150px]">
                    Pase no disponible para {vertical.toUpperCase()}
                  </p>
                </div>
              )}

              <div className="text-center mt-6 w-full">
                <p className="text-sm font-black text-slate-900">
                  {vertical.toUpperCase()}
                  {new Date().getFullYear().toString()}
                </p>
                <p className="text-xs mt-3! font-bold text-slate-400 uppercase tracking-widest border-2 border-dashed border-slate-400 border-l-0 border-r-0 py-4 break-words px-2">
                  {user?.nombres} {user?.apellidoPaterno}
                </p>
                {qrValue ? (
                  <div className="inline-flex items-center gap-2 mt-4 px-4 py-1.5 bg-green-50 text-green-600 rounded-full border border-green-100 italic">
                    <BadgeCheck size={14} />
                    <span className="text-[10px] font-black uppercase tracking-wider">
                      Acceso Autorizado
                    </span>
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-2 mt-4 px-4 py-1.5 bg-slate-50 text-slate-400 rounded-full border border-slate-200 italic">
                    <Clock size={14} />
                    <span className="text-[10px] font-black uppercase tracking-wider">
                      QR No Asignado
                    </span>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Profile Card */}
          <Card className="relative">
            <button className="!hidden absolute top-6 right-6 p-2 text-slate-400 hover:text-primary transition-colors h-auto bg-transparent border-none cursor-pointer">
              <Share2 size={20} />
            </button>

            <div className="flex flex-col items-center text-center">
              <div className="relative mb-6">
                <div className="w-28 h-28 rounded-full border-4 border-white shadow-xl ring-2 ring-primary/10 overflow-hidden bg-slate-100 relative flex items-center justify-center">
                  <Image
                    src={
                      getFullImageUrl(user?.picture) ||
                      `https://ui-avatars.com/api/?name=${user?.nombres}+${user?.apellidoPaterno}&background=random&size=200`
                    }
                    alt="Avatar"
                    fill
                    style={{ objectFit: "cover" }}
                    unoptimized
                  />
                </div>
                <Link
                  href="/dashboard/profile"
                  className="absolute bottom-0 right-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center border-4 border-white shadow-lg hover:scale-110 transition-transform"
                >
                  <Edit3 size={14} />
                </Link>
              </div>

              <h4 className="text-xl font-black text-slate-900">
                {user?.nombres} {user?.apellidoPaterno}
              </h4>
              <p className="text-sm font-bold text-primary mt-1">
                {user?.cargo || "Participante"}
              </p>

              <div className="w-full mt-8 space-y-4 text-left">
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100 transition-colors hover:border-primary/20">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400 shadow-sm border border-slate-100">
                    <Mail size={18} />
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                      Email
                    </p>
                    <p className="text-base font-normal text-slate-900 break-words">
                      {user?.email || "contacto@ejemplo.com"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100 transition-colors hover:border-primary/20">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400 shadow-sm border border-slate-100">
                    <Phone size={18} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                      Teléfono
                    </p>
                    <p className="text-base font-normal text-slate-900">
                      {user?.telefono || user?.celular || "+51 987 654 321"}
                    </p>
                  </div>
                </div>
              </div>

              <Link
                href={`/profile/${vertical}/user/${user?.nu_documento || "00000000"}`}
                className="w-full"
                target="_blank"
              >
                <button className="!hidden w-full h-12 bg-primary hover:bg-primary/95 text-white font-bold rounded-xl shadow-xl shadow-primary/20 transition-all transform hover:-translate-y-1 active:scale-[0.98] border-none flex items-center justify-center gap-2 uppercase tracking-widest text-sm mt-5 cursor-pointer">
                  Ver Perfil Público
                </button>
              </Link>
            </div>
          </Card>
        </div>
        {/* Right Column: Vouchers and Details */}
        <div className="xl:col-span-8 space-y-8">
          {/* Payments/Vouchers Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 font-primary">
            <Card>
              <div className="flex items-center justify-between mb-6">
                <SectionTitle
                  title="Comprobantes y Pagos"
                  subtitle="Actividad reciente"
                />
                <Link
                  href="/dashboard/vouchers"
                  className="text-primary hover:underline text-sm font-bold flex items-center gap-1"
                >
                  Ver todo <ChevronRight size={14} />
                </Link>
              </div>

              <div className="space-y-4 overflow-x-hidden overflow-y-auto max-h-60">
                {vouchers.slice(0, 3).map((item, i) => (
                  <div
                    key={`${item.serie || "S"}-${item.numero || "N"}-${i}`}
                    className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-white hover:border-primary/20 hover:shadow-md transition-all duration-300"
                  >
                    <div className="flex items-center gap-4 ">
                      <div className="min-w-10! h-10 bg-white rounded-xl flex items-center justify-center text-slate-400 shadow-sm border border-slate-100">
                        <CreditCard size={18} />
                      </div>
                      <div className="flex-1">
                        <p
                          className={clsx(
                            `text-sm font-normal text-slate-900 `,
                            !item.razonSocial && `line-through`,
                          )}
                        >
                          {item.razonSocial || "Evento gratuito"}
                        </p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ">
                          {item.fechaEmision || "Fecha no disp."}
                        </p>
                      </div>
                    </div>
                    <div className="text-right min-w-25!">
                      <p className="text-md font-black text-slate-900 font-mono">
                        {item.moneda || "$"} {item.monto || "0.00"}
                      </p>
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded-full border ${
                          VOUCHER_STATUS_CONFIG[
                            (
                              item.estado || VOUCHER_STATUS.PENDIENTE
                            ).toUpperCase() as VoucherStatus
                          ]?.color ||
                          VOUCHER_STATUS_CONFIG[VOUCHER_STATUS.PENDIENTE].color
                        }`}
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
                  </div>
                ))}
                {vouchers.length === 0 && (
                  <div className="p-8 text-center text-slate-400 italic text-sm">
                    No hay actividad reciente
                  </div>
                )}
              </div>
            </Card>

            <Card className="flex flex-col">
              <SectionTitle
                title="Acciones Rápidas"
                subtitle="Herramientas y Recursos"
              />
              <div className="grid grid-cols-2 gap-4 flex-1 mt-6">
                {[
                  {
                    label: "Comprobantes",
                    icon: <Receipt size={28} />,
                    href: "/dashboard/vouchers",
                    image:
                      vertical === "proexplo"
                        ? "/slider/proexplo/db5ed038-bdd2-4ce8-a11d-55057dd91500.jpeg"
                        : vertical === "wmc"
                          ? "/slider/wmc/WEB-WMC-12-2048x1364.jpg"
                          : "/slider/gess/GESS-2026.jpg",
                    glow: "shadow-emerald-500/20",
                    iconBg: "text-emerald-400",
                  },
                  {
                    label: "Mis Cupones",
                    icon: <Ticket size={28} />,
                    href: "/dashboard/coupons",
                    image:
                      vertical === "proexplo"
                        ? "/slider/proexplo/26b72b8d-a800-4399-adaa-68e91fb430ac.webp"
                        : vertical === "wmc"
                          ? "/slider/wmc/WEB-WMC-_11_-1-2048x1364.webp"
                          : "/slider/gess/prensa1.png",
                    glow: "shadow-amber-500/20",
                    iconBg: "text-amber-400",
                  },
                  {
                    label: "Mi Perfil",
                    icon: <User size={28} />,
                    href: "/dashboard/profile",
                    image:
                      vertical === "proexplo"
                        ? "/slider/proexplo/c5944c2a-4a1a-47a1-a01e-48ce76aa9618.webp"
                        : vertical === "wmc"
                          ? "/slider/wmc/WEB-WMC-_2_-2048x1364.webp"
                          : "/slider/gess/prensa3.png",
                    glow: "shadow-blue-500/20",
                    iconBg: "text-blue-400",
                  },
                  {
                    label: "Configuración",
                    icon: <Settings size={28} />,
                    href: "/dashboard/settings",
                    image:
                      vertical === "proexplo"
                        ? "/slider/proexplo/db5ed038-bdd2-4ce8-a11d-55057dd91500.jpeg"
                        : vertical === "wmc"
                          ? "/slider/wmc/WEB-WMC-12-2048x1364.jpg"
                          : "/slider/gess/GESS-2026.jpg",
                    glow: "shadow-slate-500/20",
                    iconBg: "text-slate-400",
                  },
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Link
                      href={item.href}
                      className={clsx(
                        "relative flex flex-col items-center justify-center h-36 rounded-4xl overflow-hidden group border border-white/10 shadow-lg transition-all duration-500",
                        item.glow,
                      )}
                    >
                      {/* Background Image */}
                      <div
                        className="absolute inset-0 z-0 bg-cover bg-center grayscale-[0.5] group-hover:grayscale-0 transition-all duration-700"
                        style={{ backgroundImage: `url(${item.image})` }}
                      />
                      {/* Glass Overlay */}
                      <div className="absolute inset-0 z-10 bg-black/40 backdrop-blur-[2px] group-hover:bg-black/20 group-hover:backdrop-blur-none transition-all duration-500" />

                      {/* Content */}
                      <div className="relative z-20 flex flex-col items-center">
                        <div
                          className={clsx(
                            "w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center mb-3 shadow-inner border border-white/20 transition-all duration-500 group-hover:scale-110 group-hover:bg-white group-hover:text-black",
                            item.iconBg,
                          )}
                        >
                          {item.icon}
                        </div>
                        <span className="text-[12px] font-black uppercase tracking-[0.15em] text-white drop-shadow-md">
                          {item.label}
                        </span>
                      </div>

                      {/* Bottom Indicator */}
                      <div className="absolute bottom-0 left-0 w-full h-1 bg-linear-to-r from-transparent via-white/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    </Link>
                  </motion.div>
                ))}
              </div>
            </Card>
          </div>

          {/* Account Details Form */}
          <Card>
            <div className="flex items-center justify-between mb-8">
              <SectionTitle
                title="Detalles de la Cuenta"
                subtitle="Actualice su información profesional"
              />
              <Link href="/dashboard/profile">
                <button className=" h-12 px-6 bg-primary hover:bg-primary/95 text-white font-bold rounded-xl shadow-xl shadow-primary/20 transition-all transform hover:-translate-y-1 active:scale-[0.98] border-none flex items-center justify-center gap-2 uppercase tracking-widest text-sm cursor-pointer">
                  <Edit3 className="size-5! " />
                  Editar perfil
                </button>
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <FieldLabel className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                    Nombre Completo
                  </FieldLabel>
                  <div className="relative">
                    <User
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                      size={18}
                    />
                    <Input
                      type="text"
                      readOnly
                      defaultValue={`${user?.nombres || ""} ${user?.apellidoPaterno || ""}`}
                      className="w-full pl-10 pr-4 h-12 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <FieldLabel className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                    Cargo Profesional
                  </FieldLabel>
                  <div className="relative">
                    <BadgeCheck
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                      size={18}
                    />
                    <Input
                      readOnly
                      type="text"
                      defaultValue={user?.cargo || "Participante"}
                      className="w-full pl-10 pr-4 h-12 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <FieldLabel className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                    Correo Electrónico
                  </FieldLabel>
                  <div className="relative">
                    <Mail
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                      size={18}
                    />
                    <Input
                      readOnly
                      type="email"
                      defaultValue={user?.email || "contacto@ejemplo.com"}
                      className="w-full pl-10 pr-4 h-12 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <FieldLabel className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                    Número de Teléfono
                  </FieldLabel>
                  <div className="relative">
                    <Phone
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                      size={18}
                    />
                    <Input
                      readOnly
                      type="tel"
                      defaultValue={
                        user?.telefono || user?.celular || "+51 987 654 321"
                      }
                      className="w-full pl-10 pr-4 h-12 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <FieldLabel className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                    Ubicación / Oficina
                  </FieldLabel>
                  <div className="relative">
                    <MapPin
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                      size={18}
                    />
                    <Input
                      readOnly
                      type="text"
                      defaultValue="Lima, Perú"
                      className="w-full pl-10 pr-4 h-12 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <FieldLabel className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                    Bio Profesional
                  </FieldLabel>
                  <Textarea
                    rows={2}
                    readOnly
                    value={getCleanBio(user?.bio)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 font-medium text-slate-600 focus:outline-none transition-all resize-none text-sm! cursor-default shadow-inner-sm"
                  />
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
      <hr className="my-10 border-gray-200" />

      {/* Security Emblems Section */}
      <div className="flex flex-col gap-4 w-full">
        <p className="w-full text-center text-sm opacity-40 font-bold mb-2">
          Platform Security
        </p>
        <div className="flex flex-row gap-4 mb-10 opacity-80  justify-center items-center w-full">
          <a
            href="https://aws.amazon.com/security/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-3 bg-gray-50 p-3 rounded-xl border border-gray-200 shadow-sm hover:bg-gray-100 transition-all duration-300 group cursor-pointer w-full"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/9/93/Amazon_Web_Services_Logo.svg"
              alt="AWS"
              className="h-4 opacity-80 group-hover:opacity-100 transition-opacity"
            />
            <div className="border-l border-gray-300 pl-3">
              <span className="block text-sm font-bold text-slate-800 leading-none group-hover:text-blue-600 transition-colors uppercase">
                AWS CLOUD
              </span>
              <span className="text-sm text-gray-500 uppercase tracking-tighter font-medium flex items-center mt-0.5">
                Secured Server{" "}
                <ExternalLink size={12} className="ml-1 opacity-70" />
              </span>
            </div>
          </a>

          <a
            href="https://www.cloudflare.com/learning/ssl/what-is-ssl/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-3 bg-gray-50 p-3 rounded-xl border border-gray-200 shadow-sm hover:bg-gray-100 transition-all duration-300 group cursor-pointer w-full"
          >
            <Lock
              size={18}
              className="text-green-600 ml-1 group-hover:scale-110 transition-transform duration-300"
            />
            <div className="border-l border-gray-300 pl-3">
              <span className="block text-sm font-bold text-green-700 leading-none uppercase">
                Data Encrypted
              </span>
              <span className="text-sm text-gray-500 uppercase tracking-tighter font-medium flex items-center mt-1">
                AES-256 SSL{" "}
                <ExternalLink size={12} className="ml-1 opacity-70" />
              </span>
            </div>
          </a>
        </div>
      </div>
    </div>
  );
}
