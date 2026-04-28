import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      event, 
      senderName, 
      senderRole, 
      subject, 
      content, 
      recipients 
    } = body;

    if (!event || !subject || !content || !senderName) {
      return NextResponse.json(
        { success: false, message: "Campos obligatorios faltantes (event, subject, content, senderName)." },
        { status: 400 }
      );
    }

    // Simple preview: first 100 characters
    const preview = content.replace(/<[^>]*>?/gm, '').substring(0, 100) + "...";

    const message = await prisma.portalMessage.create({
      data: {
        event,
        senderName,
        senderRole: senderRole || "Administrador",
        subject,
        content,
        preview,
        recipients: recipients || [],
        readBy: []
      }
    });

    return NextResponse.json({ success: true, data: message });
  } catch (error) {
    console.error("[ADMIN_MESSAGES_POST]", error);
    return NextResponse.json(
      { success: false, message: "Error al crear el mensaje." },
      { status: 500 }
    );
  }
}

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

    const messages = await prisma.portalMessage.findMany({
      where: { event },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json({ success: true, data: messages });
  } catch (error) {
    console.error("[ADMIN_MESSAGES_GET]", error);
    return NextResponse.json(
      { success: false, message: "Error al obtener los mensajes." },
      { status: 500 }
    );
  }
}
