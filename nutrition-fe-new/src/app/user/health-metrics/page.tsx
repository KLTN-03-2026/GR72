'use client'

import { useEffect, useState } from 'react'
import { Activity, Plus, TrendingUp, TrendingDown, Minus, AlertTriangle, Trash2, Edit } from 'lucide-react'
import { SectionHeader, Card, UserButton, UserNotice, UserStatCard } from '@/components/user/user-ui'
import { customerGet, customerPost, customerPatch, customerDelete } from '@/lib/customer-api'

type Row = Record<string, any>

const inputStyle: React.CSSProperties = { width: '100%', padding: '10px 14px', borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 13, outline: 'none', background: 'white' }

function fmtDate(iso: string) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })
}

export default function HealthMetricsPage() {
  const [metrics, setMetrics] = useState<Row[]>([])
  const [summary, setSummary] = useState<Row | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [form, setForm] = useState({ can_nang_kg: '', vong_eo_cm: '', vong_mong_cm: '', huyet_ap_tam_thu: '', huyet_ap_tam_truong: '', nhip_tim: '', duong_huyet: '', chat_luong_giac_ngu: '', muc_nang_luong: '', ghi_chu: '' })

  function loadData() {
    setLoading(true)
    Promise.all([
      customerGet<Row[]>('/health-metrics'),
      customerGet<Row>('/health-metrics/summary'),
    ]).then(([m, s]) => { setMetrics(m); setSummary(s) })
      .catch(() => {}).finally(() => setLoading(false))
  }

  useEffect(() => { loadData() }, [])

  async function handleSubmit() {
    setSaving(true); setMsg('')
    try {
      const body: Row = {}
      for (const [k, v] of Object.entries(form)) {
        if (v !== '' && k !== 'ghi_chu') body[k] = Number(v)
        else if (k === 'ghi_chu' && v) body[k] = v
      }
      await customerPost('/health-metrics', body)
      setMsg('✅ Đã ghi nhận chỉ số!')
      setShowForm(false)
      setForm({ can_nang_kg: '', vong_eo_cm: '', vong_mong_cm: '', huyet_ap_tam_thu: '', huyet_ap_tam_truong: '', nhip_tim: '', duong_huyet: '', chat_luong_giac_ngu: '', muc_nang_luong: '', ghi_chu: '' })
      loadData()
    } catch (e: any) { setMsg(e.message ?? 'Lỗi') } finally { setSaving(false) }
  }

  async function handleDelete(id: number) {
    if (!confirm('Xóa chỉ số này?')) return
    try { await customerDelete(`/health-metrics/${id}`); loadData() } catch {}
  }

  const trendIcon = summary?.weightTrend === 'tang' ? <TrendingUp size={16} /> : summary?.weightTrend === 'giam' ? <TrendingDown size={16} /> : <Minus size={16} />
  const trendLabel: Record<string, string> = { tang: 'Tăng cân', giam: 'Giảm cân', on_dinh: 'Ổn định', khong_du_du_lieu: 'Chưa đủ dữ liệu' }

  if (loading) return <div className='user-loading'><div className='user-loading__card'><div className='user-loading__spinner' />Đang tải...</div></div>

  return (
    <>
      <SectionHeader title='Chỉ số sức khỏe' subtitle='Theo dõi chỉ số cơ thể theo thời gian'
        action={<UserButton onClick={() => setShowForm(!showForm)} size='sm'><Plus size={14} /> Ghi chỉ số mới</UserButton>}
      />

      {/* Summary stats */}
      {summary && (
        <div className='grid-stats'>
          <UserStatCard label='BMI' value={summary.bmi ? String(summary.bmi) : '—'} icon={Activity} tone='blue' />
          <UserStatCard label='Phân loại' value={summary.bmiCategory || '—'} tone={summary.bmi && summary.bmi < 25 && summary.bmi >= 18.5 ? 'green' : 'orange'} />
          <UserStatCard label='Xu hướng cân nặng' value={trendLabel[summary.weightTrend] ?? '—'} tone={summary.weightTrend === 'on_dinh' ? 'green' : 'orange'} />
        </div>
      )}

      {/* Cảnh báo */}
      {summary?.warnings?.length > 0 && (
        <UserNotice tone='warning'>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
            <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: 2 }} />
            <div>
              <strong>Cảnh báo sức khỏe:</strong>
              <ul style={{ margin: '6px 0 0', paddingLeft: 18 }}>
                {summary?.warnings?.map((w: string, i: number) => <li key={i} style={{ fontSize: 13 }}>{w}</li>)}
              </ul>
            </div>
          </div>
        </UserNotice>
      )}

      {msg && <UserNotice tone={msg.startsWith('✅') ? 'success' : 'error'}>{msg}</UserNotice>}

      {/* Form nhập chỉ số */}
      {showForm && (
        <Card>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 16 }}>📊 Ghi nhận chỉ số mới</h3>
          <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
            {[
              { key: 'can_nang_kg', label: 'Cân nặng (kg)', placeholder: 'VD: 65' },
              { key: 'vong_eo_cm', label: 'Vòng eo (cm)', placeholder: 'VD: 75' },
              { key: 'vong_mong_cm', label: 'Vòng mông (cm)', placeholder: 'VD: 90' },
              { key: 'huyet_ap_tam_thu', label: 'HA tâm thu (mmHg)', placeholder: 'VD: 120' },
              { key: 'huyet_ap_tam_truong', label: 'HA tâm trương (mmHg)', placeholder: 'VD: 80' },
              { key: 'nhip_tim', label: 'Nhịp tim (bpm)', placeholder: 'VD: 72' },
              { key: 'duong_huyet', label: 'Đường huyết (mmol/L)', placeholder: 'VD: 5.5' },
              { key: 'chat_luong_giac_ngu', label: 'Giấc ngủ (1-10)', placeholder: '1-10' },
              { key: 'muc_nang_luong', label: 'Năng lượng (1-10)', placeholder: '1-10' },
            ].map(f => (
              <div key={f.key}>
                <p style={{ fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>{f.label}</p>
                <input type='number' step='any' style={inputStyle} value={(form as any)[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })} placeholder={f.placeholder} />
              </div>
            ))}
          </div>
          <div style={{ marginTop: 14 }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Ghi chú</p>
            <textarea style={{ ...inputStyle, minHeight: 60 }} value={form.ghi_chu} onChange={e => setForm({ ...form, ghi_chu: e.target.value })} placeholder='Ghi chú thêm...' />
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
            <UserButton onClick={handleSubmit} disabled={saving}>{saving ? 'Đang lưu...' : 'Lưu chỉ số'}</UserButton>
            <UserButton variant='ghost' onClick={() => setShowForm(false)}>Hủy</UserButton>
          </div>
        </Card>
      )}

      {/* Lịch sử chỉ số */}
      <div style={{ marginTop: 20 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 14 }}>📈 Lịch sử đo</h3>
        {metrics.length === 0 ? (
          <Card><p style={{ textAlign: 'center', color: '#94a3b8', padding: 24 }}>Chưa có chỉ số nào. Bấm &quot;Ghi chỉ số mới&quot; để bắt đầu theo dõi.</p></Card>
        ) : (
          <div style={{ display: 'grid', gap: 12 }}>
            {metrics.map((m) => (
              <Card key={m.id} hover>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <p style={{ fontSize: 12, color: '#6366f1', fontWeight: 700 }}>{fmtDate(m.do_luc)}</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 8 }}>
                      {m.can_nang_kg && <span style={{ fontSize: 13, color: '#475569' }}><strong>{m.can_nang_kg}</strong> kg</span>}
                      {m.bmi && <span style={{ fontSize: 13, color: '#475569' }}>BMI: <strong>{m.bmi}</strong></span>}
                      {m.huyet_ap_tam_thu && <span style={{ fontSize: 13, color: '#475569' }}>HA: <strong>{m.huyet_ap_tam_thu}/{m.huyet_ap_tam_truong}</strong></span>}
                      {m.nhip_tim && <span style={{ fontSize: 13, color: '#475569' }}>Nhịp: <strong>{m.nhip_tim}</strong> bpm</span>}
                      {m.duong_huyet && <span style={{ fontSize: 13, color: '#475569' }}>ĐH: <strong>{m.duong_huyet}</strong></span>}
                      {m.chat_luong_giac_ngu && <span style={{ fontSize: 13, color: '#475569' }}>Ngủ: <strong>{m.chat_luong_giac_ngu}/10</strong></span>}
                      {m.muc_nang_luong && <span style={{ fontSize: 13, color: '#475569' }}>NL: <strong>{m.muc_nang_luong}/10</strong></span>}
                    </div>
                    {m.canh_bao?.length > 0 && (
                      <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {m.canh_bao.map((w: string, i: number) => (
                          <span key={i} style={{ padding: '2px 8px', borderRadius: 6, background: '#fef2f2', color: '#dc2626', fontSize: 11, fontWeight: 600 }}>⚠️ {w}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <button onClick={() => handleDelete(m.id)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 4 }}><Trash2 size={15} /></button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
