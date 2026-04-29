import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const event = url.searchParams.get("event")?.toUpperCase();

    if (!event) {
      return NextResponse.json(
        { success: false, message: "Evento requerido." },
        { status: 400 }
      );
    }

    const [sponsors, categories] = await Promise.all([
      prisma.portalSponsor.findMany({
        where: { 
          event: {
            equals: event,
            mode: 'insensitive'
          }
        },
        orderBy: { order: "asc" }
      }),
      prisma.sponsorCategory.findMany({
        where: { 
          event: {
            equals: event,
            mode: 'insensitive'
          }
        },
        orderBy: { order: "asc" }
      })
    ]);

    return NextResponse.json({ 
      success: true, 
      data: sponsors,
      categories: categories
    });
  } catch (error) {
    console.error("[PORTAL_SPONSORS_GET]", error);
    return NextResponse.json(
      { success: false, message: "Error al obtener los auspiciadores." },
      { status: 500 }
    );
  }
}
