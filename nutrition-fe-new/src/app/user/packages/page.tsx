'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { Package, ShoppingBag, Sparkles } from 'lucide-react'
import { SectionHeader, UserStatCard, UserButton, UserNotice, UserEmptyState, money } from '@/components/user/user-ui'
import { customerGet, customerPost } from '@/lib/customer-api'

type Row = Record<string, any>

export default function PackagesPage() {
  const [rows, setRows] = useState<Row[]>([])
  const [message, setMessage] = useState('')
  const [msgTone, setMsgTone] = useState<'success' | 'error' | 'info'>('info')

  async function load() {
    setRows(await customerGet<Row[]>('/service-packages'))
  }

  useEffect(() => {
    load().catch((e) => { setMessage(e.message); setMsgTone('error') })
  }, [])

  async function buy(packageId: number) {
    try {
      const result = await customerPost<Row>('/package-purchases', { goi_dich_vu_id: packageId })
      setMessage('🎉 Tạo đơn mua gói thành công! Cổng thanh toán đã mở trong tab mới.')
      setMsgTone('success')
      if (result.payment_url) window.open(result.payment_url, '_blank', 'noopener,noreferrer')
      await load()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Mua gói thất bại')
      setMsgTone('error')
    }
  }

  const stats = useMemo(() => ({
    total: rows.length,
    experts: rows.reduce((t, r) => t + Number(r.so_chuyen_gia ?? 0), 0),
  }), [rows])

  return (
    <>
      <SectionHeader
        title='Gói dịch vụ'
        subtitle='Khám phá các gói tư vấn dinh dưỡng phù hợp với nhu cầu của bạn.'
        action={<Link href='/user/my-packages'><UserButton variant='secondary'>Gói của tôi</UserButton></Link>}
      />

      {message && <UserNotice tone={msgTone}>{message}</UserNotice>}

      <div className='grid-stats'>
        <UserStatCard label='Gói đang bán' value={String(stats.total)} icon={Package} tone='blue' />
        <UserStatCard label='Chuyên gia khả dụng' value={String(stats.experts)} icon={Sparkles} tone='green' />
      </div>

      {rows.length === 0 ? (
        <UserEmptyState icon={Package} title='Chưa có gói dịch vụ' description='Hiện tại chưa có gói nào đang mở bán. Vui lòng quay lại sau.' />
      ) : (
        <div className='grid-cards'>
          {rows.map((row) => (
            <div key={row.id} className='package-card'>
              {row.banner_url || row.thumbnail_url ? (
                <div className='package-card__media'>
                  <img src={row.banner_url ?? row.thumbnail_url} alt={row.ten_goi} className='package-card__media-image' />
                </div>
              ) : null}
              <div className='package-card__name'>{row.ten_goi}</div>
              <div className='package-card__desc'>{row.mo_ta}</div>
              <div className='package-card__meta'>
                <span className='package-card__meta-item'>Loại: <strong>{row.loai_goi}</strong></span>
                <span className='package-card__meta-item'>Thời hạn: <strong>{row.thoi_han_ngay} ngày</strong></span>
                <span className='package-card__meta-item'>Lượt tư vấn: <strong>{row.so_luot_tu_van}</strong></span>
              </div>
              <div className='package-card__footer'>
                <div>
                  <span className='package-card__price'>{money(row.gia_khuyen_mai ?? row.gia)}</span>
                  {row.gia_khuyen_mai && <span className='package-card__price-old'>{money(row.gia)}</span>}
                </div>
                <UserButton onClick={() => buy(row.id)}>Mua ngay</UserButton>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  )
}
