import { NutritionWorkspace } from '@/features/nutrition/workspace'

export default function NutritionistFallbackPage() {
  return (
    <NutritionWorkspace
      title='Màn nutritionist đang được mở rộng'
      description='Route này đã được reserve cho nhánh nutritionist và có thể tiếp tục custom theo nghiệp vụ vận hành dinh dưỡng.'
      staff
    />
  )
}
