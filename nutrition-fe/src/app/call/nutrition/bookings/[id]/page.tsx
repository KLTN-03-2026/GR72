import { redirect } from 'next/navigation'
import { ConsultationCall } from '@/features/consultation-call'
import { ForbiddenError } from '@/features/errors/forbidden'
import { getServerSessionUser } from '@/lib/server-auth'

type Props = {
  params: Promise<{ id: string }>
}

export default async function NutritionStandaloneCallPage({ params }: Props) {
  const user = await getServerSessionUser()
  if (!user) {
    redirect('/sign-in')
  }
  if (user.vai_tro !== 'nguoi_dung') {
    return <ForbiddenError />
  }

  const { id } = await params
  const bookingId = Number(id)
  if (!Number.isFinite(bookingId) || bookingId < 1) {
    redirect('/nutrition/bookings')
  }

  return (
    <main className='h-dvh overflow-hidden bg-background p-0'>
      <ConsultationCall bookingId={bookingId} mode='standalone' />
    </main>
  )
}
