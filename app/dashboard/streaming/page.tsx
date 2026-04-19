"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Radio } from "lucide-react";

export default function StreamingPage() {
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
      <div className="flex flex-col items-center justify-center p-12 bg-white rounded-3xl shadow-sm border border-slate-100 min-h-[60vh] animate-in fade-in duration-500">
        <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-6 shadow-sm border border-red-100">
          <Radio size={40} className="animate-pulse" />
        </div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight text-center">
          Sala de Streaming
        </h1>
        <p className="text-slate-500 mt-3 text-center max-w-md mx-auto text-lg leading-relaxed">
          La transmisión en vivo estará disponible pronto. Vuelve más tarde para disfrutar del evento.
        </p>
      </div>
    </DashboardLayout>
  );
}
