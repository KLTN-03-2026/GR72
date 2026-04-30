'use client'

import { useEffect, useMemo, useState } from 'react'
import { ActionButton, EmptyState, Field, Notice, PageHeader, Panel, StatCard, StatusPill, Toolbar, inputClass, money } from '@/components/admin/admin-ui'
import { DataTable, Modal, Td, Th } from '@/components/admin/admin-table'
import { adminGet, adminPatch, adminPost } from '@/lib/admin-api'

type Payment = Record<string, any>

export default function PaymentsPage() {
  const [rows, setRows] = useState<Payment[]>([])
  const [selected, setSelected] = useState<Payment | null>(null)
  const [refundTarget, setRefundTarget] = useState<Payment | null>(null)
  const [logs, setLogs] = useState<Payment[]>([])
  const [message, setMessage] = useState('')
  const [filter, setFilter] = useState('')
  const [type, setType] = useState('')
  const [query, setQuery] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [refundReason, setRefundReason] = useState('')
  const [refundAmount, setRefundAmount] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
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
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load().catch((err) => setMessage(err.message)) }, [filter, type])

  const totals = useMemo(() => ({
    value: rows.reduce((sum, row) => sum + Number(row.so_tien ?? 0), 0),
    success: rows.filter((row) => row.trang_thai === 'thanh_cong').length,
    refund: rows.filter((row) => row.trang_thai === 'hoan_tien').length,
  }), [rows])

  async function open(payment: Payment) {
    setSelected(await adminGet<Payment>(`/payments/${payment.id}`))
    setLogs(await adminGet<Payment[]>(`/payments/${payment.id}/webhook-logs`))
    setDetailOpen(true)
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
    if (!refundReason.trim()) nextErrors.refundReason = 'Vui lòng nhập lý do hoàn tiền để lưu audit.'
    if (!amount || amount <= 0) nextErrors.refundAmount = 'Số tiền hoàn phải lớn hơn 0.'
    if (amount > Number(refundTarget.so_tien)) nextErrors.refundAmount = 'Số tiền hoàn không được vượt quá số tiền giao dịch.'
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors)
      return
    }
    await adminPost(`/payments/${refundTarget.id}/refund`, { ly_do: refundReason, so_tien: amount })
    setMessage('Đã hoàn tiền giao dịch và cập nhật nghiệp vụ liên quan.')
    setRefundTarget(null)
    setDetailOpen(false)
    await load()
  }

  async function reconcile(payment: Payment) {
    await adminPatch(`/payments/${payment.id}/reconcile`)
    setMessage('Đã đối soát giao dịch với webhook hợp lệ.')
    await open(payment)
    await load()
  }

  return (
    <>
      <PageHeader eyebrow='Payment control' title='Quản lý thanh toán' description='Danh sách giao dịch dạng bảng để dễ lọc, đối soát, xem webhook và refund qua modal chi tiết.' />
      {message ? <Notice>{message}</Notice> : null}
      <div className='mb-5 grid gap-4 md:grid-cols-3'><StatCard label='Tổng giá trị danh sách' value={money(totals.value)} /><StatCard label='Thành công' value={String(totals.success)} tone='green' /><StatCard label='Hoàn tiền' value={String(totals.refund)} tone='red' /></div>
      <Panel title='Danh sách giao dịch' description='Dữ liệu nhiều vẫn giữ ổn định nhờ bảng có scroll ngang và action theo từng dòng.'>
        <Toolbar>
          <input className={inputClass} placeholder='Tìm mã giao dịch, khách hàng, txn ref' value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') load() }} />
          <select className={inputClass} value={filter} onChange={(e) => setFilter(e.target.value)}><option value=''>Tất cả trạng thái</option>{['khoi_tao','cho_thanh_toan','thanh_cong','that_bai','het_han','hoan_tien'].map((item) => <option key={item} value={item}>{item}</option>)}</select>
          <select className={inputClass} value={type} onChange={(e) => setType(e.target.value)}><option value=''>Tất cả loại thanh toán</option><option value='mua_goi'>Mua gói</option><option value='tu_van_le'>Tư vấn lẻ</option></select>
          <input type='date' className={inputClass} value={from} onChange={(e) => setFrom(e.target.value)} aria-label='Từ ngày' />
          <input type='date' className={inputClass} value={to} onChange={(e) => setTo(e.target.value)} aria-label='Đến ngày' />
          <ActionButton tone='secondary' onClick={load}>Lọc</ActionButton>
        </Toolbar>
        <DataTable minWidth='1080px'><thead><tr><Th>Mã giao dịch</Th><Th>Khách hàng</Th><Th>Loại</Th><Th>Cổng</Th><Th>Số tiền</Th><Th>Trạng thái</Th><Th>Thanh toán lúc</Th><Th className='text-right'>Hành động</Th></tr></thead><tbody>{rows.map((row) => <tr key={row.id} className='hover:bg-blue-50/40'><Td><b>{row.ma_giao_dich}</b><p className='font-mono text-xs text-slate-500'>{row.txn_ref}</p></Td><Td>{row.customer_name}<p className='text-xs text-slate-500'>{row.customer_email}</p></Td><Td>{row.loai_thanh_toan}</Td><Td>{row.cong_thanh_toan}</Td><Td><b>{money(row.so_tien)}</b></Td><Td><StatusPill value={row.trang_thai} /></Td><Td>{row.thanh_toan_luc ? String(row.thanh_toan_luc).slice(0, 16) : '-'}</Td><Td className='text-right'><div className='flex justify-end gap-2'><ActionButton tone='secondary' onClick={() => open(row)}>Chi tiết</ActionButton><ActionButton tone='secondary' onClick={() => reconcile(row)}>Đối soát</ActionButton>{row.trang_thai === 'thanh_cong' ? <ActionButton tone='danger' onClick={() => openRefund(row)}>Refund</ActionButton> : null}</div></Td></tr>)}</tbody></DataTable>
        {!rows.length && !loading ? <div className='mt-4'><EmptyState text='Không có giao dịch theo bộ lọc hiện tại.' /></div> : null}
      </Panel>
      <Modal open={detailOpen} onClose={() => setDetailOpen(false)} title='Chi tiết giao dịch' description='Kiểm tra thông tin gateway và webhook trước khi refund hoặc đối soát.' width='max-w-5xl'>
        {selected ? <div className='space-y-5'><div className='grid gap-3 md:grid-cols-4'><StatCard label='Số tiền' value={money(selected.so_tien)} /><StatCard label='Trạng thái' value={selected.trang_thai} tone={selected.trang_thai === 'thanh_cong' ? 'green' : 'orange'} /><StatCard label='Cổng' value={selected.cong_thanh_toan} tone='slate' /><StatCard label='Loại' value={selected.loai_thanh_toan} tone='slate' /></div><Panel title='Thông tin giao dịch'><DataTable minWidth='720px'><tbody><tr><Td>Mã giao dịch</Td><Td><b>{selected.ma_giao_dich}</b></Td></tr><tr><Td>Txn ref</Td><Td>{selected.txn_ref}</Td></tr><tr><Td>Khách hàng</Td><Td>{selected.customer_name} · {selected.customer_email}</Td></tr><tr><Td>Gateway transaction</Td><Td>{selected.gateway_transaction_no ?? '-'}</Td></tr></tbody></DataTable></Panel><Panel title='Webhook logs'>{logs.length ? logs.map((log) => <pre key={log.id} className='mb-3 max-h-56 overflow-auto rounded-xl bg-slate-950 p-3 text-xs text-white'>{JSON.stringify(log.payload, null, 2)}</pre>) : <EmptyState text='Chưa có webhook log.' />}</Panel><div className='flex justify-end gap-2'><ActionButton tone='secondary' onClick={() => reconcile(selected)}>Đối soát lại</ActionButton>{selected.trang_thai === 'thanh_cong' ? <ActionButton tone='danger' onClick={() => openRefund(selected)}>Refund</ActionButton> : null}</div></div> : null}
      </Modal>
      <Modal open={Boolean(refundTarget)} onClose={() => setRefundTarget(null)} title='Hoàn tiền giao dịch' description='Refund cần lý do và số tiền hợp lệ để tránh lệch đối soát.'>
        {refundTarget ? <div className='space-y-4'><div className='rounded-2xl bg-slate-50 p-4 text-sm'><p className='font-semibold text-slate-950'>{refundTarget.ma_giao_dich}</p><p className='mt-1 text-slate-500'>{refundTarget.customer_name} · {money(refundTarget.so_tien)}</p></div><Field label='Số tiền hoàn' error={errors.refundAmount}><input type='number' className={inputClass} value={refundAmount} onChange={(e) => setRefundAmount(e.target.value)} /></Field><Field label='Lý do hoàn tiền' error={errors.refundReason}><textarea className={inputClass} rows={4} value={refundReason} onChange={(e) => setRefundReason(e.target.value)} placeholder='Ví dụ: Khách mua nhầm gói hoặc giao dịch cần hoàn theo chính sách' /></Field><div className='flex justify-end gap-2'><ActionButton tone='secondary' onClick={() => setRefundTarget(null)}>Hủy</ActionButton><ActionButton tone='danger' onClick={submitRefund}>Xác nhận refund</ActionButton></div></div> : null}
      </Modal>
    </>
  )
}
