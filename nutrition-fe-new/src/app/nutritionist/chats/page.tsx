'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { ActionButton, EmptyState, Notice, PageHeader, Panel, StatCard, StatusPill, Toolbar, inputClass } from '@/components/admin/admin-ui'
import { DataTable, Td, Th } from '@/components/admin/admin-table'
import { expertGet } from '@/lib/expert-api'

type Row = Record<string, any>

export default function ExpertChatsPage() {
  const [chats, setChats] = useState<Row[]>([])
  const [query, setQuery] = useState('')
  const [notice, setNotice] = useState('')
  const [loading, setLoading] = useState(false)

  async function loadChats() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (query) params.set('search', query)
      setChats(await expertGet<Row[]>(`/chats${params.toString() ? `?${params}` : ''}`))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadChats().catch((err) => setNotice(err.message))
  }, [])

  const stats = useMemo(() => ({
    total: chats.length,
    unread: chats.reduce((sum, chat) => sum + Number(chat.unread ?? 0), 0),
    active: chats.filter((chat) => chat.trang_thai !== 'hoan_thanh').length,
  }), [chats])

  return (
    <>
      <PageHeader
        eyebrow='Consultation chat'
        title='Trung tâm chat tư vấn'
        description='Quản lý toàn bộ cuộc trò chuyện theo booking. Mỗi cuộc chat mở ở một trang riêng để dễ tư vấn, theo dõi lịch sử và chuẩn bị call/video sau này.'
      />
      {notice ? <Notice>{notice}</Notice> : null}

      <div className='mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3'>
        <StatCard label='Cuộc chat trong bộ lọc' value={String(stats.total)} />
        <StatCard label='Tin chưa đọc' value={String(stats.unread)} tone='orange' />
        <StatCard label='Booking đang mở' value={String(stats.active)} tone='green' />
      </div>

      <Panel title='Danh sách cuộc chat' description='Dùng bảng để xử lý nhiều khách. Bấm mở để vào phòng chat riêng của từng booking.'>
        <Toolbar>
          <input className={inputClass} placeholder='Tìm khách hàng, mã lịch, gói' value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') loadChats() }} />
          <ActionButton tone='secondary' onClick={loadChats} disabled={loading}>{loading ? 'Đang lọc...' : 'Lọc'}</ActionButton>
        </Toolbar>
        <DataTable minWidth='980px'>
          <thead>
            <tr>
              <Th>Booking</Th>
              <Th>Khách hàng</Th>
              <Th>Gói</Th>
              <Th>Trạng thái</Th>
              <Th>Chưa đọc</Th>
              <Th>Tin cuối</Th>
              <Th className='text-right'>Hành động</Th>
            </tr>
          </thead>
          <tbody>
            {chats.map((chat) => (
              <tr key={chat.booking_id} className='transition-colors duration-200 hover:bg-emerald-50/60'>
                <Td><b>{chat.ma_lich_hen}</b></Td>
                <Td>{chat.customer_name}<p className='text-xs text-slate-500'>{chat.customer_email ?? '-'}</p></Td>
                <Td>{chat.ten_goi}</Td>
                <Td><StatusPill value={chat.trang_thai} /></Td>
                <Td><span className='font-mono font-semibold text-[#F97316]'>{Number(chat.unread ?? 0)}</span></Td>
                <Td>{chat.last_message_at ? String(chat.last_message_at).slice(0, 16) : '-'}</Td>
                <Td className='text-right'>
                  <Link href={`/nutritionist/chats/${chat.booking_id}`} className='inline-flex rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 shadow-sm transition-colors duration-200 hover:border-emerald-600 hover:text-emerald-700'>
                    Mở phòng chat
                  </Link>
                </Td>
              </tr>
            ))}
          </tbody>
        </DataTable>
        {!chats.length && !loading ? <div className='mt-4'><EmptyState text='Chưa có cuộc chat.' /></div> : null}
      </Panel>
    </>
  )
}
