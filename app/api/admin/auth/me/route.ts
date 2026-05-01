import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const adminId = req.headers.get("x-admin-id");

    if (!adminId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const admin = await prisma.adminUser.findUnique({
      where: { id: adminId }
    });

    if (!admin) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    // Buscar permisos actualizados
    const roleData = await prisma.adminRole.findFirst({
      where: { 
        name: { equals: admin.role, mode: 'insensitive' }
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
        permissions: roleData?.permissions || []
      }
    });
  } catch (error) {
    console.error("[ADMIN_AUTH_ME]", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
