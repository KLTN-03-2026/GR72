'use client'

import { useEffect, useState } from 'react'
import { Wallet, TrendingUp, Calendar, Download, FileText, Hash, Package } from 'lucide-react'
import { SectionHeader, Card, UserStatCard, UserButton, UserNotice, UserEmptyState, StatusBadge, money } from '@/components/user/user-ui'
import { expertGet } from '@/lib/expert-api'
import { statusLabel } from '@/lib/i18n'

type Row = Record<string, any>

export default function EarningsPage() {
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7))
  const [data, setData] = useState<Row | null>(null)
  const [message, setMessage] = useState('')
  const [msgTone, setMsgTone] = useState<'success' | 'error' | 'info'>('info')
  const [loading, setLoading] = useState(false)
  const [exporting, setExporting] = useState(false)

  async function load() {
    setLoading(true)
    try {
      setData(await expertGet<Row>(`/earnings?month=${month}`))
    } catch (e: any) {
      setMessage(e.message ?? 'Lỗi tải dữ liệu')
      setMsgTone('error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function exportFile() {
    if (!data?.period?.id) {
      setMessage('Tháng này chưa có kỳ hoa hồng để export sao kê.')
      setMsgTone('info')
      return
    }
    setExporting(true)
    try {
      const result = await expertGet<Row>(`/earnings/${data.period.id}/export`)
      setMessage(`✅ Đã tạo file sao kê: ${result.file_url}`)
      setMsgTone('success')
    } catch (e: any) {
      setMessage(e.message ?? 'Lỗi export')
      setMsgTone('error')
    } finally {
      setExporting(false)
    }
  }

  function quickMonth(offset: number) {
    const d = new Date()
    d.setMonth(d.getMonth() + offset)
    setMonth(d.toISOString().slice(0, 7))
    setTimeout(load, 0)
  }

  const lines: Row[] = Array.isArray(data?.lines) ? data!.lines : []
  const periodStatus = data?.period?.trang_thai

  return (
    <>
      <SectionHeader
        title='Thu nhập và hoa hồng'
        subtitle='Theo dõi doanh thu, hoa hồng và trạng thái chi trả theo từng kỳ.'
        action={
          <UserButton onClick={exportFile} disabled={exporting || !data?.period?.id}>
            <Download size={14} /> {exporting ? 'Đang export...' : 'Export sao kê'}
          </UserButton>
        }
      />

      {message && <UserNotice tone={msgTone}>{message}</UserNotice>}

      {/* Filter bar */}
      <Card>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 200px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 700, color: '#475569', marginBottom: 6 }}>
              <Calendar size={14} style={{ color: '#6366f1' }} />
              Chọn tháng
            </label>
            <input
              type='month'
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 13.5, outline: 'none' }}
            />
          </div>
          <UserButton onClick={load} disabled={loading}>
            {loading ? 'Đang tải...' : 'Áp dụng'}
          </UserButton>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <UserButton size='sm' variant='ghost' onClick={() => quickMonth(0)}>Tháng này</UserButton>
            <UserButton size='sm' variant='ghost' onClick={() => quickMonth(-1)}>Tháng trước</UserButton>
            <UserButton size='sm' variant='ghost' onClick={() => quickMonth(-2)}>2 tháng trước</UserButton>
          </div>
        </div>
      </Card>

      {data && (
        <>
          {/* Stats summary */}
          <div className='grid-stats'>
            <UserStatCard label='Booking tính hoa hồng' value={String(data.summary?.bookings ?? 0)} icon={FileText} tone='blue' />
            <UserStatCard label='Doanh thu hợp lệ' value={money(data.summary?.revenue)} icon={TrendingUp} tone='green' />
            <UserStatCard label='Hoa hồng nhận' value={money(data.summary?.commission)} icon={Wallet} tone='purple' />
            <UserStatCard label='Trạng thái kỳ' value={periodStatus ? statusLabel(periodStatus) ?? periodStatus : 'Chưa có'} icon={Calendar} tone='orange' />
          </div>

          {/* Booking list */}
          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#0f172a' }}>Chi tiết booking ({lines.length})</h2>
                <p style={{ margin: '2px 0 0', fontSize: 13, color: '#64748b' }}>
                  Đây là cơ sở để admin chốt và chi trả hoa hồng.
                </p>
              </div>
              {periodStatus && <StatusBadge value={periodStatus} />}
            </div>

            {lines.length === 0 ? (
              <UserEmptyState
                icon={Wallet}
                title='Chưa có booking nào'
                description='Tháng này chưa có booking hoàn thành tính hoa hồng. Thử chọn tháng khác.'
              />
            ) : (
              <div style={{ display: 'grid', gap: 10 }}>
                {lines.map((row) => (
                  <div key={row.id} style={{
                    padding: 14, background: '#fafafa', borderRadius: 12, border: '1px solid #f1f5f9',
                    display: 'grid', gap: 8,
                    gridTemplateColumns: 'minmax(0, 1fr) auto', alignItems: 'center',
                  }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                        <span style={{ fontSize: 12, color: '#6366f1', fontWeight: 700, fontFamily: 'monospace' }}>
                          <Hash size={11} style={{ display: 'inline', marginRight: 2, verticalAlign: 'middle' }} />
                          {row.ma_lich_hen}
                        </span>
                        <StatusBadge value={row.trang_thai} />
                      </div>
                      <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Package size={13} style={{ color: '#94a3b8' }} />
                        {row.ten_goi}
                      </p>
                      <p style={{ margin: '2px 0 0', fontSize: 12, color: '#94a3b8' }}>
                        {String(row.ngay_hen).slice(0, 10)} · Doanh thu {money(row.doanh_thu_hop_le)} · Tỷ lệ {row.ty_le_hoa_hong}%
                      </p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ margin: 0, fontSize: 11, color: '#64748b', fontWeight: 600 }}>HOA HỒNG</p>
                      <p style={{ margin: '2px 0 0', fontSize: 18, fontWeight: 800, color: '#10b981' }}>
                        {money(row.so_tien_hoa_hong)}
                      </p>
                    </div>
                  </div>
                ))}

                {/* Total row */}
                <div style={{
                  padding: '14px 16px', background: 'linear-gradient(135deg, #f0fdf4, #ecfdf5)', borderRadius: 12, border: '1px solid #d1fae5',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4,
                }}>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#065f46' }}>
                    Tổng cộng {lines.length} booking
                  </p>
                  <p style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#065f46' }}>
                    {money(data.summary?.commission)}
                  </p>
                </div>
              </div>
            )}
          </Card>
        </>
      )}

      {!data && loading && (
        <Card><p style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>Đang tải dữ liệu hoa hồng...</p></Card>
      )}
    </>
  )
}
