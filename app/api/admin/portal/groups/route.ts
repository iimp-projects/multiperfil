import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
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
