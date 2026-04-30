'use client'

import { useEffect, useMemo, useState } from 'react'
import { ActionButton, EmptyState, Field, Notice, PageHeader, Panel, StatCard, StatusPill, Toolbar, inputClass } from '@/components/admin/admin-ui'
import { DataTable, Modal, Td, Th } from '@/components/admin/admin-table'
import { adminGet, adminPatch, adminPost } from '@/lib/admin-api'

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
  const [loading, setLoading] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (query) params.set('search', query)
      if (status) params.set('status', status)
      if (type) params.set('type', type)
      if (role) params.set('role', role)
      setRows(await adminGet<NotificationRow[]>(`/notifications${params.toString() ? `?${params}` : ''}`))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load().catch((err) => setMessage(err.message)) }, [status, type, role])

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
    if (!Number(form.tai_khoan_id)) nextErrors.tai_khoan_id = 'Vui lòng nhập ID tài khoản nhận thông báo.'
    if (!String(form.tieu_de).trim()) nextErrors.tieu_de = 'Vui lòng nhập tiêu đề thông báo.'
    if (!String(form.noi_dung).trim()) nextErrors.noi_dung = 'Vui lòng nhập nội dung thông báo.'
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors)
      return
    }
    await adminPost('/notifications', {
      ...form,
      tai_khoan_id: Number(form.tai_khoan_id),
      entity_id: form.entity_id ? Number(form.entity_id) : null,
      duong_dan_hanh_dong: form.duong_dan_hanh_dong || null,
      entity_type: form.entity_type || null,
    })
    setMessage('Đã tạo thông báo.')
    setModalOpen(false)
    await load()
  }

  async function markRead(row: NotificationRow) {
    await adminPatch(`/notifications/${row.id}/read`)
    setMessage('Đã đánh dấu thông báo là đã đọc.')
    await load()
  }

  return (
    <>
      <PageHeader eyebrow='Notification center' title='Quản lý thông báo' description='Theo dõi thông báo hệ thống, lọc theo người nhận/trạng thái/loại và tạo thông báo thủ công khi cần.' action={<ActionButton tone='accent' onClick={openCreate}>Tạo thông báo</ActionButton>} />
      {message ? <Notice>{message}</Notice> : null}
      <div className='mb-5 grid gap-4 md:grid-cols-3'><StatCard label='Thông báo trong bộ lọc' value={String(stats.total)} /><StatCard label='Chưa đọc' value={String(stats.unread)} tone='orange' /><StatCard label='Đã đọc' value={String(stats.read)} tone='green' /></div>
      <Panel title='Danh sách thông báo' description='Danh sách dạng bảng để admin dễ kiểm tra thông báo đã gửi và trạng thái đọc.'>
        <Toolbar>
          <input className={inputClass} placeholder='Tìm tiêu đề, nội dung, người nhận' value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') load() }} />
          <select className={inputClass} value={status} onChange={(e) => setStatus(e.target.value)}><option value=''>Tất cả trạng thái</option><option value='chua_doc'>Chưa đọc</option><option value='da_doc'>Đã đọc</option></select>
          <select className={inputClass} value={type} onChange={(e) => setType(e.target.value)}><option value=''>Tất cả loại</option>{['he_thong','booking','payment','review','commission','complaint'].map((item) => <option key={item} value={item}>{item}</option>)}</select>
          <select className={inputClass} value={role} onChange={(e) => setRole(e.target.value)}><option value=''>Tất cả vai trò nhận</option><option value='customer'>Người dùng</option><option value='expert'>Chuyên gia</option><option value='admin'>Admin</option></select>
          <ActionButton tone='secondary' onClick={load}>Lọc</ActionButton>
        </Toolbar>
        <DataTable minWidth='1120px'><thead><tr><Th>Thông báo</Th><Th>Người nhận</Th><Th>Loại</Th><Th>Trạng thái</Th><Th>Đường dẫn</Th><Th>Ngày tạo</Th><Th className='text-right'>Hành động</Th></tr></thead><tbody>{rows.map((row) => <tr key={row.id} className='hover:bg-blue-50/40'><Td><b>{row.tieu_de}</b><p className='line-clamp-2 max-w-md text-xs leading-5 text-slate-500'>{row.noi_dung}</p></Td><Td>{row.receiver_name}<p className='text-xs text-slate-500'>{row.receiver_email}</p><p className='text-xs text-slate-400'>{row.receiver_role}</p></Td><Td>{row.loai}</Td><Td><StatusPill value={row.trang_thai} /></Td><Td>{row.duong_dan_hanh_dong ?? '-'}</Td><Td>{String(row.tao_luc).slice(0, 16)}</Td><Td className='text-right'>{row.trang_thai === 'chua_doc' ? <ActionButton tone='secondary' onClick={() => markRead(row)}>Đánh dấu đọc</ActionButton> : '-'}</Td></tr>)}</tbody></DataTable>
        {!rows.length && !loading ? <div className='mt-4'><EmptyState text='Không có thông báo theo bộ lọc.' /></div> : null}
      </Panel>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title='Tạo thông báo' description='Gửi thông báo tới một tài khoản cụ thể. Có thể gắn đường dẫn hành động nếu cần.'>
        <div className='space-y-4'><Field label='ID tài khoản nhận' error={errors.tai_khoan_id}><input type='number' className={inputClass} value={form.tai_khoan_id} onChange={(e) => setForm({ ...form, tai_khoan_id: e.target.value })} placeholder='VD: 12' /></Field><Field label='Loại thông báo'><select className={inputClass} value={form.loai} onChange={(e) => setForm({ ...form, loai: e.target.value })}>{['he_thong','booking','payment','review','commission','complaint'].map((item) => <option key={item} value={item}>{item}</option>)}</select></Field><Field label='Tiêu đề' error={errors.tieu_de}><input className={inputClass} value={form.tieu_de} onChange={(e) => setForm({ ...form, tieu_de: e.target.value })} /></Field><Field label='Nội dung' error={errors.noi_dung}><textarea className={inputClass} rows={5} value={form.noi_dung} onChange={(e) => setForm({ ...form, noi_dung: e.target.value })} /></Field><Field label='Đường dẫn hành động'><input className={inputClass} value={form.duong_dan_hanh_dong} onChange={(e) => setForm({ ...form, duong_dan_hanh_dong: e.target.value })} placeholder='/dashboard/bookings/1' /></Field><div className='grid gap-4 md:grid-cols-2'><Field label='Entity type'><input className={inputClass} value={form.entity_type} onChange={(e) => setForm({ ...form, entity_type: e.target.value })} placeholder='lich_hen, thanh_toan...' /></Field><Field label='Entity ID'><input type='number' className={inputClass} value={form.entity_id} onChange={(e) => setForm({ ...form, entity_id: e.target.value })} /></Field></div><div className='flex justify-end gap-2'><ActionButton tone='secondary' onClick={() => setModalOpen(false)}>Hủy</ActionButton><ActionButton onClick={createNotification}>Gửi thông báo</ActionButton></div></div>
      </Modal>
    </>
  )
}
