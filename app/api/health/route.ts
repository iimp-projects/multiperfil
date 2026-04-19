import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Verificar conexión a la base de datos
    await prisma.$runCommandRaw({ ping: 1 });
    
    return NextResponse.json({ 
      status: "healthy", 
      timestamp: new Date().toISOString(),
      database: "connected"
    }, { status: 200 });
  } catch (error) {
    console.error("Health check failed:", error);
    return NextResponse.json({ 
      status: "unhealthy", 
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}
