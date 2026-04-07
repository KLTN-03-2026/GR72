export type MacroSummary = {
  calories: number
  protein: number
  carbs: number
  fat: number
}

export type HealthTrendPoint = {
  date: string
  weight: number
  bmi: number
}

export type GoalSummary = {
  type: 'Giảm cân' | 'Tăng cân' | 'Duy trì'
  targetWeight: number
  startWeight: number
  dailyTargets: MacroSummary
  targetDate: string
}

export type UserProfile = {
  fullName: string
  gender: string
  birthDate: string
  heightCm: number
  currentWeightKg: number
  activityLevel: string
  allergies: string[]
  dietaryPreferences: string[]
}

export type HealthMetricEntry = {
  measuredAt: string
  weightKg: number
  bmi: number
  bmr: number
  tdee: number
  note: string
}

export type FoodRecord = {
  id: string
  name: string
  group: string
  serving: string
  calories: number
  protein: number
  carbs: number
  fat: number
  source: string
  status: 'Đã xác minh' | 'Từ nguồn ngoài'
}

export type MealLogRecord = {
  id: string
  date: string
  mealType: string
  items: string
  calories: number
  protein: number
  carbs: number
  fat: number
}

export type MealPlanRecord = {
  id: string
  title: string
  planDate: string
  meals: string[]
  totalCalories: number
  status: 'Đang áp dụng' | 'Bản nháp' | 'Hoàn tất'
}

export type MealTemplateRecord = {
  id: string
  title: string
  target: string
  targetCalories: number
  meals: string[]
  status: 'Xuất bản' | 'Bản nháp'
}

export type ArticleRecord = {
  id: string
  title: string
  slug?: string
  category: string
  summary: string
  content?: string
  thumbnailUrl?: string
  author?: string
  tags?: string[]
  publishedAt?: string
  status: 'Xuất bản' | 'Bản nháp'
  updatedAt: string
  aiGuidelines?: string[]
}

export type NotificationRecord = {
  id: string
  title: string
  content: string
  type: 'Nhắc việc' | 'AI' | 'Hệ thống'
  status: 'Chưa đọc' | 'Đã đọc'
  createdAt: string
}

export type AiMessage = {
  id: string
  role: 'user' | 'assistant'
  content: string
  time: string
}

export type AiAdvisorState = {
  sessionTitle: string
  healthEvaluation: string
  recommendation: string
  messages: AiMessage[]
}

export type FoodReviewRequestRecord = {
  id: string
  requestType: string
  foodName: string
  source: string
  requestedBy: string
  status: 'Chờ duyệt' | 'Đã duyệt' | 'Từ chối'
  updatedAt: string
}

export type RecipeRecord = {
  id: string
  name: string
  category: string
  servings: number
  totalCalories: number
  status: 'Xuất bản' | 'Bản nháp'
}

export type StaffUserRecord = {
  id: string
  name: string
  email: string
  role: 'User' | 'Nutritionist' | 'Admin'
  status: 'Hoạt động' | 'Tạm khóa'
  lastActive: string
}

export type StaffDashboardSummary = {
  totalUsers: number
  totalMealLogs: number
  totalAiSessions: number
  publishedArticles: number
  pendingFoodReviews: number
}
