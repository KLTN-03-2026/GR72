import { redirect } from 'next/navigation'
import { NutritionistBookingDetail } from '@/features/nutritionist/bookings/detail'

type Props = { params: Promise<{ id: string }> }

export default async function NutritionistBookingDetailPage({ params }: Props) {
  const { id } = await params
  const bookingId = Number(id)

  if (!Number.isFinite(bookingId) || bookingId < 1) {
    redirect('/nutritionist/bookings')
  }

  return <NutritionistBookingDetail bookingId={bookingId} />
}
