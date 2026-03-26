'use client'

import { useRouter } from 'next/navigation'

type User = {
  id: string
  email: string
  firstName: string | null
  lastName: string | null
}

export function DashboardApprovalRow({ user }: { user: User }) {
  const router = useRouter()

  async function handleAction(action: 'approve' | 'deny') {
    await fetch(`/api/admin/users/${user.id}/${action}`, { method: 'POST' })
    router.refresh()
  }

  return (
    <tr>
      <td>{user.firstName} {user.lastName}</td>
      <td>{user.email}</td>
      <td>
        <button type="button" onClick={() => handleAction('approve')}>Approve</button>
        <button type="button" onClick={() => handleAction('deny')}>Deny</button>
      </td>
    </tr>
  )
}
