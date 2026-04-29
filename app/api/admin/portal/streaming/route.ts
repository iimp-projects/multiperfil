import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      event, 
      title, 
      description, 
      vimeoId, 
      url, 
      status, 
      startsAt, 
      expiresAt, 
      recipients 
    } = body;

    if (!event || !title) {
      return NextResponse.json(
        { success: false, message: "Campos obligatorios faltantes (event, title)." },
        { status: 400 }
      );
    }

    const streaming = await prisma.portalStreaming.create({
      data: {
        event: event.toUpperCase(),
        title,
        description,
        vimeoId,
        url,
        status: status || "active",
        startsAt: startsAt ? new Date(startsAt) : null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        recipients: recipients || []
      }
    });

    return NextResponse.json({ success: true, data: streaming });
  } catch (error) {
    console.error("[ADMIN_STREAMING_POST]", error);
    return NextResponse.json(
      { success: false, message: "Error al crear el contenido de streaming." },
      { status: 500 }
    );
  }
}

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

    const streamingList = await prisma.portalStreaming.findMany({
      where: { 
        event: {
          equals: event,
          mode: 'insensitive' // Búsqueda insensible a mayúsculas para mayor seguridad
        }
      },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json({ success: true, data: streamingList });
  } catch (error) {
    console.error("[ADMIN_STREAMING_GET]", error);
    return NextResponse.json(
      { success: false, message: "Error al obtener los streamings." },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      id, 
      event, 
      title, 
      description, 
      vimeoId, 
      url, 
      status, 
      startsAt, 
      expiresAt, 
      recipients 
    } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, message: "ID requerido para actualización." },
        { status: 400 }
      );
    }

    const updated = await prisma.portalStreaming.update({
      where: { id },
      data: {
        event: event?.toUpperCase(),
        title,
        description,
        vimeoId,
        url,
        status,
        startsAt: startsAt ? new Date(startsAt) : undefined,
        expiresAt: expiresAt ? new Date(expiresAt) : undefined,
        recipients
      }
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("[ADMIN_STREAMING_PATCH]", error);
    return NextResponse.json(
      { success: false, message: "Error al actualizar el contenido." },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, message: "ID requerido para eliminación." },
        { status: 400 }
      );
    }

    await prisma.portalStreaming.delete({
      where: { id }
    });

    return NextResponse.json({ success: true, message: "Streaming eliminado." });
  } catch (error) {
    console.error("[ADMIN_STREAMING_DELETE]", error);
    return NextResponse.json(
      { success: false, message: "Error al eliminar el contenido." },
      { status: 500 }
    );
  }
}
