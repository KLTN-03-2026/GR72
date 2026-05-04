'use client'

import { useEffect, useMemo, useState } from 'react'
import { ActionButton, EmptyState, Field, Notice, PageHeader, Panel, StatCard, StatusPill, Toolbar, inputClass } from '@/components/admin/admin-ui'
import { DataTable, Modal, Td, Th } from '@/components/admin/admin-table'
import { expertGet, expertPatch, expertPost } from '@/lib/expert-api'

type Row = Record<string, any>

const STATUS_LABELS: Record<string, string> = {
  cho_xac_nhan: 'Chờ xác nhận',
  da_xac_nhan: 'Đã xác nhận',
  da_checkin: 'Đã check-in',
  dang_tu_van: 'Đang tư vấn',
  hoan_thanh: 'Hoàn thành',
  da_huy: 'Đã hủy',
}

const statuses = Object.keys(STATUS_LABELS)

function canConfirm(s: string) { return s === 'cho_xac_nhan' }
function canCheckin(s: string) { return s === 'da_xac_nhan' }
function canComplete(s: string) { return s === 'da_checkin' || s === 'dang_tu_van' }
function canReject(s: string) { return ['cho_xac_nhan', 'da_xac_nhan'].includes(s) }

export default function BookingsPage() {
  const [rows, setRows] = useState<Row[]>([])
  const [detail, setDetail] = useState<Row | null>(null)
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('')
  const [reason, setReason] = useState('')
  const [message, setMessage] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [acting, setActing] = useState(false)

  async function load() {
    const params = new URLSearchParams()
    if (query) params.set('search', query)
    if (status) params.set('status', status)
    setRows(await expertGet<Row[]>(`/bookings${params.toString() ? `?${params}` : ''}`))
  }

  useEffect(() => {
    load().catch((err) => setMessage(err.message))
  }, [status])

  const stats = useMemo(() => ({
    total: rows.length,
    pending: rows.filter((r) => r.trang_thai === 'cho_xac_nhan').length,
    active: rows.filter((r) => ['da_xac_nhan', 'da_checkin', 'dang_tu_van'].includes(r.trang_thai)).length,
    completed: rows.filter((r) => r.trang_thai === 'hoan_thanh').length,
  }), [rows])

  async function open(id: number) {
    setDetail(await expertGet<Row>(`/bookings/${id}`))
    setReason('')
    setErrors({})
  }

  async function action(id: number, path: string) {
    setActing(true)
    try {
      await (path === 'check-in' ? expertPost(`/bookings/${id}/${path}`) : expertPatch(`/bookings/${id}/${path}`))
      setMessage('Đã cập nhật booking.')
      await load()
      await open(id)
    } finally {
      setActing(false)
    }
  }

  async function reject() {
    if (!detail) return
    if (!reason.trim()) {
      setErrors({ reason: 'Vui lòng nhập lý do từ chối.' })
      return
    }
    setActing(true)
    try {
      await expertPatch(`/bookings/${detail.booking.id}/reject`, { ly_do: reason })
      setMessage('Đã từ chối booking.')
      await load()
      setDetail(null)
    } finally {
      setActing(false)
    }
  }

  const currentStatus = detail?.booking?.trang_thai ?? ''

  return (
    <>
      <PageHeader
        eyebrow='Bookings'
        title='Quản lý booking tư vấn'
        description='Theo dõi và xử lý lịch tư vấn. Lọc theo trạng thái, nhấn Chi tiết để xem và thao tác.'
      />
      {message ? <Notice>{message}</Notice> : null}

      <div className='mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4'>
        <StatCard label='Tổng booking' value={String(stats.total)} />
        <StatCard label='Chờ xác nhận' value={String(stats.pending)} tone='orange' />
        <StatCard label='Đang xử lý' value={String(stats.active)} tone='blue' />
        <StatCard label='Hoàn thành' value={String(stats.completed)} tone='green' />
      </div>

      <Panel title='Danh sách booking' description='Tìm theo khách hàng, mã lịch hoặc gói dịch vụ. Nhấn Chi tiết để xem và xử lý.'>
        <Toolbar>
          <input
            className={inputClass}
            placeholder='Tìm khách hàng, mã lịch, gói...'
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') load() }}
          />
          <select className={inputClass} value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value=''>Tất cả trạng thái</option>
            {statuses.map((s) => (
              <option key={s} value={s}>{STATUS_LABELS[s]}</option>
            ))}
          </select>
          <ActionButton tone='secondary' onClick={load}>Lọc</ActionButton>
        </Toolbar>

        <DataTable minWidth='1060px'>
          <thead>
            <tr>
              <Th>Mã lịch</Th>
              <Th>Khách hàng</Th>
              <Th>Gói</Th>
              <Th>Ngày giờ</Th>
              <Th>Mục đích</Th>
              <Th>Trạng thái</Th>
              <Th className='text-right'>Hành động</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.id}
                className='cursor-pointer transition-colors duration-150 hover:bg-emerald-50/60'
                onClick={() => open(row.id)}
              >
                <Td><b className='font-mono text-xs'>{row.ma_lich_hen}</b></Td>
                <Td>
                  <p className='font-medium'>{row.customer_name}</p>
                  <p className='text-xs text-slate-500'>{row.customer_email}</p>
                </Td>
                <Td>{row.ten_goi}</Td>
                <Td>
                  <p>{String(row.ngay_hen).slice(0, 10)}</p>
                  <p className='text-xs text-slate-500'>{row.gio_bat_dau}</p>
                </Td>
                <Td><p className='line-clamp-2 max-w-xs text-sm'>{row.muc_dich ?? '—'}</p></Td>
                <Td><StatusPill value={row.trang_thai} /></Td>
                <Td className='text-right' onClick={(e) => e.stopPropagation()}>
                  <ActionButton tone='secondary' onClick={() => open(row.id)}>Chi tiết</ActionButton>
                </Td>
              </tr>
            ))}
          </tbody>
        </DataTable>
        {!rows.length ? <div className='mt-4'><EmptyState text='Chưa có booking theo bộ lọc.' /></div> : null}
      </Panel>

      <Modal
        open={Boolean(detail)}
        onClose={() => setDetail(null)}
        title={detail ? `Booking ${detail.booking.ma_lich_hen}` : 'Chi tiết booking'}
        description='Xem thông tin và thao tác theo đúng trạng thái nghiệp vụ.'
        width='max-w-5xl'
      >
        {detail ? (
          <div className='space-y-5'>
            <div className='grid gap-3 md:grid-cols-3'>
              <StatCard label='Khách hàng' value={detail.booking.customer_name} tone='slate' />
              <StatCard label='Gói dịch vụ' value={detail.booking.ten_goi} />
              <div className='flex flex-col justify-between rounded-2xl border border-slate-100 bg-slate-50 p-4'>
                <p className='text-xs font-semibold uppercase tracking-wide text-slate-500'>Trạng thái</p>
                <div className='mt-2'>
                  <StatusPill value={currentStatus} />
                </div>
              </div>
            </div>

            <Panel title='Thông tin tư vấn'>
              <div className='grid gap-4 text-sm md:grid-cols-2'>
                <div className='rounded-2xl bg-slate-50 p-4'>
                  <p className='text-xs text-slate-500'>Thời gian</p>
                  <p className='mt-1 font-semibold'>{String(detail.booking.ngay_hen).slice(0, 10)} · {detail.booking.gio_bat_dau}</p>
                </div>
                <div className='rounded-2xl bg-slate-50 p-4'>
                  <p className='text-xs text-slate-500'>Email khách</p>
                  <p className='mt-1 font-semibold'>{detail.booking.customer_email ?? '—'}</p>
                </div>
              </div>
              <div className='mt-4 rounded-2xl border border-slate-200 p-4 text-sm leading-6 text-slate-700'>
                {detail.booking.muc_dich ?? 'Khách chưa nhập mục đích tư vấn.'}
              </div>
            </Panel>

            {/* Action buttons — chỉ hiển thị nếu status phù hợp */}
            {(canConfirm(currentStatus) || canCheckin(currentStatus) || canComplete(currentStatus)) && (
              <div className='flex flex-wrap justify-end gap-2'>
                {canConfirm(currentStatus) && (
                  <ActionButton onClick={() => action(detail.booking.id, 'confirm')} disabled={acting}>
                    Xác nhận
                  </ActionButton>
                )}
                {canCheckin(currentStatus) && (
                  <ActionButton tone='secondary' onClick={() => action(detail.booking.id, 'check-in')} disabled={acting}>
                    Check-in
                  </ActionButton>
                )}
                {canComplete(currentStatus) && (
                  <ActionButton tone='accent' onClick={() => action(detail.booking.id, 'complete')} disabled={acting}>
                    Hoàn thành
                  </ActionButton>
                )}
              </div>
            )}

            {/* Từ chối — chỉ hiện khi còn có thể từ chối */}
            {canReject(currentStatus) && (
              <Panel title='Từ chối booking' description='Chỉ dùng khi không thể nhận lịch. Lý do sẽ được lưu vào lịch sử.'>
                <Field label='Lý do từ chối' error={errors.reason}>
                  <textarea
                    className={inputClass}
                    rows={3}
                    value={reason}
                    onChange={(e) => { setReason(e.target.value); setErrors({}) }}
                    placeholder='Nhập lý do từ chối...'
                  />
                </Field>
                <div className='mt-3 flex justify-end'>
                  <ActionButton tone='danger' onClick={reject} disabled={acting}>Từ chối booking</ActionButton>
                </div>
              </Panel>
            )}

            <Panel title='Timeline'>
              <DataTable minWidth='760px'>
                <thead>
                  <tr>
                    <Th>Sự kiện</Th>
                    <Th>Chuyển trạng thái</Th>
                    <Th>Thời gian</Th>
                  </tr>
                </thead>
                <tbody>
                  {detail.timeline?.map((row: Row) => (
                    <tr key={row.id}>
                      <Td>{row.su_kien}</Td>
                      <Td>
                        <span className='text-slate-400'>{STATUS_LABELS[row.trang_thai_truoc] ?? row.trang_thai_truoc}</span>
                        {' → '}
                        <span className='font-medium'>{STATUS_LABELS[row.trang_thai_sau] ?? row.trang_thai_sau}</span>
                      </Td>
                      <Td>{String(row.tao_luc).slice(0, 16)}</Td>
                    </tr>
                  ))}
                </tbody>
              </DataTable>
            </Panel>
          </div>
        ) : null}
      </Modal>
    </>
  )
}
