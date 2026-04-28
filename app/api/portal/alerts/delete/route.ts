import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { alertId, userKey } = await req.json();

    if (!alertId || !userKey) {
      return NextResponse.json(
        { success: false, message: "ID de alerta y userKey requeridos." },
        { status: 400 }
      );
    }

    await prisma.portalAlert.update({
      where: { id: alertId },
      data: { deletedBy: { push: userKey } },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[PORTAL_ALERTS_DELETE_POST]", error);
    return NextResponse.json(
      { success: false, message: "Error al eliminar la alerta" },
      { status: 500 }
    );
  }
}
