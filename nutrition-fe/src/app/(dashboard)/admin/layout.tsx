import { ForbiddenError } from '@/features/errors/forbidden'
import { getServerSessionUser } from '@/lib/server-auth'

export default async function AdminAreaLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getServerSessionUser()

  if (!user || user.vai_tro === 'quan_tri') {
    return children
  }

  return <ForbiddenError />
}

