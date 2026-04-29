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

    const categories = await prisma.sponsorCategory.findMany({
      where: { 
        event: {
          equals: event,
          mode: 'insensitive'
        }
      },
      orderBy: { order: "asc" }
    });

    return NextResponse.json({ success: true, data: categories });
  } catch (error) {
    console.error("[ADMIN_SPONSOR_CATEGORIES_GET]", error);
    return NextResponse.json(
      { success: false, message: "Error al obtener las categorías." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const { ip, userAgent } = getClientInfo(req);
  const admin = getAdminInfo(req);

  try {
    const body = await req.json();
    const { name, event, order } = body;

    if (!name || !event) {
      return NextResponse.json(
        { success: false, message: "Campos obligatorios faltantes." },
        { status: 400 }
      );
    }

    const category = await prisma.sponsorCategory.create({
      data: {
        name: name.toUpperCase(),
        event: event.toUpperCase(),
        order: order || 0
      }
    });

    await logActivity({
      userId: admin.id,
      userEmail: admin.email,
      userName: admin.name,
      action: "CREATE_SPONSOR_CATEGORY",
      module: "SPONSORS",
      details: `Categoría de auspiciador creada: "${name}" para el evento ${event}`,
      ip,
      userAgent
    });

    return NextResponse.json({ success: true, data: category });
  } catch (error) {
    console.error("[ADMIN_SPONSOR_CATEGORIES_POST]", error);
    return NextResponse.json(
      { success: false, message: "Error al crear la categoría." },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  const { ip, userAgent } = getClientInfo(req);
  const admin = getAdminInfo(req);

  try {
    const body = await req.json();
    const { id, name, order } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, message: "ID requerido." },
        { status: 400 }
      );
    }

    const updated = await prisma.sponsorCategory.update({
      where: { id },
      data: {
        name: name?.toUpperCase(),
        order
      }
    });

    await logActivity({
      userId: admin.id,
      userEmail: admin.email,
      userName: admin.name,
      action: "UPDATE_SPONSOR_CATEGORY",
      module: "SPONSORS",
      details: `Categoría de auspiciador actualizada: "${name || updated.name}"`,
      ip,
      userAgent
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("[ADMIN_SPONSOR_CATEGORIES_PATCH]", error);
    return NextResponse.json(
      { success: false, message: "Error al actualizar la categoría." },
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

    const category = await prisma.sponsorCategory.findUnique({
      where: { id },
      select: { name: true }
    });

    await prisma.sponsorCategory.delete({
      where: { id }
    });

    await logActivity({
      userId: admin.id,
      userEmail: admin.email,
      userName: admin.name,
      action: "DELETE_SPONSOR_CATEGORY",
      module: "SPONSORS",
      details: `Categoría de auspiciador eliminada: "${category?.name || id}"`,
      ip,
      userAgent
    });

    return NextResponse.json({ success: true, message: "Categoría eliminada." });
  } catch (error) {
    console.error("[ADMIN_SPONSOR_CATEGORIES_DELETE]", error);
    return NextResponse.json(
      { success: false, message: "Error al eliminar la categoría." },
      { status: 500 }
    );
  }
}
