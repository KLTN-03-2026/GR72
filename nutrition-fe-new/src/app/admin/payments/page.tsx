'use client'

import { useEffect, useMemo, useState } from 'react'
import { Search, Receipt, CheckCircle, RefreshCw, AlertCircle } from 'lucide-react'
import {
  ActionButton, EmptyState, Field, FilterChip, JsonViewer, LoadingSkeleton, Notice,
  PageHeader, Panel, StatCard, StatusPill, SummaryBar, inputClass, money,
} from '@/components/admin/admin-ui'
import { DataTable, Modal, Td, Th } from '@/components/admin/admin-table'
import { adminGet, adminPatch, adminPost } from '@/lib/admin-api'
import { STATUS_LABELS, PAYMENT_TYPE_LABELS } from '@/lib/i18n'

type Payment = Record<string, any>

const STATUS_OPTIONS = ['khoi_tao', 'cho_thanh_toan', 'thanh_cong', 'that_bai', 'het_han', 'hoan_tien']

export default function PaymentsPage() {
  const [rows, setRows] = useState<Payment[]>([])
  const [selected, setSelected] = useState<Payment | null>(null)
  const [refundTarget, setRefundTarget] = useState<Payment | null>(null)
  const [logs, setLogs] = useState<Payment[]>([])
  const [message, setMessage] = useState('')
  const [tone, setTone] = useState<'info' | 'success' | 'error'>('info')
  const [filter, setFilter] = useState('')
  const [type, setType] = useState('')
  const [query, setQuery] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [refundReason, setRefundReason] = useState('')
  const [refundAmount, setRefundAmount] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [detailOpen, setDetailOpen] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filter) params.set('status', filter)
      if (type) params.set('type', type)
      if (query) params.set('search', query)
      if (from) params.set('from', from)
      if (to) params.set('to', to)
      setRows(await adminGet<Payment[]>(`/payments${params.toString() ? `?${params}` : ''}`))
    } catch (e: any) {
      setMessage(e.message ?? 'Lỗi'); setTone('error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [filter, type])

  const totals = useMemo(() => {
    const success = rows.filter((row) => row.trang_thai === 'thanh_cong')
    return {
      count: rows.length,
      successCount: success.length,
      successAmount: success.reduce((sum, row) => sum + Number(row.so_tien ?? 0), 0),
      refundCount: rows.filter((row) => row.trang_thai === 'hoan_tien').length,
      pendingCount: rows.filter((row) => ['khoi_tao', 'cho_thanh_toan'].includes(row.trang_thai)).length,
      totalValue: rows.reduce((sum, row) => sum + Number(row.so_tien ?? 0), 0),
    }
  }, [rows])

  async function open(payment: Payment) {
    try {
      setSelected(await adminGet<Payment>(`/payments/${payment.id}`))
      setLogs(await adminGet<Payment[]>(`/payments/${payment.id}/webhook-logs`))
      setDetailOpen(true)
    } catch (e: any) { setMessage(e.message ?? 'Lỗi'); setTone('error') }
  }

  function openRefund(payment: Payment) {
    setRefundTarget(payment)
    setRefundReason('')
    setRefundAmount(String(payment.so_tien ?? ''))
    setErrors({})
  }

  async function submitRefund() {
    if (!refundTarget) return
    const nextErrors: Record<string, string> = {}
    const amount = Number(refundAmount)
    if (!refundReason.trim()) nextErrors.refundReason = 'Vui lòng nhập lý do hoàn tiền.'
    if (!amount || amount <= 0) nextErrors.refundAmount = 'Số tiền phải lớn hơn 0.'
    if (amount > Number(refundTarget.so_tien)) nextErrors.refundAmount = 'Không vượt quá số tiền giao dịch.'
    if (Object.keys(nextErrors).length) { setErrors(nextErrors); return }
    try {
      await adminPost(`/payments/${refundTarget.id}/refund`, { ly_do: refundReason, so_tien: amount })
      setMessage('✅ Đã hoàn tiền.')
      setTone('success')
      setRefundTarget(null)
      setDetailOpen(false)
      await load()
    } catch (e: any) { setMessage(e.message ?? 'Lỗi'); setTone('error') }
  }

  async function reconcile(payment: Payment) {
    try {
      await adminPatch(`/payments/${payment.id}/reconcile`)
      setMessage('✅ Đã đối soát giao dịch.')
      setTone('success')
      await open(payment)
      await load()
    } catch (e: any) { setMessage(e.message ?? 'Lỗi'); setTone('error') }
  }

  return (
    <>
      <PageHeader
        eyebrow='Quản trị thanh toán'
        title='Quản lý thanh toán'
        description='Theo dõi giao dịch, đối soát webhook và xử lý hoàn tiền.'
      />
      {message ? <Notice tone={tone}>{message}</Notice> : null}

      <div className='mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4'>
        <StatCard label='Tổng giao dịch' value={String(totals.count)} icon={Receipt} tone='blue' />
        <StatCard label='Thành công' value={String(totals.successCount)} icon={CheckCircle} tone='green' caption={money(totals.successAmount)} />
        <StatCard label='Đang chờ' value={String(totals.pendingCount)} icon={AlertCircle} tone='orange' />
        <StatCard label='Hoàn tiền' value={String(totals.refundCount)} icon={RefreshCw} tone='red' />
      </div>

      <Panel title='Danh sách giao dịch' description='Filter theo trạng thái, ngày. Bấm "Chi tiết" để xem webhook và refund.'>
        <div className='mb-3 grid gap-2 sm:grid-cols-[1fr_auto_auto_auto]'>
          <div className='relative'>
            <Search size={15} className='absolute left-3 top-1/2 -translate-y-1/2 text-slate-400' />
            <input
              className={`${inputClass} pl-10`}
              placeholder='Tìm mã, khách hàng, txn ref...'
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') load() }}
            />
          </div>
          <input type='date' className={inputClass} value={from} onChange={(e) => setFrom(e.target.value)} aria-label='Từ ngày' />
          <input type='date' className={inputClass} value={to} onChange={(e) => setTo(e.target.value)} aria-label='Đến ngày' />
          <ActionButton tone='secondary' onClick={load}>Áp dụng</ActionButton>
        </div>

        <div className='mb-2 flex flex-wrap items-center gap-2'>
          <span className='text-xs font-semibold uppercase text-slate-500'>Trạng thái:</span>
          <FilterChip active={!filter} onClick={() => setFilter('')}>Tất cả</FilterChip>
          {STATUS_OPTIONS.map((s) => <FilterChip key={s} active={filter === s} onClick={() => setFilter(s)}>{STATUS_LABELS[s]}</FilterChip>)}
        </div>
        <div className='mb-4 flex flex-wrap items-center gap-2'>
          <span className='text-xs font-semibold uppercase text-slate-500'>Loại:</span>
          <FilterChip active={!type} onClick={() => setType('')}>Tất cả</FilterChip>
          <FilterChip active={type === 'mua_goi'} onClick={() => setType('mua_goi')}>Mua gói</FilterChip>
          <FilterChip active={type === 'tu_van_le'} onClick={() => setType('tu_van_le')}>Tư vấn lẻ</FilterChip>
        </div>

        {loading ? (
          <LoadingSkeleton rows={6} />
        ) : rows.length === 0 ? (
          <EmptyState text='Không có giao dịch theo bộ lọc.' />
        ) : (
          <>
            <DataTable minWidth='1080px'>
              <thead>
                <tr>
                  <Th>Mã giao dịch</Th>
                  <Th>Khách hàng</Th>
                  <Th>Loại</Th>
                  <Th>Cổng</Th>
                  <Th>Số tiền</Th>
                  <Th>Trạng thái</Th>
                  <Th>Thanh toán</Th>
                  <Th className='text-right'>Hành động</Th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className='cursor-pointer hover:bg-blue-50/40' onClick={() => open(row)}>
                    <Td>
                      <b>{row.ma_giao_dich}</b>
                      <p className='font-mono text-xs text-slate-500'>{row.txn_ref}</p>
                    </Td>
                    <Td>
                      {row.customer_name}
                      <p className='text-xs text-slate-500'>{row.customer_email}</p>
                    </Td>
                    <Td>{PAYMENT_TYPE_LABELS[row.loai_thanh_toan] ?? row.loai_thanh_toan}</Td>
                    <Td className='font-mono text-xs uppercase'>{row.cong_thanh_toan}</Td>
                    <Td><b>{money(row.so_tien)}</b></Td>
                    <Td><StatusPill value={row.trang_thai} /></Td>
                    <Td className='text-xs text-slate-500'>
                      {row.thanh_toan_luc ? String(row.thanh_toan_luc).slice(0, 16).replace('T', ' ') : '—'}
                    </Td>
                    <Td className='text-right' onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                      <div className='flex justify-end gap-2'>
                        <ActionButton tone='secondary' onClick={() => open(row)}>Chi tiết</ActionButton>
                        {row.trang_thai === 'thanh_cong' && <ActionButton tone='danger' onClick={() => openRefund(row)}>Refund</ActionButton>}
                      </div>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </DataTable>

            <SummaryBar items={[
              { label: 'Tổng giá trị', value: money(totals.totalValue), tone: 'blue' },
              { label: 'Thành công', value: money(totals.successAmount), tone: 'green' },
              { label: 'Số giao dịch', value: String(totals.count), tone: 'slate' },
            ]} />
          </>
        )}
      </Panel>

      <Modal open={detailOpen} onClose={() => setDetailOpen(false)} title='Chi tiết giao dịch' description='Kiểm tra webhook và đối soát trước khi refund.' width='max-w-4xl'>
        {selected && (
          <div className='space-y-5'>
            <div className='grid gap-3 sm:grid-cols-2 xl:grid-cols-4'>
              <StatCard label='Số tiền' value={money(selected.so_tien)} tone='blue' />
              <StatCard label='Trạng thái' value={STATUS_LABELS[selected.trang_thai] ?? selected.trang_thai} tone={selected.trang_thai === 'thanh_cong' ? 'green' : 'orange'} />
              <StatCard label='Cổng' value={selected.cong_thanh_toan} tone='slate' />
              <StatCard label='Loại' value={PAYMENT_TYPE_LABELS[selected.loai_thanh_toan] ?? selected.loai_thanh_toan} tone='slate' />
            </div>

            <Panel title='Thông tin giao dịch'>
              <div className='grid gap-2 sm:grid-cols-2'>
                <InfoBlock label='Mã giao dịch' value={selected.ma_giao_dich} mono />
                <InfoBlock label='TXN Ref' value={selected.txn_ref} mono />
                <InfoBlock label='Khách hàng' value={`${selected.customer_name} · ${selected.customer_email ?? ''}`} />
                <InfoBlock label='Gateway TX' value={selected.gateway_transaction_no ?? '—'} mono />
                <InfoBlock label='Tạo lúc' value={String(selected.tao_luc).slice(0, 19).replace('T', ' ')} />
                {selected.thanh_toan_luc && <InfoBlock label='Thanh toán lúc' value={String(selected.thanh_toan_luc).slice(0, 19).replace('T', ' ')} />}
              </div>
            </Panel>

            <Panel title={`Webhook logs (${logs.length})`}>
              {logs.length === 0 ? (
                <EmptyState text='Chưa có webhook log.' />
              ) : (
                <div className='space-y-3'>
                  {logs.map((log) => (
                    <div key={log.id} className='rounded-xl border border-slate-200 bg-slate-50 p-3'>
                      <div className='mb-2 flex items-center justify-between'>
                        <span className='inline-flex items-center gap-2 text-xs font-semibold'>
                          <span className={`h-2 w-2 rounded-full ${log.hop_le ? 'bg-emerald-500' : 'bg-red-500'}`} />
                          {log.loai_webhook?.toUpperCase() ?? 'WEBHOOK'}
                          <span className={log.hop_le ? 'text-emerald-700' : 'text-red-700'}>
                            {log.hop_le ? 'Hợp lệ' : 'Sai chữ ký'}
                          </span>
                        </span>
                        <span className='text-xs text-slate-500'>
                          {String(log.tao_luc).slice(0, 19).replace('T', ' ')}
                        </span>
                      </div>
                      <JsonViewer data={log.payload} maxHeight={200} />
                    </div>
                  ))}
                </div>
              )}
            </Panel>

            <div className='flex justify-end gap-2'>
              <ActionButton tone='secondary' onClick={() => reconcile(selected)}>Đối soát lại</ActionButton>
              {selected.trang_thai === 'thanh_cong' && <ActionButton tone='danger' onClick={() => openRefund(selected)}>Refund</ActionButton>}
            </div>
          </div>
        )}
      </Modal>

      <Modal open={Boolean(refundTarget)} onClose={() => setRefundTarget(null)} title='Hoàn tiền giao dịch' description='Lý do sẽ được lưu vào audit log.'>
        {refundTarget && (
          <div className='space-y-4'>
            <div className='rounded-2xl bg-orange-50 border border-orange-100 p-4 text-sm'>
              <p className='font-semibold text-slate-950'>{refundTarget.ma_giao_dich}</p>
              <p className='mt-1 text-slate-600'>{refundTarget.customer_name} · {money(refundTarget.so_tien)}</p>
            </div>
            <Field label='Số tiền hoàn (VND)' error={errors.refundAmount}>
              <input type='number' className={inputClass} value={refundAmount} onChange={(e) => setRefundAmount(e.target.value)} />
            </Field>
            <Field label='Lý do hoàn tiền' error={errors.refundReason}>
              <textarea className={inputClass} rows={4} value={refundReason} onChange={(e) => setRefundReason(e.target.value)} placeholder='Ví dụ: Khách mua nhầm gói, hoàn theo chính sách...' />
            </Field>
            <div className='flex justify-end gap-2'>
              <ActionButton tone='secondary' onClick={() => setRefundTarget(null)}>Hủy</ActionButton>
              <ActionButton tone='danger' onClick={submitRefund}>Xác nhận refund</ActionButton>
            </div>
          </div>
        )}
      </Modal>
    </>
  )
}

function InfoBlock({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className='rounded-xl border border-slate-200 bg-white p-3'>
      <p className='text-xs font-semibold uppercase tracking-wide text-slate-500'>{label}</p>
      <p className={`mt-1 break-all text-sm font-semibold text-slate-900 ${mono ? 'font-mono' : ''}`}>{value}</p>
    </div>
  )
}
