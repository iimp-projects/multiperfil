import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting seed...')
  
  const admins = [
    {
      email: 'admin@multieventos.com',
      password: 'admin123',
      name: 'Admin Maestro',
      role: 'admin'
    },
    {
      email: 'superadmin@iimp.org.pe',
      password: 'Admin@IIMP2026!',
      name: 'Super Admin',
      role: 'superadmin'
    },
    {
      email: 'admin@iimp.org.pe',
      password: 'Admin@2026!',
      name: 'Admin General',
      role: 'admin'
    },
    {
      email: 'eventos@iimp.org.pe',
      password: 'Eventos@2026!',
      name: 'Analista de Eventos',
      role: 'analyst'
    }
  ]

  for (const admin of admins) {
    const hashedPassword = await bcrypt.hash(admin.password, 10)
    
    // Usamos upsert para evitar duplicados si se corre varias veces
    const result = await prisma.adminUser.upsert({
      where: { email: admin.email },
      update: {
        passwordHash: hashedPassword,
        name: admin.name,
        role: admin.role
      },
      create: {
        email: admin.email,
        passwordHash: hashedPassword,
        name: admin.name,
        role: admin.role
      }
    })
    
    console.log(`User ${result.email} seeded/updated.`)
  }

  console.log('Seed completed successfully')
}

main()
  .catch((e) => {
    console.error('Error during seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
