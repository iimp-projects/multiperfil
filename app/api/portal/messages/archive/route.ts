import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messageId, userKey, undo } = body;

    if (!messageId || !userKey) {
      return NextResponse.json(
        { success: false, message: "messageId y userKey requeridos." },
        { status: 400 }
      );
    }

    if (undo) {
      const current = await prisma.portalMessage.findUnique({
        where: { id: messageId },
        select: { archivedBy: true },
      });
      const currentList = current?.archivedBy ?? [];
      await prisma.portalMessage.update({
        where: { id: messageId },
        data: { archivedBy: { set: currentList.filter((k) => k !== userKey) } },
      });
    } else {
      await prisma.portalMessage.update({
        where: { id: messageId },
        data: { archivedBy: { push: userKey } },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[PORTAL_MESSAGES_ARCHIVE_POST]", error);
    return NextResponse.json(
      { success: false, message: "Error al archivar mensaje" },
      { status: 500 }
    );
  }
}
