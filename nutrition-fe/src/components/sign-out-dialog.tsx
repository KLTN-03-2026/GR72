'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { useNavigate, useLocation } from '@/lib/router'
import { logout } from '@/services/auth/api'
import { useAuthStore } from '@/stores/auth-store'
import { usePortalStore } from '@/stores/portal-store'
import { ConfirmDialog } from '@/components/confirm-dialog'

interface SignOutDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SignOutDialog({ open, onOpenChange }: SignOutDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { auth } = useAuthStore()
  const resetPortal = usePortalStore((state) => state.reset)

  const handleSignOut = () => {
    setIsLoading(true)

    const signOutPromise = logout()
      .finally(() => {
        auth.reset()
        resetPortal()
        setIsLoading(false)
        onOpenChange(false)

        const currentPath = location.href
        navigate({
          to: '/sign-in',
          search: { redirect: currentPath },
          replace: true,
        })
      })

    toast.promise(signOutPromise, {
      loading: 'Đang đăng xuất...',
      success: 'Đăng xuất thành công',
      error: 'Đăng xuất thất bại',
    })
  }

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title='Sign out'
      desc='Are you sure you want to sign out? You will need to sign in again to access your account.'
      confirmText='Sign out'
      destructive
      handleConfirm={handleSignOut}
      isLoading={isLoading}
      className='sm:max-w-sm'
    />
  )
}
