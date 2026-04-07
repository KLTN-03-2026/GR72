'use client'

import { useEffect, useMemo, useState } from 'react'
import { usePathname } from 'next/navigation'
import { useRouter } from 'next/navigation'
import { useLayout } from '@/context/layout-provider'
import { useI18n } from '@/context/i18n-provider'
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
  const teams = useMemo(() => getSidebarTeams(locale), [locale])
  const [selectedTeam, setSelectedTeam] = useState<Team>(teams[0])
  const { staffRole, hydrate } = usePortalStore()

  useEffect(() => {
    hydrate()
  }, [hydrate])

  useEffect(() => {
    queueMicrotask(() => {
      const savedTeamId = window.localStorage.getItem(ACTIVE_TEAM_STORAGE_KEY)
      const savedTeam = teams.find((team) => team.id === savedTeamId)
      if (savedTeam) {
        setSelectedTeam(savedTeam)
      }
    })
  }, [teams])

  const activeTeam = useMemo(() => {
    if (pathname.startsWith('/staff')) {
      return teams.find((team) => team.id === 'nutrition-staff') ?? selectedTeam
    }

    if (pathname.startsWith('/nutrition')) {
      return teams.find((team) => team.id === 'nutrition-user') ?? selectedTeam
    }

    return selectedTeam
  }, [pathname, selectedTeam, teams])

  useEffect(() => {
    window.localStorage.setItem(ACTIVE_TEAM_STORAGE_KEY, activeTeam.id)
  }, [activeTeam.id])

  const handleTeamChange = (team: Team) => {
    setSelectedTeam(team)
    window.localStorage.setItem(ACTIVE_TEAM_STORAGE_KEY, team.id)
    router.push(team.defaultUrl)
  }

  const navGroups = getSidebarNavGroups(activeTeam.id, locale, staffRole)
  const sidebarUser = getSidebarUser(activeTeam.id, staffRole)

  return (
    <Sidebar collapsible={collapsible} variant={variant}>
      <SidebarHeader>
        <TeamSwitcher
          teams={teams}
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
