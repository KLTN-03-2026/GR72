'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { customerGet, customerPatch } from '@/lib/customer-api'

type Row = Record<string, any>

type Summary = { total: number; unread: number; latest: Row[] }

export function UserNotificationBell() {
  const [open, setOpen] = useState(false)
  const [summary, setSummary] = useState<Summary | null>(null)

  async function load() { setSummary(await customerGet<Summary>('/notifications/summary')) }
  useEffect(() => { load().catch(() => undefined) }, [])
  async function read(id: number) { await customerPatch(`/notifications/${id}/read`); await load() }

  return <div className='relative'><button type='button' onClick={() => setOpen(!open)} className='relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm transition-colors duration-200 hover:border-indigo-600 hover:text-indigo-600' aria-label='Thông báo cá nhân'><span className='text-xl leading-none'>🔔</span>{summary?.unread ? <span className='absolute -right-1 -top-1 min-w-5 rounded-full bg-red-600 px-1.5 py-0.5 text-center text-[10px] font-bold text-white'>{summary.unread}</span> : null}</button>{open ? <div className='absolute right-0 top-12 z-30 w-[min(360px,calc(100vw-32px))] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl'><div className='border-b border-slate-100 px-4 py-3'><div className='flex items-center justify-between gap-3'><div><p className='font-semibold text-slate-950'>Thông báo</p><p className='text-xs text-slate-500'>{summary?.unread ?? 0} chưa đọc</p></div><Link href='/user/notifications' onClick={() => setOpen(false)} className='text-xs font-semibold text-indigo-600 hover:underline'>Xem tất cả</Link></div></div><div className='max-h-96 overflow-y-auto p-2'>{summary?.latest?.length ? summary.latest.map((item) => <div key={item.id} className='rounded-xl p-3 text-sm transition-colors duration-200 hover:bg-indigo-50'><div className='flex items-start justify-between gap-3'><div><p className='font-semibold text-slate-950'>{item.tieu_de}</p><p className='mt-1 line-clamp-2 text-xs leading-5 text-slate-500'>{item.noi_dung}</p></div>{item.trang_thai === 'chua_doc' ? <button type='button' onClick={() => read(item.id)} className='shrink-0 text-xs font-semibold text-indigo-600 hover:underline'>Đọc</button> : null}</div></div>) : <p className='p-4 text-center text-sm text-slate-500'>Chưa có thông báo.</p>}</div></div> : null}</div>
}
