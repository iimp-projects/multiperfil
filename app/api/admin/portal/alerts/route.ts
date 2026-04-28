import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      event, 
      type, 
      variant, 
      category, 
      title, 
      description, 
      longDescription, 
      actionText, 
      actionUrl, 
      target,
      imageUrl, 
      htmlContent,
      recipients 
    } = body;

    if (!event || !title || !type || !category) {
      return NextResponse.json(
        { success: false, message: "Campos obligatorios faltantes (event, title, type, category)." },
        { status: 400 }
      );
    }

    const alert = await prisma.portalAlert.create({
      data: {
        event,
        type,
        variant,
        category,
        title,
        description,
        longDescription,
        actionText,
        actionUrl,
        target,
        imageUrl,
        htmlContent,
        recipients: recipients || [],
        readBy: []
      }
    });

    return NextResponse.json({ success: true, data: alert });
  } catch (error) {
    console.error("[ADMIN_ALERTS_POST]", error);
    return NextResponse.json(
      { success: false, message: "Error al crear la alerta." },
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

    const alerts = await prisma.portalAlert.findMany({
      where: { event },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json({ success: true, data: alerts });
  } catch (error) {
    console.error("[ADMIN_ALERTS_GET]", error);
    return NextResponse.json(
      { success: false, message: "Error al obtener las alertas." },
      { status: 500 }
    );
  }
}
