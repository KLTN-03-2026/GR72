'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Heart, Save, CheckCircle, AlertTriangle } from 'lucide-react'
import { SectionHeader, Card, UserButton, UserNotice, StatusBadge } from '@/components/user/user-ui'
import { customerGet, customerPost } from '@/lib/customer-api'

type Row = Record<string, any>
type TagField = 'tinh_trang_suc_khoe' | 'di_ung' | 'che_do_an_uu_tien' | 'thuc_pham_khong_dung'

const GENDER_OPTIONS = [
  { value: 'nam', label: 'Nam' },
  { value: 'nu', label: 'Nữ' },
  { value: 'khac', label: 'Khác' },
]
const ACTIVITY_OPTIONS = [
  { value: 'it_van_dong', label: 'Ít vận động (ngồi văn phòng)' },
  { value: 'van_dong_nhe', label: 'Vận động nhẹ (1-3 ngày/tuần)' },
  { value: 'van_dong_vua', label: 'Vận động vừa (3-5 ngày/tuần)' },
  { value: 'nang_dong', label: 'Năng động (6-7 ngày/tuần)' },
  { value: 'rat_nang_dong', label: 'Rất năng động (vận động viên)' },
]
const GOAL_OPTIONS = [
  { value: 'giam_can', label: '🔥 Giảm cân' },
  { value: 'tang_can', label: '💪 Tăng cân' },
  { value: 'giu_can', label: '⚖️ Giữ cân' },
  { value: 'cai_thien_suc_khoe', label: '🌟 Cải thiện sức khỏe' },
]

const inputStyle: React.CSSProperties = { width: '100%', padding: '10px 14px', borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 13, outline: 'none', background: 'white' }

function normalizeTags(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean)
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) return []
    try {
      const parsed = JSON.parse(trimmed)
      if (Array.isArray(parsed)) return parsed.map((item) => String(item).trim()).filter(Boolean)
    } catch {
      return trimmed.split(',').map((item) => item.trim()).filter(Boolean)
    }
  }
  return []
}

export default function HealthProfilePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [completion, setCompletion] = useState<{ percent: number; missing: string[] }>({ percent: 0, missing: [] })

  const [form, setForm] = useState({
    gioi_tinh: '', ngay_sinh: '', chieu_cao_cm: '', can_nang_hien_tai_kg: '',
    muc_do_van_dong: '', muc_tieu_suc_khoe: '',
    tinh_trang_suc_khoe: [] as string[],
    di_ung: [] as string[],
    che_do_an_uu_tien: [] as string[],
    thuc_pham_khong_dung: [] as string[],
    ghi_chu_cho_chuyen_gia: '',
  })

  const [tagInput, setTagInput] = useState({ tinh_trang: '', di_ung: '', che_do_an: '', khong_dung: '' })

  useEffect(() => {
    customerGet<Row>('/health-profile').then((res) => {
      if (res.profile) {
        const p = res.profile
        setForm({
          gioi_tinh: p.gioi_tinh ?? '',
          ngay_sinh: p.ngay_sinh ? String(p.ngay_sinh).slice(0, 10) : '',
          chieu_cao_cm: p.chieu_cao_cm ?? '',
          can_nang_hien_tai_kg: p.can_nang_hien_tai_kg ?? '',
          muc_do_van_dong: p.muc_do_van_dong ?? '',
          muc_tieu_suc_khoe: p.muc_tieu_suc_khoe ?? '',
          tinh_trang_suc_khoe: normalizeTags(p.tinh_trang_suc_khoe),
          di_ung: normalizeTags(p.di_ung),
          che_do_an_uu_tien: normalizeTags(p.che_do_an_uu_tien),
          thuc_pham_khong_dung: normalizeTags(p.thuc_pham_khong_dung),
          ghi_chu_cho_chuyen_gia: p.ghi_chu_cho_chuyen_gia ?? '',
        })
      }
      setCompletion(res.completion ?? { percent: 0, missing: [] })
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  function addTag(field: TagField, inputKey: keyof typeof tagInput) {
    const val = tagInput[inputKey].trim()
    const current = normalizeTags(form[field])
    if (!val || current.includes(val)) return
    setForm({ ...form, [field]: [...current, val] })
    setTagInput({ ...tagInput, [inputKey]: '' })
  }

  function removeTag(field: TagField, idx: number) {
    const current = normalizeTags(form[field])
    setForm({ ...form, [field]: current.filter((_, i) => i !== idx) })
  }

  async function handleSave() {
    setSaving(true); setMsg('')
    try {
      const res = await customerPost<Row>('/health-profile', {
        ...form,
        chieu_cao_cm: form.chieu_cao_cm ? Number(form.chieu_cao_cm) : null,
        can_nang_hien_tai_kg: form.can_nang_hien_tai_kg ? Number(form.can_nang_hien_tai_kg) : null,
      })
      setCompletion(res.completion ?? { percent: 0, missing: [] })
      setMsg('✅ Đã lưu hồ sơ sức khỏe thành công!')
    } catch (e: any) { setMsg(e.message ?? 'Lỗi') } finally { setSaving(false) }
  }

  if (loading) return <div className='user-loading'><div className='user-loading__card'><div className='user-loading__spinner' />Đang tải...</div></div>

  return (
    <>
      <SectionHeader title='Hồ sơ sức khỏe' subtitle='Khai báo thông tin nền để hệ thống gợi ý phù hợp' />

      {/* Progress bar */}
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 12 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: completion.percent === 100 ? 'linear-gradient(135deg, #ecfdf5, #d1fae5)' : 'linear-gradient(135deg, #fffbeb, #fef3c7)', color: completion.percent === 100 ? '#059669' : '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {completion.percent === 100 ? <CheckCircle size={20} /> : <AlertTriangle size={20} />}
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Hoàn thành: {completion.percent}%</p>
            <div style={{ height: 6, borderRadius: 3, background: '#e2e8f0', marginTop: 6 }}>
              <div style={{ height: 6, borderRadius: 3, background: completion.percent === 100 ? '#059669' : '#d97706', width: `${completion.percent}%`, transition: 'width .4s' }} />
            </div>
            {completion.missing.length > 0 && <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>Chưa điền: {completion.missing.join(', ')}</p>}
          </div>
        </div>
      </Card>

      {msg && <UserNotice tone={msg.startsWith('✅') ? 'success' : 'error'}>{msg}</UserNotice>}

      <div style={{ display: 'grid', gap: 20, marginTop: 20 }}>
        {/* Thông tin cơ bản */}
        <Card>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 16 }}>📋 Thông tin cơ bản</h3>
          <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>Giới tính *</p>
              <select style={inputStyle} value={form.gioi_tinh} onChange={e => setForm({ ...form, gioi_tinh: e.target.value })}>
                <option value=''>Chọn giới tính</option>
                {GENDER_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>Ngày sinh *</p>
              <input type='date' style={inputStyle} value={form.ngay_sinh} onChange={e => setForm({ ...form, ngay_sinh: e.target.value })} />
            </div>
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>Chiều cao (cm) *</p>
              <input type='number' style={inputStyle} value={form.chieu_cao_cm} onChange={e => setForm({ ...form, chieu_cao_cm: e.target.value })} placeholder='VD: 170' min={50} max={300} />
            </div>
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>Cân nặng (kg) *</p>
              <input type='number' style={inputStyle} value={form.can_nang_hien_tai_kg} onChange={e => setForm({ ...form, can_nang_hien_tai_kg: e.target.value })} placeholder='VD: 65' min={10} max={500} />
            </div>
          </div>
        </Card>

        {/* Vận động & Mục tiêu */}
        <Card>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 16 }}>🎯 Vận động & Mục tiêu</h3>
          <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>Mức độ vận động *</p>
              <select style={inputStyle} value={form.muc_do_van_dong} onChange={e => setForm({ ...form, muc_do_van_dong: e.target.value })}>
                <option value=''>Chọn mức độ</option>
                {ACTIVITY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>Mục tiêu sức khỏe *</p>
              <div style={{ display: 'grid', gap: 8, gridTemplateColumns: 'repeat(2, 1fr)' }}>
                {GOAL_OPTIONS.map(o => (
                  <button key={o.value} type='button'
                    onClick={() => setForm({ ...form, muc_tieu_suc_khoe: o.value })}
                    style={{ padding: '10px 12px', borderRadius: 10, border: `2px solid ${form.muc_tieu_suc_khoe === o.value ? '#6366f1' : '#e2e8f0'}`, background: form.muc_tieu_suc_khoe === o.value ? '#eef2ff' : '#fff', color: form.muc_tieu_suc_khoe === o.value ? '#4338ca' : '#475569', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all .2s' }}
                  >{o.label}</button>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* Tags */}
        {[
          { field: 'tinh_trang_suc_khoe' as const, inputKey: 'tinh_trang' as const, label: '⚕️ Tình trạng sức khỏe cần lưu ý', placeholder: 'VD: Tiểu đường, huyết áp cao...' },
          { field: 'di_ung' as const, inputKey: 'di_ung' as const, label: '🚫 Dị ứng', placeholder: 'VD: Đậu phộng, hải sản...' },
          { field: 'che_do_an_uu_tien' as const, inputKey: 'che_do_an' as const, label: '🥗 Chế độ ăn ưu tiên', placeholder: 'VD: Chay, Keto, Low-carb...' },
          { field: 'thuc_pham_khong_dung' as const, inputKey: 'khong_dung' as const, label: '❌ Thực phẩm không dùng', placeholder: 'VD: Nội tạng, sữa bò...' },
        ].map(({ field, inputKey, label, placeholder }) => (
          <Card key={field}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 12 }}>{label}</h3>
            <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
              <input style={{ ...inputStyle, flex: 1 }} value={tagInput[inputKey]} onChange={e => setTagInput({ ...tagInput, [inputKey]: e.target.value })} placeholder={placeholder}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag(field, inputKey))} />
              <UserButton variant='secondary' size='sm' onClick={() => addTag(field, inputKey)}>Thêm</UserButton>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {normalizeTags(form[field]).map((tag: string, i: number) => (
                <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 100, background: '#eef2ff', color: '#4338ca', fontSize: 12, fontWeight: 600 }}>
                  {tag}
                  <button type='button' onClick={() => removeTag(field, i)} style={{ background: 'none', border: 'none', color: '#818cf8', cursor: 'pointer', fontSize: 14, lineHeight: 1, padding: 0 }}>×</button>
                </span>
              ))}
              {normalizeTags(form[field]).length === 0 && <p style={{ fontSize: 12, color: '#94a3b8', fontStyle: 'italic' }}>Chưa có mục nào</p>}
            </div>
          </Card>
        ))}

        {/* Ghi chú */}
        <Card>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 12 }}>📝 Ghi chú cho chuyên gia</h3>
          <textarea style={{ ...inputStyle, minHeight: 100, resize: 'vertical' }} value={form.ghi_chu_cho_chuyen_gia} onChange={e => setForm({ ...form, ghi_chu_cho_chuyen_gia: e.target.value })} placeholder='Những thông tin bổ sung bạn muốn chia sẻ với chuyên gia...' />
        </Card>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 8 }}>
          <UserButton variant='primary' size='lg' onClick={handleSave} disabled={saving}>
            <Save size={16} /> {saving ? 'Đang lưu...' : 'Lưu hồ sơ'}
          </UserButton>
        </div>
      </div>
    </>
  )
}
