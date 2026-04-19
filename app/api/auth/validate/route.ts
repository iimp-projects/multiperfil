import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const COOKIE_NAME = "iimp_sid";

export async function GET(req: NextRequest) {
  const sid = req.cookies.get(COOKIE_NAME)?.value;
  if (!sid) {
    return NextResponse.json(
      { success: false, message: "No session", code: "NO_SESSION" },
      { status: 401 },
    );
  }

  const session = await prisma.userSession.findUnique({ where: { id: sid } });
  if (!session || session.endedAt) {
    return NextResponse.json(
      { success: false, message: "Invalid session", code: "INVALID_SESSION" },
      { status: 401 },
    );
  }

  const lock = await prisma.userSessionLock.findUnique({
    where: { userKey: session.userKey },
  });

  if (!lock || lock.activeSessionId !== sid) {
    return NextResponse.json(
      {
        success: false,
        message: "Session replaced",
        code: "SESSION_REPLACED",
      },
      { status: 401 },
    );
  }

  await prisma.userSession.update({
    where: { id: sid },
    data: { lastSeenAt: new Date() },
  });

  return NextResponse.json({ success: true, message: "OK" });
}
