'use client'

import Link from 'next/link'
import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

function PaymentResultContent() {
  const params = useSearchParams()
  const success = params.get('success') === '1'
  const message = params.get('message') ?? ''
  const txnRef = params.get('txnRef') ?? '-'
  const transactionNo = params.get('transactionNo') ?? '-'
  const amount = params.get('amount')

  return (
    <main style={{ maxWidth: 760, margin: '40px auto', padding: 20 }}>
      <div style={{ border: '1px solid #e2e8f0', borderRadius: 16, padding: 24, background: '#fff' }}>
        <h1 style={{ margin: 0, fontSize: 28, color: success ? '#047857' : '#b91c1c' }}>
          {success ? 'Thanh toán thành công' : 'Thanh toán chưa thành công'}
        </h1>
        <p style={{ marginTop: 10, color: '#475569' }}>
          Trạng thái xử lý: <b>{message}</b>
        </p>
        <div style={{ marginTop: 16, fontSize: 14, color: '#475569', lineHeight: 1.8 }}>
          <div>Txn Ref: <b>{txnRef}</b></div>
          <div>Mã giao dịch VNPay: <b>{transactionNo}</b></div>
          <div>Số tiền: <b>{amount ? Number(amount).toLocaleString('vi-VN') : '-'} VND</b></div>
        </div>
        <div style={{ marginTop: 22, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Link href='/user/payments' style={{ padding: '10px 14px', borderRadius: 10, background: '#0f172a', color: '#fff', textDecoration: 'none', fontWeight: 600 }}>
            Xem lịch sử thanh toán
          </Link>
          <Link href='/user/my-packages' style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid #cbd5e1', color: '#0f172a', textDecoration: 'none', fontWeight: 600 }}>
            Đi tới gói của tôi
          </Link>
        </div>
      </div>
    </main>
  )
}

export default function PaymentResultPage() {
  return <Suspense><PaymentResultContent /></Suspense>
}
