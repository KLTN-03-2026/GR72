'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Activity,
  AlertCircle,
  ArrowRight,
  Bell,
  Bot,
  Calendar,
  CalendarClock,
  ChevronRight,
  ClipboardList,
  Dumbbell,
  Flame,
  HeartPulse,
  LucideIcon,
  Plus,
  RefreshCw,
  Salad,
  Scale,
  Target,
  Utensils,
  Zap,
} from 'lucide-react'
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
import { Main } from '@/components/layout/main'
import { NutritionTopbar } from '@/features/nutrition/components/topbar'
import { getDashboard, type DashboardResponse } from '@/services/health/api'

type Data = DashboardResponse['data']

// ---- BMI helpers ----
function bmiLabel(bmi: number | null): { text: string; colorClass: string } {
  if (bmi === null) return { text: 'Chưa có', colorClass: 'text-muted-foreground' }
  if (bmi < 18.5) return { text: 'Thiếu cân', colorClass: 'text-amber-600' }
  if (bmi < 25) return { text: 'Bình thường', colorClass: 'text-green-600' }
  if (bmi < 30) return { text: 'Thừa cân', colorClass: 'text-amber-600' }
  return { text: 'Béo phì', colorClass: 'text-red-600' }
}

function cn(...classes: (string | undefined)[]) {
  return classes.filter(Boolean).join(' ')
}

// ---- BMI Gauge ----
function BmiGauge({ bmi }: { bmi: number | null }) {
  const pct = bmi !== null ? Math.min(Math.max(((bmi - 15) / 30) * 100, 0), 100) : 0
  const color =
    bmi === null ? 'bg-muted' :
    bmi < 18.5 ? 'bg-amber-500' :
    bmi < 25 ? 'bg-green-500' :
    bmi < 30 ? 'bg-amber-500' : 'bg-red-500'

  return (
    <div className='space-y-1'>
      <div className='flex items-end justify-between text-xs text-muted-foreground'>
        <span>15</span><span>18.5</span><span>25</span><span>30</span><span>45</span>
      </div>
      <div className='relative h-2.5 w-full rounded-full bg-muted'>
        <div
          className={cn('absolute left-0 top-0 h-full rounded-full transition-all', color)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

// ---- Macro bar ----
function MacroBar({ current, target, label, colorClass }: {
  current: number; target: number; label: string; colorClass: string
}) {
  const pct = target > 0 ? Math.min((current / target) * 100, 100) : 0
  return (
    <div className='space-y-1.5'>
      <div className='flex items-center justify-between text-sm'>
        <span className='text-muted-foreground'>{label}</span>
        <span className='font-medium'>{current} / {target}</span>
      </div>
      <div className='h-2.5 w-full rounded-full bg-muted'>
        <div
          className={cn('h-full rounded-full transition-all', colorClass)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

// ---- Missing data warning (C07: hiện trạng thái giới hạn + gợi ý bổ sung) ----
function MissingDataWarning({ data }: { data: Data }) {
  const missing = data.thieu_du_lieu ?? []
  if (missing.length === 0) return null

  const suggestions = []
  if (missing.includes('ho_so')) {
    suggestions.push({ label: 'Cập nhật hồ sơ cá nhân', href: '/nutrition/profile', desc: 'Cần: giới tính, ngày sinh, chiều cao, cân nặng, mức vận động' })
  }
  if (missing.includes('muc_tieu')) {
    suggestions.push({ label: 'Tạo mục tiêu sức khỏe', href: '/nutrition/goals', desc: 'Cần đặt mục tiêu để nhận khuyến nghị calories' })
  }
  if (missing.includes('danh_gia_suc_khoe')) {
    suggestions.push({ label: 'Nhập chỉ số đo lần đầu', href: '/nutrition/health-metrics', desc: 'Cần ít nhất 1 lần đo để hệ thống đánh giá' })
  }

  return (
    <Card className='border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30'>
      <CardHeader className='pb-2'>
        <div className='flex items-center gap-2'>
          <AlertCircle className='size-4 text-amber-600' />
          <CardTitle className='text-sm'>Thiếu dữ liệu để đánh giá</CardTitle>
        </div>
      </CardHeader>
      <CardContent className='space-y-2'>
        {suggestions.map((s) => (
          <div key={s.label} className='flex items-start gap-3 rounded-lg border border-amber-200 bg-white p-3 dark:border-amber-800 dark:bg-amber-900/20'>
            <Zap className='mt-0.5 size-4 shrink-0 text-amber-600' />
            <div className='min-w-0 flex-1'>
              <p className='text-sm font-medium'>{s.label}</p>
              <p className='mt-0.5 text-xs text-muted-foreground'>{s.desc}</p>
            </div>
            <Button size='sm' variant='outline' asChild className='shrink-0'>
              <Link href={s.href}>Bổ sung</Link>
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

// ---- Onboarding card (C07: chưa hoàn thành → hiện card) ----
function OnboardingCard({ data }: { data: Data }) {
  if (data.onboarding_completed) return null

  const steps = []
  if (data.onboarding_step === 'ho_so') {
    steps.push({ label: 'Cập nhật hồ sơ', href: '/nutrition/profile', icon: HeartPulse })
  }
  if (data.onboarding_step === 'muc_tieu') {
    steps.push({ label: 'Tạo mục tiêu', href: '/nutrition/goals', icon: Target })
  }

  if (steps.length === 0) return null

  return (
    <Card className='border-primary/30 bg-gradient-to-r from-primary/5 to-transparent'>
      <CardHeader className='pb-3'>
        <CardTitle className='flex items-center gap-2 text-base'>
          <Zap className='size-4 text-primary' />
          Hoàn tất thiết lập ban đầu
        </CardTitle>
        <CardDescription>
          Cần hoàn thành bước dưới để bắt đầu theo dõi sức khỏe.
        </CardDescription>
      </CardHeader>
      <CardContent className='flex flex-wrap gap-3'>
        {steps.map((step) => (
          <Button key={step.label} asChild size='sm'>
            <Link href={step.href}>
              <step.icon className='mr-1.5 size-3.5' />
              {step.label}
            </Link>
          </Button>
        ))}
      </CardContent>
    </Card>
  )
}

// ---- Stat Cards ----
function StatCard({
  icon: Icon, label, value, sub, tone = 'default', href,
}: {
  icon: LucideIcon; label: string; value: string; sub?: string
  tone?: 'default' | 'green' | 'amber' | 'red'; href?: string
}) {
  const toneColor = tone === 'green' ? 'text-green-600' : tone === 'red' ? 'text-red-600' : tone === 'amber' ? 'text-amber-600' : ''
  const inner = (
    <>
      <div className='flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground'>
        <Icon className='size-3.5' />{label}
      </div>
      <p className={cn('mt-2 text-2xl font-bold tracking-tight', toneColor || 'text-foreground')}>{value}</p>
      {sub && <p className='mt-0.5 text-xs text-muted-foreground'>{sub}</p>}
    </>
  )
  if (href) {
    return (
      <Link href={href} className='group block'>
        <Card className='h-full transition-colors group-hover:border-primary/40 group-hover:bg-primary/[0.02]'>
          <CardContent className='p-5'>{inner}</CardContent>
        </Card>
      </Link>
    )
  }
  return <Card className='h-full'><CardContent className='p-5'>{inner}</CardContent></Card>
}

function StatGrid({ data }: { data: Data }) {
  const goal = data.muc_tieu_hien_tai
  const nutrition = data.dinh_duong_hom_nay
  const assessment = data.danh_gia_suc_khoe_moi_nhat
  const metric = data.chi_so_gan_nhat

  const todayCal = nutrition?.tong_calories ?? 0
  const targetCal = goal?.muc_tieu_calories_ngay ?? assessment?.calories_khuyen_nghi ?? 0
  const remainingCal = Math.max(targetCal - todayCal, 0)

  const goalTypeLabel =
    goal?.loai_muc_tieu === 'giam_can' ? 'Giảm cân' :
    goal?.loai_muc_tieu === 'tang_can' ? 'Tăng cân' :
    goal?.loai_muc_tieu === 'giu_can' ? 'Giữ cân' : 'Chưa có'

  const weightChange = (goal?.can_nang_bat_dau_kg && metric?.can_nang_kg)
    ? `${(metric.can_nang_kg - goal.can_nang_bat_dau_kg) > 0 ? '+' : ''}${(metric.can_nang_kg - goal.can_nang_bat_dau_kg).toFixed(1)}kg`
    : undefined

  const weightTone: 'green' | 'amber' | 'red' | 'default' =
    !goal ? 'default' :
    goal.loai_muc_tieu === 'giam_can' && weightChange && parseFloat(weightChange) < 0 ? 'green' :
    goal.loai_muc_tieu === 'tang_can' && weightChange && parseFloat(weightChange) > 0 ? 'green' :
    'default'

  const bmiTone = assessment?.bmi
    ? (assessment.bmi >= 18.5 && assessment.bmi < 25 ? 'green' : 'amber') as 'green' | 'amber'
    : 'default'

  return (
    <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-4'>
      <StatCard
        icon={Target} label='Mục tiêu' value={goalTypeLabel}
        sub={goal?.can_nang_muc_tieu_kg ? `${goal.can_nang_muc_tieu_kg}kg` : targetCal ? `${targetCal} kcal/ngày` : 'Chưa đặt'}
        href='/nutrition/goals'
      />
      <StatCard
        icon={Flame} label='Calories hôm nay'
        value={todayCal > 0 ? `${todayCal} kcal` : 'Chưa ghi'}
        sub={
          targetCal > 0
            ? todayCal === 0 ? 'Chưa ghi bữa nào' :
              remainingCal === 0 ? 'Đạt ngân sách!' :
              todayCal > targetCal ? `Vượt ${todayCal - targetCal} kcal` :
              `Còn ${remainingCal} kcal`
            : 'Chưa có mục tiêu'
        }
        tone={remainingCal === 0 && targetCal > 0 ? 'green' : todayCal > targetCal && targetCal > 0 ? 'red' : 'default'}
        href='/nutrition/meal-logs'
      />
      <StatCard
        icon={Scale} label='Cân nặng gần nhất'
        value={metric?.can_nang_kg ? `${metric.can_nang_kg} kg` : 'Chưa có'}
        sub={weightChange}
        tone={weightTone}
        href='/nutrition/health-metrics'
      />
      <StatCard
        icon={HeartPulse} label='BMI'
        value={assessment?.bmi ? assessment.bmi.toFixed(1) : 'Chưa có'}
        sub={bmiLabel(assessment?.bmi ?? null).text}
        tone={bmiTone}
        href='/nutrition/health-metrics'
      />
    </div>
  )
}

// ---- Macro progress today ----
function MacroSection({ data }: { data: Data }) {
  const goal = data.muc_tieu_hien_tai
  const nutrition = data.dinh_duong_hom_nay
  const assessment = data.danh_gia_suc_khoe_moi_nhat

  const targetCal = goal?.muc_tieu_calories_ngay ?? assessment?.calories_khuyen_nghi ?? 0
  const targetProtein = goal?.muc_tieu_protein_g ?? assessment?.protein_khuyen_nghi_g ?? 0
  const targetCarb = goal?.muc_tieu_carb_g ?? assessment?.carb_khuyen_nghi_g ?? 0
  const targetFat = goal?.muc_tieu_fat_g ?? assessment?.fat_khuyen_nghi_g ?? 0

  const todayCal = nutrition?.tong_calories ?? 0
  const todayProtein = nutrition?.tong_protein_g ?? 0
  const todayCarb = nutrition?.tong_carb_g ?? 0
  const todayFat = nutrition?.tong_fat_g ?? 0

  return (
    <Card>
      <CardHeader className='pb-4'>
        <div className='flex items-center justify-between'>
          <div>
            <CardTitle className='text-base'>Tiến độ dinh dưỡng hôm nay</CardTitle>
            <CardDescription>
              {nutrition?.so_bua_da_ghi
                ? `${nutrition.so_bua_da_ghi} bữa đã ghi`
                : 'Chưa ghi bữa nào hôm nay'}
              {nutrition?.ngay && ` · ${new Date(nutrition.ngay).toLocaleDateString('vi-VN')}`}
            </CardDescription>
          </div>
          <Button variant='outline' size='sm' asChild>
            <Link href='/nutrition/meal-logs'>
              <Plus className='mr-1.5 size-3.5' />
              Ghi bữa ăn
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className='grid gap-4 sm:grid-cols-2'>
        <div className='space-y-3'>
          <MacroBar current={todayCal} target={targetCal} label='Calories' colorClass='bg-amber-500' />
          <MacroBar current={todayProtein} target={targetProtein} label='Protein' colorClass='bg-blue-500' />
          <MacroBar current={todayCarb} target={targetCarb} label='Carb' colorClass='bg-orange-400' />
          <MacroBar current={todayFat} target={targetFat} label='Fat' colorClass='bg-red-500' />
        </div>
        <div className='grid grid-cols-2 gap-3'>
          {[
            { label: 'Calories', value: todayCal, unit: 'kcal', target: targetCal },
            { label: 'Protein', value: todayProtein, unit: 'g', target: targetProtein },
            { label: 'Carb', value: todayCarb, unit: 'g', target: targetCarb },
            { label: 'Fat', value: todayFat, unit: 'g', target: targetFat },
          ].map((item) => {
            const pct = item.target > 0 ? Math.round((item.value / item.target) * 100) : 0
            return (
              <div key={item.label} className='rounded-xl border p-3'>
                <p className='text-xs text-muted-foreground'>{item.label}</p>
                <p className='mt-1 text-lg font-semibold'>
                  {item.value}<span className='text-sm font-normal text-muted-foreground'>/{item.target}{item.unit}</span>
                </p>
                <p className='mt-0.5 text-xs text-muted-foreground'>{pct}%</p>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

// ---- Weight trend chart (C07: bieu_do_can_nang) ----
function WeightChart({ data }: { data: Data }) {
  const weights = data.bieu_do_can_nang ?? []
  const goal = data.muc_tieu_hien_tai

  if (weights.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className='text-base'>Xu hướng cân nặng</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='flex h-40 flex-col items-center justify-center gap-3 text-center'>
            <Scale className='size-10 text-muted-foreground' />
            <div>
              <p className='font-medium'>Chưa có dữ liệu cân nặng</p>
              <p className='mt-1 text-sm text-muted-foreground'>
                Nhập chỉ số để bắt đầu theo dõi.
              </p>
            </div>
            <Button variant='outline' size='sm' asChild>
              <Link href='/nutrition/health-metrics'>Nhập chỉ số đầu tiên</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  const values = weights.map((w) => w.can_nang_kg)
  const minW = Math.min(...values)
  const maxW = Math.max(...values)
  const range = maxW - minW || 1
  const chartH = 120
  const pad = (v: number) => ((v - minW + range * 0.1) / (range * 1.2)) * chartH

  const viewW = Math.max(weights.length * 48, 200)
  const svgPoints = weights.map((w, i) => `${i * 48 + 24},${chartH - pad(w.can_nang_kg)}`).join(' ')

  return (
    <Card>
      <CardHeader className='pb-2'>
        <div className='flex items-center justify-between'>
          <div>
            <CardTitle className='text-base'>Xu hướng cân nặng</CardTitle>
            <CardDescription>{weights.length} lần đo gần đây</CardDescription>
          </div>
          {goal?.can_nang_muc_tieu_kg && (
            <div className='text-right'>
              <p className='text-xs text-muted-foreground'>Mục tiêu</p>
              <p className='text-sm font-semibold'>{goal.can_nang_muc_tieu_kg} kg</p>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className='relative h-[120px] w-full overflow-x-auto'>
          <svg
            viewBox={`0 0 ${viewW} ${chartH}`}
            className='w-full min-w-[300px]'
            preserveAspectRatio='none'
          >
            {goal?.can_nang_muc_tieu_kg && (
              <line
                x1='0' y1={pad(goal.can_nang_muc_tieu_kg)}
                x2={viewW} y2={pad(goal.can_nang_muc_tieu_kg)}
                stroke='var(--primary)' strokeWidth='1.5' strokeDasharray='4,3'
              />
            )}
            <polyline
              fill='none' stroke='var(--primary)' strokeWidth='2'
              strokeLinecap='round' strokeLinejoin='round'
              points={svgPoints}
            />
            {weights.map((w, i) => (
              <circle key={i} cx={i * 48 + 24} cy={chartH - pad(w.can_nang_kg)} r='3' fill='var(--primary)' />
            ))}
          </svg>
          <div className='mt-2 flex justify-between text-xs text-muted-foreground'>
            {weights.slice(-7).map((w, i) => (
              <span key={i}>
                {new Date(w.do_luc).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}
              </span>
            ))}
          </div>
        </div>
        <div className='mt-3 flex items-center justify-end gap-4 text-xs text-muted-foreground'>
          <span className='flex items-center gap-1'>
            <span className='inline-block h-0.5 w-4 rounded bg-primary' />Cân nặng thực tế
          </span>
          {goal?.can_nang_muc_tieu_kg && (
            <span className='flex items-center gap-1'>
              <span className='inline-block h-0.5 w-4 rounded border border-primary bg-primary/20' />Mục tiêu
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// ---- Health assessment card (C07: BMI, BMR, TDEE, macros) ----
function AssessmentCard({ data }: { data: Data }) {
  const a = data.danh_gia_suc_khoe_moi_nhat

  if (!a) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className='text-base'>Đánh giá sức khỏe</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='flex h-40 flex-col items-center justify-center gap-2 text-center'>
            <Activity className='size-10 text-muted-foreground' />
            <p className='font-medium'>Chưa có đánh giá sức khỏe</p>
            <p className='text-sm text-muted-foreground'>
              Cập nhật hồ sơ và nhập chỉ số để nhận đánh giá tự động.
            </p>
            <Button size='sm' variant='outline' asChild>
              <Link href='/nutrition/health-metrics'>Nhập chỉ số</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  const bmiInfo = bmiLabel(a.bmi)

  return (
    <Card>
      <CardHeader className='pb-3'>
        <div className='flex items-center justify-between'>
          <div>
            <CardTitle className='text-base'>Đánh giá sức khỏe</CardTitle>
            <CardDescription>
              {a.tao_luc ? `Cập nhật ${new Date(a.tao_luc).toLocaleDateString('vi-VN')}` : ''}
            </CardDescription>
          </div>
          <Badge variant={bmiInfo.text === 'Bình thường' ? 'default' : 'secondary'}>
            {bmiInfo.text}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className='space-y-4'>
        <BmiGauge bmi={a.bmi} />
        <Separator />
        <div className='grid grid-cols-3 gap-3 text-center'>
          {[
            { label: 'BMR', value: a.bmr ? `${a.bmr}` : '-', hint: 'kcal/ngày' },
            { label: 'TDEE', value: a.tdee ? `${a.tdee}` : '-', hint: 'kcal/ngày' },
            { label: 'BMI', value: a.bmi ? a.bmi.toFixed(1) : '-', hint: bmiInfo.text },
          ].map((item) => (
            <div key={item.label} className='rounded-lg border p-2'>
              <p className='text-xs text-muted-foreground'>{item.label}</p>
              <p className={cn('mt-0.5 text-sm font-semibold', item.label === 'BMI' ? bmiInfo.colorClass : '')}>
                {item.value}
              </p>
              <p className='text-xs text-muted-foreground'>{item.hint}</p>
            </div>
          ))}
        </div>
        <Separator />
        <div className='grid grid-cols-2 gap-2 text-xs'>
          {[
            { label: 'Calories KN', value: a.calories_khuyen_nghi ? `${a.calories_khuyen_nghi} kcal` : '-' },
            { label: 'Protein KN', value: a.protein_khuyen_nghi_g ? `${a.protein_khuyen_nghi_g}g` : '-' },
            { label: 'Carb KN', value: a.carb_khuyen_nghi_g ? `${a.carb_khuyen_nghi_g}g` : '-' },
            { label: 'Fat KN', value: a.fat_khuyen_nghi_g ? `${a.fat_khuyen_nghi_g}g` : '-' },
          ].map((item) => (
            <div key={item.label} className='flex justify-between rounded bg-muted/50 px-2 py-1'>
              <span className='text-muted-foreground'>{item.label}</span>
              <span className='font-medium'>{item.value}</span>
            </div>
          ))}
        </div>
        {a.tom_tat && (
          <div className='rounded-lg bg-primary/5 p-3 text-xs text-muted-foreground'>
            {a.tom_tat}
          </div>
        )}
        <Button variant='outline' size='sm' className='w-full' asChild>
          <Link href='/nutrition/health-metrics'>Xem chi tiết &amp; cập nhật</Link>
        </Button>
      </CardContent>
    </Card>
  )
}

// ---- Notifications badge (C07: thong_bao_chua_doc) ----
function NotificationBell({ count }: { count: number }) {
  if (count === 0) return null
  return (
    <Link href='/nutrition/notifications'>
      <Button variant='ghost' size='icon' className='relative'>
        <Bell className='size-5' />
        <span className='absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white'>
          {count > 9 ? '9+' : count}
        </span>
      </Button>
    </Link>
  )
}

// ---- AI recommendation (C07) ----
function AiRecommendationCard({ data }: { data: Data }) {
  const ai = data.khuyen_nghi_ai_moi_nhat

  if (!ai) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2 text-base'>
            <Bot className='size-4 text-primary' />
            Khuyến nghị AI
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='flex h-32 flex-col items-center justify-center gap-2 text-center'>
            <Bot className='size-10 text-muted-foreground' />
            <p className='text-sm text-muted-foreground'>Chưa có khuyến nghị nào</p>
            <Button size='sm' variant='outline' asChild>
              <Link href='/nutrition/ai-advisor'>Nhận tư vấn AI</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className='pb-3'>
        <div className='flex items-center justify-between'>
          <CardTitle className='flex items-center gap-2 text-base'>
            <Bot className='size-4 text-primary' />
            Khuyến nghị AI
          </CardTitle>
          <Badge variant={ai.trang_thai === 'da_ap_dung' ? 'default' : 'secondary'} className='text-xs'>
            {ai.loai_khuyen_nghi}
          </Badge>
        </div>
        <CardDescription>
          {new Date(ai.tao_luc).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-3'>
        {ai.ly_giai && (
          <p className='text-sm leading-relaxed text-muted-foreground'>{ai.ly_giai}</p>
        )}
        {ai.muc_tieu_calories && (
          <div className='rounded-lg bg-primary/5 p-3 text-sm'>
            <p className='font-medium'>Mục tiêu gợi ý</p>
            <p className='mt-1 text-muted-foreground'>
              {ai.muc_tieu_calories} kcal · {ai.muc_tieu_protein_g}g P · {ai.muc_tieu_carb_g}g C · {ai.muc_tieu_fat_g}g F
            </p>
          </div>
        )}
        <Button className='w-full justify-between' variant='outline' asChild>
          <Link href='/nutrition/ai-advisor'>
            Mở AI tư vấn <ArrowRight className='size-4' />
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}

// ---- Quick actions (C07: nút hành động nhanh) ----
function QuickActions({ data }: { data: Data }) {
  const actions = [
    {
      label: 'Ghi bữa ăn', icon: Utensils, href: '/nutrition/meal-logs',
      desc: data.dinh_duong_hom_nay?.so_bua_da_ghi
        ? `${data.dinh_duong_hom_nay.so_bua_da_ghi} bữa đã ghi hôm nay`
        : 'Bắt đầu ghi hôm nay',
    },
    {
      label: 'Cập nhật chỉ số', icon: ClipboardList, href: '/nutrition/health-metrics',
      desc: data.chi_so_gan_nhat?.can_nang_kg
        ? `Cân nặng: ${data.chi_so_gan_nhat.can_nang_kg}kg`
        : 'Nhập lần đo mới',
    },
    {
      label: 'Tìm thực phẩm', icon: Salad, href: '/nutrition/foods',
      desc: 'Tra cứu giá trị dinh dưỡng',
    },
    {
      label: 'Xem thực đơn', icon: Dumbbell, href: '/nutrition/meal-plans',
      desc: 'Kế hoạch ăn cá nhân',
    },
  ]

  return (
    <Card>
      <CardHeader className='pb-3'>
        <CardTitle className='text-base'>Thao tác nhanh</CardTitle>
      </CardHeader>
      <CardContent className='grid gap-2'>
        {actions.map((action) => (
          <Button
            key={action.label} variant='ghost' className='justify-start h-auto py-3'
            asChild
          >
            <Link href={action.href}>
              <div className='mr-3 rounded-lg bg-primary/10 p-2'>
                <action.icon className='size-4 text-primary' />
              </div>
              <div className='text-left'>
                <p className='text-sm font-medium'>{action.label}</p>
                <p className='text-xs text-muted-foreground'>{action.desc}</p>
              </div>
              <ChevronRight className='ml-auto size-4 text-muted-foreground' />
            </Link>
          </Button>
        ))}
      </CardContent>
    </Card>
  )
}

export function NutritionUserDashboard() {
  const [data, setData] = useState<DashboardResponse['data'] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getDashboard()
      .then((res) => setData(res.data))
      .catch((e) => setError(e?.message ?? 'Lỗi khi tải dashboard'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <>
        <NutritionTopbar />
        <Main className='flex flex-1 flex-col gap-6 p-6'>
          <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-4'>
            {[...Array(4)].map((_, i) => (
              <Card key={i} className='animate-pulse'><CardContent className='h-28 p-5' /></Card>
            ))}
          </div>
          <div className='grid gap-6 xl:grid-cols-2'>
            {[...Array(2)].map((_, i) => (
              <Card key={i} className='animate-pulse'><CardContent className='h-64 p-6' /></Card>
            ))}
          </div>
        </Main>
      </>
    )
  }

  if (error || !data) {
    return (
      <>
        <NutritionTopbar />
        <Main className='flex flex-1 flex-col items-center justify-center gap-4'>
          <AlertCircle className='size-12 text-destructive' />
          <p className='text-muted-foreground'>{error ?? 'Không thể tải dashboard'}</p>
          <Button onClick={() => window.location.reload()}>Thử lại</Button>
        </Main>
      </>
    )
  }

  return (
    <>
      <NutritionTopbar />
      <Main className='flex flex-1 flex-col gap-6'>
        {/* Heading + notification bell */}
        <div className='flex flex-wrap items-start justify-between gap-3'>
          <div>
            <h1 className='text-2xl font-semibold tracking-tight'>Dashboard sức khỏe</h1>
            <p className='text-sm text-muted-foreground'>
              Theo dõi mục tiêu, dinh dưỡng và tiến độ sức khỏe.
            </p>
          </div>
          <div className='flex items-center gap-2'>
            <NotificationBell count={data.thong_bao_chua_doc} />
            <Button variant='outline' size='sm' asChild>
              <Link href='/nutrition/health-metrics'>
                <ClipboardList className='mr-1.5 size-3.5' />
                Cập nhật chỉ số
              </Link>
            </Button>
            <Button size='sm' asChild>
              <Link href='/nutrition/meal-logs'>
                <Utensils className='mr-1.5 size-3.5' />
                Ghi bữa ăn
              </Link>
            </Button>
          </div>
        </div>

        {/* Onboarding + missing data */}
        <OnboardingCard data={data} />
        <MissingDataWarning data={data} />

        {/* Stat cards */}
        <StatGrid data={data} />

        {/* Main grid */}
        <div className='grid gap-6 xl:grid-cols-[1.3fr_1fr]'>
          <div className='space-y-6'>
            <MacroSection data={data} />
            <WeightChart data={data} />
          </div>
          <div className='space-y-6'>
            <AssessmentCard data={data} />
            <AiRecommendationCard data={data} />
            <QuickActions data={data} />
          </div>
        </div>
      </Main>
    </>
  )
}
