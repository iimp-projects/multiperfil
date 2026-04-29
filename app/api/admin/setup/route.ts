import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { logActivity } from "@/lib/audit";
import { getClientInfo } from "@/lib/utils/request";

/**
 * RUTA DE EMERGENCIA PARA CREACIÓN DE ADMINISTRADORES INICIALES
 * Uso: /api/admin/setup?key=2660260
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const key = searchParams.get("key");

    // Validamos con la llave de emergencia definida en el .env
    if (key !== "2660260") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const admins = [
      {
        email: "admin@multieventos.com",
        password: "admin123",
        name: "Admin Principal",
        role: "admin",
      },
      {
        email: "superadmin@iimp.org.pe",
        password: "Admin@IIMP2026!",
        name: "Super Admin",
        role: "superadmin",
      },
      {
        email: "admin@iimp.org.pe",
        password: "Admin@2026!",
        name: "Admin General",
        role: "admin",
      },
      {
        email: "eventos@iimp.org.pe",
        password: "Eventos@2026!",
        name: "Analista de Eventos",
        role: "analyst",
      },
    ];

    for (const a of admins) {
      await prisma.adminUser.upsert({
        where: { email: a.email },
        update: {},
        create: {
          email: a.email,
          passwordHash: bcrypt.hashSync(a.password, 10),
          name: a.name,
          role: a.role,
        }
      });
    }

    // Registro en Auditoría (Contexto de Sistema ya que no hay admin logueado)
    const { ip, userAgent } = getClientInfo(req);
    await logActivity({
      action: "GENERIC_ACTION",
      module: "SYSTEM",
      details: "Inicialización de administradores del sistema vía setup API",
      ip,
      userAgent
    });

    return NextResponse.json({
      success: true,
      message: "Administradores configurados correctamente",
      seeded: admins.map(a => a.email),
    });
  } catch (error) {
    console.error("[ADMIN_SETUP_ERROR]", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
