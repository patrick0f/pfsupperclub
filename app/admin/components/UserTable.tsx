'use client'

import { useRouter } from 'next/navigation'

type User = {
  id: string
  email: string
  firstName: string | null
  lastName: string | null
  status: string
}

export function UserTable({ users }: { users: User[] }) {
  const router = useRouter()

  async function updateStatus(userId: string, action: 'approve' | 'deny') {
    await fetch(`/api/admin/users/${userId}/${action}`, { method: 'POST' })
    router.refresh()
  }

  return (
    <table>
      <thead>
        <tr>
          <th>Name</th>
          <th>Email</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {users.map(user => (
          <tr key={user.id}>
            <td>{user.firstName} {user.lastName}</td>
            <td>{user.email}</td>
            <td>{user.status}</td>
            <td>
              {user.status !== 'approved' && (
                <button type="button" onClick={() => updateStatus(user.id, 'approve')}>Approve</button>
              )}
              {user.status !== 'denied' && (
                <button type="button" onClick={() => updateStatus(user.id, 'deny')}>Deny</button>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
