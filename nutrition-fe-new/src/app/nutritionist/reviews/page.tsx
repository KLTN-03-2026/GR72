'use client'

import { useEffect, useMemo, useState } from 'react'
import { ActionButton, EmptyState, Field, Notice, PageHeader, Panel, StatCard, StatusPill, Toolbar, inputClass } from '@/components/admin/admin-ui'
import { DataTable, Modal, Td, Th } from '@/components/admin/admin-table'
import { expertGet, expertPost } from '@/lib/expert-api'

type Row = Record<string, any>

export default function ExpertReviewsPage() {
  const [rows, setRows] = useState<Row[]>([])
  const [summary, setSummary] = useState<Row | null>(null)
  const [rating, setRating] = useState('')
  const [selected, setSelected] = useState<Row | null>(null)
  const [reply, setReply] = useState('')
  const [message, setMessage] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (rating) params.set('rating', rating)
      const [reviewRows, reviewSummary] = await Promise.all([
        expertGet<Row[]>(`/reviews${params.toString() ? `?${params}` : ''}`),
        expertGet<Row>('/reviews/summary'),
      ])
      setRows(reviewRows)
      setSummary(reviewSummary)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load().catch((err) => setMessage(err.message))
  }, [rating])

  const stats = useMemo(() => ({
    avg: Number(summary?.avgRating ?? 0).toFixed(1),
    total: Number(summary?.total ?? 0),
    flagged: Number(summary?.flagged ?? 0),
  }), [summary])

  function openReply(row: Row) {
    setSelected(row)
    setReply(row.expert_reply ?? '')
    setErrors({})
  }

  async function sendReply() {
    if (!selected) return
    if (!reply.trim()) {
      setErrors({ reply: 'Vui lòng nhập phản hồi trước khi gửi.' })
      return
    }
    setSaving(true)
    try {
      await expertPost(`/reviews/${selected.id}/reply`, { noi_dung: reply.trim() })
      setMessage('Đã gửi phản hồi review.')
      setSelected(null)
      setErrors({})
      await load()
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <PageHeader
        eyebrow='Reviews'
        title='Theo dõi đánh giá'
        description='Xem đánh giá của khách hàng và phản hồi để cải thiện chất lượng tư vấn.'
      />
      {message ? <Notice>{message}</Notice> : null}

      <div className='mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3'>
        <StatCard label='Điểm trung bình' value={`${stats.avg}/5`} />
        <StatCard label='Tổng review' value={String(stats.total)} tone='green' />
        <StatCard label='Bị báo cáo' value={String(stats.flagged)} tone='orange' />
      </div>

      <Panel title='Danh sách review' description='Lọc theo số sao, xem nội dung và phản hồi từng đánh giá trong modal.'>
        <Toolbar>
          <Field label='Lọc theo điểm'>
            <select className={inputClass} value={rating} onChange={(e) => setRating(e.target.value)}>
              <option value=''>Tất cả điểm</option>
              {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} sao</option>)}
            </select>
          </Field>
          <ActionButton tone='secondary' onClick={load} disabled={loading}>{loading ? 'Đang lọc...' : 'Lọc'}</ActionButton>
        </Toolbar>
        <DataTable minWidth='940px'>
          <thead><tr><Th>Khách hàng</Th><Th>Điểm</Th><Th>Nội dung</Th><Th>Trạng thái</Th><Th>Phản hồi</Th><Th className='text-right'>Hành động</Th></tr></thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className='transition-colors duration-200 hover:bg-emerald-50/60'>
                <Td><b>{row.customer_name}</b></Td>
                <Td><span className='font-mono font-semibold text-[#F97316]'>{row.diem}/5</span></Td>
                <Td><p className='line-clamp-2 max-w-md'>{row.noi_dung}</p></Td>
                <Td><StatusPill value={row.trang_thai} /></Td>
                <Td>{row.expert_reply ? 'Đã phản hồi' : '-'}</Td>
                <Td className='text-right'><ActionButton tone='secondary' onClick={() => openReply(row)}>Phản hồi</ActionButton></Td>
              </tr>
            ))}
          </tbody>
        </DataTable>
        {!rows.length && !loading ? <div className='mt-4'><EmptyState text='Chưa có review theo bộ lọc.' /></div> : null}
      </Panel>

      <Modal open={Boolean(selected)} onClose={() => setSelected(null)} title='Phản hồi đánh giá' description='Phản hồi sẽ hiển thị cho khách hàng và admin.'>
        {selected ? (
          <div className='space-y-4'>
            <div className='rounded-2xl bg-slate-50 p-4 text-sm'>
              <p className='font-semibold text-slate-950'>{selected.customer_name} · {selected.diem}/5</p>
              <p className='mt-2 leading-6 text-slate-700'>{selected.noi_dung}</p>
            </div>
            <Field label='Nội dung phản hồi' error={errors.reply}>
              <textarea className={inputClass} rows={5} value={reply} onChange={(e) => { setReply(e.target.value); setErrors({}) }} />
            </Field>
            <div className='flex justify-end gap-2'>
              <ActionButton tone='secondary' onClick={() => setSelected(null)}>Hủy</ActionButton>
              <ActionButton onClick={sendReply} disabled={saving}>{saving ? 'Đang gửi...' : 'Gửi phản hồi'}</ActionButton>
            </div>
          </div>
        ) : null}
      </Modal>
    </>
  )
}
