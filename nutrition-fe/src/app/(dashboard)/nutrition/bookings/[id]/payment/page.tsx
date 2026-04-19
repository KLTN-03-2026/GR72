import { NutritionUserBookingPayment } from '@/features/nutrition-user/booking-payment'

export default async function NutritionUserBookingPaymentPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  return <NutritionUserBookingPayment bookingId={Number(id)} />
}
