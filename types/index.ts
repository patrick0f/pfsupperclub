declare module 'next-auth' {
  interface Session {
    user: { adminId: string; name?: string | null; email?: string | null }
  }
}

export {}
