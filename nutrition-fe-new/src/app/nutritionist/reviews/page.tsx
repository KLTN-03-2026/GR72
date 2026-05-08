'use client'

import { useEffect, useMemo, useState } from 'react'
import { Star, MessageSquare, AlertTriangle, Filter, X, Send, Reply } from 'lucide-react'
import { SectionHeader, Card, UserStatCard, UserButton, UserNotice, UserEmptyState, StatusBadge } from '@/components/user/user-ui'
import { expertGet, expertPost } from '@/lib/expert-api'

type Row = Record<string, any>

export default function ExpertReviewsPage() {
  const [rows, setRows] = useState<Row[]>([])
  const [summary, setSummary] = useState<Row | null>(null)
  const [rating, setRating] = useState('')
  const [selected, setSelected] = useState<Row | null>(null)
  const [reply, setReply] = useState('')
  const [message, setMessage] = useState('')
  const [msgTone, setMsgTone] = useState<'success' | 'error' | 'info'>('info')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (rating) params.set('rating', rating)
      const [reviewRows, reviewSummary] = await Promise.all([
        expertGet<Row[]>(`/reviews${params.toString() ? `?${params}` : ''}`),
        expertGet<Row>('/reviews/summary'),
      ])
      setRows(reviewRows)
      setSummary(reviewSummary)
    } catch (e: any) {
      setMessage(e.message ?? 'Lỗi tải review')
      setMsgTone('error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [rating])

  useEffect(() => {
    document.body.style.overflow = selected ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [selected])

  const stats = useMemo(() => ({
    avg: Number(summary?.avgRating ?? 0).toFixed(1),
    total: Number(summary?.total ?? 0),
    flagged: Number(summary?.flagged ?? 0),
    pending: rows.filter(r => !r.expert_reply).length,
  }), [summary, rows])

  function openReply(row: Row) {
    setSelected(row)
    setReply(row.expert_reply ?? '')
    setErrors({})
  }

  async function sendReply() {
    if (!selected) return
    if (!reply.trim()) {
      setErrors({ reply: 'Vui lòng nhập phản hồi trước khi gửi.' })
      return
    }
    setSaving(true)
    try {
      await expertPost(`/reviews/${selected.id}/reply`, { noi_dung: reply.trim() })
      setMessage('✅ Đã gửi phản hồi đánh giá.')
      setMsgTone('success')
      setSelected(null)
      setErrors({})
      await load()
    } catch (e: any) {
      setMessage(e.message ?? 'Lỗi gửi phản hồi')
      setMsgTone('error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <SectionHeader
        title='Đánh giá khách hàng'
        subtitle='Xem nhận xét và phản hồi để cải thiện chất lượng tư vấn.'
      />

      {message && <UserNotice tone={msgTone}>{message}</UserNotice>}

      <div className='grid-stats'>
        <UserStatCard label='Điểm trung bình' value={`${stats.avg}/5`} icon={Star} tone='purple' />
        <UserStatCard label='Tổng đánh giá' value={String(stats.total)} icon={MessageSquare} tone='blue' />
        <UserStatCard label='Chưa phản hồi' value={String(stats.pending)} icon={Reply} tone='orange' />
        <UserStatCard label='Bị báo cáo' value={String(stats.flagged)} icon={AlertTriangle} tone='red' />
      </div>

      {/* Filter */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'center', flexWrap: 'wrap' }}>
        <Filter size={15} style={{ color: '#94a3b8' }} />
        <span style={{ fontSize: 13, color: '#475569', fontWeight: 600 }}>Lọc:</span>
        <button
          onClick={() => setRating('')}
          style={chipStyle(!rating)}
        >
          Tất cả
        </button>
        {[5, 4, 3, 2, 1].map((n) => (
          <button
            key={n}
            onClick={() => setRating(String(n))}
            style={chipStyle(rating === String(n))}
          >
            {n} ⭐
          </button>
        ))}
      </div>

      {loading ? (
        <Card><p style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>Đang tải...</p></Card>
      ) : rows.length === 0 ? (
        <UserEmptyState
          icon={Star}
          title='Chưa có đánh giá nào'
          description='Khi khách hàng đánh giá sau buổi tư vấn, đánh giá sẽ xuất hiện ở đây.'
        />
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {rows.map((row) => <ReviewItem key={row.id} row={row} onReply={() => openReply(row)} />)}
        </div>
      )}

      {selected && (
        <ReplyModal
          review={selected}
          reply={reply}
          setReply={(v) => { setReply(v); setErrors({}) }}
          error={errors.reply}
          saving={saving}
          onSend={sendReply}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  )
}

function chipStyle(active: boolean): React.CSSProperties {
  return {
    padding: '6px 14px', borderRadius: 999, fontSize: 13, fontWeight: 600,
    border: `1px solid ${active ? '#6366f1' : '#e2e8f0'}`,
    background: active ? '#eef2ff' : 'white',
    color: active ? '#6366f1' : '#64748b',
    cursor: 'pointer', transition: 'all 0.15s',
  }
}

function ReviewItem({ row, onReply }: { row: Row; onReply: () => void }) {
  return (
    <Card>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
        <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#e0e7ff', color: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 16, flexShrink: 0 }}>
          {String(row.customer_name ?? 'K').charAt(0).toUpperCase()}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
            <div>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{row.customer_name}</p>
              {row.ten_goi && <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748b' }}>{row.ten_goi}</p>}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ display: 'flex', gap: 1 }}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} size={14} style={{ color: s <= Number(row.diem) ? '#f59e0b' : '#e2e8f0', fill: s <= Number(row.diem) ? '#f59e0b' : 'transparent' }} />
                ))}
              </div>
              <StatusBadge value={row.trang_thai} />
            </div>
          </div>
        </div>
      </div>

      {row.noi_dung && (
        <p style={{ margin: '0 0 12px', padding: 12, background: '#fafafa', borderRadius: 10, fontSize: 14, color: '#334155', lineHeight: 1.6 }}>
          "{row.noi_dung}"
        </p>
      )}

      {/* Existing reply */}
      {row.expert_reply ? (
        <div style={{ padding: 12, background: '#f0fdf4', borderRadius: 10, border: '1px solid #d1fae5', marginBottom: 12 }}>
          <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: '#065f46', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Reply size={12} /> Phản hồi của bạn
          </p>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#065f46', lineHeight: 1.6 }}>{row.expert_reply}</p>
        </div>
      ) : null}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <p style={{ margin: 0, fontSize: 11.5, color: '#94a3b8' }}>
          {row.tao_luc ? new Date(row.tao_luc).toLocaleDateString('vi-VN') : ''}
        </p>
        <UserButton size='sm' variant={row.expert_reply ? 'secondary' : 'primary'} onClick={onReply}>
          <Reply size={12} /> {row.expert_reply ? 'Sửa phản hồi' : 'Phản hồi'}
        </UserButton>
      </div>
    </Card>
  )
}

function ReplyModal({ review, reply, setReply, error, saving, onSend, onClose }: {
  review: Row; reply: string; setReply: (v: string) => void; error?: string;
  saving: boolean; onSend: () => void; onClose: () => void;
}) {
  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, background: 'rgba(15,23,42,.6)', zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
      animation: 'fadeIn 0.2s ease',
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: 'white', borderRadius: 20, maxWidth: 600, width: '100%',
        maxHeight: '92vh', overflow: 'auto', boxShadow: '0 25px 50px -12px rgba(0,0,0,.25)',
        animation: 'slideUp 0.3s ease',
      }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: '#0f172a' }}>Phản hồi đánh giá</h2>
          <button onClick={onClose} style={{ width: 36, height: 36, borderRadius: '50%', border: 'none', background: '#f1f5f9', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: 24 }}>
          <div style={{ padding: 14, background: '#fafafa', borderRadius: 12, marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{review.customer_name}</p>
              <div style={{ display: 'flex', gap: 1 }}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} size={14} style={{ color: s <= Number(review.diem) ? '#f59e0b' : '#e2e8f0', fill: s <= Number(review.diem) ? '#f59e0b' : 'transparent' }} />
                ))}
              </div>
            </div>
            <p style={{ margin: 0, fontSize: 13.5, color: '#475569', lineHeight: 1.6 }}>"{review.noi_dung}"</p>
          </div>

          <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: '#475569', marginBottom: 6 }}>
            Nội dung phản hồi *
          </label>
          <textarea
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder='Cảm ơn bạn vì đánh giá. Tôi sẽ tiếp tục cải thiện...'
            style={{
              width: '100%', minHeight: 130, padding: '10px 12px', borderRadius: 10,
              border: `1px solid ${error ? '#fca5a5' : '#e2e8f0'}`,
              fontSize: 13.5, outline: 'none', resize: 'vertical',
            }}
          />
          {error && <p style={{ margin: '6px 0 0', fontSize: 12, color: '#dc2626', fontWeight: 600 }}>{error}</p>}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
            <UserButton variant='ghost' onClick={onClose}>Huỷ</UserButton>
            <UserButton onClick={onSend} disabled={saving}>
              <Send size={14} /> {saving ? 'Đang gửi...' : 'Gửi phản hồi'}
            </UserButton>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px) } to { opacity: 1; transform: translateY(0) } }
      `}</style>
    </div>
  )
}
