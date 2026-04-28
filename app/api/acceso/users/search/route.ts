import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { GenexusSiecodeListResponse, PortalRecipientUser, UsersSearchResponse } from "@/types/acceso/users";

// Simple in-memory cache to avoid hitting Genexus on every keystroke
// Key: eventCode, Value: { data, timestamp }
const cache: Record<string, { data: PortalRecipientUser[]; timestamp: number }> = {};
const CACHE_TTL_MS = 1000 * 60 * 5; // 5 minutes

export async function GET(req: NextRequest) {
  try {
    const urlParams = new URL(req.url);
    const query = urlParams.searchParams.get("q")?.trim() || "";
    const event = urlParams.searchParams.get("event")?.trim() || "";
    const limit = parseInt(urlParams.searchParams.get("limit") || "20", 10);

    if (!event) {
      return NextResponse.json(
        { success: false, message: "El parámetro 'event' es requerido." },
        { status: 400 }
      );
    }

    if (query.length < 3 && query.length > 0) {
      return NextResponse.json(
        {
          items: [],
          total: 0,
          limit,
          query,
          success: true,
          message: "Ingrese al menos 3 caracteres para buscar.",
        } as UsersSearchResponse
      );
    }

    let allUsers: PortalRecipientUser[] = [];

    // Check cache
    const now = Date.now();
    if (cache[event] && now - cache[event].timestamp < CACHE_TTL_MS) {
      allUsers = cache[event].data;
    } else {
      // Fetch from Genexus
      const apiDomain = process.env.NEXT_PUBLIC_API_DOMAIN || "https://secure2.iimp.org:8443";
      const apiBasePath = process.env.NEXT_PUBLIC_API_BASE_PATH || "/KBServiciosIIMPJavaEnvironment/rest";
      const apiKey = process.env.NEXT_PUBLIC_API_KEY || "";

      const apiUrl = `${apiDomain}${apiBasePath}/siecodelist`;

      console.log(`[USERS_SEARCH] Fetching from Genexus: ${apiUrl} for event: ${event}`);

      const response = await axios.post<GenexusSiecodeListResponse>(
        apiUrl,
        { event },
        {
          headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey,
          },
          timeout: 20000,
        }
      );

      if (response.data && response.data.siecodelist) {
        allUsers = response.data.siecodelist.map((u) => ({
          id: u.siecod,
          siecod: u.siecod,
          fullName: u.nombres,
          documentType: u.tipo_doc,
          documentNumber: u.nro_doc,
          source: "genexus",
        }));

        // Save to cache
        cache[event] = {
          data: allUsers,
          timestamp: now,
        };
      } else {
        throw new Error("Formato de respuesta de Genexus inválido.");
      }
    }

    // Filter server-side
    let filtered = allUsers;
    if (query.length >= 3) {
      const lowerQuery = query.toLowerCase();
      filtered = allUsers.filter(
        (u) =>
          u.fullName.toLowerCase().includes(lowerQuery) ||
          u.siecod.toLowerCase().includes(lowerQuery) ||
          u.documentNumber.includes(lowerQuery)
      );
    }

    const total = filtered.length;
    const items = filtered.slice(0, limit);

    return NextResponse.json({
      items,
      total,
      limit,
      query,
      success: true,
    } as UsersSearchResponse);
  } catch (error: unknown) {
    const message = axios.isAxiosError(error)
      ? error.response?.data?.message || error.message || "Error al buscar usuarios"
      : error instanceof Error
      ? error.message
      : "Error desconocido al buscar usuarios";

    console.error(`[USERS_SEARCH] Error:`, message);

    return NextResponse.json(
      {
        items: [],
        total: 0,
        limit: 0,
        query: "",
        success: false,
        message,
      } as UsersSearchResponse,
      { status: 500 }
    );
  }
}
