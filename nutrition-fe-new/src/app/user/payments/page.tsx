'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { CreditCard, CheckCircle, Clock, Receipt, X, Package, Hash, Calendar, AlertCircle, RefreshCw } from 'lucide-react'
import { SectionHeader, Card, UserStatCard, UserButton, UserNotice, UserEmptyState, StatusBadge, money } from '@/components/user/user-ui'
import { customerGet, customerPost } from '@/lib/customer-api'
import { statusLabel } from '@/lib/i18n'

type Row = Record<string, any>

function PaymentsContent() {
  const params = useSearchParams()
  const bookingId = params.get('bookingId')
  const [rows, setRows] = useState<Row[]>([])
  const [message, setMessage] = useState('')
  const [msgTone, setMsgTone] = useState<'success' | 'error' | 'info'>('info')
  const [pollingPaymentId, setPollingPaymentId] = useState<number | null>(null)
  const [pollingState, setPollingState] = useState('')
  const triesRef = useRef(0)
  const [detailPayment, setDetailPayment] = useState<Row | null>(null)
  const [loadingDetail, setLoadingDetail] = useState(false)

  useEffect(() => {
    document.body.style.overflow = detailPayment ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [detailPayment])

  async function viewDetail(id: number) {
    setLoadingDetail(true)
    try {
      const data = await customerGet<Row>(`/payments/${id}`)
      setDetailPayment(data)
    } catch (e: any) {
      setMessage(e.message ?? 'Không tải được chi tiết')
      setMsgTone('error')
    } finally {
      setLoadingDetail(false)
    }
  }

  async function load() {
    setRows(await customerGet<Row[]>('/payments'))
  }

  useEffect(() => {
    load().catch((e) => { setMessage(e.message); setMsgTone('error') })
  }, [])

  useEffect(() => {
    if (!pollingPaymentId) return
    const interval = window.setInterval(async () => {
      triesRef.current += 1
      try {
        const payment = await customerGet<Row>(`/payments/${pollingPaymentId}`)
        setPollingState(payment.trang_thai)
        await load()
        if (['thanh_cong', 'that_bai', 'het_han', 'hoan_tien'].includes(payment.trang_thai)) {
          setMessage(`✅ Giao dịch #${pollingPaymentId} đã cập nhật: ${statusLabel(payment.trang_thai)}`)
          setMsgTone('success')
          setPollingPaymentId(null)
          triesRef.current = 0
        } else if (triesRef.current >= 20) {
          setMessage('Hệ thống chưa nhận callback. Bạn có thể kiểm tra lại sau.')
          setMsgTone('info')
          setPollingPaymentId(null)
          triesRef.current = 0
        }
      } catch (error) {
        setMessage(error instanceof Error ? error.message : 'Lỗi kiểm tra trạng thái')
        setMsgTone('error')
        setPollingPaymentId(null)
        triesRef.current = 0
      }
    }, 3000)
    return () => window.clearInterval(interval)
  }, [pollingPaymentId])

  async function payBooking() {
    if (!bookingId) return
    try {
      const result = await customerPost<Row>('/payments/booking', { booking_id: Number(bookingId) })
      if (result.payment_url) window.open(result.payment_url, '_blank', 'noopener,noreferrer')
      setPollingPaymentId(Number(result.payment_id))
      setPollingState('cho_thanh_toan')
      setMessage(`Đã tạo giao dịch #${result.payment_id}. Đang chờ xác nhận thanh toán...`)
      setMsgTone('info')
      await load()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Tạo giao dịch thất bại')
      setMsgTone('error')
    }
  }

  const stats = useMemo(() => ({
    total: rows.length,
    success: rows.filter((r) => r.trang_thai === 'thanh_cong').length,
    pending: rows.filter((r) => ['khoi_tao', 'cho_thanh_toan'].includes(r.trang_thai)).length,
  }), [rows])

  return (
    <>
      <SectionHeader title='Thanh toán' subtitle='Quản lý giao dịch và theo dõi trạng thái thanh toán.' />

      {message && <UserNotice tone={msgTone}>{message}</UserNotice>}

      <div className='grid-stats'>
        <UserStatCard label='Tổng giao dịch' value={String(stats.total)} icon={Receipt} tone='blue' />
        <UserStatCard label='Thành công' value={String(stats.success)} icon={CheckCircle} tone='green' />
        <UserStatCard label='Đang chờ' value={String(stats.pending)} icon={Clock} tone='orange' />
      </div>

      {bookingId && (
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <p style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Thanh toán cho lịch hẹn #{bookingId}</p>
              <p style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>Bấm nút để tạo giao dịch và mở cổng thanh toán.</p>
            </div>
            <UserButton onClick={payBooking}>
              {pollingPaymentId ? `Đang kiểm tra #${pollingPaymentId}...` : '💳 Thanh toán ngay'}
            </UserButton>
          </div>
        </Card>
      )}

      <div style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', marginBottom: 16 }}>Lịch sử giao dịch</h2>
        {rows.length === 0 ? (
          <UserEmptyState icon={CreditCard} title='Chưa có giao dịch' description='Giao dịch sẽ hiển thị ở đây sau khi bạn thanh toán.' />
        ) : (
          <div className='txn-list'>
            {rows.map((row) => (
              <div
                key={row.id}
                className='txn-item'
                onClick={() => viewDetail(row.id)}
                style={{ cursor: 'pointer' }}
              >
                <div className='txn-item__icon'>
                  <CreditCard size={18} />
                </div>
                <div className='txn-item__info'>
                  <p className='txn-item__code'>{row.ma_giao_dich}</p>
                  <p className='txn-item__type'>{row.loai_thanh_toan} · <span style={{ fontFamily: 'monospace', fontSize: 11 }}>{row.txn_ref}</span></p>
                </div>
                <div>
                  <StatusBadge value={row.trang_thai} />
                </div>
                <div style={{ textAlign: 'right', minWidth: 100 }}>
                  <p className='txn-item__amount'>{money(row.so_tien)}</p>
                  <p className='txn-item__time'>{String(row.tao_luc).slice(0, 16)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {detailPayment && <PaymentDetailModal payment={detailPayment} onClose={() => setDetailPayment(null)} />}
    </>
  )
}

function PaymentDetailModal({ payment, onClose }: { payment: Row; onClose: () => void }) {
  const webhooks: Row[] = Array.isArray(payment.webhooks) ? payment.webhooks : []
  const refunds: Row[] = Array.isArray(payment.refunds) ? payment.refunds : []
  const isSuccess = payment.trang_thai === 'thanh_cong'
  const isFailed = ['that_bai', 'het_han'].includes(payment.trang_thai)
  const isRefunded = payment.trang_thai === 'hoan_tien'

  const headerColor = isSuccess
    ? { bg: '#f0fdf4', border: '#bbf7d0', text: '#065f46' }
    : isFailed
    ? { bg: '#fef2f2', border: '#fecaca', text: '#991b1b' }
    : isRefunded
    ? { bg: '#eff6ff', border: '#bfdbfe', text: '#1e40af' }
    : { bg: '#fffbeb', border: '#fde68a', text: '#92400e' }

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
          background: 'white', borderRadius: 20, maxWidth: 720, width: '100%',
          maxHeight: '92vh', overflow: 'auto', position: 'relative',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,.25)', animation: 'slideUp 0.3s ease',
        }}
      >
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ margin: 0, fontSize: 12, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Chi tiết giao dịch</p>
            <h2 style={{ margin: '4px 0 0', fontSize: 18, fontWeight: 800, color: '#0f172a', fontFamily: 'monospace' }}>
              {payment.ma_giao_dich}
            </h2>
          </div>
          <button onClick={onClose} style={{ width: 36, height: 36, borderRadius: '50%', border: 'none', background: '#f1f5f9', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} aria-label='Đóng'>
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: 24 }}>
          {/* Status banner */}
          <div style={{ padding: 16, borderRadius: 12, background: headerColor.bg, border: `1px solid ${headerColor.border}`, marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
            <div>
              <p style={{ margin: 0, fontSize: 12, color: headerColor.text, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                {isSuccess && '✓ Thanh toán thành công'}
                {isFailed && '✗ Giao dịch thất bại'}
                {isRefunded && '↺ Đã hoàn tiền'}
                {!isSuccess && !isFailed && !isRefunded && '⏳ Đang xử lý'}
              </p>
              <p style={{ margin: '4px 0 0', fontSize: 24, fontWeight: 800, color: '#0f172a' }}>
                {money(payment.so_tien)}
              </p>
            </div>
            <StatusBadge value={payment.trang_thai} />
          </div>

          {/* Info grid */}
          <div style={{ display: 'grid', gap: 0, marginBottom: 20, background: '#fafafa', borderRadius: 12, border: '1px solid #f1f5f9', overflow: 'hidden' }}>
            <InfoRow icon={<Hash size={14} />} label='Mã giao dịch' value={payment.ma_giao_dich} mono />
            <InfoRow icon={<Hash size={14} />} label='TXN Ref' value={payment.txn_ref} mono />
            <InfoRow icon={<CreditCard size={14} />} label='Loại thanh toán' value={statusLabel(payment.loai_thanh_toan) ?? payment.loai_thanh_toan} />
            <InfoRow icon={<CreditCard size={14} />} label='Cổng thanh toán' value={payment.cong_thanh_toan ?? payment.payment_gateway ?? '—'} />
            <InfoRow icon={<Calendar size={14} />} label='Thời gian tạo' value={String(payment.tao_luc).slice(0, 19).replace('T', ' ')} />
            {payment.thanh_toan_luc && <InfoRow icon={<CheckCircle size={14} />} label='Thanh toán lúc' value={String(payment.thanh_toan_luc).slice(0, 19).replace('T', ' ')} />}
            {payment.gateway_transaction_no && <InfoRow icon={<Hash size={14} />} label='Mã VNPay' value={payment.gateway_transaction_no} mono last />}
          </div>

          {/* Package info */}
          {payment.ten_goi && (
            <div style={{ padding: 16, background: 'linear-gradient(135deg, #faf5ff, #eff6ff)', borderRadius: 12, border: '1px solid #e0e7ff', marginBottom: 20 }}>
              <p style={{ margin: 0, fontSize: 12, color: '#6366f1', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Package size={14} />
                Gói dịch vụ liên quan
              </p>
              <p style={{ margin: '6px 0 8px', fontSize: 16, fontWeight: 700, color: '#0f172a' }}>{payment.ten_goi}</p>
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 12, color: '#475569' }}>
                <span>Mã gói: <strong style={{ fontFamily: 'monospace' }}>{payment.ma_goi_da_mua}</strong></span>
                <span>Số buổi: <strong>{payment.so_luot_da_dung}/{payment.so_luot_tong}</strong></span>
                <span>Còn lại: <strong>{payment.so_luot_con_lai} buổi</strong></span>
                {payment.goi_het_han_luc && <span>Hết hạn: <strong>{String(payment.goi_het_han_luc).slice(0, 10)}</strong></span>}
              </div>
            </div>
          )}

          {/* Refunds */}
          {refunds.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <h3 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 6 }}>
                <RefreshCw size={14} style={{ color: '#3b82f6' }} />
                Lịch sử hoàn tiền ({refunds.length})
              </h3>
              <div style={{ display: 'grid', gap: 8 }}>
                {refunds.map((r) => (
                  <div key={r.id} style={{ padding: 12, background: '#eff6ff', borderRadius: 10, border: '1px solid #bfdbfe', fontSize: 13 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <span style={{ fontWeight: 700, color: '#1e40af' }}>{money(r.so_tien_hoan)}</span>
                      <StatusBadge value={r.trang_thai} />
                    </div>
                    <p style={{ margin: 0, color: '#475569', fontSize: 12 }}>{r.ly_do}</p>
                    <p style={{ margin: '4px 0 0', color: '#94a3b8', fontSize: 11 }}>{String(r.tao_luc).slice(0, 19).replace('T', ' ')}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Webhooks */}
          {webhooks.length > 0 && (
            <div>
              <h3 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 6 }}>
                <AlertCircle size={14} style={{ color: '#64748b' }} />
                Lịch sử callback ({webhooks.length})
              </h3>
              <div style={{ display: 'grid', gap: 6 }}>
                {webhooks.map((w) => (
                  <div key={w.id} style={{ padding: '8px 12px', background: '#fafafa', borderRadius: 8, border: '1px solid #f1f5f9', fontSize: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: w.hop_le ? '#10b981' : '#ef4444' }} />
                      <span style={{ fontWeight: 600, color: '#475569' }}>{w.loai_webhook.toUpperCase()}</span>
                      <span style={{ color: w.hop_le ? '#059669' : '#dc2626', fontSize: 11, fontWeight: 600 }}>
                        {w.hop_le ? 'Hợp lệ' : 'Sai chữ ký'}
                      </span>
                    </span>
                    <span style={{ color: '#94a3b8', fontSize: 11 }}>{String(w.tao_luc).slice(0, 19).replace('T', ' ')}</span>
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

function InfoRow({ icon, label, value, mono, last }: { icon: React.ReactNode; label: string; value: string; mono?: boolean; last?: boolean }) {
  return (
    <div style={{ padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: last ? 'none' : '1px solid #f1f5f9', gap: 12 }}>
      <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#64748b', fontWeight: 500 }}>
        <span style={{ color: '#94a3b8' }}>{icon}</span>
        {label}
      </span>
      <span style={{ fontSize: 13, color: '#0f172a', fontWeight: 600, fontFamily: mono ? 'monospace' : 'inherit', textAlign: 'right' }}>
        {value}
      </span>
    </div>
  )
}

export default function PaymentsPage() {
  return <Suspense><PaymentsContent /></Suspense>
}
