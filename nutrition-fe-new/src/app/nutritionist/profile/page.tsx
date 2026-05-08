'use client'

import { useEffect, useRef, useState } from 'react'
import { Camera, User, Phone, GraduationCap, Briefcase, Award, Star, MessageSquare, Save, ToggleLeft, ToggleRight } from 'lucide-react'
import { SectionHeader, Card, UserStatCard, UserButton, UserNotice, StatusBadge } from '@/components/user/user-ui'
import { expertGet, expertPatch } from '@/lib/expert-api'

type Profile = Record<string, any>

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid #e2e8f0',
  fontSize: 13.5, outline: 'none', background: 'white', transition: 'border-color 0.15s',
}
const inputErrorStyle: React.CSSProperties = { ...inputStyle, borderColor: '#fca5a5' }

export default function ExpertProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [form, setForm] = useState<Profile>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [message, setMessage] = useState('')
  const [msgTone, setMsgTone] = useState<'success' | 'error' | 'info'>('info')
  const [saving, setSaving] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dirty, setDirty] = useState(false)

  async function load() {
    const data = await expertGet<Profile>('/profile')
    setProfile(data)
    setForm({ ...data, nhan_booking: Boolean(data.nhan_booking) })
    setAvatarPreview(null)
    setDirty(false)
  }

  function update<K extends string>(key: K, value: any) {
    setForm({ ...form, [key]: value })
    setErrors({ ...errors, [key]: '' })
    setDirty(true)
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarPreview(URL.createObjectURL(file))
    setUploadingAvatar(true)
    try {
      const formData = new FormData()
      formData.append('avatar', file)
      const res = await fetch('/api/expert/profile/avatar', { method: 'POST', body: formData, credentials: 'include' })
      if (!res.ok) { const err = await res.json(); throw new Error(err.message ?? 'Upload thất bại') }
      setMessage('✅ Đã cập nhật ảnh đại diện.')
      setMsgTone('success')
      await load()
    } catch (err: any) {
      setMessage(err.message ?? 'Upload thất bại')
      setMsgTone('error')
      setAvatarPreview(null)
    } finally {
      setUploadingAvatar(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  useEffect(() => {
    load().catch((err) => { setMessage(err.message); setMsgTone('error') })
  }, [])

  async function save() {
    const next: Record<string, string> = {}
    if (!String(form.ho_ten ?? '').trim()) next.ho_ten = 'Vui lòng nhập họ tên hiển thị.'
    if (!String(form.chuyen_mon ?? '').trim()) next.chuyen_mon = 'Vui lòng nhập chuyên môn.'
    if (!String(form.mo_ta ?? '').trim()) next.mo_ta = 'Mô tả giúp khách hiểu phong cách tư vấn của bạn.'
    if (Object.keys(next).length) {
      setErrors(next)
      setMessage('Vui lòng kiểm tra lại các trường bắt buộc.')
      setMsgTone('error')
      return
    }
    setSaving(true)
    try {
      await expertPatch('/profile', form)
      setMessage('✅ Đã lưu hồ sơ chuyên gia.')
      setMsgTone('success')
      setErrors({})
      await load()
    } catch (e: any) {
      setMessage(e.message ?? 'Lỗi lưu hồ sơ')
      setMsgTone('error')
    } finally {
      setSaving(false)
    }
  }

  if (!profile) {
    return (
      <>
        <SectionHeader title='Hồ sơ chuyên gia' subtitle='Quản lý thông tin hiển thị tới khách hàng.' />
        <Card><p style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>Đang tải hồ sơ...</p></Card>
      </>
    )
  }

  return (
    <>
      <SectionHeader
        title='Hồ sơ chuyên gia'
        subtitle='Cập nhật thông tin khách hàng sẽ thấy khi chọn bạn.'
        action={
          <UserButton onClick={save} disabled={saving || !dirty}>
            <Save size={14} /> {saving ? 'Đang lưu...' : 'Lưu hồ sơ'}
          </UserButton>
        }
      />

      {message && <UserNotice tone={msgTone}>{message}</UserNotice>}

      {/* Stats */}
      <div className='grid-stats'>
        <UserStatCard label='Trạng thái hồ sơ' value={profile.trang_thai === 'hoat_dong' ? 'Đang hoạt động' : 'Tạm dừng'} icon={User} tone={profile.trang_thai === 'hoat_dong' ? 'green' : 'orange'} />
        <UserStatCard label='Rating trung bình' value={`${Number(profile.diem_danh_gia_trung_binh ?? 0).toFixed(1)}/5`} icon={Star} tone='purple' />
        <UserStatCard label='Lượt đánh giá' value={String(profile.so_luot_danh_gia ?? 0)} icon={MessageSquare} tone='blue' />
        <UserStatCard label='Booking đã hoàn thành' value={String(profile.so_booking_hoan_thanh ?? 0)} icon={Award} tone='green' />
      </div>

      {/* Avatar + basic info */}
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#0f172a' }}>Thông tin hiển thị</h2>
          <StatusBadge value={profile.trang_thai} />
        </div>

        {/* Avatar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 18, padding: 18, background: 'linear-gradient(135deg, #faf5ff, #eff6ff)', borderRadius: 14, border: '1px solid #e0e7ff', marginBottom: 20 }}>
          <div style={{ position: 'relative', width: 90, height: 90, flexShrink: 0 }}>
            {(avatarPreview ?? profile.anh_dai_dien_url) ? (
              <img
                src={avatarPreview ?? profile.anh_dai_dien_url}
                alt='Avatar'
                style={{ width: 90, height: 90, borderRadius: '50%', objectFit: 'cover', border: '3px solid white', boxShadow: '0 4px 12px rgba(0,0,0,.1)' }}
              />
            ) : (
              <div style={{ width: 90, height: 90, borderRadius: '50%', background: '#e0e7ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, fontWeight: 700, color: '#6366f1', border: '3px solid white', boxShadow: '0 4px 12px rgba(0,0,0,.1)' }}>
                {String(profile.ho_ten ?? 'E').charAt(0).toUpperCase()}
              </div>
            )}
            <button
              type='button'
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingAvatar}
              style={{ position: 'absolute', bottom: 0, right: 0, width: 30, height: 30, borderRadius: '50%', border: '2px solid white', background: '#6366f1', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: uploadingAvatar ? 'not-allowed' : 'pointer', opacity: uploadingAvatar ? 0.5 : 1 }}
              aria-label='Đổi ảnh đại diện'
            >
              <Camera size={14} />
            </button>
            <input ref={fileInputRef} type='file' accept='image/jpeg,image/png,image/webp' style={{ display: 'none' }} onChange={handleAvatarChange} />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Ảnh đại diện</p>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>
              {uploadingAvatar ? '⏳ Đang tải lên...' : 'JPG, PNG hoặc WEBP · Tối đa 5MB'}
            </p>
            <p style={{ margin: '4px 0 0', fontSize: 12, color: '#94a3b8' }}>
              Ảnh chân dung rõ mặt, chuyên nghiệp giúp khách tin tưởng hơn.
            </p>
          </div>
        </div>

        {/* Basic fields */}
        <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
          <FormField label='Họ tên *' icon={<User size={14} />} error={errors.ho_ten}>
            <input
              style={errors.ho_ten ? inputErrorStyle : inputStyle}
              value={form.ho_ten ?? ''}
              onChange={(e) => update('ho_ten', e.target.value)}
              placeholder='Tên đầy đủ hiển thị tới khách'
            />
          </FormField>
          <FormField label='Số điện thoại' icon={<Phone size={14} />}>
            <input
              style={inputStyle}
              value={form.so_dien_thoai ?? ''}
              onChange={(e) => update('so_dien_thoai', e.target.value)}
              placeholder='0xxxxxxxxx'
            />
          </FormField>
          <FormField label='Chuyên môn *' icon={<Briefcase size={14} />} error={errors.chuyen_mon}>
            <input
              style={errors.chuyen_mon ? inputErrorStyle : inputStyle}
              value={form.chuyen_mon ?? ''}
              onChange={(e) => update('chuyen_mon', e.target.value)}
              placeholder='Ví dụ: Dinh dưỡng thể thao'
            />
          </FormField>
          <FormField label='Học vị' icon={<GraduationCap size={14} />}>
            <input
              style={inputStyle}
              value={form.hoc_vi ?? ''}
              onChange={(e) => update('hoc_vi', e.target.value)}
              placeholder='Ví dụ: Thạc sĩ Dinh dưỡng'
            />
          </FormField>
        </div>
      </Card>

      {/* Năng lực chuyên môn */}
      <Card>
        <h2 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 700, color: '#0f172a' }}>Năng lực chuyên môn</h2>
        <p style={{ margin: '0 0 18px', fontSize: 13, color: '#64748b' }}>
          Khách hàng dùng các thông tin này để đánh giá xem bạn có phù hợp với họ không.
        </p>

        <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
          <FormField label='Kinh nghiệm' icon={<Briefcase size={14} />} hint='Mỗi gạch đầu dòng là một kinh nghiệm'>
            <textarea
              style={{ ...inputStyle, minHeight: 110, resize: 'vertical' }}
              value={form.kinh_nghiem ?? ''}
              onChange={(e) => update('kinh_nghiem', e.target.value)}
              placeholder='- 5 năm tại bệnh viện ABC&#10;- Tư vấn 200+ ca giảm cân thành công'
            />
          </FormField>
          <FormField label='Chứng chỉ' icon={<Award size={14} />} hint='Liệt kê chứng chỉ chuyên môn'>
            <textarea
              style={{ ...inputStyle, minHeight: 110, resize: 'vertical' }}
              value={form.chung_chi ?? ''}
              onChange={(e) => update('chung_chi', e.target.value)}
              placeholder='- Chứng chỉ Dinh dưỡng lâm sàng&#10;- Certified Diabetes Educator'
            />
          </FormField>
        </div>

        <div style={{ marginTop: 14 }}>
          <FormField label='Mô tả tư vấn *' icon={<MessageSquare size={14} />} error={errors.mo_ta} hint='Cách bạn tiếp cận và phong cách tư vấn'>
            <textarea
              style={{ ...(errors.mo_ta ? inputErrorStyle : inputStyle), minHeight: 100, resize: 'vertical' }}
              value={form.mo_ta ?? ''}
              onChange={(e) => update('mo_ta', e.target.value)}
              placeholder='Tôi tập trung vào việc xây dựng thực đơn cá nhân hoá, lắng nghe và đồng hành cùng khách...'
            />
          </FormField>
        </div>
      </Card>

      {/* Toggle nhận booking */}
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Nhận booking mới</p>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>
              Khi tắt, khách hàng sẽ không thấy bạn trong danh sách chuyên gia có sẵn.
            </p>
          </div>
          <button
            type='button'
            onClick={() => update('nhan_booking', !form.nhan_booking)}
            style={{
              border: 'none', background: 'transparent', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 8,
              fontSize: 14, fontWeight: 700,
              color: form.nhan_booking ? '#10b981' : '#94a3b8',
            }}
          >
            {form.nhan_booking ? <ToggleRight size={36} /> : <ToggleLeft size={36} />}
            {form.nhan_booking ? 'Đang bật' : 'Đang tắt'}
          </button>
        </div>
      </Card>

      {/* Sticky save bar nếu dirty */}
      {dirty && (
        <div style={{
          position: 'sticky', bottom: 16, marginTop: 16,
          padding: 14, background: 'white', borderRadius: 14, border: '1px solid #e0e7ff',
          boxShadow: '0 8px 24px rgba(99,102,241,.15)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12,
        }}>
          <p style={{ margin: 0, fontSize: 13, color: '#475569', fontWeight: 600 }}>
            ⚠️ Có thay đổi chưa lưu
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            <UserButton variant='ghost' onClick={() => load()}>Hủy thay đổi</UserButton>
            <UserButton onClick={save} disabled={saving}>
              <Save size={14} /> {saving ? 'Đang lưu...' : 'Lưu hồ sơ'}
            </UserButton>
          </div>
        </div>
      )}
    </>
  )
}

function FormField({ label, icon, error, hint, children }: {
  label: string; icon?: React.ReactNode; error?: string; hint?: string; children: React.ReactNode
}) {
  return (
    <div>
      <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 700, color: '#475569', marginBottom: 6 }}>
        {icon && <span style={{ color: '#6366f1' }}>{icon}</span>}
        {label}
      </label>
      {children}
      {hint && !error && <p style={{ margin: '4px 0 0', fontSize: 11.5, color: '#94a3b8' }}>{hint}</p>}
      {error && <p style={{ margin: '4px 0 0', fontSize: 11.5, color: '#dc2626', fontWeight: 600 }}>{error}</p>}
    </div>
  )
}
