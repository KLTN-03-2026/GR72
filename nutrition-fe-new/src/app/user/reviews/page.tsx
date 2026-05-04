'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Star, Edit2, Trash2, MessageCircle } from 'lucide-react'
import { SectionHeader, Card, UserButton, UserNotice, UserEmptyState, StatusBadge } from '@/components/user/user-ui'
import { customerGet, customerPatch, customerDelete } from '@/lib/customer-api'

type Row = Record<string, any>

function StarRating({ value, onChange }: { value: number; onChange?: (v: number) => void }) {
  const [hover, setHover] = useState(0)
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {[1, 2, 3, 4, 5].map(s => (
        <button
          key={s}
          type='button'
          onClick={() => onChange?.(s)}
          onMouseEnter={() => onChange && setHover(s)}
          onMouseLeave={() => onChange && setHover(0)}
          style={{ background: 'none', border: 'none', cursor: onChange ? 'pointer' : 'default', padding: 2 }}
        >
          <Star
            size={20}
            fill={(hover || value) >= s ? '#f59e0b' : 'none'}
            color={(hover || value) >= s ? '#f59e0b' : '#d1d5db'}
          />
        </button>
      ))}
    </div>
  )
}

const TAGS = ['Đúng giờ', 'Dễ hiểu', 'Hiệu quả', 'Nhiệt tình', 'Cần cải thiện']

function ReviewCard({ review, onUpdated }: { review: Row; onUpdated: () => void }) {
  const [editing, setEditing] = useState(false)
  const [diem, setDiem] = useState<number>(Number(review.diem))
  const [noiDung, setNoiDung] = useState(review.noi_dung ?? '')
  const [tag, setTag] = useState<string[]>(Array.isArray(review.tag) ? review.tag : [])
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')

  const deadlinePassed = Date.now() > new Date(review.tao_luc).getTime() + 7 * 86400_000

  function toggleTag(t: string) {
    setTag(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t])
  }

  async function saveEdit() {
    if (diem < 1 || diem > 5) { setMsg('Điểm phải từ 1–5'); return }
    setLoading(true)
    try {
      await customerPatch(`/reviews/${review.id}`, { diem, noi_dung: noiDung, tag })
      setMsg('✅ Đã cập nhật đánh giá.')
      setEditing(false)
      onUpdated()
    } catch (e: any) { setMsg(e.message ?? 'Lỗi') } finally { setLoading(false) }
  }

  async function handleDelete() {
    if (!confirm('Bạn có chắc muốn xóa đánh giá này?')) return
    setLoading(true)
    try {
      await customerDelete(`/reviews/${review.id}`)
      onUpdated()
    } catch (e: any) { setMsg(e.message ?? 'Lỗi') } finally { setLoading(false) }
  }

  return (
    <Card hover>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div>
          <p style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>{review.expert_name}</p>
          <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{review.ten_goi} · {review.ma_lich_hen}</p>
        </div>
        <StatusBadge value={review.trang_thai} />
      </div>

      {editing ? (
        <div style={{ display: 'grid', gap: 14 }}>
          <div>
            <p style={{ fontSize: 12, fontWeight: 600, marginBottom: 6, color: '#475569' }}>Điểm đánh giá *</p>
            <StarRating value={diem} onChange={setDiem} />
          </div>
          <div>
            <p style={{ fontSize: 12, fontWeight: 600, marginBottom: 6, color: '#475569' }}>Nhận xét</p>
            <textarea
              style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 13, resize: 'vertical', minHeight: 80, outline: 'none' }}
              value={noiDung} onChange={e => setNoiDung(e.target.value)}
            />
          </div>
          <div>
            <p style={{ fontSize: 12, fontWeight: 600, marginBottom: 8, color: '#475569' }}>Tags</p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {TAGS.map(t => (
                <button key={t} type='button' onClick={() => toggleTag(t)}
                  style={{ padding: '4px 12px', borderRadius: 20, fontSize: 12, border: '1px solid', cursor: 'pointer',
                    background: tag.includes(t) ? '#eef2ff' : 'white', color: tag.includes(t) ? '#6366f1' : '#64748b',
                    borderColor: tag.includes(t) ? '#6366f1' : '#e2e8f0' }}>
                  {t}
                </button>
              ))}
            </div>
          </div>
          {msg && <p style={{ fontSize: 12, color: msg.startsWith('✅') ? '#059669' : '#dc2626' }}>{msg}</p>}
          <div style={{ display: 'flex', gap: 8 }}>
            <UserButton size='sm' onClick={saveEdit} disabled={loading}>Lưu</UserButton>
            <UserButton size='sm' variant='ghost' onClick={() => setEditing(false)}>Hủy</UserButton>
          </div>
        </div>
      ) : (
        <>
          <div style={{ marginBottom: 10 }}>
            <StarRating value={Number(review.diem)} />
          </div>
          {review.noi_dung && (
            <p style={{ fontSize: 13, color: '#334155', lineHeight: 1.6, marginBottom: 10 }}>{review.noi_dung}</p>
          )}
          {Array.isArray(review.tag) && review.tag.length > 0 && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
              {review.tag.map((t: string) => (
                <span key={t} style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, background: '#eef2ff', color: '#6366f1', fontWeight: 600 }}>{t}</span>
              ))}
            </div>
          )}
          {msg && <p style={{ fontSize: 12, color: '#dc2626', marginBottom: 8 }}>{msg}</p>}
          <div style={{ display: 'flex', gap: 8 }}>
            {!deadlinePassed && review.trang_thai !== 'an' && (
              <UserButton size='sm' variant='secondary' onClick={() => setEditing(true)}>
                <Edit2 size={12} /> Sửa
              </UserButton>
            )}
            <UserButton size='sm' variant='danger' onClick={handleDelete} disabled={loading}>
              <Trash2 size={12} /> Xóa
            </UserButton>
          </div>
        </>
      )}
    </Card>
  )
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)

  function load() {
    setLoading(true)
    customerGet<Row[]>('/reviews').then(setReviews).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  return (
    <>
      <SectionHeader
        title='Đánh giá của tôi'
        subtitle='Quản lý các đánh giá bạn đã gửi cho chuyên gia.'
        action={<Link href='/user/reviews/new'><UserButton size='sm'><Star size={14} /> Viết đánh giá</UserButton></Link>}
      />

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>Đang tải...</div>
      ) : reviews.length === 0 ? (
        <UserEmptyState
          icon={MessageCircle}
          title='Chưa có đánh giá nào'
          description='Sau khi hoàn thành buổi tư vấn, bạn có thể gửi đánh giá cho chuyên gia.'
        />
      ) : (
        <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
          {reviews.map(r => <ReviewCard key={r.id} review={r} onUpdated={load} />)}
        </div>
      )}
    </>
  )
}
