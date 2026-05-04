'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { FormEvent, Suspense, useEffect, useMemo, useState } from 'react'
import { ActionButton, Field, Notice, PageHeader, Panel, StatCard, inputClass } from '@/components/admin/admin-ui'
import { customerGet, customerPostWithInit } from '@/lib/customer-api'

type Row = Record<string, any>

function BookingContent() {
  const params = useSearchParams()
  const packagePurchaseId = params.get('packagePurchaseId')
  const expertId = params.get('expertId')
  const [slots, setSlots] = useState<Row[]>([])
  const [startAt, setStartAt] = useState('')
  const [mucDich, setMucDich] = useState('')
  const [created, setCreated] = useState<Row | null>(null)
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [loadingSlots, setLoadingSlots] = useState(false)

  useEffect(() => {
    async function loadSlots() {
      if (!packagePurchaseId || !expertId) return
      setLoadingSlots(true)
      try {
        const data = await customerGet<Row>(`/experts/${expertId}/available-slots?packagePurchaseId=${packagePurchaseId}&days=14`)
        setSlots(data.slots ?? [])
        if ((data.slots ?? []).length) setStartAt(String(data.slots[0].start_at))
      } catch (error) {
        setMessage(error instanceof Error ? error.message : 'Không tải được slot trống')
      } finally {
        setLoadingSlots(false)
      }
    }
    loadSlots().catch(() => undefined)
  }, [packagePurchaseId, expertId])

  const idempotencyKey = useMemo(() => {
    if (!packagePurchaseId || !expertId || !startAt) return ''
    return `booking:${packagePurchaseId}:${expertId}:${startAt}`
  }, [packagePurchaseId, expertId, startAt])

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!packagePurchaseId || !expertId) return
    setSubmitting(true)
    try {
      const result = await customerPostWithInit<Row>(
        '/bookings',
        {
          package_purchase_id: Number(packagePurchaseId),
          expert_id: Number(expertId),
          start_at: startAt,
          muc_dich: mucDich,
          idempotency_key: idempotencyKey,
        },
        { headers: { 'x-idempotency-key': idempotencyKey } },
      )
      setCreated(result)
      setMessage('Booking đã được ghi nhận. Nếu bạn bấm nhiều lần, hệ thống sẽ trả lại cùng booking (idempotent).')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Tạo booking thất bại')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <PageHeader
        eyebrow='Customer workspace'
        title='04. Đặt lịch tư vấn'
        description='Tạo booking theo gói đã mua và chuyên gia đã chọn. API có idempotency-key để chống tạo trùng khi submit lặp.'
      />
      {message ? <Notice>{message}</Notice> : null}
      <div className='mb-5 grid gap-3 md:grid-cols-3'>
        <StatCard label='Gói đã chọn' value={packagePurchaseId ?? '-'} />
        <StatCard label='Chuyên gia đã chọn' value={expertId ?? '-'} />
        <StatCard label='Idempotency key' value={idempotencyKey || 'chưa có'} tone='slate' />
      </div>
      <Panel title='Form đặt lịch'>
        <form className='grid gap-4 md:grid-cols-2' onSubmit={submit}>
          <Field label='Khung giờ khả dụng' hint='Danh sách slot được tính từ lịch làm việc chuyên gia và lịch hẹn đã có.'>
            <select className={inputClass} value={startAt} onChange={(e) => setStartAt(e.target.value)} required disabled={loadingSlots || !slots.length}>
              {!slots.length ? <option value=''>{loadingSlots ? 'Đang tải slot...' : 'Không có slot trống'}</option> : null}
              {slots.map((slot) => (
                <option key={slot.start_at} value={slot.start_at}>
                  {slot.date} | {slot.start_time} - {slot.end_time}
                </option>
              ))}
            </select>
          </Field>
          <Field label='Mục đích tư vấn'>
            <input className={inputClass} value={mucDich} onChange={(e) => setMucDich(e.target.value)} placeholder='Ví dụ: giảm mỡ và cải thiện giấc ngủ' />
          </Field>
          <div className='md:col-span-2 flex justify-end'>
            <ActionButton type='submit' disabled={submitting || !startAt || !slots.length}>{submitting ? 'Đang tạo...' : 'Tạo booking'}</ActionButton>
          </div>
        </form>
      </Panel>
      {created?.booking?.id ? (
        <Panel title='Booking vừa tạo' description='Tiếp tục sang bước thanh toán để xác nhận lịch.'>
          <p className='text-sm text-slate-600'>Mã lịch: <b>{created.booking.ma_lich_hen}</b> - Trạng thái: <b>{created.booking.trang_thai}</b></p>
          <div className='mt-3'>
            <Link href={`/dashboard/payments?bookingId=${created.booking.id}`}><ActionButton>Đi tới 05. Thanh toán booking</ActionButton></Link>
          </div>
        </Panel>
      ) : null}
    </>
  )
}

export default function CustomerBookingPage() {
  return <Suspense><BookingContent /></Suspense>
}
