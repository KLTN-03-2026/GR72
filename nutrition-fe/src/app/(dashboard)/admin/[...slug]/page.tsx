import { NutritionWorkspace } from '@/features/nutrition/workspace'

export default function AdminFallbackPage() {
  return (
    <NutritionWorkspace
      title='Màn admin đang được mở rộng'
      description='Route này đã được reserve cho nhánh admin và có thể tiếp tục custom theo nghiệp vụ quản trị hệ thống.'
      staff
    />
  )
}
