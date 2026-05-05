'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import {
  CalendarCheck, Clock, User, ChevronRight, Search, Filter,
  Star, CheckCircle, XCircle, RotateCcw, LogIn,
} from 'lucide-react'
import {
  SectionHeader, Card, UserStatCard, UserButton, UserNotice,
  UserEmptyState, StatusBadge, money,
} from '@/components/user/user-ui'
import { customerGet, customerPatch, customerPost, customerPostWithInit } from '@/lib/customer-api'

type Row = Record<string, any>

const STATUSES = [
  { value: '', label: 'Tất cả' },
  { value: 'cho_xac_nhan', label: 'Chờ xác nhận' },
  { value: 'cho_thanh_toan', label: 'Chờ thanh toán' },
  { value: 'da_xac_nhan', label: 'Đã xác nhận' },
  { value: 'da_checkin', label: 'Đã check-in' },
  { value: 'dang_tu_van', label: 'Đang tư vấn' },
  { value: 'hoan_thanh', label: 'Hoàn thành' },
  { value: 'da_huy', label: 'Đã hủy' },
]

function formatDateTime(iso: string) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })
}

function BookingCard({ booking, onAction }: { booking: Row; onAction: () => void }) {
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')
  const [showCancelForm, setShowCancelForm] = useState(false)
  const [showRescheduleForm, setShowRescheduleForm] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [newTime, setNewTime] = useState('')

  const canCancel = ['cho_xac_nhan', 'cho_thanh_toan', 'da_xac_nhan'].includes(booking.trang_thai)
  const canReschedule = ['cho_xac_nhan', 'da_xac_nhan'].includes(booking.trang_thai)
  const canCheckin = booking.trang_thai === 'da_xac_nhan'
  const canReview = booking.trang_thai === 'hoan_thanh' && !booking.da_danh_gia

  async function handleCancel() {
    if (!cancelReason.trim()) { setMsg('Vui lòng nhập lý do hủy'); return }
    setLoading(true)
    try {
      await customerPatch(`/bookings/${booking.id}/cancel`, { ly_do: cancelReason })
      setMsg('✅ Đã hủy lịch thành công. Lượt đã được hoàn.')
      setShowCancelForm(false)
      onAction()
    } catch (e: any) { setMsg(e.message ?? 'Lỗi') } finally { setLoading(false) }
  }

  async function handleReschedule() {
    if (!newTime) { setMsg('Vui lòng chọn thời gian mới'); return }
    setLoading(true)
    try {
      await customerPatch(`/bookings/${booking.id}/reschedule`, { start_at: new Date(newTime).toISOString() })
      setMsg('✅ Đã đổi lịch thành công.')
      setShowRescheduleForm(false)
      onAction()
    } catch (e: any) { setMsg(e.message ?? 'Lỗi') } finally { setLoading(false) }
  }

  async function handleCheckin() {
    setLoading(true)
    try {
      await customerPost(`/bookings/${booking.id}/check-in`)
      setMsg('✅ Check-in thành công!')
      onAction()
    } catch (e: any) { setMsg(e.message ?? 'Lỗi') } finally { setLoading(false) }
  }

  return (
    <Card hover>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div>
          <p style={{ fontSize: 13, color: '#6366f1', fontWeight: 700, fontFamily: 'monospace' }}>{booking.ma_lich_hen}</p>
          <p style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginTop: 2 }}>{booking.ten_goi}</p>
        </div>
        <StatusBadge value={booking.trang_thai} />
      </div>

      <div style={{ display: 'grid', gap: 6, marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#475569' }}>
          <User size={14} /><span><strong>{booking.expert_name}</strong></span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#475569' }}>
          <Clock size={14} /><span>{formatDateTime(booking.bat_dau_luc)} → {formatDateTime(booking.ket_thuc_luc)}</span>
        </div>
        {booking.thanh_toan_so_tien && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#475569' }}>
            <CheckCircle size={14} /><span>Thanh toán: <strong>{money(booking.thanh_toan_so_tien)}</strong></span>
          </div>
        )}
      </div>

      {msg && <p style={{ fontSize: 12, color: msg.startsWith('✅') ? '#059669' : '#dc2626', marginBottom: 10 }}>{msg}</p>}

      {showCancelForm && (
        <div style={{ marginBottom: 12, padding: 12, background: '#fff5f5', borderRadius: 10, border: '1px solid #fecaca' }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: '#dc2626', marginBottom: 8 }}>Lý do hủy lịch *</p>
          <textarea
            style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #fecaca', fontSize: 13, resize: 'vertical', minHeight: 72 }}
            value={cancelReason} onChange={e => setCancelReason(e.target.value)}
            placeholder="Nhập lý do hủy lịch..."
          />
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <UserButton size='sm' variant='danger' onClick={handleCancel} disabled={loading}>Xác nhận hủy</UserButton>
            <UserButton size='sm' variant='ghost' onClick={() => setShowCancelForm(false)}>Thôi</UserButton>
          </div>
        </div>
      )}

      {showRescheduleForm && (
        <div style={{ marginBottom: 12, padding: 12, background: '#eff6ff', borderRadius: 10, border: '1px solid #bfdbfe' }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: '#2563eb', marginBottom: 8 }}>Chọn thời gian mới *</p>
          <input
            type="datetime-local"
            style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #bfdbfe', fontSize: 13 }}
            value={newTime} onChange={e => setNewTime(e.target.value)}
          />
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <UserButton size='sm' onClick={handleReschedule} disabled={loading}>Đổi lịch</UserButton>
            <UserButton size='sm' variant='ghost' onClick={() => setShowRescheduleForm(false)}>Thôi</UserButton>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <Link href={`/user/bookings/${booking.id}`}>
          <UserButton size='sm' variant='secondary'>Chi tiết <ChevronRight size={12} /></UserButton>
        </Link>
        {canCheckin && <UserButton size='sm' onClick={handleCheckin} disabled={loading}><LogIn size={12} /> Check-in</UserButton>}
        {canReschedule && !showRescheduleForm && (
          <UserButton size='sm' variant='secondary' onClick={() => { setShowRescheduleForm(true); setShowCancelForm(false) }}>
            <RotateCcw size={12} /> Đổi lịch
          </UserButton>
        )}
        {canCancel && !showCancelForm && (
          <UserButton size='sm' variant='danger' onClick={() => { setShowCancelForm(true); setShowRescheduleForm(false) }}>
            <XCircle size={12} /> Hủy lịch
          </UserButton>
        )}
        {canReview && (
          <Link href={`/user/reviews/new?bookingId=${booking.id}`}>
            <UserButton size='sm' variant='secondary'><Star size={12} /> Đánh giá</UserButton>
          </Link>
        )}
      </div>
    </Card>
  )
}

export default function MyBookingsPage() {
  const searchParams = useSearchParams()
  const packagePurchaseId = searchParams.get('packagePurchaseId')
  const expertId = searchParams.get('expertId')

  const [bookings, setBookings] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [error, setError] = useState('')

  const [slots, setSlots] = useState<Row[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [startAt, setStartAt] = useState('')
  const [mucDich, setMucDich] = useState('')
  const [bookingMessage, setBookingMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const idempotencyKey = useMemo(() => {
    if (!packagePurchaseId || !expertId || !startAt) return ''
    return `booking:${packagePurchaseId}:${expertId}:${startAt}`
  }, [packagePurchaseId, expertId, startAt])

  function loadBookings() {
    setLoading(true)
    const params = new URLSearchParams()
    if (statusFilter) params.set('status', statusFilter)
    if (search.trim()) params.set('search', search.trim())
    customerGet<Row[]>(`/bookings?${params}`)
      .then(setBookings)
      .catch(e => setError(e.message ?? 'Lỗi tải lịch hẹn'))
      .finally(() => setLoading(false))
  }

  async function loadSlots() {
    if (!packagePurchaseId || !expertId) return
    setLoadingSlots(true)
    try {
      const data = await customerGet<Row>(`/experts/${expertId}/available-slots?packagePurchaseId=${packagePurchaseId}&days=14`)
      const nextSlots = data.slots ?? []
      setSlots(nextSlots)
      setStartAt(nextSlots.length ? String(nextSlots[0].start_at) : '')
    } catch (e: any) {
      setBookingMessage(e.message ?? 'Không tải được slot trống')
    } finally {
      setLoadingSlots(false)
    }
  }

  async function handleCreateBooking() {
    if (!packagePurchaseId || !expertId || !startAt) return
    setSubmitting(true)
    setBookingMessage('')
    try {
      const result = await customerPostWithInit<Row>(
        '/bookings',
        {
          package_purchase_id: Number(packagePurchaseId),
          expert_id: Number(expertId),
          start_at: startAt,
          muc_dich: mucDich,
          idempotency_key: idempotencyKey,
        },
        { headers: { 'x-idempotency-key': idempotencyKey } },
      )
      setBookingMessage(`✅ Đặt lịch thành công: ${result.booking?.ma_lich_hen ?? ''}`)
      loadBookings()
    } catch (e: any) {
      setBookingMessage(e.message ?? 'Tạo booking thất bại')
    } finally {
      setSubmitting(false)
    }
  }

  useEffect(() => { loadBookings() }, [statusFilter])
  useEffect(() => {
    if (packagePurchaseId && expertId) {
      loadSlots().catch(() => undefined)
    }
  }, [packagePurchaseId, expertId])

  const stats = {
    total: bookings.length,
    completed: bookings.filter(b => b.trang_thai === 'hoan_thanh').length,
    upcoming: bookings.filter(b => ['da_xac_nhan', 'cho_xac_nhan'].includes(b.trang_thai)).length,
  }

  return (
    <>
      <SectionHeader
        title="Lịch hẹn của tôi"
        subtitle="Theo dõi, đổi lịch hoặc hủy lịch tư vấn với chuyên gia."
      />

      {packagePurchaseId && expertId && (
        <Card>
          <div style={{ display: 'grid', gap: 12 }}>
            <p style={{ margin: 0, fontWeight: 700, color: '#0f172a' }}>Đặt lịch mới theo gói/chuyên gia đã chọn</p>
            <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>Gói #{packagePurchaseId} • Chuyên gia #{expertId}</p>
            {bookingMessage ? <UserNotice tone={bookingMessage.startsWith('✅') ? 'success' : 'error'}>{bookingMessage}</UserNotice> : null}
            <div style={{ display: 'grid', gap: 10, gridTemplateColumns: '1fr 1fr auto', alignItems: 'end' }}>
              <div>
                <p style={{ margin: '0 0 6px', fontSize: 12, color: '#475569', fontWeight: 600 }}>Khung giờ khả dụng</p>
                <select
                  value={startAt}
                  onChange={(e) => setStartAt(e.target.value)}
                  disabled={loadingSlots || !slots.length}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 13 }}
                >
                  {!slots.length ? <option value=''>{loadingSlots ? 'Đang tải slot...' : 'Không có slot trống'}</option> : null}
                  {slots.map((slot) => (
                    <option key={slot.start_at} value={slot.start_at}>{slot.date} | {slot.start_time} - {slot.end_time}</option>
                  ))}
                </select>
              </div>
              <div>
                <p style={{ margin: '0 0 6px', fontSize: 12, color: '#475569', fontWeight: 600 }}>Mục đích tư vấn</p>
                <input
                  value={mucDich}
                  onChange={(e) => setMucDich(e.target.value)}
                  placeholder='Ví dụ: giảm mỡ và cải thiện giấc ngủ'
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 13 }}
                />
              </div>
              <UserButton onClick={handleCreateBooking} disabled={submitting || !startAt || !slots.length}>
                {submitting ? 'Đang tạo...' : 'Đặt lịch ngay'}
              </UserButton>
            </div>
          </div>
        </Card>
      )}

      <div className='grid-stats'>
        <UserStatCard label='Tổng lịch hẹn' value={String(stats.total)} icon={CalendarCheck} tone='blue' />
        <UserStatCard label='Sắp diễn ra' value={String(stats.upcoming)} icon={Clock} tone='orange' />
        <UserStatCard label='Đã hoàn thành' value={String(stats.completed)} icon={CheckCircle} tone='green' />
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1 1 220px' }}>
          <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input
            style={{ width: '100%', paddingLeft: 36, paddingRight: 12, paddingTop: 9, paddingBottom: 9, borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 13, outline: 'none' }}
            placeholder="Tìm theo mã, chuyên gia, gói..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && loadBookings()}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Filter size={15} style={{ color: '#94a3b8' }} />
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 13, outline: 'none', background: 'white' }}
          >
            {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
        <UserButton size='sm' variant='secondary' onClick={loadBookings}>Tìm kiếm</UserButton>
      </div>

      {error && <UserNotice tone='error'>{error}</UserNotice>}

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>Đang tải...</div>
      ) : bookings.length === 0 ? (
        <UserEmptyState
          icon={CalendarCheck}
          title='Chưa có lịch hẹn nào'
          description='Bạn chưa đặt lịch tư vấn. Hãy chọn gói dịch vụ và đặt lịch ngay!'
          action={<Link href='/user/my-packages'><UserButton>Chọn chuyên gia →</UserButton></Link>}
        />
      ) : (
        <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))' }}>
          {bookings.map(b => <BookingCard key={b.id} booking={b} onAction={loadBookings} />)}
        </div>
      )}
    </>
  )
}
