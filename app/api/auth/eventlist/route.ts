import axios from "axios";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    const apiDomain = process.env.NEXT_PUBLIC_API_DOMAIN || "https://secure2.iimp.org:8443";
    const apiBasePath = process.env.NEXT_PUBLIC_API_BASE_PATH || "/KBServiciosIIMPJavaEnvironment/rest";
    const apiKey = process.env.NEXT_PUBLIC_API_KEY || "";

    const url = `${apiDomain}${apiBasePath}/eventlist`;

    console.log(`[EVENT_LIST] Fetching from ${url}`);
    
    const response = await axios.post(url, {}, {
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
      timeout: 10000,
    });

    return NextResponse.json(response.data);
  } catch (error: unknown) {
    const message = axios.isAxiosError(error)
      ? error.response?.data?.message || error.message || "Error fetching event list"
      : "Unknown error";
    
    console.error(`[EVENT_LIST] Error:`, message);
    
    // Return empty list on failure so the UI doesn't crash
    return NextResponse.json({ Eventos: [] });
  }
}
