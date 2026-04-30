'use client'

import { useEffect, useState } from 'react'
import { ActionButton, EmptyState, Field, Notice, PageHeader, Panel, StatCard, StatusPill, Toolbar, inputClass, money } from '@/components/admin/admin-ui'
import { DataTable, Td, Th } from '@/components/admin/admin-table'
import { expertGet } from '@/lib/expert-api'

type Row = Record<string, any>

export default function EarningsPage() {
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7))
  const [data, setData] = useState<Row | null>(null)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [exporting, setExporting] = useState(false)

  async function load() {
    setLoading(true)
    try {
      setData(await expertGet<Row>(`/earnings?month=${month}`))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load().catch((err) => setMessage(err.message))
  }, [])

  async function exportFile() {
    if (!data?.period?.id) {
      setMessage('Tháng này chưa có kỳ hoa hồng để export sao kê.')
      return
    }
    setExporting(true)
    try {
      const result = await expertGet<Row>(`/earnings/${data.period.id}/export`)
      setMessage(`Đã tạo file sao kê: ${result.file_url}`)
    } finally {
      setExporting(false)
    }
  }

  return (
    <>
      <PageHeader
        eyebrow='Earnings'
        title='Thu nhập và hoa hồng'
        description='Theo dõi booking hoàn thành, doanh thu hợp lệ, hoa hồng và trạng thái chi trả theo tháng.'
        action={<ActionButton tone='accent' onClick={exportFile} disabled={exporting}>{exporting ? 'Đang export...' : 'Export sao kê'}</ActionButton>}
      />
      {message ? <Notice>{message}</Notice> : null}

      <Panel title='Bộ lọc kỳ hoa hồng' description='Chọn tháng để xem dòng booking được tính hoa hồng.'>
        <Toolbar>
          <Field label='Tháng'>
            <input type='month' className={inputClass} value={month} onChange={(e) => setMonth(e.target.value)} />
          </Field>
          <ActionButton tone='secondary' onClick={load} disabled={loading}>{loading ? 'Đang lọc...' : 'Lọc tháng'}</ActionButton>
        </Toolbar>
      </Panel>

      {data ? (
        <div className='mt-5 space-y-5'>
          <div className='grid gap-3 sm:grid-cols-2 xl:grid-cols-4'>
            <StatCard label='Booking tính hoa hồng' value={String(data.summary?.bookings ?? 0)} />
            <StatCard label='Doanh thu hợp lệ' value={money(data.summary?.revenue)} tone='green' />
            <StatCard label='Hoa hồng' value={money(data.summary?.commission)} tone='orange' />
            <StatCard label='Trạng thái kỳ' value={data.period?.trang_thai ?? 'Chưa có kỳ'} tone='slate' />
          </div>

          <Panel title='Chi tiết booking tính hoa hồng' description='Dữ liệu này là cơ sở để admin chốt và chi trả hoa hồng theo tháng.'>
            <DataTable minWidth='940px'>
              <thead><tr><Th>Booking</Th><Th>Gói</Th><Th>Ngày</Th><Th>Doanh thu</Th><Th>Tỷ lệ</Th><Th>Hoa hồng</Th><Th>Trạng thái</Th></tr></thead>
              <tbody>
                {data.lines?.map((row: Row) => (
                  <tr key={row.id} className='transition-colors duration-200 hover:bg-emerald-50/60'>
                    <Td><b>{row.ma_lich_hen}</b></Td>
                    <Td>{row.ten_goi}</Td>
                    <Td>{String(row.ngay_hen).slice(0, 10)}</Td>
                    <Td>{money(row.doanh_thu_hop_le)}</Td>
                    <Td>{row.ty_le_hoa_hong}%</Td>
                    <Td><b>{money(row.so_tien_hoa_hong)}</b></Td>
                    <Td><StatusPill value={row.trang_thai} /></Td>
                  </tr>
                ))}
              </tbody>
            </DataTable>
            {!data.lines?.length ? <div className='mt-4'><EmptyState text='Chưa có booking tính hoa hồng trong tháng này.' /></div> : null}
          </Panel>
        </div>
      ) : loading ? (
        <Panel><p className='text-sm text-slate-500'>Đang tải dữ liệu hoa hồng...</p></Panel>
      ) : null}
    </>
  )
}
