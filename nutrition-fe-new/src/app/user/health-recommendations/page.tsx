'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Sparkles, CheckCircle, Archive, AlertTriangle } from 'lucide-react'
import { SectionHeader, Card, UserButton, UserNotice } from '@/components/user/user-ui'
import { customerGet, customerPatch } from '@/lib/customer-api'

type Row = Record<string, any>

const statusMap: Record<string, { label: string; tone: string }> = {
  moi_tao: { label: 'Mới tạo', tone: 'orange' },
  da_ap_dung: { label: 'Đã áp dụng', tone: 'green' },
  luu_tru: { label: 'Lưu trữ', tone: 'slate' },
}

const priorityColors: Record<string, string> = { cao: '#dc2626', trung_binh: '#d97706', thap: '#059669' }

function fmtDate(iso: string) {
  return iso ? new Date(iso).toLocaleDateString('vi-VN', { dateStyle: 'medium' }) : '—'
}

export default function HealthRecommendationsPage() {
  const [latest, setLatest] = useState<Row | null>(null)
  const [list, setList] = useState<Row[]>([])
  const [dataReady, setDataReady] = useState(true)
  const [missing, setMissing] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState('')

  function loadData() {
    setLoading(true)
    Promise.all([
      customerGet<Row>('/health-recommendations/latest'),
      customerGet<Row[]>('/health-recommendations'),
    ]).then(([latestPayload, all]) => {
      setDataReady(Boolean(latestPayload?.data_ready))
      setMissing(Array.isArray(latestPayload?.completion?.missing) ? latestPayload.completion.missing : [])
      setLatest((latestPayload?.recommendation as Row) ?? null)
      setList(all)
      if (latestPayload?.auto_generated) {
        setMsg('✅ Hệ thống vừa tự động cập nhật gợi ý theo dữ liệu mới nhất.')
      }
    })
      .catch(() => {}).finally(() => setLoading(false))
  }

  useEffect(() => { loadData() }, [])

  async function handleApply(id: number) {
    try {
      const res = await customerPatch<Row>(`/health-recommendations/${id}/apply`, {})
      setLatest((current) => current ? { ...current, trang_thai: 'da_ap_dung', ap_dung_luc: new Date().toISOString() } : current)
      setMsg(`✅ ${res.message ?? 'Đã chọn kế hoạch đang áp dụng.'}`)
      loadData()
    } catch (e: any) { setMsg(e.message) }
  }

  async function handleArchive(id: number) {
    try { await customerPatch(`/health-recommendations/${id}/archive`, {}); loadData() } catch (e: any) { setMsg(e.message) }
  }

  const activeRecommendation = list.find((item) => item.trang_thai === 'da_ap_dung') ?? (latest?.trang_thai === 'da_ap_dung' ? latest : null)
  const historyRecommendations = list
    .filter((item) => !activeRecommendation || Number(item.id) !== Number(activeRecommendation.id))
    .slice(0, 5)

  if (loading) return <div className='user-loading'><div className='user-loading__card'><div className='user-loading__spinner' />Đang tải...</div></div>

  return (
    <>
      <SectionHeader title='Gợi ý kế hoạch sức khỏe' subtitle='Hệ thống tự động cập nhật theo hồ sơ, chỉ số và mục tiêu mới nhất của bạn' />

      {msg && <UserNotice tone={msg.startsWith('✅') ? 'success' : 'error'}>{msg}</UserNotice>}
      <UserNotice tone='info'>
        Cách hoạt động: hệ thống tự tạo gợi ý mới khi hồ sơ/chỉ số thay đổi. Bạn chỉ cần chọn 1 kế hoạch đang áp dụng, các kế hoạch đã áp dụng trước đó sẽ chuyển lưu trữ.
      </UserNotice>

      {!dataReady && (
        <UserNotice tone='warning'>
          Cần bổ sung hồ sơ sức khỏe trước khi hệ thống có thể tạo gợi ý tự động.
          {missing.length ? ` Thiếu: ${missing.join(', ')}` : ''}
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

      {/* Latest recommendation */}
      {latest ? (
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg, #faf5ff, #e9d5ff)', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Sparkles size={18} />
              </div>
              <div>
                <p style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Gợi ý mới nhất</p>
                <p style={{ fontSize: 12, color: '#94a3b8' }}>{fmtDate(latest.tao_luc)}</p>
              </div>
            </div>
            <span style={{ padding: '4px 10px', borderRadius: 100, fontSize: 11, fontWeight: 700, background: latest.trang_thai === 'da_ap_dung' ? '#ecfdf5' : '#fffbeb', color: latest.trang_thai === 'da_ap_dung' ? '#059669' : '#d97706' }}>
              {statusMap[latest.trang_thai]?.label ?? latest.trang_thai}
            </span>
          </div>

          {/* Cảnh báo */}
          {latest.canh_bao?.length > 0 && (
            <div style={{ padding: 12, borderRadius: 10, background: '#fef2f2', border: '1px solid #fecaca', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <AlertTriangle size={14} color='#dc2626' />
                <strong style={{ fontSize: 13, color: '#dc2626' }}>Cảnh báo</strong>
              </div>
              {latest.canh_bao.map((w: string, i: number) => <p key={i} style={{ fontSize: 12, color: '#b91c1c', marginTop: 4 }}>• {w}</p>)}
            </div>
          )}

          {/* Actions */}
          {Array.isArray(latest.noi_dung_goi_y) && latest.noi_dung_goi_y.map((a: Row, i: number) => (
            <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '12px 0', borderBottom: i < latest.noi_dung_goi_y.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
              <div style={{ width: 8, height: 8, borderRadius: 4, background: priorityColors[a.muc_do] ?? '#94a3b8', marginTop: 6, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>{a.hanh_dong}</p>
                <p style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{a.ly_do}</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                  {a.nhom ? <span style={{ padding: '2px 8px', borderRadius: 6, fontSize: 11, background: '#f1f5f9', color: '#334155' }}>Nhóm: {a.nhom}</span> : null}
                  {a.tan_suat ? <span style={{ padding: '2px 8px', borderRadius: 6, fontSize: 11, background: '#ecfeff', color: '#155e75' }}>Tần suất: {a.tan_suat}</span> : null}
                  {a.thoi_diem_goi_y ? <span style={{ padding: '2px 8px', borderRadius: 6, fontSize: 11, background: '#eff6ff', color: '#1d4ed8' }}>Thời điểm: {a.thoi_diem_goi_y}</span> : null}
                  {a.ket_qua_ky_vong ? <span style={{ padding: '2px 8px', borderRadius: 6, fontSize: 11, background: '#ecfdf5', color: '#065f46' }}>Kỳ vọng: {a.ket_qua_ky_vong}</span> : null}
                </div>
                {Array.isArray(a.chi_so_theo_doi) && a.chi_so_theo_doi.length ? (
                  <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 5 }}>
                    Theo dõi: {a.chi_so_theo_doi.join(', ')}
                  </p>
                ) : null}
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, color: priorityColors[a.muc_do] ?? '#94a3b8', textTransform: 'capitalize', whiteSpace: 'nowrap' }}>{a.muc_do}</span>
            </div>
          ))}

          {latest.trang_thai === 'moi_tao' && (
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <UserButton size='sm' onClick={() => handleApply(latest.id)}><CheckCircle size={14} /> Chọn kế hoạch này</UserButton>
              <UserButton size='sm' variant='secondary' onClick={() => handleArchive(latest.id)}><Archive size={14} /> Để sau</UserButton>
            </div>
          )}
        </Card>
      ) : (
        <Card>
          <div style={{ textAlign: 'center', padding: 32 }}>
            <Sparkles size={40} color='#c7d2fe' />
            <p style={{ fontSize: 15, fontWeight: 700, color: '#475569', marginTop: 12 }}>Chưa có gợi ý sức khỏe</p>
            <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>Hệ thống sẽ tự tạo khi dữ liệu hồ sơ và chỉ số đã đủ</p>
            <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 8 }}>
              Cần <Link href='/user/health-profile' style={{ color: '#6366f1', fontWeight: 600 }}>hoàn thành hồ sơ sức khỏe</Link> trước
            </p>
          </div>
        </Card>
      )}

      {/* Lịch sử */}
      {historyRecommendations.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 14 }}>Lịch sử gợi ý (tối đa 5)</h3>
          <div style={{ display: 'grid', gap: 10 }}>
            {historyRecommendations.map((r) => (
              <Card key={r.id} hover>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{fmtDate(r.tao_luc)}</p>
                    <p style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{r.ly_do}</p>
                  </div>
                  <span style={{ padding: '4px 10px', borderRadius: 100, fontSize: 11, fontWeight: 700, background: r.trang_thai === 'da_ap_dung' ? '#ecfdf5' : '#f1f5f9', color: r.trang_thai === 'da_ap_dung' ? '#059669' : '#64748b' }}>
                    {statusMap[r.trang_thai]?.label ?? r.trang_thai}
                  </span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </>
  )
}
