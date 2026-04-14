import { redirect } from 'next/navigation'
import { NutritionStaffFoodDetail } from '@/features/nutrition-staff/foods/food-detail'

type Props = { params: Promise<{ id: string }> }

export default async function NutritionistFoodDetailPage({ params }: Props) {
  const { id } = await params
  const foodId = Number(id)
  if (!Number.isFinite(foodId) || foodId < 1) {
    redirect('/nutritionist/foods')
  }
  return <NutritionStaffFoodDetail foodId={foodId} />
}
