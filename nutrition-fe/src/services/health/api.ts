import {
  activeGoal,
  healthMetrics,
  healthTrend,
  todaySummary,
} from '@/features/nutrition/data/mock-data'

export function getActiveGoal() {
  return activeGoal
}

export function getHealthMetrics() {
  return healthMetrics
}

export function getHealthTrend() {
  return healthTrend
}

export function getTodaySummary() {
  return todaySummary
}
