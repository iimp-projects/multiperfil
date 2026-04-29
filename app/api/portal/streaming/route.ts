import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const event = url.searchParams.get("event");

    if (!event) {
      return NextResponse.json(
        { success: false, message: "Evento requerido." },
        { status: 400 }
      );
    }

    const now = new Date();

    const streaming = await prisma.portalStreaming.findMany({
      where: {
        event,
        status: "active",
      },
      orderBy: { createdAt: "desc" }
    });

    // Filtramos programáticamente para manejar la lógica de recurrencia
    const activeStreaming = streaming.filter(s => {
      const nowTime = now.getTime();

      // Caso 1: No es recurrente (Lógica estándar de una sola vez)
      if (!(s as any).isRecurring) {
        const startsMatch = !s.startsAt || new Date(s.startsAt).getTime() <= nowTime;
        const expiresMatch = !s.expiresAt || new Date(s.expiresAt).getTime() >= nowTime;
        return startsMatch && expiresMatch;
      }

      // Caso 2: Es recurrente (Daily/Weekly)
      // Validamos primero si estamos dentro del rango global de fechas (si existen)
      if (s.startsAt && new Date(s.startsAt).getTime() > nowTime) return false;
      // Si hay fecha de expiración, es el fin de la recurrencia
      if (s.expiresAt && new Date(s.expiresAt).getTime() < nowTime) return false;

      // Validamos la ventana de tiempo del día (Hora inicio - Hora fin)
      if (s.startsAt && s.expiresAt) {
        const start = new Date(s.startsAt);
        const end = new Date(s.expiresAt);
        
        const currentMinutes = now.getHours() * 60 + now.getMinutes();
        const startMinutes = start.getHours() * 60 + start.getMinutes();
        const endMinutes = end.getHours() * 60 + end.getMinutes();

        // Si la hora actual no está en el rango de minutos del día, no está activo
        if (currentMinutes < startMinutes || currentMinutes > endMinutes) return false;
      }

      // Aquí podrías añadir lógica de intervalo (cada X días), por ahora es "Siempre en esa ventana"
      return true;
    });

    return NextResponse.json({ success: true, data: activeStreaming });
  } catch (error) {
    console.error("[PORTAL_STREAMING_GET]", error);
    return NextResponse.json(
      { success: false, message: "Error al obtener contenido de streaming." },
      { status: 500 }
    );
  }
}
