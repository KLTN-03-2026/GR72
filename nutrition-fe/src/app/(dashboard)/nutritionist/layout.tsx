import { redirect } from 'next/navigation'
import { ForbiddenError } from '@/features/errors/forbidden'
import { getServerSessionUser } from '@/lib/server-auth'

export default async function NutritionistAreaLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getServerSessionUser()

  if (!user) {
    redirect('/sign-in')
  }

  if (user.vai_tro !== 'chuyen_gia_dinh_duong') {
    return <ForbiddenError />
  }

  return children
}
