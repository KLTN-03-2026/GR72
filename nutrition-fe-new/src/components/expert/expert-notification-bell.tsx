'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { expertGet, expertPatch } from '@/lib/expert-api'

type Row = Record<string, any>

type Summary = { total: number; unread: number; latest: Row[] }

export function ExpertNotificationBell() {
  const [open, setOpen] = useState(false)
  const [summary, setSummary] = useState<Summary | null>(null)

  async function load() { setSummary(await expertGet<Summary>('/notifications/summary')) }
  useEffect(() => { load().catch(() => undefined) }, [])
  async function read(id: number) { await expertPatch(`/notifications/${id}/read`); await load() }

  return <div className='relative'><button type='button' onClick={() => setOpen(!open)} className='relative flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm hover:border-emerald-600 hover:text-emerald-700' aria-label='Thông báo chuyên gia'><span className='text-xl leading-none'>!</span>{summary?.unread ? <span className='absolute -right-1 -top-1 min-w-5 rounded-full bg-red-600 px-1.5 py-0.5 text-[10px] font-bold text-white'>{summary.unread}</span> : null}</button>{open ? <div className='absolute right-0 top-13 z-30 w-[min(360px,calc(100vw-32px))] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl'><div className='border-b border-slate-100 px-4 py-3'><div className='flex items-center justify-between'><div><p className='font-semibold text-slate-950'>Thông báo</p><p className='text-xs text-slate-500'>{summary?.unread ?? 0} chưa đọc</p></div><Link href='/nutritionist/notifications' onClick={() => setOpen(false)} className='text-xs font-semibold text-emerald-700'>Xem tất cả</Link></div></div><div className='max-h-96 overflow-y-auto p-2'>{summary?.latest?.length ? summary.latest.map((item) => <div key={item.id} className='rounded-xl p-3 text-sm hover:bg-emerald-50'><div className='flex items-start justify-between gap-3'><div><p className='font-semibold text-slate-950'>{item.tieu_de}</p><p className='mt-1 line-clamp-2 text-xs leading-5 text-slate-500'>{item.noi_dung}</p></div>{item.trang_thai === 'chua_doc' ? <button type='button' onClick={() => read(item.id)} className='text-xs font-semibold text-emerald-700'>Đọc</button> : null}</div></div>) : <p className='p-4 text-center text-sm text-slate-500'>Chưa có thông báo.</p>}</div></div> : null}</div>
}
