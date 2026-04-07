'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Main } from '@/components/layout/main'
import { NutritionTopbar } from '@/features/nutrition/components/topbar'
import { PageHeading } from '@/features/nutrition/components/page-heading'
import { useNutritionStore } from '@/stores/nutrition-store'

export function NutritionStaffNotifications() {
  const notifications = useNutritionStore((state) => state.notifications)
  const addNotification = useNutritionStore((state) => state.addNotification)
  const [title, setTitle] = useState('')
  const [type, setType] = useState('')
  const [content, setContent] = useState('')
  const [actionUrl, setActionUrl] = useState('')

  function handleCreateNotification() {
    if (!title.trim() || !type.trim() || !content.trim()) {
      toast.error('Vui lòng nhập đủ tiêu đề, loại và nội dung thông báo.')
      return
    }

    addNotification({
      id: `NOTI-${Date.now()}`,
      title: title.trim(),
      content: content.trim(),
      type: type.trim() as 'Nhắc việc' | 'AI' | 'Hệ thống',
      status: 'Chưa đọc',
      createdAt: new Intl.DateTimeFormat('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }).format(new Date()),
    })
    setTitle('')
    setType('')
    setContent('')
    setActionUrl('')
    toast.success('Đã tạo thông báo hệ thống mới.')
  }

  return (
    <>
      <NutritionTopbar staff />
      <Main className='flex flex-1 flex-col gap-6'>
        <PageHeading
          title='Thông báo hệ thống'
          description='Tạo thông báo gửi user và theo dõi các thông báo đã phát hành.'
          actions={[{ label: 'Tạo thông báo mới' }]}
        />

        <div className='grid gap-6 xl:grid-cols-[0.9fr_1.1fr]'>
          <Card>
            <CardHeader>
              <CardTitle>Tạo thông báo mới</CardTitle>
              <CardDescription>
                Dùng cho nhắc việc sức khỏe, cập nhật nội dung hoặc thông báo hệ thống.
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='space-y-2'>
                <Label>Tiêu đề</Label>
                <Input placeholder='Tiêu đề thông báo' value={title} onChange={(event) => setTitle(event.target.value)} />
              </div>
              <div className='space-y-2'>
                <Label>Loại thông báo</Label>
                <Input
                  placeholder='Loại thông báo: Nhắc việc, Hệ thống, AI...'
                  value={type}
                  onChange={(event) => setType(event.target.value)}
                />
              </div>
              <div className='space-y-2'>
                <Label>Nội dung</Label>
                <Textarea
                  rows={6}
                  placeholder='Nội dung thông báo...'
                  value={content}
                  onChange={(event) => setContent(event.target.value)}
                />
              </div>
              <div className='space-y-2'>
                <Label>Action URL</Label>
                <Input
                  placeholder='/nutrition/meal-logs'
                  value={actionUrl}
                  onChange={(event) => setActionUrl(event.target.value)}
                />
              </div>
              <Button className='w-full' onClick={handleCreateNotification}>
                Gửi thông báo
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Lịch sử thông báo</CardTitle>
              <CardDescription>
                Các thông báo gần đây được user nhận trong ứng dụng.
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              {notifications.map((notification) => (
                <div key={notification.id} className='rounded-xl border p-4'>
                  <div className='flex flex-wrap items-center justify-between gap-3'>
                    <div>
                      <p className='font-medium'>{notification.title}</p>
                      <p className='mt-1 text-sm text-muted-foreground'>
                        {notification.content}
                      </p>
                    </div>
                    <div className='flex gap-2'>
                      <Badge variant='outline'>{notification.type}</Badge>
                      <Badge variant='secondary'>{notification.status}</Badge>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </Main>
    </>
  )
}
