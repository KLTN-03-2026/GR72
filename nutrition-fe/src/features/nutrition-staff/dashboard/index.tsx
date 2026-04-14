'use client'

import { useEffect, useState } from 'react'
import { Apple, Bell, BookOpenText, ClipboardList, FileSearch, Salad, Soup } from 'lucide-react'
import { toast } from 'sonner'
import { ApiError } from '@/services/auth/api'
import { getNutriDashboard, type NutriDashboardSummary } from '@/services/nutritionist/api'
import { Main } from '@/components/layout/main'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { NutritionTopbar } from '@/features/nutrition/components/topbar'
import { PageHeading } from '@/features/nutrition/components/page-heading'

type DashboardData = NutriDashboardSummary

export function NutritionStaffDashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getNutriDashboard()
      .then(setData)
      .catch((e) => toast.error(e instanceof ApiError ? e.message : 'Lỗi tải dashboard'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (<><NutritionTopbar staff /><Main className='flex items-center justify-center h-[50vh]'><div className='size-8 animate-spin rounded-full border-2 border-primary border-t-transparent' /></Main></>)

  const stats = [
    { title: 'Bài viết', value: data?.articles ?? 0, icon: BookOpenText, color: 'bg-blue-500' },
    { title: 'Công thức', value: data?.recipes ?? 0, icon: Salad, color: 'bg-emerald-500' },
    { title: 'Thực đơn mẫu', value: data?.mealTemplates ?? 0, icon: Soup, color: 'bg-purple-500' },
    { title: 'Đề xuất chờ duyệt', value: data?.pendingReviews ?? 0, icon: ClipboardList, color: 'bg-amber-500' },
    { title: 'Đề xuất đã duyệt', value: data?.approvedReviews ?? 0, icon: FileSearch, color: 'bg-teal-500' },
    { title: 'Đề xuất bị từ chối', value: data?.rejectedReviews ?? 0, icon: Apple, color: 'bg-red-500' },
    { title: 'Thông báo chưa đọc', value: data?.unreadNotifications ?? 0, icon: Bell, color: 'bg-slate-600' },
  ]

  return (
    <>
      <NutritionTopbar staff />
      <Main className='flex flex-1 flex-col gap-6'>
        <PageHeading title='Dashboard Chuyên gia dinh dưỡng' description='Tổng quan hoạt động quản lý nội dung và đề xuất.' />
        <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
          {stats.map(s => (
            <Card key={s.title} className='relative overflow-hidden'>
              <CardHeader className='flex flex-row items-center justify-between pb-2'>
                <CardTitle className='text-sm font-medium text-muted-foreground'>{s.title}</CardTitle>
                <div className={`rounded-lg p-2 ${s.color}`}><s.icon className='size-4 text-white' /></div>
              </CardHeader>
              <CardContent><p className='text-2xl font-bold'>{s.value}</p></CardContent>
              <div className={`absolute -bottom-4 -right-4 size-24 rounded-full opacity-5 ${s.color}`} />
            </Card>
          ))}
        </div>
      </Main>
    </>
  )
}
