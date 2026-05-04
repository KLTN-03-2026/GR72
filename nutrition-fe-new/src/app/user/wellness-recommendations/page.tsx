'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Utensils, Dumbbell, CheckCircle, MessageSquare, AlertTriangle, Sparkles } from 'lucide-react'
import { SectionHeader, Card, UserButton, UserNotice } from '@/components/user/user-ui'
import { customerGet, customerPost } from '@/lib/customer-api'

type Row = Record<string, any>

const statusMap: Record<string, { label: string; color: string; bg: string }> = {
  moi_tao: { label: 'Mới tạo', color: '#d97706', bg: '#fffbeb' },
  da_ap_dung: { label: 'Đã áp dụng', color: '#059669', bg: '#ecfdf5' },
  luu_tru: { label: 'Lưu trữ', color: '#64748b', bg: '#f1f5f9' },
}

function fmtDate(iso: string) { return iso ? new Date(iso).toLocaleDateString('vi-VN', { dateStyle: 'medium' }) : '—' }

function normalizeList(value: unknown): Row[] {
  if (Array.isArray(value)) return value.filter((item) => item && typeof item === 'object') as Row[]
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) return []
    try {
      const parsed = JSON.parse(trimmed)
      return Array.isArray(parsed) ? parsed.filter((item) => item && typeof item === 'object') as Row[] : []
    } catch {
      return []
    }
  }
  return []
}

export default function WellnessRecommendationsPage() {
  const [latest, setLatest] = useState<Row | null>(null)
  const [list, setList] = useState<Row[]>([])
  const [dataReady, setDataReady] = useState(true)
  const [missing, setMissing] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState('')

  function loadData() {
    setLoading(true)
    Promise.all([
      customerGet<Row>('/wellness-recommendations/latest'),
      customerGet<Row[]>('/wellness-recommendations'),
    ]).then(([latestPayload, all]) => {
      setDataReady(Boolean(latestPayload?.data_ready))
      setMissing(Array.isArray(latestPayload?.completion?.missing) ? latestPayload.completion.missing : [])
      setLatest((latestPayload?.recommendation as Row) ?? null)
      setList(all)
      if (latestPayload?.auto_generated) {
        setMsg('✅ Hệ thống vừa tự động cập nhật gợi ý dinh dưỡng & tập luyện mới nhất.')
      }
    })
      .catch(() => {}).finally(() => setLoading(false))
  }

  useEffect(() => { loadData() }, [])

  async function handleApply(id: number) {
    try {
      const res = await customerPost<Row>(`/wellness-recommendations/${id}/apply`, {})
      setLatest((current) => current ? { ...current, trang_thai: 'da_ap_dung', ap_dung_luc: new Date().toISOString() } : current)
      setMsg(`✅ ${res.message ?? 'Đã chọn kế hoạch đang áp dụng.'}`)
      loadData()
    } catch (e: any) { setMsg(e.message) }
  }

  async function handleAskExpert(id: number) {
    try {
      const res = await customerPost<Row>(`/wellness-recommendations/${id}/ask-expert`, {})
      if (res.has_active_package) {
        window.location.href = `/user/experts?packagePurchaseId=${res.package_purchase_id}`
      } else {
        setMsg('Bạn cần mua gói dịch vụ để đặt lịch tư vấn chuyên gia. → Mua gói tại trang Gói dịch vụ')
      }
    } catch (e: any) { setMsg(e.message) }
  }

  const activeRecommendation = list.find((item) => item.trang_thai === 'da_ap_dung') ?? (latest?.trang_thai === 'da_ap_dung' ? latest : null)
  const historyRecommendations = list
    .filter((item) => !activeRecommendation || Number(item.id) !== Number(activeRecommendation.id))
    .slice(0, 5)

  if (loading) return <div className='user-loading'><div className='user-loading__card'><div className='user-loading__spinner' />Đang tải...</div></div>

  return (
    <>
      <SectionHeader title='Gợi ý dinh dưỡng & tập luyện' subtitle='Kế hoạch được hệ thống tự động cập nhật theo hồ sơ, chỉ số và mục tiêu mới nhất' />

      {msg && <UserNotice tone={msg.startsWith('✅') ? 'success' : msg.includes('cần mua') ? 'warning' : 'error'}>{msg}</UserNotice>}
      <UserNotice tone='info'>
        Cách hoạt động: hệ thống tự cập nhật recommendation khi dữ liệu thay đổi. Bạn chọn 1 kế hoạch để dùng hiện tại, sau đó có thể mang kế hoạch này đi trao đổi với chuyên gia.
      </UserNotice>
      {!dataReady && (
        <UserNotice tone='warning'>
          Chưa đủ dữ liệu để tính recommendation tự động.
          {missing.length ? ` Thiếu: ${missing.join(', ')}` : ' Vui lòng cập nhật chiều cao/cân nặng trong hồ sơ sức khỏe.'}
        </UserNotice>
      )}

      {activeRecommendation && (
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <p style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Kế hoạch đang áp dụng</p>
            <span style={{ padding: '4px 10px', borderRadius: 100, fontSize: 11, fontWeight: 700, background: '#ecfdf5', color: '#059669' }}>
              Đang dùng
            </span>
          </div>
          <p style={{ fontSize: 12, color: '#64748b' }}>{fmtDate(activeRecommendation.tao_luc)} · {activeRecommendation.ly_do}</p>
        </Card>
      )}

      {latest ? (
        <>
          {/* Macros summary */}
          <div className='grid-stats'>
            <div className='user-stat user-stat--orange'>
              <div className='user-stat__icon'><Sparkles size={20} /></div>
              <div><p className='user-stat__label'>Calories/ngày</p><p className='user-stat__value'>{latest.muc_tieu_calories ?? '—'}</p></div>
            </div>
            <div className='user-stat user-stat--blue'>
              <div className='user-stat__icon'>P</div>
              <div><p className='user-stat__label'>Protein (g)</p><p className='user-stat__value'>{latest.muc_tieu_protein_g ?? '—'}</p></div>
            </div>
            <div className='user-stat user-stat--green'>
              <div className='user-stat__icon'>C</div>
              <div><p className='user-stat__label'>Carb (g)</p><p className='user-stat__value'>{latest.muc_tieu_carb_g ?? '—'}</p></div>
            </div>
            <div className='user-stat user-stat--purple'>
              <div className='user-stat__icon'>F</div>
              <div><p className='user-stat__label'>Fat (g)</p><p className='user-stat__value'>{latest.muc_tieu_fat_g ?? '—'}</p></div>
            </div>
          </div>

          {/* Cảnh báo */}
          {latest.canh_bao?.length > 0 && (
            <UserNotice tone='warning'>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: 2 }} />
                <div>
                  <strong>Lưu ý quan trọng:</strong>
                  {latest.canh_bao.map((w: string, i: number) => <p key={i} style={{ fontSize: 13, marginTop: 4 }}>• {w}</p>)}
                </div>
              </div>
            </UserNotice>
          )}

          <div style={{ display: 'grid', gap: 20, gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
            {/* Dinh dưỡng */}
            <Card>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #ecfdf5, #d1fae5)', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Utensils size={16} /></div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>Dinh dưỡng</h3>
              </div>
              {normalizeList(latest.goi_y_dinh_duong).map((item: Row, i: number) => (
                <div key={i} style={{ padding: '10px 0', borderBottom: '1px solid #f1f5f9' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ padding: '2px 8px', borderRadius: 6, fontSize: 10, fontWeight: 700, background: item.loai === 'uu_tien' ? '#ecfdf5' : item.loai === 'tranh' ? '#fef2f2' : '#fffbeb', color: item.loai === 'uu_tien' ? '#059669' : item.loai === 'tranh' ? '#dc2626' : '#d97706' }}>
                      {item.loai === 'uu_tien' ? 'Ưu tiên' : item.loai === 'tranh' ? 'Tránh' : 'Hạn chế'}
                    </span>
                    {item.do_uu_tien ? <span style={{ padding: '2px 8px', borderRadius: 6, fontSize: 10, fontWeight: 700, background: '#ede9fe', color: '#6d28d9' }}>{item.do_uu_tien}</span> : null}
                  </div>
                  <p style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', marginTop: 4 }}>{item.goi_y}</p>
                  <p style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{item.ly_do}</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                    {item.tan_suat ? <span style={{ padding: '2px 8px', borderRadius: 6, fontSize: 11, background: '#eff6ff', color: '#1d4ed8' }}>Tần suất: {item.tan_suat}</span> : null}
                    {item.bua_goi_y ? <span style={{ padding: '2px 8px', borderRadius: 6, fontSize: 11, background: '#ecfeff', color: '#0e7490' }}>Bữa: {item.bua_goi_y}</span> : null}
                    {item.thay_the_goi_y ? <span style={{ padding: '2px 8px', borderRadius: 6, fontSize: 11, background: '#f8fafc', color: '#475569' }}>Thay thế: {item.thay_the_goi_y}</span> : null}
                  </div>
                </div>
              ))}
            </Card>

            {/* Tập luyện */}
            <Card>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #eef2ff, #e0e7ff)', color: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Dumbbell size={16} /></div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>Tập luyện</h3>
              </div>
              {normalizeList(latest.goi_y_tap_luyen).map((item: Row, i: number) => (
                <div key={i} style={{ padding: '10px 0', borderBottom: '1px solid #f1f5f9' }}>
                  <span style={{ padding: '2px 8px', borderRadius: 6, fontSize: 10, fontWeight: 700, background: '#eef2ff', color: '#6366f1' }}>{item.muc_do}</span>
                  <p style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', marginTop: 4 }}>{item.goi_y}</p>
                  <p style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{item.ly_do}</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                    {item.tan_suat ? <span style={{ padding: '2px 8px', borderRadius: 6, fontSize: 11, background: '#ecfeff', color: '#0e7490' }}>Tần suất: {item.tan_suat}</span> : null}
                    {item.thoi_luong ? <span style={{ padding: '2px 8px', borderRadius: 6, fontSize: 11, background: '#eff6ff', color: '#1d4ed8' }}>Thời lượng: {item.thoi_luong}</span> : null}
                  </div>
                </div>
              ))}
            </Card>
          </div>

          {/* Actions */}
          {latest.trang_thai === 'moi_tao' && (
            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <UserButton onClick={() => handleApply(latest.id)}><CheckCircle size={14} /> Dùng kế hoạch này</UserButton>
              <UserButton variant='secondary' onClick={() => handleAskExpert(latest.id)}><MessageSquare size={14} /> Trao đổi với chuyên gia</UserButton>
            </div>
          )}

          {/* Thông tin tính toán */}
          {latest.input_snapshot?.calculated && (
            <Card>
              <p style={{ fontSize: 13, color: '#64748b' }}>
                <strong>Chi tiết tính toán:</strong> BMR = {latest.input_snapshot.calculated.bmr} kcal → 
                TDEE = {latest.input_snapshot.calculated.tdee} kcal → 
                Mục tiêu = {latest.input_snapshot.calculated.target_calories} kcal/ngày | 
                BMI = {latest.input_snapshot.calculated.bmi ?? '—'}
              </p>
              <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>Tạo lúc: {fmtDate(latest.tao_luc)} · {latest.ly_do}</p>
            </Card>
          )}
        </>
      ) : (
        <Card>
          <div style={{ textAlign: 'center', padding: 32 }}>
            <Utensils size={40} color='#c7d2fe' />
            <p style={{ fontSize: 15, fontWeight: 700, color: '#475569', marginTop: 12 }}>Chưa có gợi ý</p>
            <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>Hệ thống sẽ tự tạo gợi ý khi hồ sơ và chỉ số đã đủ dữ liệu</p>
            <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 8 }}>
              Cần <Link href='/user/health-profile' style={{ color: '#6366f1', fontWeight: 600 }}>hoàn thành hồ sơ sức khỏe</Link> (chiều cao, cân nặng) trước
            </p>
          </div>
        </Card>
      )}

      {/* Lịch sử */}
      {historyRecommendations.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 14 }}>Lịch sử gợi ý (tối đa 5)</h3>
          <div style={{ display: 'grid', gap: 10 }}>
            {historyRecommendations.map((r) => {
              const st = statusMap[r.trang_thai] ?? { label: r.trang_thai, color: '#64748b', bg: '#f1f5f9' }
              return (
                <Card key={r.id} hover>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{fmtDate(r.tao_luc)} — {r.muc_tieu_calories} kcal/ngày</p>
                      <p style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{r.ly_do}</p>
                    </div>
                    <span style={{ padding: '4px 10px', borderRadius: 100, fontSize: 11, fontWeight: 700, background: st.bg, color: st.color }}>{st.label}</span>
                  </div>
                </Card>
              )
            })}
          </div>
        </div>
      )}
    </>
  )
}
