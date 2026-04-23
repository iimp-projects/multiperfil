"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Input,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  useVertical,
  Field,
  FieldLabel,
} from "@nrivera-iimp/ui-kit-iimp";
import type { Vertical } from "@nrivera-iimp/ui-kit-iimp";

import Link from "next/link";
import Image from "next/image";
import {
  HiOutlineEye,
  HiOutlineEyeOff,
  HiOutlineLockClosed,
  HiArrowSmLeft,
  HiOutlineKey,
  HiOutlineUser,
} from "react-icons/hi";
import { PulseWaves } from "../ui/PulseWaves";
import { LanguageSwitcher } from "../ui/LanguageSwitcher";
import { authService } from "@/services/auth.service";
import { useAuthStore } from "@/store/useAuthStore";
import { useRouter } from "next/navigation";
import { getCurrentLang, i18nToast } from "@/lib/translate";
import type { Lang } from "@/lib/lang";
import { getDynamicEventCode } from "@/lib/utils/event";

const LOGIN_I18N = {
  es: {
    docTypeLabel: "TIPO DE DOCUMENTO",
    docTypePlaceholder: "Tipo de Documento",
    docNumLabel: "NRO DE DOCUMENTO",
    passwordLabel: "PASSWORD",
    docTypes: {
      "1": "DNI",
      "4": "Carnet de extranjeria",
      "7": "Pasaporte",
    } as Record<string, string>,
  },
  en: {
    docTypeLabel: "DOCUMENT TYPE",
    docTypePlaceholder: "Document type",
    docNumLabel: "DOCUMENT NUMBER",
    passwordLabel: "PASSWORD",
    docTypes: {
      "1": "National ID / ID Card",
      "4": "Foreigner ID",
      "7": "Passport",
    } as Record<string, string>,
  },
} as const;

const ALL_SLIDES = {
  gess: [
    {
      image: "/slider/gess/GESS-2026.jpg",
      title: "Sinergia Institucional",
      description: "Empoderando el futuro de la minería sostenible.",
    },
    {
      image: "/slider/gess/prensa1.png",
      title: "Liderazgo Estratégico",
      description: "Impulsando la innovación en todos los sectores mineros.",
    },
    {
      image: "/slider/gess/prensa3.png",
      title: "Comunidad Minera",
      description: "Fortaleciendo los lazos dentro de nuestra industria.",
    },
  ],
  proexplo: [
    {
      image: "/slider/proexplo/26b72b8d-a800-4399-adaa-68e91fb430ac.webp",
      title: "Descubrimientos Clave",
      description:
        "Descubriendo el potencial mineral para la próxima generación.",
    },
    {
      image: "/slider/proexplo/c5944c2a-4a1a-47a1-a01e-48ce76aa9618.webp",
      title: "Excelencia Geológica",
      description: "Precisión y ciencia en el corazón de la exploración.",
    },
    {
      image: "/slider/proexplo/db5ed038-bdd2-4ce8-a11d-55057dd91500.jpeg",
      title: "Horizontes Futuros",
      description: "Liderando la búsqueda global de recursos minerales.",
    },
  ],
  wmc: [
    {
      image: "/slider/wmc/WEB-WMC-12-2048x1364.jpg",
      title: "Centro Minero Mundial",
      description: "El epicentro global de la tecnología minera.",
    },
    {
      image: "/slider/wmc/WEB-WMC-_11_-1-2048x1364.webp",
      title: "Cumbre Global",
      description: "Conectando visionarios de todos los continentes.",
    },
    {
      image: "/slider/wmc/WEB-WMC-_2_-2048x1364.webp",
      title: "Industria de Próxima Generación",
      description: "Moldeando el panorama minero del 2026.",
    },
  ],
};

export default function LoginForm({
  initialLang,
}: {
  initialLang?: Lang;
}) {
  const [loading, setLoading] = useState(false);
  const { vertical, setVertical } = useVertical();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const { setAuth, isAuthenticated, _hasHydrated } = useAuthStore();
  const [selectedEventName, setSelectedEventName] = useState("");
  const [hasSelectedVertical, setHasSelectedVertical] = useState(false);

  const [lang, setLang] = useState<Lang>(() => initialLang ?? "es");
  const t = LOGIN_I18N[lang];

  useEffect(() => {
    // Avoid reading cookies during render to prevent hydration mismatches.
    const id = window.setTimeout(() => {
      const current = getCurrentLang();
      setLang((prev) => (prev === current ? prev : current));
    }, 0);
    return () => window.clearTimeout(id);
  }, []);

  const [dynamicVerticals, setDynamicVerticals] = useState<Array<{ slug: Vertical; label: string; logo: string; originalName: string }>>([]);

  useEffect(() => {
    // Keep the event selector open by default on first visit.
    // Only auto-skip it when the user explicitly preselects a vertical
    // via URL (?theme=...) or has one persisted in localStorage.
    const urlParams = new URLSearchParams(window.location.search);
    const themeParam = urlParams.get("theme")?.toLowerCase();
    const saved = localStorage.getItem("iimp-vertical")?.toLowerCase();

    const preselected = themeParam || saved;
    if (!preselected) return;

    const allowed: Vertical[] = ["proexplo", "gess", "wmc", "perumin"];
    if (allowed.includes(preselected as Vertical)) {
      const timeoutId = window.setTimeout(() => {
        setVertical(preselected as Vertical);
        setHasSelectedVertical(true);
      }, 0);
      return () => window.clearTimeout(timeoutId);
    }
  }, [setVertical]);

  useEffect(() => {
    const fetchVerticals = async () => {
      const data = await authService.getEventList();
      if (data && data.Eventos) {
        const mapped = data.Eventos.map((evt) => {
          const name = evt.Evento.toUpperCase();
          let slug: Vertical = "proexplo";
          const label = evt.Evento;
          let logo = "/logos/favicon-iimp.png";

          if (name.includes("PROEXPLO")) {
            slug = "proexplo";
            logo = "/logos/favicon-iimp.png";
          } else if (name.includes("WMC")) {
            slug = "wmc";
            logo = "/logos/favicon-wmc.png";
          } else if (name.includes("GESS")) {
            slug = "gess";
            logo = "/logos/favicon-gess.png";
          } else if (name.includes("PERUMIN")) {
            slug = "perumin";
            logo = "/logos/favicon-perumin.png";
          }

          return { slug, label, logo, originalName: evt.Evento };
        });
        setDynamicVerticals(mapped);
      }
    };
    fetchVerticals();
  }, []);

  // Form state
  const [formData, setFormData] = useState({
    documentType: "1",
    documentNum: "",
    password: "",
  });

  // Redirect if already authenticated
  useEffect(() => {
    if (_hasHydrated && isAuthenticated) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, _hasHydrated, router]);

  const activeSlides = useMemo(() => {
    return ALL_SLIDES[vertical as keyof typeof ALL_SLIDES] || ALL_SLIDES.wmc;
  }, [vertical]);

  const [prevVertical, setPrevVertical] = useState(vertical);

  if (vertical !== prevVertical) {
    setPrevVertical(vertical);
    setCurrentSlide(0);
  }

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
      case "perumin":
        return "/logos/logo-perumin.png";
      default:
        return "/logos/logo-iimp.png";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const resolvedEvent = selectedEventName || getDynamicEventCode(vertical);

    const request = {
      event: resolvedEvent,
      type: formData.documentType,
      document: formData.documentNum,
      password: formData.password,
    };

    console.log("Login request to service:", request);

    const response = await authService.login(request);

    if (response.success && response.data) {
      // Persist the document type and number in the user session for later use (e.g., password reset)
      const userWithDocInfo = {
        ...response.data,
        documentType: formData.documentType,
        documentNumber: formData.documentNum,
      };

      setAuth(userWithDocInfo);
      i18nToast.success(`¡Bienvenido al sistema!`, "Welcome to the system!");
      router.push("/dashboard");
    } else {
      i18nToast.error(
        response.message || "Error de autenticación",
        response.message || "Authentication error",
      );
    }

    setLoading(false);
  };

  return (
    <>
      {!hasSelectedVertical && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-lg w-full animate-in fade-in zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto no-scrollbar">
            <h2 className="text-2xl font-bold text-center text-slate-800 mb-2">
              Selecciona tu evento
            </h2>
            <p className="text-slate-500 text-center mb-6">
              Elige el entorno al que deseas acceder
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {dynamicVerticals.length > 0 ? (
                dynamicVerticals.map((item, idx) => (
                  <button
                    type="button"
                    key={`${item.originalName}-${idx}`}
                    onClick={() => {
                      const slug = item.slug;
                      setVertical(slug);
                      setSelectedEventName(item.originalName);
                      setHasSelectedVertical(true);

                      // Automatic language selection logic
                      const targetLang = slug === "wmc" ? "en" : "es";
                      const match = document.cookie.match(/googtrans=\/es\/(\w+)/);
                      const currentLang = match ? match[1].toLowerCase() : "es";

                      if (currentLang !== targetLang) {
                        document.cookie = `googtrans=/es/${targetLang}; path=/; domain=${window.location.hostname}`;
                        document.cookie = `googtrans=/es/${targetLang}; path=/`;
                        window.location.reload();
                      }
                    }}
                    className="flex flex-row items-center justify-center gap-3 p-4 rounded-2xl border border-slate-100 bg-slate-50 hover:bg-primary/5 hover:border-primary/20 transition-all duration-200 group cursor-pointer"
                  >
                    <div className="w-14 h-14 rounded-xl bg-white flex items-center justify-center shadow-sm p-2 group-hover:scale-110 transition-transform">
                      <Image
                        src={item.logo}
                        alt={item.label}
                        width={36}
                        height={36}
                        className="object-contain w-full h-full"
                        unoptimized
                      />
                    </div>
                    <span className="flex-1 text-left font-semibold text-sm text-slate-700 group-hover:text-primary uppercase">
                      {item.label}
                    </span>
                  </button>
                ))
              ) : (
                <div className="col-span-2 py-8 text-center">
                  <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-slate-400 text-sm">Cargando eventos...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="relative flex flex-col lg:flex-row w-full max-w-6xl min-h-[700px] bg-white rounded-[3rem] overflow-hidden shadow-[0_40px_100px_-20px_rgba(0,0,0,0.15)] animate-in fade-in zoom-in-95 duration-700">
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
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10" />

              <div className="absolute inset-0 p-8 lg:p-12 flex-col justify-end z-20 text-white leading-none pb-44 hidden lg:flex">
                <div className="space-y-4 relative -top-15">
                  <div className="inline-block px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-bold tracking-[0.2em] uppercase">
                    Experiencia Inmersiva
                  </div>
                  <div className="space-y-2">
                    <h1 className="text-4xl font-bold tracking-tighter">
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
          {/* Dots layer outside absolute slides if needed, or inside a safe z-index */}
          <div className="relative z-20 gap-2.5 mb-2 hidden lg:flex">
            {activeSlides.map((_, dotIndex) => (
              <button
                key={dotIndex}
                onClick={() => setCurrentSlide(dotIndex)}
                className={`h-1.5 min-w-0 p-0 transition-all duration-500 rounded-full border border-white/10 ${
                  dotIndex === currentSlide
                    ? "w-10 bg-white hover:bg-white"
                    : "w-2.5 bg-white/20 hover:bg-white/40"
                }`}
              />
            ))}
          </div>
        </div>

        <div className="relative w-full lg:w-[55%] flex flex-col p-8 lg:p-16 bg-white z-30 lg:z-10 rounded-t-[3rem] lg:rounded-none -mt-12 lg:mt-0">
          {/* Badge Top Right */}
          <div className="absolute top-8 right-10 flex flex-row items-center justify-between gap-3 ">
            <button
              onClick={() => setHasSelectedVertical(false)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-slate-200 hover:border-primary/30 hover:bg-slate-50 text-slate-500 hover:text-primary transition-all text-[10px] font-bold uppercase tracking-wider shadow-sm cursor-pointer"
            >
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              Cambiar Evento
            </button>
            <div className="hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-100 overflow-visible">
              <PulseWaves color="bg-green-500" />
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest ml-0">
                SISTEMA-IIMP-{process.env.NEXT_PUBLIC_APP_VERSION || "V4"}
              </span>
            </div>
            <div className="flex items-center justify-end">
              <LanguageSwitcher />
            </div>
          </div>

          <div className="max-w-md w-full mx-auto flex-1 flex flex-col justify-center space-y-10 mt-6">
            {/* Centered Logo */}
            <div className="relative w-40 h-16 mx-auto mb-2 mt-10">
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
                <h2 className="text-3xl font-bold text-slate-900 tracking-tight">
                  Acceso Institucional
                </h2>
                <p className="text-slate-400 font-medium text-sm px-6">
                  Ingresa tus credenciales para gestionar tus recursos de forma
                  segura.
                </p>
              </div>
            </header>

            <form onSubmit={handleSubmit} className="space-y-8">
              <input type="hidden" name="vertical" value={vertical} />
              <div className="space-y-5">
                <Field className="space-y-2 group">
                  <div className="flex items-center gap-2 px-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#c9c9c9]" />
                    <FieldLabel className="text-slate-500 text-xs font-bold tracking-widest uppercase opacity-80">
                      <span translate="no">{t.docTypeLabel}</span>
                    </FieldLabel>
                  </div>
                  <div className="relative group/input">
                    <Select
                      value={formData.documentType}
                      onValueChange={(val) =>
                        setFormData({ ...formData, documentType: val })
                      }
                    >
                      <SelectTrigger className="text-base! w-full bg-white border border-slate-200 hover:border-slate-300 text-slate-900 h-14 rounded-xl pl-4 pr-10 focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all font-normal shadow-sm z-10 appearance-none bg-none cursor-pointer">
                        <div className="notranslate" translate="no">
                          <SelectValue placeholder={t.docTypePlaceholder} />
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">
                          <span translate="no">{t.docTypes["1"]}</span>
                        </SelectItem>
                        <SelectItem value="4">
                          <span translate="no">{t.docTypes["4"]}</span>
                        </SelectItem>
                        <SelectItem value="7">
                          <span translate="no">{t.docTypes["7"]}</span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </Field>

                <Field className="space-y-2 group">
                  <div className="flex items-center gap-2 px-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#c9c9c9]" />
                    <FieldLabel className="text-slate-500 text-xs font-bold tracking-widest uppercase opacity-80">
                      <span translate="no">{t.docNumLabel}</span>
                    </FieldLabel>
                  </div>
                  <div className="relative group/input">
                    <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors z-20 pointer-events-none">
                      <HiOutlineUser className="text-xl" />
                    </div>
                    <Input
                      value={formData.documentNum}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          documentNum: e.target.value,
                        })
                      }
                      type="text"
                      autoComplete="username"
                      placeholder="ej. 00000000"
                      className="text-base! w-full bg-white border border-slate-200 hover:border-slate-300 text-slate-900 h-14 rounded-xl pl-12 pr-4 focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all placeholder:text-slate-300 font-normal shadow-sm z-10"
                      required
                    />
                  </div>
                </Field>

                <Field className="space-y-2 group">
                  <div className="flex items-center gap-2 px-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#c9c9c9]" />
                    <FieldLabel className="text-slate-500 text-xs font-bold tracking-widest uppercase opacity-80">
                      <span translate="no">{t.passwordLabel}</span>
                    </FieldLabel>
                  </div>
                  <div className="relative group/input">
                    <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors z-20 pointer-events-none">
                      <HiOutlineLockClosed className="text-xl" />
                    </div>
                    <Input
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      placeholder="••••••••••••"
                      className="text-base! w-full bg-white border border-slate-200 hover:border-slate-300 text-slate-900 h-14 rounded-xl pl-12 pr-12 focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all placeholder:text-slate-300 font-normal shadow-sm z-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-2 z-20 h-auto bg-transparent border-none cursor-pointer"
                    >
                      {showPassword ? (
                        <HiOutlineEyeOff className="text-xl" />
                      ) : (
                        <HiOutlineEye className="text-xl" />
                      )}
                    </button>
                  </div>
                  <div className="flex justify-end pt-2">
                    <Link
                      href="/recovery"
                      className="group/link relative flex items-center gap-4 py-2.5 px-6 rounded-full bg-slate-50/50 backdrop-blur-sm border border-slate-100 hover:border-primary/30 hover:bg-white hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] transition-all duration-700 ease-out"
                    >
                      <div className="relative flex items-center justify-center w-5 h-5 transition-transform duration-700 group-hover/link:rotate-360">
                        <HiOutlineKey className="text-slate-400 group-hover/link:text-primary transition-colors duration-500" />
                        <div className="absolute inset-0 bg-primary/20 rounded-full blur-md opacity-0 group-hover/link:opacity-100 transition-opacity duration-700" />
                      </div>
                      <span className="text-xs font-bold uppercase tracking-[0.25em] text-slate-400 group-hover/link:text-slate-600 transition-colors duration-500">
                        Recuperar Contraseña
                      </span>
                      <div className="w-1 h-1 rounded-full bg-slate-200 group-hover/link:bg-primary group-hover/link:scale-150 transition-all duration-500" />
                    </Link>
                  </div>
                </Field>
              </div>

              <div className="space-y-5">
                <button
                  type="submit"
                  className="w-full h-14 bg-primary hover:bg-primary/95 text-white font-black rounded-xl text-sm shadow-xl shadow-primary/20 transition-all transform hover:-translate-y-1 active:scale-[0.98] border-none flex items-center justify-center gap-2 uppercase tracking-widest cursor-pointer"
                  disabled={loading}
                >
                  {loading ? "Iniciando sesión..." : "INGRESAR AL EVENTO"}
                  {!loading && <HiArrowSmLeft className="text-xl rotate-180" />}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
