import { NextRequest, NextResponse } from 'next/server'
import {
  AUTH_COOKIE_NAME,
  canAccessPath,
  getHomeForRole,
  isAuthPath,
  type UserRole,
} from './lib/auth'

function decodeJwtPayload(token: string) {
  try {
    const [, payload] = token.split('.')
    if (!payload) return null
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/')
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=')
    const decoded = decodeURIComponent(
      Array.from(atob(padded), (char) => {
        return `%${char.charCodeAt(0).toString(16).padStart(2, '0')}`
      }).join(''),
    )

    return JSON.parse(decoded) as {
      vai_tro?: UserRole
      email?: string
      exp?: number
    }
  } catch {
    return null
  }
}

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value
  const payload = token ? decodeJwtPayload(token) : null
  const role = payload?.vai_tro
  const isExpired = payload?.exp ? payload.exp * 1000 <= Date.now() : true
  const isAuthenticated = Boolean(role && !isExpired)

  if (isAuthPath(pathname) && isAuthenticated && role) {
    return NextResponse.redirect(new URL(getHomeForRole(role), request.url))
  }

  const protectedPath =
    pathname.startsWith('/admin') ||
    pathname.startsWith('/nutritionist') ||
    pathname.startsWith('/dashboard')

  if (!protectedPath) {
    return NextResponse.next()
  }

  if (!isAuthenticated || !role) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', `${pathname}${search}`)
    return NextResponse.redirect(loginUrl)
  }

  if (!canAccessPath(role, pathname)) {
    return NextResponse.redirect(new URL(getHomeForRole(role), request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/login',
    '/register',
    '/forgot-password',
    '/verify-otp',
    '/reset-password',
    '/dashboard/:path*',
    '/admin/:path*',
    '/nutritionist/:path*',
  ],
}
