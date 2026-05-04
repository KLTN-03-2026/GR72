'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { CreditCard, CheckCircle, Clock, Receipt } from 'lucide-react'
import { SectionHeader, Card, UserStatCard, UserButton, UserNotice, UserEmptyState, StatusBadge, money } from '@/components/user/user-ui'
import { customerGet, customerPost } from '@/lib/customer-api'

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
          setMessage(`✅ Giao dịch #${pollingPaymentId} đã cập nhật: ${payment.trang_thai}`)
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
              <div key={row.id} className='txn-item'>
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
    </>
  )
}

export default function PaymentsPage() {
  return <Suspense><PaymentsContent /></Suspense>
}
