'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { Package, Sparkles, X, Check, Clock, Users, Award, ShieldCheck } from 'lucide-react'
import { SectionHeader, UserStatCard, UserButton, UserNotice, UserEmptyState, money } from '@/components/user/user-ui'
import { customerGet, customerPost } from '@/lib/customer-api'

type Row = Record<string, any>

const LOAI_LABEL: Record<string, string> = {
  dinh_duong: 'Dinh dưỡng',
  tap_luyen: 'Tập luyện',
  suc_khoe: 'Sức khoẻ tổng quát',
}

export default function PackagesPage() {
  const [rows, setRows] = useState<Row[]>([])
  const [message, setMessage] = useState('')
  const [msgTone, setMsgTone] = useState<'success' | 'error' | 'info'>('info')
  const [selected, setSelected] = useState<Row | null>(null)
  const [buying, setBuying] = useState(false)

  async function load() {
    setRows(await customerGet<Row[]>('/service-packages'))
  }

  useEffect(() => {
    load().catch((e) => { setMessage(e.message); setMsgTone('error') })
  }, [])

  // Lock body scroll khi modal mở
  useEffect(() => {
    document.body.style.overflow = selected ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [selected])

  async function buy(packageId: number) {
    setBuying(true)
    try {
      const result = await customerPost<Row>('/package-purchases', { goi_dich_vu_id: packageId })
      setMessage('🎉 Tạo đơn mua gói thành công! Cổng thanh toán đã mở trong tab mới.')
      setMsgTone('success')
      if (result.payment_url) window.open(result.payment_url, '_blank', 'noopener,noreferrer')
      setSelected(null)
      await load()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Mua gói thất bại')
      setMsgTone('error')
    } finally {
      setBuying(false)
    }
  }

  function getBlockedReason(row: Row): string {
    if (row.da_so_huu) return 'Bạn đã có gói này (đang hiệu lực hoặc đang chờ thanh toán).'
    if (row.da_co_goi_cung_loai) return 'Bạn đang có gói cùng loại còn hiệu lực.'
    return ''
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
            <div
              key={row.id}
              className='package-card'
              onClick={() => setSelected(row)}
              style={{ cursor: 'pointer' }}
            >
              {row.banner_url || row.thumbnail_url ? (
                <div className='package-card__media'>
                  <img src={row.banner_url ?? row.thumbnail_url} alt={row.ten_goi} className='package-card__media-image' />
                  {row.goi_noi_bat ? (
                    <div style={{ position: 'absolute', top: 12, left: 12, background: 'linear-gradient(135deg, #f59e0b, #ef4444)', color: 'white', padding: '4px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700, letterSpacing: 0.3, boxShadow: '0 4px 12px rgba(239,68,68,.35)' }}>
                      ⭐ NỔI BẬT
                    </div>
                  ) : null}
                </div>
              ) : null}
              {getBlockedReason(row) ? <UserNotice tone='warning'>{getBlockedReason(row)}</UserNotice> : null}
              <div className='package-card__name'>{row.ten_goi}</div>
              <div className='package-card__desc'>{row.mo_ta}</div>
              <div className='package-card__meta'>
                <span className='package-card__meta-item'>Loại: <strong>{LOAI_LABEL[row.loai_goi] ?? row.loai_goi}</strong></span>
                <span className='package-card__meta-item'>Thời hạn: <strong>{row.thoi_han_ngay} ngày</strong></span>
                <span className='package-card__meta-item'>Lượt tư vấn: <strong>{row.so_luot_tu_van}</strong></span>
              </div>
              <div className='package-card__footer'>
                <div>
                  <span className='package-card__price'>{money(row.gia_khuyen_mai ?? row.gia)}</span>
                  {row.gia_khuyen_mai && <span className='package-card__price-old'>{money(row.gia)}</span>}
                </div>
                <span onClick={(e) => e.stopPropagation()}>
                  <UserButton variant='secondary' onClick={() => setSelected(row)}>
                    Xem chi tiết
                  </UserButton>
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {selected && (
        <PackageDetailModal
          row={selected}
          onClose={() => setSelected(null)}
          onBuy={() => buy(selected.id)}
          buying={buying}
          blockedReason={getBlockedReason(selected)}
        />
      )}
    </>
  )
}

function PackageDetailModal({ row, onClose, onBuy, buying, blockedReason }: {
  row: Row
  onClose: () => void
  onBuy: () => void
  buying: boolean
  blockedReason: string
}) {
  const quyenLoi: string[] = Array.isArray(row.quyen_loi) ? row.quyen_loi : []
  const discount = row.gia_khuyen_mai ? Math.round((1 - row.gia_khuyen_mai / row.gia) * 100) : 0

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
          background: 'white', borderRadius: 20, maxWidth: 920, width: '100%',
          maxHeight: '92vh', overflow: 'auto', position: 'relative',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,.25)', animation: 'slideUp 0.3s ease',
        }}
      >
        {/* Banner */}
        <div style={{ position: 'relative', height: 280, overflow: 'hidden', borderTopLeftRadius: 20, borderTopRightRadius: 20 }}>
          {row.banner_url || row.thumbnail_url ? (
            <img
              src={row.banner_url ?? row.thumbnail_url}
              alt={row.ten_goi}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }} />
          )}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,.7), transparent 60%)' }} />

          {/* Badges */}
          <div style={{ position: 'absolute', top: 16, left: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {row.goi_noi_bat && (
              <span style={{ background: 'linear-gradient(135deg, #f59e0b, #ef4444)', color: 'white', padding: '6px 12px', borderRadius: 999, fontSize: 12, fontWeight: 700, boxShadow: '0 4px 12px rgba(239,68,68,.4)' }}>
                ⭐ Gói nổi bật
              </span>
            )}
            {discount > 0 && (
              <span style={{ background: '#10b981', color: 'white', padding: '6px 12px', borderRadius: 999, fontSize: 12, fontWeight: 700, boxShadow: '0 4px 12px rgba(16,185,129,.4)' }}>
                -{discount}% GIẢM
              </span>
            )}
          </div>

          {/* Close button */}
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

          {/* Title overlay */}
          <div style={{ position: 'absolute', bottom: 20, left: 24, right: 24, color: 'white' }}>
            <p style={{ margin: 0, fontSize: 12, fontWeight: 600, opacity: 0.9, letterSpacing: 0.5, textTransform: 'uppercase' }}>
              {LOAI_LABEL[row.loai_goi] ?? row.loai_goi}
            </p>
            <h2 style={{ margin: '4px 0 0', fontSize: 28, fontWeight: 800, letterSpacing: -0.5, textShadow: '0 2px 8px rgba(0,0,0,.3)' }}>
              {row.ten_goi}
            </h2>
          </div>
        </div>

        <div style={{ padding: 28 }}>
          {/* Quick stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 24 }}>
            <StatBox icon={<Users size={18} />} label='Lượt tư vấn' value={`${row.so_luot_tu_van} buổi`} color='#6366f1' />
            <StatBox icon={<Clock size={18} />} label='Thời lượng' value={`${row.thoi_luong_tu_van_phut} phút/buổi`} color='#10b981' />
            <StatBox icon={<Award size={18} />} label='Hiệu lực' value={`${row.thoi_han_ngay} ngày`} color='#f59e0b' />
            <StatBox icon={<ShieldCheck size={18} />} label='Chuyên gia' value={`${row.so_chuyen_gia ?? 0} người`} color='#8b5cf6' />
          </div>

          {/* Description */}
          <div style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', margin: '0 0 8px', letterSpacing: -0.2 }}>
              📝 Giới thiệu gói
            </h3>
            <p style={{ margin: 0, fontSize: 14, lineHeight: 1.7, color: '#475569' }}>
              {row.mo_ta}
            </p>
          </div>

          {/* Quyen loi */}
          {quyenLoi.length > 0 && (
            <div style={{ marginBottom: 24, padding: 20, background: 'linear-gradient(135deg, #f0fdf4, #ecfdf5)', borderRadius: 14, border: '1px solid #d1fae5' }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#065f46', margin: '0 0 14px', letterSpacing: -0.2 }}>
                ✨ Bạn sẽ nhận được gì
              </h3>
              <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gap: 10 }}>
                {quyenLoi.map((item, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 14, color: '#0f172a' }}>
                    <span style={{ flexShrink: 0, marginTop: 2, width: 20, height: 20, borderRadius: '50%', background: '#10b981', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Check size={12} strokeWidth={3} />
                    </span>
                    <span style={{ lineHeight: 1.5 }}>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Why choose us */}
          <div style={{ marginBottom: 24, padding: 20, background: '#f8faff', borderRadius: 14, border: '1px solid #e0e7ff' }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#3730a3', margin: '0 0 14px', letterSpacing: -0.2 }}>
              💎 Tại sao chọn chúng tôi
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
              {[
                { icon: '🎓', title: 'Chuyên gia hàng đầu', desc: 'Đội ngũ bác sĩ, ThS, PT giàu kinh nghiệm' },
                { icon: '💬', title: 'Tư vấn 1-1 trực tuyến', desc: 'Video call HD, riêng tư và bảo mật' },
                { icon: '📊', title: 'Theo dõi tiến trình', desc: 'Cập nhật chỉ số sức khoẻ chi tiết' },
                { icon: '🔄', title: 'Hoàn tiền linh hoạt', desc: 'Hỗ trợ đổi/huỷ buổi tư vấn dễ dàng' },
              ].map((b, i) => (
                <div key={i} style={{ display: 'flex', gap: 10 }}>
                  <span style={{ fontSize: 22, lineHeight: 1 }}>{b.icon}</span>
                  <div>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{b.title}</p>
                    <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748b', lineHeight: 1.4 }}>{b.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Price + CTA */}
          {blockedReason && <UserNotice tone='warning'>{blockedReason}</UserNotice>}

          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            gap: 16, padding: 20, background: 'linear-gradient(135deg, #faf5ff, #eff6ff)',
            borderRadius: 14, border: '1px solid #e0e7ff',
          }}>
            <div>
              <p style={{ margin: 0, fontSize: 12, color: '#64748b', fontWeight: 600 }}>Giá ưu đãi</p>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginTop: 4 }}>
                <span style={{ fontSize: 30, fontWeight: 800, color: '#6366f1', letterSpacing: -0.5 }}>
                  {money(row.gia_khuyen_mai ?? row.gia)}
                </span>
                {row.gia_khuyen_mai && (
                  <span style={{ fontSize: 16, color: '#94a3b8', textDecoration: 'line-through' }}>
                    {money(row.gia)}
                  </span>
                )}
              </div>
            </div>
            <UserButton
              size='lg'
              disabled={!!blockedReason || buying}
              onClick={onBuy}
            >
              {buying ? 'Đang xử lý...' : blockedReason ? 'Không thể mua' : '🛒 Mua ngay'}
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

function StatBox({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <div style={{ padding: 14, background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ width: 38, height: 38, borderRadius: 10, background: `${color}15`, color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {icon}
      </div>
      <div style={{ minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: 11, color: '#64748b', fontWeight: 600, letterSpacing: 0.3, textTransform: 'uppercase' }}>{label}</p>
        <p style={{ margin: '2px 0 0', fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{value}</p>
      </div>
    </div>
  )
}
