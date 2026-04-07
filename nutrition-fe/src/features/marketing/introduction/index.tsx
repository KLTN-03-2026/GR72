'use client'

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import {
  ArrowRight,
  BadgeCheck,
  Brain,
  LayoutDashboard,
  MessageCircleMore,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

const highlights = [
  'Theo dõi sức khỏe và dinh dưỡng hằng ngày',
  'AI tư vấn, đánh giá và giải đáp theo hồ sơ người dùng',
  'Không gian staff riêng cho nutritionist và admin',
]

const featureCards = [
  {
    title: 'Bức tranh sức khỏe rõ ràng',
    description:
      'Dashboard tổng hợp BMI, BMR, TDEE, mục tiêu, calories và xu hướng cân nặng trong một nơi duy nhất.',
    icon: LayoutDashboard,
  },
  {
    title: 'AI đồng hành mỗi ngày',
    description:
      'Chat real-time, đánh giá tình trạng sức khỏe và đưa ra khuyến nghị dinh dưỡng phù hợp với thông tin hiện tại.',
    icon: Brain,
  },
  {
    title: 'Vận hành nội dung tập trung',
    description:
      'Nutritionist và admin có workspace riêng để quản lý thực phẩm, bài viết, recipe, meal template và duyệt dữ liệu.',
    icon: ShieldCheck,
  },
]

const roleCards = [
  {
    role: 'User',
    summary: 'Người dùng cuối theo dõi sức khỏe và dinh dưỡng cá nhân.',
    items: [
      'Xem dashboard sức khỏe và calories trong ngày',
      'Quản lý profile, mục tiêu, chỉ số và meal log',
      'Chat AI, đọc bài viết và nhận thông báo',
    ],
  },
  {
    role: 'Nutritionist',
    summary: 'Phụ trách nội dung chuyên môn và dữ liệu dinh dưỡng.',
    items: [
      'Quản lý foods, recipes và meal templates',
      'Soạn bài viết và guideline AI trong nội dung',
      'Xử lý review request liên quan đến catalog',
    ],
  },
  {
    role: 'Admin',
    summary: 'Điều phối hệ thống và kiểm soát tài khoản vận hành.',
    items: [
      'Theo dõi dashboard staff và thông báo hệ thống',
      'Xem toàn bộ khu vực staff và quản lý user',
      'Kiểm soát quyền truy cập trong không gian vận hành',
    ],
  },
]

const screenSections = [
  {
    eyebrow: 'Khởi động với user app',
    title: 'Một trải nghiệm cá nhân hóa, không làm người dùng bị ngợp',
    description:
      'Khu vực `/nutrition/*` tập trung vào đúng những việc người dùng cần làm mỗi ngày: theo dõi sức khỏe, log bữa ăn, nhận tư vấn AI và đọc nội dung chuyên môn.',
    bullets: [
      'Dashboard cho thấy ngay tiến độ mục tiêu và tình trạng dinh dưỡng hiện tại',
      'Form nhập liệu được giữ ngắn gọn, có validate và toast phản hồi tức thời',
      'Dữ liệu demo được lưu bằng localStorage để reload không bị mất',
    ],
  },
  {
    eyebrow: 'Vận hành cho staff',
    title: 'Nutritionist và admin dùng chung shell, khác nhau ở quyền nhìn màn',
    description:
      'Khu vực `/staff/*` tái sử dụng dashboard shell cũ nhưng đã được custom lại hoàn toàn theo nghiệp vụ dinh dưỡng và sức khỏe.',
    bullets: [
      'Các bảng staff có filter, sort, pagination và detail panel',
      'Màn `/staff/users` được để admin-only ở mức UI guard',
      'Mỗi màn giữ cấu trúc đủ chi tiết để có thể nối API trực tiếp ở bước sau',
    ],
  },
]

const flowSteps = [
  {
    title: '1. Tạo hồ sơ và mục tiêu',
    description: 'Người dùng thiết lập profile, cân nặng hiện tại, mục tiêu và mốc thời gian mong muốn.',
  },
  {
    title: '2. Ghi nhận chỉ số và bữa ăn',
    description: 'Nhập sức khỏe theo chu kỳ và log từng bữa để hệ thống tổng hợp calories cùng macro.',
  },
  {
    title: '3. Nhận tư vấn từ AI',
    description: 'AI đọc dữ liệu hiện tại để đánh giá, giải đáp thắc mắc và đưa ra khuyến nghị dinh dưỡng.',
  },
  {
    title: '4. Staff bổ sung nội dung',
    description: 'Nutritionist và admin duy trì kho thực phẩm, recipe, meal template và bài viết cho toàn hệ thống.',
  },
]

export function NutritionIntroductionPage() {
  const [scrollProgress, setScrollProgress] = useState(0)

  useEffect(() => {
    let ticking = false

    const updateProgress = () => {
      const maxScroll =
        document.documentElement.scrollHeight - document.documentElement.clientHeight
      const progress = maxScroll > 0 ? window.scrollY / maxScroll : 0
      setScrollProgress(progress)
      ticking = false
    }

    const onScroll = () => {
      if (!ticking) {
        ticking = true
        window.requestAnimationFrame(updateProgress)
      }
    }

    updateProgress()
    window.addEventListener('scroll', onScroll, { passive: true })

    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const progressStyle = useMemo(
    () => ({
      transform: `scaleX(${Math.min(Math.max(scrollProgress, 0), 1)})`,
    }),
    [scrollProgress]
  )

  return (
    <div className='relative min-h-screen overflow-x-hidden bg-background text-foreground'>
      <div className='fixed inset-x-0 top-0 z-50 h-1 origin-left bg-gradient-to-r from-emerald-400 via-cyan-400 to-amber-300' style={progressStyle} />

      <div className='pointer-events-none absolute inset-0 overflow-hidden'>
        <div className='intro-drift absolute left-[-8rem] top-24 h-72 w-72 rounded-full bg-emerald-400/15 blur-3xl' />
        <div className='intro-float absolute right-[-7rem] top-12 h-80 w-80 rounded-full bg-cyan-400/15 blur-3xl' />
        <div className='intro-drift absolute bottom-24 left-1/3 h-72 w-72 rounded-full bg-amber-300/10 blur-3xl' />
        <div className='intro-grid absolute inset-0 opacity-30' />
      </div>

      <header className='sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl'>
        <div className='container flex h-16 items-center justify-between gap-4'>
          <Link href='/introduction' className='flex items-center gap-3'>
            <div className='flex size-10 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-cyan-500 text-sm font-bold text-white shadow-lg shadow-emerald-500/20'>
              NW
            </div>
            <div>
              <p className='font-manrope text-sm font-semibold tracking-wide'>
                NutriWise Health
              </p>
              <p className='text-xs text-muted-foreground'>
                Nutrition, health and AI system
              </p>
            </div>
          </Link>

          <nav className='hidden items-center gap-6 text-sm text-muted-foreground lg:flex'>
            <a href='#tong-quan' className='transition-colors hover:text-foreground'>
              Tổng quan
            </a>
            <a href='#vai-tro' className='transition-colors hover:text-foreground'>
              Vai trò
            </a>
            <a href='#man-hinh' className='transition-colors hover:text-foreground'>
              Màn hình
            </a>
            <a href='#bat-dau' className='transition-colors hover:text-foreground'>
              Bắt đầu
            </a>
          </nav>

          <div className='flex items-center gap-2'>
            <Button asChild variant='ghost' className='hidden sm:inline-flex'>
              <Link href='/sign-in'>Đăng nhập</Link>
            </Button>
            <Button asChild className='rounded-full px-5'>
              <Link href='/nutrition/dashboard'>
                Vào hệ thống
                <ArrowRight className='ml-2 size-4' />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main>
        <section id='tong-quan' className='relative'>
          <div className='container grid min-h-[calc(100vh-4rem)] items-center gap-12 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:py-24'>
            <Reveal className='space-y-8'>
              <div className='space-y-5'>
                <Badge className='rounded-full border-0 bg-emerald-500/12 px-4 py-1.5 text-emerald-700 dark:text-emerald-300'>
                  Hệ thống dinh dưỡng, sức khỏe và AI tư vấn
                </Badge>
                <h1 className='max-w-4xl font-manrope text-5xl font-semibold leading-[1.02] tracking-tight text-balance md:text-6xl xl:text-7xl'>
                  Một nền tảng giúp người dùng hiểu cơ thể mình rõ hơn và hành động đúng mỗi ngày.
                </h1>
                <p className='max-w-2xl text-lg leading-8 text-muted-foreground md:text-xl'>
                  NutriWise kết nối dashboard sức khỏe, nhật ký ăn uống, AI tư vấn và không gian vận hành cho nutritionist/admin vào cùng một hệ thống mạch lạc.
                </p>
              </div>

              <div className='grid gap-3 sm:grid-cols-2'>
                {highlights.map((item, index) => (
                  <Reveal key={item} delay={index * 90}>
                    <div className='flex h-full items-start gap-3 rounded-2xl border border-border/70 bg-card/70 p-4 shadow-sm backdrop-blur'>
                      <BadgeCheck className='mt-0.5 size-5 text-emerald-500' />
                      <p className='text-sm leading-6 text-muted-foreground'>{item}</p>
                    </div>
                  </Reveal>
                ))}
              </div>

              <div className='flex flex-wrap gap-3'>
                <Button asChild size='lg' className='rounded-full px-6'>
                  <Link href='/nutrition/dashboard'>
                    Khám phá dashboard
                    <ArrowRight className='ml-2 size-4' />
                  </Link>
                </Button>
                <Button asChild variant='outline' size='lg' className='rounded-full px-6'>
                  <Link href='/staff/dashboard'>Xem khu staff</Link>
                </Button>
              </div>
            </Reveal>

            <Reveal delay={120} className='relative'>
              <div className='intro-float relative mx-auto max-w-2xl'>
                <div className='absolute -inset-6 rounded-[2rem] bg-gradient-to-br from-emerald-400/15 via-cyan-400/10 to-amber-300/15 blur-2xl' />
                <div className='relative rounded-[2rem] border border-border/60 bg-card/80 p-4 shadow-2xl shadow-black/5 backdrop-blur-xl md:p-6'>
                  <div className='grid gap-4'>
                    <div className='grid gap-4 md:grid-cols-[1.2fr_0.8fr]'>
                      <HeroPanel
                        title='Dashboard sức khỏe'
                        tone='emerald'
                        lines={['BMI 22.4 • BMR 1,420', 'TDEE 2,040 • Goal giảm cân', 'Calories hôm nay 1,560 / 1,850']}
                      />
                      <HeroPanel
                        title='AI tư vấn'
                        tone='cyan'
                        lines={['Đánh giá khẩu phần hôm nay', 'Gợi ý tăng đạm ở bữa phụ', 'Giải đáp câu hỏi dinh dưỡng']}
                      />
                    </div>

                    <div className='grid gap-4 md:grid-cols-3'>
                      <MetricMiniCard label='Người dùng' value='1 khu user app' sub='Trải nghiệm cá nhân hóa' />
                      <MetricMiniCard label='Staff' value='Nutritionist + Admin' sub='Vận hành chung, tách theo quyền' />
                      <MetricMiniCard label='Lưu trạng thái' value='Persist local' sub='Reload không mất dữ liệu demo' />
                    </div>

                    <Card className='border-border/70 bg-background/80'>
                      <CardHeader className='pb-3'>
                        <CardTitle className='text-base'>Trải nghiệm mượt để demo và phát triển tiếp</CardTitle>
                      </CardHeader>
                      <CardContent className='grid gap-3 sm:grid-cols-3'>
                        <ProgressBar label='UI feedback' value='Toast + validate' width='78%' />
                        <ProgressBar label='Staff tables' value='Filter / sort / page' width='84%' />
                        <ProgressBar label='Landing motion' value='Scroll reveal nhẹ' width='72%' />
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        <section className='container py-8 md:py-16'>
          <div className='grid gap-4 lg:grid-cols-3'>
            {featureCards.map((item, index) => {
              const Icon = item.icon
              return (
                <Reveal key={item.title} delay={index * 90}>
                  <Card className='h-full rounded-3xl border-border/70 bg-card/75 shadow-sm backdrop-blur'>
                    <CardHeader className='space-y-4'>
                      <div className='flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary'>
                        <Icon className='size-5' />
                      </div>
                      <CardTitle className='font-manrope text-2xl'>{item.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className='leading-7 text-muted-foreground'>{item.description}</p>
                    </CardContent>
                  </Card>
                </Reveal>
              )
            })}
          </div>
        </section>

        <section id='vai-tro' className='container py-16'>
          <Reveal className='mb-8 space-y-3'>
            <Badge variant='outline' className='rounded-full px-4 py-1.5'>
              Phân tầng theo vai trò
            </Badge>
            <h2 className='font-manrope text-3xl font-semibold tracking-tight md:text-5xl'>
              Mỗi vai trò một góc nhìn, nhưng cùng nằm trong một hệ thống thống nhất
            </h2>
            <p className='max-w-3xl text-lg leading-8 text-muted-foreground'>
              Kiến trúc được chia rõ thành user app và staff app, để trải nghiệm không bị pha trộn và vẫn dễ mở rộng khi nối API thật.
            </p>
          </Reveal>

          <div className='grid gap-4 lg:grid-cols-3'>
            {roleCards.map((item, index) => (
              <Reveal key={item.role} delay={index * 80}>
                <Card className='h-full rounded-3xl border-border/70 bg-card/75'>
                  <CardHeader>
                    <Badge className='w-fit rounded-full bg-primary/10 text-primary'>{item.role}</Badge>
                    <CardTitle className='font-manrope text-2xl'>{item.summary}</CardTitle>
                  </CardHeader>
                  <CardContent className='space-y-3'>
                    {item.items.map((entry) => (
                      <div key={entry} className='flex items-start gap-3 rounded-2xl border border-border/70 p-3'>
                        <Sparkles className='mt-0.5 size-4 text-amber-500' />
                        <p className='text-sm leading-6 text-muted-foreground'>{entry}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </Reveal>
            ))}
          </div>
        </section>

        <section id='man-hinh' className='container py-16'>
          <div className='grid gap-6 xl:grid-cols-2'>
            {screenSections.map((section, index) => (
              <Reveal key={section.title} delay={index * 90}>
                <Card className='h-full rounded-[2rem] border-border/70 bg-gradient-to-br from-card via-card to-card/70'>
                  <CardHeader className='space-y-4'>
                    <Badge variant='secondary' className='w-fit rounded-full px-4 py-1.5'>
                      {section.eyebrow}
                    </Badge>
                    <CardTitle className='font-manrope text-3xl leading-tight'>
                      {section.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className='space-y-4'>
                    <p className='leading-7 text-muted-foreground'>{section.description}</p>
                    <div className='space-y-3'>
                      {section.bullets.map((bullet) => (
                        <div key={bullet} className='rounded-2xl border border-border/70 bg-background/70 p-4 text-sm leading-6 text-muted-foreground'>
                          {bullet}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </Reveal>
            ))}
          </div>
        </section>

        <section className='container py-16'>
          <Reveal className='rounded-[2rem] border border-border/70 bg-card/80 p-6 shadow-sm backdrop-blur md:p-10'>
            <div className='grid gap-8 lg:grid-cols-[0.85fr_1.15fr]'>
              <div className='space-y-4'>
                <Badge variant='outline' className='rounded-full px-4 py-1.5'>
                  Luồng chính của hệ thống
                </Badge>
                <h2 className='font-manrope text-3xl font-semibold tracking-tight md:text-5xl'>
                  Từ hồ sơ ban đầu đến vận hành nội dung, mọi bước đều đã có điểm chạm trên giao diện
                </h2>
                <p className='text-lg leading-8 text-muted-foreground'>
                  Đây là nền frontend đủ rộng để bạn nối API ở giai đoạn kế tiếp mà không cần thay đổi lại toàn bộ luồng màn hình.
                </p>
              </div>

              <div className='grid gap-4'>
                {flowSteps.map((step, index) => (
                  <Reveal key={step.title} delay={index * 70}>
                    <div className='flex gap-4 rounded-3xl border border-border/70 bg-background/80 p-5'>
                      <div className='flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary'>
                        {index === 0 ? (
                          <Users className='size-5' />
                        ) : index === 1 ? (
                          <Target className='size-5' />
                        ) : index === 2 ? (
                          <MessageCircleMore className='size-5' />
                        ) : (
                          <ShieldCheck className='size-5' />
                        )}
                      </div>
                      <div className='space-y-1'>
                        <p className='font-medium'>{step.title}</p>
                        <p className='text-sm leading-6 text-muted-foreground'>
                          {step.description}
                        </p>
                      </div>
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>
          </Reveal>
        </section>

        <section id='bat-dau' className='container py-16 pb-24'>
          <Reveal className='relative overflow-hidden rounded-[2rem] border border-border/70 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.18),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(34,211,238,0.16),transparent_32%),var(--card)] p-8 md:p-12'>
            <div className='absolute inset-y-0 right-0 hidden w-1/3 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.04))] lg:block' />
            <div className='relative grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end'>
              <div className='space-y-4'>
                <Badge className='rounded-full border-0 bg-white/10 px-4 py-1.5 text-foreground'>
                  Frontend introduction page
                </Badge>
                <h2 className='max-w-3xl font-manrope text-3xl font-semibold tracking-tight md:text-5xl'>
                  Một điểm bắt đầu đủ ấn tượng để giới thiệu đồ án, demo hệ thống hoặc dẫn người dùng vào trải nghiệm chính.
                </h2>
                <p className='max-w-2xl text-lg leading-8 text-muted-foreground'>
                  Landing page này được làm để bao quát toàn hệ thống, nhấn mạnh đúng 3 nhóm vai trò và vẫn giữ animation nhẹ để không gây lag khi cuộn.
                </p>
              </div>

              <div className='flex flex-wrap gap-3'>
                <Button asChild size='lg' className='rounded-full px-6'>
                  <Link href='/sign-up'>Tạo tài khoản</Link>
                </Button>
                <Button asChild variant='outline' size='lg' className='rounded-full px-6'>
                  <Link href='/nutrition/dashboard'>Vào demo nội bộ</Link>
                </Button>
              </div>
            </div>
          </Reveal>
        </section>
      </main>
    </div>
  )
}

function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode
  className?: string
  delay?: number
}) {
  const [visible, setVisible] = useState(false)
  const ref = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.16, rootMargin: '0px 0px -10% 0px' }
    )

    observer.observe(element)

    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className={cn(
        'transition-all duration-700 ease-out motion-reduce:transform-none motion-reduce:opacity-100',
        visible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0',
        className
      )}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  )
}

function HeroPanel({
  title,
  lines,
  tone,
}: {
  title: string
  lines: string[]
  tone: 'emerald' | 'cyan'
}) {
  const toneClass =
    tone === 'emerald'
      ? 'border-emerald-500/20 bg-emerald-500/8'
      : 'border-cyan-500/20 bg-cyan-500/8'

  return (
    <Card className={cn('rounded-3xl border shadow-sm', toneClass)}>
      <CardHeader className='pb-3'>
        <CardTitle className='text-base'>{title}</CardTitle>
      </CardHeader>
      <CardContent className='space-y-3'>
        {lines.map((line) => (
          <div key={line} className='rounded-2xl bg-background/75 px-3 py-2 text-sm text-muted-foreground'>
            {line}
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

function MetricMiniCard({
  label,
  value,
  sub,
}: {
  label: string
  value: string
  sub: string
}) {
  return (
    <div className='rounded-3xl border border-border/70 bg-background/80 p-4'>
      <p className='text-xs uppercase tracking-[0.2em] text-muted-foreground'>{label}</p>
      <p className='mt-2 font-manrope text-xl font-semibold'>{value}</p>
      <p className='mt-1 text-sm text-muted-foreground'>{sub}</p>
    </div>
  )
}

function ProgressBar({
  label,
  value,
  width,
}: {
  label: string
  value: string
  width: string
}) {
  return (
    <div className='space-y-2 rounded-2xl border border-border/70 p-4'>
      <div className='flex items-center justify-between gap-3 text-sm'>
        <span className='text-muted-foreground'>{label}</span>
        <span className='font-medium'>{value}</span>
      </div>
      <div className='h-2 rounded-full bg-muted'>
        <div
          className='h-2 rounded-full bg-gradient-to-r from-emerald-400 via-cyan-400 to-amber-300'
          style={{ width }}
        />
      </div>
    </div>
  )
}
