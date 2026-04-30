'use client'

import { useEffect, useMemo, useState } from 'react'
import { ActionButton, EmptyState, Field, Notice, PageHeader, Panel, StatCard, StatusPill, Toolbar, inputClass, money } from '@/components/admin/admin-ui'
import { DataTable, Modal, Td, Th } from '@/components/admin/admin-table'
import { adminGet, adminPatch } from '@/lib/admin-api'

type ExpertRow = Record<string, any>
type ExpertDetail = { expert: ExpertRow; packages: ExpertRow[]; bookings: ExpertRow[]; reviews: ExpertRow[] }

type ModalMode = 'detail' | 'profile' | 'status' | 'commission' | null

export default function AdminExpertsPage() {
  const [rows, setRows] = useState<ExpertRow[]>([])
  const [detail, setDetail] = useState<ExpertDetail | null>(null)
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('')
  const [booking, setBooking] = useState('')
  const [mode, setMode] = useState<ModalMode>(null)
  const [profile, setProfile] = useState<Record<string, string>>({})
  const [nextStatus, setNextStatus] = useState('hoat_dong')
  const [reason, setReason] = useState('')
  const [commission, setCommission] = useState('30')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (query) params.set('search', query)
      if (status) params.set('status', status)
      if (booking) params.set('booking', booking)
      setRows(await adminGet<ExpertRow[]>(`/experts${params.toString() ? `?${params}` : ''}`))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load().catch((err) => setMessage(err.message)) }, [status, booking])

  const stats = useMemo(() => ({
    total: rows.length,
    active: rows.filter((row) => row.trang_thai === 'hoat_dong').length,
    pending: rows.filter((row) => row.trang_thai === 'cho_duyet').length,
  }), [rows])

  async function open(id: number, nextMode: ModalMode = 'detail') {
    const result = await adminGet<ExpertDetail>(`/experts/${id}`)
    setDetail(result)
    setMode(nextMode)
    setErrors({})
    setReason('')
    setNextStatus(result.expert.trang_thai)
    setCommission(String(result.expert.commission_rate ?? 30))
    setProfile({
      chuyen_mon: result.expert.chuyen_mon ?? '',
      mo_ta: result.expert.mo_ta ?? '',
      kinh_nghiem: result.expert.kinh_nghiem ?? '',
      hoc_vi: result.expert.hoc_vi ?? '',
      chung_chi: result.expert.chung_chi ?? '',
    })
  }

  async function refreshDetail() {
    if (!detail) return
    await open(detail.expert.id, mode)
  }

  async function updateBooking(row: ExpertRow, enabled: boolean) {
    await adminPatch(`/experts/${row.id}/booking`, { nhan_booking: enabled })
    setMessage(enabled ? 'Đã bật nhận booking cho chuyên gia.' : 'Đã tạm tắt nhận booking cho chuyên gia.')
    await load()
    if (detail?.expert.id === row.id) await refreshDetail()
  }

  async function submitProfile() {
    if (!detail) return
    const nextErrors: Record<string, string> = {}
    if (!profile.chuyen_mon?.trim()) nextErrors.chuyen_mon = 'Vui lòng nhập chuyên môn chính.'
    if (!profile.mo_ta?.trim()) nextErrors.mo_ta = 'Mô tả giúp admin đánh giá hồ sơ chuyên gia.'
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors)
      return
    }
    await adminPatch(`/experts/${detail.expert.id}/profile`, profile)
    setMessage('Đã cập nhật hồ sơ chuyên môn.')
    await load()
    await open(detail.expert.id, 'detail')
  }

  async function submitStatus() {
    if (!detail) return
    if (['tu_choi', 'bi_khoa'].includes(nextStatus) && !reason.trim()) {
      setErrors({ reason: 'Vui lòng nhập lý do khi từ chối hoặc khóa chuyên gia.' })
      return
    }
    await adminPatch(`/experts/${detail.expert.id}/status`, { trang_thai: nextStatus, ly_do: reason })
    setMessage('Đã cập nhật trạng thái chuyên gia.')
    await load()
    await open(detail.expert.id, 'detail')
  }

  async function submitCommission() {
    if (!detail) return
    const rate = Number(commission)
    if (!Number.isFinite(rate) || rate < 0 || rate > 100) {
      setErrors({ commission: 'Tỷ lệ hoa hồng phải nằm trong khoảng 0-100%.' })
      return
    }
    await adminPatch(`/experts/${detail.expert.id}/commission`, { ty_le_hoa_hong: rate })
    setMessage('Đã cập nhật hoa hồng mặc định cho chuyên gia.')
    await load()
    await open(detail.expert.id, 'detail')
  }

  return (
    <>
      <PageHeader eyebrow='Expert operations' title='Quản lý chuyên gia' description='Quản lý hồ sơ chuyên môn, trạng thái duyệt, nhận booking, rating và hoa hồng mặc định của chuyên gia.' />
      {message ? <Notice>{message}</Notice> : null}
      <div className='mb-5 grid gap-4 md:grid-cols-3'><StatCard label='Chuyên gia trong bộ lọc' value={String(stats.total)} /><StatCard label='Đang hoạt động' value={String(stats.active)} tone='green' /><StatCard label='Chờ duyệt' value={String(stats.pending)} tone='orange' /></div>
      <Panel title='Danh sách chuyên gia' description='Filter theo tên/email/chuyên môn, trạng thái duyệt và trạng thái nhận booking.'>
        <Toolbar>
          <input className={inputClass} placeholder='Tìm tên, email, chuyên môn, học vị' value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') load() }} />
          <select className={inputClass} value={status} onChange={(e) => setStatus(e.target.value)}><option value=''>Tất cả trạng thái</option><option value='cho_duyet'>Chờ duyệt</option><option value='hoat_dong'>Hoạt động</option><option value='tam_dung'>Tạm dừng</option><option value='tu_choi'>Từ chối</option><option value='bi_khoa'>Bị khóa</option></select>
          <select className={inputClass} value={booking} onChange={(e) => setBooking(e.target.value)}><option value=''>Tất cả booking</option><option value='yes'>Đang nhận booking</option><option value='no'>Tắt nhận booking</option></select>
          <ActionButton tone='secondary' onClick={load}>Lọc</ActionButton>
        </Toolbar>
        <DataTable minWidth='1180px'><thead><tr><Th>Chuyên gia</Th><Th>Chuyên môn</Th><Th>Trạng thái</Th><Th>Nhận booking</Th><Th>Rating</Th><Th>Gói đang gán</Th><Th>Hoa hồng</Th><Th className='text-right'>Hành động</Th></tr></thead><tbody>{rows.map((row) => <tr key={row.id} className='hover:bg-blue-50/40'><Td><b>{row.ho_ten}</b><p className='text-xs text-slate-500'>{row.email}</p><p className='text-xs text-slate-400'>{row.so_dien_thoai ?? '-'}</p></Td><Td><p className='max-w-xs truncate'>{row.chuyen_mon ?? '-'}</p><p className='text-xs text-slate-500'>{row.hoc_vi ?? '-'}</p></Td><Td><StatusPill value={row.trang_thai} /></Td><Td>{Number(row.nhan_booking) ? 'Có' : 'Không'}</Td><Td><b>{Number(row.diem_danh_gia_trung_binh ?? 0).toFixed(1)}</b><p className='text-xs text-slate-500'>{row.so_luot_danh_gia} đánh giá</p></Td><Td>{row.package_count}</Td><Td>{row.commission_rate == null ? 'Theo hệ thống' : `${row.commission_rate}%`}</Td><Td className='text-right'><div className='flex justify-end gap-2'><ActionButton tone='secondary' onClick={() => open(row.id, 'detail')}>Hồ sơ</ActionButton><ActionButton tone='secondary' onClick={() => open(row.id, 'status')}>Trạng thái</ActionButton>{Number(row.nhan_booking) ? <ActionButton tone='danger' onClick={() => updateBooking(row, false)}>Tắt booking</ActionButton> : <ActionButton onClick={() => updateBooking(row, true)}>Bật booking</ActionButton>}</div></Td></tr>)}</tbody></DataTable>
        {!rows.length && !loading ? <div className='mt-4'><EmptyState text='Không có chuyên gia theo bộ lọc.' /></div> : null}
      </Panel>

      <Modal open={mode === 'detail'} onClose={() => setMode(null)} title={detail ? `Hồ sơ: ${detail.expert.ho_ten}` : 'Hồ sơ chuyên gia'} description='Xem chuyên môn, gói đang được gán, booking và review gần nhất.' width='max-w-6xl'>
        {detail ? <div className='space-y-5'><div className='grid gap-3 md:grid-cols-4'><StatCard label='Trạng thái' value={detail.expert.trang_thai} tone={detail.expert.trang_thai === 'hoat_dong' ? 'green' : 'orange'} /><StatCard label='Rating' value={`${Number(detail.expert.diem_danh_gia_trung_binh ?? 0).toFixed(1)}/5`} /><StatCard label='Booking hoàn thành' value={String(detail.expert.so_booking_hoan_thanh ?? 0)} tone='green' /><StatCard label='Hoa hồng' value={detail.expert.commission_rate == null ? 'Hệ thống' : `${detail.expert.commission_rate}%`} tone='orange' /></div><Panel title='Thông tin chuyên môn' action={<div className='flex gap-2'><ActionButton tone='secondary' onClick={() => setMode('profile')}>Sửa hồ sơ</ActionButton><ActionButton tone='secondary' onClick={() => setMode('commission')}>Hoa hồng</ActionButton></div>}><DataTable minWidth='760px'><tbody><tr><Td>Chuyên môn</Td><Td>{detail.expert.chuyen_mon ?? '-'}</Td></tr><tr><Td>Học vị</Td><Td>{detail.expert.hoc_vi ?? '-'}</Td></tr><tr><Td>Kinh nghiệm</Td><Td>{detail.expert.kinh_nghiem ?? '-'}</Td></tr><tr><Td>Mô tả</Td><Td>{detail.expert.mo_ta ?? '-'}</Td></tr><tr><Td>Chứng chỉ</Td><Td>{detail.expert.chung_chi ?? '-'}</Td></tr></tbody></DataTable></Panel><Panel title='Gói đang gán'><DataTable minWidth='820px'><thead><tr><Th>Gói</Th><Th>Loại</Th><Th>Trạng thái</Th><Th>Hoa hồng override</Th></tr></thead><tbody>{detail.packages.map((pkg) => <tr key={pkg.id}><Td>{pkg.ten_goi}</Td><Td>{pkg.loai_goi}</Td><Td><StatusPill value={pkg.trang_thai} /></Td><Td>{pkg.ty_le_hoa_hong_override == null ? '-' : `${pkg.ty_le_hoa_hong_override}%`}</Td></tr>)}</tbody></DataTable>{!detail.packages.length ? <div className='mt-4'><EmptyState text='Chưa được gán vào gói nào.' /></div> : null}</Panel><Panel title='Booking gần nhất'><DataTable minWidth='900px'><thead><tr><Th>Mã lịch</Th><Th>Khách hàng</Th><Th>Gói</Th><Th>Ngày</Th><Th>Trạng thái</Th></tr></thead><tbody>{detail.bookings.map((booking) => <tr key={booking.id}><Td>{booking.ma_lich_hen}</Td><Td>{booking.customer_name}</Td><Td>{booking.ten_goi}</Td><Td>{String(booking.ngay_hen).slice(0,10)}</Td><Td><StatusPill value={booking.trang_thai} /></Td></tr>)}</tbody></DataTable>{!detail.bookings.length ? <div className='mt-4'><EmptyState text='Chưa có booking.' /></div> : null}</Panel></div> : null}
      </Modal>

      <Modal open={mode === 'profile'} onClose={() => setMode('detail')} title='Sửa hồ sơ chuyên môn' description='Thông tin này giúp admin duyệt và khách hàng chọn đúng chuyên gia.'>
        <div className='space-y-4'><Field label='Chuyên môn' error={errors.chuyen_mon}><input className={inputClass} value={profile.chuyen_mon ?? ''} onChange={(e) => setProfile({ ...profile, chuyen_mon: e.target.value })} /></Field><Field label='Học vị'><input className={inputClass} value={profile.hoc_vi ?? ''} onChange={(e) => setProfile({ ...profile, hoc_vi: e.target.value })} /></Field><Field label='Kinh nghiệm'><textarea className={inputClass} rows={3} value={profile.kinh_nghiem ?? ''} onChange={(e) => setProfile({ ...profile, kinh_nghiem: e.target.value })} /></Field><Field label='Mô tả' error={errors.mo_ta}><textarea className={inputClass} rows={4} value={profile.mo_ta ?? ''} onChange={(e) => setProfile({ ...profile, mo_ta: e.target.value })} /></Field><Field label='Chứng chỉ'><textarea className={inputClass} rows={3} value={profile.chung_chi ?? ''} onChange={(e) => setProfile({ ...profile, chung_chi: e.target.value })} /></Field><div className='flex justify-end gap-2'><ActionButton tone='secondary' onClick={() => setMode('detail')}>Hủy</ActionButton><ActionButton onClick={submitProfile}>Lưu hồ sơ</ActionButton></div></div>
      </Modal>

      <Modal open={mode === 'status'} onClose={() => setMode(null)} title='Cập nhật trạng thái chuyên gia' description='Duyệt/kích hoạt/tạm dừng/khóa chuyên gia. Từ chối hoặc khóa cần lý do.'>
        <div className='space-y-4'><Field label='Trạng thái mới'><select className={inputClass} value={nextStatus} onChange={(e) => setNextStatus(e.target.value)}><option value='cho_duyet'>Chờ duyệt</option><option value='hoat_dong'>Kích hoạt</option><option value='tam_dung'>Tạm dừng</option><option value='tu_choi'>Từ chối</option><option value='bi_khoa'>Khóa</option></select></Field><Field label='Lý do' error={errors.reason} hint='Bắt buộc khi từ chối hoặc khóa chuyên gia.'><textarea className={inputClass} rows={4} value={reason} onChange={(e) => { setReason(e.target.value); setErrors({}) }} /></Field><div className='flex justify-end gap-2'><ActionButton tone='secondary' onClick={() => setMode(null)}>Hủy</ActionButton><ActionButton onClick={submitStatus}>Lưu trạng thái</ActionButton></div></div>
      </Modal>

      <Modal open={mode === 'commission'} onClose={() => setMode('detail')} title='Cập nhật hoa hồng mặc định' description='Tỷ lệ này áp dụng cho chuyên gia nếu gói không có override riêng.'>
        <div className='space-y-4'><Field label='Tỷ lệ hoa hồng (%)' error={errors.commission}><input type='number' min={0} max={100} className={inputClass} value={commission} onChange={(e) => { setCommission(e.target.value); setErrors({}) }} /></Field><div className='flex justify-end gap-2'><ActionButton tone='secondary' onClick={() => setMode('detail')}>Hủy</ActionButton><ActionButton onClick={submitCommission}>Lưu hoa hồng</ActionButton></div></div>
      </Modal>
    </>
  )
}
