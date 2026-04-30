'use client'

import { useEffect, useMemo, useState } from 'react'
import { ActionButton, EmptyState, Field, Notice, PageHeader, Panel, StatCard, StatusPill, Toolbar, inputClass } from '@/components/admin/admin-ui'
import { DataTable, Modal, Td, Th } from '@/components/admin/admin-table'
import { expertGet, expertPatch, expertPost } from '@/lib/expert-api'

type Row = Record<string, any>

const statuses = ['cho_xac_nhan', 'da_xac_nhan', 'da_checkin', 'dang_tu_van', 'hoan_thanh', 'da_huy']

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
    pending: rows.filter((row) => row.trang_thai === 'cho_xac_nhan').length,
    active: rows.filter((row) => ['da_xac_nhan', 'da_checkin', 'dang_tu_van'].includes(row.trang_thai)).length,
    completed: rows.filter((row) => row.trang_thai === 'hoan_thanh').length,
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

  return (
    <>
      <PageHeader
        eyebrow='Bookings'
        title='Quản lý booking tư vấn'
        description='Theo dõi lịch tư vấn bằng bảng, lọc theo trạng thái và xử lý từng booking trong modal để thao tác không làm lệch màn hình.'
      />
      {message ? <Notice>{message}</Notice> : null}

      <div className='mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4'>
        <StatCard label='Booking trong bộ lọc' value={String(stats.total)} />
        <StatCard label='Chờ xác nhận' value={String(stats.pending)} tone='orange' />
        <StatCard label='Đang xử lý' value={String(stats.active)} tone='blue' />
        <StatCard label='Hoàn thành' value={String(stats.completed)} tone='green' />
      </div>

      <Panel title='Danh sách booking' description='Tìm theo khách hàng, mã lịch hoặc gói dịch vụ. Mọi thao tác nghiệp vụ nằm trong phần chi tiết.'>
        <Toolbar>
          <input className={inputClass} placeholder='Tìm khách hàng, mã lịch, gói' value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') load() }} />
          <select className={inputClass} value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value=''>Tất cả trạng thái</option>
            {statuses.map((item) => <option key={item} value={item}>{item}</option>)}
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
              <tr key={row.id} className='transition-colors duration-200 hover:bg-emerald-50/60'>
                <Td><b>{row.ma_lich_hen}</b></Td>
                <Td>{row.customer_name}<p className='text-xs text-slate-500'>{row.customer_email}</p></Td>
                <Td>{row.ten_goi}</Td>
                <Td>{String(row.ngay_hen).slice(0, 10)} {row.gio_bat_dau}</Td>
                <Td><p className='line-clamp-2 max-w-xs'>{row.muc_dich ?? '-'}</p></Td>
                <Td><StatusPill value={row.trang_thai} /></Td>
                <Td className='text-right'><ActionButton tone='secondary' onClick={() => open(row.id)}>Chi tiết</ActionButton></Td>
              </tr>
            ))}
          </tbody>
        </DataTable>
        {!rows.length ? <div className='mt-4'><EmptyState text='Chưa có booking theo bộ lọc.' /></div> : null}
      </Panel>

      <Modal open={Boolean(detail)} onClose={() => setDetail(null)} title={detail ? `Booking ${detail.booking.ma_lich_hen}` : 'Chi tiết booking'} description='Thao tác theo đúng trạng thái nghiệp vụ: xác nhận, check-in, hoàn thành hoặc từ chối có lý do.' width='max-w-5xl'>
        {detail ? (
          <div className='space-y-5'>
            <div className='grid gap-3 md:grid-cols-3'>
              <StatCard label='Khách hàng' value={detail.booking.customer_name} tone='slate' />
              <StatCard label='Gói dịch vụ' value={detail.booking.ten_goi} />
              <StatCard label='Trạng thái' value={detail.booking.trang_thai} tone='orange' />
            </div>
            <Panel title='Thông tin tư vấn'>
              <div className='grid gap-4 text-sm md:grid-cols-2'>
                <div className='rounded-2xl bg-slate-50 p-4'><p className='text-slate-500'>Thời gian</p><b>{String(detail.booking.ngay_hen).slice(0, 10)} {detail.booking.gio_bat_dau}</b></div>
                <div className='rounded-2xl bg-slate-50 p-4'><p className='text-slate-500'>Email khách</p><b>{detail.booking.customer_email ?? '-'}</b></div>
              </div>
              <p className='mt-4 rounded-2xl border border-slate-200 p-4 text-sm leading-6 text-slate-700'>{detail.booking.muc_dich ?? 'Khách chưa nhập mục đích tư vấn.'}</p>
            </Panel>
            <div className='flex flex-wrap justify-end gap-2'>
              <ActionButton onClick={() => action(detail.booking.id, 'confirm')} disabled={acting}>Xác nhận</ActionButton>
              <ActionButton tone='secondary' onClick={() => action(detail.booking.id, 'check-in')} disabled={acting}>Check-in</ActionButton>
              <ActionButton tone='accent' onClick={() => action(detail.booking.id, 'complete')} disabled={acting}>Hoàn thành</ActionButton>
            </div>
            <Panel title='Từ chối booking' description='Chỉ dùng khi không thể nhận lịch. Lý do sẽ được lưu vào lịch sử booking.'>
              <Field label='Lý do từ chối' error={errors.reason}>
                <textarea className={inputClass} rows={3} value={reason} onChange={(e) => { setReason(e.target.value); setErrors({}) }} />
              </Field>
              <div className='mt-3 flex justify-end'><ActionButton tone='danger' onClick={reject} disabled={acting}>Từ chối booking</ActionButton></div>
            </Panel>
            <Panel title='Timeline'>
              <DataTable minWidth='760px'>
                <thead><tr><Th>Sự kiện</Th><Th>Trạng thái</Th><Th>Thời gian</Th></tr></thead>
                <tbody>{detail.timeline?.map((row: Row) => <tr key={row.id}><Td>{row.su_kien}</Td><Td>{row.trang_thai_truoc} → {row.trang_thai_sau}</Td><Td>{String(row.tao_luc).slice(0, 16)}</Td></tr>)}</tbody>
              </DataTable>
            </Panel>
          </div>
        ) : null}
      </Modal>
    </>
  )
}
