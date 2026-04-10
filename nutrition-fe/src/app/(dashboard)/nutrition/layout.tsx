import { ForbiddenError } from '@/features/errors/forbidden'
import { getServerSessionUser } from '@/lib/server-auth'

export default async function NutritionUserAreaLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getServerSessionUser()

  if (!user || user.vai_tro === 'nguoi_dung') {
    return children
  }

  return <ForbiddenError />
}

