'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { adminGet } from '@/lib/admin-api'
import { ActionButton, Notice, PageHeader, Panel, StatCard, money } from '@/components/admin/admin-ui'

type Overview = {
  revenue: number
  payments: number
  successfulPayments: number
  refundedPayments: number
  packages: number
  flaggedReviews: number
  openComplaints: number
  pendingCommission: number
}

const quickActions = [
  ['Duyệt đánh giá', '/admin/reviews', 'Kiểm tra review bị báo cáo hoặc cần ẩn.'],
  ['Đối soát thanh toán', '/admin/payments', 'Xem giao dịch, webhook và refund.'],
  ['Chốt hoa hồng', '/admin/commissions', 'Tính kỳ và xác nhận chi trả chuyên gia.'],
]

export default function AdminDashboardPage() {
  const [data, setData] = useState<Overview | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    adminGet<Overview>('/overview').then(setData).catch((err) => setError(err.message))
  }, [])

  const successRate = useMemo(() => {
    if (!data?.payments) return 0
    return Math.round((data.successfulPayments / data.payments) * 100)
  }, [data])

  return (
    <>
      <PageHeader
        eyebrow='Operations cockpit'
        title='Hôm nay hệ thống đang vận hành thế nào?'
        description='Một màn để admin nắm nhanh doanh thu, rủi ro nội dung, ticket đang mở và khoản hoa hồng cần chi trả.'
        action={<Link href='/admin/revenue'><ActionButton tone='accent'>Xem Thống kê Doanh thu</ActionButton></Link>}
      />
      {error ? <Notice tone='error'>{error}</Notice> : null}
      {!data ? <Panel><p className='text-sm text-slate-500'>Đang tải dữ liệu vận hành...</p></Panel> : (
        <div className='space-y-6'>
          <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-4'>
            <StatCard label='Doanh thu thành công' value={money(data.revenue)} caption='Tổng payment thành công' />
            <StatCard label='Hoa hồng chờ chi' value={money(data.pendingCommission)} tone='orange' caption='Cần kiểm tra trước khi payout' />
            <StatCard label='Khiếu nại đang mở' value={String(data.openComplaints)} tone={data.openComplaints ? 'red' : 'green'} caption='Ticket cần phản hồi' />
            <StatCard label='Tỷ lệ thành công' value={`${successRate}%`} tone='green' caption={`${data.successfulPayments}/${data.payments} giao dịch`} />
          </div>

          <div className='space-y-5'>
            <Panel title='Hàng đợi cần xử lý' description='Các khu vực có khả năng ảnh hưởng trực tiếp tới trải nghiệm khách hàng.'>
              <div className='grid gap-3 md:grid-cols-3'>
                <Link href='/admin/service-packages' className='rounded-2xl border border-slate-200 bg-slate-50 p-4 transition-colors duration-200 hover:border-[#2563EB] hover:bg-blue-50'>
                  <p className='text-sm font-semibold text-slate-500'>Gói dịch vụ</p>
                  <p className='mt-2 text-3xl font-semibold text-slate-950'>{data.packages}</p>
                  <p className='mt-2 text-xs text-slate-500'>Đảm bảo gói đang bán có chuyên gia phù hợp.</p>
                </Link>
                <Link href='/admin/reviews' className='rounded-2xl border border-slate-200 bg-slate-50 p-4 transition-colors duration-200 hover:border-[#F97316] hover:bg-orange-50'>
                  <p className='text-sm font-semibold text-slate-500'>Đánh giá cần xem</p>
                  <p className='mt-2 text-3xl font-semibold text-[#F97316]'>{data.flaggedReviews}</p>
                  <p className='mt-2 text-xs text-slate-500'>Ẩn nội dung vi phạm để giữ chất lượng chuyên gia.</p>
                </Link>
                <Link href='/admin/payments' className='rounded-2xl border border-slate-200 bg-slate-50 p-4 transition-colors duration-200 hover:border-red-400 hover:bg-red-50'>
                  <p className='text-sm font-semibold text-slate-500'>Hoàn tiền</p>
                  <p className='mt-2 text-3xl font-semibold text-red-600'>{data.refundedPayments}</p>
                  <p className='mt-2 text-xs text-slate-500'>Theo dõi refund để không lệch doanh thu.</p>
                </Link>
              </div>
            </Panel>

            <Panel title='Lối tắt vận hành' description='Các thao tác admin thường dùng trong ngày.'>
              <div className='space-y-3'>
                {quickActions.map(([label, href, desc]) => (
                  <Link key={href} href={href} className='block rounded-2xl border border-slate-200 p-4 transition-colors duration-200 hover:border-[#2563EB] hover:bg-blue-50'>
                    <p className='font-semibold text-slate-950'>{label}</p>
                    <p className='mt-1 text-sm leading-6 text-slate-500'>{desc}</p>
                  </Link>
                ))}
              </div>
            </Panel>
          </div>
        </div>
      )}
    </>
  )
}
