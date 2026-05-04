'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Star, ArrowLeft } from 'lucide-react'
import { Card, UserButton, UserNotice, SectionHeader } from '@/components/user/user-ui'
import { customerGet, customerPost } from '@/lib/customer-api'

type Row = Record<string, any>
const TAGS = ['Đúng giờ', 'Dễ hiểu', 'Hiệu quả', 'Nhiệt tình', 'Cần cải thiện']

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0)
  return (
    <div style={{ display: 'flex', gap: 6 }}>
      {[1, 2, 3, 4, 5].map(s => (
        <button key={s} type='button' onClick={() => onChange(s)}
          onMouseEnter={() => setHover(s)} onMouseLeave={() => setHover(0)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
          <Star size={32} fill={(hover || value) >= s ? '#f59e0b' : 'none'} color={(hover || value) >= s ? '#f59e0b' : '#d1d5db'} />
        </button>
      ))}
    </div>
  )
}

function LABELS(n: number) {
  return ['', 'Rất tệ', 'Tệ', 'Bình thường', 'Tốt', 'Xuất sắc'][n] ?? ''
}

function NewReviewContent() {
  const params = useSearchParams()
  const router = useRouter()
  const bookingId = params.get('bookingId')

  const [booking, setBooking] = useState<Row | null>(null)
  const [diem, setDiem] = useState(0)
  const [noiDung, setNoiDung] = useState('')
  const [tag, setTag] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')
  const [msgTone, setMsgTone] = useState<'success' | 'error'>('error')

  useEffect(() => {
    if (!bookingId) return
    customerGet<{ booking: Row }>(`/bookings/${bookingId}`)
      .then(d => setBooking(d.booking))
      .catch(() => {})
  }, [bookingId])

  function toggleTag(t: string) {
    setTag(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t])
  }

  async function submit() {
    if (!bookingId) { setMsg('Thiếu booking ID'); setMsgTone('error'); return }
    if (diem < 1) { setMsg('Vui lòng chọn điểm đánh giá'); setMsgTone('error'); return }
    setLoading(true)
    try {
      await customerPost('/reviews', { lich_hen_id: Number(bookingId), diem, noi_dung: noiDung, tag })
      setMsg('🎉 Cảm ơn bạn đã đánh giá! Chuyên gia sẽ nhận được phản hồi của bạn.')
      setMsgTone('success')
      setTimeout(() => router.push('/user/reviews'), 2000)
    } catch (e: any) {
      setMsg(e.message ?? 'Gửi đánh giá thất bại')
      setMsgTone('error')
    } finally { setLoading(false) }
  }

  if (!bookingId) {
    return (
      <UserNotice tone='warning'>
        Vui lòng mở đánh giá từ <Link href='/user/bookings' style={{ fontWeight: 700, textDecoration: 'underline' }}>Lịch hẹn</Link> của bạn.
      </UserNotice>
    )
  }

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <Link href='/user/bookings'>
          <UserButton variant='ghost' size='sm'><ArrowLeft size={14} /> Quay lại lịch hẹn</UserButton>
        </Link>
      </div>

      {booking && (
        <Card>
          <p style={{ fontSize: 12, color: '#94a3b8' }}>Đánh giá buổi tư vấn với</p>
          <p style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', marginTop: 4 }}>{booking.expert_name}</p>
          <p style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>{booking.ten_goi} · {booking.ma_lich_hen}</p>
        </Card>
      )}

      <Card>
        <div style={{ display: 'grid', gap: 24 }}>
          {/* Điểm */}
          <div>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 12 }}>Điểm đánh giá *</p>
            <StarRating value={diem} onChange={setDiem} />
            {diem > 0 && (
              <p style={{ marginTop: 8, fontSize: 13, fontWeight: 600, color: '#f59e0b' }}>{LABELS(diem)}</p>
            )}
          </div>

          {/* Tags */}
          <div>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 10 }}>Tags (tuỳ chọn)</p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {TAGS.map(t => (
                <button key={t} type='button' onClick={() => toggleTag(t)}
                  style={{ padding: '6px 14px', borderRadius: 20, fontSize: 12, border: '1px solid', cursor: 'pointer', transition: 'all .2s',
                    background: tag.includes(t) ? '#eef2ff' : 'white', color: tag.includes(t) ? '#6366f1' : '#64748b',
                    borderColor: tag.includes(t) ? '#6366f1' : '#e2e8f0', fontWeight: tag.includes(t) ? 700 : 400 }}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Nội dung */}
          <div>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 10 }}>Nhận xét chi tiết</p>
            <textarea
              style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 14, resize: 'vertical', minHeight: 120, outline: 'none', lineHeight: 1.6 }}
              placeholder="Chia sẻ trải nghiệm của bạn về buổi tư vấn..."
              value={noiDung} onChange={e => setNoiDung(e.target.value)}
            />
          </div>

          {msg && <UserNotice tone={msgTone}>{msg}</UserNotice>}

          <div style={{ display: 'flex', gap: 12 }}>
            <UserButton onClick={submit} disabled={loading || diem === 0}>
              <Star size={14} /> {loading ? 'Đang gửi...' : 'Gửi đánh giá'}
            </UserButton>
            <Link href='/user/bookings'><UserButton variant='ghost'>Để sau</UserButton></Link>
          </div>
        </div>
      </Card>
    </>
  )
}

export default function NewReviewPage() {
  return (
    <>
      <SectionHeader title='Đánh giá chuyên gia' subtitle='Chia sẻ trải nghiệm để giúp chuyên gia cải thiện chất lượng dịch vụ.' />
      <Suspense><NewReviewContent /></Suspense>
    </>
  )
}
