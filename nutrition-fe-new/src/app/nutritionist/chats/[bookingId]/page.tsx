'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'
import { EmptyState, Field, Notice, Panel, StatusPill, inputClass } from '@/components/admin/admin-ui'
import { createChatSocket, type ChatSocketMessage } from '@/lib/chat-socket'
import { expertGet, expertPatch, expertPost } from '@/lib/expert-api'

type Row = Record<string, any>

function VideoIcon() {
  return <svg viewBox='0 0 24 24' aria-hidden='true' className='h-5 w-5'><path fill='currentColor' d='M4 6.5A2.5 2.5 0 0 1 6.5 4h8A2.5 2.5 0 0 1 17 6.5v1.64l2.72-1.55A1.5 1.5 0 0 1 22 7.9v8.2a1.5 1.5 0 0 1-2.28 1.31L17 15.86v1.64a2.5 2.5 0 0 1-2.5 2.5h-8A2.5 2.5 0 0 1 4 17.5v-11Zm2.5-.5A.5.5 0 0 0 6 6.5v11a.5.5 0 0 0 .5.5h8a.5.5 0 0 0 .5-.5v-11a.5.5 0 0 0-.5-.5h-8Z' /></svg>
}

function SendIcon() {
  return <svg viewBox='0 0 24 24' aria-hidden='true' className='h-5 w-5 translate-x-[1px]'><path fill='currentColor' d='M3.4 20.4 21.2 12 3.4 3.6 3 10l10 2-10 2 .4 6.4Z' /></svg>
}

export default function ExpertChatRoomPage() {
  const params = useParams<{ bookingId: string }>()
  const bookingId = Number(params.bookingId)
  const [detail, setDetail] = useState<Row | null>(null)
  const [messages, setMessages] = useState<Row[]>([])
  const [text, setText] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [notice, setNotice] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)

  function resizeComposer() {
    const textarea = textareaRef.current
    if (!textarea) return
    textarea.style.height = 'auto'
    textarea.style.height = `${Math.min(textarea.scrollHeight, 180)}px`
  }

  async function loadRoom() {
    setLoading(true)
    try {
      const [bookingDetail, chatMessages] = await Promise.all([
        expertGet<Row>(`/bookings/${bookingId}`),
        expertGet<Row[]>(`/chats/${bookingId}/messages`),
      ])
      setDetail(bookingDetail)
      setMessages(chatMessages)
      await expertPatch(`/chats/${bookingId}/read`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!bookingId) return
    loadRoom().catch((err) => setNotice(err.message))
  }, [bookingId])

  useEffect(() => {
    if (!bookingId) return

    const socket = createChatSocket()
    socket.connect()

    socket.on('connect', () => {
      socket.emit('chat:join', { bookingId }, (response: { ok?: boolean; message?: string }) => {
        if (response && response.ok === false) setNotice(response.message ?? 'Không thể kết nối phòng chat realtime.')
      })
    })

    socket.on('connect_error', () => {
      setNotice('Realtime chat đang gián đoạn. Tin nhắn vẫn gửi được, nhưng có thể cần tải lại để xem tin mới.')
    })

    socket.on('chat:message', (event: { bookingId: number; message: ChatSocketMessage }) => {
      if (Number(event.bookingId) !== bookingId) return
      setMessages((current) => {
        if (current.some((message) => Number(message.id) === Number(event.message.id))) return current
        return [...current, event.message]
      })
      expertPatch(`/chats/${bookingId}/read`).catch(() => undefined)
    })

    return () => {
      socket.emit('chat:leave', { bookingId })
      socket.disconnect()
    }
  }, [bookingId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages.length])

  useEffect(() => {
    resizeComposer()
  }, [text])

  const booking = detail?.booking
  const timelineCount = useMemo(() => detail?.timeline?.length ?? 0, [detail])

  async function send() {
    if (!text.trim()) {
      setErrors({ text: 'Vui lòng nhập nội dung tư vấn trước khi gửi.' })
      return
    }
    setSending(true)
    try {
      setMessages(await expertPost<Row[]>(`/chats/${bookingId}/messages`, { noi_dung: text.trim() }))
      setText('')
      setErrors({})
    } finally {
      setSending(false)
    }
  }

  return (
    <div className='space-y-5'>
      {notice ? <Notice tone='error'>{notice}</Notice> : null}

      {loading ? <Panel><p className='text-sm text-slate-500'>Đang tải phòng chat...</p></Panel> : (
        <div className='grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]'>
          <section className='overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-sm'>
            <div className='flex flex-col gap-3 border-b border-slate-100 bg-slate-50/80 px-5 py-4 lg:flex-row lg:items-center lg:justify-between'>
              <div className='min-w-0'>
                <Link href='/nutritionist/chats' className='text-sm font-semibold text-emerald-700 hover:text-emerald-800'>Quay lại danh sách chat</Link>
                <p className='mt-2 text-lg font-semibold text-slate-950'>{booking ? `Chat với ${booking.customer_name}` : `${messages.length} tin nhắn`}</p>
                {booking ? <p className='mt-1 text-xs text-slate-500'>{booking.ma_lich_hen} · {booking.ten_goi}</p> : null}
              </div>
              <div className='flex flex-wrap items-center gap-2'>
                {booking ? <StatusPill value={booking.trang_thai} /> : null}
                <button type='button' disabled title='Sẽ tích hợp video call sau' className='inline-flex cursor-not-allowed items-center gap-2 rounded-xl border border-blue-200 bg-white px-4 py-2.5 text-sm font-semibold text-blue-700 opacity-75 shadow-sm'>
                  <VideoIcon /> Video call
                </button>
              </div>
            </div>
            <div className='h-[58vh] min-h-[430px] space-y-4 overflow-y-auto bg-[radial-gradient(circle_at_15%_0%,#ECFDF5_0,transparent_32%),linear-gradient(180deg,#F8FAFC_0%,#FFFFFF_100%)] p-5'>
              {messages.length ? messages.map((msg) => {
                const fromExpert = msg.sender_role === 'expert'
                return <div key={msg.id} className={`flex ${fromExpert ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[82%] rounded-3xl px-4 py-3 text-sm shadow-sm ${fromExpert ? 'rounded-br-md bg-emerald-600 text-white' : 'rounded-bl-md border border-slate-200 bg-white text-slate-700'}`}><div className='flex items-center gap-2'><span className={`h-2 w-2 rounded-full ${fromExpert ? 'bg-white/80' : 'bg-emerald-500'}`} /><b>{msg.sender_name}</b></div><p className='mt-2 whitespace-pre-wrap leading-6'>{msg.noi_dung}</p><p className={`mt-2 text-[11px] ${fromExpert ? 'text-white/70' : 'text-slate-400'}`}>{String(msg.tao_luc).slice(0, 16)}</p></div></div>
              }) : <EmptyState text='Chưa có tin nhắn trong booking này.' />}
              <div ref={bottomRef} />
            </div>
            <div className='border-t border-slate-100 bg-white p-4'>
              <Field label='Nội dung tư vấn' error={errors.text}>
                <div className='relative'>
                  <textarea ref={textareaRef} className={`${inputClass} min-h-14 resize-y overflow-y-auto py-4 pr-16 leading-6`} rows={1} value={text} onChange={(event) => { setText(event.target.value); setErrors({}) }} onInput={resizeComposer} onKeyDown={(event) => { if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') send() }} placeholder='Nhập phản hồi cho khách hàng... Ctrl/Cmd + Enter để gửi nhanh' />
                  <button type='button' onClick={send} disabled={sending} aria-label='Gửi tin nhắn' className='absolute right-3 top-1/2 inline-flex h-10 w-10 -translate-y-1/2 cursor-pointer items-center justify-center rounded-xl bg-[#2563EB] text-white shadow-lg shadow-blue-100 transition-colors duration-200 hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60'>
                    <SendIcon />
                  </button>
                </div>
              </Field>
            </div>
          </section>

          <aside className='space-y-4'>
            <Panel title='Thông tin cuộc tư vấn'>
              {booking ? (
                <div className='space-y-3 text-sm'>
                  <div className='rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4'>
                    <p className='text-slate-500'>Khách hàng</p>
                    <b className='text-slate-950'>{booking.customer_name}</b>
                    <p className='mt-1 text-slate-500'>{booking.customer_email}</p>
                  </div>
                  <div className='rounded-2xl bg-slate-50 p-4'>
                    <p className='text-slate-500'>Booking</p>
                    <b>{booking.ma_lich_hen}</b>
                    <p className='mt-1 text-slate-500'>{String(booking.ngay_hen).slice(0, 10)} {booking.gio_bat_dau}</p>
                  </div>
                  <div className='rounded-2xl bg-slate-50 p-4'>
                    <p className='text-slate-500'>Gói dịch vụ</p>
                    <b>{booking.ten_goi}</b>
                    <p className='mt-1 text-slate-500'>{booking.loai_goi}</p>
                  </div>
                  <div className='rounded-2xl bg-slate-50 p-4'>
                    <p className='text-slate-500'>Mục đích tư vấn</p>
                    <p className='mt-1 leading-6 text-slate-700'>{booking.muc_dich ?? 'Khách chưa nhập mục đích tư vấn.'}</p>
                  </div>
                </div>
              ) : <EmptyState text='Không tìm thấy thông tin booking.' />}
            </Panel>
            <Panel title='Tình trạng booking'>
              <div className='grid gap-3 text-sm'><div className='flex items-center justify-between rounded-2xl border border-slate-200 p-3'><span className='text-slate-500'>Timeline</span><b>{timelineCount} sự kiện</b></div><div className='flex items-center justify-between rounded-2xl border border-slate-200 p-3'><span className='text-slate-500'>Ngày hẹn</span><b>{booking ? String(booking.ngay_hen).slice(0, 10) : '-'}</b></div><div className='flex items-center justify-between rounded-2xl border border-slate-200 p-3'><span className='text-slate-500'>Giờ bắt đầu</span><b>{booking?.gio_bat_dau ?? '-'}</b></div></div>
            </Panel>
          </aside>
        </div>
      )}
    </div>
  )
}
