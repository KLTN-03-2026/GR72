'use client'

import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { LanguageSwitch } from '@/components/language-switch'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { NotificationBell } from './notification-bell'

type NutritionTopbarProps = {
  staff?: boolean
}

export function NutritionTopbar({ staff = false }: NutritionTopbarProps) {
  return (
    <Header fixed>
      <Search />
      <div className='ms-auto flex items-center space-x-2'>
        <NotificationBell />
        <LanguageSwitch />
        <ThemeSwitch />
        {staff ? <ConfigDrawer /> : null}
        <ProfileDropdown />
      </div>
    </Header>
  )
}
