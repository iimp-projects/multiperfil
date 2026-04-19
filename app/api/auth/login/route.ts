import axios from "axios";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { ApiResponse, Cupon, LoginRequest, User } from "@/types/auth";

const COOKIE_NAME = "iimp_sid";

const getCurrentYearSuffix = () => new Date().getFullYear().toString().slice(-2);

const generateMockCoupons = (verticals: string[]): Cupon[] => {
  const coupons: Cupon[] = [];
  const suffix = getCurrentYearSuffix();

  const establishments = [
    "Restaurante Central",
    "Maido",
    "Casa Andina Premium",
    "Westin Lima Hotel",
    "Astrid y Gastón",
    "Rafael",
    "La Mar",
    "Osso Carnicería",
    "Isolina",
    "Kjolle"
  ];

  const usageTypes = [
    "Almuerzo ejecutivo",
    "Cena de gala",
    "Estadía 1 noche",
    "Buffet de bienvenida",
    "Acceso a sala VIP",
    "Servicio de transporte"
  ];

  verticals.forEach((v) => {
    const count = Math.floor(Math.random() * 3) + 2; // 2 to 4 coupons per vertical
    for (let i = 0; i < count; i++) {
      const couponUsageCount = Math.floor(Math.random() * 6) + 3; // 3 to 8 usage records for scroll
      const obs: string[] = [];
      
      for (let j = 0; j < couponUsageCount; j++) {
        const est = establishments[Math.floor(Math.random() * establishments.length)];
        const type = usageTypes[Math.floor(Math.random() * usageTypes.length)];
        const day = Math.floor(Math.random() * 5) + 15; // April 15-20
        obs.push(`Canjeado en ${est} (${type}) - ${day}/04/2026`);
      }

      coupons.push({
        vertical: `${v.toUpperCase()}${suffix}`,
        codigo: `${v.toUpperCase()}${suffix}${Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}`,
        status: Math.random() > 0.2 ? "A" : "I",
        obs: obs
      });
    }
  });

  return coupons;
};

const getDynamicMockUser = (): User => {
  const suffix = getCurrentYearSuffix();
  const verticals = ["proexplo", "gess", "wmc", "perumin"];
  
  return {
    nombres: "JOHN MORÓNX",
    apellidoPaterno: "",
    apellidoMaterno: "",
    email: "jemoronh@gmail.com",
    telefono: "987654321X",
    cargo: "ANALISTAX",
    empresa: "OXFORDX",
    siecode: "P0000174809",
    nu_documento: "47303063",
    picture: "picture3ASADASDASD",
    bio: "Lorem ipsum dolor sit amet, consectetuer adipiscing elit.",
    visPerfil: true,
    visWhatsapp: true,
    notificacion01: true,
    notificacion02: true,
    qr: verticals.map(v => ({
      vertical: `${v.toUpperCase()}${suffix}`,
      codigo: `   ${Math.floor(Math.random() * 9) + 1}  ${Math.floor(Math.random() * 1000000000).toString().padStart(9, '0')}`
    })),
    comprobantes: [
      {
        monto: "0.00",
        estado: "Gratuito",
        serie: "",
        moneda: "",
        numero: "0",
        fechaEmision: "2026-04-17",
        razonSocial: ""
      }
    ],
    cupon: generateMockCoupons(verticals)
  };
};

function getUserKey(req: LoginRequest) {
  return `${req.event}:${req.type}:${req.document}`;
}

function getIp(req: NextRequest) {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || null;
  return req.headers.get("x-real-ip") || null;
}

async function authenticateWithGenexus(
  request: LoginRequest,
): Promise<ApiResponse<User>> {
  const isMockUser = request.type === "1" && request.document === "47303063";
  const isValidPassword =
    request.password === "12345" || request.password === "123456";

  if (isMockUser) {
    return {
      success: isValidPassword,
      message: isValidPassword
        ? "Usuario autenticado exitosamente (Modo Demo)"
        : "Contraseña incorrecta para el usuario de prueba",
      data: isValidPassword ? getDynamicMockUser() : undefined,
    };
  }


  const apiDomain = process.env.NEXT_PUBLIC_API_DOMAIN;
  const apiBasePath = process.env.NEXT_PUBLIC_API_BASE_PATH;
  const apiKey = process.env.NEXT_PUBLIC_API_KEY || "";

  if (!apiDomain || !apiBasePath) {
    return {
      success: false,
      message: "Configuración de API incompleta en el servidor",
    };
  }

  const url = `${apiDomain}${apiBasePath}/searchparticipant`;

  try {
    const response = await axios.post<ApiResponse<User>>(url, request, {
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
      timeout: 20000,
    });

    return response.data as ApiResponse<User>;
  } catch (error: unknown) {
    const message = axios.isAxiosError(error)
      ? error.response?.data?.message || error.message || "Error de conexión"
      : "Error de conexión";

    return { success: false, message };
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Partial<LoginRequest>;

    if (!body?.event || !body.type || !body.document || !body.password) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 },
      );
    }

    const request: LoginRequest = {
      event: body.event,
      type: body.type,
      document: body.document,
      password: body.password,
    };

    console.log(`[LOGIN] Starting authentication for ${request.document} - ${request.event}`);
    console.time("authenticateWithGenexus");
    const auth = await authenticateWithGenexus(request);
    console.timeEnd("authenticateWithGenexus");

    if (!auth.success || !auth.data) {
      console.warn(`[LOGIN] Authentication failed for ${request.document}: ${auth.message}`);
      return NextResponse.json(auth, { status: 401 });
    }

    // Ensure the user object has the identifier (siecode) for subsequent service calls
    if (!auth.data.siecode) {
      auth.data.siecode = auth.data.nu_documento || request.document;
    }
    // Maintain nu_documento for compatibility
    if (!auth.data.nu_documento) {
      auth.data.nu_documento = request.document;
    }

    const sessionId = crypto.randomUUID();
    const userKey = getUserKey(request);
    const now = new Date();
    const userAgent = req.headers.get("user-agent");
    const ip = getIp(req);

    console.time("prisma_operations");
    console.log(`[LOGIN] Syncing session to DB for ${userKey}`);
    
    const previous = await prisma.userSessionLock.findUnique({
      where: { userKey },
    });

    await prisma.userSession.create({
      data: {
        id: sessionId,
        userKey,
        event: request.event,
        docType: request.type,
        document: request.document,
        createdAt: now,
        lastSeenAt: now,
        userAgent: userAgent || null,
        ip: ip || null,
      },
    });

    await prisma.userSessionLock.upsert({
      where: { userKey },
      update: { activeSessionId: sessionId },
      create: { userKey, activeSessionId: sessionId },
    });

    if (previous?.activeSessionId && previous.activeSessionId !== sessionId) {
      await prisma.userSession.updateMany({
        where: { id: previous.activeSessionId, endedAt: null },
        data: { endedAt: now },
      });
    }
    console.timeEnd("prisma_operations");

    const res = NextResponse.json(auth);
    res.cookies.set({
      name: COOKIE_NAME,
      value: sessionId,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 12,
    });

    return res;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { success: false, message: `Login failed: ${message}` },
      { status: 500 },
    );
  }
}
