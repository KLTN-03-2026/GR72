'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { adminGet } from '@/lib/admin-api'
import { ActionButton, Notice, PageHeader, Panel, money } from '@/components/admin/admin-ui'

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

type ExpertRow = {
  id: number
  ho_ten: string
  email: string
  chuyen_mon: string | null
  trang_thai: string
  nhan_booking: number
  diem_danh_gia_trung_binh: number
  so_luot_danh_gia: number
  so_booking_hoan_thanh: number
  booking_count: number
  package_count: number
}

export default function AdminDashboardPage() {
  const [overview, setOverview] = useState<Overview | null>(null)
  const [experts, setExperts] = useState<ExpertRow[]>([])
  const [error, setError] = useState('')
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  useEffect(() => {
    Promise.all([
      adminGet<Overview>('/overview'),
      adminGet<ExpertRow[]>('/experts'),
    ])
      .then(([overviewData, expertRows]) => {
        setOverview(overviewData)
        setExperts(expertRows)
        setLastUpdated(new Date())
      })
      .catch((err: Error) => setError(err.message))
  }, [])

  const chartRows = useMemo(() => {
    if (!overview) return []
    const successRate = overview.payments ? Math.round((overview.successfulPayments / overview.payments) * 100) : 0
    const refundRate = overview.payments ? Math.round((overview.refundedPayments / overview.payments) * 100) : 0
    return [
      {
        label: 'Thanh toán thành công',
        value: overview.successfulPayments,
        percent: successRate,
        tone: 'bg-blue-500',
        detail: `${overview.successfulPayments}/${overview.payments} giao dịch`,
      },
      {
        label: 'Hoàn tiền',
        value: overview.refundedPayments,
        percent: refundRate,
        tone: 'bg-rose-500',
        detail: `${overview.refundedPayments}/${overview.payments} giao dịch`,
      },
      {
        label: 'Khiếu nại mở',
        value: overview.openComplaints,
        percent: Math.min(100, overview.openComplaints * 8),
        tone: 'bg-orange-500',
        detail: 'Ticket cần phản hồi',
      },
      {
        label: 'Review bị báo cáo',
        value: overview.flaggedReviews,
        percent: Math.min(100, overview.flaggedReviews * 10),
        tone: 'bg-violet-500',
        detail: 'Nội dung cần duyệt',
      },
      {
        label: 'Hoa hồng chờ chi',
        value: Number((overview.pendingCommission / 1000000).toFixed(1)),
        percent: Math.min(100, Math.round((overview.pendingCommission / Math.max(overview.revenue, 1)) * 100)),
        tone: 'bg-emerald-500',
        detail: `${money(overview.pendingCommission)} đang chờ payout`,
      },
    ]
  }, [overview])

  const topExperts = useMemo(() => {
    return [...experts]
      .sort((a, b) => {
        const ratingDiff = Number(b.diem_danh_gia_trung_binh ?? 0) - Number(a.diem_danh_gia_trung_binh ?? 0)
        if (ratingDiff !== 0) return ratingDiff
        return Number(b.booking_count ?? 0) - Number(a.booking_count ?? 0)
      })
      .slice(0, 10)
  }, [experts])

  const priorityIssues = useMemo(() => {
    if (!overview) return []
    return [
      {
        issue: 'Khiếu nại mở',
        value: overview.openComplaints,
        severity: overview.openComplaints > 0 ? 'Cao' : 'Thấp',
        action: '/admin/complaints',
      },
      {
        issue: 'Review bị báo cáo',
        value: overview.flaggedReviews,
        severity: overview.flaggedReviews > 0 ? 'Trung bình' : 'Thấp',
        action: '/admin/reviews',
      },
      {
        issue: 'Giao dịch hoàn tiền',
        value: overview.refundedPayments,
        severity: overview.refundedPayments > 0 ? 'Trung bình' : 'Thấp',
        action: '/admin/payments',
      },
      {
        issue: 'Hoa hồng chờ chi',
        value: money(overview.pendingCommission),
        severity: overview.pendingCommission > 0 ? 'Trung bình' : 'Thấp',
        action: '/admin/commissions',
      },
    ]
  }, [overview])

  return (
    <>
      <PageHeader
        eyebrow='Admin dashboard'
        title='Bảng điều hành hệ thống'
        description='Màn hình tổng hợp theo dữ liệu: biểu đồ vận hành, bảng xếp hạng chuyên gia và danh sách ưu tiên xử lý.'
        action={<Link href='/admin/revenue'><ActionButton tone='accent'>Xem báo cáo doanh thu</ActionButton></Link>}
      />
      {error ? <Notice tone='error'>{error}</Notice> : null}

      {!overview ? (
        <Panel><p className='text-sm text-slate-500'>Đang tải dữ liệu dashboard...</p></Panel>
      ) : (
        <div className='space-y-5'>
          <Panel
            title='Biểu đồ vận hành hôm nay'
            description='Các chỉ số trọng yếu để nhìn nhanh chất lượng hoạt động toàn hệ thống.'
            action={<span className='text-xs font-semibold text-slate-500'>Cập nhật lúc {lastUpdated ? lastUpdated.toLocaleTimeString('vi-VN') : '--:--:--'}</span>}
          >
            <div className='space-y-4'>
              {chartRows.map((row) => (
                <div key={row.label} className='space-y-1.5'>
                  <div className='flex items-center justify-between gap-3 text-sm'>
                    <p className='font-semibold text-slate-700'>{row.label}</p>
                    <p className='font-semibold text-slate-950'>{row.value}</p>
                  </div>
                  <div className='h-2.5 overflow-hidden rounded-full bg-slate-100'>
                    <div className={`${row.tone} h-full rounded-full`} style={{ width: `${Math.max(6, row.percent)}%` }} />
                  </div>
                  <p className='text-xs text-slate-500'>{row.detail}</p>
                </div>
              ))}
            </div>
          </Panel>

          <div className='grid gap-5 xl:grid-cols-[1.35fr_1fr]'>
            <Panel title='Bảng xếp hạng chuyên gia' description='Sắp xếp theo rating trung bình, ưu tiên chuyên gia có hiệu suất booking tốt.'>
              <div className='overflow-x-auto'>
                <table className='min-w-full text-sm'>
                  <thead>
                    <tr className='border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500'>
                      <th className='px-3 py-2'>#</th>
                      <th className='px-3 py-2'>Chuyên gia</th>
                      <th className='px-3 py-2'>Chuyên môn</th>
                      <th className='px-3 py-2'>Rating</th>
                      <th className='px-3 py-2'>Bookings</th>
                      <th className='px-3 py-2'>Gói</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topExperts.map((row, index) => (
                      <tr key={row.id} className='border-b border-slate-100 hover:bg-slate-50'>
                        <td className='px-3 py-3 font-semibold text-slate-700'>{index + 1}</td>
                        <td className='px-3 py-3'>
                          <p className='font-semibold text-slate-900'>{row.ho_ten}</p>
                          <p className='text-xs text-slate-500'>{row.email}</p>
                        </td>
                        <td className='px-3 py-3 text-slate-700'>{row.chuyen_mon ?? '-'}</td>
                        <td className='px-3 py-3 font-semibold text-slate-900'>{Number(row.diem_danh_gia_trung_binh ?? 0).toFixed(1)} <span className='text-xs text-slate-500'>({row.so_luot_danh_gia ?? 0})</span></td>
                        <td className='px-3 py-3 text-slate-700'>{row.booking_count ?? 0}</td>
                        <td className='px-3 py-3 text-slate-700'>{row.package_count ?? 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className='mt-4 flex justify-end'>
                <Link href='/admin/experts'><ActionButton tone='secondary'>Xem toàn bộ chuyên gia</ActionButton></Link>
              </div>
            </Panel>

            <Panel title='Bảng ưu tiên xử lý' description='Các khu vực admin cần xử lý theo mức ảnh hưởng hiện tại.'>
              <div className='overflow-x-auto'>
                <table className='min-w-full text-sm'>
                  <thead>
                    <tr className='border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500'>
                      <th className='px-3 py-2'>Hạng mục</th>
                      <th className='px-3 py-2'>Giá trị</th>
                      <th className='px-3 py-2'>Mức độ</th>
                      <th className='px-3 py-2 text-right'>Đi đến</th>
                    </tr>
                  </thead>
                  <tbody>
                    {priorityIssues.map((row) => (
                      <tr key={row.issue} className='border-b border-slate-100 hover:bg-slate-50'>
                        <td className='px-3 py-3 font-semibold text-slate-900'>{row.issue}</td>
                        <td className='px-3 py-3 text-slate-700'>{row.value}</td>
                        <td className='px-3 py-3 text-slate-700'>{row.severity}</td>
                        <td className='px-3 py-3 text-right'>
                          <Link href={row.action} className='text-xs font-semibold text-[#2563EB] hover:underline'>Mở</Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>
          </div>
        </div>
      )}
    </>
  )
}

