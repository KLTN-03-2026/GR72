'use client'

import { useEffect, useState } from 'react'
import { ActionButton, Field, Notice, PageHeader, Panel, StatCard, StatusPill, inputClass } from '@/components/admin/admin-ui'
import { expertGet, expertPatch } from '@/lib/expert-api'

type Profile = Record<string, any>

export default function ExpertProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [form, setForm] = useState<Profile>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)

  async function load() {
    const data = await expertGet<Profile>('/profile')
    setProfile(data)
    setForm({ ...data, nhan_booking: Boolean(data.nhan_booking) })
  }

  useEffect(() => {
    load().catch((err) => setMessage(err.message))
  }, [])

  async function save() {
    const next: Record<string, string> = {}
    if (!String(form.ho_ten ?? '').trim()) next.ho_ten = 'Vui lòng nhập họ tên hiển thị.'
    if (!String(form.chuyen_mon ?? '').trim()) next.chuyen_mon = 'Vui lòng nhập chuyên môn.'
    if (!String(form.mo_ta ?? '').trim()) next.mo_ta = 'Mô tả giúp khách hiểu phong cách tư vấn của bạn.'
    if (Object.keys(next).length) {
      setErrors(next)
      return
    }
    setSaving(true)
    try {
      await expertPatch('/profile', form)
      setMessage('Đã cập nhật hồ sơ chuyên gia.')
      setErrors({})
      await load()
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <PageHeader
        eyebrow='Expert profile'
        title='Quản lý hồ sơ chuyên gia'
        description='Cập nhật thông tin khách hàng sẽ nhìn thấy khi chọn chuyên gia: chuyên môn, kinh nghiệm, chứng chỉ và trạng thái nhận booking.'
      />
      {message ? <Notice>{message}</Notice> : null}

      {profile ? (
        <div className='space-y-5'>
          <div className='grid gap-3 sm:grid-cols-2 xl:grid-cols-4'>
            <StatCard label='Trạng thái hồ sơ' value={profile.trang_thai} />
            <StatCard label='Rating trung bình' value={`${Number(profile.diem_danh_gia_trung_binh ?? 0).toFixed(1)}/5`} tone='green' />
            <StatCard label='Lượt đánh giá' value={String(profile.so_luot_danh_gia ?? 0)} tone='slate' />
            <StatCard label='Nhận booking' value={form.nhan_booking ? 'Đang bật' : 'Đang tắt'} tone={form.nhan_booking ? 'green' : 'orange'} />
          </div>

          <Panel
            title='Thông tin hiển thị'
            description='Các trường quan trọng được đặt thành nhóm để dễ kiểm tra trước khi lưu.'
            action={<StatusPill value={profile.trang_thai} />}
          >
            <div className='grid gap-4 lg:grid-cols-2'>
              <Field label='Họ tên' error={errors.ho_ten}>
                <input className={inputClass} value={form.ho_ten ?? ''} onChange={(e) => { setForm({ ...form, ho_ten: e.target.value }); setErrors({}) }} />
              </Field>
              <Field label='Số điện thoại'>
                <input className={inputClass} value={form.so_dien_thoai ?? ''} onChange={(e) => setForm({ ...form, so_dien_thoai: e.target.value })} />
              </Field>
              <Field label='Chuyên môn' error={errors.chuyen_mon}>
                <input className={inputClass} placeholder='Ví dụ: Dinh dưỡng thể thao, kiểm soát cân nặng' value={form.chuyen_mon ?? ''} onChange={(e) => { setForm({ ...form, chuyen_mon: e.target.value }); setErrors({}) }} />
              </Field>
              <Field label='Học vị'>
                <input className={inputClass} placeholder='Ví dụ: Thạc sĩ dinh dưỡng lâm sàng' value={form.hoc_vi ?? ''} onChange={(e) => setForm({ ...form, hoc_vi: e.target.value })} />
              </Field>
            </div>
          </Panel>

          <Panel title='Năng lực chuyên môn' description='Nội dung dài được chia thành từng vùng nhập rõ ràng để không bị dính lỗi validate sai vị trí.'>
            <div className='grid gap-4 lg:grid-cols-2'>
              <Field label='Kinh nghiệm'>
                <textarea className={inputClass} rows={5} value={form.kinh_nghiem ?? ''} onChange={(e) => setForm({ ...form, kinh_nghiem: e.target.value })} />
              </Field>
              <Field label='Chứng chỉ'>
                <textarea className={inputClass} rows={5} value={form.chung_chi ?? ''} onChange={(e) => setForm({ ...form, chung_chi: e.target.value })} />
              </Field>
            </div>
            <div className='mt-4'>
              <Field label='Mô tả tư vấn' error={errors.mo_ta}>
                <textarea className={inputClass} rows={5} value={form.mo_ta ?? ''} onChange={(e) => { setForm({ ...form, mo_ta: e.target.value }); setErrors({}) }} />
              </Field>
            </div>
            <div className='mt-5 flex flex-col gap-4 rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4 sm:flex-row sm:items-center sm:justify-between'>
              <label className='flex items-center gap-3 text-sm font-semibold text-slate-800'>
                <input className='h-5 w-5 accent-emerald-600' type='checkbox' checked={Boolean(form.nhan_booking)} onChange={(e) => setForm({ ...form, nhan_booking: e.target.checked })} />
                Nhận booking mới từ khách hàng
              </label>
              <ActionButton onClick={save} disabled={saving}>{saving ? 'Đang lưu...' : 'Lưu hồ sơ'}</ActionButton>
            </div>
          </Panel>
        </div>
      ) : (
        <Panel><p className='text-sm text-slate-500'>Đang tải hồ sơ...</p></Panel>
      )}
    </>
  )
}
