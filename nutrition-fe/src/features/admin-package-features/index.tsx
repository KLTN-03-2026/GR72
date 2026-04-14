'use client'

import { useParams, useRouter } from 'next/navigation'
import { AdminPackageFeaturesContent } from './content'


export function AdminPackageFeatures() {
  const params = useParams()
  const router = useRouter()
  const packageId = Number(params?.id)

  if (!packageId || Number.isNaN(packageId)) {
    router.replace('/admin/packages')
    return null
  }

  return <AdminPackageFeaturesContent packageId={packageId} />
}
