import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/audit";
import { getClientInfo, getAdminInfo } from "@/lib/utils/request";

export async function POST(req: NextRequest) {
  const { ip, userAgent } = getClientInfo(req);
  const admin = getAdminInfo(req);
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

    // Registro en Auditoría
    await logActivity({
      userId: admin.id,
      userEmail: admin.email,
      userName: admin.name,
      action: "CREATE_MESSAGE",
      module: "PORTAL_MESSAGES",
      details: `Mensaje creado: "${subject}" para el evento ${event}`,
      ip,
      userAgent
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

export async function DELETE(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, message: "ID de mensaje requerido." },
        { status: 400 }
      );
    }

    await prisma.portalMessage.delete({
      where: { id }
    });

    // Registro en Auditoría
    const { ip, userAgent } = getClientInfo(req);
    const admin = getAdminInfo(req);
    await logActivity({
      userId: admin.id,
      userEmail: admin.email,
      userName: admin.name,
      action: "DELETE_MESSAGE",
      module: "PORTAL_MESSAGES",
      details: `Mensaje eliminado ID: ${id}`,
      ip,
      userAgent
    });

    return NextResponse.json({ success: true, message: "Mensaje eliminado correctamente." });
  } catch (error) {
    console.error("[ADMIN_MESSAGES_DELETE]", error);
    return NextResponse.json(
      { success: false, message: "Error al eliminar el mensaje." },
      { status: 500 }
    );
  }
}
