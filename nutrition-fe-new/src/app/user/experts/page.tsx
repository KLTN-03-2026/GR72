'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useMemo, useState } from 'react'
import { Users, Star, CalendarCheck } from 'lucide-react'
import { SectionHeader, UserStatCard, UserButton, UserNotice, UserEmptyState } from '@/components/user/user-ui'
import { customerGet } from '@/lib/customer-api'

type Row = Record<string, any>

function ExpertsContent() {
  const params = useSearchParams()
  const packagePurchaseId = params.get('packagePurchaseId')
  const [rows, setRows] = useState<Row[]>([])
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!packagePurchaseId) return
    customerGet<Row[]>(`/my-packages/${packagePurchaseId}/experts`)
      .then(setRows)
      .catch((e) => setMessage(e.message))
  }, [packagePurchaseId])

  const stats = useMemo(() => ({
    total: rows.length,
    receiving: rows.filter((r) => r.nhan_booking).length,
  }), [rows])

  if (!packagePurchaseId) {
    return (
      <>
        <SectionHeader title='Chọn chuyên gia' subtitle='Vui lòng chọn gói đã mua trước khi tìm chuyên gia.' />
        <UserNotice tone='warning'>
          Bạn cần chọn một gói đã mua trước. <Link href='/user/my-packages' style={{ fontWeight: 700, textDecoration: 'underline' }}>Đi tới gói của tôi</Link>
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

      <div className='grid-stats'>
        <UserStatCard label='Chuyên gia trong gói' value={String(stats.total)} icon={Users} tone='blue' />
        <UserStatCard label='Đang nhận lịch' value={String(stats.receiving)} icon={CalendarCheck} tone='green' />
      </div>

      {rows.length === 0 ? (
        <UserEmptyState icon={Users} title='Chưa có chuyên gia' description='Gói này chưa có chuyên gia phù hợp. Vui lòng thử gói khác.' />
      ) : (
        <div className='grid-cards'>
          {rows.map((row) => (
            <div key={row.expert_id} className='expert-card'>
              <div className='expert-card__avatar'>
                {(row.ho_ten ?? 'E').charAt(0).toUpperCase()}
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
              <div className='expert-card__action'>
                <Link href={`/user/bookings?packagePurchaseId=${packagePurchaseId}&expertId=${row.expert_id}`}>
                  <UserButton size='sm'>Đặt lịch ngay</UserButton>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  )
}

export default function ExpertsPage() {
  return <Suspense><ExpertsContent /></Suspense>
}
