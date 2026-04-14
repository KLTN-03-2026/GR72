import { redirect } from 'next/navigation'
import { NutritionStaffFoodReviewDetail } from '@/features/nutrition-staff/food-review-requests/detail'

type Props = { params: Promise<{ id: string }> }

export default async function NutritionistFoodReviewDetailPage({ params }: Props) {
  const { id } = await params
  const reviewId = Number(id)

  if (!Number.isFinite(reviewId) || reviewId < 1) {
    redirect('/nutritionist/food-review-requests')
  }

  return <NutritionStaffFoodReviewDetail reviewId={reviewId} />
}
