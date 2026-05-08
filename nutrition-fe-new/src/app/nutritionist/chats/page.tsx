'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { MessageCircle, MessageSquare, Inbox, Search, ChevronRight, User, Package, Clock } from 'lucide-react'
import { SectionHeader, Card, UserStatCard, UserButton, UserNotice, UserEmptyState, StatusBadge } from '@/components/user/user-ui'
import { expertGet } from '@/lib/expert-api'

type Row = Record<string, any>

export default function ExpertChatsPage() {
  const [chats, setChats] = useState<Row[]>([])
  const [query, setQuery] = useState('')
  const [notice, setNotice] = useState('')
  const [tone, setTone] = useState<'success' | 'error' | 'info'>('info')
  const [loading, setLoading] = useState(true)

  async function loadChats() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (query) params.set('search', query)
      setChats(await expertGet<Row[]>(`/chats${params.toString() ? `?${params}` : ''}`))
    } catch (e: any) {
      setNotice(e.message ?? 'Lỗi tải chat')
      setTone('error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadChats() }, [])

  const stats = useMemo(() => ({
    total: chats.length,
    unread: chats.reduce((sum, chat) => sum + Number(chat.unread ?? 0), 0),
    active: chats.filter((chat) => chat.trang_thai !== 'hoan_thanh' && chat.trang_thai !== 'da_huy').length,
  }), [chats])

  return (
    <>
      <SectionHeader
        title='Chat với khách hàng'
        subtitle='Quản lý các cuộc trò chuyện theo booking để tư vấn kịp thời.'
      />

      {notice && <UserNotice tone={tone}>{notice}</UserNotice>}

      <div className='grid-stats'>
        <UserStatCard label='Tổng cuộc chat' value={String(stats.total)} icon={MessageCircle} tone='blue' />
        <UserStatCard label='Tin chưa đọc' value={String(stats.unread)} icon={Inbox} tone='orange' />
        <UserStatCard label='Booking đang mở' value={String(stats.active)} icon={MessageSquare} tone='green' />
      </div>

      {/* Search */}
      <div style={{ marginBottom: 16, position: 'relative' }}>
        <Search size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') loadChats() }}
          placeholder='Tìm khách hàng, mã booking, gói...'
          style={{ width: '100%', paddingLeft: 38, paddingRight: 14, paddingTop: 11, paddingBottom: 11, borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 13.5, outline: 'none' }}
        />
      </div>

      {loading ? (
        <Card><p style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>Đang tải...</p></Card>
      ) : chats.length === 0 ? (
        <UserEmptyState
          icon={MessageCircle}
          title='Chưa có cuộc chat nào'
          description='Khi có khách đặt lịch, cuộc chat sẽ tự động tạo cho bạn.'
        />
      ) : (
        <div style={{ display: 'grid', gap: 8 }}>
          {chats.map((chat) => {
            const unread = Number(chat.unread ?? 0)
            return (
              <Link
                key={chat.booking_id}
                href={`/nutritionist/chats/${chat.booking_id}`}
                style={{ textDecoration: 'none' }}
              >
                <div style={{
                  padding: 14, borderRadius: 12,
                  background: unread > 0 ? 'linear-gradient(90deg, #fffbeb, white 30%)' : 'white',
                  border: `1px solid ${unread > 0 ? '#fde68a' : '#f1f5f9'}`,
                  display: 'flex', alignItems: 'center', gap: 14,
                  cursor: 'pointer', transition: 'all 0.15s',
                }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateX(4px)'; e.currentTarget.style.borderColor = '#6366f1' }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateX(0)'; e.currentTarget.style.borderColor = unread > 0 ? '#fde68a' : '#f1f5f9' }}
                >
                  {/* Avatar */}
                  <div style={{
                    width: 48, height: 48, borderRadius: '50%', flexShrink: 0,
                    background: '#e0e7ff', color: '#6366f1',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 18, fontWeight: 700, position: 'relative',
                  }}>
                    {String(chat.customer_name ?? 'K').charAt(0).toUpperCase()}
                    {unread > 0 && (
                      <span style={{
                        position: 'absolute', top: -2, right: -2, minWidth: 20, height: 20,
                        padding: '0 5px', borderRadius: 10, background: '#ef4444', color: 'white',
                        fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        border: '2px solid white',
                      }}>
                        {unread > 99 ? '99+' : unread}
                      </span>
                    )}
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{chat.customer_name}</p>
                      <span style={{ fontSize: 11, color: '#6366f1', fontFamily: 'monospace', fontWeight: 600 }}>
                        {chat.ma_lich_hen}
                      </span>
                      <StatusBadge value={chat.trang_thai} />
                    </div>
                    <p style={{ margin: '4px 0 0', fontSize: 12.5, color: '#64748b', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <Package size={11} /> {chat.ten_goi}
                      </span>
                      {chat.last_message_at && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <Clock size={11} /> {String(chat.last_message_at).slice(0, 16).replace('T', ' ')}
                        </span>
                      )}
                    </p>
                  </div>

                  <ChevronRight size={18} style={{ color: '#94a3b8', flexShrink: 0 }} />
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </>
  )
}
