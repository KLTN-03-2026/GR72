'use client'

import { useEffect, useMemo, useState } from 'react'
import { Search, MessageSquare, AlertOctagon, CheckSquare, ClipboardList, Send, User } from 'lucide-react'
import {
  ActionButton, EmptyState, Field, FilterChip, LoadingSkeleton, Notice,
  PageHeader, Panel, StatCard, StatusPill, inputClass,
} from '@/components/admin/admin-ui'
import { DataTable, Modal, Td, Th } from '@/components/admin/admin-table'
import { adminGet, adminPatch, adminPost } from '@/lib/admin-api'
import { STATUS_LABELS, PRIORITY_LABELS, COMPLAINT_TYPE_LABELS } from '@/lib/i18n'

type Complaint = Record<string, any>

const STATUSES = ['moi', 'dang_xu_ly', 'cho_phan_hoi', 'da_giai_quyet', 'da_dong']
const PRIORITIES = ['thap', 'trung_binh', 'cao']
const TYPES = ['thanh_toan', 'lich_hen', 'chuyen_gia', 'he_thong', 'khac']

export default function ComplaintsPage() {
  const [rows, setRows] = useState<Complaint[]>([])
  const [detail, setDetail] = useState<Complaint | null>(null)
  const [messageText, setMessageText] = useState('')
  const [resolveText, setResolveText] = useState('')
  const [notice, setNotice] = useState('')
  const [tone, setTone] = useState<'info' | 'success' | 'error'>('info')
  const [filter, setFilter] = useState('')
  const [priority, setPriority] = useState('')
  const [type, setType] = useState('')
  const [query, setQuery] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [resolveOpen, setResolveOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filter) params.set('status', filter)
      if (priority) params.set('priority', priority)
      if (type) params.set('type', type)
      if (query) params.set('search', query)
      setRows(await adminGet<Complaint[]>(`/complaints${params.toString() ? `?${params}` : ''}`))
    } catch (e: any) { setNotice(e.message ?? 'Lỗi'); setTone('error') }
    finally { setLoading(false) }
  }

  async function open(id: number) {
    try {
      setDetail(await adminGet<Complaint>(`/complaints/${id}`))
      setMessageText('')
      setErrors({})
    } catch (e: any) { setNotice(e.message ?? 'Lỗi'); setTone('error') }
  }

  useEffect(() => { load() }, [filter, priority, type])

  const stats = useMemo(() => ({
    total: rows.length,
    open: rows.filter((row) => ['moi', 'dang_xu_ly', 'cho_phan_hoi'].includes(row.trang_thai)).length,
    high: rows.filter((row) => row.muc_uu_tien === 'cao').length,
    done: rows.filter((row) => ['da_giai_quyet', 'da_dong'].includes(row.trang_thai)).length,
  }), [rows])

  async function assign(row: Complaint) {
    try {
      await adminPatch(`/complaints/${row.id}/assign`, { muc_uu_tien: 'cao', trang_thai: 'dang_xu_ly' })
      setNotice('✅ Đã nhận xử lý ticket.'); setTone('success')
      await load()
      await open(row.id)
    } catch (e: any) { setNotice(e.message ?? 'Lỗi'); setTone('error') }
  }

  async function sendMessage() {
    if (!detail) return
    if (!messageText.trim()) {
      setErrors({ messageText: 'Vui lòng nhập nội dung phản hồi.' })
      return
    }
    setSending(true)
    try {
      await adminPost(`/complaints/${detail.complaint.id}/messages`, { noi_dung: messageText })
      setMessageText('')
      setErrors({})
      await open(detail.complaint.id)
    } catch (e: any) { setNotice(e.message ?? 'Lỗi'); setTone('error') }
    finally { setSending(false) }
  }

  function openResolve() {
    setResolveText('')
    setErrors({})
    setResolveOpen(true)
  }

  async function submitResolve() {
    if (!detail) return
    if (!resolveText.trim()) {
      setErrors({ resolveText: 'Vui lòng nhập kết quả xử lý.' })
      return
    }
    try {
      await adminPatch(`/complaints/${detail.complaint.id}/resolve`, { ket_qua_xu_ly: resolveText, trang_thai: 'da_giai_quyet' })
      setNotice('✅ Đã giải quyết khiếu nại.')
      setTone('success')
      setResolveOpen(false)
      await load()
      await open(detail.complaint.id)
    } catch (e: any) { setNotice(e.message ?? 'Lỗi'); setTone('error') }
  }

  return (
    <>
      <PageHeader
        eyebrow='Hỗ trợ khiếu nại'
        title='Quản lý khiếu nại'
        description='Xử lý ticket khiếu nại từ khách hàng và chuyên gia.'
      />
      {notice ? <Notice tone={tone}>{notice}</Notice> : null}

      <div className='mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4'>
        <StatCard label='Tổng ticket' value={String(stats.total)} icon={ClipboardList} tone='blue' />
        <StatCard label='Đang mở' value={String(stats.open)} icon={MessageSquare} tone='orange' />
        <StatCard label='Ưu tiên cao' value={String(stats.high)} icon={AlertOctagon} tone='red' />
        <StatCard label='Đã xử lý' value={String(stats.done)} icon={CheckSquare} tone='green' />
      </div>

      <Panel title='Danh sách ticket' description='Bấm "Chi tiết" để xem timeline trao đổi và phản hồi khách.'>
        <div className='mb-3 relative'>
          <Search size={15} className='absolute left-3 top-1/2 -translate-y-1/2 text-slate-400' />
          <input
            className={`${inputClass} pl-10`}
            placeholder='Tìm mã ticket, tiêu đề, người gửi...'
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') load() }}
          />
        </div>

        <div className='mb-2 flex flex-wrap items-center gap-2'>
          <span className='text-xs font-semibold uppercase text-slate-500'>Trạng thái:</span>
          <FilterChip active={!filter} onClick={() => setFilter('')}>Tất cả</FilterChip>
          {STATUSES.map((s) => <FilterChip key={s} active={filter === s} onClick={() => setFilter(s)}>{STATUS_LABELS[s]}</FilterChip>)}
        </div>
        <div className='mb-2 flex flex-wrap items-center gap-2'>
          <span className='text-xs font-semibold uppercase text-slate-500'>Ưu tiên:</span>
          <FilterChip active={!priority} onClick={() => setPriority('')}>Tất cả</FilterChip>
          {PRIORITIES.map((p) => <FilterChip key={p} active={priority === p} onClick={() => setPriority(p)}>{PRIORITY_LABELS[p]}</FilterChip>)}
        </div>
        <div className='mb-4 flex flex-wrap items-center gap-2'>
          <span className='text-xs font-semibold uppercase text-slate-500'>Loại:</span>
          <FilterChip active={!type} onClick={() => setType('')}>Tất cả</FilterChip>
          {TYPES.map((t) => <FilterChip key={t} active={type === t} onClick={() => setType(t)}>{COMPLAINT_TYPE_LABELS[t] ?? t}</FilterChip>)}
        </div>

        {loading ? (
          <LoadingSkeleton rows={5} />
        ) : rows.length === 0 ? (
          <EmptyState text='Không có ticket theo bộ lọc.' />
        ) : (
          <DataTable minWidth='1040px'>
            <thead>
              <tr>
                <Th>Mã ticket</Th>
                <Th>Tiêu đề</Th>
                <Th>Người gửi</Th>
                <Th>Loại</Th>
                <Th>Ưu tiên</Th>
                <Th>Trạng thái</Th>
                <Th className='text-right'>Hành động</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className='cursor-pointer hover:bg-blue-50/40' onClick={() => open(row.id)}>
                  <Td><b className='font-mono'>{row.ma_khieu_nai}</b></Td>
                  <Td><p className='max-w-sm truncate font-semibold text-slate-950'>{row.tieu_de}</p></Td>
                  <Td>{row.sender_name}</Td>
                  <Td>{COMPLAINT_TYPE_LABELS[row.loai_khieu_nai] ?? row.loai_khieu_nai}</Td>
                  <Td>
                    <span className={`text-xs font-semibold ${row.muc_uu_tien === 'cao' ? 'text-red-600' : row.muc_uu_tien === 'trung_binh' ? 'text-orange-600' : 'text-slate-600'}`}>
                      {PRIORITY_LABELS[row.muc_uu_tien] ?? row.muc_uu_tien}
                    </span>
                  </Td>
                  <Td><StatusPill value={row.trang_thai} /></Td>
                  <Td className='text-right' onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                    <div className='flex justify-end gap-2'>
                      <ActionButton tone='secondary' onClick={() => open(row.id)}>Chi tiết</ActionButton>
                      <ActionButton onClick={() => assign(row)}>Nhận</ActionButton>
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </DataTable>
        )}
      </Panel>

      <Modal open={Boolean(detail)} onClose={() => setDetail(null)} title={detail ? detail.complaint.tieu_de : 'Chi tiết ticket'} description='Phản hồi sẽ lưu vào timeline.' width='max-w-4xl'>
        {detail && (
          <div className='space-y-5'>
            <div className='grid gap-3 sm:grid-cols-2 xl:grid-cols-4'>
              <InfoCard label='Mã' value={detail.complaint.ma_khieu_nai} mono />
              <InfoCard label='Người gửi' value={detail.complaint.sender_name} />
              <InfoCard label='Ưu tiên' value={PRIORITY_LABELS[detail.complaint.muc_uu_tien] ?? detail.complaint.muc_uu_tien} />
              <div className='rounded-xl bg-slate-50 p-3'>
                <p className='text-xs font-semibold uppercase text-slate-500'>Trạng thái</p>
                <div className='mt-1.5'><StatusPill value={detail.complaint.trang_thai} /></div>
              </div>
            </div>

            <Panel title='Nội dung khiếu nại'>
              <p className='whitespace-pre-wrap text-sm leading-6 text-slate-700'>{detail.complaint.noi_dung}</p>
              {detail.complaint.ket_qua_xu_ly && (
                <div className='mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3'>
                  <p className='text-xs font-semibold uppercase text-emerald-700'>✓ Kết quả xử lý</p>
                  <p className='mt-1.5 text-sm text-emerald-900'>{detail.complaint.ket_qua_xu_ly}</p>
                </div>
              )}
            </Panel>

            <Panel title={`Trao đổi (${detail.messages?.length ?? 0})`}>
              {!detail.messages?.length ? (
                <EmptyState text='Chưa có tin nhắn.' />
              ) : (
                <div className='space-y-2'>
                  {detail.messages.map((msg: Complaint) => (
                    <div key={msg.id} className='flex gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3'>
                      <div className='flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700'>
                        <User size={14} />
                      </div>
                      <div className='min-w-0 flex-1'>
                        <p className='text-sm font-semibold text-slate-900'>{msg.sender_name}</p>
                        <p className='mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-700'>{msg.noi_dung}</p>
                        {msg.tao_luc && <p className='mt-1 text-xs text-slate-400'>{String(msg.tao_luc).slice(0, 19).replace('T', ' ')}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Panel>

            <Field label='Phản hồi mới' error={errors.messageText}>
              <textarea
                className={inputClass}
                rows={4}
                placeholder='Nhập phản hồi cho khách...'
                value={messageText}
                onChange={(e) => { setMessageText(e.target.value); setErrors({}) }}
              />
            </Field>
            <div className='flex justify-end gap-2'>
              <ActionButton onClick={sendMessage} disabled={sending}>
                <Send size={13} /> {sending ? 'Đang gửi...' : 'Gửi phản hồi'}
              </ActionButton>
              <ActionButton tone='accent' onClick={openResolve}>Đóng với kết quả</ActionButton>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={resolveOpen} onClose={() => setResolveOpen(false)} title='Đóng khiếu nại' description='Kết quả xử lý sẽ lưu lại vĩnh viễn trong timeline.'>
        <div className='space-y-4'>
          <Field label='Kết quả xử lý' error={errors.resolveText}>
            <textarea
              className={inputClass}
              rows={5}
              value={resolveText}
              onChange={(e) => { setResolveText(e.target.value); setErrors({}) }}
              placeholder='Ví dụ: Đã xác minh và hoàn tiền theo chính sách...'
            />
          </Field>
          <div className='flex justify-end gap-2'>
            <ActionButton tone='secondary' onClick={() => setResolveOpen(false)}>Hủy</ActionButton>
            <ActionButton tone='accent' onClick={submitResolve}>Xác nhận đóng</ActionButton>
          </div>
        </div>
      </Modal>
    </>
  )
}

function InfoCard({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className='rounded-xl bg-slate-50 p-3'>
      <p className='text-xs font-semibold uppercase text-slate-500'>{label}</p>
      <p className={`mt-1 text-sm font-semibold text-slate-900 ${mono ? 'font-mono' : ''}`}>{value}</p>
    </div>
  )
}
