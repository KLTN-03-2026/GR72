'use client'

import { ArrowRight, Bell, Bot, CalendarClock, Flame, Salad, Sparkles, Target } from 'lucide-react'
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
import { Separator } from '@/components/ui/separator'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Main } from '@/components/layout/main'
import { todaySummary as fallbackSummary } from '@/features/nutrition/data/mock-data'
import { HealthTrendChart } from '@/features/nutrition/components/health-trend-chart'
import { MacroIntakeChart } from '@/features/nutrition/components/macro-intake-chart'
import { MacroProgress } from '@/features/nutrition/components/macro-progress'
import { NutritionTopbar } from '@/features/nutrition/components/topbar'
import { PageHeading } from '@/features/nutrition/components/page-heading'
import { StatCard } from '@/features/nutrition/components/stat-card'
import { buildGoalProgressText, calculateHealthTrend, calculateTodaySummary } from '@/features/nutrition/utils'
import { useNutritionStore } from '@/stores/nutrition-store'

export function NutritionUserDashboard() {
  const goal = useNutritionStore((state) => state.goal)
  const mealLogs = useNutritionStore((state) => state.mealLogs)
  const notifications = useNutritionStore((state) => state.notifications)
  const ai = useNutritionStore((state) => state.aiAdvisor)
  const healthMetrics = useNutritionStore((state) => state.healthMetrics)
  const addNotification = useNutritionStore((state) => state.addNotification)

  const summary = calculateTodaySummary(mealLogs, fallbackSummary)
  const trend = calculateHealthTrend(healthMetrics)
  const remainingCalories = Math.max(goal.dailyTargets.calories - summary.calories, 0)
  const latestDate = mealLogs[0]?.date
  const todayLogs = mealLogs.filter((log) => log.date === latestDate)
  const latestNotifications = notifications.slice(0, 3)

  const handleQuickAction = (title: string) => {
    addNotification({
      id: `NOTI-${Date.now()}`,
      title: `Đã mở ${title.toLowerCase()}`,
      content: `Bạn vừa thao tác nhanh từ dashboard ở mục ${title.toLowerCase()}.`,
      type: 'Hệ thống',
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
    toast.success(`Đã mở ${title.toLowerCase()}.`)
  }

  return (
    <>
      <NutritionTopbar />
      <Main className='flex flex-1 flex-col gap-6'>
        <PageHeading
          title='Dashboard sức khỏe'
          description='Theo dõi mục tiêu, calories trong ngày, xu hướng cân nặng và tư vấn AI mới nhất.'
          actions={[{ label: 'Cập nhật chỉ số' }, { label: 'Ghi bữa ăn' }]}
        />

        <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-4'>
          <StatCard
            label='Goal hiện tại'
            value={goal.type}
            hint={`Mục tiêu cân nặng ${goal.targetWeight}kg trước ${goal.targetDate}`}
          />
          <StatCard
            label='Calories hôm nay'
            value={`${summary.calories} kcal`}
            hint={`Mục tiêu ${goal.dailyTargets.calories} kcal/ngày`}
          />
          <StatCard
            label='Protein hôm nay'
            value={`${summary.protein} g`}
            hint={`Đang hướng tới ${goal.dailyTargets.protein} g/ngày`}
          />
          <StatCard
            label='BMI mới nhất'
            value={`${trend.at(-1)?.bmi ?? 0}`}
            hint='Đang ở vùng cận trên bình thường'
          />
        </div>

        <div className='grid gap-6 xl:grid-cols-[1.4fr_1fr]'>
          <div className='space-y-6'>
            <Card className='border-primary/20 bg-gradient-to-br from-primary/5 via-background to-background'>
              <CardHeader className='pb-4'>
                <div className='flex flex-wrap items-center justify-between gap-3'>
                  <div>
                    <CardTitle className='text-xl'>Nhịp theo dõi hôm nay</CardTitle>
                    <CardDescription>
                      Bạn còn {remainingCalories} kcal để đạt đúng ngân sách trong ngày.
                    </CardDescription>
                  </div>
                  <Badge variant='secondary'>Cập nhật lúc {new Intl.DateTimeFormat('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date())}</Badge>
                </div>
              </CardHeader>
              <CardContent className='grid gap-5 lg:grid-cols-[1.1fr_0.9fr]'>
                <div className='space-y-4'>
                  <MacroProgress
                    label='Calories'
                    current={summary.calories}
                    target={goal.dailyTargets.calories}
                    unit=' kcal'
                    tone='amber'
                  />
                  <MacroProgress
                    label='Protein'
                    current={summary.protein}
                    target={goal.dailyTargets.protein}
                    tone='emerald'
                  />
                  <MacroProgress
                    label='Carb'
                    current={summary.carbs}
                    target={goal.dailyTargets.carbs}
                  />
                  <MacroProgress
                    label='Fat'
                    current={summary.fat}
                    target={goal.dailyTargets.fat}
                    tone='amber'
                  />
                </div>
                <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-1'>
                  <QuickAction
                    icon={CalendarClock}
                    title='Kế hoạch hôm nay'
                    description='Cần bổ sung 1 bữa phụ giàu đạm trước 16:00.'
                    action='Xem meal plan'
                    onAction={handleQuickAction}
                  />
                  <QuickAction
                    icon={Bot}
                    title='Tư vấn AI'
                    description='AI gợi ý tăng đạm bữa sáng và giảm đường ẩn từ đồ uống.'
                    action='Mở hội thoại'
                    onAction={handleQuickAction}
                  />
                  <QuickAction
                    icon={Salad}
                    title='Bữa gần nhất'
                    description={todayLogs[0]?.items ?? 'Chưa có bữa nào được ghi hôm nay.'}
                    action='Log thêm món'
                    onAction={handleQuickAction}
                  />
                </div>
              </CardContent>
            </Card>

            <MacroIntakeChart current={summary} target={goal.dailyTargets} />

            <HealthTrendChart data={trend} />

            <Card>
              <CardHeader>
                <CardTitle>Nhật ký ăn uống gần đây</CardTitle>
                <CardDescription>
                  Tổng hợp nhanh các bữa đã log để đối chiếu với mục tiêu calories.
                </CardDescription>
              </CardHeader>
              <CardContent className='overflow-x-auto'>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ngày</TableHead>
                      <TableHead>Bữa</TableHead>
                      <TableHead>Món ăn</TableHead>
                      <TableHead>Calories</TableHead>
                      <TableHead>Macro</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mealLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>{log.date}</TableCell>
                        <TableCell>
                          <Badge variant='outline'>{log.mealType}</Badge>
                        </TableCell>
                        <TableCell>{log.items}</TableCell>
                        <TableCell>{log.calories} kcal</TableCell>
                        <TableCell className='text-muted-foreground'>
                          P {log.protein}g / C {log.carbs}g / F {log.fat}g
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          <div className='space-y-6'>
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Bot className='size-5 text-primary' />
                  Tư vấn AI mới nhất
                </CardTitle>
                <CardDescription>
                  AI đang ưu tiên điều chỉnh thói quen ăn theo lịch làm việc của bạn.
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='rounded-xl bg-muted/50 p-4 text-sm leading-6 text-muted-foreground'>
                  {ai.healthEvaluation}
                </div>
                <div className='space-y-3'>
                  <div className='flex items-start gap-3 rounded-xl border p-4'>
                    <Target className='mt-0.5 size-4 text-primary' />
                    <div>
                      <p className='font-medium'>Khuyến nghị dinh dưỡng</p>
                      <p className='mt-1 text-sm text-muted-foreground'>
                        {ai.recommendation}
                      </p>
                    </div>
                  </div>
                  <div className='flex items-start gap-3 rounded-xl border p-4'>
                    <Flame className='mt-0.5 size-4 text-primary' />
                    <div>
                      <p className='font-medium'>Điểm cần lưu ý hôm nay</p>
                      <p className='mt-1 text-sm text-muted-foreground'>
                        Tăng nhẹ protein bữa sáng và tránh bỏ bữa phụ nếu làm việc tới tối.
                      </p>
                    </div>
                  </div>
                </div>
                <Button className='w-full justify-between' onClick={() => toast.success('Đã mở AI tư vấn.')}>
                  Mở AI tư vấn
                  <ArrowRight className='size-4' />
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Target className='size-5 text-primary' />
                  Tiến độ mục tiêu
                </CardTitle>
                <CardDescription>
                  Chênh lệch hiện tại giữa mốc bắt đầu và mốc mục tiêu.
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='rounded-xl border p-4'>
                  <div className='flex items-center justify-between gap-3'>
                    <p className='font-medium'>{goal.type}</p>
                    <Badge variant='secondary'>Đến {goal.targetDate}</Badge>
                  </div>
                  <Separator className='my-4' />
                  <div className='grid grid-cols-2 gap-4 text-sm'>
                    <div>
                      <p className='text-muted-foreground'>Bắt đầu</p>
                      <p className='mt-1 text-lg font-semibold'>{goal.startWeight} kg</p>
                    </div>
                    <div>
                      <p className='text-muted-foreground'>Mục tiêu</p>
                      <p className='mt-1 text-lg font-semibold'>{goal.targetWeight} kg</p>
                    </div>
                  </div>
                </div>
                <div className='rounded-xl bg-muted/50 p-4 text-sm text-muted-foreground'>
                  Cân nặng gần nhất là {trend.at(-1)?.weight} kg.{' '}
                  {buildGoalProgressText(goal, trend.at(-1)?.weight ?? goal.startWeight)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Bell className='size-5 text-primary' />
                  Thông báo nổi bật
                </CardTitle>
                <CardDescription>
                  Những nhắc việc cần xử lý trong hôm nay.
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-3'>
                {latestNotifications.map((notification) => (
                  <div key={notification.id} className='rounded-xl border p-4'>
                    <div className='flex items-center justify-between gap-3'>
                      <p className='font-medium'>{notification.title}</p>
                      <Badge
                        variant={
                          notification.status === 'Chưa đọc' ? 'secondary' : 'outline'
                        }
                      >
                        {notification.status}
                      </Badge>
                    </div>
                    <p className='mt-2 text-sm text-muted-foreground'>
                      {notification.content}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </Main>
    </>
  )
}

function QuickAction({
  icon: Icon,
  title,
  description,
  action,
  onAction,
}: {
  icon: typeof Sparkles
  title: string
  description: string
  action: string
  onAction: (title: string) => void
}) {
  return (
    <div className='rounded-xl border p-4'>
      <div className='flex items-start gap-3'>
        <div className='rounded-full bg-primary/10 p-2 text-primary'>
          <Icon className='size-4' />
        </div>
        <div className='min-w-0 flex-1'>
          <p className='font-medium'>{title}</p>
          <p className='mt-1 text-sm text-muted-foreground'>{description}</p>
          <Button className='mt-3 px-0' variant='link' onClick={() => onAction(title)}>
            {action}
          </Button>
        </div>
      </div>
    </div>
  )
}
