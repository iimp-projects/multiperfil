import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

// In-memory token store (use Redis or DB in production)
// Maps email -> { token, expiresAt }
export const recoveryTokens = new Map<string, { token: string; expiresAt: number }>();

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json({ success: false, message: "Email requerido." }, { status: 400 });
    }

    const admin = await prisma.adminUser.findUnique({ where: { email } });
    if (!admin) {
      // Don't reveal whether email exists (security)
      return NextResponse.json({ success: true, message: "Si el email está registrado, recibirás el código." });
    }

    // Generate 6-char alphanumeric token
    const token = crypto.randomBytes(3).toString("hex").toUpperCase();
    const expiresAt = Date.now() + 15 * 60 * 1000; // 15 minutes

    recoveryTokens.set(email, { token, expiresAt });

    // In dev, log the token. In production, send email.
    if (process.env.NODE_ENV === "development") {
      console.log(`[ADMIN_RECOVERY] Token for ${email}: ${token}`);
    }

    // TODO: Integrate with emailService.sendEmail() to send the token via email in production.
    // For now it's logged to console in dev so you can test without SMTP config.

    return NextResponse.json({ success: true, message: "Código enviado. Revisa tu correo (o consola en dev)." });
  } catch (error) {
    console.error("[ADMIN_RECOVERY_REQUEST]", error);
    return NextResponse.json({ success: false, message: "Error interno." }, { status: 500 });
  }
}
