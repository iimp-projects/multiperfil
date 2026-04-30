import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/audit";
import { getClientInfo, getAdminInfo } from "@/lib/utils/request";

export async function PATCH(req: NextRequest) {
  const { ip, userAgent } = getClientInfo(req);
  const admin = getAdminInfo(req);

  try {
    const body = await req.json();
    const { sessions } = body; // Array of { id: string, order: number }

    if (!Array.isArray(sessions)) {
      return NextResponse.json(
        { success: false, message: "Sesiones requeridas." },
        { status: 400 },
      );
    }

    // Using a transaction for batch update
    await prisma.$transaction(
      sessions.map((s: { id: string; order: number }) =>
        prisma.portalProgramSession.update({
          where: { id: s.id },
          data: { order: s.order },
        })
      )
    );

    await logActivity({
      userId: admin.id,
      userEmail: admin.email,
      userName: admin.name,
      action: "UPDATE_SESSION",
      module: "PROGRAMS",
      details: `Orden de sesiones actualizado (${sessions.length} items)`,
      ip,
      userAgent
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[ADMIN_SESSIONS_REORDER_PATCH]", error);
    return NextResponse.json({ success: false, message: "Error." }, { status: 500 });
  }
}
