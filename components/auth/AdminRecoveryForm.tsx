"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  HiArrowSmLeft,
  HiOutlineMail,
  HiOutlineLockClosed,
  HiOutlineEye,
  HiOutlineEyeOff,
  HiCheckCircle,
} from "react-icons/hi";
import { toast } from "sonner";
import { PulseWaves } from "@/components/ui/PulseWaves";

// 3-step flow: email → verify → reset
type Step = "email" | "verify" | "reset" | "done";

export default function AdminRecoveryForm() {
  const [step, setStep] = useState<Step>("email");
  const [loading, setLoading] = useState(false);

  // form fields
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass, setShowPass] = useState(false);

  // ── STEP 1: request reset email ──────────────────────────────────────────────
  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/admin/auth/recovery/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Te enviamos un código de verificación a tu correo.");
        setStep("verify");
      } else {
        toast.error(data.message || "No encontramos ese correo.");
      }
    } catch {
      toast.error("Error de red. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  // ── STEP 2: verify token ─────────────────────────────────────────────────────
  const handleVerifyToken = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/admin/auth/recovery/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, token }),
      });
      const data = await res.json();
      if (data.success) {
        setStep("reset");
      } else {
        toast.error(data.message || "Código inválido o expirado.");
      }
    } catch {
      toast.error("Error de red. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  // ── STEP 3: set new password ─────────────────────────────────────────────────
  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("Las contraseñas no coinciden.");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/admin/auth/recovery/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, token, newPassword }),
      });
      const data = await res.json();
      if (data.success) {
        setStep("done");
      } else {
        toast.error(data.message || "Error al restablecer contraseña.");
      }
    } catch {
      toast.error("Error de red. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex flex-col lg:flex-row w-full max-w-5xl min-h-[580px] bg-white rounded-[3rem] overflow-hidden shadow-[0_40px_100px_-20px_rgba(0,0,0,0.15)] animate-in fade-in zoom-in-95 duration-700">
      {/* Left brand panel */}
      <div className="relative w-full lg:w-[40%] bg-gradient-to-br from-slate-900 via-primary/90 to-primary flex flex-col items-center justify-center p-12 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-40 h-40 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-10 right-10 w-56 h-56 rounded-full bg-white blur-3xl" />
        </div>
        <div className="relative z-10 text-center text-white space-y-5">
          <div className="w-20 h-20 bg-white/10 backdrop-blur-sm rounded-3xl flex items-center justify-center mx-auto border border-white/20">
            <Image src="/logos/favicon-iimp.png" alt="IIMP" width={44} height={44} className="object-contain" unoptimized />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight">Recuperar Acceso</h1>
            <p className="text-white/60 text-sm mt-1 font-medium">Panel Administrativo IIMP</p>
          </div>
          <div className="flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 w-fit mx-auto">
            <PulseWaves color="bg-green-400" />
            <span className="text-xs font-semibold text-white/80 uppercase tracking-widest ml-1">
              ACCESO SEGURO
            </span>
          </div>

          {/* step indicator */}
          <div className="flex items-center gap-2 justify-center mt-6">
            {(["email", "verify", "reset", "done"] as Step[]).map((s) => (
              <div key={s} className={`h-1.5 rounded-full transition-all duration-500 ${step === s ? "w-8 bg-white" : "w-2 bg-white/30"}`} />
            ))}
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="relative w-full lg:w-[60%] flex flex-col p-10 lg:p-16 bg-white">
        <div className="max-w-sm w-full mx-auto flex-1 flex flex-col justify-center space-y-8">

          {/* STEP: email */}
          {step === "email" && (
            <>
              <header>
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">¿Olvidaste tu contraseña?</h2>
                <p className="text-slate-400 text-sm mt-2">Ingresa el correo de tu cuenta de administrador y te enviaremos un código de verificación.</p>
              </header>
              <form onSubmit={handleRequestReset} className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Correo electrónico</label>
                  <div className="relative">
                    <HiOutlineMail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="admin@iimp.org.pe"
                      className="w-full h-12 pl-11 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                    />
                  </div>
                </div>
                <button type="submit" disabled={loading} className="w-full h-12 bg-primary hover:bg-primary/90 disabled:opacity-50 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 border-none cursor-pointer transition-all">
                  {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <>Enviar código <HiArrowSmLeft className="rotate-180 text-lg" /></>}
                </button>
              </form>
            </>
          )}

          {/* STEP: verify */}
          {step === "verify" && (
            <>
              <header>
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Ingresa el código</h2>
                <p className="text-slate-400 text-sm mt-2">Enviamos un código de 6 dígitos a <span className="font-semibold text-slate-600">{email}</span>.</p>
              </header>
              <form onSubmit={handleVerifyToken} className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Código de verificación</label>
                  <input
                    type="text"
                    value={token}
                    onChange={(e) => setToken(e.target.value.toUpperCase())}
                    required
                    maxLength={6}
                    placeholder="ABC123"
                    className="w-full h-12 px-4 text-center bg-slate-50 border border-slate-200 rounded-xl text-lg font-bold tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                  />
                </div>
                <button type="submit" disabled={loading} className="w-full h-12 bg-primary hover:bg-primary/90 disabled:opacity-50 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 border-none cursor-pointer transition-all">
                  {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <>Verificar código <HiArrowSmLeft className="rotate-180 text-lg" /></>}
                </button>
                <button type="button" onClick={() => setStep("email")} className="w-full text-xs text-slate-400 hover:text-primary transition-colors bg-transparent border-none cursor-pointer">
                  ← Volver e ingresar otro correo
                </button>
              </form>
            </>
          )}

          {/* STEP: reset */}
          {step === "reset" && (
            <>
              <header>
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Nueva contraseña</h2>
                <p className="text-slate-400 text-sm mt-2">Elige una contraseña segura de al menos 8 caracteres.</p>
              </header>
              <form onSubmit={handleReset} className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Nueva contraseña</label>
                  <div className="relative">
                    <HiOutlineLockClosed className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl" />
                    <input
                      type={showPass ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      minLength={8}
                      placeholder="••••••••"
                      className="w-full h-12 pl-11 pr-11 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                    />
                    <button type="button" onClick={() => setShowPass(v => !v)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 bg-transparent border-none cursor-pointer">
                      {showPass ? <HiOutlineEyeOff className="text-xl" /> : <HiOutlineEye className="text-xl" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Confirmar contraseña</label>
                  <div className="relative">
                    <HiOutlineLockClosed className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl" />
                    <input
                      type={showPass ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      placeholder="••••••••"
                      className="w-full h-12 pl-11 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                    />
                  </div>
                </div>
                <button type="submit" disabled={loading} className="w-full h-12 bg-primary hover:bg-primary/90 disabled:opacity-50 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 border-none cursor-pointer transition-all">
                  {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <>Restablecer contraseña <HiArrowSmLeft className="rotate-180 text-lg" /></>}
                </button>
              </form>
            </>
          )}

          {/* STEP: done */}
          {step === "done" && (
            <div className="text-center space-y-6">
              <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto">
                <HiCheckCircle className="text-5xl text-emerald-500" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">¡Contraseña restablecida!</h2>
                <p className="text-slate-400 text-sm mt-2">Tu contraseña fue actualizada exitosamente. Ahora puedes iniciar sesión.</p>
              </div>
              <Link href="/acceso/login" className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white font-bold rounded-xl text-sm hover:bg-primary/90 transition-all">
                <HiArrowSmLeft className="rotate-180 text-lg" /> Ir al Panel Administrativo
              </Link>
            </div>
          )}

          {/* Back link (only on email step) */}
          {step === "email" && (
            <div className="text-center">
              <Link href="/acceso/login" className="text-xs font-semibold text-slate-400 hover:text-primary transition-colors uppercase tracking-wider">
                ← Volver al login de administradores
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
