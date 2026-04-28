import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messageId, userKey, permanent } = body;

    if (!messageId || !userKey) {
      return NextResponse.json(
        { success: false, message: "messageId y userKey requeridos." },
        { status: 400 }
      );
    }

    if (permanent) {
      const current = await prisma.portalMessage.findUnique({
        where: { id: messageId },
        select: { recipients: true },
      });
      const currentRecipients = current?.recipients ?? [];
      await prisma.portalMessage.update({
        where: { id: messageId },
        data: { recipients: { set: currentRecipients.filter((k) => k !== userKey) } },
      });
    } else {
      await prisma.portalMessage.update({
        where: { id: messageId },
        data: { deletedBy: { push: userKey } },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[PORTAL_MESSAGES_DELETE_POST]", error);
    return NextResponse.json(
      { success: false, message: "Error al eliminar mensaje" },
      { status: 500 }
    );
  }
}
