'use client'

import { useCallback, useEffect, useState } from 'react'
import { DollarSign, Calendar, TrendingUp, FileText, Wallet } from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import { ApiError } from '@/services/auth/api'
import { getNutriEarnings, type NEarningsData } from '@/services/nutritionist/api'
import { Main } from '@/components/layout/main'
import { NutritionTopbar } from '@/features/nutrition/components/topbar'
import { PageHeading } from '@/features/nutrition/components/page-heading'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export function NutritionistEarnings() {
  const [data, setData] = useState<NEarningsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [startDate, setStartDate] = useState(() => {
    const d = new Date()
    d.setDate(1)
    return d.toISOString().split('T')[0]
  })
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0])

  const loadEarnings = useCallback(async () => {
    setLoading(true)
    try {
      const result = await getNutriEarnings({ start_date: startDate, end_date: endDate })
      setData(result)
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Lỗi tải thu nhập')
    } finally {
      setLoading(false)
    }
  }, [endDate, startDate])

  useEffect(() => {
    void loadEarnings()
  }, [loadEarnings])

  function handleFilter() {
    if (!startDate || !endDate) {
      toast.error('Vui lòng chọn ngày bắt đầu và ngày kết thúc')
      return
    }
    if (startDate > endDate) {
      toast.error('Ngày bắt đầu phải nhỏ hơn ngày kết thúc')
      return
    }
    loadEarnings()
  }

  function formatCurrency(amount: number) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)
  }

  const statCards = [
    {
      title: 'Tổng doanh thu gộp',
      value: formatCurrency(data?.tong_thu_nhap_gop ?? 0),
      icon: DollarSign,
      color: 'bg-blue-500',
    },
    {
      title: 'Tổng phí hoa hồng',
      value: formatCurrency(data?.tong_phi_hoa_hong ?? 0),
      icon: TrendingUp,
      color: 'bg-amber-500',
    },
    {
      title: 'Tổng thu nhập ròng',
      value: formatCurrency(data?.tong_thu_nhap_rong ?? 0),
      icon: Wallet,
      color: 'bg-emerald-500',
    },
    {
      title: 'Số booking hoàn thành',
      value: data?.so_booking ?? 0,
      icon: Calendar,
      color: 'bg-purple-500',
    },
  ]

  return (
    <>
      <NutritionTopbar />
      <Main className='flex flex-1 flex-col gap-6'>
        <PageHeading
          title='Thu nhập'
          description='Thống kê thu nhập từ các buổi tư vấn đã hoàn thành.'
        />

        {/* Filter */}
        <Card>
          <CardHeader className='pb-4'>
            <CardTitle className='text-base'>Bộ lọc</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='flex flex-wrap items-end gap-4'>
              <div className='flex flex-col gap-1.5'>
                <Label>Từ ngày</Label>
                <Input
                  type='date'
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className='w-auto'
                />
              </div>
              <div className='flex flex-col gap-1.5'>
                <Label>Đến ngày</Label>
                <Input
                  type='date'
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className='w-auto'
                />
              </div>
              <Button onClick={handleFilter} disabled={loading}>
                Lọc
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-4'>
          {statCards.map((s) => (
            <Card key={s.title}>
              <CardHeader className='flex flex-row items-center justify-between pb-2'>
                <CardTitle className='text-sm font-medium text-muted-foreground'>{s.title}</CardTitle>
                <div className={`rounded-lg p-2 ${s.color}`}>
                  <s.icon className='size-4 text-white' />
                </div>
              </CardHeader>
              <CardContent>
                <p className='text-2xl font-bold'>{loading ? '—' : s.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Thu nhập theo tháng */}
        {data && data.thu_nhap_theo_thang.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className='text-base'>Thu nhập theo tháng</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='space-y-3'>
                {data.thu_nhap_theo_thang.map((m) => (
                  <div key={m.thang} className='flex items-center justify-between rounded-lg border p-3'>
                    <div className='flex items-center gap-3'>
                      <Calendar className='size-4 text-muted-foreground' />
                      <span className='font-medium'>Tháng {m.thang}</span>
                      <Badge variant='outline'>{m.so_booking} booking</Badge>
                    </div>
                    <div className='text-right text-sm'>
                      <p className='font-semibold text-slate-900'>
                        Gộp: {formatCurrency(m.tong_thu_nhap_gop)}
                      </p>
                      <p className='text-amber-600'>
                        Hoa hồng: {formatCurrency(m.tong_phi_hoa_hong)}
                      </p>
                      <p className='font-semibold text-emerald-600'>
                        Ròng: {formatCurrency(m.tong_thu_nhap_rong)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Chi tiết giao dịch */}
        {data && (
          <Card>
            <CardHeader className='flex flex-row items-center justify-between'>
              <CardTitle className='text-base'>Chi tiết giao dịch</CardTitle>
              {data.chi_tiet.length > 0 && (
                <Badge variant='secondary'>
                  {data.chi_tiet.length} giao dịch
                </Badge>
              )}
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className='flex items-center justify-center py-8'>
                  <div className='size-6 animate-spin rounded-full border-2 border-primary border-t-transparent' />
                </div>
              ) : data.chi_tiet.length === 0 ? (
                <div className='flex flex-col items-center justify-center py-12 text-center'>
                  <FileText className='size-12 text-muted-foreground/40' />
                  <p className='mt-3 text-sm text-muted-foreground'>
                    Không có giao dịch nào trong khoảng thời gian này.
                  </p>
                </div>
              ) : (
                <div className='overflow-x-auto'>
                  <table className='w-full text-sm'>
                    <thead>
                      <tr className='border-b'>
                        <th className='pb-2 text-left font-medium text-muted-foreground'>Mã lịch hẹn</th>
                        <th className='pb-2 text-left font-medium text-muted-foreground'>Ngày</th>
                        <th className='pb-2 text-left font-medium text-muted-foreground'>Khách hàng</th>
                        <th className='pb-2 text-left font-medium text-muted-foreground'>Gói tư vấn</th>
                        <th className='pb-2 text-right font-medium text-muted-foreground'>Giá gói</th>
                        <th className='pb-2 text-right font-medium text-muted-foreground'>Hoa hồng 5%</th>
                        <th className='pb-2 text-right font-medium text-muted-foreground'>Thu nhập ròng</th>
                        <th className='pb-2 text-center font-medium text-muted-foreground'>Thanh toán</th>
                        <th className='pb-2 text-center font-medium text-muted-foreground'>Phân bổ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.chi_tiet.map((t) => (
                        <tr key={t.booking_id} className='border-b last:border-0'>
                          <td className='py-2 font-mono text-xs'>{t.ma_lich_hen}</td>
                          <td className='py-2'>
                            {t.ngay ? format(new Date(t.ngay), 'dd/MM/yyyy', { locale: vi }) : '—'}
                          </td>
                          <td className='py-2'>{t.ten_user}</td>
                          <td className='py-2'>{t.ten_goi}</td>
                          <td className='py-2 text-right font-medium'>
                            {formatCurrency(t.gia_goi)}
                          </td>
                          <td className='py-2 text-right font-medium text-amber-600'>
                            {formatCurrency(t.phi_hoa_hong)}
                          </td>
                          <td className='py-2 text-right font-medium text-emerald-600'>
                            {formatCurrency(t.thu_nhap_rong)}
                          </td>
                          <td className='py-2 text-center'>
                            <Badge
                              variant={t.trang_thai_thanh_toan === 'thanh_cong' ? 'default' : 'secondary'}
                              className={t.trang_thai_thanh_toan === 'thanh_cong' ? 'bg-emerald-100 text-emerald-700' : ''}
                            >
                              {t.trang_thai_thanh_toan}
                            </Badge>
                          </td>
                          <td className='py-2 text-center'>
                            <Badge
                              variant='outline'
                              className={
                                t.trang_thai_phan_bo === 'da_ghi_nhan'
                                  ? 'border-emerald-200 text-emerald-700'
                                  : ''
                              }
                            >
                              {t.trang_thai_phan_bo}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </Main>
    </>
  )
}
