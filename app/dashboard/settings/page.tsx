"use client";

import React, { useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import SettingsView from "@/components/dashboard/SettingsView";

export default function SettingsPage() {
  const { isAuthenticated, _hasHydrated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (_hasHydrated && !isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, _hasHydrated, router]);

  if (!_hasHydrated || !isAuthenticated) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col">
          <h1 className="text-3xl font-bold text-slate-900 capitalize tracking-tight">
            Configuración
          </h1>
          <p className="text-slate-500 font-medium mt-1">
            Gestiona tus preferencias de cuenta y seguridad.
          </p>
        </div>

        <Suspense fallback={<div>Cargando...</div>}>
          <SettingsView />
        </Suspense>
      </div>
    </DashboardLayout>
  );
}
