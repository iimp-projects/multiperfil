import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/audit";
import { getClientInfo, getAdminInfo } from "@/lib/utils/request";

export async function POST(req: NextRequest) {
  const { ip, userAgent } = getClientInfo(req);
  const admin = getAdminInfo(req);

  try {
    const body = await req.json();
    const { name, description, event, userKeys } = body;

    if (!name || !event) {
      return NextResponse.json(
        { success: false, message: "Nombre y evento son requeridos." },
        { status: 400 }
      );
    }

    const group = await prisma.recipientGroup.create({
      data: {
        name,
        description,
        event,
        userKeys: userKeys || []
      }
    });

    // Registro en Auditoría
    await logActivity({
      userId: admin.id,
      userEmail: admin.email,
      userName: admin.name,
      action: "GENERIC_ACTION", // Podríamos añadir CREATE_GROUP a AuditAction
      module: "RECIPIENTS",
      details: `Grupo creado: "${name}" para el evento ${event} (${userKeys?.length || 0} usuarios)`,
      ip,
      userAgent
    });

    return NextResponse.json({ success: true, data: group });
  } catch (error) {
    console.error("[ADMIN_GROUPS_POST]", error);
    return NextResponse.json(
      { success: false, message: "Error al crear el grupo." },
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

    const groups = await prisma.recipientGroup.findMany({
      where: { event },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json({ success: true, data: groups });
  } catch (error) {
    console.error("[ADMIN_GROUPS_GET]", error);
    return NextResponse.json(
      { success: false, message: "Error al obtener los grupos." },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const { ip, userAgent } = getClientInfo(req);
  const admin = getAdminInfo(req);
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json(
      { success: false, message: "ID requerido." },
      { status: 400 }
    );
  }

  try {
    const group = await prisma.recipientGroup.findUnique({
      where: { id },
      select: { name: true, event: true }
    });

    if (!group) {
      return NextResponse.json(
        { success: false, message: "Grupo no encontrado." },
        { status: 404 }
      );
    }

    await prisma.recipientGroup.delete({
      where: { id }
    });

    // Registro en Auditoría
    await logActivity({
      userId: admin.id,
      userEmail: admin.email,
      userName: admin.name,
      action: "GENERIC_ACTION",
      module: "RECIPIENTS",
      details: `Grupo eliminado: "${group.name}" del evento ${group.event}`,
      ip,
      userAgent
    });

    return NextResponse.json({ success: true, message: "Grupo eliminado." });
  } catch (error) {
    console.error("[ADMIN_GROUPS_DELETE]", error);
    return NextResponse.json(
      { success: false, message: "Error al eliminar el grupo." },
      { status: 500 }
    );
  }
}
