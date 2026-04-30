'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { adminGet, adminPatch } from '@/lib/admin-api'

type NotificationRow = Record<string, any>
type NotificationSummary = {
  total: number
  unread: number
  today: number
  latest: NotificationRow[]
}

export function AdminNotificationBell() {
  const [open, setOpen] = useState(false)
  const [summary, setSummary] = useState<NotificationSummary | null>(null)
  const [error, setError] = useState('')

  async function load() {
    try {
      setSummary(await adminGet<NotificationSummary>('/notifications/summary'))
      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không tải được thông báo')
    }
  }

  useEffect(() => { load() }, [])

  async function markRead(id: number) {
    await adminPatch(`/notifications/${id}/read`)
    await load()
  }

  return (
    <div className='relative'>
      <button
        type='button'
        onClick={() => setOpen((value) => !value)}
        className='relative flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm transition-colors duration-200 hover:border-[#2563EB] hover:text-[#2563EB]'
        aria-label='Thông báo admin'
      >
        <span className='text-xl leading-none'>!</span>
        {summary?.unread ? <span className='absolute -right-1 -top-1 min-w-5 rounded-full bg-red-600 px-1.5 py-0.5 text-center text-[10px] font-bold text-white'>{summary.unread}</span> : null}
      </button>
      {open ? (
        <div className='absolute right-0 top-13 z-30 w-[min(360px,calc(100vw-32px))] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl'>
          <div className='border-b border-slate-100 px-4 py-3'>
            <div className='flex items-center justify-between gap-3'>
              <div>
                <p className='font-semibold text-slate-950'>Thông báo</p>
                <p className='text-xs text-slate-500'>{summary?.unread ?? 0} chưa đọc · {summary?.today ?? 0} hôm nay</p>
              </div>
              <Link href='/admin/notifications' onClick={() => setOpen(false)} className='text-xs font-semibold text-[#2563EB]'>Xem tất cả</Link>
            </div>
          </div>
          <div className='max-h-96 overflow-y-auto p-2'>
            {error ? <p className='p-3 text-sm font-semibold text-red-600'>{error}</p> : null}
            {summary?.latest?.length ? summary.latest.map((item) => (
              <div key={item.id} className='rounded-xl p-3 text-sm transition-colors duration-200 hover:bg-blue-50'>
                <div className='flex items-start justify-between gap-3'>
                  <div>
                    <p className='font-semibold text-slate-950'>{item.tieu_de}</p>
                    <p className='mt-1 line-clamp-2 text-xs leading-5 text-slate-500'>{item.noi_dung}</p>
                    <p className='mt-1 text-[11px] text-slate-400'>{item.receiver_name} · {String(item.tao_luc).slice(0, 16)}</p>
                  </div>
                  {item.trang_thai === 'chua_doc' ? <button type='button' onClick={() => markRead(item.id)} className='shrink-0 text-xs font-semibold text-[#2563EB]'>Đọc</button> : null}
                </div>
              </div>
            )) : <p className='p-4 text-center text-sm text-slate-500'>Chưa có thông báo.</p>}
          </div>
        </div>
      ) : null}
    </div>
  )
}
