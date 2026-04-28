import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { recoveryTokens } from "../request/route";

export async function POST(req: NextRequest) {
  try {
    const { email, token, newPassword } = await req.json();

    if (!email || !token || !newPassword) {
      return NextResponse.json({ success: false, message: "Todos los campos son requeridos." }, { status: 400 });
    }

    if (typeof newPassword !== "string" || newPassword.length < 8) {
      return NextResponse.json({ success: false, message: "La contraseña debe tener mínimo 8 caracteres." }, { status: 400 });
    }

    const stored = recoveryTokens.get(email);

    if (!stored || Date.now() > stored.expiresAt || stored.token !== token.toUpperCase()) {
      return NextResponse.json({ success: false, message: "Token inválido o expirado." }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);

    await prisma.adminUser.update({
      where: { email },
      data: { passwordHash },
    });

    // Invalidate token after use
    recoveryTokens.delete(email);

    return NextResponse.json({ success: true, message: "Contraseña actualizada correctamente." });
  } catch (error) {
    console.error("[ADMIN_RECOVERY_RESET]", error);
    return NextResponse.json({ success: false, message: "Error interno." }, { status: 500 });
  }
}
