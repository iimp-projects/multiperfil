import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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

    const now = new Date();

    const streaming = await prisma.portalStreaming.findMany({
      where: {
        event,
        status: "active",
        AND: [
          { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
          { OR: [{ expiresAt: null }, { expiresAt: { gte: now } }] }
        ]
      },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json({ success: true, data: streaming });
  } catch (error) {
    console.error("[PORTAL_STREAMING_GET]", error);
    return NextResponse.json(
      { success: false, message: "Error al obtener contenido de streaming." },
      { status: 500 }
    );
  }
}
