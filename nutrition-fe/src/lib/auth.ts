export const AUTH_API_PREFIX = '/api/auth'
export const AUTH_COOKIE_NAME = 'access_token'

export const AUTH_PATHS = [
  '/sign-in',
  '/sign-in-2',
  '/sign-up',
  '/forgot-password',
  '/reset-password',
  '/otp',
  '/clerk/sign-in',
  '/clerk/sign-up',
] as const

export type UserRole =
  | 'nguoi_dung'
  | 'chuyen_gia_dinh_duong'
  | 'quan_tri'

export type UserStatus = 'hoat_dong' | 'khong_hoat_dong' | 'bi_khoa'

export interface AuthUser {
  id: number
  email: string
  ho_ten: string
  vai_tro: UserRole
  trang_thai?: UserStatus
  onboarding_completed?: boolean
  onboarding_step?: 'ho_so' | 'muc_tieu' | null
  redirect_to?: string
}

export const ROLE_HOME_PATH: Record<UserRole, string> = {
  nguoi_dung: '/nutrition/dashboard',
  chuyen_gia_dinh_duong: '/nutritionist/dashboard',
  quan_tri: '/admin/users',
}

export function isAuthPath(pathname: string) {
  return AUTH_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`))
}

export function isProtectedPath(pathname: string) {
  return (
    pathname.startsWith('/nutrition') ||
    pathname.startsWith('/nutritionist') ||
    pathname.startsWith('/admin')
  )
}

export function getDefaultRouteForRole(role: UserRole) {
  return ROLE_HOME_PATH[role] ?? '/sign-in'
}

export function getStaffPortalRoleForUserRole(role: UserRole) {
  return role === 'quan_tri' ? 'admin' : 'nutritionist'
}

export function canAccessPath(role: UserRole, pathname: string) {
  if (pathname.startsWith('/admin')) {
    return role === 'quan_tri'
  }

  if (pathname.startsWith('/nutritionist')) {
    return role === 'chuyen_gia_dinh_duong' || role === 'quan_tri'
  }

  if (pathname.startsWith('/nutrition')) {
    return role === 'nguoi_dung'
  }

  return true
}

export function isStaffAreaPath(pathname: string) {
  return pathname.startsWith('/nutritionist') || pathname.startsWith('/admin')
}

export function mapLegacyStaffPath(pathname: string) {
  if (pathname === '/staff' || pathname === '/staff/dashboard') {
    return '/nutritionist/dashboard'
  }

  if (pathname === '/staff/users') {
    return '/admin/users'
  }

  if (pathname === '/staff/foods') {
    return '/admin/foods'
  }

  return pathname.replace(/^\/staff/, '/nutritionist')
}

export function resolvePostLoginPath(user: AuthUser | UserRole, redirectTo?: string | null) {
  const role = typeof user === 'string' ? user : user.vai_tro
  const sanitizedRedirect = sanitizeRedirectPath(redirectTo)

  if (sanitizedRedirect && canAccessPath(role, sanitizedRedirect)) {
    return sanitizedRedirect
  }

  if (typeof user !== 'string') {
    const onboardingRedirect = sanitizeRedirectPath(user.redirect_to)
    if (onboardingRedirect && canAccessPath(role, onboardingRedirect)) {
      return onboardingRedirect
    }
  }

  return getDefaultRouteForRole(role)
}

export function sanitizeRedirectPath(path?: string | null) {
  if (!path) return null
  if (!path.startsWith('/')) return null
  if (path.startsWith('//')) return null

  return path
}

export function getRoleLabel(role: UserRole) {
  switch (role) {
    case 'quan_tri':
      return 'Admin'
    case 'chuyen_gia_dinh_duong':
      return 'Nutritionist'
    case 'nguoi_dung':
    default:
      return 'User'
  }
}
