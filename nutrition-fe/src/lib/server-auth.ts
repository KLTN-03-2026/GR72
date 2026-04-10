import { cookies } from 'next/headers'
import { AUTH_COOKIE_NAME, type AuthUser } from '@/lib/auth'

function decodeJwtPayload(token: string) {
  try {
    const [, payload] = token.split('.')
    if (!payload) return null

    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/')
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=')
    const decoded = Buffer.from(padded, 'base64').toString('utf-8')

    return JSON.parse(decoded) as {
      sub?: number
      email?: string
      vai_tro?: AuthUser['vai_tro']
      exp?: number
    }
  } catch {
    return null
  }
}

export async function getServerSessionUser(): Promise<AuthUser | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value
  if (!token) return null

  const payload = decodeJwtPayload(token)
  if (!payload?.vai_tro || !payload?.email) return null

  if (payload.exp && payload.exp * 1000 <= Date.now()) {
    return null
  }

  return {
    id: Number(payload.sub ?? 0),
    email: payload.email,
    ho_ten: '',
    vai_tro: payload.vai_tro,
  }
}

