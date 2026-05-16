'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Image as ImageIcon, MessageCircle, Paperclip, Search, Send, Video, X } from 'lucide-react'
import { Card, SectionHeader, UserButton, UserEmptyState, UserNotice, userInputClass } from '@/components/user/user-ui'
import { createChatSocket, type ChatSocketMessage } from '@/lib/chat-socket'
import { customerGet, customerPatch, customerPost, customerPostFormData } from '@/lib/customer-api'
import { statusLabel } from '@/lib/i18n'

type Row = Record<string, any>

function fmt(value: string) {
  if (!value) return '—'
  return new Date(value).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })
}

function fmtTime(value: string) {
  if (!value) return ''
  return new Date(value).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
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

function getInitials(name?: string) {
  if (!name) return '?'
  const parts = String(name).trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return '?'
  const last = parts[parts.length - 1]
  const first = parts.length > 1 ? parts[parts.length - 2] : ''
  return ((first[0] ?? '') + (last[0] ?? '')).toUpperCase() || last[0].toUpperCase()
}

function avatarColor(seed: string) {
  const palette = [
    'linear-gradient(135deg,#6366f1,#a855f7)',
    'linear-gradient(135deg,#0ea5e9,#22d3ee)',
    'linear-gradient(135deg,#f97316,#f43f5e)',
    'linear-gradient(135deg,#10b981,#14b8a6)',
    'linear-gradient(135deg,#eab308,#f97316)',
    'linear-gradient(135deg,#8b5cf6,#ec4899)',
  ]
  let hash = 0
  for (const c of seed) hash = (hash * 31 + c.charCodeAt(0)) & 0xffffffff
  return palette[Math.abs(hash) % palette.length]
}

function resolveFileUrl(url?: string) {
  if (!url) return ''
  if (url.startsWith('http')) return url
  return url
}

function Avatar({ name, size = 36 }: { name?: string; size?: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: avatarColor(name ?? 'x'),
        color: 'white',
        fontSize: size * 0.4,
        fontWeight: 700,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        boxShadow: '0 2px 6px rgba(15,23,42,0.12)',
        letterSpacing: 0.3,
      }}
    >
      {getInitials(name)}
    </div>
  )
}

export default function UserChatsPage() {
  const [chats, setChats] = useState<Row[]>([])
  const [activeBookingId, setActiveBookingId] = useState<number | null>(null)
  const [messages, setMessages] = useState<Row[]>([])
  const [text, setText] = useState('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [notice, setNotice] = useState('')
  const [uploading, setUploading] = useState(false)
  const [lightbox, setLightbox] = useState<string | null>(null)
  const socketRef = useRef<ReturnType<typeof createChatSocket> | null>(null)
  const activeBookingRef = useRef<number | null>(null)
  const bottomRef = useRef<HTMLDivElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  async function loadChats(keyword?: string) {
    const query = new URLSearchParams()
    if ((keyword ?? search).trim()) query.set('search', (keyword ?? search).trim())
    const rows = await customerGet<Row[]>(`/chats${query.toString() ? `?${query}` : ''}`)
    setChats(rows)
    if (!activeBookingId && rows.length) setActiveBookingId(Number(rows[0].booking_id))
  }

  async function openChat(bookingId: number) {
    setActiveBookingId(bookingId)
    setMessages(await customerGet<Row[]>(`/chats/${bookingId}/messages`))
    await customerPatch(`/chats/${bookingId}/read`, {})
  }

  useEffect(() => {
    setLoading(true)
    loadChats().catch((e) => setNotice(e.message)).finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!activeBookingId) return
    openChat(activeBookingId).catch((e) => setNotice(e.message))
  }, [activeBookingId])

  useEffect(() => {
    activeBookingRef.current = activeBookingId
  }, [activeBookingId])

  useEffect(() => {
    const socket = createChatSocket()
    socketRef.current = socket
    socket.connect()

    socket.on('connect_error', () => {
      setNotice('Kết nối realtime đang gián đoạn. Bạn vẫn có thể gửi qua API, nhưng cần tải lại để đồng bộ.')
    })

    const handleMessage = (event: { bookingId: number; message: ChatSocketMessage }) => {
      const currentActiveBookingId = activeBookingRef.current
      setChats((current) => {
        const next = [...current]
        const idx = next.findIndex((item) => Number(item.booking_id) === Number(event.bookingId))
        if (idx >= 0) {
          const item = { ...next[idx] }
          item.last_message_at = event.message.tao_luc
          if (Number(currentActiveBookingId) !== Number(event.bookingId)) item.unread = Number(item.unread ?? 0) + 1
          next.splice(idx, 1)
          next.unshift(item)
        }
        return next
      })

      if (Number(currentActiveBookingId) === Number(event.bookingId)) {
        setMessages((current) => {
          if (current.some((m) => Number(m.id) === Number(event.message.id))) return current
          return [...current, event.message]
        })
        customerPatch(`/chats/${event.bookingId}/read`, {}).catch(() => undefined)
      }
    }

    const handleRead = (event: { bookingId: number }) => {
      setChats((current) => current.map((item) => Number(item.booking_id) === Number(event.bookingId) ? { ...item, unread: 0 } : item))
    }

    socket.on('chat:message', handleMessage)
    socket.on('chat:message_created', handleMessage)
    socket.on('chat:read', handleRead)
    socket.on('chat:read_updated', handleRead)

    return () => {
      socket.disconnect()
      socketRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!socketRef.current || !activeBookingId) return
    socketRef.current.emit('chat:join', { bookingId: activeBookingId }, (response: { ok?: boolean; message?: string }) => {
      if (response?.ok === false) setNotice(response.message ?? 'Không thể tham gia phòng chat.')
    })
    return () => {
      socketRef.current?.emit('chat:leave', { bookingId: activeBookingId })
    }
  }, [activeBookingId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages.length])

  async function send() {
    if (!activeBookingId) return
    const content = text.trim()
    if (!content) return
    setSending(true)
    try {
      setMessages(await customerPost<Row[]>(`/chats/${activeBookingId}/messages`, { noi_dung: content }))
      setText('')
      await customerPatch(`/chats/${activeBookingId}/read`, {})
      await loadChats()
    } catch (e: any) {
      setNotice(e.message)
    } finally {
      setSending(false)
    }
  }

  async function uploadFiles(files: FileList | null) {
    if (!activeBookingId || !files || !files.length) return
    setUploading(true)
    try {
      for (const file of Array.from(files)) {
        const fd = new FormData()
        fd.append('file', file)
        if (text.trim()) fd.append('noi_dung', text.trim())
        const rows = await customerPostFormData<Row[]>(`/chats/${activeBookingId}/upload`, fd)
        if (rows) setMessages(rows)
      }
      setText('')
      await customerPatch(`/chats/${activeBookingId}/read`, {})
      await loadChats()
    } catch (e: any) {
      setNotice(e.message)
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  function openVideoCall() {
    if (!activeBookingId) return
    const url = `/call/nutrition/bookings/${activeBookingId}`
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  const activeChat = useMemo(
    () => chats.find((item) => Number(item.booking_id) === Number(activeBookingId)) ?? null,
    [chats, activeBookingId],
  )

  return (
    <>
      <SectionHeader title='Chat tư vấn realtime' subtitle='Trao đổi với chuyên gia trong phạm vi booking hợp lệ. Booking bị hủy/vô hiệu sẽ không cho gửi mới.' />
      {notice ? <UserNotice tone='warning'>{notice}</UserNotice> : null}

      {loading ? <div style={{ textAlign: 'center', padding: 48, color: '#94a3b8' }}>Đang tải danh sách chat...</div> : (
        <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: 16 }}>
          <Card>
            <div style={{ marginBottom: 12, position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                className={userInputClass}
                style={{ paddingLeft: 34 }}
                placeholder='Tìm theo chuyên gia, mã lịch, gói...'
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') loadChats() }}
              />
            </div>
            <div style={{ display: 'grid', gap: 8, maxHeight: 620, overflow: 'auto' }}>
              {chats.map((chat) => {
                const active = Number(chat.booking_id) === Number(activeBookingId)
                return (
                  <button
                    key={chat.booking_id}
                    onClick={() => setActiveBookingId(Number(chat.booking_id))}
                    style={{ textAlign: 'left', borderRadius: 12, border: active ? '1px solid #818cf8' : '1px solid #e2e8f0', background: active ? '#eef2ff' : 'white', padding: 10, display: 'flex', gap: 10, alignItems: 'flex-start', cursor: 'pointer', transition: 'all 0.15s' }}
                  >
                    <Avatar name={chat.expert_name} size={40} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                        <b style={{ fontSize: 13, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{chat.expert_name}</b>
                        {Number(chat.unread ?? 0) > 0 ? <span style={{ minWidth: 20, height: 20, borderRadius: 999, background: '#ef4444', color: 'white', fontSize: 11, fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '0 6px', flexShrink: 0 }}>{chat.unread}</span> : null}
                      </div>
                      <p style={{ fontSize: 12, color: '#64748b', marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{chat.ma_lich_hen} · {chat.ten_goi}</p>
                      <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{fmt(chat.last_message_at)}</p>
                    </div>
                  </button>
                )
              })}
              {!chats.length ? <UserEmptyState icon={MessageCircle} title='Chưa có cuộc chat' description='Khi có booking hợp lệ, phòng chat sẽ xuất hiện ở đây.' /> : null}
            </div>
          </Card>

          <Card>
            {activeBookingId && activeChat ? (
              <>
                <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: 12, marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                      <Avatar name={activeChat.expert_name} size={44} />
                      <div style={{ minWidth: 0 }}>
                        <p style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{activeChat.expert_name}</p>
                        <p style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{activeChat.ma_lich_hen} · {activeChat.ten_goi} · {statusLabel(activeChat.trang_thai)}</p>
                      </div>
                    </div>
                    <button
                      type='button'
                      onClick={openVideoCall}
                      title='Bắt đầu video call'
                      aria-label='Bắt đầu video call'
                      style={{ width: 38, height: 38, border: '1px solid #c7d2fe', background: 'white', color: '#3730a3', borderRadius: 10, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
                    >
                      <Video size={16} />
                    </button>
                  </div>
                </div>
                <div
                  style={{
                    minHeight: 430,
                    maxHeight: 540,
                    overflow: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 4,
                    marginBottom: 12,
                    padding: '12px 8px',
                    background:
                      'radial-gradient(circle at 0% 0%, #eef2ff 0, transparent 38%), linear-gradient(180deg,#f8fafc 0%,#ffffff 100%)',
                    borderRadius: 14,
                    border: '1px solid #eef2f7',
                  }}
                >
                  {messages.map((msg, idx) => {
                    const mine = msg.sender_role === 'customer'
                    const prev = idx > 0 ? messages[idx - 1] : null
                    const next = idx < messages.length - 1 ? messages[idx + 1] : null

                    const sameSenderAsPrev =
                      prev && prev.sender_role === msg.sender_role &&
                      new Date(msg.tao_luc).getTime() - new Date(prev.tao_luc).getTime() < 5 * 60 * 1000
                    const sameSenderAsNext =
                      next && next.sender_role === msg.sender_role &&
                      new Date(next.tao_luc).getTime() - new Date(msg.tao_luc).getTime() < 5 * 60 * 1000

                    const showHeader = !sameSenderAsPrev
                    const showAvatar = !sameSenderAsNext
                    const showDateDivider =
                      !prev || new Date(msg.tao_luc).toDateString() !== new Date(prev.tao_luc).toDateString()

                    return (
                      <div key={msg.id}>
                        {showDateDivider && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '12px 4px 8px' }}>
                            <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
                            <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, padding: '3px 10px', background: 'white', borderRadius: 999, border: '1px solid #e2e8f0' }}>
                              {fmtDateLabel(msg.tao_luc)}
                            </span>
                            <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
                          </div>
                        )}
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: mine ? 'flex-end' : 'flex-start',
                            alignItems: 'flex-start',
                            gap: 10,
                            marginTop: showHeader ? 10 : 2,
                            padding: '0 6px',
                          }}
                        >
                          {!mine && (
                            <div style={{ width: 36, flexShrink: 0, paddingTop: showHeader ? 18 : 0 }}>
                              {showAvatar ? <Avatar name={msg.sender_name} size={36} /> : null}
                            </div>
                          )}
                          <div style={{ maxWidth: '68%', display: 'flex', flexDirection: 'column', alignItems: mine ? 'flex-end' : 'flex-start', minWidth: 0 }}>
                            {showHeader && !mine && (
                              <span style={{ fontSize: 12, color: '#475569', fontWeight: 600, marginBottom: 4, marginLeft: 12 }}>
                                {msg.sender_name}
                              </span>
                            )}
                            {(() => {
                              const attachments = Array.isArray(msg.tep_dinh_kem) ? msg.tep_dinh_kem : []
                              const images = attachments.filter((a: any) => a?.type === 'image' || (a?.mime ?? '').startsWith('image/'))
                              const otherFiles = attachments.filter((a: any) => !images.includes(a))
                              const hasContent = !!msg.noi_dung
                              return (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: mine ? 'flex-end' : 'flex-start' }}>
                                  {images.map((att: any, i: number) => (
                                    <img
                                      key={i}
                                      src={resolveFileUrl(att.url)}
                                      alt={att.name ?? 'image'}
                                      onClick={() => setLightbox(resolveFileUrl(att.url))}
                                      style={{
                                        maxWidth: 280,
                                        maxHeight: 320,
                                        borderRadius: 16,
                                        cursor: 'zoom-in',
                                        border: '1px solid #e2e8f0',
                                        boxShadow: '0 2px 8px rgba(15,23,42,0.08)',
                                        objectFit: 'cover',
                                      }}
                                    />
                                  ))}
                                  {otherFiles.map((att: any, i: number) => (
                                    <a
                                      key={i}
                                      href={resolveFileUrl(att.url)}
                                      target='_blank'
                                      rel='noopener noreferrer'
                                      style={{
                                        display: 'inline-flex', alignItems: 'center', gap: 8,
                                        padding: '9px 14px', borderRadius: 14,
                                        background: mine ? 'rgba(255,255,255,0.18)' : '#f1f5f9',
                                        color: mine ? 'white' : '#1e293b',
                                        textDecoration: 'none', fontSize: 13, fontWeight: 500,
                                        border: mine ? 'none' : '1px solid #e2e8f0',
                                      }}
                                    >
                                      <Paperclip size={14} /> {att.name ?? 'Tệp đính kèm'}
                                    </a>
                                  ))}
                                  {hasContent && (
                                    <div
                                      style={{
                                        display: 'inline-block',
                                        padding: '9px 16px',
                                        fontSize: 14,
                                        lineHeight: 1.5,
                                        whiteSpace: 'pre-wrap',
                                        wordBreak: 'break-word',
                                        background: mine ? 'linear-gradient(135deg,#6366f1,#818cf8)' : 'white',
                                        color: mine ? 'white' : '#1e293b',
                                        border: mine ? 'none' : '1px solid #e2e8f0',
                                        boxShadow: mine ? '0 2px 8px rgba(99,102,241,0.22)' : '0 1px 3px rgba(15,23,42,0.06)',
                                        borderRadius: 20,
                                        borderTopRightRadius: mine && sameSenderAsPrev ? 6 : 20,
                                        borderBottomRightRadius: mine && sameSenderAsNext ? 6 : 20,
                                        borderTopLeftRadius: !mine && sameSenderAsPrev ? 6 : 20,
                                        borderBottomLeftRadius: !mine && sameSenderAsNext ? 6 : 20,
                                      }}
                                    >
                                      {msg.noi_dung}
                                    </div>
                                  )}
                                </div>
                              )
                            })()}
                            {showAvatar && (
                              <span style={{ fontSize: 11, color: '#94a3b8', marginTop: 4, padding: '0 12px' }}>
                                {fmtTime(msg.tao_luc)}
                              </span>
                            )}
                          </div>
                          {mine && (
                            <div style={{ width: 36, flexShrink: 0, paddingTop: 0 }}>
                              {showAvatar ? <Avatar name={msg.sender_name} size={36} /> : null}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                  {!messages.length && (
                    <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8', fontSize: 13 }}>
                      <MessageCircle size={32} style={{ opacity: 0.4, marginBottom: 8 }} />
                      <p>Chưa có tin nhắn nào. Hãy gửi lời chào đầu tiên!</p>
                    </div>
                  )}
                  <div ref={bottomRef} />
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input
                    ref={fileInputRef}
                    type='file'
                    accept='image/*'
                    multiple
                    style={{ display: 'none' }}
                    onChange={(e) => uploadFiles(e.target.files)}
                  />
                  <button
                    type='button'
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    title='Đính kèm ảnh'
                    aria-label='Đính kèm ảnh'
                    style={{
                      width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                      border: '1px solid #e2e8f0', background: 'white', color: '#4f46e5',
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      cursor: uploading ? 'wait' : 'pointer',
                    }}
                  >
                    <ImageIcon size={18} />
                  </button>
                  <input className={userInputClass} placeholder={uploading ? 'Đang tải ảnh lên...' : 'Nhập tin nhắn tư vấn...'} value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') send() }} />
                  <UserButton onClick={send} disabled={sending || uploading || !text.trim()}><Send size={14} /> {sending ? 'Đang gửi' : 'Gửi'}</UserButton>
                </div>
              </>
            ) : (
              <UserEmptyState icon={MessageCircle} title='Chọn một cuộc chat' description='Chọn cuộc chat từ danh sách bên trái để bắt đầu trao đổi realtime.' />
            )}
          </Card>
        </div>
      )}
      {lightbox && (
        <div
          onClick={() => setLightbox(null)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.85)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000, cursor: 'zoom-out', padding: 24,
          }}
        >
          <button
            type='button'
            onClick={() => setLightbox(null)}
            aria-label='Đóng'
            style={{
              position: 'absolute', top: 20, right: 24,
              width: 40, height: 40, borderRadius: 999,
              background: 'rgba(255,255,255,0.12)', border: 'none', color: 'white',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
            }}
          >
            <X size={20} />
          </button>
          <img src={lightbox} alt='preview' style={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: 12 }} />
        </div>
      )}
    </>
  )
}
