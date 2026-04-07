'use client'

import { useMemo, useState } from 'react'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Main } from '@/components/layout/main'
import { NutritionTopbar } from '@/features/nutrition/components/topbar'
import { PageHeading } from '@/features/nutrition/components/page-heading'
import { useNutritionStore } from '@/stores/nutrition-store'

export function NutritionUserNotifications() {
  const notifications = useNutritionStore((state) => state.notifications)
  const markNotificationRead = useNutritionStore((state) => state.markNotificationRead)
  const markAllNotificationsRead = useNutritionStore((state) => state.markAllNotificationsRead)
  const [tab, setTab] = useState<'all' | 'unread' | 'read'>('all')
  const filteredNotifications = useMemo(() => {
    if (tab === 'all') return notifications
    if (tab === 'unread') {
      return notifications.filter((notification) => notification.status === 'Chưa đọc')
    }
    return notifications.filter((notification) => notification.status === 'Đã đọc')
  }, [notifications, tab])

  return (
    <>
      <NutritionTopbar />
      <Main className='flex flex-1 flex-col gap-6'>
        <PageHeading
          title='Thông báo'
          description='Theo dõi các nhắc việc sức khỏe, tư vấn AI mới và cập nhật nội dung chuyên môn.'
          actions={[{ label: 'Đánh dấu đã đọc' }]}
        />

        <div className='grid gap-4 md:grid-cols-3'>
          <SummaryCard label='Tổng thông báo' value={String(notifications.length)} />
          <SummaryCard
            label='Chưa đọc'
            value={String(notifications.filter((item) => item.status === 'Chưa đọc').length)}
          />
          <SummaryCard
            label='AI mới'
            value={String(notifications.filter((item) => item.type === 'AI').length)}
          />
        </div>

        <Tabs value={tab} onValueChange={(value) => setTab(value as typeof tab)}>
          <div className='flex flex-wrap items-center justify-between gap-3'>
            <TabsList>
              <TabsTrigger value='all'>Tất cả</TabsTrigger>
              <TabsTrigger value='unread'>Chưa đọc</TabsTrigger>
              <TabsTrigger value='read'>Đã đọc</TabsTrigger>
            </TabsList>
            <Button
              variant='outline'
              onClick={() => {
                markAllNotificationsRead()
                toast.success('Đã đánh dấu tất cả thông báo là đã đọc.')
              }}
            >
              Đánh dấu tất cả đã đọc
            </Button>
          </div>

          <TabsContent value={tab} className='space-y-4'>
            {filteredNotifications.map((notification) => (
              <Card key={notification.id}>
                <CardHeader>
                  <div className='flex flex-wrap items-center justify-between gap-3'>
                    <div>
                      <CardTitle className='text-lg'>{notification.title}</CardTitle>
                      <CardDescription>{notification.createdAt}</CardDescription>
                    </div>
                    <div className='flex gap-2'>
                      <Badge variant='outline'>{notification.type}</Badge>
                      <Badge
                        variant={
                          notification.status === 'Chưa đọc' ? 'secondary' : 'outline'
                        }
                      >
                        {notification.status}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className='space-y-3'>
                  <p className='text-sm text-muted-foreground'>{notification.content}</p>
                  <div className='flex flex-wrap gap-2'>
                    <Button size='sm' onClick={() => toast.success('Đã mở chi tiết thông báo.')}>
                      Mở chi tiết
                    </Button>
                    <Button
                      size='sm'
                      variant='outline'
                      onClick={() => {
                        markNotificationRead(notification.id)
                        toast.success('Đã đánh dấu thông báo là đã đọc.')
                      }}
                    >
                      Đánh dấu đã đọc
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </Main>
    </>
  )
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className='space-y-1 p-6'>
        <p className='text-sm text-muted-foreground'>{label}</p>
        <p className='text-3xl font-semibold'>{value}</p>
      </CardContent>
    </Card>
  )
}
