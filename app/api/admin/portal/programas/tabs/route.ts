import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/audit";
import { getClientInfo, getAdminInfo } from "@/lib/utils/request";

export async function POST(req: NextRequest) {
  const { ip, userAgent } = getClientInfo(req);
  const admin = getAdminInfo(req);

  try {
    const body = await req.json();
    const { title, programId, order, dateTitle, dateNumber, color } = body;

    if (!title || !programId) {
      return NextResponse.json({ success: false, message: "Título y programId requeridos." }, { status: 400 });
    }

    const tab = await prisma.portalProgramTab.create({
      data: {
        label: title,
        programId,
        dateTitle,
        dateNumber,
        color,
        order: order || 0
      }
    });

    await logActivity({
      userId: admin.id,
      userEmail: admin.email,
      userName: admin.name,
      action: "CREATE_TAB",
      module: "PROGRAMS",
      details: `Pestaña creada: "${title}"`,
      ip,
      userAgent
    });

    return NextResponse.json({ success: true, data: tab });
  } catch (error) {
    console.error("[ADMIN_TABS_POST]", error);
    return NextResponse.json({ success: false, message: "Error." }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const { ip, userAgent } = getClientInfo(req);
  const admin = getAdminInfo(req);

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) return NextResponse.json({ success: false, message: "ID requerido." }, { status: 400 });

    const tab = await prisma.portalProgramTab.findUnique({ where: { id } });
    await prisma.portalProgramTab.delete({ where: { id } });

    await logActivity({
      userId: admin.id,
      userEmail: admin.email,
      userName: admin.name,
      action: "DELETE_TAB",
      module: "PROGRAMS",
      details: `Pestaña eliminada: "${tab?.label || id}"`,
      ip,
      userAgent
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, message: "Error." }, { status: 500 });
  }
}
