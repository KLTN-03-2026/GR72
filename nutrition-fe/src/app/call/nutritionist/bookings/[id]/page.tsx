import { redirect } from 'next/navigation'
import { ConsultationCall } from '@/features/consultation-call'
import { ForbiddenError } from '@/features/errors/forbidden'
import { getServerSessionUser } from '@/lib/server-auth'

type Props = {
  params: Promise<{ id: string }>
}

export default async function NutritionistStandaloneCallPage({ params }: Props) {
  const user = await getServerSessionUser()
  if (!user) {
    redirect('/sign-in')
  }
  if (user.vai_tro !== 'chuyen_gia_dinh_duong') {
    return <ForbiddenError />
  }

  const { id } = await params
  const bookingId = Number(id)
  if (!Number.isFinite(bookingId) || bookingId < 1) {
    redirect('/nutritionist/bookings')
  }

  return (
    <main className='h-dvh overflow-hidden bg-background p-0'>
      <ConsultationCall bookingId={bookingId} mode='standalone' />
    </main>
  )
}
