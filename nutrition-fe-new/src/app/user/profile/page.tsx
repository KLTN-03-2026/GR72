'use client'

import { useEffect, useState } from 'react'
import { Upload, Save } from 'lucide-react'
import { Card, SectionHeader, UserButton, UserNotice } from '@/components/user/user-ui'
import { customerGet, customerPatch, customerPostFormData } from '@/lib/customer-api'

type Row = Record<string, any>

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  borderRadius: 12,
  border: '1px solid #e2e8f0',
  fontSize: 13,
  outline: 'none',
  background: 'white',
}

export default function UserProfilePage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState('')
  const [tone, setTone] = useState<'success' | 'error' | 'info'>('info')

  const [profile, setProfile] = useState<Row | null>(null)
  const [form, setForm] = useState({
    ho_ten: '',
    so_dien_thoai: '',
    gioi_tinh: '',
    ngay_sinh: '',
    ghi_chu_suc_khoe: '',
  })

  async function load() {
    setLoading(true)
    try {
      const data = await customerGet<Row>('/profile')
      setProfile(data)
      setForm({
        ho_ten: data.ho_ten ?? '',
        so_dien_thoai: data.so_dien_thoai ?? '',
        gioi_tinh: data.gioi_tinh ?? '',
        ngay_sinh: data.ngay_sinh ? String(data.ngay_sinh).slice(0, 10) : '',
        ghi_chu_suc_khoe: data.ghi_chu_suc_khoe ?? '',
      })
    } catch (e: any) {
      setMessage(e.message ?? 'Không tải được hồ sơ')
      setTone('error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load().catch(() => undefined)
  }, [])

  async function handleSave() {
    setSaving(true)
    setMessage('')
    try {
      const updated = await customerPatch<Row>('/profile', form)
      setProfile(updated)
      setMessage('Đã cập nhật hồ sơ thành công.')
      setTone('success')
    } catch (e: any) {
      setMessage(e.message ?? 'Cập nhật thất bại')
      setTone('error')
    } finally {
      setSaving(false)
    }
  }

  async function handleUploadAvatar(file: File) {
    const fd = new FormData()
    fd.append('avatar', file)
    setUploading(true)
    setMessage('')
    try {
      const updated = await customerPostFormData<Row>('/profile/avatar', fd)
      setProfile(updated)
      setMessage('Đã cập nhật ảnh đại diện.')
      setTone('success')
    } catch (e: any) {
      setMessage(e.message ?? 'Upload ảnh thất bại')
      setTone('error')
    } finally {
      setUploading(false)
    }
  }

  if (loading) {
    return <div className='user-loading'><div className='user-loading__card'><div className='user-loading__spinner' />Đang tải...</div></div>
  }

  return (
    <>
      <SectionHeader title='Hồ sơ cá nhân' subtitle='Cập nhật thông tin và ảnh đại diện của bạn.' />

      {message ? <UserNotice tone={tone}>{message}</UserNotice> : null}

      <Card>
        <div style={{ display: 'grid', gap: 20, gridTemplateColumns: '180px 1fr' }}>
          <div style={{ display: 'grid', justifyItems: 'center', gap: 10 }}>
            {profile?.anh_dai_dien_url ? (
              <img
                src={String(profile.anh_dai_dien_url)}
                alt='avatar'
                style={{ width: 120, height: 120, borderRadius: '50%', objectFit: 'cover', border: '3px solid #e2e8f0' }}
              />
            ) : (
              <div style={{ width: 120, height: 120, borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #7c3aed)', color: 'white', display: 'grid', placeItems: 'center', fontSize: 40, fontWeight: 700 }}>
                {(form.ho_ten || profile?.ho_ten || 'U').charAt(0).toUpperCase()}
              </div>
            )}
            <label style={{ cursor: uploading ? 'not-allowed' : 'pointer', opacity: uploading ? .7 : 1 }}>
              <input
                type='file'
                accept='image/*'
                style={{ display: 'none' }}
                disabled={uploading}
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleUploadAvatar(file).catch(() => undefined)
                  e.currentTarget.value = ''
                }}
              />
              <span style={{ display: 'inline-flex', gap: 6, alignItems: 'center', padding: '8px 12px', borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 13, fontWeight: 600, color: '#334155' }}>
                <Upload size={14} /> {uploading ? 'Đang upload...' : 'Đổi ảnh'}
              </span>
            </label>
          </div>

          <div style={{ display: 'grid', gap: 14 }}>
            <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
              <div>
                <p style={{ margin: '0 0 6px', fontSize: 13, fontWeight: 600, color: '#334155' }}>Họ tên</p>
                <input style={inputStyle} value={form.ho_ten} onChange={(e) => setForm({ ...form, ho_ten: e.target.value })} placeholder='Nhập họ tên' />
              </div>
              <div>
                <p style={{ margin: '0 0 6px', fontSize: 13, fontWeight: 600, color: '#334155' }}>Email</p>
                <input style={{ ...inputStyle, background: '#f8fafc' }} value={profile?.email ?? ''} disabled />
              </div>
              <div>
                <p style={{ margin: '0 0 6px', fontSize: 13, fontWeight: 600, color: '#334155' }}>Số điện thoại</p>
                <input style={inputStyle} value={form.so_dien_thoai} onChange={(e) => setForm({ ...form, so_dien_thoai: e.target.value })} placeholder='VD: 09xxxxxxxx' />
              </div>
              <div>
                <p style={{ margin: '0 0 6px', fontSize: 13, fontWeight: 600, color: '#334155' }}>Giới tính</p>
                <select style={inputStyle} value={form.gioi_tinh} onChange={(e) => setForm({ ...form, gioi_tinh: e.target.value })}>
                  <option value=''>Chọn giới tính</option>
                  <option value='nam'>Nam</option>
                  <option value='nu'>Nữ</option>
                  <option value='khac'>Khác</option>
                </select>
              </div>
              <div>
                <p style={{ margin: '0 0 6px', fontSize: 13, fontWeight: 600, color: '#334155' }}>Ngày sinh</p>
                <input type='date' style={inputStyle} value={form.ngay_sinh} onChange={(e) => setForm({ ...form, ngay_sinh: e.target.value })} />
              </div>
            </div>

            <div>
              <p style={{ margin: '0 0 6px', fontSize: 13, fontWeight: 600, color: '#334155' }}>Ghi chú sức khỏe</p>
              <textarea
                style={{ ...inputStyle, minHeight: 100, resize: 'vertical' }}
                value={form.ghi_chu_suc_khoe}
                onChange={(e) => setForm({ ...form, ghi_chu_suc_khoe: e.target.value })}
                placeholder='Bạn có thể ghi chú thông tin sức khỏe tổng quát ở đây'
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <UserButton onClick={handleSave} disabled={saving}>
                <Save size={15} /> {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
              </UserButton>
            </div>
          </div>
        </div>
      </Card>
    </>
  )
}
