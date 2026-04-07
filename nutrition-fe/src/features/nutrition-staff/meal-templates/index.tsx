'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Main } from '@/components/layout/main'
import { NutritionTopbar } from '@/features/nutrition/components/topbar'
import { PageHeading } from '@/features/nutrition/components/page-heading'
import { useNutritionStore } from '@/stores/nutrition-store'

export function NutritionStaffMealTemplates() {
  const templates = useNutritionStore((state) => state.mealTemplates)
  const saveMealTemplate = useNutritionStore((state) => state.saveMealTemplate)
  const [selectedId, setSelectedId] = useState(templates[0]?.id ?? '')
  const selectedTemplate =
    templates.find((template) => template.id === selectedId) ?? templates[0]

  return (
    <>
      <NutritionTopbar staff />
      <Main className='flex flex-1 flex-col gap-6'>
        <PageHeading
          title='Meal templates'
          description='Các thực đơn mẫu để user tham khảo hoặc copy sang kế hoạch ăn uống cá nhân.'
          actions={[{ label: 'Tạo template mới' }]}
        />

        <div className='grid gap-6 xl:grid-cols-[0.9fr_1.1fr]'>
          <div className='space-y-4'>
            {templates.map((template) => (
              <button
                key={template.id}
                className='w-full text-left'
                onClick={() => setSelectedId(template.id)}
                type='button'
              >
                <Card className={template.id === selectedTemplate?.id ? 'border-primary/40 shadow-sm' : ''}>
                  <CardHeader>
                    <div className='flex items-start justify-between gap-3'>
                      <div>
                        <CardTitle>{template.title}</CardTitle>
                        <CardDescription>
                          {template.target} • {template.targetCalories} kcal
                        </CardDescription>
                      </div>
                      <Badge variant={template.status === 'Xuất bản' ? 'secondary' : 'outline'}>
                        {template.status}
                      </Badge>
                    </div>
                  </CardHeader>
                </Card>
              </button>
            ))}
          </div>

          {selectedTemplate ? (
            <Card>
              <CardHeader>
                <CardTitle>Chi tiết template</CardTitle>
                <CardDescription>
                  Preview cấu trúc các bữa để staff rà trước khi publish.
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='flex items-center justify-between gap-3'>
                  <div>
                    <p className='text-xl font-semibold'>{selectedTemplate.title}</p>
                    <p className='text-sm text-muted-foreground'>
                      {selectedTemplate.target} • {selectedTemplate.targetCalories} kcal
                    </p>
                  </div>
                  <Badge variant={selectedTemplate.status === 'Xuất bản' ? 'secondary' : 'outline'}>
                    {selectedTemplate.status}
                  </Badge>
                </div>
                <div className='grid gap-3 md:grid-cols-2'>
                  {selectedTemplate.meals.map((meal) => (
                    <div key={meal} className='rounded-xl border p-4 text-sm text-muted-foreground'>
                      {meal}
                    </div>
                  ))}
                </div>
                <div className='flex flex-wrap gap-3'>
                  <Button onClick={() => toast.success('Đã lưu template vào bản nháp.')}>
                    Lưu nháp
                  </Button>
                  <Button
                    variant='outline'
                    onClick={() => {
                      saveMealTemplate({ ...selectedTemplate, status: 'Xuất bản' })
                      toast.success('Đã xuất bản meal template.')
                    }}
                  >
                    Xuất bản
                  </Button>
                  <Button variant='outline' onClick={() => toast.success('Đã nhân bản template.')}>
                    Nhân bản template
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : null}
        </div>
      </Main>
    </>
  )
}
