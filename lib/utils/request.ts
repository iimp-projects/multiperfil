import { NextRequest } from "next/server";

export function getClientInfo(req: NextRequest) {
  const forwarded = req.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0] : "127.0.0.1";
  const userAgent = req.headers.get("user-agent") || "unknown";
  return { ip, userAgent };
}

export function getAdminInfo(req: NextRequest) {
  return {
    id: req.headers.get("x-admin-id") || undefined,
    email: req.headers.get("x-admin-email") || undefined,
    name: req.headers.get("x-admin-name") || undefined,
  };
}
