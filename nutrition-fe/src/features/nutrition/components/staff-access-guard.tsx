'use client'

import type { ReactNode } from 'react'
import { ShieldAlert } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { usePortalStore } from '@/stores/portal-store'

type StaffAccessGuardProps = {
  allow: 'nutritionist' | 'admin'
  title: string
  description: string
  children: ReactNode
}

export function StaffAccessGuard({
  allow,
  title,
  description,
  children,
}: StaffAccessGuardProps) {
  const { staffRole } = usePortalStore()

  if (staffRole !== allow) {
    return (
      <Card className='border-dashed'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <ShieldAlert className='size-5 text-amber-500' />
            Không có quyền truy cập
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-2 text-sm text-muted-foreground'>
          <p>{title}</p>
          <p>{description}</p>
        </CardContent>
      </Card>
    )
  }

  return <>{children}</>
}
