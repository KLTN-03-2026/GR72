'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Send, User, Shield, MessageSquare } from 'lucide-react'
import { Card, UserButton, UserNotice, StatusBadge } from '@/components/user/user-ui'
import { customerGet, customerPost } from '@/lib/customer-api'

type Row = Record<string, any>

const TYPE_LABELS: Record<string, string> = {
  booking: 'Lịch hẹn', thanh_toan: 'Thanh toán', danh_gia: 'Đánh giá', khac: 'Khác',
}

export default function ComplaintDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [data, setData] = useState<Row | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [content, setContent] = useState('')
  const [sending, setSending] = useState(false)
  const [sendMsg, setSendMsg] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  function load() {
    customerGet<Row>(`/complaints/${id}`)
      .then((d) => { setData(d); setLoading(false) })
      .catch((e) => { setError(e.message ?? 'Lỗi'); setLoading(false) })
  }

  useEffect(() => { load() }, [id])
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [data?.messages?.length])

  async function sendMessage() {
    if (!content.trim()) return
    setSending(true)
    try {
      await customerPost(`/complaints/${id}/messages`, { noi_dung: content.trim() })
      setContent('')
      setSendMsg('')
      load()
    } catch (e: any) {
      setSendMsg(e.message ?? 'Gửi thất bại')
    } finally {
      setSending(false)
    }
  }

  const messages = useMemo(() => data?.messages ?? [], [data?.messages])
  const isClosed = ['da_dong', 'da_huy', 'da_giai_quyet'].includes(String(data?.trang_thai ?? ''))

  if (loading) return <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8' }}>Đang tải...</div>
  if (error) return <UserNotice tone='error'>{error}</UserNotice>
  if (!data) return null

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <Link href='/user/complaints'>
          <UserButton variant='ghost' size='sm'><ArrowLeft size={14} /> Quay lại</UserButton>
        </Link>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, color: '#64748b', fontFamily: 'monospace' }}>{data.ma_ticket}</span>
            <span style={{ fontSize: 12, padding: '3px 10px', borderRadius: 20, background: '#eef2ff', color: '#4f46e5', fontWeight: 700 }}>
              {TYPE_LABELS[data.loai] ?? data.loai}
            </span>
          </div>
          <h1 style={{ margin: '6px 0 0', fontSize: 28, lineHeight: 1.2, fontWeight: 900, color: '#0f172a' }}>{data.tieu_de}</h1>
        </div>
        <StatusBadge value={data.trang_thai} />
      </div>

      <Card>
        <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.06em' }}>Nội dung khiếu nại</p>
        <p style={{ margin: '8px 0 0', fontSize: 15, color: '#334155', lineHeight: 1.8 }}>{data.noi_dung}</p>
        <p style={{ margin: '10px 0 0', fontSize: 12, color: '#94a3b8' }}>Gửi lúc {new Date(data.tao_luc).toLocaleString('vi-VN')}</p>
      </Card>

      <Card>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <p style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#0f172a' }}>Trao đổi hỗ trợ</p>
          <span style={{ fontSize: 12, color: '#64748b' }}>{messages.length} phản hồi</span>
        </div>

        {messages.length === 0 ? (
          <div style={{ border: '1px dashed #dbeafe', borderRadius: 12, background: '#f8fbff', padding: 24, textAlign: 'center', color: '#64748b' }}>
            <MessageSquare size={22} style={{ margin: '0 auto 8px', color: '#93c5fd' }} />
            Chưa có phản hồi nào.
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 10, maxHeight: 380, overflow: 'auto', paddingRight: 2 }}>
            {messages.map((m: Row) => {
              const isAdmin = m.sender_role === 'admin'
              return (
                <div key={m.id} style={{ display: 'flex', justifyContent: isAdmin ? 'flex-start' : 'flex-end' }}>
                  <div style={{ maxWidth: '80%', display: 'grid', gap: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: isAdmin ? 'flex-start' : 'flex-end' }}>
                      {isAdmin ? <Shield size={12} color='#dc2626' /> : <User size={12} color='#6366f1' />}
                      <span style={{ fontSize: 11, color: '#94a3b8' }}>
                        {isAdmin ? 'Admin hỗ trợ' : 'Bạn'} · {new Date(m.tao_luc).toLocaleString('vi-VN')}
                      </span>
                    </div>
                    <div style={{
                      padding: '10px 12px',
                      borderRadius: 12,
                      border: `1px solid ${isAdmin ? '#fde68a' : '#c7d2fe'}`,
                      background: isAdmin ? '#fffbeb' : '#eef2ff',
                      color: '#334155',
                      fontSize: 13,
                      lineHeight: 1.6,
                    }}>
                      {m.noi_dung}
                    </div>
                  </div>
                </div>
              )
            })}
            <div ref={bottomRef} />
          </div>
        )}
      </Card>

      {!isClosed ? (
        <Card>
          <p style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 700, color: '#334155' }}>Phản hồi thêm</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 10, alignItems: 'end' }}>
            <textarea
              style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 14, resize: 'vertical', minHeight: 92, outline: 'none' }}
              placeholder='Nhập thêm thông tin hoặc câu hỏi...'
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) sendMessage() }}
            />
            <UserButton onClick={sendMessage} disabled={sending || !content.trim()}>
              <Send size={14} /> {sending ? 'Đang gửi...' : 'Gửi'}
            </UserButton>
          </div>
          {sendMsg ? <p style={{ margin: '8px 0 0', fontSize: 12, color: '#dc2626' }}>{sendMsg}</p> : null}
          <p style={{ margin: '8px 0 0', fontSize: 11, color: '#94a3b8' }}>Ctrl+Enter để gửi nhanh</p>
        </Card>
      ) : (
        <UserNotice tone='info'>Khiếu nại này đã đóng. Bạn có thể tạo khiếu nại mới nếu cần hỗ trợ tiếp.</UserNotice>
      )}
    </div>
  )
}
