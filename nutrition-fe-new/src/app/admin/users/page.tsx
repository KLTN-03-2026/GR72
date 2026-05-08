'use client'

import { useEffect, useMemo, useState } from 'react'
import { Search, Users, UserCheck, UserX, ShieldAlert } from 'lucide-react'
import {
  ActionButton, EmptyState, Field, FilterChip, LoadingSkeleton, Notice,
  PageHeader, Panel, StatCard, StatusPill, inputClass, money,
} from '@/components/admin/admin-ui'
import { DataTable, Modal, Td, Th } from '@/components/admin/admin-table'
import { adminGet, adminPatch } from '@/lib/admin-api'

type UserRow = Record<string, any>
type UserDetail = { account: UserRow; customerProfile: UserRow | null; healthProfile: UserRow | null; packages: UserRow[]; bookings: UserRow[]; payments: UserRow[] }

const ROLES = [
  { value: '', label: 'Tất cả' },
  { value: 'customer', label: 'Người dùng' },
  { value: 'expert', label: 'Chuyên gia' },
  { value: 'admin', label: 'Quản trị' },
]

const STATUSES = [
  { value: '', label: 'Tất cả' },
  { value: 'hoat_dong', label: 'Hoạt động' },
  { value: 'khong_hoat_dong', label: 'Không hoạt động' },
  { value: 'bi_khoa', label: 'Bị khóa' },
]

export default function AdminUsersPage() {
  const [rows, setRows] = useState<UserRow[]>([])
  const [detail, setDetail] = useState<UserDetail | null>(null)
  const [query, setQuery] = useState('')
  const [role, setRole] = useState('')
  const [status, setStatus] = useState('')
  const [roleTarget, setRoleTarget] = useState<UserRow | null>(null)
  const [nextRole, setNextRole] = useState('customer')
  const [message, setMessage] = useState('')
  const [tone, setTone] = useState<'info' | 'success' | 'error'>('info')
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (query) params.set('search', query)
      if (role) params.set('role', role)
      if (status) params.set('status', status)
      setRows(await adminGet<UserRow[]>(`/users${params.toString() ? `?${params}` : ''}`))
    } catch (e: any) {
      setMessage(e.message ?? 'Lỗi')
      setTone('error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [role, status])

  const stats = useMemo(() => ({
    total: rows.length,
    active: rows.filter((row) => row.trang_thai === 'hoat_dong').length,
    locked: rows.filter((row) => row.trang_thai === 'bi_khoa').length,
    inactive: rows.filter((row) => row.trang_thai === 'khong_hoat_dong').length,
  }), [rows])

  async function open(id: number) {
    try { setDetail(await adminGet<UserDetail>(`/users/${id}`)) }
    catch (e: any) { setMessage(e.message ?? 'Lỗi'); setTone('error') }
  }

  async function updateStatus(row: UserRow, nextStatus: string) {
    try {
      await adminPatch(`/users/${row.id}/status`, { trang_thai: nextStatus })
      setMessage(nextStatus === 'bi_khoa' ? '✅ Đã khóa tài khoản.' : '✅ Đã cập nhật trạng thái.')
      setTone('success')
      await load()
      if (detail?.account.id === row.id) await open(row.id)
    } catch (e: any) { setMessage(e.message ?? 'Lỗi'); setTone('error') }
  }

  function openRole(row: UserRow) {
    setRoleTarget(row)
    setNextRole(row.vai_tro)
  }

  async function submitRole() {
    if (!roleTarget) return
    try {
      await adminPatch(`/users/${roleTarget.id}/role`, { vai_tro: nextRole })
      setMessage('✅ Đã cập nhật vai trò.')
      setTone('success')
      setRoleTarget(null)
      await load()
      if (detail?.account.id === roleTarget.id) await open(roleTarget.id)
    } catch (e: any) { setMessage(e.message ?? 'Lỗi'); setTone('error') }
  }

  return (
    <>
      <PageHeader
        eyebrow='Quản trị tài khoản'
        title='Quản lý người dùng'
        description='Theo dõi, khóa/mở, đổi vai trò và xem hồ sơ chi tiết tài khoản.'
      />
      {message ? <Notice tone={tone}>{message}</Notice> : null}

      <div className='mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4'>
        <StatCard label='Tổng tài khoản' value={String(stats.total)} icon={Users} tone='blue' />
        <StatCard label='Đang hoạt động' value={String(stats.active)} icon={UserCheck} tone='green' />
        <StatCard label='Không hoạt động' value={String(stats.inactive)} tone='slate' />
        <StatCard label='Bị khóa' value={String(stats.locked)} icon={UserX} tone='red' />
      </div>

      <Panel title='Danh sách tài khoản' description='Bấm "Hồ sơ" để xem chi tiết, "Đổi vai trò" hoặc "Khóa/Mở" để cập nhật.'>
        <div className='mb-3 relative'>
          <Search size={15} className='absolute left-3 top-1/2 -translate-y-1/2 text-slate-400' />
          <input
            className={`${inputClass} pl-10`}
            placeholder='Tìm tên, email hoặc số điện thoại...'
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') load() }}
          />
        </div>

        <div className='mb-2 flex flex-wrap items-center gap-2'>
          <span className='text-xs font-semibold uppercase text-slate-500'>Vai trò:</span>
          {ROLES.map((r) => <FilterChip key={r.value} active={role === r.value} onClick={() => setRole(r.value)}>{r.label}</FilterChip>)}
        </div>
        <div className='mb-4 flex flex-wrap items-center gap-2'>
          <span className='text-xs font-semibold uppercase text-slate-500'>Trạng thái:</span>
          {STATUSES.map((s) => <FilterChip key={s.value} active={status === s.value} onClick={() => setStatus(s.value)}>{s.label}</FilterChip>)}
        </div>

        {loading ? (
          <LoadingSkeleton rows={6} />
        ) : rows.length === 0 ? (
          <EmptyState text='Không có tài khoản theo bộ lọc.' />
        ) : (
          <DataTable minWidth='1100px'>
            <thead>
              <tr>
                <Th>Tài khoản</Th>
                <Th>Vai trò</Th>
                <Th>Trạng thái</Th>
                <Th>Gói</Th>
                <Th>Booking</Th>
                <Th>Tổng chi</Th>
                <Th>Đăng nhập cuối</Th>
                <Th className='text-right'>Hành động</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className='hover:bg-blue-50/40'>
                  <Td>
                    <b>{row.ho_ten}</b>
                    <p className='text-xs text-slate-500'>{row.email}</p>
                    {row.so_dien_thoai && <p className='text-xs text-slate-400'>{row.so_dien_thoai}</p>}
                  </Td>
                  <Td><StatusPill value={row.vai_tro} /></Td>
                  <Td><StatusPill value={row.trang_thai} /></Td>
                  <Td>{row.purchased_packages}</Td>
                  <Td>{row.bookings}</Td>
                  <Td><b>{money(row.total_paid)}</b></Td>
                  <Td className='text-xs text-slate-500'>
                    {row.dang_nhap_cuoi_luc ? String(row.dang_nhap_cuoi_luc).slice(0, 16).replace('T', ' ') : '—'}
                  </Td>
                  <Td className='text-right'>
                    <div className='flex justify-end gap-2'>
                      <ActionButton tone='secondary' onClick={() => open(row.id)}>Hồ sơ</ActionButton>
                      <ActionButton tone='secondary' onClick={() => openRole(row)}>Vai trò</ActionButton>
                      {row.trang_thai === 'bi_khoa'
                        ? <ActionButton onClick={() => updateStatus(row, 'hoat_dong')}>Mở</ActionButton>
                        : <ActionButton tone='danger' onClick={() => updateStatus(row, 'bi_khoa')}>Khóa</ActionButton>
                      }
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </DataTable>
        )}
      </Panel>

      <Modal open={Boolean(detail)} onClose={() => setDetail(null)} title={detail ? `Hồ sơ: ${detail.account.ho_ten}` : 'Hồ sơ tài khoản'} description='Thông tin chi tiết và hoạt động gần nhất.' width='max-w-5xl'>
        {detail && (
          <div className='space-y-5'>
            <div className='grid gap-3 sm:grid-cols-2 xl:grid-cols-4'>
              <StatCard label='Vai trò' value={detail.account.vai_tro} tone='slate' />
              <StatCard label='Trạng thái' value={detail.account.trang_thai} tone={detail.account.trang_thai === 'bi_khoa' ? 'red' : 'green'} />
              <StatCard label='Gói đã mua' value={String(detail.packages.length)} tone='blue' />
              <StatCard label='Giao dịch' value={String(detail.payments.length)} tone='orange' />
            </div>

            <div className='grid gap-3 sm:grid-cols-2'>
              <InfoBlock label='Email' value={detail.account.email} />
              <InfoBlock label='SĐT' value={detail.account.so_dien_thoai ?? '—'} />
              <InfoBlock label='Giới tính' value={detail.customerProfile?.gioi_tinh ?? detail.healthProfile?.gioi_tinh ?? '—'} />
              <InfoBlock label='Ngày sinh' value={
                detail.customerProfile?.ngay_sinh ? String(detail.customerProfile.ngay_sinh).slice(0, 10)
                : detail.healthProfile?.ngay_sinh ? String(detail.healthProfile.ngay_sinh).slice(0, 10)
                : '—'
              } />
            </div>

            {(detail.customerProfile?.ghi_chu_suc_khoe || detail.healthProfile?.ghi_chu_cho_chuyen_gia) && (
              <div className='rounded-2xl border border-amber-200 bg-amber-50 p-4'>
                <p className='flex items-center gap-2 text-xs font-semibold uppercase text-amber-700'>
                  <ShieldAlert size={13} /> Ghi chú sức khoẻ
                </p>
                <p className='mt-2 text-sm text-amber-900'>{detail.customerProfile?.ghi_chu_suc_khoe ?? detail.healthProfile?.ghi_chu_cho_chuyen_gia}</p>
              </div>
            )}

            <Panel title={`Gói đã mua (${detail.packages.length})`}>
              {detail.packages.length === 0 ? <EmptyState text='Chưa có gói đã mua.' /> : (
                <DataTable minWidth='900px'>
                  <thead><tr><Th>Mã</Th><Th>Gói</Th><Th>Trạng thái</Th><Th>Lượt</Th><Th>Giá</Th><Th>Hết hạn</Th></tr></thead>
                  <tbody>{detail.packages.map((pkg) => (
                    <tr key={pkg.id}>
                      <Td className='font-mono text-xs'>{pkg.ma_goi_da_mua}</Td>
                      <Td>{pkg.ten_goi}</Td>
                      <Td><StatusPill value={pkg.trang_thai} /></Td>
                      <Td>{pkg.so_luot_da_dung}/{pkg.so_luot_tong}</Td>
                      <Td>{money(pkg.gia_mua)}</Td>
                      <Td>{pkg.het_han_luc ? String(pkg.het_han_luc).slice(0, 10) : '—'}</Td>
                    </tr>
                  ))}</tbody>
                </DataTable>
              )}
            </Panel>

            <Panel title={`Booking gần nhất (${detail.bookings.length})`}>
              {detail.bookings.length === 0 ? <EmptyState text='Chưa có booking.' /> : (
                <DataTable minWidth='900px'>
                  <thead><tr><Th>Mã</Th><Th>Chuyên gia</Th><Th>Gói</Th><Th>Ngày</Th><Th>Trạng thái</Th></tr></thead>
                  <tbody>{detail.bookings.map((booking) => (
                    <tr key={booking.id}>
                      <Td className='font-mono text-xs'>{booking.ma_lich_hen}</Td>
                      <Td>{booking.expert_name}</Td>
                      <Td>{booking.ten_goi}</Td>
                      <Td>{String(booking.ngay_hen).slice(0, 10)}</Td>
                      <Td><StatusPill value={booking.trang_thai} /></Td>
                    </tr>
                  ))}</tbody>
                </DataTable>
              )}
            </Panel>
          </div>
        )}
      </Modal>

      <Modal open={Boolean(roleTarget)} onClose={() => setRoleTarget(null)} title='Đổi vai trò' description='Nếu đổi sang chuyên gia, hệ thống tạo hồ sơ chuyên gia ở trạng thái chờ duyệt.'>
        <div className='space-y-4'>
          <div className='rounded-2xl bg-slate-50 p-4 text-sm'>
            <b>{roleTarget?.ho_ten}</b>
            <p className='mt-1 text-slate-500'>{roleTarget?.email}</p>
          </div>
          <Field label='Vai trò mới'>
            <select className={inputClass} value={nextRole} onChange={(e) => setNextRole(e.target.value)}>
              <option value='customer'>Người dùng</option>
              <option value='expert'>Chuyên gia</option>
              <option value='admin'>Quản trị viên</option>
            </select>
          </Field>
          <div className='flex justify-end gap-2'>
            <ActionButton tone='secondary' onClick={() => setRoleTarget(null)}>Hủy</ActionButton>
            <ActionButton onClick={submitRole}>Lưu vai trò</ActionButton>
          </div>
        </div>
      </Modal>
    </>
  )
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className='rounded-xl border border-slate-200 bg-slate-50 p-3'>
      <p className='text-xs font-semibold uppercase tracking-wide text-slate-500'>{label}</p>
      <p className='mt-1 break-all text-sm font-semibold text-slate-900'>{value}</p>
    </div>
  )
}
