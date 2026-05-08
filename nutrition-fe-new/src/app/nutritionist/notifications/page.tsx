'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { Bell, BellRing, Check, CheckCheck, Calendar, MessageSquare, Star, Wallet, User, Settings } from 'lucide-react'
import { SectionHeader, Card, UserStatCard, UserButton, UserNotice, UserEmptyState } from '@/components/user/user-ui'
import { expertGet, expertPatch } from '@/lib/expert-api'
import { NOTIFICATION_TYPE_LABELS } from '@/lib/i18n'

type Row = Record<string, any>

const TYPE_ICON: Record<string, React.ReactNode> = {
  booking: <Calendar size={16} />,
  message: <MessageSquare size={16} />,
  review: <Star size={16} />,
  commission: <Wallet size={16} />,
  profile: <User size={16} />,
  system: <Settings size={16} />,
}

const TYPE_TONE: Record<string, string> = {
  booking: '#6366f1',
  message: '#10b981',
  review: '#f59e0b',
  commission: '#8b5cf6',
  profile: '#3b82f6',
  system: '#64748b',
}

export default function ExpertNotificationsPage() {
  const [rows, setRows] = useState<Row[]>([])
  const [status, setStatus] = useState('')
  const [type, setType] = useState('')
  const [message, setMessage] = useState('')
  const [msgTone, setMsgTone] = useState<'success' | 'error' | 'info'>('info')
  const [loading, setLoading] = useState(true)
  const [readingAll, setReadingAll] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (status) params.set('status', status)
      if (type) params.set('type', type)
      setRows(await expertGet<Row[]>(`/notifications${params.toString() ? `?${params}` : ''}`))
    } catch (e: any) {
      setMessage(e.message ?? 'Lỗi tải thông báo')
      setMsgTone('error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [status, type])

  const stats = useMemo(() => ({
    total: rows.length,
    unread: rows.filter((row) => row.trang_thai === 'chua_doc').length,
    read: rows.filter((row) => row.trang_thai === 'da_doc').length,
  }), [rows])

  async function read(row: Row) {
    try {
      await expertPatch(`/notifications/${row.id}/read`)
      await load()
    } catch (e: any) {
      setMessage(e.message ?? 'Lỗi')
      setMsgTone('error')
    }
  }

  async function readAll() {
    setReadingAll(true)
    try {
      await expertPatch('/notifications/read-all')
      setMessage('✅ Đã đánh dấu tất cả là đã đọc.')
      setMsgTone('success')
      await load()
    } catch (e: any) {
      setMessage(e.message ?? 'Lỗi')
      setMsgTone('error')
    } finally {
      setReadingAll(false)
    }
  }

  return (
    <>
      <SectionHeader
        title='Thông báo'
        subtitle='Theo dõi booking, tin nhắn, đánh giá, hoa hồng và cập nhật hệ thống.'
        action={
          stats.unread > 0
            ? <UserButton size='sm' onClick={readAll} disabled={readingAll}>
                <CheckCheck size={14} /> {readingAll ? 'Đang cập nhật...' : `Đọc tất cả (${stats.unread})`}
              </UserButton>
            : undefined
        }
      />

      {message && <UserNotice tone={msgTone}>{message}</UserNotice>}

      <div className='grid-stats'>
        <UserStatCard label='Tổng thông báo' value={String(stats.total)} icon={Bell} tone='blue' />
        <UserStatCard label='Chưa đọc' value={String(stats.unread)} icon={BellRing} tone='orange' />
        <UserStatCard label='Đã đọc' value={String(stats.read)} icon={Check} tone='green' />
      </div>

      {/* Filter chips */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
          <span style={{ fontSize: 12, color: '#64748b', fontWeight: 600, alignSelf: 'center', marginRight: 4 }}>Trạng thái:</span>
          {[{ v: '', l: 'Tất cả' }, { v: 'chua_doc', l: 'Chưa đọc' }, { v: 'da_doc', l: 'Đã đọc' }].map((s) => (
            <button key={s.v} onClick={() => setStatus(s.v)} style={chipStyle(status === s.v)}>{s.l}</button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, color: '#64748b', fontWeight: 600, alignSelf: 'center', marginRight: 4 }}>Loại:</span>
          <button onClick={() => setType('')} style={chipStyle(!type)}>Tất cả</button>
          {['booking', 'message', 'review', 'commission', 'profile', 'system'].map((t) => (
            <button key={t} onClick={() => setType(t)} style={chipStyle(type === t)}>
              {NOTIFICATION_TYPE_LABELS[t] ?? t}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <Card><p style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>Đang tải...</p></Card>
      ) : rows.length === 0 ? (
        <UserEmptyState
          icon={Bell}
          title='Chưa có thông báo'
          description='Khi có cập nhật mới về booking, tin nhắn hoặc đánh giá, bạn sẽ thấy ở đây.'
        />
      ) : (
        <div style={{ display: 'grid', gap: 8 }}>
          {rows.map((row) => {
            const tone = TYPE_TONE[row.loai] ?? '#64748b'
            const isUnread = row.trang_thai === 'chua_doc'
            const inner = (
              <div style={{
                padding: 14, borderRadius: 12,
                background: isUnread ? 'linear-gradient(90deg, #eef2ff, white 30%)' : 'white',
                border: `1px solid ${isUnread ? '#e0e7ff' : '#f1f5f9'}`,
                display: 'flex', gap: 12, alignItems: 'flex-start',
                cursor: 'pointer', transition: 'all 0.15s',
                position: 'relative',
              }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateX(2px)' }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateX(0)' }}
              >
                {isUnread && <span style={{ position: 'absolute', top: 14, right: 14, width: 8, height: 8, borderRadius: '50%', background: '#6366f1' }} />}
                <div style={{
                  width: 38, height: 38, borderRadius: 10, background: `${tone}15`, color: tone,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  {TYPE_ICON[row.loai] ?? <Bell size={16} />}
                </div>
                <div style={{ flex: 1, minWidth: 0, paddingRight: isUnread ? 16 : 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{row.tieu_de}</p>
                    <p style={{ margin: 0, fontSize: 11.5, color: '#94a3b8', whiteSpace: 'nowrap' }}>
                      {String(row.tao_luc).slice(0, 16).replace('T', ' ')}
                    </p>
                  </div>
                  <p style={{ margin: '4px 0 0', fontSize: 13, color: '#475569', lineHeight: 1.5 }}>{row.noi_dung}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: tone, textTransform: 'uppercase', letterSpacing: 0.3 }}>
                      {NOTIFICATION_TYPE_LABELS[row.loai] ?? row.loai}
                    </span>
                    {isUnread && (
                      <button
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); read(row) }}
                        style={{
                          fontSize: 11, color: '#6366f1', fontWeight: 600, background: 'none',
                          border: 'none', cursor: 'pointer', textDecoration: 'underline',
                        }}
                      >
                        Đánh dấu đã đọc
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
            return row.duong_dan_hanh_dong
              ? <Link key={row.id} href={row.duong_dan_hanh_dong} style={{ textDecoration: 'none' }} onClick={() => isUnread && read(row)}>{inner}</Link>
              : <div key={row.id} onClick={() => isUnread && read(row)}>{inner}</div>
          })}
        </div>
      )}
    </>
  )
}

function chipStyle(active: boolean): React.CSSProperties {
  return {
    padding: '5px 12px', borderRadius: 999, fontSize: 12.5, fontWeight: 600,
    border: `1px solid ${active ? '#6366f1' : '#e2e8f0'}`,
    background: active ? '#eef2ff' : 'white',
    color: active ? '#6366f1' : '#64748b',
    cursor: 'pointer', transition: 'all 0.15s',
  }
}
