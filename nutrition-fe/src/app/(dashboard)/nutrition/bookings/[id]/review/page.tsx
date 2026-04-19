import { NutritionUserBookingReview } from '@/features/nutrition-user/booking-review'
import { notFound } from 'next/navigation'

export default async function NutritionUserBookingReviewPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const bookingId = Number(id)
  if (!Number.isInteger(bookingId) || bookingId <= 0) {
    notFound()
  }
  return <NutritionUserBookingReview bookingId={bookingId} />
}
