import { NutritionWorkspace } from '@/features/nutrition/workspace'

export default function StaffFallbackPage() {
  return (
    <NutritionWorkspace
      title='Màn staff đang được mở rộng'
      description='Route này đã được reserve cho nhánh staff và có thể tiếp tục custom theo nghiệp vụ nutritionist/admin.'
      staff
    />
  )
}
