import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // TODO: En un sistema real, aquí validaríamos que el usuario sea un Admin real mediante cookies/tokens
    
    const logs = await prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 500, // Limitamos a los últimos 500 para performance
    });

    return NextResponse.json({ success: true, data: logs });
  } catch (error) {
    console.error("[ADMIN_LOGS_GET]", error);
    return NextResponse.json(
      { success: false, message: "Error al obtener los logs." },
      { status: 500 }
    );
  }
}
