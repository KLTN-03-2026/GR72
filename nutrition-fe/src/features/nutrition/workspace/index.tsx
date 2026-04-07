'use client'

import { Construction } from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Main } from '@/components/layout/main'
import { NutritionTopbar } from '@/features/nutrition/components/topbar'

type NutritionWorkspaceProps = {
  title: string
  description: string
  staff?: boolean
}

export function NutritionWorkspace({
  title,
  description,
  staff = false,
}: NutritionWorkspaceProps) {
  return (
    <>
      <NutritionTopbar staff={staff} />
      <Main className='flex flex-1 flex-col gap-6'>
        <Card className='border-dashed'>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Construction className='size-5 text-primary' />
              {title}
            </CardTitle>
            <CardDescription>{description}</CardDescription>
          </CardHeader>
          <CardContent className='text-sm text-muted-foreground'>
            Màn hình này đã có route và layout trong hệ dinh dưỡng, có thể tiếp tục mở rộng từ khung hiện tại.
          </CardContent>
        </Card>
      </Main>
    </>
  )
}
