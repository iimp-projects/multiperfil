"use client";

import { useState, useEffect, useMemo } from "react";
import { Input, useVertical, Field, FieldLabel } from "@nrivera-iimp/ui-kit-iimp";

import Link from "next/link";
import Image from "next/image";
import {
  HiArrowSmLeft,
  HiOutlineMail,
} from "react-icons/hi";

import { PulseWaves } from "@/components/ui/PulseWaves";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import { authService } from "@/services/auth.service";
import { emailService } from "@/services/email.service";
import { emailTemplates } from "@/services/emailTemplates";
import { toast } from "sonner";

const ALL_SLIDES = {
  gess: [
    {
      image: "/slider/gess/GESS-2026.jpg",
      title: "Seguridad Global",
      description: "Tus credenciales están seguras en el ecosistema Gess.",
    },
    {
      image: "/slider/gess/prensa1.png",
      title: "Recuperación Institucional",
      description: "Restaurando el acceso a herramientas de alta gestión.",
    },
    {
      image: "/slider/gess/prensa3.png",
      title: "Identidad Verificada",
      description: "Múltiples capas de protección para nuestros asociados.",
    },
  ],
  proexplo: [
    {
      image: "/slider/proexplo/26b72b8d-a800-4399-adaa-68e91fb430ac.webp",
      title: "Restauración de Acceso",
      description:
        "Recuperando el control de tus datos de exploración de forma segura.",
    },
    {
      image: "/slider/proexplo/c5944c2a-4a1a-47a1-a01e-48ce76aa9618.webp",
      title: "Protocolo Seguro",
      description:
        "Verificación avanzada para herramientas de descubrimiento mineral.",
    },
    {
      image: "/slider/proexplo/db5ed038-bdd2-4ce8-a11d-55057dd91500.jpeg",
      title: "Recuperación de Horizontes",
      description: "Vuelve a liderar la búsqueda minera global.",
    },
  ],
  wmc: [
    {
      image: "/slider/wmc/WEB-WMC-12-2048x1364.jpg",
      title: "Acceso Líder",
      description: "Restaurando tu camino al Congreso Mundial de Minería.",
    },
    {
      image: "/slider/wmc/WEB-WMC-_11_-1-2048x1364.webp",
      title: "Verificación Global",
      description:
        "Chequeos de identidad seguros para expertos mineros de clase mundial.",
    },
    {
      image: "/slider/wmc/WEB-WMC-_2_-2048x1364.webp",
      title: "Conectividad Restaurada",
      description: "Reconéctate con el centro más influyente de la industria.",
    },
  ],
};

export default function RecoveryForm() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const { vertical } = useVertical();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [prevVertical, setPrevVertical] = useState(vertical);

  if (vertical !== prevVertical) {
    setPrevVertical(vertical);
    setCurrentSlide(0);
  }

  const activeSlides = useMemo(() => {
    return ALL_SLIDES[vertical as keyof typeof ALL_SLIDES] || ALL_SLIDES.wmc;
  }, [vertical]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % activeSlides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [activeSlides.length]);

  const getLogo = () => {
    switch (vertical) {
      case "gess":
        return "/logos/logo-gess.png";
      case "wmc":
        return "/logos/logo-wmc.png";
      case "proexplo":
        return "/logos/logo-iimp.png";
      default:
        return "/logos/logo-iimp.png";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    try {
      const response = await authService.recoveryPassword(email, vertical);

      if (response.success) {
        toast.success("¡Éxito! Tu contraseña ha sido recuperada y enviada a tu correo.");
        
        // Use centralized "bonito formato de correo"
        const emailContent = emailTemplates.passwordRecovery({
          vertical,
          currentYear: new Date().getFullYear(),
          password: response.message
        });

        await emailService.sendEmail({
          to: email,
          title: "Recuperación de Contraseña",
          vertical: vertical,
          content: emailContent
        });

      } else {
        toast.error("No hay coincidencias para este usuario");
      }
    } catch (error) {
      console.error("Recovery action error:", error);
      toast.error("Hubo un error al procesar tu solicitud. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="relative flex flex-col lg:flex-row w-full max-w-6xl min-h-[700px] bg-white rounded-[3rem] overflow-hidden shadow-[0_40px_100px_-20px_rgba(0,0,0,0.15)] animate-in fade-in zoom-in-95 duration-700 "
      style={{
        borderTopColor:
          vertical === "gess"
            ? "#1c8740"
            : vertical === "proexplo"
              ? "#f26522"
              : "#002b57",
      }}
    >
      {/* Brand Panel (Slider) */}
      <div className="relative w-full lg:w-[45%] h-40 md:h-64 lg:h-auto overflow-hidden p-8 lg:p-12 flex flex-col justify-end transition-all duration-700">
        {activeSlides.map((slide, index) => (
          <div
            key={`${vertical}-${index}`}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              index === currentSlide ? "opacity-100 z-10" : "opacity-0 z-0"
            }`}
          >
            <Image
              src={slide.image}
              alt={slide.title}
              fill
              className="object-cover transition-transform duration-[5s]"
              style={{
                transform: index === currentSlide ? "scale(1)" : "scale(1.1)",
              }}
            />
            <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent z-10" />

            <div className="absolute inset-0 p-8 lg:p-12 flex flex-col justify-end z-20 text-white leading-none pb-44 hidden lg:flex">
              <div className="space-y-4 relative -top-[60px]">
                <div className="inline-block px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-[10px] font-bold tracking-[0.2em] uppercase">
                  Seguridad Institucional
                </div>
                <div className="space-y-2">
                  <h1 className="text-4xl font-black tracking-tighter">
                    {slide.title}
                  </h1>
                  <p className="text-white/80 text-base max-w-xs font-medium leading-relaxed">
                    {slide.description}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}


      </div>

      <div className="relative w-full lg:w-[55%] flex flex-col p-8 lg:p-16 bg-white z-30 lg:z-10 rounded-t-[3rem] lg:rounded-none -mt-12 lg:mt-0">
        <div className="absolute top-8 right-10 hidden  sm:flex flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-1 px-3 py-1 rounded-sm bg-slate-50 border border-slate-100 overflow-visible">
            <PulseWaves color="bg-green-500" />
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest ml-0">
              SISTEMA-IIMP-{process.env.NEXT_PUBLIC_APP_VERSION || "V4"}
            </span>
          </div>
          <div className="flex items-center justify-end  ">
            <LanguageSwitcher />
          </div>
        </div>

        <div className="max-w-md w-full mx-auto flex-1 flex flex-col justify-center space-y-10">
          {/* Centered Logo */}
          <div className="relative w-40 h-16 mx-auto mb-2">
            <Image
              src={getLogo()}
              alt="Logo"
              fill
              className="object-contain"
              priority
            />
          </div>

          <header className="space-y-6 text-center">
            <div className="space-y-2">
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">
                Recuperar Acceso
              </h2>
              <p className="text-slate-400 font-medium text-sm px-6">
                Ingresa tus datos registrados. Te enviaremos un enlace de
                restauración a tu cuenta oficial verificada.
              </p>
            </div>
          </header>

          <form onSubmit={handleSubmit} className="space-y-8">
            <Field className="space-y-2 group">
              <div className="flex items-center gap-2 px-1">
                <div className="w-1.5 h-1.5 rounded-full bg-[#c9c9c9]" />
                <FieldLabel className="text-slate-500 text-xs font-black tracking-widest uppercase opacity-80">
                  CORREO ELECTRÓNICO
                </FieldLabel>
              </div>
              <div className="relative group/input">
                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors z-20 pointer-events-none">
                  <HiOutlineMail className="text-xl" />
                </div>
                <Input
                  type="email"
                  placeholder="ej. usuario@hotmail.com"
                  className="text-base! w-full bg-white border border-slate-200 hover:border-slate-300 text-slate-900 h-14 rounded-xl pl-12 pr-4 focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all placeholder:text-slate-300 font-normal shadow-sm z-10"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </Field>

            <div className="space-y-5">
              <button
                type="submit"
                className="w-full h-14 bg-primary hover:bg-primary/95 text-white font-black rounded-xl text-sm shadow-xl shadow-primary/20 transition-all transform hover:-translate-y-1 active:scale-[0.98] border-none flex items-center justify-center gap-2 uppercase tracking-widest cursor-pointer"
                disabled={loading}
              >
                {loading ? "Procesando..." : "ENVIAR ENLACE DE RECUPERACIÓN"}
                {!loading && <HiArrowSmLeft className="text-xl rotate-180" />}
              </button>

              <div className="flex justify-center pt-4">
                <Link
                  href="/"
                  className="group/link relative flex items-center gap-4 py-2.5 px-6 rounded-full bg-slate-50/50 backdrop-blur-sm border border-slate-100 hover:border-primary/30 hover:bg-white hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] transition-all duration-700 ease-out"
                >
                  <div className="relative flex items-center justify-center w-5 h-5 transition-transform duration-700 group-hover/link:-translate-x-1">
                    <HiArrowSmLeft className="text-slate-400 group-hover/link:text-primary transition-colors duration-500 text-lg" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 group-hover/link:text-slate-600 transition-colors duration-500">
                    Volver al Inicio
                  </span>
                </Link>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
