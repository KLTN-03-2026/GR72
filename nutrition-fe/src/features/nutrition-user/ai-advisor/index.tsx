'use client'

import { useMemo, useState } from 'react'
import { Bot, HeartPulse, Plus, Sparkles } from 'lucide-react'
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
import { Textarea } from '@/components/ui/textarea'
import { Main } from '@/components/layout/main'
import { NutritionTopbar } from '@/features/nutrition/components/topbar'
import { PageHeading } from '@/features/nutrition/components/page-heading'
import { useNutritionStore } from '@/stores/nutrition-store'
import { cn } from '@/lib/utils'

export function NutritionUserAiAdvisor() {
  const ai = useNutritionStore((state) => state.aiAdvisor)
  const sendAiMessage = useNutritionStore((state) => state.sendAiMessage)
  const [input, setInput] = useState('')
  const sessionItems = useMemo(
    () => [
      { id: 'current', title: ai.sessionTitle, status: 'Đang mở' },
      { id: 'week', title: 'Ăn uống tuần này', status: 'Đã lưu' },
      { id: 'office', title: 'Bữa ăn cho ngày đi làm', status: 'Đã lưu' },
    ],
    [ai.sessionTitle]
  )

  function handleSendMessage() {
    const trimmed = input.trim()
    if (!trimmed) {
      toast.error('Vui lòng nhập câu hỏi cho AI.')
      return
    }

    sendAiMessage(trimmed)
    setInput('')
    toast.success('Đã gửi câu hỏi cho AI.')
  }

  return (
    <>
      <NutritionTopbar />
      <Main className='flex flex-1 flex-col gap-6'>
        <PageHeading
          title='AI tư vấn'
          description='Chat real-time với AI để được tư vấn dinh dưỡng, đánh giá sức khỏe và nhận khuyến nghị phù hợp.'
          actions={[{ label: 'Phiên chat mới' }]}
        />

        <div className='grid gap-6 xl:grid-cols-[0.7fr_1.3fr_0.85fr]'>
          <Card className='h-fit'>
            <CardHeader>
              <CardTitle>Phiên tư vấn</CardTitle>
              <CardDescription>
                Chọn một hội thoại đã lưu hoặc mở phiên mới.
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-3'>
              <Button className='w-full justify-start' onClick={() => toast.success('Đã tạo phiên chat mới.')}>
                <Plus className='mr-2 size-4' />
                Phiên chat mới
              </Button>
              {sessionItems.map((session) => (
                <button
                  key={session.id}
                  className='w-full rounded-xl border p-4 text-left transition hover:border-primary/40'
                  type='button'
                >
                  <div className='flex items-center justify-between gap-3'>
                    <p className='font-medium'>{session.title}</p>
                    <Badge variant={session.id === 'current' ? 'secondary' : 'outline'}>
                      {session.status}
                    </Badge>
                  </div>
                </button>
              ))}
            </CardContent>
          </Card>

          <Card className='min-h-[540px]'>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Bot className='size-5 text-primary' />
                {ai.sessionTitle}
              </CardTitle>
              <CardDescription>
                Hội thoại hiện tại của bạn với AI.
              </CardDescription>
            </CardHeader>
            <CardContent className='flex h-full flex-col gap-4'>
              <div className='flex flex-wrap gap-2'>
                <Button size='sm' variant='outline' onClick={() => setInput('Làm sao để bữa sáng đủ đạm hơn?')}>Bữa sáng đủ đạm</Button>
                <Button size='sm' variant='outline' onClick={() => setInput('Gợi ý món nhanh khi bận?')}>Món ăn nhanh khi bận</Button>
                <Button size='sm' variant='outline' onClick={() => setInput('Ăn tối thế nào để không tăng cân?')}>Ăn tối không tăng cân</Button>
              </div>

              <div className='flex-1 space-y-4'>
                {ai.messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      'rounded-2xl p-4',
                      message.role === 'assistant' ? 'mr-8 bg-muted' : 'ml-8 bg-primary/10'
                    )}
                  >
                    <p className='text-xs text-muted-foreground'>{message.time}</p>
                    <p className='mt-2 text-sm leading-6'>{message.content}</p>
                  </div>
                ))}
              </div>

              <div className='space-y-3 border-t pt-4'>
                <Textarea
                  rows={4}
                  placeholder='Nhập câu hỏi về dinh dưỡng, sức khỏe hoặc chế độ ăn...'
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                />
                <div className='flex justify-end'>
                  <Button onClick={handleSendMessage}>Gửi cho AI</Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className='space-y-6'>
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <HeartPulse className='size-5 text-primary' />
                  Đánh giá sức khỏe
                </CardTitle>
              </CardHeader>
              <CardContent className='text-sm leading-6 text-muted-foreground'>
                {ai.healthEvaluation}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Sparkles className='size-5 text-primary' />
                  Khuyến nghị dinh dưỡng
                </CardTitle>
              </CardHeader>
              <CardContent className='text-sm leading-6 text-muted-foreground'>
                {ai.recommendation}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Disclaimer sức khỏe</CardTitle>
              </CardHeader>
              <CardContent className='text-sm leading-6 text-muted-foreground'>
                AI chỉ hỗ trợ tư vấn dinh dưỡng và sức khỏe cơ bản, không thay thế bác sĩ hoặc
                chẩn đoán y khoa.
              </CardContent>
            </Card>
          </div>
        </div>
      </Main>
    </>
  )
}
