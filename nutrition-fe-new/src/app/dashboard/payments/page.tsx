'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { ActionButton, EmptyState, Notice, PageHeader, Panel, StatCard, StatusPill, money } from '@/components/admin/admin-ui'
import { DataTable, Td, Th } from '@/components/admin/admin-table'
import { customerGet, customerPost } from '@/lib/customer-api'

type Row = Record<string, any>

function PaymentsContent() {
  const params = useSearchParams()
  const bookingId = params.get('bookingId')
  const [rows, setRows] = useState<Row[]>([])
  const [message, setMessage] = useState('')
  const [pollingPaymentId, setPollingPaymentId] = useState<number | null>(null)
  const [pollingState, setPollingState] = useState('')
  const triesRef = useRef(0)

  async function load() {
    setRows(await customerGet<Row[]>('/payments'))
  }

  useEffect(() => {
    load().catch((error) => setMessage(error.message))
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
          setMessage(`Thanh toán #${pollingPaymentId} đã cập nhật: ${payment.trang_thai}.`)
          setPollingPaymentId(null)
          triesRef.current = 0
        } else if (triesRef.current >= 20) {
          setMessage('Hệ thống vẫn chưa nhận callback cuối cùng. Bạn có thể bấm kiểm tra lại sau.')
          setPollingPaymentId(null)
          triesRef.current = 0
        }
      } catch (error) {
        setMessage(error instanceof Error ? error.message : 'Lỗi polling trạng thái thanh toán')
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
      setMessage(`Đã tạo giao dịch #${result.payment_id}. Hệ thống đang polling để đồng bộ callback chậm...`)
      await load()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Tạo giao dịch thất bại')
    }
  }

  const stats = useMemo(() => ({
    total: rows.length,
    success: rows.filter((row) => row.trang_thai === 'thanh_cong').length,
    pending: rows.filter((row) => ['khoi_tao', 'cho_thanh_toan'].includes(row.trang_thai)).length,
  }), [rows])

  return (
    <>
      <PageHeader
        eyebrow='Customer workspace'
        title='05. Thanh toán'
        description='Hỗ trợ polling trạng thái transaction theo chu kỳ để xử lý edge-case callback/IPN về chậm hơn redirect FE.'
      />
      {message ? <Notice>{message}</Notice> : null}
      <div className='mb-5 grid gap-3 md:grid-cols-4'>
        <StatCard label='Tổng giao dịch' value={String(stats.total)} />
        <StatCard label='Thành công' value={String(stats.success)} tone='green' />
        <StatCard label='Đang chờ cập nhật' value={String(stats.pending)} tone='orange' />
        <StatCard label='Polling hiện tại' value={pollingPaymentId ? `#${pollingPaymentId} (${pollingState || '...'} )` : 'Không'} tone='slate' />
      </div>
      <Panel title='Thanh toán booking hiện tại' description='Bấm nút để tạo giao dịch và mở cổng thanh toán trong tab mới.' action={bookingId ? <ActionButton onClick={payBooking}>Tạo payment cho booking #{bookingId}</ActionButton> : undefined}>
        {!bookingId ? <EmptyState text='Bạn chưa truyền bookingId. Hãy đi từ màn hình tạo booking để thanh toán đúng đối tượng.' /> : null}
      </Panel>
      <div className='mt-5'>
        <Panel title='Lịch sử giao dịch'>
          <DataTable minWidth='980px'>
            <thead>
              <tr>
                <Th>Mã giao dịch</Th>
                <Th>Loại</Th>
                <Th>Số tiền</Th>
                <Th>Txn ref</Th>
                <Th>Trạng thái</Th>
                <Th>Thời gian</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className='hover:bg-blue-50/40'>
                  <Td><b>{row.ma_giao_dich}</b></Td>
                  <Td>{row.loai_thanh_toan}</Td>
                  <Td>{money(row.so_tien)}</Td>
                  <Td className='font-mono text-xs'>{row.txn_ref}</Td>
                  <Td><StatusPill value={row.trang_thai} /></Td>
                  <Td>{String(row.tao_luc).slice(0, 16)}</Td>
                </tr>
              ))}
            </tbody>
          </DataTable>
          {!rows.length ? <div className='mt-4'><EmptyState text='Chưa có giao dịch nào.' /></div> : null}
        </Panel>
      </div>
    </>
  )
}

export default function CustomerPaymentsPage() {
  return <Suspense><PaymentsContent /></Suspense>
}
