import { hash } from 'bcryptjs'
import { PrismaNeon } from '@prisma/adapter-neon'
import { PrismaClient } from '@/app/generated/prisma/client'

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

async function main() {
  const password = process.env.ADMIN_PASSWORD
  if (!password) throw new Error('ADMIN_PASSWORD env var required')
  const passwordHash = await hash(password, 12)

  const email = process.env.ADMIN_EMAIL
  const name = process.env.ADMIN_NAME
  if (!email || !name) throw new Error('ADMIN_EMAIL and ADMIN_NAME env vars required')

  const admin = await prisma.admin.upsert({
    where: { email },
    update: {},
    create: { email, name, passwordHash },
  })

  console.log('Admin created:', admin.email)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
