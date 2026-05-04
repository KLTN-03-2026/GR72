'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { MessageCircle, Search, Send, Video } from 'lucide-react'
import { Card, SectionHeader, UserButton, UserEmptyState, UserNotice, userInputClass } from '@/components/user/user-ui'
import { createChatSocket, type ChatSocketMessage } from '@/lib/chat-socket'
import { customerGet, customerPatch, customerPost } from '@/lib/customer-api'

type Row = Record<string, any>

function fmt(value: string) {
  if (!value) return '—'
  return new Date(value).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })
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
  const socketRef = useRef<ReturnType<typeof createChatSocket> | null>(null)
  const activeBookingRef = useRef<number | null>(null)
  const bottomRef = useRef<HTMLDivElement | null>(null)

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
                    style={{ textAlign: 'left', borderRadius: 12, border: active ? '1px solid #818cf8' : '1px solid #e2e8f0', background: active ? '#eef2ff' : 'white', padding: 12 }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                      <b style={{ fontSize: 13, color: '#0f172a' }}>{chat.expert_name}</b>
                      {Number(chat.unread ?? 0) > 0 ? <span style={{ minWidth: 20, height: 20, borderRadius: 999, background: '#ef4444', color: 'white', fontSize: 11, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '0 6px' }}>{chat.unread}</span> : null}
                    </div>
                    <p style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>{chat.ma_lich_hen} · {chat.ten_goi}</p>
                    <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 3 }}>{fmt(chat.last_message_at)}</p>
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
                    <p style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>{activeChat.expert_name}</p>
                    <button
                      type='button'
                      onClick={openVideoCall}
                      title='Bắt đầu video call'
                      aria-label='Bắt đầu video call'
                      style={{ width: 36, height: 36, border: '1px solid #c7d2fe', background: 'white', color: '#3730a3', borderRadius: 10, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                    >
                      <Video size={16} />
                    </button>
                  </div>
                  <p style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{activeChat.ma_lich_hen} · {activeChat.ten_goi} · {activeChat.trang_thai}</p>
                </div>
                <div style={{ minHeight: 430, maxHeight: 520, overflow: 'auto', display: 'grid', gap: 10, marginBottom: 12 }}>
                  {messages.map((msg) => {
                    const mine = msg.sender_role === 'customer'
                    return (
                      <div key={msg.id} style={{ display: 'flex', justifyContent: mine ? 'flex-end' : 'flex-start' }}>
                        <div style={{ maxWidth: '78%', borderRadius: 14, padding: '10px 12px', border: mine ? 'none' : '1px solid #e2e8f0', background: mine ? '#4f46e5' : '#f8fafc', color: mine ? 'white' : '#334155' }}>
                          <div style={{ fontSize: 11, opacity: mine ? 0.85 : 0.6, marginBottom: 4 }}>{msg.sender_name}</div>
                          <div style={{ fontSize: 14, whiteSpace: 'pre-wrap' }}>{msg.noi_dung}</div>
                          <div style={{ fontSize: 11, opacity: mine ? 0.7 : 0.5, marginTop: 6 }}>{fmt(msg.tao_luc)}</div>
                        </div>
                      </div>
                    )
                  })}
                  <div ref={bottomRef} />
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input className={userInputClass} placeholder='Nhập tin nhắn tư vấn...' value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') send() }} />
                  <UserButton onClick={send} disabled={sending || !text.trim()}><Send size={14} /> {sending ? 'Đang gửi' : 'Gửi'}</UserButton>
                </div>
              </>
            ) : (
              <UserEmptyState icon={MessageCircle} title='Chọn một cuộc chat' description='Chọn cuộc chat từ danh sách bên trái để bắt đầu trao đổi realtime.' />
            )}
          </Card>
        </div>
      )}
    </>
  )
}
