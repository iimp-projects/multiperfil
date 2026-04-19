
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  try {
    console.log('Attempting a single create WITHOUT transaction...')
    const result = await prisma.userSession.create({
      data: {
        id: 'test-' + Date.now(),
        userKey: 'test-user',
        event: 'test',
        docType: '1',
        document: 'test',
        createdAt: new Date(),
        lastSeenAt: new Date(),
      }
    })
    console.log('Success!', result)
  } catch (error: any) {
    console.error('Failed as expected:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

main()
