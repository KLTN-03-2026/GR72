'use client'

import { useEffect, useMemo, useState } from 'react'
import { ActionButton, EmptyState, Field, Notice, PageHeader, Panel, StatCard, StatusPill, Toolbar, inputClass, money } from '@/components/admin/admin-ui'
import { DataTable, Modal, Td, Th } from '@/components/admin/admin-table'
import { adminGet, adminPatch } from '@/lib/admin-api'

type UserRow = Record<string, any>
type UserDetail = { account: UserRow; customerProfile: UserRow | null; healthProfile: UserRow | null; packages: UserRow[]; bookings: UserRow[]; payments: UserRow[] }

export default function AdminUsersPage() {
  const [rows, setRows] = useState<UserRow[]>([])
  const [detail, setDetail] = useState<UserDetail | null>(null)
  const [query, setQuery] = useState('')
  const [role, setRole] = useState('')
  const [status, setStatus] = useState('')
  const [roleTarget, setRoleTarget] = useState<UserRow | null>(null)
  const [nextRole, setNextRole] = useState('customer')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (query) params.set('search', query)
      if (role) params.set('role', role)
      if (status) params.set('status', status)
      setRows(await adminGet<UserRow[]>(`/users${params.toString() ? `?${params}` : ''}`))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load().catch((err) => setMessage(err.message)) }, [role, status])

  const stats = useMemo(() => ({
    total: rows.length,
    active: rows.filter((row) => row.trang_thai === 'hoat_dong').length,
    locked: rows.filter((row) => row.trang_thai === 'bi_khoa').length,
  }), [rows])

  async function open(id: number) {
    setDetail(await adminGet<UserDetail>(`/users/${id}`))
  }

  async function updateStatus(row: UserRow, nextStatus: string) {
    await adminPatch(`/users/${row.id}/status`, { trang_thai: nextStatus })
    setMessage(nextStatus === 'bi_khoa' ? 'Đã khóa tài khoản.' : 'Đã cập nhật trạng thái tài khoản.')
    await load()
    if (detail?.account.id === row.id) await open(row.id)
  }

  function openRole(row: UserRow) {
    setRoleTarget(row)
    setNextRole(row.vai_tro)
  }

  async function submitRole() {
    if (!roleTarget) return
    await adminPatch(`/users/${roleTarget.id}/role`, { vai_tro: nextRole })
    setMessage('Đã cập nhật vai trò tài khoản.')
    setRoleTarget(null)
    await load()
    if (detail?.account.id === roleTarget.id) await open(roleTarget.id)
  }

  return (
    <>
      <PageHeader eyebrow='Account operations' title='Quản lý người dùng' description='Theo dõi tài khoản, trạng thái, vai trò, hồ sơ sức khỏe, gói đã mua và lịch sử thanh toán của người dùng.' />
      {message ? <Notice>{message}</Notice> : null}
      <div className='mb-5 grid gap-4 md:grid-cols-3'><StatCard label='Tài khoản trong bộ lọc' value={String(stats.total)} /><StatCard label='Đang hoạt động' value={String(stats.active)} tone='green' /><StatCard label='Bị khóa' value={String(stats.locked)} tone='red' /></div>
      <Panel title='Danh sách tài khoản' description='Filter theo tên/email/số điện thoại, vai trò và trạng thái.'>
        <Toolbar>
          <input className={inputClass} placeholder='Tìm tên, email, số điện thoại' value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') load() }} />
          <select className={inputClass} value={role} onChange={(e) => setRole(e.target.value)}><option value=''>Tất cả vai trò</option><option value='customer'>Người dùng</option><option value='expert'>Chuyên gia</option><option value='admin'>Quản trị viên</option></select>
          <select className={inputClass} value={status} onChange={(e) => setStatus(e.target.value)}><option value=''>Tất cả trạng thái</option><option value='hoat_dong'>Hoạt động</option><option value='khong_hoat_dong'>Không hoạt động</option><option value='bi_khoa'>Bị khóa</option></select>
          <ActionButton tone='secondary' onClick={load}>Lọc</ActionButton>
        </Toolbar>
        <DataTable minWidth='1100px'><thead><tr><Th>Tài khoản</Th><Th>Vai trò</Th><Th>Trạng thái</Th><Th>Gói đã mua</Th><Th>Booking</Th><Th>Tổng chi tiêu</Th><Th>Đăng nhập cuối</Th><Th className='text-right'>Hành động</Th></tr></thead><tbody>{rows.map((row) => <tr key={row.id} className='hover:bg-blue-50/40'><Td><b>{row.ho_ten}</b><p className='text-xs text-slate-500'>{row.email}</p><p className='text-xs text-slate-400'>{row.so_dien_thoai ?? '-'}</p></Td><Td><StatusPill value={row.vai_tro} /></Td><Td><StatusPill value={row.trang_thai} /></Td><Td>{row.purchased_packages}</Td><Td>{row.bookings}</Td><Td><b>{money(row.total_paid)}</b></Td><Td>{row.dang_nhap_cuoi_luc ? String(row.dang_nhap_cuoi_luc).slice(0, 16) : '-'}</Td><Td className='text-right'><div className='flex justify-end gap-2'><ActionButton tone='secondary' onClick={() => open(row.id)}>Hồ sơ</ActionButton><ActionButton tone='secondary' onClick={() => openRole(row)}>Đổi vai trò</ActionButton>{row.trang_thai === 'bi_khoa' ? <ActionButton onClick={() => updateStatus(row, 'hoat_dong')}>Mở khóa</ActionButton> : <ActionButton tone='danger' onClick={() => updateStatus(row, 'bi_khoa')}>Khóa</ActionButton>}</div></Td></tr>)}</tbody></DataTable>
        {!rows.length && !loading ? <div className='mt-4'><EmptyState text='Không có tài khoản theo bộ lọc.' /></div> : null}
      </Panel>

      <Modal open={Boolean(detail)} onClose={() => setDetail(null)} title={detail ? `Hồ sơ: ${detail.account.ho_ten}` : 'Hồ sơ tài khoản'} description='Xem hồ sơ, gói đã mua, booking và thanh toán gần nhất.' width='max-w-6xl'>
        {detail ? <div className='space-y-5'><div className='grid gap-3 md:grid-cols-4'><StatCard label='Vai trò' value={detail.account.vai_tro} tone='slate' /><StatCard label='Trạng thái' value={detail.account.trang_thai} tone={detail.account.trang_thai === 'bi_khoa' ? 'red' : 'green'} /><StatCard label='Gói đã mua' value={String(detail.packages.length)} /><StatCard label='Thanh toán gần nhất' value={String(detail.payments.length)} tone='orange' /></div><Panel title='Thông tin cá nhân'><DataTable minWidth='720px'><tbody><tr><Td>Email</Td><Td>{detail.account.email}</Td></tr><tr><Td>Số điện thoại</Td><Td>{detail.account.so_dien_thoai ?? '-'}</Td></tr><tr><Td>Giới tính</Td><Td>{detail.customerProfile?.gioi_tinh ?? detail.healthProfile?.gioi_tinh ?? '-'}</Td></tr><tr><Td>Ngày sinh</Td><Td>{detail.customerProfile?.ngay_sinh ? String(detail.customerProfile.ngay_sinh).slice(0,10) : detail.healthProfile?.ngay_sinh ? String(detail.healthProfile.ngay_sinh).slice(0,10) : '-'}</Td></tr><tr><Td>Ghi chú sức khỏe</Td><Td>{detail.customerProfile?.ghi_chu_suc_khoe ?? detail.healthProfile?.ghi_chu_cho_chuyen_gia ?? '-'}</Td></tr></tbody></DataTable></Panel><Panel title='Gói đã mua'><DataTable minWidth='900px'><thead><tr><Th>Mã</Th><Th>Gói</Th><Th>Trạng thái</Th><Th>Lượt</Th><Th>Giá mua</Th><Th>Hết hạn</Th></tr></thead><tbody>{detail.packages.map((pkg) => <tr key={pkg.id}><Td>{pkg.ma_goi_da_mua}</Td><Td>{pkg.ten_goi}</Td><Td><StatusPill value={pkg.trang_thai} /></Td><Td>{pkg.so_luot_da_dung}/{pkg.so_luot_tong}</Td><Td>{money(pkg.gia_mua)}</Td><Td>{pkg.het_han_luc ? String(pkg.het_han_luc).slice(0,10) : '-'}</Td></tr>)}</tbody></DataTable>{!detail.packages.length ? <div className='mt-4'><EmptyState text='Chưa có gói đã mua.' /></div> : null}</Panel><Panel title='Booking gần nhất'><DataTable minWidth='900px'><thead><tr><Th>Mã lịch</Th><Th>Chuyên gia</Th><Th>Gói</Th><Th>Ngày</Th><Th>Trạng thái</Th></tr></thead><tbody>{detail.bookings.map((booking) => <tr key={booking.id}><Td>{booking.ma_lich_hen}</Td><Td>{booking.expert_name}</Td><Td>{booking.ten_goi}</Td><Td>{String(booking.ngay_hen).slice(0,10)}</Td><Td><StatusPill value={booking.trang_thai} /></Td></tr>)}</tbody></DataTable>{!detail.bookings.length ? <div className='mt-4'><EmptyState text='Chưa có booking.' /></div> : null}</Panel></div> : null}
      </Modal>

      <Modal open={Boolean(roleTarget)} onClose={() => setRoleTarget(null)} title='Đổi vai trò tài khoản' description='Nếu đổi sang chuyên gia, hệ thống sẽ tạo hồ sơ chuyên gia ở trạng thái chờ duyệt nếu chưa có.'>
        <div className='space-y-4'><div className='rounded-2xl bg-slate-50 p-4 text-sm'><b>{roleTarget?.ho_ten}</b><p className='mt-1 text-slate-500'>{roleTarget?.email}</p></div><Field label='Vai trò mới'><select className={inputClass} value={nextRole} onChange={(e) => setNextRole(e.target.value)}><option value='customer'>Người dùng</option><option value='expert'>Chuyên gia</option><option value='admin'>Quản trị viên</option></select></Field><div className='flex justify-end gap-2'><ActionButton tone='secondary' onClick={() => setRoleTarget(null)}>Hủy</ActionButton><ActionButton onClick={submitRole}>Lưu vai trò</ActionButton></div></div>
      </Modal>
    </>
  )
}
