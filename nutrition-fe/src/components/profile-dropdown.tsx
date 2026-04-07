'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { Link } from '@/lib/router'
import useDialogState from '@/hooks/use-dialog-state'
import { useI18n } from '@/context/i18n-provider'
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
  const isStaffRoute = pathname.startsWith('/staff')
  const { nutrition } = useI18n()
  const { staffRole, setStaffRole, hydrate } = usePortalStore()

  useEffect(() => {
    hydrate()
  }, [hydrate])

  const profileLink = pathname.startsWith('/staff')
    ? '/staff/dashboard'
    : '/nutrition/profile'
  const notificationLink = pathname.startsWith('/staff')
    ? '/staff/notifications'
    : '/nutrition/notifications'
  const accountLabel = isStaffRoute
    ? nutrition.profile.staffView
    : nutrition.profile.manageProfile

  return (
    <>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant='ghost' className='relative h-8 w-8 rounded-full'>
            <Avatar className='h-8 w-8'>
              <AvatarImage src='/logo.jpg' alt='Bug Media logo' />
              <AvatarFallback>BM</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className='w-56' align='end' forceMount>
          <DropdownMenuLabel className='font-normal'>
            <div className='flex flex-col gap-1.5'>
              <p className='text-sm leading-none font-medium'>
                {isStaffRoute ? 'Nutritionist Hoai Thu' : 'Minh Anh'}
              </p>
              <p className='text-xs leading-none text-muted-foreground'>
                {isStaffRoute
                  ? 'nutritionist@nutriwise.vn'
                  : 'member@nutriwise.vn'}
              </p>
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
            {isStaffRoute ? (
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
