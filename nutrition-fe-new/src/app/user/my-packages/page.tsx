'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { ShoppingBag, CheckCircle, XCircle } from 'lucide-react'
import { SectionHeader, Card, UserStatCard, UserButton, StatusBadge, UserNotice, UserEmptyState } from '@/components/user/user-ui'
import { customerGet } from '@/lib/customer-api'

type Row = Record<string, any>

export default function MyPackagesPage() {
  const [rows, setRows] = useState<Row[]>([])
  const [message, setMessage] = useState('')

  useEffect(() => {
    customerGet<Row[]>('/my-packages').then(setRows).catch((e) => setMessage(e.message))
  }, [])

  const stats = useMemo(() => ({
    total: rows.length,
    active: rows.filter((r) => r.runtime_status === 'dang_hieu_luc').length,
    exhausted: rows.filter((r) => ['het_luot', 'het_han'].includes(r.runtime_status)).length,
  }), [rows])

  return (
    <>
      <SectionHeader
        title='Gói của tôi'
        subtitle='Quản lý gói đã mua, theo dõi hạn sử dụng và lượt còn lại.'
        action={<Link href='/user/packages'><UserButton variant='secondary'>Mua thêm gói</UserButton></Link>}
      />

      {message && <UserNotice tone='error'>{message}</UserNotice>}

      <div className='grid-stats'>
        <UserStatCard label='Tổng gói' value={String(stats.total)} icon={ShoppingBag} tone='blue' />
        <UserStatCard label='Đang hiệu lực' value={String(stats.active)} icon={CheckCircle} tone='green' />
        <UserStatCard label='Hết hạn / hết lượt' value={String(stats.exhausted)} icon={XCircle} tone='orange' />
      </div>

      {rows.length === 0 ? (
        <UserEmptyState
          icon={ShoppingBag}
          title='Bạn chưa có gói nào'
          description='Hãy khám phá các gói dịch vụ và mua gói phù hợp với bạn.'
          action={<Link href='/user/packages'><UserButton>Khám phá gói dịch vụ</UserButton></Link>}
        />
      ) : (
        <div className='grid-cards' style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
          {rows.map((row) => (
            <Card key={row.id} hover>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <p style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>{row.ten_goi}</p>
                <StatusBadge value={row.runtime_status} />
              </div>
              <p style={{ fontSize: 13, color: '#94a3b8', fontFamily: 'monospace' }}>{row.ma_goi_da_mua}</p>
              <div style={{ display: 'flex', gap: 24, marginTop: 16 }}>
                <div>
                  <p style={{ fontSize: 12, color: '#94a3b8' }}>Lượt còn lại</p>
                  <p style={{ fontSize: 18, fontWeight: 700, color: '#0f172a' }}>
                    {row.so_luot_con_lai}<span style={{ fontSize: 13, fontWeight: 400, color: '#94a3b8' }}>/{row.so_luot_tong}</span>
                  </p>
                </div>
                <div>
                  <p style={{ fontSize: 12, color: '#94a3b8' }}>Thời hạn</p>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#475569' }}>
                    {row.bat_dau_luc ? String(row.bat_dau_luc).slice(0, 10) : '-'} → {row.het_han_luc ? String(row.het_han_luc).slice(0, 10) : '-'}
                  </p>
                </div>
              </div>
              <div style={{ marginTop: 18, paddingTop: 16, borderTop: '1px solid #f1f5f9' }}>
                <Link href={`/user/experts?packagePurchaseId=${row.id}`}>
                  <UserButton variant='primary' size='sm'>Chọn chuyên gia</UserButton>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  )
}
