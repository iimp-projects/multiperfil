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
      type, 
      variant, 
      category, 
      title, 
      description, 
      longDescription, 
      actionText, 
      actionUrl, 
      target,
      imageUrl, 
      htmlContent,
      recipients 
    } = body;

    if (!event || !title || !type || !category) {
      return NextResponse.json(
        { success: false, message: "Campos obligatorios faltantes (event, title, type, category)." },
        { status: 400 }
      );
    }

    const alert = await prisma.portalAlert.create({
      data: {
        event,
        type,
        variant,
        category,
        title,
        description,
        longDescription,
        actionText,
        actionUrl,
        target,
        imageUrl,
        htmlContent,
        recipients: recipients || [],
        readBy: []
      }
    });

    // Registro en Auditoría
    await logActivity({
      userId: admin.id,
      userEmail: admin.email,
      userName: admin.name,
      action: "CREATE_ALERT",
      module: "PORTAL_ALERTS",
      details: `Alerta creada: "${title}" para el evento ${event}`,
      ip,
      userAgent
    });

    return NextResponse.json({ success: true, data: alert });
  } catch (error) {
    console.error("[ADMIN_ALERTS_POST]", error);
    return NextResponse.json(
      { success: false, message: "Error al crear la alerta." },
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

    const alerts = await prisma.portalAlert.findMany({
      where: { event },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json({ success: true, data: alerts });
  } catch (error) {
    console.error("[ADMIN_ALERTS_GET]", error);
    return NextResponse.json(
      { success: false, message: "Error al obtener las alertas." },
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
        { success: false, message: "ID de alerta requerido." },
        { status: 400 }
      );
    }

    await prisma.portalAlert.delete({
      where: { id }
    });

    // Registro en Auditoría
    const { ip, userAgent } = getClientInfo(req);
    const admin = getAdminInfo(req);
    await logActivity({
      userId: admin.id,
      userEmail: admin.email,
      userName: admin.name,
      action: "DELETE_ALERT",
      module: "PORTAL_ALERTS",
      details: `Alerta eliminada ID: ${id}`,
      ip,
      userAgent
    });

    return NextResponse.json({ success: true, message: "Alerta eliminada correctamente." });
  } catch (error) {
    console.error("[ADMIN_ALERTS_DELETE]", error);
    return NextResponse.json(
      { success: false, message: "Error al eliminar la alerta." },
      { status: 500 }
    );
  }
}
