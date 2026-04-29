import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function test() {
  try {
    console.log("Starting audit log test...");
    const log = await prisma.auditLog.create({
      data: {
        userId: null,
        userEmail: "debug@test.com",
        userName: "Debug User",
        action: "GENERIC_ACTION",
        module: "SYSTEM",
        details: "Testing manual creation from debug script",
        ip: "1.1.1.1",
        userAgent: "debug-agent"
      }
    });
    console.log("Log created successfully:", log);

    console.log("Testing with undefined values...");
    // Simulating missing headers
    const userId_undef = undefined;
    const log2 = await prisma.auditLog.create({
      data: {
        userId: (userId_undef && userId_undef.length === 24) ? userId_undef : null,
        userEmail: undefined || "system",
        userName: undefined || "System",
        action: "GENERIC_ACTION",
        module: "SYSTEM",
        details: "Testing undefined logic",
        ip: "1.1.1.1",
        userAgent: "debug-agent"
      }
    });
    console.log("Log 2 created successfully:", log2);

    console.log("Testing with real ObjectId string...");
    const realId = "69f26cc52e0d8fe16701d315";
    const log3 = await prisma.auditLog.create({
      data: {
        userId: realId,
        userEmail: "real@user.com",
        userName: "Real User",
        action: "GENERIC_ACTION",
        module: "SYSTEM",
        details: "Testing real ObjectId string",
        ip: "1.1.1.1",
        userAgent: "debug-agent"
      }
    });
    console.log("Log 3 created successfully:", log3);
  } catch (error) {
    console.error("FAILED to create log:", error);
  } finally {
    await prisma.$disconnect();
  }
}

test();
