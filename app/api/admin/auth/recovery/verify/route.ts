import { NextRequest, NextResponse } from "next/server";
import { recoveryTokens } from "../request/route";

export async function POST(req: NextRequest) {
  try {
    const { email, token } = await req.json();

    if (!email || !token) {
      return NextResponse.json({ success: false, message: "Email y token requeridos." }, { status: 400 });
    }

    const stored = recoveryTokens.get(email);

    if (!stored) {
      return NextResponse.json({ success: false, message: "No se encontró solicitud de recuperación para este email." }, { status: 400 });
    }

    if (Date.now() > stored.expiresAt) {
      recoveryTokens.delete(email);
      return NextResponse.json({ success: false, message: "El código ha expirado. Solicita uno nuevo." }, { status: 400 });
    }

    if (stored.token !== token.toUpperCase()) {
      return NextResponse.json({ success: false, message: "Código incorrecto." }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: "Token verificado." });
  } catch (error) {
    console.error("[ADMIN_RECOVERY_VERIFY]", error);
    return NextResponse.json({ success: false, message: "Error interno." }, { status: 500 });
  }
}
