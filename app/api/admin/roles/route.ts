import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/audit";

export async function GET() {
  try {
    const roles = await prisma.adminRole.findMany({
      orderBy: { createdAt: "desc" }
    });
    return NextResponse.json(roles);
  } catch (error) {
    console.error("[ADMIN_ROLES_GET]", error);
    return NextResponse.json({ error: "Error al obtener roles" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, permissions } = body;

    if (!name) {
      return NextResponse.json({ error: "El nombre es requerido" }, { status: 400 });
    }

    const role = await prisma.adminRole.create({
      data: { name, permissions: permissions || [] }
    });

    // TODO: Get current admin from token/session if possible for audit
    await logActivity({
      action: "CREATE_USER", // Reusing action for simplicity or create new one
      module: "ROLES",
      details: `Se creó el rol ${name} con ${permissions?.length || 0} permisos.`,
    });

    return NextResponse.json(role);
  } catch (error) {
    console.error("[ADMIN_ROLES_POST]", error);
    return NextResponse.json({ error: "Error al crear rol" }, { status: 500 });
  }
}
