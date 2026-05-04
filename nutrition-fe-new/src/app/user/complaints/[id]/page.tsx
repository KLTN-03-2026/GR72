'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Send, User, Shield } from 'lucide-react'
import { Card, UserButton, UserNotice, StatusBadge } from '@/components/user/user-ui'
import { customerGet, customerPost } from '@/lib/customer-api'

type Row = Record<string, any>

const TYPE_LABELS: Record<string, string> = {
  booking: '📅 Lịch hẹn', thanh_toan: '💳 Thanh toán', danh_gia: '⭐ Đánh giá', khac: '🔖 Khác',
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
      .then(d => { setData(d); setLoading(false) })
      .catch(e => { setError(e.message ?? 'Lỗi'); setLoading(false) })
  }

  useEffect(() => { load() }, [id])
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [data?.messages])

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
    } finally { setSending(false) }
  }

  if (loading) return <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8' }}>Đang tải...</div>
  if (error) return <UserNotice tone='error'>{error}</UserNotice>
  if (!data) return null

  const isClosed = ['da_dong', 'da_huy'].includes(data.trang_thai)

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <Link href='/user/complaints'>
          <UserButton variant='ghost' size='sm'><ArrowLeft size={14} /> Quay lại</UserButton>
        </Link>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 11, color: '#94a3b8', fontFamily: 'monospace' }}>{data.ma_ticket}</span>
            <span style={{ fontSize: 12, padding: '2px 10px', borderRadius: 20, background: '#f1f5f9', color: '#64748b', fontWeight: 600 }}>
              {TYPE_LABELS[data.loai] ?? data.loai}
            </span>
          </div>
          <p style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', marginTop: 2 }}>{data.tieu_de}</p>
        </div>
        <StatusBadge value={data.trang_thai} />
      </div>

      {/* Nội dung khiếu nại */}
      <Card>
        <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 8 }}>Nội dung khiếu nại gốc</p>
        <p style={{ fontSize: 14, color: '#334155', lineHeight: 1.7 }}>{data.noi_dung}</p>
        <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 12 }}>Gửi lúc {new Date(data.tao_luc).toLocaleString('vi-VN')}</p>
      </Card>

      {/* Hội thoại */}
      {data.messages?.length > 0 && (
        <Card>
          <p style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 16 }}>Hội thoại hỗ trợ</p>
          <div style={{ display: 'grid', gap: 12 }}>
            {data.messages.map((m: Row) => {
              const isAdmin = m.sender_role === 'admin'
              return (
                <div key={m.id} style={{ display: 'flex', gap: 10, justifyContent: isAdmin ? 'flex-start' : 'flex-end' }}>
                  {isAdmin && (
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#fee2e2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Shield size={14} />
                    </div>
                  )}
                  <div style={{ maxWidth: '75%' }}>
                    <p style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4, textAlign: isAdmin ? 'left' : 'right' }}>
                      {isAdmin ? '🛡️ Admin' : '👤 Bạn'} · {new Date(m.tao_luc).toLocaleString('vi-VN')}
                    </p>
                    <div style={{
                      padding: '10px 14px', borderRadius: 12, fontSize: 13, lineHeight: 1.6,
                      background: isAdmin ? '#fef9c3' : '#eef2ff',
                      color: '#334155',
                      borderBottomLeftRadius: isAdmin ? 4 : 12,
                      borderBottomRightRadius: isAdmin ? 12 : 4,
                    }}>
                      {m.noi_dung}
                    </div>
                  </div>
                  {!isAdmin && (
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#eef2ff', color: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <User size={14} />
                    </div>
                  )}
                </div>
              )
            })}
            <div ref={bottomRef} />
          </div>
        </Card>
      )}

      {/* Gửi tin nhắn */}
      {!isClosed ? (
        <Card>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 12 }}>Phản hồi thêm</p>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
            <textarea
              style={{ flex: 1, padding: '10px 14px', borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 13, resize: 'vertical', minHeight: 72, outline: 'none' }}
              placeholder="Nhập thêm thông tin hoặc câu hỏi..."
              value={content} onChange={e => setContent(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) sendMessage() }}
            />
            <UserButton onClick={sendMessage} disabled={sending || !content.trim()}>
              <Send size={14} /> {sending ? '...' : 'Gửi'}
            </UserButton>
          </div>
          {sendMsg && <p style={{ fontSize: 12, color: '#dc2626', marginTop: 8 }}>{sendMsg}</p>}
          <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 8 }}>Ctrl+Enter để gửi nhanh</p>
        </Card>
      ) : (
        <UserNotice tone='info'>Khiếu nại này đã được đóng. Nếu cần hỗ trợ thêm, vui lòng tạo khiếu nại mới.</UserNotice>
      )}
    </>
  )
}
