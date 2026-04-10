import { UnauthorisedError } from '@/features/errors/unauthorized-error'
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout'
import { getServerSessionUser } from '@/lib/server-auth'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getServerSessionUser()

  if (!user) {
    return <UnauthorisedError />
  }

  return <AuthenticatedLayout>{children}</AuthenticatedLayout>
}
