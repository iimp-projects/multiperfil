/**
 * Seeder de administradores de prueba para MongoDB.
 * Ejecutar con: node --experimental-vm-modules scripts/seed-admins.mjs
 * O bien:       node scripts/seed-admins.mjs
 *
 * Requiere que el proyecto tenga corriendo el servidor de MongoDB y las
 * variables de entorno configuradas en .env (DATABASE_URL).
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const SEED_ADMINS = [
  {
    name: "Super Administrador IIMP",
    email: "superadmin@iimp.org.pe",
    password: "Admin@IIMP2026!",
    role: "superadmin",
  },
  {
    name: "Administrador General",
    email: "admin@iimp.org.pe",
    password: "Admin@2026!",
    role: "admin",
  },
  {
    name: "Analista de Eventos",
    email: "eventos@iimp.org.pe",
    password: "Eventos@2026!",
    role: "admin",
  },
];

async function main() {
  console.log("🌱 Iniciando seed de administradores...\n");

  for (const admin of SEED_ADMINS) {
    const exists = await prisma.adminUser.findUnique({
      where: { email: admin.email },
    });

    if (exists) {
      console.log(`⚠  Ya existe: ${admin.email} — omitiendo.`);
      continue;
    }

    const passwordHash = await bcrypt.hash(admin.password, 12);

    const created = await prisma.adminUser.create({
      data: {
        email: admin.email,
        passwordHash,
        name: admin.name,
        role: admin.role,
      },
    });

    console.log(`✅ Creado: ${created.name} <${created.email}> [${created.role}]`);
    console.log(`   Contraseña: ${admin.password}\n`);
  }

  console.log("✅ Seed completado.");
}

main()
  .catch((e) => {
    console.error("❌ Error en seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
