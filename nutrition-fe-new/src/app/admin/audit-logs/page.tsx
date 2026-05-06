'use client'

import { useEffect, useMemo, useState } from 'react'
import { ScrollText, Eye, ArrowRight, Search, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react'
import { ActionButton, EmptyState, Notice, PageHeader, Panel, StatCard, Toolbar, inputClass } from '@/components/admin/admin-ui'
import { DataTable, Modal, Td, Th } from '@/components/admin/admin-table'
import { adminGet } from '@/lib/admin-api'

type Row = Record<string, any>

type ListResponse = {
  rows: Row[]
  total: number
  page: number
  limit: number
}

/* Map action sang label tiếng Việt + màu */
const ACTION_PRESETS: Record<string, { label: string; color: string }> = {
  // Tài khoản & chuyên gia
  update_user_status: { label: 'Đổi trạng thái user', color: 'orange' },
  update_user_role: { label: 'Đổi vai trò user', color: 'orange' },
  update_expert_profile: { label: 'Cập nhật hồ sơ chuyên gia', color: 'blue' },
  update_expert_status: { label: 'Đổi trạng thái chuyên gia', color: 'orange' },
  update_expert_booking: { label: 'Bật/tắt nhận booking', color: 'slate' },
  update_expert_commission: { label: 'Đổi tỉ lệ hoa hồng', color: 'purple' },
  // Gói dịch vụ
  create: { label: 'Tạo mới', color: 'green' },
  update: { label: 'Cập nhật', color: 'blue' },
  update_price: { label: 'Đổi giá', color: 'purple' },
  update_status: { label: 'Đổi trạng thái', color: 'orange' },
  assign_expert: { label: 'Gán chuyên gia', color: 'green' },
  update_expert_mapping: { label: 'Cập nhật mapping', color: 'blue' },
  pause_expert_mapping: { label: 'Tạm dừng mapping', color: 'orange' },
  // Giao dịch
  refund: { label: 'Hoàn tiền', color: 'red' },
  reconcile: { label: 'Đối soát', color: 'blue' },
  // Đánh giá
  moderate_review: { label: 'Kiểm duyệt đánh giá', color: 'orange' },
  review_moderation_note: { label: 'Ghi chú kiểm duyệt', color: 'slate' },
  // Khiếu nại
  resolve_complaint: { label: 'Giải quyết khiếu nại', color: 'green' },
  complaint_message: { label: 'Trả lời khiếu nại', color: 'blue' },
  assign_complaint: { label: 'Phân công khiếu nại', color: 'blue' },
  // Hoa hồng & doanh thu
  create_commission_period: { label: 'Tạo kỳ hoa hồng', color: 'green' },
  export_revenue: { label: 'Xuất doanh thu', color: 'slate' },
  // Booking
  cancel_booking: { label: 'Hủy booking', color: 'red' },
  // Notification
  create_notification: { label: 'Tạo thông báo', color: 'green' },
  mark_notification_read: { label: 'Đánh dấu đã đọc', color: 'slate' },
}

const RESOURCE_LABELS: Record<string, string> = {
  tai_khoan: 'Tài khoản',
  chuyen_gia: 'Chuyên gia',
  goi_dich_vu: 'Gói dịch vụ',
  goi_dich_vu_chuyen_gia: 'Mapping gói-chuyên gia',
  thanh_toan: 'Giao dịch',
  danh_gia: 'Đánh giá',
  khieu_nai: 'Khiếu nại',
  ky_hoa_hong: 'Kỳ hoa hồng',
  cau_hinh_hoa_hong: 'Cấu hình hoa hồng',
  thong_bao: 'Thông báo',
  lich_hen: 'Lịch hẹn',
  export_job: 'Xuất file',
}

function ActionBadge({ action }: { action: string }) {
  const preset = ACTION_PRESETS[action]
  const label = preset?.label ?? action
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    green: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    orange: 'bg-orange-50 text-orange-700 border-orange-200',
    red: 'bg-red-50 text-red-700 border-red-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
    slate: 'bg-slate-50 text-slate-700 border-slate-200',
  }
  const cls = colorClasses[preset?.color ?? 'slate']
  return (
    <span className={`inline-flex items-center whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-semibold ${cls}`}>
      {label}
    </span>
  )
}

function fmt(value?: string | null) {
  if (!value) return '—'
  return new Date(value).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'medium' })
}

/* Render JSON đẹp với highlight cơ bản */
function JsonBlock({ value, label }: { value: any; label: string }) {
  if (value === null || value === undefined) {
    return (
      <div>
        <p className='mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500'>{label}</p>
        <p className='rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs italic text-slate-400'>(không có)</p>
      </div>
    )
  }
  const text = typeof value === 'string' ? value : JSON.stringify(value, null, 2)
  return (
    <div>
      <p className='mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500'>{label}</p>
      <pre className='max-h-80 overflow-auto rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs leading-5 text-slate-800'>
        {text}
      </pre>
    </div>
  )
}

export default function AdminAuditLogsPage() {
  const [data, setData] = useState<ListResponse>({ rows: [], total: 0, page: 1, limit: 50 })
  const [facets, setFacets] = useState<{ actions: string[]; resource_types: string[] }>({ actions: [], resource_types: [] })
  const [detail, setDetail] = useState<Row | null>(null)
  const [query, setQuery] = useState('')
  const [action, setAction] = useState('')
  const [resourceType, setResourceType] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [page, setPage] = useState(1)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const limit = 50

  async function load() {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams()
      if (query) params.set('search', query)
      if (action) params.set('action', action)
      if (resourceType) params.set('resourceType', resourceType)
      if (from) params.set('from', from)
      if (to) params.set('to', to)
      params.set('page', String(page))
      params.set('limit', String(limit))
      const res = await adminGet<ListResponse>(`/audit-logs?${params}`)
      setData(res)
    } catch (err: any) {
      setError(err.message ?? 'Không tải được nhật ký')
    } finally {
      setLoading(false)
    }
  }

  async function loadFacets() {
    try {
      const res = await adminGet<typeof facets>('/audit-logs/facets')
      setFacets(res)
    } catch {
      // ignore
    }
  }

  useEffect(() => { loadFacets() }, [])
  useEffect(() => { load() }, [action, resourceType, from, to, page])

  const totalPages = Math.max(1, Math.ceil(data.total / limit))

  const stats = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10)
    return {
      total: data.total,
      todayCount: data.rows.filter((r) => String(r.tao_luc).slice(0, 10) === today).length,
      uniqueActors: new Set(data.rows.map((r) => r.actor_id).filter(Boolean)).size,
    }
  }, [data])

  return (
    <>
      <PageHeader
        eyebrow='Audit & compliance'
        title='Nhật ký hệ thống'
        description='Toàn bộ hành động của admin được ghi lại để truy vết và đối soát. Click vào dòng để xem chi tiết thay đổi.'
      />
      {error ? <Notice tone='error'>{error}</Notice> : null}

      <div className='mb-5 grid gap-3 sm:grid-cols-3'>
        <StatCard label='Tổng bản ghi' value={String(data.total)} icon={ScrollText} />
        <StatCard label='Hôm nay (trong trang)' value={String(stats.todayCount)} tone='blue' />
        <StatCard label='Người thực hiện khác nhau' value={String(stats.uniqueActors)} tone='green' />
      </div>

      <Panel title='Danh sách hoạt động'>
        <Toolbar>
          <input
            className={inputClass}
            placeholder='Tìm theo action, resource hoặc người thực hiện...'
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { setPage(1); load() } }}
          />
          <select className={inputClass} value={action} onChange={(e) => { setPage(1); setAction(e.target.value) }}>
            <option value=''>Tất cả hành động</option>
            {facets.actions.map((a) => (
              <option key={a} value={a}>{ACTION_PRESETS[a]?.label ?? a}</option>
            ))}
          </select>
          <select className={inputClass} value={resourceType} onChange={(e) => { setPage(1); setResourceType(e.target.value) }}>
            <option value=''>Tất cả loại</option>
            {facets.resource_types.map((r) => (
              <option key={r} value={r}>{RESOURCE_LABELS[r] ?? r}</option>
            ))}
          </select>
          <input type='date' className={inputClass} value={from} onChange={(e) => { setPage(1); setFrom(e.target.value) }} aria-label='Từ ngày' />
          <input type='date' className={inputClass} value={to} onChange={(e) => { setPage(1); setTo(e.target.value) }} aria-label='Đến ngày' />
          <ActionButton tone='secondary' onClick={() => { setPage(1); load() }}>
            <span className='flex items-center gap-1.5'><Search size={13} />Tìm</span>
          </ActionButton>
          <ActionButton tone='secondary' onClick={load} disabled={loading}>
            <span className='flex items-center gap-1.5'>
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
              Làm mới
            </span>
          </ActionButton>
        </Toolbar>

        <DataTable minWidth='1100px'>
          <thead>
            <tr>
              <Th>Thời gian</Th>
              <Th>Người thực hiện</Th>
              <Th>Hành động</Th>
              <Th>Tài nguyên</Th>
              <Th>ID</Th>
              <Th className='text-right'>Chi tiết</Th>
            </tr>
          </thead>
          <tbody>
            {data.rows.map((row) => (
              <tr
                key={row.id}
                className='cursor-pointer transition-colors duration-150 hover:bg-blue-50/60'
                onClick={() => setDetail(row)}
              >
                <Td className='whitespace-nowrap text-xs text-slate-600'>{fmt(row.tao_luc)}</Td>
                <Td>
                  {row.actor_name ? (
                    <>
                      <p className='font-medium'>{row.actor_name}</p>
                      <p className='text-xs text-slate-500'>{row.actor_email}</p>
                    </>
                  ) : (
                    <span className='text-xs italic text-slate-400'>Hệ thống</span>
                  )}
                </Td>
                <Td><ActionBadge action={row.action} /></Td>
                <Td>
                  <p className='font-medium'>{RESOURCE_LABELS[row.resource_type] ?? row.resource_type}</p>
                  <p className='font-mono text-xs text-slate-500'>{row.resource_type}</p>
                </Td>
                <Td className='font-mono text-xs'>{row.resource_id ?? '—'}</Td>
                <Td className='text-right' onClick={(e) => e.stopPropagation()}>
                  <ActionButton tone='secondary' onClick={() => setDetail(row)}>
                    <span className='flex items-center gap-1.5'><Eye size={12} />Xem</span>
                  </ActionButton>
                </Td>
              </tr>
            ))}
          </tbody>
        </DataTable>
        {!data.rows.length && !loading ? (
          <div className='mt-4'><EmptyState text='Không có bản ghi nào theo bộ lọc.' /></div>
        ) : null}

        {/* Pagination */}
        {data.total > limit && (
          <div className='mt-4 flex items-center justify-between text-sm text-slate-600'>
            <p>
              Trang <b>{page}</b> / {totalPages} · Tổng <b>{data.total.toLocaleString('vi-VN')}</b> bản ghi
            </p>
            <div className='flex gap-2'>
              <ActionButton tone='secondary' onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1 || loading}>
                <span className='flex items-center gap-1'><ChevronLeft size={13} />Trước</span>
              </ActionButton>
              <ActionButton tone='secondary' onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages || loading}>
                <span className='flex items-center gap-1'>Sau<ChevronRight size={13} /></span>
              </ActionButton>
            </div>
          </div>
        )}
      </Panel>

      {/* Detail modal */}
      <Modal
        open={Boolean(detail)}
        onClose={() => setDetail(null)}
        title={detail ? `Audit #${detail.id}` : 'Chi tiết audit log'}
        description='Toàn bộ thông tin về bản ghi audit, bao gồm giá trị trước/sau và metadata kỹ thuật.'
        width='max-w-4xl'
      >
        {detail ? (
          <div className='space-y-4'>
            {/* Header info */}
            <div className='grid gap-3 md:grid-cols-2'>
              <div className='rounded-xl border border-slate-200 bg-slate-50 p-3'>
                <p className='text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1'>Hành động</p>
                <ActionBadge action={detail.action} />
                <p className='mt-1 font-mono text-xs text-slate-500'>{detail.action}</p>
              </div>
              <div className='rounded-xl border border-slate-200 bg-slate-50 p-3'>
                <p className='text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1'>Thực hiện lúc</p>
                <p className='text-sm font-medium text-slate-900'>{fmt(detail.tao_luc)}</p>
              </div>
              <div className='rounded-xl border border-slate-200 bg-slate-50 p-3'>
                <p className='text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1'>Người thực hiện</p>
                {detail.actor_name ? (
                  <>
                    <p className='text-sm font-semibold text-slate-900'>{detail.actor_name}</p>
                    <p className='text-xs text-slate-500'>{detail.actor_email} · ID {detail.actor_id} · {detail.actor_role}</p>
                  </>
                ) : (
                  <p className='text-sm italic text-slate-500'>Hệ thống / Không xác định</p>
                )}
              </div>
              <div className='rounded-xl border border-slate-200 bg-slate-50 p-3'>
                <p className='text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1'>Tài nguyên</p>
                <p className='text-sm font-semibold text-slate-900'>{RESOURCE_LABELS[detail.resource_type] ?? detail.resource_type}</p>
                <p className='font-mono text-xs text-slate-500'>{detail.resource_type} #{detail.resource_id ?? '—'}</p>
              </div>
            </div>

            {/* Diff: old vs new */}
            <div className='grid gap-3 md:grid-cols-2'>
              <JsonBlock label='Giá trị trước' value={detail.old_value} />
              <JsonBlock label='Giá trị sau' value={detail.new_value} />
            </div>

            {/* Metadata kỹ thuật */}
            {(detail.ip_address || detail.user_agent || detail.request_id) && (
              <div className='rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600'>
                <p className='font-semibold uppercase tracking-wide text-slate-500 mb-2'>Metadata kỹ thuật</p>
                {detail.ip_address && <p><b>IP:</b> {detail.ip_address}</p>}
                {detail.request_id && <p><b>Request ID:</b> <span className='font-mono'>{detail.request_id}</span></p>}
                {detail.user_agent && <p className='break-all'><b>User Agent:</b> {detail.user_agent}</p>}
              </div>
            )}
          </div>
        ) : null}
      </Modal>
    </>
  )
}
