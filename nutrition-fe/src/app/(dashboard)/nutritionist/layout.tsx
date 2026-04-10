import { ForbiddenError } from '@/features/errors/forbidden'
import { getServerSessionUser } from '@/lib/server-auth'

export default async function NutritionistAreaLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getServerSessionUser()

  if (
    !user ||
    user.vai_tro === 'chuyen_gia_dinh_duong' ||
    user.vai_tro === 'quan_tri'
  ) {
    return children
  }

  return <ForbiddenError />
}

