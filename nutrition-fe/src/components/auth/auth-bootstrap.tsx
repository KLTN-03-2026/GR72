'use client'

import { useEffect } from 'react'
import { getStaffPortalRoleForUserRole } from '@/lib/auth'
import { getCurrentUser } from '@/services/auth/api'
import { useAuthStore } from '@/stores/auth-store'
import { usePortalStore } from '@/stores/portal-store'

export function AuthBootstrap() {
  const setUser = useAuthStore((state) => state.auth.setUser)
  const setHydrated = useAuthStore((state) => state.auth.setHydrated)
  const setStaffRole = usePortalStore((state) => state.setStaffRole)

  useEffect(() => {
    let isMounted = true

    const syncSession = async () => {
      try {
        const user = await getCurrentUser()
        if (!isMounted) return

        setUser(user)
        if (user) {
          setStaffRole(getStaffPortalRoleForUserRole(user.vai_tro))
        }
      } catch {
        if (!isMounted) return

        setUser(null)
      } finally {
        if (isMounted) {
          setHydrated(true)
        }
      }
    }

    void syncSession()

    return () => {
      isMounted = false
    }
  }, [setHydrated, setStaffRole, setUser])

  return null
}
