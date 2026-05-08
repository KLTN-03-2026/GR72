'use client'

import { useEffect, useMemo, useState } from 'react'
import { Star, Search, MessageCircle, AlertTriangle } from 'lucide-react'
import {
  ActionButton, EmptyState, Field, FilterChip, LoadingSkeleton, Notice, PageHeader, Panel,
  StatCard, StatusPill, inputClass,
} from '@/components/admin/admin-ui'
import { DataTable, Modal, Td, Th } from '@/components/admin/admin-table'
import { adminGet, adminPatch } from '@/lib/admin-api'
import { STATUS_LABELS } from '@/lib/i18n'

type Review = Record<string, any>

const STATUS_OPTIONS = ['hien_thi', 'bi_an', 'bi_bao_cao', 'da_xoa']

export default function ReviewsPage() {
  const [rows, setRows] = useState<Review[]>([])
  const [status, setStatus] = useState('')
  const [rating, setRating] = useState('')
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<Review | null>(null)
  const [reason, setReason] = useState('')
  const [message, setMessage] = useState('')
  const [tone, setTone] = useState<'info' | 'success' | 'error'>('info')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (status) params.set('status', status)
      if (rating) params.set('rating', rating)
      if (query) params.set('search', query)
      setRows(await adminGet<Review[]>(`/reviews${params.toString() ? `?${params}` : ''}`))
    } catch (e: any) {
      setMessage(e.message ?? 'Lỗi tải')
      setTone('error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [status, rating])

  const stats = useMemo(() => ({
    total: rows.length,
    avg: rows.length ? (rows.reduce((sum, row) => sum + Number(row.diem), 0) / rows.length).toFixed(1) : '0.0',
    flagged: rows.filter((row) => row.trang_thai === 'bi_bao_cao').length,
    hidden: rows.filter((row) => row.trang_thai === 'bi_an').length,
  }), [rows])

  async function moderate(row: Review, nextStatus: string, note?: string) {
    if (nextStatus !== 'hien_thi' && !note?.trim()) {
      setSelected(row)
      setReason(note ?? '')
      setErrors({ reason: 'Vui lòng nhập lý do trước khi ẩn review.' })
      return
    }
    try {
      setErrors({})
      await adminPatch(`/reviews/${row.id}/status`, { trang_thai: nextStatus, ly_do_an: note })
      setMessage('✅ Đã cập nhật trạng thái đánh giá.')
      setTone('success')
      setSelected(null)
      await load()
    } catch (e: any) {
      setMessage(e.message ?? 'Lỗi cập nhật')
      setTone('error')
    }
  }

  return (
    <>
      <PageHeader
        eyebrow='Chất lượng & tin cậy'
        title='Kiểm duyệt đánh giá'
        description='Duyệt và xử lý các đánh giá vi phạm. Ẩn review cần ghi rõ lý do.'
      />
      {message ? <Notice tone={tone}>{message}</Notice> : null}

      <div className='mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4'>
        <StatCard label='Tổng review' value={String(stats.total)} icon={MessageCircle} tone='blue' />
        <StatCard label='Điểm trung bình' value={`${stats.avg}/5`} icon={Star} tone='green' />
        <StatCard label='Bị báo cáo' value={String(stats.flagged)} icon={AlertTriangle} tone='red' />
        <StatCard label='Đã ẩn' value={String(stats.hidden)} tone='slate' />
      </div>

      <Panel
        title='Danh sách đánh giá'
        description='Lọc theo điểm và trạng thái. Bấm vào hàng để xem nội dung đầy đủ.'
      >
        {/* Search */}
        <div className='mb-3 relative'>
          <Search size={15} className='absolute left-3 top-1/2 -translate-y-1/2 text-slate-400' />
          <input
            className={`${inputClass} pl-10`}
            placeholder='Tìm khách hàng, chuyên gia hoặc nội dung review...'
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') load() }}
          />
        </div>

        {/* Filter chips */}
        <div className='mb-2 flex flex-wrap items-center gap-2'>
          <span className='text-xs font-semibold uppercase text-slate-500'>Trạng thái:</span>
          <FilterChip active={!status} onClick={() => setStatus('')}>Tất cả</FilterChip>
          {STATUS_OPTIONS.map((s) => (
            <FilterChip key={s} active={status === s} onClick={() => setStatus(s)}>
              {STATUS_LABELS[s]}
            </FilterChip>
          ))}
        </div>
        <div className='mb-4 flex flex-wrap items-center gap-2'>
          <span className='text-xs font-semibold uppercase text-slate-500'>Điểm:</span>
          <FilterChip active={!rating} onClick={() => setRating('')}>Tất cả</FilterChip>
          {[5, 4, 3, 2, 1].map((n) => (
            <FilterChip key={n} active={rating === String(n)} onClick={() => setRating(String(n))}>
              <span className='inline-flex items-center gap-1'>
                {n} <Star size={11} fill='#f59e0b' className='text-amber-500' />
              </span>
            </FilterChip>
          ))}
        </div>

        {loading ? (
          <LoadingSkeleton rows={5} />
        ) : rows.length === 0 ? (
          <EmptyState text='Không có đánh giá phù hợp.' />
        ) : (
          <DataTable minWidth='980px'>
            <thead>
              <tr>
                <Th>Khách hàng</Th>
                <Th>Chuyên gia</Th>
                <Th>Điểm</Th>
                <Th>Nội dung</Th>
                <Th>Trạng thái</Th>
                <Th className='text-right'>Hành động</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className='hover:bg-blue-50/40'>
                  <Td><b>{row.customer_name}</b></Td>
                  <Td>{row.expert_name}</Td>
                  <Td>
                    <div className='inline-flex items-center gap-0.5'>
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          size={13}
                          className={s <= Number(row.diem) ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}
                        />
                      ))}
                    </div>
                  </Td>
                  <Td>
                    <p className='line-clamp-2 max-w-md text-sm leading-6'>{row.noi_dung}</p>
                    {row.expert_reply && (
                      <p className='mt-1 text-xs italic text-emerald-600'>↳ Có phản hồi chuyên gia</p>
                    )}
                  </Td>
                  <Td><StatusPill value={row.trang_thai} /></Td>
                  <Td className='text-right'>
                    <div className='flex justify-end gap-2'>
                      <ActionButton tone='secondary' onClick={() => { setSelected(row); setReason(''); setErrors({}) }}>Xem</ActionButton>
                      {row.trang_thai !== 'hien_thi' && <ActionButton tone='secondary' onClick={() => moderate(row, 'hien_thi')}>Hiện</ActionButton>}
                      {row.trang_thai !== 'bi_an' && <ActionButton tone='danger' onClick={() => { setSelected(row); setReason(''); setErrors({ reason: 'Nhập lý do' }) }}>Ẩn</ActionButton>}
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </DataTable>
        )}
      </Panel>

      <Modal
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title='Chi tiết đánh giá'
        description='Ẩn review yêu cầu nhập lý do để lưu vào audit log.'
      >
        {selected && (
          <div className='space-y-4'>
            <div className='rounded-2xl bg-slate-50 p-4'>
              <div className='flex items-center justify-between'>
                <p className='font-semibold text-slate-900'>{selected.customer_name}</p>
                <div className='inline-flex items-center gap-0.5'>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} size={15} className={s <= Number(selected.diem) ? 'fill-amber-400 text-amber-400' : 'text-slate-300'} />
                  ))}
                </div>
              </div>
              <p className='mt-1 text-xs text-slate-500'>đánh giá <strong>{selected.expert_name}</strong></p>
              <p className='mt-3 text-sm leading-6 text-slate-700'>"{selected.noi_dung}"</p>
              {selected.expert_reply && (
                <div className='mt-3 rounded-xl border border-emerald-100 bg-white p-3'>
                  <p className='text-xs font-semibold text-emerald-700'>↳ Phản hồi của chuyên gia</p>
                  <p className='mt-1 text-sm text-slate-700'>{selected.expert_reply}</p>
                </div>
              )}
            </div>
            <Field label='Lý do ẩn (nếu chọn ẩn)' error={errors.reason}>
              <textarea
                className={inputClass}
                rows={4}
                value={reason}
                onChange={(e) => { setReason(e.target.value); setErrors({}) }}
                placeholder='Ví dụ: Vi phạm tiêu chuẩn cộng đồng, nội dung không phù hợp...'
              />
            </Field>
            <div className='flex justify-end gap-2'>
              <ActionButton tone='secondary' onClick={() => moderate(selected, 'hien_thi')}>Cho hiển thị</ActionButton>
              <ActionButton tone='danger' onClick={() => moderate(selected, 'bi_an', reason)}>Ẩn review</ActionButton>
            </div>
          </div>
        )}
      </Modal>
    </>
  )
}
