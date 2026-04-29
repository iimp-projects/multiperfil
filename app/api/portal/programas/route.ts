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

    const programs = await prisma.portalProgram.findMany({
      where: { 
        event: {
          equals: event,
          mode: 'insensitive'
        }
      },
      include: {
        tabs: {
          include: {
            sessions: {
              orderBy: { order: "asc" }
            }
          },
          orderBy: { order: "asc" }
        }
      },
      orderBy: { order: "asc" }
    });

    const formattedPrograms = programs.map(program => ({
      ...program,
      tabs: program.tabs.map(tab => ({
        ...tab,
        title: tab.label
      }))
    }));

    return NextResponse.json({ success: true, data: formattedPrograms });
  } catch (error) {
    console.error("[PORTAL_PROGRAMAS_GET]", error);
    return NextResponse.json(
      { success: false, message: "Error al obtener los programas." },
      { status: 500 }
    );
  }
}
