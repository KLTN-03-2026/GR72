'use client'

import { useEffect, useState } from 'react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  ArrowUpRight,
  BarChart3,
  DollarSign,
  TrendingUp,
  Users,
} from 'lucide-react'
import { toast } from 'sonner'
import { ApiError } from '@/services/auth/api'
import {
  type PackageStatsData,
  type RevenueData,
  getPackageStats,
  getRevenue,
} from '@/services/admin-reports/api'
import { Main } from '@/components/layout/main'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AdminTopbar } from '@/components/layout/admin-topbar'
import { PageHeading } from '@/features/nutrition/components/page-heading'

const CHART_COLORS = ['#6366f1', '#8b5cf6', '#a78bfa', '#c4b5fd', '#ddd6fe']

function formatCurrency(v: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v)
}

function formatShortCurrency(v: number) {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1_000) return `${(v / 1_000).toFixed(0)}K`
  return String(v)
}

export function AdminReports() {
  const [revenue, setRevenue] = useState<RevenueData | null>(null)
  const [packageStats, setPackageStats] = useState<PackageStatsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const [r, p] = await Promise.all([getRevenue(), getPackageStats()])
        setRevenue(r)
        setPackageStats(p)
      } catch (e) {
        toast.error(e instanceof ApiError ? e.message : 'Lỗi tải báo cáo')
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [])

  if (loading) {
    return (
      <>
        <AdminTopbar />
        <Main fluid className='flex items-center justify-center h-[60vh]'>
          <div className='flex flex-col items-center gap-3'>
            <div className='size-8 animate-spin rounded-full border-2 border-primary border-t-transparent' />
            <p className='text-sm text-muted-foreground'>Đang tải báo cáo...</p>
          </div>
        </Main>
      </>
    )
  }

  const monthlyData = (revenue?.doanh_thu_theo_thang ?? []).map((m) => ({
    name: m.thang,
    'Doanh thu': m.doanh_thu,
    'Giao dịch': m.so_giao_dich,
  }))

  const packageDistribution = (packageStats?.phan_bo_nguoi_dung ?? []).map((p) => ({
    name: p.ten_goi,
    value: p.so_nguoi_dung,
  }))

  const bestSelling = (packageStats?.goi_ban_chay ?? []).map((b) => ({
    name: b.ten_goi,
    'Giao dịch': b.so_giao_dich,
    'Tổng tiền': b.tong_tien,
  }))

  const convRate = packageStats?.ty_le_chuyen_doi
  const conversionPieData = convRate ? [
    { name: 'Trả phí', value: convRate.tra_phi, fill: '#6366f1' },
    { name: 'Miễn phí', value: Math.max(0, convRate.tong_dang_ky_hoat_dong - convRate.tra_phi), fill: '#e2e8f0' },
  ] : []

  return (
    <>
      <AdminTopbar />
      <Main fluid className='flex flex-1 flex-col gap-6 px-3 py-5 sm:px-4'>
        <PageHeading
          title='Báo cáo doanh thu & thống kê'
          description='Tổng hợp doanh thu từ thanh toán và phân bổ người dùng theo gói dịch vụ.'
        />

        {/* KPI Cards */}
        <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
          <Card className='relative overflow-hidden'>
            <CardHeader className='flex flex-row items-center justify-between pb-2'>
              <CardTitle className='text-sm font-medium text-muted-foreground'>Tổng doanh thu</CardTitle>
              <div className='rounded-lg bg-emerald-500 p-2'>
                <DollarSign className='size-4 text-white' />
              </div>
            </CardHeader>
            <CardContent>
              <p className='text-2xl font-bold'>{formatCurrency(revenue?.tong_doanh_thu ?? 0)}</p>
              <p className='mt-1 flex items-center gap-1 text-xs text-muted-foreground'>
                <ArrowUpRight className='size-3 text-emerald-500' />
                {revenue?.tong_giao_dich ?? 0} giao dịch thành công
              </p>
            </CardContent>
            <div className='absolute -bottom-4 -right-4 size-24 rounded-full bg-emerald-500 opacity-5' />
          </Card>

          <Card className='relative overflow-hidden'>
            <CardHeader className='flex flex-row items-center justify-between pb-2'>
              <CardTitle className='text-sm font-medium text-muted-foreground'>Tỷ lệ chuyển đổi</CardTitle>
              <div className='rounded-lg bg-indigo-500 p-2'>
                <TrendingUp className='size-4 text-white' />
              </div>
            </CardHeader>
            <CardContent>
              <p className='text-2xl font-bold'>{convRate?.ty_le ?? 0}%</p>
              <p className='mt-1 text-xs text-muted-foreground'>
                {convRate?.tra_phi ?? 0} trả phí / {convRate?.tong_dang_ky_hoat_dong ?? 0} tổng
              </p>
            </CardContent>
            <div className='absolute -bottom-4 -right-4 size-24 rounded-full bg-indigo-500 opacity-5' />
          </Card>

          <Card className='relative overflow-hidden'>
            <CardHeader className='flex flex-row items-center justify-between pb-2'>
              <CardTitle className='text-sm font-medium text-muted-foreground'>Gói bán chạy</CardTitle>
              <div className='rounded-lg bg-amber-500 p-2'>
                <BarChart3 className='size-4 text-white' />
              </div>
            </CardHeader>
            <CardContent>
              <p className='text-2xl font-bold'>{bestSelling[0]?.name ?? '—'}</p>
              <p className='mt-1 text-xs text-muted-foreground'>
                {bestSelling[0]?.['Giao dịch'] ?? 0} giao dịch
              </p>
            </CardContent>
            <div className='absolute -bottom-4 -right-4 size-24 rounded-full bg-amber-500 opacity-5' />
          </Card>

          <Card className='relative overflow-hidden'>
            <CardHeader className='flex flex-row items-center justify-between pb-2'>
              <CardTitle className='text-sm font-medium text-muted-foreground'>Tổng users theo gói</CardTitle>
              <div className='rounded-lg bg-blue-500 p-2'>
                <Users className='size-4 text-white' />
              </div>
            </CardHeader>
            <CardContent>
              <p className='text-2xl font-bold'>
                {packageDistribution.reduce((sum, p) => sum + p.value, 0).toLocaleString('vi-VN')}
              </p>
              <p className='mt-1 text-xs text-muted-foreground'>
                {packageDistribution.length} gói đang hoạt động
              </p>
            </CardContent>
            <div className='absolute -bottom-4 -right-4 size-24 rounded-full bg-blue-500 opacity-5' />
          </Card>
        </div>

        {/* Revenue Chart */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <TrendingUp className='size-5 text-emerald-500' />
              Doanh thu theo tháng
            </CardTitle>
            <CardDescription>12 tháng gần nhất</CardDescription>
          </CardHeader>
          <CardContent>
            {monthlyData.length > 0 ? (
              <ResponsiveContainer width='100%' height={350}>
                <AreaChart data={monthlyData}>
                  <defs>
                    <linearGradient id='revGrad' x1='0' y1='0' x2='0' y2='1'>
                      <stop offset='5%' stopColor='#10b981' stopOpacity={0.3} />
                      <stop offset='95%' stopColor='#10b981' stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray='3 3' stroke='hsl(var(--border))' />
                  <XAxis dataKey='name' tick={{ fontSize: 12 }} stroke='hsl(var(--muted-foreground))' />
                  <YAxis tick={{ fontSize: 12 }} stroke='hsl(var(--muted-foreground))' tickFormatter={(v) => formatShortCurrency(v)} />
                  <Tooltip formatter={(value: any, name: any) => name === 'Doanh thu' ? formatCurrency(Number(value)) : value} contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))' }} />
                  <Legend />
                  <Area type='monotone' dataKey='Doanh thu' stroke='#10b981' strokeWidth={2.5} fill='url(#revGrad)' />
                  <Bar dataKey='Giao dịch' fill='#6366f1' radius={[3, 3, 0, 0]} barSize={20} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className='flex items-center justify-center h-[200px]'>
                <p className='text-sm text-muted-foreground'>Chưa có dữ liệu doanh thu.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Bottom Row: Pie Charts */}
        <div className='grid gap-4 lg:grid-cols-2'>
          {/* Package Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Phân bổ người dùng theo gói</CardTitle>
            </CardHeader>
            <CardContent className='flex items-center justify-center'>
              {packageDistribution.length > 0 ? (
                <ResponsiveContainer width='100%' height={280}>
                  <PieChart>
                    <Pie
                      data={packageDistribution}
                      cx='50%'
                      cy='50%'
                      innerRadius={65}
                      outerRadius={110}
                      paddingAngle={4}
                      dataKey='value'
                      label={({ name, percent }: any) => `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`}
                    >
                      {packageDistribution.map((_, i) => (
                        <Cell key={`pkg-${i}`} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className='text-sm text-muted-foreground py-8'>Chưa có đăng ký gói.</p>
              )}
            </CardContent>
          </Card>

          {/* Conversion + Best Selling */}
          <div className='grid gap-4'>
            <Card>
              <CardHeader>
                <CardTitle className='text-sm'>Tỷ lệ chuyển đổi Free → Trả phí</CardTitle>
              </CardHeader>
              <CardContent className='flex items-center gap-6'>
                <ResponsiveContainer width={140} height={140}>
                  <PieChart>
                    <Pie data={conversionPieData} cx='50%' cy='50%' innerRadius={40} outerRadius={65} dataKey='value' startAngle={90} endAngle={-270}>
                      {conversionPieData.map((entry, i) => <Cell key={`cv-${i}`} fill={entry.fill} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className='flex flex-col gap-2'>
                  <p className='text-3xl font-bold text-indigo-600'>{convRate?.ty_le ?? 0}%</p>
                  <div className='flex flex-col gap-1'>
                    <div className='flex items-center gap-2'>
                      <div className='size-2.5 rounded-full bg-indigo-500' />
                      <span className='text-xs text-muted-foreground'>Trả phí: {convRate?.tra_phi ?? 0}</span>
                    </div>
                    <div className='flex items-center gap-2'>
                      <div className='size-2.5 rounded-full bg-slate-200' />
                      <span className='text-xs text-muted-foreground'>Tổng: {convRate?.tong_dang_ky_hoat_dong ?? 0}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className='text-sm'>Gói bán chạy nhất</CardTitle>
              </CardHeader>
              <CardContent>
                {bestSelling.length > 0 ? (
                  <ResponsiveContainer width='100%' height={120}>
                    <BarChart data={bestSelling} layout='vertical'>
                      <CartesianGrid strokeDasharray='3 3' stroke='hsl(var(--border))' />
                      <XAxis type='number' tick={{ fontSize: 11 }} stroke='hsl(var(--muted-foreground))' />
                      <YAxis dataKey='name' type='category' width={100} tick={{ fontSize: 11 }} stroke='hsl(var(--muted-foreground))' />
                      <Tooltip formatter={(value: any, name: any) => name === 'Tổng tiền' ? formatCurrency(Number(value)) : value} contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))' }} />
                      <Bar dataKey='Giao dịch' fill='#8b5cf6' radius={[0, 4, 4, 0]} barSize={16} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className='text-sm text-muted-foreground py-4 text-center'>Chưa có dữ liệu.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </Main>
    </>
  )
}
