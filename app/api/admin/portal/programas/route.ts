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

    const programs = await prisma.portalProgram.findMany({
      where: { 
        event: event,
      },
      include: {
        _count: {
          select: { tabs: true }
        }
      },
      orderBy: { order: "asc" }
    });

    return NextResponse.json({ success: true, data: programs });
  } catch (error) {
    console.error("[ADMIN_PROGRAMS_GET]", error);
    return NextResponse.json(
      { success: false, message: "Error al obtener los programas." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const { ip, userAgent } = getClientInfo(req);
  const admin = getAdminInfo(req);

  try {
    const body = await req.json();
    const { title, description, coverImage, event, order, primaryColor, secondaryColor, tertiaryColor, brochureUrl } = body;

    if (!title || !event) {
      return NextResponse.json(
        { success: false, message: "Título y evento requeridos." },
        { status: 400 }
      );
    }

    const program = await prisma.portalProgram.create({
      data: {
        title,
        description,
        coverImage,
        event: event.toUpperCase(),
        order: order || 0,
        primaryColor: primaryColor || "#000000",
        secondaryColor: secondaryColor || "#FFFFFF",
        tertiaryColor: tertiaryColor || "#EAB308",
        brochureUrl
      }
    });

    await logActivity({
      userId: admin.id,
      userEmail: admin.email,
      userName: admin.name,
      action: "CREATE_PROGRAM",
      module: "PROGRAMS",
      details: `Programa creado: "${title}" para el evento ${event}`,
      ip,
      userAgent
    });

    return NextResponse.json({ success: true, data: program });
  } catch (error) {
    console.error("[ADMIN_PROGRAMS_POST]", error);
    return NextResponse.json(
      { success: false, message: "Error al crear el programa." },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  const { ip, userAgent } = getClientInfo(req);
  const admin = getAdminInfo(req);

  try {
    const body = await req.json();
    const { id, title, description, coverImage, order, primaryColor, secondaryColor, tertiaryColor, brochureUrl } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, message: "ID requerido." },
        { status: 400 }
      );
    }

    const updated = await prisma.portalProgram.update({
      where: { id },
      data: {
        title,
        description,
        coverImage,
        order,
        primaryColor,
        secondaryColor,
        tertiaryColor,
        brochureUrl
      }
    });

    await logActivity({
      userId: admin.id,
      userEmail: admin.email,
      userName: admin.name,
      action: "UPDATE_PROGRAM",
      module: "PROGRAMS",
      details: `Programa actualizado: "${title || updated.title}"`,
      ip,
      userAgent
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("[ADMIN_PROGRAMS_PATCH]", error);
    return NextResponse.json(
      { success: false, message: "Error al actualizar el programa." },
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

    const program = await prisma.portalProgram.findUnique({
      where: { id },
      select: { title: true }
    });

    await prisma.portalProgram.delete({
      where: { id }
    });

    await logActivity({
      userId: admin.id,
      userEmail: admin.email,
      userName: admin.name,
      action: "DELETE_PROGRAM",
      module: "PROGRAMS",
      details: `Programa eliminado: "${program?.title || id}"`,
      ip,
      userAgent
    });

    return NextResponse.json({ success: true, message: "Programa eliminado." });
  } catch (error) {
    console.error("[ADMIN_PROGRAMS_DELETE]", error);
    return NextResponse.json(
      { success: false, message: "Error al eliminar el programa." },
      { status: 500 }
    );
  }
}
