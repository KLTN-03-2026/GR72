'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { CalendarRange, Coins, Landmark, Percent } from 'lucide-react'
import { toast } from 'sonner'
import { AdminTopbar } from '@/components/layout/admin-topbar'
import { Main } from '@/components/layout/main'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { PageHeading } from '@/features/nutrition/components/page-heading'
import { ApiError } from '@/services/auth/api'
import {
  type SystemRevenueData,
  getSystemRevenue,
} from '@/services/admin-reports/api'

function formatCurrency(value: number) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value)
}

function getDefaultDateRange() {
  const now = new Date()
  const end = now.toISOString().slice(0, 10)
  const start = new Date(now.getFullYear(), now.getMonth() - 5, 1)
    .toISOString()
    .slice(0, 10)
  return { start, end }
}

function KpiCard(props: {
  title: string
  value: string
  subtitle: string
  icon: React.ElementType
  iconClassName: string
}) {
  const { title, value, subtitle, icon: Icon, iconClassName } = props

  return (
    <Card>
      <CardHeader className='flex flex-row items-center justify-between pb-2'>
        <CardTitle className='text-sm font-medium text-muted-foreground'>
          {title}
        </CardTitle>
        <div className={`rounded-lg p-2 ${iconClassName}`}>
          <Icon className='size-4 text-white' />
        </div>
      </CardHeader>
      <CardContent>
        <p className='text-xl font-semibold tracking-tight'>{value}</p>
        <p className='mt-1 text-xs text-muted-foreground'>{subtitle}</p>
      </CardContent>
    </Card>
  )
}

export function AdminSystemRevenue() {
  const defaultRange = getDefaultDateRange()
  const [startDate, setStartDate] = useState(defaultRange.start)
  const [endDate, setEndDate] = useState(defaultRange.end)
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<SystemRevenueData | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const next = await getSystemRevenue({
        start_date: startDate,
        end_date: endDate,
      })
      setData(next)
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : 'Không tải được báo cáo doanh thu hệ thống')
    } finally {
      setLoading(false)
    }
  }, [startDate, endDate])

  useEffect(() => {
    void load()
  }, [load])

  const monthlyData = (data?.theo_thang ?? []).map((item) => ({
    thang: item.thang,
    'Phí đăng ký chuyên gia': item.doanh_thu_phi_dang_ky,
    'Hoa hồng booking (5%)': item.doanh_thu_hoa_hong,
    'Tổng hệ thống': item.tong_doanh_thu_he_thong,
  }))

  const overview = data?.tong_quan

  return (
    <>
      <AdminTopbar />
      <Main fluid className='flex flex-1 flex-col gap-5 px-3 py-5 sm:px-4'>
        <PageHeading
          title='Doanh thu hệ thống'
          description='Tách riêng 2 nguồn doanh thu: phí đăng ký chuyên gia và hoa hồng 5% từ booking hoàn thành.'
        />

        <div className='flex flex-wrap items-center gap-3'>
          <div className='flex items-center gap-2'>
            <CalendarRange className='size-4 text-muted-foreground' />
            <Input
              type='date'
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
              className='w-auto rounded-sm'
            />
            <span className='text-muted-foreground'>—</span>
            <Input
              type='date'
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
              className='w-auto rounded-sm'
            />
          </div>
          <Button variant='outline' size='sm' onClick={() => void load()} className='rounded-sm'>
            Lọc
          </Button>
        </div>

        {loading ? (
          <Card>
            <CardContent className='py-12 text-center text-sm text-muted-foreground'>
              Đang tải dữ liệu doanh thu hệ thống...
            </CardContent>
          </Card>
        ) : (
          <>
            <div className='grid gap-4 md:grid-cols-3'>
              <KpiCard
                title='Tổng doanh thu hệ thống'
                value={formatCurrency(overview?.tong_doanh_thu_he_thong ?? 0)}
                subtitle={`${overview?.so_luot_dang_ky_chuyen_gia_thanh_cong ?? 0} lượt đăng ký + ${overview?.so_booking_tinh_hoa_hong ?? 0} booking tính hoa hồng`}
                icon={Landmark}
                iconClassName='bg-blue-500'
              />
              <KpiCard
                title='Doanh thu phí đăng ký chuyên gia'
                value={formatCurrency(overview?.tong_phi_dang_ky_chuyen_gia ?? 0)}
                subtitle={`Mức phí hiện tại: ${formatCurrency(overview?.muc_phi_dang_ky_hien_tai ?? 0)} / lượt`}
                icon={Coins}
                iconClassName='bg-emerald-500'
              />
              <KpiCard
                title='Doanh thu hoa hồng booking 5%'
                value={formatCurrency(overview?.tong_hoa_hong_booking ?? 0)}
                subtitle={`${overview?.so_booking_tinh_hoa_hong ?? 0} booking đã ghi nhận`}
                icon={Percent}
                iconClassName='bg-amber-500'
              />
            </div>

            <Card>
              <CardHeader>
                <CardTitle>So sánh theo tháng</CardTitle>
                <CardDescription>
                  Mỗi tháng hiển thị đồng thời doanh thu phí đăng ký chuyên gia và hoa hồng booking (5%).
                </CardDescription>
              </CardHeader>
              <CardContent>
                {monthlyData.length > 0 ? (
                  <ResponsiveContainer width='100%' height={340}>
                    <BarChart data={monthlyData}>
                      <CartesianGrid strokeDasharray='3 3' stroke='hsl(var(--border))' />
                      <XAxis dataKey='thang' tick={{ fontSize: 12 }} />
                      <YAxis
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value) =>
                          value >= 1_000_000 ? `${(value / 1_000_000).toFixed(1)}M` : `${Math.round(value / 1000)}K`
                        }
                      />
                      <Tooltip
                        formatter={(value: number) => formatCurrency(Number(value))}
                        contentStyle={{
                          borderRadius: '8px',
                          border: '1px solid hsl(var(--border))',
                          background: 'hsl(var(--card))',
                        }}
                      />
                      <Legend />
                      <Bar dataKey='Phí đăng ký chuyên gia' fill='#10b981' radius={[4, 4, 0, 0]} />
                      <Bar dataKey='Hoa hồng booking (5%)' fill='#f59e0b' radius={[4, 4, 0, 0]} />
                      <Bar dataKey='Tổng hệ thống' fill='#3b82f6' radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className='py-10 text-center text-sm text-muted-foreground'>
                    Chưa có dữ liệu trong khoảng thời gian đã chọn.
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </Main>
    </>
  )
}
