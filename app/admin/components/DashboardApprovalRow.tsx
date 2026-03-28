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
    <tr className="border-t border-border">
      <td className="px-4 py-3 text-sm text-fg">{user.firstName} {user.lastName}</td>
      <td className="px-4 py-3 text-sm text-fg-muted">{user.email}</td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => handleAction('approve')}
            className="text-xs text-accent hover:opacity-70 transition-opacity"
          >
            Approve
          </button>
          <button
            type="button"
            onClick={() => handleAction('deny')}
            className="text-xs text-fg-muted hover:text-fg transition-colors"
          >
            Deny
          </button>
        </div>
      </td>
    </tr>
  )
}
