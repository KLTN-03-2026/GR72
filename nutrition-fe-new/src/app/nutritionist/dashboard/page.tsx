'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { CalendarClock, CheckCircle, Star, Wallet } from 'lucide-react'
import { EmptyState, Notice, PageHeader, Panel, StatCard, StatusPill, money } from '@/components/admin/admin-ui'
import { DataTable, Td, Th } from '@/components/admin/admin-table'
import { expertGet } from '@/lib/expert-api'

type Data = Record<string, any>

export default function NutritionistDashboardPage() {
  const [data, setData] = useState<Data | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    expertGet<Data>('/dashboard').then(setData).catch((err) => setError(err.message))
  }, [])

  return (
    <>
      <PageHeader
        eyebrow='Expert cockpit'
        title='Bảng làm việc hôm nay'
        description='Nắm nhanh lịch cần xử lý, đánh giá, thông báo và hoa hồng đang chờ chi trả.'
      />
      {error ? <Notice tone='error'>{error}</Notice> : null}

      {data ? (
        <div className='space-y-5'>
          <div className='grid gap-3 sm:grid-cols-2 xl:grid-cols-4'>
            <StatCard label='Booking đang xử lý' value={String(data.booking?.active ?? 0)} tone='orange' icon={CalendarClock} />
            <StatCard label='Đã hoàn thành' value={String(data.booking?.completed ?? 0)} tone='green' icon={CheckCircle} />
            <StatCard label='Rating trung bình' value={`${Number(data.review?.avgRating ?? 0).toFixed(1)}/5`} icon={Star} />
            <StatCard label='Hoa hồng chờ chi' value={money(data.commission?.pending)} tone='orange' icon={Wallet} />
          </div>

          <Panel title='Booking sắp xử lý' description='Các lịch đã xác nhận cần chuẩn bị trước buổi tư vấn.'>
            <DataTable minWidth='900px'>
              <thead>
                <tr>
                  <Th>Mã lịch</Th>
                  <Th>Khách hàng</Th>
                  <Th>Gói</Th>
                  <Th>Ngày giờ</Th>
                  <Th>Trạng thái</Th>
                  <Th className='text-right'>Đi tới</Th>
                </tr>
              </thead>
              <tbody>
                {data.nextBookings?.map((row: Data) => (
                  <tr key={row.id} className='transition-colors duration-200 hover:bg-emerald-50/60'>
                    <Td><b>{row.ma_lich_hen}</b></Td>
                    <Td>{row.customer_name}</Td>
                    <Td>{row.ten_goi}</Td>
                    <Td>{String(row.ngay_hen).slice(0, 10)} {row.gio_bat_dau}</Td>
                    <Td><StatusPill value={row.trang_thai} /></Td>
                    <Td className='text-right'><Link className='font-semibold text-emerald-700 hover:text-emerald-800' href='/nutritionist/bookings'>Xem booking</Link></Td>
                  </tr>
                ))}
              </tbody>
            </DataTable>
            {!data.nextBookings?.length ? <div className='mt-4'><EmptyState text='Chưa có booking sắp xử lý.' /></div> : null}
          </Panel>
        </div>
      ) : (
        <Panel><p className='text-sm text-slate-500'>Đang tải dashboard...</p></Panel>
      )}
    </>
  )
}
