'use client'

import { useEffect, useMemo, useState } from 'react'
import { usePathname } from 'next/navigation'
import { useRouter } from 'next/navigation'
import { useLayout } from '@/context/layout-provider'
import { useI18n } from '@/context/i18n-provider'
import { getDefaultRouteForRole, isStaffAreaPath } from '@/lib/auth'
import { useAuthStore } from '@/stores/auth-store'
import { usePortalStore } from '@/stores/portal-store'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from '@/components/ui/sidebar'
// import { AppTitle } from './app-title'
import {
  getSidebarNavGroups,
  getSidebarTeams,
  getSidebarUser,
} from './data/sidebar-data'
import { NavGroup } from './nav-group'
import { NavUser } from './nav-user'
import { TeamSwitcher } from './team-switcher'
import { type Team } from './types'

const ACTIVE_TEAM_STORAGE_KEY = 'active_team_id'

export function AppSidebar() {
  const { collapsible, variant } = useLayout()
  const { locale } = useI18n()
  const pathname = usePathname()
  const router = useRouter()
  const { auth } = useAuthStore()
  const teams = useMemo(() => getSidebarTeams(locale), [locale])
  const visibleTeams = useMemo(() => {
    if (auth.user?.vai_tro === 'nguoi_dung') {
      return teams.filter((team) => team.id === 'nutrition-user')
    }

    if (
      auth.user?.vai_tro === 'chuyen_gia_dinh_duong' ||
      auth.user?.vai_tro === 'quan_tri'
    ) {
      return teams.filter((team) => team.id === 'nutrition-staff')
    }

    return teams
  }, [auth.user?.vai_tro, teams])
  const [selectedTeam, setSelectedTeam] = useState<Team>(visibleTeams[0] ?? teams[0])
  const { staffRole, hydrate } = usePortalStore()

  useEffect(() => {
    hydrate()
  }, [hydrate])

  useEffect(() => {
    queueMicrotask(() => {
      const savedTeamId = window.localStorage.getItem(ACTIVE_TEAM_STORAGE_KEY)
      const savedTeam = visibleTeams.find((team) => team.id === savedTeamId)
      if (savedTeam) {
        setSelectedTeam(savedTeam)
      }
    })
  }, [visibleTeams])

  const activeTeam = useMemo(() => {
    if (isStaffAreaPath(pathname)) {
      return visibleTeams.find((team) => team.id === 'nutrition-staff') ?? selectedTeam
    }

    if (pathname.startsWith('/nutrition')) {
      return visibleTeams.find((team) => team.id === 'nutrition-user') ?? selectedTeam
    }

    return visibleTeams.find((team) => team.id === selectedTeam.id) ?? visibleTeams[0] ?? teams[0]
  }, [pathname, selectedTeam, teams, visibleTeams])

  useEffect(() => {
    window.localStorage.setItem(ACTIVE_TEAM_STORAGE_KEY, activeTeam.id)
  }, [activeTeam.id])

  const handleTeamChange = (team: Team) => {
    setSelectedTeam(team)
    window.localStorage.setItem(ACTIVE_TEAM_STORAGE_KEY, team.id)
    const nextUrl =
      team.id === 'nutrition-staff' && auth.user
        ? getDefaultRouteForRole(auth.user.vai_tro)
        : team.defaultUrl

    router.push(nextUrl)
  }

  const navGroups = getSidebarNavGroups(activeTeam.id, locale, staffRole)
  const fallbackSidebarUser = getSidebarUser(activeTeam.id, staffRole)
  const sidebarUser = auth.user
    ? {
        name: auth.user.ho_ten,
        email: auth.user.email,
        avatar: fallbackSidebarUser.avatar,
      }
    : fallbackSidebarUser

  return (
    <Sidebar collapsible={collapsible} variant={variant}>
      <SidebarHeader>
        <TeamSwitcher
          teams={visibleTeams}
          activeTeam={activeTeam}
          onTeamChange={handleTeamChange}
        />

        {/* Replace <TeamSwitch /> with the following <AppTitle />
         /* if you want to use the normal app title instead of TeamSwitch dropdown */}
        {/* <AppTitle /> */}
      </SidebarHeader>
      <SidebarContent>
        {navGroups.map((props) => (
          <NavGroup key={props.title} {...props} />
        ))}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={sidebarUser} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
