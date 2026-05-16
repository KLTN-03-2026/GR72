'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'
import { EmptyState, Field, Notice, Panel, StatusPill, inputClass } from '@/components/admin/admin-ui'
import { createChatSocket, type ChatSocketMessage } from '@/lib/chat-socket'
import { expertGet, expertPatch, expertPost, expertPostFormData } from '@/lib/expert-api'

type Row = Record<string, any>

function VideoIcon() {
  return <svg viewBox='0 0 24 24' aria-hidden='true' className='h-5 w-5'><path fill='currentColor' d='M4 6.5A2.5 2.5 0 0 1 6.5 4h8A2.5 2.5 0 0 1 17 6.5v1.64l2.72-1.55A1.5 1.5 0 0 1 22 7.9v8.2a1.5 1.5 0 0 1-2.28 1.31L17 15.86v1.64a2.5 2.5 0 0 1-2.5 2.5h-8A2.5 2.5 0 0 1 4 17.5v-11Zm2.5-.5A.5.5 0 0 0 6 6.5v11a.5.5 0 0 0 .5.5h8a.5.5 0 0 0 .5-.5v-11a.5.5 0 0 0-.5-.5h-8Z' /></svg>
}

function SendIcon() {
  return <svg viewBox='0 0 24 24' aria-hidden='true' className='h-5 w-5 translate-x-[1px]'><path fill='currentColor' d='M3.4 20.4 21.2 12 3.4 3.6 3 10l10 2-10 2 .4 6.4Z' /></svg>
}

function getInitials(name?: string) {
  if (!name) return '?'
  const parts = String(name).trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return '?'
  const last = parts[parts.length - 1]
  const first = parts.length > 1 ? parts[parts.length - 2] : ''
  return ((first[0] ?? '') + (last[0] ?? '')).toUpperCase() || last[0].toUpperCase()
}

function avatarGradient(seed: string) {
  const palette = [
    'from-indigo-500 to-purple-500',
    'from-sky-500 to-cyan-400',
    'from-orange-500 to-rose-500',
    'from-emerald-500 to-teal-500',
    'from-yellow-500 to-orange-500',
    'from-violet-500 to-pink-500',
  ]
  let hash = 0
  for (const c of seed) hash = (hash * 31 + c.charCodeAt(0)) & 0xffffffff
  return palette[Math.abs(hash) % palette.length]
}

function Avatar({ name, size = 'md' }: { name?: string; size?: 'sm' | 'md' | 'lg' }) {
  const cls = size === 'sm' ? 'h-8 w-8 text-xs' : size === 'lg' ? 'h-12 w-12 text-base' : 'h-10 w-10 text-sm'
  return (
    <div className={`${cls} inline-flex flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${avatarGradient(name ?? 'x')} font-bold text-white shadow-sm`}>
      {getInitials(name)}
    </div>
  )
}

function fmtTime(value: string) {
  if (!value) return ''
  return new Date(value).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
}

function resolveFileUrl(url?: string) {
  if (!url) return ''
  if (url.startsWith('http')) return url
  return url
}

function fmtDateLabel(value: string) {
  if (!value) return ''
  const d = new Date(value)
  const today = new Date()
  const yesterday = new Date(); yesterday.setDate(today.getDate() - 1)
  if (d.toDateString() === today.toDateString()) return 'Hôm nay'
  if (d.toDateString() === yesterday.toDateString()) return 'Hôm qua'
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
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
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [uploading, setUploading] = useState(false)
  const [lightbox, setLightbox] = useState<string | null>(null)

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

  async function uploadFiles(files: FileList | null) {
    if (!files || !files.length) return
    setUploading(true)
    try {
      for (const file of Array.from(files)) {
        const fd = new FormData()
        fd.append('file', file)
        if (text.trim()) fd.append('noi_dung', text.trim())
        const rows = await expertPostFormData<Row[]>(`/chats/${bookingId}/upload`, fd)
        if (rows) setMessages(rows)
      }
      setText('')
      setErrors({})
    } catch (e: any) {
      setNotice(e.message)
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  function openVideoCall() {
    if (!bookingId) return
    const url = `/call/nutrition/bookings/${bookingId}`
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className='space-y-5'>
      {notice ? <Notice tone='error'>{notice}</Notice> : null}

      {loading ? <Panel><p className='text-sm text-slate-500'>Đang tải phòng chat...</p></Panel> : (
        <div className='grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]'>
          <section className='overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-sm'>
            <div className='flex flex-col gap-3 border-b border-slate-100 bg-slate-50/80 px-5 py-4 lg:flex-row lg:items-center lg:justify-between'>
              <div className='flex min-w-0 items-center gap-3'>
                {booking && <Avatar name={booking.customer_name} size='lg' />}
                <div className='min-w-0'>
                  <Link href='/nutritionist/chats' className='text-xs font-semibold text-emerald-700 hover:text-emerald-800'>← Quay lại danh sách chat</Link>
                  <p className='mt-1 truncate text-lg font-semibold text-slate-950'>{booking ? booking.customer_name : `${messages.length} tin nhắn`}</p>
                  {booking ? <p className='mt-0.5 truncate text-xs text-slate-500'>{booking.ma_lich_hen} · {booking.ten_goi}</p> : null}
                </div>
              </div>
              <div className='flex flex-wrap items-center gap-2'>
                {booking ? <StatusPill value={booking.trang_thai} /> : null}
                <button type='button' onClick={openVideoCall} title='Bắt đầu video call' aria-label='Bắt đầu video call' className='inline-flex h-10 w-10 items-center justify-center rounded-xl border border-blue-200 bg-white text-blue-700 shadow-sm transition hover:bg-blue-50'>
                  <VideoIcon />
                </button>
              </div>
            </div>
            <div className='h-[58vh] min-h-[430px] overflow-y-auto bg-[radial-gradient(circle_at_15%_0%,#ECFDF5_0,transparent_32%),linear-gradient(180deg,#F8FAFC_0%,#FFFFFF_100%)] p-5'>
              {messages.length ? (
                <div className='flex flex-col gap-1'>
                  {messages.map((msg, idx) => {
                    const mine = msg.sender_role === 'expert'
                    const prev = idx > 0 ? messages[idx - 1] : null
                    const next = idx < messages.length - 1 ? messages[idx + 1] : null

                    const sameSenderAsPrev = prev && prev.sender_role === msg.sender_role &&
                      new Date(msg.tao_luc).getTime() - new Date(prev.tao_luc).getTime() < 5 * 60 * 1000
                    const sameSenderAsNext = next && next.sender_role === msg.sender_role &&
                      new Date(next.tao_luc).getTime() - new Date(msg.tao_luc).getTime() < 5 * 60 * 1000

                    const showHeader = !sameSenderAsPrev
                    const showAvatar = !sameSenderAsNext
                    const showDateDivider = !prev ||
                      new Date(msg.tao_luc).toDateString() !== new Date(prev.tao_luc).toDateString()

                    return (
                      <div key={msg.id}>
                        {showDateDivider && (
                          <div className='my-3 flex items-center gap-3'>
                            <div className='h-px flex-1 bg-slate-200' />
                            <span className='rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold text-slate-500'>
                              {fmtDateLabel(msg.tao_luc)}
                            </span>
                            <div className='h-px flex-1 bg-slate-200' />
                          </div>
                        )}
                        <div className={`flex items-start gap-2.5 px-1.5 ${mine ? 'justify-end' : 'justify-start'} ${showHeader ? 'mt-2.5' : 'mt-0.5'}`}>
                          {!mine && (
                            <div className={`w-9 flex-shrink-0 ${showHeader ? 'pt-[18px]' : ''}`}>
                              {showAvatar && <Avatar name={msg.sender_name} size='sm' />}
                            </div>
                          )}
                          <div className={`flex min-w-0 max-w-[68%] flex-col ${mine ? 'items-end' : 'items-start'}`}>
                            {showHeader && !mine && (
                              <span className='mb-1 ml-3 text-xs font-semibold text-slate-600'>{msg.sender_name}</span>
                            )}
                            {(() => {
                              const attachments = Array.isArray(msg.tep_dinh_kem) ? msg.tep_dinh_kem : []
                              const images = attachments.filter((a: any) => a?.type === 'image' || (a?.mime ?? '').startsWith('image/'))
                              const otherFiles = attachments.filter((a: any) => !images.includes(a))
                              const hasContent = !!msg.noi_dung
                              return (
                                <div className={`flex flex-col gap-1.5 ${mine ? 'items-end' : 'items-start'}`}>
                                  {images.map((att: any, i: number) => (
                                    <img
                                      key={i}
                                      src={resolveFileUrl(att.url)}
                                      alt={att.name ?? 'image'}
                                      onClick={() => setLightbox(resolveFileUrl(att.url))}
                                      className='max-h-80 max-w-[280px] cursor-zoom-in rounded-2xl border border-slate-200 object-cover shadow-sm'
                                    />
                                  ))}
                                  {otherFiles.map((att: any, i: number) => (
                                    <a
                                      key={i}
                                      href={resolveFileUrl(att.url)}
                                      target='_blank'
                                      rel='noopener noreferrer'
                                      className={`inline-flex items-center gap-2 rounded-2xl px-3.5 py-2 text-sm font-medium ${mine ? 'bg-white/20 text-white' : 'border border-slate-200 bg-slate-100 text-slate-800'}`}
                                    >
                                      📎 {att.name ?? 'Tệp đính kèm'}
                                    </a>
                                  ))}
                                  {hasContent && (
                                    <div
                                      className={[
                                        'inline-block px-4 py-2 text-sm leading-6 whitespace-pre-wrap break-words rounded-[20px]',
                                        mine
                                          ? 'bg-gradient-to-br from-emerald-600 to-emerald-500 text-white shadow-[0_2px_8px_rgba(16,185,129,0.22)]'
                                          : 'border border-slate-200 bg-white text-slate-800 shadow-sm',
                                        mine && sameSenderAsPrev ? 'rounded-tr-md' : '',
                                        mine && sameSenderAsNext ? 'rounded-br-md' : '',
                                        !mine && sameSenderAsPrev ? 'rounded-tl-md' : '',
                                        !mine && sameSenderAsNext ? 'rounded-bl-md' : '',
                                      ].join(' ')}
                                    >
                                      {msg.noi_dung}
                                    </div>
                                  )}
                                </div>
                              )
                            })()}
                            {showAvatar && (
                              <span className='mt-1 px-3 text-[11px] text-slate-400'>{fmtTime(msg.tao_luc)}</span>
                            )}
                          </div>
                          {mine && (
                            <div className='w-9 flex-shrink-0'>
                              {showAvatar && <Avatar name={msg.sender_name} size='sm' />}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : <EmptyState text='Chưa có tin nhắn trong booking này.' />}
              <div ref={bottomRef} />
            </div>
            <div className='border-t border-slate-100 bg-white p-4'>
              <input ref={fileInputRef} type='file' accept='image/*' multiple className='hidden' onChange={(e) => uploadFiles(e.target.files)} />
              <Field label='Nội dung tư vấn' error={errors.text}>
                <div className='relative'>
                  <textarea ref={textareaRef} className={`${inputClass} min-h-14 resize-y overflow-y-auto py-4 pl-14 pr-16 leading-6`} rows={1} value={text} onChange={(event) => { setText(event.target.value); setErrors({}) }} onInput={resizeComposer} onKeyDown={(event) => { if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') send() }} placeholder={uploading ? 'Đang tải ảnh lên...' : 'Nhập phản hồi cho khách hàng... Ctrl/Cmd + Enter để gửi nhanh'} />
                  <button
                    type='button'
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    aria-label='Đính kèm ảnh'
                    title='Đính kèm ảnh'
                    className='absolute left-3 top-1/2 inline-flex h-10 w-10 -translate-y-1/2 cursor-pointer items-center justify-center rounded-xl border border-slate-200 bg-white text-emerald-700 transition hover:bg-emerald-50 disabled:cursor-wait disabled:opacity-60'
                  >
                    <svg viewBox='0 0 24 24' className='h-5 w-5'><path fill='currentColor' d='M21 19V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z'/></svg>
                  </button>
                  <button type='button' onClick={send} disabled={sending || uploading} aria-label='Gửi tin nhắn' className='absolute right-3 top-1/2 inline-flex h-10 w-10 -translate-y-1/2 cursor-pointer items-center justify-center rounded-xl bg-[#2563EB] text-white shadow-lg shadow-blue-100 transition-colors duration-200 hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60'>
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

      {lightbox && (
        <div
          onClick={() => setLightbox(null)}
          className='fixed inset-0 z-[1000] flex cursor-zoom-out items-center justify-center bg-slate-900/85 p-6'
        >
          <button
            type='button'
            onClick={(e) => { e.stopPropagation(); setLightbox(null) }}
            aria-label='Đóng'
            className='absolute right-6 top-5 inline-flex h-10 w-10 items-center justify-center rounded-full border-none bg-white/15 text-white'
          >
            ✕
          </button>
          <img src={lightbox} alt='preview' className='max-h-[90vh] max-w-[90vw] rounded-xl' />
        </div>
      )}
    </div>
  )
}
