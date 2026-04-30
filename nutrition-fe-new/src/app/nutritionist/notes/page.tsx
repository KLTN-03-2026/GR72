'use client'

import { useEffect, useMemo, useState } from 'react'
import { ActionButton, EmptyState, Field, Notice, PageHeader, Panel, StatCard, Toolbar, inputClass } from '@/components/admin/admin-ui'
import { DataTable, Modal, Td, Th } from '@/components/admin/admin-table'
import { expertGet, expertPut } from '@/lib/expert-api'

type Row = Record<string, any>

export default function NotesPage() {
  const [bookings, setBookings] = useState<Row[]>([])
  const [selected, setSelected] = useState<Row | null>(null)
  const [note, setNote] = useState<Row>({})
  const [message, setMessage] = useState('')
  const [loadingId, setLoadingId] = useState<number | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  async function loadBookings() {
    setBookings(await expertGet<Row[]>('/bookings?status=hoan_thanh'))
  }

  useEffect(() => {
    loadBookings().catch((err) => setMessage(err.message))
  }, [])

  const stats = useMemo(() => ({
    total: bookings.length,
    withPurpose: bookings.filter((booking) => booking.muc_dich).length,
    latest: bookings[0]?.ngay_hen ? String(bookings[0].ngay_hen).slice(0, 10) : '-',
  }), [bookings])

  async function openNote(booking: Row) {
    setLoadingId(booking.id)
    try {
      setSelected(booking)
      setErrors({})
      setNote((await expertGet<Row | null>(`/bookings/${booking.id}/notes`)) ?? {})
    } finally {
      setLoadingId(null)
    }
  }

  async function save() {
    if (!selected) {
      setMessage('Vui lòng chọn booking trước khi lưu ghi chú.')
      return
    }
    if (!String(note.tom_tat_cho_customer ?? '').trim() && !String(note.khuyen_nghi_sau_tu_van ?? '').trim()) {
      setErrors({ note: 'Vui lòng nhập ít nhất tóm tắt hoặc khuyến nghị sau tư vấn.' })
      return
    }
    setSaving(true)
    try {
      await expertPut(`/bookings/${selected.id}/notes`, note)
      setMessage('Đã lưu ghi chú sau tư vấn.')
      setSelected(null)
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <PageHeader
        eyebrow='Consultation notes'
        title='Ghi chú sau tư vấn'
        description='Quản lý ghi chú theo từng booking hoàn thành. Danh sách nằm ở bảng, nội dung dài mở trong modal để màn không bị chia đôi và không vỡ khi nhiều dữ liệu.'
      />
      {message ? <Notice>{message}</Notice> : null}

      <div className='mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3'>
        <StatCard label='Booking hoàn thành' value={String(stats.total)} />
        <StatCard label='Có mục đích tư vấn' value={String(stats.withPurpose)} tone='green' />
        <StatCard label='Lịch mới nhất' value={stats.latest} tone='slate' />
      </div>

      <Panel title='Danh sách booking cần ghi chú' description='Mở form ghi chú từ cột hành động để lưu tóm tắt, khuyến nghị và ghi chú nội bộ.'>
        <Toolbar>
          <div className='text-sm font-medium text-slate-600 lg:flex-1'>Chỉ hiển thị booking đã hoàn thành để tránh ghi chú nhầm buổi chưa tư vấn.</div>
          <ActionButton tone='secondary' onClick={loadBookings}>Tải lại</ActionButton>
        </Toolbar>
        <DataTable minWidth='900px'>
          <thead>
            <tr>
              <Th>Mã booking</Th>
              <Th>Khách hàng</Th>
              <Th>Gói dịch vụ</Th>
              <Th>Ngày tư vấn</Th>
              <Th>Mục đích</Th>
              <Th className='text-right'>Hành động</Th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((row) => (
              <tr key={row.id} className='transition-colors duration-200 hover:bg-emerald-50/60'>
                <Td><b>{row.ma_lich_hen}</b></Td>
                <Td>{row.customer_name}<p className='text-xs text-slate-500'>{row.customer_email}</p></Td>
                <Td>{row.ten_goi}</Td>
                <Td>{String(row.ngay_hen).slice(0, 10)} {row.gio_bat_dau}</Td>
                <Td><p className='line-clamp-2 max-w-sm'>{row.muc_dich ?? '-'}</p></Td>
                <Td className='text-right'>
                  <ActionButton tone='secondary' disabled={loadingId === row.id} onClick={() => openNote(row)}>
                    {loadingId === row.id ? 'Đang mở...' : 'Ghi chú'}
                  </ActionButton>
                </Td>
              </tr>
            ))}
          </tbody>
        </DataTable>
        {!bookings.length ? <div className='mt-4'><EmptyState text='Chưa có booking hoàn thành.' /></div> : null}
      </Panel>

      <Modal
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={selected ? `Ghi chú: ${selected.ma_lich_hen}` : 'Ghi chú sau tư vấn'}
        description='Nội dung này giúp khách theo dõi sau tư vấn và giúp chuyên gia có lịch sử chăm sóc rõ ràng.'
        width='max-w-4xl'
      >
        {selected ? (
          <div className='space-y-5'>
            <div className='rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4 text-sm text-slate-700'>
              <b className='text-slate-950'>{selected.customer_name}</b>
              <p className='mt-1'>{selected.ten_goi} · {String(selected.ngay_hen).slice(0, 10)} {selected.gio_bat_dau}</p>
              <p className='mt-2 leading-6'>{selected.muc_dich ?? 'Khách chưa nhập mục đích tư vấn.'}</p>
            </div>
            <div className='grid gap-4 lg:grid-cols-2'>
              <Field label='Tóm tắt cho khách hàng' error={errors.note}>
                <textarea className={inputClass} rows={6} value={note.tom_tat_cho_customer ?? ''} onChange={(e) => { setNote({ ...note, tom_tat_cho_customer: e.target.value }); setErrors({}) }} />
              </Field>
              <Field label='Khuyến nghị sau tư vấn'>
                <textarea className={inputClass} rows={6} value={note.khuyen_nghi_sau_tu_van ?? ''} onChange={(e) => { setNote({ ...note, khuyen_nghi_sau_tu_van: e.target.value }); setErrors({}) }} />
              </Field>
            </div>
            <Field label='Ghi chú nội bộ'>
              <textarea className={inputClass} rows={4} value={note.ghi_chu_noi_bo ?? ''} onChange={(e) => setNote({ ...note, ghi_chu_noi_bo: e.target.value })} />
            </Field>
            <div className='flex justify-end gap-2'>
              <ActionButton tone='secondary' onClick={() => setSelected(null)}>Hủy</ActionButton>
              <ActionButton onClick={save} disabled={saving}>{saving ? 'Đang lưu...' : 'Lưu ghi chú'}</ActionButton>
            </div>
          </div>
        ) : null}
      </Modal>
    </>
  )
}
