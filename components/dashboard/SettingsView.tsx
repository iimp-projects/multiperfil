"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  Mail,
  MessageSquare,
  Lock,
  History,
  Monitor,
  ShieldCheck,
  Eye,
  EyeOff,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  KeyRound,
} from "lucide-react";
import { UserSettings, LoginSession } from "@/types/settings";
import {
  useVertical,
  Input,
  Field as FieldComponent,
  FieldLabel as FieldLabelComponent,
} from "@nrivera-iimp/ui-kit-iimp";
import { useAuthStore } from "@/store/useAuthStore";
import { userService } from "@/services/user.service";
import { authService } from "@/services/auth.service";
import { toast } from "sonner";
import { getDynamicEventCode } from "@/lib/utils/event";
import { SaveDataRequest, ResetPasswordRequest } from "@/types/auth";
import { Save, Loader2 } from "lucide-react";

const generateMockHistory = (): LoginSession[] => {
  return Array.from({ length: 25 }).map((_, i) => ({
    id: (i + 1).toString(),
    date: new Date(2026, 2, 15 - Math.floor(i / 2)).toISOString().split("T")[0],
    time: `${(10 + i) % 24}:30:00`,
    ip: `190.235.122.${10 + i}`,
    device: i % 2 === 0 ? "Chrome en Windows" : "Mobile Safari en iPhone",
  }));
};

const mockLoginHistory: LoginSession[] = generateMockHistory();

export default function SettingsView() {
  const { user, updateUser } = useAuthStore();
  const [settings, setSettings] = useState<UserSettings>({
    preferences: {
      notifications: {
        email: user?.notificacion01 ?? true,
        sms: user?.notificacion02 ?? false,
      },
    },
    privacy: {
      profileVisibility: user?.visPerfil ? "public" : "private",
      contactPermission: "everyone",
      whatsappVisible: user?.visWhatsapp ?? true,
    },
    loginHistory: mockLoginHistory,
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  useEffect(() => {
    if (user) {
      setSettings((prev) => ({
        ...prev,
        preferences: {
          notifications: {
            email: user.notificacion01 ?? true,
            sms: user.notificacion02 ?? false,
          },
        },
        privacy: {
          ...prev.privacy,
          profileVisibility: user.visPerfil ? "public" : "private",
          whatsappVisible: user.visWhatsapp ?? true,
        },
      }));
    }
  }, [user]);

  const { vertical } = useVertical();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const highlightParam = searchParams.get("highlight");

  const [showHighlight, setShowHighlight] = useState(false);

  useEffect(() => {
    if (highlightParam === "whatsapp") {
      const startTimer = setTimeout(() => setShowHighlight(true), 100);
      const endTimer = setTimeout(() => setShowHighlight(false), 3100);
      return () => {
        clearTimeout(startTimer);
        clearTimeout(endTimer);
      };
    }
  }, [highlightParam]);

  const [activeSection, setActiveSection] = useState<
    "preferences" | "privacy" | "history" | "more"
  >(() => {
    if (
      tabParam === "privacy" ||
      tabParam === "preferences" ||
      tabParam === "history" ||
      tabParam === "more"
    ) {
      return tabParam as "preferences" | "privacy" | "history" | "more";
    }
    return "preferences";
  });

  const [historyPage, setHistoryPage] = useState(1);
  const ITEMS_PER_PAGE = 15;

  const totalHistoryPages = Math.ceil(
    settings.loginHistory.length / ITEMS_PER_PAGE,
  );
  const paginatedHistory = settings.loginHistory.slice(
    (historyPage - 1) * ITEMS_PER_PAGE,
    historyPage * ITEMS_PER_PAGE,
  );

  const toggleNotification = (type: "email" | "sms") => {
    setSettings((prev) => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        notifications: {
          ...prev.preferences.notifications,
          [type]: !prev.preferences.notifications[type],
        },
      },
    }));
  };

  const toggleWhatsapp = () => {
    setSettings((prev) => ({
      ...prev,
      privacy: {
        ...prev.privacy,
        whatsappVisible: !prev.privacy.whatsappVisible,
      },
    }));
  };

  const updatePrivacy = (
    key: keyof typeof settings.privacy,
    value: string | boolean,
  ) => {
    setSettings((prev) => ({
      ...prev,
      privacy: {
        ...prev.privacy,
        [key]: value,
      },
    }));
  };

  const handleSaveSettings = async () => {
    if (!user) return;
    const userIdentifier = user.siecode || user.nu_documento;
    
    if (!userIdentifier) {
      toast.error("No se pudo identificar al usuario para guardar la configuración");
      return;
    }

    setIsSaving(true);
    try {
      const dynamicEvent = getDynamicEventCode(vertical);

      const payload: SaveDataRequest = {
        event: dynamicEvent,
        siecode: userIdentifier,
        nombreCompleto: [user.nombres, user.apellidoPaterno, user.apellidoMaterno]
          .filter(Boolean)
          .join(" "),
        numeroTelefono: user.telefono || user.celular || "",
        cargoProfesional: user.cargo || "",
        empresa: user.empresa || "",
        ubicacionOficina: user.ubicacionOficina || "",
        correoElectronico: user.email || "",
        bioProfesional: user.bio || "",
        curriculumVitae: "",
        visPerfil: settings.privacy.profileVisibility === "public" ? 1 : 0,
        visWhatsapp: settings.privacy.whatsappVisible ? 1 : 0,
        notificacion01: settings.preferences.notifications.email ? 1 : 0,
        notificacion02: settings.preferences.notifications.sms ? 1 : 0,
      };

      const response = await userService.saveData(payload);
      if (response.success) {
        updateUser({
          notificacion01: settings.preferences.notifications.email,
          notificacion02: settings.preferences.notifications.sms,
          visPerfil: settings.privacy.profileVisibility === "public",
          visWhatsapp: settings.privacy.whatsappVisible,
        });
        toast.success("Configuración guardada");
      } else {
        toast.error(response.message || "Error al guardar");
      }
    } catch {
      toast.error("Error de conexión");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const userIdentifier = user.siecode || user.nu_documento;
    if (!userIdentifier) return;

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("Las contraseñas no coinciden");
      return;
    }

    setIsResetting(true);
    try {
      const dynamicEvent = getDynamicEventCode(vertical);

      const payload: ResetPasswordRequest = {
        event: dynamicEvent,
        type: user.documentType || "1",
        document: user.documentNumber || userIdentifier,
        password: passwordForm.currentPassword,
        newpassword: passwordForm.newPassword,
      };

      const response = await authService.resetPassword(payload);
      if (response.success) {
        toast.success("Contraseña actualizada correctamente");
        setPasswordForm({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      } else {
        toast.error(response.message || "Error al cambiar la contraseña");
      }
    } catch {
      toast.error("Error de conexión");
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="w-full mx-auto py-4 space-y-6">
      {/* Navigation Tabs (Top) */}
      <div className="w-full overflow-hidden">
        <div className="flex flex-nowrap items-center gap-2 bg-slate-100/50 p-1.5 rounded-[2rem] w-full overflow-x-auto no-scrollbar scroll-smooth scroll-touch">
          <SectionNavTab
            active={activeSection === "preferences"}
            onClick={() => setActiveSection("preferences")}
            icon={<Bell size={18} />}
            label="Preferencias"
          />
          <SectionNavTab
            active={activeSection === "privacy"}
            onClick={() => setActiveSection("privacy")}
            icon={<ShieldCheck size={18} />}
            label="Privacidad"
          />
          <SectionNavTab
            active={activeSection === "history"}
            onClick={() => setActiveSection("history")}
            icon={<History size={18} />}
            label="Historial"
          />
          <SectionNavTab
            active={activeSection === "more"}
            onClick={() => setActiveSection("more")}
            icon={<KeyRound size={18} />}
            label="Seguridad"
          />
        </div>
      </div>

      {/* Content Area */}
      <div className="w-full group/main">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="rounded-3xl shadow-sm bg-white border border-slate-100 p-6 md:p-10 relative overflow-hidden overscroll-contain"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none" />
            <div className="relative z-10 space-y-8">
              {activeSection === "preferences" && (
                <div className="space-y-8">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                      Preferencias
                    </h2>
                    <p className="text-slate-500 font-medium mt-1">
                      Configura cómo deseas recibir nuestras actualizaciones.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <SettingToggle
                      icon={<Mail className="text-blue-500" />}
                      title="Notificaciones por Email"
                      description="Recibe noticias, eventos y actualizaciones importantes en tu correo."
                      enabled={settings.preferences.notifications.email}
                      onChange={() => toggleNotification("email")}
                    />
                    <SettingToggle
                      icon={<MessageSquare className="text-emerald-500" />}
                      title="Notificaciones SMS / Whatsapp"
                      description="Alertas rápidas y recordatorios de eventos vía mensaje de texto."
                      enabled={settings.preferences.notifications.sms}
                      onChange={() => toggleNotification("sms")}
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row justify-end mt-8 gap-4">
                    <button
                      onClick={handleSaveSettings}
                      disabled={isSaving}
                      className="w-full sm:w-auto h-12 px-6 sm:px-12 bg-primary hover:bg-primary/95 text-white font-bold rounded-2xl shadow-xl shadow-primary/20 transition-all transform hover:-translate-y-1 active:scale-[0.98] flex items-center justify-center gap-3 uppercase tracking-widest text-sm border-none cursor-pointer"
                    >
                      {isSaving ? (
                        <Loader2 className="animate-spin" size={18} />
                      ) : (
                        <Save size={18} />
                      )}
                      {isSaving ? "Guardando..." : "Guardar Preferencias"}
                    </button>
                  </div>
                </div>
              )}

              {activeSection === "privacy" && (
                <div className="space-y-8">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                      Privacidad
                    </h2>
                    <p className="text-slate-500 font-medium mt-1">
                      Controla quién puede ver tu información y contactarte.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-6">
                    <SettingCard title="Visibilidad del Perfil">
                      <div className="flex bg-slate-50 p-1 rounded-2xl w-fit">
                        <TabButton
                          active={settings.privacy.profileVisibility === "public"}
                          onClick={() => updatePrivacy("profileVisibility", "public")}
                          label="Público"
                          icon={<Eye size={16} />}
                        />
                        <TabButton
                          active={settings.privacy.profileVisibility === "private"}
                          onClick={() => updatePrivacy("profileVisibility", "private")}
                          label="Privado"
                          icon={<EyeOff size={16} />}
                        />
                      </div>
                      <p className="text-xs text-slate-400 mt-3 font-medium">
                        {settings.privacy.profileVisibility === "public"
                          ? "Tu perfil es visible para otros asistentes en el networking."
                          : "Solo tú puedes ver tu información de perfil completa."}
                      </p>
                    </SettingCard>

                    <SettingToggle
                      icon={<WhatsAppIcon className="text-green-500" />}
                      title="Número de WhatsApp visible"
                      description="Permite que otros participantes vean tu número para contacto directo."
                      enabled={settings.privacy.whatsappVisible}
                      onChange={toggleWhatsapp}
                      highlighted={showHighlight}
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row justify-end mt-8 gap-4">
                    <button
                      onClick={handleSaveSettings}
                      disabled={isSaving}
                      className="w-full sm:w-auto h-12 px-6 sm:px-12 bg-primary hover:bg-primary/95 text-white font-bold rounded-2xl shadow-xl shadow-primary/20 transition-all transform hover:-translate-y-1 active:scale-[0.98] flex items-center justify-center gap-3 uppercase tracking-widest text-sm border-none cursor-pointer"
                    >
                      {isSaving ? (
                        <Loader2 className="animate-spin" size={18} />
                      ) : (
                        <Save size={18} />
                      )}
                      {isSaving ? "Guardando..." : "Guardar Privacidad"}
                    </button>
                  </div>
                </div>
              )}

              {activeSection === "history" && (
                <div className="space-y-8">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                      Historial de Actividad
                    </h2>
                    <p className="text-slate-500 font-medium mt-1">
                      Revisa los accesos recientes a tu cuenta para tu seguridad.
                    </p>
                  </div>

                  {/* Desktop Table View */}
                  <div className="hidden md:block overflow-hidden rounded-3xl border border-slate-100 shadow-sm">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50/50">
                          <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-400">
                            Fecha y Hora
                          </th>
                          <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-400">
                            Dirección IP
                          </th>
                          <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-400">
                            Dispositivo
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {paginatedHistory.map((session) => (
                          <tr
                            key={session.id}
                            className="hover:bg-slate-50/50 transition-colors group"
                          >
                            <td className="px-6 py-5">
                              <div className="flex flex-col">
                                <span className="font-bold text-slate-900">
                                  {session.date}
                                </span>
                                <span className="text-xs text-slate-400 font-medium">
                                  {session.time}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-5">
                              <code className="text-xs font-mono bg-slate-100 text-slate-600 px-2 py-1 rounded-lg">
                                {session.ip}
                              </code>
                            </td>
                            <td className="px-6 py-5">
                              <div className="flex items-center gap-2 text-sm text-slate-600 font-medium">
                                <Monitor size={14} className="text-slate-400" />
                                {session.device}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Card View */}
                  <div className="grid grid-cols-1 gap-4 md:hidden scroll-touch">
                    {paginatedHistory.map((session) => (
                      <div
                        key={session.id}
                        className="p-5 rounded-2xl border border-slate-100 bg-white shadow-sm space-y-4"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                              Fecha y Hora
                            </span>
                            <span className="font-bold text-slate-900 mt-1 break-words">
                              {session.date} - {session.time}
                            </span>
                          </div>
                          <div className="p-2 bg-slate-50 rounded-lg">
                            <Monitor size={16} className="text-slate-400" />
                          </div>
                        </div>

                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                            Dirección IP
                          </span>
                          <code className="text-xs font-mono bg-slate-100 text-slate-600 px-2 py-1 rounded-lg w-fit mt-1 break-all">
                            {session.ip}
                          </code>
                        </div>

                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                            Dispositivo
                          </span>
                          <span className="text-sm text-slate-600 font-medium mt-1 break-words">
                            {session.device}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {totalHistoryPages > 1 && (
                    <div className="flex items-center justify-between gap-4 mt-4">
                      <button
                        onClick={() => setHistoryPage((p) => Math.max(1, p - 1))}
                        disabled={historyPage === 1}
                        className="p-2 border border-slate-200 rounded-lg bg-white text-slate-600 disabled:opacity-50 hover:bg-slate-50 cursor-pointer"
                      >
                        <ChevronLeft size={18} />
                      </button>
                      <span className="text-sm font-bold text-slate-600">
                        Página {historyPage} de {totalHistoryPages}
                      </span>
                      <button
                        onClick={() => setHistoryPage((p) => Math.min(totalHistoryPages, p + 1))}
                        disabled={historyPage === totalHistoryPages}
                        className="p-2 border border-slate-200 rounded-lg bg-white text-slate-600 disabled:opacity-50 hover:bg-slate-50 cursor-pointer"
                      >
                        <ChevronRight size={18} />
                      </button>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row items-center justify-between p-6 bg-amber-50 rounded-3xl border border-amber-100 border-dashed gap-4">
                    <div className="flex gap-4 items-start sm:items-center">
                      <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm shrink-0">
                        <Lock className="text-amber-500" size={20} />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-amber-900 break-words">
                          ¿Ves algo sospechoso?
                        </h4>
                        <p className="text-xs text-amber-700 mt-0.5 font-medium leading-relaxed break-words">
                          Si no reconoces algún inicio de sesión, te recomendamos cambiar tu contraseña inmediatamente.
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setActiveSection("more")}
                      className="w-full sm:w-auto px-6 py-2.5 bg-amber-900 text-white rounded-xl text-sm font-bold uppercase tracking-widest hover:bg-amber-950 transition-colors cursor-pointer border-none shrink-0"
                    >
                      Cambiar Clave
                    </button>
                  </div>
                </div>
              )}

              {activeSection === "more" && (
                <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                      Seguridad de la Cuenta
                    </h2>
                    <p className="text-slate-500 font-medium mt-1">
                      Gestiona tu contraseña y protege tu información.
                    </p>
                  </div>

                  <SettingCard title="Cambio de contraseña">
                    <div className="max-w-md space-y-6">
                      <p className="text-sm text-slate-500 font-medium leading-relaxed">
                        Asegúrate de que tu nueva contraseña sea fuerte y no la uses en otros sitios.
                      </p>

                      <form onSubmit={handlePasswordReset} className="space-y-6">
                        <FieldComponent className="space-y-2 group">
                          <div className="flex items-center gap-2 px-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                            <FieldLabelComponent className="text-slate-500 text-xs font-bold tracking-widest uppercase opacity-80">
                              Contraseña Actual
                            </FieldLabelComponent>
                          </div>
                          <div className="relative group/input">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors z-20 pointer-events-none">
                              <Lock size={18} />
                            </div>
                            <Input
                              type="password"
                              placeholder="••••••••"
                              value={passwordForm.currentPassword}
                              onChange={(e) =>
                                setPasswordForm((prev) => ({
                                  ...prev,
                                  currentPassword: e.target.value,
                                }))
                              }
                              className="w-full bg-white border border-slate-200 hover:border-slate-300 text-slate-900 h-12 rounded-xl pl-11 pr-4 focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all font-medium shadow-sm"
                              required
                            />
                          </div>
                        </FieldComponent>

                        <FieldComponent className="space-y-2 group">
                          <div className="flex items-center gap-2 px-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                            <FieldLabelComponent className="text-slate-500 text-xs font-bold tracking-widest uppercase opacity-80">
                              Nueva Contraseña
                            </FieldLabelComponent>
                          </div>
                          <div className="relative group/input">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors z-20 pointer-events-none">
                              <KeyRound size={18} />
                            </div>
                            <Input
                              type="password"
                              placeholder="••••••••"
                              value={passwordForm.newPassword}
                              onChange={(e) =>
                                setPasswordForm((prev) => ({
                                  ...prev,
                                  newPassword: e.target.value,
                                }))
                              }
                              className="w-full bg-white border border-slate-200 hover:border-slate-300 text-slate-900 h-12 rounded-xl pl-11 pr-4 focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all font-medium shadow-sm"
                              required
                            />
                          </div>
                        </FieldComponent>

                        <FieldComponent className="space-y-2 group">
                          <div className="flex items-center gap-2 px-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                            <FieldLabelComponent className="text-slate-500 text-xs font-bold tracking-widest uppercase opacity-80">
                              Confirmar Nueva Contraseña
                            </FieldLabelComponent>
                          </div>
                          <div className="relative group/input">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors z-20 pointer-events-none">
                              <KeyRound size={18} />
                            </div>
                            <Input
                              type="password"
                              placeholder="••••••••"
                              value={passwordForm.confirmPassword}
                              onChange={(e) =>
                                setPasswordForm((prev) => ({
                                  ...prev,
                                  confirmPassword: e.target.value,
                                }))
                              }
                              className="w-full bg-white border border-slate-200 hover:border-slate-300 text-slate-900 h-12 rounded-xl pl-11 pr-4 focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all font-medium shadow-sm"
                              required
                            />
                          </div>
                        </FieldComponent>

                        <div className="pt-2">
                          <button
                            type="submit"
                            disabled={isResetting}
                            className="w-full h-12 bg-primary hover:bg-primary/95 text-white font-bold rounded-xl text-sm shadow-xl shadow-primary/20 transition-all transform hover:-translate-y-1 active:scale-[0.98] border-none uppercase tracking-widest flex items-center justify-center gap-2 px-6 cursor-pointer"
                          >
                            {isResetting ? (
                              <Loader2 className="animate-spin" size={18} />
                            ) : (
                              <>
                                Actualizar Contraseña
                                <ArrowRight size={18} />
                              </>
                            )}
                          </button>
                        </div>
                      </form>
                    </div>
                  </SettingCard>
                </div>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

function SectionNavTab({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2.5 px-6 py-3 rounded-2xl transition-all duration-300 font-bold text-sm h-auto border-none cursor-pointer shrink-0 ${
        active
          ? "bg-slate-900 text-white shadow-lg shadow-slate-900/20 active:scale-95"
          : "bg-transparent text-slate-500 hover:text-slate-900 hover:bg-white/80 active:scale-95"
      }`}
    >
      <span className={active ? "text-white" : "text-slate-400 shrink-0"}>{icon}</span>
      <span className="whitespace-nowrap">{label}</span>
    </button>
  );
}

function SettingToggle({
  icon,
  title,
  description,
  enabled,
  onChange,
  highlighted = false,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  enabled: boolean;
  onChange: () => void;
  highlighted?: boolean;
}) {
  return (
    <motion.div
      animate={
        highlighted
          ? {
              borderColor: ["#f1f5f9", "#2563eb", "#f1f5f9"],
              backgroundColor: ["#ffffff", "#eff6ff", "#ffffff"],
              scale: [1, 1.02, 1],
            }
          : {
              borderColor: "#f1f5f9",
              backgroundColor: "#ffffff",
              scale: 1,
            }
      }
      transition={{ duration: 2, repeat: highlighted ? Infinity : 0 }}
      className="flex items-center justify-between p-6 rounded-3xl border border-slate-100 bg-white transition-all hover:shadow-sm"
    >
      <div className="flex gap-4 items-start sm:items-center min-w-0">
        <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center shrink-0">
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="font-bold text-slate-900 break-words line-clamp-1">{title}</h4>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5 leading-relaxed break-words">
            {description}
          </p>
        </div>
      </div>
      <button
        onClick={onChange}
        type="button"
        className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-300 focus:outline-none p-0 border-none ${
          enabled ? "bg-primary" : "bg-slate-200"
        }`}
      >
        <motion.span
          initial={false}
          animate={{ x: enabled ? 24 : 4 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          className="inline-block h-5 w-5 rounded-full bg-white shadow-sm"
        />
      </button>
    </motion.div>
  );
}

function SettingCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="p-8 rounded-[2.5rem] border border-slate-100 bg-slate-50/30 space-y-4">
      <h3 className="font-bold text-slate-800 text-lg">{title}</h3>
      {children}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  label,
  icon,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      type="button"
      className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all h-auto border-none cursor-pointer ${
        active
          ? "bg-white text-slate-900 shadow-sm hover:bg-white"
          : "bg-transparent text-slate-400 hover:text-slate-600"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function WhatsAppIcon({
  size = 20,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
  );
}
