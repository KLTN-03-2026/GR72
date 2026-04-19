import { NutritionUserNutritionistDetail } from '@/features/nutrition-user/nutritionist-detail'

export default async function NutritionUserNutritionistDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  return <NutritionUserNutritionistDetail nutritionistId={Number(id)} />
}
