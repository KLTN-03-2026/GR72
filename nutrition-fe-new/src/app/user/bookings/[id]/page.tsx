'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Clock, User, Package, CreditCard, CheckCircle, ArrowLeft, Star } from 'lucide-react'
import { Card, UserButton, UserNotice, StatusBadge, money } from '@/components/user/user-ui'
import { customerGet } from '@/lib/customer-api'

type Row = Record<string, any>

function formatDateTime(iso: string) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('vi-VN', { dateStyle: 'medium', timeStyle: 'short' })
}

const TIMELINE_LABELS: Record<string, string> = {
  customer_create_booking: 'Khách hàng đặt lịch',
  customer_reschedule: 'Đổi lịch',
  customer_cancel: 'Hủy lịch',
  customer_checkin: 'Check-in',
  payment_success: 'Thanh toán thành công',
  expert_confirm: 'Chuyên gia xác nhận',
  expert_complete: 'Hoàn thành tư vấn',
  expert_cancel: 'Chuyên gia hủy lịch',
  admin_cancel: 'Admin hủy lịch',
}

export default function BookingDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [data, setData] = useState<{ booking: Row; timeline: Row[]; payment: Row | null } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    customerGet<{ booking: Row; timeline: Row[]; payment: Row | null }>(`/bookings/${id}`)
      .then(setData)
      .catch(e => setError(e.message ?? 'Không thể tải thông tin'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8' }}>Đang tải...</div>
  if (error) return <UserNotice tone='error'>{error}</UserNotice>
  if (!data) return null

  const { booking, timeline, payment } = data
  const canReview = booking.trang_thai === 'hoan_thanh'

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <Link href='/user/bookings'>
          <UserButton variant='ghost' size='sm'><ArrowLeft size={14} /> Quay lại</UserButton>
        </Link>
        <div>
          <p style={{ fontSize: 12, color: '#94a3b8' }}>Mã lịch hẹn</p>
          <p style={{ fontSize: 16, fontWeight: 800, color: '#6366f1', fontFamily: 'monospace' }}>{booking.ma_lich_hen}</p>
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <StatusBadge value={booking.trang_thai} />
        </div>
      </div>

      <div style={{ display: 'grid', gap: 20, gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
        {/* Thông tin chính */}
        <Card>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: '#64748b', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '.06em' }}>
            Thông tin lịch hẹn
          </h3>
          <div style={{ display: 'grid', gap: 12 }}>
            {[
              { icon: Package, label: 'Gói dịch vụ', value: booking.ten_goi },
              { icon: User, label: 'Chuyên gia', value: booking.expert_name },
              { icon: Clock, label: 'Thời gian', value: `${formatDateTime(booking.bat_dau_luc)} → ${formatDateTime(booking.ket_thuc_luc)}` },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: '#eef2ff', color: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={15} />
                </div>
                <div>
                  <p style={{ fontSize: 12, color: '#94a3b8' }}>{label}</p>
                  <p style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>{value || '—'}</p>
                </div>
              </div>
            ))}
            {booking.muc_dich && (
              <div style={{ padding: '10px 14px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>Mục đích tư vấn</p>
                <p style={{ fontSize: 13, color: '#334155' }}>{booking.muc_dich}</p>
              </div>
            )}
            {booking.ly_do_huy && (
              <div style={{ padding: '10px 14px', background: '#fff5f5', borderRadius: 8, border: '1px solid #fecaca' }}>
                <p style={{ fontSize: 12, color: '#ef4444', marginBottom: 4 }}>Lý do hủy</p>
                <p style={{ fontSize: 13, color: '#334155' }}>{booking.ly_do_huy}</p>
              </div>
            )}
          </div>
        </Card>

        {/* Thanh toán */}
        {payment && (
          <Card>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#64748b', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '.06em' }}>
              Thanh toán
            </h3>
            <div style={{ display: 'grid', gap: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: '#64748b' }}>Số tiền</span>
                <span style={{ fontWeight: 700, color: '#0f172a' }}>{money(payment.so_tien)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: '#64748b' }}>Trạng thái</span>
                <StatusBadge value={payment.trang_thai} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: '#64748b' }}>Cổng TT</span>
                <span style={{ fontWeight: 600 }}>{payment.cong_thanh_toan?.toUpperCase() ?? '—'}</span>
              </div>
              {payment.trang_thai === 'cho_thanh_toan' && payment.payment_url && (
                <a href={payment.payment_url} target='_blank' rel='noreferrer'>
                  <UserButton style={{ width: '100%' }}>
                    <CreditCard size={14} /> Thanh toán ngay
                  </UserButton>
                </a>
              )}
            </div>
          </Card>
        )}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 12, marginTop: 20, flexWrap: 'wrap' }}>
        {canReview && (
          <Link href={`/user/reviews/new?bookingId=${booking.id}`}>
            <UserButton><Star size={14} /> Đánh giá chuyên gia</UserButton>
          </Link>
        )}
        <Link href={`/user/complaints/new?bookingId=${booking.id}`}>
          <UserButton variant='ghost'>Khiếu nại</UserButton>
        </Link>
      </div>

      {/* Timeline */}
      {timeline.length > 0 && (
        <Card>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: '#64748b', marginBottom: 20, textTransform: 'uppercase', letterSpacing: '.06em' }}>
            Lịch sử trạng thái
          </h3>
          <div style={{ position: 'relative', paddingLeft: 28 }}>
            <div style={{ position: 'absolute', left: 8, top: 0, bottom: 0, width: 2, background: '#e2e8f0' }} />
            {timeline.map((item, i) => (
              <div key={item.id ?? i} style={{ position: 'relative', marginBottom: 20 }}>
                <div style={{ position: 'absolute', left: -24, top: 2, width: 12, height: 12, borderRadius: '50%', background: '#6366f1', border: '2px solid white', boxShadow: '0 0 0 2px #e0e7ff' }} />
                <p style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{TIMELINE_LABELS[item.su_kien] ?? item.su_kien}</p>
                <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>
                  {formatDateTime(item.tao_luc)}
                  {item.trang_thai_sau && ` → ${item.trang_thai_sau}`}
                </p>
                {item.ghi_chu && <p style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>{item.ghi_chu}</p>}
              </div>
            ))}
          </div>
        </Card>
      )}
    </>
  )
}
