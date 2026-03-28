'use client'

import { useRouter } from 'next/navigation'

type User = {
  id: string
  email: string
  firstName: string | null
  lastName: string | null
  status: string
}

const STATUS_STYLES: Record<string, string> = {
  waitlisted: 'border border-border-strong text-fg-muted',
  approved: 'bg-accent text-accent-fg',
  denied: 'bg-bg-subtle text-fg-muted',
}

export function UserTable({ users }: { users: User[] }) {
  const router = useRouter()

  async function updateStatus(userId: string, action: 'approve' | 'deny') {
    await fetch(`/api/admin/users/${userId}/${action}`, { method: 'POST' })
    router.refresh()
  }

  return (
    <div className="border border-border overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-bg-subtle">
            <th className="text-left text-xs tracking-widest uppercase text-fg-muted font-normal px-4 py-3">Name</th>
            <th className="text-left text-xs tracking-widest uppercase text-fg-muted font-normal px-4 py-3">Email</th>
            <th className="text-left text-xs tracking-widest uppercase text-fg-muted font-normal px-4 py-3">Status</th>
            <th className="text-left text-xs tracking-widest uppercase text-fg-muted font-normal px-4 py-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map(user => (
            <tr key={user.id} className="border-t border-border">
              <td className="px-4 py-3 text-fg">{user.firstName} {user.lastName}</td>
              <td className="px-4 py-3 text-fg-muted">{user.email}</td>
              <td className="px-4 py-3">
                <span className={`inline-block text-xs px-2 py-0.5 rounded-full ${STATUS_STYLES[user.status] ?? 'text-fg-muted'}`}>
                  {user.status}
                </span>
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-4">
                  {user.status !== 'approved' && (
                    <button
                      type="button"
                      onClick={() => updateStatus(user.id, 'approve')}
                      className="text-xs text-accent hover:opacity-70 transition-opacity"
                    >
                      Approve
                    </button>
                  )}
                  {user.status !== 'denied' && (
                    <button
                      type="button"
                      onClick={() => updateStatus(user.id, 'deny')}
                      className="text-xs text-fg-muted hover:text-fg transition-colors"
                    >
                      Deny
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
