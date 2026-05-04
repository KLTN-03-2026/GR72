'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { ActionButton, EmptyState, Notice, PageHeader, Panel, StatCard, StatusPill } from '@/components/admin/admin-ui'
import { DataTable, Modal, Td, Th } from '@/components/admin/admin-table'
import { customerGet } from '@/lib/customer-api'

type Row = Record<string, any>

export default function CustomerMyPackagesPage() {
  const [rows, setRows] = useState<Row[]>([])
  const [detail, setDetail] = useState<Row | null>(null)
  const [history, setHistory] = useState<Row[]>([])
  const [message, setMessage] = useState('')

  useEffect(() => {
    customerGet<Row[]>('/my-packages').then(setRows).catch((error) => setMessage(error.message))
  }, [])

  const stats = useMemo(() => ({
    total: rows.length,
    active: rows.filter((row) => row.runtime_status === 'dang_hieu_luc').length,
    exhausted: rows.filter((row) => ['het_luot', 'het_han'].includes(row.runtime_status)).length,
  }), [rows])

  async function viewDetail(purchaseId: number) {
    try {
      const [pkgDetail, usageHistory] = await Promise.all([
        customerGet<Row>(`/my-packages/${purchaseId}`),
        customerGet<Row[]>(`/my-packages/${purchaseId}/usage-history`),
      ])
      setDetail(pkgDetail)
      setHistory(usageHistory)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Không tải được chi tiết gói đã mua')
    }
  }

  return (
    <>
      <PageHeader
        eyebrow='Customer workspace'
        title='02. Quản lý gói đã mua'
        description='Theo dõi hạn sử dụng, lượt còn lại và chọn gói đang hiệu lực để tiếp tục đặt lịch chuyên gia.'
        action={<Link href='/dashboard/packages'><ActionButton tone='secondary'>Mua thêm gói</ActionButton></Link>}
      />
      {message ? <Notice tone='error'>{message}</Notice> : null}
      <div className='mb-5 grid gap-3 md:grid-cols-3'>
        <StatCard label='Tổng gói đã mua' value={String(stats.total)} />
        <StatCard label='Đang hiệu lực' value={String(stats.active)} tone='green' />
        <StatCard label='Hết hạn/hết lượt' value={String(stats.exhausted)} tone='orange' />
      </div>
      <Panel title='Gói của tôi'>
        <DataTable minWidth='980px'>
          <thead>
            <tr>
              <Th>Gói</Th>
              <Th>Mã gói đã mua</Th>
              <Th>Lượt sử dụng</Th>
              <Th>Thời hạn</Th>
              <Th>Trạng thái runtime</Th>
              <Th className='text-right'>Hành động</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className='hover:bg-blue-50/40'>
                <Td><b>{row.ten_goi}</b></Td>
                <Td>{row.ma_goi_da_mua}</Td>
                <Td>{row.so_luot_con_lai}/{row.so_luot_tong}</Td>
                <Td>{row.bat_dau_luc ? String(row.bat_dau_luc).slice(0, 10) : '-'} → {row.het_han_luc ? String(row.het_han_luc).slice(0, 10) : '-'}</Td>
                <Td><StatusPill value={row.runtime_status} /></Td>
                <Td className='text-right'>
                  <div className='flex justify-end gap-2'>
                    <ActionButton tone='secondary' onClick={() => viewDetail(row.id)}>Chi tiết</ActionButton>
                    <Link href={`/dashboard/experts?packagePurchaseId=${row.id}`}>
                      <ActionButton tone='secondary'>Chọn chuyên gia</ActionButton>
                    </Link>
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </DataTable>
        {!rows.length ? <div className='mt-4'><EmptyState text='Bạn chưa có gói nào.' /></div> : null}
      </Panel>
      <Modal
        open={Boolean(detail)}
        onClose={() => { setDetail(null); setHistory([]) }}
        title={detail ? `Chi tiết gói đã mua: ${detail.ten_goi}` : 'Chi tiết gói đã mua'}
        description='Thông tin trạng thái runtime, summary sử dụng và lịch sử dùng lượt theo từng booking.'
        width='max-w-5xl'
      >
        {detail ? (
          <div className='space-y-4'>
            <div className='grid gap-3 md:grid-cols-4'>
              <StatCard label='Trạng thái runtime' value={detail.runtime_status} />
              <StatCard label='Lượt còn lại' value={`${detail.so_luot_con_lai}/${detail.so_luot_tong}`} tone='green' />
              <StatCard label='Tổng booking' value={String(detail.usage_summary?.total_booking ?? 0)} tone='slate' />
              <StatCard label='Hoàn thành / hủy' value={`${detail.usage_summary?.completed_booking ?? 0} / ${detail.usage_summary?.cancelled_booking ?? 0}`} tone='orange' />
            </div>
            <Panel title='Lịch sử sử dụng gói'>
              <DataTable minWidth='860px'>
                <thead>
                  <tr>
                    <Th>Sự kiện</Th>
                    <Th>Booking</Th>
                    <Th>Chuyên gia</Th>
                    <Th>Lượt sau thay đổi</Th>
                    <Th>Thời gian</Th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((item) => (
                    <tr key={item.id}>
                      <Td>{item.loai_su_kien}</Td>
                      <Td>{item.ma_lich_hen ?? '-'}</Td>
                      <Td>{item.expert_name ?? '-'}</Td>
                      <Td>{item.so_luot_con_lai_sau}</Td>
                      <Td>{String(item.tao_luc).slice(0, 16)}</Td>
                    </tr>
                  ))}
                </tbody>
              </DataTable>
              {!history.length ? <div className='mt-3 text-sm text-slate-500'>Chưa có lịch sử sử dụng.</div> : null}
            </Panel>
          </div>
        ) : null}
      </Modal>
    </>
  )
}
