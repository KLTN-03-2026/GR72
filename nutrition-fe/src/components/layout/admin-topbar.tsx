'use client'

import { Header } from '@/components/layout/header'
import { LanguageSwitch } from '@/components/language-switch'
import { ThemeSwitch } from '@/components/theme-switch'
import { AdminNotificationBell } from '@/features/admin-notifications/admin-notification-bell'
import { ProfileDropdown } from '@/components/profile-dropdown'

export function AdminTopbar() {
  return (
    <Header fixed>
      <div className='ms-auto flex items-center space-x-2'>
        <AdminNotificationBell />
        <LanguageSwitch />
        <ThemeSwitch />
        <ProfileDropdown />
      </div>
    </Header>
  )
}
