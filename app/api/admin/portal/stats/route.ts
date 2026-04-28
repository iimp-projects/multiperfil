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

    // counts
    const [messagesCount, alertsCount, groupsCount, activeSessionsCount] = await Promise.all([
      prisma.portalMessage.count({ where: { event } }),
      prisma.portalAlert.count({ where: { event } }),
      prisma.recipientGroup.count({ where: { event } }),
      prisma.userSession.count({ 
        where: { 
          event,
          lastSeenAt: { gte: new Date(Date.now() - 30 * 60 * 1000) } // Active in last 30 mins
        } 
      })
    ]);

    return NextResponse.json({
      success: true,
      data: {
        activeUsers: activeSessionsCount,
        messages: messagesCount,
        alerts: alertsCount,
        groups: groupsCount
      }
    });
  } catch (error) {
    console.error("[ADMIN_STATS_GET]", error);
    return NextResponse.json(
      { success: false, message: "Error al obtener estadísticas" },
      { status: 500 }
    );
  }
}
