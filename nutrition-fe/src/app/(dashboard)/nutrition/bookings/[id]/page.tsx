import { NutritionUserBookingDetail } from '@/features/nutrition-user/booking-detail'

export default async function NutritionUserBookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  return <NutritionUserBookingDetail bookingId={Number(id)} />
}
