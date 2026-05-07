'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  ActionButton, EmptyState, Notice, PageHeader, Panel,
  StatCard, StatusPill, inputClass, money,
} from '@/components/admin/admin-ui'
import { DataTable, Modal, Td, Th } from '@/components/admin/admin-table'
import { adminGet, adminPost } from '@/lib/admin-api'
import {
  CheckCircle2, CircleDot, ChevronDown, ChevronUp,
  RefreshCw, Lock, Banknote, Plus,
} from 'lucide-react'

type Period = Record<string, any>

/* ─── Step bar ──────────────────────────────────────────── */
const STEPS = [
  { key: 'nhap',       label: 'Nháp',        Icon: CircleDot    },
  { key: 'da_chot',    label: 'Đã chốt',     Icon: Lock         },
  { key: 'da_chi_tra', label: 'Đã chi trả',  Icon: CheckCircle2 },
]

function StepBar({ status }: { status: string }) {
  const cur = STEPS.findIndex((s) => s.key === status)
  return (
    <div className='flex items-center gap-0'>
      {STEPS.map(({ key, label, Icon }, i) => {
        const done    = i < cur
        const active  = i === cur
        return (
          <div key={key} className='flex items-center'>
            <div className='flex flex-col items-center gap-1'>
              <div className={[
                'flex size-9 items-center justify-center rounded-full',
                done   ? 'bg-emerald-100' : active ? 'bg-blue-100' : 'bg-slate-100',
              ].join(' ')}>
                {done
                  ? <CheckCircle2 size={17} className='text-emerald-600' />
                  : <Icon size={17} className={active ? 'text-blue-600' : 'text-slate-400'} />
                }
              </div>
              <span className={[
                'text-[11px] font-semibold whitespace-nowrap',
                done ? 'text-emerald-600' : active ? 'text-blue-600' : 'text-slate-400',
              ].join(' ')}>{label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={['mb-4 h-px w-12 sm:w-16', i < cur ? 'bg-emerald-300' : 'bg-slate-200'].join(' ')} />
            )}
          </div>
        )
      })}
    </div>
  )
}

/* ─── Page ──────────────────────────────────────────────── */
export default function CommissionsPage() {
  const [periods, setPeriods]         = useState<Period[]>([])
  const [detail, setDetail]           = useState<Period | null>(null)
  const [month, setMonth]             = useState(new Date().getMonth() + 1)
  const [year, setYear]               = useState(new Date().getFullYear())
  const [filterStatus, setFilterStatus] = useState('')
  const [filterYear, setFilterYear]   = useState('')
  const [message, setMessage]         = useState('')
  const [msgTone, setMsgTone]         = useState<'success' | 'error'>('success')
  const [loading, setLoading]         = useState(false)
  const [acting, setActing]           = useState(false)
  const [linesOpen, setLinesOpen]     = useState(false)
  const [showCreate, setShowCreate]   = useState(false)

  async function load() {
    setLoading(true)
    try {
      const p = new URLSearchParams()
      if (filterStatus) p.set('status', filterStatus)
      if (filterYear)   p.set('year', filterYear)
      setPeriods(await adminGet<Period[]>(`/commission-periods${p.toString() ? `?${p}` : ''}`))
    } finally { setLoading(false) }
  }

  async function openDetail(id: number) {
    const data = await adminGet<Period>(`/commission-periods/${id}`)
    setDetail(data)
    setLinesOpen(false)
  }

  useEffect(() => { load().catch((e) => { setMessage(e.message); setMsgTone('error') }) }, [filterStatus, filterYear])

  async function createPeriod() {
    if (!month || month < 1 || month > 12 || !year || year < 2020) {
      setMessage('Tháng phải từ 1–12 và năm phải từ 2020 trở đi.'); setMsgTone('error'); return
    }
    try {
      const p = await adminPost<Period>('/commission-periods', { thang: month, nam: year })
      setMessage(`Đã tạo kỳ hoa hồng tháng ${month}/${year}. Bấm "Tính hoa hồng" để bắt đầu.`)
      setMsgTone('success')
      setShowCreate(false)
      await load()
      await openDetail(p.id)
    } catch (e: any) { setMessage(e.message); setMsgTone('error') }
  }

  async function doAction(path: string, confirmMsg?: string) {
    if (!detail) return
    if (confirmMsg && !window.confirm(confirmMsg)) return
    setActing(true)
    try {
      const result = await adminPost<Period>(`/commission-periods/${detail.period.id}/${path}`)
      setDetail(result)
      const labels: Record<string, string> = {
        recalculate: 'Đã tính hoa hồng cho tất cả chuyên gia trong kỳ.',
        finalize:    'Đã chốt kỳ hoa hồng. Không thể tính lại nữa.',
        payout:      'Đã xác nhận chi trả. Kỳ hoa hồng hoàn tất.',
      }
      setMessage(labels[path] ?? 'Thao tác thành công.')
      setMsgTone('success')
      await load()
    } catch (e: any) { setMessage(e.message); setMsgTone('error') }
    finally { setActing(false) }
  }

  const totals = useMemo(() => ({
    revenue:    periods.reduce((s, p) => s + Number(p.tong_doanh_thu_hop_le ?? 0), 0),
    commission: periods.reduce((s, p) => s + Number(p.tong_hoa_hong ?? 0), 0),
    pending:    periods.filter((p) => p.trang_thai !== 'da_chi_tra').length,
  }), [periods])

  const period  = detail?.period
  const payouts: Period[] = detail?.payouts ?? []
  const lines: Period[]   = detail?.lines   ?? []

  return (
    <>
      <PageHeader
        eyebrow='Quy trình hoa hồng'
        title='Chi trả hoa hồng chuyên gia'
        description='Tạo kỳ theo tháng → tính hoa hồng → chốt số liệu → xác nhận đã chuyển tiền.'
        action={
          <ActionButton tone='accent' onClick={() => setShowCreate(!showCreate)}>
            <Plus size={14} /> Tạo kỳ mới
          </ActionButton>
        }
      />

      {message && <Notice tone={msgTone === 'error' ? 'error' : 'success'}>{message}</Notice>}

      {/* Quy trình 4 bước */}
      <div className='mb-5 grid grid-cols-2 gap-3 md:grid-cols-4'>
        <div className='flex items-start gap-3 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3'>
          <span className='flex size-6 shrink-0 items-center justify-center rounded-full bg-blue-200 text-xs font-bold text-blue-800'>1</span>
          <div>
            <p className='text-sm font-semibold text-blue-800'>Tạo kỳ</p>
            <p className='mt-0.5 text-xs text-slate-500'>Chọn tháng/năm, tạo kỳ hoa hồng</p>
          </div>
        </div>
        <div className='flex items-start gap-3 rounded-2xl border border-indigo-100 bg-indigo-50 px-4 py-3'>
          <span className='flex size-6 shrink-0 items-center justify-center rounded-full bg-indigo-200 text-xs font-bold text-indigo-800'>2</span>
          <div>
            <p className='text-sm font-semibold text-indigo-800'>Tính hoa hồng</p>
            <p className='mt-0.5 text-xs text-slate-500'>Gom booking, tính tiền theo tỷ lệ</p>
          </div>
        </div>
        <div className='flex items-start gap-3 rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3'>
          <span className='flex size-6 shrink-0 items-center justify-center rounded-full bg-amber-200 text-xs font-bold text-amber-800'>3</span>
          <div>
            <p className='text-sm font-semibold text-amber-800'>Chốt kỳ</p>
            <p className='mt-0.5 text-xs text-slate-500'>Khoá số liệu, chuẩn bị chi trả</p>
          </div>
        </div>
        <div className='flex items-start gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3'>
          <span className='flex size-6 shrink-0 items-center justify-center rounded-full bg-emerald-200 text-xs font-bold text-emerald-800'>4</span>
          <div>
            <p className='text-sm font-semibold text-emerald-800'>Chi trả</p>
            <p className='mt-0.5 text-xs text-slate-500'>Chuyển tiền, xác nhận hoàn tất</p>
          </div>
        </div>
      </div>


      {/* Stat cards */}
      <div className='mb-5 grid gap-4 md:grid-cols-3'>
        <StatCard label='Tổng doanh thu (đang hiển thị)' value={money(totals.revenue)} />
        <StatCard label='Tổng hoa hồng phải trả' value={money(totals.commission)} tone='orange' />
        <StatCard label='Kỳ chưa hoàn tất' value={String(totals.pending)} tone='red' />
      </div>

      {/* Danh sách kỳ */}
      <Panel title='Danh sách kỳ hoa hồng' description='Bấm "Xem chi tiết" để mở kỳ và thực hiện các bước tiếp theo.'>
        <div className='mb-4 flex flex-wrap gap-2'>
          <select className={inputClass + ' w-44'} value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value=''>Tất cả trạng thái</option>
            <option value='nhap'>Nháp</option>
            <option value='da_chot'>Đã chốt</option>
            <option value='da_chi_tra'>Đã chi trả</option>
          </select>
          <input type='number' className={inputClass + ' w-28'} placeholder='Năm (VD: 2026)'
            value={filterYear} onChange={(e) => setFilterYear(e.target.value)} />
          <ActionButton tone='secondary' onClick={load}>Lọc</ActionButton>
        </div>

        <DataTable minWidth='720px'>
          <thead>
            <tr>
              <Th>Kỳ</Th>
              <Th>Khoảng thời gian</Th>
              <Th>Doanh thu hợp lệ</Th>
              <Th>Hoa hồng phải trả</Th>
              <Th>Trạng thái</Th>
              <Th className='text-right'>Hành động</Th>
            </tr>
          </thead>
          <tbody>
            {periods.map((p) => (
              <tr key={p.id} className='hover:bg-blue-50/40'>
                <Td>
                  <p className='font-bold text-slate-800'>{p.thang}/{p.nam}</p>
                  <p className='font-mono text-xs text-slate-400'>{p.ma_ky}</p>
                </Td>
                <Td>
                  <p className='text-xs text-slate-600'>
                    {String(p.tu_ngay).slice(0, 10)} → {String(p.den_ngay).slice(0, 10)}
                  </p>
                </Td>
                <Td>{money(p.tong_doanh_thu_hop_le)}</Td>
                <Td><b className='text-orange-600'>{money(p.tong_hoa_hong)}</b></Td>
                <Td><StatusPill value={p.trang_thai} /></Td>
                <Td className='text-right'>
                  <ActionButton tone='secondary' onClick={() => openDetail(p.id)}>
                    Xem chi tiết
                  </ActionButton>
                </Td>
              </tr>
            ))}
          </tbody>
        </DataTable>
        {!periods.length && !loading && (
          <div className='mt-4'><EmptyState text='Chưa có kỳ hoa hồng nào.' /></div>
        )}
      </Panel>

      {/* Create modal */}
      <Modal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title='Tạo kỳ hoa hồng mới'
        description='Mỗi tháng chỉ tạo một kỳ. Hệ thống tự gom tất cả booking hoàn thành trong tháng đó.'
      >
        <div className='space-y-4'>
          <div className='flex flex-wrap gap-4'>
            <div className='flex-1 min-w-[100px]'>
              <label className='mb-1 block text-xs font-medium text-slate-600'>Tháng</label>
              <input type='number' min={1} max={12} className={inputClass + ' w-full'} value={month}
                onChange={(e) => setMonth(Number(e.target.value))} />
            </div>
            <div className='flex-1 min-w-[120px]'>
              <label className='mb-1 block text-xs font-medium text-slate-600'>Năm</label>
              <input type='number' min={2020} className={inputClass + ' w-full'} value={year}
                onChange={(e) => setYear(Number(e.target.value))} />
            </div>
          </div>
          <div className='flex justify-end gap-2'>
            <ActionButton tone='secondary' onClick={() => setShowCreate(false)}>Huỷ</ActionButton>
            <ActionButton tone='accent' onClick={createPeriod}>
              Tạo kỳ tháng {month}/{year}
            </ActionButton>
          </div>
        </div>
      </Modal>

      {/* Detail modal */}
      <Modal
        open={Boolean(detail)}
        onClose={() => setDetail(null)}
        title={period ? `Kỳ hoa hồng tháng ${period.thang}/${period.nam}` : ''}
        description={period ? `${period.ma_ky} · ${String(period.tu_ngay).slice(0, 10)} → ${String(period.den_ngay).slice(0, 10)}` : ''}
        width='max-w-5xl'
      >
        {detail && period && (
          <div className='space-y-5'>

            {/* Header: step bar + tổng */}
            <div className='flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-slate-50 px-5 py-4'>
              <StepBar status={period.trang_thai} />
              <div className='text-right'>
                <p className='text-xs text-slate-400'>Tổng hoa hồng kỳ này</p>
                <p className='text-2xl font-bold text-orange-600'>{money(period.tong_hoa_hong)}</p>
                <p className='text-xs text-slate-400'>trên {money(period.tong_doanh_thu_hop_le)} doanh thu</p>
              </div>
            </div>

            {/* Hướng dẫn bước tiếp theo */}
            {period.trang_thai === 'nhap' && (
              <div className='rounded-2xl border border-blue-100 bg-blue-50 px-5 py-4'>
                <p className='text-sm font-semibold text-blue-800'>Bước tiếp theo</p>
                <p className='mt-1 text-sm text-blue-700'>
                  Bấm <strong>Tính hoa hồng</strong> để hệ thống gom tất cả booking hoàn thành trong tháng {period.thang}/{period.nam}.
                  Sau khi kiểm tra số liệu, bấm <strong>Chốt kỳ</strong> để khoá lại.
                </p>
              </div>
            )}
            {period.trang_thai === 'da_chot' && (
              <div className='rounded-2xl border border-amber-100 bg-amber-50 px-5 py-4'>
                <p className='text-sm font-semibold text-amber-800'>Sẵn sàng chi trả</p>
                <p className='mt-1 text-sm text-amber-700'>
                  Số liệu đã khoá. Kiểm tra danh sách bên dưới, sau đó bấm{' '}
                  <strong>Xác nhận đã chi trả</strong> sau khi đã chuyển tiền thực tế cho từng chuyên gia.
                </p>
              </div>
            )}
            {period.trang_thai === 'da_chi_tra' && (
              <div className='rounded-2xl border border-emerald-100 bg-emerald-50 px-5 py-4'>
                <p className='text-sm font-semibold text-emerald-800'>Kỳ hoa hồng đã hoàn tất</p>
                <p className='mt-1 text-sm text-emerald-700'>
                  Đã chi trả hoa hồng cho {payouts.length} chuyên gia trong kỳ này.
                </p>
              </div>
            )}

            {/* Action buttons */}
            {period.trang_thai === 'nhap' && (
              <div className='flex flex-wrap gap-2'>
                <ActionButton tone='secondary' onClick={() => doAction('recalculate')} disabled={acting}>
                  <RefreshCw size={13} className={acting ? 'animate-spin' : ''} />
                  {acting ? 'Đang tính...' : 'Tính hoa hồng'}
                </ActionButton>
                <ActionButton
                  tone='accent'
                  disabled={acting || !payouts.length}
                  onClick={() => doAction('finalize', `Chốt kỳ tháng ${period.thang}/${period.nam}? Sau khi chốt sẽ không tính lại được.`)}
                >
                  <Lock size={13} />
                  Chốt kỳ
                </ActionButton>
              </div>
            )}
            {period.trang_thai === 'da_chot' && (
              <div className='flex flex-wrap gap-2'>
                <ActionButton
                  tone='accent'
                  disabled={acting}
                  onClick={() => doAction('payout', `Xác nhận đã chuyển tiền hoa hồng cho ${payouts.length} chuyên gia?`)}
                >
                  <Banknote size={13} />
                  {acting ? 'Đang xử lý...' : 'Xác nhận đã chi trả'}
                </ActionButton>
              </div>
            )}

            {/* Bảng chi trả theo chuyên gia (view chính) */}
            <Panel title='Chi trả theo chuyên gia' description='Số tiền thực tế mỗi chuyên gia nhận được trong kỳ này'>
              {payouts.length ? (
                <DataTable minWidth='580px'>
                  <thead>
                    <tr>
                      <Th>Chuyên gia</Th>
                      <Th>Số buổi</Th>
                      <Th>Doanh thu hợp lệ</Th>
                      <Th>Hoa hồng nhận</Th>
                      <Th>Trạng thái</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {payouts.map((p) => (
                      <tr key={p.id} className='hover:bg-slate-50'>
                        <Td><b>{p.expert_name}</b></Td>
                        <Td>{p.so_booking} buổi</Td>
                        <Td>{money(p.tong_doanh_thu_hop_le)}</Td>
                        <Td><b className='text-emerald-700'>{money(p.tong_hoa_hong)}</b></Td>
                        <Td><StatusPill value={p.trang_thai} /></Td>
                      </tr>
                    ))}
                  </tbody>
                </DataTable>
              ) : (
                <EmptyState text='Chưa có dữ liệu — bấm "Tính hoa hồng" để bắt đầu.' />
              )}
            </Panel>

            {/* Chi tiết từng booking — collapsible */}
            {lines.length > 0 && (
              <div className='overflow-hidden rounded-2xl border border-slate-100 bg-white'>
                <button
                  className='flex w-full items-center justify-between px-5 py-3.5 text-sm font-medium text-slate-600 hover:bg-slate-50'
                  onClick={() => setLinesOpen(!linesOpen)}
                >
                  <span>Chi tiết từng booking ({lines.length} dòng)</span>
                  {linesOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                </button>
                {linesOpen && (
                  <div className='border-t border-slate-100'>
                    <DataTable minWidth='720px'>
                      <thead>
                        <tr>
                          <Th>Chuyên gia</Th>
                          <Th>Gói dịch vụ</Th>
                          <Th>Doanh thu</Th>
                          <Th>Tỷ lệ HH</Th>
                          <Th>Hoa hồng</Th>
                          <Th>Trạng thái</Th>
                        </tr>
                      </thead>
                      <tbody>
                        {lines.map((line) => (
                          <tr key={line.id} className='hover:bg-slate-50'>
                            <Td>{line.expert_name}</Td>
                            <Td>{line.ten_goi}</Td>
                            <Td>{money(line.doanh_thu_hop_le)}</Td>
                            <Td>{line.ty_le_hoa_hong}%</Td>
                            <Td><b>{money(line.so_tien_hoa_hong)}</b></Td>
                            <Td><StatusPill value={line.trang_thai} /></Td>
                          </tr>
                        ))}
                      </tbody>
                    </DataTable>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>
    </>
  )
}
