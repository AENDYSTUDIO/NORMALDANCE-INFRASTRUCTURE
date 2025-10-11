export async function requireRole(role: 'ADMIN' | 'CURATOR' | 'ARTIST'): Promise<boolean> {
  try {
    const { getServerSession } = await import('next-auth/next')
    const { authOptions } = await import('@/lib/auth')
    const session = await getServerSession(authOptions)
    const level = (session?.user as any)?.level
    if (!session || !level) return false
    if (role === 'ADMIN') return level === 'ADMIN'
    if (role === 'CURATOR') return level === 'ADMIN' || level === 'CURATOR'
    if (role === 'ARTIST') return level === 'ADMIN' || level === 'CURATOR' || level === 'ARTIST'
    return false
  } catch {
    return false
  }
}

export async function isAdmin(): Promise<boolean> { return requireRole('ADMIN') }


