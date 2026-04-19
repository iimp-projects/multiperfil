import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const COOKIE_NAME = "iimp_sid";

export async function POST(req: NextRequest) {
  const sid = req.cookies.get(COOKIE_NAME)?.value;

  if (sid) {
    const session = await prisma.userSession.findUnique({ where: { id: sid } });
    const now = new Date();

    await prisma.userSession.updateMany({
      where: { id: sid, endedAt: null },
      data: { endedAt: now, lastSeenAt: now },
    });

    if (session) {
      const lock = await prisma.userSessionLock.findUnique({
        where: { userKey: session.userKey },
      });
      if (lock?.activeSessionId === sid) {
        await prisma.userSessionLock.delete({ where: { userKey: session.userKey } });
      }
    }
  }

  const res = NextResponse.json({ success: true, message: "Logged out" });
  res.cookies.set({
    name: COOKIE_NAME,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  return res;
}
