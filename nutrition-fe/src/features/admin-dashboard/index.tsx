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
  Apple,
  ArrowUpRight,
  Banknote,
  Bell,
  ClipboardList,
  Package,
  TrendingUp,
  UserPlus,
  Users,
} from 'lucide-react'
import { toast } from 'sonner'
import { ApiError } from '@/services/auth/api'
import { type DashboardData, getDashboard } from '@/services/admin-dashboard/api'
import { Main } from '@/components/layout/main'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PageHeading } from '@/features/nutrition/components/page-heading'
import { AdminTopbar } from '@/components/layout/admin-topbar'

const ROLE_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444']
const PIE_COLORS = ['#6366f1', '#8b5cf6', '#a78bfa', '#c4b5fd', '#ddd6fe']
const PAYMENT_STATUS_COLORS: Record<string, string> = {
  cho_thanh_toan: '#f59e0b',
  thanh_cong: '#10b981',
  that_bai: '#ef4444',
  da_hoan_tien: '#8b5cf6',
}

function formatCurrency(v: number) {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1_000) return `${(v / 1_000).toFixed(0)}K`
  return new Intl.NumberFormat('vi-VN').format(v)
}

function formatFullCurrency(v: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v)
}

function getRoleLabel(role: string) {
  switch (role) {
    case 'quan_tri': return 'Quản trị'
    case 'chuyen_gia_dinh_duong': return 'Chuyên gia'
    case 'nguoi_dung': return 'Người dùng'
    default: return role
  }
}

function getPaymentStatusLabel(s: string) {
  switch (s) {
    case 'cho_thanh_toan': return 'Chờ TT'
    case 'thanh_cong': return 'Thành công'
    case 'that_bai': return 'Thất bại'
    case 'da_hoan_tien': return 'Hoàn tiền'
    default: return s
  }
}

function formatShortDate(d: string) {
  const parts = d.split('-')
  return `${parts[2]}/${parts[1]}`
}

function StatCard({ title, value, subtext, icon: Icon, iconColor, trend }: {
  title: string; value: string | number; subtext?: string; icon: React.ElementType; iconColor: string; trend?: number
}) {
  return (
    <Card className='relative overflow-hidden'>
      <CardHeader className='flex flex-row items-center justify-between pb-2'>
        <CardTitle className='text-sm font-medium text-muted-foreground'>{title}</CardTitle>
        <div className={`rounded-lg p-2 ${iconColor}`}>
          <Icon className='size-4 text-white' />
        </div>
      </CardHeader>
      <CardContent>
        <p className='text-2xl font-bold tracking-tight'>{typeof value === 'number' ? value.toLocaleString('vi-VN') : value}</p>
        {subtext && (
          <p className='mt-1 flex items-center gap-1 text-xs text-muted-foreground'>
            {trend !== undefined && trend > 0 && <ArrowUpRight className='size-3 text-emerald-500' />}
            {subtext}
          </p>
        )}
      </CardContent>
      <div className={`absolute -bottom-4 -right-4 size-24 rounded-full opacity-5 ${iconColor}`} />
    </Card>
  )
}

export function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try { setData(await getDashboard()) }
      catch (e) { toast.error(e instanceof ApiError ? e.message : 'Lỗi tải dashboard') }
      finally { setLoading(false) }
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
            <p className='text-sm text-muted-foreground'>Đang tải dashboard...</p>
          </div>
        </Main>
      </>
    )
  }

  const roleData = (data?.phan_bo_vai_tro ?? []).map((r) => ({
    name: getRoleLabel(r.vai_tro),
    value: r.so_luong,
  }))

  const registrationData = (data?.xu_huong_dang_ky ?? []).map((r) => ({
    name: formatShortDate(r.ngay),
    'Đăng ký mới': r.so_luong,
  }))

  const revenueData = (data?.doanh_thu.xu_huong ?? []).map((r) => ({
    name: formatShortDate(r.ngay),
    'Doanh thu': r.doanh_thu,
    'Giao dịch': r.so_giao_dich,
  }))

  const packageData = (data?.goi_dich_vu.phan_bo ?? []).map((p) => ({
    name: p.ten_goi,
    value: p.so_luong,
  }))

  const paymentStatusData = (data?.thanh_toan_theo_trang_thai ?? []).map((p) => ({
    name: getPaymentStatusLabel(p.trang_thai),
    value: p.so_luong,
    fill: PAYMENT_STATUS_COLORS[p.trang_thai] ?? '#94a3b8',
  }))

  const reviewData = data?.yeu_cau_duyet ? [
    { name: 'Chờ duyệt', value: data.yeu_cau_duyet.cho_duyet, fill: '#f59e0b' },
    { name: 'Đã duyệt', value: data.yeu_cau_duyet.da_duyet, fill: '#10b981' },
    { name: 'Từ chối', value: data.yeu_cau_duyet.tu_choi, fill: '#ef4444' },
  ] : []

  return (
    <>
      <AdminTopbar />
      <Main fluid className='flex flex-1 flex-col gap-6 px-3 py-5 sm:px-4'>
        <PageHeading title='Dashboard quản trị' description='Tổng quan số liệu vận hành hệ thống NutriWise.' />

        {/* KPI Cards */}
        <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
          <StatCard title='Tổng tài khoản' value={data?.tong_tai_khoan ?? 0} subtext={`+${data?.tai_khoan_moi_7_ngay ?? 0} tuần này`} icon={Users} iconColor='bg-blue-500' trend={data?.tai_khoan_moi_7_ngay} />
          <StatCard title='Tổng doanh thu' value={formatFullCurrency(data?.doanh_thu.tong ?? 0)} subtext={`Tháng này: ${formatFullCurrency(data?.doanh_thu.thang_nay ?? 0)}`} icon={Banknote} iconColor='bg-emerald-500' trend={1} />
          <StatCard title='Gói đang hoạt động' value={data?.goi_dich_vu.dang_hoat_dong ?? 0} subtext={`${data?.goi_dich_vu.tong_goi ?? 0} gói trong hệ thống`} icon={Package} iconColor='bg-purple-500' />
          <StatCard title='Chờ duyệt' value={data?.yeu_cau_duyet.cho_duyet ?? 0} subtext={`${data?.yeu_cau_duyet.tong ?? 0} tổng yêu cầu`} icon={ClipboardList} iconColor='bg-amber-500' />
        </div>

        {/* Charts Row 1 */}
        <div className='grid gap-4 lg:grid-cols-7'>
          {/* User Registration Trend */}
          <Card className='lg:col-span-4'>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <UserPlus className='size-5 text-blue-500' />
                Xu hướng đăng ký (14 ngày)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width='100%' height={280}>
                <AreaChart data={registrationData}>
                  <defs>
                    <linearGradient id='gradBlue' x1='0' y1='0' x2='0' y2='1'>
                      <stop offset='5%' stopColor='#6366f1' stopOpacity={0.3} />
                      <stop offset='95%' stopColor='#6366f1' stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray='3 3' stroke='hsl(var(--border))' />
                  <XAxis dataKey='name' tick={{ fontSize: 12 }} stroke='hsl(var(--muted-foreground))' />
                  <YAxis tick={{ fontSize: 12 }} stroke='hsl(var(--muted-foreground))' allowDecimals={false} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))' }} />
                  <Area type='monotone' dataKey='Đăng ký mới' stroke='#6366f1' strokeWidth={2} fill='url(#gradBlue)' />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Role Distribution */}
          <Card className='lg:col-span-3'>
            <CardHeader>
              <CardTitle>Phân bổ vai trò</CardTitle>
              <CardDescription>{data?.tong_tai_khoan ?? 0} tài khoản</CardDescription>
            </CardHeader>
            <CardContent className='flex items-center justify-center'>
              <ResponsiveContainer width='100%' height={280}>
                <PieChart>
                  <Pie data={roleData} cx='50%' cy='50%' innerRadius={60} outerRadius={100} paddingAngle={4} dataKey='value' label={({ name, value }) => `${name}: ${value}`}>
                    {roleData.map((_, i) => <Cell key={`r-${i}`} fill={ROLE_COLORS[i % ROLE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 2 */}
        <div className='grid gap-4 lg:grid-cols-7'>
          {/* Revenue Trend */}
          <Card className='lg:col-span-4'>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <TrendingUp className='size-5 text-emerald-500' />
                Doanh thu 14 ngày gần nhất
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width='100%' height={280}>
                <BarChart data={revenueData}>
                  <defs>
                    <linearGradient id='gradGreen' x1='0' y1='0' x2='0' y2='1'>
                      <stop offset='5%' stopColor='#10b981' stopOpacity={0.8} />
                      <stop offset='95%' stopColor='#10b981' stopOpacity={0.3} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray='3 3' stroke='hsl(var(--border))' />
                  <XAxis dataKey='name' tick={{ fontSize: 12 }} stroke='hsl(var(--muted-foreground))' />
                  <YAxis tick={{ fontSize: 12 }} stroke='hsl(var(--muted-foreground))' tickFormatter={(v) => formatCurrency(v)} />
                  <Tooltip formatter={(value: any) => formatFullCurrency(Number(value))} contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))' }} />
                  <Bar dataKey='Doanh thu' fill='url(#gradGreen)' radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Package Distribution + Review Stats */}
          <div className='grid gap-4 lg:col-span-3'>
            <Card>
              <CardHeader>
                <CardTitle className='text-sm'>Phân bổ gói dịch vụ</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width='100%' height={120}>
                  <PieChart>
                    <Pie data={packageData} cx='50%' cy='50%' outerRadius={50} dataKey='value' label={({ name, value }) => `${name}: ${value}`}>
                      {packageData.map((_, i) => <Cell key={`p-${i}`} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className='text-sm'>Yêu cầu duyệt thực phẩm</CardTitle>
              </CardHeader>
              <CardContent>
                <div className='flex items-center gap-4'>
                  <ResponsiveContainer width={100} height={100}>
                    <PieChart>
                      <Pie data={reviewData} cx='50%' cy='50%' innerRadius={25} outerRadius={45} dataKey='value'>
                        {reviewData.map((entry, i) => <Cell key={`rv-${i}`} fill={entry.fill} />)}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className='flex flex-col gap-1.5'>
                    {reviewData.map((r) => (
                      <div key={r.name} className='flex items-center gap-2'>
                        <div className='size-2.5 rounded-full' style={{ background: r.fill }} />
                        <span className='text-xs text-muted-foreground'>{r.name}</span>
                        <span className='text-xs font-semibold'>{r.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Bottom row: secondary stats */}
        <div className='grid gap-4 sm:grid-cols-3'>
          <StatCard title='Tổng thực phẩm' value={data?.tong_thuc_pham ?? 0} icon={Apple} iconColor='bg-orange-500' />
          <StatCard title='Thông báo chưa đọc' value={data?.thong_bao.chua_doc ?? 0} subtext={`${data?.thong_bao.tong ?? 0} tổng thông báo`} icon={Bell} iconColor='bg-red-500' />
          <StatCard title='User mới (30 ngày)' value={data?.tai_khoan_moi_30_ngay ?? 0} icon={UserPlus} iconColor='bg-teal-500' trend={1} />
        </div>
      </Main>
    </>
  )
}
