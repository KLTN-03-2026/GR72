import { create } from 'zustand'

export type StaffPortalRole = 'nutritionist' | 'admin'

const STAFF_ROLE_STORAGE_KEY = 'nutrition_staff_role'

function readStoredRole(): StaffPortalRole {
  if (typeof window === 'undefined') return 'nutritionist'
  const stored = window.localStorage.getItem(STAFF_ROLE_STORAGE_KEY)
  return stored === 'admin' ? 'admin' : 'nutritionist'
}

type PortalState = {
  staffRole: StaffPortalRole
  hydrate: () => void
  setStaffRole: (role: StaffPortalRole) => void
  reset: () => void
}

export const usePortalStore = create<PortalState>()((set) => ({
  staffRole: 'nutritionist',
  hydrate: () => {
    set({ staffRole: readStoredRole() })
  },
  setStaffRole: (role) => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STAFF_ROLE_STORAGE_KEY, role)
    }

    set({ staffRole: role })
  },
  reset: () => {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(STAFF_ROLE_STORAGE_KEY)
    }

    set({ staffRole: 'nutritionist' })
  },
}))
