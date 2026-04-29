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

    // Get sessions per day for the last 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const sessions = await prisma.userSession.findMany({
      where: { event, createdAt: { gte: sevenDaysAgo } },
      select: { createdAt: true }
    });

    const activityByDay: Record<string, number> = {};
    for (let i = 0; i < 7; i++) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().split('T')[0];
      activityByDay[key] = 0;
    }

    sessions.forEach(s => {
      const key = s.createdAt.toISOString().split('T')[0];
      if (activityByDay[key] !== undefined) {
        activityByDay[key]++;
      }
    });

    const chartData = Object.entries(activityByDay)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Get last 5 messages with read count
    const lastMessages = await prisma.portalMessage.findMany({
      where: { event },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { subject: true, recipients: true, readBy: true }
    });

    const reachData = lastMessages.map(m => ({
      name: m.subject.length > 15 ? m.subject.substring(0, 15) + '...' : m.subject,
      total: m.recipients.length || 100, // placeholder if all
      opened: m.readBy.length
    }));

    return NextResponse.json({
      success: true,
      data: {
        activeUsers: activeSessionsCount,
        messages: messagesCount,
        alerts: alertsCount,
        groups: groupsCount,
        activityChart: chartData,
        reachChart: reachData
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
