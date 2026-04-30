import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/audit";
import { getClientInfo, getAdminInfo } from "@/lib/utils/request";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const event = searchParams.get("event")?.trim().toUpperCase();

    if (!event) {
      return NextResponse.json(
        { success: false, message: "Evento requerido." },
        { status: 400 }
      );
    }

    const sponsors = await prisma.portalSponsor.findMany({
      where: { 
        event: event,
      },
      orderBy: [
        { category: "asc" },
        { order: "asc" }
      ]
    });

    return NextResponse.json({ success: true, data: sponsors });
  } catch (error) {
    console.error("[ADMIN_SPONSORS_GET]", error);
    return NextResponse.json(
      { success: false, message: "Error al obtener los auspiciadores." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const { ip, userAgent } = getClientInfo(req);
  const admin = getAdminInfo(req);

  try {
    const body = await req.json();
    const { name, logoUrl, category, url, event, order } = body;

    if (!name || !logoUrl || !category || !event) {
      return NextResponse.json(
        { success: false, message: "Campos obligatorios faltantes." },
        { status: 400 }
      );
    }

    const sponsor = await prisma.portalSponsor.create({
      data: {
        name,
        logoUrl,
        category: category.toUpperCase(),
        url,
        event: event.toUpperCase(),
        order: order || 0
      }
    });

    await logActivity({
      userId: admin.id,
      userEmail: admin.email,
      userName: admin.name,
      action: "CREATE_SPONSOR",
      module: "SPONSORS",
      details: `Auspiciador creado: "${name}" (${category}) para el evento ${event}`,
      ip,
      userAgent
    });

    return NextResponse.json({ success: true, data: sponsor });
  } catch (error) {
    console.error("[ADMIN_SPONSORS_POST]", error);
    return NextResponse.json(
      { success: false, message: "Error al crear el auspiciador." },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  const { ip, userAgent } = getClientInfo(req);
  const admin = getAdminInfo(req);

  try {
    const body = await req.json();
    const { id, name, logoUrl, category, url, order } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, message: "ID requerido." },
        { status: 400 }
      );
    }

    const updated = await prisma.portalSponsor.update({
      where: { id },
      data: {
        name,
        logoUrl,
        category: category?.toUpperCase(),
        url,
        order
      }
    });

    await logActivity({
      userId: admin.id,
      userEmail: admin.email,
      userName: admin.name,
      action: "UPDATE_SPONSOR",
      module: "SPONSORS",
      details: `Auspiciador actualizado: "${name || updated.name}"`,
      ip,
      userAgent
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("[ADMIN_SPONSORS_PATCH]", error);
    return NextResponse.json(
      { success: false, message: "Error al actualizar el auspiciador." },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const { ip, userAgent } = getClientInfo(req);
  const admin = getAdminInfo(req);

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, message: "ID requerido." },
        { status: 400 }
      );
    }

    const sponsor = await prisma.portalSponsor.findUnique({
      where: { id },
      select: { name: true }
    });

    await prisma.portalSponsor.delete({
      where: { id }
    });

    await logActivity({
      userId: admin.id,
      userEmail: admin.email,
      userName: admin.name,
      action: "DELETE_SPONSOR",
      module: "SPONSORS",
      details: `Auspiciador eliminado: "${sponsor?.name || id}"`,
      ip,
      userAgent
    });

    return NextResponse.json({ success: true, message: "Auspiciador eliminado." });
  } catch (error) {
    console.error("[ADMIN_SPONSORS_DELETE]", error);
    return NextResponse.json(
      { success: false, message: "Error al eliminar el auspiciador." },
      { status: 500 }
    );
  }
}
