'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Suspense, useEffect, useMemo, useState } from 'react'
import { Users, Star, CalendarCheck, X, GraduationCap, Award, Briefcase, MessageSquare } from 'lucide-react'
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

  // Detail modal
  const [detailExpert, setDetailExpert] = useState<Row | null>(null)
  const [loadingDetail, setLoadingDetail] = useState(false)

  useEffect(() => {
    document.body.style.overflow = detailExpert ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [detailExpert])

  async function viewDetail(expertId: number) {
    setLoadingDetail(true)
    try {
      const data = await customerGet<Row>(`/experts/${expertId}`)
      setDetailExpert(data)
    } catch (e: any) {
      setMessage(e.message ?? 'Không tải được chi tiết chuyên gia')
    } finally {
      setLoadingDetail(false)
    }
  }

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
                  <div className='expert-card__action' style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                    <UserButton size='sm' variant='secondary' onClick={() => viewDetail(row.expert_id)} disabled={loadingDetail}>
                      Xem chi tiết
                    </UserButton>
                    <UserButton size='sm' onClick={() => selectExpert(row)}>Đặt lịch ngay</UserButton>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {detailExpert && (
        <ExpertDetailModal
          expert={detailExpert}
          onClose={() => setDetailExpert(null)}
          onBook={() => {
            const card = rows.find((r) => r.expert_id === detailExpert.id)
            setDetailExpert(null)
            if (card) selectExpert(card)
          }}
        />
      )}
    </>
  )
}

function ExpertDetailModal({ expert, onClose, onBook }: { expert: Row; onClose: () => void; onBook: () => void }) {
  const reviews: Row[] = Array.isArray(expert.reviews) ? expert.reviews : []
  const rating = Number(expert.diem_danh_gia_trung_binh ?? 0)

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(15,23,42,.6)',
        zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20, animation: 'fadeIn 0.2s ease',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'white', borderRadius: 20, maxWidth: 760, width: '100%',
          maxHeight: '92vh', overflow: 'auto', position: 'relative',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,.25)', animation: 'slideUp 0.3s ease',
        }}
      >
        {/* Header */}
        <div style={{ position: 'relative', height: 60, borderTopLeftRadius: 20, borderTopRightRadius: 20 }}>
          <button
            onClick={onClose}
            style={{
              position: 'absolute', top: 16, right: 16, width: 36, height: 36,
              borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,.95)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(0,0,0,.15)',
            }}
            aria-label='Đóng'
          >
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: '0 28px 28px' }}>
          {/* Avatar + name */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 20, marginTop: -30 }}>
            <div style={{
              width: 100, height: 100, borderRadius: '50%', overflow: 'hidden',
              background: '#e0e7ff', border: '4px solid white', boxShadow: '0 8px 20px rgba(0,0,0,.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 36, fontWeight: 700, color: '#6366f1',
            }}>
              {expert.anh_dai_dien_url
                ? <img src={expert.anh_dai_dien_url} alt={expert.ho_ten} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : (expert.ho_ten ?? 'E').charAt(0).toUpperCase()
              }
            </div>
            <h2 style={{ margin: '14px 0 0', fontSize: 22, fontWeight: 800, color: '#0f172a', letterSpacing: -0.3, textAlign: 'center' }}>
              {expert.ho_ten}
            </h2>
            {expert.chuyen_mon && (
              <p style={{ margin: '4px 0 0', fontSize: 14, color: '#6366f1', fontWeight: 600, textAlign: 'center' }}>
                {expert.chuyen_mon}
              </p>
            )}
          </div>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
            <div style={{ padding: 14, background: '#fffbeb', borderRadius: 12, border: '1px solid #fde68a', textAlign: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, fontSize: 22, fontWeight: 800, color: '#0f172a' }}>
                <Star size={18} style={{ color: '#f59e0b', fill: '#f59e0b' }} />
                {rating.toFixed(1)}
              </div>
              <p style={{ margin: '2px 0 0', fontSize: 11, color: '#92400e', fontWeight: 600 }}>{expert.so_luot_danh_gia ?? 0} đánh giá</p>
            </div>
            <div style={{ padding: 14, background: '#f0fdf4', borderRadius: 12, border: '1px solid #bbf7d0', textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#0f172a' }}>{expert.so_booking_hoan_thanh ?? 0}</div>
              <p style={{ margin: '2px 0 0', fontSize: 11, color: '#065f46', fontWeight: 600 }}>Buổi hoàn thành</p>
            </div>
            <div style={{ padding: 14, background: '#eff6ff', borderRadius: 12, border: '1px solid #bfdbfe', textAlign: 'center' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: expert.nhan_booking ? '#059669' : '#dc2626' }}>
                {expert.nhan_booking ? '● Đang nhận lịch' : '● Tạm dừng'}
              </div>
              <p style={{ margin: '2px 0 0', fontSize: 11, color: '#1e40af', fontWeight: 600 }}>Trạng thái</p>
            </div>
          </div>

          {/* Mo ta */}
          {expert.mo_ta && (
            <Section icon={<MessageSquare size={16} />} title='Giới thiệu'>
              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.7, color: '#475569', whiteSpace: 'pre-wrap' }}>{expert.mo_ta}</p>
            </Section>
          )}

          {/* Hoc vi */}
          {expert.hoc_vi && (
            <Section icon={<GraduationCap size={16} />} title='Học vị'>
              <p style={{ margin: 0, fontSize: 14, color: '#475569', whiteSpace: 'pre-wrap' }}>{expert.hoc_vi}</p>
            </Section>
          )}

          {/* Kinh nghiem */}
          {expert.kinh_nghiem && (
            <Section icon={<Briefcase size={16} />} title='Kinh nghiệm'>
              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.7, color: '#475569', whiteSpace: 'pre-wrap' }}>{expert.kinh_nghiem}</p>
            </Section>
          )}

          {/* Chung chi */}
          {expert.chung_chi && (
            <Section icon={<Award size={16} />} title='Chứng chỉ'>
              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.7, color: '#475569', whiteSpace: 'pre-wrap' }}>{expert.chung_chi}</p>
            </Section>
          )}

          {/* Reviews */}
          {reviews.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <h3 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Star size={16} style={{ color: '#f59e0b' }} />
                Đánh giá từ khách hàng ({reviews.length})
              </h3>
              <div style={{ display: 'grid', gap: 10, maxHeight: 320, overflow: 'auto', paddingRight: 4 }}>
                {reviews.map((r) => (
                  <div key={r.id} style={{ padding: 14, background: '#fafafa', borderRadius: 12, border: '1px solid #f1f5f9' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{r.customer_name}</p>
                      <div style={{ display: 'flex', gap: 1 }}>
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star key={s} size={12} style={{ color: s <= Number(r.diem) ? '#f59e0b' : '#e2e8f0', fill: s <= Number(r.diem) ? '#f59e0b' : 'transparent' }} />
                        ))}
                      </div>
                    </div>
                    <p style={{ margin: 0, fontSize: 13, color: '#475569', lineHeight: 1.5 }}>{r.noi_dung}</p>
                    <p style={{ margin: '6px 0 0', fontSize: 11, color: '#94a3b8' }}>
                      {new Date(r.tao_luc).toLocaleDateString('vi-VN')}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CTA */}
          <div style={{ display: 'flex', gap: 10, paddingTop: 16, borderTop: '1px solid #f1f5f9' }}>
            <UserButton variant='ghost' onClick={onClose}>Đóng</UserButton>
            <div style={{ flex: 1 }} />
            <UserButton onClick={onBook} disabled={!expert.nhan_booking}>
              {expert.nhan_booking ? '📅 Đặt lịch với chuyên gia này' : 'Tạm dừng nhận lịch'}
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

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <h3 style={{ margin: '0 0 8px', fontSize: 14, fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ color: '#6366f1' }}>{icon}</span>
        {title}
      </h3>
      {children}
    </div>
  )
}

export default function ExpertsPage() {
  return <Suspense><ExpertsContent /></Suspense>
}
