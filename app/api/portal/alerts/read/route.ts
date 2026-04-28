import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { alertId, userKey, all, event } = await req.json();

    if (all && event && userKey) {
      // Mark all alerts for this event as read by this user
      await prisma.portalAlert.updateMany({
        where: {
          event,
          OR: [
            { recipients: { isEmpty: true } },
            { recipients: { has: userKey } }
          ],
          NOT: { readBy: { has: userKey } }
        },
        data: {
          readBy: {
            push: userKey
          }
        }
      });
      return NextResponse.json({ success: true });
    }

    if (!alertId || !userKey) {
      return NextResponse.json({ success: false, message: "alertId y userKey son requeridos" }, { status: 400 });
    }

    await prisma.portalAlert.update({
      where: { id: alertId },
      data: {
        readBy: {
          push: userKey
        }
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[ALERTS_READ_POST]", error);
    return NextResponse.json({ success: false, message: "Error al marcar como leído" }, { status: 500 });
  }
}
