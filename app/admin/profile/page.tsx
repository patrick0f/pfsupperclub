import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'
import { AdminProfileForm } from '../components/AdminProfileForm'

export default async function AdminProfile() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.adminId) redirect('/')

  const admin = await prisma.admin.findUnique({ where: { id: session.user.adminId } })
  if (!admin) redirect('/')

  return (
    <main className="max-w-sm mx-auto px-6 py-12 flex flex-col gap-8">
      <h1 className="font-display text-3xl text-fg">Profile</h1>
      <AdminProfileForm admin={{ id: admin.id, name: admin.name, email: admin.email, phone: admin.phone }} />
    </main>
  )
}
