'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { getRoleLabel, isStaffAreaPath } from '@/lib/auth'
import { Link } from '@/lib/router'
import useDialogState from '@/hooks/use-dialog-state'
import { useI18n } from '@/context/i18n-provider'
import { useAuthStore } from '@/stores/auth-store'
import { usePortalStore } from '@/stores/portal-store'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { SignOutDialog } from '@/components/sign-out-dialog'

export function ProfileDropdown() {
  const [open, setOpen] = useDialogState()
  const pathname = usePathname()
  const isStaffRoute = isStaffAreaPath(pathname)
  const { nutrition } = useI18n()
  const user = useAuthStore((state) => state.auth.user)
  const { staffRole, setStaffRole, hydrate } = usePortalStore()

  useEffect(() => {
    hydrate()
  }, [hydrate])

  const profileLink = isStaffRoute
    ? '/nutritionist/dashboard'
    : '/nutrition/profile'
  const notificationLink = isStaffRoute
    ? '/nutritionist/notifications'
    : '/nutrition/notifications'
  const accountLabel = isStaffRoute
    ? nutrition.profile.staffView
    : nutrition.profile.manageProfile
  const displayName = user?.ho_ten ?? (isStaffRoute ? 'Nutritionist Hoai Thu' : 'Minh Anh')
  const displayEmail = user?.email ??
    (isStaffRoute ? 'nutritionist@nutriwise.vn' : 'member@nutriwise.vn')
  const avatarFallback =
    displayName
      .split(' ')
      .filter(Boolean)
      .slice(-2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('') || 'NW'
  const roleLabel = user ? getRoleLabel(user.vai_tro) : null
  const canSwitchStaffRole = isStaffRoute && user?.vai_tro === 'quan_tri'

  return (
    <>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant='ghost' className='relative h-8 w-8 rounded-full'>
            <Avatar className='h-8 w-8'>
              <AvatarImage src='/logo.jpg' alt={displayName} />
              <AvatarFallback>{avatarFallback}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className='w-56' align='end' forceMount>
          <DropdownMenuLabel className='font-normal'>
            <div className='flex flex-col gap-1.5'>
              <p className='text-sm leading-none font-medium'>{displayName}</p>
              <p className='text-xs leading-none text-muted-foreground'>{displayEmail}</p>
              {roleLabel ? (
                <p className='text-xs leading-none text-muted-foreground'>
                  Vai trò: {roleLabel}
                </p>
              ) : null}
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem asChild>
              <Link to={profileLink}>
                {accountLabel}
                <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to={notificationLink}>
                {nutrition.profile.notifications}
                <DropdownMenuShortcut>⌘N</DropdownMenuShortcut>
              </Link>
            </DropdownMenuItem>
            {canSwitchStaffRole ? (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuLabel className='px-2 pb-1 text-xs text-muted-foreground'>
                  {nutrition.profile.roleSwitcher}
                </DropdownMenuLabel>
                <DropdownMenuItem onClick={() => setStaffRole('nutritionist')}>
                  Nutritionist
                  <DropdownMenuShortcut>
                    {staffRole === 'nutritionist' ? '●' : ''}
                  </DropdownMenuShortcut>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStaffRole('admin')}>
                  Admin
                  <DropdownMenuShortcut>
                    {staffRole === 'admin' ? '●' : ''}
                  </DropdownMenuShortcut>
                </DropdownMenuItem>
              </>
            ) : null}
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant='destructive' onClick={() => setOpen(true)}>
            {nutrition.profile.signOut}
            <DropdownMenuShortcut className='text-current'>
              ⇧⌘Q
            </DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <SignOutDialog open={!!open} onOpenChange={setOpen} />
    </>
  )
}
