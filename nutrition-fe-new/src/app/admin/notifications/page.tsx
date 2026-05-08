'use client'

import { useEffect, useMemo, useState } from 'react'
import { Search, Bell, Inbox, Send, Plus, Eye } from 'lucide-react'
import {
  ActionButton, EmptyState, Field, FilterChip, LoadingSkeleton, Notice,
  PageHeader, Panel, StatCard, StatusPill, inputClass,
} from '@/components/admin/admin-ui'
import { DataTable, Modal, Td, Th } from '@/components/admin/admin-table'
import { adminGet, adminPatch, adminPost } from '@/lib/admin-api'
import { NOTIFICATION_TYPE_LABELS } from '@/lib/i18n'

type NotificationRow = Record<string, any>

const blank = {
  tai_khoan_id: '',
  loai: 'he_thong',
  tieu_de: '',
  noi_dung: '',
  duong_dan_hanh_dong: '',
  entity_type: '',
  entity_id: '',
}

const TYPES = ['he_thong', 'booking', 'payment', 'review', 'commission', 'complaint']

export default function AdminNotificationsPage() {
  const [rows, setRows] = useState<NotificationRow[]>([])
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('')
  const [type, setType] = useState('')
  const [role, setRole] = useState('')
  const [form, setForm] = useState<Record<string, any>>(blank)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [modalOpen, setModalOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [tone, setTone] = useState<'info' | 'success' | 'error'>('info')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (query) params.set('search', query)
      if (status) params.set('status', status)
      if (type) params.set('type', type)
      if (role) params.set('role', role)
      setRows(await adminGet<NotificationRow[]>(`/notifications${params.toString() ? `?${params}` : ''}`))
    } catch (e: any) { setMessage(e.message ?? 'Lỗi'); setTone('error') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [status, type, role])

  const stats = useMemo(() => ({
    total: rows.length,
    unread: rows.filter((row) => row.trang_thai === 'chua_doc').length,
    read: rows.filter((row) => row.trang_thai === 'da_doc').length,
  }), [rows])

  function openCreate() {
    setForm(blank)
    setErrors({})
    setModalOpen(true)
  }

  async function createNotification() {
    const nextErrors: Record<string, string> = {}
    if (!Number(form.tai_khoan_id)) nextErrors.tai_khoan_id = 'Vui lòng nhập ID tài khoản nhận.'
    if (!String(form.tieu_de).trim()) nextErrors.tieu_de = 'Vui lòng nhập tiêu đề.'
    if (!String(form.noi_dung).trim()) nextErrors.noi_dung = 'Vui lòng nhập nội dung.'
    if (Object.keys(nextErrors).length) { setErrors(nextErrors); return }
    setSaving(true)
    try {
      await adminPost('/notifications', {
        ...form,
        tai_khoan_id: Number(form.tai_khoan_id),
        entity_id: form.entity_id ? Number(form.entity_id) : null,
        duong_dan_hanh_dong: form.duong_dan_hanh_dong || null,
        entity_type: form.entity_type || null,
      })
      setMessage('✅ Đã tạo thông báo.')
      setTone('success')
      setModalOpen(false)
      await load()
    } catch (e: any) { setMessage(e.message ?? 'Lỗi'); setTone('error') }
    finally { setSaving(false) }
  }

  async function markRead(row: NotificationRow) {
    try {
      await adminPatch(`/notifications/${row.id}/read`)
      setMessage('Đã đánh dấu đã đọc.'); setTone('success')
      await load()
    } catch (e: any) { setMessage(e.message ?? 'Lỗi'); setTone('error') }
  }

  return (
    <>
      <PageHeader
        eyebrow='Trung tâm thông báo'
        title='Quản lý thông báo'
        description='Theo dõi thông báo hệ thống và gửi thủ công khi cần.'
        action={<ActionButton tone='accent' onClick={openCreate}><Plus size={14} /> Tạo thông báo</ActionButton>}
      />
      {message ? <Notice tone={tone}>{message}</Notice> : null}

      <div className='mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3'>
        <StatCard label='Tổng thông báo' value={String(stats.total)} icon={Bell} tone='blue' />
        <StatCard label='Chưa đọc' value={String(stats.unread)} icon={Inbox} tone='orange' />
        <StatCard label='Đã đọc' value={String(stats.read)} icon={Eye} tone='green' />
      </div>

      <Panel title='Danh sách thông báo' description='Lọc theo trạng thái, loại và vai trò người nhận.'>
        <div className='mb-3 relative'>
          <Search size={15} className='absolute left-3 top-1/2 -translate-y-1/2 text-slate-400' />
          <input
            className={`${inputClass} pl-10`}
            placeholder='Tìm tiêu đề, nội dung hoặc người nhận...'
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') load() }}
          />
        </div>

        <div className='mb-2 flex flex-wrap items-center gap-2'>
          <span className='text-xs font-semibold uppercase text-slate-500'>Trạng thái:</span>
          <FilterChip active={!status} onClick={() => setStatus('')}>Tất cả</FilterChip>
          <FilterChip active={status === 'chua_doc'} onClick={() => setStatus('chua_doc')}>Chưa đọc</FilterChip>
          <FilterChip active={status === 'da_doc'} onClick={() => setStatus('da_doc')}>Đã đọc</FilterChip>
        </div>
        <div className='mb-2 flex flex-wrap items-center gap-2'>
          <span className='text-xs font-semibold uppercase text-slate-500'>Loại:</span>
          <FilterChip active={!type} onClick={() => setType('')}>Tất cả</FilterChip>
          {TYPES.map((t) => <FilterChip key={t} active={type === t} onClick={() => setType(t)}>{NOTIFICATION_TYPE_LABELS[t] ?? t}</FilterChip>)}
        </div>
        <div className='mb-4 flex flex-wrap items-center gap-2'>
          <span className='text-xs font-semibold uppercase text-slate-500'>Vai trò:</span>
          <FilterChip active={!role} onClick={() => setRole('')}>Tất cả</FilterChip>
          <FilterChip active={role === 'customer'} onClick={() => setRole('customer')}>Người dùng</FilterChip>
          <FilterChip active={role === 'expert'} onClick={() => setRole('expert')}>Chuyên gia</FilterChip>
          <FilterChip active={role === 'admin'} onClick={() => setRole('admin')}>Admin</FilterChip>
        </div>

        {loading ? (
          <LoadingSkeleton rows={5} />
        ) : rows.length === 0 ? (
          <EmptyState text='Không có thông báo theo bộ lọc.' />
        ) : (
          <DataTable minWidth='1080px'>
            <thead>
              <tr>
                <Th>Thông báo</Th>
                <Th>Người nhận</Th>
                <Th>Loại</Th>
                <Th>Trạng thái</Th>
                <Th>Ngày tạo</Th>
                <Th className='text-right'>Hành động</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className='hover:bg-blue-50/40'>
                  <Td>
                    <b>{row.tieu_de}</b>
                    <p className='line-clamp-2 max-w-md text-xs leading-5 text-slate-500'>{row.noi_dung}</p>
                    {row.duong_dan_hanh_dong && (
                      <a href={row.duong_dan_hanh_dong} target='_blank' rel='noreferrer' className='mt-1 inline-block text-xs text-blue-600 hover:underline'>
                        ↗ {row.duong_dan_hanh_dong}
                      </a>
                    )}
                  </Td>
                  <Td>
                    {row.receiver_name}
                    <p className='text-xs text-slate-500'>{row.receiver_email}</p>
                    <p className='text-xs text-slate-400'>{row.receiver_role}</p>
                  </Td>
                  <Td>{NOTIFICATION_TYPE_LABELS[row.loai] ?? row.loai}</Td>
                  <Td><StatusPill value={row.trang_thai} /></Td>
                  <Td className='text-xs text-slate-500'>{String(row.tao_luc).slice(0, 16).replace('T', ' ')}</Td>
                  <Td className='text-right'>
                    {row.trang_thai === 'chua_doc' && <ActionButton tone='secondary' onClick={() => markRead(row)}>Đã đọc</ActionButton>}
                  </Td>
                </tr>
              ))}
            </tbody>
          </DataTable>
        )}
      </Panel>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title='Tạo thông báo' description='Gửi thông báo thủ công tới một tài khoản.' width='max-w-2xl'>
        <div className='space-y-4'>
          <div className='grid gap-4 sm:grid-cols-2'>
            <Field label='ID tài khoản nhận *' error={errors.tai_khoan_id}>
              <input type='number' className={inputClass} value={form.tai_khoan_id} onChange={(e) => setForm({ ...form, tai_khoan_id: e.target.value })} placeholder='VD: 12' />
            </Field>
            <Field label='Loại'>
              <select className={inputClass} value={form.loai} onChange={(e) => setForm({ ...form, loai: e.target.value })}>
                {TYPES.map((item) => <option key={item} value={item}>{NOTIFICATION_TYPE_LABELS[item] ?? item}</option>)}
              </select>
            </Field>
          </div>
          <Field label='Tiêu đề *' error={errors.tieu_de}>
            <input className={inputClass} value={form.tieu_de} onChange={(e) => setForm({ ...form, tieu_de: e.target.value })} />
          </Field>
          <Field label='Nội dung *' error={errors.noi_dung}>
            <textarea className={inputClass} rows={5} value={form.noi_dung} onChange={(e) => setForm({ ...form, noi_dung: e.target.value })} />
          </Field>

          {/* Preview */}
          {(form.tieu_de || form.noi_dung) && (
            <div className='rounded-xl border border-blue-200 bg-blue-50 p-3'>
              <p className='mb-2 text-xs font-semibold uppercase text-blue-700'>👁️ Xem trước</p>
              <p className='text-sm font-bold text-slate-900'>{form.tieu_de || '(Tiêu đề)'}</p>
              <p className='mt-1 whitespace-pre-wrap text-sm text-slate-600'>{form.noi_dung || '(Nội dung)'}</p>
            </div>
          )}

          <Field label='Đường dẫn hành động (tuỳ chọn)' hint='User click vào notification sẽ điều hướng tới URL này'>
            <input className={inputClass} value={form.duong_dan_hanh_dong} onChange={(e) => setForm({ ...form, duong_dan_hanh_dong: e.target.value })} placeholder='/user/bookings/1' />
          </Field>
          <div className='grid gap-4 sm:grid-cols-2'>
            <Field label='Entity type (tuỳ chọn)'>
              <input className={inputClass} value={form.entity_type} onChange={(e) => setForm({ ...form, entity_type: e.target.value })} placeholder='lich_hen, thanh_toan...' />
            </Field>
            <Field label='Entity ID (tuỳ chọn)'>
              <input type='number' className={inputClass} value={form.entity_id} onChange={(e) => setForm({ ...form, entity_id: e.target.value })} />
            </Field>
          </div>

          <div className='flex justify-end gap-2'>
            <ActionButton tone='secondary' onClick={() => setModalOpen(false)}>Hủy</ActionButton>
            <ActionButton onClick={createNotification} disabled={saving}>
              <Send size={13} /> {saving ? 'Đang gửi...' : 'Gửi thông báo'}
            </ActionButton>
          </div>
        </div>
      </Modal>
    </>
  )
}
