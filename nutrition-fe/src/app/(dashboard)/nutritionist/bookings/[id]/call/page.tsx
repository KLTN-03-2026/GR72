import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Main } from '@/components/layout/main'
import { ConsultationCall } from '@/features/consultation-call'
import { NutritionTopbar } from '@/features/nutrition/components/topbar'

type Props = {
  params: Promise<{ id: string }>
}

export default async function NutritionistBookingCallPage({ params }: Props) {
  const { id } = await params
  const bookingId = Number(id)

  if (!Number.isFinite(bookingId) || bookingId < 1) {
    redirect('/nutritionist/bookings')
  }

  return (
    <>
      <NutritionTopbar staff />
      <Main fluid className='flex flex-1 flex-col gap-6'>
        <Button variant='outline' size='sm' className='w-fit' asChild>
          <Link href={`/nutritionist/bookings/${bookingId}`}>
            <ChevronLeft className='mr-1 size-4' />
            Quay lại booking
          </Link>
        </Button>
        <ConsultationCall bookingId={bookingId} />
      </Main>
    </>
  )
}

