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

    const allPermissions = [
      "dashboard", "usuarios", "grupos", "mensajes", "alertas", 
      "streaming", "programas", "auspiciadores", "sistema_admins", "sistema_logs"
    ];

    const roles = [
      {
        name: "Admin",
        permissions: allPermissions,
      },
      {
        name: "Eventos",
        permissions: ["dashboard", "usuarios", "grupos", "mensajes", "alertas", "streaming", "programas", "auspiciadores"],
      },
      {
        name: "Comunicaciones",
        permissions: ["streaming"],
      }
    ];

    // 1. Upsert Roles
    for (const r of roles) {
      await prisma.adminRole.upsert({
        where: { name: r.name },
        update: { permissions: r.permissions },
        create: { name: r.name, permissions: r.permissions }
      });
    }

    const admins = [
      {
        email: "neill.rivera@iimp.org.pe",
        password: "Admin@IIMP2026!",
        name: "Neill Bryan Rivera Livia",
        role: "Admin",
      },
      {
        email: "john.moron@iimp.org.pe",
        password: "Admin@IIMP2026!",
        name: "John TI",
        role: "Admin",
      },
      {
        email: "ext_analistaprogramador1@iimp.org.pe",
        password: "Admin@IIMP2026!",
        name: "Lourdes TI",
        role: "Admin",
      },
      {
        email: "ext_analistaprogramador2@iimp.org.pe",
        password: "Admin@IIMP2026!",
        name: "Max TI",
        role: "Admin",
      },
      {
        email: "admin@multieventos.com",
        password: "admin123",
        name: "Admin Principal",
        role: "Admin",
      },
      {
        email: "eventos@iimp.org.pe",
        password: "Eventos@2026!",
        name: "Eventos",
        role: "Eventos",
      },
      {
        email: "comunicaciones@iimp.org.pe",
        password: "Admin@IIMP2026!",
        name: "Comunicaciones User",
        role: "Comunicaciones",
      },
    ];

    for (const a of admins) {
      await prisma.adminUser.upsert({
        where: { email: a.email },
        update: { role: a.role },
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
      details: "Inicialización de administradores y roles dinámicos vía setup API",
      ip,
      userAgent
    });

    return NextResponse.json({
      success: true,
      message: "Roles y Administradores configurados correctamente",
      seededRoles: roles.map(r => r.name),
      seededUsers: admins.map(a => a.email),
    });
  } catch (error) {
    console.error("[ADMIN_SETUP_ERROR]", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
