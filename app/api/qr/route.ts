import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const text = searchParams.get("text");

  if (!text) {
    return NextResponse.json({ error: "Missing text parameter" }, { status: 400 });
  }

  const externalUrl = `https://secure2.iimp.org:8443/QRGeneratorApp/qrgenerator?text=${text}`;

  try {
    const response = await fetch(externalUrl, {
      // Use cache to avoid hitting the external service too much
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch QR code: ${response.statusText}`);
    }

    const contentType = response.headers.get("content-type") || "image/png";
    const arrayBuffer = await response.arrayBuffer();

    return new NextResponse(arrayBuffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=3600",
        // Crucial for html-to-image/toPng
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    console.error("QR Proxy Error:", error);
    return NextResponse.json({ error: "Failed to generate QR code" }, { status: 500 });
  }
}
