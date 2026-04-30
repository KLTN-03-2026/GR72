'use client'

import { useEffect, useMemo, useState } from 'react'
import { ActionButton, EmptyState, Notice, PageHeader, Panel, StatCard, StatusPill, Toolbar, inputClass } from '@/components/admin/admin-ui'
import { DataTable, Td, Th } from '@/components/admin/admin-table'
import { expertGet, expertPatch } from '@/lib/expert-api'

type Row = Record<string, any>

export default function ExpertNotificationsPage() {
  const [rows, setRows] = useState<Row[]>([])
  const [status, setStatus] = useState('')
  const [type, setType] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [readingAll, setReadingAll] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (status) params.set('status', status)
      if (type) params.set('type', type)
      setRows(await expertGet<Row[]>(`/notifications${params.toString() ? `?${params}` : ''}`))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load().catch((err) => setMessage(err.message))
  }, [status, type])

  const stats = useMemo(() => ({
    total: rows.length,
    unread: rows.filter((row) => row.trang_thai === 'chua_doc').length,
    read: rows.filter((row) => row.trang_thai === 'da_doc').length,
  }), [rows])

  async function read(row: Row) {
    await expertPatch(`/notifications/${row.id}/read`)
    setMessage('Đã đánh dấu thông báo là đã đọc.')
    await load()
  }

  async function readAll() {
    setReadingAll(true)
    try {
      await expertPatch('/notifications/read-all')
      setMessage('Đã đánh dấu tất cả thông báo là đã đọc.')
      await load()
    } finally {
      setReadingAll(false)
    }
  }

  return (
    <>
      <PageHeader
        eyebrow='Notifications'
        title='Thông báo chuyên gia'
        description='Theo dõi booking, tin nhắn, đánh giá, hoa hồng và thông báo hồ sơ liên quan đến bạn.'
        action={<ActionButton tone='accent' onClick={readAll} disabled={readingAll}>{readingAll ? 'Đang cập nhật...' : 'Đánh dấu tất cả đã đọc'}</ActionButton>}
      />
      {message ? <Notice>{message}</Notice> : null}

      <div className='mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3'>
        <StatCard label='Thông báo trong bộ lọc' value={String(stats.total)} />
        <StatCard label='Chưa đọc' value={String(stats.unread)} tone='orange' />
        <StatCard label='Đã đọc' value={String(stats.read)} tone='green' />
      </div>

      <Panel title='Danh sách thông báo' description='Lọc theo trạng thái hoặc loại thông báo. Icon chuông trên header chỉ lấy thông báo của chính chuyên gia đang đăng nhập.'>
        <Toolbar>
          <select className={inputClass} value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value=''>Tất cả trạng thái</option>
            <option value='chua_doc'>Chưa đọc</option>
            <option value='da_doc'>Đã đọc</option>
          </select>
          <select className={inputClass} value={type} onChange={(e) => setType(e.target.value)}>
            <option value=''>Tất cả loại</option>
            {['booking', 'message', 'review', 'commission', 'profile', 'system'].map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
          <ActionButton tone='secondary' onClick={load} disabled={loading}>{loading ? 'Đang lọc...' : 'Lọc'}</ActionButton>
        </Toolbar>
        <DataTable minWidth='960px'>
          <thead><tr><Th>Tiêu đề</Th><Th>Nội dung</Th><Th>Loại</Th><Th>Trạng thái</Th><Th>Ngày</Th><Th className='text-right'>Hành động</Th></tr></thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className='transition-colors duration-200 hover:bg-emerald-50/60'>
                <Td><b>{row.tieu_de}</b></Td>
                <Td><p className='line-clamp-2 max-w-md'>{row.noi_dung}</p></Td>
                <Td>{row.loai}</Td>
                <Td><StatusPill value={row.trang_thai} /></Td>
                <Td>{String(row.tao_luc).slice(0, 16)}</Td>
                <Td className='text-right'>{row.trang_thai === 'chua_doc' ? <ActionButton tone='secondary' onClick={() => read(row)}>Đã đọc</ActionButton> : '-'}</Td>
              </tr>
            ))}
          </tbody>
        </DataTable>
        {!rows.length && !loading ? <div className='mt-4'><EmptyState text='Chưa có thông báo theo bộ lọc.' /></div> : null}
      </Panel>
    </>
  )
}
