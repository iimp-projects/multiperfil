import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const program = await prisma.portalProgram.findUnique({
      where: { id },
      include: {
        tabs: {
          include: {
            sessions: {
              orderBy: { order: "asc" }
            }
          },
          orderBy: { order: "asc" }
        }
      }
    });

    if (!program) {
      return NextResponse.json(
        { success: false, message: "Programa no encontrado." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: program });
  } catch (error) {
    console.error("[PORTAL_PROGRAM_DETAIL_GET]", error);
    return NextResponse.json(
      { success: false, message: "Error al obtener detalles del programa." },
      { status: 500 }
    );
  }
}
