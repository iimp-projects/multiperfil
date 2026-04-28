import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const event = url.searchParams.get("event");
    const userKey = url.searchParams.get("userKey");

    if (!event) {
      return NextResponse.json(
        { success: false, message: "Evento requerido." },
        { status: 400 }
      );
    }

    // Buscamos alertas que:
    // 1. Sean para este evento.
    // 2. Sean globales (recipients vacío) O estén dirigidas específicamente a este usuario.
    const alerts = await prisma.portalAlert.findMany({
      where: {
        event,
        OR: [
          { recipients: { isEmpty: true } }, // Globales (recipients vacío)
          ...(userKey ? [{ recipients: { has: userKey } }] : []), // Específicas
        ],
        NOT: userKey ? { deletedBy: { has: userKey } } : undefined
      },
      orderBy: { createdAt: "desc" }
    });

    // Mapeamos al formato que espera el frontend (AppNotification)
    const formattedAlerts = alerts.map(alert => ({
      id: alert.id,
      type: alert.type,
      variant: alert.variant,
      category: alert.category,
      title: alert.title,
      description: alert.description,
      longDescription: alert.longDescription,
      actionText: alert.actionText,
      actionUrl: alert.actionUrl,
      target: alert.target,
      imageUrl: alert.imageUrl,
      htmlContent: alert.htmlContent,
      date: alert.createdAt.toISOString(),
      isRead: userKey ? alert.readBy.includes(userKey) : false,
    }));

    return NextResponse.json({
      success: true,
      data: formattedAlerts,
    });
  } catch (error) {
    console.error("[PORTAL_ALERTS_GET]", error);
    return NextResponse.json(
      { success: false, message: "Error al obtener alertas" },
      { status: 500 }
    );
  }
}
