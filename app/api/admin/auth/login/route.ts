import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { logActivity } from "@/lib/audit";

const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "Contraseña requerida"),
});

function getClientInfo(req: NextRequest) {
  const forwarded = req.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0] : "127.0.0.1";
  const userAgent = req.headers.get("user-agent") || "unknown";
  return { ip, userAgent };
}

export async function POST(req: NextRequest) {
  const { ip, userAgent } = getClientInfo(req);
  try {
    const body = await req.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: parsed.error.issues[0]?.message ?? "Datos inválidos." },
        { status: 400 }
      );
    }

    const { email, password } = parsed.data;

    const admin = await prisma.adminUser.findUnique({ where: { email } });

    if (!admin) {
      return NextResponse.json(
        { success: false, message: "Credenciales incorrectas." },
        { status: 401 }
      );
    }

    const isValid = await bcrypt.compare(password, admin.passwordHash);

    if (!isValid) {
      return NextResponse.json(
        { success: false, message: "Credenciales incorrectas." },
        { status: 401 }
      );
    }

    // 3. Buscar los permisos del rol (insensible a mayúsculas/minúsculas)
    const roleData = await prisma.adminRole.findFirst({
      where: { 
        name: { equals: admin.role, mode: 'insensitive' }
      }
    });

    // Registro en Auditoría
    await logActivity({
      userId: admin.id,
      userEmail: admin.email,
      userName: admin.name,
      action: "LOGIN",
      module: "AUTH",
      details: "Inicio de sesión exitoso en el panel administrativo.",
      ip,
      userAgent
    });

    return NextResponse.json({
      success: true,
      data: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
        permissions: roleData?.permissions || [],
      },
    });
  } catch (error) {
    console.error("[ADMIN_AUTH_LOGIN]", error);
    return NextResponse.json(
      { success: false, message: "Error interno del servidor." },
      { status: 500 }
    );
  }
}
