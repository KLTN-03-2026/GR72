'use client'

import { useEffect, useMemo, useState } from 'react'
import { ActionButton, EmptyState, Field, Notice, PageHeader, Panel, StatCard, StatusPill, Toolbar, inputClass, money } from '@/components/admin/admin-ui'
import { DataTable, Modal, Td, Th } from '@/components/admin/admin-table'
import { adminGet, adminPost } from '@/lib/admin-api'

type Period = Record<string, any>

export default function CommissionsPage() {
  const [periods, setPeriods] = useState<Period[]>([])
  const [detail, setDetail] = useState<Period | null>(null)
  const [month, setMonth] = useState(new Date().getMonth() + 1)
  const [year, setYear] = useState(new Date().getFullYear())
  const [status, setStatus] = useState('')
  const [yearFilter, setYearFilter] = useState('')
  const [message, setMessage] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (status) params.set('status', status)
      if (yearFilter) params.set('year', yearFilter)
      setPeriods(await adminGet<Period[]>(`/commission-periods${params.toString() ? `?${params}` : ''}`))
    } finally {
      setLoading(false)
    }
  }

  async function open(id: number) { setDetail(await adminGet<Period>(`/commission-periods/${id}`)) }
  useEffect(() => { load().catch((err) => setMessage(err.message)) }, [status])

  async function createPeriod() {
    const nextErrors: Record<string, string> = {}
    if (!month || month < 1 || month > 12) nextErrors.month = 'Tháng phải nằm trong khoảng 1-12.'
    if (!year || year < 2020) nextErrors.year = 'Vui lòng nhập năm hợp lệ.'
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors)
      return
    }
    setErrors({})
    const period = await adminPost<Period>('/commission-periods', { thang: month, nam: year })
    setMessage('Đã tạo hoặc mở kỳ hoa hồng.')
    await load(); await open(period.id)
  }

  async function action(path: string) {
    if (!detail) return
    try {
      setDetail(await adminPost<Period>(`/commission-periods/${detail.period.id}/${path}`))
      setMessage(path === 'recalculate' ? 'Đã tính lại hoa hồng cho kỳ.' : path === 'finalize' ? 'Đã chốt kỳ hoa hồng.' : 'Đã xác nhận chi trả hoa hồng.')
      await load()
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Không thể thực hiện thao tác kỳ hoa hồng.')
    }
  }

  const totals = useMemo(() => ({ revenue: periods.reduce((s, p) => s + Number(p.tong_doanh_thu_hop_le ?? 0), 0), commission: periods.reduce((s, p) => s + Number(p.tong_hoa_hong ?? 0), 0), pending: periods.filter((p) => p.trang_thai !== 'da_chi_tra').length }), [periods])

  return <>
    <PageHeader eyebrow='Commission workflow' title='Đối soát và chi trả hoa hồng' description='Quản lý kỳ hoa hồng bằng bảng. Chi tiết kỳ, dòng hoa hồng và payout mở trong modal để không chiếm cố định nửa trang.' />
    {message ? <Notice>{message}</Notice> : null}
    <div className='mb-5 grid gap-4 md:grid-cols-3'><StatCard label='Tổng doanh thu kỳ' value={money(totals.revenue)} /><StatCard label='Tổng hoa hồng' value={money(totals.commission)} tone='orange' /><StatCard label='Kỳ chưa chi trả' value={String(totals.pending)} tone='red' /></div>
    <Panel title='Danh sách kỳ hoa hồng' description='Tạo kỳ mới ở toolbar, sau đó dùng action để tính lại/chốt/chi trả.'>
      <Toolbar>
        <Field label='Tháng' error={errors.month}><input type='number' min={1} max={12} className={inputClass} value={month} onChange={(e) => setMonth(Number(e.target.value))} /></Field>
        <Field label='Năm tạo kỳ' error={errors.year}><input type='number' className={inputClass} value={year} onChange={(e) => setYear(Number(e.target.value))} /></Field>
        <Field label='Lọc trạng thái'><select className={inputClass} value={status} onChange={(e) => setStatus(e.target.value)}><option value=''>Tất cả trạng thái</option>{['nhap','da_chot','da_chi_tra'].map((item) => <option key={item} value={item}>{item}</option>)}</select></Field>
        <Field label='Lọc năm'><input type='number' className={inputClass} value={yearFilter} onChange={(e) => setYearFilter(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') load() }} placeholder='VD: 2026' /></Field>
        <div className='flex items-end gap-2'><ActionButton tone='secondary' onClick={load}>Lọc</ActionButton><ActionButton tone='accent' onClick={createPeriod}>Tạo/mở kỳ</ActionButton></div>
      </Toolbar>
      <DataTable minWidth='940px'><thead><tr><Th>Mã kỳ</Th><Th>Tháng</Th><Th>Khoảng ngày</Th><Th>Doanh thu hợp lệ</Th><Th>Hoa hồng</Th><Th>Trạng thái</Th><Th className='text-right'>Hành động</Th></tr></thead><tbody>{periods.map((period) => <tr key={period.id} className='hover:bg-blue-50/40'><Td><b>{period.ma_ky}</b></Td><Td>{period.thang}/{period.nam}</Td><Td>{String(period.tu_ngay).slice(0,10)} - {String(period.den_ngay).slice(0,10)}</Td><Td>{money(period.tong_doanh_thu_hop_le)}</Td><Td><b>{money(period.tong_hoa_hong)}</b></Td><Td><StatusPill value={period.trang_thai} /></Td><Td className='text-right'><ActionButton tone='secondary' onClick={() => open(period.id)}>Chi tiết</ActionButton></Td></tr>)}</tbody></DataTable>
      {!periods.length && !loading ? <div className='mt-4'><EmptyState text='Chưa có kỳ hoa hồng theo bộ lọc.' /></div> : null}
    </Panel>
    <Modal open={Boolean(detail)} onClose={() => setDetail(null)} title={detail ? `Kỳ hoa hồng ${detail.period.ma_ky}` : 'Chi tiết kỳ'} description='Thao tác theo thứ tự: tính lại, chốt kỳ, xác nhận chi trả.' width='max-w-6xl'>
      {detail ? <div className='space-y-5'><div className='flex flex-wrap justify-end gap-2'><ActionButton tone='secondary' onClick={() => action('recalculate')}>Tính lại</ActionButton><ActionButton tone='accent' onClick={() => action('finalize')}>Chốt kỳ</ActionButton><ActionButton onClick={() => action('payout')}>Xác nhận chi trả</ActionButton></div><Panel title='Dòng hoa hồng'><DataTable minWidth='900px'><thead><tr><Th>Chuyên gia</Th><Th>Gói</Th><Th>Doanh thu</Th><Th>Tỷ lệ</Th><Th>Hoa hồng</Th><Th>Trạng thái</Th></tr></thead><tbody>{detail.lines?.map((line: Period) => <tr key={line.id}><Td>{line.expert_name}</Td><Td>{line.ten_goi}</Td><Td>{money(line.doanh_thu_hop_le)}</Td><Td>{line.ty_le_hoa_hong}%</Td><Td><b>{money(line.so_tien_hoa_hong)}</b></Td><Td><StatusPill value={line.trang_thai} /></Td></tr>)}</tbody></DataTable>{!detail.lines?.length ? <div className='mt-4'><EmptyState text='Chưa có dòng hoa hồng.' /></div> : null}</Panel><Panel title='Chi trả theo chuyên gia'><DataTable minWidth='820px'><thead><tr><Th>Chuyên gia</Th><Th>Booking</Th><Th>Doanh thu</Th><Th>Hoa hồng</Th><Th>Trạng thái</Th></tr></thead><tbody>{detail.payouts?.map((payout: Period) => <tr key={payout.id}><Td>{payout.expert_name}</Td><Td>{payout.so_booking}</Td><Td>{money(payout.tong_doanh_thu_hop_le)}</Td><Td><b>{money(payout.tong_hoa_hong)}</b></Td><Td><StatusPill value={payout.trang_thai} /></Td></tr>)}</tbody></DataTable>{!detail.payouts?.length ? <div className='mt-4'><EmptyState text='Chưa có payout.' /></div> : null}</Panel></div> : null}
    </Modal>
  </>
}
