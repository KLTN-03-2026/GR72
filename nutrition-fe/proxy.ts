import { NextRequest, NextResponse } from 'next/server'
import {
  AUTH_COOKIE_NAME,
  canAccessPath,
  getDefaultRouteForRole,
  isAuthPath,
  isProtectedPath,
  mapLegacyStaffPath,
  resolvePostLoginPath,
  type AuthUser,
} from './src/lib/auth'

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

function getSessionUser(request: NextRequest): AuthUser | null {
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value
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

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl
  const user = getSessionUser(request)

  if (pathname.startsWith('/staff')) {
    const redirectedPath = mapLegacyStaffPath(pathname)
    const redirectUrl = new URL(`${redirectedPath}${search}`, request.url)

    return NextResponse.redirect(redirectUrl)
  }

  if (isAuthPath(pathname) && user) {
    return NextResponse.redirect(
      new URL(getDefaultRouteForRole(user.vai_tro), request.url)
    )
  }

  if (!isProtectedPath(pathname)) {
    return NextResponse.next()
  }

  if (!user) {
    const signInUrl = new URL('/sign-in', request.url)
    signInUrl.searchParams.set('redirect', `${pathname}${search}`)

    return NextResponse.redirect(signInUrl)
  }

  if (!canAccessPath(user.vai_tro, pathname)) {
    return NextResponse.redirect(
      new URL(resolvePostLoginPath(user.vai_tro), request.url)
    )
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/nutrition/:path*',
    '/nutritionist/:path*',
    '/admin/:path*',
    '/staff/:path*',
    '/sign-in',
    '/sign-in-2',
    '/sign-up',
    '/forgot-password',
    '/reset-password',
    '/otp',
    '/clerk/sign-in',
    '/clerk/sign-up',
  ],
}
