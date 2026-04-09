import { create } from 'zustand'
import type { AuthUser } from '@/lib/auth'

interface AuthState {
  auth: {
    user: AuthUser | null
    isHydrated: boolean
    setUser: (user: AuthUser | null) => void
    setHydrated: (isHydrated: boolean) => void
    reset: () => void
  }
}

export const useAuthStore = create<AuthState>()((set) => {
  return {
    auth: {
      user: null,
      isHydrated: false,
      setUser: (user) =>
        set((state) => ({ ...state, auth: { ...state.auth, user } })),
      setHydrated: (isHydrated) =>
        set((state) => ({ ...state, auth: { ...state.auth, isHydrated } })),
      reset: () =>
        set((state) => ({
          ...state,
          auth: { ...state.auth, user: null, isHydrated: true },
        })),
    },
  }
})
