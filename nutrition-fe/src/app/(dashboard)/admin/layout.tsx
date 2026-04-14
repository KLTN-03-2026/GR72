import { redirect } from 'next/navigation'
import { ForbiddenError } from '@/features/errors/forbidden'
import { getServerSessionUser } from '@/lib/server-auth'

export default async function AdminAreaLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getServerSessionUser()

  if (!user) {
    redirect('/sign-in')
  }

  if (user.vai_tro !== 'quan_tri') {
    return <ForbiddenError />
  }

  return children
}
