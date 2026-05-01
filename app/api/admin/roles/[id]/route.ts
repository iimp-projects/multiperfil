import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/audit";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { name, permissions } = body;

    const role = await prisma.adminRole.update({
      where: { id },
      data: { name, permissions }
    });

    await logActivity({
      action: "GENERIC_ACTION",
      module: "ROLES",
      details: `Se actualizó el rol ${name}.`,
    });

    return NextResponse.json(role);
  } catch (error) {
    console.error("[ADMIN_ROLES_PUT]", error);
    return NextResponse.json({ error: "Error al actualizar rol" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Check if any user is using this role
    const role = await prisma.adminRole.findUnique({ where: { id } });
    if (role) {
      const usersWithRole = await prisma.adminUser.count({
        where: { role: role.name }
      });
      if (usersWithRole > 0) {
        return NextResponse.json({ error: "No se puede eliminar un rol asignado a usuarios" }, { status: 400 });
      }
    }

    await prisma.adminRole.delete({ where: { id } });

    await logActivity({
      action: "GENERIC_ACTION",
      module: "ROLES",
      details: `Se eliminó el rol con ID ${id}.`,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[ADMIN_ROLES_DELETE]", error);
    return NextResponse.json({ error: "Error al eliminar rol" }, { status: 500 });
  }
}
