import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { Resend } from "resend";
import { logActivity } from "@/lib/audit";
import { getClientInfo, getAdminInfo } from "@/lib/utils/request";

const resend = new Resend(process.env.RESEND_API_KEY);

const createSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(8, "Mínimo 8 caracteres"),
  name: z.string().min(2, "Nombre requerido"),
  role: z.string().optional().default("admin"),
});



// GET - list all admin users
export async function GET() {
  try {
    const admins = await prisma.adminUser.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: admins });
  } catch (error) {
    console.error("[ADMIN_USERS_GET]", error);
    return NextResponse.json(
      { success: false, message: "Error al obtener administradores." },
      { status: 500 }
    );
  }
}

// POST - create a new admin user
export async function POST(req: NextRequest) {
  const { ip, userAgent } = getClientInfo(req);
  const creator = getAdminInfo(req);
  
  try {
    const body = await req.json();
    
    const parsed = createSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: parsed.error.issues[0]?.message ?? "Datos inválidos." },
        { status: 400 }
      );
    }

    const { email, password, name, role } = parsed.data;

    const existing = await prisma.adminUser.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { success: false, message: "Ya existe un administrador con ese email." },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const admin = await prisma.adminUser.create({
      data: { email, passwordHash, name, role },
      select: { id: true, email: true, name: true, role: true, createdAt: true },
    });

    // 1. Registro en Auditoría
    await logActivity({
      userId: creator.id,
      userEmail: creator.email,
      userName: creator.name,
      action: "CREATE_USER",
      module: "ADMIN_USERS",
      details: `Se creó el usuario ${email} con rol ${role}.`,
      ip,
      userAgent
    });

    // 2. Envío de Correo vía Resend
    try {
      await resend.emails.send({
        from: "IIMP <no-reply@sistemasiimp.org.pe>",
        to: email,
        subject: "Credenciales de ingreso - Multiperfil App - IIMP",
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 10px; padding: 20px;">
            <h2 style="color: #333;">¡Bienvenido al sistema!</h2>
            <p>Hola <strong>${name}</strong>, se te ha creado una cuenta como administrador en el sistema Multiperfil de IIMP.</p>
            <p>A continuación, tus credenciales de acceso:</p>
            <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p style="margin: 5px 0;"><strong>Usuario:</strong> ${email}</p>
              <p style="margin: 5px 0;"><strong>Contraseña:</strong> ${password}</p>
              <p style="margin: 5px 0;"><strong>Rol:</strong> ${role}</p>
            </div>
            <p>Puedes ingresar desde el portal administrativo.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
            <p style="font-size: 12px; color: #999;">Este es un mensaje automático, por favor no respondas a este correo.</p>
          </div>
        `,
      });
    } catch (emailError) {
      console.error("[EMAIL_SEND_ERROR]", emailError);
      // No bloqueamos la respuesta si el correo falla, pero lo logeamos
    }

    return NextResponse.json({ success: true, data: admin }, { status: 201 });
  } catch (error) {
    console.error("[ADMIN_USERS_POST]", error);
    return NextResponse.json(
      { success: false, message: "Error al crear administrador." },
      { status: 500 }
    );
  }
}

// DELETE - delete an admin user
export async function DELETE(req: NextRequest) {
  const { ip, userAgent } = getClientInfo(req);
  const admin = getAdminInfo(req);
  const url = new URL(req.url);
  const id = url.searchParams.get("id");

  if (!id) {
    return NextResponse.json(
      { success: false, message: "ID de administrador requerido." },
      { status: 400 }
    );
  }

  try {
    // Validar formato de ID (MongoDB ObjectId)
    if (!/^[0-9a-fA-F]{24}$/.test(id)) {
      return NextResponse.json(
        { success: false, message: "Formato de ID inválido." },
        { status: 400 }
      );
    }

    // Prevenir auto-eliminación
    if (admin.id === id) {
      return NextResponse.json(
        { success: false, message: "No puedes eliminar tu propia cuenta." },
        { status: 400 }
      );
    }

    const adminToDelete = await prisma.adminUser.findUnique({
      where: { id },
      select: { email: true, name: true }
    });

    if (!adminToDelete) {
      return NextResponse.json(
        { success: false, message: "Administrador no encontrado." },
        { status: 404 }
      );
    }

    await prisma.adminUser.delete({
      where: { id },
    });

    // Registro en Auditoría
    await logActivity({
      userId: admin.id,
      userEmail: admin.email,
      userName: admin.name,
      action: "DELETE_USER",
      module: "ADMIN_USERS",
      details: `Se eliminó al administrador ${adminToDelete.email} (${adminToDelete.name}).`,
      ip,
      userAgent
    });

    return NextResponse.json({ 
      success: true, 
      message: "Administrador eliminado correctamente." 
    });
  } catch (error) {
    console.error("[ADMIN_USERS_DELETE]", error);
    return NextResponse.json(
      { success: false, message: "Error al eliminar administrador." },
      { status: 500 }
    );
  }
}
