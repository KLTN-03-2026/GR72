import { create } from 'zustand'
import {
  persist,
  createJSONStorage,
  type StateStorage,
} from 'zustand/middleware'
import {
  activeGoal,
  aiAdvisorState,
  articles,
  foodReviewRequests,
  foods,
  healthMetrics,
  mealLogs,
  mealPlans,
  mealTemplates,
  notifications,
  recipes,
  staffUsers,
  userProfile,
} from '@/features/nutrition/data/mock-data'
import type {
  AiAdvisorState,
  ArticleRecord,
  FoodRecord,
  FoodReviewRequestRecord,
  GoalSummary,
  HealthMetricEntry,
  MealLogRecord,
  MealPlanRecord,
  MealTemplateRecord,
  NotificationRecord,
  RecipeRecord,
  StaffUserRecord,
  UserProfile,
} from '@/features/nutrition/types'

type NutritionState = {
  profile: UserProfile
  goal: GoalSummary
  healthMetrics: HealthMetricEntry[]
  mealLogs: MealLogRecord[]
  mealPlans: MealPlanRecord[]
  notifications: NotificationRecord[]
  aiAdvisor: AiAdvisorState
  foods: FoodRecord[]
  foodReviewRequests: FoodReviewRequestRecord[]
  recipes: RecipeRecord[]
  mealTemplates: MealTemplateRecord[]
  articles: ArticleRecord[]
  staffUsers: StaffUserRecord[]
  updateProfile: (profile: UserProfile) => void
  updateGoal: (goal: GoalSummary) => void
  addHealthMetric: (metric: HealthMetricEntry) => void
  addMealLog: (log: MealLogRecord) => void
  addMealPlan: (plan: MealPlanRecord) => void
  addNotification: (notification: NotificationRecord) => void
  markNotificationRead: (id: string) => void
  markAllNotificationsRead: () => void
  sendAiMessage: (message: string) => void
  saveFood: (food: FoodRecord) => void
  updateFoodReviewStatus: (
    id: string,
    status: FoodReviewRequestRecord['status']
  ) => void
  saveRecipe: (recipe: RecipeRecord) => void
  saveMealTemplate: (template: MealTemplateRecord) => void
  saveArticle: (article: ArticleRecord) => void
  updateStaffUser: (
    id: string,
    patch: Partial<Pick<StaffUserRecord, 'role' | 'status'>>
  ) => void
}

function clone<T>(data: T): T {
  return JSON.parse(JSON.stringify(data)) as T
}

function buildMessageId(prefix: string) {
  return `${prefix}-${Date.now()}`
}

function getCurrentTimeLabel() {
  return new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date())
}

function getCurrentDateLabel() {
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date())
}

function isBrowser() {
  return typeof window !== 'undefined'
}

const noopStorage: StateStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
}

const initialState = {
  profile: clone(userProfile),
  goal: clone(activeGoal),
  healthMetrics: clone(healthMetrics),
  mealLogs: clone(mealLogs),
  mealPlans: clone(mealPlans),
  notifications: clone(notifications),
  aiAdvisor: clone(aiAdvisorState),
  foods: clone(foods),
  foodReviewRequests: clone(foodReviewRequests),
  recipes: clone(recipes),
  mealTemplates: clone(mealTemplates),
  articles: clone(articles),
  staffUsers: clone(staffUsers),
}

export const useNutritionStore = create<NutritionState>()(
  persist(
    (set) => ({
      ...initialState,
      updateProfile: (profile) => set(() => ({ profile })),
      updateGoal: (goal) => set(() => ({ goal })),
      addHealthMetric: (metric) =>
        set((state) => ({
          healthMetrics: [metric, ...state.healthMetrics],
          notifications: [
            {
              id: buildMessageId('NOTI'),
              title: 'Đã lưu lần đo mới',
              content: 'Dữ liệu sức khỏe vừa được cập nhật và sẵn sàng cho dashboard.',
              type: 'Hệ thống',
              status: 'Chưa đọc',
              createdAt: `${getCurrentDateLabel()} ${getCurrentTimeLabel()}`,
            },
            ...state.notifications,
          ],
        })),
      addMealLog: (log) =>
        set((state) => ({
          mealLogs: [log, ...state.mealLogs],
        })),
      addMealPlan: (plan) =>
        set((state) => ({
          mealPlans: [plan, ...state.mealPlans],
        })),
      addNotification: (notification) =>
        set((state) => ({
          notifications: [notification, ...state.notifications],
        })),
      markNotificationRead: (id) =>
        set((state) => ({
          notifications: state.notifications.map((notification) =>
            notification.id === id
              ? { ...notification, status: 'Đã đọc' }
              : notification
          ),
        })),
      markAllNotificationsRead: () =>
        set((state) => ({
          notifications: state.notifications.map((notification) => ({
            ...notification,
            status: 'Đã đọc',
          })),
        })),
      sendAiMessage: (message) =>
        set((state) => ({
          aiAdvisor: {
            ...state.aiAdvisor,
            messages: [
              ...state.aiAdvisor.messages,
              {
                id: buildMessageId('USER'),
                role: 'user',
                content: message,
                time: getCurrentTimeLabel(),
              },
              {
                id: buildMessageId('AI'),
                role: 'assistant',
                content:
                  'Dựa trên dữ liệu hiện tại, bạn nên ưu tiên bữa phụ giàu đạm và tránh khoảng đói quá dài giữa trưa và tối.',
                time: getCurrentTimeLabel(),
              },
            ],
          },
          notifications: [
            {
              id: buildMessageId('NOTI'),
              title: 'AI đã tạo phản hồi mới',
              content: 'Khuyến nghị dinh dưỡng vừa được cập nhật trong phiên tư vấn của bạn.',
              type: 'AI',
              status: 'Chưa đọc',
              createdAt: `${getCurrentDateLabel()} ${getCurrentTimeLabel()}`,
            },
            ...state.notifications,
          ],
        })),
      saveFood: (food) =>
        set((state) => ({
          foods: state.foods.some((item) => item.id === food.id)
            ? state.foods.map((item) => (item.id === food.id ? food : item))
            : [food, ...state.foods],
        })),
      updateFoodReviewStatus: (id, status) =>
        set((state) => ({
          foodReviewRequests: state.foodReviewRequests.map((item) =>
            item.id === id ? { ...item, status } : item
          ),
        })),
      saveRecipe: (recipe) =>
        set((state) => ({
          recipes: state.recipes.some((item) => item.id === recipe.id)
            ? state.recipes.map((item) => (item.id === recipe.id ? recipe : item))
            : [recipe, ...state.recipes],
        })),
      saveMealTemplate: (template) =>
        set((state) => ({
          mealTemplates: state.mealTemplates.some((item) => item.id === template.id)
            ? state.mealTemplates.map((item) =>
                item.id === template.id ? template : item
              )
            : [template, ...state.mealTemplates],
        })),
      saveArticle: (article) =>
        set((state) => ({
          articles: state.articles.some((item) => item.id === article.id)
            ? state.articles.map((item) => (item.id === article.id ? article : item))
            : [article, ...state.articles],
        })),
      updateStaffUser: (id, patch) =>
        set((state) => ({
          staffUsers: state.staffUsers.map((item) =>
            item.id === id ? { ...item, ...patch } : item
          ),
        })),
    }),
    {
      name: 'nutrition-demo-store',
      storage: createJSONStorage(() =>
        isBrowser() ? window.localStorage : noopStorage
      ),
      partialize: (state) => ({
        profile: state.profile,
        goal: state.goal,
        healthMetrics: state.healthMetrics,
        mealLogs: state.mealLogs,
        mealPlans: state.mealPlans,
        notifications: state.notifications,
        aiAdvisor: state.aiAdvisor,
        foods: state.foods,
        foodReviewRequests: state.foodReviewRequests,
        recipes: state.recipes,
        mealTemplates: state.mealTemplates,
        articles: state.articles,
        staffUsers: state.staffUsers,
      }),
    }
  )
)
