'use client'

import { useEffect, useMemo, useState } from 'react'
import { CalendarCheck, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { ActionButton, EmptyState, Field, Notice, PageHeader, Panel, StatCard, StatusPill, Toolbar, inputClass, money } from '@/components/admin/admin-ui'
import { DataTable, Modal, Td, Th } from '@/components/admin/admin-table'
import { adminGet, adminPatch } from '@/lib/admin-api'

type Row = Record<string, any>

const STATUS_LABELS: Record<string, string> = {
  cho_xac_nhan: 'Chờ xác nhận',
  cho_thanh_toan: 'Chờ thanh toán',
  da_xac_nhan: 'Đã xác nhận',
  da_checkin: 'Đã check-in',
  dang_tu_van: 'Đang tư vấn',
  hoan_thanh: 'Hoàn thành',
  da_huy: 'Đã hủy',
  vo_hieu_hoa: 'Vô hiệu hóa',
}

const STATUS_OPTIONS = Object.keys(STATUS_LABELS)

function fmtDateTime(value?: string | null) {
  if (!value) return '—'
  return new Date(value).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })
}

export default function AdminBookingsPage() {
  const [rows, setRows] = useState<Row[]>([])
  const [stats, setStats] = useState<Row | null>(null)
  const [detail, setDetail] = useState<Row | null>(null)
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [acting, setActing] = useState(false)
  const [cancelOpen, setCancelOpen] = useState(false)
  const [cancelReason, setCancelReason] = useState('')

  async function load() {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams()
      if (query) params.set('search', query)
      if (status) params.set('status', status)
      if (from) params.set('from', from)
      if (to) params.set('to', to)
      const [list, statsData] = await Promise.all([
        adminGet<Row[]>(`/bookings${params.toString() ? `?${params}` : ''}`),
        adminGet<Row>('/bookings/stats').catch(() => null),
      ])
      setRows(list)
      if (statsData) setStats(statsData)
    } catch (err: any) {
      setError(err.message ?? 'Không tải được dữ liệu')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [status, from, to])

  async function openDetail(id: number) {
    setError('')
    try {
      setDetail(await adminGet<Row>(`/bookings/${id}`))
    } catch (err: any) {
      setError(err.message ?? 'Không tải được chi tiết')
    }
  }

  function openCancel() {
    setCancelOpen(true)
    setCancelReason('')
  }

  async function submitCancel() {
    if (!detail) return
    if (!cancelReason.trim()) {
      setError('Vui lòng nhập lý do hủy.')
      return
    }
    setActing(true)
    try {
      await adminPatch(`/bookings/${detail.booking.id}/cancel`, { ly_do: cancelReason })
      setMessage(`Đã hủy booking ${detail.booking.ma_lich_hen}.`)
      setCancelOpen(false)
      setDetail(null)
      await load()
    } catch (err: any) {
      setError(err.message ?? 'Hủy thất bại')
    } finally {
      setActing(false)
    }
  }

  const localStats = useMemo(() => {
    if (stats) return stats
    return {
      total: rows.length,
      pending: rows.filter((r) => r.trang_thai === 'cho_xac_nhan').length,
      active: rows.filter((r) => ['da_xac_nhan', 'da_checkin', 'dang_tu_van'].includes(r.trang_thai)).length,
      completed: rows.filter((r) => r.trang_thai === 'hoan_thanh').length,
      cancelled: rows.filter((r) => r.trang_thai === 'da_huy').length,
    }
  }, [stats, rows])

  const currentStatus = detail?.booking?.trang_thai ?? ''
  const canCancel = !['hoan_thanh', 'da_huy', 'vo_hieu_hoa'].includes(currentStatus)

  return (
    <>
      <PageHeader
        eyebrow='Booking control'
        title='Quản lý lịch hẹn toàn hệ thống'
        description='Theo dõi tất cả booking giữa khách hàng và chuyên gia. Có thể can thiệp hủy lịch khi cần thiết.'
      />
      {message ? <Notice tone='success'>{message}</Notice> : null}
      {error ? <Notice tone='error'>{error}</Notice> : null}

      {/* Stats */}
      <div className='mb-5 grid gap-3 sm:grid-cols-3 xl:grid-cols-5'>
        <StatCard label='Tổng booking' value={String(localStats.total ?? 0)} icon={CalendarCheck} />
        <StatCard label='Chờ xác nhận' value={String(localStats.pending ?? 0)} tone='orange' icon={Clock} />
        <StatCard label='Đang xử lý' value={String(localStats.active ?? 0)} tone='blue' />
        <StatCard label='Hoàn thành' value={String(localStats.completed ?? 0)} tone='green' icon={CheckCircle} />
        <StatCard label='Đã hủy' value={String(localStats.cancelled ?? 0)} tone='red' icon={XCircle} />
      </div>

      <Panel
        title='Danh sách booking'
        description='Lọc theo trạng thái, ngày, hoặc tìm theo mã lịch / tên khách / chuyên gia / gói. Nhấn dòng để xem chi tiết.'
      >
        <Toolbar>
          <input
            className={inputClass}
            placeholder='Tìm mã lịch, khách hàng, chuyên gia, gói...'
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') load() }}
          />
          <select className={inputClass} value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value=''>Tất cả trạng thái</option>
            {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
          </select>
          <input type='date' className={inputClass} value={from} onChange={(e) => setFrom(e.target.value)} aria-label='Từ ngày' />
          <input type='date' className={inputClass} value={to} onChange={(e) => setTo(e.target.value)} aria-label='Đến ngày' />
          <ActionButton tone='secondary' onClick={load}>Lọc</ActionButton>
        </Toolbar>

        <DataTable minWidth='1100px'>
          <thead>
            <tr>
              <Th>Mã lịch</Th>
              <Th>Khách hàng</Th>
              <Th>Chuyên gia</Th>
              <Th>Gói</Th>
              <Th>Ngày giờ</Th>
              <Th>Trạng thái</Th>
              <Th className='text-right'>Hành động</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.id}
                className='cursor-pointer transition-colors duration-150 hover:bg-blue-50/60'
                onClick={() => openDetail(row.id)}
              >
                <Td><b className='font-mono text-xs'>{row.ma_lich_hen}</b></Td>
                <Td>
                  <p className='font-medium'>{row.customer_name}</p>
                  <p className='text-xs text-slate-500'>{row.customer_email}</p>
                </Td>
                <Td>
                  <p className='font-medium'>{row.expert_name}</p>
                  <p className='text-xs text-slate-500'>{row.chuyen_mon}</p>
                </Td>
                <Td>{row.ten_goi}</Td>
                <Td>
                  <p>{String(row.ngay_hen).slice(0, 10)}</p>
                  <p className='text-xs text-slate-500'>{row.gio_bat_dau}</p>
                </Td>
                <Td><StatusPill value={row.trang_thai} /></Td>
                <Td className='text-right' onClick={(e) => e.stopPropagation()}>
                  <ActionButton tone='secondary' onClick={() => openDetail(row.id)}>Chi tiết</ActionButton>
                </Td>
              </tr>
            ))}
          </tbody>
        </DataTable>
        {!rows.length && !loading ? <div className='mt-4'><EmptyState text='Không có booking phù hợp với bộ lọc.' /></div> : null}
      </Panel>

      {/* Detail modal */}
      <Modal
        open={Boolean(detail)}
        onClose={() => setDetail(null)}
        title={detail ? `Booking ${detail.booking.ma_lich_hen}` : 'Chi tiết booking'}
        description='Thông tin chi tiết booking và timeline thay đổi trạng thái.'
        width='max-w-5xl'
      >
        {detail ? (
          <div className='space-y-5'>
            <div className='grid gap-3 md:grid-cols-3'>
              <StatCard label='Khách hàng' value={detail.booking.customer_name} tone='slate' />
              <StatCard label='Chuyên gia' value={detail.booking.expert_name} tone='slate' />
              <div className='flex flex-col justify-between rounded-2xl border border-slate-100 bg-slate-50 p-4'>
                <p className='text-xs font-semibold uppercase tracking-wide text-slate-500'>Trạng thái</p>
                <div className='mt-2'><StatusPill value={currentStatus} /></div>
              </div>
            </div>

            <Panel title='Thông tin tư vấn'>
              <div className='grid gap-4 text-sm md:grid-cols-2'>
                <div className='rounded-2xl bg-slate-50 p-4'>
                  <p className='text-xs text-slate-500'>Thời gian hẹn</p>
                  <p className='mt-1 font-semibold'>{String(detail.booking.ngay_hen).slice(0, 10)} · {detail.booking.gio_bat_dau} – {detail.booking.gio_ket_thuc}</p>
                </div>
                <div className='rounded-2xl bg-slate-50 p-4'>
                  <p className='text-xs text-slate-500'>Gói dịch vụ</p>
                  <p className='mt-1 font-semibold'>{detail.booking.ten_goi}</p>
                  <p className='text-xs text-slate-500 mt-1'>{detail.booking.ma_goi_da_mua ?? '—'} · còn {detail.booking.so_luot_con_lai ?? 0}/{detail.booking.so_luot_tong ?? 0} lượt</p>
                </div>
                <div className='rounded-2xl bg-slate-50 p-4'>
                  <p className='text-xs text-slate-500'>Liên hệ khách</p>
                  <p className='mt-1 font-semibold'>{detail.booking.customer_email}</p>
                  <p className='text-xs text-slate-500'>{detail.booking.customer_phone ?? 'Chưa có SĐT'}</p>
                </div>
                <div className='rounded-2xl bg-slate-50 p-4'>
                  <p className='text-xs text-slate-500'>Thanh toán</p>
                  {detail.booking.payment_id ? (
                    <>
                      <p className='mt-1 font-semibold'>{money(detail.booking.payment_amount)}</p>
                      <p className='text-xs text-slate-500'>{detail.booking.ma_giao_dich} · <StatusPill value={detail.booking.payment_status} /></p>
                    </>
                  ) : <p className='mt-1 text-sm text-slate-500'>Không có giao dịch riêng</p>}
                </div>
              </div>
              <div className='mt-4 rounded-2xl border border-slate-200 p-4 text-sm leading-6 text-slate-700'>
                <p className='text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2'>Mục đích tư vấn</p>
                {detail.booking.muc_dich || 'Khách chưa nhập mục đích.'}
              </div>
              {detail.booking.ly_do_huy ? (
                <div className='mt-3 flex items-start gap-2 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-700'>
                  <AlertCircle size={15} className='mt-0.5 shrink-0' />
                  <div>
                    <p className='font-semibold'>Lý do hủy</p>
                    <p>{detail.booking.ly_do_huy}</p>
                  </div>
                </div>
              ) : null}
            </Panel>

            {/* Action: chỉ cho phép admin hủy nếu booking chưa kết thúc */}
            {canCancel && (
              <div className='flex justify-end'>
                <ActionButton tone='danger' onClick={openCancel}>Hủy booking (Admin)</ActionButton>
              </div>
            )}

            <Panel title='Timeline thay đổi'>
              <DataTable minWidth='800px'>
                <thead>
                  <tr>
                    <Th>Thời gian</Th>
                    <Th>Sự kiện</Th>
                    <Th>Người thực hiện</Th>
                    <Th>Chuyển trạng thái</Th>
                    <Th>Ghi chú</Th>
                  </tr>
                </thead>
                <tbody>
                  {(detail.timeline as Row[])?.map((t) => (
                    <tr key={t.id}>
                      <Td className='text-xs text-slate-500'>{fmtDateTime(t.tao_luc)}</Td>
                      <Td><span className='font-mono text-xs'>{t.su_kien}</span></Td>
                      <Td>
                        <p className='text-sm'>{t.actor_name ?? 'Hệ thống'}</p>
                        {t.actor_role ? <p className='text-xs text-slate-500'>{t.actor_role}</p> : null}
                      </Td>
                      <Td className='text-xs'>
                        <span className='text-slate-400'>{STATUS_LABELS[t.trang_thai_truoc] ?? t.trang_thai_truoc}</span>
                        {' → '}
                        <span className='font-medium'>{STATUS_LABELS[t.trang_thai_sau] ?? t.trang_thai_sau}</span>
                      </Td>
                      <Td className='text-xs text-slate-500 max-w-xs'><p className='line-clamp-2'>{t.ghi_chu ?? '—'}</p></Td>
                    </tr>
                  ))}
                </tbody>
              </DataTable>
              {!(detail.timeline as Row[])?.length ? <div className='mt-3'><EmptyState text='Chưa có timeline.' /></div> : null}
            </Panel>
          </div>
        ) : null}
      </Modal>

      {/* Cancel modal */}
      <Modal
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        title='Xác nhận hủy booking'
        description='Booking sẽ bị hủy ngay lập tức. Lượt sử dụng (nếu có) sẽ được hoàn về gói. Cả khách hàng và chuyên gia đều nhận thông báo.'
      >
        <Field label='Lý do hủy' hint='Lý do sẽ được lưu vào audit log và gửi cho khách hàng + chuyên gia.'>
          <textarea
            className={inputClass}
            rows={4}
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            placeholder='Vd: Phát hiện chuyên gia không khả dụng, sự cố hệ thống...'
          />
        </Field>
        <div className='mt-5 flex justify-end gap-2'>
          <ActionButton tone='secondary' onClick={() => setCancelOpen(false)}>Đóng</ActionButton>
          <ActionButton tone='danger' onClick={submitCancel} disabled={acting}>
            {acting ? 'Đang hủy...' : 'Xác nhận hủy'}
          </ActionButton>
        </div>
      </Modal>
    </>
  )
}
