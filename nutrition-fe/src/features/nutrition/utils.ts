import type {
  GoalSummary,
  HealthMetricEntry,
  HealthTrendPoint,
  MacroSummary,
  MealLogRecord,
} from '@/features/nutrition/types'

export function calculateHealthTrend(
  metrics: HealthMetricEntry[]
): HealthTrendPoint[] {
  return metrics
    .slice()
    .reverse()
    .map((metric) => ({
      date: metric.measuredAt.split(' ')[0].slice(0, 5),
      weight: metric.weightKg,
      bmi: metric.bmi,
    }))
}

export function calculateTodaySummary(
  logs: MealLogRecord[],
  fallback: MacroSummary
): MacroSummary {
  if (!logs.length) return fallback

  const latestDate = logs[0]?.date
  const todaysLogs = logs.filter((log) => log.date === latestDate)

  if (!todaysLogs.length) return fallback

  return todaysLogs.reduce(
    (acc, log) => ({
      calories: acc.calories + log.calories,
      protein: acc.protein + log.protein,
      carbs: acc.carbs + log.carbs,
      fat: acc.fat + log.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  )
}

export function buildHealthMetricFromInput(input: {
  measuredAt: string
  weightKg: number
  heightCm: number
  waistCm?: number
  hipCm?: number
  bloodGlucose?: number
  note: string
  gender?: string
  birthDate?: string
  activityLevel?: string
}): HealthMetricEntry {
  const heightM = input.heightCm / 100
  const bmi = Number((input.weightKg / (heightM * heightM)).toFixed(1))
  const age = input.birthDate
    ? new Date().getFullYear() - new Date(input.birthDate).getFullYear()
    : 23
  const isMale = input.gender === 'Nam'
  const bmrRaw = isMale
    ? 10 * input.weightKg + 6.25 * input.heightCm - 5 * age + 5
    : 10 * input.weightKg + 6.25 * input.heightCm - 5 * age - 161
  const activityFactorMap: Record<string, number> = {
    'Vận động nhẹ': 1.375,
    'Vận động vừa': 1.55,
    'Vận động nhiều': 1.725,
    'Năng động': 1.725,
  }
  const tdee = Number(
    (bmrRaw * (activityFactorMap[input.activityLevel ?? 'Vận động vừa'] ?? 1.55)).toFixed(0)
  )

  return {
    measuredAt: input.measuredAt,
    weightKg: input.weightKg,
    bmi,
    bmr: Number(bmrRaw.toFixed(0)),
    tdee,
    note: input.note,
  }
}

export function buildGoalProgressText(goal: GoalSummary, latestWeight: number) {
  const total = Math.abs(goal.startWeight - goal.targetWeight)
  const done = Math.abs(goal.startWeight - latestWeight)
  const percent = total > 0 ? Math.min(Math.round((done / total) * 100), 100) : 0

  return `Đã hoàn thành khoảng ${percent}% chặng đường mục tiêu.`
}
