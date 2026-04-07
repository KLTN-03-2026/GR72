import type { AppLocale } from '@/lib/i18n/types'

export const nutritionMessages: Record<
  AppLocale,
  {
    language: {
      label: string
      vietnamese: string
      english: string
    }
    teams: {
      user: {
        name: string
        plan: string
      }
      staff: {
        name: string
        plan: string
      }
    }
    roles: {
      nutritionist: string
      admin: string
    }
    sidebar: {
      user: {
        overview: string
        health: string
        nutrition: string
        ai: string
        content: string
        dashboard: string
        profile: string
        goals: string
        healthMetrics: string
        foods: string
        mealLogs: string
        mealPlans: string
        aiAdvisor: string
        articles: string
        notifications: string
      }
      staff: {
        overview: string
        nutritionData: string
        professionalContent: string
        administration: string
        dashboard: string
        foods: string
        foodReviewRequests: string
        recipes: string
        mealTemplates: string
        articles: string
        users: string
        notifications: string
      }
    }
    command: {
      placeholder: string
      empty: string
      theme: string
      light: string
      dark: string
      system: string
    }
    profile: {
      manageProfile: string
      notifications: string
      roleSwitcher: string
      staffView: string
      signOut: string
    }
  }
> = {
  vi: {
    language: {
      label: 'Đổi ngôn ngữ',
      vietnamese: 'Tiếng Việt',
      english: 'Tiếng Anh',
    },
    teams: {
      user: {
        name: 'Không gian người dùng',
        plan: 'Theo dõi sức khỏe cá nhân',
      },
      staff: {
        name: 'Không gian vận hành',
        plan: 'Nutritionist và Admin',
      },
    },
    roles: {
      nutritionist: 'Nutritionist',
      admin: 'Admin',
    },
    sidebar: {
      user: {
        overview: 'Tổng quan',
        health: 'Sức khỏe',
        nutrition: 'Dinh dưỡng',
        ai: 'AI tư vấn',
        content: 'Nội dung',
        dashboard: 'Dashboard',
        profile: 'Hồ sơ sức khỏe',
        goals: 'Mục tiêu sức khỏe',
        healthMetrics: 'Chỉ số sức khỏe',
        foods: 'Thực phẩm',
        mealLogs: 'Nhật ký ăn uống',
        mealPlans: 'Thực đơn cá nhân',
        aiAdvisor: 'AI tư vấn',
        articles: 'Bài viết',
        notifications: 'Thông báo',
      },
      staff: {
        overview: 'Tổng quan',
        nutritionData: 'Dữ liệu dinh dưỡng',
        professionalContent: 'Nội dung chuyên môn',
        administration: 'Quản trị',
        dashboard: 'Dashboard staff',
        foods: 'Quản lý thực phẩm',
        foodReviewRequests: 'Yêu cầu duyệt dữ liệu',
        recipes: 'Recipes',
        mealTemplates: 'Meal templates',
        articles: 'Bài viết',
        users: 'Quản lý user',
        notifications: 'Thông báo hệ thống',
      },
    },
    command: {
      placeholder: 'Tìm màn hình hoặc thao tác...',
      empty: 'Không tìm thấy kết quả.',
      theme: 'Giao diện',
      light: 'Sáng',
      dark: 'Tối',
      system: 'Theo hệ thống',
    },
    profile: {
      manageProfile: 'Hồ sơ cá nhân',
      notifications: 'Thông báo',
      roleSwitcher: 'Vai trò staff',
      staffView: 'Chế độ staff',
      signOut: 'Đăng xuất',
    },
  },
  en: {
    language: {
      label: 'Change language',
      vietnamese: 'Vietnamese',
      english: 'English',
    },
    teams: {
      user: {
        name: 'User workspace',
        plan: 'Personal health tracking',
      },
      staff: {
        name: 'Operations workspace',
        plan: 'Nutritionist and Admin',
      },
    },
    roles: {
      nutritionist: 'Nutritionist',
      admin: 'Admin',
    },
    sidebar: {
      user: {
        overview: 'Overview',
        health: 'Health',
        nutrition: 'Nutrition',
        ai: 'AI Advisor',
        content: 'Content',
        dashboard: 'Dashboard',
        profile: 'Health Profile',
        goals: 'Health Goals',
        healthMetrics: 'Health Metrics',
        foods: 'Foods',
        mealLogs: 'Meal Logs',
        mealPlans: 'Meal Plans',
        aiAdvisor: 'AI Advisor',
        articles: 'Articles',
        notifications: 'Notifications',
      },
      staff: {
        overview: 'Overview',
        nutritionData: 'Nutrition Data',
        professionalContent: 'Professional Content',
        administration: 'Administration',
        dashboard: 'Staff Dashboard',
        foods: 'Foods',
        foodReviewRequests: 'Review Requests',
        recipes: 'Recipes',
        mealTemplates: 'Meal Templates',
        articles: 'Articles',
        users: 'Users',
        notifications: 'System Notifications',
      },
    },
    command: {
      placeholder: 'Search screens or actions...',
      empty: 'No results found.',
      theme: 'Theme',
      light: 'Light',
      dark: 'Dark',
      system: 'System',
    },
    profile: {
      manageProfile: 'Profile',
      notifications: 'Notifications',
      roleSwitcher: 'Staff role',
      staffView: 'Staff mode',
      signOut: 'Sign out',
    },
  },
}
