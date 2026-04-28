import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

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

    const results = [];

    for (const admin of admins) {
      const hashedPassword = await bcrypt.hash(admin.password, 10);
      const result = await prisma.adminUser.upsert({
        where: { email: admin.email },
        update: {
          passwordHash: hashedPassword,
          name: admin.name,
          role: admin.role,
        },
        create: {
          email: admin.email,
          passwordHash: hashedPassword,
          name: admin.name,
          role: admin.role,
        },
      });
      results.push(result.email);
    }

    return NextResponse.json({
      success: true,
      message: "Administradores configurados correctamente",
      seeded: results,
    });
  } catch (error) {
    console.error("[ADMIN_SETUP_ERROR]", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
