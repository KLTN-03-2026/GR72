'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Suspense, useEffect, useMemo, useState } from 'react'
import { Users, Star, CalendarCheck } from 'lucide-react'
import { SectionHeader, UserStatCard, UserButton, UserNotice, UserEmptyState } from '@/components/user/user-ui'
import { customerGet, customerPostWithInit } from '@/lib/customer-api'

type Row = Record<string, any>

function ExpertsContent() {
  const params = useSearchParams()
  const packagePurchaseId = params.get('packagePurchaseId')

  const [rows, setRows] = useState<Row[]>([])
  const [message, setMessage] = useState('')

  // Selected expert & booking form
  const [selectedExpert, setSelectedExpert] = useState<Row | null>(null)
  const [slots, setSlots] = useState<Row[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [startAt, setStartAt] = useState('')
  const [mucDich, setMucDich] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [bookingMsg, setBookingMsg] = useState('')

  const idempotencyKey = useMemo(() => {
    if (!packagePurchaseId || !selectedExpert || !startAt) return ''
    return `booking:${packagePurchaseId}:${selectedExpert.expert_id}:${startAt}`
  }, [packagePurchaseId, selectedExpert, startAt])

  useEffect(() => {
    if (!packagePurchaseId) return
    customerGet<Row[]>(`/my-packages/${packagePurchaseId}/experts`)
      .then(setRows)
      .catch((e) => setMessage(e.message))
  }, [packagePurchaseId])

  async function selectExpert(expert: Row) {
    setSelectedExpert(expert)
    setBookingMsg('')
    setStartAt('')
    setSlots([])
    setLoadingSlots(true)
    try {
      const data = await customerGet<Row>(`/experts/${expert.expert_id}/available-slots?packagePurchaseId=${packagePurchaseId}&days=14`)
      const nextSlots = data.slots ?? []
      setSlots(nextSlots)
      setStartAt(nextSlots.length ? String(nextSlots[0].start_at) : '')
    } catch (e: any) {
      setBookingMsg(e.message ?? 'Không tải được slot trống')
    } finally {
      setLoadingSlots(false)
    }
  }

  async function handleBook() {
    if (!packagePurchaseId || !selectedExpert || !startAt) return
    setSubmitting(true)
    setBookingMsg('')
    try {
      const result = await customerPostWithInit<Row>(
        '/bookings',
        {
          package_purchase_id: Number(packagePurchaseId),
          expert_id: Number(selectedExpert.expert_id),
          start_at: startAt,
          muc_dich: mucDich,
          idempotency_key: idempotencyKey,
        },
        { headers: { 'x-idempotency-key': idempotencyKey } },
      )
      setBookingMsg(`✅ Đặt lịch thành công: ${result.booking?.ma_lich_hen ?? ''}`)
      setSelectedExpert(null)
    } catch (e: any) {
      setBookingMsg(e.message ?? 'Tạo booking thất bại')
    } finally {
      setSubmitting(false)
    }
  }

  const stats = useMemo(() => ({
    total: rows.length,
    receiving: rows.filter((r) => r.nhan_booking).length,
  }), [rows])

  if (!packagePurchaseId) {
    return (
      <>
        <SectionHeader title='Chọn chuyên gia' subtitle='Vui lòng chọn gói đã mua trước khi tìm chuyên gia.' />
        <UserNotice tone='warning'>
          Bạn cần chọn một gói đã mua trước.{' '}
          <Link href='/user/my-packages' style={{ fontWeight: 700, textDecoration: 'underline' }}>Đi tới gói của tôi</Link>
        </UserNotice>
      </>
    )
  }

  return (
    <>
      <SectionHeader
        title='Chọn chuyên gia'
        subtitle='Danh sách chuyên gia thuộc gói đã mua, sẵn sàng nhận lịch tư vấn.'
        action={<Link href='/user/my-packages'><UserButton variant='secondary'>Đổi gói</UserButton></Link>}
      />

      {message && <UserNotice tone='error'>{message}</UserNotice>}
      {bookingMsg && !selectedExpert && (
        <UserNotice tone={bookingMsg.startsWith('✅') ? 'success' : 'error'}>{bookingMsg}</UserNotice>
      )}

      <div className='grid-stats'>
        <UserStatCard label='Chuyên gia trong gói' value={String(stats.total)} icon={Users} tone='blue' />
        <UserStatCard label='Đang nhận lịch' value={String(stats.receiving)} icon={CalendarCheck} tone='green' />
      </div>

      {rows.length === 0 ? (
        <UserEmptyState icon={Users} title='Chưa có chuyên gia' description='Gói này chưa có chuyên gia phù hợp. Vui lòng thử gói khác.' />
      ) : (
        <div className='grid-cards'>
          {rows.map((row) => {
            const isSelected = selectedExpert?.expert_id === row.expert_id
            return (
              <div key={row.expert_id} className='expert-card' style={isSelected ? { outline: '2px solid #6366f1', outlineOffset: 2 } : undefined}>
                <div className='expert-card__avatar'>
                  {row.anh_dai_dien_url
                    ? <img src={row.anh_dai_dien_url} alt={row.ho_ten} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                    : (row.ho_ten ?? 'E').charAt(0).toUpperCase()
                  }
                </div>
                <div className='expert-card__name'>{row.ho_ten}</div>
                <div className='expert-card__email'>{row.email}</div>
                {row.chuyen_mon && <div className='expert-card__specialty'>{row.chuyen_mon}</div>}
                <div className='expert-card__stats'>
                  <div>
                    <div className='expert-card__stat-value' style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                      <Star size={14} style={{ color: '#f59e0b' }} />
                      {Number(row.diem_danh_gia_trung_binh ?? 0).toFixed(1)}
                    </div>
                    <div className='expert-card__stat-label'>{row.so_luot_danh_gia ?? 0} đánh giá</div>
                  </div>
                  <div>
                    <div className='expert-card__stat-value'>{row.so_booking_hoan_thanh ?? 0}</div>
                    <div className='expert-card__stat-label'>Hoàn thành</div>
                  </div>
                </div>

                {/* Booking form inline khi được chọn */}
                {isSelected && (
                  <div style={{ marginTop: 12, padding: 12, background: '#f8faff', borderRadius: 10, border: '1px solid #e0e7ff' }}>
                    {bookingMsg && (
                      <p style={{ fontSize: 12, color: bookingMsg.startsWith('✅') ? '#059669' : '#dc2626', marginBottom: 8 }}>{bookingMsg}</p>
                    )}
                    <div style={{ marginBottom: 8 }}>
                      <p style={{ margin: '0 0 4px', fontSize: 12, fontWeight: 600, color: '#475569' }}>Khung giờ khả dụng</p>
                      <select
                        value={startAt}
                        onChange={(e) => setStartAt(e.target.value)}
                        disabled={loadingSlots || !slots.length}
                        style={{ width: '100%', padding: '7px 10px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13 }}
                      >
                        {!slots.length
                          ? <option value=''>{loadingSlots ? 'Đang tải slot...' : 'Không có slot trống'}</option>
                          : null}
                        {slots.map((slot) => (
                          <option key={slot.start_at} value={slot.start_at}>{slot.date} | {slot.start_time} - {slot.end_time}</option>
                        ))}
                      </select>
                    </div>
                    <div style={{ marginBottom: 10 }}>
                      <p style={{ margin: '0 0 4px', fontSize: 12, fontWeight: 600, color: '#475569' }}>Mục đích tư vấn</p>
                      <input
                        value={mucDich}
                        onChange={(e) => setMucDich(e.target.value)}
                        placeholder='Ví dụ: giảm mỡ và cải thiện giấc ngủ'
                        style={{ width: '100%', padding: '7px 10px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13 }}
                      />
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <UserButton size='sm' onClick={handleBook} disabled={submitting || !startAt}>
                        {submitting ? 'Đang đặt...' : 'Xác nhận đặt lịch'}
                      </UserButton>
                      <UserButton size='sm' variant='ghost' onClick={() => { setSelectedExpert(null); setBookingMsg('') }}>
                        Huỷ
                      </UserButton>
                    </div>
                  </div>
                )}

                {!isSelected && (
                  <div className='expert-card__action'>
                    <UserButton size='sm' onClick={() => selectExpert(row)}>Đặt lịch ngay</UserButton>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}

export default function ExpertsPage() {
  return <Suspense><ExpertsContent /></Suspense>
}
