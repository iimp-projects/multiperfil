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

    const messages = await prisma.portalMessage.findMany({
      where: {
        event,
        OR: [
          { recipients: { isEmpty: true } },
          ...(userKey ? [{ recipients: { has: userKey } }] : []),
        ],
      },
      orderBy: { createdAt: "desc" }
    });

    const formattedMessages = messages.map((msg) => ({
      id: msg.id,
      sender: msg.senderName,
      senderRole: msg.senderRole,
      subject: msg.subject,
      preview: msg.preview,
      content: msg.content,
      date: msg.createdAt.toISOString().split("T")[0],
      time: msg.createdAt.toISOString().split("T")[1].substring(0, 5),
      isRead: userKey ? msg.readBy.includes(userKey) : false,
      isArchived: userKey ? msg.archivedBy.includes(userKey) : false,
      isDeleted: userKey ? msg.deletedBy.includes(userKey) : false,
    }));

    return NextResponse.json({
      success: true,
      data: formattedMessages,
    });
  } catch (error) {
    console.error("[PORTAL_MESSAGES_GET]", error);
    return NextResponse.json(
      { success: false, message: "Error al obtener mensajes" },
      { status: 500 }
    );
  }
}
