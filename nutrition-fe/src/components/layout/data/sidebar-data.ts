import * as React from 'react'
import {
  Apple,
  Bell,
  BookOpenText,
  Bot,
  ClipboardList,
  FileSearch,
  Goal,
  HeartPulse,
  LayoutDashboard,
  Layers3,
  NotebookPen,
  Salad,
  ShieldPlus,
  Soup,
  Users,
} from 'lucide-react'
import { nutritionMessages } from '@/lib/i18n/nutrition'
import type { AppLocale } from '@/lib/i18n/types'
import { type StaffPortalRole } from '@/stores/portal-store'
import { type NavGroup, type SidebarData, type TeamId, type Team } from '../types'

function NutritionUserLogo(props: React.ComponentProps<'div'>) {
  const { className, ...rest } = props

  return React.createElement(
    'div',
    { className, ...rest },
    React.createElement(HeartPulse, {
      className: 'size-4',
    })
  )
}

function NutritionStaffLogo(props: React.ComponentProps<'div'>) {
  const { className, ...rest } = props

  return React.createElement(
    'div',
    { className, ...rest },
    React.createElement(ShieldPlus, {
      className: 'size-4',
    })
  )
}

function getTeams(locale: AppLocale): Team[] {
  const copy = nutritionMessages[locale]

  return [
    {
      id: 'nutrition-user',
      name: copy.teams.user.name,
      logo: NutritionUserLogo,
      plan: copy.teams.user.plan,
      defaultUrl: '/nutrition/dashboard',
    },
    {
      id: 'nutrition-staff',
      name: copy.teams.staff.name,
      logo: NutritionStaffLogo,
      plan: copy.teams.staff.plan,
      defaultUrl: '/nutritionist/dashboard',
    },
  ]
}

function getUserNavGroups(locale: AppLocale): NavGroup[] {
  const copy = nutritionMessages[locale].sidebar.user

  return [
    {
      title: copy.overview,
      items: [
        {
          title: copy.dashboard,
          url: '/nutrition/dashboard',
          icon: LayoutDashboard,
        },
      ],
    },
    {
      title: copy.health,
      items: [
        {
          title: copy.profile,
          url: '/nutrition/profile',
          icon: HeartPulse,
        },
        {
          title: copy.goals,
          url: '/nutrition/goals',
          icon: Goal,
        },
        {
          title: copy.healthMetrics,
          url: '/nutrition/health-metrics',
          icon: ClipboardList,
        },
      ],
    },
    {
      title: copy.nutrition,
      items: [
        {
          title: copy.foods,
          url: '/nutrition/foods',
          icon: Apple,
        },
        {
          title: copy.mealLogs,
          url: '/nutrition/meal-logs',
          icon: Soup,
        },
        {
          title: copy.mealPlans,
          url: '/nutrition/meal-plans',
          icon: NotebookPen,
        },
      ],
    },
    {
      title: copy.ai,
      items: [
        {
          title: copy.aiAdvisor,
          url: '/nutrition/ai-advisor',
          icon: Bot,
        },
      ],
    },
    {
      title: copy.content,
      items: [
        {
          title: copy.articles,
          url: '/nutrition/articles',
          icon: BookOpenText,
        },
        {
          title: copy.notifications,
          url: '/nutrition/notifications',
          icon: Bell,
        },
      ],
    },
  ]
}

function getStaffNavGroups(
  locale: AppLocale,
  staffRole: StaffPortalRole
): NavGroup[] {
  const copy = nutritionMessages[locale].sidebar.staff

  return [
    {
      title: copy.overview,
      items: [
        {
          title: copy.dashboard,
          url: '/nutritionist/dashboard',
          icon: LayoutDashboard,
        },
      ],
    },
    {
      title: copy.nutritionData,
      items: [
        {
          title: copy.foods,
          url: '/nutritionist/foods',
          icon: Apple,
        },
        {
          title: copy.foodReviewRequests,
          url: '/nutritionist/food-review-requests',
          icon: FileSearch,
        },
        {
          title: copy.recipes,
          url: '/nutritionist/recipes',
          icon: Salad,
        },
        {
          title: copy.mealTemplates,
          url: '/nutritionist/meal-templates',
          icon: NotebookPen,
        },
      ],
    },
    {
      title: copy.professionalContent,
      items: [
        {
          title: copy.articles,
          url: '/nutritionist/articles',
          icon: BookOpenText,
        },
      ],
    },
    {
      title: copy.administration,
      items: [
        ...(staffRole === 'admin'
          ? [
              {
                title: copy.foods,
                url: '/admin/foods',
                icon: Apple,
              } as const,
              {
                title: 'Nhóm thực phẩm',
                url: '/admin/food-groups',
                icon: Layers3,
              } as const,
              {
                title: copy.users,
                url: '/admin/users',
                icon: Users,
              } as const,
            ]
          : []),
        {
          title: copy.notifications,
          url: '/nutritionist/notifications',
          icon: Bell,
        },
      ],
    },
  ]
}

export const sidebarData: SidebarData = {
  user: {
    name: 'Minh Anh',
    email: 'minhanh@nutriwise.vn',
    avatar: '/avatars/shadcn.jpg',
  },
  teams: getTeams('vi'),
  navGroups: getUserNavGroups('vi'),
}

export function getSidebarTeams(locale: AppLocale = 'vi') {
  return getTeams(locale)
}

export function getSidebarNavGroups(
  teamId: TeamId,
  locale: AppLocale = 'vi',
  staffRole: StaffPortalRole = 'nutritionist'
) {
  if (teamId === 'nutrition-staff') {
    return getStaffNavGroups(locale, staffRole)
  }

  return getUserNavGroups(locale)
}

export function getSidebarUser(teamId: TeamId, staffRole: StaffPortalRole) {
  if (teamId === 'nutrition-staff') {
    return {
      name: staffRole === 'admin' ? 'Admin Linh Chi' : 'Nutritionist Hoai Thu',
      email:
        staffRole === 'admin'
          ? 'admin@nutriwise.vn'
          : 'nutritionist@nutriwise.vn',
      avatar: '/avatars/shadcn.jpg',
    }
  }

  return {
    name: 'Minh Anh',
    email: 'member@nutriwise.vn',
    avatar: '/avatars/shadcn.jpg',
  }
}
