'use client'

import { useEffect, useMemo, useState } from 'react'
import { ActionButton, EmptyState, Field, Notice, PageHeader, Panel, StatCard, StatusPill, Toolbar, inputClass } from '@/components/admin/admin-ui'
import { DataTable, Modal, Td, Th } from '@/components/admin/admin-table'
import { adminGet, adminPatch } from '@/lib/admin-api'

type Review = Record<string, any>

export default function ReviewsPage() {
  const [rows, setRows] = useState<Review[]>([])
  const [status, setStatus] = useState('')
  const [rating, setRating] = useState('')
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<Review | null>(null)
  const [reason, setReason] = useState('')
  const [message, setMessage] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (status) params.set('status', status)
      if (rating) params.set('rating', rating)
      if (query) params.set('search', query)
      setRows(await adminGet<Review[]>(`/reviews${params.toString() ? `?${params}` : ''}`))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load().catch((err) => setMessage(err.message)) }, [status, rating])

  const stats = useMemo(() => ({
    total: rows.length,
    avg: rows.length ? (rows.reduce((sum, row) => sum + Number(row.diem), 0) / rows.length).toFixed(1) : '0.0',
    flagged: rows.filter((row) => ['bi_bao_cao', 'bi_an'].includes(row.trang_thai)).length,
  }), [rows])

  async function moderate(row: Review, nextStatus: string, note?: string) {
    if (nextStatus !== 'hien_thi' && !note?.trim()) {
      setSelected(row)
      setReason(note ?? '')
      setErrors({ reason: 'Vui lòng nhập lý do trước khi ẩn review.' })
      return
    }
    setErrors({})
    await adminPatch(`/reviews/${row.id}/status`, { trang_thai: nextStatus, ly_do_an: note })
    setMessage('Đã cập nhật trạng thái đánh giá và tính lại điểm chuyên gia.')
    setSelected(null)
    await load()
  }

  return (
    <>
      <PageHeader eyebrow='Trust & quality' title='Quản lý đánh giá của user' description='Duyệt đánh giá bằng bảng, mở modal khi cần xem nội dung dài hoặc nhập lý do moderation.' />
      {message ? <Notice>{message}</Notice> : null}
      <div className='mb-5 grid gap-4 md:grid-cols-3'><StatCard label='Review trong bộ lọc' value={String(stats.total)} /><StatCard label='Điểm trung bình' value={`${stats.avg}/5`} tone='green' /><StatCard label='Cần chú ý' value={String(stats.flagged)} tone='orange' /></div>
      <Panel title='Danh sách đánh giá' description='Không dùng card để tránh dài màn khi có nhiều review.'>
        <Toolbar>
          <input className={inputClass} placeholder='Tìm khách hàng, chuyên gia hoặc nội dung' value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') load() }} />
          <select className={inputClass} value={status} onChange={(e) => setStatus(e.target.value)}><option value=''>Tất cả trạng thái</option>{['hien_thi','bi_an','bi_bao_cao','da_xoa'].map((item) => <option key={item} value={item}>{item}</option>)}</select>
          <select className={inputClass} value={rating} onChange={(e) => setRating(e.target.value)}><option value=''>Tất cả điểm</option>{[5,4,3,2,1].map((item) => <option key={item} value={item}>{item} sao</option>)}</select>
          <ActionButton tone='secondary' onClick={load}>Lọc</ActionButton>
        </Toolbar>
        <DataTable minWidth='980px'><thead><tr><Th>Khách hàng</Th><Th>Chuyên gia</Th><Th>Điểm</Th><Th>Nội dung</Th><Th>Trạng thái</Th><Th className='text-right'>Hành động</Th></tr></thead><tbody>{rows.map((row) => <tr key={row.id} className='hover:bg-blue-50/40'><Td><b>{row.customer_name}</b></Td><Td>{row.expert_name}</Td><Td><span className='font-mono font-semibold text-[#F97316]'>{row.diem}/5</span></Td><Td><p className='line-clamp-2 max-w-md text-sm leading-6'>{row.noi_dung}</p>{row.expert_reply ? <p className='mt-1 text-xs text-slate-500'>Có phản hồi chuyên gia</p> : null}</Td><Td><StatusPill value={row.trang_thai} /></Td><Td className='text-right'><div className='flex justify-end gap-2'><ActionButton tone='secondary' onClick={() => { setSelected(row); setReason(''); setErrors({}) }}>Xem</ActionButton><ActionButton tone='secondary' onClick={() => moderate(row, 'hien_thi')}>Hiện</ActionButton><ActionButton tone='danger' onClick={() => moderate(row, 'bi_an')}>Ẩn</ActionButton></div></Td></tr>)}</tbody></DataTable>
        {!rows.length && !loading ? <div className='mt-4'><EmptyState text='Không có đánh giá phù hợp.' /></div> : null}
      </Panel>
      <Modal open={Boolean(selected)} onClose={() => setSelected(null)} title='Chi tiết đánh giá' description='Ẩn review cần lý do để lưu audit.'>
        {selected ? <div className='space-y-4'><div className='rounded-2xl bg-slate-50 p-4'><p className='font-semibold'>{selected.customer_name} đánh giá {selected.expert_name}</p><p className='mt-2 font-mono text-[#F97316]'>{selected.diem}/5</p><p className='mt-3 text-sm leading-6 text-slate-700'>{selected.noi_dung}</p>{selected.expert_reply ? <p className='mt-3 rounded-xl bg-white p-3 text-sm text-slate-600'>Phản hồi chuyên gia: {selected.expert_reply}</p> : null}</div><Field label='Lý do ẩn review' error={errors.reason}><textarea className={inputClass} rows={4} value={reason} onChange={(e) => { setReason(e.target.value); setErrors({}) }} placeholder='Ví dụ: Nội dung không phù hợp hoặc sai chính sách cộng đồng' /></Field><div className='flex justify-end gap-2'><ActionButton tone='secondary' onClick={() => moderate(selected, 'hien_thi')}>Cho hiển thị</ActionButton><ActionButton tone='danger' onClick={() => moderate(selected, 'bi_an', reason)}>Ẩn review</ActionButton></div></div> : null}
      </Modal>
    </>
  )
}
