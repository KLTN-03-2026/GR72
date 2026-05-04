'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { ActionButton, EmptyState, Notice, PageHeader, Panel, StatCard, StatusPill, money } from '@/components/admin/admin-ui'
import { DataTable, Modal, Td, Th } from '@/components/admin/admin-table'
import { customerGet, customerPost } from '@/lib/customer-api'

type Row = Record<string, any>

export default function CustomerPackagesPage() {
  const [rows, setRows] = useState<Row[]>([])
  const [detail, setDetail] = useState<Row | null>(null)
  const [message, setMessage] = useState('')

  async function load() {
    setRows(await customerGet<Row[]>('/service-packages'))
  }

  useEffect(() => {
    load().catch((error) => setMessage(error.message))
  }, [])

  async function buy(packageId: number) {
    try {
      const result = await customerPost<Row>('/package-purchases', { goi_dich_vu_id: packageId })
      setMessage('Tạo đơn mua gói thành công. Bạn có thể thanh toán ngay trong tab mới hoặc theo dõi ở mục thanh toán.')
      if (result.payment_url) window.open(result.payment_url, '_blank', 'noopener,noreferrer')
      await load()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Mua gói thất bại')
    }
  }

  async function viewDetail(packageId: number) {
    try {
      setDetail(await customerGet<Row>(`/service-packages/${packageId}`))
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Không tải được chi tiết gói')
    }
  }

  const stats = useMemo(() => ({
    total: rows.length,
    experts: rows.reduce((total, row) => total + Number(row.so_chuyen_gia ?? 0), 0),
  }), [rows])

  return (
    <>
      <PageHeader
        eyebrow='Customer workspace'
        title='01. Xem và mua gói dịch vụ'
        description='Danh sách gói đang mở bán. Mỗi giao dịch mua sẽ tạo payment URL để xử lý qua cổng thanh toán.'
        action={<Link href='/dashboard/my-packages'><ActionButton tone='secondary'>Đi tới gói của tôi</ActionButton></Link>}
      />
      {message ? <Notice>{message}</Notice> : null}
      <div className='mb-5 grid gap-3 md:grid-cols-3'>
        <StatCard label='Gói đang bán' value={String(stats.total)} />
        <StatCard label='Tổng chuyên gia khả dụng' value={String(stats.experts)} tone='green' />
        <StatCard label='Luồng tiếp theo' value='02. Gói của tôi' tone='slate' />
      </div>
      <Panel title='Danh sách gói dịch vụ'>
        <DataTable minWidth='980px'>
          <thead>
            <tr>
              <Th>Gói</Th>
              <Th>Loại</Th>
              <Th>Thời hạn / lượt</Th>
              <Th>Giá</Th>
              <Th>Trạng thái</Th>
              <Th className='text-right'>Hành động</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className='hover:bg-blue-50/40'>
                <Td>
                  <p className='font-semibold text-slate-900'>{row.ten_goi}</p>
                  {row.thumbnail_url ? <img src={row.thumbnail_url} alt={row.ten_goi} className='mt-2 h-14 w-24 rounded-lg border border-slate-200 object-cover' /> : null}
                  <p className='line-clamp-2 max-w-sm text-xs text-slate-500'>{row.mo_ta}</p>
                </Td>
                <Td>{row.loai_goi}</Td>
                <Td>{row.thoi_han_ngay} ngày / {row.so_luot_tu_van} lượt</Td>
                <Td>
                  <b>{money(row.gia_khuyen_mai ?? row.gia)}</b>
                  {row.gia_khuyen_mai ? <p className='text-xs text-slate-500 line-through'>{money(row.gia)}</p> : null}
                </Td>
                <Td><StatusPill value='dang_ban' /></Td>
                <Td className='text-right'>
                  <div className='flex justify-end gap-2'>
                    <ActionButton tone='secondary' onClick={() => viewDetail(row.id)}>Chi tiết</ActionButton>
                    <ActionButton onClick={() => buy(row.id)}>Mua gói</ActionButton>
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </DataTable>
        {!rows.length ? <div className='mt-4'><EmptyState text='Hiện chưa có gói đang bán.' /></div> : null}
      </Panel>
      <Modal
        open={Boolean(detail)}
        onClose={() => setDetail(null)}
        title={detail ? `Chi tiết gói: ${detail.ten_goi}` : 'Chi tiết gói'}
        description='Thông tin quyền lợi, thời hạn, chuyên gia thuộc gói để khách hàng cân nhắc trước khi mua.'
        width='max-w-5xl'
      >
        {detail ? (
          <div className='space-y-4'>
            {detail.banner_url || detail.thumbnail_url ? (
              <div className='overflow-hidden rounded-xl border border-slate-200'>
                <img src={detail.banner_url ?? detail.thumbnail_url} alt={detail.ten_goi} className='h-44 w-full object-cover' />
              </div>
            ) : null}
            <div className='grid gap-3 md:grid-cols-3'>
              <StatCard label='Loại gói' value={detail.loai_goi} />
              <StatCard label='Giá hiện tại' value={money(detail.gia_khuyen_mai ?? detail.gia)} tone='green' />
              <StatCard label='Thời hạn / lượt' value={`${detail.thoi_han_ngay} ngày / ${detail.so_luot_tu_van} lượt`} tone='slate' />
            </div>
            <Panel title='Mô tả'>{detail.mo_ta ? <p className='text-sm text-slate-700'>{detail.mo_ta}</p> : <p className='text-sm text-slate-500'>Chưa có mô tả chi tiết.</p>}</Panel>
            <Panel title='Quyền lợi'>
              <ul className='grid gap-2 text-sm text-slate-700'>
                {(Array.isArray(detail.quyen_loi) ? detail.quyen_loi : []).map((item: string, idx: number) => (
                  <li key={`${item}-${idx}`} className='rounded-lg border border-slate-200 bg-slate-50 px-3 py-2'>{item}</li>
                ))}
              </ul>
            </Panel>
            <Panel title='Chuyên gia thuộc gói'>
              <DataTable minWidth='760px'>
                <thead>
                  <tr>
                    <Th>Chuyên gia</Th>
                    <Th>Chuyên môn</Th>
                    <Th>Đánh giá</Th>
                    <Th>Booking hoàn thành</Th>
                  </tr>
                </thead>
                <tbody>
                  {(detail.experts ?? []).map((expert: Row) => (
                    <tr key={expert.chuyen_gia_id}>
                      <Td>
                        <p className='font-semibold text-slate-900'>{expert.ho_ten}</p>
                        <p className='text-xs text-slate-500'>{expert.email}</p>
                      </Td>
                      <Td>{expert.chuyen_mon ?? '-'}</Td>
                      <Td>{Number(expert.diem_danh_gia_trung_binh ?? 0).toFixed(2)} ({expert.so_luot_danh_gia ?? 0})</Td>
                      <Td>{expert.so_booking_hoan_thanh ?? 0}</Td>
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
