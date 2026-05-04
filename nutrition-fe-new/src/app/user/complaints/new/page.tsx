'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, AlertCircle } from 'lucide-react'
import { Card, UserButton, UserNotice, SectionHeader } from '@/components/user/user-ui'
import { customerGet, customerPost } from '@/lib/customer-api'

type Row = Record<string, any>

const TYPES = [
  { value: 'booking', label: '📅 Lịch hẹn — Chuyên gia không tham gia, lỗi tư vấn' },
  { value: 'thanh_toan', label: '💳 Thanh toán — Trừ tiền nhưng chưa kích hoạt, cần hoàn tiền' },
  { value: 'danh_gia', label: '⭐ Đánh giá — Cần gỡ/sửa đánh giá bị tranh chấp' },
  { value: 'khac', label: '🔖 Khác' },
]

function NewComplaintContent() {
  const params = useSearchParams()
  const router = useRouter()
  const bookingId = params.get('bookingId')

  const [loai, setLoai] = useState(bookingId ? 'booking' : '')
  const [tieu_de, setTieuDe] = useState('')
  const [noi_dung, setNoiDung] = useState('')
  const [booking, setBooking] = useState<Row | null>(null)
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')
  const [msgTone, setMsgTone] = useState<'success' | 'error'>('error')

  useEffect(() => {
    if (!bookingId) return
    customerGet<{ booking: Row }>(`/bookings/${bookingId}`)
      .then(d => setBooking(d.booking))
      .catch(() => {})
  }, [bookingId])

  async function submit() {
    if (!loai) { setMsg('Vui lòng chọn loại khiếu nại'); setMsgTone('error'); return }
    if (!noi_dung.trim()) { setMsg('Vui lòng nhập nội dung khiếu nại'); setMsgTone('error'); return }
    setLoading(true)
    try {
      const result = await customerPost<Row>('/complaints', {
        loai,
        tieu_de: tieu_de.trim() || noi_dung.trim().slice(0, 80),
        noi_dung: noi_dung.trim(),
        doi_tuong_id: bookingId ? Number(bookingId) : undefined,
      })
      setMsg(`✅ Khiếu nại đã được gửi! Mã ticket: ${result.ma_ticket}`)
      setMsgTone('success')
      setTimeout(() => router.push(`/user/complaints/${result.id}`), 2000)
    } catch (e: any) {
      setMsg(e.message ?? 'Gửi khiếu nại thất bại')
      setMsgTone('error')
    } finally { setLoading(false) }
  }

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <Link href='/user/complaints'>
          <UserButton variant='ghost' size='sm'><ArrowLeft size={14} /> Quay lại</UserButton>
        </Link>
      </div>

      {booking && (
        <div style={{ padding: '12px 16px', background: '#eff6ff', borderRadius: 12, marginBottom: 20, border: '1px solid #bfdbfe' }}>
          <p style={{ fontSize: 12, color: '#2563eb', fontWeight: 700, marginBottom: 4 }}>Khiếu nại liên quan đến booking</p>
          <p style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>{booking.expert_name} · {booking.ma_lich_hen}</p>
        </div>
      )}

      <Card>
        <div style={{ display: 'grid', gap: 20 }}>
          <div>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 10 }}>Loại khiếu nại *</p>
            <div style={{ display: 'grid', gap: 8 }}>
              {TYPES.map(t => (
                <label key={t.value} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 10, border: '1px solid', cursor: 'pointer', transition: 'all .2s',
                  borderColor: loai === t.value ? '#6366f1' : '#e2e8f0', background: loai === t.value ? '#eef2ff' : 'white' }}>
                  <input type='radio' name='loai' value={t.value} checked={loai === t.value} onChange={() => setLoai(t.value)} style={{ display: 'none' }} />
                  <div style={{ width: 16, height: 16, borderRadius: '50%', border: `2px solid ${loai === t.value ? '#6366f1' : '#cbd5e1'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {loai === t.value && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#6366f1' }} />}
                  </div>
                  <span style={{ fontSize: 13, color: loai === t.value ? '#4338ca' : '#475569', fontWeight: loai === t.value ? 600 : 400 }}>{t.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 8 }}>Tiêu đề (tuỳ chọn)</p>
            <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 8 }}>Bỏ trống để tự động lấy từ nội dung</p>
            <input
              style={{ width: '100%', padding: '10px 14px', borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 13, outline: 'none', background: 'white' }}
              value={tieu_de} onChange={e => setTieuDe(e.target.value)}
              placeholder='VD: Chuyên gia không tham gia buổi tư vấn lúc 10h ngày 02/05'
            />
          </div>

          <div>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 8 }}>Nội dung khiếu nại *</p>
            <textarea
              style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 13, resize: 'vertical', minHeight: 140, outline: 'none', lineHeight: 1.7 }}
              placeholder="Mô tả chi tiết vấn đề bạn gặp phải: thời gian, diễn biến, ảnh hưởng..."
              value={noi_dung} onChange={e => setNoiDung(e.target.value)}
            />
          </div>

          {msg && <UserNotice tone={msgTone}>{msg}</UserNotice>}

          <div style={{ display: 'flex', gap: 12 }}>
            <UserButton onClick={submit} disabled={loading || !loai}>
              <AlertCircle size={14} /> {loading ? 'Đang gửi...' : 'Gửi khiếu nại'}
            </UserButton>
            <Link href='/user/complaints'><UserButton variant='ghost'>Hủy</UserButton></Link>
          </div>
        </div>
      </Card>
    </>
  )
}

export default function NewComplaintPage() {
  return (
    <>
      <SectionHeader title='Tạo khiếu nại mới' subtitle='Gửi khiếu nại và đội ngũ hỗ trợ sẽ phản hồi trong vòng 24h.' />
      <Suspense><NewComplaintContent /></Suspense>
    </>
  )
}
