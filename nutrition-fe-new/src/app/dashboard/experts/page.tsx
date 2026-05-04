'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useMemo, useState } from 'react'
import { ActionButton, EmptyState, Notice, PageHeader, Panel, StatCard } from '@/components/admin/admin-ui'
import { DataTable, Modal, Td, Th } from '@/components/admin/admin-table'
import { customerGet } from '@/lib/customer-api'

type Row = Record<string, any>

function ExpertsContent() {
  const params = useSearchParams()
  const packagePurchaseId = params.get('packagePurchaseId')
  const [rows, setRows] = useState<Row[]>([])
  const [detail, setDetail] = useState<Row | null>(null)
  const [availability, setAvailability] = useState<Row | null>(null)
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!packagePurchaseId) return
    customerGet<Row[]>(`/my-packages/${packagePurchaseId}/experts`).then(setRows).catch((error) => setMessage(error.message))
  }, [packagePurchaseId])

  const stats = useMemo(() => ({
    total: rows.length,
    receiving: rows.filter((row) => row.nhan_booking).length,
  }), [rows])

  async function viewExpert(expertId: number) {
    if (!packagePurchaseId) return
    try {
      const [expertDetail, slotData] = await Promise.all([
        customerGet<Row>(`/experts/${expertId}`),
        customerGet<Row>(`/experts/${expertId}/availability?packagePurchaseId=${packagePurchaseId}&days=7`),
      ])
      setDetail(expertDetail)
      setAvailability(slotData)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Không tải được chi tiết chuyên gia')
    }
  }

  return (
    <>
      <PageHeader
        eyebrow='Customer workspace'
        title='03. Chọn chuyên gia theo gói'
        description='Chỉ hiển thị chuyên gia thuộc gói đã mua và đang sẵn sàng nhận booking.'
        action={<Link href='/dashboard/my-packages'><ActionButton tone='secondary'>Đổi gói đã mua</ActionButton></Link>}
      />
      {!packagePurchaseId ? <Notice tone='error'>Vui lòng chọn gói ở màn 02 trước khi lọc chuyên gia.</Notice> : null}
      {message ? <Notice tone='error'>{message}</Notice> : null}
      <div className='mb-5 grid gap-3 md:grid-cols-2'>
        <StatCard label='Chuyên gia trong gói' value={String(stats.total)} />
        <StatCard label='Đang nhận lịch' value={String(stats.receiving)} tone='green' />
      </div>
      <Panel title='Danh sách chuyên gia'>
        <DataTable minWidth='980px'>
          <thead>
            <tr>
              <Th>Chuyên gia</Th>
              <Th>Chuyên môn</Th>
              <Th>Đánh giá</Th>
              <Th>Booking hoàn thành</Th>
              <Th className='text-right'>Hành động</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.expert_id} className='hover:bg-blue-50/40'>
                <Td>
                  <p className='font-semibold text-slate-900'>{row.ho_ten}</p>
                  <p className='text-xs text-slate-500'>{row.email}</p>
                </Td>
                <Td>{row.chuyen_mon ?? '-'}</Td>
                <Td>{Number(row.diem_danh_gia_trung_binh ?? 0).toFixed(2)} ({row.so_luot_danh_gia ?? 0})</Td>
                <Td>{row.so_booking_hoan_thanh ?? 0}</Td>
                <Td className='text-right'>
                  <div className='flex justify-end gap-2'>
                    <ActionButton tone='secondary' onClick={() => viewExpert(row.expert_id)}>Chi tiết</ActionButton>
                    <Link href={`/dashboard/bookings?packagePurchaseId=${packagePurchaseId}&expertId=${row.expert_id}`}>
                      <ActionButton>Đặt lịch</ActionButton>
                    </Link>
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </DataTable>
        {!rows.length && packagePurchaseId ? <div className='mt-4'><EmptyState text='Chưa có chuyên gia phù hợp trong gói này.' /></div> : null}
      </Panel>
      <Modal
        open={Boolean(detail)}
        onClose={() => { setDetail(null); setAvailability(null) }}
        title={detail ? `Chi tiết chuyên gia: ${detail.ho_ten}` : 'Chi tiết chuyên gia'}
        description='Hiển thị hồ sơ chuyên môn, đánh giá và các slot gần nhất để hỗ trợ quyết định đặt lịch.'
        width='max-w-5xl'
      >
        {detail ? (
          <div className='space-y-4'>
            <div className='grid gap-3 md:grid-cols-3'>
              <StatCard label='Chuyên môn' value={detail.chuyen_mon || '-'} />
              <StatCard label='Đánh giá trung bình' value={Number(detail.diem_danh_gia_trung_binh ?? 0).toFixed(2)} tone='green' />
              <StatCard label='Booking hoàn thành' value={String(detail.so_booking_hoan_thanh ?? 0)} tone='slate' />
            </div>
            <Panel title='Hồ sơ chuyên gia'>
              <p className='text-sm text-slate-700'>{detail.mo_ta || 'Chưa có mô tả.'}</p>
              <p className='mt-2 text-sm text-slate-600'>Học vị: {detail.hoc_vi || '-'}</p>
              <p className='text-sm text-slate-600'>Kinh nghiệm: {detail.kinh_nghiem || '-'}</p>
            </Panel>
            <Panel title='Slot trống gần nhất (7 ngày)'>
              <div className='grid gap-2 md:grid-cols-2'>
                {(availability?.slots ?? []).slice(0, 8).map((slot: Row) => (
                  <div key={slot.start_at} className='rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700'>
                    <b>{slot.date}</b> {slot.start_time} - {slot.end_time}
                  </div>
                ))}
              </div>
              {!availability?.slots?.length ? <p className='text-sm text-slate-500'>Chưa có slot trống trong 7 ngày tới.</p> : null}
            </Panel>
            <Panel title='Đánh giá gần đây'>
              <DataTable minWidth='760px'>
                <thead>
                  <tr>
                    <Th>Khách hàng</Th>
                    <Th>Điểm</Th>
                    <Th>Nội dung</Th>
                    <Th>Thời gian</Th>
                  </tr>
                </thead>
                <tbody>
                  {(detail.reviews ?? []).map((review: Row) => (
                    <tr key={review.id}>
                      <Td>{review.customer_name}</Td>
                      <Td>{review.diem}</Td>
                      <Td><p className='line-clamp-2 max-w-sm'>{review.noi_dung || '-'}</p></Td>
                      <Td>{String(review.tao_luc).slice(0, 16)}</Td>
                    </tr>
                  ))}
                </tbody>
              </DataTable>
            </Panel>
          </div>
        ) : null}
      </Modal>
    </>
  )
}

export default function CustomerExpertsPage() {
  return <Suspense><ExpertsContent /></Suspense>
}
