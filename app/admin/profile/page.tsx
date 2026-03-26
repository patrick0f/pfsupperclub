import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'
import { AdminProfileForm } from '../components/AdminProfileForm'

export default async function AdminProfile() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.adminId) redirect('/admin/login')

  const admin = await prisma.admin.findUnique({ where: { id: session.user.adminId } })
  if (!admin) redirect('/admin/login')

  return (
    <main>
      <h1>Profile</h1>
      <AdminProfileForm admin={{ id: admin.id, name: admin.name, email: admin.email, phone: admin.phone }} />
    </main>
  )
}
