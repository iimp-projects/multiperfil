import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { messageId, userKey, all, event } = await req.json();

    if (all && event && userKey) {
      // Mark all messages for this event as read by this user
      await prisma.portalMessage.updateMany({
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

    if (!messageId || !userKey) {
      return NextResponse.json({ success: false, message: "messageId y userKey son requeridos" }, { status: 400 });
    }

    await prisma.portalMessage.update({
      where: { id: messageId },
      data: {
        readBy: {
          push: userKey
        }
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[MESSAGES_READ_POST]", error);
    return NextResponse.json({ success: false, message: "Error al marcar como leído" }, { status: 500 });
  }
}
