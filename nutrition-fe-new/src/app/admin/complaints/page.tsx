'use client'

import { useEffect, useMemo, useState } from 'react'
import { ActionButton, EmptyState, Field, Notice, PageHeader, Panel, StatCard, StatusPill, Toolbar, inputClass } from '@/components/admin/admin-ui'
import { DataTable, Modal, Td, Th } from '@/components/admin/admin-table'
import { adminGet, adminPatch, adminPost } from '@/lib/admin-api'

type Complaint = Record<string, any>

export default function ComplaintsPage() {
  const [rows, setRows] = useState<Complaint[]>([])
  const [detail, setDetail] = useState<Complaint | null>(null)
  const [messageText, setMessageText] = useState('')
  const [resolveText, setResolveText] = useState('')
  const [notice, setNotice] = useState('')
  const [filter, setFilter] = useState('')
  const [priority, setPriority] = useState('')
  const [type, setType] = useState('')
  const [query, setQuery] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [resolveOpen, setResolveOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filter) params.set('status', filter)
      if (priority) params.set('priority', priority)
      if (type) params.set('type', type)
      if (query) params.set('search', query)
      setRows(await adminGet<Complaint[]>(`/complaints${params.toString() ? `?${params}` : ''}`))
    } finally {
      setLoading(false)
    }
  }

  async function open(id: number) {
    setDetail(await adminGet<Complaint>(`/complaints/${id}`))
    setMessageText('')
    setErrors({})
  }

  useEffect(() => { load().catch((err) => setNotice(err.message)) }, [filter, priority, type])

  const stats = useMemo(() => ({ open: rows.filter((row) => ['moi', 'dang_xu_ly', 'cho_phan_hoi'].includes(row.trang_thai)).length, high: rows.filter((row) => row.muc_uu_tien === 'cao').length, done: rows.filter((row) => ['da_giai_quyet', 'da_dong'].includes(row.trang_thai)).length }), [rows])

  async function assign(row: Complaint) {
    await adminPatch(`/complaints/${row.id}/assign`, { muc_uu_tien: 'cao', trang_thai: 'dang_xu_ly' })
    setNotice('Đã nhận xử lý ticket và đẩy ưu tiên cao.')
    await load()
    await open(row.id)
  }

  async function sendMessage() {
    if (!detail) return
    if (!messageText.trim()) {
      setErrors({ messageText: 'Vui lòng nhập nội dung phản hồi trước khi gửi.' })
      return
    }
    await adminPost(`/complaints/${detail.complaint.id}/messages`, { noi_dung: messageText })
    setMessageText('')
    setErrors({})
    await open(detail.complaint.id)
  }

  function openResolve() {
    setResolveText('')
    setErrors({})
    setResolveOpen(true)
  }

  async function submitResolve() {
    if (!detail) return
    if (!resolveText.trim()) {
      setErrors({ resolveText: 'Vui lòng nhập kết quả xử lý để khách hàng và admin khác hiểu ticket đã được đóng thế nào.' })
      return
    }
    await adminPatch(`/complaints/${detail.complaint.id}/resolve`, { ket_qua_xu_ly: resolveText, trang_thai: 'da_giai_quyet' })
    setNotice('Đã giải quyết khiếu nại.')
    setResolveOpen(false)
    await load()
    await open(detail.complaint.id)
  }

  return <>
    <PageHeader eyebrow='Support desk' title='Quản lý khiếu nại' description='Ticket hiển thị dạng bảng để xử lý số lượng lớn. Timeline và phản hồi mở trong modal chi tiết.' />
    {notice ? <Notice>{notice}</Notice> : null}
    <div className='mb-5 grid gap-4 md:grid-cols-3'><StatCard label='Đang mở' value={String(stats.open)} tone='orange' /><StatCard label='Ưu tiên cao' value={String(stats.high)} tone='red' /><StatCard label='Đã xử lý' value={String(stats.done)} tone='green' /></div>
    <Panel title='Danh sách ticket' description='Filter theo trạng thái, ưu tiên, loại khiếu nại hoặc tìm nhanh theo mã/tiêu đề/người gửi.'>
      <Toolbar>
        <input className={inputClass} placeholder='Tìm mã ticket, tiêu đề, người gửi' value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') load() }} />
        <select className={inputClass} value={filter} onChange={(e) => setFilter(e.target.value)}><option value=''>Tất cả trạng thái</option>{['moi','dang_xu_ly','cho_phan_hoi','da_giai_quyet','da_dong'].map((item) => <option key={item} value={item}>{item}</option>)}</select>
        <select className={inputClass} value={priority} onChange={(e) => setPriority(e.target.value)}><option value=''>Tất cả ưu tiên</option>{['thap','trung_binh','cao'].map((item) => <option key={item} value={item}>{item}</option>)}</select>
        <select className={inputClass} value={type} onChange={(e) => setType(e.target.value)}><option value=''>Tất cả loại</option>{['thanh_toan','lich_hen','chuyen_gia','he_thong','khac'].map((item) => <option key={item} value={item}>{item}</option>)}</select>
        <ActionButton tone='secondary' onClick={load}>Lọc</ActionButton>
      </Toolbar>
      <DataTable minWidth='1040px'><thead><tr><Th>Mã ticket</Th><Th>Tiêu đề</Th><Th>Người gửi</Th><Th>Loại</Th><Th>Ưu tiên</Th><Th>Trạng thái</Th><Th className='text-right'>Hành động</Th></tr></thead><tbody>{rows.map((row) => <tr key={row.id} className='hover:bg-blue-50/40'><Td><b>{row.ma_khieu_nai}</b></Td><Td><p className='max-w-sm truncate font-semibold text-slate-950'>{row.tieu_de}</p></Td><Td>{row.sender_name}</Td><Td>{row.loai_khieu_nai}</Td><Td>{row.muc_uu_tien}</Td><Td><StatusPill value={row.trang_thai} /></Td><Td className='text-right'><div className='flex justify-end gap-2'><ActionButton tone='secondary' onClick={() => open(row.id)}>Chi tiết</ActionButton><ActionButton onClick={() => assign(row)}>Nhận</ActionButton></div></Td></tr>)}</tbody></DataTable>
      {!rows.length && !loading ? <div className='mt-4'><EmptyState text='Không có ticket theo bộ lọc.' /></div> : null}
    </Panel>
    <Modal open={Boolean(detail)} onClose={() => setDetail(null)} title={detail ? detail.complaint.tieu_de : 'Chi tiết ticket'} description='Phản hồi và kết quả xử lý sẽ được lưu vào timeline.' width='max-w-5xl'>
      {detail ? <div className='space-y-5'><div className='grid gap-3 md:grid-cols-4'><div className='rounded-xl bg-slate-50 p-3 text-sm'><p className='text-slate-500'>Mã</p><b>{detail.complaint.ma_khieu_nai}</b></div><div className='rounded-xl bg-slate-50 p-3 text-sm'><p className='text-slate-500'>Người gửi</p><b>{detail.complaint.sender_name}</b></div><div className='rounded-xl bg-slate-50 p-3 text-sm'><p className='text-slate-500'>Ưu tiên</p><b>{detail.complaint.muc_uu_tien}</b></div><div className='rounded-xl bg-slate-50 p-3 text-sm'><p className='text-slate-500'>Trạng thái</p><StatusPill value={detail.complaint.trang_thai} /></div></div><Panel title='Nội dung khiếu nại'><p className='text-sm leading-6 text-slate-700'>{detail.complaint.noi_dung}</p>{detail.complaint.ket_qua_xu_ly ? <p className='mt-4 rounded-xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-700'>{detail.complaint.ket_qua_xu_ly}</p> : null}</Panel><Panel title='Timeline trao đổi'><div className='space-y-3'>{detail.messages?.map((msg: Complaint) => <div key={msg.id} className='rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm'><b>{msg.sender_name}</b><p className='mt-1 leading-6 text-slate-600'>{msg.noi_dung}</p></div>)}{!detail.messages?.length ? <EmptyState text='Chưa có tin nhắn.' /> : null}</div></Panel><Field label='Phản hồi ticket' error={errors.messageText}><textarea className={inputClass} rows={4} placeholder='Nhập phản hồi cho ticket' value={messageText} onChange={(e) => { setMessageText(e.target.value); setErrors({}) }} /></Field><div className='flex justify-end gap-2'><ActionButton onClick={sendMessage}>Gửi phản hồi</ActionButton><ActionButton tone='accent' onClick={openResolve}>Đóng với kết quả</ActionButton></div></div> : null}
    </Modal>
    <Modal open={resolveOpen} onClose={() => setResolveOpen(false)} title='Đóng khiếu nại' description='Nhập kết quả xử lý rõ ràng để lưu vào lịch sử ticket.'>
      <div className='space-y-4'><Field label='Kết quả xử lý' error={errors.resolveText}><textarea className={inputClass} rows={5} value={resolveText} onChange={(e) => { setResolveText(e.target.value); setErrors({}) }} placeholder='Ví dụ: Đã xác minh giao dịch và hoàn tiền cho khách theo chính sách.' /></Field><div className='flex justify-end gap-2'><ActionButton tone='secondary' onClick={() => setResolveOpen(false)}>Hủy</ActionButton><ActionButton tone='accent' onClick={submitResolve}>Xác nhận đóng</ActionButton></div></div>
    </Modal>
  </>
}
