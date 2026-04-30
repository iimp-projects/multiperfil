import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/audit";
import { getClientInfo, getAdminInfo } from "@/lib/utils/request";

export async function POST(req: NextRequest) {
  const { ip, userAgent } = getClientInfo(req);
  const admin = getAdminInfo(req);

  try {
    const body = await req.json();
    const {
      title,
      description,
      timeRange,
      location,
      tabId,
      order,
      color,
      image,
    } = body;

    if (!tabId || !timeRange) {
      return NextResponse.json(
        { success: false, message: "Horario y tabId requeridos." },
        { status: 400 },
      );
    }

    const session = await prisma.portalProgramSession.create({
      data: {
        title,
        description,
        timeRange,
        location,
        image,
        tabId,
        color,
        order: order || 0
      }
    });

    await logActivity({
      userId: admin.id,
      userEmail: admin.email,
      userName: admin.name,
      action: "CREATE_SESSION",
      module: "PROGRAMS",
      details: `Sesión creada: "${title || timeRange}"`,
      ip,
      userAgent
    });

    return NextResponse.json({ success: true, data: session });
  } catch (error) {
    console.error("[ADMIN_SESSIONS_POST]", error);
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

    const session = await prisma.portalProgramSession.findUnique({ where: { id } });
    await prisma.portalProgramSession.delete({ where: { id } });

    await logActivity({
      userId: admin.id,
      userEmail: admin.email,
      userName: admin.name,
      action: "DELETE_SESSION",
      module: "PROGRAMS",
      details: `Sesión eliminada: "${session?.title || id}"`,
      ip,
      userAgent
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, message: "Error." }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const { ip, userAgent } = getClientInfo(req);
  const admin = getAdminInfo(req);

  try {
    const body = await req.json();
    const { id, title, description, timeRange, location, order, color, image } = body;

    if (!id) return NextResponse.json({ success: false, message: "ID requerido." }, { status: 400 });

    const session = await prisma.portalProgramSession.update({
      where: { id },
      data: {
        title,
        description,
        timeRange,
        location,
        image,
        color,
        order: order !== undefined ? Number(order) : undefined
      }
    });

    await logActivity({
      userId: admin.id,
      userEmail: admin.email,
      userName: admin.name,
      action: "UPDATE_SESSION",
      module: "PROGRAMS",
      details: `Sesión actualizada: "${title || timeRange}"`,
      ip,
      userAgent
    });

    return NextResponse.json({ success: true, data: session });
  } catch (error) {
    console.error("[ADMIN_SESSIONS_PATCH]", error);
    return NextResponse.json({ success: false, message: "Error." }, { status: 500 });
  }
}
