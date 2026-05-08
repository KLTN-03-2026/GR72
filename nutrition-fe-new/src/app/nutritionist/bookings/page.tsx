'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  CalendarCheck, Clock, CheckCircle, XCircle, AlertCircle,
  Search, Filter, User, Mail, Target, X, History,
} from 'lucide-react'
import {
  SectionHeader, Card, UserStatCard, UserButton, UserNotice,
  UserEmptyState, StatusBadge,
} from '@/components/user/user-ui'
import { expertGet, expertPatch, expertPost } from '@/lib/expert-api'

type Row = Record<string, any>

const STATUS_LABELS: Record<string, string> = {
  cho_xac_nhan: 'Chờ xác nhận',
  da_xac_nhan: 'Đã xác nhận',
  da_checkin: 'Đã check-in',
  dang_tu_van: 'Đang tư vấn',
  hoan_thanh: 'Hoàn thành',
  da_huy: 'Đã hủy',
}

const STATUSES = Object.keys(STATUS_LABELS)

const canConfirm = (s: string) => s === 'cho_xac_nhan'
const canCheckin = (s: string) => s === 'da_xac_nhan'
const canComplete = (s: string) => s === 'da_checkin' || s === 'dang_tu_van'
const canReject = (s: string) => ['cho_xac_nhan', 'da_xac_nhan'].includes(s)

export default function BookingsPage() {
  const [rows, setRows] = useState<Row[]>([])
  const [detail, setDetail] = useState<Row | null>(null)
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('')
  const [reason, setReason] = useState('')
  const [showRejectForm, setShowRejectForm] = useState(false)
  const [message, setMessage] = useState('')
  const [msgTone, setMsgTone] = useState<'success' | 'error' | 'info'>('info')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [acting, setActing] = useState(false)
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (query) params.set('search', query)
      if (status) params.set('status', status)
      setRows(await expertGet<Row[]>(`/bookings${params.toString() ? `?${params}` : ''}`))
    } catch (e: any) {
      setMessage(e.message ?? 'Lỗi tải booking')
      setMsgTone('error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [status])

  useEffect(() => {
    document.body.style.overflow = detail ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [detail])

  const stats = useMemo(() => ({
    total: rows.length,
    pending: rows.filter((r) => r.trang_thai === 'cho_xac_nhan').length,
    active: rows.filter((r) => ['da_xac_nhan', 'da_checkin', 'dang_tu_van'].includes(r.trang_thai)).length,
    completed: rows.filter((r) => r.trang_thai === 'hoan_thanh').length,
  }), [rows])

  async function open(id: number) {
    try {
      const data = await expertGet<Row>(`/bookings/${id}`)
      setDetail(data)
      setReason('')
      setShowRejectForm(false)
      setErrors({})
    } catch (e: any) {
      setMessage(e.message ?? 'Lỗi tải chi tiết')
      setMsgTone('error')
    }
  }

  async function action(id: number, path: string, label: string) {
    setActing(true)
    try {
      await (path === 'check-in' ? expertPost(`/bookings/${id}/${path}`) : expertPatch(`/bookings/${id}/${path}`))
      setMessage(`✅ ${label}`)
      setMsgTone('success')
      await load()
      await open(id)
    } catch (e: any) {
      setMessage(e.message ?? 'Lỗi')
      setMsgTone('error')
    } finally {
      setActing(false)
    }
  }

  async function reject() {
    if (!detail) return
    if (!reason.trim()) {
      setErrors({ reason: 'Vui lòng nhập lý do từ chối.' })
      return
    }
    setActing(true)
    try {
      await expertPatch(`/bookings/${detail.booking.id}/reject`, { ly_do: reason })
      setMessage('✅ Đã từ chối booking.')
      setMsgTone('success')
      await load()
      setDetail(null)
    } catch (e: any) {
      setMessage(e.message ?? 'Lỗi từ chối')
      setMsgTone('error')
    } finally {
      setActing(false)
    }
  }

  return (
    <>
      <SectionHeader
        title='Lịch hẹn của tôi'
        subtitle='Quản lý và xử lý các booking tư vấn từ khách hàng.'
      />

      {message && <UserNotice tone={msgTone}>{message}</UserNotice>}

      <div className='grid-stats'>
        <UserStatCard label='Tổng booking' value={String(stats.total)} icon={CalendarCheck} tone='blue' />
        <UserStatCard label='Chờ xác nhận' value={String(stats.pending)} icon={AlertCircle} tone='orange' />
        <UserStatCard label='Đang xử lý' value={String(stats.active)} icon={Clock} tone='purple' />
        <UserStatCard label='Hoàn thành' value={String(stats.completed)} icon={CheckCircle} tone='green' />
      </div>

      {/* Filter bar */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1 1 240px' }}>
          <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input
            style={{ width: '100%', paddingLeft: 36, paddingRight: 12, paddingTop: 9, paddingBottom: 9, borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 13, outline: 'none' }}
            placeholder='Tìm khách hàng, mã lịch, gói...'
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') load() }}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Filter size={15} style={{ color: '#94a3b8' }} />
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 13, outline: 'none', background: 'white' }}
          >
            <option value=''>Tất cả trạng thái</option>
            {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
          </select>
        </div>
        <UserButton size='sm' variant='secondary' onClick={load}>Tìm kiếm</UserButton>
      </div>

      {loading ? (
        <Card><p style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>Đang tải...</p></Card>
      ) : rows.length === 0 ? (
        <UserEmptyState
          icon={CalendarCheck}
          title='Chưa có booking'
          description='Khi có khách đặt lịch, các booking sẽ xuất hiện ở đây.'
        />
      ) : (
        <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))' }}>
          {rows.map((row) => (
            <BookingItem key={row.id} row={row} onOpen={() => open(row.id)} />
          ))}
        </div>
      )}

      {detail && (
        <BookingDetailModal
          detail={detail}
          onClose={() => setDetail(null)}
          onAction={action}
          onShowReject={() => setShowRejectForm(true)}
          showRejectForm={showRejectForm}
          reason={reason}
          setReason={(v) => { setReason(v); setErrors({}) }}
          rejectError={errors.reason}
          onReject={reject}
          onCancelReject={() => { setShowRejectForm(false); setReason(''); setErrors({}) }}
          acting={acting}
        />
      )}
    </>
  )
}

function BookingItem({ row, onOpen }: { row: Row; onOpen: () => void }) {
  const isPending = row.trang_thai === 'cho_xac_nhan'
  return (
    <Card hover>
      <div onClick={onOpen} style={{ cursor: 'pointer' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
          <div>
            <p style={{ margin: 0, fontSize: 12, color: '#6366f1', fontWeight: 700, fontFamily: 'monospace' }}>
              {row.ma_lich_hen}
            </p>
            <p style={{ margin: '4px 0 0', fontSize: 15, fontWeight: 700, color: '#0f172a' }}>
              {row.ten_goi}
            </p>
          </div>
          <StatusBadge value={row.trang_thai} />
        </div>

        <div style={{ display: 'grid', gap: 6, fontSize: 13, color: '#475569', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <User size={13} style={{ color: '#94a3b8' }} />
            <strong style={{ color: '#0f172a' }}>{row.customer_name}</strong>
            {row.customer_email && <span style={{ color: '#94a3b8' }}>· {row.customer_email}</span>}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Clock size={13} style={{ color: '#94a3b8' }} />
            {String(row.ngay_hen).slice(0, 10)} · {row.gio_bat_dau}
          </div>
          {row.muc_dich && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
              <Target size={13} style={{ color: '#94a3b8', flexShrink: 0, marginTop: 2 }} />
              <span style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {row.muc_dich}
              </span>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <UserButton size='sm' variant={isPending ? 'primary' : 'secondary'} onClick={onOpen}>
            {isPending ? 'Cần xử lý' : 'Xem chi tiết'}
          </UserButton>
        </div>
      </div>
    </Card>
  )
}

function BookingDetailModal({
  detail, onClose, onAction, onShowReject, showRejectForm, reason, setReason, rejectError, onReject, onCancelReject, acting,
}: {
  detail: Row
  onClose: () => void
  onAction: (id: number, path: string, label: string) => Promise<void>
  onShowReject: () => void
  showRejectForm: boolean
  reason: string
  setReason: (v: string) => void
  rejectError?: string
  onReject: () => void
  onCancelReject: () => void
  acting: boolean
}) {
  const b = detail.booking
  const s = b.trang_thai
  const timeline: Row[] = Array.isArray(detail.timeline) ? detail.timeline : []

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, background: 'rgba(15,23,42,.6)', zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
      animation: 'fadeIn 0.2s ease',
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: 'white', borderRadius: 20, maxWidth: 720, width: '100%',
        maxHeight: '92vh', overflow: 'auto', boxShadow: '0 25px 50px -12px rgba(0,0,0,.25)',
        animation: 'slideUp 0.3s ease',
      }}>
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ margin: 0, fontSize: 11, color: '#6366f1', fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase', fontFamily: 'monospace' }}>
              {b.ma_lich_hen}
            </p>
            <h2 style={{ margin: '4px 0 0', fontSize: 18, fontWeight: 800, color: '#0f172a' }}>
              {b.ten_goi}
            </h2>
          </div>
          <button onClick={onClose} style={{ width: 36, height: 36, borderRadius: '50%', border: 'none', background: '#f1f5f9', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} aria-label='Đóng'>
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: 24 }}>
          {/* Status banner */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 14, background: '#fafafa', borderRadius: 12, border: '1px solid #f1f5f9', marginBottom: 18 }}>
            <span style={{ fontSize: 13, color: '#64748b', fontWeight: 600 }}>Trạng thái hiện tại</span>
            <StatusBadge value={s} />
          </div>

          {/* Customer + time info */}
          <div style={{ display: 'grid', gap: 10, marginBottom: 18 }}>
            <InfoRow icon={<User size={15} />} label='Khách hàng' value={b.customer_name} />
            {b.customer_email && <InfoRow icon={<Mail size={15} />} label='Email' value={b.customer_email} />}
            <InfoRow icon={<Clock size={15} />} label='Thời gian' value={`${String(b.ngay_hen).slice(0, 10)} · ${b.gio_bat_dau}`} />
          </div>

          {/* Mục đích */}
          <div style={{ marginBottom: 18 }}>
            <h3 style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Target size={14} style={{ color: '#6366f1' }} />
              Mục đích tư vấn
            </h3>
            <p style={{ margin: 0, padding: 14, background: '#fafafa', borderRadius: 10, fontSize: 14, lineHeight: 1.6, color: b.muc_dich ? '#475569' : '#94a3b8', fontStyle: b.muc_dich ? 'normal' : 'italic' }}>
              {b.muc_dich ?? 'Khách chưa nhập mục đích tư vấn.'}
            </p>
          </div>

          {/* Action buttons */}
          {(canConfirm(s) || canCheckin(s) || canComplete(s) || canReject(s)) && !showRejectForm && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', padding: 14, background: 'linear-gradient(135deg, #faf5ff, #eff6ff)', borderRadius: 12, border: '1px solid #e0e7ff', marginBottom: 18 }}>
              {canConfirm(s) && (
                <UserButton onClick={() => onAction(b.id, 'confirm', 'Đã xác nhận booking')} disabled={acting}>
                  <CheckCircle size={14} /> Xác nhận
                </UserButton>
              )}
              {canCheckin(s) && (
                <UserButton variant='secondary' onClick={() => onAction(b.id, 'check-in', 'Đã check-in khách')} disabled={acting}>
                  <CheckCircle size={14} /> Check-in
                </UserButton>
              )}
              {canComplete(s) && (
                <UserButton onClick={() => onAction(b.id, 'complete', 'Đã hoàn thành buổi tư vấn')} disabled={acting}>
                  <CheckCircle size={14} /> Hoàn thành
                </UserButton>
              )}
              {canReject(s) && (
                <UserButton variant='danger' onClick={onShowReject} disabled={acting}>
                  <XCircle size={14} /> Từ chối
                </UserButton>
              )}
            </div>
          )}

          {/* Reject form */}
          {showRejectForm && (
            <div style={{ marginBottom: 18, padding: 14, background: '#fff5f5', borderRadius: 12, border: '1px solid #fecaca' }}>
              <p style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 700, color: '#dc2626' }}>Lý do từ chối *</p>
              <textarea
                style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: `1px solid ${rejectError ? '#fca5a5' : '#fecaca'}`, fontSize: 13, resize: 'vertical', minHeight: 72, outline: 'none' }}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder='Nhập lý do từ chối để khách hiểu...'
              />
              {rejectError && <p style={{ margin: '6px 0 0', fontSize: 12, color: '#dc2626' }}>{rejectError}</p>}
              <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                <UserButton size='sm' variant='danger' onClick={onReject} disabled={acting}>Xác nhận từ chối</UserButton>
                <UserButton size='sm' variant='ghost' onClick={onCancelReject}>Huỷ</UserButton>
              </div>
            </div>
          )}

          {/* Timeline */}
          {timeline.length > 0 && (
            <div>
              <h3 style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 6 }}>
                <History size={14} style={{ color: '#6366f1' }} />
                Timeline ({timeline.length})
              </h3>
              <div style={{ display: 'grid', gap: 8 }}>
                {timeline.map((t) => (
                  <div key={t.id} style={{ display: 'flex', gap: 12, padding: 12, background: '#fafafa', borderRadius: 10, border: '1px solid #f1f5f9' }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#6366f1', marginTop: 6, flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{t.su_kien}</p>
                      {t.trang_thai_truoc && t.trang_thai_sau && (
                        <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748b' }}>
                          {STATUS_LABELS[t.trang_thai_truoc] ?? t.trang_thai_truoc} → <strong>{STATUS_LABELS[t.trang_thai_sau] ?? t.trang_thai_sau}</strong>
                        </p>
                      )}
                      <p style={{ margin: '4px 0 0', fontSize: 11, color: '#94a3b8' }}>{String(t.tao_luc).slice(0, 19).replace('T', ' ')}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px) } to { opacity: 1; transform: translateY(0) } }
      `}</style>
    </div>
  )
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: '#fafafa', borderRadius: 10, border: '1px solid #f1f5f9' }}>
      <span style={{ color: '#94a3b8' }}>{icon}</span>
      <span style={{ fontSize: 12, color: '#64748b', minWidth: 80 }}>{label}</span>
      <span style={{ flex: 1, fontSize: 14, color: '#0f172a', fontWeight: 600, textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</span>
    </div>
  )
}
